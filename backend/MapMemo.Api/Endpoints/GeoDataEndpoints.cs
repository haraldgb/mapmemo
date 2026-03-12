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
                var adminApiKey = config["AdminApiKey"];
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
            long? city_id,
            string? road_name) => {
                if (!sessionService.HasValidSession(context)) {
                    return Results.Unauthorized();
                }

                if (city_id is null || string.IsNullOrWhiteSpace(road_name)) {
                    return Results.BadRequest(new { error = "city_id and road_name are required." });
                }

                City? city = await db.Cities.FindAsync(city_id.Value);

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

                // === ROUNDABOUT HANDLING ===
                // Find which of the primary road's junctions belong to a roundabout
                List<Junction> roundaboutJunctionEntities = await db.Junctions
                    .Where(j => junctionIds.Contains(j.Id) && j.RoundaboutId.HasValue)
                    .ToListAsync();

                var roundaboutJunctionIdSet = roundaboutJunctionEntities
                    .Select(j => j.Id)
                    .ToHashSet();

                var touchedRoundaboutIds = roundaboutJunctionEntities
                    .Select(j => j.RoundaboutId!.Value)
                    .Distinct()
                    .ToList();

                var roundaboutDtos = new List<RoundaboutDto>();
                var externalRoundaboutRoadIds = new HashSet<long>();
                // Overrides for roundabout junctions: external-only connectedRoadNames
                var roundaboutJunctionOverrides = new Dictionary<long, JunctionDto>();

                if (touchedRoundaboutIds.Count > 0) {
                    // Fetch ALL junctions of each touched roundabout (ring may contain more than
                    // the primary road touches)
                    List<Junction> allRoundaboutJunctionEntities = await db.Junctions
                        .Where(j => j.RoundaboutId.HasValue && touchedRoundaboutIds.Contains(j.RoundaboutId.Value))
                        .ToListAsync();

                    var allRoundaboutJunctionIds = allRoundaboutJunctionEntities
                        .Select(j => j.Id)
                        .ToHashSet();

                    // Find roads that touch any roundabout junction, then fetch ALL their
                    // road_junctions — needed to correctly classify ring roads (all junctions
                    // inside roundabout) vs external roads (at least one junction outside).
                    List<long> candidateRoadIds = await db.RoadJunctions
                        .Where(rj => allRoundaboutJunctionIds.Contains(rj.JunctionId))
                        .Select(rj => rj.RoadId)
                        .Distinct()
                        .ToListAsync();

                    List<RoadJunction> candidateRoadJunctions = await db.RoadJunctions
                        .Include(rj => rj.Road)
                        .Where(rj => candidateRoadIds.Contains(rj.RoadId))
                        .ToListAsync();

                    var candidateByRoad = candidateRoadJunctions
                        .GroupBy(rj => rj.RoadId)
                        .ToDictionary(g => g.Key, g => g.ToList());

                    foreach (var roundaboutId in touchedRoundaboutIds) {
                        var thisRoundaboutJunctionIds = allRoundaboutJunctionEntities
                            .Where(j => j.RoundaboutId == roundaboutId)
                            .Select(j => j.Id)
                            .ToHashSet();

                        // Ring roads: ALL their junctions are inside this roundabout
                        var ringRoadIds = candidateByRoad
                            .Where(kvp => kvp.Value.All(rj => thisRoundaboutJunctionIds.Contains(rj.JunctionId)))
                            .Select(kvp => kvp.Key)
                            .ToHashSet();

                        // External roads: at least one junction outside roundabout
                        IEnumerable<long> externalIds = candidateByRoad
                            .Where(kvp => !ringRoadIds.Contains(kvp.Key))
                            .Select(kvp => kvp.Key);
                        externalRoundaboutRoadIds.UnionWith(externalIds);

                        // Order roundabout junctions by ring index via segment chaining
                        var ringSegments = candidateByRoad
                            .Where(kvp => ringRoadIds.Contains(kvp.Key))
                            .Select(kvp => kvp.Value
                                .OrderBy(rj => rj.NodeIndex)
                                .Select(rj => rj.JunctionId)
                                .ToList())
                            .ToList();

                        List<long> orderedJunctionIds = ChainRoundaboutSegments(ringSegments);

                        // Append any roundabout junctions not captured by ring segment chaining
                        var chainedSet = orderedJunctionIds.ToHashSet();
                        orderedJunctionIds.AddRange(
                            thisRoundaboutJunctionIds.Where(id => !chainedSet.Contains(id)));

                        // Build RoadJunctionDto refs: ring index = sequential position in ring
                        var roundaboutJunctionRefs = orderedJunctionIds
                            .Select((jId, ringIndex) => new RoadJunctionDto(jId, ringIndex))
                            .ToList();

                        // Build junction overrides with external-only road names
                        var junctionById = allRoundaboutJunctionEntities
                            .Where(j => j.RoundaboutId == roundaboutId)
                            .ToDictionary(j => j.Id);

                        foreach ((long jId, int ringIndex) in orderedJunctionIds.Select((id, i) => (id, i))) {
                            if (!junctionById.TryGetValue(jId, out Junction? jEntity)) continue;
                            var externalRoadNames = candidateRoadJunctions
                                .Where(rj => rj.JunctionId == jId && !ringRoadIds.Contains(rj.RoadId))
                                .Select(rj => rj.Road.Name)
                                .Distinct()
                                .ToList();
                            roundaboutJunctionOverrides[jId] = new JunctionDto(
                                jId,
                                (double)jEntity.Lat,
                                (double)jEntity.Lng,
                                jEntity.WayType,
                                externalRoadNames,
                                roundaboutId);
                        }

                        // connectedRoadNames for the roundabout DTO = union across all junctions
                        var allConnectedNames = roundaboutJunctionOverrides.Values
                            .Where(j => j.RoundaboutId == roundaboutId)
                            .SelectMany(j => j.ConnectedRoadNames)
                            .Distinct()
                            .ToList();

                        roundaboutDtos.Add(new RoundaboutDto(roundaboutId, roundaboutJunctionRefs, allConnectedNames));
                    }
                }
                // === END ROUNDABOUT HANDLING ===

                // Find connected roads via NON-roundabout junctions only;
                // roundabout-connected roads are handled above
                var nonRoundaboutJunctionIds = junctionIds
                    .Where(id => !roundaboutJunctionIdSet.Contains(id))
                    .ToList();

                HashSet<long> roadIds = [road.Id];
                List<long> connectedIds = await db.RoadJunctions
                    .Where(rj => nonRoundaboutJunctionIds.Contains(rj.JunctionId) && rj.RoadId != road.Id)
                    .Select(rj => rj.RoadId)
                    .Distinct()
                    .ToListAsync();
                roadIds.UnionWith(connectedIds);
                roadIds.UnionWith(externalRoundaboutRoadIds);

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

                // Group road_junctions by junction to build connected road names per junction
                var roadJunctionsByJunction = allRoadJunctions
                    .GroupBy(rj => rj.JunctionId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                Dictionary<string, RoadDto> roads = new();
                foreach ((var roadId, Road r) in roadsById) {
                    List<RoadJunction> roadJunctions = roadJunctionsByRoad.GetValueOrDefault(roadId) ?? [];

                    var junctionRefs = roadJunctions
                        .OrderBy(rj => rj.NodeIndex)
                        .Select(rj => new RoadJunctionDto(rj.JunctionId, rj.NodeIndex))
                        .ToList();

                    roads[r.Name] = new RoadDto(r.Id, r.Name, r.CityId, junctionRefs);
                }

                Dictionary<string, JunctionDto> junctions = new();
                foreach ((var junctionId, List<RoadJunction>? rjs) in roadJunctionsByJunction) {
                    Junction junctionEntity = rjs[0].Junction;
                    var connectedRoadNames = rjs
                        .Select(rj => rj.Road.Name)
                        .Distinct()
                        .ToList();
                    junctions[junctionId.ToString()] = new JunctionDto(
                        junctionId,
                        (double)junctionEntity.Lat,
                        (double)junctionEntity.Lng,
                        junctionEntity.WayType,
                        connectedRoadNames,
                        junctionEntity.RoundaboutId);
                }

                // Override roundabout junction entries with external-only road names,
                // and add any ring-road-only junctions not already present
                foreach ((var jId, JunctionDto jDto) in roundaboutJunctionOverrides) {
                    junctions[jId.ToString()] = jDto;
                }

                return Results.Json(new { roads, junctions, roundabouts = roundaboutDtos });
            });

        app.MapGet("/api/roads/check", async (
            HttpContext context,
            MapMemoDbContext db,
            ISessionService sessionService,
            long? city_id,
            string? road_name) => {
                if (!sessionService.HasValidSession(context)) {
                    return Results.Unauthorized();
                }

                if (city_id is null || string.IsNullOrWhiteSpace(road_name)) {
                    return Results.BadRequest(new { error = "city_id and road_name are required." });
                }

                City? city = await db.Cities.FindAsync(city_id.Value);
                if (city is null) {
                    return Results.NotFound(new { error = "City not found." });
                }

                List<string> allRoadNames = await db.Roads
                    .Where(r => r.CityId == city.Id)
                    .Select(r => r.Name)
                    .ToListAsync();

                var lowerInput = road_name.ToLower();

                var exactMatch = allRoadNames
                    .FirstOrDefault(n => n.ToLower() == lowerInput);

                if (exactMatch is not null) {
                    return Results.Json(new CheckRoadResponseDto(true, exactMatch, []));
                }

                var suggestions = allRoadNames
                    .Select(n => new RoadSuggestionDto(n, ComputeSimilarity(lowerInput, n.ToLower())))
                    .Where(s => s.Score >= 0.70)
                    .OrderByDescending(s => s.Score)
                    .Take(5)
                    .ToList();

                return Results.Json(new CheckRoadResponseDto(false, null, suggestions));
            });
    }

    /// <summary>
    /// Chains ring road segments into an ordered list of junction IDs representing the full
    /// roundabout ring. Each segment is a list of junction IDs sorted by NodeIndex; adjacent
    /// segments share a boundary junction (segment[i].Last() == segment[i+1].First()), forming
    /// a cycle. Returns an empty list if no segments are provided.
    /// </summary>
    private static List<long> ChainRoundaboutSegments(List<List<long>> segments) {
        if (segments.Count == 0) return [];

        // Build lookup: first junction ID of a segment → that segment
        var byStart = new Dictionary<long, List<long>>();
        foreach (List<long> seg in segments) {
            byStart[seg.First()] = seg;
        }

        var result = new List<long>();
        var startId = segments[0].First();
        List<long>? current = segments[0];
        // Track visited segment starts to detect cycles in malformed data
        var visitedStarts = new HashSet<long> { startId };

        // Add all but the last junction of each segment (the last equals the first of the next).
        // Stop when we return to the start junction or encounter a gap/cycle (malformed data).
        do {
            if (current.Count <= 1) break; // single-element segment: can't chain further
            result.AddRange(current.Take(current.Count - 1));
            var nextId = current.Last();
            if (nextId == startId || !byStart.TryGetValue(nextId, out current!)) break;
            if (!visitedStarts.Add(nextId)) break; // cycle detected in non-standard ring data
        } while (true);

        return result;
    }

    /// <summary>
    /// Returns a similarity score in [0, 1]: <c>1 - levenshteinDistance / max(|a|, |b|)</c>.
    /// Example: "akersgata" - "akersgate": 2 char diff → 1 - 2/9 ≈ 0.78
    /// </summary>
    private static double ComputeSimilarity(string a, string b) {
        if (a == b) return 1.0;
        int la = a.Length, lb = b.Length;
        if (la == 0 || lb == 0) return 0.0;

        var prev = new int[lb + 1];
        var curr = new int[lb + 1];

        for (var j = 0; j <= lb; j++) prev[j] = j;

        for (var i = 1; i <= la; i++) {
            curr[0] = i;
            for (var j = 1; j <= lb; j++) {
                var cost = a[i - 1] == b[j - 1] ? 0 : 1;
                curr[j] = Math.Min(Math.Min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }

            (prev, curr) = (curr, prev);
        }

        return 1.0 - (double)prev[lb] / Math.Max(la, lb);
    }
}
