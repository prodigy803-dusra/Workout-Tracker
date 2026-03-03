/**
 * InjuryModal — bottom-sheet style modal for adding/editing an injury.
 *
 * Uses a simple picker for body region, severity chips, injury type chips,
 * and optional notes.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useColors } from '../contexts/ThemeContext';
import { haptic } from '../utils/haptics';
import {
  INJURY_REGIONS,
  INJURY_REGION_KEYS,
  INJURY_TYPES,
  SEVERITIES,
  type Severity,
  type InjuryType,
} from '../data/injuryRegionMap';
import type { Injury } from '../db/repositories/injuryRepo';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    bodyRegion: string;
    injuryType: InjuryType;
    severity: Severity;
    notes: string | null;
  }) => void;
  /** If editing an existing injury, pre-fill the form. */
  existing?: Injury | null;
};

function InjuryModal({ visible, onClose, onSave, existing }: Props) {
  const c = useColors();

  const [bodyRegion, setBodyRegion] = useState<string>(INJURY_REGION_KEYS[0]);
  const [injuryType, setInjuryType] = useState<InjuryType>('general_pain');
  const [severity, setSeverity] = useState<Severity>('mild');
  const [notes, setNotes] = useState('');

  // Reset or pre-fill when modal opens
  useEffect(() => {
    if (visible) {
      if (existing) {
        setBodyRegion(existing.body_region);
        setInjuryType(existing.injury_type as InjuryType);
        setSeverity(existing.severity);
        setNotes(existing.notes ?? '');
      } else {
        setBodyRegion(INJURY_REGION_KEYS[0]);
        setInjuryType('general_pain');
        setSeverity('mild');
        setNotes('');
      }
    }
  }, [visible, existing]);

  const handleSave = useCallback(() => {
    haptic('light');
    onSave({
      bodyRegion,
      injuryType,
      severity,
      notes: notes.trim() || null,
    });
    onClose();
  }, [bodyRegion, injuryType, severity, notes, onSave, onClose]);

  const region = INJURY_REGIONS[bodyRegion];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={[s.sheet, { backgroundColor: c.background }]}>
          <ScrollView
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={[s.title, { color: c.text }]}>
              {existing ? 'Edit Injury' : 'Log Injury'}
            </Text>
            <Text style={[s.subtitle, { color: c.textSecondary }]}>
              This is not medical advice. Track injuries to get adjusted workout suggestions.
            </Text>

            {/* Body region picker */}
            <Text style={[s.label, { color: c.textSecondary }]}>BODY REGION</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.chipScroll}
            >
              {INJURY_REGION_KEYS.map((key) => {
                const r = INJURY_REGIONS[key];
                const selected = bodyRegion === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      haptic('selection');
                      setBodyRegion(key);
                    }}
                    style={[
                      s.regionChip,
                      {
                        backgroundColor: selected ? c.primary : c.card,
                        borderColor: selected ? c.primary : c.border,
                      },
                    ]}
                  >
                    <Text style={s.regionIcon}>{r.icon}</Text>
                    <Text
                      style={[
                        s.regionLabel,
                        { color: selected ? c.primaryText : c.text },
                      ]}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Severity */}
            <Text style={[s.label, { color: c.textSecondary }]}>SEVERITY</Text>
            <View style={s.chipRow}>
              {SEVERITIES.map((sev) => {
                const selected = severity === sev.value;
                return (
                  <Pressable
                    key={sev.value}
                    onPress={() => {
                      haptic('selection');
                      setSeverity(sev.value);
                    }}
                    style={[
                      s.severityChip,
                      {
                        backgroundColor: selected ? sev.color + '22' : c.card,
                        borderColor: selected ? sev.color : c.border,
                      },
                    ]}
                  >
                    <Text style={s.severityIcon}>{sev.icon}</Text>
                    <Text
                      style={[
                        s.severityLabel,
                        { color: selected ? sev.color : c.text },
                      ]}
                    >
                      {sev.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Severity hint */}
            <Text style={[s.hint, { color: c.textTertiary }]}>
              {severity === 'mild'
                ? 'Can still train — weights reduced to 70%'
                : severity === 'moderate'
                ? 'Very light only — weights reduced to 50%'
                : 'Skip affected exercises — weights set to 0'}
            </Text>

            {/* Injury type */}
            <Text style={[s.label, { color: c.textSecondary }]}>TYPE</Text>
            <View style={s.chipRow}>
              {INJURY_TYPES.map((t) => {
                const selected = injuryType === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => {
                      haptic('selection');
                      setInjuryType(t.value);
                    }}
                    style={[
                      s.typeChip,
                      {
                        backgroundColor: selected ? c.accent + '22' : c.card,
                        borderColor: selected ? c.accent : c.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.typeLabel,
                        { color: selected ? c.accent : c.text },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Notes */}
            <Text style={[s.label, { color: c.textSecondary }]}>NOTES (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={`e.g. "Left ${region?.label?.toLowerCase() ?? 'ankle'} — from basketball"`}
              placeholderTextColor={c.textTertiary}
              multiline
              style={[
                s.notesInput,
                {
                  backgroundColor: c.card,
                  borderColor: c.border,
                  color: c.text,
                },
              ]}
            />

            {/* Affected areas preview */}
            {region && (
              <View style={[s.affectedPreview, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[s.affectedTitle, { color: c.textSecondary }]}>
                  Will flag exercises targeting:
                </Text>
                <Text style={[s.affectedList, { color: c.text }]}>
                  Muscles: {region.muscles.join(', ') || '—'}
                </Text>
                <Text style={[s.affectedList, { color: c.text }]}>
                  Patterns: {region.patterns.join(', ') || '—'}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={s.actions}>
              <Pressable
                onPress={onClose}
                style={[s.cancelBtn, { borderColor: c.border }]}
              >
                <Text style={[s.cancelText, { color: c.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[s.saveBtn, { backgroundColor: c.primary }]}
              >
                <Text style={[s.saveText, { color: c.primaryText }]}>
                  {existing ? 'Update' : 'Save Injury'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default React.memo(InjuryModal);

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 12,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  chipScroll: {
    marginBottom: 16,
  },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 8,
    gap: 6,
  },
  regionIcon: {
    fontSize: 18,
  },
  regionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  severityIcon: {
    fontSize: 14,
  },
  severityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 56,
    textAlignVertical: 'top',
    marginBottom: 12,
    marginTop: 4,
  },
  affectedPreview: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  affectedTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  affectedList: {
    fontSize: 13,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
