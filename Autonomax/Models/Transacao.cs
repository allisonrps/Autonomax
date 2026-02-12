using System.ComponentModel.DataAnnotations;

namespace Autonomax.Models;

public class Transacao
{
    public int Id { get; set; }

    [Required(ErrorMessage = "A descrição é obrigatória.")]
    [StringLength(200)]
    public string Descricao { get; set; } = string.Empty;

    [Required]
    [Range(0.01, 9999999.99, ErrorMessage = "O valor deve ser maior que zero.")]
    public decimal Valor { get; set; }

    [Required]
    [RegularExpression("^(Entrada|Saida)$", ErrorMessage = "O tipo deve ser 'Entrada' ou 'Saida'.")]
    public string Tipo { get; set; } = string.Empty;

    public DateTime Data { get; set; } = DateTime.Now;

    [Required]
    public int NegocioId { get; set; }

    public int? ClienteId { get; set; } // Opcional, pois Saídas podem não ter cliente

    public Cliente? Cliente { get; set; }
}