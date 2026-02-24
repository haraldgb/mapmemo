namespace MapMemo.Api.Tests.TestHelpers;

internal sealed class HealthResponse {
    public string? Status { get; set; }
    public bool? Database { get; set; }
}

internal sealed class GoogleMapsKeyResponse {
    public string? ApiKey { get; set; }
}
