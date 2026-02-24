using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MapMemo.Api.Data.Migrations {
    /// <summary>
    /// Baseline migration — creates the schema from scratch using raw SQL
    /// (matching db/schema.sql). For existing databases that already have the
    /// tables, run <c>dotnet ef database update</c> to mark this as applied
    /// without re-creating anything (Postgres will skip CREATE IF NOT EXISTS).
    /// </summary>
    public partial class InitialSchema : Migration {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder) {
            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS city (
                    id BIGSERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    added TIMESTAMPTZ NOT NULL DEFAULT now(),
                    updated TIMESTAMPTZ NOT NULL DEFAULT now()
                );

                CREATE OR REPLACE FUNCTION set_updated_at()
                RETURNS trigger AS $$
                BEGIN
                    NEW.updated = now();
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                DO $$ BEGIN
                    CREATE TRIGGER city_set_updated_at
                    BEFORE UPDATE ON city
                    FOR EACH ROW
                    EXECUTE FUNCTION set_updated_at();
                EXCEPTION WHEN duplicate_object THEN NULL;
                END $$;

                CREATE TABLE IF NOT EXISTS road (
                    id BIGSERIAL PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    city_id BIGINT NOT NULL REFERENCES city(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS osm_way (
                    id BIGINT PRIMARY KEY,
                    road_id BIGINT NOT NULL REFERENCES road(id) ON DELETE CASCADE,
                    name VARCHAR(200)
                );

                CREATE TABLE IF NOT EXISTS intersection (
                    id BIGSERIAL PRIMARY KEY,
                    lat NUMERIC(9, 6) NOT NULL,
                    lng NUMERIC(9, 6) NOT NULL,
                    road_a_id BIGINT NOT NULL REFERENCES road(id) ON DELETE CASCADE,
                    road_b_id BIGINT NOT NULL REFERENCES road(id) ON DELETE CASCADE,
                    way_type VARCHAR(50)
                );

                CREATE TABLE IF NOT EXISTS intersection_source (
                    id BIGSERIAL PRIMARY KEY,
                    intersection_id BIGINT NOT NULL REFERENCES intersection(id) ON DELETE CASCADE,
                    osm_way_id BIGINT NOT NULL REFERENCES osm_way(id) ON DELETE CASCADE,
                    node_id BIGINT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_road_city_id ON road(city_id);
                CREATE UNIQUE INDEX IF NOT EXISTS ux_road_city_name ON road(city_id, name);
                CREATE INDEX IF NOT EXISTS idx_osm_way_road_id ON osm_way(road_id);
                CREATE INDEX IF NOT EXISTS idx_intersection_road_a_id ON intersection(road_a_id);
                CREATE INDEX IF NOT EXISTS idx_intersection_road_b_id ON intersection(road_b_id);
                CREATE INDEX IF NOT EXISTS idx_intersection_source_intersection_id ON intersection_source(intersection_id);
                CREATE INDEX IF NOT EXISTS idx_intersection_source_osm_way_id ON intersection_source(osm_way_id);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder) {
            // Baseline migration — not designed to be reverted.
        }
    }
}
