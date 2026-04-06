import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import RadarChart from '../charts/RadarChart';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useResponsive } from '../../hooks';

interface AchievementRadarProps {
  data: { label: string; value: number }[];
  title?: string;
  overallScore?: number;
}

export default function AchievementRadar({
  data,
  title = '단원별 역량 분석',
  overallScore,
}: AchievementRadarProps) {
  const { width } = useResponsive();
  // Responsive: on wide screens use 320, on narrow screens use width - 80
  const chartSize = Math.min(320, width - 80);

  // Find strongest and weakest
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <View style={styles.card}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {overallScore !== undefined && (
          <View style={styles.overallBadge}>
            <Text style={styles.overallText}>평균 {overallScore}점</Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <RadarChart data={data} size={chartSize} />
      </View>

      {/* Summary legend */}
      {data.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.summaryLabel}>강점</Text>
            <Text style={styles.summaryValue}>
              {strongest?.label} ({strongest?.value}점)
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={[styles.dot, { backgroundColor: colors.error }]} />
            <Text style={styles.summaryLabel}>약점</Text>
            <Text style={styles.summaryValue}>
              {weakest?.label} ({weakest?.value}점)
            </Text>
          </View>
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
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  overallBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  overallText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
