using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;

namespace Autonomax.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LogsSegurancaController : ControllerBase
{
    private readonly AppDbContext _context;

    public LogsSegurancaController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LogSeguranca>>> GetLogs()
    {
        var usuarioIdStr = User.FindFirst("id")?.Value ?? "0";
        var usuarioId = int.Parse(usuarioIdStr);
        
        // Retorna logs do próprio usuário ou tentativas de login falhas
        return await _context.LogsSeguranca
            .Where(l => l.UsuarioId == usuarioId || l.Evento == "LOGIN_FALHO")
            .OrderByDescending(l => l.Data)
            .Take(10)
            .ToListAsync();
    }
}