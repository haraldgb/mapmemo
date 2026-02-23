using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

using MapMemo.Api.Models;
using MapMemo.Api.Services;

using Npgsql;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();
builder.Services.Configure<MapMemo.Api.Services.MapMemoSessionOptions>(
    builder.Configuration.GetSection("Session"));
builder.Services.AddSingleton<ISessionService, SessionService>();
builder.Services.AddHttpClient();

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

var httpsPort = builder.Configuration.GetValue<int?>("ASPNETCORE_HTTPS_PORT");
var urls = builder.Configuration["ASPNETCORE_URLS"] ?? string.Empty;
var splitUrls = urls.Split(';', StringSplitOptions.RemoveEmptyEntries);
var hasHttpsUrl = splitUrls
    .Any(url => url.StartsWith("https://", StringComparison.OrdinalIgnoreCase));
var selfReferrer = new Uri(splitUrls.First());

if (httpsPort is not null || hasHttpsUrl) {
    // use https redirection if an HTTPS port/URL is configured.
    app.UseHttpsRedirection();
}

app.MapGet("/api/health", (HttpContext context, ISessionService sessionService) => {
    var sessionId = sessionService.GetOrCreateSessionId(context);
    return Results.Ok(new { status = "ok" });
});

app.MapGet("/api/google-maps-key", (
    HttpContext context,
    IConfiguration configuration,
    ISessionService sessionService) => {
        if (!sessionService.HasValidSession(context)) {
            return Results.Unauthorized();
        }

        var apiKey = configuration["GoogleMaps:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey)) {
            return Results.Problem("Google Maps API key is not configured.", statusCode: 500);
        }

        return Results.Json(new { apiKey });
    });

app.MapGet("/api/oslo-neighboorhoods", (
    HttpContext context,
    IWebHostEnvironment env,
    ISessionService sessionService) => {
        if (!sessionService.HasValidSession(context)) {
            return Results.Unauthorized();
        }

        var filePath = Path.Combine(
            env.ContentRootPath,
            "Data",
            "Delbydeler_1854838652447253595.geojson");

        if (!System.IO.File.Exists(filePath)) {
            return Results.NotFound(new { error = "Oslo GeoJSON file not found." });
        }

        return Results.File(filePath, "application/geo+json");
    });

app.MapGet("/api/roads", async (
    HttpContext context,
    IConfiguration configuration,
    ISessionService sessionService,
    string? city_name,
    string? road_name) => {
        if (!sessionService.HasValidSession(context)) {
            return Results.Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(city_name) || string.IsNullOrWhiteSpace(road_name)) {
            return Results.BadRequest(new { error = "city_name and road_name are required." });
        }

        var connectionString = configuration["ConnectionStrings:Postgres"];
        if (string.IsNullOrWhiteSpace(connectionString)) {
            return Results.Problem("Database is not configured.", statusCode: 500);
        }

        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();

        long? cityId = null;
        await using (var cmd = new NpgsqlCommand("SELECT id FROM city WHERE LOWER(name) = LOWER(@name)", conn)) {
            cmd.Parameters.AddWithValue("name", city_name);
            var scalar = await cmd.ExecuteScalarAsync();
            if (scalar is not null) {
                cityId = Convert.ToInt64(scalar);
            }
        }

        if (cityId is null) {
            return Results.NotFound(new { error = "City not found." });
        }

        long? roadId = null;
        await using (var cmd = new NpgsqlCommand("SELECT id FROM road WHERE city_id = @city_id AND LOWER(name) = LOWER(@name)", conn)) {
            cmd.Parameters.AddWithValue("city_id", cityId.Value);
            cmd.Parameters.AddWithValue("name", road_name);
            var scalar = await cmd.ExecuteScalarAsync();
            if (scalar is not null) {
                roadId = Convert.ToInt64(scalar);
            }
        }

        if (roadId is null) {
            return Results.NotFound(new { error = "Road not found." });
        }

        // Discover connected road IDs
        HashSet<long> roadIds = [roadId.Value];
        const string connectedIdsSql = @"
        SELECT DISTINCT
            CASE WHEN road_a_id = @road_id THEN road_b_id ELSE road_a_id END
        FROM intersection
        WHERE road_a_id = @road_id OR road_b_id = @road_id";
        await using (var cmd = new NpgsqlCommand(connectedIdsSql, conn)) {
            cmd.Parameters.AddWithValue("road_id", roadId.Value);
            await using NpgsqlDataReader reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) {
                roadIds.Add(reader.GetInt64(0));
            }
        }

        // Fetch all intersections for all roads in the set
        List<ConnectedIntersectionRow> allIntersectionRows = new();
        const string allIntersectionsSql = @"
        SELECT i.id, i.lat, i.lng, i.way_type,
            i.road_a_id, r_a.name,
            i.road_b_id, r_b.name
        FROM intersection i
        JOIN road r_a ON r_a.id = i.road_a_id
        JOIN road r_b ON r_b.id = i.road_b_id
        WHERE i.road_a_id = ANY(@road_ids) OR i.road_b_id = ANY(@road_ids)";
        await using (var cmd = new NpgsqlCommand(allIntersectionsSql, conn)) {
            cmd.Parameters.AddWithValue("road_ids", roadIds.ToArray());
            await using NpgsqlDataReader reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync()) {
                allIntersectionRows.Add(new ConnectedIntersectionRow(
                    reader.GetInt64(0),
                    reader.GetDecimal(1),
                    reader.GetDecimal(2),
                    reader.IsDBNull(3) ? null : reader.GetString(3),
                    reader.GetInt64(4),
                    reader.GetString(5),
                    reader.GetInt64(6),
                    reader.GetString(7)
                ));
            }
        }

        Dictionary<long, RoadInfo> roadsById = new();
        foreach (var rid in roadIds) {
            await using (var cmd = new NpgsqlCommand("SELECT id, name, city_id FROM road WHERE id = @id", conn)) {
                cmd.Parameters.AddWithValue("id", rid);
                await using NpgsqlDataReader reader = await cmd.ExecuteReaderAsync();
                if (await reader.ReadAsync()) {
                    roadsById[rid] = new RoadInfo(reader.GetInt64(0), reader.GetString(1), reader.GetInt64(2));
                }
            }
        }

        Dictionary<string, RoadResponseDto> response = new();
        foreach ((var rid, RoadInfo road) in roadsById.Select(kv => (kv.Key, kv.Value))) {
            var intersections = allIntersectionRows
                .Where(r => r.RoadAId == rid || r.RoadBId == rid)
                .Select(r => new IntersectionDto(
                    r.Id, (double)r.Lat, (double)r.Lng, r.WayType,
                    r.RoadAId == rid ? r.RoadBName : r.RoadAName))
                .ToList();

            response[road.Name] = new RoadResponseDto(road.Id, road.Name, road.CityId, intersections);
        }

        return Results.Json(response);
    });

app.MapPost("/api/snap-to-roads", async (
    HttpContext context,
    IConfiguration configuration,
    ISessionService sessionService,
    IHttpClientFactory httpClientFactory,
    SnapToRoadsRequest request) => {
        if (!sessionService.HasValidSession(context)) {
            return Results.Unauthorized();
        }

        var apiKey = configuration["GoogleMaps:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey)) {
            return Results.Problem("Google Maps API key is not configured.", statusCode: 500);
        }

        HttpClient client = httpClientFactory.CreateClient();
        var url = $"https://roads.googleapis.com/v1/nearestRoads?points={request.Lat},{request.Lng}&key={apiKey}";
        using var requestMessage = new HttpRequestMessage(HttpMethod.Get, url);
        requestMessage.Headers.Referrer = selfReferrer;
        HttpResponseMessage response = await client.SendAsync(requestMessage);

        if (!response.IsSuccessStatusCode) {
            var errorBody = await response.Content.ReadAsStringAsync();
            return Results.Problem(
                $"Google Roads API error: {errorBody}",
                statusCode: (int)response.StatusCode);
        }

        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json");
    });

app.MapPost("/api/compute-routes", async (
    HttpContext context,
    IConfiguration configuration,
    ISessionService sessionService,
    IHttpClientFactory httpClientFactory,
    JsonElement body) => {
        if (!sessionService.HasValidSession(context)) {
            return Results.Unauthorized();
        }

        var apiKey = configuration["GoogleMaps:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey)) {
            return Results.Problem("Google Maps API key is not configured.", statusCode: 500);
        }

        HttpClient client = httpClientFactory.CreateClient();
        var googleUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";

        using var requestMessage = new HttpRequestMessage(HttpMethod.Post, googleUrl);
        requestMessage.Content = new StringContent(
            body.GetRawText(), System.Text.Encoding.UTF8, "application/json");
        requestMessage.Headers.Referrer = selfReferrer;
        requestMessage.Headers.Add("X-Goog-Api-Key", apiKey);
        requestMessage.Headers.Add("X-Goog-FieldMask", "routes.duration,routes.polyline.encodedPolyline");

        HttpResponseMessage response = await client.SendAsync(requestMessage);

        if (!response.IsSuccessStatusCode) {
            var errorBody = await response.Content.ReadAsStringAsync();
            return Results.Problem(
                $"Google Routes API error: {errorBody}",
                statusCode: (int)response.StatusCode);
        }

        var content = await response.Content.ReadAsStringAsync();
        return Results.Content(content, "application/json");
    });

app.Run();
