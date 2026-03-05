using System.Net;
using System.Net.Http.Json;

using MapMemo.Api.Tests.TestHelpers;

using Xunit;

namespace MapMemo.Api.Tests;

public sealed class EndpointsTests {
    [Fact]
    public async Task Health_returns_ok_and_sets_session_cookie() {
        using var factory = new MapMemoApiFactory();
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(factory, cookies);

        HttpResponseMessage response = await client.GetAsync("/api/health");

        response.EnsureSuccessStatusCode();
        HealthResponse? payload = await response.Content.ReadFromJsonAsync<HealthResponse>();
        Assert.NotNull(payload);
        Assert.Equal("ok", payload!.Status);

        Cookie? sessionCookie = cookies.GetCookies(client.BaseAddress!)["mapmemo_session_id"];
        Assert.NotNull(sessionCookie);
        Assert.False(string.IsNullOrWhiteSpace(sessionCookie!.Value));
    }

    [Fact]
    public async Task Google_maps_key_requires_session() {
        using var factory = new MapMemoApiFactory();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/api/google-maps-key");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Google_maps_key_returns_key_with_valid_session() {
        using var factory = new MapMemoApiFactory();
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(factory, cookies);

        HttpResponseMessage health = await client.GetAsync("/api/health");
        health.EnsureSuccessStatusCode();

        HttpResponseMessage response = await client.GetAsync("/api/google-maps-key");

        response.EnsureSuccessStatusCode();
        GoogleMapsKeyResponse? payload = await response.Content.ReadFromJsonAsync<GoogleMapsKeyResponse>();
        Assert.NotNull(payload);
        Assert.Equal("test-google-maps-key", payload!.ApiKey);
    }

    [Fact]
    public async Task Oslo_neighboorhoods_returns_geojson_when_session_valid() {
        using var factory = new MapMemoApiFactory();
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(factory, cookies);

        HttpResponseMessage health = await client.GetAsync("/api/health");
        health.EnsureSuccessStatusCode();

        HttpResponseMessage response = await client.GetAsync("/api/oslo-neighboorhoods");

        response.EnsureSuccessStatusCode();
        Assert.Equal("application/geo+json", response.Content.Headers.ContentType?.MediaType);
        var content = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(content));
    }

    [Fact]
    public async Task Oslo_neighboorhoods_requires_session() {
        using var factory = new MapMemoApiFactory();
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage response = await client.GetAsync("/api/oslo-neighboorhoods");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PostDefaultAddress_returns_503_when_admin_key_not_configured() {
        using var factory = new MapMemoApiFactory();
        using HttpClient client = factory.CreateClient();

        var body = new { Label = "Test", StreetAddress = "Test 1", RoadName = "Test", Lat = 59.9, Lng = 10.7 };
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/cities/1/default-addresses");
        request.Headers.Add("X-Api-Key", "any-key");
        request.Content = JsonContent.Create(body);

        HttpResponseMessage response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

}
