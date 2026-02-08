# 🏋️ WorkoutApp

A full-featured workout tracking app built with **React Native + Expo**. Log workouts, track progress over time, and follow structured training programs — all stored locally on your device.

---

## Features

### 🏋️ Workout Logging
- Start a workout from any template with one tap
- Auto-fills last session's weights and reps so you pick up where you left off
- Mark sets complete, edit weight/reps/RPE inline
- Auto-advances to the next exercise when a slot is fully done
- Session timer tracks total workout duration
- Progress bar shows sets completed

### ⏱️ Rest Timer
- Automatically starts after completing a set (uses the prescribed rest time)
- Pause, adjust (+/-5 s), or skip
- **Vibrates** when rest is over so you don't have to watch the screen

### 📈 Progressive Overload
- When you completed all sets last session, a **suggestion banner** appears:
  *"Try 87.5 kg x 6"* (+2.5 on your heaviest set)
- Estimated 1RM **trend chart** on each exercise detail page (Epley formula)

### 📑 Templates
- Create custom workout templates
- Each template has **slots** (exercise positions) with one or more **exercise options**
- Prescribe default sets (weight / reps / RPE / rest) per slot
- 11 built-in program templates from real training programs

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
- **Full JSON backup** — exports all 11 database tables
- **Restore from backup** — paste a JSON backup to restore everything
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
│   │   ├── OptionChips.tsx          # Exercise variant selector pills
│   │   ├── TrendChart.tsx           # SVG line chart for e1RM trends
│   │   ├── MuscleMap.tsx            # SVG front/back body diagram
│   │   ├── SetRow.tsx               # Individual set input row
│   │   └── LastTimePanel.tsx        # "Last time" data display
│   ├── contexts/
│   │   └── UnitContext.tsx          # kg/lb preference (persisted in DB)
│   ├── db/
│   │   ├── db.ts                    # SQLite wrapper, init, migrations runner
│   │   ├── migrations.ts           # 28 sequential DDL migrations
│   │   ├── seed.ts                  # 90 exercises, 11 templates, guides
│   │   └── repositories/
│   │       ├── exercisesRepo.ts     # Exercise + variant CRUD
│   │       ├── sessionsRepo.ts      # Draft/finalize sessions, history
│   │       ├── setsRepo.ts          # Set CRUD, "last time" queries
│   │       ├── statsRepo.ts         # Dashboard stats, e1RM history
│   │       └── templatesRepo.ts     # Template/slot/option CRUD
│   ├── data/
│   │   ├── exerciseGuides.ts        # How-to instructions + tips for 90 exercises
│   │   └── muscleExerciseMap.ts     # Exercise -> muscle group mappings
│   ├── utils/
│   │   ├── normalize.ts             # Name normalisation for dedup
│   │   ├── units.ts                 # kg <-> lb conversion helpers
│   │   └── debounce.ts              # useDebouncedCallback hook
│   └── __tests__/
│       └── db.test.ts               # 20 integration tests
└── assets/                          # App icons and splash screen
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/) — `npm install -g expo-cli`
- Expo Go app on your phone (for development)

### Install & Run

```bash
# Install dependencies
npm install

# Start the dev server
npm start

# Scan the QR code with Expo Go on your phone
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

---

## Database

The app uses a local SQLite database with **28 migrations** applied sequentially on first launch. Key tables:

| Table | Purpose |
|-------|---------|
| `exercises` | Exercise definitions (name, muscles, guide, video) |
| `exercise_options` | Variants per exercise (Barbell, Dumbbell, etc.) |
| `templates` | Workout template definitions |
| `template_slots` | Exercise positions within a template |
| `template_slot_options` | Which exercises can fill each slot |
| `template_prescribed_sets` | Default weight/reps/rest per slot |
| `sessions` | Workout sessions (draft or finalized) |
| `session_slots` | Slot instances within a session |
| `session_slot_choices` | Which exercise option the user picked |
| `sets` | Actual logged sets (weight, reps, RPE, completed) |
| `app_settings` | Key-value config (unit preference, versions) |

### Backup & Restore

- **Export:** Settings -> Export Full Backup -> shares a JSON file
- **Import:** Settings -> paste JSON -> Restore Backup

The backup includes all 11 tables and can fully restore the app's state.

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
