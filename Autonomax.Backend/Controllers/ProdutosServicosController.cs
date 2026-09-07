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
        try
        {
            await SincronizarItensDoHistoricoInternoAsync(_context, negocioId);

            var itens = await _context.ProdutosServicos
                .Where(p => p.NegocioId == negocioId)
                .OrderBy(p => p.Nome)
                .ToListAsync();

            return Ok(itens);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro em GetPorNegocio: {ex.Message}");
            return Ok(new List<ProdutoServico>());
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProdutoServico>> GetById(int id)
    {
        var item = await _context.ProdutosServicos.FindAsync(id);
        return item == null ? NotFound() : item;
    }

    [HttpGet("{id}/detalhes")]
    public async Task<IActionResult> GetDetalhes(int id, [FromQuery] int negocioId, [FromQuery] int? ano)
    {
        var produto = await _context.ProdutosServicos.FindAsync(id);
        if (produto == null) return NotFound(new { message = "Produto ou serviço não encontrado." });

        int anoAlvo = ano ?? DateTime.Now.Year;

        var todasTransacoes = await _context.Transacoes
            .Include(t => t.Cliente)
            .Include(t => t.Itens)
            .Where(t => t.NegocioId == negocioId && t.Tipo != "Saida" && t.Tipo != "Saída" && t.Tipo != "Despesa")
            .ToListAsync();

        var nomeProduto = produto.Nome.Trim();
        var regexQtd = new System.Text.RegularExpressions.Regex(
            @"(?:(\d+)\s*[xX*]\s*)?" + System.Text.RegularExpressions.Regex.Escape(nomeProduto), 
            System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.Compiled
        );

        var transacoesVinculadas = new List<object>();
        decimal totalFaturado = 0;
        int quantidadeTotal = 0;
        DateTime? ultimaData = null;

        var faturamentoPorMes = new decimal[12];
        var quantidadePorMes = new int[12];

        foreach (var t in todasTransacoes)
        {
            bool vinculado = false;
            int qtdNestaTransacao = 0;

            // 1. Verifica itens na tabela ItensTransacao
            if (t.Itens != null && t.Itens.Count > 0)
            {
                var itensCorrespondentes = t.Itens
                    .Where(it => it.Nome.Trim().Equals(nomeProduto, StringComparison.OrdinalIgnoreCase))
                    .ToList();

                if (itensCorrespondentes.Count > 0)
                {
                    vinculado = true;
                    qtdNestaTransacao = itensCorrespondentes.Sum(it => it.Quantidade > 0 ? it.Quantidade : 1);
                }
            }

            // 2. Verifica descrição textual se não vinculado ainda
            if (!vinculado && !string.IsNullOrWhiteSpace(t.Descricao))
            {
                var match = regexQtd.Match(t.Descricao);
                if (match.Success)
                {
                    vinculado = true;
                    var qtdStr = match.Groups[1].Value;
                    if (!string.IsNullOrEmpty(qtdStr) && int.TryParse(qtdStr, out var qParsed))
                    {
                        qtdNestaTransacao = qParsed > 0 ? qParsed : 1;
                    }
                    else
                    {
                        qtdNestaTransacao = 1;
                    }
                }
            }

            if (vinculado)
            {
                totalFaturado += t.Valor;
                quantidadeTotal += qtdNestaTransacao;

                if (ultimaData == null || t.Data > ultimaData)
                {
                    ultimaData = t.Data;
                }

                if (t.Data.Year == anoAlvo)
                {
                    int mesIdx = t.Data.Month - 1;
                    if (mesIdx >= 0 && mesIdx < 12)
                    {
                        faturamentoPorMes[mesIdx] += t.Valor;
                        quantidadePorMes[mesIdx] += qtdNestaTransacao;
                    }
                }

                transacoesVinculadas.Add(new
                {
                    id = t.Id,
                    descricao = t.Descricao,
                    valor = t.Valor,
                    tipo = t.Tipo,
                    status = t.Status,
                    metodoPagamento = t.MetodoPagamento,
                    data = t.Data.ToString("yyyy-MM-ddTHH:mm:ss"),
                    cliente = t.Cliente != null ? new { id = t.Cliente.Id, nome = t.Cliente.Nome } : null,
                    itens = t.Itens?.Select(it => new { nome = it.Nome, quantidade = it.Quantidade }).ToList(),
                    quantidadeItem = qtdNestaTransacao
                });
            }
        }

        var mesesNomes = new[] { "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez" };
        var evolucaoMensal = mesesNomes.Select((nome, idx) => new
        {
            mes = nome,
            mesNumero = idx + 1,
            faturamento = faturamentoPorMes[idx],
            quantidade = quantidadePorMes[idx]
        }).ToList();

        var qtdTransacoes = transacoesVinculadas.Count;
        decimal ticketMedio = qtdTransacoes > 0 ? Math.Round(totalFaturado / qtdTransacoes, 2) : 0;

        return Ok(new
        {
            produto,
            totalFaturado,
            quantidadeTotal,
            qtdTransacoes,
            ticketMedio,
            ultimaVenda = ultimaData?.ToString("yyyy-MM-ddTHH:mm:ss"),
            ano = anoAlvo,
            evolucaoMensal,
            transacoes = transacoesVinculadas
        });
    }

    [HttpPost]
    public async Task<ActionResult<ProdutoServico>> Post([FromBody] ProdutoServicoCreateDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                return BadRequest("O nome do item é obrigatório.");

            var item = new ProdutoServico
            {
                Nome = dto.Nome.Trim(),
                Descricao = dto.Descricao?.Trim(),
                Categoria = dto.Categoria?.Trim(),
                Preco = dto.Preco >= 0 ? dto.Preco : 0,
                EhServico = dto.EhServico,
                NegocioId = dto.NegocioId
            };

            _context.ProdutosServicos.Add(item);
            await _context.SaveChangesAsync();

            return Ok(item);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao criar produto/serviço: {ex.Message}");
            return StatusCode(500, "Erro interno ao cadastrar o item no catálogo.");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, [FromBody] ProdutoServicoUpdateDto dto)
    {
        var item = await _context.ProdutosServicos.FindAsync(id);
        if (item == null) return NotFound();

        item.Nome = dto.Nome.Trim();
        item.Descricao = dto.Descricao?.Trim();
        item.Categoria = dto.Categoria?.Trim();
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
            .Where(t => t.NegocioId == negocioId && t.Tipo != "Saida" && t.Tipo != "Saída" && t.Tipo != "Despesa")
            .ToListAsync();

        var produtosCadastrados = await _context.ProdutosServicos
            .Where(p => p.NegocioId == negocioId)
            .Select(p => p.Nome.Trim())
            .ToListAsync();

        var setCadastrados = new HashSet<string>(produtosCadastrados, StringComparer.OrdinalIgnoreCase);

        var mapaItens = new Dictionary<string, (string DisplayName, int Ocorrencias)>(StringComparer.OrdinalIgnoreCase);

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
                        dados = (nomeLimpo, 0);
                    }

                    dados.Ocorrencias += 1;
                    mapaItens[nomeLimpo] = dados;
                }
            }

            // 2. Processa descrição textual (ex: "2x CARTAZ G, 2x CARTAZ M" ou "CARTAZ M")
            if (!string.IsNullOrWhiteSpace(t.Descricao))
            {
                var nomesExtraidos = ExtrairNomesDeItens(t.Descricao);
                foreach (var nomeExtraido in nomesExtraidos)
                {
                    if (itensProcessadosNestaTransacao.Contains(nomeExtraido)) continue;

                    if (!mapaItens.TryGetValue(nomeExtraido, out var dados))
                    {
                        dados = (nomeExtraido, 0);
                    }

                    dados.Ocorrencias += 1;
                    mapaItens[nomeExtraido] = dados;
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
            var nomeLower = nome.ToLower();
            var ehServico = palavrasChaveServico.Any(p => nomeLower.Contains(p));

            return new ItemHistoricoSugestaoDto
            {
                Nome = nome,
                Ocorrencias = kvp.Value.Ocorrencias,
                PrecoSugerido = 0, // Preço zerado conforme solicitado pelo usuário
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
                Categoria = itemDto.Categoria?.Trim(),
                Preco = itemDto.Preco >= 0 ? itemDto.Preco : 0,
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
            var todasTransacoes = await context.Transacoes
                .Include(t => t.Itens)
                .Where(t => t.NegocioId == negocioId)
                .ToListAsync();

            if (todasTransacoes.Count == 0) return;

            // Separa Vendas (Receitas/Entradas) de Despesas (Saídas/Despesas)
            var transacoesVendas = todasTransacoes
                .Where(t => !t.Tipo.Equals("Saida", StringComparison.OrdinalIgnoreCase) 
                         && !t.Tipo.Equals("Saída", StringComparison.OrdinalIgnoreCase) 
                         && !t.Tipo.Equals("Despesa", StringComparison.OrdinalIgnoreCase))
                .ToList();

            var transacoesDespesas = todasTransacoes
                .Where(t => t.Tipo.Equals("Saida", StringComparison.OrdinalIgnoreCase) 
                         || t.Tipo.Equals("Saída", StringComparison.OrdinalIgnoreCase) 
                         || t.Tipo.Equals("Despesa", StringComparison.OrdinalIgnoreCase))
                .ToList();

            // Extrai itens de Vendas/Receitas
            var nomesEmVendas = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var t in transacoesVendas)
            {
                if (t.Itens != null && t.Itens.Count > 0)
                {
                    foreach (var it in t.Itens)
                    {
                        if (!string.IsNullOrWhiteSpace(it.Nome))
                        {
                            var n = it.Nome.Trim();
                            if (n.Length >= 2) nomesEmVendas.Add(n);
                        }
                    }
                }

                if (!string.IsNullOrWhiteSpace(t.Descricao))
                {
                    var extraidos = ExtrairNomesDeItens(t.Descricao);
                    foreach (var ex in extraidos)
                    {
                        if (ex.Length >= 2) nomesEmVendas.Add(ex);
                    }
                }
            }

            // Extrai itens de Despesas/Saídas
            var nomesEmDespesas = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var t in transacoesDespesas)
            {
                if (t.Itens != null && t.Itens.Count > 0)
                {
                    foreach (var it in t.Itens)
                    {
                        if (!string.IsNullOrWhiteSpace(it.Nome))
                        {
                            var n = it.Nome.Trim();
                            if (n.Length >= 2) nomesEmDespesas.Add(n);
                        }
                    }
                }

                if (!string.IsNullOrWhiteSpace(t.Descricao))
                {
                    var extraidos = ExtrairNomesDeItens(t.Descricao);
                    foreach (var ex in extraidos)
                    {
                        if (ex.Length >= 2) nomesEmDespesas.Add(ex);
                    }
                }
            }

            var produtosAtuais = await context.ProdutosServicos
                .Where(p => p.NegocioId == negocioId)
                .ToListAsync();

            // 1. Limpeza automática: remove do catálogo itens importados que pertencem a despesas e não foram vendidos
            var itensParaRemover = produtosAtuais
                .Where(p => 
                    (p.Descricao == "Importado do fluxo de caixa" || p.Preco == 0) &&
                    !nomesEmVendas.Contains(p.Nome.Trim()) &&
                    nomesEmDespesas.Contains(p.Nome.Trim())
                )
                .ToList();

            if (itensParaRemover.Count > 0)
            {
                context.ProdutosServicos.RemoveRange(itensParaRemover);
                foreach (var rem in itensParaRemover)
                {
                    produtosAtuais.Remove(rem);
                }
            }

            var setExistentes = new HashSet<string>(produtosAtuais.Select(p => p.Nome.Trim()), StringComparer.OrdinalIgnoreCase);

            var palavrasChaveServico = new[] { 
                "servico", "serviço", "consultoria", "manutencao", "manutenção", 
                "instalacao", "instalação", "visita", "hora", "formatacao", 
                "formatação", "desenvolvimento", "suporte", "limpeza", "criacao", "criação", "aula" 
            };

            var novosProdutos = new List<ProdutoServico>();

            // 2. Cadastra automaticamente no catálogo apenas os itens vendidos
            foreach (var nomeVenda in nomesEmVendas)
            {
                if (!setExistentes.Contains(nomeVenda))
                {
                    var ehServ = palavrasChaveServico.Any(p => nomeVenda.ToLower().Contains(p));

                    novosProdutos.Add(new ProdutoServico
                    {
                        Nome = nomeVenda,
                        Preco = 0,
                        EhServico = ehServ,
                        NegocioId = negocioId,
                        Descricao = "Importado do fluxo de caixa"
                    });
                    setExistentes.Add(nomeVenda);
                }
            }

            if (novosProdutos.Count > 0)
            {
                context.ProdutosServicos.AddRange(novosProdutos);
            }

            if (itensParaRemover.Count > 0 || novosProdutos.Count > 0)
            {
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro na sincronização automática do catálogo: {ex.Message}");
        }
    }

    public static List<string> ExtrairNomesDeItens(string? descricao)
    {
        var resultado = new List<string>();
        if (string.IsNullOrWhiteSpace(descricao)) return resultado;

        var partes = descricao.Split(new[] { ',', ';', '\n', '\r', '+', '/' }, StringSplitOptions.RemoveEmptyEntries);
        var regexQuantidade = new System.Text.RegularExpressions.Regex(@"^\s*(?:(\d+)\s*[xX*•-]\s*|\s*(\d+)\s+)?(.+?)\s*$", System.Text.RegularExpressions.RegexOptions.Compiled);

        foreach (var parte in partes)
        {
            var pedaco = parte.Trim();
            if (string.IsNullOrWhiteSpace(pedaco) || pedaco.Length < 2) continue;

            var match = regexQuantidade.Match(pedaco);
            string nome = match.Success ? match.Groups[3].Value.Trim() : pedaco;

            nome = System.Text.RegularExpressions.Regex.Replace(nome, @"^[\d\s*xX•\-_/]+", "").Trim();

            if (nome.Length >= 2 && !decimal.TryParse(nome, out _) && !nome.Equals("R$", StringComparison.OrdinalIgnoreCase))
            {
                resultado.Add(nome);
            }
        }

        return resultado;
    }
}