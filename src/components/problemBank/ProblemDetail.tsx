import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Portal, Modal, Button, Chip, IconButton } from 'react-native-paper';
import { colors, spacing } from '../../constants/theme';
import MathText from '../common/MathText';
import type { ProblemBankItem } from '../../types';

// ─── Props ───────────────────────────────────────────────────

interface ProblemDetailProps {
  problem: ProblemBankItem | null;
  visible: boolean;
  onDismiss: () => void;
  onEdit: (problem: ProblemBankItem) => void;
  onDelete: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────

const getDifficultyColor = (d: string) => {
  switch (d) {
    case '\u{c0c1}':
      return colors.error;
    case '\u{c911}':
      return colors.warning;
    case '\u{d558}':
      return colors.success;
    default:
      return colors.textSecondary;
  }
};

// ─── Component ───────────────────────────────────────────────

export default function ProblemDetail({
  problem,
  visible,
  onDismiss,
  onEdit,
  onDelete,
}: ProblemDetailProps) {
  if (!problem) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {'\u{bb38}\u{c81c} \u{c0c1}\u{c138}'}
          </Text>
          <IconButton icon="close" onPress={onDismiss} accessibilityLabel="닫기" />
        </View>

        <ScrollView style={styles.scrollContent}>
          {/* Meta chips */}
          <View style={styles.metaRow}>
            <Chip
              compact
              style={{
                backgroundColor: getDifficultyColor(problem.difficulty) + '20',
              }}
            >
              {problem.difficulty}
            </Chip>
            <Chip compact>{problem.type}</Chip>
            <Chip compact>{problem.grade}</Chip>
            <Chip compact>{problem.topic}</Chip>
          </View>

          {/* Full LaTeX rendering */}
          <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>
              {'\u{bb38}\u{c81c}'}
            </Text>
            <MathText content={problem.content} fontSize={16} />
          </View>

          {/* Choices for multiple-choice */}
          {problem.type === '\u{ac1d}\u{ad00}\u{c2dd}' &&
            problem.choices &&
            problem.choices.length > 0 && (
              <View style={styles.choicesBox}>
                {problem.choices.map((choice, idx) => (
                  <View key={idx} style={styles.choiceRow}>
                    <Text style={styles.choiceNum}>
                      {[
                        '\u{2460}',
                        '\u{2461}',
                        '\u{2462}',
                        '\u{2463}',
                        '\u{2464}',
                      ][idx]}
                    </Text>
                    <MathText content={choice} fontSize={14} />
                  </View>
                ))}
              </View>
            )}

          {/* Answer */}
          {problem.answer && (
            <View style={styles.contentBox}>
              <Text style={styles.sectionTitle}>
                {'\u{c815}\u{b2f5}'}
              </Text>
              <MathText
                content={problem.answer}
                fontSize={15}
                color={colors.success}
              />
            </View>
          )}

          {/* Solution */}
          {problem.solution && (
            <View style={styles.contentBox}>
              <Text style={styles.sectionTitle}>
                {'\u{d480}\u{c774}'}
              </Text>
              <MathText content={problem.solution} fontSize={14} />
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsBox}>
            <Text style={styles.sectionTitle}>
              {'\u{d1b5}\u{acc4}'}
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {problem.correctRate !== undefined
                    ? `${problem.correctRate}%`
                    : '-'}
                </Text>
                <Text style={styles.statLabel}>
                  {'\u{c815}\u{b2f5}\u{b960}'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{problem.usageCount}</Text>
                <Text style={styles.statLabel}>
                  {'\u{c0ac}\u{c6a9} \u{d69f}\u{c218}'}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{problem.points}</Text>
                <Text style={styles.statLabel}>
                  {'\u{bae0}\u{c810}'}
                </Text>
              </View>
            </View>
          </View>

          {/* Source & tags */}
          {(problem.source ||
            (problem.tags && problem.tags.length > 0)) && (
            <View style={styles.metaBox}>
              {problem.source && (
                <Text style={styles.metaText}>
                  {'\u{cd9c}\u{cc98}: '}
                  {problem.source}
                </Text>
              )}
              {problem.tags && problem.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {problem.tags.map((tag) => (
                    <Chip key={tag} compact style={styles.tagChip}>
                      #{tag}
                    </Chip>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => onDelete(problem.id)}
            textColor={colors.error}
            icon="delete"
            style={styles.actionButton}
          >
            {'\u{c0ad}\u{c81c}'}
          </Button>
          <Button
            mode="contained"
            onPress={() => onEdit(problem)}
            icon="pencil"
            style={[styles.actionButton, { flex: 2 }]}
          >
            {'\u{c218}\u{c815}'}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 16,
    maxHeight: '90%',
    maxWidth: 600,
    alignSelf: 'center',
    width: '95%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  contentBox: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant + '50',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  choicesBox: {
    marginBottom: spacing.lg,
    paddingLeft: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary + '40',
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  choiceNum: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    width: 24,
  },
  statsBox: {
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant + '40',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metaBox: {
    marginBottom: spacing.lg,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tagChip: {
    backgroundColor: colors.surfaceVariant,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  actionButton: {
    flex: 1,
  },
});
