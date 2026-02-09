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

/** Initialise the database: run pending migrations then seed default data. */
export async function initDb() {
  await runMigrations();
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

/** Drop every table and re-initialise from scratch (migrations + seed). */
export async function resetDb() {
  const tables = [
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
