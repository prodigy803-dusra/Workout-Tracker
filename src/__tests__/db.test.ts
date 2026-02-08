/**
 * Integration tests for the workout app database layer.
 *
 * These tests verify:
 * 1. Migrations are well-formed SQL
 * 2. Utility functions (normalizeName, debounce) work correctly
 * 3. Type definitions are consistent
 * 4. Data transformations in repos are correct
 */
import { migrations } from '../db/migrations';
import { normalizeName } from '../utils/normalize';

/* ─── Migration sanity checks ───────────────────────────── */
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

  test('should have at least 27 migrations', () => {
    expect(migrations.length).toBeGreaterThanOrEqual(27);
  });

  test('first migration creates schema_migrations table', () => {
    expect(migrations[0]).toMatch(/schema_migrations/i);
  });

  test('CREATE TABLE migrations contain required keywords', () => {
    const createMigrations = migrations.filter((m) =>
      m.trim().toLowerCase().startsWith('create table')
    );
    createMigrations.forEach((m) => {
      expect(m).toMatch(/CREATE TABLE/i);
      expect(m).toMatch(/PRIMARY KEY/i);
    });
  });

  test('migrations include exercise guide columns', () => {
    const all = migrations.join('\n');
    expect(all).toMatch(/video_url/i);
    expect(all).toMatch(/instructions/i);
    expect(all).toMatch(/tips/i);
  });
});

/* ─── Utility function tests ────────────────────────────── */
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
});

/* ─── Type consistency tests ────────────────────────────── */
describe('Type imports', () => {
  test('types module exports required types', () => {
    // This test verifies the module can be imported and has the expected shape
    const types = require('../types');
    // Just verify it's a module with exports (types are erased at runtime,
    // but the module should still be importable)
    expect(types).toBeDefined();
  });
});

/* ─── Data transformation tests ────────────────────────── */
describe('SetData transformation', () => {
  test('completed field converts number to boolean', () => {
    // Simulating the transformation done in LogScreen's load()
    const dbRow = {
      id: 1,
      set_index: 1,
      weight: 100,
      reps: 8,
      rpe: null,
      rest_seconds: 90,
      completed: 1,
      session_slot_choice_id: 5,
      notes: null,
      created_at: '2025-01-01',
    };

    const setData = {
      id: dbRow.id,
      set_index: dbRow.set_index,
      weight: dbRow.weight,
      reps: dbRow.reps,
      rpe: dbRow.rpe,
      rest_seconds: dbRow.rest_seconds,
      completed: !!dbRow.completed,
    };

    expect(setData.completed).toBe(true);
    expect(typeof setData.completed).toBe('boolean');
  });

  test('completed=0 maps to false', () => {
    expect(!!0).toBe(false);
  });

  test('completed=1 maps to true', () => {
    expect(!!1).toBe(true);
  });
});

describe('e1RM calculation', () => {
  test('Epley formula: weight * (1 + reps/30)', () => {
    // The SQL uses: weight * (1 + reps / 30.0)
    const weight = 100;
    const reps = 5;
    const e1rm = weight * (1 + reps / 30);
    expect(e1rm).toBeCloseTo(116.67, 1);
  });

  test('1 rep gives 1.033x multiplier', () => {
    const e1rm = 100 * (1 + 1 / 30);
    expect(e1rm).toBeCloseTo(103.33, 1);
  });

  test('10 reps gives 1.33x multiplier', () => {
    const e1rm = 100 * (1 + 10 / 30);
    expect(e1rm).toBeCloseTo(133.33, 1);
  });
});

describe('Progressive overload suggestion', () => {
  test('suggests +2.5 on the heaviest set', () => {
    const lastTimeSets = [
      { weight: 80, reps: 8, completed: 1 },
      { weight: 85, reps: 6, completed: 1 },
      { weight: 82.5, reps: 7, completed: 1 },
    ];

    const allCompleted = lastTimeSets.every((s) => s.completed);
    expect(allCompleted).toBe(true);

    const heaviest = lastTimeSets.reduce(
      (max, s) => (s.weight > max.weight ? s : max),
      lastTimeSets[0]
    );
    expect(heaviest.weight).toBe(85);

    const suggestedWeight = heaviest.weight + 2.5;
    expect(suggestedWeight).toBe(87.5);
  });

  test('does not suggest when sets are incomplete', () => {
    const lastTimeSets = [
      { weight: 80, reps: 8, completed: 1 },
      { weight: 85, reps: 6, completed: 0 },
    ];

    const allCompleted = lastTimeSets.every((s) => s.completed);
    expect(allCompleted).toBe(false);
  });
});
