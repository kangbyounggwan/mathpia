import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MathText from '../common/MathText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { getSimilarProblems } from '../../services/geminiHelper';
import type { SimilarProblemMatch } from '../../types/aiHelper';
import type { ProblemBankItem } from '../../types/problemBank';

// ─── Props ────────────��────────────────────────────────

interface SimilarProblemsProps {
  /** Current problem info */
  problem: {
    id: string;
    content: string;
    topic?: string;
  };
  /**
   * Problem bank data (summary).
   * Get from problemBankStore.getState().problems etc.
   * Each item needs at minimum: id, content, topic, difficulty.
   */
  problemBank: Array<{
    id: string;
    content: string;
    topic: string;
    difficulty: string;
  }>;
  /** Callback when a similar problem is pressed */
  onProblemPress?: (problemId: string) => void;
  /** Callback when similar problems are viewed (for external tracking) */
  onSimilarViewed?: (problemId: string) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

// ���── Difficulty badge colors ──────────────────────────────

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  '상': { label: '상', color: colors.error, bg: colors.error + '15' },
  '���': { label: '중', color: colors.warning, bg: colors.warning + '15' },
  '하': { label: '하', color: colors.success, bg: colors.success + '15' },
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG['중'];
  return (
    <View style={[diffBadgeStyles.badge, { backgroundColor: config.bg }]}>
      <Text style={[diffBadgeStyles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const diffBadgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});

// ──��� Component ──────��──────────────────────────────────

export default function SimilarProblems({
  problem,
  problemBank,
  onProblemPress,
  onSimilarViewed,
  disabled = false,
}: SimilarProblemsProps) {
  // Match results
  const [matches, setMatches] = useState<SimilarProblemMatch[]>([]);
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  // Expanded state
  const [isExpanded, setIsExpanded] = useState(false);
  // Error
  const [error, setError] = useState<string | null>(null);
  // Load complete flag
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset on problem change
  const [currentProblemId, setCurrentProblemId] = useState(problem.id);
  if (problem.id !== currentProblemId) {
    setMatches([]);
    setIsExpanded(false);
    setError(null);
    setIsLoaded(false);
    setCurrentProblemId(problem.id);
  }

  // Search handler
  const handleSearch = useCallback(async () => {
    if (isLoading || disabled) return;

    // If already loaded, just toggle
    if (isLoaded) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build the problem param matching ProblemBankItem shape for getSimilarProblems
      const problemParam = {
        id: problem.id,
        content: problem.content,
        topic: problem.topic || '',
        difficulty: '중' as const, // default difficulty for current problem
      };

      // Build problem bank items matching ProblemBankItem shape (minimal)
      const bankItems = problemBank
        .filter((p) => p.id !== problem.id)
        .slice(0, 50) // limit for Gemini context
        .map((p) => ({
          id: p.id,
          content: p.content,
          topic: p.topic,
          difficulty: p.difficulty as '상' | '중' | '하',
          // Fill required ProblemBankItem fields with defaults
          academyId: '',
          createdBy: '',
          imageUrls: [],
          type: '단답형' as const,
          grade: '중1' as const,
          subject: '',
          tags: [],
          sourceType: 'manual' as const,
          points: 0,
          usageCount: 0,
          createdAt: new Date(),
        })) as ProblemBankItem[];

      const result = await getSimilarProblems(problemParam, bankItems, 5);

      // Convert SimilarProblemResult to SimilarProblemMatch[]
      const matchResults: SimilarProblemMatch[] = result.similarProblemIds.map(
        (id: string, index: number) => ({
          problemId: id,
          similarity: Math.max(0.5, 1 - index * 0.1), // estimate similarity from order
          reason: result.reasons[index] || '',
        })
      );

      setMatches(matchResults);
      setIsLoaded(true);
      setIsExpanded(true);
      onSimilarViewed?.(problem.id);
    } catch (err) {
      setError('유사 문제를 찾지 못했습니��. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [problem, problemBank, isLoading, isLoaded, isExpanded, disabled, onSimilarViewed]);

  // Get matched problem detail from the problem bank
  const getMatchedProblemDetail = useCallback(
    (problemId: string) => {
      return problemBank.find((p) => p.id === problemId);
    },
    [problemBank]
  );

  // Format similarity as percentage
  const formatSimilarity = (score: number) => `${Math.round(score * 100)}%`;

  // ─── Render ──────────���───────────────────────────────

  return (
    <View style={styles.container}>
      {/* Search button */}
      <TouchableOpacity
        style={[
          styles.searchButton,
          isLoaded && styles.searchButtonLoaded,
          disabled && styles.searchButtonDisabled,
        ]}
        onPress={handleSearch}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons
            name="file-find-outline"
            size={20}
            color="#FFFFFF"
          />
        )}
        <Text style={styles.searchButtonText}>
          {isLoading
            ? 'AI�� 유사 문제를 검색 중...'
            : isLoaded
            ? isExpanded
              ? '유사 문제 접기'
              : `유사 문제 (${matches.length}건)`
            : '유사 문제 찾기'}
        </Text>
        {isLoaded && !isLoading && (
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#FFFFFF"
          />
        )}
      </TouchableOpacity>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleSearch}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results list */}
      {isExpanded && isLoaded && (
        <View style={styles.resultsPanel}>
          {matches.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="file-question-outline"
                size={32}
                color={colors.textDisabled}
              />
              <Text style={styles.emptyText}>유사한 문제를 찾��� 못했습니다.</Text>
            </View>
          ) : (
            matches.map((match, index) => {
              const detail = getMatchedProblemDetail(match.problemId);
              if (!detail) return null;

              return (
                <TouchableOpacity
                  key={`similar-${match.problemId}`}
                  style={[
                    styles.problemCard,
                    index < matches.length - 1 && styles.problemCardMargin,
                  ]}
                  onPress={() => onProblemPress?.(match.problemId)}
                  activeOpacity={0.7}
                >
                  {/* Card header: similarity + difficulty */}
                  <View style={styles.cardHeader}>
                    <View style={styles.similarityBadge}>
                      <MaterialCommunityIcons
                        name="approximately-equal"
                        size={12}
                        color={colors.primary}
                      />
                      <Text style={styles.similarityText}>
                        유사도 {formatSimilarity(match.similarity)}
                      </Text>
                    </View>
                    <DifficultyBadge difficulty={detail.difficulty} />
                  </View>

                  {/* Problem content preview */}
                  <View style={styles.cardContent}>
                    <MathText
                      content={detail.content.length > 120
                        ? detail.content.substring(0, 120) + '...'
                        : detail.content}
                      fontSize={13}
                      color={colors.textPrimary}
                    />
                  </View>

                  {/* Similarity reason */}
                  <View style={styles.cardReason}>
                    <MaterialCommunityIcons
                      name="information-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.reasonText} numberOfLines={2}>
                      {match.reason}
                    </Text>
                  </View>

                  {/* Topic tag */}
                  <View style={styles.cardFooter}>
                    <View style={styles.topicTag}>
                      <MaterialCommunityIcons name="tag-outline" size={12} color={colors.primary} />
                      <Text style={styles.topicText}>{detail.topic}</Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={colors.textDisabled}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    minHeight: 44,
  },
  searchButtonLoaded: {
    backgroundColor: colors.primary,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  resultsPanel: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  problemCard: {
    backgroundColor: colors.surfaceVariant + '60',
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  problemCardMargin: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  similarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  similarityText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  cardContent: {
    marginVertical: spacing.xs,
  },
  cardReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  topicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicText: {
    fontSize: 12,
    color: colors.primary,
  },
});
