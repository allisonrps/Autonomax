using Autonomax.Backend.Controllers;
using Autonomax.Backend.Data;
using Autonomax.Backend.DTOs;
using Autonomax.Backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Autonomax.Backend.Tests;

public class AuthTests
{
    private AppDbContext GetDatabase()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    // Função auxiliar para configurar o Controller com um Contexto falso
    private AuthController PrepararController(AppDbContext db)
    {
        var controller = new AuthController(db);
        
        // Contexto de requisição falso para evitar o NullReference no HttpContext
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        
        return controller;
    }

    [Fact]
    public async Task Login_DeveRetornarOk_QuandoCredenciaisForemCorretas()
    {
        var db = GetDatabase();
        var controller = PrepararController(db);
        var senhaOriginal = "senha123";
        
        db.Usuarios.Add(new Usuario { 
            Email = "correto@teste.com", 
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(senhaOriginal),
            Nome = "Usuário Teste"
        });
        await db.SaveChangesAsync();

        var loginDto = new LoginDto { Email = "correto@teste.com", Senha = senhaOriginal };
        var result = await controller.Login(loginDto);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task Login_DeveRetornarUnauthorized_QuandoSenhaIncorreta()
    {
        var db = GetDatabase();
        var controller = PrepararController(db);
        
        db.Usuarios.Add(new Usuario { 
            Email = "teste@teste.com", 
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("senha123") 
        });
        await db.SaveChangesAsync();

        var loginDto = new LoginDto { Email = "teste@teste.com", Senha = "SENHA_ERRADA" };
        var result = await controller.Login(loginDto);

        Assert.IsType<UnauthorizedObjectResult>(result);
        
        // Verifica se o log de falha foi gravado no banco 
        var log = await db.LogsSeguranca.FirstOrDefaultAsync(l => l.EmailAlvo == "teste@teste.com");
        Assert.NotNull(log);
        Assert.Equal("LOGIN_FALHO", log.Evento);
    }

    [Fact]
    public async Task Login_DeveRetornarUnauthorized_QuandoUsuarioNaoExistir()
    {
        var db = GetDatabase();
        var controller = PrepararController(db);
        var loginDto = new LoginDto { Email = "naoexiste@teste.com", Senha = "qualquer_senha" };

        var result = await controller.Login(loginDto);

        Assert.IsType<UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task Register_DeveRetornarOk_QuandoDadosValidos()
    {
        var db = GetDatabase();
        var controller = PrepararController(db);
        var registerDto = new RegisterDto { 
            Nome = "Novo Usuario", 
            Email = "novo@teste.com", 
            Senha = "senha_segura" 
        };

        var result = await controller.Register(registerDto);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Register_DeveRetornarBadRequest_QuandoEmailJaExistente()
    {
        var db = GetDatabase();
        var controller = PrepararController(db);
        db.Usuarios.Add(new Usuario { Email = "duplicado@teste.com", SenhaHash = "hash", Nome = "Ja Existe" });
        await db.SaveChangesAsync();

        var registerDto = new RegisterDto { Nome = "Tentativa", Email = "duplicado@teste.com", Senha = "senha" };
        var result = await controller.Register(registerDto);

        Assert.IsType<BadRequestObjectResult>(result);
    }
}