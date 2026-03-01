namespace MapMemo.Api.Models;

internal sealed record CityListItemDto(long Id, string Name);

internal sealed record DefaultAddressDto(
    long Id,
    string Label,
    string StreetAddress,
    string RoadName,
    double Lat,
    double Lng);

internal sealed record CityDetailDto(
    long Id,
    string Name,
    double? MinLat,
    double? MinLon,
    double? MaxLat,
    double? MaxLon,
    List<DefaultAddressDto> DefaultAddresses);
