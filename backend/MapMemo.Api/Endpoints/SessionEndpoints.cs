using MapMemo.Api.Data;
using MapMemo.Api.Services;

namespace MapMemo.Api.Endpoints;

internal static class SessionEndpoints {
    public static void MapSessionEndpoints(this IEndpointRouteBuilder app) {
        app.MapGet("/api/health", async (HttpContext context, ISessionService sessionService, MapMemoDbContext db) => {
            var sessionId = sessionService.GetOrCreateSessionId(context);
            bool dbHealthy;
            try {
                dbHealthy = await db.Database.CanConnectAsync();
            }
            catch {
                dbHealthy = false;
            }

            return Results.Ok(new { status = "ok", database = dbHealthy });
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
    }
}
