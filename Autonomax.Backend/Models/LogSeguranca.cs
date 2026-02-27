namespace Autonomax.Backend.Models;

public class LogSeguranca
{
    public int Id { get; set; }
    public string Evento { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string? EmailAlvo { get; set; }
    public string? IpOrigem { get; set; }
    public DateTime Data { get; set; } = DateTime.UtcNow;
    public int? UsuarioId { get; set; }
}