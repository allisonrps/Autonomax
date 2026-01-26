using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Data;
using Autonomax.Models;

namespace Autonomax.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransacoesController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransacoesController(AppDbContext context)
    {
        _context = context;
    }

    // POST: api/Transacoes (Registrar Entrada ou Saída)
    [HttpPost]
    public async Task<ActionResult<Transacao>> PostTransacao(Transacao transacao)
    {
        // Define a data atual caso venha vazia
        if (transacao.Data == DateTime.MinValue)
            transacao.Data = DateTime.Now;

        _context.Transacoes.Add(transacao);
        await _context.SaveChangesAsync();

        return Ok(transacao);
    }

    // GET: api/Transacoes/resumo/1 (Total de entradas e saídas do negócio ID 1)
    [HttpGet("resumo/{negocioId}")]
    public async Task<IActionResult> GetResumo(int negocioId)
    {
        var transacoes = await _context.Transacoes
            .Where(t => t.NegocioId == negocioId)
            .ToListAsync();

        var totalEntrada = transacoes.Where(t => t.Tipo == "Entrada").Sum(t => t.Valor);
        var totalSaida = transacoes.Where(t => t.Tipo == "Saida").Sum(t => t.Valor);

        return Ok(new
        {
            Entradas = totalEntrada,
            Saidas = totalSaida,
            Saldo = totalEntrada - totalSaida
        });
    }


    // GET: api/Transacoes/mensal?negocioId=1&mes=1&ano=2026
    [HttpGet("mensal")]
    public async Task<IActionResult> GetMensal(int negocioId, int mes, int ano)
    {
        var transacoes = await _context.Transacoes
            .Where(t => t.NegocioId == negocioId &&
                        t.Data.Month == mes &&
                        t.Data.Year == ano)
            .OrderBy(t => t.Data)
            .ToListAsync();

        var totais = new
        {
            TotalEntrada = transacoes.Where(t => t.Tipo == "Entrada").Sum(t => t.Valor),
            TotalSaida = transacoes.Where(t => t.Tipo == "Saida").Sum(t => t.Valor),
            SaldoMes = transacoes.Where(t => t.Tipo == "Entrada").Sum(t => t.Valor) -
                       transacoes.Where(t => t.Tipo == "Saida").Sum(t => t.Valor),
            Itens = transacoes
        };

        return Ok(totais);
    }


}