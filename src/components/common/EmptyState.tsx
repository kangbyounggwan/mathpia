import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/theme';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
  iconSize?: number;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor = colors.textDisabled,
  iconSize = 64,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={iconSize}
        color={iconColor}
      />
      <Text style={styles.title}>{title}</Text>
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button
          mode="outlined"
          onPress={onAction}
          style={styles.actionButton}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  description: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  actionButton: {
    marginTop: spacing.md,
  },
});
