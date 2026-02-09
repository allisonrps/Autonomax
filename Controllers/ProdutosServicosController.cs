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
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<ProdutoServico>> Post([FromBody] ProdutoServicoCreateDto dto)
    {
        // Convertendo DTO para Model
        var item = new ProdutoServico
        {
            Nome = dto.Nome,
            Preco = dto.Preco,
            NegocioId = dto.NegocioId
        };

        _context.ProdutosServicos.Add(item);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPorNegocio), new { negocioId = item.NegocioId }, item);
    }
}