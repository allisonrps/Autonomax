using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;
using Autonomax.Backend.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace Autonomax.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProdutosServicosController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProdutosServicosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("por-negocio/{negocioId}")]
    public async Task<ActionResult<IEnumerable<ProdutoServico>>> GetPorNegocio(int negocioId)
    {
        await SincronizarItensDoHistoricoInternoAsync(_context, negocioId);

        return await _context.ProdutosServicos
            .Where(p => p.NegocioId == negocioId)
            .OrderBy(p => p.Nome)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProdutoServico>> GetById(int id)
    {
        var item = await _context.ProdutosServicos.FindAsync(id);
        return item == null ? NotFound() : item;
    }

    [HttpPost]
    public async Task<ActionResult<ProdutoServico>> Post([FromBody] ProdutoServicoCreateDto dto)
    {
        var item = new ProdutoServico
        {
            Nome = dto.Nome,
            Descricao = dto.Descricao,
            Preco = dto.Preco,
            EhServico = dto.EhServico,
            NegocioId = dto.NegocioId
        };

        _context.ProdutosServicos.Add(item);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromBody] ProdutoServicoUpdateDto dto)
    {
        var item = await _context.ProdutosServicos.FindAsync(id);
        if (item == null) return NotFound();

        item.Nome = dto.Nome;
        item.Descricao = dto.Descricao;
        item.Preco = dto.Preco;
        item.EhServico = dto.EhServico;

        _context.Entry(item).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.ProdutosServicos.Any(e => e.Id == id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _context.ProdutosServicos.FindAsync(id);
        if (item == null) return NotFound();

        _context.ProdutosServicos.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("sugestoes-historico/{negocioId}")]
    public async Task<ActionResult<IEnumerable<ItemHistoricoSugestaoDto>>> GetSugestoesHistorico(int negocioId)
    {
        var transacoes = await _context.Transacoes
            .Include(t => t.Itens)
            .Where(t => t.NegocioId == negocioId)
            .ToListAsync();

        var produtosCadastrados = await _context.ProdutosServicos
            .Where(p => p.NegocioId == negocioId)
            .Select(p => p.Nome.Trim())
            .ToListAsync();

        var setCadastrados = new HashSet<string>(produtosCadastrados, StringComparer.OrdinalIgnoreCase);

        var mapaItens = new Dictionary<string, (string DisplayName, int Ocorrencias, List<decimal> Precos)>(StringComparer.OrdinalIgnoreCase);

        var regexItem = new System.Text.RegularExpressions.Regex(@"^(?:(\d+)\s*[xX*]\s*)?(.+)$", System.Text.RegularExpressions.RegexOptions.Compiled);

        foreach (var t in transacoes)
        {
            var itensProcessadosNestaTransacao = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // 1. Processa itens da tabela relacionada ItensTransacao
            if (t.Itens != null && t.Itens.Count > 0)
            {
                foreach (var it in t.Itens)
                {
                    if (string.IsNullOrWhiteSpace(it.Nome)) continue;
                    var nomeLimpo = it.Nome.Trim();
                    if (nomeLimpo.Length < 2) continue;

                    itensProcessadosNestaTransacao.Add(nomeLimpo);

                    if (!mapaItens.TryGetValue(nomeLimpo, out var dados))
                    {
                        dados = (nomeLimpo, 0, new List<decimal>());
                    }

                    dados.Ocorrencias += 1;
                    if (t.Itens.Count == 1 && it.Quantidade > 0 && t.Valor > 0)
                    {
                        dados.Precos.Add(Math.Round(t.Valor / it.Quantidade, 2));
                    }
                    mapaItens[nomeLimpo] = dados;
                }
            }

            // 2. Processa descrição textual (ex: "2x CARTAZ G, 2x CARTAZ M" ou "CARTAZ M")
            if (!string.IsNullOrWhiteSpace(t.Descricao))
            {
                var partes = t.Descricao.Split(new[] { ',', ';', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
                var qtdPartesValidas = 0;
                var itensDescricao = new List<(string Nome, int Qtd)>();

                foreach (var parte in partes)
                {
                    var pedaco = parte.Trim();
                    if (string.IsNullOrWhiteSpace(pedaco)) continue;

                    var match = regexItem.Match(pedaco);
                    if (match.Success)
                    {
                        var qtdStr = match.Groups[1].Value;
                        var nomeExtraido = match.Groups[2].Value.Trim();

                        if (nomeExtraido.Length >= 2 && !decimal.TryParse(nomeExtraido, out _))
                        {
                            int qtd = 1;
                            if (!string.IsNullOrEmpty(qtdStr) && int.TryParse(qtdStr, out var qParsed))
                            {
                                qtd = qParsed;
                            }
                            itensDescricao.Add((nomeExtraido, qtd));
                            qtdPartesValidas++;
                        }
                    }
                }

                foreach (var itemDesc in itensDescricao)
                {
                    // Evita duplicar se já foi adicionado via ItensTransacao
                    if (itensProcessadosNestaTransacao.Contains(itemDesc.Nome)) continue;

                    if (!mapaItens.TryGetValue(itemDesc.Nome, out var dados))
                    {
                        dados = (itemDesc.Nome, 0, new List<decimal>());
                    }

                    dados.Ocorrencias += 1;
                    if (qtdPartesValidas == 1 && itemDesc.Qtd > 0 && t.Valor > 0)
                    {
                        dados.Precos.Add(Math.Round(t.Valor / itemDesc.Qtd, 2));
                    }
                    mapaItens[itemDesc.Nome] = dados;
                }
            }
        }

        var palavrasChaveServico = new[] { 
            "servico", "serviço", "consultoria", "manutencao", "manutenção", 
            "instalacao", "instalação", "visita", "hora", "formatacao", 
            "formatação", "desenvolvimento", "suporte", "limpeza", "criacao", "criação", "aula" 
        };

        var resultado = mapaItens.Select(kvp =>
        {
            var nome = kvp.Value.DisplayName;
            var jaCadastrado = setCadastrados.Contains(nome);
            
            // Sugestão de preço médio quando houver transações unitárias
            decimal precoSugerido = 0;
            if (kvp.Value.Precos.Count > 0)
            {
                precoSugerido = Math.Round(kvp.Value.Precos.Average(), 2);
            }

            // Heurística de Serviço vs Produto
            var nomeLower = nome.ToLower();
            var ehServico = palavrasChaveServico.Any(p => nomeLower.Contains(p));

            return new ItemHistoricoSugestaoDto
            {
                Nome = nome,
                Ocorrencias = kvp.Value.Ocorrencias,
                PrecoSugerido = precoSugerido,
                EhServico = ehServico,
                JaCadastrado = jaCadastrado
            };
        })
        .OrderBy(s => s.JaCadastrado)
        .ThenByDescending(s => s.Ocorrencias)
        .ToList();

        return Ok(resultado);
    }

    [HttpPost("importar-em-lote")]
    public async Task<ActionResult<IEnumerable<ProdutoServico>>> ImportarEmLote([FromBody] ProdutoServicoBatchImportDto dto)
    {
        if (dto.NegocioId <= 0) return BadRequest("Negócio inválido.");
        if (dto.Itens == null || dto.Itens.Count == 0) return BadRequest("Nenhum item informado para importação.");

        var existentes = await _context.ProdutosServicos
            .Where(p => p.NegocioId == dto.NegocioId)
            .Select(p => p.Nome.Trim())
            .ToListAsync();

        var setExistentes = new HashSet<string>(existentes, StringComparer.OrdinalIgnoreCase);

        var novosProdutos = new List<ProdutoServico>();

        foreach (var itemDto in dto.Itens)
        {
            if (string.IsNullOrWhiteSpace(itemDto.Nome)) continue;
            var nomeTrim = itemDto.Nome.Trim();

            // Se já existe com esse nome para este negócio, não duplica
            if (setExistentes.Contains(nomeTrim)) continue;

            var novo = new ProdutoServico
            {
                Nome = nomeTrim,
                Descricao = itemDto.Descricao,
                Preco = itemDto.Preco > 0 ? itemDto.Preco : 0,
                EhServico = itemDto.EhServico,
                NegocioId = dto.NegocioId
            };

            novosProdutos.Add(novo);
            setExistentes.Add(nomeTrim); // Evita duplicar no mesmo lote
        }

        if (novosProdutos.Count > 0)
        {
            _context.ProdutosServicos.AddRange(novosProdutos);
            await _context.SaveChangesAsync();
        }

        return Ok(novosProdutos);
    }

    public static async Task SincronizarItensDoHistoricoInternoAsync(AppDbContext context, int negocioId)
    {
        if (negocioId <= 0) return;

        try
        {
            var transacoes = await context.Transacoes
                .Include(t => t.Itens)
                .Where(t => t.NegocioId == negocioId)
                .ToListAsync();

            if (transacoes.Count == 0) return;

            var existentes = await context.ProdutosServicos
                .Where(p => p.NegocioId == negocioId)
                .Select(p => p.Nome.Trim())
                .ToListAsync();

            var setExistentes = new HashSet<string>(existentes, StringComparer.OrdinalIgnoreCase);

            var regexItem = new System.Text.RegularExpressions.Regex(@"^(?:(\d+)\s*[xX*]\s*)?(.+)$", System.Text.RegularExpressions.RegexOptions.Compiled);

            var palavrasChaveServico = new[] { 
                "servico", "serviço", "consultoria", "manutencao", "manutenção", 
                "instalacao", "instalação", "visita", "hora", "formatacao", 
                "formatação", "desenvolvimento", "suporte", "limpeza", "criacao", "criação", "aula" 
            };

            var novosProdutos = new List<ProdutoServico>();

            foreach (var t in transacoes)
            {
                // 1. Processa ItensTransacao
                if (t.Itens != null && t.Itens.Count > 0)
                {
                    foreach (var it in t.Itens)
                    {
                        if (string.IsNullOrWhiteSpace(it.Nome)) continue;
                        var nome = it.Nome.Trim();
                        if (nome.Length < 2) continue;

                        if (!setExistentes.Contains(nome))
                        {
                            decimal preco = 0;
                            if (t.Itens.Count == 1 && it.Quantidade > 0 && t.Valor > 0)
                            {
                                preco = Math.Round(t.Valor / it.Quantidade, 2);
                            }

                            var ehServ = palavrasChaveServico.Any(p => nome.ToLower().Contains(p));

                            novosProdutos.Add(new ProdutoServico
                            {
                                Nome = nome,
                                Preco = preco,
                                EhServico = ehServ,
                                NegocioId = negocioId,
                                Descricao = "Importado automaticamente das vendas"
                            });
                            setExistentes.Add(nome);
                        }
                    }
                }

                // 2. Processa Descrição Textual (ex: "2x CARTAZ G, 2x CARTAZ M" ou "CARTAZ M")
                if (!string.IsNullOrWhiteSpace(t.Descricao))
                {
                    var partes = t.Descricao.Split(new[] { ',', ';', '\n', '\r', '+' }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var parte in partes)
                    {
                        var pedaco = parte.Trim();
                        if (string.IsNullOrWhiteSpace(pedaco)) continue;

                        var match = regexItem.Match(pedaco);
                        if (match.Success)
                        {
                            var nomeExtraido = match.Groups[2].Value.Trim();
                            var qtdStr = match.Groups[1].Value;

                            if (nomeExtraido.Length >= 2 && !decimal.TryParse(nomeExtraido, out _))
                            {
                                if (!setExistentes.Contains(nomeExtraido))
                                {
                                    decimal preco = 0;
                                    int qtd = 1;
                                    if (!string.IsNullOrEmpty(qtdStr) && int.TryParse(qtdStr, out var qP))
                                    {
                                        qtd = qP > 0 ? qP : 1;
                                    }
                                    if (partes.Length == 1 && t.Valor > 0)
                                    {
                                        preco = Math.Round(t.Valor / qtd, 2);
                                    }

                                    var ehServ = palavrasChaveServico.Any(p => nomeExtraido.ToLower().Contains(p));

                                    novosProdutos.Add(new ProdutoServico
                                    {
                                        Nome = nomeExtraido,
                                        Preco = preco,
                                        EhServico = ehServ,
                                        NegocioId = negocioId,
                                        Descricao = "Importado automaticamente das vendas"
                                    });
                                    setExistentes.Add(nomeExtraido);
                                }
                            }
                        }
                    }
                }
            }

            if (novosProdutos.Count > 0)
            {
                context.ProdutosServicos.AddRange(novosProdutos);
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro na sincronização automática do catálogo: {ex.Message}");
        }
    }
}