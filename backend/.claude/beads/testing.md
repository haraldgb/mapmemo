# Backend Testing

## Setup

- xUnit 2.9
- `Microsoft.AspNetCore.Mvc.Testing` — in-process integration tests
- Project: `MapMemo.Api.Tests/`

## Test infrastructure

```
TestHelpers/
├── MapMemoApiFactory.cs        WebApplicationFactory<Program> subclass
├── TestHttpClientFactory.cs    Creates HttpClient with CookieContainer
└── TestModels.cs               Response DTOs for deserialization
```

## Patterns

- Integration tests hit real endpoints via `WebApplicationFactory`
- Session flow: call `/api/health` first to get session cookie, then use same `CookieContainer` for subsequent requests
- Use `TestHttpClientFactory.CreateClientWithCookies(factory, cookies)` to get a cookie-aware client
- Assert HTTP status codes and deserialize JSON responses

## Running

```bash
dotnet test MapMemo.Api.Tests/MapMemo.Api.Tests.csproj
dotnet test MapMemo.Api.Tests/MapMemo.Api.Tests.csproj --filter "FullyQualifiedName~MethodName"
```

## Conventions

- Test class per feature area (currently `EndpointsTests`)
- Test names: `Method_condition_expected_result` (e.g., `Health_returns_ok_and_sets_session_cookie`)
- `sealed` test classes
- `using` statements for factory and client (IDisposable)
