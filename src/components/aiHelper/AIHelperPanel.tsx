import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HintButton from './HintButton';
import StepByStepSolution from './StepByStepSolution';
import SimilarProblems from './SimilarProblems';
import { colors, spacing } from '../../constants/theme';
import type { HintLevel } from '../../types/aiHelper';

// ─── Props ─────────────────────────────────────────────

interface AIHelperPanelProps {
  /** Current problem info */
  problem: {
    id: string;
    content: string;
    topic?: string;
    answer?: string;
    type?: string;
  };
  /**
   * Problem bank data for similar problems search.
   * Each item needs at minimum: id, content, topic, difficulty.
   */
  problemBank?: Array<{
    id: string;
    content: string;
    topic: string;
    difficulty: string;
  }>;
  /** Callback when a hint is used */
  onHintUsed?: (problemId: string, level: HintLevel) => void;
  /** Callback when solution is viewed */
  onSolutionViewed?: (problemId: string) => void;
  /** Callback when similar problems are viewed */
  onSimilarViewed?: (problemId: string) => void;
  /** Callback when a similar problem card is pressed */
  onSimilarProblemPress?: (problemId: string) => void;
  /** Disable all AI helper features */
  disabled?: boolean;
}

// ─── Component ─────────────────────────────────────────

export default function AIHelperPanel({
  problem,
  problemBank = [],
  onHintUsed,
  onSolutionViewed,
  onSimilarViewed,
  onSimilarProblemPress,
  disabled = false,
}: AIHelperPanelProps) {
  return (
    <View style={styles.container}>
      {/* Divider with label */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerLabel}>
          <MaterialCommunityIcons name="robot-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.dividerText}>AI 도우미</Text>
        </View>
        <View style={styles.dividerLine} />
      </View>

      {/* Hint button */}
      <HintButton
        problem={{
          id: problem.id,
          content: problem.content,
          topic: problem.topic,
          answer: problem.answer,
        }}
        onHintUsed={onHintUsed}
        disabled={disabled}
      />

      {/* Step-by-step solution */}
      <StepByStepSolution
        problem={{
          id: problem.id,
          content: problem.content,
          topic: problem.topic,
          answer: problem.answer,
          type: problem.type,
        }}
        onSolutionViewed={onSolutionViewed}
        disabled={disabled}
      />

      {/* Similar problems */}
      <SimilarProblems
        problem={{
          id: problem.id,
          content: problem.content,
          topic: problem.topic,
        }}
        problemBank={problemBank}
        onProblemPress={onSimilarProblemPress}
        onSimilarViewed={onSimilarViewed}
        disabled={disabled}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
