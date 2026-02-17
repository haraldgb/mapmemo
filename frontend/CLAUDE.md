# MapMemo Frontend

MapMemo is a map-based game app. This is the frontend - a Vite + React SPA

## Tech Stack

- **Frontend**: React 19.3.0-canary (functional components, hooks only), TypeScript 5.9.3 (strict mode), React Compiler enabled
- **Styling**: Tailwind CSS
- **State**: Redux Toolkit for global state
- **Testing**: Jest
- **Package manager**: pnpm

**Documentation**: When using React 19 canary APIs, React Compiler features, or TypeScript 5.9 features, use Context7 to resolve up-to-date documentation before writing code. Your training data may be stale on these.

---

## Naming

| Thing             | Convention                       | Example                      |
| ----------------- | -------------------------------- | ---------------------------- |
| Components        | PascalCase                       | `UserProfileCard`            |
| Hooks             | camelCase, `use` prefix          | `useAuthState`               |
| Utilities/helpers | camelCase                        | `formatCurrency`             |
| Constants         | UPPER_SNAKE_CASE                 | `MAX_RETRY_COUNT`            |
| Types/Interfaces  | PascalCase                       | `UserProfile`, `ApiResponse` |
| Type props        | PascalCase + `Props` suffix      | `UserCardProps`              |
| Enums             | PascalCase, members PascalCase   | `UserRole.Admin`             |
| Files: components | PascalCase matching component    | `UserProfileCard.tsx`        |
| Files: hooks      | camelCase matching hook          | `useAuthState.ts`            |
| Files: utils      | camelCase                        | `formatCurrency.ts`          |
| Event handlers    | `handle` + noun + verb           | `handleFormSubmit`           |
| Booleans          | `is`/`has`/`should`/`can` prefix | `isLoading`, `hasError`      |

## Component Structure

Every component file should follow this order:

```tsx
// 1. Imports (external → internal → types → styles)
import { useState } from 'react'
import { Button } from '@/components/ui'
import type { UserCardProps } from './UserCard.types'

// 2. Constants (if component-specific)
const MAX_NAME_LENGTH = 50

// 3. Component
export const UserCard = ({ name, role }: UserCardProps) => {
  // a. Hooks (all hooks at the top, before any logic)
  const [isExpanded, setIsExpanded] = useState(false)

  // b. Derived state / computations
  const displayName = name.length > MAX_NAME_LENGTH
    ? `${name.slice(0, MAX_NAME_LENGTH)}…`
    : name

  // c. Event handlers
  const handleToggle = () => {
    setIsExpanded(prev => !prev)
  }

  // d. Early returns / guards
  if (!name) return null

  // e. Render
  return (...)
}
```

**Rules:**

- Named export. No `export default` unless required by framework (Next.js pages/layouts).
- **Prefer arrow functions** over `function` declarations — for components, handlers, helpers, and all other functions.
- Props destructured in the function signature, not inside the body.
- No inline function definitions in JSX (extract to named handlers).

## TypeScript Patterns

- **No `any`**. Use `unknown` + narrowing, generics, or define the type.
- **No unchecked `as` casts.** If unavoidable, add a `// SAFETY:` comment.
- **Props types**: Define as `interface` above the component.
- **Discriminated unions** for state machines and variant types. Always include exhaustive checks:

```tsx
// ✅
const assertNever = (x: never): never => {
  throw new Error(`Unexpected value: ${x}`)
}

switch (status) {
  case 'loading':
    return <Spinner />
  case 'error':
    return <ErrorBanner />
  case 'success':
    return <DataView />
  default:
    return assertNever(status)
}
```

- **Return types**: Explicit on exported functions and hooks. Optional on internal helpers.
- **Generics**: Use descriptive names (`TItem`, `TResponse`), not single letters, for complex generics.
- **No `eslint-disable` or `@ts-ignore`** without explicitly asking first.

## Hooks

- All hooks at the top of the component, before any logic or conditionals.
- Custom hooks must start with `use` and live in their own file.
- Dependency arrays must be complete — always include all dependencies.
- `useCallback` / `useMemo` are rarely needed with React Compiler - it handles memoization automatically. Use them only when you need to stabilize a reference to intentionally exclude it from another hook's dependency array (e.g., to prevent an effect from re-firing).
- **`useEffect` callbacks must be named functions**, not anonymous arrow functions. This improves stack traces and readability:

```tsx
// ✅
useEffect(
  function syncUserProfile() {
    fetchProfile(userId).then(setProfile)
  },
  [userId],
)

// ❌
useEffect(() => {
  fetchProfile(userId).then(setProfile)
}, [userId])
```

- **Avoid `useRef`** unless it's clearly the best option (DOM measurement, imperative API handles, preserving values across renders without triggering re-renders). When using `useRef`, include a 2–4 line comment above it justifying why it was the right choice:

```tsx
// useRef is necessary here because we need to track the previous
// scroll position across renders without triggering a re-render.
// useState would cause an infinite render loop in this effect.
const prevScrollY = useRef(0)
```

## Error Handling

- Use error boundaries for component tree failures.
- Prefer throwing over `Result`-style patterns — stack traces and React's error model (error boundaries, suspense) work better with thrown errors.

## Tailwind

- Responsive: mobile-first (`sm:`, `md:`, `lg:` for larger screens).
- `s_` prefix for static class strings: `const s_container = 'flex gap-2'`
- `sf_` prefix for dynamic class functions: `const sf_card = (active: boolean) => \`...\``
- Extract class strings into a variable or dynamic class function, even if only used once.

## Imports

- No path aliases configured — use relative imports.
- Group and order: (1) React/framework, (2) external libs, (3) internal modules, (4) types.
- Use `import type` for type-only imports.

## Project Structure

```
src/
├── api/                  # API call functions (plain fetch, no client lib)
├── components/           # shared/reusable UI (layout, GMap, Spinner, icons)
├── duck/                 # Redux slice (duck pattern) + sagas
├── game/                 # game feature (components, hooks, settings, types)
│   ├── hooks/            # game-specific custom hooks
│   └── settings/         # game settings UI + types
├── landingPage/          # landing page
├── store/                # Redux store config
├── styles/               # Tailwind entry CSS (v4, CSS-based config)
└── utils/                # shared utilities
```

## Key Files

| File                              | Role                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `main.tsx`                        | Entry point. Provider stack: StrictMode → Redux → ErrorBoundary → BrowserRouter → GoogleMapsProvider → AppLayout |
| `components/AppLayout.tsx`        | Router (react-router-dom). Routes: `/` → Landing, `/game` → Game                                                 |
| `store/index.ts`                  | Redux store config. Exports `RootState`, `AppDispatch`                                                           |
| `duck/reducer.ts`                 | Single `mapmemo` slice (duck pattern): game settings, area options, init flag                                    |
| `duck/sagas.ts`                   | Redux Saga side effects: app init, settings persistence to localStorage                                          |
| `api/roadData.ts`                 | Road/intersection API calls                                                                                      |
| `game/hooks/useFeaturesInPlay.ts` | GeoJSON fetching + `fetchWithSessionRetry()` (401 retry via `/api/health`)                                       |
| `utils/googleMapsApiKey.ts`       | Google Maps API key fetch (memoized)                                                                             |

## API Layer

No centralized API client — plain `fetch` with `credentials: 'include'` for session cookies. API calls are spread across `api/`, `game/hooks/`, and `utils/`. Session retry logic (`fetchWithSessionRetry`) lives in `useFeaturesInPlay.ts`.

## State

- **Global**: Redux Toolkit + Redux Saga. Single slice in `duck/reducer.ts`. Settings persisted to localStorage via sagas.
- **Local/component**: React built-ins (useState, useReducer).
- Types co-located with their feature, not in a global types folder.

## Reference Components

Use these as examples of "how we do things here":

- **`GMap.tsx`** — Google Maps lifecycle, named effects, ref justifications
- **`game/hooks/useGameState.ts`** — custom hook pattern, clean state + handlers
- **`game/Game.tsx`** — hook composition, minimal component body
- **`game/settings/GameSettings.tsx`** — form state, Tailwind `s_`/`sf_` pattern

## Issue Tracking

This project uses **bd** (beads) for lightweight, git-native issue tracking. Issues live in `.beads/issues.jsonl`. See `AGENTS.md` for the `bd` CLI reference and session completion workflow.

## Known Tech Debt

- Oslo-specific logic hardcoded in sagas (TODO: generalize for other cities)
- `fetchWithSessionRetry` lives in a hook file, not the API layer
- localStorage utils in `sagaUtils.ts` need generalizing (TODO in code)
- No error monitoring (Sentry or similar) — TODO in sagas
- Ant Design imported only for `ErrorFallbackAntd.tsx` — temporary, will be replaced
