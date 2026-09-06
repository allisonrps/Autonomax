using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;
using Autonomax.Backend.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace Autonomax.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProdutosServicosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProdutosServicosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("por-negocio/{negocioId}")]
    public async Task<ActionResult<IEnumerable<ProdutoServico>>> GetPorNegocio(int negocioId)
    {
        return await _context.ProdutosServicos
            .Where(p => p.NegocioId == negocioId)
            .OrderBy(p => p.Nome)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProdutoServico>> GetById(int id)
    {
        var item = await _context.ProdutosServicos.FindAsync(id);
        return item == null ? NotFound() : item;
    }

    [HttpPost]
    public async Task<ActionResult<ProdutoServico>> Post([FromBody] ProdutoServicoCreateDto dto)
    {
        var item = new ProdutoServico
        {
            Nome = dto.Nome,
            Descricao = dto.Descricao,
            Preco = dto.Preco,
            EhServico = dto.EhServico,
            NegocioId = dto.NegocioId
        };

        _context.ProdutosServicos.Add(item);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromBody] ProdutoServicoUpdateDto dto)
    {
        var item = await _context.ProdutosServicos.FindAsync(id);
        if (item == null) return NotFound();

        item.Nome = dto.Nome;
        item.Descricao = dto.Descricao;
        item.Preco = dto.Preco;
        item.EhServico = dto.EhServico;

        _context.Entry(item).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.ProdutosServicos.Any(e => e.Id == id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.ProdutosServicos.FindAsync(id);
        if (item == null) return NotFound();

        _context.ProdutosServicos.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}