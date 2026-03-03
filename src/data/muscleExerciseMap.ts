/**
 * Maps normalized exercise names to their primary and secondary muscle groups.
 * The muscle group IDs match the region IDs used in the MuscleMap component.
 *
 * Muscle group IDs:
 *   Front: chest, shoulders_front, shoulders_side, biceps, core, quads, tibialis
 *   Back:  traps, rear_delt, lats, mid_back, lower_back, triceps, glutes, hamstrings, calves
 */
export type MuscleInfo = {
  primary: string;
  secondary: string | null;
};

const MUSCLE_ALIAS: Record<string, string> = {
  'shoulders front': 'shoulders_front',
  'shoulders side': 'shoulders_side',
  'shoulders rear': 'rear_delt',
  'rear delt': 'rear_delt',
  'mid back': 'mid_back',
  'lower back': 'lower_back',
  'upper back': 'mid_back',
  'full body': 'full_body',
  conditioning: 'full_body',
  'rotator cuff': 'rotator_cuff',
  forearms: 'forearms',
  adductors: 'adductors',
};

function norm(m: string | null): string | null {
  if (!m || m === 'none') return null;
  return MUSCLE_ALIAS[m] ?? m;
}

// Built from the user's master exercise list
const RAW: Array<[string, string, string | null]> = [
  // SQUATS
  ['barbell back squat', 'quads', 'glutes'],
  ['barbell front squat', 'quads', 'glutes'],
  ['safety bar squat', 'quads', 'glutes'],
  ['zercher squat', 'quads', 'glutes'],
  ['smith machine squat', 'quads', 'glutes'],
  ['hack squat machine', 'quads', 'glutes'],
  ['pendulum squat', 'quads', 'glutes'],
  ['belt squat', 'quads', 'glutes'],
  ['goblet squat', 'quads', 'glutes'],

  // PRESS (legs)
  ['leg press 45', 'quads', 'glutes'],
  ['horizontal leg press', 'quads', 'glutes'],
  ['single leg press', 'quads', 'glutes'],

  // QUAD ISOLATION
  ['leg extension', 'quads', null],

  // HINGES
  ['romanian deadlift', 'hamstrings', 'glutes'],
  ['stiff leg deadlift', 'hamstrings', 'glutes'],
  ['conventional deadlift', 'hamstrings', 'glutes'],
  ['sumo deadlift', 'hamstrings', 'glutes'],
  ['trap bar deadlift', 'hamstrings', 'glutes'],
  ['good morning', 'hamstrings', 'lower_back'],

  // HAMSTRING ISOLATION
  ['lying leg curl', 'hamstrings', null],
  ['seated leg curl', 'hamstrings', null],
  ['nordic curl', 'hamstrings', 'glutes'],

  // GLUTES
  ['barbell hip thrust', 'glutes', 'hamstrings'],
  ['machine hip thrust', 'glutes', 'hamstrings'],
  ['cable kickback', 'glutes', null],
  ['bulgarian split squat', 'glutes', 'quads'],
  ['walking lunge', 'glutes', 'quads'],
  ['step up', 'glutes', 'quads'],

  // CALVES
  ['hip abduction machine', 'glutes', 'core'],

  // CALVES
  ['standing calf raise', 'calves', null],
  ['seated calf raise', 'calves', null],
  ['donkey calf raise', 'calves', null],
  ['tibialis raise', 'tibialis', null],

  // CHEST
  ['barbell bench press', 'chest', 'triceps'],
  ['incline barbell bench', 'chest', 'triceps'],
  ['decline barbell bench', 'chest', 'triceps'],
  ['dumbbell bench press', 'chest', 'triceps'],
  ['incline dumbbell press', 'chest', 'triceps'],
  ['weighted pushup', 'chest', 'triceps'],
  ['weighted decline pushup', 'chest', 'triceps'],
  ['pec deck', 'chest', null],
  ['dumbbell fly', 'chest', null],
  ['cable fly mid', 'chest', null],
  ['cable fly low to high', 'chest', null],
  ['cable fly high to low', 'chest', null],
  ['dip', 'chest', 'triceps'],
  ['diamond pushup', 'triceps', 'chest'],

  // BACK – VERTICAL PULLS
  ['pull up', 'lats', 'biceps'],
  ['chin up', 'lats', 'biceps'],
  ['lat pulldown', 'lats', 'biceps'],
  ['neutral pulldown', 'lats', 'biceps'],
  ['dumbbell pullover', 'lats', 'chest'],

  // BACK – ROWS
  ['seated cable row', 'mid_back', 'biceps'],
  ['chest supported row', 'mid_back', 'biceps'],
  ['t bar row', 'mid_back', 'biceps'],
  ['barbell row', 'mid_back', 'biceps'],
  ['one arm dumbbell row', 'mid_back', 'biceps'],

  // BACK – MISC
  ['face pull', 'rear_delt', 'mid_back'],
  ['reverse pec deck', 'rear_delt', null],
  ['straight arm pulldown', 'lats', null],
  ['back extension', 'lower_back', 'glutes'],
  ['reverse hyper', 'lower_back', 'glutes'],

  // SHOULDERS
  ['overhead press', 'shoulders_front', 'triceps'],
  ['dumbbell shoulder press', 'shoulders_front', 'triceps'],
  ['arnold press', 'shoulders_front', 'triceps'],
  ['dumbbell lateral raise', 'shoulders_side', null],
  ['cable lateral raise', 'shoulders_side', null],
  ['rear delt fly', 'rear_delt', null],

  // TRAPS
  ['barbell shrug', 'traps', null],
  ['dumbbell shrug', 'traps', null],

  // BICEPS
  ['barbell curl', 'biceps', null],
  ['ez bar curl', 'biceps', null],
  ['dumbbell curl', 'biceps', null],
  ['hammer curl', 'biceps', null],
  ['concentration curl', 'biceps', null],
  ['preacher curl', 'biceps', null],
  ['preacher curl machine', 'biceps', null],

  // TRICEPS
  ['skullcrusher', 'triceps', null],
  ['tricep pushdown', 'triceps', null],
  ['overhead tricep extension', 'triceps', null],

  // CORE
  ['cable crunch', 'core', null],
  ['hanging leg raise', 'core', null],
  ['ab wheel rollout', 'core', null],
  ['plank', 'core', null],
  ['pallof press', 'core', null],

  // CONDITIONING
  ['sled push', 'full_body', 'full_body'],
  ['sled pull', 'full_body', 'full_body'],
  ['farmer carry', 'full_body', 'full_body'],
  ['battle rope', 'full_body', 'full_body'],

  // ── Additional core / abs ──────────────────────────────
  ['crunch', 'core', null],
  ['decline crunch', 'core', null],
  ['reverse crunch', 'core', null],
  ['lying leg raise', 'core', null],
  ['captain chair leg raise', 'core', null],
  ['bicycle crunch', 'core', 'core'],
  ['dead bug', 'core', null],
  ['v up', 'core', null],
  ['russian twist', 'core', 'core'],
  ['dragon flag', 'core', null],
  ['decline situp', 'core', null],
  ['mountain climber', 'core', null],

  // ── Additional cable exercises ─────────────────────────
  ['cable upright row', 'shoulders_side', 'traps'],
  ['cable reverse fly', 'rear_delt', null],
  ['cable front raise', 'shoulders_front', null],
  ['cable overhead curl', 'biceps', null],
  ['cable hammer curl', 'biceps', null],
  ['single arm cable row', 'mid_back', 'biceps'],
  ['cable shrug', 'traps', null],
  ['cable external rotation', 'shoulders_front', null],
  ['cable internal rotation', 'shoulders_front', null],
  ['cable ab crunch (standing)', 'core', null],

  // ── Additional dip variations ──────────────────────────
  ['weighted dip', 'chest', 'triceps'],
  ['tricep dip', 'triceps', 'chest'],
  ['machine dip', 'chest', 'triceps'],
  ['ring dip', 'chest', 'triceps'],

  // ── Other popular exercises ────────────────────────────
  ['close grip bench press', 'triceps', 'chest'],
  ['incline cable fly', 'chest', null],
  ['machine chest press', 'chest', 'triceps'],
  ['machine shoulder press', 'shoulders_front', 'triceps'],
  ['machine lat pulldown', 'lats', 'biceps'],
  ['machine row', 'mid_back', 'biceps'],
  ['machine preacher curl', 'biceps', null],
  ['dumbbell rdl', 'hamstrings', 'glutes'],
  ['reverse lunge', 'glutes', 'quads'],
  ['lateral lunge', 'glutes', 'adductors'],
  ['sissy squat', 'quads', null],
  ['land mine press', 'shoulders_front', 'chest'],
  ['incline hammer curl', 'biceps', null],
  ['spider curl', 'biceps', null],
  ['wrist curl', 'forearms', null],
  ['reverse wrist curl', 'forearms', null],
  ['seated row machine', 'mid_back', 'biceps'],
  ['smith machine bench press', 'chest', 'triceps'],
  ['smith machine incline bench', 'chest', 'triceps'],
];

export const exerciseMuscleMap: Record<string, MuscleInfo> = {};
for (const [name, primary, secondary] of RAW) {
  exerciseMuscleMap[name] = {
    primary: norm(primary) ?? primary,
    secondary: norm(secondary),
  };
}

/**
 * Look up the muscle groups for an exercise by its name.
 * Falls back to fuzzy substring matching if exact match isn't found.
 */
export function getMuscleInfo(exerciseName: string): MuscleInfo | null {
  const key = exerciseName.trim().toLowerCase();

  // Exact match
  if (exerciseMuscleMap[key]) return exerciseMuscleMap[key];

  // Fuzzy: check if the exercise name contains a known exercise name
  for (const [mapKey, info] of Object.entries(exerciseMuscleMap)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return info;
  }

  return null;
}

/**
 * All muscle group IDs used in the app, for "full_body" highlighting.
 */
export const ALL_MUSCLE_IDS = [
  'chest',
  'shoulders_front',
  'shoulders_side',
  'biceps',
  'core',
  'quads',
  'tibialis',
  'traps',
  'rear_delt',
  'lats',
  'mid_back',
  'lower_back',
  'triceps',
  'glutes',
  'hamstrings',
  'calves',
  'forearms',
  'adductors',
  'rotator_cuff',
];
