namespace MapMemo.Api.Data.Entities;

public sealed class DefaultAddress {
    public long Id { get; set; }
    public long CityId { get; set; }
    public required string Label { get; set; }
    public required string StreetAddress { get; set; }
    public required string RoadName { get; set; }
    public double Lat { get; set; }
    public double Lng { get; set; }

    public City City { get; set; } = null!;
}
