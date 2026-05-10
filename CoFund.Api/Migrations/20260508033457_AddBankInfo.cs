using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoFund.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBankInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BankAccountName",
                table: "Groups",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountNumber",
                table: "Groups",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankBin",
                table: "Groups",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BankAccountName",
                table: "Groups");

            migrationBuilder.DropColumn(
                name: "BankAccountNumber",
                table: "Groups");

            migrationBuilder.DropColumn(
                name: "BankBin",
                table: "Groups");
        }
    }
}
