namespace Autonomax.Backend.DTOs
{
    public class RelatorioClienteDto
    {
        public string NomeCliente { get; set; } = string.Empty;
        public string Celular { get; set; } = string.Empty;
        public decimal FaturamentoTotal { get; set; }
        public List<TransacaoItemDto> Transacoes { get; set; } = new();
    }

    public class TransacaoItemDto
    {
        public DateTime Data { get; set; }
        public string Descricao { get; set; } = string.Empty;
        public decimal Valor { get; set; }
    }
}