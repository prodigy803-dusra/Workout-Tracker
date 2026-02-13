# Pre-Release Hardening & Architecture Roadmap

This document defines the priorities before exposing the app to real users.
Focus is reliability, predictability, and keeping future change cheap.

The objective is NOT elegance.
The objective is removing friction and preventing expensive mistakes later.

---

# Phase 1 — Hardening (must pass before external testing)

## Migration Safety
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

## Destructive Action Protection
For deletes or resets, require at least one:
- confirmation dialog
- undo
- soft delete

Accidental data loss destroys trust immediately.

---

## Empty & Edge States
Force scenarios:
- first launch ever
- no workouts
- empty templates
- half-finished sessions
- broken references

Every screen should render something intentional.

---

## Crash Resistance / Interruption Handling
Test:
- kill app mid session
- background during save
- reopen after force close

State should be consistent and recoverable.

---

## Deterministic Navigation
Android back behavior:
- always predictable
- no loops
- no sudden exits

---

If Phase 1 is solid → real people can use it.

---

# Phase 2 — Complexity Control (future-proofing)

Only do this when repetition or confusion appears.

## Extract Repeated Logic
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

## Separate Orchestration from UI
When a screen coordinates multiple repositories:

