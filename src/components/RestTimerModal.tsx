/**
 * RestTimerModal — background-safe rest timer overlay.
 *
 * Pure presentational component (§4). Receives timer state as props.
 */
import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
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

type Props = {
  timer: TimerState;
  unit: string;
};

function RestTimerModal({ timer, unit }: Props) {
  const c = useColors();

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
            <Pressable
              style={[styles.timerBtn, { backgroundColor: c.success, paddingHorizontal: 40, marginBottom: 12 }]}
              onPress={() => timer.skip()}
            >
              <Text style={[styles.timerBtnText, { color: '#FFF' }]}>Let's Go! 💪</Text>
            </Pressable>
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
