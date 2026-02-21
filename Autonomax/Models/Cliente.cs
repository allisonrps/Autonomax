namespace Autonomax.Models;

public class Cliente
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Celular { get; set; }
    public string? Endereco { get; set; }
    public string Cidade { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string? Observacoes { get; set; } // Nullable pois é opcional
    public int NegocioId { get; set; }
}