import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';

type Option = {
  session_slot_choice_id: number | null;
  template_slot_option_id: number;
  exercise_name: string;
  option_name: string | null;
};

export default function OptionChips({
  options,
  selectedTemplateOptionId,
  onSelect,
}: {
  options: Option[];
  selectedTemplateOptionId: number;
  onSelect: (templateSlotOptionId: number) => void;
}) {
  if (options.length <= 1) return null;

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const label = opt.option_name
          ? `${opt.exercise_name} (${opt.option_name})`
          : opt.exercise_name;
        const selected = opt.template_slot_option_id === selectedTemplateOptionId;
        return (
          <Pressable
            key={opt.template_slot_option_id}
            onPress={() => onSelect(opt.template_slot_option_id)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  chipSelected: { backgroundColor: '#111' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextSelected: { color: '#FFF' },
});
