import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevation = 1,
  accessibilityLabel,
}) => {
  const scale = useSharedValue(1);

  // Extract layout props for the outer Animated.View so flex/width work correctly
  const {
    flex, flexGrow, flexShrink, flexBasis, width, minWidth, maxWidth,
    alignSelf, margin, marginTop, marginBottom, marginLeft, marginRight,
    marginHorizontal, marginVertical,
    ...innerStyle
  } = (style || {}) as ViewStyle;

  const outerLayout: ViewStyle = {};
  if (flex !== undefined) outerLayout.flex = flex;
  if (flexGrow !== undefined) outerLayout.flexGrow = flexGrow;
  if (flexShrink !== undefined) outerLayout.flexShrink = flexShrink;
  if (flexBasis !== undefined) outerLayout.flexBasis = flexBasis;
  if (width !== undefined) outerLayout.width = width;
  if (minWidth !== undefined) outerLayout.minWidth = minWidth;
  if (maxWidth !== undefined) outerLayout.maxWidth = maxWidth;
  if (alignSelf !== undefined) outerLayout.alignSelf = alignSelf;
  if (margin !== undefined) outerLayout.margin = margin;
  if (marginTop !== undefined) outerLayout.marginTop = marginTop;
  if (marginBottom !== undefined) outerLayout.marginBottom = marginBottom;
  if (marginLeft !== undefined) outerLayout.marginLeft = marginLeft;
  if (marginRight !== undefined) outerLayout.marginRight = marginRight;
  if (marginHorizontal !== undefined) outerLayout.marginHorizontal = marginHorizontal;
  if (marginVertical !== undefined) outerLayout.marginVertical = marginVertical;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withTiming(0.98, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withTiming(1, { duration: 150 });
    }
  };

  return (
    <Animated.View style={[outerLayout, animatedStyle]}>
      <PaperCard
        mode="elevated"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, innerStyle]}
        elevation={elevation}
        accessibilityLabel={accessibilityLabel}
      >
        <PaperCard.Content style={styles.content}>
          {children}
        </PaperCard.Content>
      </PaperCard>
    </Animated.View>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  left,
  right,
}) => {
  return (
    <PaperCard.Title
      title={title}
      subtitle={subtitle}
      left={left ? () => left : undefined}
      right={right ? () => right : undefined}
      titleStyle={styles.title}
      subtitleStyle={styles.subtitle}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginVertical: spacing.sm,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 18,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
