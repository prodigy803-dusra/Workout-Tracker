import { executeSqlAsync } from '../db';
import { normalizeName } from '../../utils/normalize';

function now() {
  return new Date().toISOString();
}

export async function listTemplates() {
  const res = await executeSqlAsync(
    `SELECT id, name FROM templates ORDER BY name;`
  );
  return res.rows._array;
}

export async function getTemplate(templateId: number) {
  const t = await executeSqlAsync(
    `SELECT id, name FROM templates WHERE id=?;`,
    [templateId]
  );
  const slots = await executeSqlAsync(
    `SELECT id, slot_index, name FROM template_slots
     WHERE template_id=? ORDER BY slot_index;`,
    [templateId]
  );
  const slotRows = slots.rows._array;

  if (slotRows.length === 0) {
    return { template: t.rows.item(0), slots: [], options: [] };
  }

  const options = await executeSqlAsync(
    `SELECT tco.id, tco.template_slot_id, tco.order_index, e.name as exercise_name,
            eo.name as option_name, e.id as exercise_id, eo.id as exercise_option_id
     FROM template_slot_options tco
     JOIN exercises e ON e.id = tco.exercise_id
     LEFT JOIN exercise_options eo ON eo.id = tco.exercise_option_id
     WHERE tco.template_slot_id IN (${slotRows.map(() => '?').join(',')})
     ORDER BY tco.template_slot_id, tco.order_index;`,
    slotRows.map((s) => s.id)
  );

  return {
    template: t.rows.item(0),
    slots: slotRows,
    options: options.rows._array,
  };
}

export async function createTemplate(name: string) {
  await executeSqlAsync(
    `INSERT INTO templates(name, name_norm, created_at) VALUES (?,?,?);`,
    [name, normalizeName(name), now()]
  );
}

export async function addSlot(
  templateId: number,
  slotIndex: number,
  name: string | null
) {
  await executeSqlAsync(
    `INSERT INTO template_slots(template_id, slot_index, name, created_at)
     VALUES (?,?,?,?);`,
    [templateId, slotIndex, name, now()]
  );
}

export async function updateSlotName(slotId: number, name: string | null) {
  await executeSqlAsync(
    `UPDATE template_slots SET name=? WHERE id=?;`,
    [name, slotId]
  );
}

export async function deleteSlot(slotId: number) {
  await executeSqlAsync(`DELETE FROM template_slots WHERE id=?;`, [slotId]);
}

export async function addTemplateSlotOption(
  templateSlotId: number,
  exerciseId: number,
  exerciseOptionId: number | null,
  orderIndex: number
) {
  await executeSqlAsync(
    `INSERT INTO template_slot_options(template_slot_id, exercise_id, exercise_option_id, order_index, created_at)
     VALUES (?,?,?,?,?);`,
    [templateSlotId, exerciseId, exerciseOptionId, orderIndex, now()]
  );
}

export async function deleteTemplateSlotOption(id: number) {
  await executeSqlAsync(`DELETE FROM template_slot_options WHERE id=?;`, [id]);
}

export async function deleteTemplate(templateId: number) {
  await executeSqlAsync(`DELETE FROM templates WHERE id=?;`, [templateId]);
}

export async function listPrescribedSets(templateSlotId: number) {
  const res = await executeSqlAsync(
    `SELECT * FROM template_prescribed_sets
     WHERE template_slot_id=? ORDER BY set_index;`,
    [templateSlotId]
  );
  return res.rows._array;
}

export async function upsertPrescribedSet(
  templateSlotId: number,
  setIndex: number,
  weight: number | null,
  reps: number | null,
  rpe: number | null,
  notes: string | null,
  restSeconds: number | null
) {
  await executeSqlAsync(
    `INSERT INTO template_prescribed_sets(template_slot_id, set_index, weight, reps, rpe, notes, rest_seconds, created_at)
     VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(template_slot_id, set_index)
     DO UPDATE SET weight=excluded.weight, reps=excluded.reps, rpe=excluded.rpe, notes=excluded.notes, rest_seconds=excluded.rest_seconds;`,
    [templateSlotId, setIndex, weight, reps, rpe, notes, restSeconds, now()]
  );
}

export async function deletePrescribedSet(
  templateSlotId: number,
  setIndex: number
) {
  await executeSqlAsync(
    `DELETE FROM template_prescribed_sets
     WHERE template_slot_id=? AND set_index=?;`,
    [templateSlotId, setIndex]
  );
}

export async function replacePrescribedSets(
  templateSlotId: number,
  sets: Array<{ set_index: number; weight: number | null; reps: number | null; rpe: number | null; rest_seconds: number | null }>
) {
  await executeSqlAsync(
    `DELETE FROM template_prescribed_sets WHERE template_slot_id=?;`,
    [templateSlotId]
  );
  for (const set of sets) {
    await upsertPrescribedSet(
      templateSlotId,
      set.set_index,
      set.weight,
      set.reps,
      set.rpe,
      null,
      set.rest_seconds
    );
  }
}
