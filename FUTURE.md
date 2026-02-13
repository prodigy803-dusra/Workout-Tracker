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

## Separate Orchestration from UI
When a screen coordinates multiple repositories:

