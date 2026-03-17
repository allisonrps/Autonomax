namespace Autonomax.Backend.DTOs;

public class FluxoCaixaDto
{
    public string Periodo { get; set; } = string.Empty;
    public decimal TotalEntradas { get; set; }
    public decimal TotalSaidas { get; set; }
    public decimal SaldoFinal { get; set; }
    public List<FluxoItemDto> Lancamentos { get; set; } = new();
}

public class FluxoItemDto
{
    public DateTime Data { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public string Parceiro { get; set; } = string.Empty; // Nome do Cliente ou Fornecedor
    public string Tipo { get; set; } = string.Empty; 
    public string Status { get; set; } = string.Empty; // Pago ou Pendente
    public string MetodoPagamento { get; set; } = string.Empty;
    public decimal Valor { get; set; }
}