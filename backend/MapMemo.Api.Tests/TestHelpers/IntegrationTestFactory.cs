using MapMemo.Api.Data;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Npgsql;

using Respawn;

using Testcontainers.PostgreSql;

using Xunit;

namespace MapMemo.Api.Tests.TestHelpers;

public sealed class IntegrationTestFactory : WebApplicationFactory<Program>, IAsyncLifetime {
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private Respawner? _respawner;
    private string _connectionString = string.Empty;

    public async Task InitializeAsync() {
        await _postgres.StartAsync();
        _connectionString = _postgres.GetConnectionString();

        // Apply EFC migrations to the container
        IServiceScope scope = Services.CreateScope();
        MapMemoDbContext db = scope.ServiceProvider.GetRequiredService<MapMemoDbContext>();
        await db.Database.MigrateAsync();

        // Initialize Respawn for fast DB resets
        await using NpgsqlConnection conn = new(_connectionString);
        await conn.OpenAsync();
        _respawner = await Respawner.CreateAsync(conn, new RespawnerOptions {
            DbAdapter = DbAdapter.Postgres,
            SchemasToInclude = ["public"],
            TablesToIgnore = [new("__EFMigrationsHistory")]
        });
    }

    public async Task ResetDatabaseAsync() {
        if (_respawner is null) {
            return;
        }

        await using NpgsqlConnection conn = new(_connectionString);
        await conn.OpenAsync();
        await _respawner.ResetAsync(conn);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder) {
        builder.ConfigureAppConfiguration(config => {
            var settings = new Dictionary<string, string?> {
                ["GoogleMaps:ApiKey"] = "test-google-maps-key"
            };
            config.AddInMemoryCollection(settings);
        });

        builder.ConfigureServices(services => {
            // Remove existing DbContext registration
            ServiceDescriptor? descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<MapMemoDbContext>));
            if (descriptor is not null) {
                services.Remove(descriptor);
            }

            services.AddDbContextPool<MapMemoDbContext>(options =>
                options.UseNpgsql(_connectionString));
        });
    }

    async Task IAsyncLifetime.DisposeAsync() => await _postgres.DisposeAsync();
}
