using Autonomax.Backend.Controllers;
using Autonomax.Backend.Data;
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
}
