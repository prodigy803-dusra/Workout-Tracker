/**
 * PlateCalculator — shows which plates to load on each side of the bar.
 * Supports standard plate sets in both kg and lb.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
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

export default function PlateCalculator({ visible, onClose, weight, unit }: Props) {
  const c = useColors();

  const { plates, perSide, barWeight, remainder } = useMemo(() => {
    const bar = unit === 'kg' ? BAR_KG : BAR_LB;
    const availPlates = unit === 'kg' ? PLATES_KG : PLATES_LB;

    if (weight <= bar) {
      return { plates: [], perSide: 0, barWeight: bar, remainder: 0 };
    }

    let remaining = (weight - bar) / 2; // per side
    const result: { plate: number; count: number }[] = [];

    for (const plate of availPlates) {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        result.push({ plate, count });
        remaining -= count * plate;
      }
    }

    return {
      plates: result,
      perSide: (weight - bar) / 2,
      barWeight: bar,
      remainder: Math.round(remaining * 100) / 100,
    };
  }, [weight, unit]);

  const s = makeStyles(c);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={s.backdrop} onPress={onClose}>
        <View style={s.modal} onStartShouldSetResponder={() => true}>
          <Text style={s.title}>🏋️ Plate Calculator</Text>
          <Text style={s.subtitle}>
            Target: {weight} {unit}
          </Text>

          <View style={s.barRow}>
            <View style={s.barIcon}>
              <Text style={s.barText}>Bar</Text>
            </View>
            <Text style={s.barWeight}>
              {barWeight} {unit}
            </Text>
          </View>

          {weight <= barWeight ? (
            <Text style={s.emptyText}>Just the bar — no plates needed! 💪</Text>
          ) : (
            <>
              <Text style={s.perSideLabel}>Each side ({perSide} {unit}):</Text>
              <View style={s.plateList}>
                {plates.map((p) => (
                  <View key={p.plate} style={s.plateRow}>
                    <View style={[s.plateBadge, { width: 20 + p.plate * (unit === 'kg' ? 1.6 : 0.9) }]}>
                      <Text style={s.plateWeight}>{p.plate}</Text>
                    </View>
                    <Text style={s.plateCount}>× {p.count}</Text>
                  </View>
                ))}
              </View>
              {remainder > 0 && (
                <Text style={s.remainderText}>
                  ⚠️ {remainder * 2} {unit} can't be loaded with standard plates
                </Text>
              )}
            </>
          )}

          {/* Visual plate stack */}
          {plates.length > 0 && (
            <View style={s.visualBar}>
              {/* Left plates */}
              <View style={s.plateStack}>
                {plates.flatMap((p) =>
                  Array.from({ length: p.count }, (_, i) => (
                    <View
                      key={`l-${p.plate}-${i}`}
                      style={[
                        s.visualPlate,
                        {
                          height: 14 + p.plate * (unit === 'kg' ? 1.2 : 0.6),
                          backgroundColor: plateColor(p.plate, unit),
                        },
                      ]}
                    />
                  ))
                )}
              </View>
              {/* Bar */}
              <View style={s.visualBarCenter} />
              {/* Right plates (reversed) */}
              <View style={s.plateStack}>
                {plates.flatMap((p) =>
                  Array.from({ length: p.count }, (_, i) => (
                    <View
                      key={`r-${p.plate}-${i}`}
                      style={[
                        s.visualPlate,
                        {
                          height: 14 + p.plate * (unit === 'kg' ? 1.2 : 0.6),
                          backgroundColor: plateColor(p.plate, unit),
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
  // lb
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
      marginBottom: 16,
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
    emptyText: {
      fontSize: 15,
      color: c.textSecondary,
      textAlign: 'center',
      marginVertical: 16,
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
      marginVertical: 12,
      gap: 2,
    },
    plateStack: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    visualPlate: {
      width: 8,
      borderRadius: 2,
    },
    visualBarCenter: {
      width: 60,
      height: 6,
      backgroundColor: c.textTertiary,
      borderRadius: 3,
    },
    closeBtn: {
      backgroundColor: c.primary,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 10,
      marginTop: 8,
    },
    closeBtnText: {
      color: c.primaryText,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
