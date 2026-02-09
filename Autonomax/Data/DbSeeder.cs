using Autonomax.Models;
using BCrypt.Net;

namespace Autonomax.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        // 1. Verifica se já existe algum usuário (se houver, não faz nada)
        if (context.Usuarios.Any()) return;

        // 2. Criar Usuário de Teste
        var usuario = new Usuario
        {
            Nome = "Allison Teste",
            Email = "teste@autonomax.com",
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("123456")
        };
        context.Usuarios.Add(usuario);
        context.SaveChanges();

        // 3. Criar um Negócio para esse usuário
        var negocio = new Negocio
        {
            Nome = "Minha Oficina de TI",
            UsuarioId = usuario.Id
        };
        context.Negocios.Add(negocio);
        context.SaveChanges();

        // 4. Criar Clientes
        var cliente1 = new Cliente { Nome = "João da Silva", NegocioId = negocio.Id };
        var cliente2 = new Cliente { Nome = "Maria Souza", NegocioId = negocio.Id };
        context.Clientes.AddRange(cliente1, cliente2);
        context.SaveChanges();

        // 5. Criar Transações (Entradas e Saídas) para o Ranking funcionar
        context.Transacoes.AddRange(
            new Transacao { Descricao = "Formatação PC", Valor = 150.00m, Tipo = "Entrada", Data = DateTime.Now.AddDays(-2), NegocioId = negocio.Id, ClienteId = cliente1.Id },
            new Transacao { Descricao = "Limpeza de Console", Valor = 200.00m, Tipo = "Entrada", Data = DateTime.Now.AddDays(-1), NegocioId = negocio.Id, ClienteId = cliente2.Id },
            new Transacao { Descricao = "Venda Mouse Pad", Valor = 50.00m, Tipo = "Entrada", Data = DateTime.Now, NegocioId = negocio.Id, ClienteId = cliente1.Id },
            new Transacao { Descricao = "Compra de Cabos", Valor = 80.00m, Tipo = "Saida", Data = DateTime.Now.AddDays(-3), NegocioId = negocio.Id }
        );
        
        context.SaveChanges();
    }
}