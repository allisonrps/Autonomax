using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;
using Autonomax.Backend.DTOs;
using Autonomax.Backend.Services;
using Microsoft.AspNetCore.Authorization;
using QuestPDF.Fluent;


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
        var transacoes = await _context.Transacoes
            .Include(t => t.Cliente) 
            .Include(t => t.Itens)
            .Where(t => t.NegocioId == negocioId)
            .OrderByDescending(t => t.Data)
            .ToListAsync();

        NormalizarItensTransacoes(transacoes);
        return transacoes;
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
            transacao.Fornecedor = null;
            
            if (transacao.Itens != null && transacao.Itens.Count > 0)
            {
                foreach (var item in transacao.Itens)
                {
                    item.Transacao = null;
                    var (qtdExtr, nomeLimpo) = ProdutosServicosController.ExtrairQtdENome(item.Nome);
                    var nomeFinal = !string.IsNullOrWhiteSpace(nomeLimpo) ? nomeLimpo : item.Nome?.Trim();
                    item.Nome = !string.IsNullOrWhiteSpace(nomeFinal) ? nomeFinal : "Item";
                    item.Quantidade = Math.Max(1, Math.Max(item.Quantidade, qtdExtr));
                }
            }
            else if (!string.IsNullOrWhiteSpace(transacao.Descricao))
            {
                transacao.Itens = new List<ItemTransacao>();
                var partes = transacao.Descricao.Split(new[] { ',', ';', '\n', '\r', '+', '/' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var parte in partes)
                {
                    var pedaco = parte.Trim();
                    if (string.IsNullOrWhiteSpace(pedaco)) continue;
                    var (qtdExtr, nomeLimpo) = ProdutosServicosController.ExtrairQtdENome(pedaco);
                    transacao.Itens.Add(new ItemTransacao
                    {
                        Nome = !string.IsNullOrWhiteSpace(nomeLimpo) ? nomeLimpo : pedaco,
                        Quantidade = Math.Max(1, qtdExtr)
                    });
                }
            }

            NormalizarItensTransacoes(new[] { transacao });

            _context.Transacoes.Add(transacao);
            await _context.SaveChangesAsync();

            // Sincroniza automaticamente com o catálogo de produtos/serviços (apenas Receitas/Entradas)
            if (!string.Equals(transacao.Tipo, "Saida", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(transacao.Tipo, "Saída", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(transacao.Tipo, "Despesa", StringComparison.OrdinalIgnoreCase))
            {
                await ProdutosServicosController.SincronizarItensDoHistoricoInternoAsync(_context, transacao.NegocioId);
            }

            var transacaoCriada = await _context.Transacoes
                .Include(t => t.Itens)
                .Include(t => t.Cliente)
                .Include(t => t.Fornecedor)
                .FirstOrDefaultAsync(t => t.Id == transacao.Id);

            if (transacaoCriada != null)
            {
                NormalizarItensTransacoes(new[] { transacaoCriada });
            }

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

        var transacaoExistente = await _context.Transacoes
            .Include(t => t.Itens)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transacaoExistente == null) return NotFound();

        transacaoExistente.Descricao = transacao.Descricao;
        transacaoExistente.Valor = transacao.Valor;
        transacaoExistente.Tipo = transacao.Tipo;
        transacaoExistente.Status = transacao.Status;
        transacaoExistente.MetodoPagamento = transacao.MetodoPagamento;
        transacaoExistente.Data = transacao.Data;
        transacaoExistente.ClienteId = transacao.ClienteId;
        transacaoExistente.FornecedorId = transacao.FornecedorId;

        // Atualiza a coleção de Itens associada
        if (transacaoExistente.Itens != null && transacaoExistente.Itens.Count > 0)
        {
            _context.ItensTransacao.RemoveRange(transacaoExistente.Itens);
            transacaoExistente.Itens.Clear();
        }

        transacaoExistente.Itens ??= new List<ItemTransacao>();

        if (transacao.Itens != null && transacao.Itens.Count > 0)
        {
            foreach (var it in transacao.Itens)
            {
                var (qtdExtr, nomeLimpo) = ProdutosServicosController.ExtrairQtdENome(it.Nome);
                var nomeFinal = !string.IsNullOrWhiteSpace(nomeLimpo) ? nomeLimpo : it.Nome?.Trim();
                var qtdFinal = Math.Max(1, Math.Max(it.Quantidade, qtdExtr));
                
                transacaoExistente.Itens.Add(new ItemTransacao
                {
                    Nome = !string.IsNullOrWhiteSpace(nomeFinal) ? nomeFinal : "Item",
                    Quantidade = qtdFinal,
                    TransacaoId = id
                });
            }
        }
        else if (!string.IsNullOrWhiteSpace(transacao.Descricao))
        {
            var partes = transacao.Descricao.Split(new[] { ',', ';', '\n', '\r', '+', '/' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var parte in partes)
            {
                var pedaco = parte.Trim();
                if (string.IsNullOrWhiteSpace(pedaco)) continue;
                var (qtdExtr, nomeLimpo) = ProdutosServicosController.ExtrairQtdENome(pedaco);
                transacaoExistente.Itens.Add(new ItemTransacao
                {
                    Nome = !string.IsNullOrWhiteSpace(nomeLimpo) ? nomeLimpo : pedaco,
                    Quantidade = Math.Max(1, qtdExtr),
                    TransacaoId = id
                });
            }
        }

        NormalizarItensTransacoes(new[] { transacaoExistente });

        try 
        { 
            await _context.SaveChangesAsync(); 
            if (!string.Equals(transacao.Tipo, "Saida", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(transacao.Tipo, "Saída", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(transacao.Tipo, "Despesa", StringComparison.OrdinalIgnoreCase))
            {
                await ProdutosServicosController.SincronizarItensDoHistoricoInternoAsync(_context, transacao.NegocioId);
            }
        }
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

        NormalizarItensTransacoes(transacoes);

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
            .Include(t => t.Itens)
            .Where(t => t.FornecedorId == fornecedorId && t.NegocioId == negocioId)
            .OrderByDescending(t => t.Data)
            .ToListAsync();

        NormalizarItensTransacoes(transacoes);

        return Ok(new { fornecedor, transacoes });
    }

    [HttpGet("por-periodo/{negocioId}")]
    public async Task<ActionResult<IEnumerable<Transacao>>> GetTransacoesPorPeriodo(int negocioId, [FromQuery] int mes, [FromQuery] int ano)
    {
        var transacoes = await _context.Transacoes
            .Include(t => t.Cliente)
            .Include(t => t.Fornecedor)
            .Include(t => t.Itens)
            .Where(t => t.NegocioId == negocioId && t.Data.Month == mes && t.Data.Year == ano)
            .OrderByDescending(t => t.Data)
            .ToListAsync();

        NormalizarItensTransacoes(transacoes);

        return transacoes;
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

    public static void NormalizarItensTransacoes(IEnumerable<Transacao> transacoes)
    {
        if (transacoes == null) return;

        foreach (var t in transacoes)
        {
            if (t.Itens != null && t.Itens.Count > 0)
            {
                foreach (var it in t.Itens)
                {
                    var (qtdExtr, nomeLimpo) = ProdutosServicosController.ExtrairQtdENome(it.Nome);
                    var nomeFinal = !string.IsNullOrWhiteSpace(nomeLimpo) ? nomeLimpo : it.Nome?.Trim();
                    it.Nome = !string.IsNullOrWhiteSpace(nomeFinal) ? nomeFinal : "Item";
                    it.Quantidade = Math.Max(1, Math.Max(it.Quantidade, qtdExtr));
                }

                // Cruza com as quantidades descritas em t.Descricao para garantir exatidão
                if (!string.IsNullOrWhiteSpace(t.Descricao))
                {
                    var partes = t.Descricao.Split(new[] { ',', ';', '\n', '\r', '+' }, StringSplitOptions.RemoveEmptyEntries);
                    
                    if (t.Itens.Count == 1 && partes.Length >= 1)
                    {
                        var (qtdDesc, _) = ProdutosServicosController.ExtrairQtdENome(t.Descricao);
                        if (qtdDesc > t.Itens[0].Quantidade)
                        {
                            t.Itens[0].Quantidade = qtdDesc;
                        }
                    }
                    else
                    {
                        for (int i = 0; i < t.Itens.Count; i++)
                        {
                            var it = t.Itens[i];
                            var itNorm = ProdutosServicosController.NormalizarTexto(it.Nome);
                            if (string.IsNullOrWhiteSpace(itNorm)) continue;

                            bool encontrouExato = false;

                            // 1. Procura correspondência EXATA entre o nome do item e qualquer uma das partes da descrição
                            foreach (var parte in partes)
                            {
                                var (qtdP, nomeP) = ProdutosServicosController.ExtrairQtdENome(parte);
                                var pNorm = ProdutosServicosController.NormalizarTexto(nomeP);
                                if (!string.IsNullOrEmpty(pNorm) && pNorm.Equals(itNorm, StringComparison.OrdinalIgnoreCase))
                                {
                                    if (qtdP > it.Quantidade)
                                    {
                                        it.Quantidade = qtdP;
                                    }
                                    encontrouExato = true;
                                    break;
                                }
                            }

                            // 2. Se não encontrou exato por nome, e o índice coincidir
                            if (!encontrouExato && i < partes.Length)
                            {
                                var (qtdP, nomeP) = ProdutosServicosController.ExtrairQtdENome(partes[i]);
                                var pNorm = ProdutosServicosController.NormalizarTexto(nomeP);
                                if (!string.IsNullOrEmpty(pNorm) && pNorm.Equals(itNorm, StringComparison.OrdinalIgnoreCase))
                                {
                                    if (qtdP > it.Quantidade)
                                    {
                                        it.Quantidade = qtdP;
                                        encontrouExato = true;
                                    }
                                }
                            }

                            // 3. Fallback: verificação estrita por palavras completas para evitar falso positivo entre "P" e "PP"
                            if (!encontrouExato)
                            {
                                foreach (var parte in partes)
                                {
                                    var (qtdP, nomeP) = ProdutosServicosController.ExtrairQtdENome(parte);
                                    var pNorm = ProdutosServicosController.NormalizarTexto(nomeP);
                                    if (!string.IsNullOrEmpty(pNorm))
                                    {
                                        var itWords = itNorm.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                                        var pWords = pNorm.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                                        if (itWords.SequenceEqual(pWords, StringComparer.OrdinalIgnoreCase))
                                        {
                                            if (qtdP > it.Quantidade)
                                            {
                                                it.Quantidade = qtdP;
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else if (!string.IsNullOrWhiteSpace(t.Descricao))
            {
                t.Itens = new List<ItemTransacao>();
                var partes = t.Descricao.Split(new[] { ',', ';', '\n', '\r', '+' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (var parte in partes)
                {
                    var pedaco = parte.Trim();
                    if (string.IsNullOrWhiteSpace(pedaco)) continue;
                    var (qtdExtr, nomeLimpo) = ProdutosServicosController.ExtrairQtdENome(pedaco);
                    t.Itens.Add(new ItemTransacao
                    {
                        Nome = !string.IsNullOrWhiteSpace(nomeLimpo) ? nomeLimpo : pedaco,
                        Quantidade = Math.Max(1, qtdExtr),
                        TransacaoId = t.Id
                    });
                }
            }
            else
            {
                t.Itens ??= new List<ItemTransacao>();
            }
        }
    }



[HttpGet("clientes/{id}/relatorio-pdf")]
public async Task<IActionResult> GerarRelatorioCliente(int id)
{
    // 1. Busca os dados no Banco
    var cliente = await _context.Clientes
        .Include(c => c.Transacoes)
            .ThenInclude(t => t.Itens)
        .FirstOrDefaultAsync(c => c.Id == id);

    if (cliente == null) return NotFound("Cliente não encontrado.");

    NormalizarItensTransacoes(cliente.Transacoes);

    // 2. Mapeia para o DTO de Relatório
    var dadosRelatorio = new RelatorioClienteDto
    {
        NomeCliente = cliente.Nome,
        Celular = cliente.Celular ?? "Não informado",
        FaturamentoTotal = cliente.Transacoes.Sum(t => t.Valor),
        Transacoes = cliente.Transacoes
            .OrderByDescending(t => t.Data)
            .Select(t => new TransacaoItemDto
            {
                Data = t.Data,
                Descricao = (t.Itens != null && t.Itens.Count > 0)
                    ? string.Join(", ", t.Itens.Select(i => $"{Math.Max(1, i.Quantidade)}x {i.Nome}"))
                    : t.Descricao,
                Valor = t.Valor
            }).ToList()
    };

    // 3. Gera o PDF usando a classe
    var document = new RelatorioClienteDocument(dadosRelatorio);
    byte[] pdfBytes = document.GeneratePdf();

    // 4. Retorna o arquivo
    return File(pdfBytes, "application/pdf", $"Relatorio_{cliente.Nome.Replace(" ", "_")}.pdf");
}

[HttpGet("fornecedores/{id}/relatorio-pdf")]
public async Task<IActionResult> GerarRelatorioFornecedor(int id)
{
    // 1. Busca os dados no Banco
    var fornecedor = await _context.Fornecedores
        .Include(f => f.Transacoes)
            .ThenInclude(t => t.Itens)
        .FirstOrDefaultAsync(f => f.Id == id);

    if (fornecedor == null) return NotFound("Parceiro não encontrado.");

    NormalizarItensTransacoes(fornecedor.Transacoes);

    // 2. Mapeia para o DTO de Relatório
    var dadosRelatorio = new RelatorioFornecedorDto
    {
        NomeFornecedor = fornecedor.Nome,
        Telefone = fornecedor.Telefone ?? "Não informado",
        Categoria = fornecedor.Categoria ?? "Geral",
        TotalGasto = fornecedor.Transacoes.Where(t => t.Tipo == "Saida" || t.Tipo == "Saída").Sum(t => t.Valor),
        Transacoes = fornecedor.Transacoes
            .Where(t => t.Tipo == "Saida" || t.Tipo == "Saída")
            .OrderByDescending(t => t.Data)
            .Select(t => new TransacaoItemDto
            {
                Data = t.Data,
                Descricao = (t.Itens != null && t.Itens.Count > 0)
                    ? string.Join(", ", t.Itens.Select(i => $"{Math.Max(1, i.Quantidade)}x {i.Nome}"))
                    : t.Descricao,
                Valor = t.Valor
            }).ToList()
    };

    // 3. Gera o PDF usando a classe
    var document = new RelatorioFornecedorDocument(dadosRelatorio);
    byte[] pdfBytes = document.GeneratePdf();

    // 4. Retorna o arquivo
    return File(pdfBytes, "application/pdf", $"Relatorio_{fornecedor.Nome.Replace(" ", "_")}.pdf");
}


[HttpGet("fluxo-caixa/relatorio-pdf")]
public async Task<IActionResult> GerarRelatorioFluxoCaixa([FromQuery] int negocioId, [FromQuery] int mes, [FromQuery] int ano)
{
    var transacoes = await _context.Transacoes
        .Include(t => t.Cliente)
        .Include(t => t.Fornecedor)
        .Include(t => t.Itens)
        .Where(t => t.NegocioId == negocioId && t.Data.Month == mes && t.Data.Year == ano)
        .OrderBy(t => t.Data)
        .ToListAsync();

    NormalizarItensTransacoes(transacoes);

    var dados = new FluxoCaixaDto
    {
        Periodo = $"{mes:D2}/{ano}",
        TotalEntradas = transacoes.Where(t => t.Tipo == "Entrada").Sum(t => t.Valor),
        TotalSaidas = transacoes.Where(t => t.Tipo == "Saída" || t.Tipo == "Saida").Sum(t => t.Valor),
        Lancamentos = transacoes.Select(t => new FluxoItemDto
        {
            Data = t.Data,
            Descricao = (t.Itens != null && t.Itens.Count > 0)
                ? string.Join(", ", t.Itens.Select(i => $"{Math.Max(1, i.Quantidade)}x {i.Nome}"))
                : t.Descricao,
            Tipo = t.Tipo,
            Status = t.Status,
            MetodoPagamento = t.MetodoPagamento,
            Parceiro = t.Tipo == "Entrada" 
                ? (t.Cliente?.Nome ?? "Venda Avulsa") 
                : (t.Fornecedor?.Nome ?? "Gasto Geral"),
            Valor = t.Valor
        }).ToList()
    };
    
    dados.SaldoFinal = dados.TotalEntradas - dados.TotalSaidas;

    var document = new RelatorioFluxoCaixaDocument(dados);
    byte[] pdfBytes = document.GeneratePdf();

    return File(pdfBytes, "application/pdf", $"FluxoCaixa_{mes}_{ano}.pdf");
}


}