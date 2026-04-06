// ============================================================
// app/(parent)/index.tsx
// Parent home/dashboard screen
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useParentStore } from '../../src/stores/parentStore';
import { ChildSelector } from '../../src/components/parent/ChildSelector';
import { ChildStatsCard } from '../../src/components/parent/ChildStatsCard';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  opacity,
  opacityToHex,
  sizes,
} from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks/useRoleTheme';
import { useResponsive } from '../../src/hooks/useResponsive';
import { SkeletonDashboard } from '../../src/components/common';

// ---- Fallback mock data (used before parentStore loads) ----------

const FALLBACK_CHILDREN = [
  { id: '2', name: '이학생', grade: '고1' as const },
];

const FALLBACK_STATS = {
  totalSolved: 45,
  correctRate: 82,
  studyDays: 5,
  weeklyGoalProgress: 0.72,
  totalGoal: 60,
  streakDays: 5,
  assignmentsCompleted: 3,
  assignmentsTotal: 5,
};

const FALLBACK_HOMEWORK = [
  {
    id: 'hw1',
    title: '이차방정식 연습',
    dueDate: '오늘 마감',
    progress: 0.7,
    total: 10,
    completed: 7,
    isUrgent: true,
  },
  {
    id: 'hw2',
    title: '삼각함수 그래프',
    dueDate: '내일 마감',
    progress: 0.25,
    total: 8,
    completed: 2,
    isUrgent: false,
  },
  {
    id: 'hw3',
    title: '함수의 극한',
    dueDate: '3일 후 마감',
    progress: 0,
    total: 12,
    completed: 0,
    isUrgent: false,
  },
];

const FALLBACK_WEAK_TOPICS = [
  { topic: '이차방정식의 근', score: 42, reason: '근의 공식 적용 오류가 빈번합니다' },
  { topic: '삼각함수의 그래프', score: 55, reason: '주기와 진폭 개념 혼동이 있습니다' },
  { topic: '집합의 연산', score: 61, reason: '교집합/합집합 기호 해석이 불안정합니다' },
];

const FALLBACK_AI_ADVICE =
  '이학생은 최근 이차방정식 단원에서 어려움을 겪고 있지만, 삼각함수의 기본 개념은 잘 이해하고 있습니다. 이번 주에는 이차방정식의 근의 공식 연습에 집중하면 빠른 개선이 가능합니다. 매일 3~5문제씩 꾸준히 풀면 2주 내에 눈에 띄는 향상이 기대됩니다.';

// ---- Main component ------------------------------------------------

export default function ParentDashboard() {
  const { isTablet, contentPadding } = useResponsive();
  const { accent, accentLight } = useRoleTheme();

  const user = useAuthStore((s) => s.user);
  const childrenIds = user?.childrenIds ?? ['2'];

  const { selectedChildId: storeSelectedChildId, selectChild } = useParentStore();

  const [selectedChildId, setSelectedChildId] = useState<string>(
    storeSelectedChildId ?? childrenIds[0] ?? '2'
  );
  const [isLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Build children list (fallback when store is empty)
  const childrenList = FALLBACK_CHILDREN.filter((c) =>
    childrenIds.includes(c.id)
  );

  // Data (falls back to mock when store unavailable)
  const stats = FALLBACK_STATS;
  const homework = FALLBACK_HOMEWORK;
  const weakTopics = FALLBACK_WEAK_TOPICS;
  const aiAdvice = FALLBACK_AI_ADVICE;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    selectChild(childId);
  };

  // Determine status from correct rate
  const getStatusFromRate = (rate: number) => {
    if (rate >= 90) return 'excellent' as const;
    if (rate >= 75) return 'good' as const;
    if (rate >= 60) return 'average' as const;
    return 'needsWork' as const;
  };

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
        {/* Header */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.greeting}>
              안녕하세요, {user?.name ?? '학부모'}님
            </Text>
            <Text style={styles.headerSubtitle}>
              자녀의 이번 주 학습 현황입니다
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={colors.textSecondary}
              accessibilityLabel="알림"
            />
          </View>
        </View>

        {/* Child selector */}
        <ChildSelector
          children={childrenList}
          selectedChildId={selectedChildId}
          onSelectChild={handleSelectChild}
          accentColor={accent}
        />

        {isLoading ? (
          <SkeletonDashboard />
        ) : (
          <View style={[styles.dashboardGrid, isTablet && styles.dashboardGridWide]}>
            {/* Left column */}
            <View style={[styles.column, isTablet && styles.columnLeft]}>
              {/* Child stats card */}
              <ChildStatsCard
                totalSolved={stats.totalSolved}
                correctRate={stats.correctRate}
                streakDays={stats.streakDays}
                assignmentsCompleted={stats.assignmentsCompleted}
                assignmentsTotal={stats.assignmentsTotal}
              />

              {/* Weekly learning stats card */}
              <View style={[styles.weeklyStatsCard, { backgroundColor: accent }]}>
                <View style={styles.weeklyStatsHeader}>
                  <View>
                    <Text style={styles.weeklyStatsTitle}>이번 주 학습</Text>
                    <Text style={styles.weeklyStatsSubtitle}>
                      목표 {stats.totalGoal}문제 중 {stats.totalSolved}문제 완료
                    </Text>
                  </View>
                  <View style={styles.weeklyProgressCircle}>
                    <Text style={styles.weeklyProgressText}>
                      {Math.round(stats.weeklyGoalProgress * 100)}%
                    </Text>
                  </View>
                </View>
                <ProgressBar
                  progress={stats.weeklyGoalProgress}
                  color="#FFFFFF"
                  style={styles.weeklyProgressBar}
                />
                <View style={styles.weeklyStatsRow}>
                  <View style={styles.weeklyStatItem}>
                    <MaterialCommunityIcons
                      name="pencil-box-multiple"
                      size={18}
                      color="rgba(255,255,255,0.9)"
                    />
                    <Text style={styles.weeklyStatValue}>{stats.totalSolved}문제</Text>
                    <Text style={styles.weeklyStatLabel}>풀이 수</Text>
                  </View>
                  <View style={styles.weeklyStatDivider} />
                  <View style={styles.weeklyStatItem}>
                    <MaterialCommunityIcons
                      name="target"
                      size={18}
                      color="rgba(255,255,255,0.9)"
                    />
                    <Text style={styles.weeklyStatValue}>{stats.correctRate}%</Text>
                    <Text style={styles.weeklyStatLabel}>정답률</Text>
                  </View>
                  <View style={styles.weeklyStatDivider} />
                  <View style={styles.weeklyStatItem}>
                    <MaterialCommunityIcons
                      name="calendar-check"
                      size={18}
                      color="rgba(255,255,255,0.9)"
                    />
                    <Text style={styles.weeklyStatValue}>{stats.studyDays}일</Text>
                    <Text style={styles.weeklyStatLabel}>학습일</Text>
                  </View>
                </View>
              </View>

              {/* AI learning advice */}
              <View style={styles.aiAdviceCard}>
                <View style={styles.aiAdviceHeader}>
                  <View style={styles.aiAdviceIconContainer}>
                    <MaterialCommunityIcons
                      name="robot-happy"
                      size={20}
                      color={colors.secondary}
                    />
                  </View>
                  <View>
                    <Text style={styles.aiAdviceTitle}>AI 학습 조언</Text>
                    <Text style={styles.aiAdviceSubtitle}>
                      Gemini AI 분석 기반
                    </Text>
                  </View>
                </View>
                <Text style={styles.aiAdviceText}>{aiAdvice}</Text>
              </View>

              {/* Weak topics summary */}
              <View style={styles.weaknessCard}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={20}
                    color={colors.warning}
                  />
                  <Text style={styles.sectionTitle}>취약 단원 (상위 3개)</Text>
                </View>
                {weakTopics.map((topic, index) => (
                  <View key={index} style={styles.weakTopicRow}>
                    <View style={styles.weakTopicLeft}>
                      <View
                        style={[
                          styles.weakTopicRank,
                          {
                            backgroundColor:
                              index === 0
                                ? colors.error + opacityToHex(opacity.muted)
                                : index === 1
                                ? colors.warning + opacityToHex(opacity.muted)
                                : colors.textSecondary + opacityToHex(opacity.muted),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.weakTopicRankText,
                            {
                              color:
                                index === 0
                                  ? colors.error
                                  : index === 1
                                  ? colors.warning
                                  : colors.textSecondary,
                            },
                          ]}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.weakTopicInfo}>
                        <Text style={styles.weakTopicName}>{topic.topic}</Text>
                        <Text style={styles.weakTopicReason} numberOfLines={1}>
                          {topic.reason}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.weakTopicScoreContainer}>
                      <Text
                        style={[
                          styles.weakTopicScore,
                          {
                            color:
                              topic.score < 50
                                ? colors.error
                                : topic.score < 70
                                ? colors.warning
                                : colors.success,
                          },
                        ]}
                      >
                        {topic.score}점
                      </Text>
                    </View>
                  </View>
                ))}
                <Text
                  style={[styles.viewMoreLink, { color: accent }]}
                  onPress={() => router.push('/(parent)/report')}
                  accessibilityLabel="상세 리포트 보기"
                  accessibilityRole="link"
                >
                  상세 리포트 보기 →
                </Text>
              </View>
            </View>

            {/* Right column */}
            <View style={[styles.column, isTablet && styles.columnRight]}>
              {/* Recent homework */}
              <View style={styles.homeworkSection}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={20}
                    color={accent}
                  />
                  <Text style={styles.sectionTitle}>최근 숙제 현황</Text>
                </View>
                {homework.map((hw) => (
                  <View
                    key={hw.id}
                    style={[
                      styles.homeworkItem,
                      { borderLeftColor: accent, backgroundColor: colors.surfaceVariant + opacityToHex(0.25) },
                      hw.isUrgent && styles.homeworkItemUrgent,
                    ]}
                  >
                    <View style={styles.homeworkItemHeader}>
                      <View style={styles.homeworkItemLeft}>
                        <Text style={styles.homeworkItemTitle}>{hw.title}</Text>
                        <View style={styles.homeworkItemMeta}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={13}
                            color={
                              hw.isUrgent
                                ? colors.error
                                : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.homeworkItemDue,
                              hw.isUrgent && styles.homeworkItemDueUrgent,
                            ]}
                          >
                            {hw.dueDate}
                          </Text>
                          {hw.isUrgent && (
                            <View style={styles.urgentBadge}>
                              <Text style={styles.urgentBadgeText}>긴급</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.homeworkItemRight}>
                        <Text style={[styles.homeworkItemPercent, { color: accent }]}>
                          {Math.round(hw.progress * 100)}%
                        </Text>
                        <Text style={styles.homeworkItemCount}>
                          {hw.completed}/{hw.total}
                        </Text>
                      </View>
                    </View>
                    <ProgressBar
                      progress={hw.progress}
                      color={
                        hw.progress === 1
                          ? colors.success
                          : hw.isUrgent
                          ? colors.error
                          : accent
                      }
                      style={styles.homeworkProgressBar}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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

  // Header
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.heading3,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
  },
  headerIcon: {
    width: sizes.iconContainerLg,
    height: sizes.iconContainerLg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },

  // Grid
  dashboardGrid: {
    gap: spacing.md,
  },
  dashboardGridWide: {
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

  // Weekly stats
  weeklyStatsCard: {
    // backgroundColor: set via inline style to `accent`
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  weeklyStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  weeklyStatsTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weeklyStatsSubtitle: {
    ...typography.caption,
    fontSize: 13,
    color: `rgba(255,255,255,${opacity.veryHigh})`,
    marginTop: 4,
  },
  weeklyProgressCircle: {
    width: sizes.progressRingSm,
    height: sizes.progressRingSm,
    borderRadius: sizes.progressRingSm / 2,
    backgroundColor: `rgba(255,255,255,${opacity.muted})`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyProgressText: {
    ...typography.subtitle,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weeklyProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: spacing.md,
  },
  weeklyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weeklyStatValue: {
    ...typography.subtitle,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weeklyStatLabel: {
    ...typography.labelSmall,
    color: `rgba(255,255,255,${opacity.high})`,
  },
  weeklyStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: `rgba(255,255,255,${opacity.muted})`,
  },

  // AI advice
  aiAdviceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  aiAdviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  aiAdviceIconContainer: {
    width: sizes.iconContainerMd,
    height: sizes.iconContainerMd,
    borderRadius: 10,
    backgroundColor: colors.secondaryLight + opacityToHex(opacity.muted),
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAdviceTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aiAdviceSubtitle: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
  aiAdviceText: {
    ...typography.bodySmall,
    lineHeight: 22,
    color: colors.textPrimary,
  },

  // Weak topics
  weaknessCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
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
  weakTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  weakTopicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weakTopicRank: {
    width: sizes.badgeMd,
    height: sizes.badgeMd,
    borderRadius: sizes.badgeMd / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  weakTopicRankText: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 13,
    fontWeight: '700',
  },
  weakTopicInfo: {
    flex: 1,
  },
  weakTopicName: {
    ...typography.label,
    color: colors.textPrimary,
  },
  weakTopicReason: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weakTopicScoreContainer: {
    marginLeft: spacing.sm,
  },
  weakTopicScore: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 15,
    fontWeight: '700',
  },
  viewMoreLink: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 13,
    fontWeight: '500',
    // color: set dynamically to `accent`
    textAlign: 'right',
    marginTop: spacing.md,
  },

  // Homework
  homeworkSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  homeworkItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderRadius: borderRadius.md,
  },
  homeworkItemUrgent: {
    borderLeftColor: colors.error,
    backgroundColor: colors.error + opacityToHex(opacity.subtle),
  },
  homeworkItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  homeworkItemLeft: {
    flex: 1,
  },
  homeworkItemTitle: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.textPrimary,
  },
  homeworkItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  homeworkItemDue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  homeworkItemDueUrgent: {
    color: colors.error,
    fontFamily: 'NotoSansKR-Medium',
    fontWeight: '500',
  },
  urgentBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 4,
  },
  urgentBadgeText: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  homeworkItemRight: {
    alignItems: 'flex-end',
  },
  homeworkItemPercent: {
    ...typography.subtitle,
    fontWeight: '700',
    // color: set dynamically to `accent`
  },
  homeworkItemCount: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  homeworkProgressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceVariant,
  },
});
