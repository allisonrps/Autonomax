public class Negocio
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int UsuarioId { get; set; } // O dono deste negócio
}