// ============================================================
// src/components/parent/ChildStatsCard.tsx
// Quick stats card: total solved, correct rate, streak, assignments
// ============================================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  opacity,
  opacityToHex,
  sizes,
} from '../../constants/theme';

interface ChildStatsCardProps {
  totalSolved: number;
  correctRate: number;
  streakDays: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
}

export const ChildStatsCard: React.FC<ChildStatsCardProps> = ({
  totalSolved,
  correctRate,
  streakDays,
  assignmentsCompleted,
  assignmentsTotal,
}) => {
  const assignmentProgress =
    assignmentsTotal > 0 ? assignmentsCompleted / assignmentsTotal : 0;

  return (
    <View style={styles.container}>
      {/* Top row: 3 stat items */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statIconCircle, { backgroundColor: colors.primary + opacityToHex(opacity.subtle) }]}>
            <MaterialCommunityIcons
              name="pencil-box-multiple"
              size={20}
              color={colors.primary}
            />
          </View>
          <Text style={styles.statValue}>{totalSolved}</Text>
          <Text style={styles.statLabel}>총 풀이 수</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIconCircle, { backgroundColor: colors.success + opacityToHex(opacity.subtle) }]}>
            <MaterialCommunityIcons
              name="target"
              size={20}
              color={colors.success}
            />
          </View>
          <Text style={styles.statValue}>{correctRate}%</Text>
          <Text style={styles.statLabel}>정답률</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIconCircle, { backgroundColor: colors.warning + opacityToHex(opacity.subtle) }]}>
            <MaterialCommunityIcons
              name="fire"
              size={20}
              color={colors.warning}
            />
          </View>
          <Text style={styles.statValue}>{streakDays}일</Text>
          <Text style={styles.statLabel}>연속 학습</Text>
        </View>
      </View>

      {/* Assignment progress */}
      <View style={styles.assignmentSection}>
        <View style={styles.assignmentHeader}>
          <View style={styles.assignmentHeaderLeft}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={16}
              color={colors.secondary}
            />
            <Text style={styles.assignmentTitle}>과제 진행률</Text>
          </View>
          <Text style={styles.assignmentCount}>
            {assignmentsCompleted}/{assignmentsTotal}
          </Text>
        </View>
        <ProgressBar
          progress={assignmentProgress}
          color={
            assignmentProgress >= 0.8
              ? colors.success
              : assignmentProgress >= 0.5
              ? colors.primary
              : colors.warning
          }
          style={styles.progressBar}
          accessibilityLabel={`과제 진행률 ${Math.round(assignmentProgress * 100)}퍼센트`}
        />
        <Text style={styles.assignmentPercent}>
          {Math.round(assignmentProgress * 100)}% 완료
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIconCircle: {
    width: sizes.iconContainerMd,
    height: sizes.iconContainerMd,
    borderRadius: sizes.iconContainerMd / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.divider,
  },
  assignmentSection: {
    marginTop: spacing.md,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  assignmentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  assignmentTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  assignmentCount: {
    ...typography.label,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceVariant,
  },
  assignmentPercent: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
});
