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
- The active workout screen header shows the **template you're running today**, not a generic "Log" title
- Mark sets complete, edit weight/reps/RPE inline
- **Drop-set volume tracked everywhere** — drop segments are included in all stats, history, and summary screens
- **Undo set completion** — changed your mind? Uncheck and adjust
- Auto-advances to the next exercise when a slot is fully done
- Session timer tracks total duration
- Progress bar shows how far you've come

### ✏️ Own Your Session
- **Add exercises** mid-workout — searchable picker, no planning required
- **Switch exercise options** mid-workout — injury weight reductions are applied automatically
- **Remove exercises** — drop one for today or hide it permanently
- **Reorder exercises** — move up / move down, your flow your call
- **Add extra sets** to any exercise on the fly
- **Delete sets** mid-workout — remaining sets re-index automatically (no gaps)
- **Warmup controls** — regenerate, clear all, or fine-tune individual warmup sets
- Exercise switching and warmup controls are split into separate **"Exercise Option"** and **"Warm-up Prep"** sections so the slot card reads clearly
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
- **Workout progress in the timer** — sets completed, exercises left, and a rough minutes-left estimate without leaving the rest screen
- **Ad-hoc timer** — manual "⏱ Rest" button with preset durations (30s / 60s / 90s / 2min / 3min)
- Uses absolute timestamps + expo-notifications for **background accuracy**

### 📈 Own Your Progress
- Completed every set last time? A **suggestion banner** nudges you forward:
  *"Try 87.5 kg x 6"* (+2.5 on your heaviest set)
- **Assisted machine awareness** — for exercises like dip assist and pull-up assist, progress means *less* assistance. The banner flips: *"Try reducing assist to 25 kg × 8"*
- **Smart suggestion suppression** — if your current session already meets or exceeds the suggested weight, the banner hides automatically
- **Stagnation detection** — same weight for 3+ sessions triggers an orange nudge to push past the plateau
- Estimated 1RM **trend chart** on each exercise detail page — watch your strength curve rise over weeks and months
- **Resume interrupted workouts** — close the app mid-session? A banner offers to pick up where you left off

### 📑 Own Your Program
- Create custom workout templates — your split, your way
- Each template has **slots** (exercise positions) with one or more **exercise options**
- Prescribe default sets (weight / reps / RPE / rest) per slot
- Set **target rep ranges** per slot for real-time feedback during workouts
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
- Tap any session for a detailed breakdown of every set you logged — **completed vs skipped** sets are visually distinguished

### 🩹 Own Your Recovery
- Log injuries with **body region** (10 regions), **severity** (mild / moderate / severe), **type**, and notes
- **Automatic weight reduction** — mild = 70%, moderate = 50%, severe = skipped entirely. Your limits, respected.
- **Warning banners** on affected exercises — so you're never caught off guard
- **Recovery labels** — intentional deload shows "🛡️ Recovery" instead of "📉 Regressed." Backing off smart is still moving forward.
- **Pre-workout check-in** — log a new injury on the spot before any session. Your honesty, your safety.
- **Deload week suggestions** — schedule + regression + injury signals can recommend a deload, but the app asks first
- **Manual deload toggle** — mark a workout as a deload during the pre-workout check-in
- **Deload sessions reduce working weights automatically** based on your configured intensity %
- **Deload sessions are labeled** during the workout and in the review screen so lighter performance is treated intentionally
- Full injury lifecycle: log, heal, reactivate, delete — all from Settings

### 🎯 Own Your Targets
- Set **rep-range targets** per template slot — e.g. 8–12 reps
- During your workout, reps flash **green** when in range, **red** when outside
- Target displayed in slot header so you always know the goal

### 🔔 Own Your Schedule
- **Workout reminders** — schedule weekly push notifications per template (day + time)
- **Inactivity nudge** — get a reminder if you haven't trained in X days (configurable)
- All notifications local, no server, no tracking

### 🆕 Own Your Library
- **Create custom exercises** — name, muscle group (15 options), equipment (10 options), assisted toggle
- Custom exercises are flagged and live alongside the built-in library
- Full search across both built-in and custom exercises

### 📤 Own Your Data
- **Export to CSV** — all finalized workouts as a spreadsheet-friendly file
- **Full ZIP backup** — every table, every row, compressed and shareable
- **Restore from backup** — pick a .zip or legacy .json file to bring everything back
- **Weekly PDF summary** — share this week's or last week's report with your trainer

### ⚙️ Own Your Setup
- Toggle between **kg** and **lb** — your units, your preference
- **Dark mode** — light / dark / system theme
- **Injury management** — full lifecycle (log, edit, heal, reactivate, delete)
- **Deload settings** — enable/disable auto-detect, set frequency in weeks, and choose the deload intensity %
- **Clearer plate calculator** — editable total-weight input, "including the bar" guidance, and per-side loading summary
- **Collapsible sections** — Injuries and Restore/Reset collapse to keep the screen clean
- **Onboarding walkthrough** — 5-step first-launch guide covers templates, logging, and progress tracking
- **Reset database** — start fresh whenever you want

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo 54 |
| Language | TypeScript 5.9 (strict mode) |
| Database | SQLite via `expo-sqlite` (42 migrations) |
| Navigation | React Navigation 7 (bottom tabs + native stacks) |
| Notifications | `expo-notifications` (rest timer + workout reminders) |
| Charts | Custom SVG line chart (`react-native-svg`) |
| Haptics | `expo-haptics` |
| File sharing | `expo-file-system` + `expo-sharing` |
| Testing | Jest + ts-jest (483 tests, 5 suites) |

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
│   │   ├── LogScreen.tsx            # Active workout / idle dashboard with template-named header
│   │   ├── HistoryScreen.tsx        # Past sessions list
│   │   ├── SessionDetailScreen.tsx  # Single session breakdown
│   │   ├── TemplatesScreen.tsx      # Template list + quick start
│   │   ├── TemplateEditorScreen.tsx # Edit slots, options, prescribed sets
│   │   ├── ExercisesScreen.tsx      # Exercise library with search
│   │   ├── ExerciseDetailScreen.tsx # Stats, muscle map, guide, trend chart, assisted toggle
│   │   ├── SettingsScreen.tsx       # Preferences, body weight, injuries, deload, reminders, export/restore
│   │   └── WorkoutSummaryScreen.tsx  # Post-workout review with progression analysis
│   ├── components/
│   │   ├── CalendarHeatmap.tsx       # Activity heatmap calendar
│   │   ├── ConfettiCannon.tsx       # Celebration animation for PRs
│   │   ├── DropSegmentRow.tsx       # Drop-set segment row
│   │   ├── ErrorBoundary.tsx        # App-level error boundary
│   │   ├── ExercisePickerModal.tsx   # Searchable exercise picker (mid-workout)
│   │   ├── IdleScreen.tsx           # Idle dashboard with stats + pre-workout check-in
│   │   ├── InjuryModal.tsx          # Add/edit injury bottom-sheet modal
│   │   ├── MuscleMap.tsx            # SVG front/back body diagram
│   │   ├── OnboardingModal.tsx      # First-launch 5-step walkthrough
│   │   ├── OptionChips.tsx          # Exercise variant selector pills
│   │   ├── PlateCalculator.tsx      # Barbell loading helper with editable target weight
│   │   ├── ProgressiveOverloadBanner.tsx  # Suggestion banner (normal + assisted modes)
│   │   ├── RestTimerModal.tsx       # Rest timer overlay with next-set preview + workout progress
│   │   ├── SessionSummaryHeader.tsx # Duration / sets / volume bar
│   │   ├── SetRowEditor.tsx         # Set row: weight/reps/RPE/warmup badge
│   │   ├── ScheduleModal.tsx        # Weekly reminder day/time picker
│   │   ├── SlotCard.tsx             # Expandable exercise card with separate option/warmup sections
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
│   │   ├── migrations.ts           # 42 sequential DDL migrations
│   │   ├── seed.ts                  # 139+ exercises, 11 templates, guides
│   │   └── repositories/
│   │       ├── exercisesRepo.ts     # Exercise + variant CRUD, assisted toggle
│   │       ├── sessionsRepo.ts      # Draft/finalize sessions, mid-workout editing
│   │       ├── setsRepo.ts          # Set CRUD, "last time" queries, warmup management
│   │       ├── statsRepo.ts         # Dashboard stats, e1RM history, session comparison
│   │       ├── templatesRepo.ts     # Template/slot/option CRUD
│   │       ├── bodyWeightRepo.ts    # Body weight tracking
│   │       ├── deloadRepo.ts        # Deload suggestion logic, settings, and session marking
│   │       ├── injuryRepo.ts        # Active injury CRUD (log, heal, reactivate)
│   │       └── scheduleRepo.ts      # Workout reminder schedule CRUD
│   ├── data/
│   │   ├── exerciseGuides.ts        # How-to instructions + tips for 136+ exercises
│   │   ├── muscleExerciseMap.ts     # Exercise -> muscle group mappings
│   │   └── injuryRegionMap.ts       # Body region → muscle/severity mappings for injuries
│   ├── utils/
│   │   ├── debounce.ts              # useDebouncedCallback hook
│   │   ├── exportCsv.ts             # Export finalized sessions to CSV
│   │   ├── haptics.ts               # Haptic feedback helper
│   │   ├── importBackup.ts          # Backup import utilities
│   │   ├── normalize.ts             # Name normalisation for dedup
│   │   ├── notifications.ts         # Local push notification scheduling
│   │   ├── units.ts                 # kg <-> lb conversion helpers
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

483 tests across 5 suites: DB unit tests, DB integration, session store reducer, feature interactions, and mid-workout editing.

---

## Database

The app uses a local SQLite database with **42 migrations** applied sequentially on first launch. Key tables:

| Table | Purpose |
|-------|---------|
| `exercises` | Exercise definitions (name, muscles, guide, video, is_assisted) |
| `exercise_options` | Variants per exercise (Barbell, Dumbbell, etc.) |
| `templates` | Workout template definitions |
| `template_slots` | Exercise positions within a template (supports `is_hidden` for permanent removal) |
| `template_slot_options` | Which exercises can fill each slot |
| `template_prescribed_sets` | Default weight/reps/rest per slot |
| `template_schedule` | Workout reminder schedule (template, day, time) |
| `sessions` | Workout sessions (draft or finalized, including `is_deload`) |
| `session_slots` | Slot instances within a session |
| `session_slot_choices` | Which exercise option the user picked |
| `sets` | Actual logged sets (weight, reps, RPE, completed, is_warmup, completed_at) |
| `drop_set_segments` | Drop-set segments within a set |
| `personal_records` | PR tracking (e1RM + heaviest weight + least assisted) |
| `body_weight` | Body weight logs |
| `app_settings` | Key-value config (unit preference, theme, versions) |
| `active_injuries` | Injury tracking (body region, severity, type, notes, resolved status) |

### Backup & Restore

- **Export:** Settings → Export Backup (.zip) → shares a compressed backup
- **CSV:** Settings → Export CSV → spreadsheet-friendly workout log
- **Import:** Settings → Pick Backup File or paste JSON → Restore Backup

The backup includes all tables and can fully restore the app's state.

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
   - Finishing requires at least one completed working set

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

---

### Alpha V 1.2 — "Own Your Routine"

**Rep-range targets. Custom exercises. Workout reminders. CSV export.**

#### What's New

**🎯 Rep-Range Targets**
Set a target rep range (e.g. 8–12) per template slot. During your workout, the reps input glows green when you're in range and red when you're not. The target also shows in the slot header so you always know what to aim for.

**🆕 Custom Exercise Creation**
Build your own exercises right from the library screen. Pick a name, primary muscle group (15 options), equipment type (10 options), and whether it's an assisted machine. Custom exercises appear alongside built-in ones and work everywhere — templates, sessions, stats.

**🔔 Workout Reminders**
Configurable inactivity-based push notifications. Set how many rest days before you get a nudge (default: 3). Fully local — no server, no tracking. Toggle on/off and adjust the threshold from Settings.

**📊 Export to CSV**
One tap exports every finalized workout as a spreadsheet-friendly CSV file (date, template, exercise, set#, weight, reps, RPE, rest, warmup, notes). Share it with your trainer, import it into Google Sheets, or just archive your numbers.

**💾 Resume Interrupted Workouts**
Close the app mid-session? Next time you open the Log tab, a banner detects the stale draft (>2 hours old) and lets you Resume or Discard. No more lost workouts.

#### Under the Hood
- Migrations 39–41 (rep range columns on `template_slots`, `is_custom` on `exercises`)
- New utility files: `notifications.ts`, `exportCsv.ts`
- 472 tests, all passing

---

### Alpha V 1.3 — "Own Your Experience"

**Onboarding walkthrough. Navigation hardened. Settings redesigned.**

#### What's New

**👋 Onboarding Walkthrough**
First launch now shows a swipeable 5-step intro: Welcome → Build Templates → Log Every Set → Track Your Progress → Get Started. Skip anytime, swipe or tap through, and it never shows again. Helps new users understand the app in 15 seconds.

**🧭 Navigation Hardened**
The post-workout flow is now bulletproof. Finishing a session uses `replace()` instead of `navigate()` — no more brief idle-screen flash. The WorkoutSummary screen locks out back-swipe (iOS) and hardware back (Android), hides the tab bar for an immersive feel, and slides up from the bottom. Tab switches during an active workout no longer trigger false "Leave workout?" alerts.

**⚙️ Settings Redesigned**
The Settings screen is less congested: Theme + Unit merged into a compact Preferences card, Injuries and Restore/Reset are collapsible accordion sections (tap to expand), and Weekly Summary + Data merged into one "Export & Reports" section. Smooth `LayoutAnimation` transitions on expand/collapse.

#### Under the Hood
- Android `BackHandler` intercepts hardware back on WorkoutSummary → clean redirect
- `beforeRemove` guard refined to allow `NAVIGATE` while blocking `POP`/`GO_BACK`
- `CollapsibleSection` component with `LayoutAnimation` for accordion behavior
- 472 tests, all passing

---

### Alpha V 1.4 — "Own Your Flow"

**Deload guidance. Smarter rest context. Cleaner workout controls.**

#### What's New

**🔄 Deload Week Guidance**
The app can now recommend a deload week using a mix of schedule and autoregulation signals: weeks since your last deload, recent performance regression, and active moderate/severe injuries. It never forces the change — it suggests, then lets you decide. You can also manually mark any workout as a deload right from the pre-workout check-in.

**🛡️ Deload Sessions That Behave Intentionally**
When you opt into a deload, working weights are reduced automatically based on your configured intensity %. The active workout screen shows a Deload banner, and the post-workout review treats lighter performance as intentional deload work instead of normal regression.

**⏱️ Rest Timer With Better Context**
The rest timer now shows what matters first: what set or exercise is coming up next, plus secondary workout-progress context like sets completed, exercises left, and a rough minutes-left estimate.

**📐 Clearer Plate Calculator**
The plate calculator is no longer a mystery modal. It now explains that the input is the full weight on the bar, supports manual entry, pre-fills from a selected set when opened from a row, and summarizes exactly what to load on each side.

**🏷️ Template-Named Logging Screen**
Once a workout starts, the logging screen header shows the actual template name for that day instead of a generic “Log” title.

**🧩 Cleaner Slot Controls**
Exercise switching and warmup management are split into separate sections inside each slot card, so “Exercise Option” and “Warm-up Prep” stop reading like one clustered control block.

#### Under the Hood
- Migration 42 adds `is_deload` to `sessions`
- New repository: `deloadRepo.ts` for deload settings, suggestions, and session marking
- Active draft sessions now carry `template_name` so the log header can reflect the current workout
- 472 tests, all passing
