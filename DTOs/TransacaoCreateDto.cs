using System.ComponentModel.DataAnnotations;

namespace Autonomax.DTOs;

public class TransacaoCreateDto
{
    [Required(ErrorMessage = "A descrição é obrigatória.")]
    [StringLength(100, ErrorMessage = "A descrição deve ter no máximo 100 caracteres.")]
    public string Descricao { get; set; } = string.Empty;

    [Required(ErrorMessage = "O valor é obrigatório.")]
    [Range(0.01, 9999999.99, ErrorMessage = "O valor deve ser maior que zero.")]
    public decimal Valor { get; set; }

    [Required(ErrorMessage = "O tipo (Entrada ou Saida) é obrigatório.")]
    [RegularExpression("^(Entrada|Saida)$", ErrorMessage = "O tipo deve ser 'Entrada' ou 'Saida'.")]
    public string Tipo { get; set; } = string.Empty;

    [Required(ErrorMessage = "O ID do negócio é necessário.")]
    public int NegocioId { get; set; }

    // Opcional: O ID do cliente só é obrigatório se for uma 'Entrada' (venda)
    public int? ClienteId { get; set; }
}