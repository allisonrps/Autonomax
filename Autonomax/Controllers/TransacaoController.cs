using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Data;
using Autonomax.Models;
using Autonomax.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace Autonomax.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransacoesController : ControllerBase
{
    private readonly AppDbContext _context;

    public TransacoesController(AppDbContext context)
    {
        _context = context;
    }

    // 1. REGISTRAR uma nova transação (Venda ou Despesa)
    [HttpPost]
public async Task<ActionResult<Transacao>> PostTransacao([FromBody] TransacaoCreateDto dto)
{
    // Criamos o objeto do Banco (Model) a partir dos dados do DTO
    var transacao = new Transacao
    {
        Descricao = dto.Descricao,
        Valor = dto.Valor,
        Tipo = dto.Tipo,
        NegocioId = dto.NegocioId,
        ClienteId = dto.ClienteId,
        Data = DateTime.Now // Definimos a data automaticamente no servidor
    };

    _context.Transacoes.Add(transacao);
    await _context.SaveChangesAsync();

    return Ok(new { message = "Transação registrada com sucesso!", id = transacao.Id });
}

    // 2. LISTAR histórico mensal para "Tela Mês a Mês"
    [HttpGet("mensal")]
    public async Task<IActionResult> GetMensal(int negocioId, int mes, int ano)
    {
        var transacoes = await _context.Transacoes
            .Where(t => t.NegocioId == negocioId && 
                        t.Data.Month == mes && 
                        t.Data.Year == ano)
            .OrderByDescending(t => t.Data) // Mais recentes primeiro
            .ToListAsync();

        var resumo = new {
            Entradas = transacoes.Where(t => t.Tipo == "Entrada").Sum(t => t.Valor),
            Saidas = transacoes.Where(t => t.Tipo == "Saida").Sum(t => t.Valor),
            Saldo = transacoes.Where(t => t.Tipo == "Entrada").Sum(t => t.Valor) - 
                    transacoes.Where(t => t.Tipo == "Saida").Sum(t => t.Valor),
            Lista = transacoes
        };

        return Ok(resumo);
    }

    // 3. DELETAR uma transação (caso o usuário erre o valor)
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransacao(int id)
    {
        var transacao = await _context.Transacoes.FindAsync(id);
        if (transacao == null) return NotFound();

        _context.Transacoes.Remove(transacao);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}