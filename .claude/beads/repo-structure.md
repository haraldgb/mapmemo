# Repo Structure

Loose monorepo — no monorepo tooling (no nx, turborepo, or pnpm-workspace). Frontend and backend are independent projects that share a git repo.

```
mapmemo/
├── frontend/          React/TS SPA — pnpm, Vite, Vercel
├── backend/           C#/.NET 10 API — dotnet, PostgreSQL
│   └── db/
│       ├── schema.sql
│       └── data/      git submodule (mapmemo-data)
└── .github/workflows/ shared CI
```

## Key rules

- Frontend and backend have **separate dependency management** (pnpm vs dotnet)
- The `backend/db/data/` directory is a **private git submodule** — don't commit changes to it directly
- Environment variables differ per stack — see each stack's beads
- `/api` routes in frontend dev proxy to backend via Vite (`VITE_BACKEND_URL`, default `http://localhost:5243`)
