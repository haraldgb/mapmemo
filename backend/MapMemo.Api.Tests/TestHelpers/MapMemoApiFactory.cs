using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MapMemo.Api.Tests.TestHelpers;

public sealed class MapMemoApiFactory : WebApplicationFactory<Program> {
    private readonly string _contentRoot;
    private readonly HttpMessageHandler? _fakeHttpHandler;

    public MapMemoApiFactory(HttpMessageHandler? fakeHttpHandler = null) {
        _fakeHttpHandler = fakeHttpHandler;
        _contentRoot = Path.Combine(Path.GetTempPath(), "mapmemo-tests", Guid.NewGuid().ToString("N"));
        var dataDir = Path.Combine(_contentRoot, "Data");
        Directory.CreateDirectory(dataDir);
        File.WriteAllText(
            Path.Combine(dataDir, "Delbydeler_1854838652447253595.geojson"),
            SampleGeoJson);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder) {
        builder.UseEnvironment("Testing");
        builder.UseContentRoot(_contentRoot);
        builder.ConfigureAppConfiguration(config => {
            var settings = new Dictionary<string, string?> {
                ["GoogleMaps:ApiKey"] = "test-google-maps-key",
                ["GoogleMaps:ServerApiKey"] = "test-google-maps-server-key"
            };
            config.AddInMemoryCollection(settings);
        });

        if (_fakeHttpHandler is not null) {
            builder.ConfigureServices(services => {
                // Replace IHttpClientFactory with one that uses our fake handler
                services.AddHttpClient(string.Empty)
                    .ConfigurePrimaryHttpMessageHandler(() => _fakeHttpHandler);
            });
        }
    }

    // cleanup
    protected override void Dispose(bool disposing) {
        base.Dispose(disposing);

        if (!disposing) {
            return;
        }

        try {
            if (Directory.Exists(_contentRoot)) {
                Directory.Delete(_contentRoot, recursive: true);
            }
        }
        catch {
            // best-effort cleanup
        }
    }

    private const string SampleGeoJson = """
    { "type": "FeatureCollection", "features": [] }
    """;
}
