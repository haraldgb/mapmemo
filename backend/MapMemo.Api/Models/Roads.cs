namespace MapMemo.Api.Models;

internal sealed record IntersectionRow(
    long Id,
    decimal Lat,
    decimal Lng,
    string? WayType,
    long OtherRoadId,
    string OtherRoadName);

internal sealed record RoadInfo(long Id, string Name, long CityId);

internal sealed record IntersectionDto(long Id, double Lat, double Lng, string? WayType, string OtherRoadName);

internal sealed record RoadResponseDto(long Id, string Name, long CityId, List<IntersectionDto> Intersections);
