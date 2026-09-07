namespace Autonomax.Backend.Models;

public class HistoricoPrecoProduto
{
    public int Id { get; set; }
    public int ProdutoServicoId { get; set; }
    public decimal PrecoAntigo { get; set; }
    public decimal PrecoNovo { get; set; }
    public DateTime DataAlteracao { get; set; } = DateTime.UtcNow;
    public string? Motivo { get; set; }
    public int NegocioId { get; set; }

    // Propriedade de navegação
    public ProdutoServico? ProdutoServico { get; set; }
}
