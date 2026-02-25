namespace MapMemo.Api.Data.Entities;

public sealed class Road {
    public long Id { get; set; }
    public required string Name { get; set; }
    public long CityId { get; set; }

    public City City { get; set; } = null!;
    public ICollection<OsmWay> OsmWays { get; set; } = [];
}
