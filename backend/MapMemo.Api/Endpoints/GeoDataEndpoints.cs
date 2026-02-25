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

                // Find all junction IDs for the requested road
                List<long> junctionIds = await db.RoadJunctions
                    .Where(rj => rj.RoadId == road.Id)
                    .Select(rj => rj.JunctionId)
                    .ToListAsync();

                // Find all roads connected via those junctions
                HashSet<long> roadIds = [road.Id];
                List<long> connectedIds = await db.RoadJunctions
                    .Where(rj => junctionIds.Contains(rj.JunctionId) && rj.RoadId != road.Id)
                    .Select(rj => rj.RoadId)
                    .Distinct()
                    .ToListAsync();
                roadIds.UnionWith(connectedIds);

                // Get all junction IDs that any of our roads participate in
                List<long> allJunctionIds = await db.RoadJunctions
                    .Where(rj => roadIds.Contains(rj.RoadId))
                    .Select(rj => rj.JunctionId)
                    .Distinct()
                    .ToListAsync();

                // Fetch all road_junction rows for those junctions, with navigation props
                List<RoadJunction> allRoadJunctions = await db.RoadJunctions
                    .Include(rj => rj.Junction)
                    .Include(rj => rj.Road)
                    .Where(rj => allJunctionIds.Contains(rj.JunctionId))
                    .ToListAsync();

                Dictionary<long, Road> roadsById = await db.Roads
                    .Where(r => roadIds.Contains(r.Id))
                    .ToDictionaryAsync(r => r.Id);

                // Group road_junctions by road to build per-road junction lists
                IEnumerable<IGrouping<long, RoadJunction>> roadJunctionsByRoad = allRoadJunctions
                    .Where(rj => roadIds.Contains(rj.RoadId))
                    .GroupBy(rj => rj.RoadId);

                Dictionary<string, RoadResponseDto> response = new();
                foreach (IGrouping<long, RoadJunction> group in roadJunctionsByRoad) {
                    if (!roadsById.TryGetValue(group.Key, out Road? r)) continue;

                    var junctions = group
                        .OrderBy(rj => rj.NodeIndex)
                        .Select(rj => {
                            var otherRoads = allRoadJunctions
                                .Where(x => x.JunctionId == rj.JunctionId && x.RoadId != rj.RoadId)
                                .Select(x => x.Road.Name)
                                .ToList();
                            return new JunctionDto(
                                rj.JunctionId,
                                (double)rj.Junction.Lat,
                                (double)rj.Junction.Lng,
                                rj.Junction.WayType,
                                rj.NodeIndex,
                                otherRoads,
                                rj.Junction.RoundaboutId);
                        })
                        .ToList();

                    response[r.Name] = new RoadResponseDto(r.Id, r.Name, r.CityId, junctions);
                }

                return Results.Json(response);
            });
    }
}
