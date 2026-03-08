# Workout Tracker — Roadmap & Feature Plan

> **Last updated:** 2026-03-04

---

# Completed

### Batch 1 (2026-03-01)
- ~~1.1 Warmup nav bug~~ — fixed via `suppressAutoExpandRef`
- ~~1.2 Rest timer auto-dismiss~~ — 3s auto-hide + progress bar
- ~~1.3 Ad-hoc rest timer button~~ — "⏱ Rest" in action row with preset picker
- ~~2.1 Weights persist across templates~~ — global exercise fallback in repos + hydrate

### Batch 2 (2026-03-15)
- ~~3.1 Edit During Workout~~ — add/remove/reorder exercises mid-session, add sets, one-time vs permanent prompt. Migration 34 (`is_hidden` on `template_slots`). `ExercisePickerModal`, `addExerciseToSession`, `removeExerciseFromSession`, `addSetToChoice`, `reorderSessionSlots`.
- ~~3.2 Modify Warmup Sets~~ — `clearWarmupSets` in setsRepo, regenerate/clear buttons in SlotCard, visual warmup badge ("W" + blue tint) in SetRowEditor.
- ~~3.3 Workout Review Dashboard~~ — `sessionExerciseDeltas` + `previousSessionComparison` in statsRepo. Progression badges (📈/📉/➡️/🆕), volume/duration comparison in WorkoutSummaryScreen.
- ~~3.4 Interaction Tests~~ — 27 new tests in `midWorkoutEditing.test.ts`. **368 total tests across 5 suites**, all passing.

### Batch 3 (2026-03-01)
- ~~4.1 Effort / Rest-time tracking~~ — Migration 35 (`completed_at TEXT` on `sets`). `toggleSetCompleted` records timestamp. New `sessionEffortStats()` in statsRepo computes total rest, avg rest, sets/min, volume/min. "⚡ Effort & Rest" section in WorkoutSummaryScreen. **375 total tests**, all passing.

### Batch 4 (2026-03-20)
- ~~5.1 Workout Reminders~~ — Migration 36 (`template_schedule` table). `scheduleRepo.ts` CRUD. `workoutReminders.ts` syncs expo-notifications WEEKLY triggers. `ScheduleModal.tsx` bottom-sheet UI with day toggles + time picker. ⏰ button on TemplatesScreen. 8 new tests.
- ~~5.2 Weekly Volume Dashboard~~ — `WeeklyVolumeCard.tsx` with colored progress bars per muscle group (green 10+/yellow 5–9/red <5 sets). Integrated into IdleScreen between THIS WEEK stats and all-time card. Uses existing `weeklyVolumeByMuscle()`. **383 total tests**, all passing.

### Batch 5 (2026-03-04)
- ~~6.1 Cross-template weight bug~~ — weight pre-fill now global across all templates (uses `getLastPerformedSetsForExercise`).
- ~~6.2 Rest timer persistence~~ — `addTime(±15s)` adjustments now persist to DB via `onRestAdjusted` callback + `UPDATE_REST` action.
- ~~6.3 Stagnation detection~~ — `recentMaxWeights()` query, computed `stagnationBySlot` in hydration, orange ProgressiveOverloadBanner when same weight ≥3 sessions. 6 new tests.
- ~~6.4 Weekly PDF summary~~ — `weeklyReportData()` repo + `weeklyPdf.ts` utility. HTML→PDF via expo-print, shared via expo-sharing. "This Week" / "Last Week" buttons in Settings. **459 total tests**, all passing.

---

# Not Yet Implemented

## Assisted / Negative Exercises
**User request:** Some exercises (e.g. dip assist, pull-up assist) use machines where **more weight = easier**, not harder. The current progressive overload logic suggests "increase weight," which is backwards for these exercises.
- Would need a per-exercise `is_assisted` or `weight_polarity` flag (migration).
- Stagnation detection, progressive overload suggestions, and PR logic would need polarity-aware comparisons.
- Effort: Medium. Schema change + conditional logic in repos/components.

## Trainer Data Sharing (server)
**User request:** Share tracking data with a trainer in real-time (not just PDF).
- Would require a backend server (e.g. Supabase, Firebase, or custom).
- Sync model: push finalized sessions + optional real-time live view.
- Effort: Large. Auth, server infra, sync conflict resolution.

## Music Player Integration
**User request:** Now playing, next, previous, pause controls within the app.
- Would need `expo-av` or a native module for media session access.
- Effort: Medium-Large. Research needed on cross-platform media control APIs.

## Cardio Recording
**User request:** Track cardio sessions (distance, time, pace, heart rate).
- Requires new schema: `cardio_sessions` table with duration, distance, type (run/bike/row), optional heart rate.
- UI: new screen or tab, possibly integrated into existing session flow.
- Effort: Large (new data model + UI).

## Pixel Watch / Wear OS Integration
- **Cheapest path:** Add action buttons to `expo-notifications` ("Skip rest", "Complete set") — works on any watch that mirrors notifications.
- **Full path:** Standalone Kotlin Wear OS companion app communicating via `MessageClient`.
- Effort: Notifications: 1-2 days. Full Wear OS: weeks.

---

# Previous Hardening Plan (completed/ongoing)

## Phase 1 — Hardening (must pass before external testing)

### Migration Safety
Simulate:
1. Install old version
2. Create realistic data
3. Upgrade to new schema

Verify:
- no crashes
- no missing rows
- no duplicated records
- indices & constraints behave correctly

If this fails, nothing else matters.

---

### Destructive Action Protection
For deletes or resets, require at least one:
- confirmation dialog
- undo
- soft delete

Accidental data loss destroys trust immediately.

---

### Empty & Edge States
Force scenarios:
- first launch ever
- no workouts
- empty templates
- half-finished sessions
- broken references

Every screen should render something intentional.

---

### Crash Resistance / Interruption Handling
Test:
- kill app mid session
- background during save
- reopen after force close

State should be consistent and recoverable.

---

### Deterministic Navigation
Android back behavior:
- always predictable
- no loops
- no sudden exits

---

If Phase 1 is solid → real people can use it.

---

## Phase 2 — Complexity Control (future-proofing)

Only do this when repetition or confusion appears.

### Extract Repeated Logic
Common candidates:
- stats calculations
- personal record detection
- session lifecycle
- unit conversion

Move into domain functions or services.

Outcome:
- thinner screens
- easier testing
- fewer inconsistencies

---

## App Use Tutorial

### Getting Started
1. **Install the app** via Expo or your device's app store.
2. **Open the app** and follow the onboarding prompts.
3. **Set your preferred units** (kg/lb) in Settings.

### Logging a Workout
1. Tap the **Log** tab to start a new session.
2. Add exercises, sets, and weights as you perform them.
3. Use the **Rest Timer** for interval tracking.
4. Save your session when finished.

### Reviewing Progress
1. Visit the **History** tab for past sessions.
2. Use the **Calendar** and **Charts** to visualize streaks, volume, and trends.
3. Check **Personal Records** and **Body Weight** for milestones.

### Templates & Customization
1. Create workout templates in the **Templates** tab for quick session setup.
2. Edit or duplicate templates as your routine evolves.

### Backup & Restore
1. Use the **Settings** screen to export or import your workout data.
2. Share backups via file picker or cloud storage.

### Troubleshooting
1. If you encounter issues, use the **Error Reporting** feature in Settings.
2. For app crashes or data loss, restart the app and check for updates.

---

### Separate Orchestration from UI
When a screen coordinates multiple repositories:

