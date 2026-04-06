import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Portal,
  Modal,
  Button,
  TextInput,
  Chip,
  SegmentedButtons,
  IconButton,
  Switch,
} from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { getSubjectsByGrade, getAllGrades } from '../../constants/curriculum';
import MathText from '../common/MathText';
import type { ProblemBankItem, Difficulty, ProblemType, Grade } from '../../types';

// ─── Types ───────────────────────────────────────────────────

export interface ProblemFormData {
  content: string;
  answer: string;
  solution: string;
  difficulty: Difficulty;
  type: ProblemType;
  choices: string[];
  grade: Grade;
  subject: string;
  topic: string;
  tags: string[];
  source: string;
  points: number;
}

interface ProblemFormProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (data: ProblemFormData) => Promise<void>;
  initialData?: ProblemBankItem;
}

// ─── Constants ───────────────────────────────────────────────

const DIFFICULTIES: Difficulty[] = ['\u{d558}', '\u{c911}', '\u{c0c1}'];
const TYPES: ProblemType[] = [
  '\u{ac1d}\u{ad00}\u{c2dd}',
  '\u{c11c}\u{c220}\u{d615}',
  '\u{b2e8}\u{b2f5}\u{d615}',
];

// ─── Component ───────────────────────────────────────────────

export default function ProblemForm({
  visible,
  onDismiss,
  onSave,
  initialData,
}: ProblemFormProps) {
  const isEditMode = !!initialData;

  // Form state
  const [content, setContent] = useState('');
  const [answer, setAnswer] = useState('');
  const [solution, setSolution] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('\u{c911}');
  const [type, setType] = useState<ProblemType>('\u{b2e8}\u{b2f5}\u{d615}');
  const [choices, setChoices] = useState<string[]>(['', '', '', '', '']);
  const [grade, setGrade] = useState<Grade>('\uace0\u0031' as Grade);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState('');
  const [source, setSource] = useState('');
  const [points, setPoints] = useState('10');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      setContent(initialData.content);
      setAnswer(initialData.answer || '');
      setSolution(initialData.solution || '');
      setDifficulty(initialData.difficulty);
      setType(initialData.type);
      setChoices(initialData.choices || ['', '', '', '', '']);
      setGrade(initialData.grade);
      setSubject(initialData.subject);
      setTopic(initialData.topic);
      setTags(initialData.tags?.join(', ') || '');
      setSource(initialData.source || '');
      setPoints(String(initialData.points));
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setContent('');
    setAnswer('');
    setSolution('');
    setDifficulty('\u{c911}');
    setType('\u{b2e8}\u{b2f5}\u{d615}');
    setChoices(['', '', '', '', '']);
    setGrade('\uace0\u0031' as Grade);
    setSubject('');
    setTopic('');
    setTags('');
    setSource('');
    setPoints('10');
    setShowPreview(false);
  };

  // Dynamic subject/topic options based on grade
  const subjects = useMemo(() => getSubjectsByGrade(grade), [grade]);
  const topicOptions = useMemo(() => {
    const found = subjects.find((s) => s.name === subject);
    return found?.chapters || [];
  }, [subjects, subject]);

  const updateChoice = (index: number, value: string) => {
    const next = [...choices];
    next[index] = value;
    setChoices(next);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        content: content.trim(),
        answer: answer.trim(),
        solution: solution.trim(),
        difficulty,
        type,
        choices:
          type === '\u{ac1d}\u{ad00}\u{c2dd}'
            ? choices.filter((c) => c.trim())
            : [],
        grade,
        subject,
        topic,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        source: source.trim(),
        points: parseInt(points, 10) || 10,
      });
      resetForm();
      onDismiss();
    } catch (e) {
      console.error('\u{bb38}\u{c81c} \u{c800}\u{c7a5} \u{c2e4}\u{d328}:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditMode
                ? '\u{bb38}\u{c81c} \u{c218}\u{c815}'
                : '\u{bb38}\u{c81c} \u{b4f1}\u{b85d}'}
            </Text>
            <IconButton icon="close" onPress={onDismiss} accessibilityLabel="닫기" />
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Grade selector */}
            <Text style={styles.sectionLabel}>
              {'\u{d559}\u{b144} *'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getAllGrades().map((g) => (
                <Chip
                  key={g}
                  selected={grade === g}
                  onPress={() => {
                    setGrade(g);
                    setSubject('');
                    setTopic('');
                  }}
                  style={styles.selectorChip}
                  showSelectedCheck={false}
                  selectedColor={colors.primary}
                >
                  {g}
                </Chip>
              ))}
            </ScrollView>

            {/* Subject selector */}
            <Text style={styles.sectionLabel}>
              {'\u{acfc}\u{baa9} *'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {subjects.map((s) => (
                <Chip
                  key={s.id}
                  selected={subject === s.name}
                  onPress={() => {
                    setSubject(s.name);
                    setTopic('');
                  }}
                  style={styles.selectorChip}
                  showSelectedCheck={false}
                  selectedColor={colors.primary}
                >
                  {s.name}
                </Chip>
              ))}
            </ScrollView>

            {/* Topic selector */}
            {topicOptions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>
                  {'\u{b2e8}\u{c6d0} *'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {topicOptions.map((t) => (
                    <Chip
                      key={t}
                      selected={topic === t}
                      onPress={() => setTopic(t)}
                      style={styles.selectorChip}
                      showSelectedCheck={false}
                      selectedColor={colors.secondary}
                    >
                      {t}
                    </Chip>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Difficulty */}
            <Text style={styles.sectionLabel}>
              {'\u{b09c}\u{c774}\u{b3c4} *'}
            </Text>
            <SegmentedButtons
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as Difficulty)}
              buttons={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
              style={styles.segmented}
            />

            {/* Type */}
            <Text style={styles.sectionLabel}>
              {'\u{c720}\u{d615} *'}
            </Text>
            <SegmentedButtons
              value={type}
              onValueChange={(v) => setType(v as ProblemType)}
              buttons={TYPES.map((t) => ({ value: t, label: t }))}
              style={styles.segmented}
            />

            {/* Content (LaTeX input) */}
            <View style={styles.contentHeader}>
              <Text style={styles.sectionLabel}>
                {'\u{bb38}\u{c81c} \u{b0b4}\u{c6a9} * (LaTeX \u{c9c0}\u{c6d0}: $...$)'}
              </Text>
              <View style={styles.previewToggle}>
                <Text style={styles.previewLabel}>
                  {'\u{bbf8}\u{b9ac}\u{bcf4}\u{ae30}'}
                </Text>
                <Switch value={showPreview} onValueChange={setShowPreview} />
              </View>
            </View>
            <TextInput
              mode="outlined"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              style={styles.textArea}
              placeholder={
                '\u{c608}: $x^2 + 3x + 2 = 0$\u{c758} \u{d574}\u{b97c} \u{ad6c}\u{d558}\u{c2dc}\u{c624}.'
              }
            />
            {showPreview && content.trim() && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>
                  {'\u{bbf8}\u{b9ac}\u{bcf4}\u{ae30}:'}
                </Text>
                <MathText content={content} fontSize={15} />
              </View>
            )}

            {/* Choices (only for multiple-choice) */}
            {type === '\u{ac1d}\u{ad00}\u{c2dd}' && (
              <>
                <Text style={styles.sectionLabel}>
                  {'\u{bcf4}\u{ae30}'}
                </Text>
                {choices.map((choice, idx) => (
                  <View key={idx} style={styles.choiceRow}>
                    <Text style={styles.choiceLabel}>
                      {[
                        '\u{2460}',
                        '\u{2461}',
                        '\u{2462}',
                        '\u{2463}',
                        '\u{2464}',
                      ][idx]}
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={choice}
                      onChangeText={(v) => updateChoice(idx, v)}
                      style={styles.choiceInput}
                      placeholder={`\u{bcf4}\u{ae30} ${idx + 1}`}
                      dense
                    />
                  </View>
                ))}
              </>
            )}

            {/* Answer */}
            <Text style={styles.sectionLabel}>
              {'\u{c815}\u{b2f5}'}
            </Text>
            <TextInput
              mode="outlined"
              value={answer}
              onChangeText={setAnswer}
              style={styles.input}
              placeholder={
                type === '\u{ac1d}\u{ad00}\u{c2dd}'
                  ? '\u{c608}: \u{2462}'
                  : '\u{c608}: $x = -1$ \u{b610}\u{b294} $x = -2$'
              }
              dense
            />

            {/* Solution */}
            <Text style={styles.sectionLabel}>
              {'\u{d480}\u{c774}'}
            </Text>
            <TextInput
              mode="outlined"
              value={solution}
              onChangeText={setSolution}
              multiline
              numberOfLines={3}
              style={styles.textArea}
              placeholder={
                '\ub2e8\uacc4\ubcc4 \ud480\uc774\ub97c \uc785\ub825\ud558\uc138\uc694 (LaTeX \uc9c0\uc6d0)'
              }
            />

            {/* Source */}
            <Text style={styles.sectionLabel}>
              {'\u{cd9c}\u{cc98}'}
            </Text>
            <TextInput
              mode="outlined"
              value={source}
              onChangeText={setSource}
              style={styles.input}
              placeholder={
                '\u{c608}: 2024 \u{c218}\u{b2a5} \u{baa8}\u{c758}\u{ace0}\u{c0ac}'
              }
              dense
            />

            {/* Tags */}
            <Text style={styles.sectionLabel}>
              {'\u{d0dc}\u{adf8} (\u{c274}\u{d45c}\u{b85c} \u{ad6c}\u{bd84})'}
            </Text>
            <TextInput
              mode="outlined"
              value={tags}
              onChangeText={setTags}
              style={styles.input}
              placeholder={
                '\uc608: \uc778\uc218\ubd84\ud574, \uadfc\uc758\uacf5\uc2dd, \ud310\ubcc4\uc2dd'
              }
              dense
            />

            {/* Points */}
            <Text style={styles.sectionLabel}>
              {'\u{bae0}\u{c810}'}
            </Text>
            <TextInput
              mode="outlined"
              value={points}
              onChangeText={setPoints}
              keyboardType="numeric"
              style={styles.input}
              placeholder="10"
              dense
            />

            {/* Spacer for bottom buttons */}
            <View style={{ height: 80 }} />
          </ScrollView>

          {/* Bottom action buttons */}
          <View style={styles.bottomButtons}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.cancelButton}
            >
              {'\u{ce58}\u{c18c}'}
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isSaving}
              disabled={
                !content.trim() || !grade || !subject || !topic || isSaving
              }
              style={styles.saveButton}
            >
              {isEditMode
                ? '\u{c218}\u{c815}'
                : '\u{b4f1}\u{b85d}'}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 16,
    maxHeight: '90%',
    maxWidth: 600,
    alignSelf: 'center',
    width: '95%',
  },
  keyboardAvoid: {
    flex: 1,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  selectorChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  segmented: {
    marginBottom: spacing.sm,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  previewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  textArea: {
    backgroundColor: colors.surface,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.surface,
    fontSize: 14,
  },
  previewBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
  },
  previewTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  choiceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    width: 24,
    textAlign: 'center',
  },
  choiceInput: {
    flex: 1,
    backgroundColor: colors.surface,
    fontSize: 14,
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});
