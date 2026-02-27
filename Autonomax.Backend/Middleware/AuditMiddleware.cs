using System.Security.Claims;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;

namespace Autonomax.Backend.Middleware;

public class AuditMiddleware
{
    private readonly RequestDelegate _next;

    public AuditMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        var metodo = context.Request.Method;

        // Só auditamos o que altera dados
        if (metodo == "POST" || metodo == "PUT" || metodo == "DELETE")
        {
            var usuarioIdStr = context.User.FindFirst("id")?.Value;
            var path = context.Request.Path;

            // Captura o corpo da requisição ou parâmetros se necessário
            var log = new LogSeguranca
            {
                Evento = $"ACAO_{metodo}",
                Descricao = $"O usuário realizou um {metodo} no caminho: {path}",
                IpOrigem = context.Connection.RemoteIpAddress?.ToString(),
                Data = DateTime.UtcNow,
                UsuarioId = !string.IsNullOrEmpty(usuarioIdStr) ? int.Parse(usuarioIdStr) : null
            };

            dbContext.LogsSeguranca.Add(log);
            await dbContext.SaveChangesAsync();
        }

        await _next(context);
    }
}