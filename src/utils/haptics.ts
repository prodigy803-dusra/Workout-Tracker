/**
 * Haptic feedback utility — wraps expo-haptics with safe fallback.
 *
 * Usage:
 *   haptic('light')   — tapping a button
 *   haptic('medium')  — completing an action
 *   haptic('heavy')   — destructive action confirmation
 *   haptic('success') — PR or milestone
 *   haptic('warning') — timer alarm
 *   haptic('error')   — error / destructive
 */
import * as Haptics from 'expo-haptics';

type Preset = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const impactMap: Record<string, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

const notifMap: Record<string, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

export function haptic(preset: Preset = 'light'): void {
  try {
    if (preset === 'selection') {
      Haptics.selectionAsync();
    } else if (impactMap[preset]) {
      Haptics.impactAsync(impactMap[preset]);
    } else if (notifMap[preset]) {
      Haptics.notificationAsync(notifMap[preset]);
    }
  } catch {
    // Haptics not available — silently ignore (e.g. simulator)
  }
}
