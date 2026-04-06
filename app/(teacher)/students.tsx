import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Avatar, Searchbar, FAB, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, EmptyState, SkeletonListItem } from '../../src/components/common';
import {
  colors, spacing, typography, roleColors, borderRadius, sizes,
} from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks';
import { Grade } from '../../src/types';

interface Student {
  id: string;
  name: string;
  grade: Grade;
  email: string;
  phone: string;
  completedAssignments: number;
  totalAssignments: number;
}

const mockStudents: Student[] = [
  { id: '1', name: '김철수', grade: '고1', email: 'kim@test.com', phone: '010-1234-5678', completedAssignments: 8, totalAssignments: 10 },
  { id: '2', name: '이영희', grade: '고1', email: 'lee@test.com', phone: '010-2345-6789', completedAssignments: 10, totalAssignments: 10 },
  { id: '3', name: '박민수', grade: '고2', email: 'park@test.com', phone: '010-3456-7890', completedAssignments: 7, totalAssignments: 10 },
  { id: '4', name: '정수진', grade: '중3', email: 'jung@test.com', phone: '010-4567-8901', completedAssignments: 9, totalAssignments: 10 },
  { id: '5', name: '최동욱', grade: '고1', email: 'choi@test.com', phone: '010-5678-9012', completedAssignments: 5, totalAssignments: 10 },
];

export default function StudentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { accent, accentLight } = useRoleTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const grades: (Grade | 'all')[] = ['all', '중1', '중2', '중3', '고1', '고2', '고3'];

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const renderStudent = ({ item }: { item: Student }) => {
    const completionRate = Math.round((item.completedAssignments / item.totalAssignments) * 100);

    return (
      <Card
        style={styles.studentCard}
        onPress={() => router.push(`/(teacher)/student-analytics?studentId=${item.id}`)}
      >
        <View style={styles.studentContent}>
          <Avatar.Text
            size={sizes.avatarMd}
            label={item.name.charAt(0)}
            style={{ backgroundColor: accent }}
            accessibilityLabel={`${item.name} 아바타`}
          />
          <View style={styles.studentInfo}>
            <View style={styles.studentHeader}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Chip compact style={{ backgroundColor: accentLight }}>{item.grade}</Chip>
            </View>
            <Text style={styles.studentEmail}>{item.email}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${completionRate}%`, backgroundColor: accent }]} />
              </View>
              <Text style={styles.progressText}>
                숙제 완료: {item.completedAssignments}/{item.totalAssignments}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={sizes.iconMd} color={colors.textSecondary} />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="학생 이름 검색"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={grades}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              selected={selectedGrade === item}
              onPress={() => setSelectedGrade(item)}
              style={styles.filterChip}
              showSelectedCheck={false}
            >
              {item === 'all' ? '전체' : item}
            </Chip>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {isLoading ? (
        <View style={styles.listContent}>
          <SkeletonListItem style={{ marginBottom: spacing.md }} />
          <SkeletonListItem style={{ marginBottom: spacing.md }} />
          <SkeletonListItem style={{ marginBottom: spacing.md }} />
          <SkeletonListItem style={{ marginBottom: spacing.md }} />
          <SkeletonListItem />
        </View>
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon="account-group-outline"
          title="학생이 없습니다"
          description={
            searchQuery || selectedGrade !== 'all'
              ? '검색 조건에 맞는 학생이 없습니다. 필터를 변경해보세요.'
              : '학생을 추가하여 관리를 시작하세요'
          }
          actionLabel={!searchQuery && selectedGrade === 'all' ? '학생 추가' : undefined}
          onAction={!searchQuery && selectedGrade === 'all' ? () => {/* TODO */} : undefined}
        />
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          renderItem={renderStudent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="plus"
        style={{ ...styles.fab, backgroundColor: accent }}
        onPress={() => {
          // TODO: 학생 추가 모달
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  searchbar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
  },
  filterContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
    minHeight: 44,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  studentCard: {
    marginBottom: spacing.md,
  },
  studentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  studentName: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  studentEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    minWidth: 100,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
