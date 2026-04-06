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
import { getHint } from '../../services/geminiHelper';
import type { HintLevel, HintResponse } from '../../types/aiHelper';
import { HINT_LEVEL_LABELS } from '../../types/aiHelper';

// ─── Props ─────────────────────────────────────────────

interface HintButtonProps {
  /** Current problem info */
  problem: {
    id: string;
    content: string;
    topic?: string;
    answer?: string;
  };
  /** Callback when a hint is used (for external tracking) */
  onHintUsed?: (problemId: string, level: HintLevel) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

// ─── Constants ──────────────────────────────────────────

const MAX_HINT_LEVEL: HintLevel = 3;

const HINT_ICONS: Record<HintLevel, string> = {
  1: 'lightbulb-outline',
  2: 'function-variant',
  3: 'calculator-variant-outline',
};

const HINT_COLORS: Record<HintLevel, string> = {
  1: colors.success,  // green (light hint)
  2: colors.warning,  // orange (medium hint)
  3: colors.error,    // red (strong hint)
};

// ─── Component ─────────────────────────────────────────

export default function HintButton({ problem, onHintUsed, disabled = false }: HintButtonProps) {
  // Hints received so far
  const [hints, setHints] = useState<HintResponse[]>([]);
  // Next requestable level
  const [nextLevel, setNextLevel] = useState<HintLevel>(1);
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  // Hint panel expanded
  const [isExpanded, setIsExpanded] = useState(false);
  // Error message
  const [error, setError] = useState<string | null>(null);

  // Reset hints when problem changes (based on problemId)
  const [currentProblemId, setCurrentProblemId] = useState(problem.id);
  if (problem.id !== currentProblemId) {
    setHints([]);
    setNextLevel(1);
    setIsExpanded(false);
    setError(null);
    setCurrentProblemId(problem.id);
  }

  const allHintsUsed = nextLevel > MAX_HINT_LEVEL;

  // Hint request handler
  const handleRequestHint = useCallback(async () => {
    if (allHintsUsed || isLoading || disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // getHint(problemContent, attemptCount, problemAnswer?) from geminiHelper
      const hintResult = await getHint(problem.content, nextLevel, problem.answer);
      const hint: HintResponse = {
        level: hintResult.level,
        content: hintResult.content,
      };
      setHints((prev) => [...prev, hint]);
      onHintUsed?.(problem.id, nextLevel);
      setNextLevel((prev) => (prev + 1) as HintLevel);
      setIsExpanded(true);
    } catch (err) {
      setError('힌트를 불러오지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [problem, nextLevel, allHintsUsed, isLoading, disabled, onHintUsed]);

  // ─── Render ──────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Hint request button */}
      <TouchableOpacity
        style={[
          styles.hintButton,
          allHintsUsed && styles.hintButtonExhausted,
          disabled && styles.hintButtonDisabled,
        ]}
        onPress={hints.length > 0 && !isLoading ? () => setIsExpanded(!isExpanded) : handleRequestHint}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons
            name={allHintsUsed ? 'lightbulb-on' : 'lightbulb-on-outline'}
            size={20}
            color="#FFFFFF"
          />
        )}
        <Text style={styles.hintButtonText}>
          {isLoading
            ? 'AI가 힌트를 생성 중...'
            : allHintsUsed
            ? `힌트 ${hints.length}/${MAX_HINT_LEVEL}`
            : `힌트 받기 (${nextLevel}/${MAX_HINT_LEVEL})`}
        </Text>

        {/* Hint usage counter badge */}
        {hints.length > 0 && (
          <View style={styles.hintCountBadge}>
            <Text style={styles.hintCountText}>{hints.length}</Text>
          </View>
        )}

        {/* Expand arrow (when hints exist) */}
        {hints.length > 0 && !isLoading && (
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#FFFFFF"
          />
        )}
      </TouchableOpacity>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRequestHint}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hints panel */}
      {isExpanded && hints.length > 0 && (
        <View style={styles.hintsPanel}>
          {hints.map((hint, index) => (
            <View
              key={`hint-${hint.level}`}
              style={[
                styles.hintCard,
                { borderLeftColor: HINT_COLORS[hint.level] },
                index < hints.length - 1 && styles.hintCardMargin,
              ]}
            >
              <View style={styles.hintCardHeader}>
                <MaterialCommunityIcons
                  name={HINT_ICONS[hint.level] as any}
                  size={16}
                  color={HINT_COLORS[hint.level]}
                />
                <Text style={[styles.hintLevelLabel, { color: HINT_COLORS[hint.level] }]}>
                  {HINT_LEVEL_LABELS[hint.level]}
                </Text>
              </View>
              <MathText
                content={hint.content}
                fontSize={14}
                color={colors.textPrimary}
              />
            </View>
          ))}

          {/* Next hint button (when hints remain) */}
          {!allHintsUsed && (
            <TouchableOpacity
              style={[
                styles.nextHintButton,
                { borderColor: HINT_COLORS[nextLevel] },
              ]}
              onPress={handleRequestHint}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={HINT_COLORS[nextLevel]} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={HINT_ICONS[nextLevel] as any}
                    size={16}
                    color={HINT_COLORS[nextLevel]}
                  />
                  <Text style={[styles.nextHintText, { color: HINT_COLORS[nextLevel] }]}>
                    {HINT_LEVEL_LABELS[nextLevel]} 받기
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    minHeight: 44, // tablet touch target
  },
  hintButtonExhausted: {
    backgroundColor: colors.textSecondary,
  },
  hintButtonDisabled: {
    opacity: 0.5,
  },
  hintButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hintCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  hintCountText: {
    fontSize: 11,
    fontWeight: '700',
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
  hintsPanel: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hintCard: {
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  hintCardMargin: {
    marginBottom: spacing.md,
  },
  hintCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  hintLevelLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  nextHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    minHeight: 44,
  },
  nextHintText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
