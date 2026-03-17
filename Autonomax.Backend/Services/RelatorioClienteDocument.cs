using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Autonomax.Backend.DTOs;

namespace Autonomax.Backend.Services;

public class RelatorioClienteDocument : IDocument
{
    private readonly RelatorioClienteDto _dados;
    
    // Paleta de Cores Premium
    private readonly string _primaryColor = "#059669";   // Emerald Principal
    private readonly string _accentColor = "#10b981";    // Emerald Brilhante
    private readonly string _darkColor = "#0f172a";      // Slate 900 (Quase preto)
    private readonly string _softGrey = "#f1f5f9";       // Slate 100

    public RelatorioClienteDocument(RelatorioClienteDto dados) => _dados = dados;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(40);
            page.PageColor(Colors.White);
            page.DefaultTextStyle(x => x.FontSize(10).FontColor(_darkColor).FontFamily("Arial"));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            
            page.Footer().AlignCenter().Column(col => 
            {
                col.Item().PaddingTop(10).BorderTop(0.5f).BorderColor(Colors.Grey.Lighten2).Row(row => 
                {
                    row.RelativeItem().Text("Autonomax - Sistema de Gestão").FontSize(8).FontColor(Colors.Grey.Medium);
                    row.RelativeItem().AlignRight().Text(x => {
                        x.Span("Página ").FontSize(8);
                        x.CurrentPageNumber().FontSize(8).Bold();
                    });
                });
            });
        });
    }

    void ComposeHeader(IContainer container)
    {
        container.Column(col =>
        {
            // Nome da Marca Centralizado
            col.Item().AlignCenter().Text("AUTONOMAX")
                .FontSize(28)
                .ExtraBold()
                .FontColor(_primaryColor)
                .LetterSpacing(0.1f);

            col.Item().AlignCenter().PaddingTop(-5).Text("GESTÃO INTELIGENTE DE NEGÓCIOS")
                .FontSize(9)
                .SemiBold()
                .FontColor(Colors.Grey.Medium);

            col.Item().PaddingVertical(15).LineHorizontal(1).LineColor(_softGrey);

            // Subtítulos solicitados
            col.Item().AlignCenter().Text("Detalhes do Cliente").FontSize(14).Bold().FontColor(_darkColor);
            col.Item().AlignCenter().Text($"Relatório emitido em: {DateTime.Now:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(Colors.Grey.Darken1);
        });
    }

    void ComposeContent(IContainer container)
    {
        container.PaddingVertical(20).Column(column =>
        {
            // --- BOX DE INFORMAÇÕES DO CLIENTE ---
            column.Item().Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text("INFORMAÇÕES GERAIS").FontSize(8).Bold().FontColor(_primaryColor);
                    col.Item().PaddingTop(2).Text(_dados.NomeCliente).FontSize(16).ExtraBold();
                    col.Item().Text($"Contato: {_dados.Celular}").FontSize(10);
                });

                row.RelativeItem().AlignRight().Column(col =>
                {
                    col.Item().Text("REGISTROS DETALHADOS").FontSize(8).Bold().FontColor(_primaryColor);
                    col.Item().PaddingTop(2).Text($"{_dados.Transacoes.Count} transações encontradas").FontSize(10);
                    col.Item().Text("Período: Vitalício").FontSize(9).Italic();
                });
            });

            column.Item().PaddingVertical(20).LineHorizontal(0.5f).LineColor(Colors.Grey.Lighten3);

            // --- TABELA DE LANÇAMENTOS ---
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(80);  // Data
                    columns.RelativeColumn(3);  // Descrição
                    columns.RelativeColumn(1);  // Valor
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderStyle).Text("DATA");
                    header.Cell().Element(HeaderStyle).Text("DESCRIÇÃO");
                    header.Cell().Element(HeaderStyle).AlignRight().Text("VALOR (R$)");

                    static IContainer HeaderStyle(IContainer container) => 
                        container.BorderBottom(1).BorderColor("#059669").PaddingVertical(5).DefaultTextStyle(x => x.SemiBold().FontSize(9).FontColor("#059669"));
                });

                foreach (var item in _dados.Transacoes)
                {
                    table.Cell().Element(RowStyle).Text(item.Data.ToString("dd/MM/yyyy"));
                    table.Cell().Element(RowStyle).Text(item.Descricao).FontSize(9);
                    table.Cell().Element(RowStyle).AlignRight().Text($"{item.Valor:N2}");

                    static IContainer RowStyle(IContainer container) => 
                        container.BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten4).PaddingVertical(8);
                }
            });

            // --- SEÇÃO DE TOTALIZAÇÃO (FOOTER DA TABELA) ---
            column.Item().PaddingTop(15).Row(row => 
            {
                row.RelativeItem(); // Espaço vazio à esquerda
                
                row.ConstantItem(180).Background(_softGrey).Padding(10).Column(col => 
                {
                    col.Item().Row(r => 
                    {
                        r.RelativeItem().Text("TOTALIZAÇÃO").FontSize(8).Bold();
                        r.RelativeItem().AlignRight().Text("BRL").FontSize(7).FontColor(Colors.Grey.Medium);
                    });
                    
                    col.Item().PaddingTop(2).Row(r => 
                    {
                        r.RelativeItem().Text("Saldo Acumulado").FontSize(10);
                        r.RelativeItem().AlignRight().Text($"R$ {_dados.FaturamentoTotal:N2}")
                            .FontSize(12).ExtraBold().FontColor(_primaryColor);
                    });
                });
            });
        });
    }
}