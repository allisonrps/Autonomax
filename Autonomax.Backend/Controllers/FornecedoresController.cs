using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Autonomax.Backend.Security;

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
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(negocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado a este negócio." });
        }

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

                TotalGasto = f.Transacoes != null 
                    ? f.Transacoes.Where(t => t.Tipo == "Saida" || t.Tipo == "Saída").Sum(t => t.Valor) 
                    : 0,

                QtdLancamentos = f.Transacoes != null ? f.Transacoes.Count : 0,

                UltimaMovimentacao = f.Transacoes != null
                    ? f.Transacoes
                        .OrderByDescending(t => t.Data)
                        .Select(t => t.Data.ToString("yyyy-MM-ddTHH:mm:ss"))
                        .FirstOrDefault()
                    : null
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
        var usuarioId = this.ObterUsuarioIdAutenticado();
        var fornecedor = await _context.Fornecedores.FindAsync(id);
        if (fornecedor == null) return NotFound();

        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(fornecedor.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado aos dados deste parceiro." });
        }

        return Ok(fornecedor);
    }

    [HttpPost]
    public async Task<ActionResult<Fornecedor>> PostFornecedor(Fornecedor fornecedor)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(fornecedor.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Sem permissão para cadastrar parceiro neste negócio." });
        }

        _context.Fornecedores.Add(fornecedor);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetFornecedor), new { id = fornecedor.Id }, fornecedor);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutFornecedor(int id, Fornecedor fornecedor)
    {
        if (id != fornecedor.Id) return BadRequest();

        var usuarioId = this.ObterUsuarioIdAutenticado();
        var existente = await _context.Fornecedores.FirstOrDefaultAsync(f => f.Id == id);
        if (existente == null) return NotFound();

        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(existente.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Sem permissão para alterar este parceiro." });
        }

        existente.Nome = fornecedor.Nome;
        existente.Telefone = fornecedor.Telefone;
        existente.Categoria = fornecedor.Categoria;
        existente.Observacoes = fornecedor.Observacoes;

        try { 
            await _context.SaveChangesAsync(); 
        }
        catch (DbUpdateConcurrencyException) {
            if (!_context.Fornecedores.Any(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFornecedor(int id)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        var fornecedor = await _context.Fornecedores.FindAsync(id);
        if (fornecedor == null) return NotFound();

        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(fornecedor.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Sem permissão para excluir este parceiro." });
        }

        _context.Fornecedores.Remove(fornecedor);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("por-fornecedor/{fornecedorId}")]
    public async Task<ActionResult> GetPorFornecedor(int fornecedorId, [FromQuery] int negocioId)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(negocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado." });
        }

        var fornecedor = await _context.Fornecedores
            .FirstOrDefaultAsync(f => f.Id == fornecedorId && f.NegocioId == negocioId);

        if (fornecedor == null) return NotFound("Parceiro não encontrado.");

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