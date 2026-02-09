
using Autonomax.Controllers;
using Autonomax.Data;
using Autonomax.DTOs;
using Autonomax.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Autonomax.Tests;

public class AuthTests
{
    private AppDbContext GetDatabase()
    {
        // Cria um banco novo na memória para cada teste, garantindo isolamento
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task Login_DeveRetornarUnauthorized_QuandoSenhaIncorreta()
    {
        // Arrange
        var db = GetDatabase();
        var controller = new AuthController(db);
        
        db.Usuarios.Add(new Usuario { 
            Email = "teste@teste.com", 
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("senha123") 
        });
        await db.SaveChangesAsync();

        var loginDto = new LoginDto { Email = "teste@teste.com", Senha = "SENHA_ERRADA" };

        // Act
        var result = await controller.Login(loginDto);

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result);
    }
}