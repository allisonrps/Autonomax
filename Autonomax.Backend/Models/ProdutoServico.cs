namespace Autonomax.Backend.Models;

public class ProdutoServico
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public string? Categoria { get; set; } // Tag / Categoria para classificação
    public decimal Preco { get; set; }
    public bool EhServico { get; set; } // True para Serviço, False para Produto
    public int NegocioId { get; set; }
}