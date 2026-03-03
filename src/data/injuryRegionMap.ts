/**
 * Maps user-facing injury body regions to the exercise metadata
 * (primary_muscle, secondary_muscle, movement_pattern) that should
 * be flagged during workouts.
 *
 * An exercise is "affected" if:
 *   1. Its primary_muscle OR secondary_muscle is in `muscles`, OR
 *   2. Its movement_pattern is in `patterns`
 */

export type InjuryRegion = {
  /** User-facing label */
  label: string;
  /** Icon for the picker / badges */
  icon: string;
  /** Muscle groups from exercises table that are affected */
  muscles: string[];
  /** Movement patterns from exercises table that are affected */
  patterns: string[];
};

export const INJURY_TYPES = [
  { value: 'sprain', label: 'Sprain' },
  { value: 'strain', label: 'Strain' },
  { value: 'tendinitis', label: 'Tendinitis' },
  { value: 'surgery', label: 'Post-Surgery' },
  { value: 'general_pain', label: 'General Pain' },
  { value: 'other', label: 'Other' },
] as const;

export type InjuryType = (typeof INJURY_TYPES)[number]['value'];

export type Severity = 'mild' | 'moderate' | 'severe';

export const SEVERITIES: { value: Severity; label: string; color: string; icon: string }[] = [
  { value: 'mild', label: 'Mild', color: '#E6A817', icon: '🟡' },
  { value: 'moderate', label: 'Moderate', color: '#E67317', icon: '🟠' },
  { value: 'severe', label: 'Severe', color: '#D32F2F', icon: '🔴' },
];

/**
 * Weight multiplier applied when pre-filling sets from historical data.
 * For 'mild', use 70% of last weight; 'moderate' = 50%; 'severe' = 0 (empty).
 */
export const SEVERITY_WEIGHT_FACTOR: Record<Severity, number> = {
  mild: 0.7,
  moderate: 0.5,
  severe: 0,
};

export const INJURY_REGIONS: Record<string, InjuryRegion> = {
  ankle: {
    label: 'Ankle',
    icon: '🦶',
    muscles: ['calves', 'tibialis'],
    patterns: ['squat', 'unilateral', 'hinge', 'press'],
  },
  knee: {
    label: 'Knee',
    icon: '🦵',
    muscles: ['quads', 'hamstrings'],
    patterns: ['squat', 'press', 'hinge', 'unilateral'],
  },
  hip: {
    label: 'Hip',
    icon: '🏃',
    muscles: ['glutes', 'adductors'],
    patterns: ['squat', 'hinge', 'unilateral', 'bridge'],
  },
  lower_back: {
    label: 'Lower Back',
    icon: '🔙',
    muscles: ['lower back'],
    patterns: ['hinge', 'squat', 'row'],
  },
  upper_back: {
    label: 'Upper Back',
    icon: '🔝',
    muscles: ['mid back', 'lats', 'traps'],
    patterns: ['row', 'pull'],
  },
  shoulder: {
    label: 'Shoulder',
    icon: '💪',
    muscles: ['shoulders front', 'shoulders side', 'shoulders rear', 'rear delt', 'chest', 'rotator cuff'],
    patterns: ['press', 'fly', 'pull'],
  },
  elbow: {
    label: 'Elbow',
    icon: '🦾',
    muscles: ['biceps', 'triceps'],
    patterns: ['isolation', 'press', 'pull', 'row'],
  },
  wrist: {
    label: 'Wrist',
    icon: '🤚',
    muscles: ['forearms', 'biceps', 'triceps'],
    patterns: ['isolation', 'press', 'pull', 'row'],
  },
  chest: {
    label: 'Chest',
    icon: '🫁',
    muscles: ['chest'],
    patterns: ['press', 'fly'],
  },
  neck: {
    label: 'Neck',
    icon: '🧣',
    muscles: ['traps'],
    patterns: [],
  },
};

export const INJURY_REGION_KEYS = Object.keys(INJURY_REGIONS);

/**
 * Check if a given exercise (by its muscle & pattern) is affected by a specific injury region.
 */
export function isExerciseAffected(
  primaryMuscle: string | null,
  secondaryMuscle: string | null,
  movementPattern: string | null,
  injuryRegionKey: string,
): boolean {
  const region = INJURY_REGIONS[injuryRegionKey];
  if (!region) return false;

  const muscles = region.muscles;
  const patterns = region.patterns;

  if (primaryMuscle && muscles.includes(primaryMuscle)) return true;
  if (secondaryMuscle && muscles.includes(secondaryMuscle)) return true;
  if (movementPattern && patterns.includes(movementPattern)) return true;

  return false;
}
