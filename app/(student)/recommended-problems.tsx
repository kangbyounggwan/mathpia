import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  opacityToHex,
  opacity,
} from '../../src/constants/theme';
import MathText from '../../src/components/common/MathText';
import { mockProblems } from '../../src/services/mock/mockData';
import type { Difficulty, ProblemType } from '../../src/types';

const difficultyConfig: Record<Difficulty, { label: string; color: string }> = {
  '하': { label: '기본', color: colors.success },
  '중': { label: '보통', color: colors.warning },
  '상': { label: '심화', color: colors.error },
};

const typeIcon: Record<ProblemType, string> = {
  '객관식': 'format-list-numbered',
  '단답형': 'pencil-outline',
  '서술형': 'text-box-outline',
};

export default function RecommendedProblemsScreen() {
  const { topic, score } = useLocalSearchParams<{ topic: string; score: string }>();

  const problems = useMemo(() => {
    if (!topic) return [];
    // Exact topic match first
    const exact = mockProblems.filter((p) => p.topic === topic);
    // If too few, expand to same subject
    let result = exact;
    if (exact.length < 3) {
      const subject = exact[0]?.subject;
      if (subject) {
        result = mockProblems.filter((p) => p.subject === subject);
      } else {
        // Fallback: match subject name directly
        result = mockProblems.filter((p) => p.subject === topic);
      }
    }
    return result.sort((a, b) => {
      const diffOrder: Record<string, number> = { '하': 0, '중': 1, '상': 2 };
      const numScore = Number(score) || 50;
      if (numScore <= 40) return diffOrder[a.difficulty] - diffOrder[b.difficulty];
      return diffOrder[b.difficulty] - diffOrder[a.difficulty];
    });
  }, [topic, score]);

  const numScore = Number(score) || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>추천 문제</Text>
          <Text style={styles.subtitle}>{topic}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(numScore) + opacityToHex(opacity.subtle) }]}>
            <Text style={[styles.scoreBadgeText, { color: getScoreColor(numScore) }]}>{numScore}점</Text>
          </View>
        </View>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="lightbulb-on" size={18} color={colors.warning} />
        <Text style={styles.infoText}>
          {numScore <= 40
            ? '기초부터 차근차근 풀어보세요. 쉬운 문제부터 정렬했습니다.'
            : numScore <= 60
            ? '틀린 유형 위주로 연습하세요. 다양한 난이도를 준비했습니다.'
            : '실력을 높이기 위한 심화 문제를 준비했습니다.'}
        </Text>
      </View>

      {/* Problem list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {problems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="book-open-variant" size={48} color={colors.textDisabled} />
            <Text style={styles.emptyText}>해당 단원의 추천 문제가 없습니다</Text>
          </View>
        ) : (
          problems.map((problem, index) => {
            const diff = difficultyConfig[problem.difficulty];
            return (
              <View key={problem.id} style={styles.problemCard}>
                {/* Card header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardNumberWrap}>
                    <Text style={styles.cardNumber}>{index + 1}</Text>
                  </View>
                  <View style={styles.cardBadges}>
                    <View style={[styles.badge, { backgroundColor: diff.color + opacityToHex(opacity.subtle) }]}>
                      <Text style={[styles.badgeText, { color: diff.color }]}>{diff.label}</Text>
                    </View>
                    <View style={styles.typeBadge}>
                      <MaterialCommunityIcons
                        name={typeIcon[problem.type] as any}
                        size={13}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.typeText}>{problem.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.pointsText}>{problem.points}점</Text>
                </View>

                {/* Problem content */}
                <View style={styles.cardBody}>
                  <MathText content={problem.content} />
                </View>

                {/* Choices for multiple choice */}
                {problem.type === '객관식' && problem.choices && (
                  <View style={styles.choiceList}>
                    {problem.choices.map((choice, ci) => (
                      <View key={ci} style={styles.choiceItem}>
                        <View style={styles.choiceCircle}>
                          <Text style={styles.choiceNum}>{ci + 1}</Text>
                        </View>
                        <MathText content={choice} />
                      </View>
                    ))}
                  </View>
                )}

                {/* Footer: topic + correct rate */}
                <View style={styles.cardFooter}>
                  <Text style={styles.topicLabel}>{problem.subject} &gt; {problem.topic}</Text>
                  {problem.correctRate != null && (
                    <Text style={styles.correctRate}>정답률 {problem.correctRate}%</Text>
                  )}
                </View>
              </View>
            );
          })
        )}

        {problems.length > 0 && (
          <View style={styles.summaryBar}>
            <Text style={styles.summaryText}>
              총 {problems.length}문제 | 기본 {problems.filter(p => p.difficulty === '하').length} · 보통 {problems.filter(p => p.difficulty === '중').length} · 심화 {problems.filter(p => p.difficulty === '상').length}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getScoreColor(score: number) {
  if (score <= 30) return colors.error;
  if (score <= 60) return colors.warning;
  return colors.success;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    ...typography.heading3,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    marginLeft: spacing.sm,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  scoreBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warning + opacityToHex(opacity.subtle),
    borderRadius: borderRadius.md,
  },
  infoText: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },

  // Problem card
  problemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardNumberWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + opacityToHex(opacity.subtle),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cardNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardBody: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  choiceList: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  choiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
  },
  choiceCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceNum: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  topicLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  correctRate: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Summary bar
  summaryBar: {
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryText: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
