using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MapMemo.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCityBounds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "max_lat",
                table: "city",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "max_lon",
                table: "city",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "min_lat",
                table: "city",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "min_lon",
                table: "city",
                type: "double precision",
                nullable: true);

            // Seed approximate bounds for Oslo until import_osm.py extracts them from .osm.pbf.
            migrationBuilder.Sql("""
                UPDATE city
                SET min_lat = 59.808, min_lon = 10.489, max_lat = 59.971, max_lon = 10.944
                WHERE LOWER(name) = 'oslo';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "max_lat",
                table: "city");

            migrationBuilder.DropColumn(
                name: "max_lon",
                table: "city");

            migrationBuilder.DropColumn(
                name: "min_lat",
                table: "city");

            migrationBuilder.DropColumn(
                name: "min_lon",
                table: "city");
        }
    }
}
