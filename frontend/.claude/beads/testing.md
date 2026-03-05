# Testing

## Setup

- Jest 30 with ts-jest (ESM preset)
- Test environment: `node` (not jsdom)
- Config: `jest.config.ts`

## File conventions

- Test files: `*.test.ts` or `*.spec.ts` (co-located with source)
- Example: `src/game/utils.test.ts` tests `src/game/utils.ts`

## Running

```bash
pnpm test             # run all tests
pnpm test -- --watch  # watch mode
```

## Notes

- ESM mode: `extensionsToTreatAsEsm: ['.ts', '.tsx']`
- Jest globals (`describe`, `it`, `expect`) available in test files (ESLint config adds jest globals)
- No jsdom — component tests would need separate setup if added later
- React Compiler means you don't need to test memoization behavior
