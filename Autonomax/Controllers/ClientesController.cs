using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Data;
using Autonomax.Models;
using Microsoft.AspNetCore.Authorization;

namespace Autonomax.Controllers;

[Authorize] // Somente usuários logados podem gerenciar clientes
[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClientesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Clientes/por-negocio/1
    // Ajustamos para listar clientes de um negócio específico
    [HttpGet("por-negocio/{negocioId}")]
    public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes(int negocioId)
    {
        return await _context.Clientes
            .Where(c => c.NegocioId == negocioId)
            .ToListAsync();
    }

    // POST: api/Clientes
    [HttpPost]
    public async Task<ActionResult<Cliente>> PostCliente(Cliente cliente)
    {
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        // Ajustado para retornar o objeto criado corretamente
        return CreatedAtAction(nameof(GetClientes), new { negocioId = cliente.NegocioId }, cliente);
    }

    // GET: api/Clientes/ranking/1
    [HttpGet("ranking/{negocioId}")]
    public async Task<IActionResult> GetRanking(int negocioId)
    {
        var ranking = await _context.Transacoes
            .Where(t => t.NegocioId == negocioId && t.Tipo == "Entrada" && t.ClienteId != null)
            .GroupBy(t => t.ClienteId)
            .Select(grupo => new {
                ClienteId = grupo.Key,
                // O ?. e ?? "Desconhecido" resolvem o Warning CS8602
                NomeCliente = _context.Clientes.FirstOrDefault(c => c.Id == grupo.Key)!.Nome ?? "Desconhecido",
                TotalGasto = grupo.Sum(t => t.Valor)
            })
            .OrderByDescending(x => x.TotalGasto)
            .Take(10) 
            .ToListAsync();

        return Ok(ranking);
    }
}