namespace MapMemo.Api.Data.Entities;

public sealed class City {
    public long Id { get; set; }
    public required string Name { get; set; }
    public DateTimeOffset Added { get; set; }
    public DateTimeOffset Updated { get; set; }
    public double? MinLat { get; set; }
    public double? MinLon { get; set; }
    public double? MaxLat { get; set; }
    public double? MaxLon { get; set; }

    public ICollection<Road> Roads { get; set; } = [];
    public ICollection<Roundabout> Roundabouts { get; set; } = [];
}
