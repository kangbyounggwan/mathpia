import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { Text, Searchbar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  colors, spacing, borderRadius, tabletSizes,
  typography, roleColors, shadows, sizes, chartColors, opacityToHex, opacity,
} from '../../src/constants/theme';
import { Button, SkeletonLoader, SkeletonStatCard } from '../../src/components/common';
import { useRoleTheme, useResponsive } from '../../src/hooks';
import { AchievementRadar, WeaknessCard, ProgressTimeline, AnalysisSkeleton } from '../../src/components/analytics';
import { BarChart, HeatMap } from '../../src/components/charts';
import { useAnalyticsStore } from '../../src/stores/analyticsStore';
import type { StudentAnalytics, WeaknessAnalysis, LearningReport } from '../../src/types';

// Lightweight student entry for the picker list
interface StudentListItem {
  id: string;
  name: string;
  grade: string;
}

export default function TeacherStudentAnalyticsScreen() {
  const { isTablet, width, contentPadding } = useResponsive();
  const { studentId: initialStudentId } = useLocalSearchParams<{ studentId?: string }>();
  const { accent, accentLight } = useRoleTheme();

  const {
    studentAnalytics: studentAnalyticsMap,
    classAnalytics,
    isLoading,
    isAnalyzing,
    error,
    fetchStudentAnalytics,
    fetchClassAnalytics,
    analyzeWeakness,
    generateReport,
    getCachedWeakness,
    getCachedReport,
    invalidateCache,
    triggerManualAnalysis,
  } = useAnalyticsStore();

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStudentList, setShowStudentList] = useState(true);

  // Local state for analysis progress
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'weakness' | 'recommendations' | 'report' | 'done'>('idle');
  const [weaknessAnalysis, setWeaknessAnalysis] = useState<WeaknessAnalysis | null>(null);
  const [learningReport, setLearningReport] = useState<LearningReport | null>(null);

  // Derive student list from classAnalytics or use a basic fallback
  const studentList: StudentListItem[] = (() => {
    if (classAnalytics) {
      const allStudents: StudentListItem[] = [];
      const seen = new Set<string>();
      const addStudents = (list: { studentId: string; name: string; score: number }[]) => {
        for (const s of list) {
          if (!seen.has(s.studentId)) {
            seen.add(s.studentId);
            allStudents.push({ id: s.studentId, name: s.name, grade: '' });
          }
        }
      };
      if (classAnalytics.topPerformers) addStudents(classAnalytics.topPerformers);
      if (classAnalytics.strugglingStudents) addStudents(classAnalytics.strugglingStudents);
      return allStudents;
    }
    return [];
  })();

  const selectedAnalytics: StudentAnalytics | null = selectedStudentId
    ? studentAnalyticsMap[selectedStudentId] ?? null
    : null;

  // Fetch student list on mount
  useEffect(() => {
    fetchClassAnalytics('teacher-1');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle initial studentId from route params
  useEffect(() => {
    if (initialStudentId && !selectedStudentId) {
      handleSelectStudent(initialStudentId);
    }
  }, [initialStudentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredStudents = studentList.filter((s) =>
    s.name.includes(searchQuery) || s.grade.includes(searchQuery)
  );

  const selectedStudent = studentList.find((s) => s.id === selectedStudentId);

  const handleSelectStudent = useCallback(async (sid: string) => {
    setSelectedStudentId(sid);
    setShowStudentList(false);
    setWeaknessAnalysis(null);
    setLearningReport(null);
    setAnalysisStep('idle');

    try {
      const analytics = await fetchStudentAnalytics(sid);
      if (!analytics) return;

      const submissionCount = analytics.totalSolved;

      // Check cache
      const cachedWeakness = getCachedWeakness(sid);
      const cachedReport = getCachedReport(sid);

      if (cachedWeakness && cachedReport) {
        setWeaknessAnalysis(cachedWeakness);
        setLearningReport(cachedReport);
        setAnalysisStep('done');
        return;
      }

      // Step-by-step analysis
      setAnalysisStep('weakness');
      const weakness = await analyzeWeakness(sid, submissionCount);
      if (weakness) setWeaknessAnalysis(weakness);

      setAnalysisStep('report');
      const report = await generateReport(sid, submissionCount);
      if (report) setLearningReport(report);

      setAnalysisStep('done');
    } catch {
      setAnalysisStep('done');
    }
  }, [fetchStudentAnalytics, analyzeWeakness, generateReport, getCachedWeakness, getCachedReport]);

  const handleRunDiagnosis = useCallback(async () => {
    if (!selectedStudentId) return;

    setWeaknessAnalysis(null);
    setLearningReport(null);
    setAnalysisStep('weakness');

    try {
      const analytics = selectedAnalytics;
      const submissionCount = analytics?.totalSolved ?? 0;

      invalidateCache(selectedStudentId);
      await triggerManualAnalysis(selectedStudentId, submissionCount);

      // Refresh local state from cache
      const weakness = getCachedWeakness(selectedStudentId);
      const report = getCachedReport(selectedStudentId);
      if (weakness) setWeaknessAnalysis(weakness);
      if (report) setLearningReport(report);
      setAnalysisStep('done');
    } catch {
      setAnalysisStep('done');
    }
  }, [selectedStudentId, selectedAnalytics, invalidateCache, triggerManualAnalysis, getCachedWeakness, getCachedReport]);

  const handleClearAndChangeStudent = useCallback(() => {
    setShowStudentList(true);
    setSelectedStudentId(null);
    setWeaknessAnalysis(null);
    setLearningReport(null);
    setAnalysisStep('idle');
  }, []);

  const correctRate = selectedAnalytics?.totalSolved
    ? Math.round((selectedAnalytics.totalCorrect / selectedAnalytics.totalSolved) * 100)
    : 0;

  // Build chart data from selected analytics
  const radarData = selectedAnalytics?.subjectScores?.map((s) => ({
    label: s.subject,
    value: s.score,
  })) ?? [];

  const barData = selectedAnalytics?.subjectScores?.map((s) => ({
    label: s.subject,
    value: s.totalProblems > 0
      ? Math.round((s.correctProblems / s.totalProblems) * 100)
      : 0,
  })) ?? [];

  const timelineData = selectedAnalytics?.weeklyScores?.map((w) => ({
    date: w.weekLabel,
    score: w.score,
  })) ?? [];

  // Teacher-specific chart colors (indigo instead of blue)
  const teacherChartColors = {
    primaryFill: chartColors.secondaryFill,
    primaryStroke: chartColors.secondaryStroke,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={sizes.iconMd} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>학생 학습 분석</Text>
        {selectedStudent && (
          <TouchableOpacity
            onPress={handleClearAndChangeStudent}
            style={styles.changeStudentButton}
          >
            <Text style={[styles.changeStudentText, { color: accent }]}>학생 변경</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Student selector */}
      {showStudentList && (
        <View style={styles.selectorContainer}>
          <Searchbar
            placeholder="학생 이름 또는 학년 검색"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          {isLoading && studentList.length === 0 ? (
            <View style={styles.loadingContainer}>
              <SkeletonLoader variant="listItem" count={5} gap={spacing.sm} />
            </View>
          ) : (
            <FlatList
              data={filteredStudents}
              keyExtractor={(item) => item.id}
              style={styles.studentList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.studentItem,
                    selectedStudentId === item.id && { borderColor: accent, borderWidth: 2 },
                  ]}
                  onPress={() => handleSelectStudent(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.studentAvatar, { backgroundColor: accent }]}>
                    <Text style={styles.studentAvatarText}>{item.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    {item.grade ? <Text style={styles.studentGrade}>{item.grade}</Text> : null}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={sizes.iconSm} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      )}

      {/* Analytics content (after student is selected) */}
      {selectedStudentId && !showStudentList && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { padding: contentPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Selected student info bar */}
          <View style={styles.studentInfoBar}>
            <View style={styles.studentInfoBarLeft}>
              <View style={[styles.studentAvatarLarge, { backgroundColor: accent }]}>
                <Text style={styles.studentAvatarLargeText}>
                  {selectedStudent?.name.charAt(0) ?? '?'}
                </Text>
              </View>
              <View>
                <Text style={styles.studentInfoName}>{selectedStudent?.name ?? '학생'}</Text>
                {selectedStudent?.grade ? (
                  <Text style={styles.studentInfoGrade}>{selectedStudent.grade}</Text>
                ) : null}
              </View>
            </View>
            <Button
              mode="contained"
              icon="brain"
              onPress={handleRunDiagnosis}
              loading={isAnalyzing}
              disabled={isAnalyzing}
            >
              AI 진단 실행
            </Button>
          </View>

          {/* Loading state */}
          {(isLoading || isAnalyzing) && !selectedAnalytics && (
            <AnalysisSkeleton step={analysisStep} />
          )}

          {/* Skeleton stat cards while analytics loading */}
          {isLoading && selectedStudentId && !selectedAnalytics && (
            <View style={styles.statsRow}>
              <SkeletonStatCard style={{ flex: 1 }} />
              <SkeletonStatCard style={{ flex: 1 }} />
              <SkeletonStatCard style={{ flex: 1 }} />
              <SkeletonStatCard style={{ flex: 1 }} />
            </View>
          )}

          {/* Error */}
          {error && !selectedAnalytics && (
            <View style={[styles.errorCard, { backgroundColor: colors.error + opacityToHex(opacity.subtle) }]}>
              <MaterialCommunityIcons name="alert-circle" size={sizes.iconMd} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Analytics data */}
          {selectedAnalytics && (
            <>
              {/* Summary stats */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{selectedAnalytics.overallScore}점</Text>
                  <Text style={styles.statLabel}>전체 점수</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{correctRate}%</Text>
                  <Text style={styles.statLabel}>정답률</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{selectedAnalytics.totalSolved}</Text>
                  <Text style={styles.statLabel}>풀이 수</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{selectedAnalytics.streakDays}일</Text>
                  <Text style={styles.statLabel}>연속 학습</Text>
                </View>
              </View>

              {/* Two-column layout */}
              <View style={[styles.contentSection, isTablet && styles.contentSectionWide]}>
                <View style={[styles.column, isTablet && styles.columnLeft]}>
                  {/* Radar */}
                  {radarData.length > 0 && (
                    <AchievementRadar
                      data={radarData}
                      overallScore={selectedAnalytics.overallScore}
                    />
                  )}

                  {/* Weakness */}
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
                        />
                      ))}
                    </View>
                  )}
                </View>

                <View style={[styles.column, isTablet && styles.columnRight]}>
                  {/* Bar chart: subject correct rates */}
                  {barData.length > 0 && (
                    <View style={styles.chartCard}>
                      <Text style={styles.sectionTitle}>단원별 정답률</Text>
                      <BarChart
                        data={barData}
                        width={Math.min(width - 48, 600)}
                        height={220}
                        barColor={teacherChartColors.primaryStroke}
                      />
                    </View>
                  )}

                  {/* Timeline */}
                  {timelineData.length > 0 && (
                    <ProgressTimeline data={timelineData} />
                  )}

                  {/* Heatmap */}
                  {learningReport?.heatmapData && learningReport.heatmapData.length > 0 && (
                    <View style={styles.chartCard}>
                      <Text style={styles.sectionTitle}>단원 x 난이도 분석</Text>
                      <HeatMap
                        data={learningReport.heatmapData}
                        width={Math.min(width - 48, 600)}
                      />
                    </View>
                  )}
                </View>
              </View>

              {/* AI Summary */}
              {learningReport?.aiSummary && (
                <View style={[styles.aiSummaryCard, { borderLeftColor: accent }]}>
                  <View style={styles.aiSummaryHeader}>
                    <MaterialCommunityIcons name="robot" size={sizes.iconSm} color={accent} />
                    <Text style={styles.aiSummaryTitle}>AI 종합 진단</Text>
                  </View>
                  <Text style={styles.aiSummaryText}>{learningReport.aiSummary}</Text>
                </View>
              )}

              {/* Partial loading indicator */}
              {isAnalyzing && weaknessAnalysis && !learningReport && (
                <View style={[styles.partialLoading, { backgroundColor: accent + opacityToHex(opacity.subtle) }]}>
                  <ActivityIndicator size="small" color={accent} />
                  <Text style={[styles.partialLoadingText, { color: accent }]}>
                    추가 분석을 진행하고 있습니다...
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
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
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
    width: tabletSizes.minTouchTarget,
    height: tabletSizes.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.heading3,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  changeStudentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
  },
  changeStudentText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },

  // Student selector
  selectorContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  searchbar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  studentList: {
    flex: 1,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  studentAvatar: {
    width: sizes.iconContainerMd,
    height: sizes.iconContainerMd,
    borderRadius: sizes.iconContainerMd / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    ...typography.subtitle,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  studentGrade: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  separator: {
    height: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxl,
  },

  // Student info bar (when selected)
  studentInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  studentInfoBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  studentAvatarLarge: {
    width: sizes.avatarMd,
    height: sizes.avatarMd,
    borderRadius: sizes.avatarMd / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarLargeText: {
    ...typography.heading3,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentInfoName: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  studentInfoGrade: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    ...typography.heading3,
    fontWeight: '700',
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
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },

  // AI Summary
  aiSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderLeftWidth: 4,
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
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    flex: 1,
  },

  // Partial loading
  partialLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  partialLoadingText: {
    ...typography.bodySmall,
  },
});
