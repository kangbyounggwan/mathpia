import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/theme';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={colors.error}
          />
          <Text style={styles.title}>문제가 발생했습니다</Text>
          <Text style={styles.description}>
            예기치 않은 오류가 발생했습니다. 다시 시도해주세요.
          </Text>
          <Button mode="contained" onPress={this.handleRetry} style={styles.button}>
            다시 시도
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
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
  button: {
    marginTop: spacing.md,
  },
});
