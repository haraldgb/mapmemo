namespace MapMemo.Api.Data.Entities;

public sealed class City {
    public long Id { get; set; }
    public required string Name { get; set; }
    public DateTimeOffset Added { get; set; }
    public DateTimeOffset Updated { get; set; }

    public ICollection<Road> Roads { get; set; } = [];
    public ICollection<Roundabout> Roundabouts { get; set; } = [];
}
