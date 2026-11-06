using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Autonomax.Backend.Data;
using Autonomax.Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Autonomax.Backend.Security;

namespace Autonomax.Backend.Controllers;

[Authorize] 
[ApiController]
[Route("api/[controller]")]
public class NegociosController : ControllerBase
{
    private readonly AppDbContext _context;

    public NegociosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Negocio>>> GetMeusNegocios()
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        return await _context.Negocios
            .AsNoTracking()
            .Where(n => n.UsuarioId == usuarioId.Value)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Negocio>> GetNegocio(int id)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        var negocio = await _context.Negocios
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId.Value);

        if (negocio == null) return NotFound("Negócio não encontrado.");

        return negocio;
    }

    [HttpPost]
    public async Task<ActionResult<Negocio>> PostNegocio(Negocio negocio)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        negocio.UsuarioId = usuarioId.Value;

        _context.Negocios.Add(negocio);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNegocio), new { id = negocio.Id }, negocio);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutNegocio(int id, Negocio negocio)
    {
        if (id != negocio.Id) return BadRequest("IDs não coincidem.");

        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        var negocioOriginal = await _context.Negocios
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId.Value);

        if (negocioOriginal == null) return NotFound("Permissão negada.");

        negocio.UsuarioId = usuarioId.Value;
        _context.Entry(negocio).State = EntityState.Modified;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNegocio(int id)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        var negocio = await _context.Negocios
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId.Value);

        if (negocio == null) return NotFound();

        _context.Negocios.Remove(negocio);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/limpar-dados")]
    public async Task<IActionResult> LimparDados(int id)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        var negocio = await _context.Negocios
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId.Value);

        if (negocio == null) return NotFound("Negócio não encontrado ou sem permissão.");

        await ExecutarLimpezaDadosNegocio(id);

        return Ok(new { mensagem = $"Todos os dados da unidade '{negocio.Nome}' foram apagados com sucesso! A unidade está 100% limpa." });
    }

    private async Task ExecutarLimpezaDadosNegocio(int negocioId)
    {
        var transacoesAntigas = await _context.Transacoes.Where(t => t.NegocioId == negocioId).ToListAsync();
        var transacaoIds = transacoesAntigas.Select(t => t.Id).ToList();
        var itensAntigos = await _context.ItensTransacao.Where(i => transacaoIds.Contains(i.TransacaoId)).ToListAsync();
        _context.ItensTransacao.RemoveRange(itensAntigos);
        _context.Transacoes.RemoveRange(transacoesAntigas);

        var produtosAntigos = await _context.ProdutosServicos.Where(p => p.NegocioId == negocioId).ToListAsync();
        _context.ProdutosServicos.RemoveRange(produtosAntigos);

        var fornecedoresAntigos = await _context.Fornecedores.Where(f => f.NegocioId == negocioId).ToListAsync();
        _context.Fornecedores.RemoveRange(fornecedoresAntigos);

        var clientesAntigos = await _context.Clientes.Where(c => c.NegocioId == negocioId).ToListAsync();
        _context.Clientes.RemoveRange(clientesAntigos);

        await _context.SaveChangesAsync();
    }

    [HttpPost("{id}/popular-demonstracao")]
    public async Task<IActionResult> PopularDemonstracao(int id, [FromQuery] string? novoNome = null)
    {
        var usuarioId = this.ObterUsuarioIdAutenticado();
        if (!usuarioId.HasValue) return Unauthorized();

        var negocio = await _context.Negocios
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == usuarioId.Value);

        if (negocio == null) return NotFound("Negócio não encontrado ou sem permissão.");

        if (!string.IsNullOrWhiteSpace(novoNome))
        {
            negocio.Nome = novoNome.Trim();
        }

        // 1. Limpa registros anteriores para NUNCA duplicar dados
        await ExecutarLimpezaDadosNegocio(id);

        // 2. Insere Catálogo de Produtos e Serviços
        var produtos = new List<ProdutoServico>
        {
            // Serviços
            new() { Nome = "Corte Degradê & Barboterapia", Categoria = "Cabelo & Barba", Preco = 85.00m, EhServico = true, NegocioId = id },
            new() { Nome = "Barba Tradicional com Toalha Quente", Categoria = "Barba", Preco = 45.00m, EhServico = true, NegocioId = id },
            new() { Nome = "Corte Clássico na Tesoura", Categoria = "Cabelo", Preco = 70.00m, EhServico = true, NegocioId = id },
            new() { Nome = "Selagem & Alinhamento Térmico", Categoria = "Tratamento", Preco = 130.00m, EhServico = true, NegocioId = id },
            new() { Nome = "Hidratação Capilar Profunda", Categoria = "Tratamento", Preco = 55.00m, EhServico = true, NegocioId = id },
            new() { Nome = "Dia do Noivo Premium", Categoria = "Pacotes", Preco = 380.00m, EhServico = true, NegocioId = id },
            
            // Produtos
            new() { Nome = "Pomada Modeladora Efeito Matte 150g", Categoria = "Finalizadores", Preco = 49.90m, EhServico = false, NegocioId = id },
            new() { Nome = "Óleo Hidratante de Barba 30ml", Categoria = "Cuidados com a Barba", Preco = 42.00m, EhServico = false, NegocioId = id },
            new() { Nome = "Shampoo Anticaspa & Fortalecedor 250ml", Categoria = "Higiene & Cuidado", Preco = 38.50m, EhServico = false, NegocioId = id },
            new() { Nome = "Balm Pós-Barba Refrescante 120ml", Categoria = "Cuidados com a Barba", Preco = 35.00m, EhServico = false, NegocioId = id },
            new() { Nome = "Cerveja Artesanal IPA 500ml", Categoria = "Bebidas", Preco = 18.00m, EhServico = false, NegocioId = id },
            new() { Nome = "Camiseta Oficial Urban Barber", Categoria = "Vestuário", Preco = 89.90m, EhServico = false, NegocioId = id }
        };
        _context.ProdutosServicos.AddRange(produtos);
        await _context.SaveChangesAsync();

        // 3. Insere Parceiros / Fornecedores
        var fornecedores = new List<Fornecedor>
        {
            new() { Nome = "Cosméticos Pro Distribuidora", Telefone = "(19) 98122-3344", Categoria = "Insumos & Cosméticos", Observacoes = "Pomadas, óleos e lâminas", NegocioId = id },
            new() { Nome = "Distribuidora de Bebidas Prime", Telefone = "(19) 98765-4321", Categoria = "Bebidas & Mercearia", Observacoes = "Cervejas artesanais e refrigerantes", NegocioId = id },
            new() { Nome = "Imobiliária Central - Aluguel", Telefone = "(19) 3234-5678", Categoria = "Aluguel & Condomínio", Observacoes = "Ponto comercial central", NegocioId = id },
            new() { Nome = "CPFL Energia Elétrica", Telefone = "0800 010 1010", Categoria = "Energia & Utilidades", Observacoes = "Energia elétrica comercial", NegocioId = id },
            new() { Nome = "Agência Impulso - Marketing", Telefone = "(19) 99888-7766", Categoria = "Marketing & Anúncios", Observacoes = "Tráfego pago Instagram/Google", NegocioId = id },
            new() { Nome = "Sistema de Automação & Telecom", Telefone = "0800 700 8090", Categoria = "Software & Internet", Observacoes = "Internet fibra e software", NegocioId = id }
        };
        _context.Fornecedores.AddRange(fornecedores);
        await _context.SaveChangesAsync();

        // 4. Insere Clientes com Cidades e Tags variadas
        var clientes = new List<Cliente>
        {
            new() { Nome = "Lucas Silveira", Celular = "19981234567", Endereco = "Rua Barão de Jaguara, 420", Cidade = "Campinas", Estado = "SP", Tags = "VIP, Recorrente, Cabelo", NegocioId = id },
            new() { Nome = "Matheus Henrique", Celular = "19982345678", Endereco = "Av. Brasil, 890", Cidade = "Campinas", Estado = "SP", Tags = "Recorrente, Barba", NegocioId = id },
            new() { Nome = "Gabriel Souza", Celular = "19983456789", Endereco = "Av. José Paulino, 150", Cidade = "Paulínia", Estado = "SP", Tags = "VIP, Corporativo", NegocioId = id },
            new() { Nome = "Rodrigo Almeida", Celular = "19984567890", Endereco = "Rua Doze de Outubro, 33", Cidade = "Valinhos", Estado = "SP", Tags = "Recorrente, Cabelo", NegocioId = id },
            new() { Nome = "Bruno Castro", Celular = "19985678901", Endereco = "Av. Rebouças, 1200", Cidade = "Sumaré", Estado = "SP", Tags = "NovoCliente, Indicação", NegocioId = id },
            new() { Nome = "Felipe Martins", Celular = "19986789012", Endereco = "Rua Candelária, 540", Cidade = "Indaiatuba", Estado = "SP", Tags = "VIP, DiaDoNoivo", NegocioId = id },
            new() { Nome = "Rafael Barbosa", Celular = "19987890123", Endereco = "Rua Sacramento, 210", Cidade = "Campinas", Estado = "SP", Tags = "Recorrente, Barba", NegocioId = id },
            new() { Nome = "Thiago Mendes", Celular = "19988901234", Endereco = "Rua Santa Cruz, 88", Cidade = "Paulínia", Estado = "SP", Tags = "Corporativo, Produtos", NegocioId = id },
            new() { Nome = "Leonardo Duarte", Celular = "19989012345", Endereco = "Av. Independência, 412", Cidade = "Valinhos", Estado = "SP", Tags = "VIP, Recorrente", NegocioId = id },
            new() { Nome = "Daniel Nogueira", Celular = "19990123456", Endereco = "Rua Nove de Julho, 75", Cidade = "Vinhedo", Estado = "SP", Tags = "Recorrente, Cabelo", NegocioId = id },
            new() { Nome = "Eduardo Ramos", Celular = "19991234567", Endereco = "Av. Orosimbo Maia, 610", Cidade = "Campinas", Estado = "SP", Tags = "NovoCliente", NegocioId = id },
            new() { Nome = "André Vieira", Celular = "19992345678", Endereco = "Rua Conceição, 305", Cidade = "Campinas", Estado = "SP", Tags = "VIP, Recorrente", NegocioId = id },
            new() { Nome = "Gustavo Pires", Celular = "19993456789", Endereco = "Rua Dom Barreto, 91", Cidade = "Sumaré", Estado = "SP", Tags = "Recorrente", NegocioId = id },
            new() { Nome = "Vinícius Lopes", Celular = "19994567890", Endereco = "Av. Francisco de Paula Leite, 1020", Cidade = "Indaiatuba", Estado = "SP", Tags = "Corporativo", NegocioId = id },
            new() { Nome = "Marcelo Campos", Celular = "19995678901", Endereco = "Rua Presidente Vargas, 340", Cidade = "Paulínia", Estado = "SP", Tags = "VIP, Cabelo", NegocioId = id }
        };
        _context.Clientes.AddRange(clientes);
        await _context.SaveChangesAsync();

        // 5. Gera Histórico Financeiro Completo de 2026 (Janeiro a Novembro)
        var transacoes = new List<Transacao>();
        var random = new Random(42); // Seed fixa para consistência dos gráficos

        var metodosPagamento = new[] { "Pix", "Cartão de Crédito", "Cartão de Débito", "Dinheiro" };
        var pesosPagamento = new[] { 0.52, 0.28, 0.14, 0.06 };

        int anoAtual = DateTime.Now.Year;
        int mesAtual = DateTime.Now.Month;
        int diaHoje = Math.Min(DateTime.Now.Day, 28);

        for (int mes = 1; mes <= mesAtual; mes++)
        {
            // --- A) DESPESAS MENSAIS DO NEGÓCIO (~R$ 3.000/mês) ---
            // 1. Aluguel Salão Comercial (dia 5)
            transacoes.Add(new Transacao
            {
                Descricao = "Aluguel Salão Comercial",
                Valor = 1500.00m,
                Tipo = "Saida",
                Data = new DateTime(anoAtual, mes, 5, 10, 0, 0),
                NegocioId = id,
                FornecedorId = fornecedores[2].Id,
                Status = "Pago",
                MetodoPagamento = "Pix"
            });

            // 2. CPFL Energia Elétrica (dia 10)
            transacoes.Add(new Transacao
            {
                Descricao = "Conta de Energia Elétrica",
                Valor = Math.Round((decimal)(240 + random.Next(20, 60)), 2),
                Tipo = "Saida",
                Data = new DateTime(anoAtual, mes, 10, 11, 30, 0),
                NegocioId = id,
                FornecedorId = fornecedores[3].Id,
                Status = "Pago",
                MetodoPagamento = "Pix"
            });

            // 3. Internet Fibra Óptica (dia 12)
            transacoes.Add(new Transacao
            {
                Descricao = "Internet Fibra Óptica Comercial",
                Valor = 129.90m,
                Tipo = "Saida",
                Data = new DateTime(anoAtual, mes, 12, 9, 15, 0),
                NegocioId = id,
                FornecedorId = fornecedores[5].Id,
                Status = "Pago",
                MetodoPagamento = "Cartão de Crédito"
            });

            // 4. Marketing & Tráfego Pago (dia 15)
            transacoes.Add(new Transacao
            {
                Descricao = "Campanhas Meta Ads & Google",
                Valor = Math.Round((decimal)(280 + random.Next(0, 80)), 2),
                Tipo = "Saida",
                Data = new DateTime(anoAtual, mes, 15, 14, 0, 0),
                NegocioId = id,
                FornecedorId = fornecedores[4].Id,
                Status = "Pago",
                MetodoPagamento = "Cartão de Crédito"
            });

            // 5. Insumos & Cosméticos (dia 18)
            transacoes.Add(new Transacao
            {
                Descricao = "Reposição de Pomadas, Óleos e Lâminas",
                Valor = Math.Round((decimal)(580 + random.Next(40, 140)), 2),
                Tipo = "Saida",
                Data = new DateTime(anoAtual, mes, 18, 16, 20, 0),
                NegocioId = id,
                FornecedorId = fornecedores[0].Id,
                Status = "Pago",
                MetodoPagamento = "Pix"
            });

            // 6. Bebidas & Frigobar (dia 22)
            transacoes.Add(new Transacao
            {
                Descricao = "Reposição Cervejas Artesanais e Bebidas",
                Valor = Math.Round((decimal)(220 + random.Next(20, 80)), 2),
                Tipo = "Saida",
                Data = new DateTime(anoAtual, mes, 22, 15, 0, 0),
                NegocioId = id,
                FornecedorId = fornecedores[1].Id,
                Status = "Pago",
                MetodoPagamento = "Pix"
            });

            // --- B) ENTRADAS / ATENDIMENTOS DE CLIENTES (SUPERIOR ÀS DESPESAS: ~R$ 9.000 a R$ 13.000/MÊS) ---
            int maxDias = mes == mesAtual ? diaHoje : 28;
            int totalVendasMes = mes == mesAtual ? Math.Max(25, (diaHoje * 4)) : random.Next(75, 95);

            for (int v = 0; v < totalVendasMes; v++)
            {
                int diaVenda = Math.Min(maxDias, random.Next(1, maxDias + 1));
                var cliente = clientes[random.Next(clientes.Count)];

                // Escolhe de 1 a 2 itens do catálogo
                var prod1 = produtos[random.Next(produtos.Count)];
                var temSegundoItem = random.NextDouble() > 0.45;
                var prod2 = temSegundoItem ? produtos[random.Next(produtos.Count)] : null;

                decimal valorTotal = prod1.Preco + (prod2?.Preco ?? 0m);

                // Método de pagamento ponderado
                double rP = random.NextDouble();
                string metodo = "Pix";
                if (rP > 0.82) metodo = "Cartão de Crédito";
                else if (rP > 0.65) metodo = "Cartão de Débito";
                else if (rP > 0.55) metodo = "Dinheiro";

                // Status: 96% Pago, 4% Pendente
                string statusPagamento = random.NextDouble() > 0.04 ? "Pago" : "Pendente";

                var transacaoEntrada = new Transacao
                {
                    Descricao = $"Atendimento: {prod1.Nome}" + (prod2 != null ? $" + {prod2.Nome}" : ""),
                    Valor = valorTotal,
                    Desconto = (random.NextDouble() > 0.90) ? 10.00m : 0.0m,
                    Tipo = "Entrada",
                    Data = new DateTime(anoAtual, mes, diaVenda, random.Next(9, 20), random.Next(0, 59), 0),
                    NegocioId = id,
                    ClienteId = cliente.Id,
                    Status = statusPagamento,
                    MetodoPagamento = metodo,
                    Itens = new List<ItemTransacao>
                    {
                        new() { Nome = prod1.Nome, Quantidade = 1 }
                    }
                };

                if (prod2 != null)
                {
                    transacaoEntrada.Itens.Add(new ItemTransacao { Nome = prod2.Nome, Quantidade = 1 });
                }

                transacoes.Add(transacaoEntrada);
            }

            // Se for o mês atual, garante pelo menos 4 vendas no dia de HOJE para o Dashboard abrir positivo
            if (mes == mesAtual)
            {
                var vendasHoje = new[]
                {
                    new { Prod = produtos[0], Hora = 9, Min = 30, Metodo = "Pix" },
                    new { Prod = produtos[1], Hora = 11, Min = 15, Metodo = "Cartão de Crédito" },
                    new { Prod = produtos[2], Hora = 14, Min = 40, Metodo = "Cartão de Débito" },
                    new { Prod = produtos[3], Hora = 17, Min = 20, Metodo = "Pix" }
                };

                foreach (var vh in vendasHoje)
                {
                    var clienteHoje = clientes[random.Next(clientes.Count)];
                    transacoes.Add(new Transacao
                    {
                        Descricao = $"Atendimento: {vh.Prod.Nome}",
                        Valor = vh.Prod.Preco,
                        Tipo = "Entrada",
                        Data = new DateTime(anoAtual, mesAtual, diaHoje, vh.Hora, vh.Min, 0),
                        NegocioId = id,
                        ClienteId = clienteHoje.Id,
                        Status = "Pago",
                        MetodoPagamento = vh.Metodo,
                        Itens = new List<ItemTransacao>
                        {
                            new() { Nome = vh.Prod.Nome, Quantidade = 1 }
                        }
                    });
                }
            }
        }

        _context.Transacoes.AddRange(transacoes);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            mensagem = $"Unidade '{negocio.Nome}' populada com sucesso! Histórico gerado com saldo positivo saudável.",
            negocioId = id,
            nomeNegocio = negocio.Nome,
            produtosCriados = produtos.Count,
            fornecedoresCriados = fornecedores.Count,
            clientesCriados = clientes.Count,
            transacoesCriadas = transacoes.Count
        });
    }
}