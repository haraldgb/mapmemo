namespace MapMemo.Api.Data.Entities;

public sealed class Roundabout {
    public long Id { get; set; }
    public long CityId { get; set; }

    public City City { get; set; } = null!;
    public ICollection<Junction> Junctions { get; set; } = [];
}
