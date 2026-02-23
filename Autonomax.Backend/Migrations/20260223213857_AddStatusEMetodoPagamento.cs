using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Autonomax.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddStatusEMetodoPagamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MetodoPagamento",
                table: "Transacoes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Transacoes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MetodoPagamento",
                table: "Transacoes");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Transacoes");
        }
    }
}
