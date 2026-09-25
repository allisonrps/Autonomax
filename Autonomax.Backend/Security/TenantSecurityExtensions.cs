using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;

namespace Autonomax.Backend.Security;

public static class TenantSecurityExtensions
{
    /// <summary>
    /// Extrai o ID do usuário autenticado a partir dos claims do Token JWT.
    /// </summary>
    public static int? ObterUsuarioIdAutenticado(this ControllerBase controller)
    {
        var user = controller.User;
        if (user == null || !user.Identity?.IsAuthenticated == true)
            return null;

        var claimId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                      ?? user.FindFirst("id")?.Value 
                      ?? user.FindFirst(ClaimTypes.Name)?.Value;

        if (int.TryParse(claimId, out var id))
        {
            return id;
        }

        return null;
    }

    /// <summary>
    /// Valida se o usuário autenticado possui vínculo de propriedade com o NegocioId informado.
    /// </summary>
    public static async Task<bool> ValidarPosseNegocioAsync(this AppDbContext context, int negocioId, int usuarioId)
    {
        if (negocioId <= 0 || usuarioId <= 0) return false;

        return await context.Negocios
            .AsNoTracking()
            .AnyAsync(n => n.Id == negocioId && n.UsuarioId == usuarioId);
    }
}
