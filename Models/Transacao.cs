namespace Autonomax.Models;

public class Transacao
{
    public int Id { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public DateTime Data { get; set; } = DateTime.Now;
    public string Tipo { get; set; } = "Entrada"; // "Entrada" ou "Saida"
    public int NegocioId { get; set; }

    // Opcional: Relacionar com um cliente
    public int? ClienteId { get; set; }
}