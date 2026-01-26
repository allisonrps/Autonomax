using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Data;
using Autonomax.Models;

namespace Autonomax.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClientesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Clientes (Lista todos os clientes)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes()
    {
        return await _context.Clientes.ToListAsync();
    }

    // POST: api/Clientes (Cadastra um novo cliente)
    [HttpPost]
    public async Task<ActionResult<Cliente>> PostCliente(Cliente cliente)
    {
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetClientes), new { id = cliente.Id }, cliente);
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
                // Aqui buscamos o nome do cliente para o ranking ficar bonito
                NomeCliente = _context.Clientes.FirstOrDefault(c => c.Id == grupo.Key).Nome,
                TotalGasto = grupo.Sum(t => t.Valor)
            })
            .OrderByDescending(x => x.TotalGasto)
            .Take(10) // Pega os 10 melhores
            .ToListAsync();

        return Ok(ranking);
    }


}