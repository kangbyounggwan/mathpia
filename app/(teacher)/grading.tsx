import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Chip, Avatar, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, EmptyState } from '../../src/components/common';
import {
  colors, spacing, typography, roleColors, borderRadius, sizes, opacityToHex, opacity,
} from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks';

interface Submission {
  id: string;
  studentName: string;
  assignmentTitle: string;
  problemNumber: number;
  submittedAt: string;
  status: 'pending' | 'graded';
  score?: number;
}

const mockSubmissions: Submission[] = [
  { id: '1', studentName: '김철수', assignmentTitle: '이차방정식 연습', problemNumber: 1, submittedAt: '10분 전', status: 'pending' },
  { id: '2', studentName: '이영희', assignmentTitle: '이차방정식 연습', problemNumber: 1, submittedAt: '25분 전', status: 'pending' },
  { id: '3', studentName: '박민수', assignmentTitle: '함수의 극한', problemNumber: 3, submittedAt: '1시간 전', status: 'pending' },
  { id: '4', studentName: '정수진', assignmentTitle: '이차방정식 연습', problemNumber: 2, submittedAt: '2시간 전', status: 'graded', score: 85 },
  { id: '5', studentName: '최동욱', assignmentTitle: '삼각함수 그래프', problemNumber: 1, submittedAt: '3시간 전', status: 'graded', score: 100 },
];

export default function GradingScreen() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('pending');
  const { accent } = useRoleTheme();

  const filteredSubmissions = mockSubmissions.filter(
    (s) => filter === 'all' || s.status === filter
  );

  const pendingCount = mockSubmissions.filter((s) => s.status === 'pending').length;

  const renderSubmission = ({ item }: { item: Submission }) => (
    <Card style={styles.submissionCard}>
      <View style={styles.cardContent}>
        <Avatar.Text
          size={sizes.avatarMd}
          label={item.studentName.charAt(0)}
          style={[
            styles.avatar,
            { backgroundColor: item.status === 'pending' ? colors.warning : colors.success }
          ]}
          accessibilityLabel={`${item.studentName} 아바타`}
        />
        <View style={styles.submissionInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.studentName}>{item.studentName}</Text>
            {item.status === 'graded' && (
              <Chip compact style={styles.scoreChip}>
                {item.score}점
              </Chip>
            )}
          </View>
          <Text style={styles.assignmentTitle}>{item.assignmentTitle}</Text>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="file-document" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>문제 {item.problemNumber}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{item.submittedAt}</Text>
          </View>
        </View>
        {item.status === 'pending' ? (
          <View style={styles.gradingActions}>
            <TouchableOpacity
              style={[styles.gradeBtn, styles.gradeBtnCorrect]}
              onPress={() => {/* TODO: mark correct */}}
              accessibilityLabel="정답 처리"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="check-bold" size={sizes.iconMd} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gradeBtn, styles.gradeBtnIncorrect]}
              onPress={() => {/* TODO: mark incorrect */}}
              accessibilityLabel="오답 처리"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close-thick" size={sizes.iconMd} color={colors.error} />
            </TouchableOpacity>
            <Button
              mode="contained"
              size="sm"
              onPress={() => {/* TODO: open detailed grading */}}
              style={styles.detailGradeButton}
            >
              상세
            </Button>
          </View>
        ) : (
          <Button mode="outlined" size="sm" onPress={() => {}} style={styles.viewButton}>
            보기
          </Button>
        )}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterContainer}>
        <Chip
          selected={filter === 'pending'}
          onPress={() => setFilter('pending')}
          style={styles.filterChip}
          showSelectedCheck={false}
        >
          채점 대기
        </Chip>
        <Chip
          selected={filter === 'graded'}
          onPress={() => setFilter('graded')}
          style={styles.filterChip}
          showSelectedCheck={false}
        >
          채점 완료
        </Chip>
        <Chip
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
          style={styles.filterChip}
          showSelectedCheck={false}
        >
          전체
        </Chip>
      </View>

      {filteredSubmissions.length === 0 ? (
        <EmptyState
          icon="check-circle-outline"
          title={filter === 'pending'
            ? '채점할 제출물이 없습니다'
            : filter === 'graded'
              ? '채점 완료된 제출물이 없습니다'
              : '제출물이 없습니다'}
          description="학생이 제출하면 여기에 표시됩니다"
          iconColor={filter === 'pending' ? colors.success : colors.textDisabled}
        />
      ) : (
        <FlatList
          data={filteredSubmissions}
          keyExtractor={(item) => item.id}
          renderItem={renderSubmission}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  submissionCard: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {},
  submissionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  studentName: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  scoreChip: {
    marginLeft: spacing.sm,
    backgroundColor: colors.success,
  },
  assignmentTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  metaDot: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
  gradingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.md,
  },
  gradeBtn: {
    width: sizes.iconContainerLg,
    height: sizes.iconContainerLg,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeBtnCorrect: {
    backgroundColor: colors.success + opacityToHex(opacity.subtle),
  },
  gradeBtnIncorrect: {
    backgroundColor: colors.error + opacityToHex(opacity.subtle),
  },
  detailGradeButton: {},
  viewButton: {
    marginLeft: spacing.md,
  },
});
