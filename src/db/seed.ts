import { executeSqlAsync } from './db';
import { normalizeName } from '../utils/normalize';
import { EXERCISE_GUIDES } from '../data/exerciseGuides';

function now() {
  return new Date().toISOString();
}

/* ── Master exercise library ────────────────────────────────── */
// [name, primary_muscle, secondary_muscle, aliases, equipment, movement_pattern]
type ExEntry = [string, string, string | null, string, string, string];

const EXERCISE_LIBRARY: ExEntry[] = [
  ['Barbell Back Squat', 'quads', 'glutes', 'back squat|bb squat|low bar squat|high bar squat', 'barbell', 'squat'],
  ['Barbell Front Squat', 'quads', 'glutes', 'front squat|clean grip squat|cross arm squat', 'barbell', 'squat'],
  ['Safety Bar Squat', 'quads', 'glutes', 'ssb squat|yoke bar squat', 'specialty bar', 'squat'],
  ['Zercher Squat', 'quads', 'glutes', 'zercher', 'barbell', 'squat'],
  ['Smith Machine Squat', 'quads', 'glutes', 'smith squat', 'machine', 'squat'],
  ['Hack Squat Machine', 'quads', 'glutes', 'plate loaded hack|hack press', 'machine', 'squat'],
  ['Pendulum Squat', 'quads', 'glutes', 'pendulum', 'machine', 'squat'],
  ['Belt Squat', 'quads', 'glutes', 'belt machine squat', 'machine', 'squat'],
  ['Goblet Squat', 'quads', 'glutes', 'kb goblet|db goblet', 'dumbbell/kb', 'squat'],
  ['Leg Press 45', 'quads', 'glutes', '45 leg press|angled press', 'machine', 'press'],
  ['Horizontal Leg Press', 'quads', 'glutes', 'seated leg press', 'machine', 'press'],
  ['Single Leg Press', 'quads', 'glutes', 'unilateral press', 'machine', 'press'],
  ['Leg Extension', 'quads', null, 'knee extension', 'machine', 'isolation'],
  ['Romanian Deadlift', 'hamstrings', 'glutes', 'rdl|romanian dl', 'barbell', 'hinge'],
  ['Stiff Leg Deadlift', 'hamstrings', 'glutes', 'sldl', 'barbell', 'hinge'],
  ['Conventional Deadlift', 'hamstrings', 'glutes', 'deadlift|conv dl', 'barbell', 'hinge'],
  ['Sumo Deadlift', 'hamstrings', 'glutes', 'sumo', 'barbell', 'hinge'],
  ['Trap Bar Deadlift', 'hamstrings', 'glutes', 'hex bar dl', 'trap bar', 'hinge'],
  ['Lying Leg Curl', 'hamstrings', null, 'prone curl|hamstring curl', 'machine', 'isolation'],
  ['Seated Leg Curl', 'hamstrings', null, '', 'machine', 'isolation'],
  ['Nordic Curl', 'hamstrings', 'glutes', 'nordic ham|natural glute ham|nordic hamstring curl', 'bodyweight', 'isolation'],
  ['Good Morning', 'hamstrings', 'lower back', 'good mornings|gm', 'barbell', 'hinge'],
  ['Barbell Hip Thrust', 'glutes', 'hamstrings', 'hip thrust|bb thrust', 'barbell', 'bridge'],
  ['Machine Hip Thrust', 'glutes', 'hamstrings', 'hip thrust machine|plate hip thrust', 'machine', 'bridge'],
  ['Cable Kickback', 'glutes', null, 'glute kickback', 'cable', 'isolation'],
  ['Bulgarian Split Squat', 'glutes', 'quads', 'bss|rear foot elevated split squat', 'db/bb', 'unilateral'],
  ['Walking Lunge', 'glutes', 'quads', 'lunges|forward lunge|dumbbell lunge', 'db/bb/bw', 'unilateral'],
  ['Step Up', 'glutes', 'quads', 'box step up', 'db/bb', 'unilateral'],
  ['Standing Calf Raise', 'calves', null, 'calf raise machine|calf raise', 'machine', 'isolation'],
  ['Seated Calf Raise', 'calves', null, '', 'machine', 'isolation'],
  ['Donkey Calf Raise', 'calves', null, '', 'machine', 'isolation'],
  ['Hip Abduction Machine', 'glutes', 'core', 'hip abduction|abductor machine|seated abduction', 'machine', 'isolation'],
  ['Tibialis Raise', 'tibialis', null, 'tib raise', 'machine/band', 'isolation'],
  ['Barbell Bench Press', 'chest', 'triceps', 'bench press|flat bench|bb bench', 'barbell', 'press'],
  ['Incline Barbell Bench', 'chest', 'triceps', 'incline bench|incline press|barbell incline benchpress', 'barbell', 'press'],
  ['Decline Barbell Bench', 'chest', 'triceps', 'decline bench', 'barbell', 'press'],
  ['Dumbbell Bench Press', 'chest', 'triceps', 'db bench|dumbbell benchpress', 'dumbbell', 'press'],
  ['Incline Dumbbell Press', 'chest', 'triceps', 'incline db|dumbbell incline benchpress', 'dumbbell', 'press'],
  ['Weighted Pushup', 'chest', 'triceps', 'weighted push up|push up', 'bodyweight', 'press'],
  ['Weighted Decline Pushup', 'chest', 'triceps', 'decline pushup|decline push up|weighted decline push up', 'bodyweight', 'press'],
  ['Pec Deck', 'chest', null, 'machine fly', 'machine', 'fly'],
  ['Dumbbell Fly', 'chest', null, 'db fly|dumbbell chest fly|flat fly', 'dumbbell', 'fly'],
  ['Cable Fly Mid', 'chest', null, 'cable crossover|mid fly|cable fly', 'cable', 'fly'],
  ['Cable Fly Low to High', 'chest', null, 'upper chest fly', 'cable', 'fly'],
  ['Cable Fly High to Low', 'chest', null, 'lower chest fly', 'cable', 'fly'],
  ['Dip', 'chest', 'triceps', 'chest dip|parallel dip|dips', 'bodyweight/machine', 'press'],
  ['Diamond Pushup', 'triceps', 'chest', 'diamond push up|close grip pushup', 'bodyweight', 'press'],
  ['Pull Up', 'lats', 'biceps', 'pullup|pronated pullup|pull up', 'bodyweight', 'pull'],
  ['Chin Up', 'lats', 'biceps', 'chinup|supinated pullup|chin up', 'bodyweight', 'pull'],
  ['Lat Pulldown', 'lats', 'biceps', 'wide pulldown|front pulldown|lat pulldown machine', 'machine/cable', 'pull'],
  ['Neutral Pulldown', 'lats', 'biceps', 'mag grip pulldown', 'machine/cable', 'pull'],
  ['Dumbbell Pullover', 'lats', 'chest', 'db pullover|pullover', 'dumbbell', 'pull'],
  ['Seated Cable Row', 'mid back', 'biceps', 'cable row|low row', 'cable', 'row'],
  ['Chest Supported Row', 'mid back', 'biceps', 'incline row|seal row machine', 'machine', 'row'],
  ['T Bar Row', 'mid back', 'biceps', 'landmine row', 'machine/barbell', 'row'],
  ['Barbell Row', 'mid back', 'biceps', 'bent over row|bb row|barbell row', 'barbell', 'row'],
  ['One Arm Dumbbell Row', 'mid back', 'biceps', 'db row|kroc row|dumbbell row', 'dumbbell', 'row'],
  ['Face Pull', 'rear delt', 'upper back', 'rope face pull', 'cable', 'pull'],
  ['Reverse Pec Deck', 'rear delt', null, 'reverse pec deck fly|rear delt machine', 'machine', 'isolation'],
  ['Straight Arm Pulldown', 'lats', null, 'lat prayer|pull over cable', 'cable', 'isolation'],
  ['Back Extension', 'lower back', 'glutes', 'hyperextension', 'machine', 'hinge'],
  ['Reverse Hyper', 'lower back', 'glutes', '', 'machine', 'hinge'],
  ['Overhead Press', 'shoulders front', 'triceps', 'ohp|military press|standing overhead press|sitting overhead press', 'barbell', 'press'],
  ['Dumbbell Shoulder Press', 'shoulders front', 'triceps', 'db press|seated dumbbell press', 'dumbbell', 'press'],
  ['Arnold Press', 'shoulders front', 'triceps', '', 'dumbbell', 'press'],
  ['Dumbbell Lateral Raise', 'shoulders side', null, 'lat raise|side raise|lateral raise', 'dumbbell', 'isolation'],
  ['Cable Lateral Raise', 'shoulders side', null, '', 'cable', 'isolation'],
  ['Rear Delt Fly', 'shoulders rear', null, 'reverse fly|rear delt fly', 'machine/db', 'isolation'],
  ['Barbell Shrug', 'traps', null, '', 'barbell', 'isolation'],
  ['Dumbbell Shrug', 'traps', null, '', 'dumbbell', 'isolation'],
  ['Barbell Curl', 'biceps', null, 'bb curl|barbell strict curl', 'barbell', 'isolation'],
  ['EZ Bar Curl', 'biceps', null, 'preacher ez curl|ez-bar curl', 'ez bar', 'isolation'],
  ['Dumbbell Curl', 'biceps', null, 'alt curl', 'dumbbell', 'isolation'],
  ['Hammer Curl', 'biceps', null, 'neutral curl', 'dumbbell', 'isolation'],
  ['Concentration Curl', 'biceps', null, 'concetration curl|seated concentration curl', 'dumbbell', 'isolation'],
  ['Preacher Curl', 'biceps', null, 'preacher curl bench|scott curl', 'ez bar/db', 'isolation'],
  ['Preacher Curl Machine', 'biceps', null, '', 'machine', 'isolation'],
  ['Skullcrusher', 'triceps', null, 'lying tricep extension|skull crusher', 'ez/bb/db', 'isolation'],
  ['Tricep Pushdown', 'triceps', null, 'pressdown|rope pushdown|triceps pushdown', 'cable', 'isolation'],
  ['Overhead Tricep Extension', 'triceps', null, 'french press|overhead triceps extension', 'cable/db', 'isolation'],
  ['Cable Crunch', 'core', null, 'kneeling crunch', 'cable', 'flexion'],
  ['Hanging Leg Raise', 'core', null, 'hlr|toes to bar (strict)', 'bodyweight', 'flexion'],
  ['Ab Wheel Rollout', 'core', null, 'wheel rollout', 'wheel', 'anti-extension'],
  ['Plank', 'core', null, 'front plank', 'bodyweight', 'stability'],
  ['Pallof Press', 'core', null, 'anti rotation press', 'cable/band', 'anti-rotation'],
  ['Sled Push', 'conditioning', 'full body', 'prowler push', 'sled', 'drive'],
  ['Sled Pull', 'conditioning', 'full body', 'backward drag', 'sled', 'pull'],
  ['Farmer Carry', 'conditioning', 'full body', 'farmers walk', 'db/trap', 'carry'],
  ['Battle Rope', 'conditioning', 'full body', 'ropes', 'rope', 'conditioning'],
];

/**
 * Ensures every exercise in the master library exists in the DB.
 * Uses a version stamp so bulk inserts only run once per library version.
 */
const LIBRARY_VERSION = 4; // bump when EXERCISE_LIBRARY changes

export async function ensureExerciseLibrary() {
  // Check if we've already synced this version
  const vRes = await executeSqlAsync(
    `SELECT value FROM app_settings WHERE key='exercise_library_version';`
  );
  const currentVersion = vRes.rows.length ? parseInt(vRes.rows.item(0).value, 10) : 0;
  if (currentVersion >= LIBRARY_VERSION) return;

  for (const [name, primary, secondary, aliases, equipment, pattern] of EXERCISE_LIBRARY) {
    await executeSqlAsync(
      `INSERT OR IGNORE INTO exercises(name, name_norm, primary_muscle, secondary_muscle, aliases, equipment, movement_pattern, created_at)
       VALUES (?,?,?,?,?,?,?,?);`,
      [name, normalizeName(name), primary, secondary, aliases, equipment, pattern, now()]
    );
    // Also update existing rows that don't have metadata yet
    await executeSqlAsync(
      `UPDATE exercises SET primary_muscle=?, secondary_muscle=?, aliases=?, equipment=?, movement_pattern=?
       WHERE name_norm=? AND primary_muscle IS NULL;`,
      [primary, secondary, aliases, equipment, pattern, normalizeName(name)]
    );

    // Populate guide data (video_url, instructions, tips)
    const guide = EXERCISE_GUIDES[normalizeName(name)];
    if (guide) {
      await executeSqlAsync(
        `UPDATE exercises SET video_url=?, instructions=?, tips=?
         WHERE name_norm=? AND video_url IS NULL;`,
        [guide.url, guide.steps, guide.tips, normalizeName(name)]
      );
    }
  }

  await executeSqlAsync(
    `INSERT OR REPLACE INTO app_settings(key, value) VALUES ('exercise_library_version', ?);`,
    [String(LIBRARY_VERSION)]
  );
}

/**
 * Creates demo template & session only on first launch (when no templates exist).
 */
export async function seedIfNeeded() {
  await ensureExerciseLibrary();
  await ensureProgramTemplates();
}

/* ── Helper: look up exercise ID by name ──────────────────────── */
async function exId(name: string): Promise<number> {
  const res = await executeSqlAsync(
    `SELECT id FROM exercises WHERE name_norm=? LIMIT 1;`,
    [normalizeName(name)]
  );
  if (!res.rows.length) throw new Error(`Exercise not found: ${name}`);
  return res.rows.item(0).id;
}

/* ── Helper: create a full template from a declarative spec ───── */
type SlotSpec = {
  name: string;
  exercises: string[]; // exercise names from EXERCISE_LIBRARY
  sets: number;
  repsLow: number;
  repsHigh: number;
  rest?: number;
};

async function createProgramTemplate(templateName: string, slots: SlotSpec[]) {
  // Skip if template already exists
  const existing = await executeSqlAsync(
    `SELECT id FROM templates WHERE name_norm=?;`,
    [normalizeName(templateName)]
  );
  if (existing.rows.length > 0) return;

  await executeSqlAsync(
    `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
    [templateName, normalizeName(templateName), now()]
  );
  const tRes = await executeSqlAsync(
    `SELECT id FROM templates WHERE name_norm=?;`,
    [normalizeName(templateName)]
  );
  const templateId = tRes.rows.item(0).id;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const slotIndex = i + 1;

    await executeSqlAsync(
      `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
      [templateId, slotIndex, slot.name, now()]
    );
    const slotRes = await executeSqlAsync(
      `SELECT id FROM template_slots WHERE template_id=? AND slot_index=?;`,
      [templateId, slotIndex]
    );
    const slotId = slotRes.rows.item(0).id;

    // Add exercise options
    for (let o = 0; o < slot.exercises.length; o++) {
      const exerciseId = await exId(slot.exercises[o]);
      await executeSqlAsync(
        `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at)
         VALUES (?,?,?,?,?);`,
        [slotId, exerciseId, null, o, now()]
      );
    }

    // Add prescribed sets
    const midReps = Math.round((slot.repsLow + slot.repsHigh) / 2);
    const rest = slot.rest ?? 90;
    for (let s = 1; s <= slot.sets; s++) {
      await executeSqlAsync(
        `INSERT INTO template_prescribed_sets(template_slot_id, set_index, weight, reps, rpe, notes, rest_seconds, created_at)
         VALUES (?,?,?,?,?,?,?,?);`,
        [slotId, s, null, midReps, null, null, rest, now()]
      );
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   PROGRAM TEMPLATES
   ═══════════════════════════════════════════════════════════════ */
async function ensureProgramTemplates() {
  const vRes = await executeSqlAsync(
    `SELECT value FROM app_settings WHERE key='program_templates_version';`
  );
  const currentVersion = vRes.rows.length ? parseInt(vRes.rows.item(0).value, 10) : 0;
  if (currentVersion >= 1) return;

  /* ────────── 5-DAY FULLBODY ────────── */

  await createProgramTemplate('5D-FB-Day1', [
    { name: 'Chest – Horizontal Push', exercises: ['Barbell Bench Press', 'Dumbbell Bench Press', 'Weighted Pushup'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Back – Vertical Pull', exercises: ['Pull Up', 'Chin Up', 'Lat Pulldown', 'Dumbbell Pullover'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Shoulders – Overhead Press', exercises: ['Overhead Press', 'Dumbbell Shoulder Press'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Biceps – Normal Curl', exercises: ['Barbell Curl', 'EZ Bar Curl', 'Dumbbell Curl'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Triceps – Lateral Head', exercises: ['Tricep Pushdown', 'Diamond Pushup', 'Dip'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Quads – Squat', exercises: ['Barbell Back Squat', 'Barbell Front Squat', 'Goblet Squat'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Hamstrings – Curl', exercises: ['Lying Leg Curl', 'Nordic Curl'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Calves – Calf Raise', exercises: ['Standing Calf Raise', 'Seated Calf Raise'], sets: 3, repsLow: 15, repsHigh: 30, rest: 45 },
  ]);

  await createProgramTemplate('5D-FB-Day2', [
    { name: 'Back – Horizontal Pull', exercises: ['Barbell Row', 'One Arm Dumbbell Row'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Chest – Incline Push', exercises: ['Incline Barbell Bench', 'Incline Dumbbell Press', 'Weighted Decline Pushup'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Biceps – Brachialis', exercises: ['Hammer Curl'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Shoulders – Lateral Raise', exercises: ['Dumbbell Lateral Raise', 'Cable Lateral Raise'], sets: 3, repsLow: 15, repsHigh: 20, rest: 45 },
    { name: 'Shoulders – Rear Delt', exercises: ['Rear Delt Fly', 'Reverse Pec Deck', 'Face Pull'], sets: 3, repsLow: 15, repsHigh: 20, rest: 45 },
    { name: 'Triceps – Overhead Extension', exercises: ['Skullcrusher', 'Overhead Tricep Extension'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Hamstrings – Hip Hinge', exercises: ['Romanian Deadlift', 'Stiff Leg Deadlift', 'Good Morning'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Quads – Isolation', exercises: ['Leg Extension', 'Leg Press 45', 'Hack Squat Machine', 'Bulgarian Split Squat'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
  ]);

  await createProgramTemplate('5D-FB-Day3', [
    { name: 'Shoulders – Overhead Press', exercises: ['Overhead Press', 'Dumbbell Shoulder Press'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Back – Vertical Pull', exercises: ['Pull Up', 'Chin Up', 'Lat Pulldown', 'Dumbbell Pullover'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Chest – Isolation', exercises: ['Dumbbell Fly', 'Cable Fly Mid'], sets: 3, repsLow: 12, repsHigh: 20, rest: 60 },
    { name: 'Biceps – Peak Curl', exercises: ['Concentration Curl', 'Preacher Curl'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Triceps – Lateral Head', exercises: ['Tricep Pushdown', 'Diamond Pushup', 'Dip'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Glutes – Hip Thrust', exercises: ['Barbell Hip Thrust', 'Machine Hip Thrust'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Calves – Calf Raise', exercises: ['Standing Calf Raise', 'Seated Calf Raise'], sets: 3, repsLow: 15, repsHigh: 30, rest: 45 },
  ]);

  await createProgramTemplate('5D-FB-Day4', [
    { name: 'Biceps – Normal Curl', exercises: ['Barbell Curl', 'EZ Bar Curl', 'Dumbbell Curl'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Chest – Horizontal Push', exercises: ['Barbell Bench Press', 'Dumbbell Bench Press', 'Weighted Pushup'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Back – Horizontal Pull', exercises: ['Barbell Row', 'One Arm Dumbbell Row'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Shoulders – Lateral Raise', exercises: ['Dumbbell Lateral Raise', 'Cable Lateral Raise'], sets: 3, repsLow: 15, repsHigh: 20, rest: 45 },
    { name: 'Shoulders – Rear Delt', exercises: ['Rear Delt Fly', 'Reverse Pec Deck', 'Face Pull'], sets: 5, repsLow: 15, repsHigh: 20, rest: 45 },
    { name: 'Triceps – Overhead Extension', exercises: ['Skullcrusher', 'Overhead Tricep Extension'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Quads – Squat', exercises: ['Barbell Back Squat', 'Barbell Front Squat', 'Goblet Squat'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Hamstrings – Curl', exercises: ['Lying Leg Curl', 'Nordic Curl'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
  ]);

  await createProgramTemplate('5D-FB-Day5', [
    { name: 'Chest – Incline Push', exercises: ['Incline Barbell Bench', 'Incline Dumbbell Press', 'Weighted Decline Pushup'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Back – Vertical Pull', exercises: ['Pull Up', 'Chin Up', 'Lat Pulldown', 'Dumbbell Pullover'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Biceps – Normal Curl', exercises: ['Barbell Curl', 'EZ Bar Curl', 'Dumbbell Curl'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Triceps – Overhead Extension', exercises: ['Skullcrusher', 'Overhead Tricep Extension'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Hamstrings – Hip Hinge', exercises: ['Romanian Deadlift', 'Stiff Leg Deadlift', 'Good Morning'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Quads – Isolation', exercises: ['Leg Extension', 'Leg Press 45', 'Hack Squat Machine', 'Bulgarian Split Squat'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Calves – Calf Raise', exercises: ['Standing Calf Raise', 'Seated Calf Raise'], sets: 3, repsLow: 15, repsHigh: 30, rest: 45 },
  ]);

  /* ────────── 6-DAY FULLBODY ────────── */

  await createProgramTemplate('6D-FB-Day1', [
    { name: 'Chest – Horizontal Push', exercises: ['Barbell Bench Press', 'Dumbbell Bench Press', 'Weighted Pushup'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Chest – Incline Push', exercises: ['Incline Barbell Bench', 'Incline Dumbbell Press', 'Weighted Decline Pushup'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Back – Vertical Pull', exercises: ['Pull Up', 'Chin Up', 'Lat Pulldown', 'Dumbbell Pullover'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Biceps – Normal Curl', exercises: ['Barbell Curl', 'EZ Bar Curl', 'Dumbbell Curl'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Quads – Squat', exercises: ['Barbell Back Squat', 'Barbell Front Squat', 'Goblet Squat'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Hamstrings – Curl', exercises: ['Lying Leg Curl', 'Nordic Curl'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Calves – Calf Raise', exercises: ['Standing Calf Raise', 'Seated Calf Raise'], sets: 3, repsLow: 15, repsHigh: 30, rest: 45 },
  ]);

  await createProgramTemplate('6D-FB-Day2', [
    { name: 'Back – Horizontal Pull', exercises: ['Barbell Row', 'One Arm Dumbbell Row'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Back – Vertical Pull', exercises: ['Pull Up', 'Chin Up', 'Lat Pulldown', 'Dumbbell Pullover'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Shoulders – Overhead Press', exercises: ['Overhead Press', 'Dumbbell Shoulder Press'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Hamstrings – Hip Hinge', exercises: ['Romanian Deadlift', 'Stiff Leg Deadlift', 'Good Morning'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Quads – Isolation', exercises: ['Leg Extension', 'Leg Press 45', 'Hack Squat Machine', 'Bulgarian Split Squat'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Triceps – Overhead Extension', exercises: ['Skullcrusher', 'Overhead Tricep Extension'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Calves – Calf Raise', exercises: ['Standing Calf Raise', 'Seated Calf Raise'], sets: 3, repsLow: 15, repsHigh: 30, rest: 45 },
  ]);

  await createProgramTemplate('6D-FB-Day3', [
    { name: 'Shoulders – Overhead Press', exercises: ['Overhead Press', 'Dumbbell Shoulder Press'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Shoulders – Lateral Raise', exercises: ['Dumbbell Lateral Raise', 'Cable Lateral Raise'], sets: 3, repsLow: 15, repsHigh: 20, rest: 45 },
    { name: 'Back – Vertical Pull', exercises: ['Pull Up', 'Chin Up', 'Lat Pulldown', 'Dumbbell Pullover'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Chest – Horizontal Push', exercises: ['Barbell Bench Press', 'Dumbbell Bench Press', 'Weighted Pushup'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Chest – Isolation', exercises: ['Dumbbell Fly', 'Cable Fly Mid'], sets: 3, repsLow: 12, repsHigh: 20, rest: 60 },
    { name: 'Biceps – Peak Curl', exercises: ['Concentration Curl', 'Preacher Curl'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Triceps – Lateral Head', exercises: ['Tricep Pushdown', 'Diamond Pushup', 'Dip'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
  ]);

  await createProgramTemplate('6D-FB-Day4', [
    { name: 'Biceps – Normal Curl', exercises: ['Barbell Curl', 'EZ Bar Curl', 'Dumbbell Curl'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Biceps – Brachialis', exercises: ['Hammer Curl'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Shoulders – Lateral Raise', exercises: ['Dumbbell Lateral Raise', 'Cable Lateral Raise'], sets: 3, repsLow: 15, repsHigh: 20, rest: 45 },
    { name: 'Shoulders – Rear Delt', exercises: ['Rear Delt Fly', 'Reverse Pec Deck', 'Face Pull'], sets: 3, repsLow: 15, repsHigh: 20, rest: 45 },
    { name: 'Glutes – Hip Thrust', exercises: ['Barbell Hip Thrust', 'Machine Hip Thrust'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Glutes – Lunges', exercises: ['Walking Lunge', 'Cable Kickback'], sets: 3, repsLow: 15, repsHigh: 15 },
    { name: 'Calves – Calf Raise', exercises: ['Standing Calf Raise', 'Seated Calf Raise'], sets: 3, repsLow: 15, repsHigh: 30, rest: 45 },
  ]);

  await createProgramTemplate('6D-FB-Day5', [
    { name: 'Quads – Squat', exercises: ['Barbell Back Squat', 'Barbell Front Squat', 'Goblet Squat'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Quads – Isolation', exercises: ['Leg Extension', 'Leg Press 45', 'Hack Squat Machine', 'Bulgarian Split Squat'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Back – Horizontal Pull', exercises: ['Barbell Row', 'One Arm Dumbbell Row'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Chest – Incline Push', exercises: ['Incline Barbell Bench', 'Incline Dumbbell Press', 'Weighted Decline Pushup'], sets: 3, repsLow: 5, repsHigh: 8, rest: 120 },
    { name: 'Chest – Isolation', exercises: ['Dumbbell Fly', 'Cable Fly Mid'], sets: 3, repsLow: 12, repsHigh: 20, rest: 60 },
    { name: 'Biceps – Peak Curl', exercises: ['Concentration Curl', 'Preacher Curl'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Triceps – Lateral Head', exercises: ['Tricep Pushdown', 'Diamond Pushup', 'Dip'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Shoulders – Rear Delt', exercises: ['Rear Delt Fly', 'Reverse Pec Deck', 'Face Pull'], sets: 3, repsLow: 15, repsHigh: 20, rest: 45 },
  ]);

  await createProgramTemplate('6D-FB-Day6', [
    { name: 'Hamstrings – Hip Hinge', exercises: ['Romanian Deadlift', 'Stiff Leg Deadlift', 'Good Morning'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Hamstrings – Curl', exercises: ['Lying Leg Curl', 'Nordic Curl'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Back – Horizontal Pull', exercises: ['Barbell Row', 'One Arm Dumbbell Row'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Shoulders – Overhead Press', exercises: ['Overhead Press', 'Dumbbell Shoulder Press'], sets: 3, repsLow: 8, repsHigh: 12 },
    { name: 'Biceps – Brachialis', exercises: ['Hammer Curl'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Triceps – Overhead Extension', exercises: ['Skullcrusher', 'Overhead Tricep Extension'], sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
    { name: 'Calves – Calf Raise', exercises: ['Standing Calf Raise', 'Seated Calf Raise'], sets: 3, repsLow: 15, repsHigh: 30, rest: 45 },
  ]);

  await executeSqlAsync(
    `INSERT OR REPLACE INTO app_settings(key, value) VALUES ('program_templates_version', '1');`
  );
}
