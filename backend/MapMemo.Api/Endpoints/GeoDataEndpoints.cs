using MapMemo.Api.Data;
using MapMemo.Api.Data.Entities;
using MapMemo.Api.Models;
using MapMemo.Api.Services;

using Microsoft.EntityFrameworkCore;

namespace MapMemo.Api.Endpoints;

internal static class GeoDataEndpoints {
    public static void MapGeoDataEndpoints(this IEndpointRouteBuilder app) {
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

                if (!File.Exists(filePath)) {
                    return Results.NotFound(new { error = "Oslo GeoJSON file not found." });
                }

                return Results.File(filePath, "application/geo+json");
            });

        app.MapGet("/api/roads", async (
            HttpContext context,
            MapMemoDbContext db,
            ISessionService sessionService,
            string? city_name,
            string? road_name) => {
                if (!sessionService.HasValidSession(context)) {
                    return Results.Unauthorized();
                }

                if (string.IsNullOrWhiteSpace(city_name) || string.IsNullOrWhiteSpace(road_name)) {
                    return Results.BadRequest(new { error = "city_name and road_name are required." });
                }

                City? city = await db.Cities
                    .FirstOrDefaultAsync(c => c.Name.ToLower() == city_name.ToLower());

                if (city is null) {
                    return Results.NotFound(new { error = "City not found." });
                }

                Road? road = await db.Roads
                    .FirstOrDefaultAsync(r => r.CityId == city.Id && r.Name.ToLower() == road_name.ToLower());

                if (road is null) {
                    return Results.NotFound(new { error = "Road not found." });
                }

                // Discover connected road IDs via raw SQL
                HashSet<long> roadIds = [road.Id];
                List<long> connectedIds = await db.Database
                    .SqlQuery<long>($@"
                        SELECT DISTINCT
                            CASE WHEN road_a_id = {road.Id} THEN road_b_id ELSE road_a_id END AS ""Value""
                        FROM intersection
                        WHERE road_a_id = {road.Id} OR road_b_id = {road.Id}")
                    .ToListAsync();
                roadIds.UnionWith(connectedIds);

                // Fetch all intersections for all roads in the set via raw SQL
                List<ConnectedIntersectionRow> allIntersectionRows = await db.Set<ConnectedIntersectionRow>()
                    .FromSqlRaw(@"
                        SELECT i.id AS ""Id"", i.lat AS ""Lat"", i.lng AS ""Lng"", i.way_type AS ""WayType"",
                            i.road_a_id AS ""RoadAId"", r_a.name AS ""RoadAName"",
                            i.road_b_id AS ""RoadBId"", r_b.name AS ""RoadBName""
                        FROM intersection i
                        JOIN road r_a ON r_a.id = i.road_a_id
                        JOIN road r_b ON r_b.id = i.road_b_id
                        WHERE i.road_a_id = ANY({0}) OR i.road_b_id = ANY({0})",
                        roadIds.ToArray())
                    .ToListAsync();

                Dictionary<long, Road> roadsById = await db.Roads
                    .Where(r => roadIds.Contains(r.Id))
                    .ToDictionaryAsync(r => r.Id);

                Dictionary<string, RoadResponseDto> response = new();
                foreach ((var rid, Road? r) in roadsById) {
                    var intersections = allIntersectionRows
                        .Where(row => row.RoadAId == rid || row.RoadBId == rid)
                        .Select(row => new IntersectionDto(
                            row.Id, (double)row.Lat, (double)row.Lng, row.WayType,
                            row.RoadAId == rid ? row.RoadBName : row.RoadAName))
                        .ToList();

                    response[r.Name] = new RoadResponseDto(r.Id, r.Name, r.CityId, intersections);
                }

                return Results.Json(response);
            });
    }
}
