import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Text, Chip, Checkbox, Button, IconButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../src/components/common';
import MathText from '../../src/components/common/MathText';
import { colors, spacing } from '../../src/constants/theme';
import { ExtractedProblem } from '../../src/services/geminiService';

type DifficultyFilter = '전체' | '상' | '중' | '하';

export default function ProblemExtractScreen() {
  const params = useLocalSearchParams<{ problems?: string }>();

  // params에서 문제 목록을 받아옴
  const [problems, setProblems] = useState<ExtractedProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.problems) {
      try {
        const parsed = JSON.parse(params.problems);
        setProblems(parsed);
      } catch (e) {
        console.error('문제 파싱 오류:', e);
      }
    }
    setIsLoading(false);
  }, [params.problems]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('전체');

  const filteredProblems = useMemo(() => {
    if (difficultyFilter === '전체') return problems;
    return problems.filter((p) => p.difficulty === difficultyFilter);
  }, [problems, difficultyFilter]);

  const difficultyStats = useMemo(() => ({
    high: problems.filter((p) => p.difficulty === '상').length,
    medium: problems.filter((p) => p.difficulty === '중').length,
    low: problems.filter((p) => p.difficulty === '하').length,
  }), [problems]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProblems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProblems.map((p) => p.id)));
    }
  };

  const changeDifficulty = (id: string, newDifficulty: '상' | '중' | '하') => {
    setProblems(problems.map((p) =>
      p.id === id ? { ...p, difficulty: newDifficulty } : p
    ));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '상':
        return colors.error;
      case '중':
        return colors.warning;
      case '하':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const handleCreateAssignment = () => {
    const selectedProblems = problems.filter((p) => selectedIds.has(p.id));
    // TODO: 숙제 생성 화면으로 네비게이션
    router.push({
      pathname: '/(teacher)/assignments',
      params: { newProblems: JSON.stringify(selectedProblems) },
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case '객관식':
        return colors.primary;
      case '서술형':
        return colors.warning;
      case '단답형':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const renderProblem = ({ item, index }: { item: ExtractedProblem; index: number }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <Card
        style={{
          ...styles.problemCard,
          ...(isSelected ? styles.problemCardSelected : {}),
        }}
        onPress={() => toggleSelect(item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.problemNumber}>
            <Text style={styles.numberText}>{index + 1}</Text>
          </View>
          <Chip
            compact
            style={[
              styles.difficultyChip,
              { backgroundColor: getDifficultyColor(item.difficulty) + '20' },
            ]}
            textStyle={{ color: getDifficultyColor(item.difficulty), fontSize: 12 }}
          >
            {item.difficulty}
          </Chip>
          <Chip
            compact
            style={[
              styles.typeChip,
              { backgroundColor: getTypeColor(item.type) + '20' },
            ]}
            textStyle={{ color: getTypeColor(item.type), fontSize: 12 }}
          >
            {item.type}
          </Chip>
          <Chip compact style={styles.topicChip}>
            {item.topic}
          </Chip>
          <View style={styles.cardActions}>
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => toggleSelect(item.id)}
              color={colors.primary}
            />
          </View>
        </View>

        <View style={styles.problemContentWrapper}>
          <MathText content={item.content} fontSize={15} />
        </View>

        {/* 객관식 보기 표시 */}
        {item.type === '객관식' && item.choices && item.choices.length > 0 && (
          <View style={styles.choicesContainer}>
            {item.choices.map((choice, idx) => (
              <View key={idx} style={styles.choiceItem}>
                <Text style={styles.choiceNumber}>{['①', '②', '③', '④', '⑤'][idx]}</Text>
                <View style={styles.choiceContent}>
                  <MathText content={choice} fontSize={14} />
                </View>
              </View>
            ))}
          </View>
        )}

        {item.answer && (
          <View style={styles.answerRow}>
            <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
            <Text style={styles.answerLabel}>정답: </Text>
            <MathText content={item.answer} fontSize={14} color={colors.success} />
          </View>
        )}

        <View style={styles.difficultyButtons}>
          <Text style={styles.changeDifficultyLabel}>난이도 변경:</Text>
          {(['하', '중', '상'] as const).map((d) => (
            <Chip
              key={d}
              compact
              selected={item.difficulty === d}
              onPress={() => changeDifficulty(item.id, d)}
              style={[
                styles.difficultyOption,
                item.difficulty === d && {
                  backgroundColor: getDifficultyColor(d) + '30',
                },
              ]}
              textStyle={{
                fontSize: 12,
                color: item.difficulty === d ? getDifficultyColor(d) : colors.textSecondary,
              }}
            >
              {d}
            </Chip>
          ))}
        </View>
      </Card>
    );
  };

  // 로딩 중
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>문제를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 추출된 문제가 없을 때
  if (problems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => router.back()}
              accessibilityLabel="뒤로 가기"
            />
            <Text style={styles.headerTitle}>추출된 문제</Text>
            <View style={{ width: 48 }} />
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-question" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>추출된 문제가 없습니다</Text>
          <Text style={styles.emptyDescription}>
            강의자료 탭에서 PDF 또는 이미지를 업로드해주세요
          </Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.emptyButton}>
            돌아가기
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            accessibilityLabel="뒤로 가기"
          />
          <Text style={styles.headerTitle}>추출된 문제</Text>
          <View style={{ width: 48 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          총 {problems.length}문제 | 상 {difficultyStats.high} · 중 {difficultyStats.medium} · 하 {difficultyStats.low}
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['전체', '상', '중', '하'] as const).map((filter) => (
            <Chip
              key={filter}
              selected={difficultyFilter === filter}
              onPress={() => setDifficultyFilter(filter)}
              style={[
                styles.filterChip,
                filter !== '전체' && {
                  borderColor: getDifficultyColor(filter),
                  borderWidth: 1,
                },
              ]}
            >
              {filter === '전체' ? '전체' : `${filter} (${
                filter === '상' ? difficultyStats.high :
                filter === '중' ? difficultyStats.medium : difficultyStats.low
              })`}
            </Chip>
          ))}
        </ScrollView>
        <Button
          mode="text"
          compact
          onPress={toggleSelectAll}
        >
          {selectedIds.size === filteredProblems.length ? '선택 해제' : '전체 선택'}
        </Button>
      </View>

      <FlatList
        data={filteredProblems}
        keyExtractor={(item) => item.id}
        renderItem={renderProblem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {selectedIds.size > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.selectedCount}>
            {selectedIds.size}개 문제 선택됨
          </Text>
          <Button
            mode="contained"
            onPress={handleCreateAssignment}
            icon="clipboard-plus"
          >
            숙제 만들기
          </Button>
        </View>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  filterChip: {
    marginRight: spacing.sm,
    minHeight: 44,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  problemCard: {
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  problemCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  problemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  difficultyChip: {},
  typeChip: {},
  topicChip: {
    backgroundColor: colors.surfaceVariant,
  },
  cardActions: {
    marginLeft: 'auto',
  },
  problemContentWrapper: {
    marginBottom: spacing.md,
    minHeight: 40,
  },
  choicesContainer: {
    marginBottom: spacing.md,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary + '40',
  },
  choiceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  choiceNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: spacing.sm,
    minWidth: 20,
  },
  choiceContent: {
    flex: 1,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  answerLabel: {
    fontSize: 14,
    color: colors.success,
  },
  difficultyButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  changeDifficultyLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  difficultyOption: {
    backgroundColor: colors.surfaceVariant,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
});
