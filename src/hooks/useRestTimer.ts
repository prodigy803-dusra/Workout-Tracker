/**
 * useRestTimer — background-safe rest timer with notifications.
 *
 * Uses absolute timestamps instead of setInterval counting, so the timer
 * stays accurate even when the app is backgrounded or the JS thread pauses.
 * Schedules a local push notification so the user is alerted even when the
 * app is not in the foreground.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, Vibration, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { haptic } from '../utils/haptics';

/* ─── Show notifications while app is in foreground ─── */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/* ─── Types ─── */

export type NextSetInfo = {
  exerciseName: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
} | null;

export type NextExerciseInfo = {
  exerciseName: string;
  firstSetWeight?: number;
  firstSetReps?: number;
} | null;

export type TimerContext = {
  nextSet?: NextSetInfo;
  nextExercise?: NextExerciseInfo;
  isLastSet?: boolean;
};

/* ─── Hook ─── */

export function useRestTimer() {
  /* Absolute end-time stored in a ref so it survives re-renders cheaply */
  const endTimeRef = useRef<number | null>(null);

  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);

  /* Context for the "coming up" preview */
  const [nextSet, setNextSet] = useState<NextSetInfo>(null);
  const [nextExercise, setNextExercise] = useState<NextExerciseInfo>(null);
  const [isLastSetOfExercise, setIsLastSetOfExercise] = useState(false);

  const notifIdRef = useRef<string | null>(null);
  const appStateRef = useRef(AppState.currentState);

  /* ── Request notification permission once ── */
  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});
  }, []);

  /* ── Notification helpers ── */
  const scheduleNotif = useCallback(async (seconds: number) => {
    try {
      if (notifIdRef.current) {
        await Notifications.cancelScheduledNotificationAsync(notifIdRef.current).catch(() => {});
      }
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏱️ Rest Complete!',
          body: 'Time to get back to your workout 💪',
          sound: true,
          ...(Platform.OS === 'android' ? { vibrate: [0, 250, 250, 250] } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.round(seconds)),
        },
      });
      notifIdRef.current = id;
    } catch (_) {
      /* notifications may not be available in Expo Go / simulator */
    }
  }, []);

  const cancelNotif = useCallback(async () => {
    if (notifIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current).catch(() => {});
      notifIdRef.current = null;
    }
  }, []);

  /* ── Fire callback when timer hits 0 ── */
  const onExpire = useCallback(() => {
    endTimeRef.current = null;
    setIsRunning(false);
    Vibration.vibrate([0, 300, 100, 300]);
    haptic('warning');
    // Keep modal visible so the user sees "0:00" + next-set info
  }, []);

  /* ── Tick effect: recompute remaining from endTime ── */
  useEffect(() => {
    if (!isRunning) return;
    const tick = () => {
      const end = endTimeRef.current;
      if (!end) return;
      const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) onExpire();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [isRunning, onExpire]);

  /* ── AppState: recalculate when app comes back to foreground ── */
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && appStateRef.current !== 'active') {
        const end = endTimeRef.current;
        if (end) {
          const rem = Math.max(0, Math.ceil((end - Date.now()) / 1000));
          setRemaining(rem);
          if (rem <= 0) {
            onExpire();
          }
          setIsVisible(true); // re-show timer when user returns
        }
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [onExpire]);

  /* ══════════════════════════════════════════════════════════
   *  Public actions
   * ══════════════════════════════════════════════════════════ */

  const start = useCallback(
    (seconds: number, ctx?: TimerContext) => {
      const end = Date.now() + seconds * 1000;
      endTimeRef.current = end;
      setRemaining(seconds);
      setTotalDuration(seconds);
      setIsRunning(true);
      setIsVisible(true);
      if (ctx?.nextSet !== undefined) setNextSet(ctx.nextSet);
      if (ctx?.nextExercise !== undefined) setNextExercise(ctx.nextExercise);
      setIsLastSetOfExercise(ctx?.isLastSet ?? false);
      scheduleNotif(seconds);
    },
    [scheduleNotif],
  );

  const pause = useCallback(() => {
    const end = endTimeRef.current;
    if (end) {
      setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    }
    endTimeRef.current = null;
    setIsRunning(false);
    cancelNotif();
  }, [cancelNotif]);

  const resume = useCallback(() => {
    if (remaining <= 0) return;
    endTimeRef.current = Date.now() + remaining * 1000;
    setIsRunning(true);
    scheduleNotif(remaining);
  }, [remaining, scheduleNotif]);

  const skip = useCallback(() => {
    endTimeRef.current = null;
    setRemaining(0);
    setIsRunning(false);
    setIsVisible(false);
    cancelNotif();
  }, [cancelNotif]);

  const addTime = useCallback(
    (delta: number) => {
      const end = endTimeRef.current;
      if (end && isRunning) {
        const newEnd = end + delta * 1000;
        endTimeRef.current = newEnd;
        const rem = Math.max(0, Math.ceil((newEnd - Date.now()) / 1000));
        setRemaining(rem);
        setTotalDuration((d) => Math.max(1, d + delta));
        cancelNotif().then(() => scheduleNotif(rem));
      } else {
        setRemaining((prev) => Math.max(0, prev + delta));
      }
    },
    [isRunning, cancelNotif, scheduleNotif],
  );

  return {
    // State
    remaining,
    isRunning,
    isVisible,
    totalDuration,
    nextSet,
    nextExercise,
    isLastSetOfExercise,
    // Actions
    start,
    pause,
    resume,
    skip,
    addTime,
    show: useCallback(() => setIsVisible(true), []),
    hide: useCallback(() => setIsVisible(false), []),
  };
}
