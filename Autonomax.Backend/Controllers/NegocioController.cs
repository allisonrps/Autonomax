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
public class NegociosController : ControllerBase
{
    private readonly AppDbContext _context;

    public NegociosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Negocio>>> GetMeusNegocios()
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        return await _context.Negocios
            .Where(n => n.UsuarioId == usuarioId.Value)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Negocio>> GetNegocio(int id)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        var negocio = await _context.Negocios
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId.Value);

        if (negocio == null) return NotFound("Negócio não encontrado.");

        return negocio;
    }

    [HttpPost]
    public async Task<ActionResult<Negocio>> PostNegocio(Negocio negocio)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        negocio.UsuarioId = usuarioId.Value;

        _context.Negocios.Add(negocio);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNegocio), new { id = negocio.Id }, negocio);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutNegocio(int id, Negocio negocio)
    {
        if (id != negocio.Id) return BadRequest("IDs não coincidem.");

        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        var negocioOriginal = await _context.Negocios
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId.Value);

        if (negocioOriginal == null) return NotFound("Permissão negada.");

        negocio.UsuarioId = usuarioId.Value;
        _context.Entry(negocio).State = EntityState.Modified;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNegocio(int id)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        var negocio = await _context.Negocios
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId.Value);

        if (negocio == null) return NotFound();

        _context.Negocios.Remove(negocio);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}