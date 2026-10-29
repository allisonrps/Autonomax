using Autonomax.Backend.Models;
using Microsoft.EntityFrameworkCore; 

namespace Autonomax.Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Negocio> Negocios { get; set; }
    public DbSet<Transacao> Transacoes { get; set; }
    public DbSet<ProdutoServico> ProdutosServicos { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<ItemTransacao> ItensTransacao { get; set; }
    public DbSet<LogSeguranca> LogsSeguranca { get; set; }
    public DbSet<Fornecedor> Fornecedores { get; set; }
    public DbSet<HistoricoPrecoProduto> HistoricoPrecosProdutos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- PRECISÃO DECIMAL ---
        modelBuilder.Entity<Transacao>()
            .Property(t => t.Valor)
            .HasPrecision(18, 2);

        modelBuilder.Entity<ProdutoServico>()
            .Property(p => p.Preco)
            .HasPrecision(18, 2);

        modelBuilder.Entity<HistoricoPrecoProduto>()
            .Property(h => h.PrecoAntigo)
            .HasPrecision(18, 2);

        modelBuilder.Entity<HistoricoPrecoProduto>()
            .Property(h => h.PrecoNovo)
            .HasPrecision(18, 2);

        // --- ÍNDICES E PERFORMANCE ---
        // 1. Usuários: Busca rápida por e-mail no Login e garantia de unicidade
        modelBuilder.Entity<Usuario>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // 2. Negócios: Busca por usuário proprietário
        modelBuilder.Entity<Negocio>()
            .HasIndex(n => n.UsuarioId);

        // 3. Transações: Índice composto para Dashboard, Fluxo de Caixa e filtros temporais
        modelBuilder.Entity<Transacao>()
            .HasIndex(t => new { t.NegocioId, t.Data });

        modelBuilder.Entity<Transacao>()
            .HasIndex(t => t.ClienteId);

        modelBuilder.Entity<Transacao>()
            .HasIndex(t => t.FornecedorId);

        // 4. Itens de Transação: Otimiza os Includes nas vendas
        modelBuilder.Entity<ItemTransacao>()
            .HasIndex(i => i.TransacaoId);

        // 5. Clientes e Fornecedores: Listagens por negócio
        modelBuilder.Entity<Cliente>()
            .HasIndex(c => c.NegocioId);

        modelBuilder.Entity<Fornecedor>()
            .HasIndex(f => f.NegocioId);

        // 6. Produtos e Serviços: Catálogo por negócio
        modelBuilder.Entity<ProdutoServico>()
            .HasIndex(p => p.NegocioId);

        // 7. Histórico de Preços
        modelBuilder.Entity<HistoricoPrecoProduto>()
            .HasIndex(h => h.ProdutoServicoId);

        modelBuilder.Entity<HistoricoPrecoProduto>()
            .HasIndex(h => h.NegocioId);

        // 8. Logs de Segurança: Auditoria por usuário e data
        modelBuilder.Entity<LogSeguranca>()
            .HasIndex(l => new { l.UsuarioId, l.Data });
    }
}
