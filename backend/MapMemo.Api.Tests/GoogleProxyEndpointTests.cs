using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

using MapMemo.Api.Tests.TestHelpers;

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

using Xunit;

namespace MapMemo.Api.Tests;

public sealed class GoogleProxyEndpointTests {
    [Fact]
    public async Task Compute_routes_proxies_google_response() {
        var fakeHandler = FakeHttpMessageHandler.WithJsonResponse(
            """{"routes":[{"duration":"100s","polyline":{"encodedPolyline":"abc123"}}]}""");

        using var factory = new MapMemoApiFactory(fakeHandler);
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(factory, cookies);
        await client.GetAsync("/api/health");

        var body = new {
            origin = new { latitude = 59.91, longitude = 10.75 },
            destination = new { latitude = 59.92, longitude = 10.76 }
        };
        HttpResponseMessage response = await client.PostAsJsonAsync("/api/compute-routes", body);

        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("abc123", content);
    }

    [Fact]
    public async Task Compute_routes_too_many_intermediates_returns_400() {
        using var factory = new MapMemoApiFactory();
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(factory, cookies);
        await client.GetAsync("/api/health");

        var intermediates = Enumerable.Range(0, 99)
            .Select(i => new { latitude = 59.91 + i * 0.001, longitude = 10.75 })
            .ToArray();
        var body = new {
            origin = new { latitude = 59.91, longitude = 10.75 },
            destination = new { latitude = 59.92, longitude = 10.76 },
            intermediates
        };
        HttpResponseMessage response = await client.PostAsJsonAsync("/api/compute-routes", body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Snap_to_roads_proxies_google_response() {
        var fakeHandler = FakeHttpMessageHandler.WithJsonResponse(
            """{"snappedPoints":[{"location":{"latitude":59.91,"longitude":10.75}}]}""");

        using var factory = new MapMemoApiFactory(fakeHandler);
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(factory, cookies);
        await client.GetAsync("/api/health");

        var body = new { lat = 59.91, lng = 10.75 };
        HttpResponseMessage response = await client.PostAsJsonAsync("/api/snap-to-roads", body);

        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("snappedPoints", content);
    }
}
