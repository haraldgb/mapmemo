namespace MapMemo.Api.Models;

internal sealed record SnapToRoadsRequest(double Lat, double Lng);

internal sealed record LatLngPair(double Latitude, double Longitude);
internal sealed record ComputeRoutesRequest(LatLngPair Origin, LatLngPair Destination, LatLngPair[]? Intermediates);
