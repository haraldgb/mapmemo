using System.Net;
using System.Net.Http.Json;

using MapMemo.Api.Data;
using MapMemo.Api.Data.Entities;
using MapMemo.Api.Tests.TestHelpers;

using Microsoft.Extensions.DependencyInjection;

using Xunit;

namespace MapMemo.Api.Tests;

public sealed class RoadsEndpointTests(IntegrationTestFactory factory) : IntegrationTest(factory) {
    private (MapMemoDbContext Db, IServiceScope Scope) GetDb() {
        IServiceScope scope = Factory.Services.CreateScope();
        MapMemoDbContext db = scope.ServiceProvider.GetRequiredService<MapMemoDbContext>();
        return (db, scope);
    }

    private async Task SeedCityAndRoadsAsync() {
        (MapMemoDbContext? db, IServiceScope? scope) = GetDb();
        using (scope) {
            City city = new() { Name = "Oslo, Norway" };
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
    }

    [Fact]
    public async Task Roads_returns_road_data_with_intersections() {
        await SeedCityAndRoadsAsync();
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);

        // Get session
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync(
            "/api/roads?city_name=Oslo, Norway&road_name=Karl Johans gate");

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

        HttpResponseMessage missingRoadName = await client.GetAsync("/api/roads?city_name=Oslo, Norway");
        HttpResponseMessage missingCityName = await client.GetAsync("/api/roads?road_name=Karl Johans gate");

        Assert.Equal(HttpStatusCode.BadRequest, missingRoadName.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, missingCityName.StatusCode);
    }

    [Fact]
    public async Task Roads_unknown_city_or_road_returns_404() {
        await SeedCityAndRoadsAsync();
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage unknownCity = await client.GetAsync(
            "/api/roads?city_name=King's Landing, Westeros&road_name=Karl Johans gate");
        HttpResponseMessage unknownRoad = await client.GetAsync(
            "/api/roads?city_name=Oslo, Norway&road_name=Diagon Alley");

        Assert.Equal(HttpStatusCode.NotFound, unknownCity.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unknownRoad.StatusCode);
    }
}
