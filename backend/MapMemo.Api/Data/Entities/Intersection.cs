namespace MapMemo.Api.Data.Entities;

public sealed class Intersection {
    public long Id { get; set; }
    public decimal Lat { get; set; }
    public decimal Lng { get; set; }
    public long RoadAId { get; set; }
    public long RoadBId { get; set; }
    public string? WayType { get; set; }

    public Road RoadA { get; set; } = null!;
    public Road RoadB { get; set; } = null!;
    public ICollection<IntersectionSource> IntersectionSources { get; set; } = [];
}
