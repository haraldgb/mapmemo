# CI Pipeline

GitHub Actions workflow: `.github/workflows/pr.yml`
Runs on all PRs. Two parallel jobs — both must pass.

## Frontend (`frontend-checks`)

Node 24, pnpm (via corepack). Runs sequentially:

1. `pnpm lint` — ESLint, zero warnings allowed (`--max-warnings 0`)
2. `pnpm format-check` — Prettier
3. `pnpm type-check` — `tsc -b --noEmit`
4. `pnpm test` — Jest

Combined: `pnpm run-checks`

## Backend (`backend-checks`)

.NET 10. Runs sequentially:

1. `dotnet format --verify-no-changes` (both API and Tests projects)
2. `dotnet test` (xUnit)

## Before pushing

- Frontend: run `pnpm run-checks` from `frontend/`
- Backend: run `dotnet format` then `dotnet test` from `backend/`
