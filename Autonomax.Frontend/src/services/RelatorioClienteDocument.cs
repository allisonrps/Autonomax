using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Autonomax.Backend.DTOs;

public class RelatorioClienteDocument : IDocument
{
    private readonly RelatorioClienteDto _dados;
    private readonly string _corPrincipal = "#059669"; // Verde Esmeralda

    public RelatorioClienteDocument(RelatorioClienteDto dados) => _dados = dados;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(40);
            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().AlignCenter().Text(x => x.CurrentPageNumber());
        });
    }

    void ComposeHeader(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text("AUTONOMAX").FontSize(24).ExtraBold().FontColor(_corPrincipal);
                col.Item().Text("Relatório Financeiro Detalhado").FontSize(10).SemiBold().FontColor(Colors.Grey.Medium);
            });

            row.RelativeItem().AlignRight().Column(col =>
            {
                col.Item().Text($"Gerado em: {DateTime.Now:dd/MM/yyyy}").FontSize(9);
                col.Item().Text($"Status: Consolidado").FontSize(9).FontColor(_corPrincipal).Bold();
            });
        });
    }

    void ComposeContent(IContainer container)
    {
        container.PaddingVertical(20).Column(column =>
        {
            // CARD DE DADOS DO CLIENTE
            column.Item().Background(Colors.Grey.Lighten4).Padding(15).Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("DADOS DO CLIENTE").FontSize(8).Bold().FontColor(Colors.Grey.Darken2);
                    col.Item().Text(_dados.NomeCliente).FontSize(16).Black();
                    col.Item().Text(_dados.Celular).FontSize(10);
                });

                row.RelativeItem().AlignRight().Column(col =>
                {
                    col.Item().Text("FATURAMENTO NO PERÍODO").FontSize(8).Bold().FontColor(Colors.Grey.Darken2);
                    col.Item().Text($"R$ {_dados.FaturamentoTotal:N2}").FontSize(18).ExtraBold().FontColor(_corPrincipal);
                });
            });

            column.Item().PaddingTop(25).Text("HISTÓRICO DE LANÇAMENTOS").FontSize(10).ExtraBold();

            // TABELA ESTILIZADA
            column.Item().PaddingTop(10).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(80); // Data
                    columns.RelativeColumn();   // Descrição
                    columns.ConstantColumn(100); // Valor
                });

                // Cabeçalho da Tabela
                table.Header(header =>
                {
                    header.Cell().Element(CellStyle).Text("DATA");
                    header.Cell().Element(CellStyle).Text("DESCRIÇÃO");
                    header.Cell().Element(CellStyle).AlignRight().Text("VALOR");

                    static IContainer CellStyle(IContainer container)
                    {
                        return container.DefaultTextStyle(x => x.SemiBold().FontColor(Colors.White))
                                        .PaddingVertical(5).PaddingHorizontal(10)
                                        .Background("#10b981"); // Verde um pouco mais claro
                    }
                });

                // Linhas da Tabela
                foreach (var item in _dados.Transacoes)
                {
                    table.Cell().Element(Block).Text(item.Data.ToString("dd/MM/yyyy"));
                    table.Cell().Element(Block).Text(item.Descricao);
                    table.Cell().Element(Block).AlignRight().Text($"R$ {item.Valor:N2}");

                    // Estilo zebrado (cinza claro em linhas pares)
                    IContainer Block(IContainer container)
                    {
                        var index = _dados.Transacoes.IndexOf(item);
                        var background = index % 2 == 0 ? Colors.White : Colors.Grey.Lighten5;
                        return container.Background(background).PaddingVertical(5).PaddingHorizontal(10).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3);
                    }
                }
            });
        });
    }
}