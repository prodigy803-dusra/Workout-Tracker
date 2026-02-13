/**
 * Test suite for the session store reducer and related logic.
 *
 * Covers:
 *  1. Reducer state transitions (pure function tests)
 *  2. Weight/reps persistence — the "reset to 0" bug scenario
 *  3. Set completion flow
 *  4. RPE cycling
 *  5. Drop-set segment management
 *  6. Notes persistence
 *  7. Edge cases — empty inputs, invalid strings, missing data
 *  8. Derived value computation (volume, counts)
 */

// Mock native modules that can't run in Node/Jest
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    withTransactionAsync: jest.fn(),
    execSync: jest.fn(),
    runSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    prepareSync: jest.fn(() => ({
      executeSync: jest.fn(),
      finalizeSync: jest.fn(),
    })),
  })),
}));
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useReducer: jest.fn(),
  useCallback: jest.fn((fn: any) => fn),
}));

import {
  sessionReducer,
  INITIAL_STATE,
  SessionState,
  SessionAction,
  DropSegment,
} from '../hooks/useSessionStore';
import type { SetData } from '../types';

/* ═══════════════════════════════════════════════════════════
 *  Test helpers
 * ═══════════════════════════════════════════════════════════ */

function makeSet(overrides: Partial<SetData> = {}): SetData {
  return {
    id: 1,
    set_index: 1,
    weight: 60,
    reps: 8,
    rpe: null,
    rest_seconds: 90,
    completed: false,
    ...overrides,
  };
}

function makeDrop(overrides: Partial<DropSegment> = {}): DropSegment {
  return {
    id: 100,
    segment_index: 1,
    weight: 40,
    reps: 10,
    ...overrides,
  };
}

function activeState(overrides: Partial<SessionState> = {}): SessionState {
  return {
    ...INITIAL_STATE,
    phase: 'active',
    draft: { id: 1, template_id: 1, status: 'draft', created_at: '2026-01-01T00:00:00Z', notes: '' } as any,
    slots: [
      {
        session_slot_id: 10,
        slot_index: 0,
        exercise_name: 'Bench Press',
        selected_session_slot_choice_id: 100,
        template_slot_option_id: 50,
      } as any,
      {
        session_slot_id: 11,
        slot_index: 1,
        exercise_name: 'Squat',
        selected_session_slot_choice_id: 101,
        template_slot_option_id: 51,
      } as any,
    ],
    setsByChoice: {
      100: [
        makeSet({ id: 1, set_index: 1, weight: 60, reps: 8 }),
        makeSet({ id: 2, set_index: 2, weight: 60, reps: 8 }),
        makeSet({ id: 3, set_index: 3, weight: 60, reps: 8 }),
      ],
      101: [
        makeSet({ id: 4, set_index: 1, weight: 100, reps: 5 }),
        makeSet({ id: 5, set_index: 2, weight: 100, reps: 5 }),
      ],
    },
    optionsBySlot: { 10: [], 11: [] },
    dropsBySet: {},
    lastTimeBySlot: {},
    ...overrides,
  };
}

/** Compute derived values the same way LogScreen does */
function computeDerived(state: SessionState) {
  let totalSets = 0, completedSets = 0, totalVolume = 0;
  for (const sets of Object.values(state.setsByChoice)) {
    for (const s of sets) {
      totalSets++;
      if (s.completed) {
        completedSets++;
        totalVolume += (s.weight || 0) * (s.reps || 0);
        const drops = state.dropsBySet[s.id] || [];
        for (const d of drops) {
          totalVolume += (d.weight || 0) * (d.reps || 0);
        }
      }
    }
  }
  return { totalSets, completedSets, totalVolume };
}

/* ═══════════════════════════════════════════════════════════
 *  1. INITIAL STATE
 * ═══════════════════════════════════════════════════════════ */

describe('Initial State', () => {
  test('starts in idle phase with no draft', () => {
    expect(INITIAL_STATE.phase).toBe('idle');
    expect(INITIAL_STATE.draft).toBeNull();
    expect(INITIAL_STATE.slots).toEqual([]);
    expect(INITIAL_STATE.setsByChoice).toEqual({});
  });
});

/* ═══════════════════════════════════════════════════════════
 *  2. HYDRATE & RESET
 * ═══════════════════════════════════════════════════════════ */

describe('HYDRATE / RESET', () => {
  test('HYDRATE replaces entire state', () => {
    const payload = activeState();
    const result = sessionReducer(INITIAL_STATE, { type: 'HYDRATE', payload });
    expect(result.phase).toBe('active');
    expect(result.draft).not.toBeNull();
    expect(result.slots).toHaveLength(2);
    expect(Object.keys(result.setsByChoice)).toHaveLength(2);
  });

  test('RESET returns to idle', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'RESET' });
    expect(result.phase).toBe('idle');
    expect(result.draft).toBeNull();
    expect(result.slots).toEqual([]);
    expect(result.setsByChoice).toEqual({});
  });
});

/* ═══════════════════════════════════════════════════════════
 *  3. COMPLETE / UNCOMPLETE SET
 * ═══════════════════════════════════════════════════════════ */

describe('COMPLETE_SET / UNCOMPLETE_SET', () => {
  test('marks a set as completed', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 100 });
    const set = result.setsByChoice[100].find((s) => s.id === 1);
    expect(set?.completed).toBe(true);
  });

  test('does NOT change weight/reps when completing', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'COMPLETE_SET', setId: 3, choiceId: 100 });
    const set = result.setsByChoice[100].find((s) => s.id === 3);
    expect(set?.weight).toBe(60);
    expect(set?.reps).toBe(8);
    expect(set?.completed).toBe(true);
  });

  test('completing one set does not affect others', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 100 });
    const set2 = result.setsByChoice[100].find((s) => s.id === 2);
    const set3 = result.setsByChoice[100].find((s) => s.id === 3);
    expect(set2?.completed).toBe(false);
    expect(set3?.completed).toBe(false);
  });

  test('uncomplete reverses completion', () => {
    let state = activeState();
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 2, choiceId: 100 });
    expect(state.setsByChoice[100].find((s) => s.id === 2)?.completed).toBe(true);

    state = sessionReducer(state, { type: 'UNCOMPLETE_SET', setId: 2, choiceId: 100 });
    expect(state.setsByChoice[100].find((s) => s.id === 2)?.completed).toBe(false);
  });

  test('completing set in one exercise does not affect another exercise', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'COMPLETE_SET', setId: 4, choiceId: 101 });
    // Bench (choice 100) should be untouched
    expect(result.setsByChoice[100].every((s) => !s.completed)).toBe(true);
    // Squat set 4 completed
    expect(result.setsByChoice[101].find((s) => s.id === 4)?.completed).toBe(true);
  });

  test('completing with invalid choiceId is a no-op', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 999 });
    expect(result).toEqual(state);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  4. WEIGHT / REPS COMMIT — the "reset to 0" scenarios
 * ═══════════════════════════════════════════════════════════ */

describe('COMMIT_WEIGHT / COMMIT_REPS', () => {
  test('commits a valid weight from raw string', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'COMMIT_WEIGHT', setId: 3, choiceId: 100, raw: '72.5',
    });
    const set = result.setsByChoice[100].find((s) => s.id === 3);
    expect(set?.weight).toBe(72.5);
  });

  test('commits a valid reps from raw string', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'COMMIT_REPS', setId: 3, choiceId: 100, raw: '12',
    });
    const set = result.setsByChoice[100].find((s) => s.id === 3);
    expect(set?.reps).toBe(12);
  });

  test('empty weight string → 0 (not NaN)', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'COMMIT_WEIGHT', setId: 1, choiceId: 100, raw: '',
    });
    expect(result.setsByChoice[100].find((s) => s.id === 1)?.weight).toBe(0);
  });

  test('empty reps string → 0 (not NaN)', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'COMMIT_REPS', setId: 1, choiceId: 100, raw: '',
    });
    expect(result.setsByChoice[100].find((s) => s.id === 1)?.reps).toBe(0);
  });

  test('non-numeric weight string → 0', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'COMMIT_WEIGHT', setId: 1, choiceId: 100, raw: 'abc',
    });
    expect(result.setsByChoice[100].find((s) => s.id === 1)?.weight).toBe(0);
  });

  test('non-numeric reps string → 0', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'COMMIT_REPS', setId: 1, choiceId: 100, raw: 'xyz',
    });
    expect(result.setsByChoice[100].find((s) => s.id === 1)?.reps).toBe(0);
  });

  test('weight with trailing dot parses correctly ("60." → 60)', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'COMMIT_WEIGHT', setId: 1, choiceId: 100, raw: '60.',
    });
    expect(result.setsByChoice[100].find((s) => s.id === 1)?.weight).toBe(60);
  });

  test('decimal reps is floored by parseInt ("8.5" → 8)', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'COMMIT_REPS', setId: 1, choiceId: 100, raw: '8.5',
    });
    expect(result.setsByChoice[100].find((s) => s.id === 1)?.reps).toBe(8);
  });

  test('COMMIT_WEIGHT does not affect reps', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'COMMIT_WEIGHT', setId: 1, choiceId: 100, raw: '999',
    });
    const set = result.setsByChoice[100].find((s) => s.id === 1);
    expect(set?.weight).toBe(999);
    expect(set?.reps).toBe(8); // unchanged
  });

  test('COMMIT_REPS does not affect weight', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'COMMIT_REPS', setId: 1, choiceId: 100, raw: '20',
    });
    const set = result.setsByChoice[100].find((s) => s.id === 1);
    expect(set?.reps).toBe(20);
    expect(set?.weight).toBe(60); // unchanged
  });

  test('commit to invalid choiceId is a no-op', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'COMMIT_WEIGHT', setId: 1, choiceId: 999, raw: '100',
    });
    expect(result).toEqual(state);
  });

  /**
   * BUG REGRESSION: "weight resets to 0 on collapse"
   * 
   * Scenario: User edits weight → completes last set → slot collapses →
   * weight was only in memory (onEndEditing never fired) → weight lost.
   * 
   * The reducer must preserve weights through COMPLETE_SET.
   * The caller (LogScreen) must persist weight BEFORE calling COMPLETE_SET.
   */
  test('REGRESSION: weight survives COMMIT → COMPLETE sequence', () => {
    let state = activeState();

    // User types weight for set 3
    state = sessionReducer(state, {
      type: 'COMMIT_WEIGHT', setId: 3, choiceId: 100, raw: '65',
    });
    expect(state.setsByChoice[100].find((s) => s.id === 3)?.weight).toBe(65);

    // User completes set 3 (which triggers auto-collapse in UI)
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 3, choiceId: 100 });
    
    // Weight MUST still be 65, not reset to 0
    const set3 = state.setsByChoice[100].find((s) => s.id === 3);
    expect(set3?.weight).toBe(65);
    expect(set3?.completed).toBe(true);
  });

  test('REGRESSION: reps survive COMMIT → COMPLETE sequence', () => {
    let state = activeState();

    state = sessionReducer(state, {
      type: 'COMMIT_REPS', setId: 3, choiceId: 100, raw: '10',
    });
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 3, choiceId: 100 });

    const set3 = state.setsByChoice[100].find((s) => s.id === 3);
    expect(set3?.reps).toBe(10);
    expect(set3?.completed).toBe(true);
  });

  test('REGRESSION: complete all sets in sequence preserves all weights', () => {
    let state = activeState();

    // Commit different weights for all 3 sets
    state = sessionReducer(state, { type: 'COMMIT_WEIGHT', setId: 1, choiceId: 100, raw: '50' });
    state = sessionReducer(state, { type: 'COMMIT_WEIGHT', setId: 2, choiceId: 100, raw: '55' });
    state = sessionReducer(state, { type: 'COMMIT_WEIGHT', setId: 3, choiceId: 100, raw: '60' });

    // Complete all sets (this triggers the auto-collapse bug scenario)
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 100 });
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 2, choiceId: 100 });
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 3, choiceId: 100 });

    // ALL weights must be preserved
    expect(state.setsByChoice[100].find((s) => s.id === 1)?.weight).toBe(50);
    expect(state.setsByChoice[100].find((s) => s.id === 2)?.weight).toBe(55);
    expect(state.setsByChoice[100].find((s) => s.id === 3)?.weight).toBe(60);

    // All completed
    expect(state.setsByChoice[100].every((s) => s.completed)).toBe(true);
  });

  test('REGRESSION: editing weight on already-completed set preserves it', () => {
    let state = activeState();

    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 100 });
    state = sessionReducer(state, {
      type: 'COMMIT_WEIGHT', setId: 1, choiceId: 100, raw: '70',
    });

    const set = state.setsByChoice[100].find((s) => s.id === 1);
    expect(set?.weight).toBe(70);
    expect(set?.completed).toBe(true); // still completed
  });
});

/* ═══════════════════════════════════════════════════════════
 *  5. RPE CYCLING
 * ═══════════════════════════════════════════════════════════ */

describe('CYCLE_RPE', () => {
  test('cycles null → 6 → 7 → 8 → 9 → 10 → null', () => {
    let state = activeState();
    const expectedSequence = [6, 7, 8, 9, 10, null];

    for (const expected of expectedSequence) {
      state = sessionReducer(state, { type: 'CYCLE_RPE', setId: 1, choiceId: 100 });
      expect(state.setsByChoice[100].find((s) => s.id === 1)?.rpe).toBe(expected);
    }
  });

  test('RPE cycling does not affect weight or reps', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'CYCLE_RPE', setId: 1, choiceId: 100 });
    const set = result.setsByChoice[100].find((s) => s.id === 1);
    expect(set?.weight).toBe(60);
    expect(set?.reps).toBe(8);
    expect(set?.rpe).toBe(6);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  6. DELETE SET
 * ═══════════════════════════════════════════════════════════ */

describe('DELETE_SET', () => {
  test('removes set by set_index', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'DELETE_SET', choiceId: 100, setIndex: 2 });
    expect(result.setsByChoice[100]).toHaveLength(2);
    expect(result.setsByChoice[100].find((s) => s.set_index === 2)).toBeUndefined();
  });

  test('delete non-existent set_index is a no-op', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'DELETE_SET', choiceId: 100, setIndex: 99 });
    expect(result.setsByChoice[100]).toHaveLength(3);
  });

  test('delete from non-existent choiceId is a no-op', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'DELETE_SET', choiceId: 999, setIndex: 1 });
    expect(result).toEqual(state);
  });

  test('deleting a set does not affect other exercises', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'DELETE_SET', choiceId: 100, setIndex: 1 });
    expect(result.setsByChoice[101]).toHaveLength(2); // squat untouched
  });
});

/* ═══════════════════════════════════════════════════════════
 *  7. DROP-SET SEGMENTS
 * ═══════════════════════════════════════════════════════════ */

describe('Drop-set segments', () => {
  test('ADD_DROP_SEGMENT appends to set', () => {
    const state = activeState();
    const drop = makeDrop({ id: 200, segment_index: 1, weight: 40, reps: 12 });
    const result = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1, segment: drop,
    });
    expect(result.dropsBySet[1]).toHaveLength(1);
    expect(result.dropsBySet[1][0].weight).toBe(40);
  });

  test('multiple drops stack up', () => {
    let state = activeState();
    state = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1,
      segment: makeDrop({ id: 200, segment_index: 1, weight: 40, reps: 12 }),
    });
    state = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1,
      segment: makeDrop({ id: 201, segment_index: 2, weight: 30, reps: 15 }),
    });
    expect(state.dropsBySet[1]).toHaveLength(2);
  });

  test('COMMIT_DROP_WEIGHT updates weight', () => {
    let state = activeState();
    state = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1,
      segment: makeDrop({ id: 200 }),
    });
    state = sessionReducer(state, {
      type: 'COMMIT_DROP_WEIGHT', setId: 1, segmentId: 200, raw: '35',
    });
    expect(state.dropsBySet[1][0].weight).toBe(35);
    expect(state.dropsBySet[1][0].reps).toBe(10); // unchanged
  });

  test('COMMIT_DROP_REPS updates reps', () => {
    let state = activeState();
    state = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1,
      segment: makeDrop({ id: 200 }),
    });
    state = sessionReducer(state, {
      type: 'COMMIT_DROP_REPS', setId: 1, segmentId: 200, raw: '20',
    });
    expect(state.dropsBySet[1][0].reps).toBe(20);
    expect(state.dropsBySet[1][0].weight).toBe(40); // unchanged
  });

  test('empty drop weight → 0', () => {
    let state = activeState();
    state = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1,
      segment: makeDrop({ id: 200 }),
    });
    state = sessionReducer(state, {
      type: 'COMMIT_DROP_WEIGHT', setId: 1, segmentId: 200, raw: '',
    });
    expect(state.dropsBySet[1][0].weight).toBe(0);
  });

  test('DELETE_DROP_SEGMENT removes segment', () => {
    let state = activeState();
    state = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1,
      segment: makeDrop({ id: 200 }),
    });
    state = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1,
      segment: makeDrop({ id: 201, segment_index: 2 }),
    });
    state = sessionReducer(state, {
      type: 'DELETE_DROP_SEGMENT', setId: 1, segmentId: 200,
    });
    expect(state.dropsBySet[1]).toHaveLength(1);
    expect(state.dropsBySet[1][0].id).toBe(201);
  });

  test('delete drop from non-existent setId is a no-op', () => {
    const state = activeState();
    const result = sessionReducer(state, {
      type: 'DELETE_DROP_SEGMENT', setId: 999, segmentId: 1,
    });
    expect(result).toEqual(state);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  8. NOTES
 * ═══════════════════════════════════════════════════════════ */

describe('SAVE_NOTES', () => {
  test('saves notes text', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'SAVE_NOTES', text: 'Felt strong today' });
    expect(result.sessionNotes).toBe('Felt strong today');
  });

  test('empty notes', () => {
    const state = activeState({ sessionNotes: 'stuff' });
    const result = sessionReducer(state, { type: 'SAVE_NOTES', text: '' });
    expect(result.sessionNotes).toBe('');
  });
});

/* ═══════════════════════════════════════════════════════════
 *  9. SET_PHASE
 * ═══════════════════════════════════════════════════════════ */

describe('SET_PHASE', () => {
  test('transitions phase correctly', () => {
    let state = activeState();
    state = sessionReducer(state, { type: 'SET_PHASE', phase: 'finishing' });
    expect(state.phase).toBe('finishing');
    state = sessionReducer(state, { type: 'SET_PHASE', phase: 'idle' });
    expect(state.phase).toBe('idle');
  });
});

/* ═══════════════════════════════════════════════════════════
 *  10. DERIVED VALUES (volume, counts)
 * ═══════════════════════════════════════════════════════════ */

describe('Derived values: totalSets, completedSets, totalVolume', () => {
  test('all incomplete → 0 volume, 0 completed', () => {
    const state = activeState();
    const d = computeDerived(state);
    expect(d.totalSets).toBe(5); // 3 bench + 2 squat
    expect(d.completedSets).toBe(0);
    expect(d.totalVolume).toBe(0);
  });

  test('one completed set → correct volume', () => {
    let state = activeState();
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 100 });
    const d = computeDerived(state);
    expect(d.completedSets).toBe(1);
    expect(d.totalVolume).toBe(60 * 8); // 480
  });

  test('volume includes drop-set segments', () => {
    let state = activeState();
    state = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1,
      segment: makeDrop({ id: 200, weight: 40, reps: 12 }),
    });
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 100 });
    const d = computeDerived(state);
    expect(d.totalVolume).toBe(60 * 8 + 40 * 12); // 480 + 480 = 960
  });

  test('incomplete sets with drops do not count toward volume', () => {
    let state = activeState();
    state = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1,
      segment: makeDrop({ id: 200, weight: 40, reps: 12 }),
    });
    // set 1 not completed
    const d = computeDerived(state);
    expect(d.totalVolume).toBe(0);
  });

  test('completing all sets gives full volume', () => {
    let state = activeState();
    // Complete all bench sets
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 100 });
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 2, choiceId: 100 });
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 3, choiceId: 100 });
    // Complete all squat sets
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 4, choiceId: 101 });
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 5, choiceId: 101 });

    const d = computeDerived(state);
    expect(d.totalSets).toBe(5);
    expect(d.completedSets).toBe(5);
    // 3 × (60 × 8) + 2 × (100 × 5) = 1440 + 1000 = 2440
    expect(d.totalVolume).toBe(2440);
  });

  test('REGRESSION: volume correct after weight edit + complete', () => {
    let state = activeState();
    state = sessionReducer(state, {
      type: 'COMMIT_WEIGHT', setId: 3, choiceId: 100, raw: '65',
    });
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 3, choiceId: 100 });
    const d = computeDerived(state);
    expect(d.totalVolume).toBe(65 * 8); // 520, not 0
  });
});

/* ═══════════════════════════════════════════════════════════
 *  11. COMPLEX MULTI-ACTION SEQUENCES
 * ═══════════════════════════════════════════════════════════ */

describe('Multi-action sequences', () => {
  test('full workout flow: edit weights → complete all → verify', () => {
    let state = activeState();

    // Edit all bench weights
    state = sessionReducer(state, { type: 'COMMIT_WEIGHT', setId: 1, choiceId: 100, raw: '62.5' });
    state = sessionReducer(state, { type: 'COMMIT_REPS', setId: 1, choiceId: 100, raw: '8' });
    state = sessionReducer(state, { type: 'CYCLE_RPE', setId: 1, choiceId: 100 }); // null → 6

    state = sessionReducer(state, { type: 'COMMIT_WEIGHT', setId: 2, choiceId: 100, raw: '62.5' });
    state = sessionReducer(state, { type: 'COMMIT_REPS', setId: 2, choiceId: 100, raw: '7' });

    state = sessionReducer(state, { type: 'COMMIT_WEIGHT', setId: 3, choiceId: 100, raw: '60' });
    state = sessionReducer(state, { type: 'COMMIT_REPS', setId: 3, choiceId: 100, raw: '6' });

    // Complete all bench
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 100 });
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 2, choiceId: 100 });
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 3, choiceId: 100 });

    const bench = state.setsByChoice[100];
    expect(bench[0]).toMatchObject({ weight: 62.5, reps: 8, rpe: 6, completed: true });
    expect(bench[1]).toMatchObject({ weight: 62.5, reps: 7, completed: true });
    expect(bench[2]).toMatchObject({ weight: 60, reps: 6, completed: true });

    // Squat still untouched
    expect(state.setsByChoice[101].every((s) => !s.completed)).toBe(true);
  });

  test('delete set mid-workout does not corrupt other sets', () => {
    let state = activeState();

    // Complete set 1
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 100 });
    // Delete set 2
    state = sessionReducer(state, { type: 'DELETE_SET', choiceId: 100, setIndex: 2 });
    // Set 3 should still be there with original values
    const remaining = state.setsByChoice[100];
    expect(remaining).toHaveLength(2);
    expect(remaining.find((s) => s.id === 1)?.completed).toBe(true);
    expect(remaining.find((s) => s.id === 3)?.weight).toBe(60);
  });

  test('add drops → edit drops → complete → verify volume', () => {
    let state = activeState();

    // Add 2 drops to set 1
    state = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1,
      segment: makeDrop({ id: 200, segment_index: 1, weight: 40, reps: 12 }),
    });
    state = sessionReducer(state, {
      type: 'ADD_DROP_SEGMENT', setId: 1,
      segment: makeDrop({ id: 201, segment_index: 2, weight: 30, reps: 15 }),
    });

    // Edit drop weight
    state = sessionReducer(state, {
      type: 'COMMIT_DROP_WEIGHT', setId: 1, segmentId: 200, raw: '45',
    });

    // Complete set 1
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 100 });

    const d = computeDerived(state);
    // Main set: 60×8 = 480, Drop 1: 45×12 = 540, Drop 2: 30×15 = 450
    expect(d.totalVolume).toBe(480 + 540 + 450); // 1470
  });

  test('HYDRATE after RESET produces clean active state', () => {
    let state = activeState();
    state = sessionReducer(state, { type: 'COMPLETE_SET', setId: 1, choiceId: 100 });
    state = sessionReducer(state, { type: 'RESET' });

    // Re-hydrate with fresh data
    const freshPayload = activeState();
    state = sessionReducer(state, { type: 'HYDRATE', payload: freshPayload });
    
    expect(state.phase).toBe('active');
    expect(state.setsByChoice[100].every((s) => !s.completed)).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  12. UNKNOWN ACTION (defensive)
 * ═══════════════════════════════════════════════════════════ */

describe('Unknown action', () => {
  test('unrecognized action type returns state unchanged', () => {
    const state = activeState();
    const result = sessionReducer(state, { type: 'DOES_NOT_EXIST' } as any);
    expect(result).toEqual(state);
  });
});
