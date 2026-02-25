using Microsoft.EntityFrameworkCore.Migrations;

using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MapMemo.Api.Data.Migrations {
    /// <inheritdoc />
    public partial class ReplaceIntersectionWithJunction : Migration {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder) {
            migrationBuilder.DropTable(
                name: "intersection_source");

            migrationBuilder.DropTable(
                name: "intersection");

            migrationBuilder.CreateTable(
                name: "roundabout",
                columns: table => new {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    city_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table => {
                    table.PrimaryKey("PK_roundabout", x => x.id);
                    table.ForeignKey(
                        name: "FK_roundabout_city_city_id",
                        column: x => x.city_id,
                        principalTable: "city",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "junction",
                columns: table => new {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    lat = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    lng = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    way_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    roundabout_id = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table => {
                    table.PrimaryKey("PK_junction", x => x.id);
                    table.ForeignKey(
                        name: "FK_junction_roundabout_roundabout_id",
                        column: x => x.roundabout_id,
                        principalTable: "roundabout",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "road_junction",
                columns: table => new {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    junction_id = table.Column<long>(type: "bigint", nullable: false),
                    road_id = table.Column<long>(type: "bigint", nullable: false),
                    node_index = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table => {
                    table.PrimaryKey("PK_road_junction", x => x.id);
                    table.ForeignKey(
                        name: "FK_road_junction_junction_junction_id",
                        column: x => x.junction_id,
                        principalTable: "junction",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_road_junction_road_road_id",
                        column: x => x.road_id,
                        principalTable: "road",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_junction_roundabout_id",
                table: "junction",
                column: "roundabout_id");

            migrationBuilder.CreateIndex(
                name: "idx_road_junction_junction_id",
                table: "road_junction",
                column: "junction_id");

            migrationBuilder.CreateIndex(
                name: "idx_road_junction_road_id",
                table: "road_junction",
                column: "road_id");

            migrationBuilder.CreateIndex(
                name: "idx_roundabout_city_id",
                table: "roundabout",
                column: "city_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder) {
            migrationBuilder.DropTable(
                name: "road_junction");

            migrationBuilder.DropTable(
                name: "junction");

            migrationBuilder.DropTable(
                name: "roundabout");

            migrationBuilder.CreateTable(
                name: "intersection",
                columns: table => new {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    road_a_id = table.Column<long>(type: "bigint", nullable: false),
                    road_b_id = table.Column<long>(type: "bigint", nullable: false),
                    lat = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    lng = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    way_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table => {
                    table.PrimaryKey("PK_intersection", x => x.id);
                    table.ForeignKey(
                        name: "FK_intersection_road_road_a_id",
                        column: x => x.road_a_id,
                        principalTable: "road",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_intersection_road_road_b_id",
                        column: x => x.road_b_id,
                        principalTable: "road",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "intersection_source",
                columns: table => new {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    intersection_id = table.Column<long>(type: "bigint", nullable: false),
                    osm_way_id = table.Column<long>(type: "bigint", nullable: false),
                    node_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table => {
                    table.PrimaryKey("PK_intersection_source", x => x.id);
                    table.ForeignKey(
                        name: "FK_intersection_source_intersection_intersection_id",
                        column: x => x.intersection_id,
                        principalTable: "intersection",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_intersection_source_osm_way_osm_way_id",
                        column: x => x.osm_way_id,
                        principalTable: "osm_way",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_intersection_road_a_id",
                table: "intersection",
                column: "road_a_id");

            migrationBuilder.CreateIndex(
                name: "idx_intersection_road_b_id",
                table: "intersection",
                column: "road_b_id");

            migrationBuilder.CreateIndex(
                name: "idx_intersection_source_intersection_id",
                table: "intersection_source",
                column: "intersection_id");

            migrationBuilder.CreateIndex(
                name: "idx_intersection_source_osm_way_id",
                table: "intersection_source",
                column: "osm_way_id");
        }
    }
}
