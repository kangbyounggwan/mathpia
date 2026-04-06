import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../src/components/common';
import { useAuthStore } from '../../src/stores/authStore';
import {
  colors, spacing,
  typography, shadows, sizes, borderRadius, opacityToHex, opacity,
} from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card style={styles.statCard} elevation={2}>
    <View style={styles.statContent}>
      <View style={[styles.statIconContainer, { backgroundColor: color + opacityToHex(opacity.subtle) }]}>
        <MaterialCommunityIcons name={icon as any} size={sizes.iconMd} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </Card>
);

interface QuickActionProps {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, icon, color, onPress }) => (
  <Card style={styles.quickAction} onPress={onPress} elevation={1}>
    <View style={styles.quickActionContent}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + opacityToHex(opacity.subtle) }]}>
        <MaterialCommunityIcons name={icon as any} size={sizes.iconMd} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </View>
  </Card>
);

export default function TeacherDashboard() {
  const { user, logout } = useAuthStore();
  const { accent, accentLight } = useRoleTheme();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  // Mock 데이터
  const stats = {
    totalStudents: 24,
    pendingAssignments: 5,
    submissionsToGrade: 12,
    todayClasses: 3,
  };

  const recentSubmissions = [
    { id: '1', studentName: '김철수', assignment: '이차방정식 연습', time: '10분 전' },
    { id: '2', studentName: '이영희', assignment: '이차방정식 연습', time: '25분 전' },
    { id: '3', studentName: '박민수', assignment: '함수의 극한', time: '1시간 전' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar.Text
            size={sizes.avatarMd}
            label={user?.name?.charAt(0) || 'T'}
            style={{ backgroundColor: accent }}
            accessibilityLabel={`${user?.name || '선생님'} 프로필 아바타`}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>안녕하세요, {user?.name || '선생님'}!</Text>
            <Text style={styles.subGreeting}>오늘도 좋은 하루 되세요</Text>
          </View>
        </View>
        <IconButton
          icon="logout"
          size={sizes.iconMd}
          onPress={handleLogout}
          accessibilityLabel="로그아웃"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>오늘의 현황</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="전체 학생"
            value={stats.totalStudents}
            icon="account-group"
            color={accent}
          />
          <StatCard
            title="진행중 숙제"
            value={stats.pendingAssignments}
            icon="clipboard-clock"
            color={colors.warning}
          />
          <StatCard
            title="채점 대기"
            value={stats.submissionsToGrade}
            icon="check-circle-outline"
            color={colors.error}
          />
          <StatCard
            title="오늘 수업"
            value={stats.todayClasses}
            icon="calendar-today"
            color={colors.success}
          />
        </View>

        {stats.submissionsToGrade > 10 && (
          <Card style={styles.attentionCard} elevation={2}>
            <View style={styles.attentionContent}>
              <View style={[styles.attentionIconContainer, { backgroundColor: colors.error + opacityToHex(opacity.subtle) }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={sizes.iconLg} color={colors.error} />
              </View>
              <View style={styles.attentionText}>
                <Text style={styles.attentionTitle}>주의 필요</Text>
                <Text style={styles.attentionDescription}>
                  채점 대기 중인 제출물이 {stats.submissionsToGrade}개 있습니다
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={sizes.iconMd} color={colors.textSecondary} />
            </View>
          </Card>
        )}

        <Text style={styles.sectionTitle}>빠른 작업</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="새 숙제 만들기"
            icon="plus-circle"
            color={accent}
            onPress={() => router.push('/(teacher)/assignments')}
          />
          <QuickAction
            title="문제은행"
            icon="database"
            color={accent}
            onPress={() => router.push('/(teacher)/problem-bank')}
          />
          <QuickAction
            title="학생분석"
            icon="chart-line"
            color={accent}
            onPress={() => router.push('/(teacher)/student-analytics')}
          />
          <QuickAction
            title="학생 추가"
            icon="account-plus"
            color={accent}
            onPress={() => router.push('/(teacher)/students')}
          />
          <QuickAction
            title="자료 업로드"
            icon="upload"
            color={accent}
            onPress={() => router.push('/(teacher)/materials')}
          />
          <QuickAction
            title="채점하기"
            icon="pencil-box-multiple"
            color={accent}
            onPress={() => router.push('/(teacher)/grading')}
          />
        </View>

        <Text style={styles.sectionTitle}>최근 제출</Text>
        {recentSubmissions.map((submission) => (
          <Card key={submission.id} style={styles.submissionCard}>
            <View style={styles.submissionContent}>
              <Avatar.Text
                size={sizes.avatarSm}
                label={submission.studentName.charAt(0)}
                style={{ backgroundColor: accentLight }}
                accessibilityLabel={`${submission.studentName} 아바타`}
              />
              <View style={styles.submissionInfo}>
                <Text style={styles.submissionStudent}>{submission.studentName}</Text>
                <Text style={styles.submissionAssignment}>{submission.assignment}</Text>
              </View>
              <Text style={styles.submissionTime}>{submission.time}</Text>
            </View>
          </Card>
        ))}

        <View style={styles.bottomSpacing} />
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
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: spacing.md,
  },
  greeting: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  subGreeting: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  // === Stat Cards (세로 레이아웃 + 원형 아이콘) ===
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    borderRadius: borderRadius.xl,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.heading1,
    color: colors.textPrimary,
    lineHeight: 40,
  },
  statTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // === Quick Actions (아이콘 배경 + 센터 정렬) ===
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    minWidth: 140,
    borderRadius: borderRadius.xl,
  },
  quickActionContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    ...typography.label,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  // === Attention Card ===
  attentionCard: {
    marginTop: spacing.md,
    borderRadius: borderRadius.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  attentionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attentionIconContainer: {
    width: sizes.iconContainerLg,
    height: sizes.iconContainerLg,
    borderRadius: sizes.iconContainerLg / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attentionText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  attentionTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.error,
  },
  attentionDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  // === Submissions ===
  submissionCard: {
    marginVertical: spacing.xs,
  },
  submissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submissionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  submissionStudent: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  submissionAssignment: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  submissionTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bottomSpacing: {
    height: 100,
  },
});
