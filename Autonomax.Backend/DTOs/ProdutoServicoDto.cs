using System.ComponentModel.DataAnnotations;

namespace Autonomax.Backend.DTOs;

public class ProdutoServicoCreateDto
{
    [Required(ErrorMessage = "O nome do item é obrigatório.")]
    [StringLength(100)]
    public string Nome { get; set; } = string.Empty;

    public string? Descricao { get; set; }

    [Range(0.01, 9999999.99, ErrorMessage = "O preço deve ser maior que zero.")]
    public decimal Preco { get; set; }

    public bool EhServico { get; set; } = false;

    [Required]
    public int NegocioId { get; set; }
}

public class ProdutoServicoUpdateDto
{
    [Required(ErrorMessage = "O nome do item é obrigatório.")]
    [StringLength(100)]
    public string Nome { get; set; } = string.Empty;

    public string? Descricao { get; set; }

    [Range(0.01, 9999999.99, ErrorMessage = "O preço deve ser maior que zero.")]
    public decimal Preco { get; set; }

    public bool EhServico { get; set; } = false;
}