using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

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

    // 1. LISTAR apenas os negócios do usuário logado
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Negocio>>> GetMeusNegocios()
    {
        var usuarioIdStr = User.FindFirst("id")?.Value ?? "0";
        var usuarioId = int.Parse(usuarioIdStr);

        return await _context.Negocios
            .Where(n => n.UsuarioId == usuarioId)
            .ToListAsync();
    }

    // 2. BUSCAR um negócio específico
    [HttpGet("{id}")]
    public async Task<ActionResult<Negocio>> GetNegocio(int id)
    {
        var usuarioIdStr = User.FindFirst("id")?.Value ?? "0";
        var usuarioId = int.Parse(usuarioIdStr);

        var negocio = await _context.Negocios
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId);

        if (negocio == null) return NotFound("Negócio não encontrado.");

        return negocio;
    }

    // 3. CADASTRAR novo negócio
    [HttpPost]
    public async Task<ActionResult<Negocio>> PostNegocio(Negocio negocio)
    {
        var usuarioIdStr = User.FindFirst("id")?.Value ?? "0";
        var usuarioId = int.Parse(usuarioIdStr);

        negocio.UsuarioId = usuarioId;

        _context.Negocios.Add(negocio);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNegocio), new { id = negocio.Id }, negocio);
    }

    // 4. ATUALIZAR um negócio
    [HttpPut("{id}")]
    public async Task<IActionResult> PutNegocio(int id, Negocio negocio)
    {
    // O ID da URL deve ser o mesmo do objeto enviado
    if (id != negocio.Id) return BadRequest("IDs não coincidem.");

    var usuarioIdStr = User.FindFirst("id")?.Value ?? "0";
    var usuarioId = int.Parse(usuarioIdStr);

    // Segurança: Garante que o usuário só edite o que é dele
    var negocioOriginal = await _context.Negocios
        .AsNoTracking()
        .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId);

    if (negocioOriginal == null) return NotFound("Permissão negada.");

    negocio.UsuarioId = usuarioId;
    _context.Entry(negocio).State = EntityState.Modified;

    await _context.SaveChangesAsync();
    return NoContent();
}

    // 5. DELETAR um negócio
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNegocio(int id)
    {
        var usuarioIdStr = User.FindFirst("id")?.Value ?? "0";
        var usuarioId = int.Parse(usuarioIdStr);

        var negocio = await _context.Negocios
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId);

        if (negocio == null) return NotFound();

        _context.Negocios.Remove(negocio);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool NegocioExists(int id)
    {
        return _context.Negocios.Any(e => e.Id == id);
    }
}