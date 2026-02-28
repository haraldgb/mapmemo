namespace MapMemo.Api.Tests.TestHelpers;

internal sealed class HealthResponse {
    public string? Status { get; set; }
    public bool? Database { get; set; }
}

internal sealed class GoogleMapsKeyResponse {
    public string? ApiKey { get; set; }
}

internal sealed class CityListItemResponse {
    public long Id { get; set; }
    public string? Name { get; set; }
}

internal sealed class CityDetailResponse {
    public long Id { get; set; }
    public string? Name { get; set; }
    public double? MinLat { get; set; }
    public double? MinLon { get; set; }
    public double? MaxLat { get; set; }
    public double? MaxLon { get; set; }
}
