/**
 * ScheduleModal — configure weekly workout reminders for a template.
 *
 * Shows 7 day toggles (Mon–Sun) and a time picker.
 * Tapping a day toggles the reminder on/off for that day.
 * Uses the scheduleRepo + workoutReminders sync.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, Alert, Switch, Platform,
} from 'react-native';
import {
  listSchedulesForTemplate,
  upsertSchedule,
  deleteSchedule,
  dayName,
} from '../db/repositories/scheduleRepo';
import type { ScheduleRow } from '../db/repositories/scheduleRepo';
import { syncWorkoutReminders } from '../utils/workoutReminders';
import { useColors, ThemeColors } from '../contexts/ThemeContext';

type Props = {
  visible: boolean;
  templateId: number;
  templateName: string;
  onClose: () => void;
};

const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun display order
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ScheduleModal({ visible, templateId, templateName, onClose }: Props) {
  const c = useColors();
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [hour, setHour] = useState(18);
  const [minute, setMinute] = useState(0);

  const load = useCallback(async () => {
    const rows = await listSchedulesForTemplate(templateId);
    setSchedules(rows);
    // Use the first schedule's time as default for new ones
    if (rows.length > 0) {
      setHour(rows[0].hour);
      setMinute(rows[0].minute);
    }
  }, [templateId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const isDayEnabled = (day: number) =>
    schedules.some((s) => s.day_of_week === day && s.enabled);

  const toggleDay = async (day: number) => {
    const existing = schedules.find((s) => s.day_of_week === day);
    if (existing && existing.enabled) {
      // Disable — delete the schedule
      await deleteSchedule(existing.id);
    } else {
      // Enable — upsert
      await upsertSchedule(templateId, day, hour, minute, true);
    }
    await load();
    await syncWorkoutReminders();
  };

  const cycleTime = (delta: number) => {
    let totalMinutes = hour * 60 + minute + delta * 30;
    if (totalMinutes < 0) totalMinutes = 24 * 60 - 30;
    if (totalMinutes >= 24 * 60) totalMinutes = 0;
    const newHour = Math.floor(totalMinutes / 60);
    const newMinute = totalMinutes % 60;
    setHour(newHour);
    setMinute(newMinute);
  };

  const applyTimeToAll = async () => {
    for (const s of schedules) {
      if (s.enabled) {
        await upsertSchedule(templateId, s.day_of_week, hour, minute, true);
      }
    }
    await load();
    await syncWorkoutReminders();
  };

  const formatTime = (h: number, m: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const enabledCount = schedules.filter((s) => s.enabled).length;

  const s = makeStyles(c);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>⏰ Reminder</Text>
            <Text style={s.subtitle}>{templateName}</Text>
          </View>

          {/* Day toggles */}
          <View style={s.daysRow}>
            {DAYS.map((day, idx) => {
              const active = isDayEnabled(day);
              return (
                <Pressable
                  key={day}
                  style={[
                    s.dayChip,
                    active && { backgroundColor: c.accent, borderColor: c.accent },
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text
                    style={[
                      s.dayChipText,
                      active && { color: '#FFF' },
                    ]}
                  >
                    {SHORT_DAYS[idx]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Time picker */}
          <View style={s.timeSection}>
            <Text style={s.timeLabel}>Remind at</Text>
            <View style={s.timeRow}>
              <Pressable style={s.timeBtn} onPress={() => cycleTime(-1)}>
                <Text style={s.timeBtnText}>◀</Text>
              </Pressable>
              <Text style={s.timeValue}>{formatTime(hour, minute)}</Text>
              <Pressable style={s.timeBtn} onPress={() => cycleTime(1)}>
                <Text style={s.timeBtnText}>▶</Text>
              </Pressable>
            </View>
            {enabledCount > 0 && (
              <Pressable style={s.applyBtn} onPress={applyTimeToAll}>
                <Text style={s.applyBtnText}>Apply to all {enabledCount} days</Text>
              </Pressable>
            )}
          </View>

          {/* Summary */}
          {enabledCount > 0 && (
            <View style={s.summary}>
              <Text style={s.summaryText}>
                📅 {enabledCount} reminder{enabledCount > 1 ? 's' : ''} set
                {' — '}
                {schedules
                  .filter((r) => r.enabled)
                  .map((r) => dayName(r.day_of_week).slice(0, 3))
                  .join(', ')}
                {' at '}
                {formatTime(hour, minute)}
              </Text>
            </View>
          )}

          {/* Close */}
          <Pressable style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 36,
    },
    header: { alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: '800', color: c.text },
    subtitle: { fontSize: 14, color: c.textSecondary, marginTop: 4 },

    daysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    dayChip: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayChipText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textSecondary,
    },

    timeSection: { alignItems: 'center', marginBottom: 20 },
    timeLabel: { fontSize: 13, color: c.textSecondary, fontWeight: '600', marginBottom: 8 },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    timeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    timeBtnText: { fontSize: 16, color: c.text },
    timeValue: {
      fontSize: 28,
      fontWeight: '800',
      color: c.text,
      minWidth: 120,
      textAlign: 'center',
    },
    applyBtn: { marginTop: 10 },
    applyBtnText: { fontSize: 13, fontWeight: '600', color: c.accent },

    summary: {
      backgroundColor: c.background,
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    summaryText: { fontSize: 13, color: c.textSecondary, textAlign: 'center' },

    closeBtn: {
      backgroundColor: c.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    closeBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  });
}
