using MapMemo.Api.Data;
using MapMemo.Api.Data.Entities;
using MapMemo.Api.Models;
using MapMemo.Api.Services;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Primitives;

namespace MapMemo.Api.Endpoints;

internal static class GeoDataEndpoints {
    public static void MapGeoDataEndpoints(this IEndpointRouteBuilder app) {
        app.MapGet("/api/cities", async (
            HttpContext context,
            MapMemoDbContext db,
            ISessionService sessionService) => {
                if (!sessionService.HasValidSession(context)) {
                    return Results.Unauthorized();
                }

                List<CityListItemDto> cities = await db.Cities
                    .Select(c => new CityListItemDto(c.Id, c.Name))
                    .ToListAsync();

                return Results.Json(cities);
            });

        app.MapGet("/api/cities/{cityId:long}", async (
            HttpContext context,
            MapMemoDbContext db,
            ISessionService sessionService,
            long cityId) => {
                if (!sessionService.HasValidSession(context)) {
                    return Results.Unauthorized();
                }

                City? city = await db.Cities
                    .Include(c => c.DefaultAddresses)
                    .FirstOrDefaultAsync(c => c.Id == cityId);

                if (city is null) {
                    return Results.NotFound(new { error = "City not found." });
                }

                var defaultAddresses = city.DefaultAddresses
                    .Select(a => new DefaultAddressDto(a.Id, a.Label, a.StreetAddress, a.RoadName, a.Lat, a.Lng))
                    .ToList();

                return Results.Json(new CityDetailDto(city.Id, city.Name, city.MinLat, city.MinLon, city.MaxLat, city.MaxLon, defaultAddresses));
            });

        app.MapPost("/api/cities/{cityId:long}/default-addresses", async (
            HttpContext context,
            MapMemoDbContext db,
            IConfiguration config,
            long cityId,
            AddDefaultAddressRequest request) => {
                string? adminApiKey = config["AdminApiKey"];
                if (string.IsNullOrWhiteSpace(adminApiKey)) {
                    return Results.StatusCode(503);
                }

                if (!context.Request.Headers.TryGetValue("X-Api-Key", out StringValues key)
                    || key.ToString() != adminApiKey) {
                    return Results.Unauthorized();
                }

                City? city = await db.Cities.FindAsync(cityId);
                if (city is null) {
                    return Results.NotFound(new { error = "City not found." });
                }

                if (city.MinLat is not null && city.MaxLat is not null
                    && city.MinLon is not null && city.MaxLon is not null) {
                    if (request.Lat < city.MinLat || request.Lat > city.MaxLat
                        || request.Lng < city.MinLon || request.Lng > city.MaxLon) {
                        return Results.BadRequest(new { error = "Address is outside city bounds." });
                    }
                }

                var address = new DefaultAddress {
                    CityId = cityId,
                    Label = request.Label,
                    StreetAddress = request.StreetAddress,
                    RoadName = request.RoadName,
                    Lat = request.Lat,
                    Lng = request.Lng,
                };

                db.DefaultAddresses.Add(address);
                await db.SaveChangesAsync();

                var dto = new DefaultAddressDto(address.Id, address.Label, address.StreetAddress, address.RoadName, address.Lat, address.Lng);
                return Results.Created($"/api/cities/{cityId}/default-addresses/{address.Id}", dto);
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
                var roadJunctionsByRoad = allRoadJunctions
                    .Where(rj => roadIds.Contains(rj.RoadId))
                    .GroupBy(rj => rj.RoadId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                Dictionary<string, RoadResponseDto> response = new();
                foreach ((var roadId, Road r) in roadsById) {
                    List<RoadJunction> roadJunctions = roadJunctionsByRoad.GetValueOrDefault(roadId) ?? [];

                    var junctions = roadJunctions
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
