using MapMemo.Api.Services;

namespace MapMemo.Api.Endpoints;

internal static class SessionEndpoints {
    public static void MapSessionEndpoints(this IEndpointRouteBuilder app) {
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
    }
}
