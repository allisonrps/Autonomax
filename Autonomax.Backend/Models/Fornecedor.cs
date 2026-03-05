using System.ComponentModel.DataAnnotations;

namespace Autonomax.Backend.Models;

public class Fornecedor
{
    public int Id { get; set; }
    
    [Required]
    public string Nome { get; set; } = string.Empty;
    
    public string? Telefone { get; set; }
    
    public string? Categoria { get; set; } 
    
    public string? Observacoes { get; set; }
    
    [Required]
    public int NegocioId { get; set; }
    
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
}