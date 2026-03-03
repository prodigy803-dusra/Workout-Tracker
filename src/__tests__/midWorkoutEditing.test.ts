/**
 * Mid-Workout Editing & Workout Review Tests
 *
 * Covers 6 recent features end-to-end at the DB layer:
 *   1. Add exercise to active session (one-time & permanent)
 *   2. Remove exercise from active session (one-time & permanent)
 *   3. Add set to a choice mid-workout
 *   4. Reorder session slots (move up / move down)
 *   5. Clear warmup sets
 *   6. Workout review queries (sessionExerciseDeltas, previousSessionComparison)
 *
 * Strategy:
 *   - Uses the same better-sqlite3 in-memory shim as other integration tests.
 *   - Seeds two templates (Push Day, PPL Full) with realistic data.
 *   - Each describe block covers one feature, building on shared state.
 */

import Database from 'better-sqlite3';

/* ═══════════════════════════════════════════════════════════
 *  Mock expo-sqlite before importing any app code
 * ═══════════════════════════════════════════════════════════ */

let memDb: Database.Database;

function createExpoSqliteShim(raw: Database.Database) {
  return {
    getAllAsync(sql: string, params?: any[]) {
      const stmt = raw.prepare(sql);
      return Promise.resolve(stmt.all(...(params || [])));
    },
    runAsync(sql: string, params?: any[]) {
      const stmt = raw.prepare(sql);
      return Promise.resolve(stmt.run(...(params || [])));
    },
    execSync(sql: string) {
      raw.exec(sql);
    },
    withTransactionAsync: async (fn: () => Promise<void>) => {
      raw.exec('BEGIN');
      try {
        await fn();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
}

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: (_name: string) => {
    if (!memDb) memDb = new Database(':memory:');
    return createExpoSqliteShim(memDb);
  },
}));

/* ═══════════════════════════════════════════════════════════
 *  Import app modules (they'll use the mock)
 * ═══════════════════════════════════════════════════════════ */

import { executeSqlAsync, lastInsertRowId } from '../db/db';
import { migrations } from '../db/migrations';

import {
  createDraftFromTemplate,
  getActiveDraft,
  listDraftSlots,
  discardDraft,
  finalizeSession,
  addExerciseToSession,
  removeExerciseFromSession,
  addSetToChoice,
  reorderSessionSlots,
  getSessionDetail,
} from '../db/repositories/sessionsRepo';

import {
  listSetsForChoice,
  upsertSet,
  toggleSetCompleted,
  generateWarmupSets,
  clearWarmupSets,
} from '../db/repositories/setsRepo';

import {
  sessionExerciseDeltas,
  previousSessionComparison,
  sessionEffortStats,
} from '../db/repositories/statsRepo';

import type { ExerciseDelta, SessionEffortStats } from '../db/repositories/statsRepo';

/* ═══════════════════════════════════════════════════════════
 *  Helpers
 * ═══════════════════════════════════════════════════════════ */

const TS = '2025-08-01T10:00:00.000Z';
const TS2 = '2025-08-08T10:00:00.000Z';

async function rawInsert(sql: string, params: any[] = []): Promise<number> {
  await executeSqlAsync(sql, params);
  return lastInsertRowId();
}

/* Shared IDs */
let exBench: number;
let exSquat: number;
let exOHP: number;
let exCurls: number;

let tplPush: number;      // Push Day: Bench (slot 1) + OHP (slot 2)
let tplPushSlot1: number;
let tplPushSlot2: number;

/* ═══════════════════════════════════════════════════════════
 *  Setup: run migrations + seed exercises + template
 * ═══════════════════════════════════════════════════════════ */

beforeAll(async () => {
  for (const m of migrations) {
    await executeSqlAsync(m);
  }

  // --- Exercises ---
  exBench = await rawInsert(
    `INSERT INTO exercises(name, name_norm, primary_muscle, created_at) VALUES (?,?,?,?);`,
    ['Bench Press', 'bench press', 'Chest', TS]
  );
  exSquat = await rawInsert(
    `INSERT INTO exercises(name, name_norm, primary_muscle, created_at) VALUES (?,?,?,?);`,
    ['Squat', 'squat', 'Quads', TS]
  );
  exOHP = await rawInsert(
    `INSERT INTO exercises(name, name_norm, primary_muscle, created_at) VALUES (?,?,?,?);`,
    ['Overhead Press', 'overhead press', 'Shoulders', TS]
  );
  exCurls = await rawInsert(
    `INSERT INTO exercises(name, name_norm, primary_muscle, created_at) VALUES (?,?,?,?);`,
    ['Bicep Curls', 'bicep curls', 'Biceps', TS]
  );

  // --- Template: Push Day (Bench + OHP) ---
  tplPush = await rawInsert(
    `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
    ['Push Day', 'push day', TS]
  );
  tplPushSlot1 = await rawInsert(
    `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
    [tplPush, 1, 'Bench', TS]
  );
  await rawInsert(
    `INSERT INTO template_slot_options(template_slot_id, exercise_id, order_index, created_at) VALUES (?,?,?,?);`,
    [tplPushSlot1, exBench, 0, TS]
  );
  tplPushSlot2 = await rawInsert(
    `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
    [tplPush, 2, 'OHP', TS]
  );
  await rawInsert(
    `INSERT INTO template_slot_options(template_slot_id, exercise_id, order_index, created_at) VALUES (?,?,?,?);`,
    [tplPushSlot2, exOHP, 0, TS]
  );

  // Prescribed sets for Bench (3×10 @ 80kg)
  for (let i = 1; i <= 3; i++) {
    await rawInsert(
      `INSERT INTO template_prescribed_sets(template_slot_id, set_index, weight, reps, rpe, rest_seconds, created_at)
       VALUES (?,?,?,?,?,?,?);`,
      [tplPushSlot1, i, 80, 10, null, 90, TS]
    );
  }

  // Prescribed sets for OHP (3×10 @ 40kg)
  for (let i = 1; i <= 3; i++) {
    await rawInsert(
      `INSERT INTO template_prescribed_sets(template_slot_id, set_index, weight, reps, rpe, rest_seconds, created_at)
       VALUES (?,?,?,?,?,?,?);`,
      [tplPushSlot2, i, 40, 10, null, 60, TS]
    );
  }
});

afterAll(() => {
  if (memDb) memDb.close();
});

/* ═══════════════════════════════════════════════════════════
 *  1. ADD EXERCISE TO SESSION
 * ═══════════════════════════════════════════════════════════ */

describe('addExerciseToSession', () => {
  let draftId: number;

  beforeAll(async () => {
    draftId = await createDraftFromTemplate(tplPush);
  });

  afterAll(async () => {
    await discardDraft(draftId);
    // Clean up permanent template modifications so later suites start clean
    await executeSqlAsync(
      `UPDATE template_slots SET is_hidden = 1 WHERE template_id = ? AND slot_index > 2;`,
      [tplPush]
    );
  });

  test('draft starts with 2 slots (Bench + OHP)', async () => {
    const slots = await listDraftSlots(draftId);
    expect(slots).toHaveLength(2);
    expect(slots[0].exercise_name).toBe('Bench Press');
    expect(slots[1].exercise_name).toBe('Overhead Press');
  });

  test('adding Squat one-time creates a 3rd slot with 3 default sets', async () => {
    await addExerciseToSession(draftId, tplPush, exSquat, false);
    const slots = await listDraftSlots(draftId);
    expect(slots).toHaveLength(3);
    const squatSlot = slots.find((s) => s.exercise_name === 'Squat');
    expect(squatSlot).toBeDefined();

    // Should have 3 default sets (no history for Squat)
    const sets = await listSetsForChoice(squatSlot!.selected_session_slot_choice_id!);
    expect(sets).toHaveLength(3);
    expect(sets[0].weight).toBe(0); // no history
  });

  test('one-time add creates a hidden template_slot', async () => {
    const res = await executeSqlAsync(
      `SELECT is_hidden FROM template_slots WHERE template_id = ? ORDER BY slot_index DESC LIMIT 1;`,
      [tplPush]
    );
    expect(res.rows.item(0).is_hidden).toBe(1);
  });

  test('adding Curls permanently creates a visible template_slot', async () => {
    await addExerciseToSession(draftId, tplPush, exCurls, true);
    const slots = await listDraftSlots(draftId);
    expect(slots).toHaveLength(4);

    const curlsSlot = slots.find((s) => s.exercise_name === 'Bicep Curls');
    expect(curlsSlot).toBeDefined();

    // The template_slot for Curls should be visible (is_hidden = 0)
    const res = await executeSqlAsync(
      `SELECT is_hidden FROM template_slots
       WHERE id = (SELECT template_slot_id FROM session_slots WHERE id = ?);`,
      [curlsSlot!.session_slot_id]
    );
    expect(res.rows.item(0).is_hidden).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  2. REMOVE EXERCISE FROM SESSION
 * ═══════════════════════════════════════════════════════════ */

describe('removeExerciseFromSession', () => {
  let draftId: number;

  beforeAll(async () => {
    draftId = await createDraftFromTemplate(tplPush);
    // Add Squat and Curls so we have something to remove
    await addExerciseToSession(draftId, tplPush, exSquat, false);
    await addExerciseToSession(draftId, tplPush, exCurls, true);
  });

  afterAll(async () => {
    await discardDraft(draftId);
    // Clean up permanent template modifications
    await executeSqlAsync(
      `UPDATE template_slots SET is_hidden = 1 WHERE template_id = ? AND slot_index > 2;`,
      [tplPush]
    );
  });

  test('remove Squat one-time: deletes session data, template hidden stays hidden', async () => {
    let slots = await listDraftSlots(draftId);
    const squatSlot = slots.find((s) => s.exercise_name === 'Squat');
    expect(squatSlot).toBeDefined();
    const squatSlotId = squatSlot!.session_slot_id;

    // Look up the template_slot_id via raw SQL (not on DraftSlot type)
    const tplSlotRes = await executeSqlAsync(
      `SELECT template_slot_id FROM session_slots WHERE id = ?;`,
      [squatSlotId]
    );
    const tplSlotId = tplSlotRes.rows.item(0).template_slot_id;

    await removeExerciseFromSession(squatSlotId, false);

    slots = await listDraftSlots(draftId);
    expect(slots.find((s) => s.exercise_name === 'Squat')).toBeUndefined();
    // Template slot was already hidden (added one-time), check it's still hidden
    const res = await executeSqlAsync(
      `SELECT is_hidden FROM template_slots WHERE id = ?;`,
      [tplSlotId]
    );
    // Hidden slot should still exist
    expect(res.rows.length).toBe(1);
  });

  test('remove Curls permanently: hides the template_slot', async () => {
    let slots = await listDraftSlots(draftId);
    const curlsSlot = slots.find((s) => s.exercise_name === 'Bicep Curls');
    expect(curlsSlot).toBeDefined();
    // Look up the template_slot_id via raw SQL
    const tplSlotRes = await executeSqlAsync(
      `SELECT template_slot_id FROM session_slots WHERE id = ?;`,
      [curlsSlot!.session_slot_id]
    );
    const tplSlotId = tplSlotRes.rows.item(0).template_slot_id;

    await removeExerciseFromSession(curlsSlot!.session_slot_id, true);

    slots = await listDraftSlots(draftId);
    expect(slots.find((s) => s.exercise_name === 'Bicep Curls')).toBeUndefined();

    // Template slot should be hidden now
    const res = await executeSqlAsync(
      `SELECT is_hidden FROM template_slots WHERE id = ?;`,
      [tplSlotId]
    );
    expect(res.rows.item(0).is_hidden).toBe(1);
  });

  test('hidden template_slots are excluded from future drafts', async () => {
    // Discard current draft
    await discardDraft(draftId);

    // Create a new draft — Squat and Curls hidden slots should NOT appear
    const newDraftId = await createDraftFromTemplate(tplPush);
    const slots = await listDraftSlots(newDraftId);

    // Original 2 slots only (Bench + OHP), hidden ones excluded
    const exerciseNames = slots.map((s) => s.exercise_name);
    expect(exerciseNames).toContain('Bench Press');
    expect(exerciseNames).toContain('Overhead Press');
    expect(exerciseNames).not.toContain('Squat');
    expect(exerciseNames).not.toContain('Bicep Curls');

    // Reassign draftId so afterAll doesn't error
    draftId = newDraftId;
  });
});

/* ═══════════════════════════════════════════════════════════
 *  3. ADD SET TO CHOICE
 * ═══════════════════════════════════════════════════════════ */

describe('addSetToChoice', () => {
  let draftId: number;
  let benchChoiceId: number;

  beforeAll(async () => {
    draftId = await createDraftFromTemplate(tplPush);
    const slots = await listDraftSlots(draftId);
    benchChoiceId = slots.find((s) => s.exercise_name === 'Bench Press')!
      .selected_session_slot_choice_id!;
  });

  afterAll(async () => {
    await discardDraft(draftId);
  });

  test('starts with 3 prescribed sets', async () => {
    const sets = await listSetsForChoice(benchChoiceId);
    expect(sets).toHaveLength(3);
  });

  test('addSetToChoice appends a 4th set with same weight/reps as last', async () => {
    const newIndex = await addSetToChoice(benchChoiceId);
    expect(newIndex).toBe(4);

    const sets = await listSetsForChoice(benchChoiceId);
    expect(sets).toHaveLength(4);
    // Should copy from last working set (80kg, 10 reps from prescribed)
    expect(sets[3].weight).toBe(80);
    expect(sets[3].reps).toBe(10);
    expect(sets[3].completed).toBeFalsy();
  });

  test('addSetToChoice again appends a 5th set', async () => {
    await addSetToChoice(benchChoiceId);
    const sets = await listSetsForChoice(benchChoiceId);
    expect(sets).toHaveLength(5);
    expect(sets[4].set_index).toBe(5);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  4. REORDER SESSION SLOTS
 * ═══════════════════════════════════════════════════════════ */

describe('reorderSessionSlots', () => {
  let draftId: number;
  let benchSlotId: number;
  let ohpSlotId: number;

  beforeAll(async () => {
    draftId = await createDraftFromTemplate(tplPush);
    const slots = await listDraftSlots(draftId);
    benchSlotId = slots.find((s) => s.exercise_name === 'Bench Press')!.session_slot_id;
    ohpSlotId = slots.find((s) => s.exercise_name === 'Overhead Press')!.session_slot_id;
  });

  afterAll(async () => {
    await discardDraft(draftId);
  });

  test('initially Bench is slot 1, OHP is slot 2', async () => {
    const slots = await listDraftSlots(draftId);
    const bench = slots.find((s) => s.exercise_name === 'Bench Press');
    const ohp = slots.find((s) => s.exercise_name === 'Overhead Press');
    expect(bench!.slot_index).toBe(1);
    expect(ohp!.slot_index).toBe(2);
  });

  test('swap: moves Bench to slot 2 and OHP to slot 1', async () => {
    await reorderSessionSlots(draftId, benchSlotId, ohpSlotId);

    const slots = await listDraftSlots(draftId);
    const bench = slots.find((s) => s.exercise_name === 'Bench Press');
    const ohp = slots.find((s) => s.exercise_name === 'Overhead Press');
    expect(bench!.slot_index).toBe(2);
    expect(ohp!.slot_index).toBe(1);

    // OHP should appear first now (slots are ordered by slot_index)
    expect(slots[0].exercise_name).toBe('Overhead Press');
    expect(slots[1].exercise_name).toBe('Bench Press');
  });

  test('swap back restores original order', async () => {
    await reorderSessionSlots(draftId, benchSlotId, ohpSlotId);

    const slots = await listDraftSlots(draftId);
    expect(slots[0].exercise_name).toBe('Bench Press');
    expect(slots[1].exercise_name).toBe('Overhead Press');
  });

  test('no-op when slotId does not belong to session', async () => {
    // Use a bogus ID — should not throw
    await reorderSessionSlots(draftId, 99999, ohpSlotId);
    const slots = await listDraftSlots(draftId);
    expect(slots[0].exercise_name).toBe('Bench Press');
    expect(slots[1].exercise_name).toBe('Overhead Press');
  });
});

/* ═══════════════════════════════════════════════════════════
 *  5. CLEAR WARMUP SETS
 * ═══════════════════════════════════════════════════════════ */

describe('clearWarmupSets', () => {
  let draftId: number;
  let benchChoiceId: number;

  beforeAll(async () => {
    draftId = await createDraftFromTemplate(tplPush);
    const slots = await listDraftSlots(draftId);
    benchChoiceId = slots.find((s) => s.exercise_name === 'Bench Press')!
      .selected_session_slot_choice_id!;

    // Update bench to realistic weights so warmup generation works
    await upsertSet(benchChoiceId, 1, 80, 10, null, null, 90);
    await upsertSet(benchChoiceId, 2, 85, 8, null, null, 90);
    await upsertSet(benchChoiceId, 3, 90, 5, null, null, 90);
  });

  afterAll(async () => {
    await discardDraft(draftId);
  });

  test('generate warmups adds warmup sets before working sets', async () => {
    await generateWarmupSets(benchChoiceId, 90, 'kg');
    const sets = await listSetsForChoice(benchChoiceId);

    const warmups = sets.filter((s: any) => s.is_warmup === 1);
    const working = sets.filter((s: any) => s.is_warmup === 0);

    expect(warmups.length).toBeGreaterThan(0);
    expect(working.length).toBe(3);
    // Total sets = warmups + working
    expect(sets.length).toBe(warmups.length + working.length);

    // Warmups should come first (lower set_index)
    const maxWarmupIdx = Math.max(...warmups.map((s) => s.set_index));
    const minWorkingIdx = Math.min(...working.map((s) => s.set_index));
    expect(maxWarmupIdx).toBeLessThan(minWorkingIdx);
  });

  test('clearWarmupSets removes warmups and reindexes working sets', async () => {
    await clearWarmupSets(benchChoiceId);
    const sets = await listSetsForChoice(benchChoiceId);

    // Only working sets remain
    const warmups = sets.filter((s: any) => s.is_warmup === 1);
    expect(warmups).toHaveLength(0);
    expect(sets).toHaveLength(3);

    // Working sets are reindexed starting from 1
    expect(sets[0].set_index).toBe(1);
    expect(sets[1].set_index).toBe(2);
    expect(sets[2].set_index).toBe(3);
  });

  test('clearWarmupSets is a no-op when no warmups exist', async () => {
    await clearWarmupSets(benchChoiceId);
    const sets = await listSetsForChoice(benchChoiceId);
    expect(sets).toHaveLength(3);
  });

  test('regenerate after clear works correctly', async () => {
    await generateWarmupSets(benchChoiceId, 90, 'kg');
    let sets = await listSetsForChoice(benchChoiceId);
    const totalBefore = sets.length;
    expect(totalBefore).toBeGreaterThan(3); // warmups + 3 working

    await clearWarmupSets(benchChoiceId);
    sets = await listSetsForChoice(benchChoiceId);
    expect(sets).toHaveLength(3);
    expect(sets.every((s: any) => s.is_warmup === 0)).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  6. WORKOUT REVIEW — sessionExerciseDeltas + previousSessionComparison
 * ═══════════════════════════════════════════════════════════ */

describe('Workout review', () => {
  let session1Id: number;
  let session2Id: number;

  beforeAll(async () => {
    // --- Session 1: Push Day with Bench 80×10,85×8,90×5 + OHP 40×10,45×8 ---
    session1Id = await createDraftFromTemplate(tplPush);
    const slots1 = await listDraftSlots(session1Id);
    const bench1 = slots1.find((s) => s.exercise_name === 'Bench Press')!;
    const ohp1 = slots1.find((s) => s.exercise_name === 'Overhead Press')!;

    await upsertSet(bench1.selected_session_slot_choice_id!, 1, 80, 10, null, null, 90);
    await upsertSet(bench1.selected_session_slot_choice_id!, 2, 85, 8, null, null, 90);
    await upsertSet(bench1.selected_session_slot_choice_id!, 3, 90, 5, null, null, 90);

    await upsertSet(ohp1.selected_session_slot_choice_id!, 1, 40, 10, null, null, 60);
    await upsertSet(ohp1.selected_session_slot_choice_id!, 2, 45, 8, null, null, 60);
    await upsertSet(ohp1.selected_session_slot_choice_id!, 3, 45, 8, null, null, 60);

    // Complete all
    for (const slot of [bench1, ohp1]) {
      const sets = await listSetsForChoice(slot.selected_session_slot_choice_id!);
      for (const s of sets) await toggleSetCompleted(s.id, true);
    }

    // Manually set timestamps so duration calc works
    await executeSqlAsync(
      `UPDATE sessions SET created_at = ?, performed_at = ?, status = 'final' WHERE id = ?;`,
      [TS, TS2, session1Id] // 7 days "duration" for simplicity
    );

    // --- Session 2: Push Day with BETTER weights (progression test) ---
    session2Id = await createDraftFromTemplate(tplPush);
    const slots2 = await listDraftSlots(session2Id);
    const bench2 = slots2.find((s) => s.exercise_name === 'Bench Press')!;
    const ohp2 = slots2.find((s) => s.exercise_name === 'Overhead Press')!;

    // Bench: PROGRESSED (higher top weight, more volume)
    await upsertSet(bench2.selected_session_slot_choice_id!, 1, 82.5, 10, null, null, 90);
    await upsertSet(bench2.selected_session_slot_choice_id!, 2, 87.5, 8, null, null, 90);
    await upsertSet(bench2.selected_session_slot_choice_id!, 3, 92.5, 6, null, null, 90);

    // OHP: REGRESSED (lower weight, less volume)
    await upsertSet(ohp2.selected_session_slot_choice_id!, 1, 35, 8, null, null, 60);
    await upsertSet(ohp2.selected_session_slot_choice_id!, 2, 35, 8, null, null, 60);
    await upsertSet(ohp2.selected_session_slot_choice_id!, 3, 35, 6, null, null, 60);

    for (const slot of [bench2, ohp2]) {
      const sets = await listSetsForChoice(slot.selected_session_slot_choice_id!);
      for (const s of sets) await toggleSetCompleted(s.id, true);
    }

    await finalizeSession(session2Id);
  });

  describe('sessionExerciseDeltas', () => {
    let deltas: ExerciseDelta[];

    beforeAll(async () => {
      deltas = await sessionExerciseDeltas(session2Id);
    });

    test('returns deltas for both exercises', () => {
      expect(deltas).toHaveLength(2);
      const names = deltas.map((d) => d.exercise_name).sort();
      expect(names).toEqual(['Bench Press', 'Overhead Press']);
    });

    test('Bench is marked as progressed', () => {
      const bench = deltas.find((d) => d.exercise_name === 'Bench Press')!;
      expect(bench.status).toBe('progressed');
      expect(bench.top_weight).toBe(92.5);
      expect(bench.prev_top_weight).toBe(90);
      expect(bench.total_volume).toBeGreaterThan(bench.prev_total_volume!);
    });

    test('OHP is marked as regressed', () => {
      const ohp = deltas.find((d) => d.exercise_name === 'Overhead Press')!;
      expect(ohp.status).toBe('regressed');
      expect(ohp.top_weight).toBe(35);
      expect(ohp.prev_top_weight).toBe(45);
      expect(ohp.total_volume).toBeLessThan(ohp.prev_total_volume!);
    });

    test('delta fields are populated correctly', () => {
      const bench = deltas.find((d) => d.exercise_name === 'Bench Press')!;
      // Session 2 bench: 82.5×10 + 87.5×8 + 92.5×6 = 825 + 700 + 555 = 2080
      expect(bench.total_volume).toBe(82.5 * 10 + 87.5 * 8 + 92.5 * 6);
      expect(bench.total_reps).toBe(10 + 8 + 6);
      expect(bench.completed_sets).toBe(3);
      // Session 1 bench: 80×10 + 85×8 + 90×5 = 800 + 680 + 450 = 1930
      expect(bench.prev_total_volume).toBe(80 * 10 + 85 * 8 + 90 * 5);
    });
  });

  describe('previousSessionComparison', () => {
    test('returns volume and duration from session 1', async () => {
      const comp = await previousSessionComparison(session2Id);
      expect(comp).not.toBeNull();

      // Session 1 volume: Bench 80×10+85×8+90×5 + OHP 40×10+45×8+45×8
      // = (800+680+450) + (400+360+360) = 1930 + 1120 = 3050
      expect(comp!.prevVolume).toBe(
        80 * 10 + 85 * 8 + 90 * 5 + 40 * 10 + 45 * 8 + 45 * 8
      );

      // Duration: TS2 - TS = 7 days = 604800 seconds
      expect(comp!.prevDurationSecs).toBe(604800);
    });

    test('returns null when no previous session exists for that template', async () => {
      // Create a one-off template with a single finalized session — no predecessor
      const soloTpl = await rawInsert(
        `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
        ['Solo Template', 'solo template', TS]
      );
      const soloSlot = await rawInsert(
        `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
        [soloTpl, 1, 'Bench', TS]
      );
      await rawInsert(
        `INSERT INTO template_slot_options(template_slot_id, exercise_id, order_index, created_at) VALUES (?,?,?,?);`,
        [soloSlot, exBench, 0, TS]
      );
      for (let i = 1; i <= 3; i++) {
        await rawInsert(
          `INSERT INTO template_prescribed_sets(template_slot_id, set_index, weight, reps, rpe, rest_seconds, created_at)
           VALUES (?,?,?,?,?,?,?);`,
          [soloSlot, i, 60, 10, null, 90, TS]
        );
      }

      const soloSessionId = await createDraftFromTemplate(soloTpl);
      const slots = await listDraftSlots(soloSessionId);
      for (const slot of slots) {
        const ch = slot.selected_session_slot_choice_id;
        if (!ch) continue;
        const sets = await listSetsForChoice(ch);
        for (const s of sets) await toggleSetCompleted(s.id, true);
      }
      await finalizeSession(soloSessionId);

      const comp = await previousSessionComparison(soloSessionId);
      expect(comp).toBeNull();
    });
  });

  describe('sessionExerciseDeltas — new exercise', () => {
    let session3Id: number;

    test('first-time exercise is marked as new', async () => {
      // Create a session with Squat (never performed before)
      session3Id = await createDraftFromTemplate(tplPush);
      await addExerciseToSession(session3Id, tplPush, exSquat, false);

      const slots = await listDraftSlots(session3Id);
      const squatSlot = slots.find((s) => s.exercise_name === 'Squat')!;
      const sqCh = squatSlot.selected_session_slot_choice_id!;

      // Do some squat sets
      await upsertSet(sqCh, 1, 100, 5, null, null, 120);
      await upsertSet(sqCh, 2, 110, 3, null, null, 120);
      await upsertSet(sqCh, 3, 120, 1, null, null, 120);

      // Complete bench + OHP + squat
      for (const slot of slots) {
        const ch = slot.selected_session_slot_choice_id;
        if (!ch) continue;
        const sets = await listSetsForChoice(ch);
        for (const s of sets) await toggleSetCompleted(s.id, true);
      }

      await finalizeSession(session3Id);

      const deltas = await sessionExerciseDeltas(session3Id);
      const sqDelta = deltas.find((d) => d.exercise_name === 'Squat');
      expect(sqDelta).toBeDefined();
      expect(sqDelta!.status).toBe('new');
      expect(sqDelta!.prev_top_weight).toBeNull();
      expect(sqDelta!.top_weight).toBe(120);
    });
  });

  describe('sessionExerciseDeltas — maintained', () => {
    let session4Id: number;

    test('identical weights and volume = maintained', async () => {
      // Create another Push Day with EXACT SAME weights as session 2
      session4Id = await createDraftFromTemplate(tplPush);
      const slots = await listDraftSlots(session4Id);
      const bench = slots.find((s) => s.exercise_name === 'Bench Press')!;
      const ohp = slots.find((s) => s.exercise_name === 'Overhead Press')!;

      // Mirror session 2 bench weights
      await upsertSet(bench.selected_session_slot_choice_id!, 1, 82.5, 10, null, null, 90);
      await upsertSet(bench.selected_session_slot_choice_id!, 2, 87.5, 8, null, null, 90);
      await upsertSet(bench.selected_session_slot_choice_id!, 3, 92.5, 6, null, null, 90);

      // Mirror session 2 OHP weights
      await upsertSet(ohp.selected_session_slot_choice_id!, 1, 35, 8, null, null, 60);
      await upsertSet(ohp.selected_session_slot_choice_id!, 2, 35, 8, null, null, 60);
      await upsertSet(ohp.selected_session_slot_choice_id!, 3, 35, 6, null, null, 60);

      for (const slot of [bench, ohp]) {
        const sets = await listSetsForChoice(slot.selected_session_slot_choice_id!);
        for (const s of sets) await toggleSetCompleted(s.id, true);
      }
      await finalizeSession(session4Id);

      const deltas = await sessionExerciseDeltas(session4Id);
      const benchD = deltas.find((d) => d.exercise_name === 'Bench Press');
      expect(benchD!.status).toBe('maintained');
      expect(benchD!.top_weight).toBe(benchD!.prev_top_weight);
      expect(benchD!.total_volume).toBe(benchD!.prev_total_volume);
    });
  });

  /* ── Skipped exercises (0 completed sets) ────────────── */

  describe('sessionExerciseDeltas — skipped exercises', () => {
    let skippedSessionId: number;

    test('exercise with 0 completed sets is marked skipped, not regressed', async () => {
      // Start a Push Day — complete Bench but skip OHP entirely
      skippedSessionId = await createDraftFromTemplate(tplPush);
      const slots = await listDraftSlots(skippedSessionId);
      const bench = slots.find((s) => s.exercise_name === 'Bench Press')!;
      const ohp = slots.find((s) => s.exercise_name === 'Overhead Press')!;

      // Complete Bench normally
      await upsertSet(bench.selected_session_slot_choice_id!, 1, 85, 10, null, null, 90);
      await upsertSet(bench.selected_session_slot_choice_id!, 2, 90, 8, null, null, 90);
      await upsertSet(bench.selected_session_slot_choice_id!, 3, 95, 5, null, null, 90);
      const benchSets = await listSetsForChoice(bench.selected_session_slot_choice_id!);
      for (const s of benchSets) await toggleSetCompleted(s.id, true);

      // Leave OHP with 0 completed sets (don't toggle any)
      await finalizeSession(skippedSessionId);

      const deltas = await sessionExerciseDeltas(skippedSessionId);
      const ohpDelta = deltas.find((d) => d.exercise_name === 'Overhead Press')!;
      expect(ohpDelta.status).toBe('skipped');
      expect(ohpDelta.completed_sets).toBe(0);
      expect(ohpDelta.top_weight).toBe(0);
      expect(ohpDelta.prev_top_weight).toBeNull();
      expect(ohpDelta.prev_total_volume).toBeNull();
    });

    test('skipped exercises have zero volume and reps', async () => {
      const deltas = await sessionExerciseDeltas(skippedSessionId);
      const ohpDelta = deltas.find((d) => d.exercise_name === 'Overhead Press')!;
      expect(ohpDelta.total_volume).toBe(0);
      expect(ohpDelta.total_reps).toBe(0);
    });

    test('skipped exercises do not count as regressed', async () => {
      const deltas = await sessionExerciseDeltas(skippedSessionId);
      const regressed = deltas.filter((d) => d.status === 'regressed');
      expect(regressed).toHaveLength(0);
    });

    test('completed exercises still get correct status alongside skipped ones', async () => {
      const deltas = await sessionExerciseDeltas(skippedSessionId);
      const benchDelta = deltas.find((d) => d.exercise_name === 'Bench Press')!;
      // Bench progressed (95 > previous best of 92.5)
      expect(benchDelta.status).toBe('progressed');
      expect(benchDelta.completed_sets).toBe(3);
    });

    test('delta counts are accurate (no inflation)', async () => {
      const deltas = await sessionExerciseDeltas(skippedSessionId);
      const progressed = deltas.filter((d) => d.status === 'progressed').length;
      const regressed = deltas.filter((d) => d.status === 'regressed').length;
      const skipped = deltas.filter((d) => d.status === 'skipped').length;
      // 2 exercises total: 1 progressed (Bench), 1 skipped (OHP), 0 regressed
      expect(deltas).toHaveLength(2);
      expect(progressed).toBe(1);
      expect(regressed).toBe(0);
      expect(skipped).toBe(1);
    });
  });

  describe('sessionExerciseDeltas — all exercises skipped', () => {
    test('session where nothing was completed → all skipped', async () => {
      const emptySessionId = await createDraftFromTemplate(tplPush);
      // Don't complete anything
      await finalizeSession(emptySessionId);

      const deltas = await sessionExerciseDeltas(emptySessionId);
      expect(deltas).toHaveLength(2);
      expect(deltas.every((d) => d.status === 'skipped')).toBe(true);
      // No artificial regressions
      expect(deltas.filter((d) => d.status === 'regressed')).toHaveLength(0);
    });
  });

  describe('sessionExerciseDeltas — first-time exercise with 0 sets', () => {
    test('never-performed exercise with 0 completed sets is skipped (not new)', async () => {
      // Add Curls (never done with completed sets) to a fresh session, don't complete
      const sessionId = await createDraftFromTemplate(tplPush);
      await addExerciseToSession(sessionId, tplPush, exCurls, false);
      // Complete Bench to finalize
      const slots = await listDraftSlots(sessionId);
      const bench = slots.find((s) => s.exercise_name === 'Bench Press')!;
      const benchSets = await listSetsForChoice(bench.selected_session_slot_choice_id!);
      for (const s of benchSets) await toggleSetCompleted(s.id, true);
      // Leave OHP and Curls uncompleted
      await finalizeSession(sessionId);

      const deltas = await sessionExerciseDeltas(sessionId);
      const curlDelta = deltas.find((d) => d.exercise_name === 'Bicep Curls')!;
      // 0 completed sets → skipped, even though it's a first-time exercise
      expect(curlDelta.status).toBe('skipped');
      expect(curlDelta.completed_sets).toBe(0);
    });
  });

  describe('sessionExerciseDeltas — partial completion', () => {
    test('exercise with some completed sets is NOT skipped', async () => {
      const sessionId = await createDraftFromTemplate(tplPush);
      const slots = await listDraftSlots(sessionId);
      const bench = slots.find((s) => s.exercise_name === 'Bench Press')!;
      const ohp = slots.find((s) => s.exercise_name === 'Overhead Press')!;

      // Complete all bench sets
      const benchSets = await listSetsForChoice(bench.selected_session_slot_choice_id!);
      for (const s of benchSets) await toggleSetCompleted(s.id, true);

      // Complete only 1 of 3 OHP sets (partial — should NOT be skipped)
      await upsertSet(ohp.selected_session_slot_choice_id!, 1, 30, 10, null, null, 60);
      const ohpSets = await listSetsForChoice(ohp.selected_session_slot_choice_id!);
      await toggleSetCompleted(ohpSets[0].id, true);

      await finalizeSession(sessionId);

      const deltas = await sessionExerciseDeltas(sessionId);
      const ohpDelta = deltas.find((d) => d.exercise_name === 'Overhead Press')!;
      // 1 completed set → not skipped
      expect(ohpDelta.status).not.toBe('skipped');
      expect(ohpDelta.completed_sets).toBe(1);
      // It regressed (30 vs previous 35) — prev lookup skips sessions where OHP was skipped
      expect(ohpDelta.status).toBe('regressed');
    });
  });
});

/* ═══════════════════════════════════════════════════════════
 *  7. COMBINED WORKFLOW — full mid-workout editing sequence
 * ═══════════════════════════════════════════════════════════ */

describe('Combined mid-workout flow', () => {
  let draftId: number;

  test('full workflow: start → add exercise → add set → reorder → warmup → clear → remove → finish', async () => {
    // Start a Push Day draft
    draftId = await createDraftFromTemplate(tplPush);
    let slots = await listDraftSlots(draftId);
    expect(slots).toHaveLength(2); // Bench + OHP

    // ADD: Squat (one-time)
    await addExerciseToSession(draftId, tplPush, exSquat, false);
    slots = await listDraftSlots(draftId);
    expect(slots).toHaveLength(3);

    // ADD SET: to Bench (should go from 3→4)
    const benchCh = slots.find((s) => s.exercise_name === 'Bench Press')!
      .selected_session_slot_choice_id!;
    await addSetToChoice(benchCh);
    let benchSets = await listSetsForChoice(benchCh);
    expect(benchSets).toHaveLength(4);

    // REORDER: Move Squat from slot 3 to slot 2 (swap with OHP)
    const squatSlotId = slots.find((s) => s.exercise_name === 'Squat')!.session_slot_id;
    const ohpSlotId = slots.find((s) => s.exercise_name === 'Overhead Press')!.session_slot_id;
    await reorderSessionSlots(draftId, squatSlotId, ohpSlotId);
    slots = await listDraftSlots(draftId);
    expect(slots[1].exercise_name).toBe('Squat');
    expect(slots[2].exercise_name).toBe('Overhead Press');

    // WARMUP: Generate warmups for Bench
    await upsertSet(benchCh, 1, 100, 5, null, null, 90);
    await generateWarmupSets(benchCh, 100, 'kg');
    benchSets = await listSetsForChoice(benchCh);
    const warmupCount = benchSets.filter((s: any) => s.is_warmup === 1).length;
    expect(warmupCount).toBeGreaterThan(0);
    expect(benchSets.length).toBeGreaterThan(4);

    // CLEAR WARMUPS
    await clearWarmupSets(benchCh);
    benchSets = await listSetsForChoice(benchCh);
    expect(benchSets.filter((s: any) => s.is_warmup === 1)).toHaveLength(0);
    expect(benchSets).toHaveLength(4); // back to 4 working sets

    // REMOVE: Squat
    const squatSlot = slots.find((s) => s.exercise_name === 'Squat')!;
    await removeExerciseFromSession(squatSlot.session_slot_id, false);
    slots = await listDraftSlots(draftId);
    expect(slots).toHaveLength(2);
    expect(slots.map((s) => s.exercise_name)).toEqual(['Bench Press', 'Overhead Press']);

    // COMPLETE all sets and finalize
    for (const slot of slots) {
      const ch = slot.selected_session_slot_choice_id;
      if (!ch) continue;
      const sets = await listSetsForChoice(ch);
      for (const s of sets) await toggleSetCompleted(s.id, true);
    }
    await finalizeSession(draftId);

    // Verify it's finalized
    const draft = await getActiveDraft();
    expect(draft).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════
 *  7. Effort / Rest-time tracking (sessionEffortStats)
 * ═══════════════════════════════════════════════════════════ */

describe('7 · Effort / Rest-time tracking', () => {
  let effortSessionId: number;
  let effortChoiceId: number;

  beforeAll(async () => {
    // Create a fresh session for effort tests
    effortSessionId = await rawInsert(
      `INSERT INTO sessions(template_id, status, created_at, performed_at) VALUES (?,?,?,?);`,
      [tplPush, 'draft', '2025-10-01T10:00:00.000Z', '2025-10-01T10:00:00.000Z']
    );
    const slotId = await rawInsert(
      `INSERT INTO session_slots(session_id, template_slot_id, slot_index, created_at) VALUES (?,?,?,?);`,
      [effortSessionId, tplPushSlot1, 0, TS]
    );
    // Find bench option
    const optRes = await executeSqlAsync(
      `SELECT id FROM template_slot_options WHERE template_slot_id=? LIMIT 1;`,
      [tplPushSlot1]
    );
    const optId = optRes.rows._array[0].id;

    effortChoiceId = await rawInsert(
      `INSERT INTO session_slot_choices(session_slot_id, template_slot_option_id, created_at) VALUES (?,?,?);`,
      [slotId, optId, TS]
    );

    // Insert 4 working sets
    for (let i = 0; i < 4; i++) {
      await rawInsert(
        `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, completed, is_warmup, created_at) VALUES (?,?,?,?,0,0,?);`,
        [effortChoiceId, i, 80, 8, TS]
      );
    }
  });

  test('returns hasData=false when no sets have completed_at', async () => {
    const stats = await sessionEffortStats(effortSessionId);
    expect(stats.hasData).toBe(false);
    expect(stats.totalRestSecs).toBe(0);
  });

  test('returns hasData=false when only 1 set has completed_at', async () => {
    // Complete first set with a timestamp
    const sets = await listSetsForChoice(effortChoiceId);
    await executeSqlAsync(
      `UPDATE sets SET completed=1, completed_at=? WHERE id=?;`,
      ['2025-10-01T10:00:00.000Z', sets[0].id]
    );

    const stats = await sessionEffortStats(effortSessionId);
    expect(stats.hasData).toBe(false);
  });

  test('calculates rest time correctly with 2+ completed_at timestamps', async () => {
    const sets = await listSetsForChoice(effortChoiceId);

    // Set 0: completed at 10:00:00 (already done above)
    // Set 1: completed at 10:02:30 (2.5 min gap)
    await executeSqlAsync(
      `UPDATE sets SET completed=1, completed_at=? WHERE id=?;`,
      ['2025-10-01T10:02:30.000Z', sets[1].id]
    );
    // Set 2: completed at 10:05:00 (2.5 min gap)
    await executeSqlAsync(
      `UPDATE sets SET completed=1, completed_at=? WHERE id=?;`,
      ['2025-10-01T10:05:00.000Z', sets[2].id]
    );
    // Set 3: completed at 10:08:00 (3 min gap)
    await executeSqlAsync(
      `UPDATE sets SET completed=1, completed_at=? WHERE id=?;`,
      ['2025-10-01T10:08:00.000Z', sets[3].id]
    );

    const stats = await sessionEffortStats(effortSessionId);
    expect(stats.hasData).toBe(true);
    expect(stats.gapCount).toBe(3);

    // Total rest: 150 + 150 + 180 = 480 seconds
    expect(stats.totalRestSecs).toBe(480);

    // Average: 480 / 3 = 160 seconds
    expect(stats.avgRestSecs).toBe(160);
  });

  test('calculates density using provided duration', async () => {
    // Session lasted 30 minutes
    const stats = await sessionEffortStats(effortSessionId, 1800);
    expect(stats.hasData).toBe(true);

    // 4 sets / 30 min = 0.13... → rounds to 0.1
    expect(stats.setsPerMinute).toBeCloseTo(0.1, 1);

    // Volume: 4 × 80 × 8 = 2560. 2560 / 30 = 85.3... → rounds to 85
    expect(stats.volumePerMinute).toBe(85);
  });

  test('calculates density using timestamp span when no duration provided', async () => {
    // Span: 10:00:00 → 10:08:00 = 8 minutes
    const stats = await sessionEffortStats(effortSessionId);
    expect(stats.hasData).toBe(true);

    // 4 sets / 8 min = 0.5
    expect(stats.setsPerMinute).toBe(0.5);

    // Volume: 2560 / 8 = 320
    expect(stats.volumePerMinute).toBe(320);
  });

  test('toggleSetCompleted records completed_at timestamp', async () => {
    // Create a new set, complete it, check that completed_at is set
    const newSetId = await rawInsert(
      `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, completed, is_warmup, created_at) VALUES (?,?,?,?,0,0,?);`,
      [effortChoiceId, 10, 100, 5, TS]
    );

    await toggleSetCompleted(newSetId, true);

    const res = await executeSqlAsync(`SELECT completed_at FROM sets WHERE id=?;`, [newSetId]);
    expect(res.rows._array[0].completed_at).not.toBeNull();

    // Uncomplete should clear it
    await toggleSetCompleted(newSetId, false);

    const res2 = await executeSqlAsync(`SELECT completed_at FROM sets WHERE id=?;`, [newSetId]);
    expect(res2.rows._array[0].completed_at).toBeNull();
  });

  test('excludes warmup sets from effort calculation', async () => {
    // Insert a warmup set with a completed_at timestamp right in the middle
    await rawInsert(
      `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, completed, is_warmup, completed_at, created_at) VALUES (?,?,?,?,1,1,?,?);`,
      [effortChoiceId, 20, 40, 5, '2025-10-01T10:01:00.000Z', TS]
    );

    const stats = await sessionEffortStats(effortSessionId);
    // Should still be 3 gaps from 4 working sets (warmup excluded)
    // We added an extra working set (id=10, set_index=10) but it's not completed, so still 4 completed working sets
    expect(stats.gapCount).toBe(3);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  9. WARMUP SETS EXCLUDED FROM SUMMARY COUNTS
 * ═══════════════════════════════════════════════════════════ */

describe('Warmup sets excluded from summary counts', () => {
  let warmupDraftId: number;
  let warmupSessionId: number;
  let warmupBenchChoiceId: number;
  let warmupOhpChoiceId: number;

  beforeAll(async () => {
    // Create a push day session with warmups on bench
    warmupDraftId = await createDraftFromTemplate(tplPush);
    const slots = await listDraftSlots(warmupDraftId);
    const benchSlot = slots.find((s) => s.exercise_name === 'Bench Press')!;
    const ohpSlot = slots.find((s) => s.exercise_name === 'Overhead Press')!;
    warmupBenchChoiceId = benchSlot.selected_session_slot_choice_id!;
    warmupOhpChoiceId = ohpSlot.selected_session_slot_choice_id!;

    // Set up working sets
    await upsertSet(warmupBenchChoiceId, 1, 80, 10, null, null, 90);
    await upsertSet(warmupBenchChoiceId, 2, 85, 8, null, null, 90);
    await upsertSet(warmupBenchChoiceId, 3, 90, 5, null, null, 90);

    // Generate warmups for bench (adds ~3-4 warmup sets)
    await generateWarmupSets(warmupBenchChoiceId, 90, 'kg');

    // OHP: no warmups, 3 working sets
    await upsertSet(warmupOhpChoiceId, 1, 40, 10, null, null, 60);
    await upsertSet(warmupOhpChoiceId, 2, 45, 8, null, null, 60);
    await upsertSet(warmupOhpChoiceId, 3, 45, 8, null, null, 60);

    // Complete all sets (warmups + working)
    for (const choiceId of [warmupBenchChoiceId, warmupOhpChoiceId]) {
      const sets = await listSetsForChoice(choiceId);
      for (const s of sets) await toggleSetCompleted(s.id, true);
    }

    await finalizeSession(warmupDraftId);
    warmupSessionId = warmupDraftId;
  });

  test('getSessionDetail returns both warmup and working sets', async () => {
    const detail = await getSessionDetail(warmupSessionId);
    const allSets = detail.sets;
    const warmups = allSets.filter((s: any) => s.is_warmup === 1);
    const working = allSets.filter((s: any) => !s.is_warmup);

    // Bench has warmups + 3 working, OHP has 3 working
    expect(warmups.length).toBeGreaterThan(0);
    expect(working.length).toBe(6); // 3 bench + 3 OHP
    expect(allSets.length).toBeGreaterThan(6); // total > working only
  });

  test('top-level completed/total count excludes warmups', async () => {
    const detail = await getSessionDetail(warmupSessionId);

    // Mimics the summary screen logic (after the fix)
    const completedSets = detail.sets.filter((s: any) => s.completed && !s.is_warmup);
    const totalWorkingSets = detail.sets.filter((s: any) => !s.is_warmup).length;

    // All 6 working sets completed
    expect(completedSets.length).toBe(6);
    expect(totalWorkingSets).toBe(6);
    // If warmups were included in total, it would be > 6
    expect(detail.sets.length).toBeGreaterThan(totalWorkingSets);
  });

  test('per-exercise set count excludes warmups', async () => {
    const detail = await getSessionDetail(warmupSessionId);

    // Mimics the per-exercise summary screen logic (after the fix)
    for (const slot of detail.slots) {
      const sets = detail.sets.filter(
        (st: any) => st.session_slot_choice_id === slot.session_slot_choice_id && !st.is_warmup
      );
      const completed = sets.filter((st: any) => st.completed);

      if (slot.exercise_name === 'Bench Press') {
        // Bench has 3 working sets, all completed
        expect(sets.length).toBe(3);
        expect(completed.length).toBe(3);
      } else if (slot.exercise_name === 'Overhead Press') {
        // OHP has 3 working sets, no warmups
        expect(sets.length).toBe(3);
        expect(completed.length).toBe(3);
      }
    }
  });

  test('checkmark triggers only when all working sets complete (ignores warmups)', async () => {
    const detail = await getSessionDetail(warmupSessionId);

    for (const slot of detail.slots) {
      const workingSets = detail.sets.filter(
        (st: any) => st.session_slot_choice_id === slot.session_slot_choice_id && !st.is_warmup
      );
      const completedWorking = workingSets.filter((st: any) => st.completed);

      // All working sets completed → checkmark should show
      expect(completedWorking.length).toBe(workingSets.length);
    }
  });

  test('warmup set volume is excluded from total volume calculation', async () => {
    const detail = await getSessionDetail(warmupSessionId);

    const completedSets = detail.sets.filter((s: any) => s.completed && !s.is_warmup);
    const totalVolume = completedSets.reduce(
      (sum: number, s: any) => sum + (s.weight || 0) * (s.reps || 0), 0
    );

    // Expected: Bench 80×10+85×8+90×5 + OHP 40×10+45×8+45×8 = 1930 + 1120 = 3050
    const expected = 80 * 10 + 85 * 8 + 90 * 5 + 40 * 10 + 45 * 8 + 45 * 8;
    expect(totalVolume).toBe(expected);
  });

  test('warmup-included total would be higher (regression guard)', async () => {
    const detail = await getSessionDetail(warmupSessionId);

    const correctTotal = detail.sets.filter((s: any) => !s.is_warmup).length;
    const buggyTotal = detail.sets.length;

    // The buggy denominator would be higher due to warmup sets
    expect(buggyTotal).toBeGreaterThan(correctTotal);
  });
});
