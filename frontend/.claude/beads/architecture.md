# Frontend Architecture

## Stack

- React 19.3.0-canary with **React Compiler** (babel-plugin-react-compiler) — do NOT add manual `useMemo`/`useCallback` for performance; the compiler handles it
- Vite 7 + TypeScript 5.9 (strict mode)
- Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- Ant Design 6 for UI components
- React Router v7 (BrowserRouter)
- react-error-boundary for global error boundary

## App structure

```
src/
├── main.tsx                 Entry: StrictMode > Redux > ErrorBoundary > Router > GoogleMaps > AppLayout
├── components/              Shared UI (GMap, AppLayout, AppHeader, Spinner, etc.)
├── game/                    Game feature (Game.tsx, hooks/, settings/)
├── landingPage/             Landing page
├── duck/                    Redux slice + sagas
├── store/                   Redux store config
├── api/                     Data fetching (roadData.ts)
├── utils/                   Shared utilities
└── styles/                  Global CSS
```

## Routes

- `/` — Landing page
- `/game` — Game (map + HUD + settings)

## Component patterns

- Named exports only — no default exports (ESLint enforced)
- PascalCase arrow functions with explicit block body + return
- Tailwind classes via `const s_name = '...'` variables (not inline), prefixed `s_` for static, `sf_` for dynamic (functions)
- useEffect callbacks must be **named functions**, not arrow functions
- Props typed inline or via `type Props = { ... }` above the component
