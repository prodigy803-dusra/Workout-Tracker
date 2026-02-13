# Architecture Rules — Workout Tracker

> These rules govern how code is written during the LogScreen refactor
> and all future feature work. Every PR / change must comply.
> When a rule conflicts with "getting it done fast," the rule wins.

---

## 1. STATE AUTHORITY

**SQLite is the single source of truth for all persistent workout data.**

- A `useSessionStore` hook (backed by `useReducer`) holds the in-memory
  representation of the active draft session. It is the *only* place
  components read workout data from.
- The store is hydrated from SQLite on mount / focus and flushed to
  SQLite on explicit commit points (blur, complete-set, finish, discard).
- Components **must not** create their own `useState` copies of sets,
  slots, drops, or notes. They receive data and dispatch callbacks from
  the store.
- **Allowed local state:** transient UI-only concerns such as:
  - Which slot card is expanded (`expandedSlots`)
  - Whether the notes section is open (`notesExpanded`)
  - Plate calculator visibility
  - The raw text a user is currently typing (see §2)

### How this maps to our project

| Before (current) | After (target) |
|---|---|
| 7 separate `useState` in `LogScreen` (`draft`, `slots`, `optionsBySlot`, `setsByChoice`, `lastTimeBySlot`, `dropsBySet`, `sessionNotes`) | Single `useSessionStore()` returning `{ state, dispatch }` |
| `setSetsByChoice(prev => ...)` copy-pasted 6× | `dispatch({ type: 'UPDATE_SET', ... })` |
| Raw SQL in `LogScreen` for batch-loading sets/drops, saving notes | Repo functions in `sessionsRepo` / `setsRepo` |

---

## 2. EDITING CONTRACT

**Never mutate the user's in-progress keystrokes.**

- While a `TextInput` is focused, the component keeps the **exact string**
  the user typed (e.g. `"12."`, `""`, `"0"`).
- **No parsing, rounding, clamping, or formatting during `onChangeText`.**
- Numeric conversion happens **only** at a commit point:
  - `onEndEditing` / `onBlur`
  - `onSubmitEditing`
  - Explicit button press (e.g. "Complete Set")
- At the commit point, dispatch an action like
  `dispatch({ type: 'COMMIT_WEIGHT', setId, raw: "12.5" })`.
  The reducer parses, clamps, and writes the canonical number.

### Current violation

```tsx
// ❌ Current — parses on every keystroke, destroys "12." → 12
onChangeText={(text) => {
  const weight = text === '' ? 0 : (parseFloat(text) || 0);
  setSetsByChoice(prev => ({ ... }));
}}
```

```tsx
// ✅ Target — keeps raw string, commits on blur
const [rawWeight, setRawWeight] = useState(String(s.weight));
<TextInput value={rawWeight} onChangeText={setRawWeight} />
onEndEditing={() => dispatch({ type: 'COMMIT_WEIGHT', setId: s.id, raw: rawWeight })}
```

---

## 3. TRANSITIONS (actions & side effects)

**User interactions dispatch named actions. Side effects derive from
state transitions, not from ad-hoc code inside component handlers.**

- Every meaningful user action maps to a named dispatch:
  `COMPLETE_SET`, `UNCOMPLETE_SET`, `UPDATE_WEIGHT`, `UPDATE_REPS`,
  `CYCLE_RPE`, `ADD_SET`, `DELETE_SET`, `ADD_DROP_SEGMENT`,
  `DELETE_DROP_SEGMENT`, `SELECT_SLOT_CHOICE`, `SAVE_NOTES`,
  `FINISH_SESSION`, `DISCARD_SESSION`, `GENERATE_WARMUPS`.
- The reducer returns new state. A **separate effect layer** (a
  `useEffect` or middleware function) watches for transitions and
  triggers side effects:
  - `COMPLETE_SET` → persist to DB, start rest timer, auto-expand next slot
  - `FINISH_SESSION` → persist notes, finalize, detect PRs, navigate
  - `DISCARD_SESSION` → delete from DB, reset state
- Components never call `timer.start(...)` or `navigation.navigate(...)`
  directly inside `onPress`. They only `dispatch(...)`.

### Why this matters for us

The current `onPress` handler for completing a set is ~80 lines that
interleaves DB writes, optimistic state patches, next-set scanning,
timer starts, haptics, and auto-expand logic. If any step throws, the
state is partially mutated. The reducer + effect pattern makes each
concern testable in isolation.

---

## 4. RENDERING

**UI is a pure projection of state. No business logic in JSX.**

- Render functions receive data and return JSX. Period.
- No IIFEs inside JSX — e.g. the current `(() => { ... })()` blocks for
  the progressive overload suggestion and warm-up generator become
  extracted components that receive pre-computed props.
- Derived values (total volume, progress %, suggestion text) are computed
  via `useMemo` selectors on the store state, not recalculated inline.
- Components that depend on a subset of state use `React.memo` with
  stable props to avoid unnecessary re-renders.

---

## 5. PREDICTABILITY OVER CLEVERNESS

- **Do not auto-correct values** — if the user types `0` for weight,
  keep it; don't silently replace with the last-session value.
- **Do not infer intent** — if the user clears a reps field, store `""`
  until commit; don't assume they meant `0`.
- **Wait for commit points** — changes to the DB happen on blur /
  submit / explicit action, never on every keystroke.
- When multiple behaviors are possible (e.g. user starts a session while
  one is active), present an explicit choice via `Alert.alert` rather
  than auto-resolving.

---

## 6. STRUCTURE

### File organization (target)

```
src/
  hooks/
    useSessionStore.ts      ← reducer + DB sync for active session
    useRestTimer.ts          (existing — keep as-is)
  screens/
    LogScreen.tsx            ← ~300 lines: orchestrates layout, passes
                               store data to child components
    LogScreen.styles.ts      ← extracted StyleSheet
  components/
    IdleScreen.tsx           ← idle dashboard (currently inline)
    SlotCard.tsx             ← expandable exercise card
    SetRowEditor.tsx         ← single set: weight/reps/RPE inputs
    DropSegmentRow.tsx       ← drop-set segment row
    RestTimerModal.tsx       ← rest timer overlay
    SessionSummaryHeader.tsx ← duration / sets / volume bar
    ProgressiveOverloadBanner.tsx
    WarmupGeneratorButton.tsx
```

### Reducer shape (sketch)

```ts
type SessionState = {
  phase: 'idle' | 'active' | 'finishing';
  draft: Session | null;
  slots: DraftSlot[];
  optionsBySlot: Record<number, SlotOption[]>;
  setsByChoice: Record<number, SetData[]>;
  dropsBySet: Record<number, DropSegment[]>;
  lastTimeBySlot: Record<number, LastTimeData>;
  sessionNotes: string;
};

type SessionAction =
  | { type: 'HYDRATE'; payload: SessionState }
  | { type: 'COMPLETE_SET'; setId: number }
  | { type: 'UNCOMPLETE_SET'; setId: number }
  | { type: 'COMMIT_WEIGHT'; setId: number; raw: string }
  | { type: 'COMMIT_REPS'; setId: number; raw: string }
  | { type: 'CYCLE_RPE'; setId: number }
  | { type: 'DELETE_SET'; choiceId: number; setIndex: number }
  | { type: 'ADD_DROP_SEGMENT'; setId: number; weight: number; reps: number }
  | { type: 'UPDATE_DROP_SEGMENT'; segmentId: number; weight: number; reps: number }
  | { type: 'DELETE_DROP_SEGMENT'; setId: number; segmentId: number }
  | { type: 'SELECT_CHOICE'; slotId: number; templateOptionId: number }
  | { type: 'SAVE_NOTES'; text: string }
  | { type: 'FINISH' }
  | { type: 'DISCARD' }
  | { type: 'RESET' };
```

---

## 7. REFACTORING GROUND RULES

These tactical rules prevent the "refactor broke everything" scenario:

1. **One extraction at a time.** Move one component/hook out, verify the
   app still runs, commit. Then move the next.
2. **Keep the old code working until the new code is proven.** Don't
   delete the inline code until the extracted version renders identically.
3. **No behavior changes during extraction.** The first pass is a pure
   mechanical move. Bug fixes and improvements come in a separate step.
4. **Test at the boundary.** After each extraction, manually verify:
   - App launches without crash
   - Can start a session from a template
   - Can type weight/reps, complete a set, see timer
   - Can finish / discard a session
   - History shows the completed session
5. **Commit after each green check.** If step N+1 breaks, we revert to
   step N, not to the beginning.
6. **Update CHANGELOG.md** with every change — file, what, why, risk.

---

## Quick reference: current violations

| Rule | Where | Violation |
|---|---|---|
| §1 State Authority | `LogScreen.tsx` L260 | 7 `useState` copies of DB data |
| §1 State Authority | `LogScreen.tsx` L340, L370 | Raw SQL bypassing repos |
| §2 Editing Contract | `LogScreen.tsx` L867–873 | `parseFloat` inside `onChangeText` |
| §3 Transitions | `LogScreen.tsx` L778–860 | 80-line `onPress` with interleaved DB writes, timer, nav |
| §4 Rendering | `LogScreen.tsx` L693, L702 | IIFEs in JSX for suggestions/warmups |
| §6 Structure | `LogScreen.tsx` | 1605 lines, 5+ components + 407 lines of styles in one file |
