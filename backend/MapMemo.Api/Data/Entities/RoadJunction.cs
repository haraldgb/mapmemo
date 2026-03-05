namespace MapMemo.Api.Data.Entities;

public sealed class RoadJunction {
    public long Id { get; set; }
    public long JunctionId { get; set; }
    public long RoadId { get; set; }
    public int NodeIndex { get; set; }

    public Junction Junction { get; set; } = null!;
    public Road Road { get; set; } = null!;
}
