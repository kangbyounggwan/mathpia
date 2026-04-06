# Mathpia UI Enhancement — Ralph-Loop Execution Prompt

## Mission

Implement the Mathpia UI Enhancement plan across 8 sections. This document contains ALL implementation details embedded inline. Follow the dependency order, verify acceptance criteria for each section, and run `npx tsc --noEmit` after completing each section.

## Constraints

- **UI-only changes**: Do not modify business logic, API calls, or database schemas.
- **TypeScript strict mode**: Run `npx tsc --noEmit` after each section completes. Fix any errors before proceeding.
- **Use existing mock data and services**: Do not create new ones.
- **All text content is in Korean.**
- **Minimum touch target size**: 44px.
- **All icon-only buttons must have Korean `accessibilityLabel`.**
- **Font**: Noto Sans KR (Regular 400, Medium 500, Bold 700)

## Tech Stack

- Expo SDK 54, React Native 0.81.5, TypeScript ~5.9.2
- react-native-paper MD3, react-native-reanimated v4.2.1
- Zustand v5.0.9, expo-router v6
- Three user roles: Teacher (indigo #5C6BC0), Student (blue #4A90D9), Parent (green #66BB6A)

## Execution Rules

1. **Dependency order is mandatory:**
   - Section 01 must be completed first (foundational design tokens — no dependencies)
   - Section 02 must be completed second (common components — depends on Section 01)
   - Sections 03–08 may be done in any order after Sections 01 and 02 are complete (all depend on 01 + 02)

2. **Per-section workflow:**
   - Read the section completely before starting implementation
   - Implement all requirements listed in the section
   - Verify all acceptance criteria checkboxes can be checked off
   - Run `npx tsc --noEmit` and fix any type errors
   - Only then move to the next section

3. **Do NOT skip sections.** Every section must be fully implemented.

4. **If a section references files to create or modify**, follow the exact file paths specified.

5. **Preserve existing functionality** — these are UI enhancements, not rewrites of business logic.

---

## Section Index

<!-- SECTION_MANIFEST
section-01-design-tokens
section-02-common-components
section-03-auth-screens
section-04-student-screens
section-05-teacher-screens
section-06-parent-screens
section-07-responsive-accessibility
section-08-error-empty-states
END_MANIFEST -->

# Mathpia UI Enhancement - Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-design-tokens | - | 02, 03, 04, 05, 06, 07, 08 | Yes (start first) |
| section-02-common-components | 01 | 03, 04, 05, 06, 08 | No |
| section-03-auth-screens | 01, 02 | - | Yes |
| section-04-student-screens | 01, 02 | - | Yes |
| section-05-teacher-screens | 01, 02 | - | Yes |
| section-06-parent-screens | 01, 02 | - | Yes |
| section-07-responsive-accessibility | 01 | - | Yes |
| section-08-error-empty-states | 01, 02 | - | Yes |

## Execution Order

1. **section-01-design-tokens** (no dependencies - MUST be first)
2. **section-02-common-components** (after 01)
3. **section-03 through section-08** (all parallel after 02)
   - section-03-auth-screens
   - section-04-student-screens
   - section-05-teacher-screens
   - section-06-parent-screens
   - section-07-responsive-accessibility
   - section-08-error-empty-states

## Section Summaries

### section-01-design-tokens
Noto Sans KR 폰트 설치 + 로딩, theme.ts 확장 (typography 시맨틱 토큰, roleColors, shadows, opacity, opacityToHex, sizes, chartColors), useRoleTheme() 훅, useResponsive() 훅, hooks/index.ts 배럴 익스포트.

**Files**: `src/constants/theme.ts`, `app/_layout.tsx`, `src/hooks/useRoleTheme.ts`, `src/hooks/useResponsive.ts`, `src/hooks/index.ts`, `assets/fonts/*.ttf`, `package.json`

### section-02-common-components
SkeletonLoader (reanimated shimmer + 프리셋), EmptyState 컴포넌트, Button 크기 variant (sm/md/lg), Card 터치 스케일 피드백 (reanimated), Input 유효성 아이콘 + helperText, common/index.ts 업데이트.

**Files**: `src/components/common/SkeletonLoader.tsx`, `src/components/common/EmptyState.tsx`, `src/components/common/Button.tsx`, `src/components/common/Card.tsx`, `src/components/common/Input.tsx`, `src/components/common/index.ts`

### section-03-auth-screens
로그인/회원가입 화면에 typography 토큰 적용, shadow 토큰, 폼 유효성 실시간 검사 (이메일 형식/비밀번호 길이), 테스트 계정 접이식, Noto Sans KR 적용.

**Files**: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`

### section-04-student-screens
학생 5개 화면(대시보드/숙제/풀기/오답노트/분석) + materials + profile에 디자인 토큰 전면 적용. 역할 액센트(블루), SkeletonLoader/EmptyState 적용, 하드코딩 제거.

**Files**: `app/(student)/_layout.tsx`, `app/(student)/index.tsx`, `app/(student)/homework.tsx`, `app/(student)/solve.tsx`, `app/(student)/wrong-notes.tsx`, `app/(student)/analytics.tsx`, `app/(student)/materials.tsx`, `app/(student)/profile.tsx`

### section-05-teacher-screens
선생님 6개 화면(대시보드/학생관리/숙제관리/채점/문제은행/학생분석)에 디자인 토큰 전면 적용. 역할 액센트(인디고), SkeletonLoader/EmptyState 적용.

**Files**: `app/(teacher)/_layout.tsx`, `app/(teacher)/index.tsx`, `app/(teacher)/students.tsx`, `app/(teacher)/assignments.tsx`, `app/(teacher)/grading.tsx`, `app/(teacher)/problem-bank.tsx`, `app/(teacher)/student-analytics.tsx`

### section-06-parent-screens
학부모 3개 화면(대시보드/스케줄/리포트)에 디자인 토큰 전면 적용. 역할 액센트(그린), SkeletonLoader/EmptyState 적용, 차트 테마 연동.

**Files**: `app/(parent)/_layout.tsx`, `app/(parent)/index.tsx`, `app/(parent)/schedule.tsx`, `app/(parent)/report.tsx`

### section-07-responsive-accessibility
useResponsive() 훅 전체 화면 적용 (기존 useWindowDimensions 교체), 최소 터치 영역 44px 보장, 모든 아이콘 버튼에 accessibilityLabel, 탭바 폰트 패밀리 통일.

**Files**: All screen files using `useWindowDimensions`, all three `_layout.tsx` tab files

### section-08-error-empty-states
ErrorBoundary 컴포넌트 생성, 루트 레이아웃에 적용, 전체 화면 EmptyState/SkeletonLoader 적용 여부 최종 검증.

**Files**: `src/components/common/ErrorBoundary.tsx`, `app/_layout.tsx`, `src/components/common/index.ts`


---


---

## Embedded Section: Section 01-design-tokens

# Section 01: Design Token System

> **Status**: Not started
> **Phase**: 1 of 8
> **Dependencies**: None (this is the first section)
> **Blocks**: Sections 02, 03, 04, 05, 06, 07, 08 (all subsequent work)
> **Estimated effort**: Medium
> **Files changed**: 3 new files created, 3 existing files modified, 3 font files downloaded

---

## 1. Background: Why This Section Exists

Mathpia is a Korean math tutoring tablet application built for private math academies (hagwon). It serves three user roles -- teachers, students, and parents -- providing homework management, problem solving with a drawing canvas, wrong-note review, AI-powered analytics, and parent reporting.

The application is fully functional but the UI remains at prototype quality. Before any screen-level styling can be applied (sections 02-08), a complete design token foundation must be established. Without tokens, applying consistent styles across 14+ screens is impossible.

### Current Problems This Section Solves

| Problem | Severity | What's Happening Now |
|---------|----------|---------------------|
| **No custom Korean font** | Critical | `fontFamily: 'System'` is used everywhere in `theme.ts`. System font renders Korean text inconsistently across Android, iOS, and web. |
| **Hardcoded font sizes** | Critical | Font sizes from 11px to 48px are scattered as magic numbers across all screen files. The theme typography scale exists but is unused by screens. |
| **No role color differentiation** | High | All three roles (teacher, student, parent) use the same `#4A90D9` blue everywhere. Users have no visual cue about which role context they are in. |
| **Inline opacity values** | High | `rgba(255,255,255,0.8)`, hex suffixes like `+ '15'`, `+ '30'` scattered throughout. No centralized opacity system. |
| **Hardcoded shadows** | Medium | `shadowColor`, `shadowOffset`, `shadowOpacity`, `elevation` are written inline in every component that needs a shadow. |
| **Inconsistent component sizes** | Medium | Icon containers range from 38-52px with no pattern. Avatars, badges, and progress rings have no standardized sizes. |
| **Chart colors not themed** | Medium | Local `CHART_COLORS` constants duplicated in each chart component (`RadarChart.tsx`, `LineChart.tsx`, `BarChart.tsx`, `HeatMap.tsx`). |
| **No responsive hook** | Medium | Screens use raw `useWindowDimensions()` with inline breakpoint checks like `width > 768`. |
| **No role theme hook** | Medium | No mechanism to derive role-specific colors from the authenticated user's role. |

### Current State of Key Files

**`src/constants/theme.ts`** currently defines:
- `fontConfig` -- uses `fontFamily: 'System'` for all 14 MD3 type variants
- `colors` -- a flat object with primary, secondary, success, warning, error, surface, text, and canvas colors
- `theme` -- the MD3LightTheme extended with custom colors and font config
- `spacing` -- xs(4), sm(8), md(16), lg(24), xl(32), xxl(48)
- `borderRadius` -- sm(4), md(8), lg(12), xl(16), full(9999)
- `tabletSizes` -- minTouchTarget(44), iconSize(24), iconSizeLarge(32), avatarSize(48), avatarSizeLarge(64), buttonHeight(48), inputHeight(56), toolbarHeight(64), tabBarHeight(72)

**`app/_layout.tsx`** currently:
- Imports `theme` from `src/constants/theme`
- Has a single `useEffect` for store subscription initialization
- Returns `GestureHandlerRootView > SafeAreaProvider > PaperProvider > Stack`
- Does NOT load any custom fonts
- Does NOT use splash screen management

**`package.json`** currently:
- Does NOT include `expo-font` as a direct dependency
- Does NOT include `expo-splash-screen` as a direct dependency
- DOES include `react-native-reanimated` v4.2.1 (installed but unused)
- Uses Expo SDK 54, React Native 0.81.5, TypeScript ~5.9.2

---

## 2. Requirements

When this section is complete, ALL of the following must be true:

1. **Noto Sans KR font** renders on all text across iOS, Android, and Expo Web
2. **Three font weight files** exist at `assets/fonts/NotoSansKR-{Regular,Medium,Bold}.ttf`
3. **`expo-font`** and **`expo-splash-screen`** are installed as dependencies
4. **Font loading** happens in `app/_layout.tsx` with splash screen management
5. **`theme.ts` fontConfig** uses `NotoSansKR-*` instead of `System` for all 14 MD3 variants
6. **Semantic typography tokens** (`typography` object) are exported from `theme.ts` with 9 named styles (heading1, heading2, heading3, subtitle, body, bodySmall, caption, label, labelSmall)
7. **Role-based accent colors** (`roleColors` object) are exported with teacher=indigo, student=blue, parent=green palettes (5 values each: accent, accentLight, accentDark, accentSubtle, accentMuted)
8. **Shadow tokens** (`shadows` object) are exported with none, sm, md, lg, xl levels
9. **Opacity tokens** (`opacity` object) and **`opacityToHex()`** function are exported
10. **Component size tokens** (`sizes` object) are exported with icon, avatar, iconContainer, badge, progressRing, and button size values
11. **Chart color tokens** (`chartColors` object) are exported with primary, secondary, grid, label, semantic, and heatmap values
12. **`useRoleTheme()` hook** is created at `src/hooks/useRoleTheme.ts` and reads the user's role from `authStore`
13. **`useResponsive()` hook** is created at `src/hooks/useResponsive.ts` with breakpoints, column count, and content padding
14. **`src/hooks/index.ts`** barrel export exists, exporting both hooks
15. **TypeScript compiles** without errors: `npx tsc --noEmit` passes
16. **App launches** on all three platforms without crash

---

## 3. Dependencies and Blocking

### Dependencies (what must be done before this section)
None. This is the first section and has no prerequisites.

### Blocks (what cannot start until this section is complete)
- **Section 02 (Common Components)**: SkeletonLoader, EmptyState, Button/Card/Input enhancements all import from the token system built here
- **Section 03 (Auth Screens)**: Login/register screens need typography tokens, shadows, font families
- **Section 04 (Student Screens)**: Need roleColors.student, typography, shadows, sizes, chartColors, useRoleTheme()
- **Section 05 (Teacher Screens)**: Need roleColors.teacher, typography, shadows, sizes, useRoleTheme()
- **Section 06 (Parent Screens)**: Need roleColors.parent, typography, shadows, sizes, chartColors, useRoleTheme()
- **Section 07 (Responsive & Accessibility)**: Need useResponsive() hook
- **Section 08 (Error & Empty States)**: Need typography and color tokens for ErrorBoundary component

---

## 4. Implementation Details

### 4.1 Download Noto Sans KR Font Files

**Action**: Manually download Noto Sans KR from Google Fonts. Extract three specific weight files and place them in the project.

**Why manual files instead of `@expo-google-fonts` package**: The `@expo-google-fonts/noto-sans-kr` package can have version conflicts with Expo SDK 54. Manual `.ttf` files are simpler, more reliable, and have zero dependency risk.

**Why Noto Sans KR**: Korean text rendered with system fonts varies wildly across Android/iOS/web. Noto Sans KR provides consistent, high-quality Korean glyphs. It is Google's open-source font designed specifically for CJK characters.

**Steps**:
1. Go to https://fonts.google.com/noto/specimen/Noto+Sans+KR
2. Download the font family
3. Extract these three weight files:
   - `NotoSansKR-Regular.ttf` (weight 400)
   - `NotoSansKR-Medium.ttf` (weight 500)
   - `NotoSansKR-Bold.ttf` (weight 700)
4. Create the directory `assets/fonts/` at the project root
5. Place the three `.ttf` files there

**Resulting file structure**:
```
mathpia/
  assets/
    fonts/
      NotoSansKR-Regular.ttf
      NotoSansKR-Medium.ttf
      NotoSansKR-Bold.ttf
```

**Expected total size**: Approximately 300-600KB for all three weights. This is acceptable for a tablet app.

---

### 4.2 Install expo-font and expo-splash-screen

**Action**: Install the two new dependencies required for font loading.

**Command**:
```bash
npx expo install expo-font expo-splash-screen
```

> Note: `expo-font` and `expo-splash-screen` may already be transitive dependencies of Expo SDK 54. The `npx expo install` command will resolve the correct compatible versions automatically. If they are already present, the command will simply ensure the correct versions are pinned.

**Verification**: After installation, `package.json` should contain entries like:
```json
"expo-font": "~14.0.0",
"expo-splash-screen": "~0.35.0"
```
(Exact minor versions depend on Expo SDK 54 compatibility resolution.)

---

### 4.3 Font Loading in app/_layout.tsx

**File to modify**: `app/_layout.tsx`

**Current state of this file**:
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

**Changes to make**:
1. Add imports for `useFonts` from `expo-font` and `SplashScreen` from `expo-splash-screen`
2. Call `SplashScreen.preventAutoHideAsync()` at module scope (MUST be outside the component)
3. Add `useFonts` hook to load three Noto Sans KR weights
4. Add `useEffect` to hide splash screen when fonts are loaded
5. Return `null` while fonts are loading (splash screen stays visible)

**Complete updated file**:
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
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
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

**Important notes**:
- `SplashScreen.preventAutoHideAsync()` MUST be called at module scope (outside the component), NOT inside `useEffect`. This is an Expo requirement.
- The `if (!fontsLoaded) return null;` pattern keeps the native splash screen visible until fonts are ready.
- Consider adding a 5-second font loading timeout fallback to prevent an infinite splash if fonts fail to load. This can be added as an enhancement:
```typescript
const [fontTimeout, setFontTimeout] = useState(false);
useEffect(() => {
  const timer = setTimeout(() => setFontTimeout(true), 5000);
  return () => clearTimeout(timer);
}, []);
if (!fontsLoaded && !fontTimeout) return null;
```

---

### 4.4 Update theme.ts fontConfig with NotoSansKR

**File to modify**: `src/constants/theme.ts`

**Current fontConfig** (lines 3-19):
```typescript
const fontConfig = {
  displayLarge: { fontFamily: 'System', fontSize: 57, fontWeight: '400' as const },
  displayMedium: { fontFamily: 'System', fontSize: 45, fontWeight: '400' as const },
  displaySmall: { fontFamily: 'System', fontSize: 36, fontWeight: '400' as const },
  headlineLarge: { fontFamily: 'System', fontSize: 32, fontWeight: '400' as const },
  headlineMedium: { fontFamily: 'System', fontSize: 28, fontWeight: '400' as const },
  headlineSmall: { fontFamily: 'System', fontSize: 24, fontWeight: '400' as const },
  titleLarge: { fontFamily: 'System', fontSize: 22, fontWeight: '500' as const },
  titleMedium: { fontFamily: 'System', fontSize: 16, fontWeight: '500' as const },
  titleSmall: { fontFamily: 'System', fontSize: 14, fontWeight: '500' as const },
  bodyLarge: { fontFamily: 'System', fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontFamily: 'System', fontSize: 14, fontWeight: '400' as const },
  bodySmall: { fontFamily: 'System', fontSize: 12, fontWeight: '400' as const },
  labelLarge: { fontFamily: 'System', fontSize: 14, fontWeight: '500' as const },
  labelMedium: { fontFamily: 'System', fontSize: 12, fontWeight: '500' as const },
  labelSmall: { fontFamily: 'System', fontSize: 11, fontWeight: '500' as const },
};
```

**Replace the entire `fontConfig` with**:
```typescript
const fontConfig = {
  displayLarge:   { fontFamily: 'NotoSansKR-Regular', fontSize: 57, fontWeight: '400' as const, lineHeight: 64 },
  displayMedium:  { fontFamily: 'NotoSansKR-Regular', fontSize: 45, fontWeight: '400' as const, lineHeight: 52 },
  displaySmall:   { fontFamily: 'NotoSansKR-Regular', fontSize: 36, fontWeight: '400' as const, lineHeight: 44 },
  headlineLarge:  { fontFamily: 'NotoSansKR-Bold',    fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  headlineMedium: { fontFamily: 'NotoSansKR-Bold',    fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  headlineSmall:  { fontFamily: 'NotoSansKR-Medium',  fontSize: 24, fontWeight: '500' as const, lineHeight: 32 },
  titleLarge:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 22, fontWeight: '500' as const, lineHeight: 28 },
  titleMedium:    { fontFamily: 'NotoSansKR-Medium',  fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  titleSmall:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  bodyLarge:      { fontFamily: 'NotoSansKR-Regular', fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium:     { fontFamily: 'NotoSansKR-Regular', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall:      { fontFamily: 'NotoSansKR-Regular', fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  labelLarge:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  labelMedium:    { fontFamily: 'NotoSansKR-Medium',  fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  labelSmall:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
};
```

**Key changes from current**:
- All `fontFamily: 'System'` replaced with specific `NotoSansKR-*` weights
- `lineHeight` added to every variant (was missing entirely before)
- Headline variants now use Bold (700) instead of Regular (400) -- bold headlines are the correct MD3 convention for Korean text
- HeadlineSmall uses Medium (500) as a transitional weight

---

### 4.5 Semantic Typography Tokens

**File to modify**: `src/constants/theme.ts`

**Where to add**: After the `fontConfig` definition and before the `colors` export (approximately after line 19 in the current file).

**Add this export**:
```typescript
/**
 * Semantic typography scale for Mathpia.
 * Maps app-level meaning to MD3 font variants.
 * Usage: style={[typography.heading1]} or style={{ ...typography.body }}
 *
 * IMPORTANT: These tokens intentionally do NOT include a `color` property.
 * Color is always set separately so typography tokens can be used on any background.
 */
export const typography = {
  /** Page titles (e.g., "숙제 목록", "대시보드") - 32px Bold */
  heading1: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 32,
    lineHeight: 40,
  },
  /** Section titles (e.g., "오늘의 현황") - 28px Bold */
  heading2: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  /** Card titles (e.g., stat card titles) - 22px Medium */
  heading3: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 22,
    lineHeight: 28,
  },
  /** Subtitles, secondary headings - 16px Medium */
  subtitle: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  /** Primary body text - 16px Regular */
  body: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  /** Secondary body text - 14px Regular */
  bodySmall: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  /** Captions, timestamps - 12px Regular */
  caption: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  /** Button labels, chip labels - 14px Medium */
  label: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  /** Small labels, badges - 11px Medium */
  labelSmall: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 11,
    lineHeight: 16,
  },
} as const;
```

**Usage examples** (for later sections -- included here for completeness):
```typescript
// Direct spread into style objects:
const styles = StyleSheet.create({
  pageTitle: {
    ...typography.heading1,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

// Inline on components:
<Text style={[typography.subtitle, { color: colors.textPrimary }]}>오늘의 현황</Text>
```

**Migration reference** (which current hardcoded values map to which tokens):

| Pattern to Find | Replace With |
|----------------|-------------|
| `fontSize: 11` | `...typography.labelSmall` or `fontSize: typography.labelSmall.fontSize` |
| `fontSize: 12` | `...typography.caption` |
| `fontSize: 13` | `...typography.bodySmall` (closest match) |
| `fontSize: 14` | `...typography.bodySmall` or `...typography.label` |
| `fontSize: 15-16` | `...typography.body` or `...typography.subtitle` |
| `fontSize: 17-18` | `...typography.subtitle` or `...typography.heading3` |
| `fontSize: 20-22` | `...typography.heading3` |
| `fontSize: 28` | `...typography.heading2` |
| `fontSize: 36` | `...typography.heading1` (or display) |
| `fontSize: 48` | Custom override on `heading1` |
| `fontWeight: '600'` | `fontWeight: '500'` (medium) or `'700'` (bold) |

---

### 4.6 Role-Based Accent Colors (roleColors)

**File to modify**: `src/constants/theme.ts`

**Where to add**: After the existing `colors` export (after line 45 in the current file).

**Design rationale**: Teachers, students, and parents use completely different features. Visual role differentiation helps orientation and reduces cognitive load. Teacher gets indigo (authoritative/professional), student gets blue (matches current primary, continuity), parent gets green (nurturing/growth).

**Add this export**:
```typescript
/**
 * Role-based accent color palettes.
 * Each role gets a distinct accent to visually differentiate the experience.
 *
 * Usage:
 *   import { roleColors } from '../constants/theme';
 *   const accent = roleColors.teacher.accent;
 *
 * Or via the useRoleTheme() hook (preferred for components):
 *   const { accent, accentLight } = useRoleTheme();
 */
export const roleColors = {
  teacher: {
    accent: '#5C6BC0',       // Indigo
    accentLight: '#8E99D6',
    accentDark: '#3949AB',
    accentSubtle: 'rgba(92, 107, 192, 0.08)',   // For card backgrounds
    accentMuted: 'rgba(92, 107, 192, 0.16)',     // For icon backgrounds
  },
  student: {
    accent: '#4A90D9',       // Blue (matches current primary)
    accentLight: '#7AB3E8',
    accentDark: '#2E6DB3',
    accentSubtle: 'rgba(74, 144, 217, 0.08)',
    accentMuted: 'rgba(74, 144, 217, 0.16)',
  },
  parent: {
    accent: '#66BB6A',       // Green
    accentLight: '#A5D6A7',
    accentDark: '#388E3C',
    accentSubtle: 'rgba(102, 187, 106, 0.08)',
    accentMuted: 'rgba(102, 187, 106, 0.16)',
  },
} as const;

export type RoleColorKey = keyof typeof roleColors;
```

**Palette details**:

| Role | Accent | Light | Dark | Subtle (8%) | Muted (16%) |
|------|--------|-------|------|-------------|-------------|
| Teacher | `#5C6BC0` (Indigo) | `#8E99D6` | `#3949AB` | `rgba(92,107,192,0.08)` | `rgba(92,107,192,0.16)` |
| Student | `#4A90D9` (Blue) | `#7AB3E8` | `#2E6DB3` | `rgba(74,144,217,0.08)` | `rgba(74,144,217,0.16)` |
| Parent | `#66BB6A` (Green) | `#A5D6A7` | `#388E3C` | `rgba(102,187,106,0.08)` | `rgba(102,187,106,0.16)` |

---

### 4.7 Shadow Tokens

**File to modify**: `src/constants/theme.ts`

**Where to add**: After the `roleColors` export.

**Prerequisite**: Add `Platform` and `ViewStyle` to the existing `react-native` import at the top of the file. Currently `theme.ts` does NOT import from `react-native`. You need to add:
```typescript
import { Platform, ViewStyle } from 'react-native';
```
at the top of the file (line 1 area).

> Note: `Platform` is imported for future use in platform-specific shadow handling. Even though the current shadow definitions are cross-platform compatible, having Platform imported is good practice and will be used by downstream sections.

**Add this export**:
```typescript
/**
 * Standardized shadow tokens.
 * Use these instead of inline shadowColor/shadowOffset/shadowOpacity.
 * Cross-platform: iOS uses shadow*, Android uses elevation.
 *
 * Usage: style={[styles.card, shadows.md]}
 */
export const shadows: Record<string, ViewStyle> = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 12,
  },
};
```

**Migration reference**:

| Current Inline Pattern | Replace With |
|----------------------|-------------|
| `shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05-0.10, ...` | `...shadows.sm` |
| `shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10-0.15, ...` | `...shadows.md` |
| `shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15-0.20, ...` | `...shadows.lg` |
| Any larger shadow (elevation > 6) | `...shadows.xl` |

---

### 4.8 Opacity Tokens and opacityToHex Function

**File to modify**: `src/constants/theme.ts`

**Where to add**: After the `shadows` export.

**Add these exports**:
```typescript
/**
 * Opacity tokens to replace inline rgba() values.
 * Usage: { backgroundColor: colors.primary + opacityToHex(opacity.subtle) }
 * Or:    { opacity: opacity.medium }
 */
export const opacity = {
  /** 0.08 - Subtle background emphasis (card tints, icon backgrounds) */
  subtle: 0.08,
  /** 0.16 - Muted elements (inactive badges, hover states) */
  muted: 0.16,
  /** 0.38 - Disabled text (MD3 standard) */
  medium: 0.38,
  /** 0.60 - Secondary/auxiliary text on colored backgrounds */
  high: 0.60,
  /** 0.80 - Primary text on colored backgrounds */
  veryHigh: 0.80,
  /** 1.0 - Full opacity */
  full: 1.0,
} as const;

/**
 * Convert a decimal opacity to a 2-char hex string.
 * Useful for appending to hex color strings: `colors.primary + opacityToHex(0.08)` => `#4A90D914`
 */
export function opacityToHex(value: number): string {
  const hex = Math.round(value * 255).toString(16).padStart(2, '0');
  return hex.toUpperCase();
}
```

**How `opacityToHex` works**:
- Input: decimal `0.08` -> `Math.round(0.08 * 255)` = `20` -> `'14'` -> `'14'`
- Input: decimal `0.16` -> `Math.round(0.16 * 255)` = `41` -> `'29'` -> `'29'`
- Input: decimal `0.80` -> `Math.round(0.80 * 255)` = `204` -> `'cc'` -> `'CC'`

**Usage examples**:
```typescript
// Instead of:  backgroundColor: 'rgba(74, 144, 217, 0.08)'
// Write:       backgroundColor: colors.primary + opacityToHex(opacity.subtle)
// Result:      '#4A90D914'

// Instead of:  + '15' (hex opacity suffix)
// Write:       + opacityToHex(opacity.subtle)

// Instead of:  + '30' (hex opacity suffix)
// Write:       + opacityToHex(opacity.muted)
```

**Migration reference**:

| Current Inline Pattern | Replace With |
|----------------------|-------------|
| `rgba(255,255,255,0.8)` | `'rgba(255,255,255,' + opacity.veryHigh + ')'` |
| `rgba(255,255,255,0.7)` | Use `opacity.high` (0.60) or custom value |
| `rgba(255,255,255,0.3)` | Use `opacity.medium` (0.38) |
| `+ '15'` (hex suffix) | `+ opacityToHex(opacity.subtle)` |
| `+ '20'` (hex suffix) | `+ opacityToHex(opacity.subtle)` (closest) |
| `+ '30'` (hex suffix) | `+ opacityToHex(opacity.muted)` |

---

### 4.9 Component Size Tokens (sizes)

**File to modify**: `src/constants/theme.ts`

**Where to add**: After the `opacityToHex` function. This complements the existing `tabletSizes` export (which remains unchanged).

**Add this export**:
```typescript
/**
 * Standardized component sizes.
 * Use these for icon containers, avatars, badges, progress rings.
 *
 * These complement the existing `tabletSizes` which covers layout-level sizes.
 * `sizes` focuses on individual component element dimensions.
 */
export const sizes = {
  // Icons
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 40,

  // Avatars
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 64,

  // Icon containers (icon + padding)
  iconContainerSm: 32,
  iconContainerMd: 40,
  iconContainerLg: 48,

  // Badges
  badgeSm: 20,
  badgeMd: 28,
  badgeLg: 36,

  // Progress rings
  progressRingSm: 44,
  progressRingMd: 64,
  progressRingLg: 88,

  // Buttons (heights)
  buttonSm: 36,
  buttonMd: 44,
  buttonLg: 52,
} as const;
```

**Migration reference**:

| Current Inline Pattern | Replace With |
|----------------------|-------------|
| `width: 44, height: 44` (icon containers) | `width: sizes.iconContainerLg, height: sizes.iconContainerLg` |
| `width: 40, height: 40` (icon containers) | `width: sizes.iconContainerMd, height: sizes.iconContainerMd` |
| `width: 32, height: 32` (icon containers) | `width: sizes.iconContainerSm, height: sizes.iconContainerSm` |
| `size={48}` (avatars) | `size={sizes.avatarMd}` |
| `size={64}` (avatars) | `size={sizes.avatarLg}` |
| `width: 52, height: 52` (progress circles) | `width: sizes.progressRingSm, height: sizes.progressRingSm` |
| `width: 64, height: 64` (progress circles) | `width: sizes.progressRingMd, height: sizes.progressRingMd` |

---

### 4.10 Chart Color Tokens (chartColors)

**File to modify**: `src/constants/theme.ts`

**Where to add**: After the `sizes` export.

**Add this export**:
```typescript
/**
 * Chart color tokens. Used by RadarChart, LineChart, BarChart, HeatMap.
 * Replaces hardcoded CHART_COLORS in each chart component.
 *
 * In later sections, chart components will accept these as optional props,
 * with these values as defaults.
 */
export const chartColors = {
  // Primary data series
  primaryFill: 'rgba(74, 144, 217, 0.25)',
  primaryStroke: '#4A90D9',
  // Secondary data series
  secondaryFill: 'rgba(92, 107, 192, 0.25)',
  secondaryStroke: '#5C6BC0',
  // Grid and labels
  grid: '#E0E0E0',
  label: '#212121',
  valueLabel: '#757575',
  // Semantic data colors
  successFill: 'rgba(76, 175, 80, 0.25)',
  successStroke: '#4CAF50',
  warningFill: 'rgba(255, 152, 0, 0.25)',
  warningStroke: '#FF9800',
  errorFill: 'rgba(244, 67, 54, 0.25)',
  errorStroke: '#F44336',
  // HeatMap gradient
  heatLow: '#E8F5E9',
  heatMid: '#FFF9C4',
  heatHigh: '#FFCDD2',
} as const;
```

---

### 4.11 Create useRoleTheme() Hook

**New file to create**: `src/hooks/useRoleTheme.ts`

**Purpose**: Returns the role-based accent color palette for the currently logged-in user. Reads the user's role from the Zustand auth store and returns the corresponding accent color set from `roleColors`.

**Complete file contents**:
```typescript
import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { roleColors, colors, type RoleColorKey } from '../constants/theme';

/**
 * Returns the role-based accent color palette for the currently logged-in user.
 *
 * Usage:
 *   const { accent, accentLight, accentDark, accentSubtle, accentMuted } = useRoleTheme();
 *
 * Falls back to student palette if user is not authenticated.
 *
 * Return value:
 *   {
 *     accent: string;        // Primary accent hex color
 *     accentLight: string;   // Lighter variant
 *     accentDark: string;    // Darker variant
 *     accentSubtle: string;  // 8% opacity for card backgrounds
 *     accentMuted: string;   // 16% opacity for icon backgrounds
 *     roleName: 'teacher' | 'student' | 'parent';
 *   }
 */
export function useRoleTheme() {
  const role = useAuthStore((s) => s.user?.role);

  return useMemo(() => {
    const key: RoleColorKey =
      role === 'teacher' || role === 'admin'
        ? 'teacher'
        : role === 'parent'
        ? 'parent'
        : 'student';

    return {
      ...roleColors[key],
      roleName: key,
    };
  }, [role]);
}
```

**Notes**:
- The `admin` role is mapped to `teacher` because admin users in Mathpia are teachers with elevated permissions.
- Falls back to `student` for any unknown or unauthenticated role (safe default).
- Uses `useMemo` for performance -- only recomputes when the role changes.
- Reads from `useAuthStore` using a selector `(s) => s.user?.role` for minimal re-renders.

---

### 4.12 Create useResponsive() Hook

**New file to create**: `src/hooks/useResponsive.ts`

**Purpose**: Provides responsive breakpoint values computed from window dimensions. Replaces raw `useWindowDimensions()` calls and inline `width > 768` checks scattered across screens.

**Complete file contents**:
```typescript
import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

export type ScreenSize = 'small' | 'medium' | 'large';

interface ResponsiveValues {
  /** Current screen size category */
  screenSize: ScreenSize;
  /** Whether this is a tablet-width display (>768px) */
  isTablet: boolean;
  /** Whether the device is in landscape orientation */
  isLandscape: boolean;
  /** Current window width in pixels */
  width: number;
  /** Current window height in pixels */
  height: number;
  /** Number of columns for grid layouts (1 on small, 2 on medium+) */
  columns: 1 | 2 | 3;
  /** Horizontal content padding adapted to screen size */
  contentPadding: number;
}

/**
 * Responsive breakpoints hook.
 *
 * Breakpoints:
 *   small:  < 375px  (small phones)
 *   medium: 375-768px (phones, portrait tablets)
 *   large:  > 768px  (landscape tablets, web)
 *
 * Usage:
 *   const { isTablet, columns, screenSize } = useResponsive();
 *
 * Replaces the pattern:
 *   const { width } = useWindowDimensions();
 *   const isWide = width > 768;
 */
export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const screenSize: ScreenSize =
      width < 375 ? 'small' : width <= 768 ? 'medium' : 'large';

    const isTablet = width > 768;
    const isLandscape = width > height;

    const columns: 1 | 2 | 3 =
      width > 1024 ? 3 : width > 768 ? 2 : 1;

    const contentPadding =
      width > 1024 ? 32 : width > 768 ? 24 : 16;

    return {
      screenSize,
      isTablet,
      isLandscape,
      width,
      height,
      columns,
      contentPadding,
    };
  }, [width, height]);
}
```

**Breakpoint summary**:

| Screen Size | Width Range | isTablet | columns | contentPadding |
|-------------|------------|----------|---------|----------------|
| small | < 375px | false | 1 | 16px |
| medium | 375-768px | false | 1 | 16px |
| large | > 768px, <= 1024px | true | 2 | 24px |
| large | > 1024px | true | 3 | 32px |

---

### 4.13 Create Hooks Barrel Export

**New file to create**: `src/hooks/index.ts`

**Complete file contents**:
```typescript
export { useRoleTheme } from './useRoleTheme';
export { useResponsive } from './useResponsive';
export type { ScreenSize } from './useResponsive';
```

**Usage from other files**:
```typescript
import { useRoleTheme, useResponsive } from '../../src/hooks';
// or from within src/:
import { useRoleTheme, useResponsive } from '../hooks';
```

---

## 5. Complete Updated theme.ts Reference

For clarity, here is what the complete `src/constants/theme.ts` file should look like after all changes in this section. This combines the existing content (colors, theme, spacing, borderRadius, tabletSizes) with all new additions (fontConfig update, typography, roleColors, shadows, opacity, opacityToHex, sizes, chartColors).

```typescript
import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { Platform, ViewStyle } from 'react-native';

// ============================================================
// Font Configuration (MD3 type scale with Noto Sans KR)
// ============================================================

const fontConfig = {
  displayLarge:   { fontFamily: 'NotoSansKR-Regular', fontSize: 57, fontWeight: '400' as const, lineHeight: 64 },
  displayMedium:  { fontFamily: 'NotoSansKR-Regular', fontSize: 45, fontWeight: '400' as const, lineHeight: 52 },
  displaySmall:   { fontFamily: 'NotoSansKR-Regular', fontSize: 36, fontWeight: '400' as const, lineHeight: 44 },
  headlineLarge:  { fontFamily: 'NotoSansKR-Bold',    fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  headlineMedium: { fontFamily: 'NotoSansKR-Bold',    fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  headlineSmall:  { fontFamily: 'NotoSansKR-Medium',  fontSize: 24, fontWeight: '500' as const, lineHeight: 32 },
  titleLarge:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 22, fontWeight: '500' as const, lineHeight: 28 },
  titleMedium:    { fontFamily: 'NotoSansKR-Medium',  fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  titleSmall:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  bodyLarge:      { fontFamily: 'NotoSansKR-Regular', fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium:     { fontFamily: 'NotoSansKR-Regular', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall:      { fontFamily: 'NotoSansKR-Regular', fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  labelLarge:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  labelMedium:    { fontFamily: 'NotoSansKR-Medium',  fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  labelSmall:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
};

// ============================================================
// Semantic Typography Tokens
// ============================================================

/**
 * Semantic typography scale for Mathpia.
 * Maps app-level meaning to MD3 font variants.
 * Usage: style={[typography.heading1]} or style={{ ...typography.body }}
 *
 * IMPORTANT: These tokens intentionally do NOT include a `color` property.
 * Color is always set separately so typography tokens can be used on any background.
 */
export const typography = {
  /** Page titles (e.g., "숙제 목록", "대시보드") - 32px Bold */
  heading1: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 32,
    lineHeight: 40,
  },
  /** Section titles (e.g., "오늘의 현황") - 28px Bold */
  heading2: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  /** Card titles (e.g., stat card titles) - 22px Medium */
  heading3: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 22,
    lineHeight: 28,
  },
  /** Subtitles, secondary headings - 16px Medium */
  subtitle: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  /** Primary body text - 16px Regular */
  body: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  /** Secondary body text - 14px Regular */
  bodySmall: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  /** Captions, timestamps - 12px Regular */
  caption: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  /** Button labels, chip labels - 14px Medium */
  label: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  /** Small labels, badges - 11px Medium */
  labelSmall: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 11,
    lineHeight: 16,
  },
} as const;

// ============================================================
// Color Palette
// ============================================================

export const colors = {
  primary: '#4A90D9',
  primaryLight: '#7AB3E8',
  primaryDark: '#2E6DB3',
  secondary: '#5C6BC0',
  secondaryLight: '#8E99D6',
  secondaryDark: '#3949AB',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#E8E8E8',
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  border: '#E0E0E0',
  divider: '#EEEEEE',
  // 캔버스 색상
  canvasBlack: '#212121',
  canvasBlue: '#1976D2',
  canvasRed: '#D32F2F',
  canvasGreen: '#388E3C',
  canvasYellow: '#FBC02D',
};

// ============================================================
// Role-Based Accent Colors
// ============================================================

/**
 * Role-based accent color palettes.
 * Each role gets a distinct accent to visually differentiate the experience.
 */
export const roleColors = {
  teacher: {
    accent: '#5C6BC0',       // Indigo
    accentLight: '#8E99D6',
    accentDark: '#3949AB',
    accentSubtle: 'rgba(92, 107, 192, 0.08)',   // For card backgrounds
    accentMuted: 'rgba(92, 107, 192, 0.16)',     // For icon backgrounds
  },
  student: {
    accent: '#4A90D9',       // Blue (matches current primary)
    accentLight: '#7AB3E8',
    accentDark: '#2E6DB3',
    accentSubtle: 'rgba(74, 144, 217, 0.08)',
    accentMuted: 'rgba(74, 144, 217, 0.16)',
  },
  parent: {
    accent: '#66BB6A',       // Green
    accentLight: '#A5D6A7',
    accentDark: '#388E3C',
    accentSubtle: 'rgba(102, 187, 106, 0.08)',
    accentMuted: 'rgba(102, 187, 106, 0.16)',
  },
} as const;

export type RoleColorKey = keyof typeof roleColors;

// ============================================================
// MD3 Theme
// ============================================================

export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    error: colors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: colors.textPrimary,
    onSurface: colors.textPrimary,
    onError: '#FFFFFF',
    outline: colors.border,
  },
  roundness: 12,
};

// ============================================================
// Spacing
// ============================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ============================================================
// Border Radius
// ============================================================

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ============================================================
// Shadow Tokens
// ============================================================

/**
 * Standardized shadow tokens.
 * Use these instead of inline shadowColor/shadowOffset/shadowOpacity.
 * Cross-platform: iOS uses shadow*, Android uses elevation.
 */
export const shadows: Record<string, ViewStyle> = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 12,
  },
};

// ============================================================
// Opacity Tokens
// ============================================================

/**
 * Opacity tokens to replace inline rgba() values.
 * Usage: { backgroundColor: colors.primary + opacityToHex(opacity.subtle) }
 * Or:    { opacity: opacity.medium }
 */
export const opacity = {
  /** 0.08 - Subtle background emphasis (card tints, icon backgrounds) */
  subtle: 0.08,
  /** 0.16 - Muted elements (inactive badges, hover states) */
  muted: 0.16,
  /** 0.38 - Disabled text (MD3 standard) */
  medium: 0.38,
  /** 0.60 - Secondary/auxiliary text on colored backgrounds */
  high: 0.60,
  /** 0.80 - Primary text on colored backgrounds */
  veryHigh: 0.80,
  /** 1.0 - Full opacity */
  full: 1.0,
} as const;

/**
 * Convert a decimal opacity to a 2-char hex string.
 * Useful for appending to hex color strings: `colors.primary + opacityToHex(0.08)` => `#4A90D914`
 */
export function opacityToHex(value: number): string {
  const hex = Math.round(value * 255).toString(16).padStart(2, '0');
  return hex.toUpperCase();
}

// ============================================================
// Component Size Tokens
// ============================================================

/**
 * Standardized component sizes.
 * Use these for icon containers, avatars, badges, progress rings.
 */
export const sizes = {
  // Icons
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 40,

  // Avatars
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 64,

  // Icon containers (icon + padding)
  iconContainerSm: 32,
  iconContainerMd: 40,
  iconContainerLg: 48,

  // Badges
  badgeSm: 20,
  badgeMd: 28,
  badgeLg: 36,

  // Progress rings
  progressRingSm: 44,
  progressRingMd: 64,
  progressRingLg: 88,

  // Buttons (heights)
  buttonSm: 36,
  buttonMd: 44,
  buttonLg: 52,
} as const;

// ============================================================
// Chart Color Tokens
// ============================================================

/**
 * Chart color tokens. Used by RadarChart, LineChart, BarChart, HeatMap.
 * Replaces hardcoded CHART_COLORS in each chart component.
 */
export const chartColors = {
  // Primary data series
  primaryFill: 'rgba(74, 144, 217, 0.25)',
  primaryStroke: '#4A90D9',
  // Secondary data series
  secondaryFill: 'rgba(92, 107, 192, 0.25)',
  secondaryStroke: '#5C6BC0',
  // Grid and labels
  grid: '#E0E0E0',
  label: '#212121',
  valueLabel: '#757575',
  // Semantic data colors
  successFill: 'rgba(76, 175, 80, 0.25)',
  successStroke: '#4CAF50',
  warningFill: 'rgba(255, 152, 0, 0.25)',
  warningStroke: '#FF9800',
  errorFill: 'rgba(244, 67, 54, 0.25)',
  errorStroke: '#F44336',
  // HeatMap gradient
  heatLow: '#E8F5E9',
  heatMid: '#FFF9C4',
  heatHigh: '#FFCDD2',
} as const;

// ============================================================
// Tablet-Optimized Sizes (existing, unchanged)
// ============================================================

// 태블릿 최적화 사이즈
export const tabletSizes = {
  minTouchTarget: 44,
  iconSize: 24,
  iconSizeLarge: 32,
  avatarSize: 48,
  avatarSizeLarge: 64,
  buttonHeight: 48,
  inputHeight: 56,
  toolbarHeight: 64,
  tabBarHeight: 72,
};
```

---

## 6. Acceptance Criteria

All checkboxes must be checked before this section is considered complete.

### Font Loading
- [ ] `assets/fonts/NotoSansKR-Regular.ttf` exists and is a valid font file
- [ ] `assets/fonts/NotoSansKR-Medium.ttf` exists and is a valid font file
- [ ] `assets/fonts/NotoSansKR-Bold.ttf` exists and is a valid font file
- [ ] `expo-font` is listed in `package.json` dependencies
- [ ] `expo-splash-screen` is listed in `package.json` dependencies
- [ ] `app/_layout.tsx` loads all three fonts via `useFonts`
- [ ] `app/_layout.tsx` calls `SplashScreen.preventAutoHideAsync()` at module scope
- [ ] `app/_layout.tsx` hides splash screen when fonts are loaded
- [ ] `app/_layout.tsx` returns `null` while fonts are loading (splash remains visible)
- [ ] App launches on iOS simulator without crash
- [ ] App launches on Android emulator without crash
- [ ] App launches on Expo Web without crash
- [ ] Korean text renders in Noto Sans KR (visually verify on any screen)

### Theme Font Configuration
- [ ] `fontConfig` in `theme.ts` uses `NotoSansKR-Regular` for display and body variants
- [ ] `fontConfig` uses `NotoSansKR-Medium` for title and label variants
- [ ] `fontConfig` uses `NotoSansKR-Bold` for headline variants
- [ ] All 14 MD3 type variants have `lineHeight` values
- [ ] react-native-paper components (Button, TextInput, etc.) render with Noto Sans KR

### Typography Tokens
- [ ] `typography` is exported from `src/constants/theme.ts`
- [ ] `typography` has exactly 9 keys: heading1, heading2, heading3, subtitle, body, bodySmall, caption, label, labelSmall
- [ ] No typography token includes a `color` property
- [ ] Each token has `fontFamily`, `fontSize`, and `lineHeight`
- [ ] `typography.heading1` is 32px NotoSansKR-Bold
- [ ] `typography.heading2` is 28px NotoSansKR-Bold
- [ ] `typography.heading3` is 22px NotoSansKR-Medium
- [ ] `typography.subtitle` is 16px NotoSansKR-Medium
- [ ] `typography.body` is 16px NotoSansKR-Regular
- [ ] `typography.bodySmall` is 14px NotoSansKR-Regular
- [ ] `typography.caption` is 12px NotoSansKR-Regular
- [ ] `typography.label` is 14px NotoSansKR-Medium
- [ ] `typography.labelSmall` is 11px NotoSansKR-Medium

### Role Colors
- [ ] `roleColors` is exported from `src/constants/theme.ts`
- [ ] `roleColors.teacher.accent` is `#5C6BC0` (indigo)
- [ ] `roleColors.student.accent` is `#4A90D9` (blue)
- [ ] `roleColors.parent.accent` is `#66BB6A` (green)
- [ ] Each role has exactly 5 color keys: accent, accentLight, accentDark, accentSubtle, accentMuted
- [ ] `RoleColorKey` type is exported

### Shadow Tokens
- [ ] `shadows` is exported from `src/constants/theme.ts`
- [ ] `shadows` has exactly 5 keys: none, sm, md, lg, xl
- [ ] Each shadow (except none) has shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation
- [ ] `Platform` and `ViewStyle` are imported from `react-native`

### Opacity Tokens
- [ ] `opacity` is exported from `src/constants/theme.ts`
- [ ] `opacity` has exactly 6 keys: subtle(0.08), muted(0.16), medium(0.38), high(0.60), veryHigh(0.80), full(1.0)
- [ ] `opacityToHex` function is exported
- [ ] `opacityToHex(0.08)` returns `'14'`
- [ ] `opacityToHex(1.0)` returns `'FF'`

### Size Tokens
- [ ] `sizes` is exported from `src/constants/theme.ts`
- [ ] `sizes` includes icon, avatar, iconContainer, badge, progressRing, and button categories
- [ ] Existing `tabletSizes` export is preserved and unchanged

### Chart Color Tokens
- [ ] `chartColors` is exported from `src/constants/theme.ts`
- [ ] `chartColors` includes primaryFill, primaryStroke, secondaryFill, secondaryStroke, grid, label, valueLabel, successFill, successStroke, warningFill, warningStroke, errorFill, errorStroke, heatLow, heatMid, heatHigh

### Hooks
- [ ] `src/hooks/useRoleTheme.ts` exists and exports `useRoleTheme`
- [ ] `useRoleTheme()` returns accent colors for the current user's role
- [ ] `useRoleTheme()` falls back to student palette when user is not authenticated
- [ ] `useRoleTheme()` maps `admin` role to `teacher` palette
- [ ] `src/hooks/useResponsive.ts` exists and exports `useResponsive`
- [ ] `useResponsive()` returns `screenSize`, `isTablet`, `isLandscape`, `width`, `height`, `columns`, `contentPadding`
- [ ] `isTablet` is `true` when width > 768
- [ ] `columns` is 3 when width > 1024, 2 when > 768, 1 otherwise
- [ ] `src/hooks/index.ts` exists and exports both hooks and the `ScreenSize` type

### Build Verification
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] All new exports import correctly from `src/constants/theme`
- [ ] All new exports import correctly from `src/hooks`
- [ ] No existing functionality is broken (login still works, navigation still works)

---

## 7. Files to Create / Modify (Complete List)

### Files to Create (3 new code files + 3 font files)

| File Path | Description |
|-----------|-------------|
| `assets/fonts/NotoSansKR-Regular.ttf` | Noto Sans KR Regular weight (400) font file, downloaded from Google Fonts |
| `assets/fonts/NotoSansKR-Medium.ttf` | Noto Sans KR Medium weight (500) font file, downloaded from Google Fonts |
| `assets/fonts/NotoSansKR-Bold.ttf` | Noto Sans KR Bold weight (700) font file, downloaded from Google Fonts |
| `src/hooks/useRoleTheme.ts` | Hook that reads user role from authStore and returns role-specific accent color palette |
| `src/hooks/useResponsive.ts` | Hook that wraps useWindowDimensions with breakpoints, column count, and content padding |
| `src/hooks/index.ts` | Barrel export file for all hooks |

### Files to Modify (3 existing files)

| File Path | Description of Changes |
|-----------|----------------------|
| `package.json` | Add `expo-font` and `expo-splash-screen` dependencies (via `npx expo install`) |
| `app/_layout.tsx` | Add font loading with useFonts, splash screen management with SplashScreen.preventAutoHideAsync/hideAsync, conditional rendering while fonts load |
| `src/constants/theme.ts` | Replace fontConfig System fonts with NotoSansKR; add import for Platform/ViewStyle; add exports: typography, roleColors, RoleColorKey, shadows, opacity, opacityToHex, sizes, chartColors |

---

## 8. Risk Mitigation

### Risk: Font Loading Failure
**Symptom**: App stuck on splash screen or text renders invisible.
**Mitigation**: The `useFonts` hook returns `fontsLoaded` boolean. We do not render the app until fonts are loaded. Consider adding a 5-second timeout fallback (see code in section 4.3) so the app renders with system fonts rather than hanging indefinitely.

### Risk: Web Compatibility with expo-font
**Symptom**: Fonts don't load on Expo Web.
**Mitigation**: `expo-font` supports web via `@font-face` injection. Test on web early. If issues arise, provide web-specific font loading via CSS as a fallback.

### Risk: Bundle Size Increase
**Symptom**: App download size increases.
**Mitigation**: Three Noto Sans KR weight files add approximately 300-600KB total. This is acceptable for a tablet app with educational content.

### Risk: TypeScript Strict Mode Issues
**Symptom**: New types cause compilation errors.
**Mitigation**: All new code includes explicit TypeScript types. Token objects use `as const` for literal types. `ViewStyle` is properly typed from `react-native`.

---

## 9. Implementation Order (Step-by-Step)

For an implementer following this section, execute in this exact order:

1. Download the three Noto Sans KR `.ttf` files and place them in `assets/fonts/`
2. Run `npx expo install expo-font expo-splash-screen`
3. Modify `src/constants/theme.ts`:
   - Add `import { Platform, ViewStyle } from 'react-native';` at the top
   - Replace `fontConfig` with the NotoSansKR version
   - Add `typography` export after fontConfig
   - Add `roleColors` and `RoleColorKey` exports after `colors`
   - Add `shadows` export after `roleColors`
   - Add `opacity` and `opacityToHex` exports after `shadows`
   - Add `sizes` export after `opacityToHex`
   - Add `chartColors` export after `sizes`
4. Modify `app/_layout.tsx`:
   - Add imports for `useFonts` and `SplashScreen`
   - Add `SplashScreen.preventAutoHideAsync()` at module scope
   - Add `useFonts` call inside the component
   - Add useEffect for `SplashScreen.hideAsync()`
   - Add `if (!fontsLoaded) return null;` guard
5. Create `src/hooks/useRoleTheme.ts` with the complete hook code
6. Create `src/hooks/useResponsive.ts` with the complete hook code
7. Create `src/hooks/index.ts` with barrel exports
8. Run `npx tsc --noEmit` to verify TypeScript compilation
9. Run `npx expo start` and verify on at least one platform that fonts render correctly
10. Verify Korean text displays in Noto Sans KR (check login screen or any screen with Korean text)


---

## Embedded Section: Section 02-common-components

# Section 02: Common Components

> **Phase**: 2 of 8
> **Status**: Pending
> **Depends on**: section-01-design-tokens (MUST be completed first)
> **Blocks**: section-03-auth-screens, section-04-student-screens, section-05-teacher-screens, section-06-parent-screens, section-08-error-empty-states

---

## Background

Mathpia is a Korean math tutoring tablet application serving teachers, students, and parents in private academies (hagwon). The application is fully functional but its UI remains at prototype quality. This section addresses Phase 2 of the UI enhancement plan: building and enhancing the common component library.

### Why New Common Components Are Needed

The current codebase has several critical gaps in its component library:

1. **No skeleton loading states**: The only loading indicator in the app is `ActivityIndicator` (a simple spinner). Every data-loading screen shows a blank or spinner-only state, which feels janky and provides no layout preview to the user. A `SkeletonLoader` component with reanimated shimmer animation will replace all spinners with content-shaped placeholders that preview the layout while data loads.

2. **No empty state UI**: When screens have no data (no homework, no students, no wrong notes), they show a completely blank area. Users have no guidance on what the screen is for or what action to take. An `EmptyState` component with icon, title, description, and optional action button will provide contextual guidance on every data-driven screen.

3. **Button lacks size variants**: The current `Button.tsx` has a single fixed size (`tabletSizes.buttonHeight`). Different contexts require different button sizes -- compact filter actions need `sm` (36px), standard actions need `md` (44px), and primary CTAs need `lg` (52px). The `sizes.buttonSm/buttonMd/buttonLg` tokens from section-01 need a corresponding `size` prop on Button.

4. **Card has no touch feedback**: The current `Card.tsx` wraps react-native-paper's Card but provides no visual feedback on press. Users cannot tell if a card is tappable. Adding an `Animated.View` wrapper with reanimated scale-down-on-press (0.98) provides clear tactile feedback. `react-native-reanimated` v4.2.1 is already installed but currently has zero imports in the codebase.

5. **Input has no validation feedback**: The current `Input.tsx` only supports a boolean `error` prop. Real-time form validation (used in login, register, and teacher forms) needs visual icons -- a green checkmark for valid and a red X for invalid -- plus a `helperText` prop for non-error guidance text below the field.

6. **No Noto Sans KR in components**: The current Button, Card, and Input components use system fonts with hardcoded `fontSize` and `fontWeight` values. After section-01 installs the Noto Sans KR custom font and defines typography tokens, these components must be updated to use `fontFamily: 'NotoSansKR-*'` and reference token values.

7. **No accessibility labels**: The current common components do not accept `accessibilityLabel` props. Adding these props now ensures all downstream screens can pass accessibility metadata.

### What This Section Produces

After completing this section, the `src/components/common/` directory will contain:

- `SkeletonLoader.tsx` -- New component with reanimated shimmer, 5 variants, and 3 presets
- `EmptyState.tsx` -- New component with icon, title, description, and action button
- `Button.tsx` -- Enhanced with `size` prop (sm/md/lg), Noto Sans KR, and `accessibilityLabel`
- `Card.tsx` -- Enhanced with Animated.View touch scale feedback, Noto Sans KR, and `accessibilityLabel`
- `Input.tsx` -- Enhanced with `validationState` icons, `helperText`, Noto Sans KR, and `accessibilityLabel`
- `index.ts` -- Updated barrel export including all new components

All subsequent sections (03 through 08) import and use these components. This section MUST be completed before any screen-level work begins.

---

## Requirements

When this section is complete, the following must be true:

1. `SkeletonLoader` renders a shimmer animation using `react-native-reanimated` on iOS, Android, and Expo Web without jank at 60fps
2. `SkeletonLoader` supports five variants: `text`, `circle`, `rect`, `card`, `listItem`
3. Three preset skeletons exist: `SkeletonStatCard`, `SkeletonListItem`, `SkeletonDashboard`
4. `EmptyState` renders an icon, title, optional description, and optional action button
5. Per-screen empty state messages are defined for all 14 screens (to be applied in sections 04-06)
6. `Button` supports `size` prop with values `sm` (36px), `md` (44px), `lg` (52px)
7. `Button` uses `NotoSansKR-Medium` font family
8. `Card` provides scale-down touch feedback (0.98) on press using reanimated
9. `Card` uses `NotoSansKR-Medium` and `NotoSansKR-Regular` for title and subtitle
10. `Input` shows a green check-circle icon when `validationState="valid"` and a red close-circle icon when `validationState="invalid"`
11. `Input` renders `helperText` below the field using `HelperText` from react-native-paper
12. `Input` uses `NotoSansKR-Regular` font family
13. All components accept an `accessibilityLabel` prop where applicable
14. `src/components/common/index.ts` exports all components including the new ones
15. `npx tsc --noEmit` passes with no type errors

---

## Dependencies

### Requires (from section-01-design-tokens)

This section imports the following from `src/constants/theme.ts`. These MUST exist before implementation begins:

| Import | Type | Used By |
|--------|------|---------|
| `colors` | Object | SkeletonLoader, EmptyState, Card, Input |
| `spacing` | Object | SkeletonLoader, EmptyState, Card |
| `borderRadius` | Object | SkeletonLoader, Button, Card, Input |
| `typography` | Object | EmptyState |
| `sizes` | Object | Button |
| `shadows` | Object | Card |
| `tabletSizes` | Object | Input |

The following must also exist (from section-01):
- `assets/fonts/NotoSansKR-Regular.ttf` -- loaded via `expo-font` in `app/_layout.tsx`
- `assets/fonts/NotoSansKR-Medium.ttf` -- loaded via `expo-font` in `app/_layout.tsx`
- `assets/fonts/NotoSansKR-Bold.ttf` -- loaded via `expo-font` in `app/_layout.tsx`

The following package must be installed (already present in project):
- `react-native-reanimated` v4.2.1 -- used by SkeletonLoader and Card

### Blocks (downstream sections that depend on this)

| Section | What It Uses |
|---------|-------------|
| section-03-auth-screens | `Button` (size variants), `Input` (validationState) |
| section-04-student-screens | `SkeletonLoader`, `SkeletonDashboard`, `EmptyState`, `Button`, `Card` |
| section-05-teacher-screens | `SkeletonLoader`, `SkeletonListItem`, `EmptyState`, `Button`, `Card` |
| section-06-parent-screens | `SkeletonLoader`, `SkeletonDashboard`, `EmptyState`, `Card` |
| section-08-error-empty-states | `EmptyState`, `Button` (used inside ErrorBoundary) |

---

## Implementation Details

### 2.1 SkeletonLoader Component

**New file**: `src/components/common/SkeletonLoader.tsx`

This component uses `react-native-reanimated` to create a shimmer effect via opacity interpolation. It supports five shape variants (`text`, `circle`, `rect`, `card`, `listItem`), a `count` prop for repeating items, and three preset compositions for common layouts.

**Design decisions**:
- Uses opacity interpolation (0.3 to 0.7) rather than translating a gradient overlay, for simplicity and guaranteed cross-platform performance
- `withRepeat(..., -1, true)` creates an infinite reversing animation
- 1200ms duration with `Easing.inOut(Easing.ease)` provides a smooth, non-distracting pulse
- Preset components (`SkeletonStatCard`, `SkeletonListItem`, `SkeletonDashboard`) compose the base `SkeletonLoader` for common screen patterns

**Current state**: This file does not exist. It will be created from scratch.

**Full implementation**:

```typescript
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
  /** Shape variant */
  variant?: SkeletonVariant;
  /** Width (number for px, string for '%'). Default: '100%' */
  width?: number | string;
  /** Height in px. Default depends on variant. */
  height?: number;
  /** Border radius override. Default depends on variant. */
  radius?: number;
  /** Number of items to repeat (for list skeletons). Default: 1 */
  count?: number;
  /** Gap between repeated items. Default: spacing.sm (8) */
  gap?: number;
  /** Additional style */
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
      -1, // infinite
      true  // reverse
    );
  }, [shimmerProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerProgress.value, [0, 1], [0.3, 0.7]),
  }));

  // Resolve dimensions based on variant
  const resolveProps = () => {
    switch (variant) {
      case 'text':
        return {
          width: widthProp ?? '80%',
          height: heightProp ?? 14,
          borderRadius: radiusProp ?? borderRadius.sm,
        };
      case 'circle':
        const circleSize = heightProp ?? 48;
        return {
          width: widthProp ?? circleSize,
          height: circleSize,
          borderRadius: radiusProp ?? circleSize / 2,
        };
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

// ---- Preset Skeletons for common patterns ----

/** Skeleton mimicking a stat card with icon + value + label */
export function SkeletonStatCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.statCard, style]}>
      <SkeletonLoader variant="circle" height={40} />
      <SkeletonLoader variant="text" width="60%" height={20} style={{ marginTop: spacing.sm }} />
      <SkeletonLoader variant="text" width="40%" height={14} style={{ marginTop: spacing.xs }} />
    </View>
  );
}

/** Skeleton mimicking a list item with avatar + two lines */
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

/** Skeleton mimicking a full dashboard screen */
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
```

---

### 2.2 EmptyState Component

**New file**: `src/components/common/EmptyState.tsx`

This component renders a centered layout with a large icon, a title, an optional description, and an optional action button. It is used on every data-driven screen when the data set is empty (no homework, no students, no wrong notes, etc.).

**Design decisions**:
- Uses `MaterialCommunityIcons` from `@expo/vector-icons` (already in the project) for the icon
- Default icon size of 64px provides strong visual presence without overwhelming the layout
- Default icon color is `colors.textDisabled` for a muted, non-alarming appearance
- The optional action button uses the enhanced `Button` component from this same section
- Layout uses `flex: 1` with centered alignment so it fills available space

**Current state**: This file does not exist. It will be created from scratch.

**Full implementation**:

```typescript
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/theme';
import { Button } from './Button';

export interface EmptyStateProps {
  /** MaterialCommunityIcons icon name */
  icon: string;
  /** Primary message */
  title: string;
  /** Secondary description */
  description?: string;
  /** Action button label (renders a button if provided) */
  actionLabel?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Icon color override (defaults to colors.textDisabled) */
  iconColor?: string;
  /** Icon size override (defaults to 64) */
  iconSize?: number;
  /** Additional container style */
  style?: ViewStyle;
}

/**
 * Empty state component for screens/lists with no data.
 *
 * Usage:
 *   <EmptyState
 *     icon="clipboard-text-off-outline"
 *     title="숙제가 없습니다"
 *     description="새로운 숙제가 배정되면 여기에 표시됩니다"
 *     actionLabel="대시보드로 돌아가기"
 *     onAction={() => router.back()}
 *   />
 */
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
```

---

### 2.3 Per-Screen Empty State Messages

These are the exact icon, title, description, and optional actionLabel configurations for every data-driven screen in Mathpia. They will be applied during sections 04-06 when each screen is enhanced. They are defined here as the canonical reference so that all sections use consistent messaging.

#### Student Screens (4 configurations)

| Screen | File | icon | title | description | actionLabel |
|--------|------|------|-------|-------------|-------------|
| Homework | `app/(student)/homework.tsx` | `clipboard-text-off-outline` | 숙제가 없습니다 | 새로운 숙제가 배정되면 여기에 표시됩니다 | - |
| Wrong Notes | `app/(student)/wrong-notes.tsx` | `notebook-check-outline` | 오답이 없습니다! | 잘하고 있어요! 틀린 문제가 생기면 자동으로 수집됩니다 | - |
| Analytics | `app/(student)/analytics.tsx` | `chart-line` | 분석 데이터가 없습니다 | 문제를 풀면 AI가 학습 분석을 시작합니다 | - |
| Materials | `app/(student)/materials.tsx` | `folder-open-outline` | 강의자료가 없습니다 | 선생님이 자료를 올리면 여기에 표시됩니다 | - |

**Usage example** (applied in section-04):
```typescript
import { EmptyState } from '../../src/components/common';

// Inside homework screen render, when filteredAssignments.length === 0:
<EmptyState
  icon="clipboard-text-off-outline"
  title={filterStatus === 'all' ? '숙제가 없습니다' : '조건에 맞는 숙제가 없습니다'}
  description="새로운 숙제가 배정되면 여기에 표시됩니다"
/>
```

#### Teacher Screens (4 configurations)

| Screen | File | icon | title | description | actionLabel |
|--------|------|------|-------|-------------|-------------|
| Students | `app/(teacher)/students.tsx` | `account-group-outline` | 학생이 없습니다 | 학생을 추가하여 관리를 시작하세요 | 학생 추가 |
| Assignments | `app/(teacher)/assignments.tsx` | `clipboard-text-off-outline` | 숙제가 없습니다 | 새 숙제를 만들어 학생들에게 배정하세요 | 숙제 만들기 |
| Grading | `app/(teacher)/grading.tsx` | `check-circle-outline` | 채점할 제출물이 없습니다 | 학생이 제출하면 여기에 표시됩니다 | - |
| Problem Bank | `app/(teacher)/problem-bank.tsx` | `database-off-outline` | 문제가 없습니다 | 문제를 추가하여 문제은행을 만드세요 | 문제 추가 |

**Usage example** (applied in section-05):
```typescript
import { EmptyState } from '../../src/components/common';

// Inside students screen render, when filteredStudents.length === 0:
<EmptyState
  icon="account-group-outline"
  title="학생이 없습니다"
  description="학생을 추가하여 관리를 시작하세요"
  actionLabel="학생 추가"
  onAction={handleAddStudent}
/>
```

#### Parent Screens (2 configurations)

| Screen | File | icon | title | description | actionLabel |
|--------|------|------|-------|-------------|-------------|
| Schedule | `app/(parent)/schedule.tsx` | `calendar-blank-outline` | 일정이 없습니다 | 등록된 수업 일정이 표시됩니다 | - |
| Report | `app/(parent)/report.tsx` | `chart-bar` | 리포트 데이터가 없습니다 | 자녀의 학습 데이터가 쌓이면 리포트가 생성됩니다 | - |

#### Screens Without Empty State (4 screens)

These screens always have content or are navigation targets that receive data:

| Screen | Reason |
|--------|--------|
| Student Dashboard | Always has stat cards and navigation |
| Solve | Navigated to with a specific assignment; always has problem data |
| Teacher Dashboard | Always has stat overview |
| Parent Dashboard | Always has child overview |

**Total**: 10 screens with EmptyState + 4 screens without = 14 screen configurations defined.

---

### 2.4 Button Enhancement (Size Variants)

**File to modify**: `src/components/common/Button.tsx`

This is a full replacement of the existing Button component. The key changes are:

1. **New `size` prop** accepting `'sm' | 'md' | 'lg'` with default `'md'`
2. **Size configuration map** using `sizes.buttonSm/buttonMd/buttonLg` tokens from section-01 for height, with corresponding `paddingHorizontal` and `fontSize`
3. **Noto Sans KR font**: `fontFamily: 'NotoSansKR-Medium'` on the label
4. **New `accessibilityLabel` prop** passed to PaperButton
5. **`borderRadius.lg` token** instead of hardcoded `12`

**Current state** (will be replaced):

```typescript
// CURRENT: src/components/common/Button.tsx
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { colors, tabletSizes } from '../../constants/theme';

interface ButtonProps {
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  onPress: () => void;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  mode = 'contained',
  onPress,
  children,
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = false,
}) => {
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      icon={icon}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        style,
      ]}
      contentStyle={styles.content}
      labelStyle={styles.label}
    >
      {children}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    height: tabletSizes.buttonHeight,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**Updated implementation** (full replacement):

```typescript
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { colors, sizes, borderRadius, typography } from '../../constants/theme';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  onPress: () => void;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
  /** Size variant. Default: 'md' */
  size?: ButtonSize;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
}

const sizeConfig: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: sizes.buttonSm, paddingHorizontal: 12, fontSize: 13 },
  md: { height: sizes.buttonMd, paddingHorizontal: 16, fontSize: 15 },
  lg: { height: sizes.buttonLg, paddingHorizontal: 24, fontSize: 16 },
};

export const Button: React.FC<ButtonProps> = ({
  mode = 'contained',
  onPress,
  children,
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = false,
  size = 'md',
  accessibilityLabel,
}) => {
  const config = sizeConfig[size];

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      icon={icon}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        style,
      ]}
      contentStyle={{
        height: config.height,
        paddingHorizontal: config.paddingHorizontal,
      }}
      labelStyle={{
        fontFamily: 'NotoSansKR-Medium',
        fontSize: config.fontSize,
        fontWeight: '500',
      }}
    >
      {children}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
});
```

**What changed (diff summary)**:
- Added `size` prop (`'sm' | 'md' | 'lg'`), default `'md'`
- Added `accessibilityLabel` prop
- Added `sizeConfig` map using `sizes.buttonSm/buttonMd/buttonLg` tokens
- Replaced static `contentStyle` with dynamic config-based style
- Replaced static `labelStyle` with dynamic config-based style using `NotoSansKR-Medium`
- Replaced hardcoded `borderRadius: 12` with `borderRadius.lg` token
- Removed `content` and `label` from static StyleSheet (now inline/dynamic)
- Changed import from `colors, tabletSizes` to `colors, sizes, borderRadius, typography`

---

### 2.5 Card Enhancement (Touch Feedback)

**File to modify**: `src/components/common/Card.tsx`

This is a full replacement of the existing Card component. The key changes are:

1. **Animated.View wrapper** with reanimated scale transform for touch feedback
2. **`onPressIn`/`onPressOut` handlers** that scale to 0.98 on press and back to 1.0 on release
3. **Noto Sans KR font** in title (`NotoSansKR-Medium`) and subtitle (`NotoSansKR-Regular`)
4. **New `accessibilityLabel` prop** passed to PaperCard
5. Animation only triggers when `onPress` is defined (non-pressable cards do not animate)

**Design decision**: We use `Animated.View` wrapper instead of `Animated.createAnimatedComponent(PaperCard)` for guaranteed compatibility with react-native-paper's Card component. This avoids potential issues with animating third-party compound components.

**Current state** (will be replaced):

```typescript
// CURRENT: src/components/common/Card.tsx
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevation = 1,
}) => {
  return (
    <PaperCard
      mode="elevated"
      onPress={onPress}
      style={[styles.card, style as any]}
      elevation={elevation}
    >
      <PaperCard.Content style={styles.content}>
        {children}
      </PaperCard.Content>
    </PaperCard>
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
```

**Updated implementation** (full replacement):

```typescript
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  /** Accessibility label */
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
    <Animated.View style={animatedStyle}>
      <PaperCard
        mode="elevated"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, style]}
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

// CardHeader stays the same but with updated typography
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
```

**What changed (diff summary)**:
- Added `react-native-reanimated` import (`Animated`, `useSharedValue`, `useAnimatedStyle`, `withTiming`)
- Added `shadows` to theme imports
- Added `accessibilityLabel` prop to `CardProps` interface
- Added `scale` shared value initialized to `1`
- Added `animatedStyle` that maps `scale` to a transform
- Added `handlePressIn` (scale to 0.98 over 100ms) and `handlePressOut` (scale to 1.0 over 150ms)
- Wrapped `PaperCard` in `<Animated.View style={animatedStyle}>`
- Added `onPressIn` and `onPressOut` handlers to `PaperCard`
- Removed `as any` cast on style prop
- Updated title style: added `fontFamily: 'NotoSansKR-Medium'`, changed `fontWeight: '600'` to `'500'`
- Updated subtitle style: added `fontFamily: 'NotoSansKR-Regular'`

---

### 2.6 Input Enhancement (Validation Icons + Helper Text)

**File to modify**: `src/components/common/Input.tsx`

This is a full replacement of the existing Input component. The key changes are:

1. **New `validationState` prop** (`'none' | 'valid' | 'invalid'`) that controls a right-side icon
2. **Validation icons**: green `check-circle` for valid, red `close-circle` for invalid (using MaterialCommunityIcons)
3. **New `helperText` prop** that renders non-error guidance text below the input
4. **`HelperText` from react-native-paper** for consistent helper/error text rendering
5. **Noto Sans KR font** in input text and content
6. **New `accessibilityLabel` prop**
7. **`borderRadius.lg` token** instead of hardcoded `12`

**Current state** (will be replaced):

```typescript
// CURRENT: src/components/common/Input.tsx
import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { TextInput } from 'react-native-paper';
import { colors, tabletSizes } from '../../constants/theme';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: boolean;
  errorText?: string;
  disabled?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = false,
  errorText,
  disabled = false,
  left,
  right,
  style,
  multiline = false,
  numberOfLines = 1,
}) => {
  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      error={error}
      disabled={disabled}
      left={left}
      right={right}
      style={[styles.input, style]}
      outlineStyle={styles.outline}
      contentStyle={styles.content}
      multiline={multiline}
      numberOfLines={numberOfLines}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
  },
  outline: {
    borderRadius: 12,
  },
  content: {
    minHeight: tabletSizes.inputHeight,
  },
});
```

**Updated implementation** (full replacement):

```typescript
import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tabletSizes, borderRadius } from '../../constants/theme';

type ValidationState = 'none' | 'valid' | 'invalid';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: boolean;
  errorText?: string;
  disabled?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
  /** Validation state: shows check (valid) or X (invalid) icon on right */
  validationState?: ValidationState;
  /** Helper text shown below input (non-error) */
  helperText?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = false,
  errorText,
  disabled = false,
  left,
  right,
  style,
  multiline = false,
  numberOfLines = 1,
  validationState = 'none',
  helperText,
  accessibilityLabel,
}) => {
  // Determine right icon based on validation state
  const rightIcon =
    right ??
    (validationState === 'valid' ? (
      <TextInput.Icon
        icon={() => (
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
        )}
      />
    ) : validationState === 'invalid' ? (
      <TextInput.Icon
        icon={() => (
          <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
        )}
      />
    ) : undefined);

  return (
    <>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        error={error}
        disabled={disabled}
        left={left}
        right={rightIcon}
        style={[styles.input, style]}
        outlineStyle={styles.outline}
        contentStyle={styles.content}
        multiline={multiline}
        numberOfLines={numberOfLines}
        accessibilityLabel={accessibilityLabel}
      />
      {(errorText || helperText) && (
        <HelperText type={error ? 'error' : 'info'} visible={!!(errorText || helperText)}>
          {errorText || helperText}
        </HelperText>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    fontFamily: 'NotoSansKR-Regular',
  },
  outline: {
    borderRadius: borderRadius.lg,
  },
  content: {
    minHeight: tabletSizes.inputHeight,
    fontFamily: 'NotoSansKR-Regular',
  },
});
```

**What changed (diff summary)**:
- Added `HelperText` to react-native-paper imports
- Added `MaterialCommunityIcons` import from `@expo/vector-icons`
- Added `borderRadius` to theme imports
- Added `ValidationState` type (`'none' | 'valid' | 'invalid'`)
- Added `validationState`, `helperText`, and `accessibilityLabel` to `InputProps` interface
- Added `rightIcon` computation: if `right` prop is provided, use it; otherwise, render check-circle (green) for valid, close-circle (red) for invalid, or undefined for none
- Changed `right={right}` to `right={rightIcon}` on TextInput
- Added `accessibilityLabel` prop to TextInput
- Wrapped TextInput in a Fragment (`<>...</>`) and added conditional `HelperText` below
- Added `fontFamily: 'NotoSansKR-Regular'` to input and content styles
- Replaced hardcoded `borderRadius: 12` with `borderRadius.lg` token

---

### 2.7 Update Common Components Index

**File to modify**: `src/components/common/index.ts`

**Current state**:

```typescript
export { Button } from './Button';
export { Input } from './Input';
export { Card, CardHeader } from './Card';
```

**Updated implementation**:

```typescript
export { Button } from './Button';
export { Input } from './Input';
export { Card, CardHeader } from './Card';
export { SkeletonLoader, SkeletonStatCard, SkeletonListItem, SkeletonDashboard } from './SkeletonLoader';
export { EmptyState } from './EmptyState';
```

**What changed**:
- Added export for `SkeletonLoader` and its three presets (`SkeletonStatCard`, `SkeletonListItem`, `SkeletonDashboard`) from `./SkeletonLoader`
- Added export for `EmptyState` from `./EmptyState`

> **Note**: In section-08, `ErrorBoundary` will also be added to this barrel export. That is NOT done in this section.

---

## Acceptance Criteria

- [ ] **SkeletonLoader renders shimmer**: The `SkeletonLoader` component renders a pulsing opacity animation (0.3 to 0.7) using `react-native-reanimated` on iOS, Android, and Expo Web at 60fps with no jank
- [ ] **SkeletonLoader variants work**: All five variants (`text`, `circle`, `rect`, `card`, `listItem`) render with correct default dimensions and border radius
- [ ] **SkeletonLoader count prop works**: Setting `count={5}` renders 5 skeleton items with `gap` spacing between them
- [ ] **SkeletonStatCard preset renders**: Shows a circle (icon) + two text lines (value + label) layout
- [ ] **SkeletonListItem preset renders**: Shows a circle (avatar) + two text lines side-by-side layout
- [ ] **SkeletonDashboard preset renders**: Shows a large card + 3 stat cards in a row + 3 list items
- [ ] **EmptyState renders all elements**: Icon, title, description, and action button all render correctly
- [ ] **EmptyState optional props work**: Omitting `description` hides the description text; omitting `actionLabel`/`onAction` hides the button
- [ ] **EmptyState action button works**: Pressing the action button fires the `onAction` callback
- [ ] **Per-screen messages defined**: All 14 screen configurations are documented with exact icon, title, description, and actionLabel values
- [ ] **Button sm size**: `<Button size="sm">` renders at 36px height with 12px horizontal padding and 13px font
- [ ] **Button md size (default)**: `<Button>` (no size prop) renders at 44px height with 16px horizontal padding and 15px font
- [ ] **Button lg size**: `<Button size="lg">` renders at 52px height with 24px horizontal padding and 16px font
- [ ] **Button font**: All Button labels render in `NotoSansKR-Medium` font family
- [ ] **Button accessibility**: `accessibilityLabel` prop is passed through to the underlying PaperButton
- [ ] **Card touch feedback**: Pressing a Card with an `onPress` handler scales it to 0.98 for 100ms, releasing scales back to 1.0 over 150ms
- [ ] **Card no feedback without onPress**: Cards without `onPress` do not animate on touch
- [ ] **Card font**: Card title renders in `NotoSansKR-Medium`, subtitle in `NotoSansKR-Regular`
- [ ] **Card accessibility**: `accessibilityLabel` prop is passed through to the underlying PaperCard
- [ ] **Input valid icon**: Setting `validationState="valid"` shows a green check-circle icon on the right
- [ ] **Input invalid icon**: Setting `validationState="invalid"` shows a red close-circle icon on the right
- [ ] **Input no icon by default**: Setting `validationState="none"` (or omitting the prop) shows no right icon
- [ ] **Input right prop override**: Providing an explicit `right` prop overrides the validation icon
- [ ] **Input helperText renders**: Setting `helperText="some text"` renders helper text below the input
- [ ] **Input errorText renders**: Setting `error={true} errorText="error message"` renders error-styled text below the input
- [ ] **Input font**: Input text renders in `NotoSansKR-Regular` font family
- [ ] **Input accessibility**: `accessibilityLabel` prop is passed through to the underlying TextInput
- [ ] **Barrel export updated**: `import { SkeletonLoader, EmptyState, Button, Card, Input } from '../../src/components/common'` resolves correctly
- [ ] **TypeScript passes**: `npx tsc --noEmit` completes with no errors after all changes

---

## Files to Create / Modify

### Files to Create (2 new files)

| File Path | Description |
|-----------|-------------|
| `src/components/common/SkeletonLoader.tsx` | Skeleton loading component with reanimated shimmer animation, 5 variants, and 3 presets |
| `src/components/common/EmptyState.tsx` | Empty state component with icon, title, description, and optional action button |

### Files to Modify (4 existing files)

| File Path | Description of Changes |
|-----------|----------------------|
| `src/components/common/Button.tsx` | Add `size` prop (sm/md/lg), `accessibilityLabel` prop, NotoSansKR-Medium font, borderRadius.lg token |
| `src/components/common/Card.tsx` | Add Animated.View touch scale feedback (reanimated), `accessibilityLabel` prop, NotoSansKR-Medium/Regular fonts |
| `src/components/common/Input.tsx` | Add `validationState` prop with check/X icons, `helperText` prop with HelperText, `accessibilityLabel` prop, NotoSansKR-Regular font, borderRadius.lg token |
| `src/components/common/index.ts` | Add exports for SkeletonLoader, SkeletonStatCard, SkeletonListItem, SkeletonDashboard, EmptyState |

### Files NOT Modified in This Section

| File Path | Reason |
|-----------|--------|
| `src/constants/theme.ts` | Modified in section-01 (design tokens) |
| `app/_layout.tsx` | Modified in section-01 (font loading) and section-08 (ErrorBoundary) |
| `src/components/common/ErrorBoundary.tsx` | Created in section-08 |
| All screen files (`app/(student)/*.tsx`, etc.) | Modified in sections 03-07 |


---

## Embedded Section: Section 03-auth-screens

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


---

## Embedded Section: Section 04-student-screens

# Section 04: Student Screens - UI Enhancement

> **Phase**: 4 of 8
> **Depends on**: section-01-design-tokens, section-02-common-components
> **Blocks**: Nothing (parallelizable with sections 03, 05, 06, 07, 08 after section-02 is complete)
> **Estimated effort**: Large
> **Files to modify**: 8 files (1 layout + 7 screens)

---

## Table of Contents

1. [Background & Context](#1-background--context)
2. [Requirements](#2-requirements)
3. [Dependencies from Prior Sections](#3-dependencies-from-prior-sections)
4. [File 1: Student Tab Layout](#4-file-1-student-tab-layout)
5. [File 2: Student Dashboard](#5-file-2-student-dashboard)
6. [File 3: Homework Screen](#6-file-3-homework-screen)
7. [File 4: Solve Screen](#7-file-4-solve-screen)
8. [File 5: Wrong Notes Screen](#8-file-5-wrong-notes-screen)
9. [File 6: Materials Screen](#9-file-6-materials-screen)
10. [File 7: Profile Screen](#10-file-7-profile-screen)
11. [File 8: Analytics Screen](#11-file-8-analytics-screen)
12. [Typography Replacement Master Table](#12-typography-replacement-master-table)
13. [Shadow Replacement Master Table](#13-shadow-replacement-master-table)
14. [Opacity Replacement Master Table](#14-opacity-replacement-master-table)
15. [Size Token Replacement Master Table](#15-size-token-replacement-master-table)
16. [Acceptance Criteria](#16-acceptance-criteria)
17. [Testing Checklist](#17-testing-checklist)

---

## 1. Background & Context

Mathpia is a Korean math tutoring tablet application for private math academies (hagwon). The student role has 7 screens accessed through a 5-tab layout (with 2 hidden tabs for Solve and Analytics):

| Tab | Screen | File | Visible Tab |
|-----|--------|------|-------------|
| 1 | Home (Dashboard) | `app/(student)/index.tsx` | Yes |
| 2 | Homework | `app/(student)/homework.tsx` | Yes |
| 3 | Wrong Notes | `app/(student)/wrong-notes.tsx` | Yes |
| 4 | Materials | `app/(student)/materials.tsx` | Yes |
| 5 | Profile | `app/(student)/profile.tsx` | Yes |
| - | Solve | `app/(student)/solve.tsx` | Hidden (`href: null`) |
| - | Analytics | `app/(student)/analytics.tsx` | Hidden (`href: null`) |

**Current state**: All screens are functional but use hardcoded font sizes (11px to 48px), inline `rgba()` opacity values, inline shadow definitions, hardcoded component sizes, no custom Korean font, no skeleton loading states (only `ActivityIndicator` spinners), and inline empty state markup instead of reusable components. The tab bar uses `colors.primary` (#4A90D9) without role differentiation.

**Goal of this section**: Apply the complete design token system (typography, shadows, opacity, sizes, chartColors, roleColors) established in section-01 and the common components (SkeletonLoader, EmptyState) built in section-02 to all 8 student-role files. The student role accent color is **blue** (#4A90D9).

---

## 2. Requirements

### Functional Requirements (NO changes)
- Zero business logic modifications
- All navigation flows remain identical
- All data fetching and state management unchanged
- Mock data structures untouched

### Visual/UX Requirements
1. All text must use Noto Sans KR via `typography.*` semantic tokens
2. All shadows must use `shadows.*` tokens
3. All inline `rgba()` values must use `opacity` tokens or `opacityToHex()`
4. All icon containers / avatars / progress rings must use `sizes.*` tokens
5. Tab bar must use `roleColors.student.accent` for active tint
6. Tab bar labels must use `fontFamily: 'NotoSansKR-Medium'`
7. Loading states must use `SkeletonLoader` / `SkeletonDashboard` (replace `ActivityIndicator`)
8. Empty states must use `<EmptyState>` component (replace inline empty markup)
9. Role accent (`useRoleTheme()`) must be applied to progress cards and active nav elements
10. Background colors must reference `colors.background` instead of hardcoded `'#F8F9FA'` or `'#F5F6F8'`

---

## 3. Dependencies from Prior Sections

### From section-01-design-tokens (MUST be complete before starting)

The following exports from `src/constants/theme.ts` are required:

```typescript
// Semantic typography tokens
import { typography } from '../../src/constants/theme';
// typography.heading1  -> 32px Bold
// typography.heading2  -> 28px Bold
// typography.heading3  -> 22px Medium
// typography.subtitle  -> 16px Medium
// typography.body      -> 16px Regular
// typography.bodySmall -> 14px Regular
// typography.caption   -> 12px Regular
// typography.label     -> 14px Medium
// typography.labelSmall -> 11px Medium

// Role-based accent colors
import { roleColors } from '../../src/constants/theme';
// roleColors.student.accent      -> '#4A90D9'
// roleColors.student.accentLight -> '#7AB3E8'
// roleColors.student.accentDark  -> '#2E6DB3'
// roleColors.student.accentSubtle -> 'rgba(74, 144, 217, 0.08)'
// roleColors.student.accentMuted  -> 'rgba(74, 144, 217, 0.16)'

// Shadow tokens
import { shadows } from '../../src/constants/theme';
// shadows.none, shadows.sm, shadows.md, shadows.lg, shadows.xl

// Opacity tokens
import { opacity, opacityToHex } from '../../src/constants/theme';
// opacity.subtle (0.08), opacity.muted (0.16), opacity.medium (0.38), etc.

// Size tokens
import { sizes } from '../../src/constants/theme';
// sizes.iconContainerSm (32), sizes.iconContainerMd (40), sizes.iconContainerLg (48)
// sizes.avatarSm (32), sizes.avatarMd (48), sizes.avatarLg (64)
// sizes.progressRingSm (44), sizes.progressRingMd (64)

// Chart color tokens
import { chartColors } from '../../src/constants/theme';
// chartColors.primaryFill, chartColors.primaryStroke, etc.

// Hooks
import { useRoleTheme } from '../../src/hooks';
// Returns: { accent, accentLight, accentDark, accentSubtle, accentMuted, roleName }
```

### From section-02-common-components (MUST be complete before starting)

```typescript
import {
  SkeletonLoader,
  SkeletonStatCard,
  SkeletonListItem,
  SkeletonDashboard,
  EmptyState,
} from '../../src/components/common';
```

---

## 4. File 1: Student Tab Layout

**File**: `app/(student)/_layout.tsx`
**Current size**: 91 lines

### Current State (problems to fix)

```typescript
// CURRENT: Uses colors.primary (no role differentiation)
tabBarActiveTintColor: colors.primary,

// CURRENT: No custom font family on tab labels
tabBarLabelStyle: {
  fontSize: 12,
  fontWeight: '500',
},
```

### Changes Required

#### 4.1 Add imports

```typescript
// ADD these imports:
import { roleColors } from '../../src/constants/theme';
```

#### 4.2 Replace tab bar active tint color

```
BEFORE: tabBarActiveTintColor: colors.primary,
AFTER:  tabBarActiveTintColor: roleColors.student.accent,
```

#### 4.3 Replace tab bar label style

```
BEFORE:
tabBarLabelStyle: {
  fontSize: 12,
  fontWeight: '500',
},

AFTER:
tabBarLabelStyle: {
  fontFamily: 'NotoSansKR-Medium',
  fontSize: 12,
  fontWeight: '500',
},
```

> **Note**: `roleColors.student.accent` is `'#4A90D9'` which is the same as the current `colors.primary`. The change is semantic: it now uses the role-based token, making future accent color adjustments role-aware. The important visual change here is the Noto Sans KR font on tab labels.

---

## 5. File 2: Student Dashboard

**File**: `app/(student)/index.tsx`
**Current size**: 639 lines

This is the largest and most complex student screen. It contains a progress card, stat items, quick navigation cards, academy info card, and homework list.

### 5.1 Add imports

```typescript
// ADD to existing imports:
import {
  typography,
  shadows,
  opacity,
  opacityToHex,
  sizes,
  roleColors,
} from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks';
import { SkeletonDashboard } from '../../src/components/common';
```

### 5.2 Use role theme hook

```typescript
// ADD inside StudentDashboard component, before other logic:
const { accent, accentLight, accentDark, accentSubtle, accentMuted } = useRoleTheme();
```

### 5.3 Replace container background

```
BEFORE: backgroundColor: '#F8F9FA',
AFTER:  backgroundColor: colors.background,
```

### 5.4 Progress card background (role accent)

```
BEFORE: backgroundColor: colors.primary,
AFTER:  backgroundColor: accent,
```

> This uses the dynamic `accent` from `useRoleTheme()` so the progress card adapts if the role token changes.

### 5.5 Typography replacements

| Style property | Before | After |
|---------------|--------|-------|
| `progressCardTitle` | `fontSize: 16, fontWeight: '600'` | `...typography.subtitle, color: '#FFFFFF'` |
| `progressCardSubtitle` | `fontSize: 13, color: 'rgba(255,255,255,0.8)'` | `...typography.bodySmall, color: 'rgba(255,255,255,' + opacity.veryHigh + ')'` |
| `progressPercent` | `fontSize: 36, fontWeight: '700'` | `fontFamily: 'NotoSansKR-Bold', fontSize: 36, fontWeight: '700', color: '#FFFFFF'` |
| `progressPercentSign` | `fontSize: 18, fontWeight: '600'` | `...typography.subtitle, fontWeight: '700', color: 'rgba(255,255,255,' + opacity.veryHigh + ')'` |
| `progressCardFooterText` | `fontSize: 12, color: 'rgba(255,255,255,0.7)'` | `...typography.caption, color: 'rgba(255,255,255,' + opacity.high + ')'` |
| `statValue` | `fontSize: 20, fontWeight: '700'` | `...typography.heading3, fontWeight: '700', fontSize: 20` |
| `statLabel` | `fontSize: 12` | `...typography.caption` |
| `quickNavTitle` | `fontSize: 14, fontWeight: '700'` | `...typography.label, fontWeight: '700'` |
| `quickNavSubtitle` | `fontSize: 12` | `...typography.caption` |
| `academyName` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `academyLocation` | `fontSize: 13` | `...typography.bodySmall, fontSize: 13` |
| `nextClassLabel` | `fontSize: 13` | `...typography.bodySmall, fontSize: 13` |
| `nextClassTime` | `fontSize: 18, fontWeight: '700'` | `...typography.subtitle, fontSize: 18, fontWeight: '700'` |
| `nextClassDuration` | `fontSize: 13` | `...typography.bodySmall, fontSize: 13` |
| `lessonPreviewLabel` | `fontSize: 12, fontWeight: '600'` | `...typography.caption, fontWeight: '500'` |
| `lessonPreviewTitle` | `fontSize: 15, fontWeight: '600'` | `...typography.subtitle, fontSize: 15` |
| `lessonPreviewDesc` | `fontSize: 13, lineHeight: 18` | `...typography.bodySmall, fontSize: 13, lineHeight: 18` |
| `sectionTitle` | `fontSize: 18, fontWeight: '700'` | `...typography.subtitle, fontSize: 18, fontWeight: '700'` |
| `sectionCount` | `fontSize: 14` | `...typography.bodySmall` |
| `homeworkTitle` | `fontSize: 16, fontWeight: '600'` | `...typography.subtitle` |
| `urgentBadgeText` | `fontSize: 11, fontWeight: '600'` | `...typography.labelSmall` |
| `homeworkSubject` | `fontSize: 13` | `...typography.bodySmall, fontSize: 13` |
| `homeworkDue` | `fontSize: 13` | `...typography.bodySmall, fontSize: 13` |
| `homeworkDueUrgent` | `fontWeight: '600'` | `fontWeight: '500'` |
| `progressCircleText` | `fontSize: 14, fontWeight: '700'` | `...typography.label, fontWeight: '700'` |
| `progressSubtext` | `fontSize: 11` | `...typography.labelSmall` |

### 5.6 Shadow replacements

The dashboard cards do not currently use explicit shadow tokens, but several background containers should get them for consistency:

| Element | Before | After |
|---------|--------|-------|
| `statsContainer` | (no shadow) | Add `...shadows.sm` |
| `quickNavCard` | (no shadow) | Add `...shadows.sm` |
| `academyCard` | (no shadow) | Add `...shadows.sm` |
| `homeworkCard` | (no shadow) | Add `...shadows.sm` |

### 5.7 Opacity replacements

| Style property | Before | After |
|---------------|--------|-------|
| `statIconContainer` backgroundColor | `iconColor + '15'` | `iconColor + opacityToHex(opacity.subtle)` |
| `quickNavIconContainer` backgroundColor | `colors.secondary + '15'` / `colors.error + '15'` | `colors.secondary + opacityToHex(opacity.subtle)` / `colors.error + opacityToHex(opacity.subtle)` |
| `academyIconContainer` backgroundColor | `colors.primaryLight + '30'` | `colors.primaryLight + opacityToHex(opacity.muted)` |
| `progressBarMain` backgroundColor | `'rgba(255,255,255,0.3)'` | `'rgba(255,255,255,' + opacity.muted + ')'` (use 0.3 custom) or keep hardcoded as design choice |
| `progressCircle` backgroundColor | `colors.primaryLight + '30'` | `colors.primaryLight + opacityToHex(opacity.muted)` |
| `progressCircleComplete` backgroundColor | `colors.success + '20'` | `colors.success + opacityToHex(opacity.muted)` |

> **Note**: The hex suffix `'15'` corresponds approximately to `opacity.subtle` (0.08 = hex `14`). The suffix `'30'` corresponds approximately to `opacity.muted` (0.16 = hex `29`). Using `opacityToHex()` produces mathematically accurate hex values. The visual difference is negligible.

### 5.8 Size token replacements

| Element | Before | After |
|---------|--------|-------|
| `statIconContainer` | `width: 44, height: 44` | `width: sizes.iconContainerLg, height: sizes.iconContainerLg` |
| `quickNavIconContainer` | `width: 44, height: 44` | `width: sizes.iconContainerLg, height: sizes.iconContainerLg` |
| `academyIconContainer` | `width: 40, height: 40` | `width: sizes.iconContainerMd, height: sizes.iconContainerMd` |
| `progressCircle` | `width: 52, height: 52, borderRadius: 26` | `width: sizes.progressRingSm, height: sizes.progressRingSm, borderRadius: sizes.progressRingSm / 2` |

> **Note**: `sizes.progressRingSm` is 44, which is smaller than the current 52px. If the design prefers to keep the 52px circle, use `sizes.progressRingMd` (64) or keep a custom value. Recommendation: keep 52px as a local override since it is between token sizes.

### 5.9 Add SkeletonDashboard loading state (optional)

The current dashboard uses mock data with no loading state. To prepare for real data:

```typescript
// If a loading state is added in the future:
if (isLoading) {
  return (
    <SafeAreaView style={styles.container}>
      <SkeletonDashboard />
    </SafeAreaView>
  );
}
```

This is optional for this phase since the dashboard uses mock data. If connected to a store with `isLoading`, add it.

---

## 6. File 3: Homework Screen

**File**: `app/(student)/homework.tsx`
**Current size**: 339 lines

### 6.1 Add imports

```typescript
// ADD to existing imports:
import { typography, shadows, opacity, opacityToHex } from '../../src/constants/theme';
import { EmptyState, SkeletonLoader } from '../../src/components/common';
```

### 6.2 Typography replacements

| Style property | Before | After |
|---------------|--------|-------|
| `headerTitle` | `fontSize: 28, fontWeight: 'bold'` | `...typography.heading2` |
| `headerSubtitle` | `fontSize: 14` | `...typography.bodySmall` |
| `title` (assignment card) | `fontSize: 18, fontWeight: '600'` | `...typography.subtitle, fontSize: 18` |
| `subject` | `fontSize: 14` | `...typography.bodySmall` |
| `metaText` | `fontSize: 14` | `...typography.bodySmall` |
| `progressLabel` | `fontSize: 14` | `...typography.bodySmall` |
| `progressValue` | `fontSize: 14, fontWeight: '500'` | `...typography.label` |
| `aiBannerTitle` | `fontSize: 16, fontWeight: '600'` | `...typography.subtitle` |
| `aiBannerSubtitle` | `fontSize: 13` | `...typography.bodySmall, fontSize: 13` |
| Chip `textStyle` (inline) | `fontSize: 12` | `fontSize: typography.caption.fontSize` |

### 6.3 Filter chips styling

Replace the filter chip styling with font-family-aware labels:

```typescript
// BEFORE (inline in renderAssignment):
textStyle={{ color: getStatusColor(item.status), fontSize: 12 }}

// AFTER:
textStyle={{
  color: getStatusColor(item.status),
  fontFamily: 'NotoSansKR-Medium',
  fontSize: 12,
}}
```

For the filter Chip row, add font family:

```typescript
// In the filter Chips, add textStyle:
<Chip
  key={status}
  selected={filter === status}
  onPress={() => setFilter(status)}
  style={styles.filterChip}
  showSelectedCheck={false}
  textStyle={{ fontFamily: 'NotoSansKR-Medium', fontSize: 13 }}
>
```

### 6.4 Opacity replacements

| Element | Before | After |
|---------|--------|-------|
| Status chip background | `getStatusColor(item.status) + '20'` | `getStatusColor(item.status) + opacityToHex(opacity.muted)` |
| AI banner icon container | `colors.secondaryLight + '20'` | `colors.secondaryLight + opacityToHex(opacity.muted)` |

### 6.5 Add EmptyState

When `filteredAssignments.length === 0`, replace the empty FlatList with `<EmptyState>`:

```typescript
// AFTER the FlatList, add a ListEmptyComponent or wrap conditionally:

// Option 1: FlatList ListEmptyComponent prop
<FlatList
  data={filteredAssignments}
  keyExtractor={(item) => item.id}
  renderItem={renderAssignment}
  contentContainerStyle={[
    styles.listContent,
    filteredAssignments.length === 0 && { flex: 1 },
  ]}
  showsVerticalScrollIndicator={false}
  ListEmptyComponent={
    <EmptyState
      icon="clipboard-text-off-outline"
      title={filter === 'all' ? '숙제가 없습니다' : '조건에 맞는 숙제가 없습니다'}
      description="새로운 숙제가 배정되면 여기에 표시됩니다"
    />
  }
/>
```

### 6.6 Add SkeletonLoader for loading state

If an `isLoading` state is added (e.g., from `assignmentStore`):

```typescript
// Before the FlatList:
if (isLoading) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>숙제 목록</Text>
      </View>
      <View style={{ padding: spacing.lg }}>
        <SkeletonLoader variant="card" height={140} count={3} gap={spacing.md} />
      </View>
    </SafeAreaView>
  );
}
```

---

## 7. File 4: Solve Screen

**File**: `app/(student)/solve.tsx`
**Current size**: 578 lines

### 7.1 Add imports

```typescript
// ADD to existing imports:
import { Portal, Dialog } from 'react-native-paper';
import { typography, shadows, opacity, opacityToHex } from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks';
```

### 7.2 Use role theme hook

```typescript
// ADD inside SolveScreen component:
const { accent } = useRoleTheme();
```

### 7.3 Replace container background

```
BEFORE: backgroundColor: '#F5F6F8',
AFTER:  backgroundColor: colors.background,
```

### 7.4 Typography replacements

| Style property | Before | After |
|---------------|--------|-------|
| `assignmentTitle` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `assignmentMetaText` | `fontSize: 13` | `...typography.bodySmall, fontSize: 13` |
| `progressText` | `fontSize: 12` | `...typography.caption` |
| `submitButtonText` | `fontSize: 14, fontWeight: '600'` | `...typography.label` |
| `problemNumberText` | `fontSize: 14, fontWeight: '600'` | `...typography.label` |
| `problemBadgeText` | `fontSize: 13, fontWeight: '600'` | `...typography.bodySmall, fontWeight: '500'` |
| `pointsText` | `fontSize: 13, fontWeight: '600'` | `...typography.bodySmall, fontWeight: '500'` |
| `problemText` | `fontSize: 18, lineHeight: 30` | `...typography.subtitle, fontSize: 18, lineHeight: 30` |
| `subjectTagText` | `fontSize: 13` | `...typography.bodySmall, fontSize: 13` |
| `canvasLabel` | `fontSize: 14, fontWeight: '600'` | `...typography.label` |
| `saveButtonText` | `fontSize: 13, fontWeight: '600'` | `...typography.bodySmall, fontWeight: '500'` |

### 7.5 Problem number button - role accent for active state

```
BEFORE:
problemNumberButtonActive: {
  backgroundColor: colors.primary,
},

AFTER:
problemNumberButtonActive: {
  backgroundColor: accent,   // from useRoleTheme()
},
```

Since `accent` is a runtime value, this must be applied as an inline style override:

```typescript
// In ProblemNumberButton component, pass accent as prop or use hook:
// Option 1: Make accent a prop
// Option 2: Since ProblemNumberButton is defined in the same file, read accent from parent scope

// In the inline style array for active state:
isActive && { backgroundColor: accent },
```

> **Implementation note**: Since `ProblemNumberButton` is a local component in the same file, the simplest approach is to add an `accentColor` prop to `ProblemNumberButton` and pass `accent` from the parent `SolveScreen` component.

### 7.6 Problem navigation bar - increase touch target

```
BEFORE:
problemNumberButton: {
  width: 36,
  height: 36,
  ...
},
navArrowButton: {
  width: 36,
  height: 36,
  ...
},

AFTER:
problemNumberButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  ...
},
navArrowButton: {
  width: 44,
  height: 44,
  borderRadius: 8,
  ...
},
```

### 7.7 Opacity replacements

| Element | Before | After |
|---------|--------|-------|
| `problemBadge` backgroundColor | `colors.primary + '15'` | `colors.primary + opacityToHex(opacity.subtle)` |
| `pointsBadge` backgroundColor | `colors.warning + '15'` | `colors.warning + opacityToHex(opacity.subtle)` |
| `problemNumberButtonCompleted` backgroundColor | `colors.success + '20'` | `colors.success + opacityToHex(opacity.muted)` |

### 7.8 Add timer display (UI only)

Add a timer display in the header between `headerCenter` and `headerRight`:

```typescript
// ADD state:
const [elapsedSeconds, setElapsedSeconds] = useState(0);

// ADD useEffect for timer:
useEffect(() => {
  const interval = setInterval(() => {
    setElapsedSeconds((prev) => prev + 1);
  }, 1000);
  return () => clearInterval(interval);
}, []);

// Helper to format time:
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// ADD in header JSX (between headerCenter and headerRight):
<View style={styles.timerContainer}>
  <MaterialCommunityIcons name="timer-outline" size={16} color={colors.textSecondary} />
  <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
</View>
```

Timer styles:

```typescript
timerContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  backgroundColor: colors.surfaceVariant,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: borderRadius.md,
},
timerText: {
  ...typography.label,
  color: colors.textSecondary,
},
```

### 7.9 Add submit confirmation modal

```typescript
// ADD state:
const [showSubmitDialog, setShowSubmitDialog] = useState(false);

// MODIFY handleSubmitAll:
const handleSubmitAll = () => {
  const unsolvedCount = mockProblems.length - completedProblems.size;
  if (unsolvedCount > 0) {
    setShowSubmitDialog(true);
  } else {
    confirmSubmit();
  }
};

const confirmSubmit = () => {
  setShowSubmitDialog(false);
  // TODO: actual submission logic
  alert('모든 풀이가 제출되었습니다!');
  router.back();
};

// MODIFY the submit button onPress:
// BEFORE: onPress={handleSubmitAll}
// AFTER:  onPress={handleSubmitAll}  (same, but handleSubmitAll now shows dialog)

// ADD at the end of the JSX (before closing SafeAreaView):
<Portal>
  <Dialog visible={showSubmitDialog} onDismiss={() => setShowSubmitDialog(false)}>
    <Dialog.Title style={{ fontFamily: 'NotoSansKR-Bold' }}>제출 확인</Dialog.Title>
    <Dialog.Content>
      <Text style={{ ...typography.body }}>
        풀지 않은 문제가 {mockProblems.length - completedProblems.size}개 있습니다. 제출하시겠습니까?
      </Text>
    </Dialog.Content>
    <Dialog.Actions>
      <Button mode="text" onPress={() => setShowSubmitDialog(false)}>취소</Button>
      <Button mode="contained" onPress={confirmSubmit}>제출</Button>
    </Dialog.Actions>
  </Dialog>
</Portal>
```

> **Import note**: Add `Portal, Dialog` from `react-native-paper` and `Button` from `../../src/components/common`.

---

## 8. File 5: Wrong Notes Screen

**File**: `app/(student)/wrong-notes.tsx`
**Current size**: 317 lines

### 8.1 Add imports

```typescript
// ADD to existing imports:
import { typography, shadows, opacity, opacityToHex } from '../../src/constants/theme';
import { EmptyState, SkeletonLoader } from '../../src/components/common';
```

### 8.2 Typography replacements

| Style property | Before | After |
|---------------|--------|-------|
| `screenTitle` | `fontSize: 28, fontWeight: 'bold'` | `...typography.heading2` |
| `screenSubtitle` | `fontSize: 14` | `...typography.bodySmall` |
| `loadingText` | `fontSize: 14` | `...typography.bodySmall` |
| `emptyTitle` | `fontSize: 18, fontWeight: '600'` | `...typography.subtitle, fontSize: 18` |
| `emptySubtitle` | `fontSize: 14` | `...typography.bodySmall` |
| `startReviewText` | `fontSize: 17, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700', color: '#FFFFFF'` |

### 8.3 Replace inline empty state with `<EmptyState>` component

**BEFORE** (lines 173-190 of current file):

```typescript
) : filteredNotes.length === 0 ? (
  <View style={styles.emptyContainer}>
    <MaterialCommunityIcons
      name="notebook-outline"
      size={64}
      color={colors.textDisabled}
    />
    <Text style={styles.emptyTitle}>
      {wrongNotes.length === 0
        ? '아직 오답이 없습니다'
        : '필터 조건에 맞는 오답이 없습니다'}
    </Text>
    <Text style={styles.emptySubtitle}>
      {wrongNotes.length === 0
        ? '숙제를 풀면 틀린 문제가 자동으로 수집됩니다'
        : '다른 필터를 선택해보세요'}
    </Text>
  </View>
)
```

**AFTER**:

```typescript
) : filteredNotes.length === 0 ? (
  <EmptyState
    icon={wrongNotes.length === 0 ? 'notebook-check-outline' : 'filter-off-outline'}
    title={wrongNotes.length === 0
      ? '오답이 없습니다!'
      : '필터 조건에 맞는 오답이 없습니다'}
    description={wrongNotes.length === 0
      ? '잘하고 있어요! 틀린 문제가 생기면 자동으로 수집됩니다'
      : '다른 필터를 선택해보세요'}
  />
)
```

> This removes the need for the `emptyContainer`, `emptyTitle`, and `emptySubtitle` styles entirely.

### 8.4 Replace `ActivityIndicator` loading state with `SkeletonLoader`

**BEFORE** (lines 168-172):

```typescript
{isLoading && wrongNotes.length === 0 ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>오답노트를 불러오는 중...</Text>
  </View>
)
```

**AFTER**:

```typescript
{isLoading && wrongNotes.length === 0 ? (
  <View style={styles.loadingContainer}>
    <SkeletonLoader variant="listItem" count={5} gap={spacing.sm} />
  </View>
)
```

Remove the `ActivityIndicator` import from `react-native` if it is no longer used elsewhere in this file.

Update `loadingContainer` style:

```typescript
loadingContainer: {
  flex: 1,
  padding: spacing.md,
},
```

### 8.5 Replace FAB shadow with shadow token

**BEFORE**:

```typescript
startReviewFab: {
  ...
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
},
```

**AFTER**:

```typescript
startReviewFab: {
  ...
  ...shadows.lg,
},
```

### 8.6 Add mastery progress indicator

Add a mastery progress bar above the FlatList, showing overall mastery percentage:

```typescript
// ADD computed values:
const masteredCount = wrongNotes.filter((n) => n.status === 'mastered').length;
const masteryRate = wrongNotes.length > 0 ? masteredCount / wrongNotes.length : 0;

// ADD JSX between WrongNoteFilters and the list:
{wrongNotes.length > 0 && (
  <View style={styles.masteryContainer}>
    <View style={styles.masteryHeader}>
      <Text style={styles.masteryLabel}>전체 숙달도</Text>
      <Text style={styles.masteryValue}>{Math.round(masteryRate * 100)}%</Text>
    </View>
    <ProgressBar
      progress={masteryRate}
      color={colors.success}
      style={styles.masteryBar}
    />
    <Text style={styles.masterySubtext}>
      {masteredCount}/{wrongNotes.length}개 숙달 완료
    </Text>
  </View>
)}
```

Mastery styles:

```typescript
masteryContainer: {
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  backgroundColor: colors.surface,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
},
masteryHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.xs,
},
masteryLabel: {
  ...typography.label,
  color: colors.textPrimary,
},
masteryValue: {
  ...typography.label,
  fontWeight: '700',
  color: colors.success,
},
masteryBar: {
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.surfaceVariant,
},
masterySubtext: {
  ...typography.caption,
  color: colors.textSecondary,
  marginTop: spacing.xs,
},
```

### 8.7 Styles to remove (now handled by EmptyState component)

After replacing the inline empty state, remove these styles:
- `emptyContainer`
- `emptyTitle`
- `emptySubtitle`

---

## 9. File 6: Materials Screen

**File**: `app/(student)/materials.tsx`
**Current size**: 189 lines

### 9.1 Add imports

```typescript
// ADD to existing imports:
import { typography } from '../../src/constants/theme';
import { EmptyState, SkeletonLoader } from '../../src/components/common';
```

### 9.2 Typography replacements

| Style property | Before | After |
|---------------|--------|-------|
| `headerTitle` | `fontSize: 28, fontWeight: 'bold'` | `...typography.heading2` |
| `headerSubtitle` | `fontSize: 14` | `...typography.bodySmall` |
| `materialTitle` | `fontSize: 16, fontWeight: '600'` | `...typography.subtitle` |
| `materialSubject` | `fontSize: 14` | `...typography.bodySmall` |
| `metaText` | `fontSize: 12` | `...typography.caption` |
| `metaDot` | `fontSize: 12` | `...typography.caption` |

### 9.3 Add EmptyState

Add `ListEmptyComponent` to the FlatList:

```typescript
<FlatList
  data={filteredMaterials}
  keyExtractor={(item) => item.id}
  renderItem={renderMaterial}
  contentContainerStyle={[
    styles.listContent,
    filteredMaterials.length === 0 && { flex: 1 },
  ]}
  showsVerticalScrollIndicator={false}
  ListEmptyComponent={
    <EmptyState
      icon="folder-open-outline"
      title="강의자료가 없습니다"
      description="선생님이 자료를 올리면 여기에 표시됩니다"
    />
  }
/>
```

### 9.4 Add SkeletonLoader (future loading state)

If a loading state is added:

```typescript
if (isLoading) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>강의자료</Text>
      </View>
      <View style={{ padding: spacing.lg }}>
        <SkeletonLoader variant="listItem" count={4} gap={spacing.md} />
      </View>
    </SafeAreaView>
  );
}
```

### 9.5 Searchbar font family

```typescript
// ADD to searchbar style or as prop:
<Searchbar
  placeholder="자료 검색"
  onChangeText={setSearchQuery}
  value={searchQuery}
  style={styles.searchbar}
  inputStyle={{ fontFamily: 'NotoSansKR-Regular' }}
/>
```

---

## 10. File 7: Profile Screen

**File**: `app/(student)/profile.tsx`
**Current size**: 337 lines

### 10.1 Add imports

```typescript
// ADD to existing imports:
import { typography, shadows, opacity, opacityToHex, sizes } from '../../src/constants/theme';
```

### 10.2 Typography replacements

| Style property | Before | After |
|---------------|--------|-------|
| `userName` | `fontSize: 22, fontWeight: '700'` | `...typography.heading3` |
| `userInfo` | `fontSize: 14` | `...typography.bodySmall` |
| `sectionTitle` | `fontSize: 16, fontWeight: '600'` | `...typography.subtitle` |
| `statNumber` | `fontSize: 24, fontWeight: '700'` | `...typography.heading3, fontSize: 24, fontWeight: '700'` |
| `statLabel` | `fontSize: 13` | `...typography.bodySmall, fontSize: 13` |
| `menuSectionTitle` | `fontSize: 14, fontWeight: '600'` | `...typography.label` |
| `menuLabel` | `fontSize: 15` | `...typography.body, fontSize: 15` |
| `menuValue` | `fontSize: 14` | `...typography.bodySmall` |
| `logoutText` | `fontSize: 15, fontWeight: '600'` | `...typography.subtitle, fontSize: 15` |
| `versionText` | `fontSize: 12` | `...typography.caption` |

### 10.3 Avatar sizing

```
BEFORE:
<Avatar.Text size={80} ... />

AFTER:
<Avatar.Text size={sizes.avatarLg} ... />
```

> **Note**: `sizes.avatarLg` is 64, which is smaller than the current 80. For the profile screen where the avatar is a hero element, keep 80 as a local override or define `sizes.avatarXl = 80` in theme.ts. Recommendation: keep `size={80}` with a comment `// Profile hero avatar - larger than sizes.avatarLg`.

### 10.4 Replace container background

```
BEFORE: backgroundColor: '#F8F9FA',
AFTER:  backgroundColor: colors.background,
```

### 10.5 Opacity replacements

| Element | Before | After |
|---------|--------|-------|
| `menuIconContainer` backgroundColor | `iconColor + '15'` | `iconColor + opacityToHex(opacity.subtle)` |

### 10.6 Shadow additions

```
statsCard: {
  ...
  // ADD:
  ...shadows.sm,
},
menuCard: {
  ...
  // ADD:
  ...shadows.sm,
},
```

---

## 11. File 8: Analytics Screen

**File**: `app/(student)/analytics.tsx`
**Current size**: 541 lines

### 11.1 Add imports

```typescript
// ADD to existing imports:
import {
  typography,
  shadows,
  opacity,
  opacityToHex,
  sizes,
  chartColors,
} from '../../src/constants/theme';
import { SkeletonLoader } from '../../src/components/common';
```

### 11.2 Typography replacements

| Style property | Before | After |
|---------------|--------|-------|
| `title` | `fontSize: 24, fontWeight: '700'` | `...typography.heading3, fontSize: 24, fontWeight: '700'` |
| `analyzingText` | `fontSize: 12, fontWeight: '500'` | `...typography.caption, fontWeight: '500'` |
| `statValue` | `fontSize: 20, fontWeight: '700'` | `...typography.heading3, fontWeight: '700', fontSize: 20` |
| `statLabel` | `fontSize: 11` | `...typography.labelSmall` |
| `sectionTitle` | `fontSize: 18, fontWeight: '700'` | `...typography.subtitle, fontSize: 18, fontWeight: '700'` |
| `partialLoadingText` | `fontSize: 13` | `...typography.bodySmall, fontSize: 13` |
| `aiSummaryTitle` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `aiSummaryText` | `fontSize: 14, lineHeight: 22` | `...typography.bodySmall, lineHeight: 22` |
| `adviceText` | `fontSize: 13, lineHeight: 18` | `...typography.bodySmall, fontSize: 13, lineHeight: 18` |
| `errorText` | `fontSize: 14` | `...typography.bodySmall` |
| `emptyText` | `fontSize: 16, fontWeight: '600'` | `...typography.subtitle` |
| `emptySubtext` | `fontSize: 13` | `...typography.bodySmall, fontSize: 13` |

### 11.3 Replace container background

```
BEFORE: backgroundColor: '#F8F9FA',
AFTER:  backgroundColor: colors.background,
```

### 11.4 Shadow replacements

| Element | Before | After |
|---------|--------|-------|
| `statCard` | `elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2` | `...shadows.sm` |
| `heatmapContainer` | `elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2` | `...shadows.sm` |
| `aiSummaryCard` | `elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2` | `...shadows.sm` |

### 11.5 Opacity replacements

| Element | Before | After |
|---------|--------|-------|
| `statIconContainer` backgroundColor | `iconColor + '15'` | `iconColor + opacityToHex(opacity.subtle)` |
| `analyzingBadge` backgroundColor | `colors.primary + '10'` | `colors.primary + opacityToHex(opacity.subtle)` |
| `partialLoading` backgroundColor | `colors.primary + '08'` | `colors.primary + opacityToHex(opacity.subtle)` |

### 11.6 Size token replacements

| Element | Before | After |
|---------|--------|-------|
| `statIconContainer` | `width: 40, height: 40` | `width: sizes.iconContainerMd, height: sizes.iconContainerMd` |

### 11.7 Apply chartColors to chart components

Pass `chartColors` tokens as props to chart components:

```typescript
// When rendering AchievementRadar:
<AchievementRadar
  data={radarData}
  overallScore={studentAnalytics.overallScore}
  // ADD chart color props (if AchievementRadar accepts them):
  fillColor={chartColors.primaryFill}
  strokeColor={chartColors.primaryStroke}
/>

// When rendering HeatMap:
<HeatMap
  data={learningReport.heatmapData}
  width={Math.min(width - 48, 600)}
  // ADD chart color props (if HeatMap accepts them):
  colors={{
    low: chartColors.heatLow,
    mid: chartColors.heatMid,
    high: chartColors.heatHigh,
  }}
/>
```

> **Note**: The chart components (RadarChart, HeatMap, etc.) may need to be updated in their own files to accept these color props. That work is shared across sections 04, 05, and 06. If the chart components are not yet updated, pass the props anyway and update the chart components separately.

### 11.8 Upgrade SkeletonLoader usage

The existing `AnalysisSkeleton` component (`src/components/analytics/AnalysisSkeleton.tsx`) should be upgraded to use `react-native-reanimated` instead of the built-in `Animated` API. This is a separate sub-task:

**File to modify**: `src/components/analytics/AnalysisSkeleton.tsx`

Replace:
```typescript
import { Animated } from 'react-native';
```

With:
```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
```

And update the shimmer animation to use `useSharedValue` and `useAnimatedStyle` instead of `Animated.Value` and `Animated.timing`. The pattern is identical to what `SkeletonLoader.tsx` uses (see section-02).

---

## 12. Typography Replacement Master Table

Complete mapping of all hardcoded font sizes across all 8 student files to their semantic token replacements:

### Font Size to Token Mapping

| Hardcoded `fontSize` | Token Replacement | Font Family | Weight |
|----------------------|-------------------|-------------|--------|
| `11` | `typography.labelSmall` | NotoSansKR-Medium | 500 |
| `12` | `typography.caption` | NotoSansKR-Regular | 400 |
| `13` | `typography.bodySmall` (with `fontSize: 13` override) | NotoSansKR-Regular | 400 |
| `14` (regular text) | `typography.bodySmall` | NotoSansKR-Regular | 400 |
| `14` (label/button text) | `typography.label` | NotoSansKR-Medium | 500 |
| `15` | `typography.body` (with `fontSize: 15` override) or `typography.subtitle` (with `fontSize: 15` override) | NotoSansKR-Regular or Medium | 400 or 500 |
| `16` (regular text) | `typography.body` | NotoSansKR-Regular | 400 |
| `16` (medium/semibold text) | `typography.subtitle` | NotoSansKR-Medium | 500 |
| `17` | `typography.subtitle` (with `fontSize: 17` override) | NotoSansKR-Medium | 500 |
| `18` | `typography.subtitle` (with `fontSize: 18` override) | NotoSansKR-Medium | 500 |
| `20` | `typography.heading3` (with `fontSize: 20` override) | NotoSansKR-Medium | 500 |
| `22` | `typography.heading3` | NotoSansKR-Medium | 500 |
| `24` | `typography.heading3` (with `fontSize: 24` override) | NotoSansKR-Medium | 500 |
| `28` | `typography.heading2` | NotoSansKR-Bold | 700 |
| `36` | `typography.heading1` (with `fontSize: 36` override) | NotoSansKR-Bold | 700 |

### Font Weight Mapping

| Hardcoded `fontWeight` | Replacement |
|------------------------|-------------|
| `'400'` | Inherited from `typography.*` (Regular variants) |
| `'500'` | Inherited from `typography.*` (Medium variants) |
| `'600'` | Replace with `'500'` (Medium) or `'700'` (Bold) depending on context |
| `'700'` or `'bold'` | Inherited from `typography.*` (Bold variants) or explicit `fontWeight: '700'` |

### Usage Pattern

```typescript
// Pattern 1: Direct spread (when token matches exactly)
headerTitle: {
  ...typography.heading2,
  color: colors.textPrimary,
},

// Pattern 2: Spread with overrides (when fontSize differs slightly)
statValue: {
  ...typography.heading3,
  fontWeight: '700',
  fontSize: 20,     // override from token's 22 to 20
  color: colors.textPrimary,
},

// Pattern 3: Font family only (for special cases like progress percentage)
progressPercent: {
  fontFamily: 'NotoSansKR-Bold',
  fontSize: 36,
  fontWeight: '700',
  color: '#FFFFFF',
},
```

---

## 13. Shadow Replacement Master Table

| File | Style Property | Before | After |
|------|---------------|--------|-------|
| `index.tsx` (dashboard) | `statsContainer` | (none) | `...shadows.sm` |
| `index.tsx` (dashboard) | `quickNavCard` | (none) | `...shadows.sm` |
| `index.tsx` (dashboard) | `academyCard` | (none) | `...shadows.sm` |
| `index.tsx` (dashboard) | `homeworkCard` | (none) | `...shadows.sm` |
| `wrong-notes.tsx` | `startReviewFab` | `elevation: 4, shadowColor: '#000', shadowOffset: {...}, shadowOpacity: 0.25, shadowRadius: 4` | `...shadows.lg` |
| `analytics.tsx` | `statCard` | `elevation: 1, shadowColor: '#000', shadowOffset: {...}, shadowOpacity: 0.1, shadowRadius: 2` | `...shadows.sm` |
| `analytics.tsx` | `heatmapContainer` | `elevation: 1, shadowColor: '#000', shadowOffset: {...}, shadowOpacity: 0.1, shadowRadius: 2` | `...shadows.sm` |
| `analytics.tsx` | `aiSummaryCard` | `elevation: 1, shadowColor: '#000', shadowOffset: {...}, shadowOpacity: 0.1, shadowRadius: 2` | `...shadows.sm` |
| `profile.tsx` | `statsCard` | (none) | `...shadows.sm` |
| `profile.tsx` | `menuCard` | (none) | `...shadows.sm` |

---

## 14. Opacity Replacement Master Table

| File | Element | Before (hardcoded) | After (token) |
|------|---------|-------------------|---------------|
| `index.tsx` | `statIconContainer` bg | `iconColor + '15'` | `iconColor + opacityToHex(opacity.subtle)` |
| `index.tsx` | `quickNavIconContainer` bg | `color + '15'` | `color + opacityToHex(opacity.subtle)` |
| `index.tsx` | `academyIconContainer` bg | `colors.primaryLight + '30'` | `colors.primaryLight + opacityToHex(opacity.muted)` |
| `index.tsx` | `progressCardSubtitle` color | `rgba(255,255,255,0.8)` | `'rgba(255,255,255,' + opacity.veryHigh + ')'` |
| `index.tsx` | `progressPercentSign` color | `rgba(255,255,255,0.8)` | `'rgba(255,255,255,' + opacity.veryHigh + ')'` |
| `index.tsx` | `progressBarMain` bg | `rgba(255,255,255,0.3)` | Custom (keep as-is or map) |
| `index.tsx` | `progressCardFooterText` color | `rgba(255,255,255,0.7)` | `'rgba(255,255,255,' + opacity.high + ')'` |
| `index.tsx` | `progressCircle` bg | `colors.primaryLight + '30'` | `colors.primaryLight + opacityToHex(opacity.muted)` |
| `index.tsx` | `progressCircleComplete` bg | `colors.success + '20'` | `colors.success + opacityToHex(opacity.muted)` |
| `homework.tsx` | Status chip bg | `statusColor + '20'` | `statusColor + opacityToHex(opacity.muted)` |
| `homework.tsx` | AI banner icon bg | `colors.secondaryLight + '20'` | `colors.secondaryLight + opacityToHex(opacity.muted)` |
| `solve.tsx` | `problemBadge` bg | `colors.primary + '15'` | `colors.primary + opacityToHex(opacity.subtle)` |
| `solve.tsx` | `pointsBadge` bg | `colors.warning + '15'` | `colors.warning + opacityToHex(opacity.subtle)` |
| `solve.tsx` | `problemNumberButtonCompleted` bg | `colors.success + '20'` | `colors.success + opacityToHex(opacity.muted)` |
| `analytics.tsx` | `statIconContainer` bg | `iconColor + '15'` | `iconColor + opacityToHex(opacity.subtle)` |
| `analytics.tsx` | `analyzingBadge` bg | `colors.primary + '10'` | `colors.primary + opacityToHex(opacity.subtle)` |
| `analytics.tsx` | `partialLoading` bg | `colors.primary + '08'` | `colors.primary + opacityToHex(opacity.subtle)` |
| `profile.tsx` | `menuIconContainer` bg | `iconColor + '15'` | `iconColor + opacityToHex(opacity.subtle)` |

---

## 15. Size Token Replacement Master Table

| File | Element | Before | After | Token |
|------|---------|--------|-------|-------|
| `index.tsx` | `statIconContainer` | `width: 44, height: 44` | `width: sizes.iconContainerLg, height: sizes.iconContainerLg` | `sizes.iconContainerLg` (48) |
| `index.tsx` | `quickNavIconContainer` | `width: 44, height: 44` | `width: sizes.iconContainerLg, height: sizes.iconContainerLg` | `sizes.iconContainerLg` (48) |
| `index.tsx` | `academyIconContainer` | `width: 40, height: 40` | `width: sizes.iconContainerMd, height: sizes.iconContainerMd` | `sizes.iconContainerMd` (40) |
| `index.tsx` | `progressCircle` | `width: 52, height: 52` | Keep as custom (between token sizes) | Local `52` |
| `solve.tsx` | `problemNumberButton` | `width: 36, height: 36` | `width: 44, height: 44` | `tabletSizes.minTouchTarget` (44) |
| `solve.tsx` | `navArrowButton` | `width: 36, height: 36` | `width: 44, height: 44` | `tabletSizes.minTouchTarget` (44) |
| `solve.tsx` | `backButton` | `width: 40, height: 40` | `width: sizes.iconContainerMd, height: sizes.iconContainerMd` | `sizes.iconContainerMd` (40) |
| `analytics.tsx` | `statIconContainer` | `width: 40, height: 40` | `width: sizes.iconContainerMd, height: sizes.iconContainerMd` | `sizes.iconContainerMd` (40) |
| `profile.tsx` | Avatar `size` | `80` | Keep as custom `80` | Local (profile hero) |
| `profile.tsx` | `menuIconContainer` | `width: 36, height: 36` | `width: sizes.iconContainerSm, height: sizes.iconContainerSm` | `sizes.iconContainerSm` (32) |

> **Note on size discrepancies**: Some current sizes (44 -> 48, 36 -> 32) will change slightly when mapped to the nearest token. This is intentional for consistency. If a specific size must be preserved for design reasons, keep a local override with a comment referencing the token system.

---

## 16. Acceptance Criteria

### Must Pass (blocking)

- [ ] **AC-01**: Tab bar active tint uses `roleColors.student.accent` (blue)
- [ ] **AC-02**: Tab bar labels render in Noto Sans KR Medium
- [ ] **AC-03**: Zero hardcoded `fontFamily: 'System'` or missing `fontFamily` in any student screen style
- [ ] **AC-04**: Zero hardcoded shadow properties (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`) outside of `shadows.*` token usage
- [ ] **AC-05**: Zero hardcoded hex opacity suffixes (e.g., `+ '15'`, `+ '20'`, `+ '30'`) outside of `opacityToHex()` usage
- [ ] **AC-06**: Wrong notes screen uses `<EmptyState>` component instead of inline empty markup
- [ ] **AC-07**: Wrong notes screen uses `<SkeletonLoader>` instead of `<ActivityIndicator>`
- [ ] **AC-08**: Homework screen has `ListEmptyComponent` with `<EmptyState>`
- [ ] **AC-09**: Materials screen has `ListEmptyComponent` with `<EmptyState>`
- [ ] **AC-10**: All background colors use `colors.background` (no `'#F8F9FA'` or `'#F5F6F8'`)
- [ ] **AC-11**: TypeScript compilation passes: `npx tsc --noEmit`
- [ ] **AC-12**: All existing navigation flows still work (dashboard -> solve, dashboard -> analytics, homework -> solve, wrong-notes -> review mode, profile -> logout)

### Should Pass (non-blocking, high priority)

- [ ] **AC-13**: Solve screen problem number buttons have minimum 44px touch target
- [ ] **AC-14**: Solve screen has submit confirmation dialog
- [ ] **AC-15**: Solve screen has timer display
- [ ] **AC-16**: Wrong notes screen has mastery progress bar
- [ ] **AC-17**: Analytics screen passes `chartColors` to chart components
- [ ] **AC-18**: Analytics `AnalysisSkeleton` upgraded to reanimated

### Nice to Have (non-blocking)

- [ ] **AC-19**: Dashboard shows `SkeletonDashboard` during loading (requires store integration)
- [ ] **AC-20**: Homework screen shows `SkeletonLoader` during loading (requires store integration)
- [ ] **AC-21**: Materials screen shows `SkeletonLoader` during loading (requires store integration)

---

## 17. Testing Checklist

### Per-Screen Visual Verification

For each of the 8 files, verify on both tablet (>768px) and mobile (375px):

| Screen | Noto Sans KR | Role Accent | Shadows | Opacity Tokens | Sizes | Empty State | Skeleton | Nav Works |
|--------|-------------|-------------|---------|----------------|-------|-------------|----------|-----------|
| `_layout.tsx` | Tab labels | Tab active tint | N/A | N/A | N/A | N/A | N/A | All tabs |
| `index.tsx` | All text | Progress card bg | sm on cards | All hex suffixes | Icon containers | N/A (always data) | Optional | Solve, Analytics, Homework links |
| `homework.tsx` | All text | N/A | N/A | Chip bg, banner bg | N/A | Yes (empty list) | Optional | Solve link |
| `solve.tsx` | All text | Active problem btn | N/A | Badge bg | Button sizes 44px | N/A | N/A | Back nav, submit |
| `wrong-notes.tsx` | All text | N/A | FAB shadow | N/A | N/A | Yes (replaces inline) | Yes (replaces spinner) | Review mode |
| `materials.tsx` | All text | N/A | N/A | N/A | N/A | Yes (empty list) | Optional | N/A |
| `profile.tsx` | All text | N/A | sm on cards | Icon bg | Avatar | N/A | N/A | Logout |
| `analytics.tsx` | All text | N/A | sm on cards | Icon bg, badge bg | Icon containers | Exists already | Upgrade reanimated | Chart renders |

### Automated Verification

```bash
# 1. TypeScript compilation
npx tsc --noEmit

# 2. Search for remaining hardcoded font sizes in student files
# (should return 0 results outside of theme.ts)
grep -rn "fontSize: [0-9]" app/\(student\)/ --include="*.tsx"
# Expected: Only fontSize overrides that intentionally differ from token (e.g., fontSize: 36 on progressPercent)

# 3. Search for remaining inline shadows
grep -rn "shadowColor:" app/\(student\)/ --include="*.tsx"
# Expected: 0 results

# 4. Search for remaining hardcoded backgrounds
grep -rn "'#F8F9FA'\|'#F5F6F8'" app/\(student\)/ --include="*.tsx"
# Expected: 0 results

# 5. Search for remaining hex opacity suffixes
grep -rn "+ '15'\|+ '20'\|+ '30'" app/\(student\)/ --include="*.tsx"
# Expected: 0 results

# 6. Verify EmptyState usage
grep -rn "EmptyState" app/\(student\)/ --include="*.tsx"
# Expected: homework.tsx, wrong-notes.tsx, materials.tsx

# 7. Verify SkeletonLoader usage
grep -rn "SkeletonLoader\|SkeletonDashboard" app/\(student\)/ --include="*.tsx"
# Expected: wrong-notes.tsx at minimum
```

### Platform Testing

- [ ] **iOS Simulator** (iPad 10th gen): All screens render correctly, Noto Sans KR visible
- [ ] **Android Emulator** (tablet): All screens render correctly, elevation shadows visible
- [ ] **Expo Web** (Chrome, 1024px width): All screens render correctly, web font fallback works
- [ ] **Mobile** (375px width): Single-column layout, no overflow, touch targets adequate

---

## Summary of All Files Modified in This Section

| # | File Path | Changes |
|---|-----------|---------|
| 1 | `app/(student)/_layout.tsx` | Role accent tab tint, Noto Sans KR tab labels |
| 2 | `app/(student)/index.tsx` | Full typography migration, shadow tokens, opacity tokens, size tokens, role accent on progress card, SkeletonDashboard (optional) |
| 3 | `app/(student)/homework.tsx` | Typography tokens, opacity tokens, filter chip font, EmptyState, SkeletonLoader (optional) |
| 4 | `app/(student)/solve.tsx` | Typography tokens, opacity tokens, role accent active button, 44px touch targets, timer display, submit confirmation dialog |
| 5 | `app/(student)/wrong-notes.tsx` | Typography tokens, replace inline empty with EmptyState, replace ActivityIndicator with SkeletonLoader, shadow token on FAB, mastery progress bar |
| 6 | `app/(student)/materials.tsx` | Typography tokens, EmptyState, SkeletonLoader (optional), searchbar font |
| 7 | `app/(student)/profile.tsx` | Typography tokens, opacity tokens, shadow tokens, avatar sizing, background color |
| 8 | `app/(student)/analytics.tsx` | Typography tokens, shadow tokens, opacity tokens, size tokens, chartColors integration, AnalysisSkeleton reanimated upgrade, background color |

**Additionally touched** (shared with other sections):
- `src/components/analytics/AnalysisSkeleton.tsx` - Migrate from `Animated` to `react-native-reanimated`


---

## Embedded Section: Section 05-teacher-screens

# Section 05: Teacher Screens - UI Enhancement

<!-- SECTION_META
id: section-05-teacher-screens
depends_on: [section-01-design-tokens, section-02-common-components]
blocks: []
parallelizable: true
files_modified: 7
estimated_effort: Large
END_SECTION_META -->

---

## 1. Background

Mathpia is a Korean math tutoring tablet application built for private academies (hagwon). The teacher role encompasses six primary screens plus a tab layout, providing dashboard overview, student management, assignment management, grading, a problem bank, and per-student analytics.

Currently, these screens suffer from the same issues present across the entire application:

- **Hardcoded font sizes**: Values range from `11px` to `28px` scattered inline with no reference to the theme typography scale
- **No custom Korean font**: System font renders Korean text inconsistently across Android, iOS, and web
- **No role color differentiation**: All screens use the same `#4A90D9` blue, with no visual indicator that the user is in the teacher experience
- **Inline opacity and shadows**: Raw `rgba()` values and `shadowColor`/`shadowOffset`/`shadowOpacity` properties appear throughout
- **No skeleton loading states**: Only `ActivityIndicator` spinners appear during data loading
- **Inline empty states**: Hand-built empty views with inconsistent styling instead of a reusable component
- **Inconsistent component sizing**: Avatar sizes (40, 48, 50), icon containers, and badges use arbitrary pixel values

The teacher role accent color is **indigo** (`#5C6BC0`), distinguishing it from the student blue (`#4A90D9`) and parent green (`#66BB6A`).

---

## 2. Requirements

### 2.1 Functional Requirements

1. All 7 teacher files must use the design token system exclusively -- no hardcoded font sizes, font weights, shadow properties, or opacity values
2. The teacher tab bar active tint must use the indigo role accent (`#5C6BC0`)
3. Tab bar labels must use Noto Sans KR Medium at 12px
4. Every data-loading screen must display `SkeletonLoader` instead of `ActivityIndicator`
5. Every screen that can have zero data must display the `EmptyState` component with appropriate Korean text, icon, and optional action button
6. The dashboard must surface a "needs attention" alert card when student completion rates are low
7. The grading screen must have touch-friendly correct/incorrect buttons (minimum 44px touch target)
8. All `colors.primary` references in role-specific contexts must be replaced with `roleColors.teacher.accent` or the `accent` value from `useRoleTheme()`

### 2.2 Non-Functional Requirements

1. No business logic changes -- only style and presentation modifications
2. No new backend calls -- data structures and store interactions remain identical
3. TypeScript must continue to compile cleanly (`npx tsc --noEmit`)
4. Performance must not degrade on mid-range Android tablets

---

## 3. Dependencies

### 3.1 Required from Section 01 (Design Tokens)

The following exports from `src/constants/theme.ts` must exist before this section can be implemented:

```typescript
// Typography tokens (semantic scale)
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

// Role-based accent colors
export const roleColors = {
  teacher: {
    accent: '#5C6BC0',       // Indigo
    accentLight: '#8E99D6',
    accentDark: '#3949AB',
    accentSubtle: 'rgba(92, 107, 192, 0.08)',
    accentMuted: 'rgba(92, 107, 192, 0.16)',
  },
  student: { /* ... */ },
  parent: { /* ... */ },
} as const;

// Shadow tokens
export const shadows: Record<string, ViewStyle> = {
  none: {},
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 6 },
};

// Opacity tokens
export const opacity = {
  subtle: 0.08,
  muted: 0.16,
  medium: 0.38,
  high: 0.60,
  veryHigh: 0.80,
  full: 1.0,
} as const;

export function opacityToHex(value: number): string;

// Size tokens
export const sizes = {
  iconSm: 20, iconMd: 24, iconLg: 32, iconXl: 40,
  avatarSm: 32, avatarMd: 48, avatarLg: 64,
  iconContainerSm: 32, iconContainerMd: 40, iconContainerLg: 48,
  badgeSm: 20, badgeMd: 28, badgeLg: 36,
  progressRingSm: 44, progressRingMd: 64, progressRingLg: 88,
  buttonSm: 36, buttonMd: 44, buttonLg: 52,
} as const;

// Chart color tokens
export const chartColors = {
  primaryFill: 'rgba(74, 144, 217, 0.25)',
  primaryStroke: '#4A90D9',
  secondaryFill: 'rgba(92, 107, 192, 0.25)',
  secondaryStroke: '#5C6BC0',
  grid: '#E0E0E0',
  label: '#212121',
  valueLabel: '#757575',
  successFill: 'rgba(76, 175, 80, 0.25)',
  successStroke: '#4CAF50',
  warningFill: 'rgba(255, 152, 0, 0.25)',
  warningStroke: '#FF9800',
  errorFill: 'rgba(244, 67, 54, 0.25)',
  errorStroke: '#F44336',
  heatLow: '#E8F5E9',
  heatMid: '#FFF9C4',
  heatHigh: '#FFCDD2',
} as const;
```

The `useRoleTheme()` hook from `src/hooks/useRoleTheme.ts` must exist:

```typescript
export function useRoleTheme(): {
  accent: string;
  accentLight: string;
  accentDark: string;
  accentSubtle: string;
  accentMuted: string;
  roleName: 'teacher' | 'student' | 'parent';
};
```

### 3.2 Required from Section 02 (Common Components)

The following components from `src/components/common/` must exist:

```typescript
// SkeletonLoader with reanimated shimmer animation
export function SkeletonLoader(props: SkeletonLoaderProps): JSX.Element;
export function SkeletonStatCard(props: { style?: ViewStyle }): JSX.Element;
export function SkeletonListItem(props: { style?: ViewStyle }): JSX.Element;
export function SkeletonDashboard(): JSX.Element;

// EmptyState with icon, title, description, and optional action button
export function EmptyState(props: EmptyStateProps): JSX.Element;

// Enhanced Button with size variants (sm | md | lg)
export const Button: React.FC<ButtonProps>;

// Enhanced Card with reanimated touch scale feedback
export const Card: React.FC<CardProps>;
```

### 3.3 Existing Dependencies (already installed)

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native-paper` | ^5.14.5 | MD3 UI components (Text, Avatar, Chip, FAB, Badge, Searchbar, etc.) |
| `expo-router` | ^6.0.21 | Tab layout, navigation |
| `@expo/vector-icons` | ^15.0.3 | MaterialCommunityIcons |
| `react-native-reanimated` | ^4.2.1 | Used by Card touch feedback and SkeletonLoader |
| `zustand` | ^5.0.9 | State management (authStore, problemBankStore, analyticsStore) |
| `react-native-svg` | ^15.15.1 | Charts (BarChart, HeatMap, RadarChart) |

---

## 4. Files to Modify

| # | File Path | Description |
|---|-----------|-------------|
| 1 | `app/(teacher)/_layout.tsx` | Tab layout: role accent, font family |
| 2 | `app/(teacher)/index.tsx` | Dashboard: token migration, role accent, stat cards, quick actions, attention card |
| 3 | `app/(teacher)/students.tsx` | Students: avatar, search/filter, EmptyState, SkeletonLoader |
| 4 | `app/(teacher)/assignments.tsx` | Assignments: progress bar, SkeletonLoader, EmptyState |
| 5 | `app/(teacher)/grading.tsx` | Grading: one-touch UI, EmptyState |
| 6 | `app/(teacher)/problem-bank.tsx` | Problem Bank: filter, EmptyState, SkeletonLoader |
| 7 | `app/(teacher)/student-analytics.tsx` | Student Analytics: chartColors, SkeletonLoader |

---

## 5. Implementation Details

### 5.1 Teacher Tab Layout (`app/(teacher)/_layout.tsx`)

#### Current State

```typescript
// Current: uses colors.primary (blue #4A90D9) for all active tints
tabBarActiveTintColor: colors.primary,
tabBarLabelStyle: {
  fontSize: 12,
  fontWeight: '500',
},
```

#### Changes

1. **Import role colors** from the theme
2. **Replace active tint color** with `roleColors.teacher.accent` (indigo `#5C6BC0`)
3. **Add Noto Sans KR font family** to tab bar labels

#### Target Implementation

```typescript
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tabletSizes, roleColors } from '../../src/constants/theme';

export default function TeacherLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: roleColors.teacher.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          height: tabletSizes.tabBarHeight,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: 'NotoSansKR-Medium',
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      {/* All Tabs.Screen declarations remain identical */}
      <Tabs.Screen
        name="index"
        options={{
          title: '\uB300\uC2DC\uBCF4\uB4DC',
          tabBarLabel: '\uB300\uC2DC\uBCF4\uB4DC',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: '\uD559\uC0DD \uAD00\uB9AC',
          tabBarLabel: '\uD559\uC0DD \uAD00\uB9AC',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: '\uC219\uC81C \uAD00\uB9AC',
          tabBarLabel: '\uC219\uC81C \uAD00\uB9AC',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          title: '\uAC15\uC758\uC790\uB8CC',
          tabBarLabel: '\uAC15\uC758\uC790\uB8CC',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="folder-open" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grading"
        options={{
          title: '\uCC44\uC810',
          tabBarLabel: '\uCC44\uC810',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="problem-extract" options={{ href: null }} />
      <Tabs.Screen name="problem-bank" options={{ href: null }} />
      <Tabs.Screen name="student-analytics" options={{ href: null }} />
    </Tabs>
  );
}
```

#### Style Change Summary

| Property | Before | After |
|----------|--------|-------|
| `tabBarActiveTintColor` | `colors.primary` (`#4A90D9`) | `roleColors.teacher.accent` (`#5C6BC0`) |
| `tabBarLabelStyle.fontFamily` | (none / system) | `'NotoSansKR-Medium'` |

---

### 5.2 Teacher Dashboard (`app/(teacher)/index.tsx`)

#### Current State Analysis

The dashboard currently has:
- **Header**: Avatar (size 48, blue background), greeting (fontSize 20, fontWeight 600), subGreeting (fontSize 14)
- **StatCard**: Icon (size 32), statValue (fontSize 28, fontWeight bold), statTitle (fontSize 14)
- **QuickAction**: Icon (size 28, blue color), text (fontSize 14, fontWeight 500)
- **Recent submissions**: Avatar (size 40), student name (fontSize 16, fontWeight 500), assignment (fontSize 14), time (fontSize 12)
- **Section titles**: fontSize 18, fontWeight 600
- All use `colors.primary` (blue) for accents

#### Changes

1. **Import additions**:
   ```typescript
   import {
     colors, spacing, tabletSizes,
     typography, roleColors, shadows, sizes, opacityToHex, opacity
   } from '../../src/constants/theme';
   import { useRoleTheme } from '../../src/hooks';
   import { SkeletonDashboard, EmptyState } from '../../src/components/common';
   ```

2. **Use `useRoleTheme()` hook** inside the component:
   ```typescript
   const { accent, accentLight, accentDark, accentSubtle, accentMuted } = useRoleTheme();
   ```

3. **Typography token replacements**:

   | Style Name | Before | After |
   |------------|--------|-------|
   | `greeting` | `fontSize: 20, fontWeight: '600'` | `...typography.heading3` (22px Medium) |
   | `subGreeting` | `fontSize: 14` | `...typography.bodySmall` |
   | `sectionTitle` | `fontSize: 18, fontWeight: '600'` | `...typography.subtitle, fontWeight: '700'` |
   | `statValue` | `fontSize: 28, fontWeight: 'bold'` | `...typography.heading2` |
   | `statTitle` | `fontSize: 14` | `...typography.bodySmall` |
   | `quickActionText` | `fontSize: 14, fontWeight: '500'` | `...typography.label` |
   | `submissionStudent` | `fontSize: 16, fontWeight: '500'` | `...typography.subtitle` |
   | `submissionAssignment` | `fontSize: 14` | `...typography.bodySmall` |
   | `submissionTime` | `fontSize: 12` | `...typography.caption` |

4. **Role accent color replacements**:

   | Location | Before | After |
   |----------|--------|-------|
   | `avatar` backgroundColor | `colors.primary` | `accent` (from useRoleTheme) |
   | `StatCard` icon color prop | `colors.primary` (for "total students" card) | `accent` |
   | `QuickAction` icon color | `colors.primary` | `accent` |
   | `submissionAvatar` backgroundColor | `colors.secondary` | `accentLight` |
   | `fab` backgroundColor (if added) | `colors.primary` | `accent` |

5. **Size token replacements**:

   | Location | Before | After |
   |----------|--------|-------|
   | Avatar in header | `size={48}` | `size={sizes.avatarMd}` |
   | StatCard icon | `size={32}` | `size={sizes.iconLg}` |
   | QuickAction icon | `size={28}` | `size={sizes.iconLg}` (closest standard, or keep 28) |
   | Submission avatar | `size={40}` | `size={sizes.iconContainerMd}` |
   | StatCard `minWidth: 150` | hardcoded | responsive via `useResponsive()` columns |

6. **Shadow token replacements**:

   | Location | Before | After |
   |----------|--------|-------|
   | Cards (via Card component) | Inline in PaperCard | Already handled by enhanced Card component |
   | StatCard `borderRadius: 12` | hardcoded | `borderRadius: borderRadius.lg` |

7. **New: "Attention Needed" alert card**:

   Add below the stats grid, conditionally rendered when any student has a low completion rate. This uses mock data for now (matching the existing mock pattern):

   ```typescript
   {/* Attention card -- shown when any student completion is below 60% */}
   {stats.submissionsToGrade > 10 && (
     <Card style={styles.attentionCard}>
       <View style={styles.attentionContent}>
         <View style={[styles.attentionIconContainer, { backgroundColor: colors.error + opacityToHex(opacity.subtle) }]}>
           <MaterialCommunityIcons name="alert-circle-outline" size={sizes.iconLg} color={colors.error} />
         </View>
         <View style={styles.attentionText}>
           <Text style={styles.attentionTitle}>주의 필요</Text>
           <Text style={styles.attentionDescription}>
             채점 대기 중인 제출물이 {stats.submissionsToGrade}개 있습니다
           </Text>
         </View>
         <MaterialCommunityIcons name="chevron-right" size={sizes.iconMd} color={colors.textSecondary} />
       </View>
     </Card>
   )}
   ```

   New styles for the attention card:
   ```typescript
   attentionCard: {
     marginTop: spacing.md,
     borderLeftWidth: 4,
     borderLeftColor: colors.error,
   },
   attentionContent: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   attentionIconContainer: {
     width: sizes.iconContainerLg,
     height: sizes.iconContainerLg,
     borderRadius: borderRadius.lg,
     justifyContent: 'center',
     alignItems: 'center',
   },
   attentionText: {
     flex: 1,
     marginLeft: spacing.md,
   },
   attentionTitle: {
     ...typography.subtitle,
     fontWeight: '700',
     color: colors.error,
   },
   attentionDescription: {
     ...typography.bodySmall,
     color: colors.textSecondary,
   },
   ```

#### Full Updated StyleSheet

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // avatar backgroundColor set dynamically: { backgroundColor: accent }
  headerInfo: {
    marginLeft: spacing.md,
  },
  greeting: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  subGreeting: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: borderRadius.lg,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: spacing.md,
  },
  statValue: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  statTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    minWidth: 140,
  },
  quickActionContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  quickActionText: {
    ...typography.label,
    marginTop: spacing.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  submissionCard: {
    marginVertical: spacing.xs,
  },
  submissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // submissionAvatar backgroundColor set dynamically: { backgroundColor: accentLight }
  submissionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  submissionStudent: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  submissionAssignment: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  submissionTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  attentionCard: {
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  attentionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attentionIconContainer: {
    width: sizes.iconContainerLg,
    height: sizes.iconContainerLg,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attentionText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  attentionTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.error,
  },
  attentionDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
});
```

---

### 5.3 Students Screen (`app/(teacher)/students.tsx`)

#### Current State Analysis

- **Header**: title (fontSize 28, fontWeight bold), subtitle (fontSize 14)
- **Student card**: Avatar.Text (size 50, blue), studentName (fontSize 18, fontWeight 600), gradeChip (blue background), studentEmail (fontSize 14), progressText (fontSize 12)
- **Search bar**: searchbar borderRadius 12
- **Progress bar**: Custom View-based, success green fill
- **FAB**: blue background
- **No EmptyState**: No handling for empty filtered list
- **No SkeletonLoader**: No loading state

#### Changes

1. **Import additions**:
   ```typescript
   import {
     colors, spacing, typography, roleColors, borderRadius, shadows, sizes
   } from '../../src/constants/theme';
   import { useRoleTheme } from '../../src/hooks';
   import { Card, EmptyState, SkeletonListItem } from '../../src/components/common';
   ```

2. **Add loading state**:
   ```typescript
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
     // Simulate data loading
     const timer = setTimeout(() => setIsLoading(false), 500);
     return () => clearTimeout(timer);
   }, []);
   ```

3. **Typography token replacements**:

   | Style Name | Before | After |
   |------------|--------|-------|
   | `title` | `fontSize: 28, fontWeight: 'bold'` | `...typography.heading2` |
   | `subtitle` | `fontSize: 14` | `...typography.bodySmall` |
   | `studentName` | `fontSize: 18, fontWeight: '600'` | `...typography.subtitle, fontWeight: '700'` |
   | `studentEmail` | `fontSize: 14` | `...typography.bodySmall` |
   | `progressText` | `fontSize: 12` | `...typography.caption` |

4. **Role accent color replacements**:

   | Location | Before | After |
   |----------|--------|-------|
   | `avatar` backgroundColor | `colors.primary` | `accent` (from useRoleTheme) |
   | `gradeChip` backgroundColor | `colors.primaryLight` | `accentLight` |
   | `fab` backgroundColor | `colors.primary` | `accent` |

5. **Size token replacements**:

   | Location | Before | After |
   |----------|--------|-------|
   | Avatar.Text size | `50` | `sizes.avatarMd` (48, standard size) |

6. **Search bar font family**:
   ```typescript
   searchbar: {
     backgroundColor: colors.surfaceVariant,
     borderRadius: borderRadius.lg,
     fontFamily: 'NotoSansKR-Regular',
   },
   ```

7. **EmptyState for empty filtered results**:
   ```typescript
   // Replace the bare FlatList with conditional rendering:
   {isLoading ? (
     <View style={styles.listContent}>
       <SkeletonListItem style={{ marginBottom: spacing.md }} />
       <SkeletonListItem style={{ marginBottom: spacing.md }} />
       <SkeletonListItem style={{ marginBottom: spacing.md }} />
       <SkeletonListItem style={{ marginBottom: spacing.md }} />
       <SkeletonListItem />
     </View>
   ) : filteredStudents.length === 0 ? (
     <EmptyState
       icon="account-group-outline"
       title="학생이 없습니다"
       description={
         searchQuery || selectedGrade !== 'all'
           ? '검색 조건에 맞는 학생이 없습니다. 필터를 변경해보세요.'
           : '학생을 추가하여 관리를 시작하세요'
       }
       actionLabel={!searchQuery && selectedGrade === 'all' ? '학생 추가' : undefined}
       onAction={!searchQuery && selectedGrade === 'all' ? () => {/* TODO */} : undefined}
     />
   ) : (
     <FlatList
       data={filteredStudents}
       keyExtractor={(item) => item.id}
       renderItem={renderStudent}
       contentContainerStyle={styles.listContent}
       showsVerticalScrollIndicator={false}
     />
   )}
   ```

8. **Progress bar color**: Use `accent` from `useRoleTheme()` for the progress fill instead of `colors.success`:
   ```typescript
   progressFill: {
     height: '100%',
     backgroundColor: accent, // indigo for teacher context
     borderRadius: 4,
   },
   ```

#### Updated StyleSheet (key changes only)

```typescript
title: {
  ...typography.heading2,
  color: colors.textPrimary,
},
subtitle: {
  ...typography.bodySmall,
  color: colors.textSecondary,
  marginTop: spacing.xs,
},
searchbar: {
  backgroundColor: colors.surfaceVariant,
  borderRadius: borderRadius.lg,
},
studentName: {
  ...typography.subtitle,
  fontWeight: '700',
  color: colors.textPrimary,
  marginRight: spacing.sm,
},
studentEmail: {
  ...typography.bodySmall,
  color: colors.textSecondary,
  marginBottom: spacing.sm,
},
progressText: {
  ...typography.caption,
  color: colors.textSecondary,
  minWidth: 100,
},
// fab backgroundColor set dynamically: { backgroundColor: accent }
```

---

### 5.4 Assignments Screen (`app/(teacher)/assignments.tsx`)

#### Current State Analysis

- **Header**: title (fontSize 28, fontWeight bold), subtitle (fontSize 14)
- **Card**: assignmentTitle (fontSize 18, fontWeight 600), subject (fontSize 14), statText (fontSize 14)
- **Progress**: progressLabel/progressValue (fontSize 14), custom View-based progress bar with `colors.primary` fill
- **Status chips**: Use `getStatusColor(status) + '20'` for opacity (raw hex suffix)
- **FAB**: blue background
- **No EmptyState**: No handling when filteredAssignments is empty
- **No SkeletonLoader**: No loading state

#### Changes

1. **Import additions**:
   ```typescript
   import {
     colors, spacing, typography, roleColors, borderRadius, shadows, sizes, opacityToHex, opacity
   } from '../../src/constants/theme';
   import { useRoleTheme } from '../../src/hooks';
   import { Card, EmptyState, SkeletonLoader } from '../../src/components/common';
   ```

2. **Add loading state**:
   ```typescript
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
     const timer = setTimeout(() => setIsLoading(false), 500);
     return () => clearTimeout(timer);
   }, []);
   ```

3. **Typography token replacements**:

   | Style Name | Before | After |
   |------------|--------|-------|
   | `title` | `fontSize: 28, fontWeight: 'bold'` | `...typography.heading2` |
   | `subtitle` | `fontSize: 14` | `...typography.bodySmall` |
   | `assignmentTitle` | `fontSize: 18, fontWeight: '600'` | `...typography.subtitle, fontWeight: '700'` |
   | `subject` | `fontSize: 14` | `...typography.bodySmall` |
   | `statText` | `fontSize: 14` | `...typography.bodySmall` |
   | `progressLabel` | `fontSize: 14` | `...typography.bodySmall` |
   | `progressValue` | `fontSize: 14, fontWeight: '500'` | `...typography.label` |

4. **Opacity token replacement**:

   Replace raw hex suffix `+ '20'` in status chip background:
   ```typescript
   // Before:
   { backgroundColor: getStatusColor(item.status) + '20' }

   // After:
   { backgroundColor: getStatusColor(item.status) + opacityToHex(opacity.muted) }
   ```

5. **Progress bar accent color**:
   ```typescript
   // Before:
   progressFill: { backgroundColor: colors.primary }

   // After:
   progressFill: { backgroundColor: roleColors.teacher.accent }
   // Or dynamically: const { accent } = useRoleTheme();
   ```

6. **FAB accent color**:
   ```typescript
   fab: {
     position: 'absolute',
     right: spacing.lg,
     bottom: spacing.lg,
     backgroundColor: roleColors.teacher.accent,
   },
   ```

7. **SkeletonLoader for loading state**:
   ```typescript
   {isLoading ? (
     <View style={styles.listContent}>
       <SkeletonLoader variant="card" height={160} count={3} gap={spacing.md} />
     </View>
   ) : filteredAssignments.length === 0 ? (
     <EmptyState
       icon="clipboard-text-off-outline"
       title="숙제가 없습니다"
       description={
         filter !== 'all'
           ? '선택한 상태에 맞는 숙제가 없습니다'
           : '새 숙제를 만들어 학생들에게 배정하세요'
       }
       actionLabel={filter === 'all' ? '숙제 만들기' : undefined}
       onAction={filter === 'all' ? () => {/* TODO */} : undefined}
     />
   ) : (
     <FlatList
       data={filteredAssignments}
       keyExtractor={(item) => item.id}
       renderItem={renderAssignment}
       contentContainerStyle={styles.listContent}
       showsVerticalScrollIndicator={false}
     />
   )}
   ```

#### Updated StyleSheet (key changes only)

```typescript
title: {
  ...typography.heading2,
  color: colors.textPrimary,
},
subtitle: {
  ...typography.bodySmall,
  color: colors.textSecondary,
  marginTop: spacing.xs,
},
assignmentTitle: {
  ...typography.subtitle,
  fontWeight: '700',
  color: colors.textPrimary,
  marginBottom: spacing.sm,
},
subject: {
  ...typography.bodySmall,
  color: colors.textSecondary,
  marginTop: spacing.sm,
  marginBottom: spacing.md,
},
statText: {
  ...typography.bodySmall,
  color: colors.textSecondary,
},
progressLabel: {
  ...typography.bodySmall,
  color: colors.textSecondary,
},
progressValue: {
  ...typography.label,
  color: colors.textPrimary,
},
progressFill: {
  height: '100%',
  backgroundColor: roleColors.teacher.accent,
  borderRadius: 4,
},
fab: {
  position: 'absolute',
  right: spacing.lg,
  bottom: spacing.lg,
  backgroundColor: roleColors.teacher.accent,
},
```

---

### 5.5 Grading Screen (`app/(teacher)/grading.tsx`)

#### Current State Analysis

- **Header**: title (fontSize 28, fontWeight bold), badge (error background), subtitle (fontSize 14)
- **Submission card**: Avatar.Text (size 48), studentName (fontSize 16, fontWeight 600), assignmentTitle (fontSize 14), metaText (fontSize 12), metaDot (fontSize 12)
- **Grading buttons**: Generic "contained" and "outlined" Button components
- **Inline empty state**: Custom View with icon (size 64) and text (fontSize 18) -- not using the EmptyState component
- **No SkeletonLoader**: No loading state

#### Changes

1. **Import additions**:
   ```typescript
   import {
     colors, spacing, typography, roleColors, borderRadius, shadows, sizes
   } from '../../src/constants/theme';
   import { useRoleTheme } from '../../src/hooks';
   import { Card, Button, EmptyState, SkeletonListItem } from '../../src/components/common';
   ```

2. **Typography token replacements**:

   | Style Name | Before | After |
   |------------|--------|-------|
   | `title` | `fontSize: 28, fontWeight: 'bold'` | `...typography.heading2` |
   | `subtitle` | `fontSize: 14` | `...typography.bodySmall` |
   | `studentName` | `fontSize: 16, fontWeight: '600'` | `...typography.subtitle` |
   | `assignmentTitle` | `fontSize: 14` | `...typography.bodySmall` |
   | `metaText` | `fontSize: 12` | `...typography.caption` |
   | `metaDot` | `fontSize: 12` | `...typography.caption` |
   | `emptyText` | `fontSize: 18` | (removed -- replaced by EmptyState) |

3. **Size token replacements**:

   | Location | Before | After |
   |----------|--------|-------|
   | Avatar.Text size | `48` | `sizes.avatarMd` |

4. **Replace inline empty state with EmptyState component**:

   ```typescript
   // Before (lines 128-141 in current file):
   {filteredSubmissions.length === 0 ? (
     <View style={styles.emptyContainer}>
       <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
       <Text style={styles.emptyText}>모든 채점을 완료했습니다!</Text>
     </View>
   ) : ( ... )}

   // After:
   {filteredSubmissions.length === 0 ? (
     <EmptyState
       icon="check-circle-outline"
       title={filter === 'pending'
         ? '채점할 제출물이 없습니다'
         : filter === 'graded'
           ? '채점 완료된 제출물이 없습니다'
           : '제출물이 없습니다'}
       description="학생이 제출하면 여기에 표시됩니다"
       iconColor={filter === 'pending' ? colors.success : colors.textDisabled}
     />
   ) : ( ... )}
   ```

5. **Improve one-touch grading UI**:

   Replace the generic "채점하기" button with explicit correct/incorrect touch-friendly buttons:

   ```typescript
   {item.status === 'pending' ? (
     <View style={styles.gradingActions}>
       <TouchableOpacity
         style={[styles.gradeBtn, styles.gradeBtnCorrect]}
         onPress={() => {/* TODO: mark correct */}}
         accessibilityLabel="정답 처리"
         hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
       >
         <MaterialCommunityIcons name="check-bold" size={sizes.iconMd} color={colors.success} />
       </TouchableOpacity>
       <TouchableOpacity
         style={[styles.gradeBtn, styles.gradeBtnIncorrect]}
         onPress={() => {/* TODO: mark incorrect */}}
         accessibilityLabel="오답 처리"
         hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
       >
         <MaterialCommunityIcons name="close-thick" size={sizes.iconMd} color={colors.error} />
       </TouchableOpacity>
       <Button
         mode="contained"
         size="sm"
         onPress={() => {/* TODO: open detailed grading */}}
         style={styles.detailGradeButton}
       >
         상세
       </Button>
     </View>
   ) : (
     <Button mode="outlined" size="sm" onPress={() => {}} style={styles.viewButton}>
       보기
     </Button>
   )}
   ```

   New styles for one-touch grading:
   ```typescript
   gradingActions: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: spacing.sm,
     marginLeft: spacing.md,
   },
   gradeBtn: {
     width: sizes.iconContainerLg,   // 48px -- meets 44px minimum
     height: sizes.iconContainerLg,
     borderRadius: borderRadius.lg,
     justifyContent: 'center',
     alignItems: 'center',
   },
   gradeBtnCorrect: {
     backgroundColor: colors.success + opacityToHex(opacity.subtle),
   },
   gradeBtnIncorrect: {
     backgroundColor: colors.error + opacityToHex(opacity.subtle),
   },
   detailGradeButton: {
     // Uses Button component with size="sm" (36px height)
   },
   ```

6. **Add SkeletonLoader for loading state** (if loading state is introduced):
   ```typescript
   const [isLoading, setIsLoading] = useState(false);

   // When loading:
   {isLoading && (
     <View style={styles.listContent}>
       <SkeletonListItem style={{ marginBottom: spacing.md }} />
       <SkeletonListItem style={{ marginBottom: spacing.md }} />
       <SkeletonListItem style={{ marginBottom: spacing.md }} />
     </View>
   )}
   ```

7. **Shadow token replacements**: The submission cards use the enhanced Card component which already applies shadows. Remove any manual shadow styles.

#### Updated StyleSheet (key changes only)

```typescript
title: {
  ...typography.heading2,
  color: colors.textPrimary,
},
subtitle: {
  ...typography.bodySmall,
  color: colors.textSecondary,
  marginTop: spacing.xs,
},
studentName: {
  ...typography.subtitle,
  color: colors.textPrimary,
},
assignmentTitle: {
  ...typography.bodySmall,
  color: colors.textSecondary,
  marginBottom: spacing.xs,
},
metaText: {
  ...typography.caption,
  color: colors.textSecondary,
  marginLeft: 4,
},
metaDot: {
  ...typography.caption,
  color: colors.textSecondary,
  marginHorizontal: spacing.xs,
},
// Remove: emptyContainer, emptyText (replaced by EmptyState component)
```

---

### 5.6 Problem Bank Screen (`app/(teacher)/problem-bank.tsx`)

#### Current State Analysis

- **Header**: headerTitle (fontSize 22, fontWeight bold)
- **Loading state**: `ActivityIndicator size="large" color={colors.primary}` (line 264-268)
- **Inline empty state**: Custom View with icon (size 64), emptyTitle (fontSize 18, fontWeight 600), emptySubtitle (fontSize 14) (lines 271-289)
- **Selection bar**: selectedCount (fontSize 16, fontWeight 600)
- **Bottom bar shadow**: Inline `shadowColor: '#000', shadowOffset, shadowOpacity, shadowRadius` (lines 453-456)
- **FAB**: blue background
- **ProblemFilters, ProblemCard, ProblemForm, ProblemDetail**: Separate components in `src/components/problemBank/` -- these are not modified in this section but will inherit font changes through Paper's theme

#### Changes

1. **Import additions**:
   ```typescript
   import {
     colors, spacing, typography, roleColors, borderRadius, shadows, sizes, opacityToHex, opacity
   } from '../../src/constants/theme';
   import { useRoleTheme } from '../../src/hooks';
   import { EmptyState, SkeletonLoader } from '../../src/components/common';
   ```

2. **Typography token replacements**:

   | Style Name | Before | After |
   |------------|--------|-------|
   | `headerTitle` | `fontSize: 22, fontWeight: 'bold'` | `...typography.heading3, fontWeight: '700'` |
   | `emptyTitle` | `fontSize: 18, fontWeight: '600'` | (removed -- replaced by EmptyState) |
   | `emptySubtitle` | `fontSize: 14` | (removed -- replaced by EmptyState) |
   | `selectedCount` | `fontSize: 16, fontWeight: '600'` | `...typography.subtitle` |

3. **Replace `ActivityIndicator` with `SkeletonLoader`**:

   ```typescript
   // Before (lines 264-268):
   {store.isLoading && (
     <View style={styles.loadingOverlay}>
       <ActivityIndicator size="large" color={colors.primary} />
     </View>
   )}

   // After:
   {store.isLoading && (
     <View style={styles.loadingOverlay}>
       <SkeletonLoader variant="card" height={120} count={4} gap={spacing.md} />
     </View>
   )}
   ```

4. **Replace inline empty state with EmptyState component**:

   ```typescript
   // Before (lines 271-289):
   {!store.isLoading && store.filteredProblems.length === 0 && (
     <View style={styles.emptyContainer}>
       <MaterialCommunityIcons name="database-off" size={64} color={colors.textSecondary} />
       <Text style={styles.emptyTitle}>
         {store.problems.length === 0 ? '문제은행이 비어있습니다' : '조건에 맞는 문제가 없습니다'}
       </Text>
       <Text style={styles.emptySubtitle}>
         {store.problems.length === 0 ? 'FAB 버튼으로 문제를 추가해보세요' : '필터 조건을 변경해보세요'}
       </Text>
     </View>
   )}

   // After:
   {!store.isLoading && store.filteredProblems.length === 0 && (
     <EmptyState
       icon="database-off-outline"
       title={store.problems.length === 0 ? '문제가 없습니다' : '조건에 맞는 문제가 없습니다'}
       description={
         store.problems.length === 0
           ? '문제를 추가하여 문제은행을 만드세요'
           : '필터 조건을 변경해보세요'
       }
       actionLabel={store.problems.length === 0 ? '문제 추가' : undefined}
       onAction={store.problems.length === 0 ? openCreateForm : undefined}
     />
   )}
   ```

5. **Replace inline shadow with shadow token**:

   ```typescript
   // Before (bottomBar):
   elevation: 8,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: -3 },
   shadowOpacity: 0.15,
   shadowRadius: 6,

   // After:
   ...shadows.lg,
   ```

6. **FAB accent color**:
   ```typescript
   fab: {
     backgroundColor: roleColors.teacher.accent,
   },
   ```

7. **Remove unused styles**: `emptyContainer`, `emptyTitle`, `emptySubtitle` (now handled by EmptyState). Also remove direct `ActivityIndicator` import from react-native-paper since it is no longer needed.

#### Updated StyleSheet (key changes only)

```typescript
headerTitle: {
  ...typography.heading3,
  fontWeight: '700',
  color: colors.textPrimary,
  flex: 1,
},
loadingOverlay: {
  flex: 1,
  padding: spacing.md,
},
selectedCount: {
  ...typography.subtitle,
  color: colors.textPrimary,
},
bottomBar: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: spacing.lg,
  backgroundColor: colors.surface,
  borderTopWidth: 1,
  borderTopColor: colors.border,
  ...shadows.lg,
},
fab: {
  backgroundColor: roleColors.teacher.accent,
},
```

---

### 5.7 Student Analytics Screen (`app/(teacher)/student-analytics.tsx`)

#### Current State Analysis

This is the most complex teacher screen (408 lines, ~692 with styles). Current issues:

- **Container background**: Hardcoded `'#F8F9FA'` instead of `colors.background`
- **Title**: fontSize 22, fontWeight 700
- **Avatar colors**: Custom View-based avatars (40px and 50px) using `colors.primary` background
- **Student name/grade**: fontSize 16/13/18/20 scattered throughout
- **Stat cards**: statValue (fontSize 20, fontWeight 700), statLabel (fontSize 11)
- **Section titles**: fontSize 18, fontWeight 700
- **AI summary**: fontSize 16 title, fontSize 14 body
- **Inline shadows**: Every card has `shadowColor: '#000', shadowOffset, shadowOpacity, shadowRadius` inline
- **Loading state**: `ActivityIndicator` spinners
- **Error card**: `colors.error + '10'` (raw hex suffix)
- **Partial loading**: `colors.primary + '08'` (raw hex suffix)
- **Chart colors**: Uses chart component defaults (no `chartColors` pass-through)
- **Change student text**: fontSize 13, fontWeight 500

#### Changes

1. **Import additions**:
   ```typescript
   import {
     colors, spacing, borderRadius, tabletSizes,
     typography, roleColors, shadows, sizes, chartColors, opacityToHex, opacity
   } from '../../src/constants/theme';
   import { useRoleTheme } from '../../src/hooks';
   import { Button, SkeletonLoader, SkeletonStatCard } from '../../src/components/common';
   ```

2. **Fix container background**:
   ```typescript
   // Before:
   container: { backgroundColor: '#F8F9FA' }
   // After:
   container: { backgroundColor: colors.background }
   ```

3. **Typography token replacements**:

   | Style Name | Before | After |
   |------------|--------|-------|
   | `title` | `fontSize: 22, fontWeight: '700'` | `...typography.heading3, fontWeight: '700'` |
   | `changeStudentText` | `fontSize: 13, fontWeight: '500'` | `...typography.bodySmall, fontWeight: '500', color: accent` |
   | `studentAvatarText` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700', color: '#FFFFFF'` |
   | `studentName` | `fontSize: 16, fontWeight: '600'` | `...typography.subtitle` |
   | `studentGrade` | `fontSize: 13` | `...typography.bodySmall` |
   | `loadingText` | `fontSize: 14` | `...typography.bodySmall` |
   | `studentAvatarLargeText` | `fontSize: 20, fontWeight: '700'` | `...typography.heading3, fontWeight: '700', color: '#FFFFFF'` |
   | `studentInfoName` | `fontSize: 18, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
   | `studentInfoGrade` | `fontSize: 13` | `...typography.bodySmall` |
   | `statValue` | `fontSize: 20, fontWeight: '700'` | `...typography.heading3, fontWeight: '700'` |
   | `statLabel` | `fontSize: 11` | `...typography.labelSmall` |
   | `sectionTitle` | `fontSize: 18, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
   | `aiSummaryTitle` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
   | `aiSummaryText` | `fontSize: 14, lineHeight: 22` | `...typography.bodySmall, lineHeight: 22` |
   | `errorText` | `fontSize: 14` | `...typography.bodySmall` |
   | `partialLoadingText` | `fontSize: 13` | `...typography.bodySmall` |

4. **Role accent color replacements**:

   | Location | Before | After |
   |----------|--------|-------|
   | `studentAvatar` background | `colors.primary` | `accent` (from useRoleTheme) |
   | `studentAvatarLarge` background | `colors.primary` | `accent` |
   | `studentItemSelected` borderColor | `colors.primary` | `accent` |
   | `changeStudentText` color | `colors.primary` | `accent` |
   | `aiSummaryCard` borderLeftColor | `colors.primary` | `accent` |
   | AI summary icon color | `colors.primary` | `accent` |
   | `partialLoadingText` color | `colors.primary` | `accent` |
   | `ActivityIndicator` color | `colors.primary` | `accent` |

5. **Size token replacements**:

   | Location | Before | After |
   |----------|--------|-------|
   | Student avatar (small) | `width: 40, height: 40, borderRadius: 20` | `width: sizes.iconContainerMd, height: sizes.iconContainerMd, borderRadius: sizes.iconContainerMd / 2` |
   | Student avatar (large) | `width: 50, height: 50, borderRadius: 25` | `width: sizes.avatarMd, height: sizes.avatarMd, borderRadius: sizes.avatarMd / 2` |

6. **Shadow token replacements**:

   All inline shadows replaced with `...shadows.sm`:

   ```typescript
   // Before (repeated in studentInfoBar, statCard, chartCard, aiSummaryCard):
   elevation: 1,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 1 },
   shadowOpacity: 0.1,
   shadowRadius: 2,

   // After:
   ...shadows.sm,
   ```

7. **Opacity token replacements**:

   ```typescript
   // Before:
   errorCard: { backgroundColor: colors.error + '10' }
   partialLoading: { backgroundColor: colors.primary + '08' }

   // After:
   errorCard: { backgroundColor: colors.error + opacityToHex(opacity.subtle) }
   partialLoading: { backgroundColor: accent + opacityToHex(opacity.subtle) }
   ```

8. **Pass `chartColors` to chart components**:

   For teacher context, use the secondary (indigo) as primary chart color:

   ```typescript
   const teacherChartColors = {
     primaryFill: chartColors.secondaryFill,     // indigo fill
     primaryStroke: chartColors.secondaryStroke,  // indigo stroke
   };

   // In BarChart usage:
   <BarChart
     data={barData}
     width={Math.min(width - 48, 600)}
     height={220}
     barColor={teacherChartColors.primaryStroke}
   />

   // In HeatMap usage:
   <HeatMap
     data={learningReport.heatmapData}
     width={Math.min(width - 48, 600)}
     colorLow={chartColors.heatLow}
     colorMid={chartColors.heatMid}
     colorHigh={chartColors.heatHigh}
   />
   ```

   Note: This depends on the chart components accepting these props. If they don't yet, the chart components will need optional color prop additions (covered in chart-related sections).

9. **Replace `ActivityIndicator` loading with SkeletonLoader**:

   ```typescript
   // Before (student list loading):
   {isLoading && studentList.length === 0 ? (
     <View style={styles.loadingContainer}>
       <ActivityIndicator size="large" color={colors.primary} />
       <Text style={styles.loadingText}>학생 목록을 불러오는 중...</Text>
     </View>
   ) : ( ... )}

   // After:
   {isLoading && studentList.length === 0 ? (
     <View style={styles.loadingContainer}>
       <SkeletonLoader variant="listItem" count={5} gap={spacing.sm} />
     </View>
   ) : ( ... )}
   ```

   For the analytics loading state, keep the existing `AnalysisSkeleton` (which will be upgraded to reanimated in Section 04), but ensure it uses the role accent color:

   ```typescript
   {(isLoading || isAnalyzing) && !selectedAnalytics && (
     <AnalysisSkeleton step={analysisStep} />
   )}
   ```

   Add stat card skeleton for when analytics are loading:
   ```typescript
   {isLoading && selectedStudentId && !selectedAnalytics && (
     <View style={styles.statsRow}>
       <SkeletonStatCard style={{ flex: 1 }} />
       <SkeletonStatCard style={{ flex: 1 }} />
       <SkeletonStatCard style={{ flex: 1 }} />
       <SkeletonStatCard style={{ flex: 1 }} />
     </View>
   )}
   ```

#### Updated StyleSheet (key changes only)

```typescript
container: {
  flex: 1,
  backgroundColor: colors.background,  // was '#F8F9FA'
},
title: {
  ...typography.heading3,
  fontWeight: '700',
  color: colors.textPrimary,
  flex: 1,
},
changeStudentText: {
  ...typography.bodySmall,
  fontWeight: '500',
  // color set dynamically: accent from useRoleTheme
},
// studentAvatar backgroundColor set dynamically: accent
studentAvatarText: {
  ...typography.subtitle,
  fontWeight: '700',
  color: '#FFFFFF',
},
studentName: {
  ...typography.subtitle,
  color: colors.textPrimary,
},
studentGrade: {
  ...typography.bodySmall,
  color: colors.textSecondary,
},
loadingText: {
  ...typography.bodySmall,
  color: colors.textSecondary,
},
studentInfoBar: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: colors.surface,
  padding: spacing.md,
  borderRadius: borderRadius.lg,
  marginBottom: spacing.lg,
  ...shadows.sm,
},
// studentAvatarLarge size set via sizes.avatarMd
studentAvatarLargeText: {
  ...typography.heading3,
  fontWeight: '700',
  color: '#FFFFFF',
},
studentInfoName: {
  ...typography.subtitle,
  fontWeight: '700',
  color: colors.textPrimary,
},
studentInfoGrade: {
  ...typography.bodySmall,
  color: colors.textSecondary,
},
statCard: {
  flex: 1,
  backgroundColor: colors.surface,
  borderRadius: borderRadius.lg,
  padding: spacing.md,
  alignItems: 'center',
  ...shadows.sm,
},
statValue: {
  ...typography.heading3,
  fontWeight: '700',
  color: colors.textPrimary,
},
statLabel: {
  ...typography.labelSmall,
  color: colors.textSecondary,
  marginTop: 2,
},
sectionTitle: {
  ...typography.subtitle,
  fontWeight: '700',
  color: colors.textPrimary,
  marginBottom: spacing.sm,
},
chartCard: {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.lg,
  padding: spacing.md,
  ...shadows.sm,
},
aiSummaryCard: {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.lg,
  padding: spacing.md,
  marginTop: spacing.lg,
  borderLeftWidth: 4,
  // borderLeftColor set dynamically: accent
  ...shadows.sm,
},
aiSummaryTitle: {
  ...typography.subtitle,
  fontWeight: '700',
  color: colors.textPrimary,
},
aiSummaryText: {
  ...typography.bodySmall,
  color: colors.textSecondary,
  lineHeight: 22,
},
errorCard: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
  // backgroundColor set dynamically: colors.error + opacityToHex(opacity.subtle)
  padding: spacing.md,
  borderRadius: borderRadius.lg,
  marginBottom: spacing.md,
},
errorText: {
  ...typography.bodySmall,
  color: colors.error,
  flex: 1,
},
partialLoading: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
  // backgroundColor set dynamically: accent + opacityToHex(opacity.subtle)
  padding: spacing.md,
  borderRadius: borderRadius.lg,
  marginTop: spacing.md,
},
partialLoadingText: {
  ...typography.bodySmall,
  // color set dynamically: accent
},
```

---

## 6. Comprehensive Style Migration Reference

This table covers every hardcoded style value across all 7 teacher files and its replacement:

### Font Sizes

| Current Value | Files Using It | Replacement Token |
|---------------|----------------|-------------------|
| `fontSize: 11` | student-analytics (statLabel) | `...typography.labelSmall` |
| `fontSize: 12` | _layout (tabBar), grading (meta), students (progress) | `...typography.caption` |
| `fontSize: 13` | student-analytics (grade, changeStudent, partialLoading) | `...typography.bodySmall` |
| `fontSize: 14` | index (subGreeting, statTitle, quickAction), students (subtitle, email), assignments (subtitle, subject, statText, progressLabel, progressValue), grading (subtitle, assignmentTitle, metaText), problem-bank (emptySubtitle), student-analytics (loadingText, aiSummaryText, errorText) | `...typography.bodySmall` or `...typography.label` |
| `fontSize: 16` | grading (studentName, selectedCount), student-analytics (studentName, avatarText, aiSummaryTitle) | `...typography.subtitle` |
| `fontSize: 18` | index (sectionTitle), students (studentName), assignments (assignmentTitle), grading (emptyText), problem-bank (emptyTitle), student-analytics (sectionTitle, studentInfoName) | `...typography.subtitle` with fontWeight override |
| `fontSize: 20` | index (greeting), student-analytics (statValue, avatarLargeText) | `...typography.heading3` |
| `fontSize: 22` | problem-bank (headerTitle), student-analytics (title) | `...typography.heading3` |
| `fontSize: 28` | index (statValue), students (title), assignments (title), grading (title) | `...typography.heading2` |

### Font Weights

| Current Value | Replacement |
|---------------|-------------|
| `fontWeight: '500'` | Use `NotoSansKR-Medium` via typography token (built into `typography.subtitle`, `typography.label`, etc.) |
| `fontWeight: '600'` | Map to `'700'` (bold) since Noto Sans KR has no 600 weight. Use `fontWeight: '700'` override on Medium tokens |
| `fontWeight: 'bold'` | Use `NotoSansKR-Bold` via `typography.heading2` etc. |
| `fontWeight: '700'` | Use `NotoSansKR-Bold` via typography token |

### Colors (Role Accent)

| Current Value | Context | Replacement |
|---------------|---------|-------------|
| `colors.primary` | Avatar background | `accent` from `useRoleTheme()` |
| `colors.primary` | FAB background | `roleColors.teacher.accent` |
| `colors.primary` | Progress fill | `roleColors.teacher.accent` |
| `colors.primary` | Icon color (QuickAction) | `accent` |
| `colors.primary` | ActivityIndicator | `accent` |
| `colors.primary` | Border highlight | `accent` |
| `colors.primaryLight` | Chip background | `accentLight` |
| `colors.secondary` | Submission avatar | `accentLight` |
| `'#F8F9FA'` | Container background | `colors.background` |

### Shadows

| Files | Current | Replacement |
|-------|---------|-------------|
| student-analytics (6 locations) | Inline shadow properties | `...shadows.sm` |
| problem-bank (bottomBar) | Inline shadow properties | `...shadows.lg` |

### Opacity

| Current Value | Context | Replacement |
|---------------|---------|-------------|
| `+ '20'` | assignments (status chip) | `+ opacityToHex(opacity.muted)` |
| `+ '10'` | student-analytics (error card) | `+ opacityToHex(opacity.subtle)` |
| `+ '08'` | student-analytics (partial loading) | `+ opacityToHex(opacity.subtle)` |

---

## 7. Empty State Specifications

| Screen | Icon | Title | Description | Action Label | Action |
|--------|------|-------|-------------|-------------|--------|
| Students (no filter match) | `account-group-outline` | 학생이 없습니다 | 검색 조건에 맞는 학생이 없습니다. 필터를 변경해보세요. | (none) | - |
| Students (no data) | `account-group-outline` | 학생이 없습니다 | 학생을 추가하여 관리를 시작하세요 | 학생 추가 | Open add student flow |
| Assignments (no filter match) | `clipboard-text-off-outline` | 숙제가 없습니다 | 선택한 상태에 맞는 숙제가 없습니다 | (none) | - |
| Assignments (no data) | `clipboard-text-off-outline` | 숙제가 없습니다 | 새 숙제를 만들어 학생들에게 배정하세요 | 숙제 만들기 | Open assignment creation |
| Grading (pending empty) | `check-circle-outline` | 채점할 제출물이 없습니다 | 학생이 제출하면 여기에 표시됩니다 | (none) | - |
| Grading (graded empty) | `check-circle-outline` | 채점 완료된 제출물이 없습니다 | 학생이 제출하면 여기에 표시됩니다 | (none) | - |
| Problem Bank (no data) | `database-off-outline` | 문제가 없습니다 | 문제를 추가하여 문제은행을 만드세요 | 문제 추가 | `openCreateForm()` |
| Problem Bank (no filter match) | `database-off-outline` | 조건에 맞는 문제가 없습니다 | 필터 조건을 변경해보세요 | (none) | - |

---

## 8. Skeleton Loader Specifications

| Screen | Skeleton Type | Count | Trigger Condition |
|--------|---------------|-------|-------------------|
| Students | `SkeletonListItem` | 5 | `isLoading === true` |
| Assignments | `SkeletonLoader variant="card" height={160}` | 3 | `isLoading === true` |
| Grading | `SkeletonListItem` | 3 | `isLoading === true` (optional, since data is mock) |
| Problem Bank | `SkeletonLoader variant="card" height={120}` | 4 | `store.isLoading === true` |
| Student Analytics (student list) | `SkeletonLoader variant="listItem"` | 5 | `isLoading && studentList.length === 0` |
| Student Analytics (stat cards) | `SkeletonStatCard` | 4 | `isLoading && selectedStudentId && !selectedAnalytics` |
| Student Analytics (charts) | `AnalysisSkeleton` (existing) | 1 | `(isLoading \|\| isAnalyzing) && !selectedAnalytics` |

---

## 9. Acceptance Criteria

### 9.1 Visual Criteria

- [ ] **Tab bar**: Active tab icons and labels render in indigo (`#5C6BC0`), not blue (`#4A90D9`)
- [ ] **Tab bar labels**: Render in Noto Sans KR Medium at 12px
- [ ] **Dashboard greeting**: Uses NotoSansKR-Medium at 22px (heading3)
- [ ] **Dashboard stat values**: Use NotoSansKR-Bold at 28px (heading2)
- [ ] **Dashboard attention card**: Appears with red left border and alert icon when conditions are met
- [ ] **Quick action icons**: Use indigo accent color instead of blue
- [ ] **All avatars**: Use indigo accent background in teacher context
- [ ] **All FABs**: Use indigo accent background
- [ ] **Progress bars**: Use indigo fill color in teacher context
- [ ] **All text**: Renders in Noto Sans KR (no system font fallback visible)
- [ ] **No hardcoded font sizes**: Zero instances of raw `fontSize: <number>` in styled components (outside of typography token definitions)

### 9.2 Functional Criteria

- [ ] **Students EmptyState**: Shows appropriate message when no students match search/filter
- [ ] **Students EmptyState**: Shows "학생 추가" action button when the student list is completely empty
- [ ] **Assignments EmptyState**: Shows appropriate message when no assignments match filter
- [ ] **Assignments EmptyState**: Shows "숙제 만들기" action button when no assignments exist at all
- [ ] **Grading EmptyState**: Shows appropriate context-aware message based on filter state
- [ ] **Problem Bank EmptyState**: Shows "문제 추가" action when bank is empty; shows filter-change prompt when filters yield no results
- [ ] **Problem Bank EmptyState**: The "문제 추가" action button triggers `openCreateForm()`
- [ ] **Grading one-touch buttons**: Correct (green check) and incorrect (red X) buttons are at least 44px touch targets
- [ ] **All navigation**: Routes continue to work (`router.push`, `router.back`)
- [ ] **All store interactions**: Zustand store calls remain unchanged
- [ ] **Logout**: Still functions correctly from dashboard header

### 9.3 Loading State Criteria

- [ ] **Students**: Shows 5 skeleton list items while loading
- [ ] **Assignments**: Shows 3 skeleton cards while loading
- [ ] **Problem Bank**: Shows 4 skeleton cards while `store.isLoading`
- [ ] **Student Analytics**: Shows skeleton list items for student list loading
- [ ] **Student Analytics**: Shows 4 skeleton stat cards while analytics are loading
- [ ] **All skeletons**: Animate with reanimated shimmer (opacity pulse 0.3-0.7)

### 9.4 Technical Criteria

- [ ] **TypeScript**: `npx tsc --noEmit` passes with zero errors
- [ ] **No regression**: All existing functionality (navigation, data display, filtering, search, selection mode, FAB actions, modals) works identically
- [ ] **Imports clean**: No unused imports remain; no circular dependencies introduced
- [ ] **Token consistency**: Every font size, shadow, opacity, and role-specific color uses a design token
- [ ] **Performance**: No visible jank on 60fps tablet rendering with skeleton animations

### 9.5 Cross-File Consistency

- [ ] All 7 files use `roleColors.teacher.accent` (or `accent` from `useRoleTheme()`) for role-specific elements
- [ ] All 7 files import typography tokens from `src/constants/theme`
- [ ] All heading styles use identical typography tokens: heading2 for page titles, heading3 for section titles, subtitle for card titles
- [ ] All body text uses identical tokens: bodySmall for secondary text, caption for timestamps/meta
- [ ] All empty states use the `EmptyState` component (not inline custom views)
- [ ] All loading states use `SkeletonLoader` or `SkeletonListItem`/`SkeletonStatCard` (not `ActivityIndicator`)

---

## 10. Implementation Checklist

Use this checklist to track progress during implementation:

```
[ ] 1. app/(teacher)/_layout.tsx
    [ ] Import roleColors
    [ ] Replace tabBarActiveTintColor with roleColors.teacher.accent
    [ ] Add fontFamily: 'NotoSansKR-Medium' to tabBarLabelStyle
    [ ] Verify all 8 Tabs.Screen declarations remain intact

[ ] 2. app/(teacher)/index.tsx
    [ ] Add imports: typography, roleColors, shadows, sizes, opacityToHex, opacity
    [ ] Add useRoleTheme() hook
    [ ] Replace all fontSize/fontWeight with typography tokens (9 styles)
    [ ] Replace avatar backgroundColor with accent
    [ ] Replace QuickAction icon color with accent
    [ ] Replace submission avatar backgroundColor with accentLight
    [ ] Use sizes.avatarMd for header avatar
    [ ] Use sizes.iconLg for StatCard icon
    [ ] Add attention card JSX and styles
    [ ] Verify navigation still works for all 6 quick actions

[ ] 3. app/(teacher)/students.tsx
    [ ] Add imports: typography, roleColors, borderRadius, shadows, sizes
    [ ] Add useRoleTheme() hook
    [ ] Add isLoading state + useEffect
    [ ] Replace all fontSize/fontWeight with typography tokens (5 styles)
    [ ] Replace avatar backgroundColor with accent
    [ ] Replace gradeChip backgroundColor with accentLight
    [ ] Replace fab backgroundColor with accent
    [ ] Use sizes.avatarMd for Avatar.Text
    [ ] Add SkeletonListItem loading state
    [ ] Add EmptyState for empty results (with conditional messages)
    [ ] Add fontFamily to searchbar
    [ ] Replace progressFill color with accent

[ ] 4. app/(teacher)/assignments.tsx
    [ ] Add imports: typography, roleColors, opacityToHex, opacity
    [ ] Add useRoleTheme() hook
    [ ] Add isLoading state + useEffect
    [ ] Replace all fontSize/fontWeight with typography tokens (7 styles)
    [ ] Replace status chip opacity suffix with opacityToHex(opacity.muted)
    [ ] Replace progressFill color with roleColors.teacher.accent
    [ ] Replace fab backgroundColor with roleColors.teacher.accent
    [ ] Add SkeletonLoader loading state
    [ ] Add EmptyState for empty results

[ ] 5. app/(teacher)/grading.tsx
    [ ] Add imports: typography, roleColors, sizes, opacityToHex, opacity
    [ ] Add useRoleTheme() hook
    [ ] Replace all fontSize/fontWeight with typography tokens (6 styles)
    [ ] Use sizes.avatarMd for Avatar.Text
    [ ] Replace inline empty state with EmptyState component
    [ ] Add one-touch grading buttons (correct/incorrect)
    [ ] Add styles for grading actions (48px touch targets)
    [ ] Remove unused emptyContainer/emptyText styles

[ ] 6. app/(teacher)/problem-bank.tsx
    [ ] Add imports: typography, roleColors, shadows
    [ ] Replace all fontSize/fontWeight with typography tokens (3 styles)
    [ ] Replace ActivityIndicator with SkeletonLoader
    [ ] Replace inline empty state with EmptyState component
    [ ] Replace inline shadow with shadows.lg
    [ ] Replace fab backgroundColor with roleColors.teacher.accent
    [ ] Remove ActivityIndicator from react-native-paper import
    [ ] Remove unused emptyContainer/emptyTitle/emptySubtitle styles

[ ] 7. app/(teacher)/student-analytics.tsx
    [ ] Add imports: typography, roleColors, shadows, sizes, chartColors, opacityToHex, opacity
    [ ] Add useRoleTheme() hook
    [ ] Fix container background: '#F8F9FA' -> colors.background
    [ ] Replace all fontSize/fontWeight with typography tokens (15+ styles)
    [ ] Replace all avatar background colors with accent
    [ ] Replace all inline shadows with shadows.sm (6 locations)
    [ ] Replace opacity suffixes with opacityToHex
    [ ] Use sizes tokens for avatar dimensions
    [ ] Replace ActivityIndicator loading with SkeletonLoader
    [ ] Add SkeletonStatCard row for analytics loading
    [ ] Pass chartColors to BarChart and HeatMap (if props available)
    [ ] Replace AI summary border/icon colors with accent
```

---

## 11. Risk Notes

### 11.1 Mock Data Dependency

The teacher dashboard, students screen, and grading screen all use mock data arrays defined inline. The attention card logic (`stats.submissionsToGrade > 10`) relies on this mock data. When real data integration occurs, these thresholds and conditions must be re-evaluated.

### 11.2 Chart Component Props

Section 5.7 specifies passing `chartColors` to BarChart and HeatMap. If these chart components do not yet accept optional color props, those props must be added to the chart components first (this may be done in Section 01 or as a parallel task). If the props are not available, the chart components will continue using their internal default colors, which is an acceptable temporary state.

### 11.3 ProblemBank Sub-Components

The Problem Bank screen delegates rendering to `ProblemCard`, `ProblemFilters`, `ProblemForm`, and `ProblemDetail` components in `src/components/problemBank/`. These sub-components are **not** modified in this section. They will inherit font changes through react-native-paper's theme configuration, but their internal hardcoded styles (if any) will need separate attention.

### 11.4 useRoleTheme Dynamic vs Static

For styles that must be in `StyleSheet.create()` (static), use `roleColors.teacher.accent` directly. For styles applied inline in JSX (dynamic), use `accent` from the `useRoleTheme()` hook. This distinction is necessary because `StyleSheet.create()` runs at module load time before hooks are available.

### 11.5 TouchableOpacity Import

The grading screen one-touch buttons require `TouchableOpacity` from `react-native`. Ensure this is added to the import statement if not already present.


---

## Embedded Section: Section 06-parent-screens

# Section 06: Parent Screens

> **Phase**: 6 of 8
> **Scope**: All 4 parent-role files -- tab layout, dashboard, schedule, report
> **Depends on**: section-01-design-tokens, section-02-common-components
> **Blocks**: Nothing (parallelizable with sections 03, 04, 05, 07, 08)
> **Estimated effort**: Medium (4 screen files + 4 subcomponent files)

---

## 1. Background

### 1.1 What Is the Parent Role in Mathpia?

Mathpia serves Korean math tutoring academies (hagwon). Parents (학부모) are one of three user roles. They do **not** solve problems or assign homework. Their entire experience is read-only monitoring of their child's progress:

- **Dashboard (홈)**: Overview of child's weekly learning stats, homework progress, weak topics, and AI advice.
- **Schedule (스케줄)**: Weekly class timetable, upcoming homework deadlines, and recent grading notifications.
- **Report (리포트)**: Detailed charts (radar for subject competency, line for score trend), wrong-answer analysis, AI diagnosis with strengths/weaknesses/recommendations, and a monthly summary card.

The parent role has only **3 tabs** (vs. 5 for student, 5+ for teacher), making it the smallest screen group but one that requires the highest visual polish because parents are the academy's paying customers.

### 1.2 Why This Phase Matters

Parents judge the academy's professionalism by the quality of the reporting UI. The current parent screens suffer from the same prototype-quality issues as the rest of the app:

| Problem | Where It Appears | Severity |
|---------|-----------------|----------|
| Hardcoded `fontSize` values (10px - 22px) | All 4 files + 4 subcomponents | Critical |
| System font instead of Noto Sans KR | All text elements | Critical |
| No role color differentiation | Tab bar and accent cards use generic blue `#4A90D9` | High |
| Inline `rgba()` opacity values | Weekly stats card, calendar, report cards | High |
| Hardcoded hex opacity suffixes (`+ '15'`, `+ '20'`, `+ '30'`) | ChildStatsCard, ChildSelector, ScheduleCalendar, ParentReportCard | High |
| `ActivityIndicator` spinner instead of skeleton loader | Dashboard loading, report AI loading | High |
| No empty state UI | Schedule screen has no "no data" fallback | Medium |
| Hardcoded chart colors | RadarChart and LineChart use local `CHART_COLORS` | Medium |
| `useWindowDimensions` used directly instead of `useResponsive()` | Dashboard, schedule, report | Medium |
| No `accessibilityLabel` on icon buttons | Bell icon, AI refresh button | Medium |
| Inconsistent icon container sizes (38px, 42px, 44px) | Dashboard, report | Low |

### 1.3 Design Direction

The parent role accent color is **green** (`#66BB6A`), distinguishing it visually from student (blue) and teacher (indigo). Green conveys growth, health, and reassurance -- appropriate emotions for parents monitoring their child's academic progress.

---

## 2. Dependencies (from Sections 01 and 02)

This section relies on artifacts created in the first two phases. The implementer does **not** need to read sections 01 or 02; everything needed is summarized here.

### 2.1 Design Tokens (from Section 01)

All tokens live in `src/constants/theme.ts`. The following are used in this section:

#### Typography Tokens

```typescript
// Already exported from src/constants/theme.ts after Phase 1
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
```

#### Role Colors (Parent = Green)

```typescript
export const roleColors = {
  parent: {
    accent: '#66BB6A',
    accentLight: '#A5D6A7',
    accentDark: '#388E3C',
    accentSubtle: 'rgba(102, 187, 106, 0.08)',
    accentMuted: 'rgba(102, 187, 106, 0.16)',
  },
  // teacher and student also defined but not used in this section
} as const;
```

#### Shadow Tokens

```typescript
export const shadows = {
  none: {},
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 6 },
};
```

#### Opacity Tokens and Helper

```typescript
export const opacity = {
  subtle: 0.08,
  muted: 0.16,
  medium: 0.38,
  high: 0.60,
  veryHigh: 0.80,
  full: 1.0,
} as const;

export function opacityToHex(value: number): string {
  return Math.round(value * 255).toString(16).padStart(2, '0').toUpperCase();
}
```

#### Size Tokens

```typescript
export const sizes = {
  iconSm: 20, iconMd: 24, iconLg: 32, iconXl: 40,
  avatarSm: 32, avatarMd: 48, avatarLg: 64,
  iconContainerSm: 32, iconContainerMd: 40, iconContainerLg: 48,
  badgeSm: 20, badgeMd: 28, badgeLg: 36,
  progressRingSm: 44, progressRingMd: 64, progressRingLg: 88,
  buttonSm: 36, buttonMd: 44, buttonLg: 52,
} as const;
```

#### Chart Color Tokens

```typescript
export const chartColors = {
  primaryFill: 'rgba(74, 144, 217, 0.25)',
  primaryStroke: '#4A90D9',
  secondaryFill: 'rgba(92, 107, 192, 0.25)',
  secondaryStroke: '#5C6BC0',
  grid: '#E0E0E0',
  label: '#212121',
  valueLabel: '#757575',
  successFill: 'rgba(76, 175, 80, 0.25)',
  successStroke: '#4CAF50',
  warningFill: 'rgba(255, 152, 0, 0.25)',
  warningStroke: '#FF9800',
  errorFill: 'rgba(244, 67, 54, 0.25)',
  errorStroke: '#F44336',
  heatLow: '#E8F5E9',
  heatMid: '#FFF9C4',
  heatHigh: '#FFCDD2',
} as const;
```

### 2.2 Hooks (from Section 01)

```typescript
// src/hooks/useRoleTheme.ts
import { useRoleTheme } from '../../src/hooks';
// Returns: { accent, accentLight, accentDark, accentSubtle, accentMuted, roleName }
// For parent users: accent = '#66BB6A', accentLight = '#A5D6A7', etc.

// src/hooks/useResponsive.ts
import { useResponsive } from '../../src/hooks';
// Returns: { screenSize, isTablet, isLandscape, width, height, columns, contentPadding }
```

### 2.3 Common Components (from Section 02)

```typescript
// src/components/common/SkeletonLoader.tsx
import { SkeletonLoader, SkeletonStatCard, SkeletonDashboard } from '../../src/components/common';

// src/components/common/EmptyState.tsx
import { EmptyState } from '../../src/components/common';
```

---

## 3. File-by-File Implementation

### 3.1 Parent Tab Layout (`app/(parent)/_layout.tsx`)

**Current state**: Uses `colors.primary` (generic blue) for `tabBarActiveTintColor` and system font for tab labels.

**Target state**: Uses `roleColors.parent.accent` (green) for active tab tint and Noto Sans KR for tab labels.

#### Current Code (lines 9, 16-28)

```typescript
import { colors, tabletSizes } from '../../src/constants/theme';

// ...inside screenOptions:
tabBarActiveTintColor: colors.primary,
tabBarInactiveTintColor: colors.textSecondary,
tabBarStyle: {
  height: tabletSizes.tabBarHeight,
  paddingBottom: 8,
  paddingTop: 8,
  backgroundColor: colors.surface,
  borderTopColor: colors.border,
},
tabBarLabelStyle: {
  fontSize: 12,
  fontWeight: '500',
},
```

#### Required Changes

**Change 1**: Update import to include `roleColors`.

```typescript
// BEFORE
import { colors, tabletSizes } from '../../src/constants/theme';

// AFTER
import { colors, tabletSizes, roleColors } from '../../src/constants/theme';
```

**Change 2**: Replace `tabBarActiveTintColor` with role accent.

```typescript
// BEFORE
tabBarActiveTintColor: colors.primary,

// AFTER
tabBarActiveTintColor: roleColors.parent.accent,
```

**Change 3**: Add Noto Sans KR font family to tab labels.

```typescript
// BEFORE
tabBarLabelStyle: {
  fontSize: 12,
  fontWeight: '500',
},

// AFTER
tabBarLabelStyle: {
  fontFamily: 'NotoSansKR-Medium',
  fontSize: 12,
  fontWeight: '500',
},
```

#### Complete Updated File

```typescript
// ============================================================
// app/(parent)/_layout.tsx
// Parent tab layout with 3 tabs: Home, Schedule, Report
// ============================================================

import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tabletSizes, roleColors } from '../../src/constants/theme';

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: roleColors.parent.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          height: tabletSizes.tabBarHeight,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: 'NotoSansKR-Medium',
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarLabel: '홈',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: '스케줄',
          tabBarLabel: '스케줄',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: '리포트',
          tabBarLabel: '리포트',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

### 3.2 Parent Dashboard (`app/(parent)/index.tsx`)

This is the largest file in the parent group (724 lines). It requires the most changes.

#### 3.2.1 Import Changes

```typescript
// BEFORE
import { colors, spacing, borderRadius } from '../../src/constants/theme';

// AFTER
import {
  colors,
  spacing,
  borderRadius,
  typography,
  roleColors,
  shadows,
  opacity,
  opacityToHex,
  sizes,
} from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks/useRoleTheme';
import { useResponsive } from '../../src/hooks/useResponsive';
import { SkeletonDashboard } from '../../src/components/common';
```

#### 3.2.2 Replace `useWindowDimensions` with `useResponsive()`

```typescript
// BEFORE
const { width } = useWindowDimensions();
const isWide = width > 768;

// AFTER
const { isTablet, contentPadding } = useResponsive();
```

Then replace every occurrence of `isWide` with `isTablet` throughout the file (5 occurrences in JSX: `dashboardGridWide`, `columnLeft`, `columnRight`).

#### 3.2.3 Add Role Theme Hook

```typescript
// Add inside the component, before return:
const { accent, accentLight, accentDark, accentSubtle } = useRoleTheme();
```

#### 3.2.4 Replace Loading State with SkeletonDashboard

```typescript
// BEFORE (lines 163-167)
{isLoading ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loadingText}>학습 데이터를 불러오는 중...</Text>
  </View>
) : (

// AFTER
{isLoading ? (
  <SkeletonDashboard />
) : (
```

Remove the `ActivityIndicator` import from `react-native-paper` (unless used elsewhere in the file; it is not). Remove the now-unused `loadingContainer` and `loadingText` styles.

#### 3.2.5 Typography Replacements (StyleSheet)

Every hardcoded `fontSize` + `fontWeight` pair in the stylesheet must be replaced with the appropriate typography token or explicit Noto Sans KR font family. Here is the complete mapping:

| Style Name | Current | Replacement |
|-----------|---------|-------------|
| `greeting` | `fontSize: 22, fontWeight: '700'` | `...typography.heading3, fontWeight: '700'` (heading3 is 22px Medium, override to Bold weight) |
| `headerSubtitle` | `fontSize: 14` | `...typography.bodySmall` |
| `loadingText` | `fontSize: 14` | **REMOVED** (replaced by SkeletonDashboard) |
| `weeklyStatsTitle` | `fontSize: 17, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700', color: '#FFFFFF'` (subtitle is 16px; 17->16 is acceptable) |
| `weeklyStatsSubtitle` | `fontSize: 13` | `...typography.caption, fontSize: 13` (caption is 12px; override to 13) |
| `weeklyProgressText` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700', color: '#FFFFFF'` |
| `weeklyStatValue` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700', color: '#FFFFFF'` |
| `weeklyStatLabel` | `fontSize: 11` | `...typography.labelSmall` |
| `aiAdviceTitle` | `fontSize: 15, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` (16px close to 15) |
| `aiAdviceSubtitle` | `fontSize: 11` | `...typography.labelSmall` |
| `aiAdviceText` | `fontSize: 14, lineHeight: 22` | `...typography.bodySmall, lineHeight: 22` |
| `sectionTitle` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `weakTopicRankText` | `fontSize: 13, fontWeight: '700'` | `fontFamily: 'NotoSansKR-Bold', fontSize: 13` |
| `weakTopicName` | `fontSize: 14, fontWeight: '600'` | `...typography.label` (14px Medium, close to semibold) |
| `weakTopicReason` | `fontSize: 12` | `...typography.caption` |
| `weakTopicScore` | `fontSize: 15, fontWeight: '700'` | `fontFamily: 'NotoSansKR-Bold', fontSize: 15` |
| `viewMoreLink` | `fontSize: 13, fontWeight: '600'` | `fontFamily: 'NotoSansKR-Medium', fontSize: 13` |
| `homeworkItemTitle` | `fontSize: 15, fontWeight: '600'` | `...typography.subtitle, fontSize: 15` (or keep subtitle's 16px) |
| `homeworkItemDue` | `fontSize: 12` | `...typography.caption` |
| `homeworkItemDueUrgent` | `fontWeight: '600'` | `fontFamily: 'NotoSansKR-Medium', fontWeight: '500'` |
| `urgentBadgeText` | `fontSize: 10, fontWeight: '600'` | `fontFamily: 'NotoSansKR-Medium', fontSize: 10` |
| `homeworkItemPercent` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `homeworkItemCount` | `fontSize: 11` | `...typography.labelSmall` |

#### 3.2.6 Color and Opacity Replacements

| Style / Location | Current | Replacement |
|-----------------|---------|-------------|
| `container.backgroundColor` | `'#F8F9FA'` | `colors.background` |
| `weeklyStatsCard.backgroundColor` | `colors.primary` | `accent` (from `useRoleTheme()`, green for parent) |
| `weeklyStatsSubtitle.color` | `'rgba(255,255,255,0.8)'` | `'rgba(255,255,255,' + opacity.veryHigh + ')'` |
| `weeklyProgressCircle.backgroundColor` | `'rgba(255,255,255,0.2)'` | `'rgba(255,255,255,' + opacity.muted + ')'` |
| `weeklyProgressBar.backgroundColor` | `'rgba(255,255,255,0.3)'` | `'rgba(255,255,255,0.3)'` (keep, or use custom token) |
| `weeklyStatLabel.color` | `'rgba(255,255,255,0.7)'` | `'rgba(255,255,255,' + opacity.high + ')'` |
| `weeklyStatDivider.backgroundColor` | `'rgba(255,255,255,0.2)'` | `'rgba(255,255,255,' + opacity.muted + ')'` |
| Icon colors `"rgba(255,255,255,0.9)"` | Inline in JSX | `'rgba(255,255,255,0.9)'` (keep as near-full, or `opacity.full`) |
| `aiAdviceIconContainer.backgroundColor` | `colors.secondaryLight + '20'` | `colors.secondaryLight + opacityToHex(opacity.muted)` |
| `weakTopicRank.backgroundColor` | `colors.error + '20'`, `colors.warning + '20'`, etc. | `colors.error + opacityToHex(opacity.muted)`, etc. |
| `homeworkItem.backgroundColor` | `colors.surfaceVariant + '40'` | `colors.surfaceVariant + opacityToHex(0.25)` (closest to `40` hex = ~25%) |
| `homeworkItemUrgent.backgroundColor` | `colors.error + '08'` | `colors.error + opacityToHex(opacity.subtle)` |
| `homeworkItemPercent.color` | `colors.primary` | `accent` (from `useRoleTheme()`) |
| `homeworkItem.borderLeftColor` | `colors.primary` | `accent` (from `useRoleTheme()`) |
| `viewMoreLink.color` | `colors.primary` | `accent` (from `useRoleTheme()`) |

**Note on dynamic `accent` usage**: Because `accent` comes from a hook, the static `StyleSheet.create()` cannot reference it directly. For styles that depend on `accent`, use inline style overrides in JSX:

```typescript
// Example: weekly stats card with role accent
<View style={[styles.weeklyStatsCard, { backgroundColor: accent }]}>
```

Or, for the homework item left border:

```typescript
<View style={[styles.homeworkItem, { borderLeftColor: accent }, hw.isUrgent && styles.homeworkItemUrgent]}>
```

#### 3.2.7 Size Token Replacements

| Location | Current | Replacement |
|----------|---------|-------------|
| `headerIcon` (bell button) | `width: 44, height: 44` | `width: sizes.iconContainerLg, height: sizes.iconContainerLg` |
| `aiAdviceIconContainer` | `width: 38, height: 38` | `width: sizes.iconContainerMd, height: sizes.iconContainerMd` (40px, close to 38) |
| `weeklyProgressCircle` | `width: 52, height: 52` | `width: sizes.progressRingSm, height: sizes.progressRingSm` (44px; or keep 52 as custom override) |
| `weakTopicRank` | `width: 28, height: 28` | `width: sizes.badgeMd, height: sizes.badgeMd` |

#### 3.2.8 Shadow Replacements

| Location | Current | Replacement |
|----------|---------|-------------|
| Card containers (weeklyStatsCard, aiAdviceCard, weaknessCard, homeworkSection) | No explicit shadow (rely on borderRadius) | Add `...shadows.sm` to each card style for subtle depth |

#### 3.2.9 Accessibility Additions

```typescript
// Bell icon in header
<View style={styles.headerIcon}>
  <MaterialCommunityIcons
    name="bell-outline"
    size={24}
    color={colors.textSecondary}
    accessibilityLabel="알림"
  />
</View>

// View more link
<Text
  style={styles.viewMoreLink}
  onPress={() => router.push('/(parent)/report')}
  accessibilityLabel="상세 리포트 보기"
  accessibilityRole="link"
>
  상세 리포트 보기 ->
</Text>
```

#### 3.2.10 ContentPadding from useResponsive

```typescript
// BEFORE (static)
contentContainer: {
  padding: spacing.lg,
  paddingBottom: spacing.xxl,
},

// AFTER (dynamic, in JSX)
<ScrollView
  contentContainerStyle={[styles.contentContainer, { padding: contentPadding }]}
  ...
>
```

#### 3.2.11 Complete Updated StyleSheet (key excerpts)

The full updated stylesheet is large. Here are the key changed styles:

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // was '#F8F9FA'
  },
  // ... scrollView unchanged ...
  contentContainer: {
    paddingBottom: spacing.xxl,
    // padding now set dynamically via contentPadding
  },

  // Header
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.heading3,
    fontWeight: '700', // override Medium to Bold
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
  },
  headerIcon: {
    width: sizes.iconContainerLg,
    height: sizes.iconContainerLg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },

  // Weekly stats (backgroundColor set dynamically to `accent`)
  weeklyStatsCard: {
    // backgroundColor: set via inline style to `accent`
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  weeklyStatsTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weeklyStatsSubtitle: {
    ...typography.caption,
    fontSize: 13, // slight override from 12
    color: `rgba(255,255,255,${opacity.veryHigh})`,
    marginTop: 4,
  },
  weeklyProgressCircle: {
    width: sizes.progressRingSm,
    height: sizes.progressRingSm,
    borderRadius: sizes.progressRingSm / 2,
    backgroundColor: `rgba(255,255,255,${opacity.muted})`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyProgressText: {
    ...typography.subtitle,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weeklyStatValue: {
    ...typography.subtitle,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weeklyStatLabel: {
    ...typography.labelSmall,
    color: `rgba(255,255,255,${opacity.high})`,
  },
  weeklyStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: `rgba(255,255,255,${opacity.muted})`,
  },

  // AI advice
  aiAdviceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  aiAdviceIconContainer: {
    width: sizes.iconContainerMd,
    height: sizes.iconContainerMd,
    borderRadius: 10,
    backgroundColor: colors.secondaryLight + opacityToHex(opacity.muted),
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAdviceTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aiAdviceSubtitle: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
  aiAdviceText: {
    ...typography.bodySmall,
    lineHeight: 22,
    color: colors.textPrimary,
  },

  // Weakness card
  weaknessCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weakTopicRankText: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 13,
    fontWeight: '700',
  },
  weakTopicName: {
    ...typography.label,
    color: colors.textPrimary,
  },
  weakTopicReason: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weakTopicScore: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 15,
    fontWeight: '700',
  },
  weakTopicRank: {
    width: sizes.badgeMd,
    height: sizes.badgeMd,
    borderRadius: sizes.badgeMd / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  viewMoreLink: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 13,
    fontWeight: '500',
    // color: set dynamically to `accent`
    textAlign: 'right',
    marginTop: spacing.md,
  },

  // Homework section
  homeworkSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  homeworkItemTitle: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.textPrimary,
  },
  homeworkItemDue: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  homeworkItemDueUrgent: {
    color: colors.error,
    fontFamily: 'NotoSansKR-Medium',
    fontWeight: '500',
  },
  urgentBadgeText: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  homeworkItemPercent: {
    ...typography.subtitle,
    fontWeight: '700',
    // color: set dynamically to `accent`
  },
  homeworkItemCount: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
```

#### 3.2.12 JSX Inline Style Overrides (dynamic accent)

Wherever the stylesheet cannot reference the dynamic `accent` value from `useRoleTheme()`, apply inline overrides:

```typescript
// Weekly stats card
<View style={[styles.weeklyStatsCard, { backgroundColor: accent }]}>

// Homework item left border
<View
  style={[
    styles.homeworkItem,
    { borderLeftColor: accent },
    hw.isUrgent && styles.homeworkItemUrgent,
  ]}
>

// Homework percent color
<Text style={[styles.homeworkItemPercent, { color: accent }]}>

// View more link color
<Text
  style={[styles.viewMoreLink, { color: accent }]}
  onPress={() => router.push('/(parent)/report')}
>

// Weak topic rank backgrounds (replace `colors.error + '20'` etc.)
<View
  style={[
    styles.weakTopicRank,
    {
      backgroundColor:
        index === 0
          ? colors.error + opacityToHex(opacity.muted)
          : index === 1
          ? colors.warning + opacityToHex(opacity.muted)
          : colors.textSecondary + opacityToHex(opacity.muted),
    },
  ]}
>

// Homework item background
<View
  style={[
    styles.homeworkItem,
    { borderLeftColor: accent, backgroundColor: colors.surfaceVariant + opacityToHex(0.25) },
    hw.isUrgent && styles.homeworkItemUrgent,
  ]}
>
```

---

### 3.3 Schedule Screen (`app/(parent)/schedule.tsx`)

#### 3.3.1 Import Changes

```typescript
// BEFORE
import { colors, spacing, borderRadius } from '../../src/constants/theme';

// AFTER
import {
  colors,
  spacing,
  borderRadius,
  typography,
  roleColors,
  shadows,
  opacity,
  opacityToHex,
  sizes,
} from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks/useRoleTheme';
import { useResponsive } from '../../src/hooks/useResponsive';
import { EmptyState } from '../../src/components/common';
```

#### 3.3.2 Replace `useWindowDimensions` with `useResponsive()`

```typescript
// BEFORE
const { width } = useWindowDimensions();
const isWide = width > 768;

// AFTER
const { isTablet, contentPadding } = useResponsive();
// Replace all `isWide` references with `isTablet`
```

Remove `useWindowDimensions` from the `react-native` import.

#### 3.3.3 Add Role Theme and Calendar Toggle State

```typescript
const { accent, accentLight } = useRoleTheme();

// New state for weekly/monthly toggle
const [calendarView, setCalendarView] = useState<'weekly' | 'monthly'>('weekly');
```

#### 3.3.4 Add Calendar Toggle UI (Weekly/Monthly Chips)

Insert after the `ChildSelector` and before the `contentGrid`:

```typescript
{/* Calendar view toggle */}
<View style={styles.viewToggle}>
  <TouchableOpacity
    style={[
      styles.viewToggleChip,
      calendarView === 'weekly' && [styles.viewToggleChipActive, { backgroundColor: accent }],
    ]}
    onPress={() => setCalendarView('weekly')}
    accessibilityLabel="주간 보기"
    accessibilityRole="button"
  >
    <MaterialCommunityIcons
      name="calendar-week"
      size={16}
      color={calendarView === 'weekly' ? '#FFFFFF' : colors.textSecondary}
    />
    <Text
      style={[
        styles.viewToggleText,
        calendarView === 'weekly' && styles.viewToggleTextActive,
      ]}
    >
      주간
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[
      styles.viewToggleChip,
      calendarView === 'monthly' && [styles.viewToggleChipActive, { backgroundColor: accent }],
    ]}
    onPress={() => setCalendarView('monthly')}
    accessibilityLabel="월간 보기"
    accessibilityRole="button"
  >
    <MaterialCommunityIcons
      name="calendar-month"
      size={16}
      color={calendarView === 'monthly' ? '#FFFFFF' : colors.textSecondary}
    />
    <Text
      style={[
        styles.viewToggleText,
        calendarView === 'monthly' && styles.viewToggleTextActive,
      ]}
    >
      월간
    </Text>
  </TouchableOpacity>
</View>
```

New styles for the toggle:

```typescript
viewToggle: {
  flexDirection: 'row',
  gap: spacing.sm,
  marginBottom: spacing.md,
},
viewToggleChip: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderRadius: borderRadius.full,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  minHeight: 36,
},
viewToggleChipActive: {
  borderColor: 'transparent',
},
viewToggleText: {
  ...typography.label,
  color: colors.textSecondary,
},
viewToggleTextActive: {
  color: '#FFFFFF',
},
```

> **Note**: The `monthly` view is a UI placeholder for this phase. The `ScheduleCalendar` component currently only supports weekly view. When `calendarView === 'monthly'`, still render the weekly calendar. Full monthly calendar can be added in a future iteration.

#### 3.3.5 Add EmptyState for No Schedules

After the deadline list, add an empty state fallback:

```typescript
// If there are no deadlines
{MOCK_DEADLINES.length === 0 ? (
  <EmptyState
    icon="calendar-blank-outline"
    title="일정이 없습니다"
    description="등록된 수업 일정이 표시됩니다"
  />
) : (
  // ...existing deadline rendering...
)}
```

Also add an empty state for the grading notifications section:

```typescript
{MOCK_GRADING_NOTIFICATIONS.length === 0 ? (
  <EmptyState
    icon="check-decagram-outline"
    title="채점 결과가 없습니다"
    description="채점이 완료되면 여기에 표시됩니다"
  />
) : (
  // ...existing grading rendering...
)}
```

#### 3.3.6 Deadline Highlighting with `colors.error`

The current deadline highlighting logic already uses `colors.error` for `daysLeft === 0`. Enhance by adding a subtle background tint for urgent items:

```typescript
<View
  key={deadline.id}
  style={[
    styles.deadlineItem,
    deadline.daysLeft === 0 && styles.deadlineItemUrgent,
  ]}
>
```

New style:

```typescript
deadlineItemUrgent: {
  backgroundColor: colors.error + opacityToHex(opacity.subtle),
  borderRadius: borderRadius.md,
  marginHorizontal: -spacing.sm,
  paddingHorizontal: spacing.sm,
},
```

#### 3.3.7 Typography Replacements

| Style Name | Current | Replacement |
|-----------|---------|-------------|
| `headerTitle` | `fontSize: 22, fontWeight: '700'` | `...typography.heading3, fontWeight: '700'` |
| `headerSubtitle` | `fontSize: 14` | `...typography.bodySmall` |
| `sectionTitle` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `deadlineTitle` | `fontSize: 14, fontWeight: '600'` | `...typography.label` |
| `deadlineDate` | `fontSize: 12` | `...typography.caption` |
| `deadlineDaysLeft` | `fontSize: 13, fontWeight: '600'` | `fontFamily: 'NotoSansKR-Medium', fontSize: 13` |
| `deadlineProgress` | `fontSize: 11` | `...typography.labelSmall` |
| `gradingScoreText` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `gradingTitle` | `fontSize: 14, fontWeight: '600'` | `...typography.label` |
| `gradingMeta` | `fontSize: 12` | `...typography.caption` |
| `gradingTotalScore` | `fontSize: 14, fontWeight: '500'` | `...typography.bodySmall, fontFamily: 'NotoSansKR-Medium'` |

#### 3.3.8 Color and Opacity Replacements

| Location | Current | Replacement |
|----------|---------|-------------|
| `container.backgroundColor` | `'#F8F9FA'` | `colors.background` |
| `gradingScoreCircle.backgroundColor` | `getScoreColor(...) + '15'` | `getScoreColor(...) + opacityToHex(opacity.subtle)` |

#### 3.3.9 Size Token Replacements

| Location | Current | Replacement |
|----------|---------|-------------|
| `gradingScoreCircle` | `width: 44, height: 44, borderRadius: 22` | `width: sizes.iconContainerLg, height: sizes.iconContainerLg, borderRadius: sizes.iconContainerLg / 2` |

#### 3.3.10 Shadow Additions

```typescript
deadlinesCard: {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.xl,
  padding: spacing.md,
  ...shadows.sm,
},
gradingCard: {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.xl,
  padding: spacing.md,
  ...shadows.sm,
},
```

---

### 3.4 Report Screen (`app/(parent)/report.tsx`)

#### 3.4.1 Import Changes

```typescript
// BEFORE
import { colors, spacing, borderRadius } from '../../src/constants/theme';

// AFTER
import {
  colors,
  spacing,
  borderRadius,
  typography,
  roleColors,
  shadows,
  opacity,
  opacityToHex,
  sizes,
  chartColors,
} from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks/useRoleTheme';
import { useResponsive } from '../../src/hooks/useResponsive';
import { SkeletonLoader, EmptyState } from '../../src/components/common';
```

#### 3.4.2 Replace `useWindowDimensions` with `useResponsive()`

```typescript
// BEFORE
const { width } = useWindowDimensions();
const isWide = width > 768;

// AFTER
const { isTablet, width, contentPadding } = useResponsive();
// Replace all `isWide` references with `isTablet`
```

Remove `useWindowDimensions` from the `react-native` import.

#### 3.4.3 Add Role Theme and Period Selector State

```typescript
const { accent, accentLight, accentDark } = useRoleTheme();

// Period selector state
const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly'>('monthly');
```

#### 3.4.4 Parent-Context Chart Color Override

The key innovation for the report screen is overriding chart colors to use the parent role accent (green) instead of the default blue:

```typescript
// Inside the component, compute chart colors for parent context
const parentChartColors = {
  primaryFill: `rgba(102, 187, 106, 0.25)`,  // green fill
  primaryStroke: accent,                       // green stroke
};
```

Then pass these to the chart components:

```typescript
// BEFORE
<RadarChart
  data={MOCK_RADAR_DATA}
  size={chartSize}
  strokeColor={colors.primary}
  fillColor={colors.primary + '30'}
/>

// AFTER
<RadarChart
  data={MOCK_RADAR_DATA}
  size={chartSize}
  strokeColor={parentChartColors.primaryStroke}
  fillColor={parentChartColors.primaryFill}
/>
```

```typescript
// BEFORE
<LineChart
  data={MOCK_TIMELINE_DATA}
  width={chartWidth}
  height={200}
  lineColor={colors.primary}
  dotColor={colors.primaryDark}
/>

// AFTER
<LineChart
  data={MOCK_TIMELINE_DATA}
  width={chartWidth}
  height={200}
  lineColor={parentChartColors.primaryStroke}
  dotColor={accentDark}
/>
```

#### 3.4.5 Period Selector UI (주간/월간 Chips)

Insert after the `ChildSelector` and before the `reportGrid`:

```typescript
{/* Period selector */}
<View style={styles.periodSelector}>
  <TouchableOpacity
    style={[
      styles.periodChip,
      selectedPeriod === 'weekly' && [styles.periodChipActive, { backgroundColor: accent }],
    ]}
    onPress={() => setSelectedPeriod('weekly')}
    accessibilityLabel="주간 리포트"
    accessibilityRole="button"
  >
    <Text
      style={[
        styles.periodChipText,
        selectedPeriod === 'weekly' && styles.periodChipTextActive,
      ]}
    >
      주간
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[
      styles.periodChip,
      selectedPeriod === 'monthly' && [styles.periodChipActive, { backgroundColor: accent }],
    ]}
    onPress={() => setSelectedPeriod('monthly')}
    accessibilityLabel="월간 리포트"
    accessibilityRole="button"
  >
    <Text
      style={[
        styles.periodChipText,
        selectedPeriod === 'monthly' && styles.periodChipTextActive,
      ]}
    >
      월간
    </Text>
  </TouchableOpacity>
</View>
```

New styles:

```typescript
periodSelector: {
  flexDirection: 'row',
  gap: spacing.sm,
  marginBottom: spacing.md,
},
periodChip: {
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
  borderRadius: borderRadius.full,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  minHeight: 36,
  justifyContent: 'center',
  alignItems: 'center',
},
periodChipActive: {
  borderColor: 'transparent',
},
periodChipText: {
  ...typography.label,
  color: colors.textSecondary,
},
periodChipTextActive: {
  color: '#FFFFFF',
},
```

> **Note**: The period selector is a UI-only addition for this phase. Both "weekly" and "monthly" currently display the same mock data. The selected period value is available for future data filtering integration.

#### 3.4.6 SkeletonLoader for AI Loading State

Replace the `ActivityIndicator` loading state in the AI diagnosis card:

```typescript
// BEFORE (lines 263-272)
{isLoadingAI ? (
  <View style={styles.aiLoadingContainer}>
    <ActivityIndicator size="large" color={colors.secondary} />
    <Text style={styles.aiLoadingText}>
      AI가 학습 데이터를 분석 중입니다...
    </Text>
  </View>
) : (

// AFTER
{isLoadingAI ? (
  <View style={styles.aiLoadingContainer}>
    <SkeletonLoader variant="text" width="100%" height={16} count={3} gap={spacing.sm} />
    <SkeletonLoader variant="rect" width="100%" height={80} style={{ marginTop: spacing.md }} />
    <SkeletonLoader variant="text" width="70%" height={14} count={2} gap={spacing.sm} style={{ marginTop: spacing.md }} />
  </View>
) : (
```

Also replace the small `ActivityIndicator` in the refresh button:

```typescript
// BEFORE
{isLoadingAI ? (
  <ActivityIndicator size={18} color={colors.primary} />
) : (

// AFTER
{isLoadingAI ? (
  <ActivityIndicator size={18} color={accent} />
) : (
```

Note: Keep `ActivityIndicator` import for the small spinner in the refresh button, but update its color from `colors.primary` to `accent`.

#### 3.4.7 EmptyState for No Report Data

Add a conditional check at the top of the report content:

```typescript
// Add a flag to check if there is report data
const hasReportData = MOCK_RADAR_DATA.length > 0 || MOCK_TIMELINE_DATA.length > 0;

// In JSX, wrap the report grid:
{!hasReportData ? (
  <EmptyState
    icon="chart-bar"
    title="리포트 데이터가 없습니다"
    description="자녀의 학습 데이터가 쌓이면 리포트가 생성됩니다"
  />
) : (
  <View style={[styles.reportGrid, isTablet && styles.reportGridWide]}>
    {/* ... existing content ... */}
  </View>
)}
```

#### 3.4.8 Typography Replacements

| Style Name | Current | Replacement |
|-----------|---------|-------------|
| `headerTitle` | `fontSize: 22, fontWeight: '700'` | `...typography.heading3, fontWeight: '700'` |
| `headerSubtitle` | `fontSize: 14` | `...typography.bodySmall` |
| `sectionTitle` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `chartCardTitle` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `wrongItemRank` | `fontSize: 14, fontWeight: '600'` | `...typography.label` |
| `wrongItemTopic` | `fontSize: 14, fontWeight: '600'` | `...typography.label` |
| `wrongItemCount` | `fontSize: 13, fontWeight: '600'` | `fontFamily: 'NotoSansKR-Medium', fontSize: 13` |
| `aiDiagnosisTitle` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `aiDiagnosisSubtitle` | `fontSize: 12` | `...typography.caption` |
| `aiLoadingText` | `fontSize: 14` | `...typography.bodySmall` |
| `overallCommentText` | `fontSize: 14, lineHeight: 22` | `...typography.bodySmall, lineHeight: 22` |
| `diagnosisSectionTitle` | `fontSize: 14, fontWeight: '700'` | `...typography.label, fontWeight: '700'` |
| `diagnosisItemText` | `fontSize: 13, lineHeight: 20` | `fontFamily: 'NotoSansKR-Regular', fontSize: 13, lineHeight: 20` |

#### 3.4.9 Color and Opacity Replacements

| Location | Current | Replacement |
|----------|---------|-------------|
| `container.backgroundColor` | `'#F8F9FA'` | `colors.background` |
| `aiIconContainer.backgroundColor` | `colors.secondaryLight + '20'` | `colors.secondaryLight + opacityToHex(opacity.muted)` |
| `aiRefreshButton.backgroundColor` | `colors.primaryLight + '20'` | `accentLight + opacityToHex(opacity.muted)` (dynamic, use inline style) |
| `overallCommentBox.backgroundColor` | `colors.primaryLight + '10'` | `accentLight + opacityToHex(opacity.subtle)` (dynamic) |
| `overallCommentBox.borderLeftColor` | `colors.primary` | `accent` (dynamic) |
| `ActivityIndicator color` (refresh) | `colors.primary` | `accent` (dynamic) |

#### 3.4.10 Size Token Replacements

| Location | Current | Replacement |
|----------|---------|-------------|
| `aiIconContainer` | `width: 42, height: 42` | `width: sizes.iconContainerLg, height: sizes.iconContainerLg` (48px; or keep 42 as custom) |
| `aiRefreshButton` | `width: 36, height: 36, borderRadius: 18` | `width: sizes.buttonSm, height: sizes.buttonSm, borderRadius: sizes.buttonSm / 2` |

#### 3.4.11 Shadow Additions

```typescript
chartCard: {
  ...shadows.sm,
  // existing styles...
},
wrongAnalysisCard: {
  ...shadows.sm,
  // existing styles...
},
aiDiagnosisCard: {
  ...shadows.sm,
  // existing styles...
},
```

#### 3.4.12 Accessibility Additions

```typescript
// AI refresh button
<TouchableOpacity
  style={styles.aiRefreshButton}
  onPress={handleRerunAI}
  accessibilityLabel="AI 분석 다시 실행"
  accessibilityRole="button"
>
```

---

## 4. Subcomponent Updates

The four parent subcomponents in `src/components/parent/` also need token migration. These are not screen files but are tightly coupled to the parent screens.

### 4.1 ChildSelector (`src/components/parent/ChildSelector.tsx`)

#### Typography Changes

| Style Name | Current | Replacement |
|-----------|---------|-------------|
| `label` | `fontSize: 13, fontWeight: '600'` | `fontFamily: 'NotoSansKR-Medium', fontSize: 13` |
| `childName` | `fontSize: 15, fontWeight: '600'` | `...typography.subtitle, fontSize: 15` |
| `childGrade` | `fontSize: 12` | `...typography.caption` |

#### Color Changes

The ChildSelector currently uses `colors.primary` for the selected state. For parent context, it should use the parent accent green. However, since `ChildSelector` is a pure component (no hook access), the parent screen should pass the accent color as a prop.

**Option A (recommended)**: Add an optional `accentColor` prop to ChildSelector:

```typescript
interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string;
  onSelectChild: (childId: string) => void;
  accentColor?: string; // NEW: role accent color override
}
```

Then use `accentColor ?? colors.primary` wherever `colors.primary` is referenced:

```typescript
const activeColor = accentColor ?? colors.primary;

// Selected chip border:
childChipSelected: { borderColor: activeColor, ... }

// Selected avatar:
color={isSelected ? colors.surface : activeColor}

// Check icon:
<MaterialCommunityIcons ... color={activeColor} />
```

**Option B (alternative)**: Use the `useRoleTheme()` hook directly inside ChildSelector. This couples the component to the auth store, but is simpler. Given that ChildSelector is only used in parent screens, this is acceptable.

#### Opacity Changes

| Location | Current | Replacement |
|----------|---------|-------------|
| `childChipSelected.backgroundColor` | `colors.primaryLight + '15'` | Dynamic: `accentLight + opacityToHex(opacity.subtle)` |
| `avatarIcon.backgroundColor` | `colors.primaryLight + '30'` | Dynamic: `accentLight + opacityToHex(opacity.muted)` |

### 4.2 ChildStatsCard (`src/components/parent/ChildStatsCard.tsx`)

#### Typography Changes

| Style Name | Current | Replacement |
|-----------|---------|-------------|
| `statValue` | `fontSize: 18, fontWeight: '700'` | `fontFamily: 'NotoSansKR-Bold', fontSize: 18` |
| `statLabel` | `fontSize: 12` | `...typography.caption` |
| `assignmentTitle` | `fontSize: 14, fontWeight: '600'` | `...typography.label` |
| `assignmentCount` | `fontSize: 14, fontWeight: '600'` | `...typography.label, color: colors.textSecondary` |
| `assignmentPercent` | `fontSize: 12` | `...typography.caption` |

#### Size Changes

| Location | Current | Replacement |
|----------|---------|-------------|
| `statIconCircle` | `width: 40, height: 40, borderRadius: 20` | `width: sizes.iconContainerMd, height: sizes.iconContainerMd, borderRadius: sizes.iconContainerMd / 2` |

#### Opacity Changes

| Location | Current | Replacement |
|----------|---------|-------------|
| `statIconCircle` backgrounds | `colors.primary + '15'`, `colors.success + '15'`, `colors.warning + '15'` | `colors.primary + opacityToHex(opacity.subtle)`, etc. |

#### Shadow Addition

```typescript
container: {
  ...shadows.sm,
  // existing styles...
},
```

### 4.3 ScheduleCalendar (`src/components/parent/ScheduleCalendar.tsx`)

#### Typography Changes

| Style Name | Current | Replacement |
|-----------|---------|-------------|
| `headerTitle` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `dayLabel` | `fontSize: 12, fontWeight: '600'` | `...typography.caption, fontFamily: 'NotoSansKR-Medium'` |
| `dateLabel` | `fontSize: 16, fontWeight: '600'` | `...typography.subtitle` |
| `emptyCellText` | `fontSize: 14` | `...typography.bodySmall` |
| `classTime` | `fontSize: 10, fontWeight: '600'` | `fontFamily: 'NotoSansKR-Medium', fontSize: 10` |
| `classSubject` | `fontSize: 12, fontWeight: '600'` | `...typography.caption, fontFamily: 'NotoSansKR-Medium'` |
| `classTeacher` | `fontSize: 10` | `fontFamily: 'NotoSansKR-Regular', fontSize: 10` |

#### Color/Accent Changes

The calendar uses `colors.primary` for today highlighting and class cards. Like ChildSelector, accept an optional `accentColor` prop or use `useRoleTheme()`:

| Location | Current | Replacement |
|----------|---------|-------------|
| `dayHeaderCellToday.backgroundColor` | `colors.primary + '15'` | `accent + opacityToHex(opacity.subtle)` |
| `dayLabelToday.color` | `colors.primary` | `accent` |
| `dateLabelToday.color` | `colors.primary` | `accent` |
| `dayLabelSaturday.color` | `colors.primary` | `accent` |
| `classCard.backgroundColor` | `colors.primaryLight + '20'` | `accentLight + opacityToHex(opacity.muted)` |
| `classCard.borderLeftColor` | `colors.primary` | `accent` |
| `classTime.color` | `colors.primary` | `accent` |

### 4.4 ParentReportCard (`src/components/parent/ParentReportCard.tsx`)

#### Typography Changes

| Style Name | Current | Replacement |
|-----------|---------|-------------|
| `title` | `fontSize: 16, fontWeight: '700'` | `...typography.subtitle, fontWeight: '700'` |
| `subtitle` | `fontSize: 12` | `...typography.caption` |
| `statusText` | `fontSize: 12, fontWeight: '600'` | `...typography.caption, fontFamily: 'NotoSansKR-Medium'` |
| `mainValue` | `fontSize: 36, fontWeight: '800'` | `fontFamily: 'NotoSansKR-Bold', fontSize: 36, fontWeight: '700'` |
| `mainLabel` | `fontSize: 13` | `fontFamily: 'NotoSansKR-Regular', fontSize: 13` |
| `detailLabel` | `fontSize: 14` | `...typography.bodySmall` |
| `detailValue` | `fontSize: 14, fontWeight: '600'` | `...typography.label` |
| `adviceText` | `fontSize: 13, lineHeight: 19` | `fontFamily: 'NotoSansKR-Regular', fontSize: 13, lineHeight: 19` |

#### Opacity Changes

| Location | Current | Replacement |
|----------|---------|-------------|
| STATUS_CONFIG `bgColor` values | `+ '15'` | `+ opacityToHex(opacity.subtle)` |
| `adviceSection.backgroundColor` | `colors.warning + '10'` | `colors.warning + opacityToHex(opacity.subtle)` |

#### Size Changes

| Location | Current | Replacement |
|----------|---------|-------------|
| `iconContainer` | `width: 42, height: 42` | `width: sizes.iconContainerLg, height: sizes.iconContainerLg` (48px) |

#### Shadow Addition

```typescript
container: {
  ...shadows.sm,
  // existing styles...
},
```

---

## 5. Acceptance Criteria

### 5.1 Visual Checks

| # | Criterion | How to Verify |
|---|-----------|---------------|
| V1 | Parent tab bar shows **green** active tint (`#66BB6A`), not blue | Open parent dashboard, verify tab icon and label color |
| V2 | Tab bar labels render in **Noto Sans KR Medium** | Compare with system font; Korean characters should be consistent |
| V3 | Dashboard greeting uses `typography.heading3` (22px, NotoSansKR) | Visual inspection; no system font fallback |
| V4 | Weekly stats card background is **green** (parent accent) | Compare with previous blue; should be `#66BB6A` |
| V5 | All `rgba()` opacity values use tokens | Search codebase for raw `rgba(255,255,255,` in parent files; should be zero occurrences |
| V6 | All hex opacity suffixes (`+ '15'`, `+ '20'`, `+ '30'`) use `opacityToHex()` | Search for `+ '15'` etc. in parent files; should be zero occurrences |
| V7 | No hardcoded `fontSize` without `fontFamily` | Search for bare `fontSize:` without accompanying `fontFamily` or spread typography token |
| V8 | Cards have subtle shadows (`shadows.sm`) | Visual depth on cards; compare before/after |
| V9 | Chart colors on report screen use **green** stroke/fill | Radar chart and line chart should show green, not blue |
| V10 | Container backgrounds use `colors.background` not `'#F8F9FA'` | Search for `#F8F9FA` in parent files; should be zero |

### 5.2 Functional Checks

| # | Criterion | How to Verify |
|---|-----------|---------------|
| F1 | Dashboard loading state shows `SkeletonDashboard` | Set `isLoading = true` temporarily; verify skeleton renders |
| F2 | Schedule calendar toggle UI (weekly/monthly) renders | Tap both chips; verify selection state changes |
| F3 | Report period selector (주간/월간) renders | Tap both chips; verify selection state changes |
| F4 | Report AI loading shows skeleton loader, not spinner | Tap AI refresh; verify skeleton text/rect blocks appear |
| F5 | EmptyState renders when schedule has no data | Empty `MOCK_DEADLINES` array; verify empty state appears |
| F6 | EmptyState renders when report has no data | Empty `MOCK_RADAR_DATA` and `MOCK_TIMELINE_DATA`; verify empty state appears |
| F7 | Child selector still works | Tap different children (if multiple); dashboard updates |
| F8 | Pull-to-refresh still works on dashboard and report | Pull down; verify refresh animation plays |
| F9 | "상세 리포트 보기" link still navigates to report tab | Tap the link on dashboard; verify navigation |
| F10 | All three tabs (홈, 스케줄, 리포트) navigate correctly | Tap each tab; verify correct screen renders |

### 5.3 Responsive Checks

| # | Criterion | How to Verify |
|---|-----------|---------------|
| R1 | Dashboard 2-column layout activates at >768px | Test on tablet (landscape) and phone (portrait) |
| R2 | Schedule 2-column layout activates at >768px | Same as above |
| R3 | Report 2-column layout activates at >768px | Same as above |
| R4 | Content padding adapts (16px phone, 24px tablet, 32px large tablet) | Resize window on web; verify padding changes |

### 5.4 Accessibility Checks

| # | Criterion | How to Verify |
|---|-----------|---------------|
| A1 | Bell icon has `accessibilityLabel="알림"` | VoiceOver/TalkBack reads "알림" |
| A2 | Calendar toggle chips have accessibility labels | VoiceOver reads "주간 보기" / "월간 보기" |
| A3 | Period selector chips have accessibility labels | VoiceOver reads "주간 리포트" / "월간 리포트" |
| A4 | AI refresh button has `accessibilityLabel` | VoiceOver reads "AI 분석 다시 실행" |
| A5 | "상세 리포트 보기" link has `accessibilityRole="link"` | VoiceOver announces as link |

### 5.5 Code Quality Checks

| # | Criterion | How to Verify |
|---|-----------|---------------|
| Q1 | `npx tsc --noEmit` passes | Run command; zero errors |
| Q2 | No `useWindowDimensions` import in parent screen files | Grep for `useWindowDimensions` in `app/(parent)/` |
| Q3 | No raw `'System'` font family in parent files | Grep for `'System'` |
| Q4 | All 4 parent screen files modified | Git diff shows changes in `_layout.tsx`, `index.tsx`, `schedule.tsx`, `report.tsx` |
| Q5 | All 4 subcomponents updated | Git diff shows changes in `ChildSelector.tsx`, `ChildStatsCard.tsx`, `ScheduleCalendar.tsx`, `ParentReportCard.tsx` |

---

## 6. Files to Modify

### 6.1 Screen Files (4 files)

| File Path | Changes Summary |
|-----------|----------------|
| `app/(parent)/_layout.tsx` | `roleColors.parent.accent` for tab tint, Noto Sans KR tab labels |
| `app/(parent)/index.tsx` | Full token migration (typography, colors, opacity, sizes, shadows), `useRoleTheme()`, `useResponsive()`, `SkeletonDashboard` for loading, green accent on weekly card and homework items |
| `app/(parent)/schedule.tsx` | Token migration, `useResponsive()`, calendar view toggle (weekly/monthly), `EmptyState` for no data, deadline urgency highlighting, shadow tokens |
| `app/(parent)/report.tsx` | Token migration, `useResponsive()`, `useRoleTheme()`, parent chart color override (green), period selector (주간/월간), `SkeletonLoader` for AI loading, `EmptyState` for no data |

### 6.2 Subcomponent Files (4 files)

| File Path | Changes Summary |
|-----------|----------------|
| `src/components/parent/ChildSelector.tsx` | Typography tokens, optional `accentColor` prop (or `useRoleTheme()`), opacity tokens |
| `src/components/parent/ChildStatsCard.tsx` | Typography tokens, size tokens, opacity tokens, shadow |
| `src/components/parent/ScheduleCalendar.tsx` | Typography tokens, accent color for today/class highlighting, opacity tokens |
| `src/components/parent/ParentReportCard.tsx` | Typography tokens, opacity tokens, size tokens, shadow |

### 6.3 Files NOT Modified by This Section

These files are modified by other sections and should not be touched here:

- `src/constants/theme.ts` (Section 01)
- `src/hooks/useRoleTheme.ts` (Section 01)
- `src/hooks/useResponsive.ts` (Section 01)
- `src/components/common/SkeletonLoader.tsx` (Section 02)
- `src/components/common/EmptyState.tsx` (Section 02)
- `src/components/charts/RadarChart.tsx` (Section 04 adds `chartColors` prop support; this section only passes different prop values)
- `src/components/charts/LineChart.tsx` (same as RadarChart)

---

## 7. Migration Checklist

Use this checklist when implementing. Check off each item as completed.

### Layout (`_layout.tsx`)

- [ ] Import `roleColors` from theme
- [ ] Change `tabBarActiveTintColor` to `roleColors.parent.accent`
- [ ] Add `fontFamily: 'NotoSansKR-Medium'` to `tabBarLabelStyle`

### Dashboard (`index.tsx`)

- [ ] Add imports: `typography`, `roleColors`, `shadows`, `opacity`, `opacityToHex`, `sizes`
- [ ] Add imports: `useRoleTheme`, `useResponsive`, `SkeletonDashboard`
- [ ] Replace `useWindowDimensions` with `useResponsive()`
- [ ] Replace `isWide` with `isTablet` (5 occurrences)
- [ ] Add `useRoleTheme()` call
- [ ] Replace `ActivityIndicator` loading with `SkeletonDashboard`
- [ ] Replace `'#F8F9FA'` with `colors.background`
- [ ] Replace `weeklyStatsCard` background with `accent` (inline)
- [ ] Replace all `rgba()` with opacity tokens
- [ ] Replace all `+ '20'` / `+ '15'` with `opacityToHex()`
- [ ] Replace all `fontSize`/`fontWeight` with typography tokens
- [ ] Replace icon container sizes with `sizes.*`
- [ ] Add `...shadows.sm` to card styles
- [ ] Add `accessibilityLabel` to bell icon and view-more link
- [ ] Apply `contentPadding` dynamically

### Schedule (`schedule.tsx`)

- [ ] Add all new imports
- [ ] Replace `useWindowDimensions` with `useResponsive()`
- [ ] Add `useRoleTheme()` call
- [ ] Add `calendarView` state
- [ ] Add calendar view toggle UI (weekly/monthly chips)
- [ ] Add `EmptyState` for empty deadlines and grading lists
- [ ] Add urgent deadline highlighting style
- [ ] Replace `'#F8F9FA'` with `colors.background`
- [ ] Replace all typography with tokens
- [ ] Replace `+ '15'` with `opacityToHex(opacity.subtle)`
- [ ] Replace grading score circle sizes with `sizes.*`
- [ ] Add `...shadows.sm` to card styles

### Report (`report.tsx`)

- [ ] Add all new imports including `chartColors`
- [ ] Replace `useWindowDimensions` with `useResponsive()`
- [ ] Add `useRoleTheme()` call
- [ ] Add `selectedPeriod` state
- [ ] Compute `parentChartColors` with green accent
- [ ] Pass green chart colors to `RadarChart` and `LineChart`
- [ ] Add period selector UI (주간/월간 chips)
- [ ] Replace AI loading `ActivityIndicator` with `SkeletonLoader`
- [ ] Add `EmptyState` for no report data
- [ ] Replace `'#F8F9FA'` with `colors.background`
- [ ] Replace all typography with tokens
- [ ] Replace opacity suffixes with `opacityToHex()`
- [ ] Add `...shadows.sm` to card styles
- [ ] Add `accessibilityLabel` to AI refresh button

### Subcomponents

- [ ] ChildSelector: typography tokens, accent color prop/hook, opacity tokens
- [ ] ChildStatsCard: typography tokens, size tokens, opacity tokens, shadow
- [ ] ScheduleCalendar: typography tokens, accent color, opacity tokens
- [ ] ParentReportCard: typography tokens, opacity tokens, size tokens, shadow

---

## 8. Testing Commands

```bash
# TypeScript compilation check (from project root)
npx tsc --noEmit

# Verify no hardcoded backgrounds remain
# Search for '#F8F9FA' in parent files -- expect zero results
grep -r "#F8F9FA" app/\(parent\)/ src/components/parent/

# Verify no raw rgba in parent screen files (excluding theme.ts)
grep -rn "rgba(255,255,255," app/\(parent\)/

# Verify no bare System font
grep -rn "'System'" app/\(parent\)/ src/components/parent/

# Verify useWindowDimensions removed from parent screens
grep -rn "useWindowDimensions" app/\(parent\)/

# Start the app and manually test parent screens
npx expo start
```

---

## 9. Risk Notes

### Risk: `useRoleTheme()` Returns Student Palette During Testing

If you test the parent screens without logging in as a parent user, `useRoleTheme()` returns the student (blue) palette as default. Always log in with `parent@test.com / 123456` for testing.

### Risk: ChildSelector Prop Change Is Breaking

If other code passes `ChildSelector` without the new `accentColor` prop, it will fall back to `colors.primary` (the default). This is safe -- the prop is optional.

### Risk: Chart Color Override Not Applied

If the `RadarChart` or `LineChart` components ignore the `fillColor`/`strokeColor`/`lineColor`/`dotColor` props and use their internal `CHART_COLORS` constants, the parent green accent will not appear. Verify that Section 04 (or chart component updates) has made these props effective. The current chart code already accepts these props as parameters with defaults, so this should work without chart code changes.

### Risk: Monthly Calendar View Not Implemented

The calendar toggle adds a "monthly" option but the `ScheduleCalendar` component only supports weekly view. This is intentional -- the UI is ready, the underlying component can be extended later. No user-facing error occurs; the weekly view simply remains visible regardless of toggle state.


---

## Embedded Section: Section 07-responsive-accessibility

# Section 07: Responsive & Accessibility

> **Status**: Not started
> **Phase**: 7 of 8
> **Dependencies**: section-01-design-tokens (for `useResponsive()` hook, typography tokens, `roleColors`)
> **Blocks**: Nothing (parallelizable with sections 03, 04, 05, 06, 08 after section-01 is complete)
> **Estimated effort**: Medium
> **Files changed**: 13+ existing files modified, 0 new files created

---

## Table of Contents

1. [Background & Context](#1-background--context)
2. [Requirements](#2-requirements)
3. [Dependencies from Prior Sections](#3-dependencies-from-prior-sections)
4. [Task 1: useResponsive() Hook Application](#4-task-1-useresponsive-hook-application)
5. [Task 2: Responsive Content Padding](#5-task-2-responsive-content-padding)
6. [Task 3: Minimum 44px Touch Target Audit](#6-task-3-minimum-44px-touch-target-audit)
7. [Task 4: Accessibility Labels](#7-task-4-accessibility-labels)
8. [Task 5: Tab Bar Font Family Unification](#8-task-5-tab-bar-font-family-unification)
9. [Files to Modify - Complete List](#9-files-to-modify---complete-list)
10. [Acceptance Criteria](#10-acceptance-criteria)
11. [Testing Checklist](#11-testing-checklist)

---

## 1. Background & Context

Mathpia is a Korean math tutoring tablet application for private math academies (hagwon). It runs on Expo SDK 54 / React Native 0.81.5, targeting tablets (10"+ iPads, Android tablets) as the primary device, with secondary support for mobile phones and Expo Web.

### What This Section Solves

This section addresses four cross-cutting concerns that span **all screen files** across all three user roles (student, teacher, parent):

| Problem | Severity | What's Happening Now |
|---------|----------|---------------------|
| **Raw `useWindowDimensions` everywhere** | Medium | Seven screen files and two analytics components import `useWindowDimensions` directly from React Native. Each file then manually computes `isWide = width > 768` or `isLandscape = width > height`. There is no centralized responsive system. The breakpoint value (768) is duplicated inline. Some screens derive column count, others do not. |
| **Sub-44px touch targets** | High | Problem number buttons in `solve.tsx` are 36x36px. Navigation arrow buttons are 36x36px. Filter chips across the app have no enforced minimum height. The `saveButton` in `solve.tsx` uses `paddingVertical: 6` which yields a touch area well below 44px. These undersized targets cause mis-taps on tablets, especially for younger students. |
| **Zero `accessibilityLabel` attributes** | High | A codebase-wide search for `accessibilityLabel` returns **zero results** across all `.tsx` files. Icon-only buttons (logout, back, close, refresh, navigation arrows), avatars, progress bars, and navigation cards have no screen reader descriptions. The app is completely inaccessible to VoiceOver (iOS) and TalkBack (Android). |
| **Inconsistent tab bar font** | Medium | All three `_layout.tsx` tab files (student, teacher, parent) use `fontWeight: '500'` and `fontSize: 12` but do NOT specify `fontFamily`. After section-01 loads Noto Sans KR via `expo-font` and configures it in react-native-paper's `configureFonts()`, the tab bar labels may still fall back to the system font because expo-router's `Tabs` component does not automatically inherit the paper font configuration. The `fontFamily` must be explicitly set. |

### Current State of Affected Files

**Screens using `useWindowDimensions` directly** (7 screen files + 2 analytics components):

| File | Current Pattern | What It Derives |
|------|----------------|-----------------|
| `app/(student)/index.tsx` | `const { width } = useWindowDimensions(); const isWide = width > 768;` | 2-column layout toggle for dashboard sections |
| `app/(student)/solve.tsx` | `const { width: screenWidth, height: screenHeight } = useWindowDimensions();` | Landscape detection (`screenWidth > screenHeight && screenWidth > 768`), canvas size calculation |
| `app/(student)/analytics.tsx` | `const { width } = useWindowDimensions(); const isWide = width > 768;` | 2-column layout for stat cards and chart sizing |
| `app/(parent)/index.tsx` | `const { width } = useWindowDimensions(); const isWide = width > 768;` | 2-column layout for dashboard cards and homework list |
| `app/(parent)/schedule.tsx` | `const { width } = useWindowDimensions(); const isWide = width > 768;` | 2-column layout for calendar and deadlines |
| `app/(parent)/report.tsx` | `const { width } = useWindowDimensions(); const isWide = width > 768;` | 2-column layout for charts and analysis cards |
| `app/(teacher)/student-analytics.tsx` | `const { width } = useWindowDimensions(); const isWide = width > 768;` | 2-column layout for student picker and analytics display |
| `src/components/analytics/AchievementRadar.tsx` | `const { width } = useWindowDimensions();` | Chart SVG width calculation |
| `src/components/analytics/ProgressTimeline.tsx` | `const { width } = useWindowDimensions();` | Chart SVG width calculation |

**Tab layout files** (3 files, all with identical pattern):

| File | Current `tabBarLabelStyle` |
|------|--------------------------|
| `app/(student)/_layout.tsx` | `{ fontSize: 12, fontWeight: '500' }` -- no `fontFamily` |
| `app/(teacher)/_layout.tsx` | `{ fontSize: 12, fontWeight: '500' }` -- no `fontFamily` |
| `app/(parent)/_layout.tsx` | `{ fontSize: 12, fontWeight: '500' }` -- no `fontFamily` |

---

## 2. Requirements

### Functional Requirements (NO changes)
- Zero business logic modifications
- All navigation flows remain identical
- All data fetching and state management unchanged
- No new screens or components created
- No new npm dependencies required

### UI/UX Requirements

When this section is complete, ALL of the following must be true:

1. **All 7 screen files** that currently use `useWindowDimensions` directly are migrated to the `useResponsive()` hook from `src/hooks`
2. **The 2 analytics components** (`AchievementRadar`, `ProgressTimeline`) that use `useWindowDimensions` for chart width calculation are migrated to `useResponsive()` where the `width` property is used
3. **All screen containers** use `contentPadding` from `useResponsive()` instead of hardcoded padding values for their outer content containers
4. **Every interactive element** has a minimum touch target of 44x44 pixels (Apple Human Interface Guidelines / Android accessibility guidelines)
5. **Every icon-only button, avatar, and progress indicator** has an `accessibilityLabel` in Korean
6. **Every navigation card / touchable area** has `accessibilityRole="button"` where appropriate
7. **All three tab bar `_layout.tsx` files** specify `fontFamily: 'NotoSansKR-Medium'` in their `tabBarLabelStyle`
8. **No `useWindowDimensions` imports** remain in screen files (only inside `useResponsive` hook itself and chart sizing components if needed)
9. **TypeScript compiles** without errors: `npx tsc --noEmit` passes
10. **App launches** on all three platforms without crash

---

## 3. Dependencies from Prior Sections

### Required from Section 01 (Design Token System)

This section requires ONLY section-01 to be complete. The following artifacts from section-01 are used:

**`src/hooks/useResponsive.ts`** -- The hook that wraps `useWindowDimensions` and provides:

```typescript
interface ResponsiveValues {
  screenSize: 'small' | 'medium' | 'large';
  isTablet: boolean;        // width > 768
  isLandscape: boolean;     // width > height
  width: number;            // raw pixel width
  height: number;           // raw pixel height
  columns: 1 | 2 | 3;      // grid column count
  contentPadding: number;   // 16 | 24 | 32 depending on width
}
```

Breakpoints:
- `small`: width < 375px (small phones)
- `medium`: 375-768px (phones, portrait tablets)
- `large`: width > 768px (landscape tablets, web)

Content padding:
- width > 1024: 32px
- width > 768: 24px
- width <= 768: 16px

**`src/hooks/index.ts`** -- Barrel export that re-exports `useResponsive`.

**`src/constants/theme.ts`** -- The following token exports are referenced by this section:
- `roleColors` (for tab bar active tint -- though this is primarily done in sections 04-06, it is verified here)
- `tabletSizes.minTouchTarget` (value: 44) -- used as the reference for touch target auditing

**Font files loaded in `app/_layout.tsx`** -- Section-01 loads `NotoSansKR-Regular`, `NotoSansKR-Medium`, `NotoSansKR-Bold` via `expo-font`. The font family name `'NotoSansKR-Medium'` is available for tab bar label styling.

### NOT Required

- Section 02 (Common Components): Not needed. No SkeletonLoader or EmptyState is used in this section.
- Sections 03-06 (Screen Enhancements): Not needed. This section's changes are independent of typography/shadow/opacity token migrations on individual screens. The `useResponsive()` migration and accessibility changes can be applied before, after, or concurrently with screen-level styling work.

---

## 4. Task 1: useResponsive() Hook Application

### 4.1 Overview

Replace all direct `useWindowDimensions` usage in screen files with the `useResponsive()` hook. This centralizes breakpoint logic, provides consistent responsive values, and eliminates the duplicated `width > 768` pattern.

### 4.2 Screen-by-Screen Replacement Patterns

---

#### 4.2.1 `app/(student)/index.tsx` -- Student Dashboard

**Current code** (line 2, line 124-125):
```typescript
// Line 2: import
import { View, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';

// Line 124-125: usage
const { width } = useWindowDimensions();
const isWide = width > 768;
```

**Replace with**:
```typescript
// Line 2: remove useWindowDimensions from the import
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// Add new import (after existing imports):
import { useResponsive } from '../../src/hooks';

// Line 124-125: replace both lines with:
const { isTablet, contentPadding } = useResponsive();
```

**Then, throughout the file**, replace all occurrences of `isWide` with `isTablet`:
- `isWide && styles.dashboardSectionWide` becomes `isTablet && styles.dashboardSectionWide`
- `isWide && styles.leftSectionWide` becomes `isTablet && styles.leftSectionWide`
- All other `isWide` references become `isTablet`

---

#### 4.2.2 `app/(student)/solve.tsx` -- Solve Screen

**Current code** (line 2, lines 77-80):
```typescript
// Line 2: import
import { View, StyleSheet, ScrollView, Image, useWindowDimensions, TouchableOpacity } from 'react-native';

// Lines 77-80: usage
const { width: screenWidth, height: screenHeight } = useWindowDimensions();
const isLandscape = screenWidth > screenHeight && screenWidth > 768;
```

**Replace with**:
```typescript
// Line 2: remove useWindowDimensions from the import
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';

// Add new import:
import { useResponsive } from '../../src/hooks';

// Lines 77-80: replace with:
const { isLandscape, width: screenWidth, height: screenHeight } = useResponsive();
```

**Important note**: The `useResponsive()` hook defines `isLandscape` as `width > height`. The current code in `solve.tsx` uses a **stricter** check: `screenWidth > screenHeight && screenWidth > 768`. This means landscape mode only activates on tablets. The `useResponsive()` `isLandscape` will return true on phones in landscape too. To preserve the current behavior, use the combined check:

```typescript
const { isTablet, isLandscape: rawIsLandscape, width: screenWidth, height: screenHeight } = useResponsive();
const isLandscape = rawIsLandscape && isTablet;
```

The canvas size calculations on lines 91-96 continue to use `screenWidth` and `screenHeight` directly (which are still provided by `useResponsive()`):

```typescript
// These calculations remain unchanged -- they use raw pixel values:
const canvasWidth = isLandscape
  ? (screenWidth - spacing.lg * 3) * 0.55
  : screenWidth - spacing.lg * 2;
const canvasHeight = isLandscape
  ? screenHeight - 180
  : 400;
```

---

#### 4.2.3 `app/(student)/analytics.tsx` -- Student Analytics

**Current code** (line 2, lines 35-36):
```typescript
// Line 2: import
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';

// Lines 35-36: usage
const { width } = useWindowDimensions();
const isWide = width > 768;
```

**Replace with**:
```typescript
// Line 2: remove useWindowDimensions
import { View, StyleSheet, ScrollView } from 'react-native';

// Add new import:
import { useResponsive } from '../../src/hooks';

// Lines 35-36: replace with:
const { isTablet, width, contentPadding } = useResponsive();
```

Replace all `isWide` with `isTablet` throughout the file. Keep `width` available since analytics components may use it for chart sizing.

---

#### 4.2.4 `app/(parent)/index.tsx` -- Parent Dashboard

**Current code** (lines 8-12, lines 83-84):
```typescript
// Lines 8-12: import
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';

// Lines 83-84: usage
const { width } = useWindowDimensions();
const isWide = width > 768;
```

**Replace with**:
```typescript
// Lines 8-12: remove useWindowDimensions
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';

// Add new import:
import { useResponsive } from '../../src/hooks';

// Lines 83-84: replace with:
const { isTablet, contentPadding } = useResponsive();
```

Replace all `isWide` with `isTablet` throughout the file.

---

#### 4.2.5 `app/(parent)/schedule.tsx` -- Parent Schedule

**Current code** (lines 7-11, lines 136-137):
```typescript
// Lines 7-11: import
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';

// Lines 136-137: usage
const { width } = useWindowDimensions();
const isWide = width > 768;
```

**Replace with**:
```typescript
// Lines 7-11: remove useWindowDimensions
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';

// Add new import:
import { useResponsive } from '../../src/hooks';

// Lines 136-137: replace with:
const { isTablet, contentPadding } = useResponsive();
```

Replace all `isWide` with `isTablet` throughout the file.

---

#### 4.2.6 `app/(parent)/report.tsx` -- Parent Report

**Current code** (lines 7-13, lines 88-89):
```typescript
// Lines 7-13: import
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';

// Lines 88-89: usage
const { width } = useWindowDimensions();
const isWide = width > 768;
```

**Replace with**:
```typescript
// Lines 7-13: remove useWindowDimensions
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';

// Add new import:
import { useResponsive } from '../../src/hooks';

// Lines 88-89: replace with:
const { isTablet, width, contentPadding } = useResponsive();
```

Replace all `isWide` with `isTablet`. Keep `width` available if charts use it for SVG sizing.

---

#### 4.2.7 `app/(teacher)/student-analytics.tsx` -- Teacher Student Analytics

**Current code** (line 2, lines 22-23):
```typescript
// Line 2: import
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';

// Lines 22-23: usage
const { width } = useWindowDimensions();
const isWide = width > 768;
```

**Replace with**:
```typescript
// Line 2: remove useWindowDimensions
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';

// Add new import:
import { useResponsive } from '../../src/hooks';

// Lines 22-23: replace with:
const { isTablet, width, contentPadding } = useResponsive();
```

Replace all `isWide` with `isTablet`. Keep `width` available for chart sizing.

---

#### 4.2.8 `src/components/analytics/AchievementRadar.tsx` -- Chart Component

**Current code** (line 2, line 18):
```typescript
// Line 2: import
import { View, StyleSheet, useWindowDimensions } from 'react-native';

// Line 18: usage
const { width } = useWindowDimensions();
```

**Replace with**:
```typescript
// Line 2: remove useWindowDimensions
import { View, StyleSheet } from 'react-native';

// Add new import:
import { useResponsive } from '../../hooks';

// Line 18: replace with:
const { width } = useResponsive();
```

Note: The import path for chart components in `src/components/analytics/` is `../../hooks` (relative to the analytics folder inside `src/components/`), not `../../src/hooks` (which is the path from `app/` files).

---

#### 4.2.9 `src/components/analytics/ProgressTimeline.tsx` -- Chart Component

**Current code** (line 2, line 16):
```typescript
// Line 2: import
import { View, StyleSheet, useWindowDimensions } from 'react-native';

// Line 16: usage
const { width } = useWindowDimensions();
```

**Replace with**:
```typescript
// Line 2: remove useWindowDimensions
import { View, StyleSheet } from 'react-native';

// Add new import:
import { useResponsive } from '../../hooks';

// Line 16: replace with:
const { width } = useResponsive();
```

### 4.3 Post-Migration Verification

After all replacements, run a codebase search to verify no `useWindowDimensions` imports remain in screen files:

```bash
# Should return ONLY src/hooks/useResponsive.ts
grep -rn "useWindowDimensions" --include="*.tsx" --include="*.ts" app/ src/
```

The ONLY file that should still import `useWindowDimensions` is `src/hooks/useResponsive.ts` itself (which wraps it).

---

## 5. Task 2: Responsive Content Padding

### 5.1 Overview

The `useResponsive()` hook provides a `contentPadding` value that adapts to screen width:
- `width > 1024`: 32px (large tablets in landscape, web)
- `width > 768`: 24px (tablets in portrait)
- `width <= 768`: 16px (phones)

This value should be applied to the outermost scrollable content container of each screen, replacing any hardcoded `paddingHorizontal` or `padding` on the content container.

### 5.2 Application Pattern

In every screen file that uses `useResponsive()`, apply `contentPadding` to the main content container:

```typescript
const { isTablet, contentPadding } = useResponsive();

// In the JSX:
<ScrollView
  contentContainerStyle={[
    styles.contentContainer,
    { paddingHorizontal: contentPadding },
  ]}
>
```

### 5.3 Screens to Apply Content Padding

| Screen File | Current Content Padding | Change To |
|-------------|------------------------|-----------|
| `app/(student)/index.tsx` | `paddingHorizontal: spacing.lg` (24px fixed) in `contentContainer` style | `{ paddingHorizontal: contentPadding }` as inline style |
| `app/(student)/analytics.tsx` | `padding: spacing.lg` (24px fixed) | `{ padding: contentPadding }` as inline style |
| `app/(parent)/index.tsx` | `paddingHorizontal: spacing.lg` (24px fixed) | `{ paddingHorizontal: contentPadding }` as inline style |
| `app/(parent)/schedule.tsx` | `paddingHorizontal: spacing.lg` (24px fixed) | `{ paddingHorizontal: contentPadding }` as inline style |
| `app/(parent)/report.tsx` | `paddingHorizontal: spacing.lg` (24px fixed) | `{ paddingHorizontal: contentPadding }` as inline style |
| `app/(teacher)/student-analytics.tsx` | `padding: spacing.lg` (24px fixed) | `{ padding: contentPadding }` as inline style |

**Note**: `app/(student)/solve.tsx` uses `padding: spacing.md` (16px) for its `mainContent` style, which is intentionally tight to maximize canvas area. For solve screen, apply contentPadding to the header/navigation areas only, NOT the canvas content area. The canvas sizing calculation already accounts for screen width dynamically.

---

## 6. Task 3: Minimum 44px Touch Target Audit

### 6.1 Overview

Apple Human Interface Guidelines and Android accessibility guidelines require a minimum touch target of 44x44 points/pixels. This audit identifies all interactive elements below that threshold and provides exact code changes to fix them.

The reference value `44` is already defined in the theme as `tabletSizes.minTouchTarget`.

### 6.2 Complete Touch Target Audit Table

| Component | File | Current Size | Issue | Fix |
|-----------|------|-------------|-------|-----|
| **Problem number buttons** | `app/(student)/solve.tsx` | 36x36px | 8px below minimum | Increase to 44x44px |
| **Navigation arrow buttons** | `app/(student)/solve.tsx` | 36x36px | 8px below minimum | Increase to 44x44px |
| **Save button** | `app/(student)/solve.tsx` | ~30px height (paddingVertical: 6) | Well below minimum | Add minHeight: 44 |
| **Back button** | `app/(student)/solve.tsx` | 40x40px | 4px below minimum | Increase to 44x44px |
| **Filter chips** (all screens) | Multiple files | Default Chip height (~32px) | Below minimum | Add `style={{ minHeight: 36 }}` + container `minHeight: 44` via wrapper padding |
| **ProblemCard chips** | `src/components/problemBank/ProblemCard.tsx` | `height: 24` | 20px below minimum | Keep visual size 24px but add 10px vertical padding to container for 44px touch area |
| **ProblemFilters chips** | `src/components/problemBank/ProblemFilters.tsx` | `height: 30` | 14px below minimum | Keep visual size but add padding for 44px touch area |
| **Tab bar items** | All `_layout.tsx` | `tabBarHeight: 72` | OK (exceeds 44px) | No change needed |
| **Quick nav cards** | `app/(student)/index.tsx` | ~80px+ | OK (exceeds 44px) | No change needed |
| **Homework cards** | `app/(student)/homework.tsx` | ~80px+ | OK (exceeds 44px) | No change needed |

### 6.3 Exact Code Changes

#### 6.3.1 Problem Number Buttons (`app/(student)/solve.tsx`)

**Current style** (lines 398-405):
```typescript
problemNumberButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.surfaceVariant,
  justifyContent: 'center',
  alignItems: 'center',
},
```

**Replace with**:
```typescript
problemNumberButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: colors.surfaceVariant,
  justifyContent: 'center',
  alignItems: 'center',
},
```

#### 6.3.2 Navigation Arrow Buttons (`app/(student)/solve.tsx`)

**Current style** (lines 426-433):
```typescript
navArrowButton: {
  width: 36,
  height: 36,
  borderRadius: 8,
  backgroundColor: colors.surfaceVariant,
  justifyContent: 'center',
  alignItems: 'center',
},
```

**Replace with**:
```typescript
navArrowButton: {
  width: 44,
  height: 44,
  borderRadius: 8,
  backgroundColor: colors.surfaceVariant,
  justifyContent: 'center',
  alignItems: 'center',
},
```

#### 6.3.3 Back Button (`app/(student)/solve.tsx`)

**Current style** (lines 321-328):
```typescript
backButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.surfaceVariant,
  justifyContent: 'center',
  alignItems: 'center',
},
```

**Replace with**:
```typescript
backButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: colors.surfaceVariant,
  justifyContent: 'center',
  alignItems: 'center',
},
```

#### 6.3.4 Save Button (`app/(student)/solve.tsx`)

**Current style** (lines 553-559):
```typescript
saveButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: colors.primary,
  paddingHorizontal: spacing.sm,
  paddingVertical: 6,
```

**Replace with**:
```typescript
saveButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: colors.primary,
  paddingHorizontal: spacing.sm,
  paddingVertical: 6,
  minHeight: 44,
```

#### 6.3.5 Filter Chips (All Screens Using `<Chip>`)

React Native Paper's `<Chip>` component renders at approximately 32px height by default. The chips themselves can remain visually compact, but the touchable area must be at least 44px.

**Strategy**: Add vertical padding to the chip container's style so the total touchable area reaches 44px. The `filterChip` style in each file should include `minHeight`:

**Files to update** (add `minHeight: 44` to `filterChip` style):

| File | Current `filterChip` style | Add |
|------|---------------------------|-----|
| `app/(student)/homework.tsx` (line 228) | `{ marginRight: spacing.xs }` | Add `minHeight: 44, justifyContent: 'center'` |
| `app/(teacher)/assignments.tsx` (line 224) | `{ marginRight: spacing.xs }` | Add `minHeight: 44, justifyContent: 'center'` |
| `app/(teacher)/students.tsx` (line 171) | `{ marginRight: spacing.sm }` | Add `minHeight: 44, justifyContent: 'center'` |
| `app/(teacher)/grading.tsx` (line 184) | `{ marginRight: spacing.xs }` | Add `minHeight: 44, justifyContent: 'center'` |
| `app/(teacher)/materials.tsx` (line 214) | `{ marginRight: spacing.sm }` | Add `minHeight: 44, justifyContent: 'center'` |
| `app/(teacher)/problem-extract.tsx` (line 356) | `{ marginRight: spacing.sm }` | Add `minHeight: 44, justifyContent: 'center'` |
| `src/components/wrongNote/WrongNoteFilters.tsx` (line 247) | `{ marginRight: spacing.xs, borderWidth: 1, borderColor: colors.border }` | Add `minHeight: 44, justifyContent: 'center'` |
| `src/components/problemBank/ProblemFilters.tsx` (line 316) | `{ marginRight: spacing.xs, height: 30 }` | Change `height: 30` to `minHeight: 44`, add `justifyContent: 'center'` |

**Example for `app/(student)/homework.tsx`**:

Current:
```typescript
filterChip: {
  marginRight: spacing.xs,
},
```

Replace with:
```typescript
filterChip: {
  marginRight: spacing.xs,
  minHeight: 44,
  justifyContent: 'center',
},
```

**Example for `src/components/problemBank/ProblemFilters.tsx`**:

Current:
```typescript
filterChip: {
  marginRight: spacing.xs,
  height: 30,
},
```

Replace with:
```typescript
filterChip: {
  marginRight: spacing.xs,
  minHeight: 44,
  justifyContent: 'center',
},
```

#### 6.3.6 ProblemCard Chips (`src/components/problemBank/ProblemCard.tsx`)

**Current style** (line 231-233):
```typescript
chip: {
  height: 24,
},
```

These chips are display-only (non-interactive) badges showing difficulty level and topic. Since they are NOT touchable, the 44px minimum does NOT apply. **No change needed.**

If they are wrapped in a `TouchableOpacity` or `Pressable`, add padding. But the current code uses them as static display chips, so this is fine.

---

## 7. Task 4: Accessibility Labels

### 7.1 Overview

Currently, **zero** `accessibilityLabel` attributes exist in the entire codebase. This task adds Korean-language accessibility labels to all interactive elements that lack visible text labels, plus `accessibilityRole` attributes where appropriate.

### 7.2 Categories of Elements Needing Labels

#### Category 1: Icon-Only Buttons

These are `TouchableOpacity` or `IconButton` components that contain only an icon (no visible text). Screen readers cannot describe them without an `accessibilityLabel`.

| Element | File | Icon | `accessibilityLabel` to Add |
|---------|------|------|---------------------------|
| Back button | `app/(student)/solve.tsx` | `chevron-left` | `"뒤로 가기"` |
| Submit button | `app/(student)/solve.tsx` | `send` + text "제출" | `"숙제 제출"` (has text but confirm with label) |
| Save button | `app/(student)/solve.tsx` | `content-save` / `check` | `"풀이 저장"` / `"저장 완료"` |
| Previous problem arrow | `app/(student)/solve.tsx` | `chevron-left` | `"이전 문제"` |
| Next problem arrow | `app/(student)/solve.tsx` | `chevron-right` | `"다음 문제"` |
| Logout button | `app/(teacher)/index.tsx` | `logout` icon | `"로그아웃"` |
| Logout button | `app/(student)/profile.tsx` | `logout` icon | `"로그아웃"` |
| Close button | `src/components/problemBank/ProblemDetail.tsx` | `close` | `"닫기"` |
| Close button | `src/components/problemBank/ProblemSelector.tsx` | `close` | `"닫기"` |
| Close button | `src/components/problemBank/ProblemForm.tsx` | `close` | `"닫기"` |
| Close button | `src/components/wrongNote/ReviewMode.tsx` | `close` | `"복습 모드 닫기"` |
| Refresh button | `app/(parent)/report.tsx` | `refresh` | `"AI 분석 새로고침"` |

**Example implementation for each type**:

**TouchableOpacity icon buttons** (e.g., back button in solve.tsx):
```typescript
// BEFORE:
<TouchableOpacity
  style={styles.backButton}
  onPress={() => router.back()}
>
  <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
</TouchableOpacity>

// AFTER:
<TouchableOpacity
  style={styles.backButton}
  onPress={() => router.back()}
  accessibilityLabel="뒤로 가기"
  accessibilityRole="button"
>
  <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
</TouchableOpacity>
```

**IconButton (react-native-paper)** (e.g., close buttons in modals):
```typescript
// BEFORE:
<IconButton icon="close" onPress={onDismiss} />

// AFTER:
<IconButton icon="close" onPress={onDismiss} accessibilityLabel="닫기" />
```

**Navigation arrows** (solve.tsx):
```typescript
// BEFORE:
<TouchableOpacity
  style={[styles.navArrowButton, currentProblemIndex === 0 && styles.navArrowButtonDisabled]}
  onPress={() => /* ... */}
  disabled={currentProblemIndex === 0}
>
  <MaterialCommunityIcons name="chevron-left" size={20} color={/* ... */} />
</TouchableOpacity>

// AFTER:
<TouchableOpacity
  style={[styles.navArrowButton, currentProblemIndex === 0 && styles.navArrowButtonDisabled]}
  onPress={() => /* ... */}
  disabled={currentProblemIndex === 0}
  accessibilityLabel="이전 문제"
  accessibilityRole="button"
>
  <MaterialCommunityIcons name="chevron-left" size={20} color={/* ... */} />
</TouchableOpacity>
```

---

#### Category 2: Problem Number Buttons (Dynamic Labels)

Each problem number button in `solve.tsx` needs a dynamic label that includes the problem number and its completion status.

**Implementation in the `ProblemNumberButton` component**:
```typescript
const ProblemNumberButton: React.FC<ProblemNumberButtonProps> = ({
  number,
  isActive,
  isCompleted,
  onPress,
}) => (
  <TouchableOpacity
    style={[
      styles.problemNumberButton,
      isActive && styles.problemNumberButtonActive,
      isCompleted && !isActive && styles.problemNumberButtonCompleted,
    ]}
    onPress={onPress}
    accessibilityLabel={`문제 ${number}${isCompleted ? ' (완료)' : ''}${isActive ? ' (현재)' : ''}`}
    accessibilityRole="button"
  >
    {/* ... existing content ... */}
  </TouchableOpacity>
);
```

This produces labels like:
- "문제 1 (현재)" -- current problem
- "문제 2 (완료)" -- completed problem
- "문제 3" -- not yet attempted

---

#### Category 3: Avatar Components

Avatars represent users. When they are purely decorative (not interactive), they need `accessibilityLabel` to identify the person. When they are interactive (tappable), they also need `accessibilityRole="button"`.

| Element | File | `accessibilityLabel` |
|---------|------|---------------------|
| Teacher dashboard avatar | `app/(teacher)/index.tsx` | `"{userName} 프로필"` (dynamic) |
| Student list avatars | `app/(teacher)/students.tsx` | `"{studentName} 프로필"` (dynamic) |
| Grading submission avatars | `app/(teacher)/grading.tsx` | `"{studentName} 제출물"` (dynamic) |
| Student profile avatar | `app/(student)/profile.tsx` | `"내 프로필 사진"` |

**Example** (teacher dashboard):
```typescript
// BEFORE:
<Avatar.Text
  size={48}
  label={userName.charAt(0)}
  style={{ backgroundColor: colors.primary }}
/>

// AFTER:
<Avatar.Text
  size={48}
  label={userName.charAt(0)}
  style={{ backgroundColor: colors.primary }}
  accessibilityLabel={`${userName} 프로필`}
/>
```

---

#### Category 4: Progress Indicators

`ProgressBar` components show percentage completion. Screen readers need to announce the current progress value.

| Element | File | `accessibilityLabel` |
|---------|------|---------------------|
| Homework progress bar | `app/(student)/index.tsx` | `"숙제 진행률 {n}퍼센트"` |
| Homework item progress | `app/(student)/homework.tsx` | `"진행률 {n}퍼센트"` |
| Solve screen progress | `app/(student)/solve.tsx` | `"문제 진행률 {n}퍼센트"` |
| Weekly goal progress | `app/(parent)/index.tsx` | `"주간 목표 달성률 {n}퍼센트"` |
| Homework progress (parent) | `app/(parent)/index.tsx` | `"숙제 진행률 {n}퍼센트"` |
| Wrong note mastery | `src/components/wrongNote/WrongNoteStats.tsx` | `"복습 완료율 {n}퍼센트"` |
| Child stats progress | `src/components/parent/ChildStatsCard.tsx` | `"주간 목표 진행률 {n}퍼센트"` |

**Example** (student dashboard):
```typescript
// BEFORE:
<ProgressBar
  progress={progressRate}
  color="#FFFFFF"
  style={styles.progressBar}
/>

// AFTER:
<ProgressBar
  progress={progressRate}
  color="#FFFFFF"
  style={styles.progressBar}
  accessibilityLabel={`숙제 진행률 ${Math.round(progressRate * 100)}퍼센트`}
/>
```

---

#### Category 5: Navigation Cards / Touchable Cards

Large touchable cards that navigate to other screens need `accessibilityRole="button"` and a label describing the destination.

| Element | File | `accessibilityLabel` |
|---------|------|---------------------|
| Quick nav: 숙제 | `app/(student)/index.tsx` | `"숙제 화면으로 이동"` |
| Quick nav: 오답노트 | `app/(student)/index.tsx` | `"오답노트 화면으로 이동"` |
| Quick nav: 학습분석 | `app/(student)/index.tsx` | `"학습 분석 화면으로 이동"` |
| Quick nav: 강의자료 | `app/(student)/index.tsx` | `"강의자료 화면으로 이동"` |
| Homework item cards | `app/(student)/homework.tsx` | `"{title} 숙제, {status}"` (dynamic) |
| Student list item | `app/(teacher)/students.tsx` | `"{name} 학생 상세 보기"` (dynamic) |
| Assignment cards | `app/(teacher)/assignments.tsx` | `"{title} 숙제 상세 보기"` (dynamic) |

**Example** (quick nav card):
```typescript
// BEFORE:
<TouchableOpacity
  style={styles.quickNavItem}
  onPress={() => router.push('/(student)/homework')}
>
  <View style={[styles.quickNavIconContainer, { backgroundColor: colors.primary + '15' }]}>
    <MaterialCommunityIcons name="clipboard-text" size={24} color={colors.primary} />
  </View>
  <Text style={styles.quickNavTitle}>숙제</Text>
</TouchableOpacity>

// AFTER:
<TouchableOpacity
  style={styles.quickNavItem}
  onPress={() => router.push('/(student)/homework')}
  accessibilityLabel="숙제 화면으로 이동"
  accessibilityRole="button"
>
  <View style={[styles.quickNavIconContainer, { backgroundColor: colors.primary + '15' }]}>
    <MaterialCommunityIcons name="clipboard-text" size={24} color={colors.primary} />
  </View>
  <Text style={styles.quickNavTitle}>숙제</Text>
</TouchableOpacity>
```

---

#### Category 6: Filter Chips

Chips that filter data lists. They have visible text but should also declare their selected/unselected state.

**Pattern for all filter chips**:
```typescript
// BEFORE:
<Chip
  selected={filterStatus === status}
  onPress={() => setFilterStatus(status)}
  style={styles.filterChip}
>
  {statusText}
</Chip>

// AFTER:
<Chip
  selected={filterStatus === status}
  onPress={() => setFilterStatus(status)}
  style={styles.filterChip}
  accessibilityLabel={`${statusText} 필터${filterStatus === status ? ', 선택됨' : ''}`}
  accessibilityRole="button"
>
  {statusText}
</Chip>
```

This produces labels like "전체 필터, 선택됨" or "진행중 필터".

Apply this pattern to ALL chip filter usages in:
- `app/(student)/homework.tsx`
- `app/(teacher)/assignments.tsx`
- `app/(teacher)/students.tsx`
- `app/(teacher)/grading.tsx`
- `app/(teacher)/materials.tsx`
- `app/(teacher)/problem-extract.tsx`
- `src/components/wrongNote/WrongNoteFilters.tsx`
- `src/components/problemBank/ProblemFilters.tsx`

---

## 8. Task 5: Tab Bar Font Family Unification

### 8.1 Overview

All three role-specific `_layout.tsx` files define tab bar styling with `fontSize: 12` and `fontWeight: '500'` but **do not specify `fontFamily`**. After section-01 loads the Noto Sans KR font, the tab bar labels must explicitly use it. Without this, expo-router's `Tabs` component may fall back to the system font, creating visual inconsistency between tab labels and all other text in the app.

### 8.2 Current Code (Identical in All Three Files)

```typescript
tabBarLabelStyle: {
  fontSize: 12,
  fontWeight: '500',
},
```

### 8.3 Updated Code (Apply to All Three Files)

```typescript
tabBarLabelStyle: {
  fontFamily: 'NotoSansKR-Medium',
  fontSize: 12,
  fontWeight: '500',
},
```

### 8.4 File-by-File Changes

#### 8.4.1 `app/(student)/_layout.tsx`

**Current** (lines 20-23):
```typescript
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
```

**Replace with**:
```typescript
        tabBarLabelStyle: {
          fontFamily: 'NotoSansKR-Medium',
          fontSize: 12,
          fontWeight: '500',
        },
```

#### 8.4.2 `app/(teacher)/_layout.tsx`

**Current** (lines 20-23):
```typescript
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
```

**Replace with**:
```typescript
        tabBarLabelStyle: {
          fontFamily: 'NotoSansKR-Medium',
          fontSize: 12,
          fontWeight: '500',
        },
```

#### 8.4.3 `app/(parent)/_layout.tsx`

**Current** (lines 25-28):
```typescript
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
```

**Replace with**:
```typescript
        tabBarLabelStyle: {
          fontFamily: 'NotoSansKR-Medium',
          fontSize: 12,
          fontWeight: '500',
        },
```

---

## 9. Files to Modify - Complete List

### Screen Files (useResponsive migration + accessibility + content padding)

| # | File | Tasks Applied |
|---|------|--------------|
| 1 | `app/(student)/index.tsx` | useResponsive migration, contentPadding, accessibilityLabel on quick nav cards + progress bars |
| 2 | `app/(student)/solve.tsx` | useResponsive migration, touch target fixes (44px for 4 elements), accessibilityLabel on all buttons + problem numbers |
| 3 | `app/(student)/analytics.tsx` | useResponsive migration, contentPadding |
| 4 | `app/(student)/homework.tsx` | Touch target fix (filterChip), accessibilityLabel on cards + chips + progress bars |
| 5 | `app/(student)/profile.tsx` | accessibilityLabel on avatar + logout button |
| 6 | `app/(parent)/index.tsx` | useResponsive migration, contentPadding, accessibilityLabel on progress bars |
| 7 | `app/(parent)/schedule.tsx` | useResponsive migration, contentPadding |
| 8 | `app/(parent)/report.tsx` | useResponsive migration, contentPadding, accessibilityLabel on refresh button |
| 9 | `app/(teacher)/student-analytics.tsx` | useResponsive migration, contentPadding |
| 10 | `app/(teacher)/index.tsx` | accessibilityLabel on logout button + avatar |
| 11 | `app/(teacher)/students.tsx` | Touch target fix (filterChip), accessibilityLabel on student cards + chips |
| 12 | `app/(teacher)/assignments.tsx` | Touch target fix (filterChip), accessibilityLabel on assignment cards + chips |
| 13 | `app/(teacher)/grading.tsx` | Touch target fix (filterChip), accessibilityLabel on grading avatars + chips |
| 14 | `app/(teacher)/materials.tsx` | Touch target fix (filterChip) |
| 15 | `app/(teacher)/problem-extract.tsx` | Touch target fix (filterChip) |

### Tab Layout Files (font family unification)

| # | File | Task |
|---|------|------|
| 16 | `app/(student)/_layout.tsx` | Add `fontFamily: 'NotoSansKR-Medium'` to `tabBarLabelStyle` |
| 17 | `app/(teacher)/_layout.tsx` | Add `fontFamily: 'NotoSansKR-Medium'` to `tabBarLabelStyle` |
| 18 | `app/(parent)/_layout.tsx` | Add `fontFamily: 'NotoSansKR-Medium'` to `tabBarLabelStyle` |

### Component Files (useResponsive migration + accessibility)

| # | File | Task |
|---|------|------|
| 19 | `src/components/analytics/AchievementRadar.tsx` | useResponsive migration |
| 20 | `src/components/analytics/ProgressTimeline.tsx` | useResponsive migration |
| 21 | `src/components/wrongNote/WrongNoteFilters.tsx` | Touch target fix (filterChip), accessibilityLabel on chips |
| 22 | `src/components/wrongNote/WrongNoteStats.tsx` | accessibilityLabel on progress bar |
| 23 | `src/components/wrongNote/ReviewMode.tsx` | accessibilityLabel on close button |
| 24 | `src/components/problemBank/ProblemFilters.tsx` | Touch target fix (filterChip height 30 -> minHeight 44), accessibilityLabel on chips |
| 25 | `src/components/problemBank/ProblemDetail.tsx` | accessibilityLabel on close button |
| 26 | `src/components/problemBank/ProblemSelector.tsx` | accessibilityLabel on close button |
| 27 | `src/components/problemBank/ProblemForm.tsx` | accessibilityLabel on close button |
| 28 | `src/components/parent/ChildStatsCard.tsx` | accessibilityLabel on progress bar |

**Total**: 28 files modified, 0 new files created.

---

## 10. Acceptance Criteria

### Responsive Hook Migration

- [ ] **No raw `useWindowDimensions`** imports exist in any `app/` screen file (search: `grep -rn "useWindowDimensions" app/`)
- [ ] **No raw `useWindowDimensions`** imports exist in analytics component files (search: `grep -rn "useWindowDimensions" src/components/analytics/`)
- [ ] **`useResponsive`** is imported from `../../src/hooks` (or `../../hooks` for `src/` files) in all 9 migrated files
- [ ] **All `isWide` variables** have been renamed to `isTablet` (search: `grep -rn "isWide" app/ src/`)
- [ ] **Breakpoint behavior unchanged**: 2-column layouts still activate at >768px width; solve screen landscape split still activates at >768px AND landscape
- [ ] **Canvas sizing** in solve screen still calculates correctly using `width` and `height` from `useResponsive()`

### Content Padding

- [ ] **6 screen files** use `contentPadding` from `useResponsive()` for their outer content container padding
- [ ] **Padding adapts**: 16px on phones, 24px on portrait tablets, 32px on landscape tablets/web

### Touch Targets

- [ ] **Problem number buttons** are 44x44px (verify in `solve.tsx` styles)
- [ ] **Navigation arrows** are 44x44px (verify in `solve.tsx` styles)
- [ ] **Back button** is 44x44px (verify in `solve.tsx` styles)
- [ ] **Save button** has `minHeight: 44` (verify in `solve.tsx` styles)
- [ ] **All `filterChip` styles** across the codebase include `minHeight: 44` (verify in 8 files)
- [ ] **No interactive element** renders below 44px height on any screen

### Accessibility

- [ ] **All icon-only buttons** have `accessibilityLabel` in Korean (12 instances across the codebase)
- [ ] **All problem number buttons** have dynamic `accessibilityLabel` including number and status
- [ ] **All avatar components** have `accessibilityLabel` with the user's name
- [ ] **All progress bars** have `accessibilityLabel` with current percentage in Korean
- [ ] **All navigation cards** have `accessibilityLabel` describing the destination + `accessibilityRole="button"`
- [ ] **All filter chips** have `accessibilityLabel` with filter name and selected state
- [ ] **Zero interactive elements** lack an `accessibilityLabel` (audit via VoiceOver/TalkBack)

### Tab Bar Font

- [ ] **All three `_layout.tsx` files** include `fontFamily: 'NotoSansKR-Medium'` in `tabBarLabelStyle`
- [ ] **Tab labels render** in Noto Sans KR on iOS, Android, and web (visual verification)

### Overall

- [ ] **TypeScript compiles**: `npx tsc --noEmit` passes with zero errors
- [ ] **App launches**: No crash on iOS simulator, Android emulator, and Expo Web
- [ ] **No layout regressions**: All screens render identically to before (except touch targets are slightly larger)
- [ ] **No business logic changes**: Navigation, data fetching, state management all unchanged

---

## 11. Testing Checklist

### Responsive Breakpoint Testing

Test on these viewport widths:

| Width | Expected `screenSize` | Expected `isTablet` | Expected `columns` | Expected `contentPadding` |
|-------|----------------------|--------------------|--------------------|--------------------------|
| 360px | `'medium'` | `false` | `1` | `16` |
| 375px | `'medium'` | `false` | `1` | `16` |
| 768px | `'medium'` | `false` | `1` | `16` |
| 769px | `'large'` | `true` | `2` | `24` |
| 1024px | `'large'` | `true` | `2` | `24` |
| 1025px | `'large'` | `true` | `3` | `32` |

### Touch Target Testing

1. Open solve screen on a tablet
2. Tap each problem number button -- verify it is easy to hit (no mis-taps)
3. Tap the navigation arrows -- verify they respond reliably
4. Tap the back button -- verify it responds reliably
5. Tap the save button -- verify it responds reliably
6. On homework screen, tap filter chips -- verify they respond reliably

### Accessibility Testing (VoiceOver / TalkBack)

1. **iOS**: Enable VoiceOver (Settings > Accessibility > VoiceOver)
   - Navigate to solve screen
   - Swipe through elements -- verify VoiceOver reads "뒤로 가기", "문제 1 (현재)", "이전 문제", "다음 문제", "풀이 저장"
   - Navigate to student dashboard -- verify VoiceOver reads "숙제 화면으로 이동", "숙제 진행률 70퍼센트"
   - Navigate to teacher dashboard -- verify "로그아웃" is announced for the logout icon

2. **Android**: Enable TalkBack (Settings > Accessibility > TalkBack)
   - Same verification as iOS

3. **Web**: Use browser accessibility inspector
   - Check ARIA labels on interactive elements

### Tab Bar Font Verification

1. Open app as student, teacher, and parent
2. Visually compare tab bar label font to body text font
3. They should match (both Noto Sans KR)
4. Screenshot comparison: tab labels should NOT look different from card titles or body text

### Platform Verification

```bash
# TypeScript compilation check
npx tsc --noEmit

# Start on all platforms
npx expo start          # iOS/Android
npx expo start --web    # Web

# Verify no useWindowDimensions remains in screen files
grep -rn "useWindowDimensions" app/ src/components/analytics/
# Expected: zero results (only src/hooks/useResponsive.ts should have it)

# Verify all filterChip styles have minHeight
grep -A3 "filterChip:" app/ src/ --include="*.tsx"
# Verify each result includes minHeight: 44

# Count accessibilityLabel occurrences (should be 40+)
grep -c "accessibilityLabel" app/ src/ --include="*.tsx" -r
```


---

## Embedded Section: Section 08-error-empty-states

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



---

## Completion

When ALL 8 sections have been implemented and verified:
1. Run `npx tsc --noEmit` one final time to confirm zero type errors
2. Verify the app builds and runs without crashes
3. Signal completion

<promise>ALL-SECTIONS-COMPLETE</promise>
