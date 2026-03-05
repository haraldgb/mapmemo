# MapMemo Backend

C#/.NET 10 minimal API with PostgreSQL. Serves game data and manages sessions.

## Commands

All commands run from `backend/`. Requires [`just`](https://github.com/casey/just) task runner.

```bash
just build              # build server
just run-dev            # start dev server (port 5243)
just run-prod           # start production server (port 5243, all interfaces)
just test               # run all tests (requires Docker)
just test-fast          # run tests without Docker
just test-integration   # run only Docker integration tests
just format             # format both projects
just format-check       # verify formatting without changes
just migrate <name>     # create a new EFC migration
just migrate-apply      # apply pending migrations to the DB
just migrate-list       # list all migrations
```

Or without `just`:

```bash
dotnet build MapMemo.Api
dotnet run --project MapMemo.Api --launch-profile http       # dev
dotnet run --project MapMemo.Api --launch-profile production # prod
dotnet test MapMemo.Api.Tests/MapMemo.Api.Tests.csproj
dotnet format MapMemo.Api/MapMemo.Api.csproj
dotnet format MapMemo.Api.Tests/MapMemo.Api.Tests.csproj
```

## Architecture

- **Minimal APIs** — endpoints split into `Endpoints/SessionEndpoints.cs`, `Endpoints/GeoDataEndpoints.cs`, `Endpoints/GoogleProxyEndpoints.cs` using extension methods. `Program.cs` is DI setup + `MapXxxEndpoints()` calls.
- **Entity Framework Core (EFC)** with Npgsql provider for data access. Entities in `Data/Entities/`, context in `Data/MapMemoDbContext.cs`.
- **Cookie-based sessions** via `IMemoryCache` (in-memory, resets on restart). Session logic in `Services/SessionService.cs`.
- **DI**: Options pattern for config (`MapMemoSessionOptions`), singleton session service, pooled `MapMemoDbContext`.
- Swagger/OpenAPI enabled in development.

All endpoints live under `/api/` and require a valid session (obtained via `/api/health`).

## Project Structure

```
MapMemo.Api/
├── Program.cs                  # entry point + DI setup
├── Endpoints/
│   ├── SessionEndpoints.cs     # /api/health, /api/google-maps-key
│   ├── GeoDataEndpoints.cs     # /api/oslo-neighboorhoods, /api/roads
│   └── GoogleProxyEndpoints.cs # /api/snap-to-roads, /api/compute-routes
├── Data/
│   ├── Entities/               # EFC entity classes (City, Road, etc.)
│   ├── MapMemoDbContext.cs     # DbContext with model configuration
│   └── Migrations/             # EFC migrations (baseline: InitialSchema)
├── Models/
│   ├── Roads.cs                # response DTOs (JunctionDto, RoadResponseDto)
│   └── GoogleMaps.cs           # request DTOs (SnapToRoadsRequest, etc.)
├── Services/SessionService.cs  # session management
└── Data/                       # static data files (GeoJSON) — separate from EFC Data/

MapMemo.Api.Tests/
├── EndpointsTests.cs           # session/file-serving tests (no Docker)
├── GoogleProxyEndpointTests.cs # Google API proxy tests (no Docker)
├── RoadsEndpointTests.cs       # DB integration tests (requires Docker)
└── TestHelpers/
    ├── MapMemoApiFactory.cs        # WebApplicationFactory for non-DB tests
    ├── IntegrationTestFactory.cs   # Testcontainers Postgres + Respawn
    ├── IntegrationTest.cs          # base class for DB tests
    ├── FakeHttpMessageHandler.cs   # mock HTTP for Google proxy tests
    ├── TestHttpClientFactory.cs    # cookie-aware test client
    └── TestModels.cs               # response DTOs for assertions
```

## Naming

Standard C# conventions apply. Project-specific patterns:

| Thing            | Convention              | Example                |
| ---------------- | ----------------------- | ---------------------- |
| EFC entities     | `public sealed class`, singular | `City`, `Road` |
| API response DTOs | `internal sealed record`, suffix `Dto` | `RoadResponseDto`  |
| Services         | interface `I*Service` + `sealed class` impl | `ISessionService` / `SessionService` |
| Options classes  | `sealed class`, suffix `Options` | `MapMemoSessionOptions` |
| Test classes     | suffix `Tests`          | `EndpointsTests`       |
| Test factories   | suffix `Factory`        | `MapMemoApiFactory`    |

## Testing

- **xUnit** with `WebApplicationFactory<Program>` for integration tests.
- `MapMemoApiFactory` — non-DB tests (session, file-serving, Google proxy). Supports optional `FakeHttpMessageHandler` injection.
- `IntegrationTestFactory` — DB tests via Testcontainers (Postgres in Docker) + Respawn for fast resets.
- `IntegrationTest` — base class with `[Collection("Integration")]` for shared container lifecycle.
- Test naming: `Method_condition_expected_result` with underscores.
- **Docker Desktop required** for integration tests. Non-Docker tests: `just test-fast`.

## Database

### Schema

Defined in `db/schema.sql` and mirrored in EFC entities/migrations. Tables: `city`, `road`, `osm_way`, `roundabout`, `junction`, `road_junction`.

### Migrations

EFC migrations in `Data/Migrations/`. Baseline migration (`InitialSchema`) uses `CREATE IF NOT EXISTS` — safe for both fresh DBs and existing ones.

```bash
just migrate <Name>     # create migration
just migrate-apply      # apply to DB
just migrate-list       # list migrations
```

For existing databases without `__EFMigrationsHistory`, run `just migrate-apply` once to record the baseline.

### Submodule

`db/data/` is a **private submodule** — see its own CLAUDE.md for details. It contains the data import pipeline (Python/OSM). The import script validates the schema version against `EXPECTED_MIGRATION_ID` before running. Do not reference its implementation details outside that folder.

### Schema validation

`db/validate_schema.sql` queries the latest migration ID from `__EFMigrationsHistory`. The import script uses this to fail fast on schema mismatch.
