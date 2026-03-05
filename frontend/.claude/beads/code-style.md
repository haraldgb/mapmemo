# Code Style

## ESLint (flat config, `eslint.config.js`)

Critical rules — violations fail CI:

- `import/no-default-export: error` — named exports only (exception: `vite.config.ts`)
- `no-console: error` — no console.log/warn/error
- `no-throw-literal: error` — only throw Error objects
- `curly: all` — always use braces, even for single-line if/else
- `brace-style: 1tbs` — opening brace on same line, no single-line blocks

Warnings:

- Hook callbacks (useEffect, useMemo, useCallback) must be **named functions**, not arrow functions
- PascalCase arrow functions must use explicit block body with return (no implicit return)

Disabled:

- `react-hooks/exhaustive-deps: off` — deps managed manually

## Prettier (`.prettierrc.json`)

```
no semicolons | single quotes | trailing commas | 80 char width
2-space indent | single attribute per line | JSX single quotes
```

## TypeScript

- Strict mode enabled (all strict flags)
- ESM modules (`"type": "module"` in package.json)
- Explicit `.ts`/`.tsx` extensions in imports

## Tailwind patterns

Style variables at bottom of component file:

- `s_` prefix for static class strings: `const s_container = 'flex gap-2'`
- `sf_` prefix for dynamic class functions: `const sf_card = (active: boolean) => \`...\``
