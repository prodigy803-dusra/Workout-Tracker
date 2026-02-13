/**
 * useSessionStore — central state + reducer for the active workout session.
 *
 * Architecture rule §1: SQLite is the single source of truth.
 * This hook owns the in-memory working copy and syncs to DB on commit points.
 *
 * Architecture rule §3: User actions dispatch named events.
 * Side effects (DB writes, timer, navigation) are handled by the caller
 * after dispatching, not inside the reducer.
 */
import { useReducer, useCallback } from 'react';
import { executeSqlAsync } from '../db/db';
import {
  getActiveDraft,
  listDraftSlots,
  listSlotOptions,
  selectSlotChoice,
  discardDraft,
  finalizeSession,
} from '../db/repositories/sessionsRepo';
import {
  listSetsForChoice,
  toggleSetCompleted,
  upsertSet,
  lastTimeForOption,
  deleteSet,
  generateWarmupSets,
  addDropSegment,
  updateDropSegment,
  deleteDropSegment,
} from '../db/repositories/setsRepo';
import { detectAndRecordPRs } from '../db/repositories/statsRepo';
import type {
  Session,
  DraftSlot,
  SlotOption,
  SetData,
  LastTimeData,
} from '../types';

/* ═══════════════════════════════════════════════════════════
 *  Types
 * ═══════════════════════════════════════════════════════════ */

export type DropSegment = {
  id: number;
  segment_index: number;
  weight: number;
  reps: number;
};

export type SessionState = {
  phase: 'idle' | 'active' | 'finishing';
  draft: Session | null;
  slots: DraftSlot[];
  optionsBySlot: Record<number, SlotOption[]>;
  setsByChoice: Record<number, SetData[]>;
  dropsBySet: Record<number, DropSegment[]>;
  lastTimeBySlot: Record<number, LastTimeData>;
  sessionNotes: string;
};

export type SessionAction =
  | { type: 'HYDRATE'; payload: SessionState }
  | { type: 'RESET' }
  | { type: 'COMPLETE_SET'; setId: number; choiceId: number }
  | { type: 'UNCOMPLETE_SET'; setId: number; choiceId: number }
  | { type: 'COMMIT_WEIGHT'; setId: number; choiceId: number; raw: string }
  | { type: 'COMMIT_REPS'; setId: number; choiceId: number; raw: string }
  | { type: 'CYCLE_RPE'; setId: number; choiceId: number }
  | { type: 'DELETE_SET'; choiceId: number; setIndex: number }
  | { type: 'ADD_DROP_SEGMENT'; setId: number; segment: DropSegment }
  | { type: 'COMMIT_DROP_WEIGHT'; setId: number; segmentId: number; raw: string }
  | { type: 'COMMIT_DROP_REPS'; setId: number; segmentId: number; raw: string }
  | { type: 'DELETE_DROP_SEGMENT'; setId: number; segmentId: number }
  | { type: 'SAVE_NOTES'; text: string }
  | { type: 'SET_PHASE'; phase: 'idle' | 'active' | 'finishing' };

/* ═══════════════════════════════════════════════════════════
 *  Initial state
 * ═══════════════════════════════════════════════════════════ */

const INITIAL_STATE: SessionState = {
  phase: 'idle',
  draft: null,
  slots: [],
  optionsBySlot: {},
  setsByChoice: {},
  dropsBySet: {},
  lastTimeBySlot: {},
  sessionNotes: '',
};

/* ═══════════════════════════════════════════════════════════
 *  Helpers
 * ═══════════════════════════════════════════════════════════ */

const RPE_ORDER: (number | null)[] = [null, 6, 7, 8, 9, 10];

function updateSetInChoice(
  state: SessionState,
  choiceId: number,
  setId: number,
  updater: (s: SetData) => SetData,
): SessionState {
  const sets = state.setsByChoice[choiceId];
  if (!sets) return state;
  return {
    ...state,
    setsByChoice: {
      ...state.setsByChoice,
      [choiceId]: sets.map((s) => (s.id === setId ? updater(s) : s)),
    },
  };
}

/* ═══════════════════════════════════════════════════════════
 *  Reducer — pure function, NO side effects
 * ═══════════════════════════════════════════════════════════ */

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...action.payload };

    case 'RESET':
      return { ...INITIAL_STATE };

    case 'COMPLETE_SET':
      return updateSetInChoice(state, action.choiceId, action.setId, (s) => ({
        ...s,
        completed: true,
      }));

    case 'UNCOMPLETE_SET':
      return updateSetInChoice(state, action.choiceId, action.setId, (s) => ({
        ...s,
        completed: false,
      }));

    case 'COMMIT_WEIGHT': {
      const weight = action.raw === '' ? 0 : (parseFloat(action.raw) || 0);
      return updateSetInChoice(state, action.choiceId, action.setId, (s) => ({
        ...s,
        weight,
      }));
    }

    case 'COMMIT_REPS': {
      const reps = action.raw === '' ? 0 : (parseInt(action.raw, 10) || 0);
      return updateSetInChoice(state, action.choiceId, action.setId, (s) => ({
        ...s,
        reps,
      }));
    }

    case 'CYCLE_RPE':
      return updateSetInChoice(state, action.choiceId, action.setId, (s) => {
        const idx = RPE_ORDER.indexOf(s.rpe);
        const nextRpe = RPE_ORDER[(idx + 1) % RPE_ORDER.length];
        return { ...s, rpe: nextRpe };
      });

    case 'DELETE_SET': {
      const sets = state.setsByChoice[action.choiceId];
      if (!sets) return state;
      return {
        ...state,
        setsByChoice: {
          ...state.setsByChoice,
          [action.choiceId]: sets.filter((s) => s.set_index !== action.setIndex),
        },
      };
    }

    case 'ADD_DROP_SEGMENT': {
      const existing = state.dropsBySet[action.setId] || [];
      return {
        ...state,
        dropsBySet: {
          ...state.dropsBySet,
          [action.setId]: [...existing, action.segment],
        },
      };
    }

    case 'COMMIT_DROP_WEIGHT': {
      const drops = state.dropsBySet[action.setId];
      if (!drops) return state;
      const weight = action.raw === '' ? 0 : (parseFloat(action.raw) || 0);
      return {
        ...state,
        dropsBySet: {
          ...state.dropsBySet,
          [action.setId]: drops.map((d) =>
            d.id === action.segmentId ? { ...d, weight } : d,
          ),
        },
      };
    }

    case 'COMMIT_DROP_REPS': {
      const drops = state.dropsBySet[action.setId];
      if (!drops) return state;
      const reps = action.raw === '' ? 0 : (parseInt(action.raw, 10) || 0);
      return {
        ...state,
        dropsBySet: {
          ...state.dropsBySet,
          [action.setId]: drops.map((d) =>
            d.id === action.segmentId ? { ...d, reps } : d,
          ),
        },
      };
    }

    case 'DELETE_DROP_SEGMENT': {
      const drops = state.dropsBySet[action.setId];
      if (!drops) return state;
      return {
        ...state,
        dropsBySet: {
          ...state.dropsBySet,
          [action.setId]: drops.filter((d) => d.id !== action.segmentId),
        },
      };
    }

    case 'SAVE_NOTES':
      return { ...state, sessionNotes: action.text };

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    default:
      return state;
  }
}

/* ═══════════════════════════════════════════════════════════
 *  Hook — wraps reducer + provides DB-sync helpers
 * ═══════════════════════════════════════════════════════════ */

/* Exported for unit testing */
export { sessionReducer, INITIAL_STATE };

export function useSessionStore() {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_STATE);

  /**
   * Hydrate the store from SQLite.
   * Called on mount, focus, and after operations that change DB structure
   * (start session, select choice, generate warmups, etc.)
   */
  const hydrate = useCallback(async () => {
    const d = await getActiveDraft();
    if (!d) {
      dispatch({ type: 'RESET' });
      return;
    }

    const slotRows = await listDraftSlots(d.id);

    // Options per slot
    const optionsEntries: (readonly [number, Awaited<ReturnType<typeof listSlotOptions>>])[] = [];
    for (const s of slotRows) {
      const opts = await listSlotOptions(s.session_slot_id);
      optionsEntries.push([s.session_slot_id, opts] as const);
    }
    const optionsBySlot = Object.fromEntries(optionsEntries);

    // Batch-load all sets
    const choiceIds = slotRows
      .map((s) => s.selected_session_slot_choice_id)
      .filter((id): id is number => id != null);

    const setsMap: Record<number, SetData[]> = {};
    if (choiceIds.length > 0) {
      const placeholders = choiceIds.map(() => '?').join(',');
      const allSetsRes = await executeSqlAsync(
        `SELECT * FROM sets WHERE session_slot_choice_id IN (${placeholders}) ORDER BY session_slot_choice_id, set_index;`,
        choiceIds,
      );
      for (const row of allSetsRes.rows._array) {
        const cid = row.session_slot_choice_id;
        if (!setsMap[cid]) setsMap[cid] = [];
        setsMap[cid].push({
          id: row.id,
          set_index: row.set_index,
          weight: row.weight,
          reps: row.reps,
          rpe: row.rpe,
          rest_seconds: row.rest_seconds,
          completed: !!row.completed,
        });
      }
    }

    // Batch-load drop-set segments
    const allSetIds = Object.values(setsMap).flat().map((s) => s.id);
    let dropsMap: Record<number, DropSegment[]> = {};
    if (allSetIds.length > 0) {
      const setPlaceholders = allSetIds.map(() => '?').join(',');
      const dropsRes = await executeSqlAsync(
        `SELECT id, set_id, segment_index, weight, reps
         FROM drop_set_segments
         WHERE set_id IN (${setPlaceholders})
         ORDER BY set_id, segment_index;`,
        allSetIds,
      ).catch(() => ({ rows: { _array: [] as any[] } }));
      for (const row of dropsRes.rows._array) {
        if (!dropsMap[row.set_id]) dropsMap[row.set_id] = [];
        dropsMap[row.set_id].push({
          id: row.id,
          segment_index: row.segment_index,
          weight: row.weight,
          reps: row.reps,
        });
      }
    }

    // Last-time data per slot
    const lastTimeEntries: (readonly [number, Awaited<ReturnType<typeof lastTimeForOption>>])[] = [];
    for (const s of slotRows) {
      if (s.template_slot_option_id != null) {
        const lt = await lastTimeForOption(s.template_slot_option_id);
        lastTimeEntries.push([s.session_slot_id, lt] as const);
      }
    }
    const lastTimeBySlot = Object.fromEntries(lastTimeEntries);

    dispatch({
      type: 'HYDRATE',
      payload: {
        phase: 'active',
        draft: d,
        slots: slotRows,
        optionsBySlot,
        setsByChoice: setsMap,
        dropsBySet: dropsMap,
        lastTimeBySlot,
        sessionNotes: d.notes || '',
      },
    });
  }, []);

  /* ── DB-sync helpers (called by components after dispatch) ── */

  const persistSetCompletion = useCallback(
    async (setId: number, completed: boolean) => {
      await toggleSetCompleted(setId, completed);
    },
    [],
  );

  const persistSet = useCallback(
    async (choiceId: number, setIndex: number, weight: number, reps: number, rpe: number | null, restSeconds: number | null) => {
      await upsertSet(choiceId, setIndex, weight, reps, rpe, null, restSeconds);
    },
    [],
  );

  const persistDeleteSet = useCallback(
    async (choiceId: number, setIndex: number) => {
      await deleteSet(choiceId, setIndex);
    },
    [],
  );

  const persistSelectChoice = useCallback(
    async (sessionSlotId: number, templateSlotOptionId: number) => {
      await selectSlotChoice(sessionSlotId, templateSlotOptionId);
    },
    [],
  );

  const persistNotes = useCallback(
    async (sessionId: number, notes: string) => {
      await executeSqlAsync(
        `UPDATE sessions SET notes=? WHERE id=?;`,
        [notes || null, sessionId],
      ).catch(() => {});
    },
    [],
  );

  const persistFinish = useCallback(
    async (sessionId: number, notes: string) => {
      await executeSqlAsync(
        `UPDATE sessions SET notes=? WHERE id=?;`,
        [notes || null, sessionId],
      ).catch(() => {});
      await finalizeSession(sessionId);
      const prs = await detectAndRecordPRs(sessionId);
      return prs;
    },
    [],
  );

  const persistDiscard = useCallback(async (sessionId: number) => {
    await discardDraft(sessionId);
  }, []);

  const persistDropSegment = useCallback(
    async (setId: number, segmentIndex: number, weight: number, reps: number) => {
      await addDropSegment(setId, segmentIndex, weight, reps);
    },
    [],
  );

  const persistUpdateDrop = useCallback(
    async (segmentId: number, weight: number, reps: number) => {
      await updateDropSegment(segmentId, weight, reps);
    },
    [],
  );

  const persistDeleteDrop = useCallback(async (segmentId: number) => {
    await deleteDropSegment(segmentId);
  }, []);

  const persistGenerateWarmups = useCallback(
    async (choiceId: number, workingWeight: number, unit: 'kg' | 'lb') => {
      await generateWarmupSets(choiceId, workingWeight, unit);
    },
    [],
  );

  return {
    state,
    dispatch,
    hydrate,
    // DB persistence
    persistSetCompletion,
    persistSet,
    persistDeleteSet,
    persistSelectChoice,
    persistNotes,
    persistFinish,
    persistDiscard,
    persistDropSegment,
    persistUpdateDrop,
    persistDeleteDrop,
    persistGenerateWarmups,
  };
}
