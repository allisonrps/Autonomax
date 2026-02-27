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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Transacao>()
        .Property(t => t.Valor)
        .HasPrecision(18, 2);

    modelBuilder.Entity<ProdutoServico>()
        .Property(p => p.Preco)
        .HasPrecision(18, 2);
}

}