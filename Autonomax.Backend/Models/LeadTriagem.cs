namespace Autonomax.Backend.Models;

public class LeadTriagem
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Telefone { get; set; }
    public string? Endereco { get; set; }
    public string? Bairro { get; set; }
    public string Cidade { get; set; } = string.Empty;
    public string Estado { get; set; } = "SP";
    public string? Categoria { get; set; }
    public string? GoogleMapsUrl { get; set; }
    public string? Site { get; set; }
    public string Origem { get; set; } = "Google Maps";
    public double? Avaliacao { get; set; }
    public int? TotalAvaliacoes { get; set; }
    public string Status { get; set; } = "Novo"; // "Novo", "Contatado", "Negociando", "SemInteresse", "Convertido"
    public string? Observacoes { get; set; }
    public DateTime DataCaptura { get; set; } = DateTime.UtcNow;
    public DateTime? DataUltimoContato { get; set; }
    public int NegocioId { get; set; }
}
