using MapMemo.Api.Services;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();
builder.Services.Configure<MapMemo.Api.Services.MapMemoSessionOptions>(
    builder.Configuration.GetSection("Session"));
builder.Services.AddSingleton<ISessionService, SessionService>();

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

var httpsPort = builder.Configuration.GetValue<int?>("ASPNETCORE_HTTPS_PORT");
var urls = builder.Configuration["ASPNETCORE_URLS"] ?? string.Empty;
var hasHttpsUrl = urls
    .Split(';', StringSplitOptions.RemoveEmptyEntries)
    .Any(url => url.StartsWith("https://", StringComparison.OrdinalIgnoreCase));

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

app.Run();
