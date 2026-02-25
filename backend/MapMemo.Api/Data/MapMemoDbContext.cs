using MapMemo.Api.Data.Entities;

using Microsoft.EntityFrameworkCore;

namespace MapMemo.Api.Data;

public sealed class MapMemoDbContext(DbContextOptions<MapMemoDbContext> options) : DbContext(options) {
    public DbSet<City> Cities => Set<City>();
    public DbSet<Road> Roads => Set<Road>();
    public DbSet<OsmWay> OsmWays => Set<OsmWay>();
    public DbSet<Intersection> Intersections => Set<Intersection>();
    public DbSet<IntersectionSource> IntersectionSources => Set<IntersectionSource>();

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

        modelBuilder.Entity<Intersection>(e => {
            e.ToTable("intersection");
            e.Property(i => i.Id).HasColumnName("id");
            e.Property(i => i.Lat).HasColumnName("lat").HasPrecision(9, 6);
            e.Property(i => i.Lng).HasColumnName("lng").HasPrecision(9, 6);
            e.Property(i => i.RoadAId).HasColumnName("road_a_id");
            e.Property(i => i.RoadBId).HasColumnName("road_b_id");
            e.Property(i => i.WayType).HasColumnName("way_type").HasMaxLength(50);
            e.HasOne(i => i.RoadA).WithMany().HasForeignKey(i => i.RoadAId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(i => i.RoadB).WithMany().HasForeignKey(i => i.RoadBId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(i => i.RoadAId).HasDatabaseName("idx_intersection_road_a_id");
            e.HasIndex(i => i.RoadBId).HasDatabaseName("idx_intersection_road_b_id");
        });

        modelBuilder.Entity<IntersectionSource>(e => {
            e.ToTable("intersection_source");
            e.Property(s => s.Id).HasColumnName("id");
            e.Property(s => s.IntersectionId).HasColumnName("intersection_id");
            e.Property(s => s.OsmWayId).HasColumnName("osm_way_id");
            e.Property(s => s.NodeId).HasColumnName("node_id");
            e.HasOne(s => s.Intersection).WithMany(i => i.IntersectionSources).HasForeignKey(s => s.IntersectionId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(s => s.OsmWay).WithMany(o => o.IntersectionSources).HasForeignKey(s => s.OsmWayId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(s => s.IntersectionId).HasDatabaseName("idx_intersection_source_intersection_id");
            e.HasIndex(s => s.OsmWayId).HasDatabaseName("idx_intersection_source_osm_way_id");
        });
    }
}
