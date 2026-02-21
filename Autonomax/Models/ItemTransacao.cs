namespace Autonomax.Models;

public class ItemTransacao
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    
    // Chave Estrangeira
    public int TransacaoId { get; set; }
    public Transacao? Transacao { get; set; }
}