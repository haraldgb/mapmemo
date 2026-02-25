using MapMemo.Api.Data.Entities;

using Microsoft.EntityFrameworkCore;

namespace MapMemo.Api.Data;

public sealed class MapMemoDbContext(DbContextOptions<MapMemoDbContext> options) : DbContext(options) {
    public DbSet<City> Cities => Set<City>();
    public DbSet<Road> Roads => Set<Road>();
    public DbSet<OsmWay> OsmWays => Set<OsmWay>();
    public DbSet<Roundabout> Roundabouts => Set<Roundabout>();
    public DbSet<Junction> Junctions => Set<Junction>();
    public DbSet<RoadJunction> RoadJunctions => Set<RoadJunction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        modelBuilder.Entity<City>(e => {
            e.ToTable("city");
            e.Property(c => c.Id).HasColumnName("id");
            e.Property(c => c.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            e.Property(c => c.Added).HasColumnName("added").HasDefaultValueSql("now()");
            e.Property(c => c.Updated).HasColumnName("updated").HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<Road>(e => {
            e.ToTable("road");
            e.Property(r => r.Id).HasColumnName("id");
            e.Property(r => r.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
            e.Property(r => r.CityId).HasColumnName("city_id");
            e.HasOne(r => r.City).WithMany(c => c.Roads).HasForeignKey(r => r.CityId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(r => r.CityId).HasDatabaseName("idx_road_city_id");
            e.HasIndex(r => new { r.CityId, r.Name }).IsUnique().HasDatabaseName("ux_road_city_name");
        });

        modelBuilder.Entity<OsmWay>(e => {
            e.ToTable("osm_way");
            e.Property(o => o.Id).HasColumnName("id").ValueGeneratedNever();
            e.Property(o => o.RoadId).HasColumnName("road_id");
            e.Property(o => o.Name).HasColumnName("name").HasMaxLength(200);
            e.HasOne(o => o.Road).WithMany(r => r.OsmWays).HasForeignKey(o => o.RoadId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(o => o.RoadId).HasDatabaseName("idx_osm_way_road_id");
        });

        modelBuilder.Entity<Roundabout>(e => {
            e.ToTable("roundabout");
            e.Property(r => r.Id).HasColumnName("id");
            e.Property(r => r.CityId).HasColumnName("city_id");
            e.HasOne(r => r.City).WithMany(c => c.Roundabouts).HasForeignKey(r => r.CityId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(r => r.CityId).HasDatabaseName("idx_roundabout_city_id");
        });

        modelBuilder.Entity<Junction>(e => {
            e.ToTable("junction");
            e.Property(j => j.Id).HasColumnName("id");
            e.Property(j => j.Lat).HasColumnName("lat").HasPrecision(9, 6);
            e.Property(j => j.Lng).HasColumnName("lng").HasPrecision(9, 6);
            e.Property(j => j.WayType).HasColumnName("way_type").HasMaxLength(50);
            e.Property(j => j.RoundaboutId).HasColumnName("roundabout_id");
            e.HasOne(j => j.Roundabout).WithMany(r => r.Junctions).HasForeignKey(j => j.RoundaboutId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(j => j.RoundaboutId).HasDatabaseName("idx_junction_roundabout_id");
        });

        modelBuilder.Entity<RoadJunction>(e => {
            e.ToTable("road_junction");
            e.Property(rj => rj.Id).HasColumnName("id");
            e.Property(rj => rj.JunctionId).HasColumnName("junction_id");
            e.Property(rj => rj.RoadId).HasColumnName("road_id");
            e.Property(rj => rj.NodeIndex).HasColumnName("node_index");
            e.HasOne(rj => rj.Junction).WithMany(j => j.RoadJunctions).HasForeignKey(rj => rj.JunctionId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(rj => rj.Road).WithMany(r => r.RoadJunctions).HasForeignKey(rj => rj.RoadId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(rj => rj.JunctionId).HasDatabaseName("idx_road_junction_junction_id");
            e.HasIndex(rj => rj.RoadId).HasDatabaseName("idx_road_junction_road_id");
        });
    }
}
