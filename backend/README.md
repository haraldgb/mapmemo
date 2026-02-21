# Backend (ASP.NET Core)

dotnet build MapMemo.Api                                      # build server

Run locally:

-   `dotnet run --project MapMemo.Api`
-   Default HTTP URL: `http://localhost:5243`
-   Swagger UI (dev only): `http://localhost:5243/swagger`

Run tests:

-   `dotnet test MapMemo.Api.Tests`


-   `dotnet format MapMemo.Api/MapMemo.Api.csproj`
-   `dotnet format MapMemo.Api.Tests/MapMemo.Api.Tests.csproj`

Configuration:

-   Google Maps API key: `GoogleMaps__ApiKey`
-   Session config: `Session__CookieName`, `Session__Ttl` (defaults in `appsettings.json`)
-   Postgres: `ConnectionStrings__Postgres`

Database setup (local):

-   Schema: `backend/db/schema.sql`
-   Create DB (once): `createdb -U postgres(or other user) mapmemo`
-   Apply schema: `psql -U postgres(or other user) -d mapmemo -f backend/db/schema.sql`

DB population:

-   The database population process is proprietary. If you are interested, contact the repository owner.

Session notes:

-   Session id is issued as an HttpOnly cookie (`mapmemo_session_id` by default).
-   In-memory store only; sessions reset on backend restart.

Frontend dev proxy (optional):

-   `VITE_BACKEND_URL` (defaults to `http://localhost:5243`)
