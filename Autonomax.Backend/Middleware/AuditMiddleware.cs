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
        // 1. Executa o próximo middleware na pipeline (processa a requisição primeiro)
        await _next(context);

        // 2. Só gravamos log para requisições de mutação (POST/PUT/DELETE) bem-sucedidas (2xx)
        var metodo = context.Request.Method;
        if ((metodo == "POST" || metodo == "PUT" || metodo == "DELETE") 
            && context.Response.StatusCode >= 200 
            && context.Response.StatusCode < 300)
        {
            try
            {
                var usuarioIdStr = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                                  ?? context.User.FindFirst("id")?.Value;
                var path = context.Request.Path;

                var log = new LogSeguranca
                {
                    Evento = $"ACAO_{metodo}",
                    Descricao = $"Ação {metodo} realizada no caminho: {path}",
                    IpOrigem = context.Connection.RemoteIpAddress?.ToString(),
                    Data = DateTime.UtcNow,
                    UsuarioId = int.TryParse(usuarioIdStr, out var id) ? id : null
                };

                dbContext.LogsSeguranca.Add(log);
                await dbContext.SaveChangesAsync();
            }
            catch
            {
                // Falha secundária ao salvar log de auditoria não deve derrubar a resposta do usuário
            }
        }
    }
}