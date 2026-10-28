using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;
using Autonomax.Backend.Security;

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
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue)
        {
            return Unauthorized();
        }

        // Retorna estritamente logs gerados pelas ações do próprio usuário logado
        return await _context.LogsSeguranca
            .AsNoTracking()
            .Where(l => l.UsuarioId == usuarioId.Value)
            .OrderByDescending(l => l.Data)
            .Take(20)
            .ToListAsync();
    }
}
