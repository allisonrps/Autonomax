using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Data;
using Autonomax.Models;
using Microsoft.AspNetCore.Authorization;

namespace Autonomax.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransacoesController : ControllerBase
{
    private readonly AppDbContext _context;
    public TransacoesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Transacoes/por-negocio/1
    [HttpGet("por-negocio/{negocioId:int}")] 
    public async Task<ActionResult<IEnumerable<Transacao>>> GetTransacoes(int negocioId)
    {
        return await _context.Transacoes
            .Include(t => t.Cliente) 
            .Include(t => t.Itens) // <-- ADICIONADO: Agora o ranking vai funcionar!
            .Where(t => t.NegocioId == negocioId)
            .OrderByDescending(t => t.Data)
            .ToListAsync();
    }

    // POST: api/Transacoes
    [HttpPost]
    public async Task<ActionResult<Transacao>> PostTransacao(Transacao transacao)
    {
        try 
        {
            if (transacao.Data == DateTime.MinValue) transacao.Data = DateTime.Now;

            transacao.Cliente = null;
            
            if (transacao.Itens != null)
            {
                foreach (var item in transacao.Itens)
                {
                    item.Transacao = null; 
                }
            }

            _context.Transacoes.Add(transacao);
            await _context.SaveChangesAsync();

            var transacaoCriada = await _context.Transacoes
                .Include(t => t.Itens)
                .Include(t => t.Cliente)
                .FirstOrDefaultAsync(t => t.Id == transacao.Id);

            return Ok(transacaoCriada);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao salvar: {ex.Message}");
            return StatusCode(500, "Erro interno ao processar a transação.");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutTransacao(int id, Transacao transacao)
    {
        if (id != transacao.Id) return BadRequest();
        transacao.Cliente = null;
        _context.Entry(transacao).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Transacoes.Any(e => e.Id == id)) return NotFound();
            else throw;
        }

        return NoContent();
    }

    // GET: api/Transacoes/por-cliente/5?negocioId=2
    [AllowAnonymous]
    [HttpGet("por-cliente/{clienteId}")] 
    public async Task<IActionResult> GetPorCliente(int clienteId, [FromQuery] int negocioId)
    {
        Console.WriteLine($"CHEGOU NO CONTROLLER: Cliente {clienteId}, Negocio {negocioId}");

        var cliente = await _context.Clientes
            .AsNoTracking() 
            .FirstOrDefaultAsync(c => c.Id == clienteId);

        if (cliente == null) {
            return NotFound(new { mensagem = $"Cliente {clienteId} não encontrado." });
        }

        var transacoes = await _context.Transacoes
            .Include(t => t.Itens) // <-- ADICIONADO: Para detalhar os itens no perfil do cliente
            .Where(t => t.ClienteId == clienteId && t.NegocioId == negocioId)
            .OrderByDescending(t => t.Data)
            .ToListAsync();

        return Ok(new { cliente, transacoes });
    }

    // GET: api/Transacoes/por-periodo/{negocioId}
    [HttpGet("por-periodo/{negocioId}")]
    public async Task<ActionResult<IEnumerable<Transacao>>> GetTransacoesPorPeriodo(int negocioId, [FromQuery] int mes, [FromQuery] int ano)
    {
        return await _context.Transacoes
            .Include(t => t.Cliente)
            .Include(t => t.Itens)
            .Where(t => t.NegocioId == negocioId && t.Data.Month == mes && t.Data.Year == ano)
            .OrderByDescending(t => t.Data)
            .ToListAsync();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransacao(int id)
    {
        var transacao = await _context.Transacoes.FindAsync(id);
        if (transacao == null) return NotFound();

        _context.Transacoes.Remove(transacao);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}