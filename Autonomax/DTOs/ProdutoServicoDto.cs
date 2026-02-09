using System.ComponentModel.DataAnnotations;

namespace Autonomax.DTOs;

public class ProdutoServicoCreateDto
{
    [Required(ErrorMessage = "O nome do item é obrigatório.")]
    [StringLength(100)]
    public string Nome { get; set; } = string.Empty;

    [Range(0.01, 99999.99, ErrorMessage = "O preço deve ser maior que zero.")]
    public decimal Preco { get; set; }

    [Required]
    public int NegocioId { get; set; }
}