using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Autonomax.Models;
using Microsoft.IdentityModel.Tokens;

namespace Autonomax.Services;

public static class TokenService
{
    public static string GerarToken(Usuario usuario)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
//chave
        var chave = Encoding.ASCII.GetBytes("Sua_Chave_Super_Secreta_De_32_Caracteres_Minimo");

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, usuario.Nome),
                new Claim(ClaimTypes.Email, usuario.Email),
                new Claim("id", usuario.Id.ToString()) // Guardamos o ID do usuário no token
            }),
            Expires = DateTime.UtcNow.AddHours(8), // O login vale por 8 horas
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(chave),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}