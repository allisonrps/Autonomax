using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Data;
using Autonomax.Models;
using Autonomax.DTOs;
using Autonomax.Services;
using Microsoft.AspNetCore.RateLimiting;
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

    [EnableRateLimiting("login_policy")]
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
    }

[HttpPost("register")]
public async Task<IActionResult> Register([FromBody] RegisterDto dto)
{
    if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email))
        return BadRequest("Este e-mail já está cadastrado.");

    var usuario = new Usuario
    {
        Nome = dto.Nome,
        Email = dto.Email,
        // Aqui fazemos a "ponte": a Senha do DTO vira o Hash do Model
        SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha)
    };

    _context.Usuarios.Add(usuario);
    await _context.SaveChangesAsync();

    return Ok(new { message = "Usuário criado com sucesso!" });
}
}