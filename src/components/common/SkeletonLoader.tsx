import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { colors, borderRadius, spacing } from '../../constants/theme';

// ---- Types ----

export type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card' | 'listItem';

export interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number;
  radius?: number;
  count?: number;
  gap?: number;
  style?: ViewStyle;
}

// ---- Component ----

export function SkeletonLoader({
  variant = 'rect',
  width: widthProp,
  height: heightProp,
  radius: radiusProp,
  count = 1,
  gap = spacing.sm,
  style,
}: SkeletonLoaderProps) {
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [shimmerProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerProgress.value, [0, 1], [0.3, 0.7]),
  }));

  const resolveProps = () => {
    switch (variant) {
      case 'text':
        return {
          width: widthProp ?? '80%',
          height: heightProp ?? 14,
          borderRadius: radiusProp ?? borderRadius.sm,
        };
      case 'circle': {
        const circleSize = heightProp ?? 48;
        return {
          width: widthProp ?? circleSize,
          height: circleSize,
          borderRadius: radiusProp ?? circleSize / 2,
        };
      }
      case 'card':
        return {
          width: widthProp ?? '100%',
          height: heightProp ?? 120,
          borderRadius: radiusProp ?? borderRadius.lg,
        };
      case 'listItem':
        return {
          width: widthProp ?? '100%',
          height: heightProp ?? 72,
          borderRadius: radiusProp ?? borderRadius.md,
        };
      case 'rect':
      default:
        return {
          width: widthProp ?? '100%',
          height: heightProp ?? 40,
          borderRadius: radiusProp ?? borderRadius.md,
        };
    }
  };

  const resolved = resolveProps();

  const items = Array.from({ length: count }, (_, i) => (
    <Animated.View
      key={i}
      style={[
        styles.base,
        {
          width: resolved.width as any,
          height: resolved.height,
          borderRadius: resolved.borderRadius,
          marginBottom: i < count - 1 ? gap : 0,
        },
        animatedStyle,
        style,
      ]}
    />
  ));

  return count === 1 ? items[0] : <View>{items}</View>;
}

// ---- Preset Skeletons ----

export function SkeletonStatCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.statCard, style]}>
      <SkeletonLoader variant="circle" height={40} />
      <SkeletonLoader variant="text" width="60%" height={20} style={{ marginTop: spacing.sm }} />
      <SkeletonLoader variant="text" width="40%" height={14} style={{ marginTop: spacing.xs }} />
    </View>
  );
}

export function SkeletonListItem({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.listItem, style]}>
      <SkeletonLoader variant="circle" height={48} />
      <View style={styles.listItemText}>
        <SkeletonLoader variant="text" width="70%" height={16} />
        <SkeletonLoader variant="text" width="50%" height={12} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={styles.dashboard}>
      <SkeletonLoader variant="card" height={140} />
      <View style={styles.dashboardRow}>
        <SkeletonStatCard style={{ flex: 1 }} />
        <SkeletonStatCard style={{ flex: 1 }} />
        <SkeletonStatCard style={{ flex: 1 }} />
      </View>
      <SkeletonLoader variant="card" height={80} count={3} gap={spacing.sm} />
    </View>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceVariant,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  listItemText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  dashboard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  dashboardRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
