using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Data;
using Autonomax.Models;

namespace Autonomax.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Dashboard/5
    [HttpGet("{negocioId}")]
    public async Task<IActionResult> GetDashboard(int negocioId)
    {
        // 1. Busca todas as transações do negócio específico
        var transacoes = await _context.Transacoes
            .Where(t => t.NegocioId == negocioId)
            .ToListAsync();

        if (transacoes == null) return NotFound("Nenhum dado encontrado para este negócio.");

        // 2. Cálculos de Totais Gerais
        var totalEntradas = transacoes.Where(t => t.Tipo == "Entrada").Sum(t => t.Valor);
        var totalSaidas = transacoes.Where(t => t.Tipo == "Saida").Sum(t => t.Valor);
        var saldoGeral = totalEntradas - totalSaidas;

        // 3. Ranking de Clientes (Top 5 que mais geraram receita)
        // Agrupamos por ClienteId, somamos os valores e ordenamos do maior para o menor
        var rankingClientes = await _context.Transacoes
            .Where(t => t.NegocioId == negocioId && t.Tipo == "Entrada" && t.ClienteId != null)
            .GroupBy(t => t.ClienteId)
            .Select(grupo => new
            {
                ClienteId = grupo.Key,
                // Buscamos o nome do cliente dentro do banco
                NomeCliente = _context.Clientes
                    .Where(c => c.Id == grupo.Key)
                    .Select(c => c.Nome)
                    .FirstOrDefault() ?? "Cliente Removido",
                TotalInvestido = grupo.Sum(t => t.Valor),
                QuantidadeServicos = grupo.Count()
            })
            .OrderByDescending(x => x.TotalInvestido)
            .Take(5)
            .ToListAsync();

        // 4. Resumo por Mês (Últimos 6 meses para um gráfico de linha, por exemplo)
        var resumoMensal = transacoes
            .GroupBy(t => new { t.Data.Year, t.Data.Month })
            .Select(g => new
            {
                MesAno = $"{g.Key.Month:D2}/{g.Key.Year}",
                Entradas = g.Where(x => x.Tipo == "Entrada").Sum(x => x.Valor),
                Saidas = g.Where(x => x.Tipo == "Saida").Sum(x => x.Valor)
            })
            .OrderByDescending(x => x.MesAno)
            .Take(6)
            .ToList();

        // 5. Retorno do objeto consolidado para o Frontend
        return Ok(new
        {
            ResumoGeral = new
            {
                Entradas = totalEntradas,
                Saidas = totalSaidas,
                Saldo = saldoGeral
            },
            Ranking = rankingClientes,
            HistoricoMensal = resumoMensal
        });
    }
}