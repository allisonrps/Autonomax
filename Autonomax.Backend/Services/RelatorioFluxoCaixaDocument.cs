using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Autonomax.Backend.DTOs;

namespace Autonomax.Backend.Services;

public class RelatorioFluxoCaixaDocument : IDocument
{
    private readonly FluxoCaixaDto _dados;
    
    // Cores
    private readonly string _primaryColor = "#059669";   // Verde (Entrada)
    private readonly string _dangerColor = "#e11d48";    // Vermelho (Saída)
    private readonly string _warningColor = "#d97706";   // Âmbar (Pendente)
    private readonly string _darkColor = "#0f172a";      // Slate 900
    private readonly string _softGrey = "#f8fafc";       // Slate 50

    public RelatorioFluxoCaixaDocument(FluxoCaixaDto dados) => _dados = dados;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(35);
            page.PageColor(Colors.White);
            page.DefaultTextStyle(x => x.FontSize(9).FontColor(_darkColor).FontFamily("Arial"));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            
            page.Footer().AlignCenter().PaddingTop(10).BorderTop(0.5f).BorderColor(Colors.Grey.Lighten2).Row(row => 
            {
                row.RelativeItem().Text("Autonomax - Gestão Financeira").FontSize(8).FontColor(Colors.Grey.Medium);
                row.RelativeItem().AlignRight().Text(x => {
                    x.Span("Página ").FontSize(8);
                    x.CurrentPageNumber().FontSize(8).Bold();
                });
            });
        });
    }

    void ComposeHeader(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().AlignCenter().Text("AUTONOMAX").FontSize(22).ExtraBold().FontColor(_primaryColor);
            col.Item().AlignCenter().Text("DEMONSTRATIVO DE FLUXO DE CAIXA").FontSize(9).SemiBold().FontColor(Colors.Grey.Medium).LetterSpacing(0.1f);
            
            col.Item().PaddingVertical(10).LineHorizontal(1).LineColor(_softGrey);

            col.Item().Row(row => {
                row.RelativeItem().Column(c => {
                    c.Item().Text("PERÍODO DE REFERÊNCIA").FontSize(7).Bold().FontColor(Colors.Grey.Medium);
                    c.Item().Text(_dados.Periodo).FontSize(12).Bold();
                });
                row.RelativeItem().AlignRight().Column(c => {
                    c.Item().Text("DATA DE EMISSÃO").FontSize(7).Bold().FontColor(Colors.Grey.Medium);
                    c.Item().Text(DateTime.Now.ToString("dd/MM/yyyy HH:mm")).FontSize(10);
                });
            });
        });
    }

    void ComposeContent(IContainer container)
    {
        container.PaddingVertical(15).Column(column =>
        {
            // --- CARDS DE RESUMO ---
            column.Item().Row(row =>
            {
                row.RelativeItem().Background(_softGrey).Padding(10).Column(c => {
                    c.Item().Text("TOTAL ENTRADAS").FontSize(7).Bold().FontColor(_primaryColor);
                    c.Item().Text($"R$ {_dados.TotalEntradas:N2}").FontSize(13).ExtraBold().FontColor(_primaryColor);
                });
                row.ConstantItem(10);
                row.RelativeItem().Background(_softGrey).Padding(10).Column(c => {
                    c.Item().Text("TOTAL SAÍDAS").FontSize(7).Bold().FontColor(_dangerColor);
                    c.Item().Text($"R$ {_dados.TotalSaidas:N2}").FontSize(13).ExtraBold().FontColor(_dangerColor);
                });
                row.ConstantItem(10);
                row.RelativeItem().Background(_darkColor).Padding(10).Column(c => {
                    c.Item().Text("SALDO LÍQUIDO").FontSize(7).Bold().FontColor(Colors.Grey.Lighten3);
                    c.Item().Text($"R$ {_dados.SaldoFinal:N2}").FontSize(13).ExtraBold().FontColor(Colors.White);
                });
            });

            column.Item().PaddingTop(25).PaddingBottom(5).Text("DETALHAMENTO DOS LANÇAMENTOS").FontSize(8).Bold().FontColor(Colors.Grey.Medium);

            // --- TABELA ---
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(55);  // Data
                    columns.RelativeColumn(2);   // Descrição/Parceiro
                    columns.ConstantColumn(60);  // Método
                    columns.ConstantColumn(60);  // Status
                    columns.RelativeColumn(1);   // Valor
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderStyle).Text("DATA");
                    header.Cell().Element(HeaderStyle).Text("CLIENTE/FORNECEDOR");
                    header.Cell().Element(HeaderStyle).Text("MÉTODO");
                    header.Cell().Element(HeaderStyle).Text("STATUS");
                    header.Cell().Element(HeaderStyle).AlignRight().Text("VALOR");

                    static IContainer HeaderStyle(IContainer container) => 
                        container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).DefaultTextStyle(x => x.SemiBold().FontSize(8));
                });

                foreach (var item in _dados.Lancamentos)
                {
                    bool isEntrada = item.Tipo == "Entrada";
                    bool isPendente = item.Status == "Pendente";

                    table.Cell().Element(RowStyle).Text(item.Data.ToString("dd/MM/yyyy"));
                    table.Cell().Element(RowStyle).Column(c => {
                        c.Item().Text(item.Parceiro).Bold();
                        c.Item().Text(item.Descricao).FontSize(7).FontColor(Colors.Grey.Darken1);
                    });
                    table.Cell().Element(RowStyle).Text(item.MetodoPagamento);
                    
                    // Status com cor dinâmica
                    table.Cell().Element(RowStyle).Text(item.Status)
                        .FontColor(isPendente ? _warningColor : Colors.Grey.Medium)
                        .Bold();

                    table.Cell().Element(RowStyle).AlignRight().Text($"{(isEntrada ? "+ " : "- ")}R$ {item.Valor:N2}")
                        .FontColor(isEntrada ? _primaryColor : _dangerColor)
                        .Bold();

                    IContainer RowStyle(IContainer container) => 
                        container.BorderBottom(0.5f).BorderColor(_softGrey).PaddingVertical(6);
                }
            });
        });
    }
}