# Backend (ASP.NET Core)

## Prerequisites

- .NET 10 SDK
- Docker Desktop (for integration tests)
- [`just`](https://github.com/casey/just) task runner (optional but recommended)

## Quick start

```bash
just build              # build server
just run                # start dev server (http://localhost:5243)
just test               # run all tests (requires Docker)
just test-fast          # run tests without Docker
```

Or without `just`:

```bash
dotnet build MapMemo.Api
dotnet run --project MapMemo.Api
dotnet test MapMemo.Api.Tests/MapMemo.Api.Tests.csproj
```

Swagger UI (dev only): `http://localhost:5243/swagger`

## Configuration

- Google Maps API key: `GoogleMaps__ApiKey`
- Session config: `Session__CookieName`, `Session__Ttl` (defaults in `appsettings.json`)
- Postgres: `ConnectionStrings__Postgres`

## Database setup (local)

1. Create DB: `createdb -U postgres mapmemo`
2. Apply migrations: `just migrate-apply` (or `dotnet ef database update --project MapMemo.Api`)

For existing databases created with `schema.sql`, running `migrate-apply` once will create the `__EFMigrationsHistory` table and mark the baseline migration as applied.

### Migration commands

```bash
just migrate <Name>     # create a new migration
just migrate-apply      # apply pending migrations
just migrate-list       # list all migrations
```

## DB population

The database population process is proprietary. If you are interested, contact the repository owner.

## Session notes

- Session id is issued as an HttpOnly cookie (`mapmemo_session_id` by default).
- In-memory store only; sessions reset on backend restart.

## Frontend dev proxy (optional)

- `VITE_BACKEND_URL` (defaults to `http://localhost:5243`)
