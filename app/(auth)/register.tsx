import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../../src/components/common';
import { colors, spacing, typography } from '../../src/constants/theme';
import { UserRole, Grade } from '../../src/types';

type ValidationState = 'none' | 'valid' | 'invalid';

export default function RegisterScreen() {
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [academyCode, setAcademyCode] = useState('');
  const [grade, setGrade] = useState<Grade>('고1');
  const [isLoading, setIsLoading] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const isConfirmPasswordValid = confirmPassword.length > 0 && password === confirmPassword;

  const emailValidationState: ValidationState =
    email.length === 0 ? 'none' : isEmailValid ? 'valid' : 'invalid';
  const passwordValidationState: ValidationState =
    password.length === 0 ? 'none' : isPasswordValid ? 'valid' : 'invalid';
  const confirmPasswordValidationState: ValidationState =
    confirmPassword.length === 0 ? 'none' : isConfirmPasswordValid ? 'valid' : 'invalid';

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    // TODO: Firebase 회원가입 구현
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    alert('회원가입이 완료되었습니다. 로그인해주세요.');
    router.back();
  };

  const grades: { value: Grade; label: string }[] = [
    { value: '중1', label: '중1' },
    { value: '중2', label: '중2' },
    { value: '중3', label: '중3' },
    { value: '고1', label: '고1' },
    { value: '고2', label: '고2' },
    { value: '고3', label: '고3' },
  ];

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
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>Mathpia에 오신 것을 환영합니다</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionLabel}>역할 선택</Text>
            <SegmentedButtons
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
              buttons={[
                { value: 'student', label: '학생' },
                { value: 'teacher', label: '선생님' },
              ]}
              style={styles.segmentedButtons}
            />

            <Input
              label="이름"
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력하세요"
              style={styles.input}
            />

            <Input
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              validationState={emailValidationState}
              style={styles.input}
            />

            <Input
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="6자 이상 입력하세요"
              secureTextEntry
              validationState={passwordValidationState}
              style={styles.input}
            />

            <Input
              label="비밀번호 확인"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="비밀번호를 다시 입력하세요"
              secureTextEntry
              error={confirmPassword.length > 0 && password !== confirmPassword}
              validationState={confirmPasswordValidationState}
              style={styles.input}
            />

            <Input
              label="전화번호"
              value={phone}
              onChangeText={setPhone}
              placeholder="010-0000-0000"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Input
              label="학원 코드"
              value={academyCode}
              onChangeText={setAcademyCode}
              placeholder="학원에서 받은 코드를 입력하세요"
              style={styles.input}
            />

            {role === 'student' && (
              <>
                <Text style={styles.sectionLabel}>학년 선택</Text>
                <View style={styles.gradeContainer}>
                  {grades.map((g) => (
                    <Button
                      key={g.value}
                      mode={grade === g.value ? 'contained' : 'outlined'}
                      onPress={() => setGrade(g.value)}
                      style={styles.gradeButton}
                    >
                      {g.label}
                    </Button>
                  ))}
                </View>
              </>
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading || !name || !email || !password || !confirmPassword || !phone || !academyCode}
              fullWidth
              style={styles.registerButton}
            >
              회원가입
            </Button>

            <Button
              mode="text"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              이미 계정이 있으신가요? 로그인
            </Button>
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
    padding: spacing.xl,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.heading1,
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
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  segmentedButtons: {
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
  },
  gradeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  gradeButton: {
    minWidth: 60,
  },
  registerButton: {
    marginTop: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
  },
});
