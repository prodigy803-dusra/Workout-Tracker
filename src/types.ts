/* ═══════════════════════════════════════════════════════════
 *  Shared TypeScript types for the Workout App
 * ═══════════════════════════════════════════════════════════ */

/* ── Database row types ─────────────────────────────────── */

export type Exercise = {
  id: number;
  name: string;
  name_norm: string;
  created_at: string;
  primary_muscle: string | null;
  secondary_muscle: string | null;
  aliases: string | null;
  equipment: string | null;
  movement_pattern: string | null;
  video_url: string | null;
  instructions: string | null;
  tips: string | null;
};

export type ExerciseOption = {
  id: number;
  exercise_id: number;
  name: string;
  name_norm: string;
  order_index: number;
  created_at: string;
};

export type Template = {
  id: number;
  name: string;
  name_norm: string;
  created_at: string;
};

export type TemplateSlot = {
  id: number;
  template_id: number;
  slot_index: number;
  name: string | null;
  created_at: string;
};

export type TemplateSlotOption = {
  id: number;
  template_slot_id: number;
  exercise_id: number;
  exercise_option_id: number | null;
  order_index: number;
  created_at: string;
  // Joined fields
  exercise_name?: string;
  option_name?: string | null;
};

export type PrescribedSet = {
  id: number;
  template_slot_id: number;
  set_index: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  notes: string | null;
  rest_seconds: number | null;
};

export type Session = {
  id: number;
  performed_at: string;
  notes: string | null;
  status: 'draft' | 'final';
  template_id: number | null;
  created_at: string;
};

export type SessionSlot = {
  id: number;
  session_id: number;
  template_slot_id: number;
  slot_index: number;
  name: string | null;
  selected_session_slot_choice_id: number | null;
  created_at: string;
};

export type SessionSlotChoice = {
  id: number;
  session_slot_id: number;
  template_slot_option_id: number;
  created_at: string;
};

export type SetRow = {
  id: number;
  session_slot_choice_id: number;
  set_index: number;
  weight: number;
  reps: number;
  rpe: number | null;
  notes: string | null;
  rest_seconds: number | null;
  completed: number; // 0 or 1
  created_at: string;
};

/* ── View / query result types ──────────────────────────── */

export type DraftSlot = {
  session_slot_id: number;
  slot_index: number;
  name: string | null;
  selected_session_slot_choice_id: number | null;
  template_slot_option_id: number | null;
  exercise_id: number | null;
  exercise_name: string | null;
  option_name: string | null;
};

export type SlotOption = {
  session_slot_choice_id: number | null;
  template_slot_option_id: number;
  exercise_name: string;
  option_name: string | null;
  order_index: number;
};

export type SetData = {
  id: number;
  set_index: number;
  weight: number;
  reps: number;
  rpe: number | null;
  rest_seconds: number | null;
  completed: boolean;
};

export type LastTimeData = {
  performed_at: string;
  sets: SetRow[];
} | null;

export type HistoryItem = {
  id: number;
  performed_at: string;
  created_at: string;
  template_name: string | null;
  slots_count: number;
  completed_sets_count: number;
  sets_count: number;
  total_volume: number;
  exercises: string | null;
};

export type SessionDetail = {
  session: {
    id: number;
    performed_at: string;
    notes: string | null;
    template_name: string | null;
  };
  slots: Array<{
    session_slot_id: number;
    slot_index: number;
    name: string | null;
    session_slot_choice_id: number;
    template_slot_option_id: number;
    exercise_name: string;
    option_name: string | null;
  }>;
  sets: SetRow[];
};

export type OverallStats = {
  totalSessions: number;
  last7: {
    sessionsCount: number;
    setsCount: number;
    totalVolume: number;
  };
};

export type ExerciseStats = {
  best_e1rm: number | null;
  best_volume: number | null;
  last_performed: string | null;
};

export type ExerciseGuideData = {
  video_url: string | null;
  instructions: string | null;
  tips: string | null;
};

/* ── Navigation types ───────────────────────────────────── */

export type RootTabParamList = {
  Log: undefined;
  History: undefined;
  Templates: undefined;
  Exercises: undefined;
  Settings: undefined;
};

export type HistoryStackParamList = {
  HistoryHome: undefined;
  SessionDetail: { sessionId: number };
};

export type TemplatesStackParamList = {
  TemplatesHome: undefined;
  TemplateEditor: { templateId: number };
};

export type ExercisesStackParamList = {
  ExercisesHome: undefined;
  ExerciseDetail: { exerciseId: number; name: string };
};
