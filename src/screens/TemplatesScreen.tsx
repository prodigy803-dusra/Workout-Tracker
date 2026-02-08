import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Pressable, Text, TextInput, Alert, StyleSheet, FlatList } from 'react-native';

import { createTemplate, listTemplates, deleteTemplate } from '../db/repositories/templatesRepo';
import {
  createDraftFromTemplate,
  discardDraft,
  finalizeSession,
  getActiveDraft,
} from '../db/repositories/sessionsRepo';
import type { Template, Session } from '../types';

export default function TemplatesScreen({ navigation }: any) {
  const [templates, setTemplates] = useState<Pick<Template, 'id' | 'name'>[]>([]);
  const [newName, setNewName] = useState('');
  const [activeDraft, setActiveDraft] = useState<Session | null>(null);

  const load = useCallback(async () => {
    const [tpls, draft] = await Promise.all([listTemplates(), getActiveDraft()]);
    setTemplates(tpls);
    setActiveDraft(draft);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const header = useMemo(() => {
    return (
      <View style={styles.header}>
        <Text style={styles.title}>Templates</Text>
        <Text style={styles.subtitle}>Fast starts. Minimal taps.</Text>
        <View style={styles.newRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="New template name"
            style={styles.input}
          />
          <Pressable
            style={styles.primaryButton}
            onPress={async () => {
              const name = newName.trim();
              if (!name) return;
              await createTemplate(name);
              setNewName('');
              await load();
            }}
          >
            <Text style={styles.primaryText}>Create</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [newName]);

  async function handleStart(templateId: number) {
    try {
      if (activeDraft && activeDraft.template_id === templateId) {
        // Same template — just resume
        navigation.navigate('Log');
        return;
      }

      if (activeDraft) {
        // Different template has an active draft
        Alert.alert(
          'Different session in progress',
          'You have an active session from another template. What do you want to do?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Finish & Start New',
              onPress: async () => {
                try {
                  await finalizeSession(activeDraft.id);
                  await createDraftFromTemplate(templateId);
                  await load();
                  navigation.navigate('Log');
                } catch (err) {
                  console.error('Error in Finish & Start New:', err);
                  Alert.alert('Error', 'Failed to start new session: ' + (err as Error).message);
                }
              },
            },
            {
              text: 'Discard & Start New',
              style: 'destructive',
              onPress: async () => {
                try {
                  await discardDraft(activeDraft.id);
                  await createDraftFromTemplate(templateId);
                  await load();
                  navigation.navigate('Log');
                } catch (err) {
                  console.error('Error in Discard & Start New:', err);
                  Alert.alert('Error', 'Failed to start new session: ' + (err as Error).message);
                }
              },
            },
          ]
        );
        return;
      }

      await createDraftFromTemplate(templateId);
      await load();
      navigation.navigate('Log');
    } catch (err) {
      console.error('Error starting session:', err);
      Alert.alert('Error', 'Failed to start session: ' + (err as Error).message);
    }
  }

  async function handleEnd() {
    if (!activeDraft) return;
    Alert.alert('End Session', 'Save and finish this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          await finalizeSession(activeDraft.id);
          await load();
        },
      },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await discardDraft(activeDraft.id);
          await load();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No templates yet</Text>
            <Text style={styles.emptyBody}>Create one above to get started.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = activeDraft?.template_id === item.id;
          return (
            <View style={[styles.card, isActive && styles.cardActive]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {isActive && <Text style={styles.activeLabel}>● Active Session</Text>}
              </View>
              
              {isActive ? (
                // Active session: Resume and End buttons
                <>
                  <View style={styles.cardActions}>
                    <Pressable
                      style={[styles.resumeButton, { flex: 1 }]}
                      onPress={() => handleStart(item.id)}
                    >
                      <Text style={styles.primaryText}>Resume Session</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.secondaryButton, { borderColor: '#C00' }]}
                      onPress={handleEnd}
                    >
                      <Text style={[styles.secondaryText, { color: '#C00' }]}>End</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.disabledNote}>
                    Edit/delete disabled during active session
                  </Text>
                </>
              ) : (
                // No active session: Start, Edit, Delete buttons
                <View style={styles.cardActions}>
                  <Pressable
                    style={[styles.primaryButton, { flex: 1 }]}
                    onPress={() => handleStart(item.id)}
                  >
                    <Text style={styles.primaryText}>Start</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('TemplateEditor', { templateId: item.id })}
                  >
                    <Text style={styles.secondaryText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.secondaryButton, { borderColor: '#C00' }]}
                    onPress={() =>
                      Alert.alert('Delete Template', `Delete "${item.name}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            await deleteTemplate(item.id);
                            await load();
                          },
                        },
                      ])
                    }
                  >
                    <Text style={[styles.secondaryText, { color: '#C00' }]}>Delete</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4F1' },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  subtitle: { marginTop: 4, color: '#666' },
  newRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#FFF', fontWeight: '600' },
  secondaryButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  secondaryText: { color: '#111', fontWeight: '600' },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  cardActive: { borderColor: '#1A7F37', borderWidth: 2 },
  activeLabel: { fontSize: 12, fontWeight: '600', color: '#1A7F37', marginTop: 2 },
  resumeButton: {
    backgroundColor: '#1A7F37',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActions: { flexDirection: 'row', gap: 10 },
  disabledNote: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  empty: { paddingHorizontal: 16, paddingVertical: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  emptyBody: { marginTop: 4, color: '#666' },
});
