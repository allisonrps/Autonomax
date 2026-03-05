using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Autonomax.Backend.Migrations
{
    /// <inheritdoc />
    public partial class VincularFornecedorTransacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FornecedorId",
                table: "Transacoes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transacoes_FornecedorId",
                table: "Transacoes",
                column: "FornecedorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transacoes_Fornecedores_FornecedorId",
                table: "Transacoes",
                column: "FornecedorId",
                principalTable: "Fornecedores",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transacoes_Fornecedores_FornecedorId",
                table: "Transacoes");

            migrationBuilder.DropIndex(
                name: "IX_Transacoes_FornecedorId",
                table: "Transacoes");

            migrationBuilder.DropColumn(
                name: "FornecedorId",
                table: "Transacoes");
        }
    }
}
