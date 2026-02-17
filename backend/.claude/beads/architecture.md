# Backend Architecture

## Stack

- .NET 10 minimal APIs (no controllers — route handlers in `Program.cs`)
- Npgsql 10 (raw SQL, no ORM)
- Swagger/OpenAPI via Swashbuckle
- In-memory cache (`AddMemoryCache`)

## API endpoints

All prefixed `/api`:

- `GET /health` — health check, creates session cookie
- `GET /google-maps-key` — returns API key (requires session)
- `GET /oslo-neighboorhoods` — returns GeoJSON file (requires session)
- `GET /roads?city_name=X&road_name=Y` — returns road intersection data (requires session)

## Session management (`SessionService`)

- HttpOnly cookie: `mapmemo_session_id`
- Default TTL: 8 hours (configurable via `Session:Ttl` in appsettings)
- In-memory cache storage (not distributed)
- `/health` creates session, all other endpoints validate it

## Configuration

```json
{
    "GoogleMaps": { "ApiKey": "" },
    "Session": { "CookieName": "mapmemo_session_id", "Ttl": "08:00:00" },
    "ConnectionStrings": { "Postgres": "" }
}
```

Use `dotnet user-secrets` for local dev secrets (UserSecretsId configured in csproj).

## Conventions

- DI via constructor injection (ASP.NET built-in)
- Options pattern for config sections (`IOptions<T>`)
- HTTPS redirection only when HTTPS port/URL is configured
- Parameterized SQL queries — never string-interpolate user input into SQL
