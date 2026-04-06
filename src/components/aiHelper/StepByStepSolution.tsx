import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MathText from '../common/MathText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { getStepByStepSolution } from '../../services/geminiHelper';
import type { StepByStepResponse } from '../../types/aiHelper';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Props ─────────────────────────────────────────────

interface StepByStepSolutionProps {
  /** Current problem info */
  problem: {
    id: string;
    content: string;
    topic?: string;
    answer?: string;
    type?: string;
  };
  /** Callback when solution is viewed (for external tracking) */
  onSolutionViewed?: (problemId: string) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

// ─── Component ─────────────────────────────────────────

export default function StepByStepSolution({
  problem,
  onSolutionViewed,
  disabled = false,
}: StepByStepSolutionProps) {
  // Solution data
  const [solution, setSolution] = useState<StepByStepResponse | null>(null);
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  // Expanded state
  const [isExpanded, setIsExpanded] = useState(false);
  // Per-step expanded state
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  // Error
  const [error, setError] = useState<string | null>(null);

  // Detect problem change
  const [currentProblemId, setCurrentProblemId] = useState(problem.id);
  if (problem.id !== currentProblemId) {
    setSolution(null);
    setIsExpanded(false);
    setExpandedSteps(new Set());
    setError(null);
    setCurrentProblemId(problem.id);
  }

  // Request solution
  const handleRequestSolution = useCallback(async () => {
    if (isLoading || disabled) return;

    // If already loaded, just toggle
    if (solution) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // getStepByStepSolution(problemContent, problemType?, problemAnswer?) from geminiHelper
      const result = await getStepByStepSolution(
        problem.content,
        problem.type || '단답형',
        problem.answer,
      );
      const converted: StepByStepResponse = {
        steps: result.steps.map((s) => ({
          step: s.step,
          title: s.title,
          content: s.content,
          formula: s.formula,
        })),
        finalAnswer: result.finalAnswer,
      };
      setSolution(converted);
      setIsExpanded(true);
      onSolutionViewed?.(problem.id);
    } catch (err) {
      setError('풀이를 불러오지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [problem, solution, isExpanded, isLoading, disabled, onSolutionViewed]);

  // Toggle a step
  const toggleStep = useCallback((stepNumber: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  }, []);

  // Toggle all steps
  const toggleAllSteps = useCallback(() => {
    if (!solution) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedSteps.size === solution.steps.length) {
      setExpandedSteps(new Set());
    } else {
      setExpandedSteps(new Set(solution.steps.map((s) => s.step)));
    }
  }, [solution, expandedSteps]);

  // ─── Render ──────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Solution button */}
      <TouchableOpacity
        style={[
          styles.solutionButton,
          solution && styles.solutionButtonLoaded,
          disabled && styles.solutionButtonDisabled,
        ]}
        onPress={handleRequestSolution}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons
            name={solution ? 'book-open-variant' : 'book-open-page-variant-outline'}
            size={20}
            color="#FFFFFF"
          />
        )}
        <Text style={styles.solutionButtonText}>
          {isLoading
            ? 'AI가 풀이를 생성 중...'
            : solution
            ? isExpanded
              ? '풀이 접기'
              : '풀이 펼치기'
            : '단계별 풀이 보기'}
        </Text>
        {solution && !isLoading && (
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
          <TouchableOpacity onPress={handleRequestSolution}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Solution panel */}
      {isExpanded && solution && (
        <View style={styles.solutionPanel}>
          {/* Header: step count + toggle all */}
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>
              풀이 ({solution.steps.length}단계)
            </Text>
            <TouchableOpacity onPress={toggleAllSteps}>
              <Text style={styles.toggleAllText}>
                {expandedSteps.size === solution.steps.length ? '모두 접기' : '모두 펼치기'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Step accordions */}
          {solution.steps.map((step, index) => {
            const isStepExpanded = expandedSteps.has(step.step);
            return (
              <View key={`step-${step.step}`} style={styles.stepContainer}>
                {/* Step header (click to toggle) */}
                <TouchableOpacity
                  style={[
                    styles.stepHeader,
                    isStepExpanded && styles.stepHeaderExpanded,
                  ]}
                  onPress={() => toggleStep(step.step)}
                  activeOpacity={0.7}
                >
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>{step.step}</Text>
                  </View>
                  <Text
                    style={[
                      styles.stepTitle,
                      isStepExpanded && styles.stepTitleExpanded,
                    ]}
                    numberOfLines={isStepExpanded ? undefined : 1}
                  >
                    {step.title}
                  </Text>
                  <MaterialCommunityIcons
                    name={isStepExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isStepExpanded ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>

                {/* Step content (when expanded) */}
                {isStepExpanded && (
                  <View style={styles.stepContent}>
                    <MathText
                      content={step.content}
                      fontSize={14}
                      color={colors.textPrimary}
                    />
                    {step.formula && (
                      <View style={styles.formulaBox}>
                        <MathText
                          content={step.formula}
                          fontSize={16}
                          color={colors.primaryDark}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Step connector line (except last) */}
                {index < solution.steps.length - 1 && (
                  <View style={styles.stepConnector}>
                    <View style={styles.stepConnectorLine} />
                  </View>
                )}
              </View>
            );
          })}

          {/* Final answer */}
          <View style={styles.finalAnswerContainer}>
            <View style={styles.finalAnswerHeader}>
              <MaterialCommunityIcons name="check-decagram" size={18} color={colors.success} />
              <Text style={styles.finalAnswerLabel}>최종 답</Text>
            </View>
            <View style={styles.finalAnswerContent}>
              <MathText
                content={solution.finalAnswer}
                fontSize={18}
                color={colors.success}
              />
            </View>
          </View>
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
  solutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    minHeight: 44,
  },
  solutionButtonLoaded: {
    backgroundColor: colors.secondaryDark,
  },
  solutionButtonDisabled: {
    opacity: 0.5,
  },
  solutionButtonText: {
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
  solutionPanel: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toggleAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  stepContainer: {
    // each step block
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    minHeight: 44,
  },
  stepHeaderExpanded: {
    backgroundColor: colors.primary + '10',
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepTitleExpanded: {
    color: colors.primaryDark,
  },
  stepContent: {
    marginLeft: 28 + spacing.sm, // stepNumberCircle width + gap
    paddingLeft: spacing.sm,
    paddingVertical: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary + '30',
  },
  formulaBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  stepConnector: {
    marginLeft: 14, // center of stepNumberCircle
    height: 8,
    justifyContent: 'center',
  },
  stepConnectorLine: {
    width: 2,
    height: '100%',
    backgroundColor: colors.border,
  },
  finalAnswerContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.success + '40',
  },
  finalAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  finalAnswerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
  },
  finalAnswerContent: {
    padding: spacing.sm,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
});
