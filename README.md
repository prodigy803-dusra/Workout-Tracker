# 🏋️ WorkoutApp

> **Own You.**

Your weights. Your reps. Your progress.
Tracked by you. Stored on your device. Owned by you and only you.

No cloud. No accounts. No subscriptions. Just iron and honest numbers.

Most workout apps either drown you in features you'll never use or oversimplify until they're just a glorified checklist. WorkoutApp sits in the sweet spot: it remembers your weights, nudges you to lift heavier, understands whether you're pushing resistance or working off assistance, warns you when an injury might affect today's session, and stays out of your way for the rest.

### Why it's different

- **Your data lives on your device.** Zero accounts, zero cloud, zero subscriptions. Export a full JSON backup anytime — you own every byte, every rep, every PR.
- **Your last session, remembered.** Tap a template and your weights are already loaded. Finished every set last time? The app nudges you to go heavier — or lighter on an assisted machine. Your history drives your future.
- **Your body, respected.** Log an injury once and the app adjusts — lighter weights, warning banners, "Recovery" labels instead of "Regressed." Training around pain shouldn't feel like failing.
- **Your honest moment.** Every session starts with a check-in. How are you feeling? Note an injury on the spot or just acknowledge you're sore. Two seconds of honesty before your first rep.
- **Your warm-up, generated.** One button. Ramping sets based on your working weight. Edit them, clear them, or do your own thing.
- **Your session, your rules.** Add exercises, reorder slots, toss in extra sets, drop what you don't need — mid-workout, no restrictions.
- **Your review, earned.** Post-session breakdown with progression badges, volume deltas, rest-time stats, effort density, and confetti when you hit a PR. Because the numbers should feel like yours.
- **Built for lifters, not influencers.** No social feed, no AI coach upsell, no push notifications begging you to open the app. Just your iron, your numbers, your schedule.

---

## Features

> *Every feature exists for one reason: to make the next rep yours.*

### 🏋️ Own Your Workout
- Start a session from any template with one tap
- Auto-fills last session's weights and reps — your history follows you
- **Weights persist across templates** — your exercise numbers are global, not locked to one program
- Mark sets complete, edit weight/reps/RPE inline
- **Undo set completion** — changed your mind? Uncheck and adjust
- Auto-advances to the next exercise when a slot is fully done
- Session timer tracks total duration
- Progress bar shows how far you've come

### ✏️ Own Your Session
- **Add exercises** mid-workout — searchable picker, no planning required
- **Remove exercises** — drop one for today or hide it permanently
- **Reorder exercises** — move up / move down, your flow your call
- **Add extra sets** to any exercise on the fly
- **Warmup controls** — regenerate, clear all, or fine-tune individual warmup sets
- **Visual warmup badge** — warmup sets show "W" prefix with blue tint

### 📊 Own Your Review
- Post-workout **progression analysis** — your numbers vs. last time, no guessing
- Per-exercise trend badges: 📈 progressed, 📉 regressed, ➡️ maintained, 🆕 new
- Volume comparison (kg delta + percentage)
- Duration comparison (minutes delta)
- **⚡ Effort & Rest** — total rest time, average rest per set, sets/min density, volume/min density
- Personal record detection (e1RM + heaviest weight) — your milestones, celebrated

### ⏱️ Own Your Rest
- Automatically starts after completing a set — your prescribed rest, your pace
- Pause, adjust (+/-5 s), or skip
- **Vibrates** when rest is over so you don't have to watch the screen
- **Auto-dismisses** 3 seconds after expiry with a progress bar countdown
- **Next set preview** — see what's coming during rest so you're ready
- **Ad-hoc timer** — manual "⏱ Rest" button with preset durations (30s / 60s / 90s / 2min / 3min)
- Uses absolute timestamps + expo-notifications for **background accuracy**

### 📈 Own Your Progress
- Completed every set last time? A **suggestion banner** nudges you forward:
  *"Try 87.5 kg x 6"* (+2.5 on your heaviest set)
- **Assisted machine awareness** — for exercises like dip assist and pull-up assist, progress means *less* assistance. The banner flips: *"Try reducing assist to 25 kg × 8"*
- Estimated 1RM **trend chart** on each exercise detail page — watch your strength curve rise over weeks and months

### 📑 Own Your Program
- Create custom workout templates — your split, your way
- Each template has **slots** (exercise positions) with one or more **exercise options**
- Prescribe default sets (weight / reps / RPE / rest) per slot
- 11 built-in program templates from real training programs to get you started
- **⏰ Workout Reminders** — schedule recurring weekly push notifications, your days, your time

### 📊 Own Your Balance
- **Muscle group volume bars** on the idle screen — see where you stand for the last 7 days
- Color-coded: 🟢 10+ sets (on target), 🟡 5–9 (getting there), 🔴 <5 (needs work)
- 15 muscle groups tracked automatically from your exercises

### � Own Your Assist
- **Assisted exercises treated correctly** — dip assist, pull-up assist, chin-up assist machines where the weight is counterweight, not resistance
- Weight column reads **"Assist"** instead of "Weight" — no pretending you're lifting what you're not
- PRs track **least assistance** (lower weight = stronger you)
- Stagnation detection works in reverse — same assist level for 3+ sessions triggers a suggestion to reduce
- Toggle any exercise as assisted from its detail page — your call, your classification
- e1RM is hidden for assisted exercises (it doesn't apply to counterweight machines)

### 💪 Own Your Knowledge
- 139+ exercises pre-loaded — each one yours to explore:
  - Primary and secondary muscle groups
  - Interactive **muscle map** (SVG front & back body diagrams)
  - Step-by-step **how-to instructions**
  - **Tips** for better form
  - **Video tutorial** links
- Add your own exercises and variants — your library grows with you
- Search by name

### 📋 Own Your History
- Full session history — every workout you've ever done, searchable
- Tap any session for a detailed breakdown of every set you logged

### 🩹 Own Your Recovery
- Log injuries with **body region** (10 regions), **severity** (mild / moderate / severe), **type**, and notes
- **Automatic weight reduction** — mild = 70%, moderate = 50%, severe = skipped entirely. Your limits, respected.
- **Warning banners** on affected exercises — so you're never caught off guard
- **Recovery labels** — intentional deload shows "🛡️ Recovery" instead of "📉 Regressed." Backing off smart is still moving forward.
- **Pre-workout check-in** — log a new injury on the spot before any session. Your honesty, your safety.
- Full injury lifecycle: log, heal, reactivate, delete — all from Settings

### ⚙️ Own Your Setup
- Toggle between **kg** and **lb** — your units, your preference
- **Dark mode** — light / dark / system theme
- **Injury management** — full lifecycle (log, edit, heal, reactivate, delete)
- **Full JSON backup** — every table, every row, exportable. Your data leaves with you.
- **Restore from backup** — pick a file or paste JSON to bring everything back
- **Reset database** — start fresh whenever you want

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
│   │   ├── ExerciseDetailScreen.tsx # Stats, muscle map, guide, trend chart, assisted toggle
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
│   │   ├── ProgressiveOverloadBanner.tsx  # Suggestion banner (normal + assisted modes)
│   │   ├── RestTimerModal.tsx       # Rest timer overlay with next-set preview
│   │   ├── SessionSummaryHeader.tsx # Duration / sets / volume bar
│   │   ├── SetRowEditor.tsx         # Set row: weight/reps/RPE/warmup badge
│   │   ├── ScheduleModal.tsx        # Weekly reminder day/time picker
│   │   ├── SlotCard.tsx             # Expandable exercise card with reorder + assisted labels
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
│   │   ├── seed.ts                  # 139+ exercises, 11 templates, guides
│   │   └── repositories/
│   │       ├── exercisesRepo.ts     # Exercise + variant CRUD, assisted toggle
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

472 tests across 5 suites: DB unit tests, DB integration, session store reducer, feature interactions, and mid-workout editing.

---

## Database

The app uses a local SQLite database with **37 migrations** applied sequentially on first launch. Key tables:

| Table | Purpose |
|-------|---------|
| `exercises` | Exercise definitions (name, muscles, guide, video, is_assisted) |
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
| `personal_records` | PR tracking (e1RM + heaviest weight + least assisted) |
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

> *Open the app. Check in with yourself. Pick up where you left off. Get stronger.*

### Starting a Workout

1. Open the **Log** tab
2. Tap a template — a quick check-in asks how you're feeling
3. A draft session is created with your slots pre-filled:
   - Done this exercise before? Your **last session's weights** are already there
   - First time? The **template's prescribed sets** get you started
4. Log your sets, mark them complete — the progress bar tracks every rep
5. Tap **Finish** — your review screen breaks down everything you just did

### Progressive Overload

Completed every prescribed set last time? A yellow banner suggests you go heavier — +2.5 on your heaviest set. Your past pushes your present.

For **assisted exercises** (dip assist, pull-up assist, etc.), the logic flips — the banner suggests *reducing* assistance. Less counterweight means you're doing more of the work. Progress on an assisted machine means needing less help.

### e1RM Tracking

The Exercise Detail screen shows a trend chart of your estimated 1-rep max over time, calculated with the Epley formula:

$$e1RM = weight \times \left(1 + \frac{reps}{30}\right)$$

Only completed sets with 1-12 reps are included. Your strength curve, visualized.

---

## License

This project is for personal use. Your app. Your code. **Own You.**

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

### Alpha V 1.1 — "Own Your Assist"

**Assisted exercise support. Your counterweight, respected.**

#### What's New

**🔄 Assisted Exercises**
Exercises like dip assist, pull-up assist, and chin-up assist machines now work correctly. The weight you enter is treated as counterweight — the app knows you're not lifting it, you're using it as assistance. Column headers read "Assist" instead of "Weight", progressive overload suggests *less* assistance (not more weight), PRs track your *least* assisted lift, and stagnation detection catches when you've been at the same assist level too long. Toggle any exercise as assisted from its detail page.

**💪 3 New Exercises**
Assisted Pull Up, Assisted Chin Up, and Assisted Dip join the library. Machine Dip is also auto-classified as assisted.

#### Under the Hood
- 472 tests across 5 suites, all passing (up from 453)
- 37 database migrations (added `is_assisted` column on exercises)
- Exercise library: 139+ exercises (up from 136+)
- New PR type: `least_assisted` for counterweight machines
- e1RM skipped for assisted exercises (Epley formula doesn't apply to counterweight)
