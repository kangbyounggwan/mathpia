# Section 08: Error & Empty States

> **Phase**: 8 of 8
> **Status**: Pending
> **Depends on**: Section 01 (Design Token System), Section 02 (Common Components)
> **Blocks**: None (final phase)
> **Parallelizable**: Yes (can run in parallel with Sections 03-07 after Section 02 completes)

---

## Table of Contents

1. [Background & Rationale](#background--rationale)
2. [Requirements](#requirements)
3. [Dependencies & Preconditions](#dependencies--preconditions)
4. [Implementation Details](#implementation-details)
   - [8.1 ErrorBoundary Component](#81-errorboundary-component)
   - [8.2 Root Layout ErrorBoundary Integration](#82-root-layout-errorboundary-integration)
   - [8.3 EmptyState / SkeletonLoader Checklist (All 14 Screens)](#83-emptystate--skeletonloader-checklist-all-14-screens)
   - [8.4 common/index.ts Final Update](#84-commonindexts-final-update)
5. [Acceptance Criteria](#acceptance-criteria)
6. [Files to Create / Modify](#files-to-create--modify)

---

## Background & Rationale

Mathpia is a Korean math tutoring tablet application (Expo SDK 54, React Native 0.81.5, TypeScript, react-native-paper MD3) serving three user roles: teachers, students, and parents. The application is fully functional but currently has **no global error handling** and **no consistent empty state patterns**.

**Problems this phase solves:**

| Problem | Current State | Target State |
|---------|--------------|--------------|
| Unhandled render errors | An uncaught error in any component crashes the entire app with a white screen or React Native red screen | A friendly Korean-language error UI with a retry button catches render errors at the root level |
| No empty state guidance | Screens with no data show blank white areas or nothing at all | Every data-driven screen shows a contextual EmptyState component with an icon, Korean title, description, and optional action button |
| Inconsistent loading indicators | Only `ActivityIndicator` spinners are used; no skeleton loading patterns | Every data-loading screen uses SkeletonLoader (built in Phase 2) for perceived performance |

**Constraints (unchanged from plan):**
- No business logic changes
- No new backend work
- UI/style-only modifications
- Minimal new dependencies (none for this phase)
- Existing react-native-paper MD3 foundation preserved

---

## Requirements

1. **ErrorBoundary component**: A React class component (class-based because React error boundaries require `getDerivedStateFromError` and `componentDidCatch`, which are not available in function components) that catches JavaScript errors in its child component tree and renders a fallback error UI
2. **Root-level integration**: The ErrorBoundary wraps the application's `<Stack>` navigator inside the root layout so that any unhandled render error in any screen is caught
3. **EmptyState verification**: Confirm that every data-driven screen across all three role dashboards (student, teacher, parent) has the EmptyState component applied (work done in Phases 4-6, verified here)
4. **SkeletonLoader verification**: Confirm that every data-loading screen has SkeletonLoader applied (work done in Phases 4-6, verified here)
5. **Final barrel export**: The `common/index.ts` barrel export file includes ErrorBoundary alongside all other common components

---

## Dependencies & Preconditions

This section is **self-contained** but assumes the following artifacts from Sections 01 and 02 already exist. All required types, tokens, and components are described below so that this section can be implemented and understood independently.

### From Section 01 (Design Token System) -- Required Exports in `src/constants/theme.ts`

This phase uses the following token values from the theme. These must exist before ErrorBoundary can be built:

```typescript
// --- Already exported from src/constants/theme.ts after Section 01 ---

export const colors = {
  // ...existing colors...
  error: '#F44336',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  surface: '#FFFFFF',
  surfaceVariant: '#E8E8E8',
  // ...etc...
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  subtitle: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  // ...other scales...
} as const;
```

### From Section 02 (Common Components) -- Required Components

This phase uses the following components that must already exist:

- **`Button`** (`src/components/common/Button.tsx`) -- Enhanced with size variants (sm/md/lg), Noto Sans KR font family, and accessibility label support
- **`EmptyState`** (`src/components/common/EmptyState.tsx`) -- Renders icon + title + description + optional action button for empty data screens
- **`SkeletonLoader`** and presets (`src/components/common/SkeletonLoader.tsx`) -- Reanimated shimmer skeleton components including `SkeletonStatCard`, `SkeletonListItem`, `SkeletonDashboard`

### From Root Layout -- Current State of `app/_layout.tsx`

The current root layout (before this phase) looks like this:

```typescript
import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { theme } from '../src/constants/theme';
import { initializeStoreSubscriptions } from '../src/stores';
import { initializeDataFlowConnections } from '../src/stores/dataFlowConnector';

export default function RootLayout() {
  React.useEffect(() => {
    const unsubscribe = initializeStoreSubscriptions();
    initializeDataFlowConnections();
    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
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

> **Note**: After Section 01, this file will also include `useFonts` / `SplashScreen` font loading logic. The ErrorBoundary integration described below is additive and does not conflict with font loading changes.

---

## Implementation Details

### 8.1 ErrorBoundary Component

**New file**: `src/components/common/ErrorBoundary.tsx`

This is a React class component because the Error Boundary API (`getDerivedStateFromError`, `componentDidCatch`) is only available to class components in React. There is no hooks-based equivalent.

**Design decisions:**
- The default fallback UI is fully Korean-localized for the hagwon (academy) context
- The error icon uses `alert-circle-outline` from MaterialCommunityIcons (already available via `@expo/vector-icons`)
- A "retry" button resets the error state, causing the children to re-render (this handles transient render errors)
- An optional `fallback` prop allows screens to provide custom error UI if needed
- Typography and spacing use the design tokens from Section 01, ensuring visual consistency with the rest of the application

**Full component code:**

```typescript
// src/components/common/ErrorBoundary.tsx

import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/theme';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback component to render instead of the default error UI */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary catches JavaScript errors anywhere in its child component
 * tree, logs them, and displays a fallback UI instead of crashing the app.
 *
 * Usage (root level):
 *   <ErrorBoundary>
 *     <Stack ... />
 *   </ErrorBoundary>
 *
 * Usage (with custom fallback):
 *   <ErrorBoundary fallback={<MyCustomErrorScreen />}>
 *     <SomeRiskyComponent />
 *   </ErrorBoundary>
 *
 * The default fallback shows:
 *   - A red alert-circle-outline icon (64px)
 *   - Korean title: "문제가 발생했습니다" (A problem occurred)
 *   - Korean description: "예기치 않은 오류가 발생했습니다. 다시 시도해주세요."
 *     (An unexpected error occurred. Please try again.)
 *   - A "다시 시도" (Try again) button that resets the error state
 */
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
```

**Detailed style breakdown:**

| Style Property | Token Used | Resolved Value | Rationale |
|----------------|-----------|----------------|-----------|
| `container.padding` | `spacing.xl` | `32` | Generous padding so the error message is not cramped on tablet screens |
| `container.gap` | `spacing.sm` | `8` | Tight vertical gap between icon, title, description to keep them visually grouped |
| `title` font | `typography.subtitle` | NotoSansKR-Medium 16px/24 | Subtitle scale is appropriate for an in-screen heading that is not a page title |
| `title.marginTop` | `spacing.md` | `16` | Separates the icon from the text title |
| `description` font | `typography.bodySmall` | NotoSansKR-Regular 14px/20 | Secondary explanatory text at the body-small scale |
| `description.color` | `colors.textSecondary` | `#757575` | De-emphasized secondary text color |
| `button.marginTop` | `spacing.md` | `16` | Separates the action button from the description text |
| Icon color | `colors.error` | `#F44336` | Standard Material Design error red, consistent with the app's error token |
| Icon size | Hardcoded `64` | `64` | Large enough to be immediately visible as the primary visual element of the error state |

---

### 8.2 Root Layout ErrorBoundary Integration

**File to modify**: `app/_layout.tsx`

The ErrorBoundary is placed **inside** the `<PaperProvider>` but **wrapping** the `<Stack>` navigator. This placement is deliberate:

- **Inside PaperProvider**: So that the ErrorBoundary's fallback UI can use react-native-paper's `<Text>` component and the themed `<Button>` component correctly. If ErrorBoundary were placed outside PaperProvider, the fallback UI would not have access to the paper theme.
- **Wrapping Stack**: So that any error thrown during the rendering of any screen (any route in the Stack navigator) is caught. This includes errors in screen components, their child components, and any component rendered during navigation transitions.

**What changes in the file:**

1. Add one import at the top of the file
2. Wrap `<StatusBar>` and `<Stack>` with `<ErrorBoundary>`

**Import to add:**

```typescript
import { ErrorBoundary } from '../src/components/common/ErrorBoundary';
```

**Modified return statement** (showing only the changed portion):

```typescript
// BEFORE (current state):
<PaperProvider theme={theme}>
  <StatusBar style="dark" />
  <Stack
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  />
</PaperProvider>

// AFTER (with ErrorBoundary):
<PaperProvider theme={theme}>
  <ErrorBoundary>
    <StatusBar style="dark" />
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  </ErrorBoundary>
</PaperProvider>
```

**Complete file after modification** (including Section 01 font loading changes):

```typescript
// app/_layout.tsx (final state after Sections 01 and 08)

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
    return null; // Splash screen remains visible
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <ErrorBoundary>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
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

**Why ErrorBoundary is NOT placed at the outermost level:**

| Placement Option | Viable? | Reason |
|-----------------|---------|--------|
| Outside `GestureHandlerRootView` | No | ErrorBoundary fallback UI needs gesture handler context for the Button's press handling |
| Outside `SafeAreaProvider` | No | ErrorBoundary fallback UI should respect safe area insets on notched devices |
| Outside `PaperProvider` | No | ErrorBoundary's fallback uses react-native-paper `<Text>` and the custom `<Button>` which requires PaperProvider context |
| **Inside `PaperProvider`, wrapping `Stack`** | **Yes** | All providers available; catches all route/screen errors |

---

### 8.3 EmptyState / SkeletonLoader Checklist (All 14 Screens)

This is the **final verification checklist** confirming that EmptyState and SkeletonLoader have been applied to every data-driven screen across all three user roles. The actual implementation of EmptyState and SkeletonLoader on each screen happens during Phases 4-6 (Sections 04-06). This checklist serves as the Phase 8 sign-off verification.

#### Complete Checklist Table

| # | Screen | File Path | EmptyState Applied | SkeletonLoader Applied | Notes |
|---|--------|-----------|-------------------|----------------------|-------|
| 1 | Student Dashboard | `app/(student)/index.tsx` | N/A | Yes (`SkeletonDashboard`) | Dashboard always has stat cards; skeleton shown while data loads |
| 2 | Student Homework | `app/(student)/homework.tsx` | Yes | Yes | EmptyState when `filteredAssignments.length === 0`; Skeleton during initial load |
| 3 | Student Solve | `app/(student)/solve.tsx` | N/A | N/A | Always navigated to with problem data; no empty/loading state needed |
| 4 | Student Wrong Notes | `app/(student)/wrong-notes.tsx` | Yes (replace inline) | Yes (replace `ActivityIndicator`) | Replaces existing inline empty state at lines ~174-189 with `<EmptyState>` component; replaces `ActivityIndicator` spinner with `<SkeletonLoader variant="listItem" count={5} />` |
| 5 | Student Analytics | `app/(student)/analytics.tsx` | Yes | Yes (upgrade `AnalysisSkeleton`) | Existing `AnalysisSkeleton.tsx` migrated from `Animated` API to `react-native-reanimated` |
| 6 | Student Materials | `app/(student)/materials.tsx` | Yes | Yes | EmptyState for no materials; Skeleton during load |
| 7 | Student Profile | `app/(student)/profile.tsx` | N/A | N/A | Profile always shows user data from auth store; no empty state scenario |
| 8 | Teacher Dashboard | `app/(teacher)/index.tsx` | N/A | Yes (`SkeletonDashboard`) | Dashboard always has stat cards; skeleton shown while data loads |
| 9 | Teacher Students | `app/(teacher)/students.tsx` | Yes | Yes (`SkeletonListItem`) | EmptyState when no students match filter; Skeleton during list load |
| 10 | Teacher Assignments | `app/(teacher)/assignments.tsx` | Yes | Yes | EmptyState when no assignments; Skeleton during load |
| 11 | Teacher Grading | `app/(teacher)/grading.tsx` | Yes | Yes | EmptyState when no pending submissions; Skeleton during load |
| 12 | Teacher Problem Bank | `app/(teacher)/problem-bank.tsx` | Yes | Yes | EmptyState when problem bank is empty; Skeleton during load |
| 13 | Teacher Student Analytics | `app/(teacher)/student-analytics.tsx` | Yes | Yes | EmptyState when no analytics data; Skeleton during chart load |
| 14 | Parent Dashboard | `app/(parent)/index.tsx` | N/A | Yes (`SkeletonDashboard`) | Dashboard always has child stats; skeleton shown while data loads |
| 15 | Parent Schedule | `app/(parent)/schedule.tsx` | Yes | N/A | EmptyState when no scheduled classes; calendar renders statically |
| 16 | Parent Report | `app/(parent)/report.tsx` | Yes | Yes | EmptyState when no report data; Skeleton during chart load |

#### EmptyState Messages Reference (Korean Localized)

Each screen that has EmptyState applied uses the following exact icon, title, and description. These are defined per-screen during Phases 4-6 and referenced here for verification:

**Student Screens:**

| Screen | Icon | Title | Description |
|--------|------|-------|-------------|
| Homework | `clipboard-text-off-outline` | 숙제가 없습니다 | 새로운 숙제가 배정되면 여기에 표시됩니다 |
| Homework (filtered) | `clipboard-text-off-outline` | 조건에 맞는 숙제가 없습니다 | 새로운 숙제가 배정되면 여기에 표시됩니다 |
| Wrong Notes | `notebook-check-outline` | 오답이 없습니다! | 잘하고 있어요! 틀린 문제가 생기면 자동으로 수집됩니다 |
| Analytics | `chart-line` | 분석 데이터가 없습니다 | 문제를 풀면 AI가 학습 분석을 시작합니다 |
| Materials | `folder-open-outline` | 강의자료가 없습니다 | 선생님이 자료를 올리면 여기에 표시됩니다 |

**Teacher Screens:**

| Screen | Icon | Title | Description | Action Button |
|--------|------|-------|-------------|---------------|
| Students | `account-group-outline` | 학생이 없습니다 | 학생을 추가하여 관리를 시작하세요 | 학생 추가 |
| Assignments | `clipboard-text-off-outline` | 숙제가 없습니다 | 새 숙제를 만들어 학생들에게 배정하세요 | 숙제 만들기 |
| Grading | `check-circle-outline` | 채점할 제출물이 없습니다 | 학생이 제출하면 여기에 표시됩니다 | (none) |
| Problem Bank | `database-off-outline` | 문제가 없습니다 | 문제를 추가하여 문제은행을 만드세요 | 문제 추가 |
| Student Analytics | `chart-line` | 분석 데이터가 없습니다 | 학생의 풀이 데이터가 쌓이면 분석이 시작됩니다 | (none) |

**Parent Screens:**

| Screen | Icon | Title | Description |
|--------|------|-------|-------------|
| Schedule | `calendar-blank-outline` | 일정이 없습니다 | 등록된 수업 일정이 표시됩니다 |
| Report | `chart-bar` | 리포트 데이터가 없습니다 | 자녀의 학습 데이터가 쌓이면 리포트가 생성됩니다 |

#### SkeletonLoader Variant Usage Reference

| Screen | Skeleton Type | Configuration |
|--------|--------------|---------------|
| Student Dashboard | `SkeletonDashboard` (preset) | Hero card 140px + 3 stat cards row + 3 list cards |
| Student Homework | `SkeletonLoader` | `variant="card" height={80} count={4} gap={8}` |
| Student Wrong Notes | `SkeletonLoader` | `variant="listItem" count={5}` (replaces `ActivityIndicator`) |
| Student Analytics | `AnalysisSkeleton` (upgraded) | Migrated from `Animated` API to `react-native-reanimated` shimmer |
| Student Materials | `SkeletonLoader` | `variant="card" height={72} count={3}` |
| Teacher Dashboard | `SkeletonDashboard` (preset) | Same preset as student dashboard |
| Teacher Students | `SkeletonListItem` (preset) | `count={6}` for student list |
| Teacher Assignments | `SkeletonLoader` | `variant="card" height={88} count={4}` |
| Teacher Grading | `SkeletonLoader` | `variant="listItem" count={5}` |
| Teacher Problem Bank | `SkeletonLoader` | `variant="card" height={72} count={5}` |
| Teacher Student Analytics | `SkeletonLoader` | `variant="card" height={200}` for chart area + `variant="listItem" count={3}` for stats |
| Parent Dashboard | `SkeletonDashboard` (preset) | Same preset as student/teacher dashboard |
| Parent Report | `SkeletonLoader` | `variant="card" height={200}` for chart area + `variant="rect" count={3}` for summary |

---

### 8.4 common/index.ts Final Update

**File to modify**: `src/components/common/index.ts`

After all phases are complete, the common components barrel export must include every shared component. This is the **final** state of this file:

**Current state** (before any phases):

```typescript
export { Button } from './Button';
export { Input } from './Input';
export { Card, CardHeader } from './Card';
```

**After Section 02** (intermediate state):

```typescript
export { Button } from './Button';
export { Input } from './Input';
export { Card, CardHeader } from './Card';
export { SkeletonLoader, SkeletonStatCard, SkeletonListItem, SkeletonDashboard } from './SkeletonLoader';
export { EmptyState } from './EmptyState';
```

**After Section 08 -- FINAL state** (adds ErrorBoundary):

```typescript
export { Button } from './Button';
export { Input } from './Input';
export { Card, CardHeader } from './Card';
export { SkeletonLoader, SkeletonStatCard, SkeletonListItem, SkeletonDashboard } from './SkeletonLoader';
export { EmptyState } from './EmptyState';
export { ErrorBoundary } from './ErrorBoundary';
```

**What changed in this phase**: One line added:
```typescript
export { ErrorBoundary } from './ErrorBoundary';
```

This enables any screen or component to import ErrorBoundary from the common barrel:
```typescript
import { ErrorBoundary } from '../../src/components/common';
// or
import { ErrorBoundary } from '../src/components/common/ErrorBoundary';
```

---

## Acceptance Criteria

### ErrorBoundary Component

- [ ] **File exists**: `src/components/common/ErrorBoundary.tsx` is created with the complete class component implementation
- [ ] **TypeScript compiles**: `npx tsc --noEmit` passes with ErrorBoundary and all its imports
- [ ] **Default fallback renders**: When a child component throws an error during render, the default fallback UI is displayed showing:
  - Red `alert-circle-outline` icon (64px, color `#F44336`)
  - Korean title: "문제가 발생했습니다"
  - Korean description: "예기치 않은 오류가 발생했습니다. 다시 시도해주세요."
  - "다시 시도" contained button
- [ ] **Retry works**: Pressing the "다시 시도" button resets `hasError` to `false` and `error` to `null`, causing the children to re-render. If the error was transient, the children render successfully
- [ ] **Custom fallback works**: When the `fallback` prop is provided, that custom ReactNode is rendered instead of the default error UI
- [ ] **Non-error passthrough**: When no error occurs, `this.props.children` is rendered without modification (no wrapper element, no performance overhead)
- [ ] **Design tokens used**: All styling uses `colors`, `spacing`, and `typography` tokens from `src/constants/theme.ts` (no hardcoded values)
- [ ] **Noto Sans KR font**: All text in the fallback UI renders in Noto Sans KR (via typography tokens)

### Root Layout Integration

- [ ] **Import added**: `app/_layout.tsx` imports `ErrorBoundary` from `../src/components/common/ErrorBoundary`
- [ ] **Correct placement**: `<ErrorBoundary>` wraps `<StatusBar>` and `<Stack>` but is **inside** `<PaperProvider>`
- [ ] **App still launches**: The app starts normally on iOS, Android, and web with no regression
- [ ] **Error caught**: A simulated `throw new Error('test')` inside any screen component displays the ErrorBoundary fallback instead of crashing
- [ ] **Navigation intact**: After error boundary catches an error and the user presses retry, normal navigation continues to work

### EmptyState / SkeletonLoader Verification

- [ ] **All 10 EmptyState screens verified**: Homework, Wrong Notes, Analytics, Materials (student); Students, Assignments, Grading, Problem Bank, Student Analytics (teacher); Schedule, Report (parent) -- each shows the correct EmptyState component when data is empty
- [ ] **All 13 SkeletonLoader screens verified**: Every screen in the checklist table (excluding Solve, Profile, and Schedule) shows skeleton loading instead of spinner or blank screen during data load
- [ ] **Korean text correct**: All EmptyState titles and descriptions match the reference table exactly
- [ ] **Icons correct**: All EmptyState icons match the reference table
- [ ] **Action buttons work**: Teacher screens with action buttons (Students: "학생 추가", Assignments: "숙제 만들기", Problem Bank: "문제 추가") trigger the expected navigation or action

### Barrel Export

- [ ] **common/index.ts updated**: The file exports `ErrorBoundary` alongside all other common components
- [ ] **Import works**: `import { ErrorBoundary } from '../../src/components/common'` resolves correctly

### Overall Phase 8 Verification

- [ ] **TypeScript check passes**: `npx tsc --noEmit` completes with zero errors
- [ ] **No regressions**: All existing functionality (login, navigation, data display) continues to work
- [ ] **Platform check**: Error boundary works on iOS simulator, Android emulator, and Expo Web

---

## Files to Create / Modify

### Files to Create (1 file)

| File Path | Description | Size Estimate |
|-----------|-------------|---------------|
| `src/components/common/ErrorBoundary.tsx` | React class-based error boundary with Korean-localized default fallback UI, retry functionality, and optional custom fallback prop | ~90 lines |

### Files to Modify (2 files)

| File Path | Description | Change Summary |
|-----------|-------------|---------------|
| `app/_layout.tsx` | Root layout -- add ErrorBoundary wrapper | Add 1 import line; wrap `<Stack>` and `<StatusBar>` with `<ErrorBoundary>` (2 lines added inside JSX) |
| `src/components/common/index.ts` | Common components barrel export | Add 1 line: `export { ErrorBoundary } from './ErrorBoundary';` |

### Files to Verify (14+ files -- no modifications, audit only)

These files should have already been modified during Phases 4-6. Phase 8 verifies they have EmptyState and/or SkeletonLoader applied:

| File Path | Verify EmptyState | Verify SkeletonLoader |
|-----------|------------------|----------------------|
| `app/(student)/index.tsx` | -- | SkeletonDashboard |
| `app/(student)/homework.tsx` | Yes | Yes |
| `app/(student)/wrong-notes.tsx` | Yes (replaces inline) | Yes (replaces ActivityIndicator) |
| `app/(student)/analytics.tsx` | Yes | Yes (upgraded AnalysisSkeleton) |
| `app/(student)/materials.tsx` | Yes | Yes |
| `app/(teacher)/index.tsx` | -- | SkeletonDashboard |
| `app/(teacher)/students.tsx` | Yes | SkeletonListItem |
| `app/(teacher)/assignments.tsx` | Yes | Yes |
| `app/(teacher)/grading.tsx` | Yes | Yes |
| `app/(teacher)/problem-bank.tsx` | Yes | Yes |
| `app/(teacher)/student-analytics.tsx` | Yes | Yes |
| `app/(parent)/index.tsx` | -- | SkeletonDashboard |
| `app/(parent)/schedule.tsx` | Yes | -- |
| `app/(parent)/report.tsx` | Yes | Yes |
| `src/components/analytics/AnalysisSkeleton.tsx` | -- | Verify migrated to reanimated |

---

## Appendix: Testing the ErrorBoundary

To manually verify the ErrorBoundary works during development, temporarily add a throwing component to any screen:

```typescript
// Temporary test component -- add to any screen to trigger ErrorBoundary
function CrashTest() {
  throw new Error('ErrorBoundary test: intentional crash');
  return null; // never reached
}

// In the screen JSX:
<CrashTest />
```

After confirming the error UI appears with the Korean message and the retry button works, remove the test component.

To test the custom fallback prop:

```typescript
<ErrorBoundary fallback={<Text>Custom error screen</Text>}>
  <CrashTest />
</ErrorBoundary>
```

---

*This section is fully self-contained. All code, token values, component interfaces, and integration instructions needed to implement Phase 8 are included above without reference to external documents.*
