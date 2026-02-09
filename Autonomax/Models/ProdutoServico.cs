namespace Autonomax.Models;

public class ProdutoServico
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public decimal Preco { get; set; }
    public bool EhServico { get; set; } // True para Serviço (ex: Consultoria), False para Produto (ex: Teclado)
    public int NegocioId { get; set; }
}