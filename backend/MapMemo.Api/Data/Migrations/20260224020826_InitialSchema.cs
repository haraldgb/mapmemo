using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MapMemo.Api.Data.Migrations {
    /// <summary>
    /// Baseline migration — Up/Down are intentionally empty because the database
    /// already has these tables (created via schema.sql). Running this migration
    /// only records it in __EFMigrationsHistory.
    /// </summary>
    public partial class InitialSchema : Migration {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder) {
            // Intentionally empty — existing database already has the schema.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder) {
            // Intentionally empty — baseline migration cannot be reverted.
        }
    }
}
