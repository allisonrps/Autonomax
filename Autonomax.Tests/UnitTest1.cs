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
}
