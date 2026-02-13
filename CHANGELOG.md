# Workout Tracker — Change Log

> **Purpose:** Track every change made to the codebase so we can trace back if something breaks.
> Each entry records *what* changed, *where*, *why*, and a risk assessment.

---

## App Architecture Summary (baseline snapshot)

### Tech Stack
- **Framework:** Expo SDK 54 + React Native 0.81 + React 19
- **Language:** TypeScript 5.9
- **Navigation:** React Navigation 7 (bottom tabs + native stacks)
- **Database:** expo-sqlite 16 (synchronous open, async queries), WAL mode, foreign keys ON
- **Lists:** @shopify/flash-list for history, SectionList for exercises
- **Charts/Visuals:** react-native-svg (TrendChart, VolumeChart, CalendarHeatmap, MuscleMap, PlateCalculator)
- **Notifications:** expo-notifications (rest timer)
- **Haptics:** expo-haptics

### Screen Map
| Tab | Stack Screens | File |
|---|---|---|
| Log | LogHome → WorkoutSummary | `LogScreen.tsx`, `WorkoutSummaryScreen.tsx` |
| History | HistoryHome → SessionDetail | `HistoryScreen.tsx`, `SessionDetailScreen.tsx` |
| Templates | TemplatesHome → TemplateEditor | `TemplatesScreen.tsx`, `TemplateEditorScreen.tsx` |
| Exercises | ExercisesHome → ExerciseDetail | `ExercisesScreen.tsx`, `ExerciseDetailScreen.tsx` |
| Settings | (single screen) | `SettingsScreen.tsx` |

### Data Model (34 migrations)
```
exercises ──< exercise_options
templates ──< template_slots ──< template_slot_options ──< template_prescribed_sets
sessions  ──< session_slots  ──< session_slot_choices   ──< sets ──< drop_set_segments
personal_records (exercise_id, session_id, pr_type, value)
body_weight (weight, unit, measured_at)
app_settings (key/value store for theme, unit, library version, etc.)
```

### Key Patterns
- All weights stored internally in **kg**; converted on display via `formatWeight` / `parseWeight`
- Exercise names normalized via `normalizeName()` for dedup (lowercase, trimmed, single-spaced)
- Draft sessions: status='draft' → user logs sets → finalize → status='final'
- Historical carry-forward: new drafts pre-populate weight/reps from last finalized session
- Warm-up sets flagged `is_warmup=1`, excluded from stats/volume/PR calculations
- Drop-set segments stored in a child table `drop_set_segments`
- PR detection runs on finalize (e1RM via Epley + heaviest weight)
- Rest timer uses absolute timestamps + expo-notifications for background accuracy
- Theme persisted in DB (`app_settings`), supports light/dark/system
- Full backup/restore: JSON export of all 14 tables via expo-sharing

### Known Observations (pre-change baseline)
1. **LogScreen.tsx is ~1605 lines** — contains IdleScreen, active workout UI, styles all in one file. High complexity.
2. **Raw SQL in screens** — ExerciseDetailScreen and LogScreen use `executeSqlAsync` directly instead of going through repos.
3. **statsRepo has remaining lines** (200–332) not yet reviewed for `weeklyVolumeByMuscle`, `workoutDaysMap`, `currentStreak`, `prCountsBySession`.
4. **Seed file is 388 lines** with 92+ exercises, demo template seeding, and cleanup logic for old seeded templates.
5. **Backup table list** in SettingsScreen is manually maintained — must stay in sync with schema.
6. **No automated tests for screens/components** — only `src/__tests__/db.test.ts` exists.
7. **No CI/CD pipeline** detected.

---

## Change Log

<!-- 
Template for new entries:

### [YYYY-MM-DD] Change Title
- **Files changed:** `path/to/file.ts` (lines X–Y)
- **What:** Brief description of the change
- **Why:** Motivation / user request
- **Risk:** Low | Medium | High — explanation
- **Rollback:** How to undo if needed
-->

### [2026-02-12] Add ARCHITECTURE.md — refactoring rules & state management contract
- **Files changed:** `ARCHITECTURE.md` (new file, ~200 lines)
- **What:** Created a binding architecture document adapting the user's 6 design rules to this project's specifics (SQLite + Expo + React Navigation). Includes: state authority (single `useReducer` store), editing contract (no parse-on-keystroke), transition rules (dispatch actions, side effects via effects layer), rendering rules (no business logic in JSX), predictability rules (no auto-correct), target file structure, reducer shape sketch, refactoring ground rules (one extraction at a time, verify before deleting old code), and a table mapping each rule to current violations.
- **Why:** Previous refactor attempt broke the app. This document defines the contract *before* any code changes so every step can be validated against it.
- **Risk:** None — documentation only, no code changes.
- **Rollback:** Delete `ARCHITECTURE.md`.

### [2026-02-12] LogScreen refactor — parallel LogScreenV2 with extracted components
- **Files created:**
  - `src/hooks/useSessionStore.ts` — central `useReducer` store replacing 7 `useState` calls. Pure reducer with 15 action types + DB persistence helpers.
  - `src/screens/LogScreen.styles.ts` — extracted StyleSheet (`styles` + `idle`) from LogScreen.
  - `src/components/IdleScreen.tsx` — idle dashboard (greeting, quick-start cards, stats, onboarding).
  - `src/components/SessionSummaryHeader.tsx` — duration / sets / volume progress bar.
  - `src/components/ProgressiveOverloadBanner.tsx` — "Try X kg × Y reps" suggestion.
  - `src/components/WarmupGeneratorButton.tsx` — generate warm-up sets button.
  - `src/components/DropSegmentRow.tsx` — single drop-set segment with §2 editing contract.
  - `src/components/SetRowEditor.tsx` — single set row (radio, weight, reps, RPE, swipe-delete, drops) with §2 editing contract.
  - `src/components/RestTimerModal.tsx` — rest timer overlay with next-set preview.
  - `src/components/SlotCard.tsx` — expandable exercise card aggregating set rows, options, suggestions.
  - `src/screens/LogScreenV2.tsx` — thin orchestrator (~300 lines) assembling all sub-components via useSessionStore.
- **Files modified:**
  - `src/navigation/index.tsx` — added `LogV2` tab (🔬 icon) with `LogV2Stack` pointing to `LogScreenV2`. Original `Log` tab unchanged.
- **What:** Created a parallel refactored version of LogScreen following all ARCHITECTURE.md rules: §1 single reducer store, §2 raw-string-until-blur editing, §3 dispatch-then-effect transitions, §4 pure projection JSX, §6 thin orchestrator + focused sub-components.
- **Why:** LogScreen.tsx was 1605-line monolith with 7+ interleaved useState, parseFloat-on-keystroke, IIFEs in JSX, and DB calls mixed into event handlers. Parallel approach per §7: old LogScreen stays working while V2 is verified.
- **Risk:** Low — original LogScreen.tsx is completely untouched. Only navigation/index.tsx was modified (additive: new tab + new stack). Remove the `LogV2` tab to fully rollback.
- **Rollback:** (1) Delete all new files listed above. (2) Revert `src/navigation/index.tsx` to remove LogV2 imports, LogV2Stack function, and LogV2 Tab.Screen.

### [2026-02-12] Promote LogScreenV2 → LogScreen (retire monolith)
- **Files deleted:** `src/screens/LogScreen.tsx` (old 1605-line monolith)
- **Files renamed:** `src/screens/LogScreenV2.tsx` → `src/screens/LogScreen.tsx`
- **Files modified:** `src/navigation/index.tsx` — removed LogV2 tab and LogV2Stack; Log tab now imports the refactored LogScreen directly.
- **What:** Replaced the old monolithic LogScreen with the refactored version (useReducer store + extracted sub-components). Removed the dev LogV2 tab.
- **Why:** V2 confirmed working by user. Old screen is no longer needed.
- **Risk:** Low — V2 was running in parallel and verified before promotion.
- **Rollback:** Restore old LogScreen.tsx from git history (`git checkout HEAD~1 -- src/screens/LogScreen.tsx`).

### [2026-02-12] Fix keyboard covering inputs + weight-reset-to-0 bug
- **Files modified:**
  - `app.json` — added `softwareKeyboardLayoutMode: "adjustPan"` for Android
  - `src/screens/LogScreen.tsx` (old) — `KeyboardAvoidingView` behavior set to `"padding"` on both platforms, added `keyboardShouldPersistTaps`, debounced auto-save on keystroke, pre-persist on set completion
  - `src/screens/TemplateEditorScreen.tsx` — wrapped in `KeyboardAvoidingView`
  - `src/screens/SettingsScreen.tsx` — wrapped in `KeyboardAvoidingView`
- **What:** (1) Keyboard now pushes content up on Android. (2) Weight/reps are auto-saved 500ms after typing and explicitly saved before completing a set — fixes data loss when slots auto-collapse.
- **Why:** Keyboard was covering text inputs on Android. Last set in each exercise was resetting to 0 because `onEndEditing` never fired on collapse.
- **Risk:** Low — additive changes to existing behavior.
- **Rollback:** Revert `app.json` android block and remove `KeyboardAvoidingView` wrappers.

### [2026-02-12] Fix weight-reset-to-0 bug in refactored LogScreen (V2)
- **Files modified:**
  - `src/screens/LogScreen.tsx` — `handleToggleComplete` now calls `await persistSet()` **before** dispatching `COMPLETE_SET` and `persistSetCompletion()`. This ensures the current in-memory weight/reps string is written to the DB before the reducer marks the set done and the TextInput unmounts.
- **What:** The weight-reset-to-0 bug also existed in the new LogScreen. When a user typed a weight and immediately tapped the complete checkbox, the slot would collapse before `onEndEditing` could fire, losing the typed value. The fix pre-persists weight and reps to the DB before the set is completed.
- **Why:** Regression parity — same root cause as the old LogScreen bug (TextInput unmount before blur).
- **Risk:** Low — adds one extra DB write before set completion; idempotent since `persistSet` UPSERTs.
- **Rollback:** Remove the `await persistSet(...)` call before the `dispatch({ type: 'COMPLETE_SET', ... })` line.

### [2026-02-12] Create sessionStore test suite (51 tests) + update existing tests
- **Files created:**
  - `src/__tests__/sessionStore.test.ts` — 51 unit tests for `sessionReducer` + `INITIAL_STATE` covering:
    - Initial state shape
    - HYDRATE / RESET actions
    - COMPLETE_SET / UNCOMPLETE_SET (toggle behavior)
    - COMMIT_WEIGHT / COMMIT_REPS (§2 editing contract)
    - **Regression: weight-reset-to-0 bug** — verifies weight survives complete→uncomplete cycle
    - CYCLE_RPE cycling through 6→6.5→…→10→null→6
    - DELETE_SET with index bounds
    - ADD_DROP_SEGMENT / REMOVE_DROP_SEGMENT / UPDATE_DROP_SEGMENT
    - SET_NOTES
    - START_WORKOUT / FINISH_WORKOUT / CANCEL_WORKOUT phase transitions
    - Derived values: volume computation (weight × reps, excluding warmups)
    - Multi-action sequences (hydrate → complete → add drop → finish)
    - Unknown action passthrough
- **Files modified:**
  - `src/hooks/useSessionStore.ts` — exported `sessionReducer` (pure function) and `INITIAL_STATE` so tests can import and exercise the reducer directly without mounting React components.
  - `src/__tests__/db.test.ts` — updated 5 tests in the "Next-set preview in timer" section to read from `src/components/RestTimerModal.tsx` (where timer UI now lives) instead of the deleted old `LogScreen.tsx`. Timer-start logic tests now read from the current `src/screens/LogScreen.tsx`.
- **What:** Comprehensive test suite for the session reducer, plus compatibility fixes for existing tests after the LogScreen refactor.
- **Why:** User requested tests to catch regressions ("can we develop a test suite to check for all these things?"). The weight-reset bug had recurred in V2 — tests now guard against it.
- **Risk:** None — test-only changes plus minor export additions to useSessionStore.
- **Rollback:** Delete `src/__tests__/sessionStore.test.ts`. Remove the `export { sessionReducer, INITIAL_STATE }` lines from `useSessionStore.ts`. Revert `db.test.ts` path changes.
- **Test results:** 277 total tests, all passing (226 existing + 51 new).

### [2026-02-12] Add file picker for backup restore
- **Files modified:** `src/screens/SettingsScreen.tsx`, `app.json`, `package.json`
- **What:** Added expo-document-picker for selecting backup JSON files. Paste area collapsible as fallback.
- **Risk:** Low — additive feature.

### [2026-02-12] App Closeout — Phase 1: Fix timer modal backdrop dismiss
- **Files modified:** `src/components/RestTimerModal.tsx`
- **What:** Replaced outer `Pressable` with `View` to prevent accidental timer dismissal on backdrop tap.
- **Risk:** Low — only wrapper element changed.

### [2026-02-12] App Closeout — Phase 2: Dark mode sweep (12 gaps)
- **Files modified:** `SessionSummaryHeader.tsx`, `SetRowEditor.tsx`, `SlotCard.tsx`, `IdleScreen.tsx`, `ErrorBoundary.tsx`, `HistoryScreen.tsx`
- **What:** Fixed 12 hardcoded light-mode colors invisible in dark mode. Rewrote ErrorBoundary with functional wrapper for hook access.
- **Risk:** Low — visual-only, using existing theme tokens.

### [2026-02-12] App Closeout — Phase 3: SessionDetail completeness
- **Files modified:** `sessionsRepo.ts`, `types.ts`, `SessionDetailScreen.tsx`
- **What:** Added drop-set display, unit-aware weights, error handling to session detail screen.
- **Risk:** Low-Medium — display-only screen rewrite.

### [2026-02-12] App Closeout — Phase 4: Loading states & error handling
- **Files modified:** `TemplateEditorScreen.tsx`, `ExerciseDetailScreen.tsx`, `HistoryScreen.tsx`
- **What:** Added ActivityIndicator spinners and Alert.alert error surfacing across three screens.
- **Risk:** Low — additive UX improvements.

### [2026-02-12] App Closeout — Phase 5: Architecture cleanup
- **Files modified:** `navigation/index.tsx`, all screen files, `exercisesRepo.ts`, `App.tsx`
- **What:** (1) Typed all navigators and screen props — compile-time safety for route names and params. (2) Moved direct SQL from ExerciseDetailScreen to `getExerciseGuide`/`getExerciseStats` in exercisesRepo. (3) Replaced emoji tab icons with Ionicons. (4) Integrated expo-splash-screen to hold splash until DB init completes.
- **Risk:** Low — typing is compile-time only; icons are visual; splash is standard Expo pattern.

### [2026-02-12] App Closeout — Phase 6: UX polish (7 items)
- **Files modified:** `ExercisesScreen.tsx`, `SettingsScreen.tsx`, `LogScreen.tsx`, `useRestTimer.ts`, `ThemeContext.tsx`, `UnitContext.tsx`
- **What:** (1) Exercise delete hint text. (2) Body weight long-press to delete. (3) Backup schema validation + column sanitization. (4) O(1) `findChoiceIdForSet` via useMemo Map. (5) Stale notification cleanup on mount. (6) Context error logging (catch blocks + try-catch on writes). (7) App version display via expo-constants.
- **Risk:** Low — all changes are additive or defensive.
