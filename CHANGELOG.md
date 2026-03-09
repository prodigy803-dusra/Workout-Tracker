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
- **Notifications:** expo-notifications (rest timer + workout reminders)
- **Haptics:** expo-haptics

### Screen Map
| Tab | Stack Screens | File |
|---|---|---|
| Log | LogHome → WorkoutSummary | `LogScreen.tsx`, `WorkoutSummaryScreen.tsx` |
| History | HistoryHome → SessionDetail | `HistoryScreen.tsx`, `SessionDetailScreen.tsx` |
| Templates | TemplatesHome → TemplateEditor | `TemplatesScreen.tsx`, `TemplateEditorScreen.tsx` |
| Exercises | ExercisesHome → ExerciseDetail | `ExercisesScreen.tsx`, `ExerciseDetailScreen.tsx` |
| Settings | (single screen) | `SettingsScreen.tsx` |

### Data Model (41 migrations)
```
exercises ──< exercise_options
templates ──< template_slots ──< template_slot_options ──< template_prescribed_sets
sessions  ──< session_slots  ──< session_slot_choices   ──< sets ──< drop_set_segments
templates ──< template_schedule (day_of_week, hour, minute, enabled)
personal_records (exercise_id, session_id, pr_type, value)
body_weight (weight, unit, measured_at)
active_injuries (body_region, injury_type, severity, notes, started_at, resolved_at)
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
1. ~~**LogScreen.tsx is ~1605 lines**~~ — **Resolved:** Refactored into useSessionStore reducer + 10 extracted components.
2. ~~**Raw SQL in screens**~~ — **Resolved:** ExerciseDetailScreen moved to exercisesRepo; LogScreen uses repos.
3. **statsRepo has remaining lines** (200–332) not yet reviewed for `weeklyVolumeByMuscle`, `workoutDaysMap`, `currentStreak`, `prCountsBySession`.
4. **Seed file is ~450 lines** with 136+ exercises, demo template seeding, and cleanup logic for old seeded templates.
5. **Backup table list** in SettingsScreen is manually maintained — must stay in sync with schema.
6. ~~**No automated tests**~~ — **Resolved:** 472 tests across 5 suites (db, dbIntegration, sessionStore, featureInteraction, midWorkoutEditing).
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

### [2026-03-08] Navigation hardening + onboarding walkthrough
- **Files changed:** `src/navigation/index.tsx`, `src/screens/LogScreen.tsx`, `src/screens/WorkoutSummaryScreen.tsx`, `App.tsx`, `src/components/OnboardingModal.tsx` (new)
- **What:** Two improvements:
  1. **Navigation reliability** — Fixed post-workout jank: `handleFinish` now uses `navigation.replace()` instead of `navigate()`, eliminating the brief idle-screen flash and preventing back-swipe from the summary. WorkoutSummary gets `slide_from_bottom` animation, no back gesture, and the tab bar is hidden for an immersive feel. "Done" button uses `replace('LogHome')` for a clean return. Fixed a stray `}` typo rendering as literal text on LogScreen.
  2. **Android back button hardened** — WorkoutSummary intercepts hardware back via `BackHandler` and redirects to LogHome (prevents popping to stale screen). LogScreen `beforeRemove` now allows `NAVIGATE` actions through (so tab switches don't trigger false alerts), only blocks `POP`/`GO_BACK`. Alert wording clarified: "Your in-progress workout is saved automatically."
  3. **Onboarding walkthrough** — New `OnboardingModal` component: 5-step horizontal-paged intro (Welcome → Templates → Logging → Progress → Get Started) with animated dots, skip button, and swipe support. Persisted via `app_settings.onboarding_complete` key — shows once on first launch, never again.
- **Why:** User reported "janky feeling" with navigation; onboarding needed for store-readiness
- **Risk:** Low — navigation changes are isolated to 3 files, onboarding is a self-contained modal with no side-effects on existing logic
- **Rollback:** Revert listed files; remove OnboardingModal import from App.tsx
- **Tests:** 472 passing (no test changes needed)

### [2026-03-05] Feature batch — Resume prompt, rep-range targets, custom exercises, notifications, CSV export
- **Files changed:** `src/db/migrations.ts`, `src/types.ts`, `src/db/repositories/sessionsRepo.ts`, `src/db/repositories/templatesRepo.ts`, `src/db/repositories/exercisesRepo.ts`, `src/screens/LogScreen.tsx`, `src/screens/ExercisesScreen.tsx`, `src/screens/TemplateEditorScreen.tsx`, `src/screens/SettingsScreen.tsx`, `src/components/SetRowEditor.tsx`, `src/components/SlotCard.tsx`, `App.tsx`, `src/utils/notifications.ts` (new), `src/utils/exportCsv.ts` (new)
- **What:** Six user-facing features implemented in a single batch:
  1. **Resume interrupted workout** — LogScreen detects stale drafts (>2 hrs old) on mount and shows a banner with Resume / Discard options. Prevents accidental data loss from mid-workout app closes.
  2. **Session notes** — Already existed (DB column, store, UI in LogScreen, HistoryScreen, SessionDetailScreen). Verified working, no changes needed.
  3. **Rep-range targets on templates** — Migrations 39–40 add `target_reps_min` / `target_reps_max` columns on `template_slots`. TemplateEditorScreen shows per-slot min/max inputs. During workout, SetRowEditor highlights reps green (in range) or red (out of range). SlotCard header displays target text ("Target: 8–12 reps").
  4. **Custom exercise creation** — Migration 41 adds `is_custom` flag on `exercises`. ExercisesScreen now opens a full modal with name, primary muscle (15 options), equipment (10 options), and assisted toggle. `createExercise` expanded to accept metadata and mark custom exercises.
  5. **Workout reminders** — New `src/utils/notifications.ts` utility: permission request, foreground handler, inactivity-based scheduling via `expo-notifications` TIME_INTERVAL trigger (configurable days, default 3). Settings UI card with enable switch + days picker. Reminder rescheduled after every finished workout and on app launch.
  6. **Export to CSV** — New `src/utils/exportCsv.ts`: queries all finalized sessions with exercises/sets, writes CSV to cache, and shares via OS share sheet. Button added to Settings > Data section.
- **Why:** User selected 6 features from brainstormed list to improve daily usability, data portability, and engagement
- **Risk:** Low–Medium — 3 new migrations (additive only), new notification permission prompt; all existing tests unaffected
- **Rollback:** Revert all listed files; migrations are additive ALTERs so no destructive rollback needed
- **Tests:** 472 passing (no test changes needed — all new features are UI/integration layer)

### [2026-03-05] Quality — Exercise guides comprehensive overhaul
- **Files changed:** `src/data/exerciseGuides.ts`
- **What:** Major quality pass across all exercise guides — upgraded existing tips, replaced generic filler, and added 48 missing exercise guides:
  1. **Bench press upgrade:** Added J-curve bar path, wrist stacking, elbow tucking, and unrack technique tips
  2. **💡 Cue additions (19 exercises):** Added specific, actionable coaching cues to sumo deadlift, trap bar deadlift, stiff leg deadlift, good morning, zercher squat, smith machine squat, donkey calf raise, weighted pushup, diamond pushup, decline barbell bench, neutral pulldown, chest supported row, arnold press, rear delt fly, dumbbell curl, hammer curl, hanging leg raise, pallof press (front squat & chin up already done)
  3. **Generic tip replacement:** Rewrote vague tips ("great exercise", "named after Arnold") with specific, actionable coaching advice across all 19 exercises above
  4. **48 new exercise guides added:** Core/abs (12: crunch, decline crunch, reverse crunch, lying leg raise, captain chair leg raise, bicycle crunch, dead bug, v up, russian twist, dragon flag, decline situp, mountain climber), Cable (10: upright row, reverse fly, front raise, overhead curl, hammer curl, single arm row, shrug, external rotation, internal rotation, standing ab crunch), Dip variations (4: weighted dip, tricep dip, machine dip, ring dip), Machines (6: chest press, shoulder press, lat pulldown, row, preacher curl, seated row), Barbell/DB/BW (11: close grip bench, incline cable fly, DB RDL, reverse lunge, lateral lunge, sissy squat, landmine press, incline hammer curl, spider curl, smith bench, smith incline bench), Forearms (2: wrist curl, reverse wrist curl), Assisted (3: assisted pull up, assisted chin up, assisted dip)
- **Why:** User audit revealed 48 exercises with no guide at all, ~19 with generic/filler tips, and key compound lifts (bench, sumo, trap bar) missing important coaching cues
- **Risk:** Low — data-only change in exerciseGuides.ts, no logic or schema changes
- **Rollback:** Revert `src/data/exerciseGuides.ts` to previous version
- **Tests:** 472 passing (no test changes needed — data-only file)

### [2026-03-05] Feature — Assisted exercises (counterweight machines)
- **Files changed:** `src/db/migrations.ts`, `src/db/seed.ts`, `src/types.ts`, `src/db/repositories/exercisesRepo.ts`, `src/db/repositories/setsRepo.ts`, `src/db/repositories/statsRepo.ts`, `src/db/repositories/sessionsRepo.ts`, `src/hooks/useSessionStore.ts`, `src/components/SlotCard.tsx`, `src/components/ProgressiveOverloadBanner.tsx`, `src/screens/LogScreen.tsx`, `src/screens/ExerciseDetailScreen.tsx`, `src/screens/ExercisesScreen.tsx`, `src/__tests__/db.test.ts`
- **What:** Full support for assisted exercises (dip assist, pull-up assist, chin-up assist) where the weight entered represents counterweight (assistance), not resistance. Key changes:
  1. **Migration 37:** `ALTER TABLE exercises ADD COLUMN is_assisted INTEGER NOT NULL DEFAULT 0`
  2. **Seed:** 3 new exercises (Assisted Pull Up, Assisted Chin Up, Assisted Dip) + Machine Dip auto-marked; LIBRARY_VERSION → 8
  3. **Types:** Added `is_assisted: number` to `Exercise` and `DraftSlot` types
  4. **exercisesRepo:** New `toggleAssisted()` and `isExerciseAssisted()` functions; `listExercises` includes `is_assisted`
  5. **sessionsRepo:** `listDraftSlots` SELECT includes `COALESCE(e.is_assisted, 0) as is_assisted`
  6. **setsRepo:** `recentMaxWeights()` takes `assisted` param — uses MIN (least assistance) instead of MAX
  7. **statsRepo — PR detection:** Skips e1RM for assisted exercises; uses MIN for weight PR; creates `'least_assisted'` PR type
  8. **statsRepo — sessionExerciseDeltas:** Uses MIN aggregate for assisted; reverses progress direction (lower weight = progressed)
  9. **useSessionStore:** Stagnation hydration passes `is_assisted` flag to `recentMaxWeights`
  10. **SlotCard:** `isAssisted` prop — reversed overload suggestion (suggest lower weight), 🔄 icon, "Assist (unit)" column header
  11. **ProgressiveOverloadBanner:** Assisted-specific messaging ("try reducing assist to X")
  12. **ExerciseDetailScreen:** Toggle switch to mark any exercise as assisted; hides e1RM chart for assisted
  13. **ExercisesScreen:** Shows 🔄 icon next to assisted exercise names
- **Why:** User request — "can you consider the weight mentioned as assist rather than lifted? I don't want it to be like I'm lifting something when I am not"
- **Risk:** Low — additive column with default 0; all existing exercises unaffected. Assisted logic isolated behind `is_assisted` flag checks.
- **Tests:** 459 → 472 (13 new tests covering migration, seed, types, repos, UI wiring)

### [2026-03-04] Bug fix — Cross-template weight carry-forward
- **Files changed:** `src/db/repositories/sessionsRepo.ts` (lines ~224, ~382, ~622), `src/__tests__/featureInteraction.test.ts`
- **What:** Fixed a bug where the same exercise in different templates showed different pre-filled weights. Root cause: `getLastPerformedSets(templateSlotOptionId)` was template-specific. Changed all 3 weight pre-fill call sites (`createDraftFromTemplate`, `selectSlotChoice`, `addExerciseToSession`) to use `getLastPerformedSetsForExercise(exerciseId)` which looks globally across all templates.
- **Why:** User observed that Bench Press in "Push Day" and "Upper Body" templates showed mismatched weights even when done on the same day.
- **Risk:** Low — query is broader (finds any session) but always picks the most recent. Fallback to prescribed defaults unchanged.
- **Tests:** 453 → 453 (updated cross-template test to expect global weights)

### [2026-03-04] Bug fix — Rest timer adjustments not persisted
- **Files changed:** `src/hooks/useRestTimer.ts`, `src/hooks/useSessionStore.ts`, `src/screens/LogScreen.tsx`
- **What:** When users tapped +15s / −15s during a rest timer, the adjustment was only in-memory and lost on reload. Added:
  1. `onRestAdjusted` callback in `TimerContext` type — `start()` captures it, `addTime()` calls it with the new total.
  2. `UPDATE_REST` action in the session reducer — persists the adjusted rest time to the DB set row.
  3. LogScreen wiring: provides the callback that calls `persistSet()` and dispatches `UPDATE_REST`.
- **Why:** User noted "remember rest timers?" — adjustments were ephemeral.
- **Risk:** Low — additive change; no schema migration needed.
- **Tests:** 453 passing

### [2026-03-04] Feature — Stagnation detection & warning banner
- **Files changed:** `src/db/repositories/setsRepo.ts`, `src/hooks/useSessionStore.ts`, `src/components/SlotCard.tsx`, `src/components/ProgressiveOverloadBanner.tsx`, `src/screens/LogScreen.tsx`, `src/__tests__/featureInteraction.test.ts`
- **What:** Detects when a user has been lifting the same top weight for 3+ consecutive sessions and shows a warning:
  1. New `recentMaxWeights(exerciseId, limit)` query in setsRepo — returns per-session max completed working-set weight.
  2. Hydration in `useSessionStore` computes `stagnationBySlot` — counts consecutive sessions within ~2% or 2.5 units of the latest max weight.
  3. `SlotCard` receives `stagnantSessions` prop; when ≥3, `ProgressiveOverloadBanner` shows an orange "⚠️ Same top weight for N sessions" warning with actionable suggestions.
- **Why:** User requested "next weight suggestion should not only look at the last session but see if they are stagnant."
- **Risk:** Low — read-only stagnation check during hydration; no writes; purely informational.
- **Tests:** 453 → 459 (+6 stagnation tests: recentMaxWeights accuracy, stagnation counting, threshold tolerance, limit param, empty exercise)

### [2026-03-04] Feature — Weekly PDF summary (shareable)
- **Files changed:** `src/db/repositories/statsRepo.ts`, `src/utils/weeklyPdf.ts` (new), `src/screens/SettingsScreen.tsx`, `package.json`
- **What:** Users can generate a shareable PDF report summarising their week's workouts:
  1. New `weeklyReportData(startDate, endDate)` in statsRepo — gathers sessions, per-exercise breakdown, muscle volume, PR counts for a date range.
  2. New `src/utils/weeklyPdf.ts` — builds styled HTML, converts to PDF via `expo-print`, opens share sheet via `expo-sharing`.
  3. SettingsScreen: "Weekly Summary" section with "This Week" and "Last Week" buttons.
  4. Added `expo-print` dependency.
- **Why:** User asked "How to share data maybe send a PDF to a trainer?"
- **Risk:** Low — new screens/utilities only; no schema changes. `expo-print` is a well-supported Expo module.
- **Tests:** 459 passing (repo query tested implicitly through existing data; PDF generation is runtime-only)

### [2026-03-03] Universal pre-workout check-in (redesign)
- **Files changed:** `src/components/IdleScreen.tsx`, `src/__tests__/db.test.ts`
- **What:** Redesigned the pre-workout check-in to be **universal** — it now appears before every workout, not just when injuries exist. New features:
  1. **Readiness selector:** Three mood chips ("💪 Feeling Great", "👍 Good to Go", "🤕 A Bit Sore") give a quick "How are you feeling?" moment.
  2. **Active injuries section:** Still shown when injuries exist (severity, weight %, notes).
  3. **Inline injury logging:** "🩹 Anything bothering you? Log an injury" button opens InjuryModal directly from the check-in — no need to navigate to Settings first.
  4. Removed old "Manage Injuries" navigation button; replaced with inline logging.
  5. Modal content now scrollable for longer injury lists.
- **Why:** User wanted every workout to start with a general check-in, with the option to note injuries regardless of whether any are already logged in Settings.
- **Risk:** Low — no DB changes, no new migrations. Only UI flow change (always show modal instead of conditionally).
- **Tests:** 453 passing (+6 net: replaced 2 old conditional tests with 4 new universal ones, added readiness + inline logging tests)

### [2026-03-03] Pre-workout injury check-in modal (superseded)
- **Files changed:** `src/components/IdleScreen.tsx`
- **What:** ~~When tapping "Start →" on a template with active injuries, a check-in modal now appears listing each injury with its severity, weight %, and notes.~~ **Superseded** by universal pre-workout check-in above.
- **Why:** User wanted a conscious check-in before working out with injuries.
- **Risk:** Low
- **Tests:** 451 passing (now superseded by 453)

### [2026-03-03] Fix WorkoutSummaryScreen hooks + JSX crash
- **Files changed:** `src/screens/WorkoutSummaryScreen.tsx`
- **What:** Fixed two runtime crashes: (1) `useMemo` was after early return, violating Rules of Hooks when navigating to summary with empty state; (2) JSX `<>` fragment inside `<Text>` caused "Text strings must be rendered within a Text component" error. Replaced fragment with array-join string concatenation.
- **Why:** Finalizing an empty workout (or any first render before data loads) crashed the app.
- **Risk:** Low — purely a hook ordering + JSX fix; no logic changes.

### [2026-02-13] Injury Awareness Feature — full injury tracking + workout integration
- **Files created:**
  - `src/data/injuryRegionMap.ts` — 10 body regions (ankle, knee, hip, lower_back, upper_back, shoulder, elbow, wrist, chest, neck) mapped to muscles/patterns; 3-tier severity model (mild/moderate/severe) with weight factors (0.7/0.5/0); `isExerciseAffected()` utility; 6 injury types.
  - `src/db/repositories/injuryRepo.ts` — Full CRUD for `active_injuries` table (list active/all, get, add, update, resolve, reactivate, delete).
  - `src/components/InjuryModal.tsx` — Bottom-sheet modal with scrollable body region chips, severity picker with color coding + hint text ("weights reduced to 70%"), injury type chips, notes input, and affected areas preview.
- **Files modified:**
  - `src/db/migrations.ts` — New migration: `active_injuries` table with body_region, injury_type, severity (CHECK constraint), notes, started_at, resolved_at, created_at.
  - `src/types.ts` — Added `ActiveInjury` type.
  - `src/screens/SettingsScreen.tsx` — Full "Active Injuries" management section: injury cards with edit/healed actions, "Log New Injury" button, resolved injuries toggle with reactivate/delete, `active_injuries` added to BACKUP_TABLES.
  - `src/db/repositories/sessionsRepo.ts` — `createDraftFromTemplate()` now loads active injuries, computes per-slot weight reduction factor via `isExerciseAffected()`, applies most-restrictive severity factor (mild=70%, moderate=50%, severe=0%), rounds to nearest 0.25.
  - `src/components/SlotCard.tsx` — New `InjuryWarning` type + prop, renders colored warning banners per injury, suppresses ProgressiveOverloadBanner when injuries active.
  - `src/screens/LogScreen.tsx` — Loads active injuries on focus, computes `injuryWarningsBySlot` via `useMemo` + `getMuscleInfo()`, passes `injuryWarnings` prop to each SlotCard.
  - `src/screens/WorkoutSummaryScreen.tsx` — Loads active injuries, replaces "📉 Regressed" with "🛡️ Recovery" for injury-affected exercises, adds recovery count chip to progression banner + share text.
  - `src/components/IdleScreen.tsx` — Shows "🩹 Active Injuries" notice card with severity and management link when injuries are active.
  - `src/__tests__/db.test.ts` — 50 new tests covering: `isExerciseAffected()` logic (20 cases across all regions), data integrity (INJURY_REGIONS, SEVERITIES, SEVERITY_WEIGHT_FACTOR, INJURY_TYPES), migration structure, source-level integration checks for LogScreen, SlotCard, WorkoutSummaryScreen, IdleScreen, SettingsScreen, sessionsRepo, InjuryModal, and injuryRepo.
- **What:** Comprehensive injury awareness system with 5 touch-points:
  1. **Settings:** Log/edit/resolve/reactivate/delete injuries with body region, severity, type, and notes.
  2. **Weight Pre-fill:** Draft sessions automatically reduce pre-filled weights based on injury severity (mild=70%, moderate=50%, severe=empty).
  3. **Workout Banners:** SlotCard shows colored injury warnings per affected exercise; suppresses progressive overload suggestions.
  4. **Summary Integration:** Regressed exercises under active injury show "🛡️ Recovery" status instead of "📉 Regressed" — separate recovery count in the review banner and share text.
  5. **Idle Screen:** Persistent injury notice card above quick-start templates.
- **Why:** User requested injury tracking to support recovery (e.g., sprain → lighter leg exercises). System automatically adjusts weight suggestions and avoids alarming "regressed" labels during intentional recovery.
- **Risk:** Low-Medium — New DB table (additive), dynamic imports in sessionsRepo avoid circular dependencies, all existing tests pass (447 total). Weight reduction only affects new drafts, not in-progress workouts.
- **Rollback:** Remove created files. Revert changes to modified files. Drop `active_injuries` table. Remove migration.
- **Tests:** 447 passing (was 397; +50 new injury feature tests)

### [2026-02-13] Fix warmup set counting in WorkoutSummaryScreen + add 44 new exercises
- **Files changed:**
  - `src/screens/WorkoutSummaryScreen.tsx` (lines 170, 278-279) — Fix warmup set counting
  - `src/db/seed.ts` — Added 44 new exercises, bumped LIBRARY_VERSION 6→7
  - `src/data/muscleExerciseMap.ts` — Added matching muscle map entries + new muscle group aliases
  - `src/__tests__/midWorkoutEditing.test.ts` — 6 new warmup filtering tests
- **What:**
  1. **Bug fix — warmup sets inflating summary counts:** The top-level "✅ X/Y Sets" stat used `detail.sets.length` (all sets including warmups) as the denominator, while the numerator correctly excluded warmups. This showed e.g. "21/49" instead of "21/27". Similarly, per-exercise "X/Y sets" counts and the completion checkmark included warmups. Fixed both to filter `!is_warmup`.
  2. **44 new exercises:** Added 12 core/abs (crunch, decline crunch, reverse crunch, lying leg raise, captain chair leg raise, bicycle crunch, dead bug, v-up, russian twist, dragon flag, decline situp, mountain climber), 10 cable (upright row, reverse fly, front raise, overhead curl, hammer curl, single arm row, shrug, external/internal rotation, standing crunch), 4 dip variations (weighted, tricep, machine, ring), 18 popular exercises (close grip bench, incline cable fly, machine press variants, dumbbell RDL, reverse/lateral lunges, sissy squat, landmine press, incline hammer curl, spider curl, wrist curls, smith machine presses, seated row machine).
  3. Added `forearms`, `adductors`, `rotator_cuff` to muscle group system.
- **Why:** User reported inflated set counts on summary screen; excess sets were warmup sets being counted. New exercises per user request for more ab, cable, and dip variations.
- **Risk:** Low — set counting is UI-only fix with test coverage. Exercise additions are additive (INSERT OR IGNORE). Library version bump ensures existing installs get the new exercises on next launch.
- **Rollback:** Revert the 3 changed files. Set LIBRARY_VERSION back to 6.
- **Tests:** 397 passing (was 391; +6 new warmup filtering tests)

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

### [2026-03-01] Fix warmup nav bug — slot jump on warmup generation
- **Files modified:** `src/screens/LogScreen.tsx`
- **What:** Added `suppressAutoExpandRef` that skips the auto-expand-first-incomplete-slot effect after `hydrate()` calls triggered by warmup generation or drop-set addition. Previously, generating warmups on exercise #2+ would scroll back to exercise #1.
- **Why:** `hydrate()` re-dispatches the full state causing the `useEffect([state.phase])` auto-expand to fire and reset `expandedSlots` to the first incomplete slot.
- **Risk:** Low — only suppresses auto-expand for the next render cycle after explicit user actions.
- **Rollback:** Remove `suppressAutoExpandRef` and the guard clause in the auto-expand effect.

### [2026-03-01] Rest timer auto-dismiss after expiry
- **Files modified:** `src/hooks/useRestTimer.ts`, `src/components/RestTimerModal.tsx`
- **What:** Timer modal now auto-hides 3 seconds after reaching 0:00 instead of blocking until manual dismiss. A progress bar shows the auto-dismiss countdown. User can still tap "Let's Go!" to dismiss immediately. The auto-dismiss timeout is cleared when a new timer starts or the user manually skips.
- **Why:** During a workout the "Rest Complete!" modal blocks the next set — user wanted it to go away automatically.
- **Risk:** Low — additive behavior; manual dismiss still works.
- **Rollback:** Remove `autoDismissRef` + `setTimeout` in `onExpire`, revert RestTimerModal dismiss bar.

### [2026-03-01] Ad-hoc rest timer button
- **Files modified:** `src/screens/LogScreen.tsx`
- **What:** Added "⏱ Rest" button to the workout action row. On press, shows an Alert with preset durations (30s/60s/90s/2min/3min) and starts the rest timer. Reuses existing `timer.start()` — no new timer logic.
- **Why:** Rest timer previously only auto-started on set completion with `rest_seconds > 0`. User wanted manual timer for warmup sets, supersets, or heavy attempts.
- **Risk:** Low — additive UI element, reuses existing timer.
- **Rollback:** Remove the `handleAdHocTimer` callback and the "⏱ Rest" Pressable from the action row.

### [2026-03-01] Weights persist across templates (global exercise memory)
- **Files modified:** `src/db/repositories/setsRepo.ts`, `src/db/repositories/sessionsRepo.ts`, `src/hooks/useSessionStore.ts`
- **What:** (1) New `lastTimeForExercise(exerciseId)` in setsRepo — queries the most recent finalized session for an exercise across ALL templates. (2) New `getLastPerformedSetsForExercise(exerciseId)` in sessionsRepo — same query for session initialization weight pre-population. (3) Both `hydrate()` (last-time panel) and `startSession()`/`selectSlotChoice()` (set pre-population) now fall back from template-specific history to global exercise history.
- **Why:** Bench Press at 100kg in "Push Day" wasn't carried over when starting "Upper Body" template that also has Bench Press — each template had isolated history.
- **Risk:** Low — read-only fallback queries; template-specific history still takes priority. No migration needed.
- **Rollback:** Remove the fallback functions and the `if (!lt ...)` / `if (historicalSets.length === 0)` branches.

### [2026-03-15] Edit During Workout — add / remove / reorder exercises mid-session
- **Files created:**
  - `src/components/ExercisePickerModal.tsx` — searchable exercise picker with FlatList, used when adding an exercise during a workout.
- **Files modified:**
  - `src/db/migrations.ts` — **Migration 34:** `ALTER TABLE template_slots ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0`. Supports permanent removal of slots from templates during workouts.
  - `src/db/repositories/sessionsRepo.ts` — New functions:
    - `addExerciseToSession(sessionId, exerciseId)` — creates session_slot + session_slot_choice + 3 default sets (pre-populates weights from global exercise history).
    - `removeExerciseFromSession(sessionSlotId, permanent, templateSlotId?)` — deletes session slot/choices/sets; if permanent, sets `is_hidden=1` on the template_slot.
    - `addSetToChoice(choiceId, exerciseOptionId)` — appends a new set to an existing choice with weight/reps from the last set.
    - `reorderSessionSlots(sessionId, slotIds)` — bulk reindex slot_index for all session slots.
  - `src/db/repositories/setsRepo.ts` — New function:
    - `clearWarmupSets(choiceId)` — deletes all `is_warmup=1` sets for a choice and reindexes remaining working sets.
  - `src/hooks/useSessionStore.ts` — New reducer actions: `ADD_EXERCISE`, `REMOVE_EXERCISE`, `ADD_SET`, `REORDER_SLOTS`, `CLEAR_WARMUPS`.
  - `src/screens/LogScreen.tsx` — Wired handlers: `handleAddExercise`, `handleRemoveExercise` (with one-time vs permanent Alert prompt), `handleAddSet`, `handleMoveSlotUp`, `handleMoveSlotDown`, `handleClearWarmups`. ExercisePickerModal integrated.
  - `src/components/SlotCard.tsx` — Added reorder buttons (▲/▼), warmup regenerate/clear buttons, long-press-to-remove gesture, "+ Add Set" button.
  - `src/components/SetRowEditor.tsx` — Warmup visual badge ("W" prefix + blue tint background) for `is_warmup=1` sets.
  - `src/db/repositories/sessionsRepo.ts` — `createDraftFromTemplate` now filters `WHERE ts.is_hidden = 0` to skip permanently hidden slots.
- **What:** Full mid-workout editing: add exercises via picker, remove exercises (one-time or permanent), reorder via move up/down, add extra sets to any exercise, regenerate or clear warmup sets, visual warmup distinction.
- **Why:** Users were locked into the template structure during workouts. Needed flexibility to adjust on the fly without leaving the workout.
- **Risk:** Medium — migration 34 alters template_slots. New repo functions modify session/set data mid-workout. Tested with 27 dedicated tests.
- **Rollback:** Revert migration 34 (remove is_hidden column), remove new repo functions, revert LogScreen/SlotCard/SetRowEditor changes.

### [2026-03-15] Workout Review Dashboard — progression / regression analysis
- **Files modified:**
  - `src/db/repositories/statsRepo.ts` — New types and functions:
    - `ExerciseDelta` type: `{ name, trend: 'progressed'|'regressed'|'maintained'|'new', prevMax, currMax }`.
    - `sessionExerciseDeltas(sessionId)` — compares each exercise's max weight against the previous session with the same template. Returns per-exercise progression status.
    - `previousSessionComparison(sessionId)` — returns `{ volumeDelta, durationDelta, prevDate }` comparing total volume and duration against the previous template session.
  - `src/screens/WorkoutSummaryScreen.tsx` — Added "vs. Last Time" section with:
    - Volume comparison (kg delta + percentage).
    - Duration comparison (minutes delta).
    - Per-exercise progression badges: 📈 (progressed), 📉 (regressed), ➡️ (maintained), 🆕 (new exercise).
    - First-time template message: "First time doing this workout!".
- **What:** Post-workout review now shows whether the user progressed or regressed compared to the last session with the same template.
- **Why:** Users wanted to know at a glance whether they improved. Previously only PRs were shown with no regression/maintenance tracking.
- **Risk:** Low — read-only stats queries + additive UI in WorkoutSummaryScreen.
- **Rollback:** Remove `sessionExerciseDeltas` and `previousSessionComparison` from statsRepo. Revert WorkoutSummaryScreen additions.

### [2026-03-15] Mid-Workout Editing test suite (27 tests)
- **Files created:**
  - `src/__tests__/midWorkoutEditing.test.ts` — 27 unit tests covering:
    - `addExerciseToSession`: creates slot + choice + 3 sets, pre-populates weights, bumps slot_index.
    - `removeExerciseFromSession`: deletes slot/choices/sets (one-time), sets is_hidden=1 (permanent).
    - `addSetToChoice`: copies weight/reps from last set, increments set_index.
    - `reorderSessionSlots`: reindexes slot_index correctly.
    - `clearWarmupSets`: removes warmup sets, reindexes working sets.
    - `sessionExerciseDeltas`: correct trend detection (progressed/regressed/maintained/new).
    - `previousSessionComparison`: correct volume/duration delta calculation.
    - Hidden slot filtering: `createDraftFromTemplate` skips `is_hidden=1` slots.
    - Edge cases: empty sessions, first-time templates, templates with no history.
- **What:** Comprehensive test coverage for all mid-workout editing and workout review features.
- **Why:** These features modify live session data — tests guard against regressions.
- **Risk:** None — test-only.
- **Test results:** 368 total tests across 5 suites, all passing.

### [2026-03-01] Effort / rest-time tracking (actual rest between sets)
- **Files modified:**
  - `src/db/migrations.ts` — **Migration 35:** `ALTER TABLE sets ADD COLUMN completed_at TEXT;` Records wall-clock time when each set is completed.
  - `src/db/repositories/setsRepo.ts` — `toggleSetCompleted` now writes `completed_at = ISO timestamp` when completing and `NULL` when uncompleting.
  - `src/db/repositories/statsRepo.ts` — New type `SessionEffortStats` and function `sessionEffortStats(sessionId, durationSecs?)` that computes: total rest time, average rest per set, sets/minute density, and volume/minute density from `completed_at` timestamps on working sets.
  - `src/screens/WorkoutSummaryScreen.tsx` — New "⚡ Effort & Rest" section between progression banner and exercises list. Shows total rest, avg rest/set, sets/min, volume/min. Also included in share output.
  - `src/__tests__/midWorkoutEditing.test.ts` — 7 new tests for effort tracking: hasData=false with 0/1 timestamps, rest calculation with 4 sets, density with/without provided duration, toggleSetCompleted records/clears timestamp, warmup exclusion.
- **What:** Tracks when each set is completed (wall-clock timestamp) and computes actual inter-set rest times and workout density metrics. Displayed on the post-workout summary screen.
- **Why:** User requested "saving rest time for overall effort" — prescribed `rest_seconds` was stored but never used for analytics.
- **Risk:** Low — additive column (nullable), read-only stats query, backward-compatible (existing sets have NULL completed_at, stats gracefully return hasData=false).
- **Rollback:** Remove migration 35, revert `toggleSetCompleted`, remove `sessionEffortStats`, revert WorkoutSummaryScreen.
- **Test results:** 375 total tests across 5 suites, all passing.

### [2026-03-20] Workout Reminders — scheduled weekly push notifications per template
- **Files created:**
  - `src/db/repositories/scheduleRepo.ts` — Full CRUD for `template_schedule` table: `upsertSchedule`, `listSchedulesForTemplate`, `listAllEnabledSchedules` (joins template name), `deleteSchedule`, `deleteAllSchedulesForTemplate`, `toggleScheduleEnabled`, `dayName` helper. New `ScheduleRow` type exported.
  - `src/utils/workoutReminders.ts` — `syncWorkoutReminders()` cancels all "reminder-*" notifications, re-schedules one WEEKLY trigger per enabled schedule row via expo-notifications `SchedulableTriggerInputTypes.WEEKLY`. Also `cancelAllWorkoutReminders()`.
  - `src/components/ScheduleModal.tsx` — Bottom-sheet modal for configuring reminder days (7 day-of-week toggles, Mon–Sun) and time (30-min step picker). "Apply to all days" button. Summary of enabled reminders.
- **Files modified:**
  - `src/db/migrations.ts` — **Migration 36:** `CREATE TABLE template_schedule(id, template_id FK→templates, day_of_week 0–6, hour 0–23, minute 0–59, enabled, created_at, UNIQUE(template_id, day_of_week))`.
  - `src/screens/TemplatesScreen.tsx` — Added ⏰ button to each template card (inactive state). Opens ScheduleModal for that template.
  - `src/__tests__/dbIntegration.test.ts` — 8 new tests: dayName, upsert create/update, multi-day, listAllEnabled joins, toggle enabled, delete single, delete all.
- **What:** Users can now set weekly recurring push notifications per template per day of week. Notifications use expo-notifications WEEKLY trigger with "🏋️ {template_name}" content. Managed from TemplatesScreen via a ⏰ button.
- **Why:** Feature requested for building consistent workout habits with scheduled reminders.
- **Risk:** Low — new table + new files, additive UI. Schedule data isolated in own table. Notification sync is idempotent.
- **Rollback:** Remove migration 36, delete scheduleRepo.ts, workoutReminders.ts, ScheduleModal.tsx. Revert TemplatesScreen.tsx changes.

### [2026-03-20] Weekly Volume Dashboard — muscle group progress bars on idle screen
- **Files created:**
  - `src/components/WeeklyVolumeCard.tsx` — Horizontal bar chart per muscle group from `weeklyVolumeByMuscle()`. Color-coded: green (10+ sets), yellow (5–9), red (<5). Sorted by sets descending. Includes 3-color legend.
- **Files modified:**
  - `src/components/IdleScreen.tsx` — Added `WeeklyVolumeCard` between THIS WEEK stats and all-time card. Fetches `weeklyVolumeByMuscle()` on focus. Only renders when data is available.
- **What:** The idle dashboard now shows a muscle group volume breakdown for the last 7 days. Each muscle group has a colored progress bar indicating whether the user is hitting recommended weekly set volume (10+ sets = green, 5–9 = yellow, <5 = red).
- **Why:** Users wanted visibility into which muscle groups are undertrained vs adequately trained each week.
- **Risk:** Low — purely additive UI component using existing `weeklyVolumeByMuscle()` query. No schema changes.
- **Rollback:** Delete WeeklyVolumeCard.tsx, revert IdleScreen.tsx changes.
- **Test results:** 383 total tests across 5 suites, all passing.
