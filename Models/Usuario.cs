using Autonomax.Models;

namespace Autonomax.Models;
public class Usuario
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty; // Nunca salve a senha pura!

    // Um usuário pode ter vários negócios
    public List<Negocio> Negocios { get; set; } = new();
}