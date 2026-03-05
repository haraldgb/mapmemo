namespace MapMemo.Api.Data.Entities;

public sealed class Junction {
    public long Id { get; set; }
    public decimal Lat { get; set; }
    public decimal Lng { get; set; }
    public string? WayType { get; set; }
    public long? RoundaboutId { get; set; }

    public Roundabout? Roundabout { get; set; }
    public ICollection<RoadJunction> RoadJunctions { get; set; } = [];
}
