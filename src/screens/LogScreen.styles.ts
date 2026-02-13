/**
 * Shared styles for LogScreen and its sub-components.
 *
 * Mechanically extracted from the bottom of the original LogScreen.tsx.
 * No changes to any values — purely structural move.
 */
import { StyleSheet } from 'react-native';

/* ── Active-workout styles ────────────────────────────────── */

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F6F4F1' },

  // Summary card
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', fontVariant: ['tabular-nums'] },
  summaryLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '600' },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#1A7F37',
    borderRadius: 3,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F6F4F1',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  emptyBody: { fontSize: 14, color: '#888', marginTop: 6, textAlign: 'center' },
  emptyDiscardBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyDiscardBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  discardBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  discardBtnText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  finishBtn: {
    backgroundColor: '#1A7F37',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flex: 2,
  },
  finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  slotCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E6E1DB',
    overflow: 'hidden',
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FAFAFA',
  },
  slotHeaderContent: { flex: 1 },
  slotTitleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  slotTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  infoBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E6E1DB',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  infoBtnText: { fontSize: 13, fontWeight: '700', color: '#555' },
  slotSubtitle: { fontSize: 13, color: '#888', marginBottom: 4 },
  chevron: { fontSize: 16, color: '#888', marginLeft: 12 },
  slotContent: { padding: 14 },
  noSetsText: { fontSize: 14, color: '#999', marginTop: 12, textAlign: 'center', fontStyle: 'italic' },
  progressText: { fontSize: 12, color: '#1A7F37', marginTop: 4, fontWeight: '600' },
  setsHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  colLabel: { fontSize: 11, color: '#AAA', fontWeight: '600', width: 28 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  setRowCompleted: {
    backgroundColor: '#F0FFF4',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1A7F37',
  },
  setIndex: { width: 28, fontSize: 13, color: '#888', fontWeight: '600' },
  setValue: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  setInput: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlign: 'center',
  },
  completedInput: {
    color: '#999',
    backgroundColor: '#F0FFF4',
    borderColor: '#D0E8D6',
  },
  completedText: { color: '#999', textDecorationLine: 'line-through' },

  // Last time panel
  lastTimeContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F6F4F1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  lastTimeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginBottom: 4,
  },
  lastTimeSets: { gap: 2 },
  lastTimeSet: { fontSize: 13, color: '#666' },

  // Progressive overload suggestion
  suggestionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBE6',
    borderWidth: 1,
    borderColor: '#F5D76E',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  suggestionIcon: { fontSize: 16 },
  suggestionText: { fontSize: 13, color: '#7A6B00', flex: 1 },

  // Warm-up generator
  warmupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 6,
  },
  warmupBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // RPE chip
  rpeChip: {
    width: 52,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Session notes
  notesToggle: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  notesToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    height: 80,
    marginBottom: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },

  // Timer Modal Styles
  timerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    width: 320,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  timerDisplay: {
    fontSize: 72,
    fontWeight: '700',
    color: '#1A7F37',
    marginBottom: 24,
    fontVariant: ['tabular-nums'],
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timerBtn: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timerBtnPrimary: {
    backgroundColor: '#1A7F37',
  },
  timerBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timerBtnTextPrimary: {
    color: '#FFF',
  },
  timerSkipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  timerSkipText: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'underline',
  },

  // Timer progress bar
  timerProgressBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginBottom: 20,
    overflow: 'hidden' as const,
  },
  timerProgressFill: {
    height: 6,
    borderRadius: 3,
  },

  // Next-set preview in timer modal
  nextSetPreview: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  nextSetLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  nextSetExercise: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  nextSetDetail: {
    fontSize: 14,
  },

  // Drop-set segments
  dropSegmentRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingLeft: 36,
    borderBottomWidth: 1,
  },
  dropArrow: {
    fontSize: 16,
    marginRight: 2,
  },
  dropInput: {
    fontSize: 14,
    fontWeight: '500' as const,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    textAlign: 'center' as const,
    width: 64,
  },
  dropX: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  dropDeleteBtn: {
    fontSize: 14,
    fontWeight: '700' as const,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  addDropBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    paddingLeft: 36,
  },
  addDropBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },

  // Swipe to delete
  swipeDelete: {
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    borderRadius: 0,
  },
  swipeDeleteText: {
    fontSize: 20,
  },
});

/* ── Idle-screen styles ───────────────────────────────────── */

export const idle = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F4F1' },
  content: { padding: 20, paddingBottom: 40 },

  hero: { marginBottom: 28 },
  greeting: { fontSize: 16, color: '#888', marginBottom: 4 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 10,
  },

  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  templateCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    width: '48%' as any,
    flexGrow: 1,
    flexBasis: '46%',
    borderWidth: 1,
    borderColor: '#E6E1DB',
    minHeight: 100,
    justifyContent: 'space-between',
  },
  templateIcon: { fontSize: 22, marginBottom: 8 },
  templateName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  templateAction: { fontSize: 13, fontWeight: '600', color: '#4A90D9' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E1DB',
  },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },

  allTimeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  allTimeNum: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  allTimeLabel: { fontSize: 15, color: '#AAA' },

  onboarding: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  onboardingIcon: { fontSize: 48, marginBottom: 12 },
  onboardingTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  onboardingBody: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  onboardingBtn: {
    backgroundColor: '#111',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  onboardingBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
