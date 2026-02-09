using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Data;
using Autonomax.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Autonomax.Controllers;

[Authorize] // Bloqueia todo o controller: só acessa com Token JWT
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
    var usuarioIdClaim = User.FindFirst("id")?.Value;
    var usuarioIdStr = User.FindFirst("id")?.Value ?? "0";
    var usuarioId = int.Parse(usuarioIdStr);

        return await _context.Negocios
            .Where(n => n.UsuarioId == usuarioId)
            .ToListAsync();
    }

    // 2. BUSCAR um negócio específico (garantindo que pertence ao usuário)
    [HttpGet("{id}")]
    public async Task<ActionResult<Negocio>> GetNegocio(int id)
    {
        var usuarioIdStr = User.FindFirst("id")?.Value ?? "0";
        var usuarioId = int.Parse(usuarioIdStr);

        var negocio = await _context.Negocios
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId);

        if (negocio == null) return NotFound("Negócio não encontrado ou você não tem permissão.");

        return negocio;
    }

    // 3. CADASTRAR um novo negócio vinculado ao usuário logado
    [HttpPost]
    public async Task<ActionResult<Negocio>> PostNegocio(Negocio negocio)
    {
    var usuarioIdStr = User.FindFirst("id")?.Value ?? "0";
    var usuarioId = int.Parse(usuarioIdStr);

        // Forçamos o ID do usuário logado para evitar que ele cadastre para outra pessoa
        negocio.UsuarioId = usuarioId;

        _context.Negocios.Add(negocio);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNegocio), new { id = negocio.Id }, negocio);
    }

    // 4. DELETAR um negócio
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
}