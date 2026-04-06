import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  chartColors,
} from '../../src/constants/theme';
import { Button } from '../../src/components/common';
import { useResponsive } from '../../src/hooks';
import { AchievementRadar, WeaknessCard, ProgressTimeline, AnalysisSkeleton } from '../../src/components/analytics';
import { HeatMap } from '../../src/components/charts';
import { useAnalyticsStore } from '../../src/stores/analyticsStore';
import { useAuthStore } from '../../src/stores/authStore';
import type { StudentAnalytics, WeaknessAnalysis, LearningReport } from '../../src/types';

// Summary stat card
interface StatCardProps {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
}

function StatCard({ icon, iconColor, value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: iconColor + opacityToHex(opacity.subtle) }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function StudentAnalyticsScreen() {
  const { isTablet, width, contentPadding } = useResponsive();

  const user = useAuthStore((s) => s.user);
  const {
    studentAnalytics: studentAnalyticsMap,
    isLoading,
    isAnalyzing,
    error,
    fetchStudentAnalytics,
    analyzeWeakness,
    generateReport,
    getCachedWeakness,
    getCachedReport,
  } = useAnalyticsStore();

  // Local state for step-by-step loading display
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'weakness' | 'recommendations' | 'report' | 'done'>('idle');
  const [weaknessAnalysis, setWeaknessAnalysis] = useState<WeaknessAnalysis | null>(null);
  const [learningReport, setLearningReport] = useState<LearningReport | null>(null);

  const studentId = user?.id ?? '';
  const studentAnalytics: StudentAnalytics | null = studentAnalyticsMap[studentId] ?? null;

  // Fetch analytics on mount
  const fetchAnalytics = useCallback(async () => {
    if (!studentId) return;

    setAnalysisStep('idle');
    setWeaknessAnalysis(null);
    setLearningReport(null);

    try {
      // First fetch basic analytics
      const analytics = await fetchStudentAnalytics(studentId);
      if (!analytics) return;

      const submissionCount = analytics.totalSolved;

      // Check cache first
      const cachedWeakness = getCachedWeakness(studentId);
      const cachedReport = getCachedReport(studentId);

      if (cachedWeakness && cachedReport) {
        setWeaknessAnalysis(cachedWeakness);
        setLearningReport(cachedReport);
        setAnalysisStep('done');
        return;
      }

      // Step-by-step AI analysis
      setAnalysisStep('weakness');
      const weakness = await analyzeWeakness(studentId, submissionCount);
      if (weakness) {
        setWeaknessAnalysis(weakness);
      }

      setAnalysisStep('report');
      const report = await generateReport(studentId, submissionCount);
      if (report) {
        setLearningReport(report);
      }

      setAnalysisStep('done');
    } catch {
      setAnalysisStep('done');
    }
  }, [studentId, fetchStudentAnalytics, analyzeWeakness, generateReport, getCachedWeakness, getCachedReport]);

  useEffect(() => {
    if (studentId) {
      fetchAnalytics();
    }
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state
  if ((isLoading || isAnalyzing) && !studentAnalytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>내 학습 분석</Text>
        </View>
        <AnalysisSkeleton step={analysisStep} />
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !studentAnalytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>내 학습 분석</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchAnalytics}>
            다시 시도
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!studentAnalytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>내 학습 분석</Text>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chart-line" size={48} color={colors.textDisabled} />
          <Text style={styles.emptyText}>아직 분석할 풀이 데이터가 없습니다</Text>
          <Text style={styles.emptySubtext}>숙제를 풀면 AI가 학습 패턴을 분석해드립니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  const correctRate = studentAnalytics.totalSolved > 0
    ? Math.round((studentAnalytics.totalCorrect / studentAnalytics.totalSolved) * 100)
    : 0;

  // Build radar data from subjectScores
  const radarData = studentAnalytics.subjectScores.map((s) => ({
    label: s.subject,
    value: s.score,
  }));

  // Build timeline data from weeklyScores
  const timelineData = studentAnalytics.weeklyScores?.map((w) => ({
    date: w.weekLabel,
    score: w.score,
  })) ?? [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>내 학습 분석</Text>
        {isAnalyzing && (
          <View style={styles.analyzingBadge}>
            <ActivityIndicator size={14} color={colors.primary} />
            <Text style={styles.analyzingText}>분석 중...</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: contentPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary stat cards */}
        <View style={[styles.statsRow, isTablet && styles.statsRowWide]}>
          <StatCard
            icon="chart-arc"
            iconColor={colors.primary}
            value={`${studentAnalytics.overallScore}점`}
            label="전체 점수"
          />
          <StatCard
            icon="check-circle"
            iconColor={colors.success}
            value={`${correctRate}%`}
            label="정답률"
          />
          <StatCard
            icon="pencil"
            iconColor={colors.secondary}
            value={`${studentAnalytics.totalSolved}`}
            label="풀이 수"
          />
          <StatCard
            icon="fire"
            iconColor={colors.warning}
            value={`${studentAnalytics.streakDays}일`}
            label="연속 학습"
          />
        </View>

        {/* Two-column layout on wide screens */}
        <View style={[styles.contentSection, isTablet && styles.contentSectionWide]}>
          {/* Left column: Radar + Weakness */}
          <View style={[styles.column, isTablet && styles.columnLeft]}>
            {/* Achievement Radar */}
            {radarData.length > 0 && (
              <AchievementRadar
                data={radarData}
                overallScore={studentAnalytics.overallScore}
                // TODO: Pass chartColors when AchievementRadar accepts fillColor/strokeColor props
              />
            )}

            {/* Weakness section */}
            {weaknessAnalysis && weaknessAnalysis.weakTopics.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>취약 단원</Text>
                {weaknessAnalysis.weakTopics.map((wt, i) => (
                  <WeaknessCard
                    key={i}
                    topic={wt.topic}
                    score={wt.score}
                    reason={wt.reason}
                    recommendedCount={wt.recommendedCount}
                    onPressRecommend={() => {
                      // Navigate to recommended problems (future integration)
                    }}
                  />
                ))}
              </View>
            )}

            {/* Still loading weakness? Show partial skeleton */}
            {isAnalyzing && !weaknessAnalysis && (
              <AnalysisSkeleton step={analysisStep} />
            )}
          </View>

          {/* Right column: Timeline + Heatmap */}
          <View style={[styles.column, isTablet && styles.columnRight]}>
            {/* Progress Timeline */}
            {timelineData.length > 0 && (
              <ProgressTimeline data={timelineData} />
            )}

            {/* Still loading report? Show partial skeleton */}
            {isAnalyzing && !learningReport && weaknessAnalysis && (
              <View style={styles.partialLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.partialLoadingText}>리포트를 생성하고 있습니다...</Text>
              </View>
            )}

            {/* Heatmap */}
            {learningReport?.heatmapData && learningReport.heatmapData.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>단원 x 난이도 분석</Text>
                <View style={styles.heatmapContainer}>
                  <HeatMap
                    data={learningReport.heatmapData}
                    width={Math.min(width - 48, 600)}
                    // TODO: Pass chartColors when HeatMap accepts colors prop
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* AI Summary (from learningReport) */}
        {learningReport?.aiSummary && (
          <View style={styles.aiSummaryCard}>
            <View style={styles.aiSummaryHeader}>
              <MaterialCommunityIcons name="robot" size={20} color={colors.primary} />
              <Text style={styles.aiSummaryTitle}>AI 학습 진단</Text>
            </View>
            <Text style={styles.aiSummaryText}>{learningReport.aiSummary}</Text>
            {learningReport.advice && learningReport.advice.length > 0 && (
              <View style={styles.adviceList}>
                {learningReport.advice.map((adv, i) => (
                  <View key={i} style={styles.adviceItem}>
                    <MaterialCommunityIcons name="lightbulb-on" size={14} color={colors.warning} />
                    <Text style={styles.adviceText}>{adv}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Recommend button */}
        <Button
          mode="contained"
          icon="lightning-bolt"
          onPress={() => {
            // Navigate to recommended problem list (future integration)
          }}
          style={styles.recommendButton}
          fullWidth
        >
          추천 문제 풀기
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading3,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  analyzingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + opacityToHex(opacity.subtle),
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  analyzingText: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statsRowWide: {
    justifyContent: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
    maxWidth: 180,
  },
  statIconContainer: {
    width: sizes.iconContainerMd,
    height: sizes.iconContainerMd,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.heading3,
    fontWeight: '700',
    fontSize: 20,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Content layout
  contentSection: {
    gap: spacing.lg,
  },
  contentSectionWide: {
    flexDirection: 'row',
  },
  column: {
    gap: spacing.md,
  },
  columnLeft: {
    flex: 1,
  },
  columnRight: {
    flex: 1,
  },

  // Sections
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  heatmapContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },

  // Partial loading
  partialLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + opacityToHex(opacity.subtle),
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  partialLoadingText: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.primary,
  },

  // AI Summary
  aiSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.sm,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  aiSummaryTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aiSummaryText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  adviceList: {
    gap: spacing.xs,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  adviceText: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },

  // Button
  recommendButton: {
    marginTop: spacing.lg,
  },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    textAlign: 'center',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  emptySubtext: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
