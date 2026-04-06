import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows, opacity, opacityToHex } from '../../constants/theme';

interface AnalysisSkeletonProps {
  /** Current analysis step */
  step: 'idle' | 'weakness' | 'recommendations' | 'report' | 'done';
}

const STEP_MESSAGES: Record<string, { message: string; icon: string }> = {
  idle: { message: '분석을 준비하고 있습니다...', icon: 'clock-outline' },
  weakness: { message: 'AI가 취약점을 분석하고 있습니다...', icon: 'brain' },
  recommendations: { message: '맞춤 추천 문제를 선별하고 있습니다...', icon: 'lightbulb-on-outline' },
  report: { message: '학습 리포트를 생성하고 있습니다...', icon: 'file-chart-outline' },
  done: { message: '분석이 완료되었습니다!', icon: 'check-circle' },
};

// Individual skeleton bar
function SkeletonBar({ width, height = 14, style }: { width: number | string; height?: number; style?: any }) {
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [shimmerProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerProgress.value, [0, 1], [0.3, 1]),
  }));

  return (
    <Animated.View
      style={[
        styles.skeletonBar,
        { width: width as any, height },
        animatedStyle,
        style,
      ]}
    />
  );
}

export default function AnalysisSkeleton({ step }: AnalysisSkeletonProps) {
  const stepInfo = STEP_MESSAGES[step] || STEP_MESSAGES.idle;

  // Progress indicator: which steps are complete
  const steps = ['weakness', 'recommendations', 'report'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <View style={styles.container}>
      {/* Progress header */}
      <View style={styles.progressHeader}>
        <MaterialCommunityIcons
          name={stepInfo.icon as any}
          size={24}
          color={colors.primary}
        />
        <Text style={styles.progressMessage}>{stepInfo.message}</Text>
      </View>

      {/* Step indicators */}
      <View style={styles.stepsRow}>
        {steps.map((s, i) => {
          const isComplete = step === 'done' || i < currentStepIndex;
          const isCurrent = s === step;
          return (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  isComplete && styles.stepDotComplete,
                  isCurrent && styles.stepDotCurrent,
                ]}
              >
                {isComplete && (
                  <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  (isComplete || isCurrent) && styles.stepLabelActive,
                ]}
              >
                {s === 'weakness' ? '취약점 분석' : s === 'recommendations' ? '문제 추천' : '리포트 생성'}
              </Text>
              {i < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    isComplete && styles.stepLineComplete,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Skeleton content blocks */}
      <View style={styles.skeletonSection}>
        {/* Fake radar chart skeleton */}
        <View style={styles.skeletonCard}>
          <SkeletonBar width="40%" height={16} />
          <View style={styles.skeletonCircle} />
        </View>

        {/* Fake weakness cards */}
        <View style={styles.skeletonCard}>
          <SkeletonBar width="30%" height={16} />
          <View style={{ marginTop: 12 }}>
            <SkeletonBar width="100%" height={60} />
          </View>
          <View style={{ marginTop: 8 }}>
            <SkeletonBar width="100%" height={60} />
          </View>
          <View style={{ marginTop: 8 }}>
            <SkeletonBar width="80%" height={60} />
          </View>
        </View>

        {/* Fake timeline skeleton */}
        <View style={styles.skeletonCard}>
          <SkeletonBar width="35%" height={16} />
          <View style={{ marginTop: 12 }}>
            <SkeletonBar width="100%" height={120} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + opacityToHex(opacity.subtle),
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  progressMessage: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.primary,
    flex: 1,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotComplete: {
    backgroundColor: colors.success,
  },
  stepDotCurrent: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    ...typography.labelSmall,
    color: colors.textDisabled,
    marginLeft: 4,
  },
  stepLabelActive: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: colors.surfaceVariant,
    marginHorizontal: 4,
  },
  stepLineComplete: {
    backgroundColor: colors.success,
  },
  skeletonSection: {
    gap: spacing.md,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  skeletonBar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
  },
  skeletonCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surfaceVariant,
    alignSelf: 'center',
    marginTop: 16,
  },
});
