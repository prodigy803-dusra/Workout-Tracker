export const migrations: string[] = [
  `
  CREATE TABLE IF NOT EXISTS schema_migrations(
    version INTEGER PRIMARY KEY
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS exercises(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    name_norm TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS exercise_options(
    id INTEGER PRIMARY KEY,
    exercise_id INT NOT NULL,
    name TEXT NOT NULL,
    name_norm TEXT NOT NULL,
    order_index INT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(exercise_id, name_norm),
    FOREIGN KEY(exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS templates(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    name_norm TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS template_slots(
    id INTEGER PRIMARY KEY,
    template_id INT NOT NULL,
    slot_index INT NOT NULL,
    name TEXT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(template_id, slot_index),
    FOREIGN KEY(template_id) REFERENCES templates(id) ON DELETE CASCADE
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS template_slot_options(
    id INTEGER PRIMARY KEY,
    template_slot_id INT NOT NULL,
    exercise_id INT NOT NULL,
    exercise_option_id INT NULL,
    order_index INT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(template_slot_id, exercise_id, exercise_option_id),
    FOREIGN KEY(template_slot_id) REFERENCES template_slots(id) ON DELETE CASCADE,
    FOREIGN KEY(exercise_id) REFERENCES exercises(id),
    FOREIGN KEY(exercise_option_id) REFERENCES exercise_options(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS sessions(
    id INTEGER PRIMARY KEY,
    performed_at TEXT NOT NULL,
    notes TEXT NULL,
    status TEXT NOT NULL CHECK(status IN ('draft','final')),
    template_id INT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(template_id) REFERENCES templates(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS session_slots(
    id INTEGER PRIMARY KEY,
    session_id INT NOT NULL,
    template_slot_id INT NULL,
    slot_index INT NOT NULL,
    name TEXT NULL,
    selected_session_slot_choice_id INT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(template_slot_id) REFERENCES template_slots(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS session_slot_choices(
    id INTEGER PRIMARY KEY,
    session_slot_id INT NOT NULL,
    template_slot_option_id INT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(session_slot_id, template_slot_option_id),
    FOREIGN KEY(session_slot_id) REFERENCES session_slots(id) ON DELETE CASCADE,
    FOREIGN KEY(template_slot_option_id) REFERENCES template_slot_options(id) ON DELETE CASCADE
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS sets(
    id INTEGER PRIMARY KEY,
    session_slot_choice_id INT NOT NULL,
    set_index INT NOT NULL,
    weight REAL NOT NULL,
    reps INT NOT NULL,
    rpe REAL NULL,
    notes TEXT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(session_slot_choice_id, set_index),
    FOREIGN KEY(session_slot_choice_id) REFERENCES session_slot_choices(id) ON DELETE CASCADE
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS app_settings(
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_sessions_status_date ON sessions(status, performed_at);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_session_slots_session ON session_slots(session_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_sets_choice ON sets(session_slot_choice_id);
  `,
  `
  CREATE TABLE IF NOT EXISTS template_prescribed_sets(
    id INTEGER PRIMARY KEY,
    template_slot_option_id INT NOT NULL,
    set_index INT NOT NULL,
    weight REAL NULL,
    reps INT NULL,
    rpe REAL NULL,
    notes TEXT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(template_slot_option_id, set_index),
    FOREIGN KEY(template_slot_option_id) REFERENCES template_slot_options(id) ON DELETE CASCADE
  );
  `,
  `
  DROP TABLE IF EXISTS template_prescribed_sets;
  `,
  `
  CREATE TABLE IF NOT EXISTS template_prescribed_sets(
    id INTEGER PRIMARY KEY,
    template_slot_id INT NOT NULL,
    set_index INT NOT NULL,
    weight REAL NULL,
    reps INT NULL,
    rpe REAL NULL,
    notes TEXT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(template_slot_id, set_index),
    FOREIGN KEY(template_slot_id) REFERENCES template_slots(id) ON DELETE CASCADE
  );
  `,
  `
  ALTER TABLE sets ADD COLUMN completed INT NOT NULL DEFAULT 0;
  `,
  `
  ALTER TABLE template_prescribed_sets ADD COLUMN rest_seconds INT NULL;
  `,
  `
  ALTER TABLE sets ADD COLUMN rest_seconds INT NULL;
  `,
];
