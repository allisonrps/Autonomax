namespace Autonomax.Backend.DTOs
{
    public class RelatorioFornecedorDto
    {
        public string NomeFornecedor { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
        public string Categoria { get; set; } = string.Empty;
        public decimal TotalGasto { get; set; }
        public List<TransacaoItemDto> Transacoes { get; set; } = new();
    }
}
