using MapMemo.Api.Data;
using MapMemo.Api.Endpoints;

using Microsoft.EntityFrameworkCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();
builder.Services.Configure<MapMemo.Api.Services.MapMemoSessionOptions>(
    builder.Configuration.GetSection("Session"));
builder.Services.AddSingleton<MapMemo.Api.Services.ISessionService, MapMemo.Api.Services.SessionService>();
builder.Services.AddHttpClient();

var connectionString = builder.Configuration.GetConnectionString("Postgres");
if (!string.IsNullOrWhiteSpace(connectionString)) {
    builder.Services.AddDbContextPool<MapMemoDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else {
    // Register a dummy DbContext for environments without a DB (e.g. tests that don't need it)
    builder.Services.AddDbContextPool<MapMemoDbContext>(options =>
        options.UseNpgsql("Host=localhost"));
}

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

if (httpsPort is not null || hasHttpsUrl) {
    app.UseHttpsRedirection();
}

app.MapSessionEndpoints();
app.MapGeoDataEndpoints();
app.MapGoogleProxyEndpoints();

app.Run();
