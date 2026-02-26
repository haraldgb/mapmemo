namespace MapMemo.Api.Models;

internal sealed record JunctionDto(long Id, double Lat, double Lng, string? WayType, int NodeIndex, List<string> ConnectedRoadNames, long? RoundaboutId);

internal sealed record RoadResponseDto(long Id, string Name, long CityId, List<JunctionDto> Junctions);
