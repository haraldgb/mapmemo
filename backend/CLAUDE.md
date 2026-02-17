# MapMemo Backend

C#/.NET 10 minimal API with PostgreSQL. Serves game data and manages sessions.

## Commands

```bash
dotnet build MapMemo.Api                                      # build server
dotnet run --project MapMemo.Api                              # start dev server (port 5243)
dotnet test MapMemo.Api.Tests/MapMemo.Api.Tests.csproj        # run tests
dotnet format MapMemo.Api/MapMemo.Api.csproj                  # format API project
dotnet format MapMemo.Api.Tests/MapMemo.Api.Tests.csproj      # format test project
```

## Architecture

- **Minimal APIs** — endpoints defined in `Program.cs` with `app.MapGet()`. No controllers.
- **Raw Npgsql** for data access — no ORM. Manual SQL + parameterized queries + manual mapping to records.
- **Cookie-based sessions** via `IMemoryCache` (in-memory, resets on restart). Session logic in `Services/SessionService.cs`.
- **DI**: Options pattern for config (`MapMemoSessionOptions`), singleton session service.
- Swagger/OpenAPI enabled in development.

All endpoints live under `/api/` and require a valid session (obtained via `/api/health`).

## Project Structure

```
MapMemo.Api/
├── Program.cs              # entry point + all endpoint definitions
├── Models/Roads.cs         # DTOs and DB row records
├── Services/SessionService.cs  # session management
└── Data/                   # static data files (GeoJSON)

MapMemo.Api.Tests/
├── EndpointsTests.cs       # integration tests
└── TestHelpers/
    ├── MapMemoApiFactory.cs    # WebApplicationFactory setup
    ├── TestHttpClientFactory.cs # cookie-aware test client
    └── TestModels.cs           # response DTOs for assertions
```

## Naming

Standard C# conventions apply. Project-specific patterns:

| Thing            | Convention              | Example                |
| ---------------- | ----------------------- | ---------------------- |
| DB row records   | `internal sealed record`, suffix `Row` | `IntersectionRow`  |
| API response DTOs | `internal sealed record`, suffix `Dto` | `RoadResponseDto`  |
| Internal models  | `internal sealed record`, no suffix     | `RoadInfo`         |
| Services         | interface `I*Service` + `sealed class` impl | `ISessionService` / `SessionService` |
| Options classes  | `sealed class`, suffix `Options` | `MapMemoSessionOptions` |
| Test classes     | suffix `Tests`          | `EndpointsTests`       |
| Test factories   | suffix `Factory`        | `MapMemoApiFactory`    |

## Testing

- **xUnit** with `WebApplicationFactory<Program>` for integration tests.
- `MapMemoApiFactory` creates temp directories and injects test config (no real DB needed for session/file-serving tests).
- `TestHttpClientFactory` handles cookie persistence across requests.
- Test naming: `Method_condition_expected_result` with underscores (e.g., `Health_returns_ok_and_sets_session_cookie`).

## Database

Schema defined in `db/schema.sql`. Tables: `city`, `road`, `osm_way`, `intersection`, `intersection_source`.

`db/data/` is a **private submodule** — see its own CLAUDE.md for details. It contains the data import pipeline (Python/OSM). Do not reference its implementation details outside that folder.

**Migration/schema management is not yet formalized.** `schema.sql` reflects the current schema but there is no migration tool or versioning in place. This is known tech debt — don't try to solve it unless asked.
