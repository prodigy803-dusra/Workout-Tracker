/**
 * injuryRepo — CRUD for the active_injuries table.
 *
 * Manages injury records for the injury-awareness feature.
 * Active injuries (resolved_at IS NULL) affect workout suggestions,
 * weight pre-fill, and summary screen deltas.
 */
import { executeSqlAsync, lastInsertRowId } from '../db';
import type { Severity, InjuryType } from '../../data/injuryRegionMap';

/* ── Types ──────────────────────────────────────────────── */

export type Injury = {
  id: number;
  body_region: string;
  injury_type: InjuryType;
  severity: Severity;
  notes: string | null;
  started_at: string;
  resolved_at: string | null;
  created_at: string;
};

/* ── Read ───────────────────────────────────────────────── */

/** List only active (unresolved) injuries. */
export async function listActiveInjuries(): Promise<Injury[]> {
  const res = await executeSqlAsync(
    `SELECT * FROM active_injuries WHERE resolved_at IS NULL ORDER BY started_at DESC;`
  );
  return res.rows._array;
}

/** List all injuries (active + resolved), newest first. */
export async function listAllInjuries(): Promise<Injury[]> {
  const res = await executeSqlAsync(
    `SELECT * FROM active_injuries ORDER BY resolved_at IS NULL DESC, started_at DESC;`
  );
  return res.rows._array;
}

/** Get a single injury by ID. */
export async function getInjury(id: number): Promise<Injury | null> {
  const res = await executeSqlAsync(
    `SELECT * FROM active_injuries WHERE id = ?;`,
    [id]
  );
  return res.rows.length ? res.rows.item(0) : null;
}

/* ── Write ──────────────────────────────────────────────── */

/** Add a new active injury. */
export async function addInjury(
  bodyRegion: string,
  injuryType: InjuryType,
  severity: Severity,
  notes: string | null,
  startedAt?: string,
): Promise<number> {
  const now = new Date().toISOString();
  await executeSqlAsync(
    `INSERT INTO active_injuries(body_region, injury_type, severity, notes, started_at, created_at)
     VALUES (?,?,?,?,?,?);`,
    [bodyRegion, injuryType, severity, notes, startedAt ?? now, now]
  );
  return lastInsertRowId();
}

/** Update an existing injury's details. */
export async function updateInjury(
  id: number,
  bodyRegion: string,
  injuryType: InjuryType,
  severity: Severity,
  notes: string | null,
): Promise<void> {
  await executeSqlAsync(
    `UPDATE active_injuries SET body_region=?, injury_type=?, severity=?, notes=? WHERE id=?;`,
    [bodyRegion, injuryType, severity, notes, id]
  );
}

/** Mark an injury as resolved (healed). */
export async function resolveInjury(id: number): Promise<void> {
  await executeSqlAsync(
    `UPDATE active_injuries SET resolved_at=? WHERE id=?;`,
    [new Date().toISOString(), id]
  );
}

/** Re-activate a previously resolved injury. */
export async function reactivateInjury(id: number): Promise<void> {
  await executeSqlAsync(
    `UPDATE active_injuries SET resolved_at=NULL WHERE id=?;`,
    [id]
  );
}

/** Permanently delete an injury record. */
export async function deleteInjury(id: number): Promise<void> {
  await executeSqlAsync(
    `DELETE FROM active_injuries WHERE id=?;`,
    [id]
  );
}
