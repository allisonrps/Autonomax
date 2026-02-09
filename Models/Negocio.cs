using System.ComponentModel.DataAnnotations;

public class Negocio
{
public int Id { get; set; }

    [Required(ErrorMessage = "O nome do negócio é obrigatório.")]
    [StringLength(50, ErrorMessage = "O nome do negócio não pode ultrapassar 50 caracteres.")]
    public string Nome { get; set; } = string.Empty;

    [Required]
    public int UsuarioId { get; set; }
}