using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Autonomax.Backend.Models;
using Microsoft.IdentityModel.Tokens;

namespace Autonomax.Backend.Services;

public static class TokenService
{
    public const string ChavePadraoDesenvolvimento = "Sua_Chave_Super_Secreta_De_32_Caracteres_Minimo";

    public static string ObterChaveSecret(IConfiguration configuration)
    {
        var secret = configuration["Jwt:Secret"] 
                     ?? Environment.GetEnvironmentVariable("Jwt__Secret")
                     ?? Environment.GetEnvironmentVariable("JWT_SECRET");

        if (string.IsNullOrWhiteSpace(secret))
        {
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            if (env == "Production" || env == "Staging")
            {
                throw new InvalidOperationException("ERRO CRÍTICO DE SEGURANÇA: Chave JWT (Jwt:Secret) não foi configurada em ambiente de produção.");
            }
            return ChavePadraoDesenvolvimento;
        }

        return secret;
    }

    public static string GerarToken(Usuario usuario, IConfiguration configuration)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var secretKey = ObterChaveSecret(configuration);
        var chave = Encoding.ASCII.GetBytes(secretKey);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim("id", usuario.Id.ToString()),
                new Claim(ClaimTypes.Name, usuario.Nome),
                new Claim(ClaimTypes.Email, usuario.Email)
            }),
            Expires = DateTime.UtcNow.AddHours(8),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(chave),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    // Sobrecarga mantida para retrocompatibilidade em testes legados
    public static string GerarToken(Usuario usuario)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection().Build();
        return GerarToken(usuario, config);
    }
}