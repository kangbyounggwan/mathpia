// src/components/wrongNote/WrongNoteStats.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';
import type { WrongNoteStats as WrongNoteStatsType } from '../../types/wrongNote';

interface WrongNoteStatsProps {
  stats: WrongNoteStatsType | null;
}

export default function WrongNoteStats({ stats }: WrongNoteStatsProps) {
  const total = stats?.total ?? 0;
  const unreviewed = stats?.unreviewed ?? 0;
  const reviewing = stats?.reviewing ?? 0;
  const mastered = stats?.mastered ?? 0;
  const masteryRate = stats?.masteryRate ?? 0;

  // Calculate progress for the bar (mastery rate is 0-100 from the service)
  const progressValue = total > 0 ? masteryRate / 100 : 0;

  return (
    <View style={styles.container}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>총 오답</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {unreviewed}
          </Text>
          <Text style={styles.statLabel}>미복습</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {reviewing}
          </Text>
          <Text style={styles.statLabel}>복습중</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {mastered}
          </Text>
          <Text style={styles.statLabel}>숙련</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <View style={styles.progressLabelRow}>
            <MaterialCommunityIcons name="trophy-outline" size={16} color={colors.primary} />
            <Text style={styles.progressLabel}>숙련율</Text>
          </View>
          <Text style={[styles.progressPercent, { color: colors.primary }]}>
            {masteryRate}%
          </Text>
        </View>
        <ProgressBar
          progress={progressValue}
          color={colors.primary}
          style={styles.progressBar}
          accessibilityLabel={`숙련율 ${masteryRate}퍼센트`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Progress
  progressSection: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceVariant,
  },
});
