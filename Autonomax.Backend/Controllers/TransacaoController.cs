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

    [HttpPost]
    public async Task<ActionResult<Transacao>> PostTransacao(Transacao transacao)
    {
        try 
        {
            if (transacao.Data == DateTime.MinValue) transacao.Data = DateTime.Now;
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

    [HttpPut("{id}")]
    public async Task<IActionResult> PutTransacao(int id, Transacao transacao)
    {
        if (id != transacao.Id) return BadRequest();
        transacao.Cliente = null;
        _context.Entry(transacao).State = EntityState.Modified;

        try { await _context.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Transacoes.Any(e => e.Id == id)) return NotFound();
            else throw;
        }
        return NoContent();
    }

    [HttpGet("por-cliente/{clienteId}")] 
    public async Task<IActionResult> GetPorCliente(int clienteId, [FromQuery] int negocioId)
    {
        var cliente = await _context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == clienteId);
        if (cliente == null) return NotFound(new { mensagem = "Cliente não encontrado." });

        var transacoes = await _context.Transacoes
            .Include(t => t.Itens)
            .Where(t => t.ClienteId == clienteId && t.NegocioId == negocioId)
            .OrderByDescending(t => t.Data)
            .ToListAsync();

        return Ok(new { cliente, transacoes });
    }


    [HttpGet("por-fornecedor/{fornecedorId}")] 
    public async Task<IActionResult> GetPorFornecedor(int fornecedorId, [FromQuery] int negocioId)
    {
        var fornecedor = await _context.Fornecedores
            .AsNoTracking() 
            .FirstOrDefaultAsync(f => f.Id == fornecedorId && f.NegocioId == negocioId);

        if (fornecedor == null) return NotFound(new { mensagem = "Fornecedor não encontrado." });

        var transacoes = await _context.Transacoes
            .Where(t => t.FornecedorId == fornecedorId && t.NegocioId == negocioId)
            .OrderByDescending(t => t.Data)
            .ToListAsync();

        return Ok(new { fornecedor, transacoes });
    }

    [HttpGet("por-periodo/{negocioId}")]
    public async Task<ActionResult<IEnumerable<Transacao>>> GetTransacoesPorPeriodo(int negocioId, [FromQuery] int mes, [FromQuery] int ano)
    {
        return await _context.Transacoes
            .Include(t => t.Cliente)
            .Include(t => t.Fornecedor)
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