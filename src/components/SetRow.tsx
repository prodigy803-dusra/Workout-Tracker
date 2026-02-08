import React, { memo } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { Controller } from 'react-hook-form';
import { useUnit } from '../contexts/UnitContext';

function SetRow({
  choiceId,
  index,
  control,
  onFieldChange,
  onDelete,
}: {
  choiceId: number;
  index: number;
  control: any;
  onFieldChange: () => void;
  onDelete: () => void;
}) {
  const { unit } = useUnit();
  const baseName = `sets.${choiceId}.${index}`;

  return (
    <View style={styles.row}>
      <Text style={styles.index}>#{index + 1}</Text>
      <Controller
        control={control}
        name={`${baseName}.weight` as any}
        render={({ field: { onChange, value } }) => (
          <TextInput
            keyboardType="decimal-pad"
            placeholder={unit}
            value={String(value ?? '')}
            onChangeText={(text) => {
              onChange(text);
              onFieldChange();
            }}
            style={[styles.input, { flex: 1 }]}
          />
        )}
      />
      <Controller
        control={control}
        name={`${baseName}.reps` as any}
        render={({ field: { onChange, value } }) => (
          <TextInput
            keyboardType="number-pad"
            placeholder="reps"
            value={String(value ?? '')}
            onChangeText={(text) => {
              onChange(text);
              onFieldChange();
            }}
            style={[styles.input, { width: 64 }]}
          />
        )}
      />
      <Controller
        control={control}
        name={`${baseName}.rpe` as any}
        render={({ field: { onChange, value } }) => (
          <TextInput
            keyboardType="decimal-pad"
            placeholder="rpe"
            value={String(value ?? '')}
            onChangeText={(text) => {
              onChange(text);
              onFieldChange();
            }}
            style={[styles.input, { width: 64 }]}
          />
        )}
      />
      <Pressable onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  index: { width: 28, fontSize: 13, color: '#AAA', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FAFAFA',
    padding: 8,
    borderRadius: 8,
    fontSize: 15,
  },
  deleteBtn: { padding: 6 },
  deleteBtnText: { color: '#C00', fontSize: 14 },
});

export default memo(SetRow);
