using Autonomax.Backend.Controllers;
using Autonomax.Backend.Data;
using Autonomax.Backend.DTOs;
using Autonomax.Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Autonomax.Backend.Tests;

public class ProdutosServicosTests
{
    private AppDbContext GetDatabase()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task SincronizarItens_DeveAdicionarItensDeVenda_ENaoAdicionarItensDeDespesa()
    {
        var db = GetDatabase();
        int negocioId = 1;

        // Venda (Entrada)
        db.Transacoes.Add(new Transacao
        {
            NegocioId = negocioId,
            Descricao = "2x Cartaz G, 1x Adesivo Vinil",
            Valor = 100m,
            Tipo = "Entrada"
        });

        // Despesa (Saida)
        db.Transacoes.Add(new Transacao
        {
            NegocioId = negocioId,
            Descricao = "Conta de Luz, Compra de Tinta",
            Valor = 80m,
            Tipo = "Saida"
        });

        await db.SaveChangesAsync();

        // Executa sincronização
        await ProdutosServicosController.SincronizarItensDoHistoricoInternoAsync(db, negocioId);

        var itensCadastrados = await db.ProdutosServicos
            .Where(p => p.NegocioId == negocioId)
            .ToListAsync();

        // Deve conter os itens de venda
        Assert.Contains(itensCadastrados, p => p.Nome.Equals("Cartaz G", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(itensCadastrados, p => p.Nome.Equals("Adesivo Vinil", StringComparison.OrdinalIgnoreCase));

        // NÃO deve conter os itens de despesa
        Assert.DoesNotContain(itensCadastrados, p => p.Nome.Equals("Conta de Luz", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(itensCadastrados, p => p.Nome.Equals("Compra de Tinta", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task SincronizarItens_DeveLimparItensImportadosQueSaoApenasDespesas()
    {
        var db = GetDatabase();
        int negocioId = 2;

        // Item de despesa previamente importado
        db.ProdutosServicos.Add(new ProdutoServico
        {
            NegocioId = negocioId,
            Nome = "Aluguel Sala",
            Preco = 0,
            Descricao = "Importado do fluxo de caixa"
        });

        // Transação de Saída com o item
        db.Transacoes.Add(new Transacao
        {
            NegocioId = negocioId,
            Descricao = "Aluguel Sala",
            Valor = 1200m,
            Tipo = "Saida"
        });

        // Transação de Venda com outro item
        db.Transacoes.Add(new Transacao
        {
            NegocioId = negocioId,
            Descricao = "1x Banner Lona",
            Valor = 150m,
            Tipo = "Entrada"
        });

        await db.SaveChangesAsync();

        // Executa sincronização
        await ProdutosServicosController.SincronizarItensDoHistoricoInternoAsync(db, negocioId);

        var itensCadastrados = await db.ProdutosServicos
            .Where(p => p.NegocioId == negocioId)
            .ToListAsync();

        // Deve conter o item vendido
        Assert.Contains(itensCadastrados, p => p.Nome.Equals("Banner Lona", StringComparison.OrdinalIgnoreCase));

        // Deve ter removido o item que pertencia exclusivamente a despesas
        Assert.DoesNotContain(itensCadastrados, p => p.Nome.Equals("Aluguel Sala", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GetDetalhes_DeveCalcularFaturamentoIndividualEOrdenarPorDataDecrescente()
    {
        var db = GetDatabase();
        int negocioId = 3;

        var produto = new ProdutoServico
        {
            NegocioId = negocioId,
            Nome = "Cartaz M",
            Preco = 25m,
            EhServico = false
        };
        db.ProdutosServicos.Add(produto);
        await db.SaveChangesAsync();

        // Transação antiga (venda com múltiplos itens, total R$ 500)
        db.Transacoes.Add(new Transacao
        {
            NegocioId = negocioId,
            Descricao = "2x Cartaz M, 1x Letreiro Neon",
            Valor = 500m,
            Tipo = "Entrada",
            Data = new DateTime(2026, 1, 10)
        });

        // Transação mais recente (venda avulsa, 3x Cartaz M, total R$ 75)
        db.Transacoes.Add(new Transacao
        {
            NegocioId = negocioId,
            Descricao = "3x Cartaz M",
            Valor = 75m,
            Tipo = "Entrada",
            Data = new DateTime(2026, 5, 20)
        });

        await db.SaveChangesAsync();

        var controller = new ProdutosServicosController(db);
        var result = await controller.GetDetalhes(produto.Id, negocioId, 2026) as OkObjectResult;

        Assert.NotNull(result);
        var jsonStr = System.Text.Json.JsonSerializer.Serialize(result.Value);
        using var doc = System.Text.Json.JsonDocument.Parse(jsonStr);
        var root = doc.RootElement;

        // Quantidade total vendida = 2 + 3 = 5
        Assert.Equal(5, root.GetProperty("quantidadeTotal").GetInt32());

        // Faturamento individual = 5 * 25m = 125m (e NÃO a soma de 500 + 75 = 575)
        Assert.Equal(125m, root.GetProperty("totalFaturado").GetDecimal());

        // Primeira transação retornada deve ser a mais recente (20/05/2026)
        var transacoes = root.GetProperty("transacoes");
        Assert.Equal(2, transacoes.GetArrayLength());
        var primeiraData = transacoes[0].GetProperty("data").GetString();
        Assert.StartsWith("2026-05-20", primeiraData);
    }

    [Fact]
    public async Task AlterarPrecoProduto_DeveRegistrarHistoricoDeAlteracao()
    {
        var db = GetDatabase();
        int negocioId = 4;
        var controller = new ProdutosServicosController(db);

        // 1. Cadastra novo item com preço inicial R$ 50
        var createResult = await controller.Post(new ProdutoServicoCreateDto
        {
            Nome = "Banner Frontlight",
            Preco = 50m,
            EhServico = false,
            NegocioId = negocioId
        });

        var createdOk = Assert.IsType<OkObjectResult>(createResult.Result);
        var itemCriado = Assert.IsType<ProdutoServico>(createdOk.Value);

        // Verifica se registrou preço inicial
        var historicoInicial = await db.HistoricoPrecosProdutos
            .Where(h => h.ProdutoServicoId == itemCriado.Id)
            .ToListAsync();
        Assert.Single(historicoInicial);
        Assert.Equal(0m, historicoInicial[0].PrecoAntigo);
        Assert.Equal(50m, historicoInicial[0].PrecoNovo);

        // 2. Altera o preço para R$ 65
        await controller.Put(itemCriado.Id, new ProdutoServicoUpdateDto
        {
            Nome = "Banner Frontlight",
            Preco = 65m,
            EhServico = false
        });

        // 3. Consulta detalhes para verificar se histórico vem populado
        var detalhesResult = await controller.GetDetalhes(itemCriado.Id, negocioId, 2026) as OkObjectResult;
        Assert.NotNull(detalhesResult);

        var jsonStr = System.Text.Json.JsonSerializer.Serialize(detalhesResult.Value);
        using var doc = System.Text.Json.JsonDocument.Parse(jsonStr);
        var historico = doc.RootElement.GetProperty("historicoPrecos");

        Assert.Equal(2, historico.GetArrayLength());
        // Mais recente deve ser a alteração de 50 para 65
        Assert.Equal(50m, historico[0].GetProperty("precoAntigo").GetDecimal());
        Assert.Equal(65m, historico[0].GetProperty("precoNovo").GetDecimal());
    }

    [Fact]
    public async Task GetDetalhes_DeveExtrairQuantidadesComPrecisaoDePrefixosSufixosEItens()
    {
        var db = GetDatabase();
        int negocioId = 5;

        var produto = new ProdutoServico
        {
            NegocioId = negocioId,
            Nome = "Adesivo Vinil",
            Preco = 10m,
            EhServico = false
        };
        db.ProdutosServicos.Add(produto);
        await db.SaveChangesAsync();

        // Venda 1: Sufixo "Adesivo Vinil 3x"
        db.Transacoes.Add(new Transacao
        {
            NegocioId = negocioId,
            Descricao = "Adesivo Vinil 3x",
            Valor = 30m,
            Tipo = "Entrada",
            Data = DateTime.Now
        });

        // Venda 2: Prefixo "4x Adesivo Vinil"
        db.Transacoes.Add(new Transacao
        {
            NegocioId = negocioId,
            Descricao = "4x Adesivo Vinil, 1x Banner",
            Valor = 80m,
            Tipo = "Entrada",
            Data = DateTime.Now
        });

        // Venda 3: Sufixo parenteses "Adesivo Vinil (5 un)"
        db.Transacoes.Add(new Transacao
        {
            NegocioId = negocioId,
            Descricao = "Adesivo Vinil (5 un)",
            Valor = 50m,
            Tipo = "Entrada",
            Data = DateTime.Now
        });

        // Venda 4: Tabela Itens com nome contendo prefixo e quantidade 0
        var t4 = new Transacao
        {
            NegocioId = negocioId,
            Descricao = "Venda balcão",
            Valor = 20m,
            Tipo = "Entrada",
            Data = DateTime.Now
        };
        t4.Itens.Add(new ItemTransacao { Nome = "2x Adesivo Vinil", Quantidade = 0 });
        db.Transacoes.Add(t4);

        await db.SaveChangesAsync();

        var controller = new ProdutosServicosController(db);
        var result = await controller.GetDetalhes(produto.Id, negocioId, DateTime.Now.Year) as OkObjectResult;

        Assert.NotNull(result);
        var jsonStr = System.Text.Json.JsonSerializer.Serialize(result.Value);
        using var doc = System.Text.Json.JsonDocument.Parse(jsonStr);
        var root = doc.RootElement;

        // Total quantidade = 3 + 4 + 5 + 2 = 14
        Assert.Equal(14, root.GetProperty("quantidadeTotal").GetInt32());

        // Total faturado individual = 14 * 10m = 140m
        Assert.Equal(140m, root.GetProperty("totalFaturado").GetDecimal());

        var transacoes = root.GetProperty("transacoes");
        Assert.Equal(4, transacoes.GetArrayLength());

        // Cada transação vinculada deve ter quantidadeItem maior que zero correspondente
        foreach (var t in transacoes.EnumerateArray())
        {
            var qtd = t.GetProperty("quantidadeItem").GetInt32();
            Assert.True(qtd > 0, $"Quantidade não pode ser 0 ou negativa: {qtd}");
        }
    }

    [Fact]
    public async Task NormalizarItensTransacoes_DeveCorrigirMultiplosItensEQuantidadesCorretamente()
    {
        var db = GetDatabase();
        int negocioId = 6;

        var tMulti = new Transacao
        {
            NegocioId = negocioId,
            Descricao = "2x Cartaz Duplo, 3x Adesivo Vinil",
            Valor = 120m,
            Tipo = "Entrada",
            Data = new DateTime(2026, 7, 20)
        };
        tMulti.Itens.Add(new ItemTransacao { Nome = "Cartaz Duplo", Quantidade = 0 });
        tMulti.Itens.Add(new ItemTransacao { Nome = "Adesivo Vinil", Quantidade = 1 });
        db.Transacoes.Add(tMulti);
        await db.SaveChangesAsync();

        var transacoes = await db.Transacoes.Include(t => t.Itens).ToListAsync();
        TransacoesController.NormalizarItensTransacoes(transacoes);

        var itens = transacoes[0].Itens;
        Assert.Equal(2, itens.Count);

        // Item 1 deve ter quantidade 2
        Assert.Equal("Cartaz Duplo", itens[0].Nome);
        Assert.Equal(2, itens[0].Quantidade);

        // Item 2 deve ter quantidade 3
        Assert.Equal("Adesivo Vinil", itens[1].Nome);
        Assert.Equal(3, itens[1].Quantidade);
    }

    [Fact]
    public async Task GetTransacoesPorPeriodo_DeveRetornarTransacoesComItensNormalizados()
    {
        var db = GetDatabase();
        int negocioId = 7;

        var transacao = new Transacao
        {
            NegocioId = negocioId,
            Descricao = "2X CARTAZ DUPLO",
            Valor = 82m,
            Tipo = "Entrada",
            Data = new DateTime(2026, 7, 20)
        };
        transacao.Itens.Add(new ItemTransacao { Nome = "1x CARTAZ DUPLO", Quantidade = 1 });
        db.Transacoes.Add(transacao);
        await db.SaveChangesAsync();

        var controller = new TransacoesController(db);
        var result = await controller.GetTransacoesPorPeriodo(negocioId, 7, 2026);

        var lista = result.Value as List<Transacao>;
        Assert.NotNull(lista);
        Assert.Single(lista);
        Assert.Equal(2, lista[0].Itens[0].Quantidade);
        Assert.Equal("CARTAZ DUPLO", lista[0].Itens[0].Nome);
    }

    [Fact]
    public async Task GetDetalhes_DeveIdentificarQuantidadeCorreta_QuandoDescricaoPossuiMultiplosItens()
    {
        var db = GetDatabase();
        int negocioId = 8;

        var produto = new ProdutoServico
        {
            Nome = "Pluma Colchoes",
            Preco = 50m,
            NegocioId = negocioId
        };
        db.ProdutosServicos.Add(produto);
        await db.SaveChangesAsync();

        var transacao = new Transacao
        {
            NegocioId = negocioId,
            Descricao = "2x Pluma Colchoes, 1x Banner",
            Valor = 150m,
            Tipo = "Entrada",
            Data = new DateTime(2026, 8, 15)
        };
        transacao.Itens.Add(new ItemTransacao { Nome = "Pluma Colchoes", Quantidade = 1 });
        transacao.Itens.Add(new ItemTransacao { Nome = "Banner", Quantidade = 1 });
        db.Transacoes.Add(transacao);
        await db.SaveChangesAsync();

        var controller = new ProdutosServicosController(db);
        var result = await controller.GetDetalhes(produto.Id, negocioId, 2026) as Microsoft.AspNetCore.Mvc.OkObjectResult;

        Assert.NotNull(result);
        var json = System.Text.Json.JsonSerializer.Serialize(result.Value);
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        var root = doc.RootElement;
        Assert.Equal(2, root.GetProperty("quantidadeTotal").GetInt32());
        Assert.Equal(100m, root.GetProperty("totalFaturado").GetDecimal());
    }
}
