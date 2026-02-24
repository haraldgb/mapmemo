namespace MapMemo.Api.Data.Entities;

public sealed class IntersectionSource {
    public long Id { get; set; }
    public long IntersectionId { get; set; }
    public long OsmWayId { get; set; }
    public long NodeId { get; set; }

    public Intersection Intersection { get; set; } = null!;
    public OsmWay OsmWay { get; set; } = null!;
}
