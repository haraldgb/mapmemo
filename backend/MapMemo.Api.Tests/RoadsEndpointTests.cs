using System.Net;
using System.Net.Http.Json;

using MapMemo.Api.Data;
using MapMemo.Api.Data.Entities;
using MapMemo.Api.Tests.TestHelpers;

using Microsoft.Extensions.DependencyInjection;

using Xunit;

namespace MapMemo.Api.Tests;

public sealed class RoadsEndpointTests(IntegrationTestFactory factory) : IntegrationTest(factory) {
    private async Task<MapMemoDbContext> GetDbAsync() {
        IServiceScope scope = Factory.Services.CreateScope();
        MapMemoDbContext db = scope.ServiceProvider.GetRequiredService<MapMemoDbContext>();
        return db;
    }

    private async Task SeedCityAndRoadsAsync() {
        MapMemoDbContext db = await GetDbAsync();
        City city = new() { Name = "Oslo" };
        db.Cities.Add(city);
        await db.SaveChangesAsync();

        Road mainRoad = new() { Name = "Karl Johans gate", CityId = city.Id };
        Road crossRoad = new() { Name = "Akersgata", CityId = city.Id };
        db.Roads.AddRange(mainRoad, crossRoad);
        await db.SaveChangesAsync();

        db.Intersections.Add(new Intersection {
            Lat = 59.913869m,
            Lng = 10.747564m,
            RoadAId = mainRoad.Id,
            RoadBId = crossRoad.Id,
            WayType = "traffic_signals"
        });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Roads_returns_road_data_with_intersections() {
        await SeedCityAndRoadsAsync();
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);

        // Get session
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync(
            "/api/roads?city_name=Oslo&road_name=Karl Johans gate");

        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Karl Johans gate", content);
        Assert.Contains("Akersgata", content);
        Assert.Contains("traffic_signals", content);
    }

    [Fact]
    public async Task Roads_missing_params_returns_400() {
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync("/api/roads?city_name=Oslo");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Roads_unknown_city_returns_404() {
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync(
            "/api/roads?city_name=Narnia&road_name=Main Street");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
