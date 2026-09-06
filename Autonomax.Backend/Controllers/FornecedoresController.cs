using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace Autonomax.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FornecedoresController : ControllerBase
{
    private readonly AppDbContext _context;

    public FornecedoresController(AppDbContext context) => _context = context;

    [HttpGet("por-negocio/{negocioId}")]
    public async Task<IActionResult> GetFornecedores(int negocioId)
    {
        try
        {
            var fornecedoresComTransacoes = await _context.Fornecedores
                .Include(f => f.Transacoes)
                .Where(f => f.NegocioId == negocioId)
                .ToListAsync();

            var resultado = fornecedoresComTransacoes.Select(f => new
            {
                f.Id,
                f.Nome,
                f.Telefone,
                f.Categoria,
                f.Observacoes,
                f.NegocioId,
                f.DataCriacao,

                // Soma total gasto (saídas vinculadas a este parceiro)
                TotalGasto = f.Transacoes
                    .Where(t => t.Tipo == "Saida" || t.Tipo == "Saída")
                    .Sum(t => t.Valor),

                // Quantidade total de lançamentos
                QtdLancamentos = f.Transacoes.Count,

                // Pega a data da última transação (se existir)
                UltimaMovimentacao = f.Transacoes
                    .OrderByDescending(t => t.Data)
                    .Select(t => t.Data.ToString("yyyy-MM-ddTHH:mm:ss"))
                    .FirstOrDefault()
            })
            .OrderBy(f => f.Nome)
            .ToList();

            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Erro interno: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Fornecedor>> GetFornecedor(int id)
    {
        var fornecedor = await _context.Fornecedores.FindAsync(id);
        return fornecedor == null ? NotFound() : fornecedor;
    }

    [HttpPost]
    public async Task<ActionResult<Fornecedor>> PostFornecedor(Fornecedor fornecedor)
    {
        _context.Fornecedores.Add(fornecedor);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetFornecedor), new { id = fornecedor.Id }, fornecedor);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutFornecedor(int id, Fornecedor fornecedor)
    {
        if (id != fornecedor.Id) return BadRequest();
        _context.Entry(fornecedor).State = EntityState.Modified;
        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException) {
            if (!_context.Fornecedores.Any(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFornecedor(int id)
    {
        var fornecedor = await _context.Fornecedores.FindAsync(id);
        if (fornecedor == null) return NotFound();
        _context.Fornecedores.Remove(fornecedor);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("por-fornecedor/{fornecedorId}")]
    public async Task<ActionResult> GetPorFornecedor(int fornecedorId, [FromQuery] int negocioId)
    {
        // 1. Busca os dados do fornecedor 
        var fornecedor = await _context.Fornecedores
            .FirstOrDefaultAsync(f => f.Id == fornecedorId && f.NegocioId == negocioId);

        if (fornecedor == null) return NotFound("Parceiro não encontrado.");

        // 2. Busca as transações vinculadas a este fornecedor com os itens
        var transacoes = await _context.Transacoes
            .Include(t => t.Itens)
            .Where(t => t.FornecedorId == fornecedorId && t.NegocioId == negocioId)
            .OrderByDescending(t => t.Data)
            .ToListAsync();

        return Ok(new
        {
            fornecedor,
            transacoes
        });
    }


}