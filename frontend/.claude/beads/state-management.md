# State Management

Two layers: **Redux** for global/complex state, **React built-ins** for local/shared state.

## When to use what

- **Redux** — game settings, area options, cross-feature state, anything needing persistence
- **useState/useReducer** — component-local state (form inputs, toggles, UI state like modals)
- **Context** — shared state scoped to a subtree (would use for theme/auth if needed)
- **Prop drilling** — prefer this over Context for 1–2 levels. Context adds indirection.

**Rule of thumb**: Start local. Move to Redux when state is needed in 3+ unrelated components or needs sagas.

---

## Redux: Global State

Redux Toolkit + Redux Saga. **Do NOT use thunks** — all async side effects go through sagas.

### Structure

```
src/duck/
├── reducer.ts       Single slice: `mapmemo` (createSlice)
├── sagas.ts         Root saga (takeLatest patterns)
├── sagaUtils.ts     Saga helpers (localStorage persistence)
└── IActions.ts      Action type definitions
```

### Redux state shape

```ts
MapmemoState {
  gameSettings: GameSettings    // modeCount, selectedAreas
  areaOptions: AreaOption[]     // available game areas (from GeoJSON)
  isAppInitialized: boolean     // gate for app readiness
}
```

### Conventions

- Actions exported as `mapmemoActions` from the slice
- Dispatch typed as `AppDispatch`, state as `RootState`
- Sagas use `takeLatest` — one handler per action type
- App init: `initializeApp` action dispatched in `AppLayout` mount effect
- Game settings persisted to localStorage via saga side effect
- GeoJSON area options loaded in saga during init

### Adding new state

1. Add field to `MapmemoState` in `reducer.ts`
2. Add reducer case in `createSlice.reducers`
3. If async: add saga handler in `sagas.ts`, wire with `takeLatest` in `mapmemoSaga`
4. Access via `useSelector((state: RootState) => state.mapmemo.yourField)`

---

## Local State: React Built-ins

Use for component-local or small-subtree state that doesn't need persistence or cross-feature access.

### Patterns

**`useState`** — default for simple values

```tsx
const [isOpen, setIsOpen] = useState(false)
const [inputValue, setInputValue] = useState('')
```

**`useReducer`** — when state has multiple related fields or complex transitions

```tsx
const [formState, dispatch] = useReducer(formReducer, initialFormState)
// Prefer when: actions are semantically meaningful, state shape is complex
```

**Context** — shared state scoped to a feature subtree

```tsx
// Only if needed for 3+ levels deep OR 5+ consumers
// Avoid for high-frequency updates (causes all consumers to re-render)
```

### Conventions

- Keep state as low in the tree as possible
- Prefer composition (`children` prop) over Context when possible
- Co-locate state with the components that use it
- Don't hoist state to Redux prematurely — refactoring local → global is straightforward
