using System.Net;
using System.Text.Json;

using MapMemo.Api.Data;
using MapMemo.Api.Data.Entities;
using MapMemo.Api.Tests.TestHelpers;

using Microsoft.Extensions.DependencyInjection;

using Xunit;

namespace MapMemo.Api.Tests;

public sealed class CheckRoadEndpointTests(IntegrationTestFactory factory) : IntegrationTest(factory) {
    private (MapMemoDbContext Db, IServiceScope Scope) GetDb() {
        IServiceScope scope = Factory.Services.CreateScope();
        MapMemoDbContext db = scope.ServiceProvider.GetRequiredService<MapMemoDbContext>();
        return (db, scope);
    }

    private async Task<long> SeedCityAndRoadsAsync() {
        (MapMemoDbContext db, IServiceScope scope) = GetDb();
        using (scope) {
            City city = new() { Name = "Oslo, Norway" };
            db.Cities.Add(city);
            await db.SaveChangesAsync();

            db.Roads.AddRange(
                new Road { Name = "Elgeseter gate", CityId = city.Id },
                new Road { Name = "Karl Johans gate", CityId = city.Id },
                new Road { Name = "Akersgata", CityId = city.Id }
            );
            await db.SaveChangesAsync();

            return city.Id;
        }
    }

    [Fact]
    public async Task CheckRoad_exact_match_returns_found_true() {
        var cityId = await SeedCityAndRoadsAsync();
        var cookies = new System.Net.CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync(
            $"/api/roads/check?city_id={cityId}&road_name=Karl Johans gate");

        response.EnsureSuccessStatusCode();
        JsonElement json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.True(json.GetProperty("found").GetBoolean());
        Assert.Equal("Karl Johans gate", json.GetProperty("canonicalName").GetString());
    }

    [Fact]
    public async Task CheckRoad_case_insensitive_match_returns_found_true() {
        var cityId = await SeedCityAndRoadsAsync();
        var cookies = new System.Net.CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync(
            $"/api/roads/check?city_id={cityId}&road_name=ELGESETER GATE");

        response.EnsureSuccessStatusCode();
        JsonElement json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.True(json.GetProperty("found").GetBoolean());
        Assert.Equal("Elgeseter gate", json.GetProperty("canonicalName").GetString());
    }

    [Fact]
    public async Task CheckRoad_near_match_returns_found_false_with_suggestions() {
        var cityId = await SeedCityAndRoadsAsync();
        var cookies = new System.Net.CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        // "Elgesetergate" (missing space) should suggest "Elgeseter gate"
        HttpResponseMessage response = await client.GetAsync(
            $"/api/roads/check?city_id={cityId}&road_name=Elgesetergate");

        response.EnsureSuccessStatusCode();
        JsonElement json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.False(json.GetProperty("found").GetBoolean());
        var suggestions = json.GetProperty("suggestions").EnumerateArray().ToList();
        Assert.NotEmpty(suggestions);
        Assert.Equal("Elgeseter gate", suggestions[0].GetProperty("name").GetString());
        Assert.True(suggestions[0].GetProperty("score").GetDouble() >= 0.70);
    }

    [Fact]
    public async Task CheckRoad_no_similar_roads_returns_empty_suggestions() {
        var cityId = await SeedCityAndRoadsAsync();
        var cookies = new System.Net.CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync(
            $"/api/roads/check?city_id={cityId}&road_name=Diagon Alley");

        response.EnsureSuccessStatusCode();
        JsonElement json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        Assert.False(json.GetProperty("found").GetBoolean());
        Assert.Empty(json.GetProperty("suggestions").EnumerateArray());
    }

    [Fact]
    public async Task CheckRoad_missing_params_returns_400() {
        var cityId = await SeedCityAndRoadsAsync();
        var cookies = new System.Net.CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage missingRoadName = await client.GetAsync($"/api/roads/check?city_id={cityId}");
        HttpResponseMessage missingCityId = await client.GetAsync("/api/roads/check?road_name=Karl Johans gate");

        Assert.Equal(HttpStatusCode.BadRequest, missingRoadName.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, missingCityId.StatusCode);
    }

    [Fact]
    public async Task CheckRoad_unknown_city_returns_404() {
        var cookies = new System.Net.CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync(
            "/api/roads/check?city_id=99999&road_name=Karl Johans gate");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
