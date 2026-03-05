# MapMemo

A geography memorization game. Users learn city neighborhoods and road layouts by clicking on a map. Built as a monorepo with separate frontend and backend.

## Repo Structure

- `frontend/` — React/TypeScript SPA (Vite, deployed on Vercel)
- `backend/` — C#/.NET 10 API (EFC + PostgreSQL, Docker for tests, deployed independently)
- `backend/db/` — Database schema, migrations, and data submodule

## Workflow

- Push is authorized after landing.
