using Autonomax.Api.Models;
using Autonomax.Models;
using Microsoft.EntityFrameworkCore; // Este é o cara que o erro dizia não encontrar

namespace Autonomax.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Transacao> Transacoes { get; set; }
    public DbSet<ProdutoServico> ProdutosServicos { get; set; }
}