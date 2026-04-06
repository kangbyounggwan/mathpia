import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip, Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';
import type { ProblemBankItem } from '../../types';

// ─── Props ───────────────────────────────────────────────────
export interface ProblemCardProps {
  problem: ProblemBankItem;
  index: number;
  isSelected: boolean;
  selectionMode: boolean;
  onPress: (problem: ProblemBankItem) => void;
  onLongPress: (problem: ProblemBankItem) => void;
  onToggleSelect: (problemId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────

/** Strip LaTeX markers for plain-text summary */
const stripLatex = (content: string): string => {
  return content
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([\s\S]*?)\$/g, '$1')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]*)\}/g, 'sqrt($1)')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case '\u{c0c1}': return colors.error;
    case '\u{c911}': return colors.warning;
    case '\u{d558}': return colors.success;
    default: return colors.textSecondary;
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case '\u{ac1d}\u{ad00}\u{c2dd}': return colors.primary;
    case '\u{c11c}\u{c220}\u{d615}': return colors.warning;
    case '\u{b2e8}\u{b2f5}\u{d615}': return colors.success;
    default: return colors.textSecondary;
  }
};

const CARD_HEIGHT = 120;

// ─── Component ───────────────────────────────────────────────

function ProblemCardInner({
  problem,
  index,
  isSelected,
  selectionMode,
  onPress,
  onLongPress,
  onToggleSelect,
}: ProblemCardProps) {
  const summary =
    stripLatex(problem.content).slice(0, 80) +
    (problem.content.length > 80 ? '...' : '');

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() =>
        selectionMode ? onToggleSelect(problem.id) : onPress(problem)
      }
      onLongPress={() => onLongPress(problem)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        {/* Problem number badge */}
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{index + 1}</Text>
        </View>

        {/* Difficulty chip */}
        <Chip
          compact
          style={[
            styles.chip,
            { backgroundColor: getDifficultyColor(problem.difficulty) + '20' },
          ]}
          textStyle={{
            color: getDifficultyColor(problem.difficulty),
            fontSize: 11,
          }}
        >
          {problem.difficulty}
        </Chip>

        {/* Type chip */}
        <Chip
          compact
          style={[
            styles.chip,
            { backgroundColor: getTypeColor(problem.type) + '20' },
          ]}
          textStyle={{ color: getTypeColor(problem.type), fontSize: 11 }}
        >
          {problem.type}
        </Chip>

        {/* Topic chip */}
        <Chip compact style={[styles.chip, styles.topicChip]}>
          {problem.topic}
        </Chip>

        {/* Checkbox (selection mode) or grade badge */}
        <View style={styles.rightSection}>
          {selectionMode ? (
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => onToggleSelect(problem.id)}
              color={colors.primary}
            />
          ) : (
            <Chip compact style={styles.gradeChip}>
              {problem.grade}
            </Chip>
          )}
        </View>
      </View>

      {/* Text summary (NO LaTeX rendering for performance) */}
      <Text style={styles.summaryText} numberOfLines={2}>
        {summary}
      </Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {problem.correctRate !== undefined && (
          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="percent"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.statText}>
              {'\u{c815}\u{b2f5}\u{b960}'} {problem.correctRate}%
            </Text>
          </View>
        )}
        <View style={styles.stat}>
          <MaterialCommunityIcons
            name="clipboard-check-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.statText}>
            {'\u{c0ac}\u{c6a9}'} {problem.usageCount}
            {'\u{d68c}'}
          </Text>
        </View>
        {problem.source && (
          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.statText}>{problem.source}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Memo with custom comparison
export const ProblemCard = memo(ProblemCardInner, (prev, next) => {
  return (
    prev.problem.id === next.problem.id &&
    prev.problem.updatedAt === next.problem.updatedAt &&
    prev.isSelected === next.isSelected &&
    prev.selectionMode === next.selectionMode &&
    prev.index === next.index
  );
});

// Export fixed height for FlatList getItemLayout
export const PROBLEM_CARD_HEIGHT = CARD_HEIGHT + spacing.sm;

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    height: CARD_HEIGHT,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '15',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  chip: {
    height: 24,
  },
  topicChip: {
    backgroundColor: colors.surfaceVariant,
  },
  gradeChip: {
    backgroundColor: colors.primaryLight + '30',
  },
  rightSection: {
    marginLeft: 'auto',
  },
  summaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
