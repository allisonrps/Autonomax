using System.ComponentModel.DataAnnotations;

namespace Autonomax.Backend.DTOs;

public class ProdutoServicoCreateDto
{
    [Required(ErrorMessage = "O nome do item é obrigatório.")]
    [StringLength(100)]
    public string Nome { get; set; } = string.Empty;

    public string? Descricao { get; set; }

    public string? Categoria { get; set; }

    [Range(0, 9999999.99, ErrorMessage = "O preço deve ser zero ou maior.")]
    public decimal Preco { get; set; } = 0;

    public bool EhServico { get; set; } = false;

    [Required]
    public int NegocioId { get; set; }
}

public class ProdutoServicoUpdateDto
{
    [Required(ErrorMessage = "O nome do item é obrigatório.")]
    [StringLength(100)]
    public string Nome { get; set; } = string.Empty;

    public string? Descricao { get; set; }

    public string? Categoria { get; set; }

    [Range(0, 9999999.99, ErrorMessage = "O preço deve ser zero ou maior.")]
    public decimal Preco { get; set; } = 0;

    public bool EhServico { get; set; } = false;
}

public class ItemHistoricoSugestaoDto
{
    public string Nome { get; set; } = string.Empty;
    public int Ocorrencias { get; set; }
    public decimal PrecoSugerido { get; set; }
    public string? Categoria { get; set; }
    public bool EhServico { get; set; }
    public bool JaCadastrado { get; set; }
}

public class ProdutoServicoBatchItemDto
{
    [Required]
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public string? Categoria { get; set; }
    public decimal Preco { get; set; }
    public bool EhServico { get; set; } = false;
}

public class ProdutoServicoBatchImportDto
{
    [Required]
    public int NegocioId { get; set; }
    public List<ProdutoServicoBatchItemDto> Itens { get; set; } = new();
}