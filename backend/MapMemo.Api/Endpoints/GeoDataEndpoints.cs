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

                HashSet<long> roadIds = [road.Id];
                var connectedIds = await db.Intersections
                    .Where(i => i.RoadAId == road.Id || i.RoadBId == road.Id)
                    .Select(i => i.RoadAId == road.Id ? i.RoadBId : i.RoadAId)
                    .Distinct()
                    .ToListAsync();
                roadIds.UnionWith(connectedIds);

                var allIntersections = await db.Intersections
                    .Include(i => i.RoadA)
                    .Include(i => i.RoadB)
                    .Where(i => roadIds.Contains(i.RoadAId) || roadIds.Contains(i.RoadBId))
                    .ToListAsync();

                Dictionary<long, Road> roadsById = await db.Roads
                    .Where(r => roadIds.Contains(r.Id))
                    .ToDictionaryAsync(r => r.Id);

                Dictionary<string, RoadResponseDto> response = new();
                foreach ((var rid, Road? r) in roadsById) {
                    var intersections = allIntersections
                        .Where(i => i.RoadAId == rid || i.RoadBId == rid)
                        .Select(i => new IntersectionDto(
                            i.Id, (double)i.Lat, (double)i.Lng, i.WayType,
                            i.RoadAId == rid ? i.RoadB.Name : i.RoadA.Name))
                        .ToList();

                    response[r.Name] = new RoadResponseDto(r.Id, r.Name, r.CityId, intersections);
                }

                return Results.Json(response);
            });
    }
}
