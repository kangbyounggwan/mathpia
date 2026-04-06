// ============================================================
// app/(parent)/report.tsx
// Learning report screen: charts, AI diagnosis, strengths/weaknesses
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { ChildSelector } from '../../src/components/parent/ChildSelector';
import { ParentReportCard } from '../../src/components/parent/ParentReportCard';
import RadarChart from '../../src/components/charts/RadarChart';
import LineChart from '../../src/components/charts/LineChart';
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
import { useRoleTheme } from '../../src/hooks/useRoleTheme';
import { useResponsive } from '../../src/hooks/useResponsive';
import { SkeletonLoader, EmptyState } from '../../src/components/common';

// ---- Mock data --------------------------------------------------

const MOCK_CHILDREN = [
  { id: '2', name: '이학생', grade: '고1' as const },
];

// Radar chart data (subject competencies)
const MOCK_RADAR_DATA = [
  { label: '방정식', value: 75 },
  { label: '부등식', value: 82 },
  { label: '함수', value: 68 },
  { label: '삼각함수', value: 55 },
  { label: '수열', value: 88 },
  { label: '집합/명제', value: 61 },
  { label: '확률/통계', value: 79 },
  { label: '미적분', value: 45 },
];

// Timeline data (score trend over 8 weeks)
const MOCK_TIMELINE_DATA = [
  { date: '2025-02-10', score: 68 },
  { date: '2025-02-17', score: 72 },
  { date: '2025-02-24', score: 65 },
  { date: '2025-03-03', score: 74 },
  { date: '2025-03-10', score: 78 },
  { date: '2025-03-17', score: 71 },
  { date: '2025-03-24', score: 80 },
  { date: '2025-03-31', score: 82 },
];

// Wrong answer analysis (Top 5 topics with most mistakes)
const MOCK_WRONG_ANALYSIS = [
  { topic: '이차방정식의 근', wrongCount: 12, totalCount: 18 },
  { topic: '삼각함수의 그래프', wrongCount: 9, totalCount: 15 },
  { topic: '미분계수', wrongCount: 8, totalCount: 10 },
  { topic: '집합의 연산', wrongCount: 6, totalCount: 12 },
  { topic: '등차수열', wrongCount: 4, totalCount: 14 },
];

// AI diagnosis
const MOCK_AI_DIAGNOSIS = {
  strengths: [
    '수열 단원의 이해도가 높고, 등비수열 응용 문제도 잘 풀고 있습니다.',
    '부등식 풀이 과정이 정확하며, 절대값 부등식도 안정적입니다.',
    '최근 4주간 꾸준한 상승세를 보이고 있습니다.',
  ],
  weaknesses: [
    '삼각함수의 그래프 변환(이동, 대칭)에서 반복적인 실수가 있습니다.',
    '미적분 기초 개념(극한의 정의)이 불안정합니다.',
    '이차방정식에서 판별식 활용 시 부호 오류가 자주 발생합니다.',
  ],
  recommendations: [
    '삼각함수 그래프 연습을 주 3회, 각 5문제씩 진행하는 것을 권장합니다.',
    '미적분 진입 전 극한 개념 복습(2주 분량)이 필요합니다.',
    '이차방정식 판별식 문제를 오답노트와 병행하여 반복 학습하세요.',
  ],
  overallComment:
    '이학생은 전체적으로 성실하게 학습하고 있으며, 기본 개념 이해도는 양호합니다. 다만 삼각함수와 미적분 기초 단원에서 추가 학습이 필요합니다. 현재 상승세를 유지하면 다음 시험에서 10점 이상의 향상이 기대됩니다.',
};

// ---- Main component ------------------------------------------------

export default function ParentReportScreen() {
  const { isTablet, width, contentPadding } = useResponsive();
  const { accent, accentLight, accentDark } = useRoleTheme();

  const user = useAuthStore((s) => s.user);
  const childrenIds = user?.childrenIds ?? ['2'];

  const [selectedChildId, setSelectedChildId] = useState<string>(
    childrenIds[0] ?? '2'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('monthly');

  const childrenList = MOCK_CHILDREN.filter((c) =>
    childrenIds.includes(c.id)
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRefreshing(false);
  }, []);

  const handleRerunAI = async () => {
    setIsLoadingAI(true);
    // In production: call geminiAnalytics.generateLearningReport()
    await new Promise((r) => setTimeout(r, 2000));
    setIsLoadingAI(false);
  };

  // Compute chart size based on screen width
  const chartSize = Math.min(width - spacing.lg * 2 - spacing.md * 2, 300);
  const chartWidth = Math.min(width - spacing.lg * 2 - spacing.md * 2, 600);

  // Parent-context chart color override (green accent)
  const parentChartColors = {
    primaryFill: `rgba(102, 187, 106, 0.25)`,
    primaryStroke: accent,
  };

  // Check if there is report data
  const hasReportData = MOCK_RADAR_DATA.length > 0 || MOCK_TIMELINE_DATA.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, { padding: contentPadding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Child selector */}
        <ChildSelector
          children={childrenList}
          selectedChildId={selectedChildId}
          onSelectChild={setSelectedChildId}
          accentColor={accent}
        />

        {/* Period selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodChip,
              selectedPeriod === 'weekly' && [styles.periodChipActive, { backgroundColor: accent }],
            ]}
            onPress={() => setSelectedPeriod('weekly')}
            accessibilityLabel="주간 리포트"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.periodChipText,
                selectedPeriod === 'weekly' && styles.periodChipTextActive,
              ]}
            >
              주간
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodChip,
              selectedPeriod === 'monthly' && [styles.periodChipActive, { backgroundColor: accent }],
            ]}
            onPress={() => setSelectedPeriod('monthly')}
            accessibilityLabel="월간 리포트"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.periodChipText,
                selectedPeriod === 'monthly' && styles.periodChipTextActive,
              ]}
            >
              월간
            </Text>
          </TouchableOpacity>
        </View>

        {!hasReportData ? (
          <EmptyState
            icon="chart-bar"
            title="리포트 데이터가 없습니다"
            description="자녀의 학습 데이터가 쌓이면 리포트가 생성됩니다"
          />
        ) : (
          <View
            style={[styles.reportGrid, isTablet && styles.reportGridWide]}
          >
            {/* Left column */}
            <View style={[styles.column, isTablet && styles.columnLeft]}>
              {/* Radar chart (subject competency) */}
              <View style={styles.chartCard}>
                <Text style={styles.chartCardTitle}>단원별 역량 분석</Text>
                <RadarChart
                  data={MOCK_RADAR_DATA}
                  size={chartSize}
                  strokeColor={parentChartColors.primaryStroke}
                  fillColor={parentChartColors.primaryFill}
                />
              </View>

              {/* Score timeline chart */}
              <View style={styles.chartCard}>
                <Text style={styles.chartCardTitle}>성적 변화 추이</Text>
                <LineChart
                  data={MOCK_TIMELINE_DATA}
                  width={chartWidth}
                  height={200}
                  lineColor={parentChartColors.primaryStroke}
                  dotColor={accentDark}
                />
              </View>

              {/* Wrong answer analysis */}
              <View style={styles.wrongAnalysisCard}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="close-circle-outline"
                    size={20}
                    color={colors.error}
                  />
                  <Text style={styles.sectionTitle}>
                    오답 분석 (많이 틀린 단원)
                  </Text>
                </View>
                {MOCK_WRONG_ANALYSIS.map((item, index) => {
                  const wrongRate = item.wrongCount / item.totalCount;
                  return (
                    <View key={index} style={styles.wrongItem}>
                      <View style={styles.wrongItemLeft}>
                        <Text style={styles.wrongItemRank}>
                          {index + 1}.
                        </Text>
                        <View style={styles.wrongItemInfo}>
                          <Text style={styles.wrongItemTopic}>
                            {item.topic}
                          </Text>
                          <View style={styles.wrongItemBarTrack}>
                            <View
                              style={[
                                styles.wrongItemBarFill,
                                {
                                  width: `${wrongRate * 100}%`,
                                  backgroundColor:
                                    wrongRate > 0.6
                                      ? colors.error
                                      : wrongRate > 0.4
                                      ? colors.warning
                                      : colors.textSecondary,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                      <Text style={styles.wrongItemCount}>
                        {item.wrongCount}/{item.totalCount}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Right column */}
            <View style={[styles.column, isTablet && styles.columnRight]}>
              {/* AI diagnosis */}
              <View style={styles.aiDiagnosisCard}>
                <View style={styles.aiDiagnosisHeader}>
                  <View style={styles.aiIconContainer}>
                    <MaterialCommunityIcons
                      name="robot-happy"
                      size={22}
                      color={colors.secondary}
                    />
                  </View>
                  <View style={styles.aiHeaderText}>
                    <Text style={styles.aiDiagnosisTitle}>
                      AI 종합 진단
                    </Text>
                    <Text style={styles.aiDiagnosisSubtitle}>
                      Gemini AI 분석 결과
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.aiRefreshButton, { backgroundColor: accentLight + opacityToHex(opacity.muted) }]}
                    onPress={handleRerunAI}
                    accessibilityLabel="AI 분석 다시 실행"
                    accessibilityRole="button"
                  >
                    {isLoadingAI ? (
                      <ActivityIndicator size={18} color={accent} />
                    ) : (
                      <MaterialCommunityIcons
                        name="refresh"
                        size={20}
                        color={accent}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {isLoadingAI ? (
                  <View style={styles.aiLoadingContainer}>
                    <SkeletonLoader variant="text" width="100%" height={16} count={3} gap={spacing.sm} />
                    <SkeletonLoader variant="rect" width="100%" height={80} style={{ marginTop: spacing.md }} />
                    <SkeletonLoader variant="text" width="70%" height={14} count={2} gap={spacing.sm} style={{ marginTop: spacing.md }} />
                  </View>
                ) : (
                  <>
                    {/* Overall comment */}
                    <View style={[styles.overallCommentBox, { backgroundColor: accentLight + opacityToHex(opacity.subtle), borderLeftColor: accent }]}>
                      <Text style={styles.overallCommentText}>
                        {MOCK_AI_DIAGNOSIS.overallComment}
                      </Text>
                    </View>

                    {/* Strengths */}
                    <View style={styles.diagnosisSection}>
                      <View style={styles.diagnosisSectionHeader}>
                        <MaterialCommunityIcons
                          name="thumb-up"
                          size={16}
                          color={colors.success}
                        />
                        <Text
                          style={[
                            styles.diagnosisSectionTitle,
                            { color: colors.success },
                          ]}
                        >
                          강점
                        </Text>
                      </View>
                      {MOCK_AI_DIAGNOSIS.strengths.map((item, index) => (
                        <View key={index} style={styles.diagnosisItem}>
                          <View
                            style={[
                              styles.diagnosisDot,
                              { backgroundColor: colors.success },
                            ]}
                          />
                          <Text style={styles.diagnosisItemText}>
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Weaknesses */}
                    <View style={styles.diagnosisSection}>
                      <View style={styles.diagnosisSectionHeader}>
                        <MaterialCommunityIcons
                          name="alert"
                          size={16}
                          color={colors.error}
                        />
                        <Text
                          style={[
                            styles.diagnosisSectionTitle,
                            { color: colors.error },
                          ]}
                        >
                          개선이 필요한 부분
                        </Text>
                      </View>
                      {MOCK_AI_DIAGNOSIS.weaknesses.map((item, index) => (
                        <View key={index} style={styles.diagnosisItem}>
                          <View
                            style={[
                              styles.diagnosisDot,
                              { backgroundColor: colors.error },
                            ]}
                          />
                          <Text style={styles.diagnosisItemText}>
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Recommendations */}
                    <View style={styles.diagnosisSection}>
                      <View style={styles.diagnosisSectionHeader}>
                        <MaterialCommunityIcons
                          name="lightbulb-on"
                          size={16}
                          color={colors.warning}
                        />
                        <Text
                          style={[
                            styles.diagnosisSectionTitle,
                            { color: colors.warning },
                          ]}
                        >
                          추천 학습 방향
                        </Text>
                      </View>
                      {MOCK_AI_DIAGNOSIS.recommendations.map(
                        (item, index) => (
                          <View key={index} style={styles.diagnosisItem}>
                            <View
                              style={[
                                styles.diagnosisDot,
                                { backgroundColor: colors.warning },
                              ]}
                            />
                            <Text style={styles.diagnosisItemText}>
                              {item}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  </>
                )}
              </View>

              {/* ParentReportCard: monthly summary */}
              <ParentReportCard
                title="이번 달 종합 평가"
                subtitle="3월 전체 학습 결과"
                icon="chart-arc"
                status="good"
                mainValue="78점"
                mainLabel="월간 평균 점수"
                details={[
                  { label: '총 풀이 수', value: '142문제' },
                  { label: '정답률', value: '78%' },
                  { label: '학습 일수', value: '22일' },
                  { label: '오답노트 복습', value: '85%' },
                ]}
                advice="현재 상승 추세이므로 이 페이스를 유지하면 됩니다. 삼각함수 단원만 집중 보강하면 다음 달에는 85점 이상 가능합니다."
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---- Styles --------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },

  // Period selector
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  periodChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodChipActive: {
    borderColor: 'transparent',
  },
  periodChipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  periodChipTextActive: {
    color: '#FFFFFF',
  },

  // Grid
  reportGrid: {
    gap: spacing.md,
  },
  reportGridWide: {
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

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Chart cards
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  chartCardTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },

  // Wrong answer analysis
  wrongAnalysisCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  wrongItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  wrongItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  wrongItemRank: {
    width: 24,
    ...typography.label,
    color: colors.textSecondary,
  },
  wrongItemInfo: {
    flex: 1,
  },
  wrongItemTopic: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  wrongItemBarTrack: {
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  wrongItemBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  wrongItemCount: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    width: 40,
    textAlign: 'right',
  },

  // AI diagnosis
  aiDiagnosisCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  aiDiagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aiIconContainer: {
    width: sizes.iconContainerLg,
    height: sizes.iconContainerLg,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight + opacityToHex(opacity.muted),
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiHeaderText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  aiDiagnosisTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aiDiagnosisSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  aiRefreshButton: {
    width: sizes.buttonSm,
    height: sizes.buttonSm,
    borderRadius: sizes.buttonSm / 2,
    // backgroundColor: set dynamically via inline style
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiLoadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  aiLoadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  overallCommentBox: {
    // backgroundColor and borderLeftColor set dynamically via inline style
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
  },
  overallCommentText: {
    ...typography.bodySmall,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  diagnosisSection: {
    marginBottom: spacing.md,
  },
  diagnosisSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  diagnosisSectionTitle: {
    ...typography.label,
    fontWeight: '700',
  },
  diagnosisItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
  },
  diagnosisDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: spacing.sm,
  },
  diagnosisItemText: {
    flex: 1,
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
