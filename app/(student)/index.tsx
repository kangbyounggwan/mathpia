import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../src/components/common';
import {
  colors,
  spacing,
  typography,
  shadows,
  opacity,
  opacityToHex,
  sizes,
} from '../../src/constants/theme';
import { useRoleTheme, useResponsive } from '../../src/hooks';

interface HomeworkItem {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  problemCount: number;
  completedCount: number;
  isUrgent: boolean;
}

const mockHomework: HomeworkItem[] = [
  {
    id: '1',
    title: '이차방정식 연습',
    subject: '방정식과 부등식',
    dueDate: '오늘 마감',
    problemCount: 10,
    completedCount: 7,
    isUrgent: true,
  },
  {
    id: '2',
    title: '삼각함수 그래프',
    subject: '수학I - 삼각함수',
    dueDate: '내일 마감',
    problemCount: 8,
    completedCount: 2,
    isUrgent: false,
  },
  {
    id: '3',
    title: '함수의 극한',
    subject: '수학II - 함수의 극한',
    dueDate: '3일 후 마감',
    problemCount: 12,
    completedCount: 0,
    isUrgent: false,
  },
];

// 통계 카드 컴포넌트
interface StatItemProps {
  icon: string;
  iconColor: string;
  value: string;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, iconColor, value, label }) => (
  <View style={styles.statItem}>
    <View style={[styles.statIconContainer, { backgroundColor: iconColor + opacityToHex(opacity.subtle) }]}>
      <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// 숙제 카드 컴포넌트
interface HomeworkCardProps {
  homework: HomeworkItem;
  onPress: () => void;
}

const HomeworkCard: React.FC<HomeworkCardProps> = ({ homework, onPress }) => {
  const progress = homework.completedCount / homework.problemCount;
  const isComplete = progress === 1;

  return (
    <View
      style={[
        styles.homeworkCard,
        homework.isUrgent && styles.homeworkCardUrgent,
      ]}
    >
      <View style={styles.homeworkCardContent} onTouchEnd={onPress}>
        <View style={styles.homeworkLeft}>
          <View style={styles.homeworkTitleRow}>
            <Text style={styles.homeworkTitle}>{homework.title}</Text>
            {homework.isUrgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>긴급</Text>
              </View>
            )}
          </View>
          <Text style={styles.homeworkSubject}>{homework.subject}</Text>
          <View style={styles.homeworkMetaRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={homework.isUrgent ? colors.error : colors.textSecondary} />
            <Text style={[styles.homeworkDue, homework.isUrgent && styles.homeworkDueUrgent]}>
              {homework.dueDate}
            </Text>
          </View>
        </View>
        <View style={styles.homeworkRight}>
          <View style={[styles.progressCircle, isComplete && styles.progressCircleComplete]}>
            <Text style={[styles.progressCircleText, isComplete && styles.progressCircleTextComplete]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <Text style={styles.progressSubtext}>
            {homework.completedCount}/{homework.problemCount}
          </Text>
        </View>
      </View>
      <ProgressBar
        progress={progress}
        color={isComplete ? colors.success : colors.primary}
        style={styles.homeworkProgress}
        accessibilityLabel={`${homework.title} 진행률 ${Math.round(progress * 100)}퍼센트`}
      />
    </View>
  );
};

export default function StudentDashboard() {
  const { isTablet, contentPadding } = useResponsive();
  const { accent } = useRoleTheme();

  const totalProblems = mockHomework.reduce((sum, h) => sum + h.problemCount, 0);
  const completedProblems = mockHomework.reduce((sum, h) => sum + h.completedCount, 0);
  const progressRate = totalProblems > 0 ? completedProblems / totalProblems : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, { padding: contentPadding }]}
      >
        {/* 메인 대시보드 영역 */}
        <View style={[styles.dashboardSection, isTablet && styles.dashboardSectionWide]}>
          {/* 왼쪽: 학습 현황 + 통계 */}
          <View style={[styles.leftSection, isTablet && styles.leftSectionWide]}>
            {/* 학습 현황 카드 */}
            <View style={[styles.progressCard, { backgroundColor: accent }]}>
              <View style={styles.progressCardHeader}>
                <View>
                  <Text style={styles.progressCardTitle}>이번 주 학습</Text>
                  <Text style={styles.progressCardSubtitle}>
                    {completedProblems}문제 완료
                  </Text>
                </View>
                <View style={styles.progressPercentContainer}>
                  <Text style={styles.progressPercent}>{Math.round(progressRate * 100)}</Text>
                  <Text style={styles.progressPercentSign}>%</Text>
                </View>
              </View>
              <ProgressBar
                progress={progressRate}
                color="#FFFFFF"
                style={styles.progressBarMain}
                accessibilityLabel={`숙제 진행률 ${Math.round(progressRate * 100)}퍼센트`}
              />
              <View style={styles.progressCardFooter}>
                <Text style={styles.progressCardFooterText}>
                  목표까지 {totalProblems - completedProblems}문제 남음
                </Text>
              </View>
            </View>

            {/* 통계 카드들 */}
            <View style={styles.statsContainer}>
              <StatItem
                icon="check-circle"
                iconColor={colors.success}
                value="45"
                label="완료 문제"
              />
              <View style={styles.statDivider} />
              <StatItem
                icon="fire"
                iconColor={colors.warning}
                value="7일"
                label="연속 학습"
              />
              <View style={styles.statDivider} />
              <StatItem
                icon="star"
                iconColor={colors.secondary}
                value="92%"
                label="평균 점수"
              />
            </View>

            {/* 학습 바로가기 */}
            <View style={styles.quickNavContainer}>
              <TouchableOpacity
                style={styles.quickNavCard}
                onPress={() => router.push('/(student)/analytics')}
                activeOpacity={0.7}
                accessibilityLabel="학습 분석 화면으로 이동"
                accessibilityRole="button"
              >
                <View style={[styles.quickNavIconContainer, { backgroundColor: colors.secondary + opacityToHex(opacity.subtle) }]}>
                  <MaterialCommunityIcons name="chart-line" size={22} color={colors.secondary} />
                </View>
                <Text style={styles.quickNavTitle}>학습 분석</Text>
                <Text style={styles.quickNavSubtitle}>취약점 확인</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickNavCard}
                onPress={() => router.push('/(student)/wrong-notes')}
                activeOpacity={0.7}
                accessibilityLabel="오답노트 화면으로 이동"
                accessibilityRole="button"
              >
                <View style={[styles.quickNavIconContainer, { backgroundColor: colors.error + opacityToHex(opacity.subtle) }]}>
                  <MaterialCommunityIcons name="book-alert" size={22} color={colors.error} />
                </View>
                <Text style={styles.quickNavTitle}>오답노트</Text>
                <Text style={styles.quickNavSubtitle}>복습하기</Text>
              </TouchableOpacity>
            </View>

            {/* 학원 정보 카드 */}
            <View style={styles.academyCard}>
              <View style={styles.academyHeader}>
                <View style={styles.academyIconContainer}>
                  <MaterialCommunityIcons name="school" size={20} color={colors.primary} />
                </View>
                <View style={styles.academyHeaderText}>
                  <Text style={styles.academyName}>수학왕 학원</Text>
                  <Text style={styles.academyLocation}>강남점</Text>
                </View>
              </View>

              <View style={styles.academyDivider} />

              <View style={styles.nextClassSection}>
                <View style={styles.nextClassRow}>
                  <MaterialCommunityIcons name="calendar-clock" size={18} color={colors.textSecondary} />
                  <Text style={styles.nextClassLabel}>다음 수업</Text>
                </View>
                <Text style={styles.nextClassTime}>오늘 오후 4:00</Text>
                <Text style={styles.nextClassDuration}>90분 수업</Text>
              </View>

              <View style={styles.lessonPreview}>
                <View style={styles.lessonPreviewHeader}>
                  <MaterialCommunityIcons name="book-open-variant" size={16} color={colors.secondary} />
                  <Text style={styles.lessonPreviewLabel}>다음 차시 내용</Text>
                </View>
                <Text style={styles.lessonPreviewTitle}>이차함수의 그래프</Text>
                <Text style={styles.lessonPreviewDesc}>
                  이차함수 y = ax² + bx + c의 그래프를 그리고, 꼭짓점과 축의 방정식을 구하는 방법을 학습합니다.
                </Text>
              </View>
            </View>
          </View>

          {/* 오른쪽: 숙제 목록 */}
          <View style={[styles.rightSection, isTablet && styles.rightSectionWide]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>오늘의 숙제</Text>
              <Text style={styles.sectionCount}>{mockHomework.length}개</Text>
            </View>

            {mockHomework.map((homework) => (
              <HomeworkCard
                key={homework.id}
                homework={homework}
                onPress={() => router.push(`/(student)/solve?assignmentId=${homework.id}`)}
              />
            ))}

            {/* 숙제 이어서 풀기 버튼 */}
            <Button
              mode="contained"
              icon="play-circle"
              onPress={() => router.push('/(student)/homework')}
              style={styles.continueButton}
              fullWidth
            >
              숙제 이어서 풀기
            </Button>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  dashboardSection: {
    gap: spacing.lg,
  },
  dashboardSectionWide: {
    flexDirection: 'row',
  },
  leftSection: {
    gap: spacing.md,
  },
  leftSectionWide: {
    flex: 1,
    maxWidth: 400,
  },
  rightSection: {
    gap: spacing.md,
  },
  rightSectionWide: {
    flex: 2,
  },

  // 학습 현황 카드
  progressCard: {
    borderRadius: 16,
    padding: spacing.lg,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  progressCardTitle: {
    ...typography.subtitle,
    color: '#FFFFFF',
  },
  progressCardSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,' + opacity.veryHigh + ')',
    marginTop: 4,
  },
  progressPercentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  progressPercent: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressPercentSign: {
    ...typography.subtitle,
    fontWeight: '700',
    color: 'rgba(255,255,255,' + opacity.veryHigh + ')',
    marginBottom: 6,
    marginLeft: 2,
  },
  progressBarMain: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressCardFooter: {
    marginTop: spacing.sm,
  },
  progressCardFooterText: {
    ...typography.caption,
    color: 'rgba(255,255,255,' + opacity.high + ')',
  },

  // 통계 컨테이너
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statIconContainer: {
    width: sizes.iconContainerLg,
    height: sizes.iconContainerLg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.heading3,
    fontWeight: '700',
    fontSize: 20,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border,
  },

  // 학습 바로가기
  quickNavContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickNavCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  quickNavIconContainer: {
    width: sizes.iconContainerLg,
    height: sizes.iconContainerLg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickNavTitle: {
    ...typography.label,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quickNavSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // 학원 정보 카드
  academyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    ...shadows.sm,
  },
  academyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  academyIconContainer: {
    width: sizes.iconContainerMd,
    height: sizes.iconContainerMd,
    borderRadius: 10,
    backgroundColor: colors.primaryLight + opacityToHex(opacity.muted),
    justifyContent: 'center',
    alignItems: 'center',
  },
  academyHeaderText: {
    marginLeft: spacing.sm,
  },
  academyName: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  academyLocation: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  academyDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  nextClassSection: {
    marginBottom: spacing.md,
  },
  nextClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  nextClassLabel: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
  },
  nextClassTime: {
    ...typography.subtitle,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  nextClassDuration: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lessonPreview: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 10,
    padding: spacing.sm,
  },
  lessonPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  lessonPreviewLabel: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.secondary,
  },
  lessonPreviewTitle: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  lessonPreviewDesc: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // 섹션 헤더
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionCount: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // 숙제 카드
  homeworkCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.sm,
  },
  homeworkCardUrgent: {
    borderLeftColor: colors.error,
  },
  homeworkCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  homeworkLeft: {
    flex: 1,
  },
  homeworkTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  homeworkTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  urgentBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentBadgeText: {
    ...typography.labelSmall,
    color: '#FFFFFF',
  },
  homeworkSubject: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  homeworkMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  homeworkDue: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
  },
  homeworkDueUrgent: {
    color: colors.error,
    fontWeight: '500',
  },
  homeworkRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight + opacityToHex(opacity.muted),
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleComplete: {
    backgroundColor: colors.success + opacityToHex(opacity.muted),
  },
  progressCircleText: {
    ...typography.label,
    fontWeight: '700',
    color: colors.primary,
  },
  progressCircleTextComplete: {
    color: colors.success,
  },
  progressSubtext: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    marginTop: 4,
  },
  homeworkProgress: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceVariant,
  },

  // 버튼
  continueButton: {
    marginTop: spacing.sm,
    marginBottom: 100,
  },
});
