/**
 * Notification utilities — local push notifications for workout reminders.
 *
 * Uses expo-notifications to schedule a "You haven't trained in N days"
 * reminder that fires after a configurable inactivity period.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { executeSqlAsync } from '../db/db';

/* ── Configuration ─────────────────────────────────────────── */

/** Default inactivity threshold in days before a reminder fires. */
const DEFAULT_INACTIVITY_DAYS = 3;

/** app_settings keys */
const KEY_REMINDERS_ENABLED = 'reminders_enabled';
const KEY_INACTIVITY_DAYS = 'inactivity_days';

/* ── Permission ────────────────────────────────────────────── */

/**
 * Request notification permissions. Returns true if granted.
 * On Android 13+ this shows a system dialog.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/* ── Settings persistence ──────────────────────────────────── */

export async function isRemindersEnabled(): Promise<boolean> {
  const res = await executeSqlAsync(
    `SELECT value FROM app_settings WHERE key = ?;`,
    [KEY_REMINDERS_ENABLED]
  );
  if (!res.rows.length) return false;
  return res.rows.item(0).value === '1';
}

export async function setRemindersEnabled(enabled: boolean): Promise<void> {
  await executeSqlAsync(
    `INSERT INTO app_settings(key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    [KEY_REMINDERS_ENABLED, enabled ? '1' : '0']
  );
}

export async function getInactivityDays(): Promise<number> {
  const res = await executeSqlAsync(
    `SELECT value FROM app_settings WHERE key = ?;`,
    [KEY_INACTIVITY_DAYS]
  );
  if (!res.rows.length) return DEFAULT_INACTIVITY_DAYS;
  const val = parseInt(res.rows.item(0).value, 10);
  return val > 0 ? val : DEFAULT_INACTIVITY_DAYS;
}

export async function setInactivityDays(days: number): Promise<void> {
  await executeSqlAsync(
    `INSERT INTO app_settings(key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    [KEY_INACTIVITY_DAYS, String(Math.max(1, days))]
  );
}

/* ── Notification handler config ──────────────────────────── */

/** Configure how notifications behave when the app is in the foreground. */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/* ── Scheduling ────────────────────────────────────────────── */

const CHANNEL_ID = 'workout-reminders';

/** Ensure Android notification channel exists. */
async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Workout Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
}

/**
 * Schedule (or reschedule) the inactivity reminder.
 * Cancels any existing reminder first, then schedules a new one
 * that fires `inactivityDays` days from now.
 *
 * Call this:
 * - On app startup (if reminders enabled)
 * - After finishing a workout
 * - After changing the inactivity setting
 */
export async function scheduleInactivityReminder(): Promise<void> {
  const enabled = await isRemindersEnabled();
  if (!enabled) {
    await cancelAllReminders();
    return;
  }

  const days = await getInactivityDays();
  await cancelAllReminders();
  await ensureChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏋️ Time to train!',
      body: `You haven't logged a workout in ${days} day${days > 1 ? 's' : ''}. Get after it!`,
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: days * 24 * 60 * 60,
      repeats: false,
    },
  });
}

/** Cancel all scheduled notifications. */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
