/**
 * PlateCalculator — shows which plates to load on each side of the bar.
 * Supports standard plate sets in both kg and lb.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors, ThemeColors } from '../contexts/ThemeContext';

const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATES_LB = [45, 35, 25, 10, 5, 2.5];
const BAR_KG = 20;
const BAR_LB = 45;

type Props = {
  visible: boolean;
  onClose: () => void;
  weight: number;
  unit: 'kg' | 'lb';
};

type PlateBreakdown = {
  plate: number;
  count: number;
};

export default function PlateCalculator({ visible, onClose, weight, unit }: Props) {
  const c = useColors();
  const [targetInput, setTargetInput] = useState('');

  useEffect(() => {
    if (!visible) return;
    setTargetInput(weight > 0 ? String(weight) : '');
  }, [visible, weight]);

  const targetWeight = useMemo(() => {
    const parsed = parseFloat(targetInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [targetInput]);

  const { plates, perSide, barWeight, remainder, hasTarget } = useMemo(() => {
    const bar = unit === 'kg' ? BAR_KG : BAR_LB;
    const availablePlates = unit === 'kg' ? PLATES_KG : PLATES_LB;

    if (!targetWeight || targetWeight <= 0) {
      return { plates: [] as PlateBreakdown[], perSide: 0, barWeight: bar, remainder: 0, hasTarget: false };
    }

    if (targetWeight <= bar) {
      return { plates: [] as PlateBreakdown[], perSide: 0, barWeight: bar, remainder: 0, hasTarget: true };
    }

    let remaining = (targetWeight - bar) / 2;
    const result: PlateBreakdown[] = [];

    for (const plate of availablePlates) {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        result.push({ plate, count });
        remaining -= count * plate;
      }
    }

    return {
      plates: result,
      perSide: Math.round(((targetWeight - bar) / 2) * 100) / 100,
      barWeight: bar,
      remainder: Math.round(remaining * 100) / 100,
      hasTarget: true,
    };
  }, [targetWeight, unit]);

  const perSideSummary = useMemo(() => {
    if (!plates.length) return 'No plates needed';
    return plates.map((plate) => `${plate.plate} × ${plate.count}`).join('  •  ');
  }, [plates]);

  const sourceLabel = weight > 0
    ? 'Pre-filled from the selected set weight.'
    : 'Enter a total barbell weight to calculate the load.';

  const s = makeStyles(c);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={s.backdrop} onPress={onClose}>
        <View style={s.modal} onStartShouldSetResponder={() => true}>
          <Text style={s.title}>🏋️ Plate Calculator</Text>
          <Text style={s.subtitle}>{sourceLabel}</Text>

          <View style={s.inputCard}>
            <Text style={s.inputLabel}>Total barbell weight</Text>
            <TextInput
              value={targetInput}
              onChangeText={setTargetInput}
              keyboardType="numeric"
              placeholder={`Including the ${unit === 'kg' ? BAR_KG : BAR_LB} ${unit} bar`}
              placeholderTextColor={c.textTertiary}
              style={s.input}
            />
            <Text style={s.inputHint}>
              This is the full weight on the bar, not the weight per side.
            </Text>
          </View>

          <View style={s.barRow}>
            <View style={s.barIcon}>
              <Text style={s.barText}>Bar</Text>
            </View>
            <Text style={s.barWeight}>{barWeight} {unit}</Text>
          </View>

          {!hasTarget ? (
            <View style={s.infoCard}>
              <Text style={s.infoTitle}>How it works</Text>
              <Text style={s.infoBody}>Enter the total barbell weight you want to lift.</Text>
              <Text style={s.infoBody}>The calculator splits that into the plates to load on each side.</Text>
            </View>
          ) : targetWeight <= barWeight ? (
            <Text style={s.emptyText}>Just the bar — no plates needed! 💪</Text>
          ) : (
            <>
              <View style={s.summaryCard}>
                <Text style={s.summaryLabel}>LOAD EACH SIDE</Text>
                <Text style={s.summaryValue}>{perSide} {unit}</Text>
                <Text style={s.summaryHint}>{perSideSummary}</Text>
              </View>

              <Text style={s.perSideLabel}>Plates per side</Text>
              <View style={s.plateList}>
                {plates.map((plate) => (
                  <View key={plate.plate} style={s.plateRow}>
                    <View
                      style={[
                        s.plateBadge,
                        {
                          width: 20 + plate.plate * (unit === 'kg' ? 1.6 : 0.9),
                          backgroundColor: plateColor(plate.plate, unit),
                        },
                      ]}
                    >
                      <Text style={s.plateWeight}>{plate.plate}</Text>
                    </View>
                    <Text style={s.plateCount}>× {plate.count}</Text>
                  </View>
                ))}
              </View>

              {remainder > 0 && (
                <Text style={s.remainderText}>
                  ⚠️ {remainder * 2} {unit} can&apos;t be loaded exactly with the standard plates in this calculator.
                </Text>
              )}
            </>
          )}

          {plates.length > 0 && (
            <View style={s.visualBar}>
              <View style={s.plateStack}>
                {plates.flatMap((plate) =>
                  Array.from({ length: plate.count }, (_, index) => (
                    <View
                      key={`left-${plate.plate}-${index}`}
                      style={[
                        s.visualPlate,
                        {
                          height: 14 + plate.plate * (unit === 'kg' ? 1.2 : 0.6),
                          backgroundColor: plateColor(plate.plate, unit),
                        },
                      ]}
                    />
                  ))
                )}
              </View>
              <View style={s.visualBarCenter} />
              <View style={s.plateStack}>
                {plates.flatMap((plate) =>
                  Array.from({ length: plate.count }, (_, index) => (
                    <View
                      key={`right-${plate.plate}-${index}`}
                      style={[
                        s.visualPlate,
                        {
                          height: 14 + plate.plate * (unit === 'kg' ? 1.2 : 0.6),
                          backgroundColor: plateColor(plate.plate, unit),
                        },
                      ]}
                    />
                  ))
                )}
              </View>
            </View>
          )}

          <Pressable style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>Done</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function plateColor(weight: number, unit: 'kg' | 'lb'): string {
  if (unit === 'kg') {
    if (weight >= 25) return '#E8443A';
    if (weight >= 20) return '#4A90D9';
    if (weight >= 15) return '#F5D76E';
    if (weight >= 10) return '#2EA043';
    if (weight >= 5) return '#E8E8E8';
    return '#CCCCCC';
  }
  if (weight >= 45) return '#4A90D9';
  if (weight >= 35) return '#F5D76E';
  if (weight >= 25) return '#2EA043';
  if (weight >= 10) return '#E8E8E8';
  return '#CCCCCC';
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: c.card,
      borderRadius: 20,
      padding: 24,
      width: 320,
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: c.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 15,
      color: c.textSecondary,
      marginBottom: 14,
      textAlign: 'center',
    },
    inputCard: {
      width: '100%',
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.sectionHeaderBg,
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      backgroundColor: c.inputBg,
      color: c.text,
      fontSize: 20,
      fontWeight: '700',
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 8,
      textAlign: 'center',
    },
    inputHint: {
      fontSize: 12,
      color: c.textSecondary,
      textAlign: 'center',
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      width: '100%',
      justifyContent: 'center',
    },
    barIcon: {
      backgroundColor: c.textTertiary,
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    barText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.isDark ? '#000' : '#FFF',
    },
    barWeight: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
    },
    infoCard: {
      width: '100%',
      borderRadius: 12,
      padding: 14,
      marginBottom: 14,
      backgroundColor: c.sectionHeaderBg,
      borderWidth: 1,
      borderColor: c.border,
      gap: 6,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
    },
    infoBody: {
      fontSize: 13,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    emptyText: {
      fontSize: 15,
      color: c.textSecondary,
      textAlign: 'center',
      marginVertical: 16,
    },
    summaryCard: {
      width: '100%',
      borderRadius: 12,
      padding: 14,
      marginBottom: 14,
      backgroundColor: c.sectionHeaderBg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: '800',
      color: c.text,
      marginBottom: 6,
    },
    summaryHint: {
      fontSize: 12,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    perSideLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textSecondary,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    plateList: {
      width: '100%',
      gap: 6,
      marginBottom: 16,
    },
    plateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    plateBadge: {
      height: 32,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 50,
    },
    plateWeight: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFF',
    },
    plateCount: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    remainderText: {
      fontSize: 13,
      color: c.warning,
      marginBottom: 12,
      textAlign: 'center',
    },
    visualBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 100,
      marginBottom: 20,
      width: '100%',
    },
    plateStack: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 80,
      width: 100,
      justifyContent: 'flex-end',
    },
    visualBarCenter: {
      width: 80,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.text,
      marginHorizontal: 8,
    },
    visualPlate: {
      width: 14,
      borderRadius: 3,
      marginHorizontal: 1,
    },
    closeBtn: {
      backgroundColor: c.primary,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 10,
    },
    closeBtnText: {
      color: c.primaryText,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
