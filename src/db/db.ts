/**
 * Database layer — wraps expo-sqlite with a simple async API.
 *
 * Provides:
 * - `executeSqlAsync()` — run any SQL statement
 * - `initDb()`          — run migrations + seed data
 * - `resetDb()`         — drop all tables and re-initialise
 * - `db`                — raw expo-sqlite handle (for transactions)
 */
import { openDatabaseSync } from 'expo-sqlite';
import { migrations } from './migrations';

const DB_NAME = 'workout.db';
const db = openDatabaseSync(DB_NAME);

// Enable foreign key enforcement — required for ON DELETE CASCADE to work
db.execSync('PRAGMA foreign_keys = ON;');
// Enable WAL mode for better concurrent read/write performance on mobile
db.execSync('PRAGMA journal_mode = WAL;');

type RowsWrapper<T = any> = {
  length: number;
  item: (index: number) => T;
  _array: T[];
};

type SQLResult = {
  rows: RowsWrapper;
};

function wrapRows<T>(rows: T[]): RowsWrapper<T> {
  return {
    length: rows.length,
    item: (i: number) => rows[i],
    _array: rows,
  };
}

/**
 * Execute a SQL statement and return the result.
 * SELECT / PRAGMA queries return rows; other statements return an empty row set.
 */
export async function executeSqlAsync(
  sql: string,
  params: (string | number | null)[] = []
): Promise<SQLResult> {
  const trimmed = sql.trim().toLowerCase();
  const isSelect =
    trimmed.startsWith('select') || trimmed.startsWith('pragma');
  if (isSelect) {
    const rows = await db.getAllAsync(sql, params);
    return { rows: wrapRows(rows as any[]) };
  }
  await db.runAsync(sql, params);
  return { rows: wrapRows([]) };
}

/**
 * Get the rowid of the last INSERT.  Must be called immediately after the
 * INSERT on the same connection — safe inside transactions.
 */
export async function lastInsertRowId(): Promise<number> {
  const res = await db.getAllAsync('SELECT last_insert_rowid() as id;');
  return (res[0] as any).id;
}

/** Initialise the database: run pending migrations then seed default data. */
export async function initDb() {
  await runMigrations();
  await cleanupOrphans();
  const { seedIfNeeded } = await import('./seed');
  await seedIfNeeded();
}

async function runMigrations() {
  await executeSqlAsync(
    `CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY);`
  );

  const res = await executeSqlAsync(
    `SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;`
  );
  const currentVersion = res.rows.length ? res.rows.item(0).version : 0;

  for (let i = currentVersion; i < migrations.length; i += 1) {
    const sql = migrations[i];
    await db.withTransactionAsync(async () => {
      await executeSqlAsync(sql);
      await executeSqlAsync(
        `INSERT INTO schema_migrations(version) VALUES (?);`,
        [i + 1]
      );
    });
  }
}

/**
 * Clean up orphaned rows left behind from before PRAGMA foreign_keys was enabled.
 * Runs on every init but is cheap (deletes nothing if no orphans exist).
 */
async function cleanupOrphans() {
  // Orphaned session_slots (session deleted but slots remained)
  await executeSqlAsync(
    `DELETE FROM session_slots WHERE session_id NOT IN (SELECT id FROM sessions);`
  );
  // Orphaned session_slot_choices
  await executeSqlAsync(
    `DELETE FROM session_slot_choices WHERE session_slot_id NOT IN (SELECT id FROM session_slots);`
  );
  // Orphaned sets
  await executeSqlAsync(
    `DELETE FROM sets WHERE session_slot_choice_id NOT IN (SELECT id FROM session_slot_choices);`
  );
  // Orphaned template_slot_options
  await executeSqlAsync(
    `DELETE FROM template_slot_options WHERE template_slot_id NOT IN (SELECT id FROM template_slots);`
  );
  // Orphaned template_prescribed_sets
  await executeSqlAsync(
    `DELETE FROM template_prescribed_sets WHERE template_slot_id NOT IN (SELECT id FROM template_slots);`
  );
  // Orphaned drop_set_segments
  await executeSqlAsync(
    `DELETE FROM drop_set_segments WHERE set_id NOT IN (SELECT id FROM sets);`
  ).catch(() => { /* table may not exist yet */ });
}

/** Drop every table and re-initialise from scratch (migrations + seed). */
export async function resetDb() {
  const tables = [
    'drop_set_segments',
    'sets',
    'session_slot_choices',
    'session_slots',
    'sessions',
    'template_prescribed_sets',
    'template_slot_options',
    'template_slots',
    'templates',
    'exercise_options',
    'exercises',
    'personal_records',
    'body_weight',
    'schema_migrations',
    'app_settings',
  ];
  for (const t of tables) {
    await executeSqlAsync(`DROP TABLE IF EXISTS ${t};`);
  }
  await initDb();
}

export { db };
