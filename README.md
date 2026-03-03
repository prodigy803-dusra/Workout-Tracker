# 🏋️ WorkoutApp

**Your gym notebook, supercharged.**

Most workout apps either drown you in features you'll never use or oversimplify until they're just a glorified checklist. WorkoutApp sits in the sweet spot: it remembers your weights, nudges you to lift heavier, warns you when an injury might affect today's session, and stays out of your way for the rest.

### Why it's different

- **Zero accounts, zero cloud, zero subscriptions.** Everything lives on your device in a local SQLite database. Your data is yours — export a full JSON backup anytime and you own every byte.
- **Actually smart pre-fill.** Tap a template and your last session's weights are already loaded. Did you finish every set last time? The app suggests a progressive overload bump before you even touch a plate.
- **Injury-aware training.** Log an injury once and the app automatically reduces pre-filled weights, flags affected exercises with visual banners, and labels intentional deload as "Recovery" instead of "Regressed" — so you can train around an injury without second-guessing every set.
- **Pre-workout check-in.** Every session starts with a quick "How are you feeling?" moment. Note an injury on the spot or just acknowledge you're a bit sore — it takes two seconds and keeps you honest.
- **Warm-up generation.** One button produces ramping warm-up sets based on your working weight. Edit or clear them if you prefer your own routine.
- **Mid-workout flexibility.** Add exercises, reorder slots, toss in extra sets, remove what you don't need — all without leaving the session.
- **Workout review that's actually useful.** Post-session breakdown with per-exercise progression badges, volume deltas, rest-time stats, effort density, and personal record confetti.
- **Built for lifters, not influencers.** No social feed, no AI coach upsell, no "motivational" push notifications begging you to open the app. Just your numbers, your progress, your schedule.

---

## Features

### 🏋️ Workout Logging
- Start a workout from any template with one tap
- Auto-fills last session's weights and reps so you pick up where you left off
- **Weights persist across templates** — exercise history is global, not template-isolated
- Mark sets complete, edit weight/reps/RPE inline
- **Undo set completion** — uncheck a set to modify it
- Auto-advances to the next exercise when a slot is fully done
- Session timer tracks total workout duration
- Progress bar shows sets completed

### ✏️ Edit During Workout
- **Add exercises** mid-workout via searchable exercise picker
- **Remove exercises** — one-time (this session only) or permanent (hides from template)
- **Reorder exercises** — move up / move down buttons
- **Add extra sets** to any exercise on the fly
- **Warmup controls** — regenerate warmups, clear all warmups, or edit individual warmup sets
- **Visual warmup badge** — warmup sets show "W" prefix with blue tint

### 📊 Workout Review
- Post-workout **progression analysis** vs. last session with the same template
- Per-exercise trend badges: 📈 progressed, 📉 regressed, ➡️ maintained, 🆕 new
- Volume comparison (kg delta + percentage)
- Duration comparison (minutes delta)
- **⚡ Effort & Rest** — total rest time, average rest per set, sets/min density, volume/min density
- Personal record detection (e1RM + heaviest weight)

### ⏱️ Rest Timer
- Automatically starts after completing a set (uses the prescribed rest time)
- Pause, adjust (+/-5 s), or skip
- **Vibrates** when rest is over so you don't have to watch the screen
- **Auto-dismisses** 3 seconds after expiry with a progress bar countdown
- **Next set preview** — shows upcoming exercise/weight/reps during rest
- **Ad-hoc timer** — manual "⏱ Rest" button with preset durations (30s / 60s / 90s / 2min / 3min)
- Uses absolute timestamps + expo-notifications for **background accuracy**

### 📈 Progressive Overload
- When you completed all sets last session, a **suggestion banner** appears:
  *"Try 87.5 kg x 6"* (+2.5 on your heaviest set)
- Estimated 1RM **trend chart** on each exercise detail page (Epley formula)

### 📑 Templates
- Create custom workout templates
- Each template has **slots** (exercise positions) with one or more **exercise options**
- Prescribe default sets (weight / reps / RPE / rest) per slot
- 11 built-in program templates from real training programs
- **⏰ Workout Reminders** — schedule recurring weekly push notifications per template per day of week with custom time

### 📊 Weekly Volume Dashboard
- **Muscle group volume bars** on the idle screen showing working sets per group for the last 7 days
- Color-coded: 🟢 10+ sets (on target), 🟡 5–9 (getting there), 🔴 <5 (undertrained)
- Uses the existing exercise → muscle group mappings (15 muscle groups)

### 💪 Exercise Library
- 136+ exercises pre-loaded with:
  - Primary and secondary muscle groups
  - Interactive **muscle map** (SVG front & back body diagrams)
  - Step-by-step **how-to instructions**
  - **Tips** for better form
  - **Video tutorial** links
- Add your own exercises and variants
- Search by name

### 📋 History
- Full session history with date, template name, exercises, volume
- Tap any session for a detailed breakdown of every set

### 🩹 Injury Awareness
- Log injuries with **body region** (10 regions), **severity** (mild / moderate / severe), **injury type**, and notes
- **Automatic weight reduction** — mild = 70%, moderate = 50%, severe = exercises skipped entirely
- **Warning banners** on affected exercises during a workout
- **Recovery labels** — intentional deload shows "🛡️ Recovery" instead of "📉 Regressed" in post-workout review
- **Pre-workout check-in** — log a new injury on the spot before starting any session
- Manage, heal, reactivate, or delete injuries from Settings

### ⚙️ Settings
- Toggle between **kg** and **lb**
- **Dark mode** — light / dark / system theme
- **Injury management** — full lifecycle (log, edit, heal, reactivate, delete)
- **Full JSON backup** — exports all 15 database tables
- **Restore from backup** — pick a file or paste JSON to restore everything
- **Reset database** — wipe and re-seed from scratch

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo 54 |
| Language | TypeScript 5.9 (strict mode) |
| Database | SQLite via `expo-sqlite` |
| Navigation | React Navigation (bottom tabs + native stacks) |
| Charts | Custom SVG line chart (`react-native-svg`) |
| File sharing | `expo-file-system` + `expo-sharing` |
| Testing | Jest + ts-jest |

---

## Project Structure

```
WorkoutApp/
├── App.tsx                          # Entry point — DB init, providers, navigator
├── src/
│   ├── types.ts                     # Shared TypeScript types
│   ├── navigation/
│   │   └── index.tsx                # Tab + stack navigators
│   ├── screens/
│   │   ├── LogScreen.tsx            # Active workout / idle dashboard
│   │   ├── HistoryScreen.tsx        # Past sessions list
│   │   ├── SessionDetailScreen.tsx  # Single session breakdown
│   │   ├── TemplatesScreen.tsx      # Template list + quick start
│   │   ├── TemplateEditorScreen.tsx # Edit slots, options, prescribed sets
│   │   ├── ExercisesScreen.tsx      # Exercise library with search
│   │   ├── ExerciseDetailScreen.tsx # Stats, muscle map, guide, trend chart
│   │   └── SettingsScreen.tsx       # Unit toggle, backup/restore, reset
│   ├── components/
│   │   ├── ConfettiCannon.tsx       # Celebration animation for PRs
│   │   ├── DropSegmentRow.tsx       # Drop-set segment row
│   │   ├── ErrorBoundary.tsx        # App-level error boundary
│   │   ├── ExercisePickerModal.tsx   # Searchable exercise picker (mid-workout)
│   │   ├── IdleScreen.tsx           # Idle dashboard with stats + pre-workout check-in
│   │   ├── InjuryModal.tsx          # Add/edit injury bottom-sheet modal
│   │   ├── LastTimePanel.tsx        # "Last time" data display
│   │   ├── MuscleMap.tsx            # SVG front/back body diagram
│   │   ├── OptionChips.tsx          # Exercise variant selector pills
│   │   ├── PlateCalculator.tsx      # Barbell plate breakdown
│   │   ├── ProgressiveOverloadBanner.tsx  # Suggestion banner
│   │   ├── RestTimerModal.tsx       # Rest timer overlay with next-set preview
│   │   ├── SessionSummaryHeader.tsx # Duration / sets / volume bar
│   │   ├── SetRowEditor.tsx         # Set row: weight/reps/RPE/warmup badge
│   │   ├── ScheduleModal.tsx        # Weekly reminder day/time picker
│   │   ├── SlotCard.tsx             # Expandable exercise card with reorder
│   │   ├── TrendChart.tsx           # SVG line chart for e1RM trends
│   │   ├── VolumeChart.tsx          # Volume over time chart
│   │   ├── WeeklyVolumeCard.tsx     # Muscle group volume progress bars
│   │   └── WarmupGeneratorButton.tsx # Generate warm-up sets button
│   ├── contexts/
│   │   ├── ThemeContext.tsx          # Light/dark/system theme (persisted in DB)
│   │   └── UnitContext.tsx          # kg/lb preference (persisted in DB)
│   ├── hooks/
│   │   ├── useRestTimer.ts          # Rest timer with background notifications
│   │   └── useSessionStore.ts       # Central useReducer store for active session
│   ├── db/
│   │   ├── db.ts                    # SQLite wrapper, init, migrations runner
│   │   ├── migrations.ts           # 37 sequential DDL migrations
│   │   ├── seed.ts                  # 136+ exercises, 11 templates, guides
│   │   └── repositories/
│   │       ├── exercisesRepo.ts     # Exercise + variant CRUD
│   │       ├── sessionsRepo.ts      # Draft/finalize sessions, mid-workout editing
│   │       ├── setsRepo.ts          # Set CRUD, "last time" queries, warmup management
│   │       ├── statsRepo.ts         # Dashboard stats, e1RM history, session comparison
│   │       ├── templatesRepo.ts     # Template/slot/option CRUD
│   │       ├── bodyWeightRepo.ts    # Body weight tracking
│   │       ├── injuryRepo.ts        # Active injury CRUD (log, heal, reactivate)
│   │       └── scheduleRepo.ts      # Workout reminder schedule CRUD
│   ├── data/
│   │   ├── exerciseGuides.ts        # How-to instructions + tips for 136+ exercises
│   │   ├── muscleExerciseMap.ts     # Exercise -> muscle group mappings
│   │   └── injuryRegionMap.ts       # Body region → muscle/severity mappings for injuries
│   ├── utils/
│   │   ├── normalize.ts             # Name normalisation for dedup
│   │   ├── units.ts                 # kg <-> lb conversion helpers
│   │   ├── debounce.ts              # useDebouncedCallback hook
│   │   └── workoutReminders.ts      # Sync expo-notifications weekly triggers
│   └── __tests__/
│       ├── db.test.ts               # DB unit tests
│       ├── dbIntegration.test.ts    # DB integration tests
│       ├── sessionStore.test.ts     # Reducer + state management tests
│       ├── featureInteraction.test.ts  # Cross-feature interaction tests
│       └── midWorkoutEditing.test.ts   # Mid-workout editing + review tests
└── assets/                          # App icons and splash screen
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/) — `npm install -g expo-cli`

### Install & Run

```bash
# Install dependencies
npm install

# Start the dev server
npm start

# Press 'a' for Android or 's' for Expo Go / 'i' for iOS
```

### Build for Android (installable APK)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Build a preview APK
eas build --platform android --profile preview
```

EAS will give you a download link for the `.apk` when the build finishes.

### Run Tests

```bash
npm test
```

453 tests across 5 suites: DB unit tests, DB integration, session store reducer, feature interactions, and mid-workout editing.

---

## Database

The app uses a local SQLite database with **37 migrations** applied sequentially on first launch. Key tables:

| Table | Purpose |
|-------|---------|
| `exercises` | Exercise definitions (name, muscles, guide, video) |
| `exercise_options` | Variants per exercise (Barbell, Dumbbell, etc.) |
| `templates` | Workout template definitions |
| `template_slots` | Exercise positions within a template (supports `is_hidden` for permanent removal) |
| `template_slot_options` | Which exercises can fill each slot |
| `template_prescribed_sets` | Default weight/reps/rest per slot |
| `sessions` | Workout sessions (draft or finalized) |
| `session_slots` | Slot instances within a session |
| `session_slot_choices` | Which exercise option the user picked |
| `sets` | Actual logged sets (weight, reps, RPE, completed, is_warmup, completed_at) |
| `drop_set_segments` | Drop-set segments within a set |
| `personal_records` | PR tracking (e1RM + heaviest weight) |
| `body_weight` | Body weight logs |
| `app_settings` | Key-value config (unit preference, theme, versions) |
| `active_injuries` | Injury tracking (body region, severity, type, notes, resolved status) |
| `schedule` | Workout reminder schedule (template, day, time) |

### Backup & Restore

- **Export:** Settings -> Export Full Backup -> shares a JSON file
- **Import:** Settings -> paste JSON -> Restore Backup

The backup includes all 16 tables and can fully restore the app's state.

---

## How It Works

### Starting a Workout

1. Open the **Log** tab
2. Tap a template from the quick-start grid
3. A draft session is created with slots pre-filled:
   - If you've done this exercise before, it uses your **last session's weights**
   - If it's your first time, it uses the **template's prescribed sets**
4. Log your sets, mark them complete
5. Tap **Finish** to save the session

### Progressive Overload

When you completed all prescribed sets in your last session for a given exercise, the app shows a yellow banner suggesting you increase the weight by 2.5 on your heaviest set.

### e1RM Tracking

The Exercise Detail screen shows a trend chart of your estimated 1-rep max over time, calculated with the Epley formula:

$$e1RM = weight \times \left(1 + \frac{reps}{30}\right)$$

Only completed sets with 1-12 reps are included.

---

## License

This project is for personal use.

---

## Release Notes

### Alpha V 1.01 — "Train Smarter"

**44 new exercises. Injury-aware training. A check-in before every workout.**

#### What's New

**🩹 Injury Awareness System**
Log an injury once and the app adjusts everything for you. Mild strain? Weights drop to 70%. Moderate? Down to 50%. Severe? Those exercises are skipped entirely. Warning banners appear on affected exercises during your workout, and your post-session review labels intentional deload as "Recovery" instead of "Regressed" — because backing off smart isn't going backwards.

**🏋️ Pre-Workout Check-In**
Every session now starts with a quick "How are you feeling?" moment. Pick your readiness level, review any active injuries, or log a new one on the spot — all before your first set. Takes two seconds, keeps you honest.

**💪 44 New Exercises**
The library grew from 92 to 136+ exercises — more variations for legs, back, shoulders, arms, and core. All come with muscle group mappings and how-to guides.

#### Fixes

- **Warmup sets no longer count** toward your working set totals in the workout summary
- **Regression count** no longer inflated by exercises you skipped entirely
- **Previous-session lookup** now correctly matches your last workout with the same template
- **Crash fix:** Finishing a workout without completing any exercises no longer crashes the summary screen

#### Under the Hood
- 453 tests across 5 suites, all passing
- 37 database migrations (up from 35)
- Full JSON backup now covers 16 tables (including injuries + schedule)
