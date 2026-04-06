# Section 03: Login/Auth Screen Enhancement

> **Phase**: 3 of 8
> **Status**: Pending
> **Depends on**: section-01-design-tokens, section-02-common-components
> **Blocks**: Nothing (leaf node in dependency graph)
> **Parallelizable with**: section-04 through section-08 (after 01+02 complete)
> **Estimated Effort**: Small
> **Files to modify**: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`

---

## 1. Background

The login and register screens are the first thing every user sees. They currently work correctly but have prototype-quality styling: hardcoded font sizes, system fonts, inline shadow declarations, no form validation feedback, and permanently visible test account credentials. This section applies the design token system (established in section-01) and the enhanced common components (established in section-02) to both auth screens.

### What Section 01 Provides (Prerequisites)

This section assumes the following exports exist in `src/constants/theme.ts` after section-01 is complete:

```typescript
// Semantic typography tokens (from section-01, 1.4)
export const typography = {
  heading1:   { fontFamily: 'NotoSansKR-Bold',    fontSize: 32, lineHeight: 40 },
  heading2:   { fontFamily: 'NotoSansKR-Bold',    fontSize: 28, lineHeight: 36 },
  heading3:   { fontFamily: 'NotoSansKR-Medium',  fontSize: 22, lineHeight: 28 },
  subtitle:   { fontFamily: 'NotoSansKR-Medium',  fontSize: 16, lineHeight: 24 },
  body:       { fontFamily: 'NotoSansKR-Regular',  fontSize: 16, lineHeight: 24 },
  bodySmall:  { fontFamily: 'NotoSansKR-Regular',  fontSize: 14, lineHeight: 20 },
  caption:    { fontFamily: 'NotoSansKR-Regular',  fontSize: 12, lineHeight: 16 },
  label:      { fontFamily: 'NotoSansKR-Medium',  fontSize: 14, lineHeight: 20 },
  labelSmall: { fontFamily: 'NotoSansKR-Medium',  fontSize: 11, lineHeight: 16 },
} as const;

// Shadow tokens (from section-01, 1.6)
export const shadows: Record<string, ViewStyle> = {
  none: {},
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 6 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.20, shadowRadius: 16, elevation: 12 },
};
```

The existing `colors`, `spacing`, and `borderRadius` exports remain unchanged.

### What Section 02 Provides (Prerequisites)

The `Input` component (`src/components/common/Input.tsx`) gains two new props after section-02 is complete:

```typescript
type ValidationState = 'none' | 'valid' | 'invalid';

interface InputProps {
  // ... all existing props unchanged ...
  /** Validation state: shows check-circle (valid) or close-circle (invalid) icon on right */
  validationState?: ValidationState;   // default: 'none'
  /** Helper text shown below input (non-error) */
  helperText?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}
```

When `validationState` is `'valid'`, a green `check-circle` icon (20px, `colors.success` / `#4CAF50`) appears on the right side of the input. When `'invalid'`, a red `close-circle` icon (20px, `colors.error` / `#F44336`) appears. When `'none'` (default), no icon is shown.

The `Button` component (`src/components/common/Button.tsx`) gains `size` and `accessibilityLabel` props but these are optional and backward-compatible. No changes to auth screens are needed for Button beyond what already exists.

---

## 2. Requirements

1. **Typography tokens**: Every hardcoded `fontSize`, `fontWeight`, and `fontFamily` in both screens must be replaced with `typography.*` token spreads.
2. **Shadow tokens**: The inline `shadowColor` / `shadowOffset` / `shadowOpacity` / `shadowRadius` / `elevation` declaration on the logo container must be replaced with `...shadows.lg`.
3. **Font family**: All text elements must render in Noto Sans KR via the typography tokens (no more system font).
4. **Form validation (login)**: Add real-time visual feedback for email format and password length using the enhanced `Input` component's `validationState` prop.
5. **Form validation (register)**: Add real-time visual feedback for email, password, and password confirmation fields.
6. **Collapsible test accounts (login)**: The test account information section must be hidden by default behind a toggle button labeled "테스트 계정 보기", with chevron icon indicating expand/collapse state.
7. **No business logic changes**: Login flow, navigation, role routing, and registration flow must remain identical.
8. **borderRadius token**: Replace the hardcoded `borderRadius: 12` on `testAccountInfo` with `borderRadius.lg` token.

---

## 3. Login Screen (`app/(auth)/login.tsx`)

### 3.1 Current State Analysis

The current file has these style properties that need replacement:

| Style Name | Current Property | Current Value | Line(s) |
|---|---|---|---|
| `logoContainer` | `shadowColor` | `'#000'` | 142 |
| `logoContainer` | `shadowOffset` | `{ width: 0, height: 4 }` | 143 |
| `logoContainer` | `shadowOpacity` | `0.2` | 144 |
| `logoContainer` | `shadowRadius` | `8` | 145 |
| `logoContainer` | `elevation` | `8` | 146 |
| `logoContainer` | `borderRadius` | `25` | 138 |
| `logo` | `fontSize` | `48` | 149 |
| `logo` | `fontWeight` | `'bold'` | 150 |
| `title` | `fontSize` | `36` | 154 |
| `title` | `fontWeight` | `'bold'` | 155 |
| `subtitle` | `fontSize` | `16` | 160 |
| `errorText` | `fontSize` | `14` | 171 |
| `testAccountInfo` | `borderRadius` | `12` | 186 |
| `testAccountTitle` | `fontSize` | `14` | 188 |
| `testAccountTitle` | `fontWeight` | `'600'` | 189 |
| `testAccountText` | `fontSize` | `12` | 193 |

### 3.2 Typography Token Mapping (Login)

Each hardcoded style property maps to a specific typography token. The spread operator (`...`) applies `fontFamily`, `fontSize`, and `lineHeight` from the token in one statement.

| Style Name | Current Code | Replacement Code | Token Used |
|---|---|---|---|
| `logo` | `fontSize: 48, fontWeight: 'bold'` | `...typography.heading1, fontSize: 48, fontWeight: '700'` | `typography.heading1` (base 32px overridden to 48px; `heading1` provides `fontFamily: 'NotoSansKR-Bold'`) |
| `title` | `fontSize: 36, fontWeight: 'bold'` | `...typography.heading1, fontSize: 36` | `typography.heading1` (base 32px overridden to 36px; Bold weight is already in the token) |
| `subtitle` | `fontSize: 16` | `...typography.body` | `typography.body` (16px Regular -- exact match) |
| `errorText` | `fontSize: 14` | `...typography.bodySmall` | `typography.bodySmall` (14px Regular -- exact match) |
| `testAccountTitle` | `fontSize: 14, fontWeight: '600'` | `...typography.label` | `typography.label` (14px Medium -- `'600'` normalizes to Medium `'500'`) |
| `testAccountText` | `fontSize: 12` | `...typography.caption` | `typography.caption` (12px Regular -- exact match) |

> **Note on fontWeight normalization**: The current code uses `fontWeight: '600'` (semi-bold). Noto Sans KR is loaded with three weights: Regular (400), Medium (500), Bold (700). There is no 600-weight file. The `typography.label` token uses Medium (500), which is the closest downward match and visually nearly identical.

### 3.3 Shadow Token Replacement (Login)

The `logoContainer` style currently has five inline shadow properties:

**Current code** (lines 142-146 in `login.tsx`):
```typescript
logoContainer: {
  width: 100,
  height: 100,
  borderRadius: 25,
  backgroundColor: colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: spacing.lg,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 8,
},
```

**Replacement code**:
```typescript
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
```

**Comparison of shadow values**:

| Property | Current (inline) | `shadows.lg` token | Difference |
|---|---|---|---|
| `shadowColor` | `'#000'` | `'#000'` | Same |
| `shadowOffset` | `{ width: 0, height: 4 }` | `{ width: 0, height: 4 }` | Same |
| `shadowOpacity` | `0.2` | `0.16` | Slightly reduced (more subtle, consistent with system) |
| `shadowRadius` | `8` | `8` | Same |
| `elevation` | `8` | `6` | Reduced (Android; `shadows.lg` = 6, but if a stronger shadow is desired, `shadows.xl` = 12 is available) |

The `shadows.lg` token is the closest match. The reduction from `0.2` to `0.16` opacity and `8` to `6` elevation is intentional -- it brings the logo shadow in line with the rest of the design system. If the original intensity is preferred, use `shadows.xl` instead.

### 3.4 borderRadius Token Replacement (Login)

| Style Name | Current Code | Replacement Code |
|---|---|---|
| `testAccountInfo` | `borderRadius: 12` | `borderRadius: borderRadius.lg` |

The `borderRadius.lg` token is `12`, which is an exact match.

### 3.5 Form Validation Logic (Login)

Add real-time validation state computation for email and password fields. This is UI-only feedback -- it does NOT change the login business logic (the `handleLogin` function remains unchanged).

**Validation rules**:

| Field | Rule | Regex / Condition |
|---|---|---|
| Email | Valid email format | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| Password | Minimum 6 characters | `password.length >= 6` |

**Derived validation state logic**:

```typescript
// Computed inside the component body (not in state -- derived from email/password)
const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isPasswordValid = password.length >= 6;

// validationState follows a 3-state pattern:
//   'none'    -> field is empty (user hasn't typed yet; show no indicator)
//   'valid'   -> field has content AND passes validation (green check)
//   'invalid' -> field has content AND fails validation (red X)
const emailValidationState: ValidationState =
  email.length === 0 ? 'none' : isEmailValid ? 'valid' : 'invalid';

const passwordValidationState: ValidationState =
  password.length === 0 ? 'none' : isPasswordValid ? 'valid' : 'invalid';
```

**Type import** (add at top of file):
```typescript
// ValidationState type is not exported from Input.tsx in section-02.
// Define it locally or import if exported.
type ValidationState = 'none' | 'valid' | 'invalid';
```

**Applied to Input components**:

Email input (currently lines 53-64):
```typescript
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
```

Password input (currently lines 66-76):
```typescript
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
```

> **Important**: The `validationState` prop is purely visual -- it renders the icon via the enhanced `Input` component from section-02. It does NOT block form submission. The existing `disabled={isLoading || !email || !password}` guard on the login button remains the gatekeeper.

### 3.6 Collapsible Test Accounts (Login)

The test account information (`teacher@test.com`, `student@test.com`, `parent@test.com`) is useful during development but visually clutters the login screen. Wrap it in a collapsible toggle.

**New state variable**:
```typescript
const [showTestAccounts, setShowTestAccounts] = useState(false);
```

**New imports** (add to existing import from `react-native`):
```typescript
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
```

**New import** (add):
```typescript
import { MaterialCommunityIcons } from '@expo/vector-icons';
```

**Replace the current test account block** (currently lines 102-107 in the JSX):

Current JSX:
```tsx
<View style={styles.testAccountInfo}>
  <Text style={styles.testAccountTitle}>테스트 계정</Text>
  <Text style={styles.testAccountText}>선생님: teacher@test.com / 123456</Text>
  <Text style={styles.testAccountText}>학생: student@test.com / 123456</Text>
  <Text style={styles.testAccountText}>학부모: parent@test.com / 123456</Text>
</View>
```

Replacement JSX:
```tsx
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
```

**New styles for collapsible toggle**:
```typescript
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
```

**Modified existing styles**:
```typescript
// testAccountInfo loses its marginTop (now on testAccountContainer) and gains top padding
testAccountInfo: {
  padding: spacing.md,
  backgroundColor: colors.surfaceVariant,
  borderRadius: borderRadius.lg,
  marginTop: spacing.sm,
},
// testAccountTitle is REMOVED (no longer needed; toggle text serves as the title)
```

### 3.7 Complete Updated Login Screen

Below is the full `app/(auth)/login.tsx` file after all changes are applied.

```typescript
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

  // Derived validation states (UI feedback only; does not block submission)
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
```

### 3.8 Diff Summary (Login)

Changes grouped by category:

**Imports changed**:
| Import | Before | After |
|---|---|---|
| `react-native` | `View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView` | Added `TouchableOpacity` |
| `@expo/vector-icons` | (not imported) | Added `MaterialCommunityIcons` |
| `theme` | `colors, spacing` | `colors, spacing, typography, shadows, borderRadius` |

**State added**:
- `const [showTestAccounts, setShowTestAccounts] = useState(false);`

**Computed values added**:
- `isEmailValid`, `isPasswordValid`, `emailValidationState`, `passwordValidationState`

**Type added**:
- `type ValidationState = 'none' | 'valid' | 'invalid';`

**JSX changed**:
- Email `<Input>`: added `validationState={emailValidationState}`
- Password `<Input>`: added `validationState={passwordValidationState}`
- Test account section: replaced static `<View>` with collapsible `<TouchableOpacity>` + conditional render

**Styles changed**:
- `logoContainer`: 5 inline shadow props replaced with `...shadows.lg`
- `logo`: `fontSize: 48, fontWeight: 'bold'` replaced with `...typography.heading1, fontSize: 48, fontWeight: '700'`
- `title`: `fontSize: 36, fontWeight: 'bold'` replaced with `...typography.heading1, fontSize: 36`
- `subtitle`: `fontSize: 16` replaced with `...typography.body`
- `errorText`: `fontSize: 14` replaced with `...typography.bodySmall`
- `testAccountTitle`: **REMOVED** (replaced by `testAccountToggleText`)
- `testAccountText`: `fontSize: 12` replaced with `...typography.caption`
- `testAccountInfo`: `borderRadius: 12` replaced with `borderRadius: borderRadius.lg`, `marginTop` changed

**Styles added**:
- `testAccountContainer`, `testAccountToggle`, `testAccountToggleText`

**Business logic**: UNCHANGED. `handleLogin`, routing, `useAuthStore` calls are identical.

---

## 4. Register Screen (`app/(auth)/register.tsx`)

### 4.1 Current State Analysis

The register screen has these style properties that need replacement:

| Style Name | Current Property | Current Value | Line(s) |
|---|---|---|---|
| `title` | `fontSize` | `32` | 188 |
| `title` | `fontWeight` | `'bold'` | 189 |
| `subtitle` | `fontSize` | `16` | 194 |
| `sectionLabel` | `fontSize` | `14` | 201 |
| `sectionLabel` | `fontWeight` | `'600'` | 202 |

> **Note**: The register screen has NO inline shadow declarations (unlike login). It also does not have a test account section.

### 4.2 Typography Token Mapping (Register)

| Style Name | Current Code | Replacement Code | Token Used |
|---|---|---|---|
| `title` | `fontSize: 32, fontWeight: 'bold'` | `...typography.heading1` | `typography.heading1` (32px Bold -- exact match) |
| `subtitle` | `fontSize: 16` | `...typography.body` | `typography.body` (16px Regular -- exact match) |
| `sectionLabel` | `fontSize: 14, fontWeight: '600'` | `...typography.label` | `typography.label` (14px Medium -- `'600'` normalizes to `'500'`) |

### 4.3 Form Validation Logic (Register)

The register screen has more fields than login. Add `validationState` to the email, password, and password confirmation inputs.

**Validation rules**:

| Field | Rule | Condition |
|---|---|---|
| Email | Valid email format | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)` |
| Password | Minimum 6 characters | `password.length >= 6` |
| Confirm Password | Matches password | `confirmPassword === password` |

> **Note**: The `name`, `phone`, and `academyCode` fields do NOT get `validationState`. They are freeform text fields with no specific format to validate beyond non-empty (which is already enforced by the submit button's `disabled` prop).

**Derived validation states** (add inside the component body):

```typescript
type ValidationState = 'none' | 'valid' | 'invalid';

const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isPasswordValid = password.length >= 6;
const isConfirmPasswordValid = confirmPassword.length > 0 && password === confirmPassword;

const emailValidationState: ValidationState =
  email.length === 0 ? 'none' : isEmailValid ? 'valid' : 'invalid';
const passwordValidationState: ValidationState =
  password.length === 0 ? 'none' : isPasswordValid ? 'valid' : 'invalid';
const confirmPasswordValidationState: ValidationState =
  confirmPassword.length === 0 ? 'none' : isConfirmPasswordValid ? 'valid' : 'invalid';
```

**Applied to Input components**:

Email input (currently lines 80-88):
```tsx
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
```

Password input (currently lines 90-97):
```tsx
<Input
  label="비밀번호"
  value={password}
  onChangeText={setPassword}
  placeholder="6자 이상 입력하세요"
  secureTextEntry
  validationState={passwordValidationState}
  style={styles.input}
/>
```

Confirm password input (currently lines 99-107):
```tsx
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
```

> **Note**: The confirm password field retains its existing `error` prop for the red outline behavior AND gains `validationState` for the icon. When `error=true` AND `validationState='invalid'`, the user sees both the red outline (from `error`) and the red X icon (from `validationState`), which is desirable.

### 4.4 Complete Updated Register Screen

Below is the full `app/(auth)/register.tsx` file after all changes are applied.

```typescript
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

  // Derived validation states (UI feedback only)
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
```

### 4.5 Diff Summary (Register)

**Imports changed**:
| Import | Before | After |
|---|---|---|
| `theme` | `colors, spacing` | `colors, spacing, typography` |

**Type added**:
- `type ValidationState = 'none' | 'valid' | 'invalid';`

**Computed values added**:
- `isEmailValid`, `isPasswordValid`, `isConfirmPasswordValid`
- `emailValidationState`, `passwordValidationState`, `confirmPasswordValidationState`

**JSX changed**:
- Email `<Input>`: added `validationState={emailValidationState}`
- Password `<Input>`: added `validationState={passwordValidationState}`
- Confirm Password `<Input>`: added `validationState={confirmPasswordValidationState}`

**Styles changed**:
- `title`: `fontSize: 32, fontWeight: 'bold'` replaced with `...typography.heading1`
- `subtitle`: `fontSize: 16` replaced with `...typography.body`
- `sectionLabel`: `fontSize: 14, fontWeight: '600'` replaced with `...typography.label`

**Business logic**: UNCHANGED. `handleRegister`, routing, grade selection, role selection are identical.

---

## 5. Validation Behavior Matrix

This table shows exactly what the user sees for every possible field state across both screens.

### Login Screen

| Email Value | Password Value | Email Icon | Password Icon | Login Button |
|---|---|---|---|---|
| `''` (empty) | `''` (empty) | None | None | Disabled |
| `'abc'` | `''` | Red X (invalid format) | None | Disabled |
| `'abc@test.com'` | `''` | Green check | None | Disabled |
| `''` | `'12345'` | None | Red X (< 6 chars) | Disabled |
| `''` | `'123456'` | None | Green check | Disabled |
| `'abc@test.com'` | `'123456'` | Green check | Green check | **Enabled** |
| `'abc'` | `'123456'` | Red X | Green check | **Enabled** (validation is visual only) |

> **Key insight**: The login button is enabled when both fields are non-empty (`!email || !password`). The validation icons are advisory. This preserves the original behavior exactly -- a user can attempt login with an invalid-looking email if they choose.

### Register Screen

| Field | Empty | Has Content + Invalid | Has Content + Valid |
|---|---|---|---|
| Email | No icon | Red X | Green check |
| Password | No icon | Red X (< 6 chars) | Green check |
| Confirm Password | No icon, no red outline | Red X + red outline (mismatch) | Green check, no red outline |
| Name | No icon (no validation) | No icon | No icon |
| Phone | No icon (no validation) | No icon | No icon |
| Academy Code | No icon (no validation) | No icon | No icon |

---

## 6. Email Regex Explanation

The regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` is used for email validation on both screens. Breakdown:

| Part | Meaning |
|---|---|
| `^` | Start of string |
| `[^\s@]+` | One or more characters that are NOT whitespace or `@` (local part) |
| `@` | Literal `@` symbol |
| `[^\s@]+` | One or more characters that are NOT whitespace or `@` (domain name) |
| `\.` | Literal `.` (dot separator before TLD) |
| `[^\s@]+` | One or more characters that are NOT whitespace or `@` (TLD) |
| `$` | End of string |

**What it matches**: `user@domain.com`, `a@b.c`, `teacher@test.com`
**What it rejects**: `@domain.com`, `user@`, `user@domain`, `user name@domain.com`, `user@@domain.com`

This is intentionally a simple check suitable for UI feedback. Server-side validation (not in scope for this UI enhancement) should use a stricter RFC 5322 check.

---

## 7. Acceptance Criteria

### Login Screen

- [ ] **AC-3.1**: All text on the login screen renders in Noto Sans KR font (no system font visible)
- [ ] **AC-3.2**: The logo "M" text uses `fontFamily: 'NotoSansKR-Bold'` at 48px
- [ ] **AC-3.3**: The "Mathpia" title uses `fontFamily: 'NotoSansKR-Bold'` at 36px
- [ ] **AC-3.4**: The subtitle uses `fontFamily: 'NotoSansKR-Regular'` at 16px
- [ ] **AC-3.5**: The logo container shadow uses `shadows.lg` token (no inline shadow properties)
- [ ] **AC-3.6**: Typing a valid email (e.g., `teacher@test.com`) shows a green check icon on the right side of the email input
- [ ] **AC-3.7**: Typing an invalid email (e.g., `abc`) shows a red X icon on the right side of the email input
- [ ] **AC-3.8**: An empty email field shows no icon
- [ ] **AC-3.9**: Typing 6+ characters in the password field shows a green check icon
- [ ] **AC-3.10**: Typing fewer than 6 characters shows a red X icon
- [ ] **AC-3.11**: An empty password field shows no icon
- [ ] **AC-3.12**: Test accounts are hidden by default on screen load
- [ ] **AC-3.13**: Tapping "테스트 계정 보기" reveals the three test account credentials
- [ ] **AC-3.14**: The toggle shows a chevron-down icon when collapsed and chevron-up when expanded
- [ ] **AC-3.15**: Tapping the toggle again hides the test accounts
- [ ] **AC-3.16**: Login still works for all three test accounts (`teacher@test.com`, `student@test.com`, `parent@test.com` with password `123456`)
- [ ] **AC-3.17**: Role-based routing after login is unchanged (teacher -> `/(teacher)`, student -> `/(student)`, parent -> `/(parent)/`)
- [ ] **AC-3.18**: Error text uses `typography.bodySmall` token
- [ ] **AC-3.19**: No hardcoded `fontSize`, `fontWeight`, `fontFamily`, `shadowColor`, `shadowOffset`, `shadowOpacity`, or `shadowRadius` values remain in the file

### Register Screen

- [ ] **AC-3.20**: All text on the register screen renders in Noto Sans KR font
- [ ] **AC-3.21**: The "회원가입" title uses `typography.heading1` (32px Bold -- exact match, no override needed)
- [ ] **AC-3.22**: The subtitle uses `typography.body` (16px Regular)
- [ ] **AC-3.23**: Section labels use `typography.label` (14px Medium)
- [ ] **AC-3.24**: Email input shows validation icon (green check / red X / none) based on email format
- [ ] **AC-3.25**: Password input shows validation icon based on >= 6 character length
- [ ] **AC-3.26**: Confirm password input shows red X when passwords do not match, green check when they match, and no icon when empty
- [ ] **AC-3.27**: Confirm password input retains its red outline (`error` prop) when passwords do not match (existing behavior preserved)
- [ ] **AC-3.28**: Registration flow is unchanged (submit button, alert, router.back)
- [ ] **AC-3.29**: No hardcoded `fontSize`, `fontWeight`, or `fontFamily` values remain in the file

---

## 8. Files Modified Summary

| File | Changes | Lines Added | Lines Removed |
|---|---|---|---|
| `app/(auth)/login.tsx` | Typography tokens, shadow token, validation state, collapsible test accounts, new imports | ~35 | ~20 |
| `app/(auth)/register.tsx` | Typography tokens, validation state, new imports | ~15 | ~5 |

**No new files created** in this section. All changes are modifications to existing files.

**No dependencies installed** in this section. All required tokens and component enhancements are provided by section-01 and section-02.

---

## 9. Token Import Reference

For quick reference, here are the exact imports needed from `src/constants/theme` for each file:

**login.tsx**:
```typescript
import { colors, spacing, typography, shadows, borderRadius } from '../../src/constants/theme';
```

**register.tsx**:
```typescript
import { colors, spacing, typography } from '../../src/constants/theme';
```

The `shadows` and `borderRadius` imports are only needed in `login.tsx` because:
- `shadows.lg` is used for the logo container (register has no shadows)
- `borderRadius.lg` is used for the test account info container (register has no equivalent)

---

## 10. Risk Notes

1. **secureTextEntry + rightIcon conflict**: When `secureTextEntry` is `true`, some platforms show a native eye/hide toggle on the right side of the input. The `validationState` icon from section-02's enhanced `Input` uses `TextInput.Icon` for the `right` prop. If the user has not provided an explicit `right` prop, the validation icon takes that slot. On platforms where `secureTextEntry` adds a native toggle, the validation icon may conflict or overlap. **Mitigation**: Test on iOS and Android. If conflict occurs, the `right` prop passed explicitly from the screen takes priority over `validationState` (this is how section-02's `Input` is designed -- `right ?? validationIcon`).

2. **TouchableOpacity on web**: The `TouchableOpacity` for the test account toggle works on web via react-native-web. The `activeOpacity={0.7}` prop functions correctly. No web-specific workaround needed.

3. **Typography spread order**: When using `...typography.heading1` followed by a `fontSize` override (e.g., `fontSize: 48`), the override MUST come AFTER the spread to take effect. This is standard JavaScript spread behavior. All examples in this section follow this order.
