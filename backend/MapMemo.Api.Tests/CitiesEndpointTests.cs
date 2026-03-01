using System.Net;
using System.Net.Http.Json;

using MapMemo.Api.Data;
using MapMemo.Api.Data.Entities;
using MapMemo.Api.Tests.TestHelpers;

using Microsoft.Extensions.DependencyInjection;

using Xunit;

namespace MapMemo.Api.Tests;

public sealed class CitiesEndpointTests(IntegrationTestFactory factory) : IntegrationTest(factory) {
    private (MapMemoDbContext Db, IServiceScope Scope) GetDb() {
        IServiceScope scope = Factory.Services.CreateScope();
        MapMemoDbContext db = scope.ServiceProvider.GetRequiredService<MapMemoDbContext>();
        return (db, scope);
    }

    private async Task<long> SeedCityAsync(string name, double? minLat = null, double? minLon = null, double? maxLat = null, double? maxLon = null) {
        (MapMemoDbContext db, IServiceScope scope) = GetDb();
        using (scope) {
            var city = new City {
                Name = name,
                MinLat = minLat,
                MinLon = minLon,
                MaxLat = maxLat,
                MaxLon = maxLon,
            };
            db.Cities.Add(city);
            await db.SaveChangesAsync();
            return city.Id;
        }
    }

    [Fact]
    public async Task GetCities_returns_empty_list_when_no_cities() {
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync("/api/cities");

        response.EnsureSuccessStatusCode();
        List<CityListItemResponse>? cities = await response.Content.ReadFromJsonAsync<List<CityListItemResponse>>();
        Assert.NotNull(cities);
        Assert.Empty(cities);
    }

    [Fact]
    public async Task GetCities_returns_all_seeded_cities() {
        await SeedCityAsync("Oslo, Norway");
        await SeedCityAsync("Bergen, Norway");
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync("/api/cities");

        response.EnsureSuccessStatusCode();
        List<CityListItemResponse>? cities = await response.Content.ReadFromJsonAsync<List<CityListItemResponse>>();
        Assert.NotNull(cities);
        Assert.Equal(2, cities!.Count);
        Assert.Contains(cities, c => c.Name == "Oslo, Norway");
        Assert.Contains(cities, c => c.Name == "Bergen, Norway");
    }

    [Fact]
    public async Task GetCities_returns_401_without_session() {
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);

        HttpResponseMessage response = await client.GetAsync("/api/cities");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetCityById_returns_city_with_bounds() {
        var cityId = await SeedCityAsync("Oslo, Norway", minLat: 59.808, minLon: 10.489, maxLat: 59.971, maxLon: 10.944);
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync($"/api/cities/{cityId}");

        response.EnsureSuccessStatusCode();
        CityDetailResponse? city = await response.Content.ReadFromJsonAsync<CityDetailResponse>();
        Assert.NotNull(city);
        Assert.Equal("Oslo, Norway", city!.Name);
        Assert.Equal(59.808, city.MinLat);
        Assert.Equal(10.489, city.MinLon);
        Assert.Equal(59.971, city.MaxLat);
        Assert.Equal(10.944, city.MaxLon);
    }

    [Fact]
    public async Task GetCityById_returns_city_with_null_bounds_when_not_set() {
        var cityId = await SeedCityAsync("Oslo, Norway");
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync($"/api/cities/{cityId}");

        response.EnsureSuccessStatusCode();
        CityDetailResponse? city = await response.Content.ReadFromJsonAsync<CityDetailResponse>();
        Assert.NotNull(city);
        Assert.Null(city!.MinLat);
        Assert.Null(city.MinLon);
        Assert.Null(city.MaxLat);
        Assert.Null(city.MaxLon);
    }

    [Fact]
    public async Task GetCityById_returns_city_with_default_addresses() {
        var cityId = await SeedCityAsync("Oslo, Norway");
        (MapMemoDbContext db, IServiceScope scope) = GetDb();
        using (scope) {
            db.DefaultAddresses.Add(new DefaultAddress {
                CityId = cityId,
                Label = "Rådhuset",
                StreetAddress = "Rådhusplassen 1, Oslo",
                RoadName = "Rådhusplassen",
                Lat = 59.9112,
                Lng = 10.7329,
            });
            await db.SaveChangesAsync();
        }

        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync($"/api/cities/{cityId}");

        response.EnsureSuccessStatusCode();
        CityDetailResponse? city = await response.Content.ReadFromJsonAsync<CityDetailResponse>();
        Assert.NotNull(city);
        Assert.Single(city!.DefaultAddresses);
        Assert.Equal("Rådhuset", city.DefaultAddresses[0].Label);
        Assert.Equal("Rådhusplassen", city.DefaultAddresses[0].RoadName);
    }

    [Fact]
    public async Task GetCityById_returns_404_for_unknown_id() {
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);
        await client.GetAsync("/api/health");

        HttpResponseMessage response = await client.GetAsync("/api/cities/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetCityById_returns_401_without_session() {
        var cookies = new CookieContainer();
        using HttpClient client = TestHttpClientFactory.CreateClientWithCookies(Factory, cookies);

        HttpResponseMessage response = await client.GetAsync("/api/cities/1");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
