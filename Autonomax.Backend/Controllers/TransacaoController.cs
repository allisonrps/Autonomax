using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace Autonomax.Backend.Controllers;

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
            .Include(t => t.Itens)
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

            // Garantindo valores padrão para os novos campos caso venham vazios
            if (string.IsNullOrEmpty(transacao.Status)) transacao.Status = "Pendente";
            if (string.IsNullOrEmpty(transacao.MetodoPagamento)) transacao.MetodoPagamento = "Pix";

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

    // PUT: api/Transacoes/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutTransacao(int id, Transacao transacao)
    {
        if (id != transacao.Id) return BadRequest();
        
        // Evita que o EF tente criar um novo cliente ao editar a transação
        transacao.Cliente = null;

        // Marcando a entidade como modificada para atualizar todos os campos (incluindo Status e Metodo)
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
    [HttpGet("por-cliente/{clienteId}")] 
    public async Task<IActionResult> GetPorCliente(int clienteId, [FromQuery] int negocioId)
    {
        var cliente = await _context.Clientes
            .AsNoTracking() 
            .FirstOrDefaultAsync(c => c.Id == clienteId);

        if (cliente == null) {
            return NotFound(new { mensagem = $"Cliente {clienteId} não encontrado." });
        }

        var transacoes = await _context.Transacoes
            .Include(t => t.Itens)
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