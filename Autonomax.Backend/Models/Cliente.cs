namespace Autonomax.Backend.Models;

public class Cliente
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Celular { get; set; }
    public string? Endereco { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public string? Observacoes { get; set; } // Nullable pois é opcional
    public int NegocioId { get; set; }
    public List<Transacao> Transacoes { get; set; } = new();
}