/**
 * OnboardingModal — full-screen walkthrough shown on first launch.
 *
 * Checks `app_settings` for `onboarding_complete`. If not set, renders a
 * multi-step intro that teaches the user the basic workflow:
 *   1. Welcome
 *   2. Templates — build your plan
 *   3. Logging — track every set
 *   4. Progress — visualise gains
 *
 * On completion (or skip) it writes the flag so it never shows again.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  Modal,
} from 'react-native';
import { useColors } from '../contexts/ThemeContext';
import { executeSqlAsync } from '../db/db';

/* ── Step data ────────────────────────────────────────────── */

type Step = {
  icon: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: '🏋️',
    title: 'Welcome to WorkoutApp',
    body: 'A clean, private workout tracker that lives entirely on your device. No account needed — your data stays yours.',
  },
  {
    icon: '📑',
    title: 'Build Templates',
    body: 'Head to the Templates tab and create a workout plan. Add exercises, set target reps, and prescribe weights — WorkoutApp remembers everything next time.',
  },
  {
    icon: '✅',
    title: 'Log Every Set',
    body: 'Start a workout from the Log tab — tap a template to begin. Mark sets complete, adjust weight & reps, and use the built-in rest timer between sets.',
  },
  {
    icon: '📈',
    title: 'Track Your Progress',
    body: 'Check the History tab for charts, streaks, and muscle volume. WorkoutApp auto-detects personal records and shows progressive overload banners when you plateau.',
  },
  {
    icon: '🚀',
    title: "You're All Set!",
    body: "Create your first template and start logging. Every rep counts — let's go!",
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ── Persistence helpers ──────────────────────────────────── */

async function isOnboardingComplete(): Promise<boolean> {
  try {
    const res = await executeSqlAsync(
      `SELECT value FROM app_settings WHERE key = 'onboarding_complete';`,
    );
    return res.rows.length > 0 && res.rows.item(0).value === '1';
  } catch {
    return false;
  }
}

async function markOnboardingComplete(): Promise<void> {
  await executeSqlAsync(
    `INSERT INTO app_settings(key, value) VALUES ('onboarding_complete', '1')
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
  );
}

/* ── Component ────────────────────────────────────────────── */

export default function OnboardingModal() {
  const c = useColors();
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Check on mount
  useEffect(() => {
    isOnboardingComplete().then((done) => {
      if (!done) setVisible(true);
    });
  }, []);

  const finish = useCallback(async () => {
    setVisible(false);
    await markOnboardingComplete();
  }, []);

  const goNext = useCallback(() => {
    if (currentStep >= STEPS.length - 1) {
      finish();
    } else {
      const next = currentStep + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentStep(next);
    }
  }, [currentStep, finish]);

  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setCurrentStep(idx);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Step }) => (
      <View style={[s.slide, { width: SCREEN_WIDTH }]}>
        <Text style={s.icon}>{item.icon}</Text>
        <Text style={[s.title, { color: c.text }]}>{item.title}</Text>
        <Text style={[s.body, { color: c.textSecondary }]}>{item.body}</Text>
      </View>
    ),
    [c],
  );

  if (!visible) return null;

  const isLast = currentStep >= STEPS.length - 1;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={[s.container, { backgroundColor: c.background }]}>
        {/* Skip (hidden on last step) */}
        {!isLast && (
          <Pressable style={s.skipBtn} onPress={finish}>
            <Text style={[s.skipText, { color: c.textSecondary }]}>Skip</Text>
          </Pressable>
        )}

        {/* Pager */}
        <Animated.FlatList
          ref={flatListRef}
          data={STEPS}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        {/* Bottom section: dots + button */}
        <View style={s.bottom}>
          {/* Dots */}
          <View style={s.dots}>
            {STEPS.map((_, i) => {
              const inputRange = [
                (i - 1) * SCREEN_WIDTH,
                i * SCREEN_WIDTH,
                (i + 1) * SCREEN_WIDTH,
              ];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [1, 1.4, 1],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={i}
                  style={[
                    s.dot,
                    { backgroundColor: c.accent, transform: [{ scale }], opacity },
                  ]}
                />
              );
            })}
          </View>

          {/* Next / Get Started */}
          <Pressable
            style={[s.nextBtn, { backgroundColor: c.primary }]}
            onPress={goNext}
          >
            <Text style={[s.nextBtnText, { color: c.primaryText }]}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ── Styles ────────────────────────────────────────────────── */

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  icon: {
    fontSize: 72,
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  bottom: {
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
