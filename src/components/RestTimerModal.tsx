/**
 * RestTimerModal — background-safe rest timer overlay.
 *
 * Pure presentational component (§4). Receives timer state as props.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Animated } from 'react-native';
import { useColors } from '../contexts/ThemeContext';
import { styles } from '../screens/LogScreen.styles';

type TimerState = {
  remaining: number;
  isRunning: boolean;
  isVisible: boolean;
  totalDuration: number;
  nextSet: {
    exerciseName: string;
    setNumber: number;
    weight: number;
    reps: number;
    rpe: number | null;
  } | null;
  nextExercise: {
    exerciseName: string;
    firstSetWeight?: number;
    firstSetReps?: number;
  } | null;
  isLastSetOfExercise: boolean;
  hide: () => void;
  pause: () => void;
  resume: () => void;
  addTime: (delta: number) => void;
  skip: () => void;
};

type WorkoutProgress = {
  completedSets: number;
  totalSets: number;
  exercisesRemaining: number;
  totalExercises: number;
  estimatedMinutesLeft: number;
  totalVolume: number;
  elapsedMinutes: number;
};

type Props = {
  timer: TimerState;
  unit: string;
  workoutProgress?: WorkoutProgress;
};

function RestTimerModal({ timer, unit, workoutProgress }: Props) {
  const c = useColors();

  /* Auto-dismiss progress bar (3s countdown when timer expires) */
  const dismissAnim = useRef(new Animated.Value(0)).current;
  const [showDismissBar, setShowDismissBar] = useState(false);

  useEffect(() => {
    if (timer.remaining <= 0 && !timer.isRunning && timer.isVisible) {
      setShowDismissBar(true);
      dismissAnim.setValue(0);
      Animated.timing(dismissAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start();
    } else {
      setShowDismissBar(false);
      dismissAnim.setValue(0);
    }
  }, [timer.remaining <= 0 && !timer.isRunning && timer.isVisible]);

  return (
    <Modal visible={timer.isVisible} transparent animationType="fade">
      <View style={styles.timerBackdrop}>
        <View style={[styles.timerModal, { backgroundColor: c.card }]}>
          <Text style={[styles.timerTitle, { color: c.text }]}>
            {timer.remaining <= 0 && !timer.isRunning ? '✅ Rest Complete!' : 'Rest Timer'}
          </Text>
          <Text
            style={[
              styles.timerDisplay,
              {
                color: timer.remaining <= 0 ? c.success : timer.remaining <= 5 ? c.danger : c.success,
              },
            ]}
          >
            {Math.floor(timer.remaining / 60)}:{(timer.remaining % 60).toString().padStart(2, '0')}
          </Text>

          {/* Progress bar */}
          {timer.totalDuration > 0 && (
            <View style={[styles.timerProgressBg, { backgroundColor: c.isDark ? '#333' : '#E8E8E8' }]}>
              <View
                style={[
                  styles.timerProgressFill,
                  {
                    width: `${Math.min(100, Math.max(0, (1 - timer.remaining / timer.totalDuration) * 100))}%`,
                    backgroundColor: timer.remaining <= 5 ? c.danger : c.success,
                  },
                ]}
              />
            </View>
          )}

          {/* Next set / next exercise preview */}
          {(timer.nextSet || (timer.isLastSetOfExercise && timer.nextExercise)) && (
            <View style={[styles.nextSetPreview, { backgroundColor: c.sectionHeaderBg, borderColor: c.border }]}>
              {timer.isLastSetOfExercise && timer.nextExercise ? (
                <>
                  <Text style={[styles.nextSetLabel, { color: c.textSecondary }]}>UP NEXT</Text>
                  <Text style={[styles.nextSetExercise, { color: c.text }]}>
                    🏋️ {timer.nextExercise.exerciseName}
                  </Text>
                  {timer.nextExercise.firstSetWeight != null && (
                    <Text style={[styles.nextSetDetail, { color: c.textSecondary }]}>
                      Set #1: {timer.nextExercise.firstSetWeight} {unit} × {timer.nextExercise.firstSetReps}
                    </Text>
                  )}
                </>
              ) : timer.nextSet ? (
                <>
                  <Text style={[styles.nextSetLabel, { color: c.textSecondary }]}>COMING UP</Text>
                  <Text style={[styles.nextSetExercise, { color: c.text }]}>
                    {timer.nextSet.exerciseName}
                  </Text>
                  <Text style={[styles.nextSetDetail, { color: c.textSecondary }]}>
                    Set #{timer.nextSet.setNumber}: {timer.nextSet.weight} {unit} × {timer.nextSet.reps}
                    {timer.nextSet.rpe ? ` @${timer.nextSet.rpe}` : ''}
                  </Text>
                </>
              ) : null}
            </View>
          )}

          {/* Workout progress */}
          {workoutProgress && workoutProgress.totalSets > 0 && (() => {
            const pct = Math.round((workoutProgress.completedSets / workoutProgress.totalSets) * 100);
            return (
              <View style={[styles.workoutProgressSection, { backgroundColor: c.sectionHeaderBg, borderColor: c.border }]}>
                <View style={styles.workoutProgressHeader}>
                  <Text style={[styles.workoutProgressTitle, { color: c.textSecondary }]}>
                    WORKOUT PROGRESS
                  </Text>
                  <Text style={[styles.workoutProgressPct, { color: c.accent }]}>
                    {pct}%
                  </Text>
                </View>
                <View style={[styles.workoutProgressBarBg, { backgroundColor: c.isDark ? '#333' : '#E0E0E0' }]}>
                  <View
                    style={[
                      styles.workoutProgressBarFill,
                      { width: `${pct}%`, backgroundColor: c.accent },
                    ]}
                  />
                </View>
                <View style={styles.workoutProgressStats}>
                  <Text style={[styles.workoutProgressStat, { color: c.text }]}>
                    💪 {workoutProgress.completedSets}/{workoutProgress.totalSets} sets
                  </Text>
                  <Text style={[styles.workoutProgressStat, { color: c.text }]}>
                    🏋️ {workoutProgress.exercisesRemaining} exercise{workoutProgress.exercisesRemaining !== 1 ? 's' : ''} left
                  </Text>
                </View>
                <View style={styles.workoutProgressStats}>
                  {workoutProgress.completedSets > 0 && (
                    <Text style={[styles.workoutProgressStat, { color: c.text }]}>
                      ⏱ ~{workoutProgress.estimatedMinutesLeft} min left
                    </Text>
                  )}
                  <Text style={[styles.workoutProgressStat, { color: c.text }]}>
                    📊 {Math.round(workoutProgress.totalVolume).toLocaleString()} {unit}
                  </Text>
                </View>
              </View>
            );
          })()}

          {timer.remaining > 0 ? (
            <View style={styles.timerControls}>
              <Pressable
                style={[styles.timerBtn, { backgroundColor: c.inputBg }]}
                onPress={() => timer.addTime(-5)}
              >
                <Text style={[styles.timerBtnText, { color: c.text }]}>-5s</Text>
              </Pressable>
              <Pressable
                style={[styles.timerBtn, { backgroundColor: c.success }]}
                onPress={() => (timer.isRunning ? timer.pause() : timer.resume())}
              >
                <Text style={[styles.timerBtnText, { color: '#FFF' }]}>
                  {timer.isRunning ? 'Pause' : 'Resume'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.timerBtn, { backgroundColor: c.inputBg }]}
                onPress={() => timer.addTime(5)}
              >
                <Text style={[styles.timerBtnText, { color: c.text }]}>+5s</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable
                style={[styles.timerBtn, { backgroundColor: c.success, paddingHorizontal: 40, marginBottom: 8 }]}
                onPress={() => timer.skip()}
              >
                <Text style={[styles.timerBtnText, { color: '#FFF' }]}>Let's Go! 💪</Text>
              </Pressable>
              {showDismissBar && (
                <View style={{ width: '60%', height: 3, backgroundColor: c.isDark ? '#444' : '#DDD', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                  <Animated.View style={{ height: 3, borderRadius: 2, backgroundColor: c.textSecondary, width: dismissAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
                </View>
              )}
            </>
          )}
          <Pressable style={styles.timerSkipBtn} onPress={() => timer.skip()}>
            <Text style={[styles.timerSkipText, { color: c.textSecondary }]}>
              {timer.remaining > 0 ? 'Skip Rest' : 'Dismiss'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default React.memo(RestTimerModal);
