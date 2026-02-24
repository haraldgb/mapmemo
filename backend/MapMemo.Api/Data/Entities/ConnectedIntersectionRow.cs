namespace MapMemo.Api.Data.Entities;

/// <summary>
/// Keyless entity for the intersection join query result.
/// Mapped via HasNoKey() in DbContext.
/// </summary>
public sealed class ConnectedIntersectionRow {
    public long Id { get; set; }
    public decimal Lat { get; set; }
    public decimal Lng { get; set; }
    public string? WayType { get; set; }
    public long RoadAId { get; set; }
    public required string RoadAName { get; set; }
    public long RoadBId { get; set; }
    public required string RoadBName { get; set; }
}
