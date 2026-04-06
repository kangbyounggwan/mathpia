import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface WeaknessCardProps {
  topic: string;
  score: number;           // 0-100
  reason: string;          // AI explanation in Korean
  recommendedCount: number;
  onPressRecommend?: () => void;
}

export default function WeaknessCard({
  topic,
  score,
  reason,
  recommendedCount,
  onPressRecommend,
}: WeaknessCardProps) {
  // Color based on score severity
  const getScoreColor = () => {
    if (score <= 30) return colors.error;
    if (score <= 60) return colors.warning;
    return colors.success;
  };

  const scoreColor = getScoreColor();

  return (
    <View style={styles.card}>
      {/* Header: topic name + score */}
      <View style={styles.header}>
        <View style={styles.topicRow}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={20}
            color={scoreColor}
          />
          <Text style={styles.topicName}>{topic}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{score}점</Text>
        </View>
      </View>

      {/* Score bar */}
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              { width: `${score}%` as any, backgroundColor: scoreColor },
            ]}
          />
        </View>
      </View>

      {/* AI reason */}
      <View style={styles.reasonContainer}>
        <MaterialCommunityIcons name="robot" size={14} color={colors.textSecondary} />
        <Text style={styles.reasonText}>{reason}</Text>
      </View>

      {/* Recommend button */}
      {recommendedCount > 0 && (
        <View
          style={styles.recommendRow}
          onTouchEnd={onPressRecommend}
        >
          <MaterialCommunityIcons name="lightbulb-on" size={16} color={colors.primary} />
          <Text style={styles.recommendText}>
            추천 문제 {recommendedCount}개 풀어보기
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  barContainer: {
    marginBottom: spacing.sm,
  },
  barBackground: {
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  reasonText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  recommendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  recommendText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
    flex: 1,
  },
});
