using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Data;
using Autonomax.Models;
using Autonomax.DTOs;
using Autonomax.Services;
using BCrypt.Net;

namespace Autonomax.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto login)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == login.Email);

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(login.Senha, usuario.SenhaHash))
            return Unauthorized(new { message = "E-mail ou senha inválidos" });

        var token = TokenService.GerarToken(usuario);

        return Ok(new
        {
            Token = token,
            Usuario = new { usuario.Id, usuario.Nome, usuario.Email }
        });
    } // <-- ESSA CHAVE FECHA O LOGIN

    [HttpPost("register")] // AGORA O REGISTER ESTÁ NO LUGAR CERTO
    public async Task<IActionResult> Register([FromBody] Usuario usuario)
    {
        if (await _context.Usuarios.AnyAsync(u => u.Email == usuario.Email))
            return BadRequest("Este e-mail já está cadastrado.");

        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(usuario.SenhaHash);

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Usuário criado com sucesso!" });
    }
} 