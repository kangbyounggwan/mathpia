import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Chip, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, EmptyState } from '../../src/components/common';
import { colors, spacing, typography, opacity, opacityToHex } from '../../src/constants/theme';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  problemCount: number;
  completedCount: number;
  status: 'in_progress' | 'completed' | 'not_started';
}

const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: '이차방정식 연습',
    subject: '방정식과 부등식',
    dueDate: '2024-12-25',
    problemCount: 10,
    completedCount: 7,
    status: 'in_progress',
  },
  {
    id: '2',
    title: '삼각함수 그래프',
    subject: '수학I - 삼각함수',
    dueDate: '2024-12-26',
    problemCount: 8,
    completedCount: 8,
    status: 'completed',
  },
  {
    id: '3',
    title: '함수의 극한',
    subject: '수학II - 함수의 극한',
    dueDate: '2024-12-28',
    problemCount: 12,
    completedCount: 0,
    status: 'not_started',
  },
  {
    id: '4',
    title: '미분계수',
    subject: '수학II - 미분',
    dueDate: '2024-12-30',
    problemCount: 15,
    completedCount: 3,
    status: 'in_progress',
  },
];

export default function HomeworkScreen() {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all');

  const filteredAssignments = mockAssignments.filter(
    (a) => filter === 'all' || a.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return colors.warning;
      case 'completed':
        return colors.success;
      case 'not_started':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '진행중';
      case 'completed':
        return '완료';
      case 'not_started':
        return '시작전';
      default:
        return status;
    }
  };

  const renderAssignment = ({ item }: { item: Assignment }) => {
    const progress = item.completedCount / item.problemCount;

    return (
      <Card
        style={styles.assignmentCard}
        onPress={() => router.push(`/(student)/solve?assignmentId=${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{item.title}</Text>
            <Chip
              compact
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + opacityToHex(opacity.muted) }]}
              textStyle={{
                color: getStatusColor(item.status),
                fontFamily: 'NotoSansKR-Medium',
                fontSize: 12,
              }}
            >
              {getStatusText(item.status)}
            </Chip>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </View>

        <Text style={styles.subject}>{item.subject}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="file-document" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.problemCount}문제</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>마감: {item.dueDate}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>진행률</Text>
            <Text style={styles.progressValue}>
              {item.completedCount}/{item.problemCount} ({Math.round(progress * 100)}%)
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            color={progress === 1 ? colors.success : colors.primary}
            style={styles.progressBar}
            accessibilityLabel={`${item.title} 진행률 ${Math.round(progress * 100)}퍼센트`}
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterContainer}>
        {(['all', 'in_progress', 'not_started', 'completed'] as const).map((status) => (
          <Chip
            key={status}
            selected={filter === status}
            onPress={() => setFilter(status)}
            style={styles.filterChip}
            showSelectedCheck={false}
            textStyle={{ fontFamily: 'NotoSansKR-Medium', fontSize: 13 }}
          >
            {status === 'all' ? '전체' : getStatusText(status)}
          </Chip>
        ))}
      </View>

      {/* AI 학습분석 진입 배너 */}
      <View style={styles.aiBannerContainer}>
        <Card
          style={styles.aiBanner}
          onPress={() => router.push('/(student)/analytics')}
        >
          <View style={styles.aiBannerContent}>
            <View style={styles.aiBannerLeft}>
              <View style={styles.aiBannerIconContainer}>
                <MaterialCommunityIcons name="brain" size={28} color={colors.secondary} />
              </View>
              <View style={styles.aiBannerTextContainer}>
                <Text style={styles.aiBannerTitle}>AI 학습분석</Text>
                <Text style={styles.aiBannerSubtitle}>내 취약점 분석 & 맞춤 문제 추천</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </View>
        </Card>
      </View>

      <FlatList
        data={filteredAssignments}
        keyExtractor={(item) => item.id}
        renderItem={renderAssignment}
        contentContainerStyle={[
          styles.listContent,
          filteredAssignments.length === 0 && { flex: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-text-off-outline"
            title={filter === 'all' ? '숙제가 없습니다' : '조건에 맞는 숙제가 없습니다'}
            description="새로운 숙제가 배정되면 여기에 표시됩니다"
          />
        }
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
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: spacing.xs,
    minHeight: 44,
  },
  // AI 학습분석 배너
  aiBannerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  aiBanner: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  aiBannerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  aiBannerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  aiBannerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight + opacityToHex(opacity.muted),
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  aiBannerTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  aiBannerTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  aiBannerSubtitle: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
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
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    fontSize: 18,
    color: colors.textPrimary,
  },
  statusChip: {},
  subject: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  progressSection: {
    marginTop: spacing.md,
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
    borderRadius: 4,
  },
});
