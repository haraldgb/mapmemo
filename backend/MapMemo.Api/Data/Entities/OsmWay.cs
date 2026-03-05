namespace MapMemo.Api.Data.Entities;

public sealed class OsmWay {
    public long Id { get; set; }
    public long RoadId { get; set; }
    public string? Name { get; set; }

    public Road Road { get; set; } = null!;
}
