using Autonomax.Models;
using Microsoft.EntityFrameworkCore; 

namespace Autonomax.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Negocio> Negocios { get; set; }
    public DbSet<Transacao> Transacoes { get; set; }
    public DbSet<ProdutoServico> ProdutosServicos { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
}