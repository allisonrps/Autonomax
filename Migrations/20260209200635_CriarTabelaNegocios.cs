using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Autonomax.Migrations
{
    /// <inheritdoc />
    public partial class CriarTabelaNegocios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Negocio_Usuarios_UsuarioId",
                table: "Negocio");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Negocio",
                table: "Negocio");

            migrationBuilder.RenameTable(
                name: "Negocio",
                newName: "Negocios");

            migrationBuilder.RenameIndex(
                name: "IX_Negocio_UsuarioId",
                table: "Negocios",
                newName: "IX_Negocios_UsuarioId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Negocios",
                table: "Negocios",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Negocios_Usuarios_UsuarioId",
                table: "Negocios",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Negocios_Usuarios_UsuarioId",
                table: "Negocios");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Negocios",
                table: "Negocios");

            migrationBuilder.RenameTable(
                name: "Negocios",
                newName: "Negocio");

            migrationBuilder.RenameIndex(
                name: "IX_Negocios_UsuarioId",
                table: "Negocio",
                newName: "IX_Negocio_UsuarioId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Negocio",
                table: "Negocio",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Negocio_Usuarios_UsuarioId",
                table: "Negocio",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
