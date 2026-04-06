import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Chip, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, EmptyState, SkeletonLoader } from '../../src/components/common';
import {
  colors, spacing, typography, roleColors, borderRadius, opacityToHex, opacity,
} from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks';

interface Assignment {
  id: string;
  title: string;
  grade: string;
  subject: string;
  dueDate: string;
  problemCount: number;
  submittedCount: number;
  totalStudents: number;
  status: 'active' | 'completed' | 'draft';
}

const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: '이차방정식 연습문제',
    grade: '고1',
    subject: '방정식과 부등식',
    dueDate: '2024-12-25',
    problemCount: 10,
    submittedCount: 18,
    totalStudents: 24,
    status: 'active',
  },
  {
    id: '2',
    title: '함수의 극한 기본',
    grade: '고2',
    subject: '수학II - 함수의 극한과 연속',
    dueDate: '2024-12-23',
    problemCount: 8,
    submittedCount: 15,
    totalStudents: 15,
    status: 'completed',
  },
  {
    id: '3',
    title: '삼각함수 그래프',
    grade: '고2',
    subject: '수학I - 삼각함수',
    dueDate: '2024-12-28',
    problemCount: 12,
    submittedCount: 5,
    totalStudents: 20,
    status: 'active',
  },
  {
    id: '4',
    title: '미분계수와 도함수',
    grade: '고2',
    subject: '수학II - 미분',
    dueDate: '2024-12-30',
    problemCount: 15,
    submittedCount: 0,
    totalStudents: 20,
    status: 'draft',
  },
];

export default function AssignmentsScreen() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { accent } = useRoleTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredAssignments = mockAssignments.filter(
    (a) => filter === 'all' || a.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'completed':
        return colors.textSecondary;
      case 'draft':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중';
      case 'completed':
        return '완료';
      case 'draft':
        return '임시저장';
      default:
        return status;
    }
  };

  const renderAssignment = ({ item }: { item: Assignment }) => {
    const submissionRate = Math.round((item.submittedCount / item.totalStudents) * 100);

    return (
      <Card style={styles.assignmentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.assignmentTitle}>{item.title}</Text>
            <View style={styles.tags}>
              <Chip compact style={styles.gradeChip}>{item.grade}</Chip>
              <Chip
                compact
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + opacityToHex(opacity.muted) }]}
                textStyle={{ color: getStatusColor(item.status) }}
              >
                {getStatusText(item.status)}
              </Chip>
            </View>
          </View>
          <IconButton icon="dots-vertical" size={24} onPress={() => {}} accessibilityLabel="더보기 메뉴" />
        </View>

        <Text style={styles.subject}>{item.subject}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="file-document" size={18} color={colors.textSecondary} />
            <Text style={styles.statText}>{item.problemCount}문제</Text>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="calendar" size={18} color={colors.textSecondary} />
            <Text style={styles.statText}>마감: {item.dueDate}</Text>
          </View>
        </View>

        {item.status !== 'draft' && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>제출 현황</Text>
              <Text style={styles.progressValue}>
                {item.submittedCount}/{item.totalStudents}명 ({submissionRate}%)
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${submissionRate}%` }]} />
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterContainer}>
        {(['all', 'active', 'completed', 'draft'] as const).map((status) => (
          <Chip
            key={status}
            selected={filter === status}
            onPress={() => setFilter(status)}
            style={styles.filterChip}
            showSelectedCheck={false}
          >
            {status === 'all' ? '전체' : getStatusText(status)}
          </Chip>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          <SkeletonLoader variant="card" height={160} count={3} gap={spacing.md} />
        </View>
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon="clipboard-text-off-outline"
          title="숙제가 없습니다"
          description={
            filter !== 'all'
              ? '선택한 상태에 맞는 숙제가 없습니다'
              : '새 숙제를 만들어 학생들에게 배정하세요'
          }
          actionLabel={filter === 'all' ? '숙제 만들기' : undefined}
          onAction={filter === 'all' ? () => {/* TODO */} : undefined}
        />
      ) : (
        <FlatList
          data={filteredAssignments}
          keyExtractor={(item) => item.id}
          renderItem={renderAssignment}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: 새 숙제 만들기
        }}
        label="새 숙제"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.xs,
    minHeight: 44,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  assignmentCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  assignmentTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gradeChip: {
    backgroundColor: roleColors.teacher.accentLight,
  },
  statusChip: {},
  subject: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  progressSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  progressValue: {
    ...typography.label,
    color: colors.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: roleColors.teacher.accent,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: roleColors.teacher.accent,
  },
});
