namespace Autonomax.Api.Models;

public class Negocio
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Documento { get; set; } // O '?' indica que pode ser nulo
}