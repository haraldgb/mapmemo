using MapMemo.Api.Models;
using MapMemo.Api.Services;

namespace MapMemo.Api.Endpoints;

internal static class GoogleProxyEndpoints {
    public static void MapGoogleProxyEndpoints(this IEndpointRouteBuilder app) {
        var urls = app.ServiceProvider.GetRequiredService<IConfiguration>()["ASPNETCORE_URLS"] ?? string.Empty;
        var splitUrls = urls.Split(';', StringSplitOptions.RemoveEmptyEntries);
        var selfReferrer = new Uri(splitUrls.FirstOrDefault() ?? "http://localhost");

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
            ComputeRoutesRequest request) => {
                if (!sessionService.HasValidSession(context)) {
                    return Results.Unauthorized();
                }

                if (request.Intermediates is { Length: > 98 }) {
                    return Results.Problem("Too many intermediates (max 98).", statusCode: 400);
                }

                var apiKey = configuration["GoogleMaps:ApiKey"];
                if (string.IsNullOrWhiteSpace(apiKey)) {
                    return Results.Problem("Google Maps API key is not configured.", statusCode: 500);
                }

                static object ToWaypoint(LatLngPair p) => new {
                    location = new { latLng = new { latitude = p.Latitude, longitude = p.Longitude } }
                };

                var googleBody = new Dictionary<string, object> {
                    ["origin"] = ToWaypoint(request.Origin),
                    ["destination"] = ToWaypoint(request.Destination),
                    ["travelMode"] = "WALK",
                    ["routingPreference"] = "ROUTING_PREFERENCE_UNSPECIFIED",
                };

                if (request.Intermediates is { Length: > 0 }) {
                    googleBody["intermediates"] = request.Intermediates.Select(ToWaypoint).ToArray();
                }

                HttpClient client = httpClientFactory.CreateClient();
                var googleUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";

                using var requestMessage = new HttpRequestMessage(HttpMethod.Post, googleUrl);
                requestMessage.Content = new StringContent(
                    System.Text.Json.JsonSerializer.Serialize(googleBody),
                    System.Text.Encoding.UTF8,
                    "application/json");
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
    }
}
