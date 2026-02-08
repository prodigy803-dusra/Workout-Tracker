import { executeSqlAsync } from './db';
import { normalizeName } from '../utils/normalize';

function now() {
  return new Date().toISOString();
}

export async function seedIfNeeded() {
  const exCount = await executeSqlAsync(`SELECT COUNT(*) as c FROM exercises;`);
  if (exCount.rows.item(0).c > 0) return;

  const exercises = [
    'Bench Press',
    'Incline Bench Press',
    'Squat',
    'Deadlift',
    'Overhead Press',
    'Barbell Row',
    'Pull Up',
    'Lat Pulldown',
    'Dumbbell Curl',
    'Triceps Pushdown',
  ];

  for (const name of exercises) {
    await executeSqlAsync(
      `INSERT INTO exercises(name, name_norm, created_at) VALUES (?,?,?);`,
      [name, normalizeName(name), now()]
    );
  }

  const exRes = await executeSqlAsync(`SELECT id, name FROM exercises;`);
  const exByName: Record<string, number> = {};
  for (let i = 0; i < exRes.rows.length; i += 1) {
    const row = exRes.rows.item(i);
    exByName[row.name] = row.id;
  }

  const variants = ['Barbell', 'Dumbbell'];
  for (const [exName, exId] of Object.entries(exByName)) {
    let order = 0;
    for (const v of variants) {
      await executeSqlAsync(
        `INSERT INTO exercise_options(exercise_id, name, name_norm, order_index, created_at)
         VALUES (?,?,?,?,?);`,
        [exId, v, normalizeName(v), order++, now()]
      );
    }
  }

  await executeSqlAsync(
    `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
    ['Bench Day', normalizeName('Bench Day'), now()]
  );
  const tRes = await executeSqlAsync(
    `SELECT id FROM templates WHERE name_norm=?;`,
    [normalizeName('Bench Day')]
  );
  const templateId = tRes.rows.item(0).id;

  await executeSqlAsync(
    `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
    [templateId, 1, 'Slot 1', now()]
  );
  await executeSqlAsync(
    `INSERT INTO template_slots(template_id, slot_index, name, created_at) VALUES (?,?,?,?);`,
    [templateId, 2, 'Slot 2', now()]
  );

  const slotRes = await executeSqlAsync(
    `SELECT id, slot_index FROM template_slots WHERE template_id=? ORDER BY slot_index;`,
    [templateId]
  );
  const slot1 = slotRes.rows.item(0).id;
  const slot2 = slotRes.rows.item(1).id;

  const bbOpt = await executeSqlAsync(
    `SELECT id FROM exercise_options WHERE name_norm=? LIMIT 1;`,
    [normalizeName('Barbell')]
  );
  const dbOpt = await executeSqlAsync(
    `SELECT id FROM exercise_options WHERE name_norm=? LIMIT 1;`,
    [normalizeName('Dumbbell')]
  );

  const benchId = exByName['Bench Press'];
  const inclineId = exByName['Incline Bench Press'];
  const squatId = exByName['Squat'];
  const deadId = exByName['Deadlift'];

  await executeSqlAsync(
    `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at)
     VALUES (?,?,?,?,?);`,
    [slot1, benchId, bbOpt.rows.item(0).id, 0, now()]
  );
  await executeSqlAsync(
    `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at)
     VALUES (?,?,?,?,?);`,
    [slot1, inclineId, bbOpt.rows.item(0).id, 1, now()]
  );
  await executeSqlAsync(
    `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at)
     VALUES (?,?,?,?,?);`,
    [slot1, benchId, dbOpt.rows.item(0).id, 2, now()]
  );

  await executeSqlAsync(
    `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at)
     VALUES (?,?,?,?,?);`,
    [slot2, squatId, bbOpt.rows.item(0).id, 0, now()]
  );
  await executeSqlAsync(
    `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at)
     VALUES (?,?,?,?,?);`,
    [slot2, deadId, bbOpt.rows.item(0).id, 1, now()]
  );

  const performedAt = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
  await executeSqlAsync(
    `INSERT INTO sessions(performed_at, notes, status, template_id, created_at)
     VALUES (?,?,?,?,?);`,
    [performedAt, 'Seed session', 'final', templateId, now()]
  );
  const sRes = await executeSqlAsync(
    `SELECT id FROM sessions ORDER BY id DESC LIMIT 1;`
  );
  const sessionId = sRes.rows.item(0).id;

  const tSlotRes = await executeSqlAsync(
    `SELECT id, slot_index FROM template_slots WHERE template_id=? ORDER BY slot_index;`,
    [templateId]
  );

  for (let i = 0; i < tSlotRes.rows.length; i += 1) {
    const tslot = tSlotRes.rows.item(i);
    await executeSqlAsync(
      `INSERT INTO session_slots(session_id, template_slot_id, slot_index, name, created_at)
       VALUES (?,?,?,?,?);`,
      [sessionId, tslot.id, tslot.slot_index, null, now()]
    );
    const ssRes = await executeSqlAsync(
      `SELECT id FROM session_slots ORDER BY id DESC LIMIT 1;`
    );
    const ssId = ssRes.rows.item(0).id;

    const optRes = await executeSqlAsync(
      `SELECT id FROM template_slot_options WHERE template_slot_id=? ORDER BY order_index LIMIT 1;`,
      [tslot.id]
    );
    const tcoId = optRes.rows.item(0).id;

    await executeSqlAsync(
      `INSERT INTO session_slot_choices(session_slot_id, template_slot_option_id, created_at)
       VALUES (?,?,?);`,
      [ssId, tcoId, now()]
    );
    const sscRes = await executeSqlAsync(
      `SELECT id FROM session_slot_choices ORDER BY id DESC LIMIT 1;`
    );
    const sscId = sscRes.rows.item(0).id;

    await executeSqlAsync(
      `UPDATE session_slots SET selected_session_slot_choice_id=? WHERE id=?;`,
      [sscId, ssId]
    );

    await executeSqlAsync(
      `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, created_at)
       VALUES (?,?,?,?,?,?,?);`,
      [sscId, 1, 80, 8, 8, null, now()]
    );
    await executeSqlAsync(
      `INSERT INTO sets(session_slot_choice_id, set_index, weight, reps, rpe, notes, created_at)
       VALUES (?,?,?,?,?,?,?);`,
      [sscId, 2, 80, 6, 8.5, null, now()]
    );
  }
}
