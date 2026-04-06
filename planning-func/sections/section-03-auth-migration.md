# Section 3: Auth Migration (Mock -> Supabase Auth)

> **Section**: 3 of 10
> **Source Plan**: `planning-func/claude-plan.md` (Section 3)
> **Priority**: CRITICAL
> **Estimated Effort**: 1 day (6-8 hours including testing all auth flows)

---

## 1. Background

The current Mathpia app uses a completely mock authentication system. When a user attempts to log in, `authStore.ts` checks the entered email/password against a hardcoded dictionary constructed from `allMockUsers` imported from `src/services/mock/mockData.ts`. There is no real backend authentication, no session persistence across app restarts, and no signup functionality. The login flow is:

```
User enters email/password
  -> authStore.login() fires
  -> 1-second fake delay (setTimeout)
  -> Lookup email in hardcoded mockUsers dictionary
  -> Compare plaintext password
  -> If match: set user in Zustand state
  -> If no match: show error
```

This section replaces that entire flow with real Supabase Auth, enabling:
- Real email/password signup and login via `supabase.auth.signUp()` / `supabase.auth.signInWithPassword()`
- Automatic profile creation via the `handle_new_user` database trigger (from Section 1)
- Persistent sessions across app restarts via `supabase.auth.getSession()`
- Auth state change listening via `supabase.auth.onAuthStateChange()`
- A loading gate that prevents a flash of the login screen when a valid session already exists

---

## 2. Requirements

1. Users must be able to sign up with email, password, name, role, and academy code
2. Users must be able to log in with email and password
3. After login, the `authStore.user` object must contain the full profile (id, role, name, email, academyId, grade, etc.)
4. Role-based routing must work: teacher/admin -> `/(teacher)/`, student -> `/(student)/`, parent -> `/(parent)/`
5. The app must auto-restore sessions on restart without requiring re-login
6. A loading gate must prevent rendering any routes until `initializeAuth()` completes, avoiding a brief flash of the login screen
7. Logout must clear the Supabase session, all Zustand state, and all persisted AsyncStorage data
8. Error messages must display in Korean for common auth failures
9. All references to mock user data must be removed from `authStore.ts`
10. The registration screen must include a parent role option (currently only shows student/teacher)

---

## 3. Dependencies

### Requires

| Section | What is Needed | Why |
|---------|---------------|-----|
| Section 1 | Supabase project + `handle_new_user` trigger + `profiles` table | Signup creates `auth.users` row, trigger auto-creates `profiles` row with role/academy_id from metadata |
| Section 2 | `src/lib/supabase.ts` client singleton | All auth calls use `supabase.auth.*` methods; client must be configured with `AsyncStorage` for session persistence |

### Blocks

| Section | What Depends on This | Why |
|---------|---------------------|-----|
| Section 4 | Supabase Service Implementations | RLS policies use `auth.uid()` -- services cannot query any data without a logged-in user |
| Section 5 | Gemini PDF Extraction (save to bank) | Saving extracted problems requires `user.id` and `user.academyId` from the auth store |
| Section 6 | Screen-Store Connection | All screens use `useAuthStore().user` to determine what data to fetch |
| Section 7 | Assignment Creation | Requires `user.id` as `teacherId` when creating assignments |
| Section 8 | Problem Solving + Submission | Requires `user.id` as `studentId` when submitting answers |
| Section 9 | Grading Flow | Requires `user.id` as `teacherId` when grading submissions |
| Section 10 | Testing & Polish | Cannot test end-to-end flows without real auth |

---

## 4. Implementation Details

### Step 3.1: Rewrite `authStore.ts`

This is the core of the migration. The entire store is rewritten to use Supabase Auth instead of mock data.

#### Current Code (`src/stores/authStore.ts` -- FULL FILE)

```typescript
// CURRENT FILE -- TO BE REPLACED ENTIRELY
import { create } from 'zustand';
import { User, UserRole } from '../types';
import { allMockUsers } from '../services/mock/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Mock 사용자 데이터를 mockData에서 가져옴
const mockUsers: Record<string, User & { password: string }> = {};
for (const u of allMockUsers) {
  mockUsers[u.email] = {
    id: u.id,
    academyId: u.academyId,
    role: u.role,
    name: u.name,
    email: u.email,
    phone: u.phone,
    grade: u.grade,
    childrenIds: u.childrenIds,
    password: u.password,
    createdAt: u.createdAt,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      // 임시 Mock 로그인 (나중에 Firebase Auth로 대체)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockUser = mockUsers[email];
      if (mockUser && mockUser.password === password) {
        const { password: _, ...user } = mockUser;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ error: '이메일 또는 비밀번호가 올바르지 않습니다.', isLoading: false });
      }
    } catch (error) {
      set({ error: '로그인 중 오류가 발생했습니다.', isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, error: null });
  },
}));
```

#### New Code (`src/stores/authStore.ts` -- COMPLETE REPLACEMENT)

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { User, UserRole, Grade } from '../types';

// ─── Profile-to-User mapper ─────────────────────────────────────────
// The profiles table uses snake_case columns; the User type uses camelCase.
// This function maps a Supabase profiles row (with optional joined
// student_profiles / teacher_profiles) to the app's User type.

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  role: string;
  academy_id: string;
  phone: string | null;
  profile_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  student_profiles?: {
    grade: string | null;
    study_streak: number;
    total_problems_solved: number;
    average_score: number;
  } | null;
  teacher_profiles?: {
    subject_specialties: string[] | null;
    bio: string | null;
  } | null;
}

function mapProfileToUser(profile: ProfileRow, email: string): User {
  return {
    id: profile.id,
    academyId: profile.academy_id,
    role: profile.role as UserRole,
    name: profile.name,
    email: email,
    phone: profile.phone || '',
    grade: (profile.student_profiles?.grade as Grade) || undefined,
    profileImage: profile.profile_image_url || undefined,
    isActive: profile.is_active,
    createdAt: new Date(profile.created_at),
    updatedAt: profile.updated_at ? new Date(profile.updated_at) : undefined,
  };
}

// ─── AsyncStorage keys for all persisted Zustand stores ─────────────
// These must match the `name` field in each store's `persist()` config.
// On logout, we clear all of them so the next user starts fresh.

const PERSISTED_STORE_KEYS = [
  'mathpia-assignments',
  'mathpia-submissions',
  'mathpia-problem-bank',
  'mathpia-analytics',
  'mathpia-wrong-notes',
  'mathpia-parent',
];

// ─── Supabase error → Korean user-facing message ────────────────────

function getKoreanAuthErrorMessage(error: Error): string {
  const msg = error.message.toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  if (msg.includes('email not confirmed')) {
    return '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return '이미 등록된 이메일입니다. 로그인해주세요.';
  }
  if (msg.includes('password') && msg.includes('short')) {
    return '비밀번호는 6자 이상이어야 합니다.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return '네트워크 연결을 확인해주세요.';
  }
  if (msg.includes('signup is disabled')) {
    return '현재 회원가입이 비활성화되어 있습니다. 관리자에게 문의하세요.';
  }

  // Fallback: return the original error for debugging, wrapped in Korean context
  return `오류가 발생했습니다: ${error.message}`;
}

// ─── Auth store interface ────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    academyId?: string,
    grade?: Grade
  ) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

// ─── Helper: fetch profile from Supabase ────────────────────────────
// Extracted so both login() and initializeAuth() use the same logic.

async function fetchProfileAndBuildUser(userId: string, email: string): Promise<User> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, student_profiles(*), teacher_profiles(*)')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw new Error(`프로필을 불러올 수 없습니다: ${profileError.message}`);
  }

  return mapProfileToUser(profile as ProfileRow, email);
}

// ─── Store definition ────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // ── Login ──────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // 2. Fetch the full profile (role, academy, student/teacher details)
      const user = await fetchProfileAndBuildUser(data.user.id, data.user.email!);

      // 3. Update store state
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error
          ? getKoreanAuthErrorMessage(error)
          : '로그인 중 오류가 발생했습니다.';
      set({ error: message, isLoading: false });
    }
  },

  // ── Signup ─────────────────────────────────────────────────────
  signup: async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    academyId?: string,
    grade?: Grade
  ) => {
    set({ isLoading: true, error: null });

    try {
      // Supabase Auth creates the auth.users row.
      // The handle_new_user trigger (Section 1, Migration 004) automatically
      // creates a profiles row using raw_user_meta_data fields.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            academy_id: academyId,
            grade: grade || null,
          },
        },
      });
      if (error) throw error;

      // If email confirmation is disabled in Supabase settings (recommended
      // for demo), the user is immediately logged in. Fetch their profile.
      if (data.session && data.user) {
        const user = await fetchProfileAndBuildUser(data.user.id, data.user.email!);
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        // Email confirmation is enabled -- user must verify email first.
        // We do NOT set isAuthenticated; the login screen will show a message.
        set({ isLoading: false });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? getKoreanAuthErrorMessage(error)
          : '회원가입 중 오류가 발생했습니다.';
      set({ error: message, isLoading: false });
    }
  },

  // ── Logout ─────────────────────────────────────────────────────
  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Even if signOut fails (e.g., network), clear local state
    }

    // Clear Zustand state
    set({ user: null, isAuthenticated: false, error: null });

    // Clear all persisted store data so the next user starts fresh.
    // This runs in the background; we don't need to await it.
    AsyncStorage.multiRemove(PERSISTED_STORE_KEYS).catch(() => {
      // Silently ignore storage errors on logout
    });
  },

  // ── Initialize Auth (session restoration) ──────────────────────
  // Called once on app startup from _layout.tsx.
  // Checks if a valid Supabase session exists and restores the user.
  initializeAuth: async () => {
    set({ isLoading: true });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const user = await fetchProfileAndBuildUser(
          session.user.id,
          session.user.email!
        );
        set({ user, isAuthenticated: true, isLoading: false });
        return;
      }

      // No valid session -- user needs to log in
      set({ isLoading: false });
    } catch {
      // Session restoration failed (network error, expired token, etc.)
      // User will be shown the login screen
      set({ isLoading: false });
    }
  },
}));
```

#### Key Changes Summary

| Aspect | Before (Mock) | After (Supabase) |
|--------|--------------|-------------------|
| **Import** | `allMockUsers` from mockData | `supabase` from `../lib/supabase` |
| **Login** | `mockUsers[email].password === password` | `supabase.auth.signInWithPassword()` |
| **Profile loading** | Inline from mock dictionary | `supabase.from('profiles').select(...)` with joined `student_profiles` / `teacher_profiles` |
| **Signup** | Did not exist | `supabase.auth.signUp()` with `raw_user_meta_data` for trigger |
| **Logout** | Just clears Zustand state | `supabase.auth.signOut()` + clears Zustand + clears 6 AsyncStorage keys |
| **Session restore** | Did not exist | `initializeAuth()` checks `supabase.auth.getSession()` |
| **Error handling** | Single hardcoded Korean message | `getKoreanAuthErrorMessage()` maps 8+ Supabase error types to Korean |
| **Interface** | 6 actions | 8 actions (added `signup`, `initializeAuth`) |
| **Mock dependency** | `allMockUsers` import + mockUsers dict | Completely removed |

---

### Step 3.2: Auth State Listener + Loading Gate in `app/_layout.tsx`

The root layout must do two things:
1. Call `initializeAuth()` on app startup to restore an existing session
2. Listen for auth state changes (e.g., token refresh, external signout) via `onAuthStateChange`
3. Show a loading gate (splash screen) until `initializeAuth()` completes, preventing a flash of the login screen

#### Current Code (`app/_layout.tsx` -- FULL FILE)

```typescript
import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from '../src/constants/theme';
import { initializeStoreSubscriptions } from '../src/stores';
import { initializeDataFlowConnections } from '../src/stores/dataFlowConnector';
import { ErrorBoundary } from '../src/components/common/ErrorBoundary';

// Prevent splash screen from auto-hiding (must be called at module scope)
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'NotoSansKR-Regular': require('../assets/fonts/NotoSansKR-Regular.ttf'),
    'NotoSansKR-Medium': require('../assets/fonts/NotoSansKR-Medium.ttf'),
    'NotoSansKR-Bold': require('../assets/fonts/NotoSansKR-Bold.ttf'),
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  React.useEffect(() => {
    const unsubscribe = initializeStoreSubscriptions();
    initializeDataFlowConnections();
    return unsubscribe;
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <ErrorBoundary>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
          </ErrorBoundary>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

#### New Code (`app/_layout.tsx` -- COMPLETE REPLACEMENT)

```typescript
import 'react-native-url-polyfill/auto'; // MUST be the very first import (Supabase dependency)

import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { theme, colors } from '../src/constants/theme';
import { initializeStoreSubscriptions } from '../src/stores';
import { initializeDataFlowConnections } from '../src/stores/dataFlowConnector';
import { ErrorBoundary } from '../src/components/common/ErrorBoundary';
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/lib/supabase';

// Prevent splash screen from auto-hiding (must be called at module scope)
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'NotoSansKR-Regular': require('../assets/fonts/NotoSansKR-Regular.ttf'),
    'NotoSansKR-Medium': require('../assets/fonts/NotoSansKR-Medium.ttf'),
    'NotoSansKR-Bold': require('../assets/fonts/NotoSansKR-Bold.ttf'),
  });

  // ── Auth initialization loading gate ─────────────────────────
  // Tracks whether initializeAuth() has completed (success or failure).
  // Until this is true, the app renders a loading spinner instead of routes,
  // preventing the user from briefly seeing the login screen before being
  // redirected to their dashboard.
  const [authInitialized, setAuthInitialized] = useState(false);

  // Hide native splash screen once fonts are loaded
  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Initialize store subscriptions (same as before)
  React.useEffect(() => {
    const unsubscribe = initializeStoreSubscriptions();
    initializeDataFlowConnections();
    return unsubscribe;
  }, []);

  // ── Auth initialization + state change listener ──────────────
  React.useEffect(() => {
    // 1. Check for existing session on app startup
    useAuthStore
      .getState()
      .initializeAuth()
      .finally(() => {
        setAuthInitialized(true);
      });

    // 2. Listen for auth state changes (token refresh, external signout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Another tab/device signed out, or the token was revoked
        useAuthStore.getState().logout();
      }
      // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED are handled automatically
      // by the Supabase client. No additional action needed here because
      // login() and signup() already set the user in the store.
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Loading gate: show spinner until BOTH fonts AND auth are ready ──
  if (!fontsLoaded || !authInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <ErrorBoundary>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
          </ErrorBoundary>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
```

#### Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| **First import** | `React` | `react-native-url-polyfill/auto` (required by Supabase) |
| **Loading gate** | Only waits for fonts | Waits for BOTH fonts AND `initializeAuth()` |
| **Auth init** | Not present | `useAuthStore.getState().initializeAuth()` called in `useEffect` |
| **Auth listener** | Not present | `supabase.auth.onAuthStateChange()` handles SIGNED_OUT events |
| **Cleanup** | Store subscription cleanup | Store subscription cleanup + auth subscription cleanup |
| **Splash behavior** | Brief flash of login if already authenticated | Spinner shown until session check completes |

#### Why the Loading Gate Matters

Without the loading gate, the following happens on every app restart for an already-logged-in user:

1. App renders -> `isAuthenticated` is `false` (Zustand default) -> Login screen appears
2. `initializeAuth()` runs -> Finds valid session -> Sets `isAuthenticated: true`
3. Router redirects to dashboard

The user sees a jarring 200-500ms flash of the login screen. The loading gate prevents this by delaying all route rendering until the session check completes.

---

### Step 3.3: Update Login Screen with Enhanced Error Handling

The current login screen (`app/(auth)/login.tsx`) already handles basic error display and role-based routing. The changes needed are minimal since most of the logic moved into `authStore.ts`.

#### Current Code (`app/(auth)/login.tsx` -- handleLogin function, lines 27-44)

```typescript
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
```

#### New Code (`app/(auth)/login.tsx` -- handleLogin function)

```typescript
const handleLogin = async () => {
  if (!email || !password) {
    return;
  }

  await login(email, password);

  // Check auth state after login attempt.
  // If login succeeded, the store's isAuthenticated is true and user is populated.
  // If login failed, the store's error field has the Korean error message.
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
  // If not authenticated, the error is already displayed via the {error && ...} block
  // because authStore.login() sets the error with a Korean message.
};
```

#### Test Accounts Section Update

The hardcoded test accounts section at the bottom of the login screen should be updated to reflect the demo Supabase seed users (created by `scripts/seed.ts` in Section 1). The test accounts will use the same emails but are now real Supabase Auth users.

**Current** (lines 132-138):
```tsx
{showTestAccounts && (
  <View style={styles.testAccountInfo}>
    <Text style={styles.testAccountText}>선생님: teacher@test.com / 123456</Text>
    <Text style={styles.testAccountText}>학생: student@test.com / 123456</Text>
    <Text style={styles.testAccountText}>학부모: parent@test.com / 123456</Text>
  </View>
)}
```

**New** (same content but with a note that these are real Supabase accounts):
```tsx
{showTestAccounts && (
  <View style={styles.testAccountInfo}>
    <Text style={styles.testAccountSubtitle}>데모 계정 (Supabase Auth)</Text>
    <Text style={styles.testAccountText}>선생님: teacher@test.com / 123456</Text>
    <Text style={styles.testAccountText}>학생: student@test.com / 123456</Text>
    <Text style={styles.testAccountText}>학부모: parent@test.com / 123456</Text>
  </View>
)}
```

Add the corresponding style:
```typescript
testAccountSubtitle: {
  ...typography.caption,
  color: colors.textSecondary,
  fontWeight: '600',
  marginBottom: spacing.sm,
},
```

No other changes are needed to `login.tsx`. The existing error display (`{error && <Text style={styles.errorText}>{error}</Text>}`) already works because `authStore.login()` sets `error` with the Korean message from `getKoreanAuthErrorMessage()`.

---

### Step 3.4: Update Registration Screen with Role Selection + Supabase Signup

The current registration screen (`app/(auth)/register.tsx`) has the UI structure but the `handleRegister` function is a no-op (just a `setTimeout` placeholder). It also only offers student/teacher roles, not parent.

#### Current Code (`app/(auth)/register.tsx` -- key sections)

**Role selection (lines 75-83):**
```tsx
<SegmentedButtons
  value={role}
  onValueChange={(value) => setRole(value as UserRole)}
  buttons={[
    { value: 'student', label: '학생' },
    { value: 'teacher', label: '선생님' },
  ]}
  style={styles.segmentedButtons}
/>
```

**handleRegister (lines 34-47):**
```typescript
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
```

#### New Code (`app/(auth)/register.tsx` -- key sections)

**Imports (add at top):**
```typescript
import { useAuthStore } from '../../src/stores/authStore';
```

**Role selection (add parent option):**
```tsx
<SegmentedButtons
  value={role}
  onValueChange={(value) => setRole(value as UserRole)}
  buttons={[
    { value: 'student', label: '학생' },
    { value: 'teacher', label: '선생님' },
    { value: 'parent', label: '학부모' },
  ]}
  style={styles.segmentedButtons}
/>
```

**Replace handleRegister:**
```typescript
const { signup, error: authError, clearError } = useAuthStore();

const handleRegister = async () => {
  if (password !== confirmPassword) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }

  clearError();

  // academyCode is used to look up the academy UUID.
  // For the demo, we use the academy UUID directly as the "code".
  // In production, you would add an academy_codes lookup table.
  const academyId = academyCode.trim() || undefined;

  await signup(email, password, name, role, academyId, role === 'student' ? grade : undefined);

  // Check result -- if signup auto-logged-in the user (email confirmation disabled),
  // route them to the appropriate dashboard.
  const { isAuthenticated, user } = useAuthStore.getState();
  if (isAuthenticated && user) {
    if (user.role === 'teacher' || user.role === 'admin') {
      router.replace('/(teacher)');
    } else if (user.role === 'parent') {
      router.replace('/(parent)/' as any);
    } else {
      router.replace('/(student)');
    }
  } else if (!authError) {
    // Signup succeeded but email confirmation is required
    alert('회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.');
    router.back();
  }
  // If authError is set, it will be displayed via the error block below
};
```

**Remove the local isLoading state** and use the auth store's isLoading instead:
```typescript
// REMOVE: const [isLoading, setIsLoading] = useState(false);
// USE: const { signup, isLoading, error: authError, clearError } = useAuthStore();
```

**Add error display** (after the confirm password input):
```tsx
{authError && (
  <Text style={styles.errorText}>{authError}</Text>
)}
```

**Add error text style** (same as login screen):
```typescript
errorText: {
  ...typography.bodySmall,
  color: colors.error,
  marginBottom: spacing.md,
  textAlign: 'center',
},
```

**Conditionally show grade selector for students only** (already present in current code, no change needed):
```tsx
{role === 'student' && (
  <>
    <Text style={styles.sectionLabel}>학년 선택</Text>
    <View style={styles.gradeContainer}>
      {grades.map((g) => ( /* ... */ ))}
    </View>
  </>
)}
```

---

### Step 3.5: Remove Mock User Dependencies

After the rewrite, the following mock-related code must be removed or verified as removed:

| Item | Location | Action |
|------|----------|--------|
| `import { allMockUsers } from '../services/mock/mockData'` | `authStore.ts` line 3 | **Removed** (replaced with `supabase` import) |
| `const mockUsers: Record<string, ...> = {}` | `authStore.ts` lines 21-35 | **Removed** (no mock dictionary) |
| `for (const u of allMockUsers) { ... }` loop | `authStore.ts` lines 22-35 | **Removed** |
| `mockUser && mockUser.password === password` check | `authStore.ts` lines 55-58 | **Removed** (replaced with `signInWithPassword`) |
| `setTimeout(resolve, 1000)` fake delay | `authStore.ts` line 53 | **Removed** (real network latency replaces fake delay) |
| `setTimeout(resolve, 1500)` in register | `register.tsx` line 42 | **Removed** (replaced with `signup()` call) |
| `// TODO: Firebase 회원가입 구현` comment | `register.tsx` line 41 | **Removed** |

The mock data files themselves (`src/services/mock/mockData.ts`, etc.) are NOT deleted -- they remain as a fallback (see Section 4's service factory toggle).

---

## 5. Files to Create/Modify

| File | Action | What Changes |
|------|--------|-------------|
| `src/stores/authStore.ts` | **Major Rewrite** | Replace entire file: remove mock imports, add Supabase auth calls (login, signup, logout, initializeAuth), add profile mapper, add Korean error messages, add AsyncStorage cleanup on logout |
| `app/_layout.tsx` | **Modify** | Add `react-native-url-polyfill/auto` as first import, add `authInitialized` state with loading gate, add `initializeAuth()` call in useEffect, add `onAuthStateChange` listener with cleanup |
| `app/(auth)/login.tsx` | **Minor Modify** | Update test accounts section label, add `testAccountSubtitle` style. Login logic unchanged (already works with the new authStore) |
| `app/(auth)/register.tsx` | **Moderate Rewrite** | Import `useAuthStore`, add parent role to SegmentedButtons, replace `handleRegister` with real `signup()` call, remove local `isLoading` state, add auth error display, add role-based routing after signup |

---

## 6. Acceptance Criteria

### Authentication

- [ ] **Signup works**: User can sign up with email, password, name, role (student/teacher/parent), and academy code
- [ ] **Login works**: User can log in with email and password via `supabase.auth.signInWithPassword()`
- [ ] **Profile loaded**: After login, `useAuthStore.getState().user` contains correct `id`, `role`, `name`, `email`, `academyId`, and `grade` (for students)
- [ ] **Trigger fires**: The `handle_new_user` trigger creates a `profiles` row automatically on signup, using `role` and `academy_id` from `raw_user_meta_data`

### Routing

- [ ] **Teacher routing**: Teacher or admin user is routed to `/(teacher)/` after login
- [ ] **Student routing**: Student user is routed to `/(student)/` after login
- [ ] **Parent routing**: Parent user is routed to `/(parent)/` after login

### Session Persistence

- [ ] **Session restore**: App restores the session on restart without requiring re-login (via `initializeAuth()` calling `supabase.auth.getSession()`)
- [ ] **Loading gate**: No flash of login screen on restart for authenticated users (`authInitialized` state prevents route rendering until session check completes)
- [ ] **Token refresh**: Supabase auto-refreshes JWT tokens transparently (configured via `autoRefreshToken: true` in Section 2)

### Logout

- [ ] **Supabase signout**: Logout calls `supabase.auth.signOut()`
- [ ] **State cleared**: Logout clears `user`, `isAuthenticated`, and `error` in Zustand
- [ ] **Storage cleared**: Logout clears all 6 persisted store AsyncStorage keys: `mathpia-assignments`, `mathpia-submissions`, `mathpia-problem-bank`, `mathpia-analytics`, `mathpia-wrong-notes`, `mathpia-parent`
- [ ] **Navigation**: Logout navigates the user back to the login screen

### Error Handling

- [ ] **Wrong credentials**: Displays "이메일 또는 비밀번호가 올바르지 않습니다."
- [ ] **Email not confirmed**: Displays "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요."
- [ ] **Duplicate email signup**: Displays "이미 등록된 이메일입니다. 로그인해주세요."
- [ ] **Password too short**: Displays "비밀번호는 6자 이상이어야 합니다."
- [ ] **Rate limited**: Displays "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
- [ ] **Network error**: Displays "네트워크 연결을 확인해주세요."

### Cleanup

- [ ] **No mock imports**: `authStore.ts` has zero references to `allMockUsers`, `mockData`, or any mock data
- [ ] **No fake delays**: No `setTimeout` used to simulate network latency in auth flows
- [ ] **Mock files intact**: `src/services/mock/` directory is untouched (used by other stores via the service factory until Section 4 is complete)

---

## 7. Estimated Effort

| Task | Time |
|------|------|
| Rewrite `authStore.ts` (login, signup, logout, initializeAuth, mapper, error messages) | 2-3 hours |
| Update `app/_layout.tsx` (URL polyfill, auth init, onAuthStateChange, loading gate) | 1 hour |
| Update `app/(auth)/register.tsx` (parent role, real signup, error display) | 1 hour |
| Update `app/(auth)/login.tsx` (test accounts label, minor cleanup) | 30 minutes |
| Testing: signup flow (all 3 roles), login flow, session restore, logout, error cases | 2-3 hours |
| **Total** | **6-8 hours (1 day)** |

### Testing Checklist (manual)

1. **Fresh signup as teacher** -> Verify `profiles` row created with role='teacher' -> Verify routing to `/(teacher)/`
2. **Fresh signup as student** -> Verify `profiles` row created with role='student' and correct grade -> Verify routing to `/(student)/`
3. **Fresh signup as parent** -> Verify `profiles` row created with role='parent' -> Verify routing to `/(parent)/`
4. **Login with valid credentials** -> Verify user object populated -> Verify correct routing
5. **Login with wrong password** -> Verify Korean error message shown
6. **Login with non-existent email** -> Verify Korean error message shown
7. **Kill and restart app (with valid session)** -> Verify no login screen flash -> Verify auto-restore to correct dashboard
8. **Logout** -> Verify login screen shown -> Verify AsyncStorage cleared (check via React Native Debugger or `AsyncStorage.getAllKeys()`)
9. **Logout then login as different role** -> Verify clean state (no stale data from previous user)
10. **Airplane mode login attempt** -> Verify "네트워크 연결을 확인해주세요" error shown
