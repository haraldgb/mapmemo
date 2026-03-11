namespace MapMemo.Api.Models;

internal sealed record RoadJunctionDto(long JunctionId, int RoadJunctionIndex);

internal sealed record RoadDto(long Id, string Name, long CityId, List<RoadJunctionDto> Junctions);

internal sealed record JunctionDto(long Id, double Lat, double Lng, string? WayType, List<string> ConnectedRoadNames, long? RoundaboutId);

internal sealed record RoadSuggestionDto(string Name, double Score);

internal sealed record CheckRoadResponseDto(bool Found, string? CanonicalName, List<RoadSuggestionDto> Suggestions);
