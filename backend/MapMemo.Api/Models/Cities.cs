namespace MapMemo.Api.Models;

internal sealed record CityListItemDto(long Id, string Name);

internal sealed record CityDetailDto(long Id, string Name, double? MinLat, double? MinLon, double? MaxLat, double? MaxLon);
