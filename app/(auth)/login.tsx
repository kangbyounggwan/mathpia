import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Input } from '../../src/components/common';
import { useAuthStore } from '../../src/stores/authStore';
import { colors, spacing, typography, shadows, borderRadius } from '../../src/constants/theme';

type ValidationState = 'none' | 'valid' | 'invalid';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;

  const emailValidationState: ValidationState =
    email.length === 0 ? 'none' : isEmailValid ? 'valid' : 'invalid';
  const passwordValidationState: ValidationState =
    password.length === 0 ? 'none' : isPasswordValid ? 'valid' : 'invalid';

  const handleLogin = async () => {
    if (!email || !password) {
      return;
    }

    await login(email, password);

    const { isAuthenticated, user } = useAuthStore.getState();
    if (isAuthenticated && user) {
      if (user.role === 'teacher' || user.role === 'admin') {
        router.replace('/(teacher)');
      } else if (user.role === 'parent') {
        router.replace('/(parent)/' as any);
      } else {
        router.replace('/(student)');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>M</Text>
            </View>
            <Text style={styles.title}>Mathpia</Text>
            <Text style={styles.subtitle}>학원 계정으로 로그인하세요</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="이메일"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError();
              }}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              validationState={emailValidationState}
              style={styles.input}
            />

            <Input
              label="비밀번호"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError();
              }}
              placeholder="비밀번호를 입력하세요"
              secureTextEntry
              validationState={passwordValidationState}
              style={styles.input}
            />

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading || !email || !password}
              fullWidth
              style={styles.loginButton}
            >
              로그인
            </Button>

            <Button
              mode="text"
              onPress={() => router.push('/(auth)/register')}
              style={styles.registerButton}
            >
              계정이 없으신가요? 회원가입
            </Button>
          </View>

          <View style={styles.testAccountContainer}>
            <TouchableOpacity
              onPress={() => setShowTestAccounts(!showTestAccounts)}
              activeOpacity={0.7}
              accessibilityLabel={showTestAccounts ? '테스트 계정 숨기기' : '테스트 계정 보기'}
              accessibilityRole="button"
            >
              <View style={styles.testAccountToggle}>
                <Text style={styles.testAccountToggleText}>테스트 계정 보기</Text>
                <MaterialCommunityIcons
                  name={showTestAccounts ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
            {showTestAccounts && (
              <View style={styles.testAccountInfo}>
                <Text style={styles.testAccountText}>선생님: teacher@test.com / 123456</Text>
                <Text style={styles.testAccountText}>학생: student@test.com / 123456</Text>
                <Text style={styles.testAccountText}>학부모: parent@test.com / 123456</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  logo: {
    ...typography.heading1,
    fontSize: 48,
    fontWeight: '700',
    color: colors.surface,
  },
  title: {
    ...typography.heading1,
    fontSize: 36,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: spacing.md,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  testAccountContainer: {
    marginTop: spacing.xxl,
  },
  testAccountToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  testAccountToggleText: {
    ...typography.label,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  testAccountInfo: {
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  testAccountText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
