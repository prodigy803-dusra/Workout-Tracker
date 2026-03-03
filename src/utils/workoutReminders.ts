/**
 * workoutReminders — schedules weekly recurring notifications for workout templates.
 *
 * Uses expo-notifications WEEKLY trigger to fire at the configured day + time.
 * Each reminder gets a notification identifier like "reminder-{scheduleId}" so
 * we can cancel/replace individual reminders without affecting the rest timer.
 */
import * as Notifications from 'expo-notifications';
import { listAllEnabledSchedules, dayName } from '../db/repositories/scheduleRepo';

/**
 * Sync all workout reminder notifications.
 * Call this after any schedule CRUD operation.
 *
 * Strategy:
 *   1. Cancel all existing "reminder-*" notifications.
 *   2. Re-schedule one weekly notification per enabled schedule row.
 */
export async function syncWorkoutReminders(): Promise<void> {
  try {
    // Cancel all existing reminder notifications (leave rest-timer ones alone)
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith('reminder-')) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    // Fetch all enabled schedules
    const schedules = await listAllEnabledSchedules();

    for (const s of schedules) {
      // expo-notifications weekday: 1 = Sunday ... 7 = Saturday
      // JS day_of_week: 0 = Sunday ... 6 = Saturday
      const expoWeekday = s.day_of_week + 1;

      await Notifications.scheduleNotificationAsync({
        identifier: `reminder-${s.id}`,
        content: {
          title: `🏋️ ${s.template_name}`,
          body: `${dayName(s.day_of_week)} workout — tap to start`,
          sound: true,
          data: { templateId: s.template_id, type: 'workout-reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: expoWeekday,
          hour: s.hour,
          minute: s.minute,
        },
      });
    }
  } catch (e) {
    // Notifications may not be available in simulator / Expo Go
    console.warn('Failed to sync workout reminders:', e);
  }
}

/**
 * Cancel all workout reminder notifications.
 * Used when clearing all schedules or resetting the app.
 */
export async function cancelAllWorkoutReminders(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier.startsWith('reminder-')) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.warn('Failed to cancel workout reminders:', e);
  }
}
