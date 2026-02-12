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
            .Where(t => t.NegocioId == negocioId)
            .OrderByDescending(t => t.Data)
            .ToListAsync();
    }

    // POST: api/Transacoes
    [HttpPost]
    public async Task<ActionResult<Transacao>> PostTransacao(Transacao transacao)
    {
        // 1. Garante que a data não venha zerada
        if (transacao.Data == DateTime.MinValue) transacao.Data = DateTime.Now;

        // 2. Importante: Limpa a propriedade de navegação do Cliente para evitar que o EF 
        // tente criar um novo cliente ou validar um existente que já está no banco.
        transacao.Cliente = null; 

        _context.Transacoes.Add(transacao);
        await _context.SaveChangesAsync();

        // 3. Busca a transação novamente para incluir os dados do Cliente no retorno (para o Frontend atualizar a lista)
        var transacaoCriada = await _context.Transacoes
            .Include(t => t.Cliente)
            .FirstOrDefaultAsync(t => t.Id == transacao.Id);

        return Ok(transacaoCriada); // Retornar Ok com o objeto completo é mais seguro para o seu Dashboard atual
    }

    // PUT: api/Transacoes/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutTransacao(int id, Transacao transacao)
    {
        if (id != transacao.Id) return BadRequest();

        // Garante que o Cliente não seja processado como um novo objeto na edição
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

// GET: api/Transacoes/por-periodo/1?mes=2&ano=2026
[HttpGet("por-periodo/{negocioId}")]
public async Task<ActionResult<IEnumerable<Transacao>>> GetTransacoesPorPeriodo(
    [FromRoute] int negocioId, 
    [FromQuery] int mes, 
    [FromQuery] int ano)
{
    // log no terminal do VS Code para vermos se a chamada chega aqui
    Console.WriteLine($"Chamada recebida: Negocio={negocioId}, Mes={mes}, Ano={ano}");

    var transacoes = await _context.Transacoes
        .Include(t => t.Cliente)
        .Where(t => t.NegocioId == negocioId && t.Data.Month == mes && t.Data.Year == ano)
        .OrderByDescending(t => t.Data)
        .ToListAsync();

    return Ok(transacoes);
}


    // DELETE: api/Transacoes/5
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