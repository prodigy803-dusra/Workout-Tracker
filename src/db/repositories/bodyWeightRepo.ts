/**
 * Body weight repository — manages body weight log entries.
 */
import { executeSqlAsync } from '../db';
import type { BodyWeightEntry } from '../../types';

/** Log a new body weight entry. */
export async function logBodyWeight(weight: number, unit: string): Promise<void> {
  const now = new Date().toISOString();
  await executeSqlAsync(
    `INSERT INTO body_weight(weight, unit, measured_at) VALUES (?,?,?);`,
    [weight, unit, now]
  );
}

/** Get all body weight entries, newest first. */
export async function listBodyWeights(): Promise<BodyWeightEntry[]> {
  const res = await executeSqlAsync(
    `SELECT * FROM body_weight ORDER BY measured_at DESC;`
  );
  return res.rows._array;
}

/** Get body weight data for a trend chart (oldest first). */
export async function bodyWeightTrend(): Promise<Array<{ date: string; value: number }>> {
  const res = await executeSqlAsync(
    `SELECT measured_at as date, weight as value FROM body_weight ORDER BY measured_at ASC;`
  );
  return res.rows._array;
}

/** Get the most recent body weight. */
export async function latestBodyWeight(): Promise<BodyWeightEntry | null> {
  const res = await executeSqlAsync(
    `SELECT * FROM body_weight ORDER BY measured_at DESC LIMIT 1;`
  );
  return res.rows.length > 0 ? res.rows.item(0) : null;
}

/** Delete a body weight entry by ID. */
export async function deleteBodyWeight(id: number): Promise<void> {
  await executeSqlAsync(`DELETE FROM body_weight WHERE id=?;`, [id]);
}
