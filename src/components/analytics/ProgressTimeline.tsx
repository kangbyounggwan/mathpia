import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import LineChart from '../charts/LineChart';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { useResponsive } from '../../hooks';

interface ProgressTimelineProps {
  data: { date: string; score: number }[];
  title?: string;
}

export default function ProgressTimeline({
  data,
  title = '성적 변화 추이',
}: ProgressTimelineProps) {
  const { width } = useResponsive();
  const chartWidth = Math.min(width - 48, 700);

  const [period, setPeriod] = useState<string>('4weeks');

  // Filter data by period
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date;

    switch (period) {
      case '1week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '4weeks':
        cutoffDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    }

    return data.filter((d) => new Date(d.date) >= cutoffDate);
  }, [data, period]);

  // Compute trend
  const trend = useMemo(() => {
    if (filteredData.length < 2) return { direction: 'stable' as const, diff: 0 };
    const first = filteredData[0].score;
    const last = filteredData[filteredData.length - 1].score;
    const diff = last - first;
    return {
      direction: diff > 2 ? ('up' as const) : diff < -2 ? ('down' as const) : ('stable' as const),
      diff,
    };
  }, [filteredData]);

  const trendColor =
    trend.direction === 'up' ? colors.success :
    trend.direction === 'down' ? colors.error :
    colors.textSecondary;

  const trendIcon =
    trend.direction === 'up' ? '+' :
    trend.direction === 'down' ? '' :
    '';

  return (
    <View style={styles.card}>
      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {filteredData.length >= 2 && (
          <View style={[styles.trendBadge, { backgroundColor: trendColor + '15' }]}>
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trendIcon}{trend.diff}점
            </Text>
          </View>
        )}
      </View>

      {/* Period toggle */}
      <SegmentedButtons
        value={period}
        onValueChange={setPeriod}
        buttons={[
          { value: '1week', label: '1주' },
          { value: '4weeks', label: '4주' },
          { value: '3months', label: '3개월' },
        ]}
        style={styles.segmentButtons}
      />

      {/* Chart */}
      <View style={styles.chartContainer}>
        <LineChart data={filteredData} width={chartWidth} height={220} />
      </View>

      {/* Summary stats */}
      {filteredData.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(filteredData.reduce((s, d) => s + d.score, 0) / filteredData.length)}점
            </Text>
            <Text style={styles.statLabel}>평균</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.max(...filteredData.map((d) => d.score))}점
            </Text>
            <Text style={styles.statLabel}>최고</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.min(...filteredData.map((d) => d.score))}점
            </Text>
            <Text style={styles.statLabel}>최저</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{filteredData.length}회</Text>
            <Text style={styles.statLabel}>테스트</Text>
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
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentButtons: {
    marginBottom: spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
