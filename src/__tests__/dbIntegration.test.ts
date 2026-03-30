/**
 * DB Integration Tests — runs the REAL repository functions against an
 * in-memory SQLite instance (better-sqlite3) to verify queries, joins,
 * GROUP_CONCAT, cascading deletes, PR detection, streak logic, etc.
 *
 * Strategy:
 *   1. Mock `expo-sqlite` so `openDatabaseSync` returns a better-sqlite3
 *      wrapper that exposes `getAllAsync`, `runAsync`, `execSync`, and
 *      `withTransactionAsync` matching the expo-sqlite API surface.
 *   2. Re-import DB modules (`db.ts`, repositories) — they call
 *      `openDatabaseSync(...)` at module scope, so the mock MUST be
 *      registered before any import of db.ts.
 *   3. Seed a minimal but realistic data set and test every public
 *      repository function.
 */

import Database from 'better-sqlite3';

/* ═══════════════════════════════════════════════════════════
 *  Mock expo-sqlite before importing any app code
 * ═══════════════════════════════════════════════════════════ */

let memDb: Database.Database;

/**
 * Thin wrapper that speaks the same async API that db.ts expects
 * from `openDatabaseSync`.
 */
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
 *  Now import the real app modules (they will use the mock)
 * ═══════════════════════════════════════════════════════════ */

import { executeSqlAsync, lastInsertRowId } from '../db/db';
import { migrations } from '../db/migrations';

import {
  createDraftFromTemplate,
  getActiveDraft,
  listDraftSlots,
  listSlotOptions,
  selectSlotChoice,
  discardDraft,
  finalizeSession,
  listHistory,
  getSessionDetail,
} from '../db/repositories/sessionsRepo';

import {
  listSetsForChoice,
  upsertSet,
  deleteSet,
  toggleSetCompleted,
  lastTimeForOption,
  lastTimeForExercise,
  addDropSegment,
  updateDropSegment,
  deleteDropSegment,
  generateWarmupSets,
} from '../db/repositories/setsRepo';

import {
  listExercises,
  createExercise,
  deleteExercise,
  createExerciseOption,
  getExerciseGuide,
  getExerciseStats,
} from '../db/repositories/exercisesRepo';

import {
  listTemplates,
  getTemplate,
  createTemplate,
  addSlot,
  addTemplateSlotOption,
  deleteTemplate,
  upsertPrescribedSet,
  listPrescribedSets,
} from '../db/repositories/templatesRepo';

import {
  overallStats,
  weeklyVolumeByMuscle,
  workoutDaysMap,
  currentStreak,
  prCountsBySession,
  detectAndRecordPRs,
  getSessionPRs,
  e1rmHistory,
  perTemplateStats,
} from '../db/repositories/statsRepo';

import {
  logBodyWeight,
  listBodyWeights,
  bodyWeightTrend,
  latestBodyWeight,
  deleteBodyWeight,
} from '../db/repositories/bodyWeightRepo';

import {
  listSchedulesForTemplate,
  listAllEnabledSchedules,
  upsertSchedule,
  deleteSchedule,
  deleteAllSchedulesForTemplate,
  toggleScheduleEnabled,
  dayName,
} from '../db/repositories/scheduleRepo';

import {
  addInjury,
  resolveInjury,
  listActiveInjuries,
} from '../db/repositories/injuryRepo';

/* ═══════════════════════════════════════════════════════════
 *  Helpers
 * ═══════════════════════════════════════════════════════════ */

/** Direct SQL helper for seeding (bypasses repo logic). */
async function rawInsert(sql: string, params: any[] = []) {
  return executeSqlAsync(sql, params);
}

/** Read last_insert_rowid() from better-sqlite3. */
async function lastId(): Promise<number> {
  return lastInsertRowId();
}

/* ═══════════════════════════════════════════════════════════
 *  Lifecycle
 * ═══════════════════════════════════════════════════════════ */

beforeAll(async () => {
  // Run all migrations manually (skipping seed) so we start with empty tables
  for (let i = 0; i < migrations.length; i++) {
    await executeSqlAsync(migrations[i]);
  }
});

afterAll(() => {
  if (memDb) memDb.close();
});

/* ═══════════════════════════════════════════════════════════
 *  Seed dummy data that many tests share
 *
 *  Exercises:  Bench Press (id 1001), Squat (id 1002), OHP (id 1003)
 *  Template:   "Push Day" with 2 slots (Bench, OHP)
 *  Session 1:  Finalized, 3 sets of Bench Press (100×10, 110×8, 120×5)
 *  Session 2:  Finalized, 2 sets of Squat (140×5, 150×3)
 * ═══════════════════════════════════════════════════════════ */

let exBench: number;
let exSquat: number;
let exOHP: number;
let tplPush: number;
let tplSlot1: number;
let tplSlot2: number;
let tsoId1: number;   // template_slot_option for Bench in slot 1
let tsoId2: number;   // template_slot_option for OHP in slot 2
let session1Id: number;
let session2Id: number;

/** One-time seed called in the first describe block. */
async function seedTestData() {
  const ts = '2025-06-01T10:00:00.000Z';
  const ts2 = '2025-06-02T10:00:00.000Z';

  // ─── Exercises ───
  await rawInsert(
    `INSERT INTO exercises(id, name, name_norm, primary_muscle, secondary_muscle, movement_pattern, created_at)
     VALUES (?,?,?,?,?,?,?);`,
    [1001, 'Bench Press', 'bench press', 'chest', 'triceps', 'press', ts]
  );
  await rawInsert(
    `INSERT INTO exercises(id, name, name_norm, primary_muscle, secondary_muscle, movement_pattern, created_at)
     VALUES (?,?,?,?,?,?,?);`,
    [1002, 'Squat', 'squat', 'quads', 'glutes', 'squat', ts]
  );
  await rawInsert(
    `INSERT INTO exercises(id, name, name_norm, primary_muscle, secondary_muscle, movement_pattern, created_at)
     VALUES (?,?,?,?,?,?,?);`,
    [1003, 'Overhead Press', 'overhead press', 'shoulders front', 'triceps', 'press', ts]
  );
  exBench = 1001;
  exSquat = 1002;
  exOHP   = 1003;

  // ─── Template "Push Day" ───
  await rawInsert(
    `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
    ['Push Day', 'push day', ts]
  );
  tplPush = (await lastId());

  // Slot 1: Bench Press
  await rawInsert(
    `INSERT INTO template_slots(template_id, slot_index, name, created_at)
     VALUES (?,?,?,?);`,
    [tplPush, 1, 'Bench', ts]
  );
  tplSlot1 = (await lastId());

  await rawInsert(
    `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at)
     VALUES (?,?,?,?,?);`,
    [tplSlot1, exBench, null, 0, ts]
  );
  tsoId1 = (await lastId());

  // Slot 2: OHP
  await rawInsert(
    `INSERT INTO template_slots(template_id, slot_index, name, created_at)
     VALUES (?,?,?,?);`,
    [tplPush, 2, 'OHP', ts]
  );
  tplSlot2 = (await lastId());

  await rawInsert(
    `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at)
     VALUES (?,?,?,?,?);`,
    [tplSlot2, exOHP, null, 0, ts]
  );
  tsoId2 = (await lastId());

  // Prescribed sets for slot 1 (3×10 @ 100 kg, 90s rest)
  for (let i = 1; i <= 3; i++) {
    await rawInsert(
      `INSERT INTO template_prescribed_sets(template_slot_id, set_index, weight, reps, rpe, rest_seconds, created_at)
       VALUES (?,?,?,?,?,?,?);`,
      [tplSlot1, i, 100, 10, null, 90, ts]
    );
  }

  // ─── Session 1: finalized Bench Press workout ───
  await rawInsert(
    `INSERT INTO sessions(performed_at, notes, status, template_id, created_at)
     VALUES (?,?,?,?,?);`,
    [ts, null, 'final', tplPush, ts]
  );
  session1Id = (await lastId());

  // Session slot for Bench
  await rawInsert(
    `INSERT INTO session_slots(session_id, template_slot_id, slot_index, name, created_at)
     VALUES (?,?,?,?,?);`,
    [session1Id, tplSlot1, 1, 'Bench', ts]
  );
  const ss1 = (await lastId());

  await rawInsert(
    `INSERT INTO session_slot_choices(session_slot_id, template_slot_option_id, created_at)
     VALUES (?,?,?);`,
    [ss1, tsoId1, ts]
  );
  const ssc1 = (await lastId());

  await rawInsert(
    `UPDATE session_slots SET selected_session_slot_choice_id=? WHERE id=?;`,
    [ssc1, ss1]
  );

  // 3 sets: 100×10, 110×8, 120×5 — all completed
  const benchSets = [
    [1, 100, 10, null, 90],
    [2, 110, 8, null, 90],
    [3, 120, 5, null, 90],
  ];
  for (const [idx, w, r, rpe, rest] of benchSets) {
    await rawInsert(
      `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, rest_seconds, completed, is_warmup, created_at)
       VALUES (?,?,?,?,?,?,?,?,?);`,
      [ssc1, idx, w, r, rpe, rest, 1, 0, ts]
    );
  }

  // Session slot for OHP
  await rawInsert(
    `INSERT INTO session_slots(session_id, template_slot_id, slot_index, name, created_at)
     VALUES (?,?,?,?,?);`,
    [session1Id, tplSlot2, 2, 'OHP', ts]
  );
  const ss1ohp = (await lastId());
  await rawInsert(
    `INSERT INTO session_slot_choices(session_slot_id, template_slot_option_id, created_at)
     VALUES (?,?,?);`,
    [ss1ohp, tsoId2, ts]
  );
  const ssc1ohp = (await lastId());
  await rawInsert(
    `UPDATE session_slots SET selected_session_slot_choice_id=? WHERE id=?;`,
    [ssc1ohp, ss1ohp]
  );
  // 2 completed sets for OHP
  await rawInsert(
    `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, rest_seconds, completed, is_warmup, created_at)
     VALUES (?,?,?,?,?,?,?,?,?);`,
    [ssc1ohp, 1, 60, 10, null, 60, 1, 0, ts]
  );
  await rawInsert(
    `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, rest_seconds, completed, is_warmup, created_at)
     VALUES (?,?,?,?,?,?,?,?,?);`,
    [ssc1ohp, 2, 65, 8, null, 60, 1, 0, ts]
  );

  // ─── Session 2: finalized Squat workout (separate template for variety) ───
  // We'll create a quick "Leg Day" template
  await rawInsert(
    `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
    ['Leg Day', 'leg day', ts2]
  );
  const tplLeg = (await lastId());

  await rawInsert(
    `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
    [tplLeg, 1, 'Squat', ts2]
  );
  const tplSlotSquat = (await lastId());

  await rawInsert(
    `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at)
     VALUES (?,?,?,?,?);`,
    [tplSlotSquat, exSquat, null, 0, ts2]
  );
  const tsoSquat = (await lastId());

  await rawInsert(
    `INSERT INTO sessions(performed_at, notes, status, template_id, created_at)
     VALUES (?,?,?,?,?);`,
    [ts2, 'Legs felt great', 'final', tplLeg, ts2]
  );
  session2Id = (await lastId());

  await rawInsert(
    `INSERT INTO session_slots(session_id, template_slot_id, slot_index, name, created_at)
     VALUES (?,?,?,?,?);`,
    [session2Id, tplSlotSquat, 1, 'Squat', ts2]
  );
  const ss2 = (await lastId());

  await rawInsert(
    `INSERT INTO session_slot_choices(session_slot_id, template_slot_option_id, created_at)
     VALUES (?,?,?);`,
    [ss2, tsoSquat, ts2]
  );
  const ssc2 = (await lastId());

  await rawInsert(
    `UPDATE session_slots SET selected_session_slot_choice_id=? WHERE id=?;`,
    [ssc2, ss2]
  );

  const squatSets = [
    [1, 140, 5, null, 120],
    [2, 150, 3, null, 120],
  ];
  for (const [idx, w, r, rpe, rest] of squatSets) {
    await rawInsert(
      `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, rest_seconds, completed, is_warmup, created_at)
       VALUES (?,?,?,?,?,?,?,?,?);`,
      [ssc2, idx, w, r, rpe, rest, 1, 0, ts2]
    );
  }
}

/* ═══════════════════════════════════════════════════════════
 *  TESTS
 * ═══════════════════════════════════════════════════════════ */

describe('DB Integration Tests', () => {
  // Seed once before all tests in this suite
  beforeAll(async () => {
    await seedTestData();
  });

  /* ── Exercise CRUD ──────────────────────────────────────── */

  describe('exercisesRepo', () => {
    test('listExercises returns seeded exercises sorted by name', async () => {
      const list = await listExercises();
      const names = list.map((e) => e.name);
      // Seed exercises inserted with explicit IDs — they should appear
      expect(names).toContain('Bench Press');
      expect(names).toContain('Squat');
      expect(names).toContain('Overhead Press');
      // Sorted alphabetically
      const bIdx = names.indexOf('Bench Press');
      const oIdx = names.indexOf('Overhead Press');
      const sIdx = names.indexOf('Squat');
      expect(bIdx).toBeLessThan(oIdx);
      expect(oIdx).toBeLessThan(sIdx);
    });

    test('createExercise + deleteExercise round-trip', async () => {
      await createExercise('Deadlift');
      let list = await listExercises();
      const dl = list.find((e) => e.name === 'Deadlift');
      expect(dl).toBeDefined();

      // Delete succeeds when not referenced by any template
      const deleted = await deleteExercise(dl!.id);
      expect(deleted).toBe(true);

      list = await listExercises();
      expect(list.find((e) => e.name === 'Deadlift')).toBeUndefined();
    });

    test('deleteExercise returns false when exercise is in use', async () => {
      // Bench Press is referenced by template_slot_options
      const deleted = await deleteExercise(exBench);
      expect(deleted).toBe(false);
      // Still exists
      const list = await listExercises();
      expect(list.find((e) => e.id === exBench)).toBeDefined();
    });

    test('getExerciseGuide returns nulls for exercises without guide data', async () => {
      const guide = await getExerciseGuide(exBench);
      expect(guide).toEqual({ video_url: null, instructions: null, tips: null });
    });

    test('getExerciseStats returns aggregated stats for Bench Press', async () => {
      const stats = await getExerciseStats(exBench);
      // Session 1 had sets 100×10, 110×8, 120×5
      // best_e1rm = max of weight*(1+reps/30) = max(133.3, 139.3, 140.0) = 140.0
      expect(stats.best_e1rm).toBeCloseTo(120 * (1 + 5 / 30), 1);
      // best_volume = max of w*r = max(1000, 880, 600) = 1000
      expect(stats.best_volume).toBe(1000);
      expect(stats.last_performed).toBeTruthy();
    });
  });

  /* ── Templates ──────────────────────────────────────────── */

  describe('templatesRepo', () => {
    test('listTemplates returns Push Day and Leg Day', async () => {
      const list = await listTemplates();
      const names = list.map((t) => t.name);
      expect(names).toContain('Push Day');
      expect(names).toContain('Leg Day');
    });

    test('getTemplate returns slots + options for Push Day', async () => {
      const data = await getTemplate(tplPush);
      expect(data.template.name).toBe('Push Day');
      expect(data.slots).toHaveLength(2);
      expect(data.options.length).toBeGreaterThanOrEqual(2);
      const exNames = data.options.map((o: any) => o.exercise_name);
      expect(exNames).toContain('Bench Press');
      expect(exNames).toContain('Overhead Press');
    });

    test('createTemplate + deleteTemplate round-trip', async () => {
      await createTemplate('Test Template');
      let list = await listTemplates();
      const tt = list.find((t) => t.name === 'Test Template');
      expect(tt).toBeDefined();

      await deleteTemplate(tt!.id);
      list = await listTemplates();
      expect(list.find((t) => t.name === 'Test Template')).toBeUndefined();
    });

    test('listPrescribedSets returns 3 prescribed sets for Bench slot', async () => {
      const sets = await listPrescribedSets(tplSlot1);
      expect(sets).toHaveLength(3);
      expect(sets[0].weight).toBe(100);
      expect(sets[0].reps).toBe(10);
      expect(sets[0].rest_seconds).toBe(90);
    });

    test('upsertPrescribedSet updates existing set', async () => {
      await upsertPrescribedSet(tplSlot1, 1, 105, 8, 9, null, 120);
      const sets = await listPrescribedSets(tplSlot1);
      expect(sets[0].weight).toBe(105);
      expect(sets[0].reps).toBe(8);
      expect(sets[0].rpe).toBe(9);
      expect(sets[0].rest_seconds).toBe(120);
      // Restore
      await upsertPrescribedSet(tplSlot1, 1, 100, 10, null, null, 90);
    });
  });

  /* ── Sessions: listHistory (includes GROUP_CONCAT fix) ──── */

  describe('sessionsRepo — listHistory', () => {
    test('returns finalized sessions in reverse chronological order', async () => {
      const history = await listHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
      // Session 2 (June 2) should appear before Session 1 (June 1)
      const idx1 = history.findIndex((h) => h.id === session1Id);
      const idx2 = history.findIndex((h) => h.id === session2Id);
      expect(idx2).toBeLessThan(idx1);
    });

    test('exercises column has comma-separated distinct names (GROUP_CONCAT)', async () => {
      const history = await listHistory();
      const s1 = history.find((h) => h.id === session1Id);
      expect(s1).toBeDefined();
      // Session 1 has Bench Press and OHP
      expect(s1!.exercises).toContain('Bench Press');
      expect(s1!.exercises).toContain('Overhead Press');
    });

    test('completed_sets_count and total_volume are correct', async () => {
      const history = await listHistory();
      const s1 = history.find((h) => h.id === session1Id);
      expect(s1).toBeDefined();
      // Bench: 3 sets + OHP: 2 sets = 5 completed sets
      expect(s1!.completed_sets_count).toBe(5);
      // Volume: 100*10 + 110*8 + 120*5 + 60*10 + 65*8 = 1000+880+600+600+520 = 3600
      expect(s1!.total_volume).toBe(3600);
    });

    test('session notes are included', async () => {
      const history = await listHistory();
      const s2 = history.find((h) => h.id === session2Id);
      expect(s2!.notes).toBe('Legs felt great');
    });
  });

  /* ── Sessions: getSessionDetail ─────────────────────────── */

  describe('sessionsRepo — getSessionDetail', () => {
    test('returns full detail for session 1', async () => {
      const detail = await getSessionDetail(session1Id);
      expect(detail.session.id).toBe(session1Id);
      expect(detail.session.template_name).toBe('Push Day');
      // 2 slots: Bench + OHP
      expect(detail.slots).toHaveLength(2);
      // 5 sets total (3 bench + 2 OHP)
      expect(detail.sets).toHaveLength(5);
    });

    test('sets have correct weights and reps', async () => {
      const detail = await getSessionDetail(session1Id);
      const benchSlot = detail.slots.find((s) => s.exercise_name === 'Bench Press');
      expect(benchSlot).toBeDefined();
      const benchSets = detail.sets.filter(
        (s) => s.session_slot_choice_id === benchSlot!.session_slot_choice_id
      );
      expect(benchSets).toHaveLength(3);
      expect(benchSets[0].weight).toBe(100);
      expect(benchSets[1].weight).toBe(110);
      expect(benchSets[2].weight).toBe(120);
    });
  });

  /* ── Sessions: draft lifecycle ──────────────────────────── */

  describe('sessionsRepo — draft lifecycle', () => {
    let draftId: number;

    test('createDraftFromTemplate creates a draft with pre-populated sets', async () => {
      draftId = await createDraftFromTemplate(tplPush);
      expect(draftId).toBeGreaterThan(0);

      const draft = await getActiveDraft();
      expect(draft).not.toBeNull();
      expect(draft!.id).toBe(draftId);
      expect(draft!.status).toBe('draft');
    });

    test('draft slots carry forward historical weights', async () => {
      const slots = await listDraftSlots(draftId);
      expect(slots.length).toBeGreaterThanOrEqual(2);

      // The Bench slot's sets should carry forward from session 1
      const benchSlot = slots.find((s) => s.exercise_name === 'Bench Press');
      expect(benchSlot).toBeDefined();

      const choiceId = benchSlot!.selected_session_slot_choice_id!;
      const sets = await listSetsForChoice(choiceId);
      // Should have 3 sets (prescribed count) with historical weights
      expect(sets).toHaveLength(3);
      expect(sets[0].weight).toBe(100);
      expect(sets[1].weight).toBe(110);
      expect(sets[2].weight).toBe(120);
    });

    test('listSlotOptions returns available choices', async () => {
      const slots = await listDraftSlots(draftId);
      const benchSlot = slots.find((s) => s.exercise_name === 'Bench Press');
      const options = await listSlotOptions(benchSlot!.session_slot_id);
      // At least the one exercise in that slot
      expect(options.length).toBeGreaterThanOrEqual(1);
      expect(options[0].exercise_name).toBe('Bench Press');
    });

    test('discardDraft cleans up everything', async () => {
      await discardDraft(draftId);
      const draft = await getActiveDraft();
      expect(draft).toBeNull();
    });
  });

  /* ── Sets: CRUD + upsert ─────────────────────────────────── */

  describe('setsRepo', () => {
    let choiceId: number;
    let draftId: number;

    beforeAll(async () => {
      // Create a fresh draft for set operations
      draftId = await createDraftFromTemplate(tplPush);
      const slots = await listDraftSlots(draftId);
      const benchSlot = slots.find((s) => s.exercise_name === 'Bench Press');
      choiceId = benchSlot!.selected_session_slot_choice_id!;
    });

    afterAll(async () => {
      await discardDraft(draftId);
    });

    test('upsertSet updates weight for existing set', async () => {
      const before = await listSetsForChoice(choiceId);
      const set1 = before[0];
      await upsertSet(choiceId, set1.set_index, 135, 12, 8, null, 90);
      const after = await listSetsForChoice(choiceId);
      const updated = after.find((s) => s.set_index === set1.set_index);
      expect(updated!.weight).toBe(135);
      expect(updated!.reps).toBe(12);
    });

    test('toggleSetCompleted marks a set done', async () => {
      const sets = await listSetsForChoice(choiceId);
      const set = sets[0];
      expect(set.completed).toBe(0);
      await toggleSetCompleted(set.id, true);
      const updated = await listSetsForChoice(choiceId);
      expect(updated[0].completed).toBe(1);
    });

    test('deleteSet removes a set by index', async () => {
      const before = await listSetsForChoice(choiceId);
      const count = before.length;
      await deleteSet(choiceId, before[before.length - 1].set_index);
      const after = await listSetsForChoice(choiceId);
      expect(after.length).toBe(count - 1);
    });

    test('lastTimeForOption returns historical data for Bench', async () => {
      const lt = await lastTimeForOption(tsoId1);
      expect(lt).not.toBeNull();
      expect(lt!.sets.length).toBeGreaterThanOrEqual(3);
      expect(lt!.sets[0].weight).toBe(100);
    });
  });

  /* ── Drop-set segments ──────────────────────────────────── */

  describe('setsRepo — drop sets', () => {
    let setId: number;
    let draftId: number;

    beforeAll(async () => {
      draftId = await createDraftFromTemplate(tplPush);
      const slots = await listDraftSlots(draftId);
      const benchSlot = slots.find((s) => s.exercise_name === 'Bench Press');
      const choiceId = benchSlot!.selected_session_slot_choice_id!;
      const sets = await listSetsForChoice(choiceId);
      setId = sets[0].id;
    });

    afterAll(async () => {
      await discardDraft(draftId);
    });

    test('addDropSegment + read back', async () => {
      await addDropSegment(setId, 1, 80, 6);
      await addDropSegment(setId, 2, 60, 8);

      const res = await executeSqlAsync(
        `SELECT * FROM drop_set_segments WHERE set_id=? ORDER BY segment_index;`,
        [setId]
      );
      expect(res.rows._array).toHaveLength(2);
      expect(res.rows._array[0].weight).toBe(80);
      expect(res.rows._array[1].weight).toBe(60);
    });

    test('updateDropSegment changes values', async () => {
      const res = await executeSqlAsync(
        `SELECT id FROM drop_set_segments WHERE set_id=? AND segment_index=1;`,
        [setId]
      );
      const segId = res.rows._array[0].id;
      await updateDropSegment(segId, 85, 5);

      const after = await executeSqlAsync(
        `SELECT * FROM drop_set_segments WHERE id=?;`,
        [segId]
      );
      expect(after.rows._array[0].weight).toBe(85);
      expect(after.rows._array[0].reps).toBe(5);
    });

    test('deleteDropSegment removes a segment', async () => {
      const res = await executeSqlAsync(
        `SELECT id FROM drop_set_segments WHERE set_id=? ORDER BY segment_index;`,
        [setId]
      );
      const segId = res.rows._array[0].id;
      await deleteDropSegment(segId);
      const after = await executeSqlAsync(
        `SELECT * FROM drop_set_segments WHERE set_id=?;`,
        [setId]
      );
      expect(after.rows._array).toHaveLength(1);
    });
  });

  /* ── Warmup generation ──────────────────────────────────── */

  describe('setsRepo — warmup generation', () => {
    let choiceId: number;
    let draftId: number;

    beforeAll(async () => {
      draftId = await createDraftFromTemplate(tplPush);
      const slots = await listDraftSlots(draftId);
      const benchSlot = slots.find((s) => s.exercise_name === 'Bench Press');
      choiceId = benchSlot!.selected_session_slot_choice_id!;
    });

    afterAll(async () => {
      await discardDraft(draftId);
    });

    test('generateWarmupSets prepends warmup sets before working sets', async () => {
      const before = await listSetsForChoice(choiceId);
      const workingCount = before.length;

      await generateWarmupSets(choiceId, 100, 'kg');

      const after = await listSetsForChoice(choiceId);
      // Should have warmups + original working sets
      expect(after.length).toBeGreaterThan(workingCount);

      // Warmup sets should be marked
      const warmups = after.filter((s) => (s as any).is_warmup === 1);
      const working = after.filter((s) => (s as any).is_warmup === 0);
      expect(warmups.length).toBeGreaterThanOrEqual(1);
      expect(working.length).toBe(workingCount);

      // Warmup weights should be < working weight
      for (const wu of warmups) {
        expect(wu.weight).toBeLessThanOrEqual(100);
      }
    });
  });

  /* ── Stats ──────────────────────────────────────────────── */

  describe('statsRepo', () => {
    test('overallStats returns correct total sessions', async () => {
      const stats = await overallStats();
      // At least the 2 seeded finalized sessions
      expect(stats.totalSessions).toBeGreaterThanOrEqual(2);
    });

    test('weeklyVolumeByMuscle returns muscle groups', async () => {
      // Our test sessions may be older than 7 days, so this could be empty
      // but the query should not throw
      const vol = await weeklyVolumeByMuscle();
      expect(Array.isArray(vol)).toBe(true);
    });

    test('workoutDaysMap returns date-count map', async () => {
      const map = await workoutDaysMap();
      expect(typeof map).toBe('object');
      // Should have at least 2 dates
      const dates = Object.keys(map);
      expect(dates.length).toBeGreaterThanOrEqual(2);
    });

    test('currentStreak returns a number >= 0', async () => {
      const streak = await currentStreak();
      expect(typeof streak).toBe('number');
      expect(streak).toBeGreaterThanOrEqual(0);
    });

    test('e1rmHistory returns data points for Bench Press', async () => {
      const history = await e1rmHistory(exBench);
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0]).toHaveProperty('date');
      expect(history[0]).toHaveProperty('value');
    });

    test('perTemplateStats includes Push Day', async () => {
      const stats = await perTemplateStats();
      const push = stats.find((s: any) => s.name === 'Push Day');
      expect(push).toBeDefined();
      expect(push.sessionsCount).toBeGreaterThanOrEqual(1);
    });

    test('prCountsBySession returns a map (may be empty)', async () => {
      const counts = await prCountsBySession();
      expect(typeof counts).toBe('object');
    });
  });

  /* ── PR detection ───────────────────────────────────────── */

  describe('statsRepo — PR detection', () => {
    test('detectAndRecordPRs finds PRs for first session', async () => {
      // Session 1 is the very first for Bench Press — all should be PRs
      const prs = await detectAndRecordPRs(session1Id);
      // Should find at least one PR (e1rm or weight for Bench Press)
      expect(prs.length).toBeGreaterThanOrEqual(1);
      const benchPr = prs.find((p) => p.exercise_name === 'Bench Press');
      expect(benchPr).toBeDefined();
    });

    test('getSessionPRs returns the detected PRs', async () => {
      const prs = await getSessionPRs(session1Id);
      expect(prs.length).toBeGreaterThanOrEqual(1);
    });

    test('prCountsBySession now has counts for session 1', async () => {
      const counts = await prCountsBySession();
      expect(counts[session1Id]).toBeGreaterThanOrEqual(1);
    });
  });

  /* ── Body weight ────────────────────────────────────────── */

  describe('bodyWeightRepo', () => {
    test('logBodyWeight + listBodyWeights round-trip', async () => {
      // Insert with explicit timestamps via raw SQL for deterministic ordering
      await rawInsert(
        `INSERT INTO body_weight(weight, unit, measured_at) VALUES (?,?,?);`,
        [80, 'kg', '2025-07-01T08:00:00.000Z']
      );
      await rawInsert(
        `INSERT INTO body_weight(weight, unit, measured_at) VALUES (?,?,?);`,
        [79.5, 'kg', '2025-07-02T08:00:00.000Z']
      );

      const list = await listBodyWeights();
      expect(list.length).toBeGreaterThanOrEqual(2);
      // Newest first
      expect(list[0].weight).toBe(79.5);
      expect(list[1].weight).toBe(80);
    });

    test('latestBodyWeight returns most recent entry', async () => {
      const latest = await latestBodyWeight();
      expect(latest).not.toBeNull();
      expect(latest!.weight).toBe(79.5);
    });

    test('bodyWeightTrend returns oldest-first ordering', async () => {
      const trend = await bodyWeightTrend();
      expect(trend.length).toBeGreaterThanOrEqual(2);
      // Oldest first
      expect(trend[0].value).toBe(80);
    });

    test('deleteBodyWeight removes an entry', async () => {
      const list = await listBodyWeights();
      const id = list[0].id;
      await deleteBodyWeight(id);
      const after = await listBodyWeights();
      expect(after.length).toBe(list.length - 1);
    });
  });

  /* ── Finalize + carry-forward ───────────────────────────── */

  describe('sessionsRepo — finalize + carry-forward', () => {
    let draftId: number;

    test('finalizeSession marks draft as final', async () => {
      draftId = await createDraftFromTemplate(tplPush);
      const slots = await listDraftSlots(draftId);
      const benchSlot = slots.find((s) => s.exercise_name === 'Bench Press');
      const choiceId = benchSlot!.selected_session_slot_choice_id!;

      // Update weights, complete, and finalize
      await upsertSet(choiceId, 1, 105, 10, null, null, 90);
      await upsertSet(choiceId, 2, 115, 8, null, null, 90);
      await upsertSet(choiceId, 3, 125, 5, null, null, 90);

      const sets = await listSetsForChoice(choiceId);
      for (const s of sets) {
        await toggleSetCompleted(s.id, true);
      }

      await finalizeSession(draftId);

      // No active draft anymore
      const active = await getActiveDraft();
      expect(active).toBeNull();

      // Appears in history
      const history = await listHistory();
      const found = history.find((h) => h.id === draftId);
      expect(found).toBeDefined();
      expect(found!.completed_sets_count).toBe(3);
    });

    test('next draft carries forward the new weights', async () => {
      const nextDraft = await createDraftFromTemplate(tplPush);
      const slots = await listDraftSlots(nextDraft);
      const benchSlot = slots.find((s) => s.exercise_name === 'Bench Press');
      const choiceId = benchSlot!.selected_session_slot_choice_id!;
      const sets = await listSetsForChoice(choiceId);

      // Should carry forward 105, 115, 125 from the just-finalized session
      expect(sets[0].weight).toBe(105);
      expect(sets[1].weight).toBe(115);
      expect(sets[2].weight).toBe(125);

      await discardDraft(nextDraft);
    });
  });

  /* ── CASCADE deletes ────────────────────────────────────── */

  describe('CASCADE deletes', () => {
    test('discardDraft removes all child rows', async () => {
      const draftId = await createDraftFromTemplate(tplPush);

      // Verify rows exist
      const slotsBefore = await executeSqlAsync(
        `SELECT COUNT(*) as c FROM session_slots WHERE session_id=?;`,
        [draftId]
      );
      expect(slotsBefore.rows.item(0).c).toBeGreaterThan(0);

      await discardDraft(draftId);

      // All child rows gone
      const slotsAfter = await executeSqlAsync(
        `SELECT COUNT(*) as c FROM session_slots WHERE session_id=?;`,
        [draftId]
      );
      expect(slotsAfter.rows.item(0).c).toBe(0);

      const setsAfter = await executeSqlAsync(
        `SELECT COUNT(*) as c FROM sets WHERE session_slot_choice_id IN (
           SELECT id FROM session_slot_choices WHERE session_slot_id IN (
             SELECT id FROM session_slots WHERE session_id=?
           )
         );`,
        [draftId]
      );
      expect(setsAfter.rows.item(0).c).toBe(0);
    });
  });

  /* ── Schedule repo ──────────────────────────────────────── */

  describe('scheduleRepo', () => {
    test('dayName returns correct day names', () => {
      expect(dayName(0)).toBe('Sunday');
      expect(dayName(1)).toBe('Monday');
      expect(dayName(6)).toBe('Saturday');
      expect(dayName(99)).toBe('');
    });

    test('upsertSchedule creates a new schedule row', async () => {
      await upsertSchedule(tplPush, 1, 18, 0, true); // Monday 6 PM
      const rows = await listSchedulesForTemplate(tplPush);
      expect(rows.length).toBe(1);
      expect(rows[0].day_of_week).toBe(1);
      expect(rows[0].hour).toBe(18);
      expect(rows[0].minute).toBe(0);
      expect(rows[0].enabled).toBe(1);
    });

    test('upsertSchedule on same day updates time', async () => {
      await upsertSchedule(tplPush, 1, 8, 30, true); // Monday 8:30 AM
      const rows = await listSchedulesForTemplate(tplPush);
      const mon = rows.find((r) => r.day_of_week === 1)!;
      expect(mon.hour).toBe(8);
      expect(mon.minute).toBe(30);
    });

    test('multiple days for same template', async () => {
      await upsertSchedule(tplPush, 3, 18, 0, true); // Wednesday
      await upsertSchedule(tplPush, 5, 18, 0, true); // Friday
      const rows = await listSchedulesForTemplate(tplPush);
      expect(rows.length).toBe(3); // Mon, Wed, Fri
    });

    test('listAllEnabledSchedules joins template name', async () => {
      const all = await listAllEnabledSchedules();
      expect(all.length).toBeGreaterThanOrEqual(3);
      expect(all[0]).toHaveProperty('template_name');
      expect(all[0].template_name).toBeTruthy();
    });

    test('toggleScheduleEnabled disables a schedule', async () => {
      const rows = await listSchedulesForTemplate(tplPush);
      const first = rows[0];
      await toggleScheduleEnabled(first.id, false);
      const after = await listSchedulesForTemplate(tplPush);
      const toggled = after.find((r) => r.id === first.id)!;
      expect(toggled.enabled).toBe(0);
    });

    test('deleteSchedule removes a single row', async () => {
      const before = await listSchedulesForTemplate(tplPush);
      const toDelete = before[before.length - 1];
      await deleteSchedule(toDelete.id);
      const after = await listSchedulesForTemplate(tplPush);
      expect(after.length).toBe(before.length - 1);
    });

    test('deleteAllSchedulesForTemplate wipes all', async () => {
      await deleteAllSchedulesForTemplate(tplPush);
      const rows = await listSchedulesForTemplate(tplPush);
      expect(rows.length).toBe(0);
    });
  });

  /* ═══════════════════════════════════════════════════════════
   *  Cross-template weight carry-over
   * ═══════════════════════════════════════════════════════════ */
  describe('Cross-template weight carry-over', () => {
    let tplLeg: number;
    let tplLegSlot: number;
    let tsoLegSquat: number;
    let tplFull: number;
    let tplFullSlot1: number;
    let tplFullSlot2: number;
    let tsoFullSquat: number;
    let tsoFullBench: number;

    test('setup: create Leg Day and Full Body templates sharing Squat', async () => {
      const ts = '2025-07-01T10:00:00.000Z';

      // Template 1: "Leg Day" with Squat
      await rawInsert(
        `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
        ['Cross Leg Day', 'cross leg day', ts]
      );
      tplLeg = await lastId();
      await rawInsert(
        `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
        [tplLeg, 1, 'Squat', ts]
      );
      tplLegSlot = await lastId();
      await rawInsert(
        `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at) VALUES (?,?,?,?,?);`,
        [tplLegSlot, exSquat, null, 0, ts]
      );
      tsoLegSquat = await lastId();

      // Template 2: "Full Body" with Squat + Bench
      await rawInsert(
        `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
        ['Cross Full Body', 'cross full body', ts]
      );
      tplFull = await lastId();
      await rawInsert(
        `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
        [tplFull, 1, 'Squat', ts]
      );
      tplFullSlot1 = await lastId();
      await rawInsert(
        `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at) VALUES (?,?,?,?,?);`,
        [tplFullSlot1, exSquat, null, 0, ts]
      );
      tsoFullSquat = await lastId();

      await rawInsert(
        `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
        [tplFull, 2, 'Bench', ts]
      );
      tplFullSlot2 = await lastId();
      await rawInsert(
        `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at) VALUES (?,?,?,?,?);`,
        [tplFullSlot2, exBench, null, 0, ts]
      );
      tsoFullBench = await lastId();
    });

    test('weights from Template A carry over to Template B for shared exercises', async () => {
      // Day 1: Do Leg Day → Squat at 140 kg
      const sessionId1 = await createDraftFromTemplate(tplLeg);
      const slots1 = await listDraftSlots(sessionId1);
      const squatSlot1 = slots1.find((s) => s.exercise_id === exSquat)!;
      expect(squatSlot1).toBeDefined();

      // Complete 3 sets at 140kg
      const sscId1 = squatSlot1.selected_session_slot_choice_id!;
      await upsertSet(sscId1, 1, 140, 5, null, null);
      await upsertSet(sscId1, 2, 140, 5, null, null);
      await upsertSet(sscId1, 3, 140, 5, null, null);
      await finalizeSession(sessionId1);

      // Day 2: Start Full Body → Squat should prefill with 140 kg from Leg Day
      const sessionId2 = await createDraftFromTemplate(tplFull);
      const slots2 = await listDraftSlots(sessionId2);
      const squatSlot2 = slots2.find((s) => s.exercise_id === exSquat)!;
      expect(squatSlot2).toBeDefined();

      const prefillSets = await listSetsForChoice(squatSlot2.selected_session_slot_choice_id!);
      // Should have sets with weight 140 (from Leg Day), not 0 or some old value
      expect(prefillSets.length).toBeGreaterThan(0);
      expect(prefillSets[0].weight).toBe(140);

      // Also verify lastTimeForExercise returns Leg Day's data
      const lt = await lastTimeForExercise(exSquat);
      expect(lt).not.toBeNull();
      expect(lt!.sets.length).toBeGreaterThanOrEqual(3);
      expect(lt!.sets[0].weight).toBe(140);

      // Clean up draft
      await discardDraft(sessionId2);
    });

    test('non-selected choice does not pollute cross-template lookup', async () => {
      // Create a multi-option slot: Squat and Bench in same slot of a new template
      const ts = '2025-07-10T10:00:00.000Z';
      await rawInsert(
        `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
        ['Cross Multi Choice', 'cross multi choice', ts]
      );
      const tplMulti = await lastId();
      await rawInsert(
        `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
        [tplMulti, 1, 'Main Lift', ts]
      );
      const multiSlot = await lastId();
      await rawInsert(
        `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at) VALUES (?,?,?,?,?);`,
        [multiSlot, exSquat, null, 0, ts]
      );
      const tsoMultiSquat = await lastId();
      await rawInsert(
        `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at) VALUES (?,?,?,?,?);`,
        [multiSlot, exOHP, null, 1, ts]
      );
      const tsoMultiOHP = await lastId();

      // Start session defaulting to Squat, then switch to OHP
      const sid = await createDraftFromTemplate(tplMulti);
      const multiSlots = await listDraftSlots(sid);
      const mainLift = multiSlots[0];
      // Default is Squat. The prefill sets have some weight.
      // Now switch to OHP — the old Squat choice keeps stale prefill data
      await selectSlotChoice(mainLift.session_slot_id, tsoMultiOHP);
      // Complete OHP sets
      const updatedSlots = await listDraftSlots(sid);
      const ohpSlot = updatedSlots[0];
      const ohpChoiceId = ohpSlot.selected_session_slot_choice_id!;
      await upsertSet(ohpChoiceId, 1, 50, 8, null, null);
      await finalizeSession(sid);

      // Now the stale Squat choice from this session should NOT be picked up
      // lastTimeForExercise for Squat should still return 140 from the Leg Day session
      const lt = await lastTimeForExercise(exSquat);
      expect(lt).not.toBeNull();
      expect(lt!.sets[0].weight).toBe(140);
    });
  });

  /* ═══════════════════════════════════════════════════════════
   *  Injury lifecycle: injury → workout → recovery → normal
   * ═══════════════════════════════════════════════════════════ */
  describe('Injury lifecycle', () => {
    let tplUpper: number;
    let tplUpperSlotBench: number;
    let tplUpperSlotSquat: number;
    let tsoUpperBench: number;
    let tsoUpperSquat: number;

    test('setup: create Upper Body template with Bench + Squat', async () => {
      const ts = '2025-08-01T10:00:00.000Z';
      await rawInsert(
        `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
        ['Injury Test Upper', 'injury test upper', ts]
      );
      tplUpper = await lastId();

      await rawInsert(
        `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
        [tplUpper, 1, 'Bench', ts]
      );
      tplUpperSlotBench = await lastId();
      await rawInsert(
        `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at) VALUES (?,?,?,?,?);`,
        [tplUpperSlotBench, exBench, null, 0, ts]
      );
      tsoUpperBench = await lastId();

      await rawInsert(
        `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
        [tplUpper, 2, 'Squat', ts]
      );
      tplUpperSlotSquat = await lastId();
      await rawInsert(
        `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at) VALUES (?,?,?,?,?);`,
        [tplUpperSlotSquat, exSquat, null, 0, ts]
      );
      tsoUpperSquat = await lastId();

      // Add prescribed sets for structure
      await upsertPrescribedSet(tplUpperSlotBench, 1, 0, 5, null, null, 90);
      await upsertPrescribedSet(tplUpperSlotBench, 2, 0, 5, null, null, 90);
      await upsertPrescribedSet(tplUpperSlotBench, 3, 0, 5, null, null, 90);
      await upsertPrescribedSet(tplUpperSlotSquat, 1, 0, 5, null, null, 90);
      await upsertPrescribedSet(tplUpperSlotSquat, 2, 0, 5, null, null, 90);
      await upsertPrescribedSet(tplUpperSlotSquat, 3, 0, 5, null, null, 90);
    });

    test('healthy baseline: finalize session at normal weights', async () => {
      // No injuries — bench at 100, squat at 140
      const sid = await createDraftFromTemplate(tplUpper);
      const slots = await listDraftSlots(sid);
      const benchSlot = slots.find(s => s.exercise_id === exBench)!;
      const squatSlot = slots.find(s => s.exercise_id === exSquat)!;

      const benchChoiceId = benchSlot.selected_session_slot_choice_id!;
      const squatChoiceId = squatSlot.selected_session_slot_choice_id!;

      await upsertSet(benchChoiceId, 1, 100, 5, null, null);
      await upsertSet(benchChoiceId, 2, 100, 5, null, null);
      await upsertSet(benchChoiceId, 3, 100, 5, null, null);
      await upsertSet(squatChoiceId, 1, 140, 5, null, null);
      await upsertSet(squatChoiceId, 2, 140, 5, null, null);
      await upsertSet(squatChoiceId, 3, 140, 5, null, null);
      await finalizeSession(sid);
    });

    test('ankle injury does NOT reduce bench press weights', async () => {
      // Log ankle injury (mild)
      await addInjury('ankle', 'general_pain', 'mild', null);
      const injuries = await listActiveInjuries();
      expect(injuries.length).toBeGreaterThanOrEqual(1);

      // Start new session — bench should remain at 100 (ankle doesn't affect upper body)
      const sid = await createDraftFromTemplate(tplUpper);
      const slots = await listDraftSlots(sid);
      const benchSlot = slots.find(s => s.exercise_id === exBench)!;
      const benchSets = await listSetsForChoice(benchSlot.selected_session_slot_choice_id!);

      expect(benchSets.length).toBe(3);
      expect(benchSets[0].weight).toBe(100); // NOT 70 (100 * 0.7)

      // Squat SHOULD have reduced weights (ankle injury affects squat pattern)
      const squatSlot = slots.find(s => s.exercise_id === exSquat)!;
      const squatSets = await listSetsForChoice(squatSlot.selected_session_slot_choice_id!);
      expect(squatSets[0].weight).toBe(98); // 140 * 0.7 = 98, rounded

      // Complete and finalize
      await upsertSet(benchSlot.selected_session_slot_choice_id!, 1, 100, 5, null, null);
      await upsertSet(benchSlot.selected_session_slot_choice_id!, 2, 100, 5, null, null);
      await upsertSet(benchSlot.selected_session_slot_choice_id!, 3, 100, 5, null, null);
      await upsertSet(squatSlot.selected_session_slot_choice_id!, 1, 98, 5, null, null);
      await upsertSet(squatSlot.selected_session_slot_choice_id!, 2, 98, 5, null, null);
      await upsertSet(squatSlot.selected_session_slot_choice_id!, 3, 98, 5, null, null);
      await finalizeSession(sid);
    });

    test('no compounding: second injury session still uses pre-injury baseline', async () => {
      // Still injured — start another session
      const sid = await createDraftFromTemplate(tplUpper);
      const slots = await listDraftSlots(sid);
      const squatSlot = slots.find(s => s.exercise_id === exSquat)!;
      const squatSets = await listSetsForChoice(squatSlot.selected_session_slot_choice_id!);

      // Should still be 98 (140 * 0.7), NOT 68.6 (98 * 0.7 compounded)
      expect(squatSets[0].weight).toBe(98);

      // Bench still unaffected
      const benchSlot = slots.find(s => s.exercise_id === exBench)!;
      const benchSets = await listSetsForChoice(benchSlot.selected_session_slot_choice_id!);
      expect(benchSets[0].weight).toBe(100);

      await upsertSet(squatSlot.selected_session_slot_choice_id!, 1, 98, 5, null, null);
      await upsertSet(squatSlot.selected_session_slot_choice_id!, 2, 98, 5, null, null);
      await upsertSet(squatSlot.selected_session_slot_choice_id!, 3, 98, 5, null, null);
      await upsertSet(benchSlot.selected_session_slot_choice_id!, 1, 100, 5, null, null);
      await upsertSet(benchSlot.selected_session_slot_choice_id!, 2, 100, 5, null, null);
      await upsertSet(benchSlot.selected_session_slot_choice_id!, 3, 100, 5, null, null);
      await finalizeSession(sid);
    });

    test('recovery: after resolving injury, weights fully restore', async () => {
      // Resolve the ankle injury
      const injuries = await listActiveInjuries();
      const ankleInjury = injuries.find(i => i.body_region === 'ankle');
      expect(ankleInjury).toBeDefined();
      await resolveInjury(ankleInjury!.id);

      // Verify no active injuries
      const activeAfter = await listActiveInjuries();
      expect(activeAfter.filter(i => i.body_region === 'ankle').length).toBe(0);

      // Start new session — squat should be back to 140 (pre-injury weight)
      const sid = await createDraftFromTemplate(tplUpper);
      const slots = await listDraftSlots(sid);

      const squatSlot = slots.find(s => s.exercise_id === exSquat)!;
      const squatSets = await listSetsForChoice(squatSlot.selected_session_slot_choice_id!);
      expect(squatSets[0].weight).toBe(140); // fully restored, NOT 98

      const benchSlot = slots.find(s => s.exercise_id === exBench)!;
      const benchSets = await listSetsForChoice(benchSlot.selected_session_slot_choice_id!);
      expect(benchSets[0].weight).toBe(100); // unchanged throughout

      await discardDraft(sid);
    });

    test('mid-workout exercise switch respects injury and marks factor', async () => {
      // Re-add injury for this test
      await addInjury('knee', 'strain', 'moderate', null);

      // Create a template with a multi-option slot
      const ts = '2025-08-10T10:00:00.000Z';
      await rawInsert(
        `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
        ['Injury Switch Test', 'injury switch test', ts]
      );
      const tplSwitch = await lastId();
      await rawInsert(
        `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
        [tplSwitch, 1, 'Leg Move', ts]
      );
      const switchSlot = await lastId();
      // Option 1: Squat (affected by knee injury)
      await rawInsert(
        `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at) VALUES (?,?,?,?,?);`,
        [switchSlot, exSquat, null, 0, ts]
      );
      const tsoSwitchSquat = await lastId();
      // Option 2: Bench (not affected by knee injury)
      await rawInsert(
        `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at) VALUES (?,?,?,?,?);`,
        [switchSlot, exBench, null, 1, ts]
      );
      const tsoSwitchBench = await lastId();

      // Start session (defaults to squat)
      const sid = await createDraftFromTemplate(tplSwitch);
      const slots = await listDraftSlots(sid);
      const slot0 = slots[0];

      // Squat weights should be reduced (knee moderate = 50%)
      const squatSets = await listSetsForChoice(slot0.selected_session_slot_choice_id!);
      expect(squatSets[0].weight).toBe(70); // 140 * 0.5 = 70

      // Switch to bench mid-workout
      const benchChoiceId = await selectSlotChoice(slot0.session_slot_id, tsoSwitchBench);
      const benchSets = await listSetsForChoice(benchChoiceId);
      expect(benchSets[0].weight).toBe(100); // knee injury doesn't affect bench

      await discardDraft(sid);

      // Clean up injury
      const kneeInjuries = await listActiveInjuries();
      const knee = kneeInjuries.find(i => i.body_region === 'knee');
      if (knee) await resolveInjury(knee.id);
    });
  });
});
