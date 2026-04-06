// src/components/wrongNote/WrongNoteCard.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../common';
import MathText from '../common/MathText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import type { WrongNote, WrongNoteStatus } from '../../types/wrongNote';

// ---- Status display config ----
const STATUS_CONFIG: Record<WrongNoteStatus, {
  label: string;
  color: string;
  icon: string;
}> = {
  unreviewed: {
    label: '미복습',
    color: colors.error,
    icon: 'alert-circle-outline',
  },
  reviewing: {
    label: '복습중',
    color: colors.warning,
    icon: 'refresh',
  },
  mastered: {
    label: '숙련',
    color: colors.success,
    icon: 'check-circle',
  },
};

// ---- Difficulty display config ----
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  '상': { label: '상', color: colors.error },
  '중': { label: '중', color: colors.warning },
  '하': { label: '하', color: colors.success },
};

interface WrongNoteCardProps {
  wrongNote: WrongNote;
  onPress?: (wrongNote: WrongNote) => void;
}

export default function WrongNoteCard({ wrongNote, onPress }: WrongNoteCardProps) {
  const status = wrongNote.status;
  const statusConfig = STATUS_CONFIG[status];
  const difficultyConfig = DIFFICULTY_CONFIG[wrongNote.problem.difficulty] || DIFFICULTY_CONFIG['중'];

  // Truncate problem content for card display (first 80 chars of raw text)
  const truncatedContent = wrongNote.problem.content.length > 80
    ? wrongNote.problem.content.substring(0, 80) + '...'
    : wrongNote.problem.content;

  // Format date for display
  const createdDate = wrongNote.createdAt instanceof Date
    ? wrongNote.createdAt
    : new Date(wrongNote.createdAt);
  const dateString = `${createdDate.getMonth() + 1}/${createdDate.getDate()}`;

  // Format last review date
  const lastReviewString = wrongNote.lastReviewDate
    ? (() => {
        const d = wrongNote.lastReviewDate instanceof Date
          ? wrongNote.lastReviewDate
          : new Date(wrongNote.lastReviewDate);
        return `${d.getMonth() + 1}/${d.getDate()} 복습`;
      })()
    : null;

  return (
    <Card
      style={styles.card}
      onPress={onPress ? () => onPress(wrongNote) : undefined}
    >
      {/* Top row: status badge + date + difficulty */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '18' }]}>
            <MaterialCommunityIcons
              name={statusConfig.icon as any}
              size={14}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          {wrongNote.reviewCount > 0 && (
            <Text style={styles.reviewCountText}>
              복습 {wrongNote.reviewCount}회
            </Text>
          )}
        </View>

        <View style={styles.topRight}>
          <Chip
            compact
            style={[styles.difficultyChip, { backgroundColor: difficultyConfig.color + '15' }]}
            textStyle={{ color: difficultyConfig.color, fontSize: 11 }}
          >
            {difficultyConfig.label}
          </Chip>
          <Text style={styles.dateText}>{dateString}</Text>
        </View>
      </View>

      {/* Problem content preview (text only, no LaTeX in list) */}
      <View style={styles.problemPreview}>
        <Text style={styles.problemText} numberOfLines={2}>
          {truncatedContent}
        </Text>
      </View>

      {/* Answer comparison row */}
      <View style={styles.answerRow}>
        <View style={styles.answerBlock}>
          <View style={styles.answerLabel}>
            <MaterialCommunityIcons name="close-circle" size={14} color={colors.error} />
            <Text style={styles.answerLabelText}>내 답</Text>
          </View>
          <Text style={[styles.answerValue, { color: colors.error }]} numberOfLines={1}>
            {wrongNote.studentAnswer || '-'}
          </Text>
        </View>

        <View style={styles.answerDivider} />

        <View style={styles.answerBlock}>
          <View style={styles.answerLabel}>
            <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
            <Text style={styles.answerLabelText}>정답</Text>
          </View>
          <Text style={[styles.answerValue, { color: colors.success }]} numberOfLines={1}>
            {wrongNote.correctAnswer || '-'}
          </Text>
        </View>
      </View>

      {/* Bottom row: topic tag + consecutive correct indicator + last review date */}
      <View style={styles.bottomRow}>
        <View style={styles.topicTag}>
          <MaterialCommunityIcons name="tag" size={14} color={colors.primary} />
          <Text style={styles.topicText}>{wrongNote.problem.topic}</Text>
        </View>

        {status === 'reviewing' && (
          <View style={styles.streakIndicator}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.streakDot,
                  {
                    backgroundColor:
                      i < wrongNote.consecutiveCorrect
                        ? colors.success
                        : colors.surfaceVariant,
                  },
                ]}
              />
            ))}
            <Text style={styles.streakText}>
              {wrongNote.consecutiveCorrect}/3
            </Text>
          </View>
        )}

        {status === 'mastered' && (
          <View style={styles.learnedBadge}>
            <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
            <Text style={styles.learnedText}>숙련 완료</Text>
          </View>
        )}

        {lastReviewString && status !== 'mastered' && (
          <Text style={styles.lastReviewText}>{lastReviewString}</Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewCountText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  difficultyChip: {
    height: 24,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Problem preview
  problemPreview: {
    marginBottom: spacing.sm,
    minHeight: 40,
  },
  problemText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },

  // Answer row
  answerRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  answerBlock: {
    flex: 1,
    alignItems: 'center',
  },
  answerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  answerLabelText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  answerValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  answerDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicText: {
    fontSize: 13,
    color: colors.primary,
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  streakText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  learnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  learnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  lastReviewText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
