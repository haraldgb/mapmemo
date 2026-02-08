# Backend (ASP.NET Core)

Run locally:

-   `dotnet run --project MapMemo.Api`
-   Default HTTP URL: `http://localhost:5243`
-   Swagger UI (dev only): `http://localhost:5243/swagger`

Run tests:

-   `dotnet test MapMemo.Api.Tests`

Format code:

-   `dotnet format MapMemo.Api/MapMemo.Api.csproj`
-   `dotnet format MapMemo.Api.Tests/MapMemo.Api.Tests.csproj`

Configuration:

-   Google Maps API key: `GoogleMaps__ApiKey`
-   Session config: `Session__CookieName`, `Session__Ttl` (defaults in `appsettings.json`)
-   Future Postgres: `ConnectionStrings__Postgres`

Session notes:

-   Session id is issued as an HttpOnly cookie (`mapmemo_session_id` by default).
-   In-memory store only; sessions reset on backend restart.

Frontend dev proxy (optional):

-   `VITE_BACKEND_URL` (defaults to `http://localhost:5243`)
