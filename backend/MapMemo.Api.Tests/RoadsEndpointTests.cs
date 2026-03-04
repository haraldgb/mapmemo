using System.Net;

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

    private async Task<long> SeedCityAndRoadsAsync() {
        (MapMemoDbContext? db, IServiceScope? scope) = GetDb();
        using (scope) {
            City city = new() { Name = "Oslo, Norway" };
            db.Cities.Add(city);
            await db.SaveChangesAsync();

            Road mainRoad = new() { Name = "Karl Johans gate", CityId = city.Id };
            Road crossRoad = new() { Name = "Akersgata", CityId = city.Id };
            db.Roads.AddRange(mainRoad, crossRoad);
            await db.SaveChangesAsync();

            Junction junction = new() {
                Lat = 59.913869m,
                Lng = 10.747564m,
                WayType = "traffic_signals"
            };
            db.Junctions.Add(junction);
            await db.SaveChangesAsync();

            db.RoadJunctions.AddRange(
                new RoadJunction { JunctionId = junction.Id, RoadId = mainRoad.Id, NodeIndex = 0 },
                new RoadJunction { JunctionId = junction.Id, RoadId = crossRoad.Id, NodeIndex = 0 }
            );
            await db.SaveChangesAsync();

            return city.Id;
        }
    }

    [Fact]
    public async Task Roads_returns_road_data_with_junctions() {
        long cityId = await SeedCityAndRoadsAsync();
        var cookies = new System.Net.CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);

        // Get session
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync(
            $"/api/roads?city_id={cityId}&road_name=Karl Johans gate");

        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Karl Johans gate", content);
        Assert.Contains("Akersgata", content);
        Assert.Contains("traffic_signals", content);
    }

    [Fact]
    public async Task Roads_missing_params_returns_400() {
        long cityId = await SeedCityAndRoadsAsync();
        var cookies = new System.Net.CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage missingRoadName = await client.GetAsync($"/api/roads?city_id={cityId}");
        HttpResponseMessage missingCityId = await client.GetAsync("/api/roads?road_name=Karl Johans gate");

        Assert.Equal(HttpStatusCode.BadRequest, missingRoadName.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, missingCityId.StatusCode);
    }

    [Fact]
    public async Task Roads_unknown_city_or_road_returns_404() {
        long cityId = await SeedCityAndRoadsAsync();
        var cookies = new System.Net.CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage unknownCity = await client.GetAsync(
            "/api/roads?city_id=99999&road_name=Karl Johans gate");
        HttpResponseMessage unknownRoad = await client.GetAsync(
            $"/api/roads?city_id={cityId}&road_name=Diagon Alley");

        Assert.Equal(HttpStatusCode.NotFound, unknownCity.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unknownRoad.StatusCode);
    }
}
