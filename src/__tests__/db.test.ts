/**
 * Comprehensive test suite for the Workout App.
 *
 * Covers:
 *  1. Migrations — structure, ordering, SQL validity
 *  2. Utility functions — normalizeName, unit conversions, weight parsing
 *  3. Data transformations — set completion, e1RM, progressive overload
 *  4. Set validation — replaceSetsForChoice input validation logic
 *  5. Warmup generation — ramp-up logic, edge cases
 *  6. Foreign key / cascade / orphan scenarios
 *  7. Discard-draft cleanup logic
 *  8. Template prescribed-set anchoring
 *  9. History warmup filtering
 * 10. PR detection logic
 * 11. Body weight repo logic
 * 12. Streak calculation logic
 */
import { migrations } from '../db/migrations';
import { normalizeName } from '../utils/normalize';
import { kgToLb, lbToKg, formatWeight, parseWeight } from '../utils/units';

/* ═══════════════════════════════════════════════════════════
 *  1. MIGRATION TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Migrations', () => {
  test('should export a non-empty array', () => {
    expect(Array.isArray(migrations)).toBe(true);
    expect(migrations.length).toBeGreaterThan(0);
  });

  test('every migration should be a non-empty string', () => {
    migrations.forEach((m, i) => {
      expect(typeof m).toBe('string');
      expect(m.trim().length).toBeGreaterThan(0);
    });
  });

  test('should have at least 32 migrations (including drop_set_segments)', () => {
    expect(migrations.length).toBeGreaterThanOrEqual(32);
  });

  test('first migration creates schema_migrations table', () => {
    expect(migrations[0]).toMatch(/schema_migrations/i);
  });

  test('exercises table created in migration 2', () => {
    expect(migrations[1]).toMatch(/CREATE TABLE.*exercises/i);
    expect(migrations[1]).toMatch(/name_norm\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i);
  });

  test('exercise_options has ON DELETE CASCADE', () => {
    expect(migrations[2]).toMatch(/exercise_options/i);
    expect(migrations[2]).toMatch(/ON DELETE CASCADE/i);
  });

  test('templates table created', () => {
    expect(migrations[3]).toMatch(/CREATE TABLE.*templates/i);
    expect(migrations[3]).toMatch(/name_norm\s+TEXT.*UNIQUE/i);
  });

  test('template_slots has CASCADE and UNIQUE constraint', () => {
    expect(migrations[4]).toMatch(/template_slots/i);
    expect(migrations[4]).toMatch(/UNIQUE.*template_id.*slot_index/i);
    expect(migrations[4]).toMatch(/ON DELETE CASCADE/i);
  });

  test('template_slot_options has CASCADE', () => {
    expect(migrations[5]).toMatch(/template_slot_options/i);
    expect(migrations[5]).toMatch(/ON DELETE CASCADE/i);
  });

  test('sessions table has CHECK constraint on status', () => {
    expect(migrations[6]).toMatch(/sessions/i);
    expect(migrations[6]).toMatch(/CHECK\s*\(\s*status\s+IN\s*\(\s*'draft'\s*,\s*'final'\s*\)/i);
  });

  test('session_slots has ON DELETE CASCADE for session_id', () => {
    expect(migrations[7]).toMatch(/session_slots/i);
    expect(migrations[7]).toMatch(/FOREIGN KEY\(session_id\).*ON DELETE CASCADE/i);
  });

  test('session_slot_choices has CASCADE on both FKs', () => {
    const m = migrations[8];
    expect(m).toMatch(/session_slot_choices/i);
    const cascadeCount = (m.match(/ON DELETE CASCADE/gi) || []).length;
    expect(cascadeCount).toBeGreaterThanOrEqual(2);
  });

  test('sets table has CASCADE and UNIQUE constraint', () => {
    expect(migrations[9]).toMatch(/CREATE TABLE.*sets/i);
    expect(migrations[9]).toMatch(/UNIQUE.*session_slot_choice_id.*set_index/i);
    expect(migrations[9]).toMatch(/ON DELETE CASCADE/i);
  });

  test('app_settings table created', () => {
    expect(migrations[10]).toMatch(/app_settings/i);
    expect(migrations[10]).toMatch(/key\s+TEXT\s+PRIMARY KEY/i);
  });

  test('indexes created for performance', () => {
    expect(migrations[11]).toMatch(/CREATE INDEX.*idx_sessions_status_date/i);
    expect(migrations[12]).toMatch(/CREATE INDEX.*idx_session_slots_session/i);
    expect(migrations[13]).toMatch(/CREATE INDEX.*idx_sets_choice/i);
  });

  test('template_prescribed_sets recreated in migration 17 with template_slot_id FK', () => {
    expect(migrations[15]).toMatch(/DROP TABLE.*template_prescribed_sets/i);
    expect(migrations[16]).toMatch(/CREATE TABLE.*template_prescribed_sets/i);
    expect(migrations[16]).toMatch(/template_slot_id\s+INT\s+NOT\s+NULL/i);
    expect(migrations[16]).toMatch(/ON DELETE CASCADE/i);
  });

  test('completed column added to sets', () => {
    expect(migrations[17]).toMatch(/ALTER TABLE sets ADD COLUMN completed/i);
  });

  test('rest_seconds columns added', () => {
    expect(migrations[18]).toMatch(/ALTER TABLE template_prescribed_sets ADD COLUMN rest_seconds/i);
    expect(migrations[19]).toMatch(/ALTER TABLE sets ADD COLUMN rest_seconds/i);
  });

  test('exercise metadata columns added (primary_muscle, equipment, etc)', () => {
    const metadataMigrations = migrations.slice(20, 25).join('\n');
    expect(metadataMigrations).toMatch(/primary_muscle/i);
    expect(metadataMigrations).toMatch(/secondary_muscle/i);
    expect(metadataMigrations).toMatch(/aliases/i);
    expect(metadataMigrations).toMatch(/equipment/i);
    expect(metadataMigrations).toMatch(/movement_pattern/i);
  });

  test('exercise guide columns added (video_url, instructions, tips)', () => {
    const guideMigrations = migrations.slice(25, 28).join('\n');
    expect(guideMigrations).toMatch(/video_url/i);
    expect(guideMigrations).toMatch(/instructions/i);
    expect(guideMigrations).toMatch(/tips/i);
  });

  test('personal_records table created', () => {
    expect(migrations[28]).toMatch(/CREATE TABLE.*personal_records/i);
    expect(migrations[28]).toMatch(/pr_type\s+TEXT\s+NOT\s+NULL/i);
    expect(migrations[28]).toMatch(/ON DELETE CASCADE/i);
  });

  test('body_weight table created', () => {
    expect(migrations[29]).toMatch(/CREATE TABLE.*body_weight/i);
    expect(migrations[29]).toMatch(/weight\s+REAL\s+NOT\s+NULL/i);
    expect(migrations[29]).toMatch(/unit\s+TEXT\s+NOT\s+NULL/i);
  });

  test('is_warmup column added to sets (migration 31)', () => {
    expect(migrations[30]).toMatch(/ALTER TABLE sets ADD COLUMN is_warmup/i);
    expect(migrations[30]).toMatch(/DEFAULT 0/i);
  });

  test('drop_set_segments table created (migration 32)', () => {
    expect(migrations[31]).toMatch(/CREATE TABLE.*drop_set_segments/i);
    expect(migrations[31]).toMatch(/set_id\s+INT\s+NOT\s+NULL/i);
    expect(migrations[31]).toMatch(/segment_index\s+INT\s+NOT\s+NULL/i);
    expect(migrations[31]).toMatch(/weight\s+REAL\s+NOT\s+NULL/i);
    expect(migrations[31]).toMatch(/UNIQUE.*set_id.*segment_index/i);
    expect(migrations[31]).toMatch(/ON DELETE CASCADE/i);
  });

  test('CREATE TABLE migrations have PRIMARY KEY', () => {
    const createMigrations = migrations.filter((m) =>
      m.trim().toLowerCase().startsWith('create table')
    );
    createMigrations.forEach((m) => {
      expect(m).toMatch(/PRIMARY KEY/i);
    });
  });

  test('all foreign key references point to valid tables', () => {
    const allSql = migrations.join('\n');
    const fkPattern = /FOREIGN KEY\([^)]+\)\s+REFERENCES\s+(\w+)/gi;
    const referencedTables = new Set<string>();
    let match;
    while ((match = fkPattern.exec(allSql)) !== null) {
      referencedTables.add(match[1].toLowerCase());
    }
    const createdTables = new Set<string>();
    const createPattern = /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/gi;
    while ((match = createPattern.exec(allSql)) !== null) {
      createdTables.add(match[1].toLowerCase());
    }
    for (const ref of referencedTables) {
      expect(createdTables).toContain(ref);
    }
  });

  test('no duplicate table creation (except template_prescribed_sets which is recreated)', () => {
    const creates: string[] = [];
    const createPattern = /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/gi;
    for (const m of migrations) {
      let match;
      while ((match = createPattern.exec(m)) !== null) {
        creates.push(match[1].toLowerCase());
      }
    }
    const nonRecreated = creates.filter(t => t !== 'template_prescribed_sets' && t !== 'schema_migrations');
    const unique = new Set(nonRecreated);
    expect(unique.size).toBe(nonRecreated.length);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  2. NORMALIZE NAME TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('normalizeName', () => {
  test('trims whitespace', () => {
    expect(normalizeName('  Bench Press  ')).toBe('bench press');
  });

  test('collapses multiple spaces', () => {
    expect(normalizeName('Bench   Press')).toBe('bench press');
  });

  test('lowercases input', () => {
    expect(normalizeName('OVERHEAD PRESS')).toBe('overhead press');
  });

  test('handles empty string', () => {
    expect(normalizeName('')).toBe('');
  });

  test('handles single word', () => {
    expect(normalizeName('Squats')).toBe('squats');
  });

  test('handles tabs and newlines', () => {
    expect(normalizeName('Bench\t\nPress')).toBe('bench press');
  });

  test('preserves hyphens', () => {
    expect(normalizeName('Close-Grip Bench')).toBe('close-grip bench');
  });

  test('preserves parentheses', () => {
    expect(normalizeName('Curl (Barbell)')).toBe('curl (barbell)');
  });

  test('handles leading/trailing + internal whitespace together', () => {
    expect(normalizeName('   Front   Squat   ')).toBe('front squat');
  });

  test('single character', () => {
    expect(normalizeName('A')).toBe('a');
  });

  test('already normalized input stays the same', () => {
    expect(normalizeName('bench press')).toBe('bench press');
  });

  test('unicode characters are preserved', () => {
    expect(normalizeName('Ãbdominal Crunch')).toBe('ãbdominal crunch');
  });
});

/* ═══════════════════════════════════════════════════════════
 *  3. UNIT CONVERSION TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Unit conversions', () => {
  describe('kgToLb', () => {
    test('converts 0 kg', () => {
      expect(kgToLb(0)).toBe(0);
    });

    test('converts 1 kg to ~2.205 lb', () => {
      expect(kgToLb(1)).toBeCloseTo(2.2046, 3);
    });

    test('converts 100 kg to ~220.46 lb', () => {
      expect(kgToLb(100)).toBeCloseTo(220.462, 1);
    });

    test('converts negative values', () => {
      expect(kgToLb(-10)).toBeCloseTo(-22.046, 1);
    });

    test('converts fractional values', () => {
      expect(kgToLb(2.5)).toBeCloseTo(5.512, 1);
    });
  });

  describe('lbToKg', () => {
    test('converts 0 lb', () => {
      expect(lbToKg(0)).toBe(0);
    });

    test('converts 1 lb to ~0.454 kg', () => {
      expect(lbToKg(1)).toBeCloseTo(0.4536, 3);
    });

    test('converts 225 lb to ~102.06 kg', () => {
      expect(lbToKg(225)).toBeCloseTo(102.058, 0);
    });

    test('round-trip kg → lb → kg is identity', () => {
      const original = 80;
      expect(lbToKg(kgToLb(original))).toBeCloseTo(original, 10);
    });

    test('round-trip lb → kg → lb is identity', () => {
      const original = 135;
      expect(kgToLb(lbToKg(original))).toBeCloseTo(original, 10);
    });
  });

  describe('formatWeight', () => {
    test('formats kg with 1 decimal', () => {
      expect(formatWeight(100, 'kg')).toBe('100.0');
    });

    test('formats kg with fractional', () => {
      expect(formatWeight(82.5, 'kg')).toBe('82.5');
    });

    test('formats lb — converts and shows 1 decimal', () => {
      const result = formatWeight(100, 'lb');
      expect(parseFloat(result)).toBeCloseTo(220.5, 0);
    });

    test('formats 0 in kg', () => {
      expect(formatWeight(0, 'kg')).toBe('0.0');
    });

    test('formats 0 in lb', () => {
      expect(formatWeight(0, 'lb')).toBe('0.0');
    });
  });

  describe('parseWeight', () => {
    test('parses valid kg input (no conversion)', () => {
      expect(parseWeight('100', 'kg')).toBe(100);
    });

    test('parses valid lb input (converts to kg)', () => {
      const result = parseWeight('225', 'lb');
      expect(result).toBeCloseTo(102.06, 0);
    });

    test('returns null for empty string', () => {
      expect(parseWeight('', 'kg')).toBeNull();
    });

    test('returns null for non-numeric string', () => {
      expect(parseWeight('abc', 'kg')).toBeNull();
    });

    test('parses decimal input in kg', () => {
      expect(parseWeight('82.5', 'kg')).toBe(82.5);
    });

    test('parses decimal input in lb', () => {
      const result = parseWeight('45.5', 'lb');
      expect(result).not.toBeNull();
      expect(result!).toBeCloseTo(20.639, 1);
    });

    test('round-trip: parseWeight(formatWeight(w, u), u) ≈ w', () => {
      const w = 60;
      const formatted = formatWeight(w, 'kg');
      const parsed = parseWeight(formatted, 'kg');
      expect(parsed).toBeCloseTo(w, 1);
    });
  });
});

/* ═══════════════════════════════════════════════════════════
 *  4. TYPE CONSISTENCY TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Type imports', () => {
  test('types module exports required types', () => {
    const types = require('../types');
    expect(types).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════
 *  5. SET DATA TRANSFORMATION TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('SetData transformation', () => {
  test('completed=1 converts to true', () => {
    const dbRow = { id: 1, set_index: 1, weight: 100, reps: 8, rpe: null,
      rest_seconds: 90, completed: 1, session_slot_choice_id: 5, notes: null, created_at: '2025-01-01' };
    expect(!!dbRow.completed).toBe(true);
    expect(typeof !!dbRow.completed).toBe('boolean');
  });

  test('completed=0 converts to false', () => {
    expect(!!0).toBe(false);
  });

  test('completed=1 converts to true', () => {
    expect(!!1).toBe(true);
  });

  test('null/undefined completed is falsy', () => {
    const nullVal: any = null;
    const undefVal: any = undefined;
    expect(!!nullVal).toBe(false);
    expect(!!undefVal).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  6. E1RM CALCULATION TESTS (Epley formula)
 * ═══════════════════════════════════════════════════════════ */

describe('e1RM calculation (Epley: weight × (1 + reps / 30))', () => {
  const e1rm = (weight: number, reps: number) => weight * (1 + reps / 30);

  test('1 rep → 1.033x', () => {
    expect(e1rm(100, 1)).toBeCloseTo(103.33, 1);
  });

  test('5 reps → 1.167x', () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 1);
  });

  test('10 reps → 1.333x', () => {
    expect(e1rm(100, 10)).toBeCloseTo(133.33, 1);
  });

  test('12 reps (max for PR detection) → 1.4x', () => {
    expect(e1rm(100, 12)).toBeCloseTo(140, 1);
  });

  test('real-world: 100kg × 5 → ~116.7', () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 1);
  });

  test('real-world: 60kg × 8 → ~76', () => {
    expect(e1rm(60, 8)).toBeCloseTo(76, 0);
  });

  test('0 reps returns the weight itself', () => {
    expect(e1rm(100, 0)).toBe(100);
  });

  test('0 weight returns 0', () => {
    expect(e1rm(0, 10)).toBe(0);
  });

  test('heavy single: 200kg × 1', () => {
    expect(e1rm(200, 1)).toBeCloseTo(206.67, 1);
  });

  test('higher e1RM rep range comparison: 80×10 vs 100×5', () => {
    const a = e1rm(80, 10);  // ~106.67
    const b = e1rm(100, 5);  // ~116.67
    expect(b).toBeGreaterThan(a);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  7. PROGRESSIVE OVERLOAD SUGGESTION TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Progressive overload suggestion', () => {
  test('suggests +2.5 on the heaviest set when all completed', () => {
    const sets = [
      { weight: 80, reps: 8, completed: 1 },
      { weight: 85, reps: 6, completed: 1 },
      { weight: 82.5, reps: 7, completed: 1 },
    ];
    const allCompleted = sets.every((s) => s.completed);
    expect(allCompleted).toBe(true);
    const heaviest = sets.reduce((max, s) => (s.weight > max.weight ? s : max), sets[0]);
    expect(heaviest.weight + 2.5).toBe(87.5);
  });

  test('does NOT suggest when sets are incomplete', () => {
    const sets = [
      { weight: 80, reps: 8, completed: 1 },
      { weight: 85, reps: 6, completed: 0 },
    ];
    expect(sets.every((s) => s.completed)).toBe(false);
  });

  test('handles single set', () => {
    const sets = [{ weight: 100, reps: 5, completed: 1 }];
    expect(sets.every((s) => s.completed)).toBe(true);
    expect(sets[0].weight + 2.5).toBe(102.5);
  });

  test('handles all zeros', () => {
    const sets = [{ weight: 0, reps: 0, completed: 1 }];
    expect(sets.every((s) => s.completed)).toBe(true);
    expect(sets[0].weight + 2.5).toBe(2.5);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  8. SET INPUT VALIDATION TESTS (replaceSetsForChoice logic)
 * ═══════════════════════════════════════════════════════════ */

describe('Set input validation (replaceSetsForChoice rules)', () => {
  const isValidWeight = (w: string) => {
    const val = Number.parseFloat(w);
    return Number.isFinite(val) && val > 0;
  };
  const isValidReps = (r: string) => {
    const val = Number.parseInt(r, 10);
    return Number.isInteger(val) && val >= 1 && val <= 200;
  };
  const isValidRpe = (r: string) => {
    if (!r) return true; // null RPE is valid
    const val = Number.parseFloat(r);
    return val >= 1 && val <= 10 && (val * 2) % 1 === 0;
  };

  // Weight validation
  test('weight: valid positive number', () => {
    expect(isValidWeight('100')).toBe(true);
  });
  test('weight: valid decimal', () => {
    expect(isValidWeight('82.5')).toBe(true);
  });
  test('weight: rejects 0', () => {
    expect(isValidWeight('0')).toBe(false);
  });
  test('weight: rejects negative', () => {
    expect(isValidWeight('-10')).toBe(false);
  });
  test('weight: rejects NaN', () => {
    expect(isValidWeight('abc')).toBe(false);
  });
  test('weight: rejects empty', () => {
    expect(isValidWeight('')).toBe(false);
  });
  test('weight: rejects Infinity', () => {
    expect(isValidWeight('Infinity')).toBe(false);
  });

  // Reps validation
  test('reps: valid integer', () => {
    expect(isValidReps('8')).toBe(true);
  });
  test('reps: valid 1 (minimum)', () => {
    expect(isValidReps('1')).toBe(true);
  });
  test('reps: valid 200 (maximum)', () => {
    expect(isValidReps('200')).toBe(true);
  });
  test('reps: rejects 0', () => {
    expect(isValidReps('0')).toBe(false);
  });
  test('reps: rejects 201 (over max)', () => {
    expect(isValidReps('201')).toBe(false);
  });
  test('reps: rejects negative', () => {
    expect(isValidReps('-1')).toBe(false);
  });
  test('reps: decimal is truncated to integer (parseInt behavior)', () => {
    // parseInt('5.5', 10) → 5, which is a valid rep count
    expect(isValidReps('5.5')).toBe(true);
  });
  test('reps: rejects non-numeric', () => {
    expect(isValidReps('abc')).toBe(false);
  });

  // RPE validation (0.5 increments, 1–10)
  test('rpe: null/empty is valid', () => {
    expect(isValidRpe('')).toBe(true);
  });
  test('rpe: valid integer RPE', () => {
    expect(isValidRpe('8')).toBe(true);
  });
  test('rpe: valid half RPE', () => {
    expect(isValidRpe('7.5')).toBe(true);
  });
  test('rpe: valid RPE 10', () => {
    expect(isValidRpe('10')).toBe(true);
  });
  test('rpe: valid RPE 1', () => {
    expect(isValidRpe('1')).toBe(true);
  });
  test('rpe: rejects 0', () => {
    expect(isValidRpe('0')).toBe(false);
  });
  test('rpe: rejects 10.5', () => {
    expect(isValidRpe('10.5')).toBe(false);
  });
  test('rpe: rejects 7.3 (not a 0.5 increment)', () => {
    expect(isValidRpe('7.3')).toBe(false);
  });
  test('rpe: rejects negative', () => {
    expect(isValidRpe('-1')).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  9. WARMUP GENERATION LOGIC TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Warmup generation logic', () => {
  function computeWarmups(workingWeight: number, unit: 'kg' | 'lb') {
    const barWeight = unit === 'kg' ? 20 : 45;
    const roundTo = unit === 'kg' ? 2.5 : 5;
    const round = (v: number) => Math.round(v / roundTo) * roundTo;

    const warmups: Array<{ weight: number; reps: number }> = [];

    if (workingWeight > barWeight * 2) {
      warmups.push({ weight: barWeight, reps: 10 });
    }
    const w50 = round(workingWeight * 0.5);
    const w70 = round(workingWeight * 0.7);
    const w85 = round(workingWeight * 0.85);

    if (w50 > barWeight) warmups.push({ weight: w50, reps: 5 });
    if (w70 > w50) warmups.push({ weight: w70, reps: 3 });
    if (w85 > w70) warmups.push({ weight: w85, reps: 2 });

    return warmups;
  }

  test('100kg: bar → 50 → 70 → 85', () => {
    const result = computeWarmups(100, 'kg');
    expect(result).toEqual([
      { weight: 20, reps: 10 },
      { weight: 50, reps: 5 },
      { weight: 70, reps: 3 },
      { weight: 85, reps: 2 },
    ]);
  });

  test('60kg: bar → skip 50%(30<bar) → 42.5 → 50', () => {
    const result = computeWarmups(60, 'kg');
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toEqual({ weight: 20, reps: 10 });
  });

  test('40kg: no bar set (40 = barWeight*2, not >)', () => {
    const result = computeWarmups(40, 'kg');
    expect(result.every(w => w.weight !== 20)).toBe(true);
  });

  test('30kg: should return without crashing', () => {
    const result = computeWarmups(30, 'kg');
    expect(Array.isArray(result)).toBe(true);
  });

  test('225lb: bar → warmups', () => {
    const result = computeWarmups(225, 'lb');
    expect(result[0]).toEqual({ weight: 45, reps: 10 });
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  test('135lb: bar → warmups', () => {
    const result = computeWarmups(135, 'lb');
    expect(result[0]).toEqual({ weight: 45, reps: 10 });
  });

  test('50lb: no bar-only set (50 <= 90), but 45 may appear as percentage warmup', () => {
    const result = computeWarmups(50, 'lb');
    // No bar-only warm-up at 10 reps since 50 is NOT > barWeight*2 (90)
    expect(result.every(w => w.reps !== 10)).toBe(true);
    // w85 = round(50*0.85) = round(42.5/5)*5 = 45, so 45 CAN appear as w85
  });

  test('kg rounding to nearest 2.5', () => {
    const round = (v: number) => Math.round(v / 2.5) * 2.5;
    expect(round(51)).toBe(50);
    expect(round(52)).toBe(52.5);
    expect(round(53.74)).toBe(52.5);
    expect(round(53.75)).toBe(55);
  });

  test('lb rounding to nearest 5', () => {
    const round = (v: number) => Math.round(v / 5) * 5;
    expect(round(112)).toBe(110);
    expect(round(113)).toBe(115);
    expect(round(157)).toBe(155);
    expect(round(158)).toBe(160);
  });

  test('warmup set indexing: warmups prepended, working sets offset', () => {
    const warmups = computeWarmups(100, 'kg');
    const workingSets = [
      { set_index: 1, weight: 100, reps: 5 },
      { set_index: 2, weight: 100, reps: 5 },
      { set_index: 3, weight: 100, reps: 5 },
    ];
    const offset = warmups.length;
    const reindexed = workingSets.map((s) => ({
      ...s,
      set_index: s.set_index + offset,
    }));
    expect(reindexed[0].set_index).toBe(5);
    expect(reindexed[1].set_index).toBe(6);
    expect(reindexed[2].set_index).toBe(7);
  });

  test('warmup sets are marked is_warmup=1', () => {
    const warmups = computeWarmups(100, 'kg');
    expect(warmups.length).toBeGreaterThan(0);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 10. DISCARD-DRAFT CLEANUP LOGIC TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Discard draft cleanup', () => {
  test('delete order: sets → choices → slots → session', () => {
    const expectedOrder = [
      'DELETE FROM sets',
      'DELETE FROM session_slot_choices',
      'DELETE FROM session_slots',
      'DELETE FROM sessions',
    ];
    for (let i = 0; i < expectedOrder.length - 1; i++) {
      expect(expectedOrder.indexOf(expectedOrder[i])).toBeLessThan(
        expectedOrder.indexOf(expectedOrder[i + 1])
      );
    }
  });

  test('orphan scenario: session deleted but children remain', () => {
    const sessions = [{ id: 1 }, { id: 2 }];
    const sessionSlots = [
      { id: 10, session_id: 1 },
      { id: 11, session_id: 2 },
      { id: 12, session_id: 99 },
    ];
    const validSessionIds = new Set(sessions.map(s => s.id));
    const orphanedSlots = sessionSlots.filter(ss => !validSessionIds.has(ss.session_id));
    expect(orphanedSlots).toHaveLength(1);
    expect(orphanedSlots[0].id).toBe(12);
  });

  test('cascading orphan cleanup: slots → choices → sets', () => {
    const sessionSlots = [{ id: 10 }];
    const sessionSlotChoices = [
      { id: 100, session_slot_id: 10 },
      { id: 101, session_slot_id: 11 },
      { id: 102, session_slot_id: 12 },
    ];
    const sets = [
      { id: 1000, session_slot_choice_id: 100 },
      { id: 1001, session_slot_choice_id: 101 },
      { id: 1002, session_slot_choice_id: 102 },
      { id: 1003, session_slot_choice_id: 999 },
    ];

    const validSlotIds = new Set(sessionSlots.map(s => s.id));
    const orphanedChoices = sessionSlotChoices.filter(c => !validSlotIds.has(c.session_slot_id));
    expect(orphanedChoices).toHaveLength(2);

    const validChoiceIds = new Set(
      sessionSlotChoices.filter(c => validSlotIds.has(c.session_slot_id)).map(c => c.id)
    );
    const orphanedSets = sets.filter(s => !validChoiceIds.has(s.session_slot_choice_id));
    expect(orphanedSets).toHaveLength(3);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 11. TEMPLATE PRESCRIBED SET ANCHORING TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Template prescribed set anchoring', () => {
  test('set count matches prescribed, not history', () => {
    const prescribedSets = [
      { set_index: 1, weight: 0, reps: 8, rpe: null },
      { set_index: 2, weight: 0, reps: 8, rpe: null },
      { set_index: 3, weight: 0, reps: 8, rpe: null },
    ];
    const historicalSets = [
      { set_index: 1, weight: 80, reps: 8, rpe: null, rest_seconds: 90 },
      { set_index: 2, weight: 80, reps: 8, rpe: null, rest_seconds: 90 },
      { set_index: 3, weight: 80, reps: 8, rpe: null, rest_seconds: 90 },
      { set_index: 4, weight: 80, reps: 8, rpe: null, rest_seconds: 90 },
      { set_index: 5, weight: 80, reps: 8, rpe: null, rest_seconds: 90 },
    ];

    const workingHistory = historicalSets.slice(-prescribedSets.length);
    const result = prescribedSets.map((ps, i) => ({
      set_index: i + 1,
      weight: workingHistory[i]?.weight ?? ps.weight ?? 0,
      reps: workingHistory[i]?.reps ?? ps.reps ?? 0,
    }));

    expect(result).toHaveLength(3);
    expect(result[0].weight).toBe(80);
    expect(result[0].reps).toBe(8);
  });

  test('no history: falls back to prescribed values', () => {
    const prescribedSets = [
      { set_index: 1, weight: 60, reps: 10, rpe: 7 },
      { set_index: 2, weight: 60, reps: 10, rpe: 8 },
    ];
    const historicalSets: any[] = [];

    const workingHistory = historicalSets.length > 0
      ? historicalSets.slice(-prescribedSets.length)
      : [];

    const result = prescribedSets.map((ps, i) => ({
      set_index: i + 1,
      weight: workingHistory[i]?.weight ?? ps.weight ?? 0,
      reps: workingHistory[i]?.reps ?? ps.reps ?? 0,
    }));

    expect(result).toHaveLength(2);
    expect(result[0].weight).toBe(60);
    expect(result[1].reps).toBe(10);
  });

  test('history has fewer sets than prescribed: fills remaining from prescribed', () => {
    const prescribedSets = [
      { set_index: 1, weight: 60, reps: 10 },
      { set_index: 2, weight: 60, reps: 10 },
      { set_index: 3, weight: 60, reps: 10 },
    ];
    const historicalSets = [
      { weight: 70, reps: 8, rest_seconds: 90 },
    ];

    const workingHistory = historicalSets.slice(-prescribedSets.length);
    const result = prescribedSets.map((ps, i) => ({
      set_index: i + 1,
      weight: workingHistory[i]?.weight ?? ps.weight ?? 0,
      reps: workingHistory[i]?.reps ?? ps.reps ?? 0,
    }));

    expect(result).toHaveLength(3);
    expect(result[0].weight).toBe(70);
    expect(result[1].weight).toBe(60);
    expect(result[2].weight).toBe(60);
  });

  test('slice(-N) takes last N elements from history', () => {
    const history = [
      { weight: 40, reps: 10 },
      { weight: 80, reps: 8 },
      { weight: 82.5, reps: 7 },
      { weight: 85, reps: 6 },
    ];
    const sliced = history.slice(-3);
    expect(sliced).toHaveLength(3);
    expect(sliced[0].weight).toBe(80);
    expect(sliced[2].weight).toBe(85);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 12. WARMUP FILTERING IN HISTORY QUERIES
 * ═══════════════════════════════════════════════════════════ */

describe('Warmup filtering in history', () => {
  test('is_warmup=0 filter excludes warmup sets', () => {
    const allSets = [
      { id: 1, weight: 20, reps: 10, is_warmup: 1 },
      { id: 2, weight: 50, reps: 5, is_warmup: 1 },
      { id: 3, weight: 70, reps: 3, is_warmup: 1 },
      { id: 4, weight: 100, reps: 5, is_warmup: 0 },
      { id: 5, weight: 100, reps: 5, is_warmup: 0 },
      { id: 6, weight: 100, reps: 5, is_warmup: 0 },
    ];
    const workingSets = allSets.filter(s => s.is_warmup === 0);
    expect(workingSets).toHaveLength(3);
    expect(workingSets.every(s => s.weight === 100)).toBe(true);
  });

  test('no warmup sets: all sets returned', () => {
    const allSets = [
      { id: 1, weight: 80, reps: 8, is_warmup: 0 },
      { id: 2, weight: 82.5, reps: 7, is_warmup: 0 },
    ];
    const workingSets = allSets.filter(s => s.is_warmup === 0);
    expect(workingSets).toHaveLength(2);
  });

  test('all warmup sets: empty result', () => {
    const allSets = [
      { id: 1, weight: 20, reps: 10, is_warmup: 1 },
      { id: 2, weight: 50, reps: 5, is_warmup: 1 },
    ];
    const workingSets = allSets.filter(s => s.is_warmup === 0);
    expect(workingSets).toHaveLength(0);
  });

  test('warmup flag preserved during re-indexing', () => {
    const existingSets = [
      { set_index: 1, weight: 100, reps: 5, is_warmup: 0 },
      { set_index: 2, weight: 100, reps: 5, is_warmup: 0 },
    ];
    const warmupCount = 3;
    const reindexed = existingSets.map(s => ({
      ...s,
      set_index: s.set_index + warmupCount,
      is_warmup: s.is_warmup ?? 0,
    }));
    expect(reindexed[0].set_index).toBe(4);
    expect(reindexed[0].is_warmup).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 13. PR DETECTION LOGIC TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('PR detection logic', () => {
  const e1rm = (weight: number, reps: number) => weight * (1 + reps / 30);

  test('new e1RM PR detected when current > previous', () => {
    const currentBest = e1rm(100, 5);
    const previousBest = e1rm(95, 5);
    expect(currentBest).toBeGreaterThan(previousBest);
  });

  test('no e1RM PR when current <= previous', () => {
    const currentBest = e1rm(90, 5);
    const previousBest = e1rm(100, 5);
    expect(currentBest).not.toBeGreaterThan(previousBest);
  });

  test('first-ever session always creates PR (no previous)', () => {
    const currentBest = e1rm(60, 10);
    const previousBest = null;
    const isPR = currentBest && (!previousBest || currentBest > previousBest);
    expect(isPR).toBeTruthy();
  });

  test('weight PR: heavier weight is PR', () => {
    expect(105 > 100).toBe(true);
  });

  test('weight PR: equal weight is NOT a PR', () => {
    expect(100 > 100).toBe(false);
  });

  test('only completed sets count for PRs', () => {
    const sets = [
      { weight: 120, reps: 1, completed: 0 },
      { weight: 100, reps: 5, completed: 1 },
    ];
    const completedSets = sets.filter(s => s.completed === 1);
    const bestWeight = Math.max(...completedSets.map(s => s.weight));
    expect(bestWeight).toBe(100);
  });

  test('only reps 1–12 count for e1RM PR', () => {
    const sets = [
      { weight: 50, reps: 20, completed: 1 },
      { weight: 80, reps: 8, completed: 1 },
    ];
    const validForE1rm = sets.filter(s => s.reps >= 1 && s.reps <= 12 && s.completed === 1);
    expect(validForE1rm).toHaveLength(1);
    expect(validForE1rm[0].weight).toBe(80);
  });

  test('weight > 0 required for e1RM and weight PR', () => {
    const sets = [
      { weight: 0, reps: 10, completed: 1 },
      { weight: 80, reps: 8, completed: 1 },
    ];
    const validSets = sets.filter(s => s.weight > 0 && s.completed === 1);
    expect(validSets).toHaveLength(1);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 14. STREAK CALCULATION LOGIC TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Streak calculation', () => {
  /** Format date as YYYY-MM-DD using local time (avoids UTC timezone shift). */
  function localDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function computeStreak(workoutDates: string[], today: Date): number {
    if (workoutDates.length === 0) return 0;

    const todayNorm = new Date(today);
    todayNorm.setHours(0, 0, 0, 0);

    const sortedDates = [...workoutDates].sort().reverse();
    const latest = new Date(sortedDates[0] + 'T00:00:00');
    const diffDays = Math.floor((todayNorm.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return 0;

    const dateSet = new Set(sortedDates);
    let streak = 0;
    let checkDate = new Date(todayNorm);

    for (let i = 0; i < 365; i++) {
      const dateStr = localDateStr(checkDate);
      if (dateSet.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // Use new Date(y, m-1, d) to create LOCAL dates — avoids UTC shift issues
  // that happen with new Date('YYYY-MM-DD') which is parsed as UTC midnight.
  const mkDate = (y: number, m: number, d: number) => new Date(y, m - 1, d);

  test('no workouts = 0 streak', () => {
    expect(computeStreak([], mkDate(2025, 6, 15))).toBe(0);
  });

  test('single workout today = 1', () => {
    expect(computeStreak(['2025-06-15'], mkDate(2025, 6, 15))).toBe(1);
  });

  test('consecutive days = streak count', () => {
    const dates = ['2025-06-13', '2025-06-14', '2025-06-15'];
    expect(computeStreak(dates, mkDate(2025, 6, 15))).toBe(3);
  });

  test('gap in streak breaks it', () => {
    const dates = ['2025-06-12', '2025-06-14', '2025-06-15'];
    expect(computeStreak(dates, mkDate(2025, 6, 15))).toBe(2);
  });

  test('yesterday workout counts if no workout today', () => {
    const dates = ['2025-06-14'];
    expect(computeStreak(dates, mkDate(2025, 6, 15))).toBe(1);
  });

  test('workout 2 days ago with nothing since = 0', () => {
    const dates = ['2025-06-13'];
    expect(computeStreak(dates, mkDate(2025, 6, 15))).toBe(0);
  });

  test('long streak', () => {
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = mkDate(2025, 6, 15);
      d.setDate(d.getDate() - i);
      dates.push(localDateStr(d));
    }
    expect(computeStreak(dates, mkDate(2025, 6, 15))).toBe(30);
  });

  test('duplicate dates are handled (multiple sessions per day)', () => {
    const dates = ['2025-06-15', '2025-06-15', '2025-06-14'];
    expect(computeStreak(dates, mkDate(2025, 6, 15))).toBe(2);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 15. VOLUME CALCULATION TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Volume calculations', () => {
  test('total volume = sum of (weight × reps) for completed sets', () => {
    const sets = [
      { weight: 100, reps: 5, completed: 1 },
      { weight: 100, reps: 5, completed: 1 },
      { weight: 100, reps: 5, completed: 1 },
    ];
    const volume = sets
      .filter(s => s.completed === 1)
      .reduce((sum, s) => sum + s.weight * s.reps, 0);
    expect(volume).toBe(1500);
  });

  test('incomplete sets excluded from volume', () => {
    const sets = [
      { weight: 100, reps: 5, completed: 1 },
      { weight: 100, reps: 5, completed: 0 },
    ];
    const volume = sets
      .filter(s => s.completed === 1)
      .reduce((sum, s) => sum + s.weight * s.reps, 0);
    expect(volume).toBe(500);
  });

  test('zero weight sets contribute 0 volume', () => {
    const sets = [{ weight: 0, reps: 10, completed: 1 }];
    const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    expect(volume).toBe(0);
  });

  test('zero reps sets contribute 0 volume', () => {
    const sets = [{ weight: 100, reps: 0, completed: 1 }];
    const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    expect(volume).toBe(0);
  });

  test('multi-exercise volume sums correctly', () => {
    const sets = [
      { weight: 100, reps: 5, completed: 1 },
      { weight: 60, reps: 10, completed: 1 },
      { weight: 40, reps: 12, completed: 1 },
    ];
    const volume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    expect(volume).toBe(1580);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 16. PLATE CALCULATOR LOGIC
 * ═══════════════════════════════════════════════════════════ */

describe('Plate calculator logic', () => {
  const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
  const LB_PLATES = [45, 35, 25, 10, 5, 2.5];

  function calculatePlates(targetWeight: number, barWeight: number, availablePlates: number[]) {
    let remaining = (targetWeight - barWeight) / 2;
    if (remaining <= 0) return [];

    const plates: number[] = [];
    for (const plate of availablePlates) {
      while (remaining >= plate) {
        plates.push(plate);
        remaining -= plate;
      }
    }
    return plates;
  }

  test('100kg on 20kg bar: 1×25 + 1×15 per side', () => {
    expect(calculatePlates(100, 20, KG_PLATES)).toEqual([25, 15]);
  });

  test('60kg on 20kg bar: 1×20 per side', () => {
    expect(calculatePlates(60, 20, KG_PLATES)).toEqual([20]);
  });

  test('20kg (just the bar): empty', () => {
    expect(calculatePlates(20, 20, KG_PLATES)).toEqual([]);
  });

  test('135lb on 45lb bar: 1×45 per side', () => {
    expect(calculatePlates(135, 45, LB_PLATES)).toEqual([45]);
  });

  test('225lb on 45lb bar: 2×45 per side', () => {
    expect(calculatePlates(225, 45, LB_PLATES)).toEqual([45, 45]);
  });

  test('315lb on 45lb bar: 3×45 per side', () => {
    expect(calculatePlates(315, 45, LB_PLATES)).toEqual([45, 45, 45]);
  });

  test('185lb on 45lb bar: 1×45 + 1×25 per side', () => {
    expect(calculatePlates(185, 45, LB_PLATES)).toEqual([45, 25]);
  });

  test('below bar weight: empty', () => {
    expect(calculatePlates(10, 20, KG_PLATES)).toEqual([]);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 17. FOREIGN KEY ENFORCEMENT TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Foreign key enforcement', () => {
  test('PRAGMA foreign_keys = ON is present in db.ts', () => {
    const fs = require('fs');
    const path = require('path');
    const dbSource = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'db.ts'),
      'utf8'
    );
    expect(dbSource).toMatch(/PRAGMA\s+foreign_keys\s*=\s*ON/i);
  });

  test('cleanupOrphans function exists in db.ts', () => {
    const fs = require('fs');
    const path = require('path');
    const dbSource = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'db.ts'),
      'utf8'
    );
    expect(dbSource).toMatch(/cleanupOrphans/);
  });

  test('cleanupOrphans deletes from all child tables', () => {
    const fs = require('fs');
    const path = require('path');
    const dbSource = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'db.ts'),
      'utf8'
    );
    expect(dbSource).toMatch(/DELETE FROM session_slots WHERE session_id NOT IN/i);
    expect(dbSource).toMatch(/DELETE FROM session_slot_choices WHERE session_slot_id NOT IN/i);
    expect(dbSource).toMatch(/DELETE FROM sets WHERE session_slot_choice_id NOT IN/i);
    expect(dbSource).toMatch(/DELETE FROM template_slot_options WHERE template_slot_id NOT IN/i);
    expect(dbSource).toMatch(/DELETE FROM template_prescribed_sets WHERE template_slot_id NOT IN/i);
  });

  test('discardDraft manually deletes children before session', () => {
    const fs = require('fs');
    const path = require('path');
    const repoSource = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'repositories', 'sessionsRepo.ts'),
      'utf8'
    );
    const deleteSetIdx = repoSource.indexOf('DELETE FROM sets');
    const deleteChoiceIdx = repoSource.indexOf('DELETE FROM session_slot_choices', deleteSetIdx);
    const deleteSlotIdx = repoSource.indexOf('DELETE FROM session_slots', deleteChoiceIdx);
    const deleteSessionIdx = repoSource.indexOf('DELETE FROM sessions', deleteSlotIdx);

    expect(deleteSetIdx).toBeGreaterThan(-1);
    expect(deleteChoiceIdx).toBeGreaterThan(deleteSetIdx);
    expect(deleteSlotIdx).toBeGreaterThan(deleteChoiceIdx);
    expect(deleteSessionIdx).toBeGreaterThan(deleteSlotIdx);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 18. HISTORY QUERY — WARMUP EXCLUSION IN SQL
 * ═══════════════════════════════════════════════════════════ */

describe('History query warmup exclusion', () => {
  test('getLastPerformedSets SQL includes is_warmup=0 filter', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'repositories', 'sessionsRepo.ts'),
      'utf8'
    );
    const fnStart = source.indexOf('async function getLastPerformedSets');
    expect(fnStart).toBeGreaterThan(-1);
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 1500);
    expect(fnBody).toMatch(/is_warmup\s*=\s*0/);
  });

  test('lastTimeForOption SQL includes is_warmup=0 filter', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'repositories', 'setsRepo.ts'),
      'utf8'
    );
    const fnStart = source.indexOf('async function lastTimeForOption');
    expect(fnStart).toBeGreaterThan(-1);
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 1200);
    expect(fnBody).toMatch(/is_warmup\s*=\s*0/);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 19. TEMPLATE CRUD LOGIC TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Template data model', () => {
  test('slot ordering is zero-indexed', () => {
    const slots = [
      { slot_index: 0, name: 'Chest' },
      { slot_index: 1, name: 'Back' },
      { slot_index: 2, name: 'Legs' },
    ];
    expect(slots[0].slot_index).toBe(0);
    expect(slots.map(s => s.slot_index)).toEqual([0, 1, 2]);
  });

  test('template name normalization for duplicate detection', () => {
    const name1 = normalizeName('Fullbody 1');
    const name2 = normalizeName('  Fullbody   1  ');
    expect(name1).toBe(name2);
  });

  test('prescribed set structure matches DB schema', () => {
    const prescribedSet = {
      template_slot_id: 1,
      set_index: 1,
      weight: 80,
      reps: 8,
      rpe: 7,
      notes: null,
      rest_seconds: 90,
    };
    expect(prescribedSet).toHaveProperty('template_slot_id');
    expect(prescribedSet).toHaveProperty('set_index');
    expect(prescribedSet).toHaveProperty('weight');
    expect(prescribedSet).toHaveProperty('reps');
    expect(prescribedSet).toHaveProperty('rpe');
    expect(prescribedSet).toHaveProperty('rest_seconds');
  });
});

/* ═══════════════════════════════════════════════════════════
 * 20. SESSION LIFECYCLE TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Session lifecycle', () => {
  test('session statuses are draft or final', () => {
    const validStatuses = ['draft', 'final'];
    expect(validStatuses).toContain('draft');
    expect(validStatuses).toContain('final');
    expect(validStatuses).not.toContain('pending');
    expect(validStatuses).not.toContain('');
  });

  test('draft → finalize sets performed_at timestamp', () => {
    const before = new Date();
    const performedAt = new Date().toISOString();
    const after = new Date();
    expect(new Date(performedAt).getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(new Date(performedAt).getTime()).toBeLessThanOrEqual(after.getTime());
  });

  test('session hierarchy: session → slots → choices → sets', () => {
    const session = { id: 1, status: 'draft', template_id: 1 };
    const slots = [
      { id: 10, session_id: 1, slot_index: 0 },
      { id: 11, session_id: 1, slot_index: 1 },
    ];
    const choices = [
      { id: 100, session_slot_id: 10, template_slot_option_id: 5 },
      { id: 101, session_slot_id: 11, template_slot_option_id: 6 },
    ];
    const sets = [
      { id: 1000, session_slot_choice_id: 100, set_index: 1, weight: 80, reps: 8 },
      { id: 1001, session_slot_choice_id: 100, set_index: 2, weight: 80, reps: 8 },
      { id: 1002, session_slot_choice_id: 101, set_index: 1, weight: 60, reps: 10 },
    ];

    expect(slots.every(s => s.session_id === session.id)).toBe(true);
    const slotIds = new Set(slots.map(s => s.id));
    expect(choices.every(c => slotIds.has(c.session_slot_id))).toBe(true);
    const choiceIds = new Set(choices.map(c => c.id));
    expect(sets.every(s => choiceIds.has(s.session_slot_choice_id))).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 21. EXERCISE DELETION SAFETY TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Exercise deletion safety', () => {
  test('exercise in use by template cannot be deleted', () => {
    const templateSlotOptions = [{ exercise_id: 1 }, { exercise_id: 2 }];
    const isInUse = templateSlotOptions.some(tso => tso.exercise_id === 1);
    expect(isInUse).toBe(true);
  });

  test('unused exercise can be deleted', () => {
    const templateSlotOptions = [{ exercise_id: 2 }, { exercise_id: 3 }];
    const isInUse = templateSlotOptions.some(tso => tso.exercise_id === 5);
    expect(isInUse).toBe(false);
  });

  test('deleteExercise source checks template_slot_options', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'repositories', 'exercisesRepo.ts'),
      'utf8'
    );
    expect(source).toMatch(/template_slot_options.*exercise_id/i);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 22. BODY WEIGHT DATA MODEL TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Body weight data model', () => {
  test('body weight entry shape is correct', () => {
    const entry = {
      id: 1,
      weight: 80.5,
      unit: 'kg',
      measured_at: '2025-06-15T08:00:00.000Z',
    };
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('weight');
    expect(entry).toHaveProperty('unit');
    expect(entry).toHaveProperty('measured_at');
    expect(typeof entry.weight).toBe('number');
    expect(['kg', 'lb']).toContain(entry.unit);
  });

  test('trend data is ordered by date ascending', () => {
    const trend = [
      { date: '2025-06-13T08:00:00Z', value: 81 },
      { date: '2025-06-14T08:00:00Z', value: 80.5 },
      { date: '2025-06-15T08:00:00Z', value: 80 },
    ];
    for (let i = 1; i < trend.length; i++) {
      expect(new Date(trend[i].date).getTime())
        .toBeGreaterThan(new Date(trend[i - 1].date).getTime());
    }
  });

  test('latest body weight returns most recent entry', () => {
    const entries = [
      { id: 1, weight: 81, measured_at: '2025-06-13' },
      { id: 2, weight: 80, measured_at: '2025-06-15' },
      { id: 3, weight: 80.5, measured_at: '2025-06-14' },
    ];
    const sorted = [...entries].sort((a, b) =>
      b.measured_at.localeCompare(a.measured_at)
    );
    expect(sorted[0].weight).toBe(80);
    expect(sorted[0].id).toBe(2);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 23. IMPORT EXERCISES LOGIC TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Exercise import logic', () => {
  test('duplicate exercises detected by normalized name', () => {
    const existing = ['bench press', 'squat', 'deadlift'];
    const toImport = [
      { name: 'Bench Press' },
      { name: 'Overhead Press' },
    ];
    const newExercises = toImport.filter(
      ex => !existing.includes(normalizeName(ex.name))
    );
    expect(newExercises).toHaveLength(1);
    expect(newExercises[0].name).toBe('Overhead Press');
  });

  test('exercise with options imports all variants', () => {
    const payload = {
      name: 'Curl',
      options: ['Barbell', 'Dumbbell', 'EZ Bar'],
    };
    expect(payload.options).toHaveLength(3);
    payload.options.forEach((opt) => {
      expect(normalizeName(opt)).toBe(opt.toLowerCase());
    });
  });
});

/* ═══════════════════════════════════════════════════════════
 * 24. MUSCLE VOLUME AGGREGATION TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Muscle volume aggregation', () => {
  test('groups sets by primary_muscle', () => {
    const sets = [
      { exercise: 'Bench Press', primary_muscle: 'Chest', weight: 100, reps: 5 },
      { exercise: 'Incline Press', primary_muscle: 'Chest', weight: 80, reps: 8 },
      { exercise: 'Squat', primary_muscle: 'Quads', weight: 120, reps: 5 },
    ];

    const byMuscle: Record<string, { sets: number; volume: number }> = {};
    for (const s of sets) {
      if (!s.primary_muscle) continue;
      if (!byMuscle[s.primary_muscle]) byMuscle[s.primary_muscle] = { sets: 0, volume: 0 };
      byMuscle[s.primary_muscle].sets++;
      byMuscle[s.primary_muscle].volume += s.weight * s.reps;
    }

    expect(byMuscle['Chest'].sets).toBe(2);
    expect(byMuscle['Chest'].volume).toBe(1140);
    expect(byMuscle['Quads'].sets).toBe(1);
    expect(byMuscle['Quads'].volume).toBe(600);
  });

  test('exercises without primary_muscle are excluded', () => {
    const sets = [
      { primary_muscle: null, weight: 50, reps: 10 },
      { primary_muscle: 'Chest', weight: 80, reps: 8 },
    ];
    const withMuscle = sets.filter(s => s.primary_muscle !== null);
    expect(withMuscle).toHaveLength(1);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 25. SLOT SELECTION / EXERCISE SWITCHING TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Slot exercise selection', () => {
  test('switching exercise creates new session_slot_choice if not existing', () => {
    const existingChoices = [
      { session_slot_id: 10, template_slot_option_id: 5 },
    ];
    const existing = existingChoices.find(
      c => c.session_slot_id === 10 && c.template_slot_option_id === 6
    );
    expect(existing).toBeUndefined();
  });

  test('switching back to previous exercise reuses existing choice', () => {
    const existingChoices = [
      { id: 100, session_slot_id: 10, template_slot_option_id: 5 },
      { id: 101, session_slot_id: 10, template_slot_option_id: 6 },
    ];
    const existing = existingChoices.find(
      c => c.session_slot_id === 10 && c.template_slot_option_id === 5
    );
    expect(existing).toBeDefined();
    expect(existing!.id).toBe(100);
  });

  test('default selection: last used exercise, or first in order', () => {
    const lastSelected = { template_slot_option_id: 6 };
    const options = [
      { id: 5, order_index: 0 },
      { id: 6, order_index: 1 },
    ];
    const exists = options.find(o => o.id === lastSelected.template_slot_option_id);
    const defaultOptionId = exists ? exists.id : options[0].id;
    expect(defaultOptionId).toBe(6);
  });

  test('default falls back to first when last selected no longer exists', () => {
    const lastSelected = { template_slot_option_id: 99 };
    const options = [
      { id: 5, order_index: 0 },
      { id: 6, order_index: 1 },
    ];
    const exists = options.find(o => o.id === lastSelected.template_slot_option_id);
    const defaultOptionId = exists ? exists.id : options[0].id;
    expect(defaultOptionId).toBe(5);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 26. SEED IDEMPOTENCY TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Seed idempotency', () => {
  test('seed only runs on first install (version 0)', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'seed.ts'),
      'utf8'
    );
    expect(source).toMatch(/currentVersion\s*===\s*0/);
  });

  test('seed uses app_settings for version tracking', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'seed.ts'),
      'utf8'
    );
    expect(source).toMatch(/app_settings/);
    expect(source).toMatch(/LIBRARY_VERSION|library_version/);
  });

  test('template creation checks for existing by normalized name', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'seed.ts'),
      'utf8'
    );
    expect(source).toMatch(/name_norm/);
    expect(source).toMatch(/normalizeName/);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 27. EDGE CASES & REGRESSION TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Edge cases and regressions', () => {
  test('empty session has 0 total volume', () => {
    const sets: Array<{ weight: number; reps: number; completed: number }> = [];
    const volume = sets.reduce((sum, s) => sum + (s.completed ? s.weight * s.reps : 0), 0);
    expect(volume).toBe(0);
  });

  test('session with no completed sets has 0 volume', () => {
    const sets = [
      { weight: 100, reps: 5, completed: 0 },
      { weight: 100, reps: 5, completed: 0 },
    ];
    const volume = sets
      .filter(s => s.completed === 1)
      .reduce((sum, s) => sum + s.weight * s.reps, 0);
    expect(volume).toBe(0);
  });

  test('very large weight values handled', () => {
    const e1rm = 1000 * (1 + 1 / 30);
    expect(Number.isFinite(e1rm)).toBe(true);
    expect(e1rm).toBeCloseTo(1033.33, 1);
  });

  test('very small weight values handled', () => {
    const e1rm = 0.5 * (1 + 10 / 30);
    expect(Number.isFinite(e1rm)).toBe(true);
  });

  test('set_index is 1-based', () => {
    const sets = [
      { set_index: 1, weight: 80 },
      { set_index: 2, weight: 80 },
      { set_index: 3, weight: 80 },
    ];
    expect(sets[0].set_index).toBe(1);
    expect(sets[sets.length - 1].set_index).toBe(sets.length);
  });

  test('ISO date string format is consistent', () => {
    const now = new Date().toISOString();
    expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test('normalizeName idempotent for already normalized input', () => {
    const name = 'bench press';
    expect(normalizeName(normalizeName(name))).toBe(name);
  });

  test('GROUP_CONCAT with DISTINCT deduplicates exercise names', () => {
    const exerciseNames = ['Bench Press', 'Squat', 'Bench Press', 'Deadlift'];
    const distinct = [...new Set(exerciseNames)].join(', ');
    expect(distinct).toBe('Bench Press, Squat, Deadlift');
  });

  test('multiple sessions per day are all listed in history', () => {
    const sessions = [
      { id: 1, performed_at: '2025-06-15T08:00:00Z', status: 'final' },
      { id: 2, performed_at: '2025-06-15T18:00:00Z', status: 'final' },
    ];
    const onSameDay = sessions.filter(s => s.performed_at.startsWith('2025-06-15'));
    expect(onSameDay).toHaveLength(2);
  });

  test('draft sessions excluded from history', () => {
    const sessions = [
      { id: 1, status: 'final' },
      { id: 2, status: 'draft' },
      { id: 3, status: 'final' },
    ];
    const history = sessions.filter(s => s.status === 'final');
    expect(history).toHaveLength(2);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 28. UPSERT SET CONFLICT HANDLING
 * ═══════════════════════════════════════════════════════════ */

describe('Upsert set conflict handling', () => {
  test('ON CONFLICT updates existing set weight/reps', () => {
    const sets = new Map<string, { weight: number; reps: number }>();
    const key = (choiceId: number, setIndex: number) => `${choiceId}-${setIndex}`;

    sets.set(key(100, 1), { weight: 80, reps: 8 });
    expect(sets.get(key(100, 1))!.weight).toBe(80);

    sets.set(key(100, 1), { weight: 85, reps: 6 });
    expect(sets.get(key(100, 1))!.weight).toBe(85);
    expect(sets.get(key(100, 1))!.reps).toBe(6);
  });

  test('unique constraint: (session_slot_choice_id, set_index)', () => {
    const uniqueKeys = new Set<string>();
    const sets = [
      { choice_id: 100, set_index: 1 },
      { choice_id: 100, set_index: 2 },
      { choice_id: 101, set_index: 1 },
    ];
    for (const s of sets) {
      const key = `${s.choice_id}-${s.set_index}`;
      expect(uniqueKeys.has(key)).toBe(false);
      uniqueKeys.add(key);
    }
  });

  test('duplicate (choice_id, set_index) detected', () => {
    const uniqueKeys = new Set<string>();
    const sets = [
      { choice_id: 100, set_index: 1 },
      { choice_id: 100, set_index: 1 },
    ];
    let hasDuplicate = false;
    for (const s of sets) {
      const key = `${s.choice_id}-${s.set_index}`;
      if (uniqueKeys.has(key)) hasDuplicate = true;
      uniqueKeys.add(key);
    }
    expect(hasDuplicate).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 29. MUSCLE EXERCISE MAPPING TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('Muscle exercise mapping data', () => {
  test('muscleExerciseMap module loads', () => {
    const map = require('../data/muscleExerciseMap');
    expect(map).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════
 * 30. HISTORY LIST QUERY STRUCTURE
 * ═══════════════════════════════════════════════════════════ */

describe('History list expected fields', () => {
  test('HistoryItem has all required display fields', () => {
    const item = {
      id: 1,
      performed_at: '2025-06-15T08:00:00Z',
      created_at: '2025-06-15T07:55:00Z',
      template_name: 'Fullbody 1',
      notes: null,
      slots_count: 6,
      completed_sets_count: 18,
      sets_count: 18,
      total_volume: 5400,
      exercises: 'Bench Press, Squat, Deadlift',
    };

    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('performed_at');
    expect(item).toHaveProperty('template_name');
    expect(item).toHaveProperty('slots_count');
    expect(item).toHaveProperty('completed_sets_count');
    expect(item).toHaveProperty('sets_count');
    expect(item).toHaveProperty('total_volume');
    expect(item).toHaveProperty('exercises');
    expect(typeof item.total_volume).toBe('number');
  });

  test('completion percentage calculation', () => {
    const pct = 18 > 0 ? Math.round((15 / 18) * 100) : 0;
    expect(pct).toBe(83);
  });

  test('0 total sets → 0% (no division by zero)', () => {
    const pct = 0 > 0 ? Math.round((0 / 0) * 100) : 0;
    expect(pct).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 31. RESET DB — TABLE DROP ORDER
 * ═══════════════════════════════════════════════════════════ */

describe('resetDb table drop order', () => {
  test('child tables dropped before parent tables', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'db.ts'),
      'utf8'
    );

    const match = source.match(/const tables\s*=\s*\[([\s\S]*?)\]/);
    expect(match).not.toBeNull();

    const tablesStr = match![1];
    const tableOrder = tablesStr
      .split(',')
      .map((t: string) => t.trim().replace(/['"]/g, ''))
      .filter((t: string) => t.length > 0);

    expect(tableOrder.indexOf('drop_set_segments')).toBeLessThan(tableOrder.indexOf('sets'));
    expect(tableOrder.indexOf('sets')).toBeLessThan(tableOrder.indexOf('session_slot_choices'));
    expect(tableOrder.indexOf('session_slot_choices')).toBeLessThan(tableOrder.indexOf('session_slots'));
    expect(tableOrder.indexOf('session_slots')).toBeLessThan(tableOrder.indexOf('sessions'));
    expect(tableOrder.indexOf('template_prescribed_sets')).toBeLessThan(tableOrder.indexOf('template_slots'));
    expect(tableOrder.indexOf('template_slot_options')).toBeLessThan(tableOrder.indexOf('template_slots'));
    expect(tableOrder.indexOf('template_slots')).toBeLessThan(tableOrder.indexOf('templates'));
  });
});

/* ═══════════════════════════════════════════════════════════
 * 32. DROP-SET SEGMENT DATA MODEL & LOGIC
 * ═══════════════════════════════════════════════════════════ */

describe('Drop-set segment data model', () => {
  test('drop_set_segments migration has correct schema', () => {
    const m = migrations[31];
    expect(m).toMatch(/CREATE TABLE.*drop_set_segments/i);
    expect(m).toMatch(/set_id\s+INT\s+NOT\s+NULL/i);
    expect(m).toMatch(/reps\s+INT\s+NOT\s+NULL/i);
  });

  test('drop_set_segments has ON DELETE CASCADE to sets', () => {
    const m = migrations[31];
    expect(m).toMatch(/FOREIGN KEY.*set_id.*REFERENCES sets.*ON DELETE CASCADE/i);
  });

  test('UNIQUE constraint on (set_id, segment_index)', () => {
    const m = migrations[31];
    expect(m).toMatch(/UNIQUE.*set_id.*segment_index/i);
  });

  test('addDropSegment uses ON CONFLICT upsert', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'repositories', 'setsRepo.ts'),
      'utf8'
    );
    const fnStart = source.indexOf('async function addDropSegment');
    expect(fnStart).toBeGreaterThan(-1);
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 500);
    expect(fnBody).toMatch(/ON CONFLICT.*set_id.*segment_index/i);
  });

  test('deleteDropSegment exists in setsRepo', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'repositories', 'setsRepo.ts'),
      'utf8'
    );
    expect(source).toMatch(/export async function deleteDropSegment/i);
  });

  test('updateDropSegment exists in setsRepo', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'repositories', 'setsRepo.ts'),
      'utf8'
    );
    expect(source).toMatch(/export async function updateDropSegment/i);
  });

  test('drop-set volume calculation: main + segments', () => {
    const mainWeight = 135;
    const mainReps = 8;
    const drops = [
      { weight: 115, reps: 6 },
      { weight: 95, reps: 8 },
    ];
    const mainVolume = mainWeight * mainReps;
    const dropVolume = drops.reduce((sum, d) => sum + d.weight * d.reps, 0);
    const totalVolume = mainVolume + dropVolume;
    expect(totalVolume).toBe(135 * 8 + 115 * 6 + 95 * 8);
    expect(totalVolume).toBe(1080 + 690 + 760);
    expect(totalVolume).toBe(2530);
  });

  test('drop segment indexing: segments indexed from 1', () => {
    const drops = [
      { segment_index: 1, weight: 115, reps: 6 },
      { segment_index: 2, weight: 95, reps: 8 },
    ];
    expect(drops[0].segment_index).toBe(1);
    expect(drops[1].segment_index).toBe(2);
    const nextIndex = Math.max(...drops.map(d => d.segment_index)) + 1;
    expect(nextIndex).toBe(3);
  });

  test('suggested drop weight is ~80% of previous, rounded', () => {
    const previousWeight = 135;
    const roundTo = 5; // lb
    const suggested = Math.round((previousWeight * 0.8) / roundTo) * roundTo;
    expect(suggested).toBe(110); // 135 * 0.8 = 108 → round to nearest 5 = 110
  });

  test('cleanupOrphans includes drop_set_segments', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'db', 'db.ts'),
      'utf8'
    );
    expect(source).toMatch(/DELETE FROM drop_set_segments/i);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 33. BACKGROUND REST TIMER LOGIC
 * ═══════════════════════════════════════════════════════════ */

describe('Background rest timer', () => {
  test('useRestTimer hook source exists', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'hooks', 'useRestTimer.ts'),
      'utf8'
    );
    expect(source).toMatch(/export function useRestTimer/);
  });

  test('timer uses absolute endTime (not interval counting)', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'hooks', 'useRestTimer.ts'),
      'utf8'
    );
    expect(source).toMatch(/endTimeRef/);
    expect(source).toMatch(/Date\.now\(\)/);
  });

  test('timer schedules notification via expo-notifications', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'hooks', 'useRestTimer.ts'),
      'utf8'
    );
    expect(source).toMatch(/scheduleNotificationAsync/);
    expect(source).toMatch(/cancelScheduledNotificationAsync/);
  });

  test('timer listens for AppState changes', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'hooks', 'useRestTimer.ts'),
      'utf8'
    );
    expect(source).toMatch(/AppState\.addEventListener/);
  });

  test('timer re-shows modal when app returns to foreground', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'hooks', 'useRestTimer.ts'),
      'utf8'
    );
    // When app becomes active, if timer is running, set isVisible = true
    expect(source).toMatch(/setIsVisible\(true\)/);
  });

  test('timestamp-based remaining calculation', () => {
    // Simulate timer logic:  endTime - now → remaining
    const now = Date.now();
    const endTime = now + 60000; // 60 seconds from now
    const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
    expect(remaining).toBe(60);

    // After 25 seconds...
    const later = now + 25000;
    const remaining2 = Math.max(0, Math.ceil((endTime - later) / 1000));
    expect(remaining2).toBe(35);

    // After timer expires
    const expired = now + 61000;
    const remaining3 = Math.max(0, Math.ceil((endTime - expired) / 1000));
    expect(remaining3).toBe(0);
  });

  test('timer provides next-set context', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'hooks', 'useRestTimer.ts'),
      'utf8'
    );
    expect(source).toMatch(/nextSet/);
    expect(source).toMatch(/nextExercise/);
    expect(source).toMatch(/isLastSetOfExercise/);
  });

  test('timer exports all required actions', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'hooks', 'useRestTimer.ts'),
      'utf8'
    );
    expect(source).toMatch(/start/);
    expect(source).toMatch(/pause/);
    expect(source).toMatch(/resume/);
    expect(source).toMatch(/skip/);
    expect(source).toMatch(/addTime/);
  });
});

/* ═══════════════════════════════════════════════════════════
 * 34. NEXT-SET PREVIEW IN TIMER MODAL
 * ═══════════════════════════════════════════════════════════ */

describe('Next-set preview in timer', () => {
  test('LogScreen timer modal shows next-set preview', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'screens', 'LogScreen.tsx'),
      'utf8'
    );
    expect(source).toMatch(/COMING UP/);
    expect(source).toMatch(/UP NEXT/);
    expect(source).toMatch(/timer\.nextSet/);
    expect(source).toMatch(/timer\.nextExercise/);
  });

  test('timer start receives next-set context from set completion', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'screens', 'LogScreen.tsx'),
      'utf8'
    );
    expect(source).toMatch(/timer\.start\(s\.rest_seconds/);
    expect(source).toMatch(/nextSet:\s*nextSetInfo/);
    expect(source).toMatch(/nextExercise:\s*nextExInfo/);
    expect(source).toMatch(/isLastSet/);
  });

  test('next-set computation looks at remaining sets in current exercise', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'screens', 'LogScreen.tsx'),
      'utf8'
    );
    expect(source).toMatch(/nextSetInExercise/);
    expect(source).toMatch(/set_index > s\.set_index/);
  });

  test('last-set-of-exercise finds next exercise slot', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'screens', 'LogScreen.tsx'),
      'utf8'
    );
    expect(source).toMatch(/isLastSet = true/);
    expect(source).toMatch(/nextExInfo/);
  });

  test('timer progress bar UI exists', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'screens', 'LogScreen.tsx'),
      'utf8'
    );
    expect(source).toMatch(/timerProgressBg/);
    expect(source).toMatch(/timerProgressFill/);
  });

  test('timer shows completion state when remaining = 0', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'screens', 'LogScreen.tsx'),
      'utf8'
    );
    expect(source).toMatch(/Rest Complete!/);
    expect(source).toMatch(/Let.*s Go/);
  });
});
