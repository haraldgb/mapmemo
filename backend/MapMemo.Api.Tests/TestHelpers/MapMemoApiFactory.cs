using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace MapMemo.Api.Tests.TestHelpers;

public sealed class MapMemoApiFactory : WebApplicationFactory<Program> {
    private readonly string _contentRoot;

    public MapMemoApiFactory() {
        _contentRoot = Path.Combine(Path.GetTempPath(), "mapmemo-tests", Guid.NewGuid().ToString("N"));
        var dataDir = Path.Combine(_contentRoot, "Data");
        Directory.CreateDirectory(dataDir);
        File.WriteAllText(
            Path.Combine(dataDir, "Delbydeler_1854838652447253595.geojson"),
            SampleGeoJson);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder) {
        builder.UseContentRoot(_contentRoot);
        builder.ConfigureAppConfiguration(config => {
            var settings = new Dictionary<string, string?> {
                ["GoogleMaps:ApiKey"] = "test-google-maps-key"
            };
            config.AddInMemoryCollection(settings);
        });
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
