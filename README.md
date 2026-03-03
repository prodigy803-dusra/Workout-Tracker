# 🏋️ WorkoutApp

A full-featured workout tracking app built with **React Native + Expo**. Log workouts, track progress over time, and follow structured training programs — all stored locally on your device.

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
- 90+ exercises pre-loaded with:
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

### ⚙️ Settings
- Toggle between **kg** and **lb**
- **Dark mode** — light / dark / system theme
- **Full JSON backup** — exports all 14 database tables
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
│   │   ├── IdleScreen.tsx           # Idle dashboard with stats
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
│   │   ├── migrations.ts           # 36 sequential DDL migrations
│   │   ├── seed.ts                  # 92 exercises, 11 templates, guides
│   │   └── repositories/
│   │       ├── exercisesRepo.ts     # Exercise + variant CRUD
│   │       ├── sessionsRepo.ts      # Draft/finalize sessions, mid-workout editing
│   │       ├── setsRepo.ts          # Set CRUD, "last time" queries, warmup management
│   │       ├── statsRepo.ts         # Dashboard stats, e1RM history, session comparison
│   │       ├── templatesRepo.ts     # Template/slot/option CRUD
│   │       ├── bodyWeightRepo.ts    # Body weight tracking
│   │       └── scheduleRepo.ts      # Workout reminder schedule CRUD
│   ├── data/
│   │   ├── exerciseGuides.ts        # How-to instructions + tips for 90 exercises
│   │   └── muscleExerciseMap.ts     # Exercise -> muscle group mappings
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

375 tests across 5 suites: DB unit tests, DB integration, session store reducer, feature interactions, and mid-workout editing.

---

## Database

The app uses a local SQLite database with **35 migrations** applied sequentially on first launch. Key tables:

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

### Backup & Restore

- **Export:** Settings -> Export Full Backup -> shares a JSON file
- **Import:** Settings -> paste JSON -> Restore Backup

The backup includes all 14 tables and can fully restore the app's state.

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
