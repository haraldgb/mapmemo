# PR Review: refactor: extract generic localStorage utility from game settings (#33)

**Branch:** `claude/implement-todo-item-3G0l3` → `develop`
**Files changed:** 2 (new `frontend/src/utils/localStorage.ts`, modified `frontend/src/duck/sagaUtils.ts`)
**Net change:** +42 / -31

## Summary

This PR extracts the repetitive localStorage boilerplate (SSR guard, JSON parsing, error handling, validation) from `sagaUtils.ts` into two reusable generic utility functions: `loadFromLocalStorage<T>` and `saveToLocalStorage`. It resolves the TODO comments that were in the original code.

## What's good

1. **Clean generic API.** `loadFromLocalStorage` takes a type-guard function `(value: unknown) => value is T` and returns `T | null`. This is a well-designed pattern that preserves type safety while being fully reusable.

2. **Behavior preservation.** The SSR guard (`typeof window === 'undefined'`), try-catch error handling, and silent failure for storage errors are all faithfully carried over to the utility.

3. **Simpler call sites.** `loadGameSettings` and `saveGameSettings` are now focused on domain logic (defaults, normalization) rather than storage mechanics. This is a clear improvement in readability.

4. **Good file placement.** `frontend/src/utils/localStorage.ts` is a sensible location for a cross-cutting utility.

## Issues & suggestions

### 1. `saveToLocalStorage` value parameter should be generic (minor)

`saveToLocalStorage` accepts `value: unknown`, which means any value can be passed without type checking. Consider making it generic to match the load function's pattern:

```typescript
export const saveToLocalStorage = <T>(key: string, value: T): void => {
```

This is a minor improvement — it doesn't prevent bugs in the current usage, but it establishes a consistent typed contract for future callers and prevents accidentally passing `undefined` or other non-serializable values without a type error.

### 2. Redundant nullish coalescing after validation (nitpick)

In `loadGameSettings`:

```typescript
const stored = loadFromLocalStorage(SETTINGS_STORAGE_KEY, isValidSettings)
if (!stored) {
  return null
}
return {
  modeCount: stored.modeCount ?? MODE_OPTIONS[0]?.value ?? 10,
  selectedAreas: normalizeSelectedAreas(stored.selectedAreas),
}
```

After `isValidSettings` passes, `stored.modeCount` is guaranteed to be a valid number (the type guard checks `isValidModeCount`). The `?? MODE_OPTIONS[0]?.value ?? 10` fallback can never trigger. This was present in the original code too, so it's not a regression — but since you're refactoring this area, it's an opportunity to simplify to just `stored.modeCount`.

### 3. `isValidSettings` doesn't validate `selectedAreas` (pre-existing)

The type guard asserts `value is GameSettings` but only checks `modeCount`. `selectedAreas` is not validated in the guard — it's instead normalized after the fact by `normalizeSelectedAreas`. This means `isValidSettings` can return `true` for an object with `selectedAreas: 42`, which then gets silently coerced to `[]` by the normalizer.

This is a pre-existing design choice and not introduced by this PR, but worth noting since the guard's type assertion is technically broader than what it validates.

### 4. No unit tests for the new utility

There are no tests for `loadFromLocalStorage` or `saveToLocalStorage`. Since this utility is now the single point of control for all localStorage access in the app, and the project already has a test setup (`utils.test.ts` exists with Vitest/Jest patterns), adding a test file for the new utility would be valuable. The functions are pure and easy to test with a mocked `window.localStorage`.

### 5. Commit history housekeeping (minor)

The PR includes a package-lock.json update and its subsequent revert (commits `d0ff745` and `21107d5`). Consider squashing these out before merge to keep the history clean.

## Verdict

**Approve with minor suggestions.** The core refactoring is clean, correct, and well-scoped. The behavior is preserved, and the new utility is a good foundation for reuse. The suggestions above are improvements to consider but none are blockers.
