using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Autonomax.Backend.Security;

namespace Autonomax.Backend.Controllers;

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

    [HttpGet("por-negocio/{negocioId}")]
    public async Task<IActionResult> GetClientes(int negocioId)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(negocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado a este negócio." });
        }

        try
        {
            var clientesComTransacoes = await _context.Clientes
                .Include(c => c.Transacoes) 
                .Where(c => c.NegocioId == negocioId)
                .ToListAsync();

            var resultado = clientesComTransacoes.Select(c => new {
                c.Id,
                c.Nome,
                c.Celular,
                c.Endereco,
                c.Cidade,
                c.Estado,
                c.Observacoes,
                c.NegocioId,
                
                TotalComprado = c.Transacoes
                    .Where(t => t.Tipo == "Entrada")
                    .Sum(t => t.Valor),
                
                QtdMovimentacoes = c.Transacoes.Count,
                    
                UltimaMovimentacao = c.Transacoes
                    .OrderByDescending(t => t.Data)
                    .Select(t => t.Data.ToString("yyyy-MM-ddTHH:mm:ss"))
                    .FirstOrDefault()
            })
            .OrderBy(c => c.Nome)
            .ToList();

            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Erro interno ao buscar clientes: {ex.Message}");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Cliente>> PostCliente(Cliente cliente)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(cliente.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Sem permissão para cadastrar clientes neste negócio." });
        }

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetClientes), new { negocioId = cliente.NegocioId }, cliente);
    }

    [HttpGet("ranking/{negocioId}")]
    public async Task<IActionResult> GetRanking(int negocioId)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(negocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado." });
        }

        var ranking = await _context.Transacoes
            .Where(t => t.NegocioId == negocioId && t.Tipo == "Entrada" && t.ClienteId != null)
            .GroupBy(t => t.ClienteId)
            .Select(grupo => new {
                ClienteId = grupo.Key,
                NomeCliente = _context.Clientes.FirstOrDefault(c => c.Id == grupo.Key)!.Nome ?? "Desconhecido",
                TotalGasto = grupo.Sum(t => t.Valor)
            })
            .OrderByDescending(x => x.TotalGasto)
            .Take(10) 
            .ToListAsync();

        return Ok(ranking);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutCliente(int id, Cliente cliente)
    {
        if (id != cliente.Id) return BadRequest();

        var usuarioId = this.ObterUsuarioIdAutenticado();
        var clienteExistente = await _context.Clientes.FirstOrDefaultAsync(c => c.Id == id);
        if (clienteExistente == null) return NotFound();

        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(clienteExistente.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Sem permissão para alterar este cliente." });
        }

        clienteExistente.Nome = cliente.Nome;
        clienteExistente.Celular = cliente.Celular;
        clienteExistente.Endereco = cliente.Endereco;
        clienteExistente.Cidade = cliente.Cidade;
        clienteExistente.Estado = cliente.Estado;
        clienteExistente.Observacoes = cliente.Observacoes;

        try {
            await _context.SaveChangesAsync();
        } catch (DbUpdateConcurrencyException) {
            if (!_context.Clientes.Any(e => e.Id == id)) return NotFound();
            else throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCliente(int id)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        var cliente = await _context.Clientes.FindAsync(id);
        if (cliente == null) return NotFound();

        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(cliente.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Sem permissão para excluir este cliente." });
        }

        _context.Clientes.Remove(cliente);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Cliente>> GetById(int id)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        var cliente = await _context.Clientes.FindAsync(id);
        if (cliente == null) return NotFound();

        if (!usuarioId.HasValue || !await _context.ValidarPosseNegocioAsync(cliente.NegocioId, usuarioId.Value))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { mensagem = "Acesso negado aos dados deste cliente." });
        }

        return cliente;
    }
}