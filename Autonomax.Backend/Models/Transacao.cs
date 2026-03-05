using System.ComponentModel.DataAnnotations;

namespace Autonomax.Backend.Models;

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
    public string Tipo { get; set; } = "Entrada"; 

    public DateTime Data { get; set; } = DateTime.Now;

    [Required]
    public int NegocioId { get; set; }

    public int? ClienteId { get; set; } // Opcional, pois Saídas podem não ter cliente

    public Cliente? Cliente { get; set; }

    public string Status { get; set; } = "Pendente";
public string MetodoPagamento { get; set; } = "Pix";
    // Relacionamento: Uma transação tem muitos itens
    public List<ItemTransacao> Itens { get; set; } = new List<ItemTransacao>();
public int? FornecedorId { get; set; }
public Fornecedor? Fornecedor { get; set; }

}