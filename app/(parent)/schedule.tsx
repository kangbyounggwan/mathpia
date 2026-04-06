// ============================================================
// app/(parent)/schedule.tsx
// Schedule screen: weekly classes + upcoming deadlines
// ============================================================

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { ChildSelector } from '../../src/components/parent/ChildSelector';
import { ScheduleCalendar } from '../../src/components/parent/ScheduleCalendar';
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
import { EmptyState } from '../../src/components/common';

// ---- Mock data --------------------------------------------------

const MOCK_CHILDREN = [
  { id: '2', name: '이학생', grade: '고1' as const },
];

const MOCK_CLASSES = [
  {
    id: 'cls1',
    dayOfWeek: 1, // Mon
    startTime: '16:00',
    endTime: '17:30',
    subject: '수학I',
    teacherName: '김선생',
    location: '201호',
  },
  {
    id: 'cls2',
    dayOfWeek: 3, // Wed
    startTime: '16:00',
    endTime: '17:30',
    subject: '수학II',
    teacherName: '김선생',
    location: '201호',
  },
  {
    id: 'cls3',
    dayOfWeek: 5, // Fri
    startTime: '16:00',
    endTime: '17:30',
    subject: '수학I 심화',
    teacherName: '김선생',
    location: '203호',
  },
];

interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  daysLeft: number;
  totalProblems: number;
  completedProblems: number;
  isOverdue: boolean;
}

const MOCK_DEADLINES: Deadline[] = [
  {
    id: 'dl1',
    title: '이차방정식 연습',
    dueDate: '4월 4일 (금)',
    daysLeft: 0,
    totalProblems: 10,
    completedProblems: 7,
    isOverdue: false,
  },
  {
    id: 'dl2',
    title: '삼각함수 그래프',
    dueDate: '4월 5일 (토)',
    daysLeft: 1,
    totalProblems: 8,
    completedProblems: 2,
    isOverdue: false,
  },
  {
    id: 'dl3',
    title: '함수의 극한',
    dueDate: '4월 7일 (월)',
    daysLeft: 3,
    totalProblems: 12,
    completedProblems: 0,
    isOverdue: false,
  },
];

interface GradingNotification {
  id: string;
  assignmentTitle: string;
  teacherName: string;
  score: number;
  totalScore: number;
  gradedAt: string;
}

const MOCK_GRADING_NOTIFICATIONS: GradingNotification[] = [
  {
    id: 'gn1',
    assignmentTitle: '인수분해 심화',
    teacherName: '김선생',
    score: 85,
    totalScore: 100,
    gradedAt: '1시간 전',
  },
  {
    id: 'gn2',
    assignmentTitle: '이차함수의 그래프',
    teacherName: '김선생',
    score: 72,
    totalScore: 100,
    gradedAt: '어제',
  },
  {
    id: 'gn3',
    assignmentTitle: '집합과 명제',
    teacherName: '김선생',
    score: 90,
    totalScore: 100,
    gradedAt: '3일 전',
  },
];

// ---- Main component ------------------------------------------------

export default function ParentScheduleScreen() {
  const { isTablet, contentPadding } = useResponsive();
  const { accent, accentLight } = useRoleTheme();

  const user = useAuthStore((s) => s.user);
  const childrenIds = user?.childrenIds ?? ['2'];

  const [selectedChildId, setSelectedChildId] = useState<string>(
    childrenIds[0] ?? '2'
  );

  const [calendarView, setCalendarView] = useState<'weekly' | 'monthly'>('weekly');

  const childrenList = MOCK_CHILDREN.filter((c) =>
    childrenIds.includes(c.id)
  );

  const getScoreColor = (score: number, total: number) => {
    const rate = score / total;
    if (rate >= 0.9) return colors.primary;
    if (rate >= 0.7) return colors.success;
    if (rate >= 0.5) return colors.warning;
    return colors.error;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, { padding: contentPadding }]}
      >
        {/* Child selector */}
        <ChildSelector
          children={childrenList}
          selectedChildId={selectedChildId}
          onSelectChild={setSelectedChildId}
          accentColor={accent}
        />

        {/* Calendar view toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleChip,
              calendarView === 'weekly' && [styles.viewToggleChipActive, { backgroundColor: accent }],
            ]}
            onPress={() => setCalendarView('weekly')}
            accessibilityLabel="주간 보기"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="calendar-week"
              size={16}
              color={calendarView === 'weekly' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.viewToggleText,
                calendarView === 'weekly' && styles.viewToggleTextActive,
              ]}
            >
              주간
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleChip,
              calendarView === 'monthly' && [styles.viewToggleChipActive, { backgroundColor: accent }],
            ]}
            onPress={() => setCalendarView('monthly')}
            accessibilityLabel="월간 보기"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="calendar-month"
              size={16}
              color={calendarView === 'monthly' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.viewToggleText,
                calendarView === 'monthly' && styles.viewToggleTextActive,
              ]}
            >
              월간
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.contentGrid, isTablet && styles.contentGridWide]}>
          {/* Left: Calendar */}
          <View style={[styles.calendarSection, isTablet && styles.calendarSectionWide]}>
            <ScheduleCalendar classes={MOCK_CLASSES} accentColor={accent} />
          </View>

          {/* Right: Deadlines + Notifications */}
          <View style={[styles.sideSection, isTablet && styles.sideSectionWide]}>
            {/* Upcoming deadlines */}
            <View style={styles.deadlinesCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="clock-alert-outline"
                  size={20}
                  color={colors.warning}
                />
                <Text style={styles.sectionTitle}>다가오는 마감일</Text>
              </View>
              {MOCK_DEADLINES.length === 0 ? (
                <EmptyState
                  icon="calendar-blank-outline"
                  title="일정이 없습니다"
                  description="등록된 수업 일정이 표시됩니다"
                />
              ) : (
                MOCK_DEADLINES.map((deadline) => (
                  <View
                    key={deadline.id}
                    style={[
                      styles.deadlineItem,
                      deadline.daysLeft === 0 && styles.deadlineItemUrgent,
                    ]}
                  >
                    <View style={styles.deadlineLeft}>
                      <View
                        style={[
                          styles.deadlineDot,
                          {
                            backgroundColor:
                              deadline.daysLeft === 0
                                ? colors.error
                                : deadline.daysLeft <= 1
                                ? colors.warning
                                : colors.success,
                          },
                        ]}
                      />
                      <View style={styles.deadlineInfo}>
                        <Text style={styles.deadlineTitle}>{deadline.title}</Text>
                        <Text style={styles.deadlineDate}>{deadline.dueDate}</Text>
                      </View>
                    </View>
                    <View style={styles.deadlineRight}>
                      <Text
                        style={[
                          styles.deadlineDaysLeft,
                          {
                            color:
                              deadline.daysLeft === 0
                                ? colors.error
                                : deadline.daysLeft <= 1
                                ? colors.warning
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {deadline.daysLeft === 0
                          ? '오늘 마감'
                          : `${deadline.daysLeft}일 남음`}
                      </Text>
                      <Text style={styles.deadlineProgress}>
                        {deadline.completedProblems}/{deadline.totalProblems}문제
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Recent grading notifications */}
            <View style={styles.gradingCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.sectionTitle}>최근 채점 완료</Text>
              </View>
              {MOCK_GRADING_NOTIFICATIONS.length === 0 ? (
                <EmptyState
                  icon="check-decagram-outline"
                  title="채점 결과가 없습니다"
                  description="채점이 완료되면 여기에 표시됩니다"
                />
              ) : (
                MOCK_GRADING_NOTIFICATIONS.map((notification) => (
                  <View key={notification.id} style={styles.gradingItem}>
                    <View style={styles.gradingItemLeft}>
                      <View
                        style={[
                          styles.gradingScoreCircle,
                          {
                            backgroundColor:
                              getScoreColor(
                                notification.score,
                                notification.totalScore
                              ) + opacityToHex(opacity.subtle),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.gradingScoreText,
                            {
                              color: getScoreColor(
                                notification.score,
                                notification.totalScore
                              ),
                            },
                          ]}
                        >
                          {notification.score}
                        </Text>
                      </View>
                      <View style={styles.gradingInfo}>
                        <Text style={styles.gradingTitle}>
                          {notification.assignmentTitle}
                        </Text>
                        <Text style={styles.gradingMeta}>
                          {notification.teacherName} | {notification.gradedAt}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.gradingTotalScore}>
                      /{notification.totalScore}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
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

  // View toggle
  viewToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  viewToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
  },
  viewToggleChipActive: {
    borderColor: 'transparent',
  },
  viewToggleText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  viewToggleTextActive: {
    color: '#FFFFFF',
  },

  // Grid
  contentGrid: {
    gap: spacing.md,
  },
  contentGridWide: {
    flexDirection: 'row',
  },
  calendarSection: {},
  calendarSectionWide: {
    flex: 3,
  },
  sideSection: {
    gap: spacing.md,
  },
  sideSectionWide: {
    flex: 2,
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

  // Deadlines
  deadlinesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  deadlineItemUrgent: {
    backgroundColor: colors.error + opacityToHex(opacity.subtle),
    borderRadius: borderRadius.md,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  deadlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deadlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  deadlineDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deadlineRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  deadlineDaysLeft: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 13,
  },
  deadlineProgress: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Grading notifications
  gradingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  gradingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  gradingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gradingScoreCircle: {
    width: sizes.iconContainerLg,
    height: sizes.iconContainerLg,
    borderRadius: sizes.iconContainerLg / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  gradingScoreText: {
    ...typography.subtitle,
    fontWeight: '700',
  },
  gradingInfo: {
    flex: 1,
  },
  gradingTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  gradingMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gradingTotalScore: {
    ...typography.bodySmall,
    fontFamily: 'NotoSansKR-Medium',
    color: colors.textSecondary,
  },
});
