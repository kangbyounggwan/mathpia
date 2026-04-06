# Mathpia UI Enhancement - Implementation Plan

## Executive Summary

**Mathpia** is a Korean math tutoring tablet application built for private math academies (학원, "hagwon"). It serves three user roles -- **teachers** (선생님), **students** (학생), and **parents** (학부모) -- providing homework management, problem solving with a drawing canvas, wrong-note review, AI-powered analytics, and parent reporting.

The application is fully functional but its UI remains at prototype quality. This plan describes a comprehensive **UI/UX enhancement** that will:

1. Establish a complete **design token system** (custom Korean font, role-based accent colors, semantic typography, shadows, opacity, sizing tokens)
2. Build reusable **common components** (SkeletonLoader, EmptyState) and refactor existing ones (Button, Card, Input)
3. Apply the design system to **all 14+ screens** across all three role dashboards
4. Improve **responsiveness** and **accessibility** for tablet-first usage
5. Add **error boundary** and **empty state** patterns throughout

The end state is a production-quality, visually polished Korean math tutoring app with consistent design language, role-differentiated color theming, proper Korean typography via Noto Sans KR, skeleton loading states, and empty state guidance -- all running on Expo SDK 54 for tablet, mobile, and web.

**Constraints**: No business logic changes. No new backend work. UI/style-only modifications. Minimal new dependencies. Existing react-native-paper MD3 foundation preserved.

---

## Project Context

### Technology Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo SDK | 54 |
| Runtime | React Native | 0.81.5 |
| Language | TypeScript | ~5.9.2 |
| UI Library | react-native-paper (MD3) | ^5.14.5 |
| Routing | expo-router | ^6.0.21 |
| State | zustand | ^5.0.9 |
| Animation | react-native-reanimated | ^4.2.1 (installed, unused) |
| Charts | react-native-svg | ^15.15.1 |
| Icons | @expo/vector-icons (MaterialCommunityIcons) | ^15.0.3 |

### Target Devices
- **Primary**: Tablets 10 inches and above (iPad, Android tablets)
- **Secondary**: Mobile phones, Expo Web
- Orientation: Both portrait and landscape (landscape enables split-view on solve screen)
- Breakpoint: `768px` (existing) separates tablet from mobile layouts

### Current File Structure
```
mathpia/
  app/
    _layout.tsx              # Root layout (GestureHandler > SafeArea > Paper > Stack)
    index.tsx                # Auth redirect
    (auth)/
      _layout.tsx
      login.tsx
      register.tsx
    (student)/
      _layout.tsx            # 5-tab + 2 hidden
      index.tsx              # Student dashboard
      homework.tsx
      solve.tsx
      wrong-notes.tsx
      analytics.tsx
      materials.tsx
      profile.tsx
    (teacher)/
      _layout.tsx            # 5-tab + 3 hidden
      index.tsx              # Teacher dashboard
      students.tsx
      assignments.tsx
      grading.tsx
      materials.tsx
      problem-bank.tsx
      problem-extract.tsx
      student-analytics.tsx
    (parent)/
      _layout.tsx            # 3-tab
      index.tsx              # Parent dashboard
      schedule.tsx
      report.tsx
  src/
    constants/
      theme.ts               # Colors, typography, spacing, borderRadius, tabletSizes
      curriculum.ts
    components/
      common/
        Button.tsx
        Input.tsx
        Card.tsx
        MathText.tsx
        index.ts
      canvas/
      charts/
        RadarChart.tsx
        LineChart.tsx
        BarChart.tsx
        HeatMap.tsx
      analytics/
        AnalysisSkeleton.tsx  # Existing skeleton (Animated API, not reanimated)
        WeaknessCard.tsx
        AchievementRadar.tsx
        ProgressTimeline.tsx
      wrongNote/
      problemBank/
      parent/
        ChildSelector.tsx
        ScheduleCalendar.tsx
        ParentReportCard.tsx
        ChildStatsCard.tsx
      aiHelper/
      teacher/
        PdfUploadModal.tsx
    types/
      index.ts               # UserRole, User, Assignment, etc.
      problemBank.ts
      analytics.ts
      wrongNote.ts
      parent.ts
      aiHelper.ts
    stores/
      authStore.ts            # Zustand: login/logout, user.role
      assignmentStore.ts
      submissionStore.ts
      analyticsStore.ts
      wrongNoteStore.ts
      parentStore.ts
      problemBankStore.ts
      dataFlowConnector.ts
      index.ts
    services/
      (mock services, Gemini AI services)
```

### Current Diagnosis (Problems to Fix)
| Problem | Severity | Example |
|---------|----------|---------|
| Hardcoded font sizes | Critical | 11px to 48px scattered across all screens, theme typography scale unused |
| No custom Korean font | Critical | System font renders Korean text inconsistently |
| No role color differentiation | High | All roles use `#4A90D9` blue everywhere |
| Inline opacity values | High | `rgba(255,255,255,0.8)` throughout |
| Hardcoded shadows | Medium | `shadowColor`, `shadowOffset`, `shadowOpacity` inline |
| Inconsistent component sizes | Medium | Icon containers range 38-52px with no pattern |
| No skeleton loading | High | Only `ActivityIndicator` spinners |
| No empty state UI | High | Blank screens when no data |
| reanimated unused | Medium | v4.2.1 installed but zero imports |
| Chart colors not themed | Medium | Local `CHART_COLORS` constants in each chart |

---

## Architecture Decisions

### Decision 1: Noto Sans KR Custom Font
**Why**: Korean text rendered with system fonts varies wildly across Android/iOS/web. Noto Sans KR provides consistent, high-quality Korean glyphs.
**How**: Load via `expo-font` with three weights: Regular (400), Medium (500), Bold (700). Integrate into react-native-paper's `configureFonts()`.

### Decision 2: Role-Based Accent Colors
**Why**: Teachers, students, and parents use completely different features. Visual role differentiation helps orientation and reduces cognitive load.
**How**: Three accent palettes. A `useRoleTheme()` hook reads `user.role` from `authStore` and returns the appropriate accent set. Applied to tab bar active color, dashboard hero cards, stat card accents, and header icons.

### Decision 3: Light Mode Only (No Dark Mode)
**Why**: Educational tablet apps in Korean hagwon settings are used in well-lit classrooms. Dark mode adds complexity without clear value for this context. Deferred to future.

### Decision 4: Minimal Animation
**Why**: Performance on mid-range Android tablets. Educational context favors clarity over flashiness.
**What**: Only skeleton shimmer (reanimated), card touch scale feedback (reanimated), and progress bar entry animation (reanimated). No shared element transitions, no list entering/exiting animations, no chart drawing animations.

### Decision 5: SkeletonLoader + EmptyState as Priority Components
**Why**: These provide the highest UX improvement with the lowest effort. Every data-loading screen benefits from skeleton loaders. Every filterable list benefits from empty states.

### Decision 6: Design Token Foundation First
**Why**: Without a complete token system, applying consistent styles across 14+ screens is impossible. Tokens must be in place before screen-level work begins.

---

## Implementation Phases

---

### Phase 1: Design Token System

**Goal**: Establish the complete design foundation so all subsequent phases can reference tokens instead of magic values.

#### 1.1 Install Noto Sans KR Font

**New dependency** (add to `package.json`):
```json
"expo-font": "~14.0.0"
```

> Note: `expo-font` may already be a transitive dependency of Expo SDK 54. Verify with `npx expo install expo-font`.

**Font files**: Download Noto Sans KR from Google Fonts and place three weight files manually:
```
assets/fonts/NotoSansKR-Regular.ttf
assets/fonts/NotoSansKR-Medium.ttf
assets/fonts/NotoSansKR-Bold.ttf
```

> **Why manual files instead of @expo-google-fonts package**: The `@expo-google-fonts/noto-sans-kr` package can have version conflicts with Expo SDK 54. Manual `.ttf` files are simpler, more reliable, and have zero dependency risk.

#### 1.2 Font Loading in Root Layout

**File to modify**: `app/_layout.tsx`

Add font loading before rendering the app:

```typescript
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

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
```

> **Important**: `SplashScreen.preventAutoHideAsync()` must be called at module scope (outside the component), not inside useEffect. Add a 5-second font loading timeout fallback to prevent infinite splash.

#### 1.3 Update Theme Font Configuration

**File to modify**: `src/constants/theme.ts`

Replace the entire `fontConfig` with Noto Sans KR:

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

#### 1.4 Semantic Typography Tokens

**File to modify**: `src/constants/theme.ts`

Add after `fontConfig`:

```typescript
/**
 * Semantic typography scale for Mathpia.
 * Maps app-level meaning to MD3 font variants.
 * Usage: style={[typography.heading1]} or style={{ ...typography.body }}
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

#### 1.5 Role-Based Accent Colors

**File to modify**: `src/constants/theme.ts`

Add after the existing `colors` export:

```typescript
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
```

#### 1.6 Shadow Tokens

**File to modify**: `src/constants/theme.ts`

Add:

```typescript
import { Platform, ViewStyle } from 'react-native';

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
```

#### 1.7 Opacity Tokens

**File to modify**: `src/constants/theme.ts`

Add:

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

#### 1.8 Component Size Tokens

**File to modify**: `src/constants/theme.ts`

Add (complementing the existing `tabletSizes`):

```typescript
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
```

#### 1.9 Chart Theme Colors

**File to modify**: `src/constants/theme.ts`

Add:

```typescript
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
```

#### 1.10 Create `useRoleTheme()` Hook

**New file**: `src/hooks/useRoleTheme.ts`

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

#### 1.11 Create `useResponsive()` Hook

**New file**: `src/hooks/useResponsive.ts`

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

#### 1.12 Create Hooks Index

**New file**: `src/hooks/index.ts`

```typescript
export { useRoleTheme } from './useRoleTheme';
export { useResponsive } from './useResponsive';
export type { ScreenSize } from './useResponsive';
```

#### 1.13 Migration Strategy for Hardcoded Values

After all tokens are in place, the following find-and-replace patterns will be applied across all screen files during Phases 3-8:

| Pattern to Find | Replace With |
|----------------|-------------|
| `fontSize: 11` | `...typography.labelSmall` or `fontSize: typography.labelSmall.fontSize` |
| `fontSize: 12` | `...typography.caption` |
| `fontSize: 13` | `...typography.bodySmall` (closest) |
| `fontSize: 14` | `...typography.bodySmall` or `...typography.label` |
| `fontSize: 15-16` | `...typography.body` or `...typography.subtitle` |
| `fontSize: 17-18` | `...typography.subtitle` or `...typography.heading3` |
| `fontSize: 20-22` | `...typography.heading3` |
| `fontSize: 28` | `...typography.heading2` |
| `fontSize: 36` | `...typography.heading1` (or display) |
| `fontSize: 48` | Custom override on `heading1` |
| `fontWeight: '600'` | `fontWeight: '500'` (medium) or `'700'` (bold) |
| `rgba(255,255,255,0.8)` | `'rgba(255,255,255,' + opacity.veryHigh + ')'` |
| `rgba(255,255,255,0.7)` | Use opacity tokens |
| `rgba(255,255,255,0.3)` | Use opacity tokens |
| `+ '15'` / `+ '20'` / `+ '30'` | `+ opacityToHex(opacity.subtle)` etc. |
| `shadowColor: '#000', shadowOffset...` | `...shadows.sm` / `...shadows.md` / `...shadows.lg` |
| `width: 44, height: 44` (icon containers) | `width: sizes.iconContainerLg, height: sizes.iconContainerLg` |
| `width: 40, height: 40` (icon containers) | `width: sizes.iconContainerMd, height: sizes.iconContainerMd` |
| `size={48}` (avatars) | `size={sizes.avatarMd}` |
| `width: 52, height: 52` (progress circles) | `width: sizes.progressRingSm, height: sizes.progressRingSm` |
| `colors.primary` (in role-specific contexts) | `accent` from `useRoleTheme()` |

---

### Phase 2: Common Components

**Goal**: Build SkeletonLoader and EmptyState components, and refactor Button, Card, and Input for enhanced functionality.

#### 2.1 SkeletonLoader Component

**New file**: `src/components/common/SkeletonLoader.tsx`

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

#### 2.2 EmptyState Component

**New file**: `src/components/common/EmptyState.tsx`

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

#### 2.3 Per-Screen Empty State Messages

These will be applied during Phases 4-6. Pre-defined configurations:

```typescript
// Reference: exact icon + title + description for each screen

// Student
homework:     { icon: 'clipboard-text-off-outline', title: '숙제가 없습니다', description: '새로운 숙제가 배정되면 여기에 표시됩니다' }
wrongNotes:   { icon: 'notebook-check-outline', title: '오답이 없습니다!', description: '잘하고 있어요! 틀린 문제가 생기면 자동으로 수집됩니다' }
analytics:    { icon: 'chart-line', title: '분석 데이터가 없습니다', description: '문제를 풀면 AI가 학습 분석을 시작합니다' }
materials:    { icon: 'folder-open-outline', title: '강의자료가 없습니다', description: '선생님이 자료를 올리면 여기에 표시됩니다' }

// Teacher
students:     { icon: 'account-group-outline', title: '학생이 없습니다', description: '학생을 추가하여 관리를 시작하세요', actionLabel: '학생 추가' }
assignments:  { icon: 'clipboard-text-off-outline', title: '숙제가 없습니다', description: '새 숙제를 만들어 학생들에게 배정하세요', actionLabel: '숙제 만들기' }
grading:      { icon: 'check-circle-outline', title: '채점할 제출물이 없습니다', description: '학생이 제출하면 여기에 표시됩니다' }
problemBank:  { icon: 'database-off-outline', title: '문제가 없습니다', description: '문제를 추가하여 문제은행을 만드세요', actionLabel: '문제 추가' }

// Parent
schedule:     { icon: 'calendar-blank-outline', title: '일정이 없습니다', description: '등록된 수업 일정이 표시됩니다' }
report:       { icon: 'chart-bar', title: '리포트 데이터가 없습니다', description: '자녀의 학습 데이터가 쌓이면 리포트가 생성됩니다' }
```

#### 2.4 Button Enhancement (Size Variants)

**File to modify**: `src/components/common/Button.tsx`

Updated interface and implementation:

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

#### 2.5 Card Enhancement (Touch Feedback)

**File to modify**: `src/components/common/Card.tsx`

Add touch scale feedback using reanimated:

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

> **Note**: We use `Animated.View` wrapper instead of `Animated.createAnimatedComponent(PaperCard)` for guaranteed compatibility with react-native-paper's Card component.

#### 2.6 Input Enhancement (Validation Icons)

**File to modify**: `src/components/common/Input.tsx`

Add validation state visual feedback:

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

#### 2.7 Update Common Components Index

**File to modify**: `src/components/common/index.ts`

```typescript
export { Button } from './Button';
export { Input } from './Input';
export { Card, CardHeader } from './Card';
export { SkeletonLoader, SkeletonStatCard, SkeletonListItem, SkeletonDashboard } from './SkeletonLoader';
export { EmptyState } from './EmptyState';
```

---

### Phase 3: Login/Auth Screen Enhancement

**Goal**: Apply design tokens to login AND register screens. Add form validation UX. Make test accounts collapsible.

**Files to modify**: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`

#### 3.1 Changes
1. **Typography upgrade**: Replace all hardcoded fontSize/fontWeight with `typography.*` tokens
2. **Shadow tokens**: Replace logo container shadow with `...shadows.lg`
3. **Font family**: All text gets `fontFamily: 'NotoSansKR-*'` via typography tokens
4. **Form validation**: Add real-time email format validation and password length check using Input's new `validationState` prop
5. **Collapsible test accounts**: Wrap test account section in a collapsible/expandable view with a "테스트 계정 보기" toggle button
6. **Loading state**: Button already supports `loading`; ensure it shows during `isLoading`

#### 3.2 Specific Style Replacements
```
logo fontSize: 48 -> typography.heading1.fontSize with override to 48
title fontSize: 36 -> typography.heading1 (fontSize: 32 is close, or keep 36 as override)
subtitle fontSize: 16 -> typography.body
testAccountTitle fontSize: 14 -> typography.label
testAccountText fontSize: 12 -> typography.caption
errorText fontSize: 14 -> typography.bodySmall
logoContainer shadow -> ...shadows.lg
```

#### 3.3 Validation Logic
```typescript
const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isPasswordValid = password.length >= 6;

// On Input:
<Input
  validationState={email.length === 0 ? 'none' : isEmailValid ? 'valid' : 'invalid'}
  ...
/>
<Input
  validationState={password.length === 0 ? 'none' : isPasswordValid ? 'valid' : 'invalid'}
  ...
/>
```

#### 3.4 Register Screen (`app/(auth)/register.tsx`)
1. Apply `typography.*` tokens to all text
2. Add `validationState` to email and password inputs
3. Apply `shadows.*` tokens
4. Apply Noto Sans KR font family

#### 3.5 Collapsible Test Accounts
```typescript
const [showTestAccounts, setShowTestAccounts] = useState(false);

// Replace static test account view with:
<TouchableOpacity onPress={() => setShowTestAccounts(!showTestAccounts)}>
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
```

---

### Phase 4: Student Screens

**Goal**: Apply design tokens, role accent (blue), skeleton loaders, and empty states to all 5 student screens.

#### 4.1 Student Tab Layout - Role Accent

**File to modify**: `app/(student)/_layout.tsx`

Change `tabBarActiveTintColor` from `colors.primary` to the student role accent:

```typescript
import { roleColors } from '../../src/constants/theme';

// In screenOptions:
tabBarActiveTintColor: roleColors.student.accent,
tabBarLabelStyle: {
  fontFamily: 'NotoSansKR-Medium',
  fontSize: 12,
  fontWeight: '500',
},
```

#### 4.2 Student Dashboard (`app/(student)/index.tsx`)

**Changes**:
1. Replace all hardcoded `fontSize`/`fontWeight` with `typography.*` tokens
2. Replace `backgroundColor: '#F8F9FA'` with `colors.background`
3. Replace all `+ '15'`, `+ '30'` opacity suffixes with `opacityToHex(opacity.subtle)` etc.
4. Replace inline `rgba()` with opacity tokens
5. Use `sizes.*` for icon containers (44px -> `sizes.iconContainerLg`)
6. Use `shadows.sm` for card-like containers
7. Add greeting header with user name from authStore
8. Add streak indicator icon beside the streak value
9. Add homework countdown ("마감까지 3시간") to urgent homework cards
10. Use `useRoleTheme()` for progress card background color (blue accent)
11. Apply `SkeletonDashboard` while data loads (if loading state is added)

**Key style replacements**:
```
progressCard backgroundColor: colors.primary -> accent (from useRoleTheme)
progressCardTitle fontSize: 16, fontWeight: '600' -> typography.subtitle with color override
progressPercent fontSize: 36 -> fontSize: 36, fontFamily: 'NotoSansKR-Bold'
statValue fontSize: 20, fontWeight: '700' -> typography.heading3 with override
statLabel fontSize: 12 -> typography.caption
quickNavTitle fontSize: 14, fontWeight: '700' -> typography.label
sectionTitle fontSize: 18, fontWeight: '700' -> typography.subtitle with fontWeight: '700'
homeworkTitle fontSize: 16, fontWeight: '600' -> typography.subtitle
urgentBadgeText fontSize: 11 -> typography.labelSmall
progressCircle width: 52, height: 52 -> sizes.progressRingSm, sizes.progressRingSm
statIconContainer width: 44, height: 44 -> sizes.iconContainerLg, sizes.iconContainerLg
```

#### 4.3 Homework Screen (`app/(student)/homework.tsx`)

**Changes**:
1. Replace typography hardcoding throughout
2. Add `SkeletonLoader` during loading state (add `isLoading` state)
3. Add `EmptyState` when `filteredAssignments.length === 0`:
   ```
   icon: 'clipboard-text-off-outline'
   title: filterStatus === 'all' ? '숙제가 없습니다' : '조건에 맞는 숙제가 없습니다'
   description: '새로운 숙제가 배정되면 여기에 표시됩니다'
   ```
4. Replace `headerTitle fontSize: 28` with `typography.heading2`
5. Use `colors.background` instead of hardcoded background

#### 4.4 Solve Screen (`app/(student)/solve.tsx`)

**Changes**:
1. Replace hardcoded font sizes in problem number buttons
2. Apply `typography.*` tokens to problem content text
3. Add timer display (UI only, can show static or read from state)
4. Improve problem navigation bar with `useRoleTheme()` accent for active state
5. Add submit confirmation modal:
   ```typescript
   // Simple modal using react-native-paper Dialog:
   <Portal>
     <Dialog visible={showSubmitDialog} onDismiss={() => setShowSubmitDialog(false)}>
       <Dialog.Title>제출 확인</Dialog.Title>
       <Dialog.Content>
         <Text>풀지 않은 문제가 {unsolvedCount}개 있습니다. 제출하시겠습니까?</Text>
       </Dialog.Content>
       <Dialog.Actions>
         <Button mode="text" onPress={() => setShowSubmitDialog(false)}>취소</Button>
         <Button mode="contained" onPress={handleSubmit}>제출</Button>
       </Dialog.Actions>
     </Dialog>
   </Portal>
   ```
6. Problem number button active color: use `accent` from `useRoleTheme()`

#### 4.5 Wrong Notes Screen (`app/(student)/wrong-notes.tsx`)

**Changes**:
1. Replace the inline empty state (lines 174-189) with the `<EmptyState>` component
2. Replace `ActivityIndicator` loading state with `<SkeletonLoader variant="listItem" count={5} />`
3. Replace typography hardcoding:
   - `screenTitle fontSize: 28` -> `typography.heading2`
   - `screenSubtitle fontSize: 14` -> `typography.bodySmall`
   - `emptyTitle fontSize: 18` -> `typography.subtitle`
   - `startReviewText fontSize: 17` -> `typography.subtitle` with color override
4. Replace FAB shadow with `...shadows.md`
5. Add mastery progress indicator (percentage bar) above the list showing overall mastery

#### 4.6 Materials Screen (`app/(student)/materials.tsx`)

**Changes**:
1. Apply `typography.*` tokens throughout
2. Add `EmptyState` when no materials:
   ```
   icon: 'folder-open-outline'
   title: '강의자료가 없습니다'
   description: '선생님이 자료를 올리면 여기에 표시됩니다'
   ```
3. Add `SkeletonLoader` for loading state

#### 4.7 Profile Screen (`app/(student)/profile.tsx`)

**Changes**:
1. Apply `typography.*` tokens
2. Use `sizes.avatarLg` for profile avatar
3. Apply `shadows.*` tokens

#### 4.8 Analytics Screen (`app/(student)/analytics.tsx`)

**Changes**:
1. Apply `chartColors` tokens to chart components (pass as props)
2. Apply `typography.*` tokens
3. Add `SkeletonLoader` (enhance existing `AnalysisSkeleton` to use reanimated)
4. Update `AnalysisSkeleton.tsx` to use reanimated instead of `Animated` API

---

### Phase 5: Teacher Screens

**Goal**: Apply design tokens, role accent (indigo), skeleton loaders, and empty states to all 6 teacher screens.

#### 5.1 Teacher Tab Layout - Role Accent

**File to modify**: `app/(teacher)/_layout.tsx`

```typescript
import { roleColors } from '../../src/constants/theme';

// In screenOptions:
tabBarActiveTintColor: roleColors.teacher.accent,
```

#### 5.2 Teacher Dashboard (`app/(teacher)/index.tsx`)

**Changes**:
1. Replace `colors.primary` in avatar, QuickAction icons with `roleColors.teacher.accent`
2. Replace all typography hardcoding:
   - `greeting fontSize: 20` -> `typography.heading3` (22px) or keep with font family
   - `subGreeting fontSize: 14` -> `typography.bodySmall`
   - `sectionTitle fontSize: 18` -> `typography.subtitle`
   - `statValue fontSize: 28` -> `typography.heading2`
   - `statTitle fontSize: 14` -> `typography.bodySmall`
3. StatCard: use `sizes.iconLg` for icon size (32)
4. Replace `minWidth: 150` hardcoded with responsive column sizing
5. Use `useRoleTheme()` for accent colors
6. Add "주의 필요 학생" alert card if any student completion rate is low
7. Replace inline shadow in cards with `shadows.sm`

#### 5.3 Students Screen (`app/(teacher)/students.tsx`)

**Changes**:
1. Add avatar with student initials (already has `Avatar.Text`)
2. Apply typography tokens to all text elements
3. Add `EmptyState` for empty filtered results:
   ```
   icon: 'account-group-outline'
   title: '학생이 없습니다'
   description: '학생을 추가하여 관리를 시작하세요'
   actionLabel: '학생 추가'
   ```
4. Add `SkeletonListItem` for loading state
5. Improve search bar styling with Noto Sans KR
6. Use `useRoleTheme()` accent for student card accents

#### 5.4 Assignments Screen (`app/(teacher)/assignments.tsx`)

**Changes**:
1. Apply typography tokens
2. Add progress indicator improvements (ProgressBar with role accent color)
3. Add `SkeletonLoader` for loading state
4. Add `EmptyState` for no assignments

#### 5.5 Grading Screen (`app/(teacher)/grading.tsx`)

**Changes**:
1. Apply typography tokens
2. Improve the one-touch grading UI:
   - Large touch-friendly correct/incorrect buttons (min 44px)
   - Green check / Red X with clear visual feedback
3. Add `EmptyState` for no pending submissions
4. Use `sizes.avatarMd` for submission avatars
5. Use `shadows.sm` for cards

#### 5.6 Problem Bank (`app/(teacher)/problem-bank.tsx`)

**Changes**:
1. Apply typography tokens
2. Add `SkeletonLoader` for loading
3. Add `EmptyState`:
   ```
   icon: 'database-off-outline'
   title: '문제가 없습니다'
   description: '문제를 추가하여 문제은행을 만드세요'
   actionLabel: '문제 추가'
   ```
4. Improve filter chips styling

#### 5.7 Student Analytics (`app/(teacher)/student-analytics.tsx`)

**Changes**:
1. Pass `chartColors` tokens to chart components
2. Apply typography tokens
3. Add `SkeletonLoader` for loading

---

### Phase 6: Parent Screens

**Goal**: Apply design tokens, role accent (green), skeleton loaders, and empty states to all 3 parent screens.

#### 6.1 Parent Tab Layout - Role Accent

**File to modify**: `app/(parent)/_layout.tsx`

```typescript
import { roleColors } from '../../src/constants/theme';

// In screenOptions:
tabBarActiveTintColor: roleColors.parent.accent,
```

#### 6.2 Parent Dashboard (`app/(parent)/index.tsx`)

**Changes**:
1. Replace `backgroundColor: '#F8F9FA'` with `colors.background`
2. Replace `colors.primary` in weekly stats card with `roleColors.parent.accent`
3. Replace all `rgba(255,255,255,...)` with opacity tokens
4. Replace typography hardcoding:
   - `greeting fontSize: 22` -> `typography.heading3`
   - `headerSubtitle fontSize: 14` -> `typography.bodySmall`
   - `weeklyStatsTitle fontSize: 17` -> `typography.subtitle` with color override
   - `sectionTitle fontSize: 16` -> `typography.subtitle`
   - `aiAdviceTitle fontSize: 15` -> `typography.subtitle`
   - All `fontSize: 11-13` -> appropriate `typography.caption` or `typography.labelSmall`
5. Replace icon container sizes with `sizes.*`
6. Replace shadow with `shadows.sm`
7. Add `SkeletonDashboard` for loading state
8. Add child selector avatar enhancement (already has ChildSelector component)

#### 6.3 Schedule Screen (`app/(parent)/schedule.tsx`)

**Changes**:
1. Apply typography tokens
2. Apply role accent (green) to calendar highlights
3. Add `EmptyState` if no schedules
4. Add weekly/monthly toggle UI (chips)
5. Highlight urgent deadlines with `colors.error` accent

#### 6.4 Report Screen (`app/(parent)/report.tsx`)

**Changes**:
1. Apply typography tokens
2. Pass `chartColors` to RadarChart and LineChart
3. Add period selector (주간/월간) as chip filter
4. Apply role accent (green) to chart primary colors:
   ```typescript
   // Override chart colors for parent context
   const parentChartColors = {
     primaryFill: 'rgba(102, 187, 106, 0.25)',
     primaryStroke: roleColors.parent.accent,
   };
   ```
5. Add `SkeletonLoader` for chart loading

---

### Phase 7: Responsive & Accessibility

**Goal**: Implement the `useResponsive()` hook across screens and add accessibility improvements.

#### 7.1 Apply `useResponsive()` Hook

**Files to modify**: All screen files that currently use `useWindowDimensions` directly.

Replace:
```typescript
const { width } = useWindowDimensions();
const isWide = width > 768;
```

With:
```typescript
import { useResponsive } from '../../src/hooks';
const { isTablet, columns, contentPadding, isLandscape } = useResponsive();
```

**Screens affected**:
- `app/(student)/index.tsx` - uses `isWide` for 2-column layout
- `app/(student)/solve.tsx` - uses `isLandscape` for split view
- `app/(parent)/index.tsx` - uses `isWide` for 2-column layout
- `app/(parent)/schedule.tsx` - uses `isWide`
- `app/(parent)/report.tsx` - uses `isWide`

#### 7.2 Responsive Content Padding

Apply `contentPadding` from the hook to screen container padding:

```typescript
const { contentPadding } = useResponsive();
// In styles:
contentContainer: { padding: contentPadding }
```

#### 7.3 Minimum Touch Target Enforcement

Audit all touchable elements. Ensure minimum 44px touch target:

| Component | Current | Target |
|-----------|---------|--------|
| Tab bar items | tabBarHeight: 72 | OK |
| Problem number buttons | ~36px | Increase to 44px min |
| Filter chips | ~32px | Add minHeight: 36, paddingVertical |
| Icon buttons | varies | Minimum hitSlop or 44px container |
| Quick nav cards | OK | OK |

#### 7.4 Accessibility Labels

Add `accessibilityLabel` to all interactive elements that lack text labels:

```typescript
// Icon-only buttons
<IconButton accessibilityLabel="로그아웃" icon="logout" ... />
<IconButton accessibilityLabel="알림" icon="bell-outline" ... />

// Avatar buttons
<Avatar.Text accessibilityLabel={`${student.name} 프로필`} ... />

// Progress indicators
<ProgressBar accessibilityLabel={`진행률 ${Math.round(progress * 100)}퍼센트`} ... />

// Navigation cards
<TouchableOpacity accessibilityLabel="학습 분석 화면으로 이동" accessibilityRole="button" ... />
```

#### 7.5 Tab Bar Font Family

All three `_layout.tsx` tab files should use:
```typescript
tabBarLabelStyle: {
  fontFamily: 'NotoSansKR-Medium',
  fontSize: 12,
  fontWeight: '500',
},
```

---

### Phase 8: Error & Empty States

**Goal**: Add ErrorBoundary wrapper and apply EmptyState components to every data-driven screen.

#### 8.1 ErrorBoundary Component

**New file**: `src/components/common/ErrorBoundary.tsx`

```typescript
import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/theme';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback component */
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
```

#### 8.2 Apply ErrorBoundary to Root Layout

**File to modify**: `app/_layout.tsx`

Wrap the Stack with ErrorBoundary:

```typescript
import { ErrorBoundary } from '../src/components/common/ErrorBoundary';

// Inside return:
<PaperProvider theme={theme}>
  <ErrorBoundary>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  </ErrorBoundary>
</PaperProvider>
```

#### 8.3 Apply EmptyState to All Screens

This is done during Phases 4-6 for each screen. Final checklist:

| Screen | EmptyState Applied | SkeletonLoader Applied |
|--------|-------------------|----------------------|
| Student Dashboard | N/A (always has content) | Yes (SkeletonDashboard) |
| Homework | Yes | Yes |
| Solve | N/A (navigated to with data) | N/A |
| Wrong Notes | Yes (replace inline) | Yes (replace ActivityIndicator) |
| Analytics | Yes | Yes (upgrade AnalysisSkeleton) |
| Teacher Dashboard | N/A (always has content) | Yes |
| Students | Yes | Yes |
| Assignments | Yes | Yes |
| Grading | Yes | Yes |
| Problem Bank | Yes | Yes |
| Student Analytics | Yes | Yes |
| Parent Dashboard | N/A (always has content) | Yes |
| Schedule | Yes | N/A |
| Report | Yes | Yes |

#### 8.4 Update Common Components Index (Final)

**File to modify**: `src/components/common/index.ts`

```typescript
export { Button } from './Button';
export { Input } from './Input';
export { Card, CardHeader } from './Card';
export { SkeletonLoader, SkeletonStatCard, SkeletonListItem, SkeletonDashboard } from './SkeletonLoader';
export { EmptyState } from './EmptyState';
export { ErrorBoundary } from './ErrorBoundary';
```

---

## File Change Map

### New Files to Create (9 files)
| File Path | Description |
|-----------|-------------|
| `src/hooks/useRoleTheme.ts` | Role-based accent color hook |
| `src/hooks/useResponsive.ts` | Responsive breakpoints hook |
| `src/hooks/index.ts` | Hooks barrel export |
| `src/components/common/SkeletonLoader.tsx` | Skeleton loading component (reanimated) |
| `src/components/common/EmptyState.tsx` | Empty state component |
| `src/components/common/ErrorBoundary.tsx` | Error boundary component |
| `assets/fonts/NotoSansKR-Regular.ttf` | Font file (if not using expo-google-fonts package) |
| `assets/fonts/NotoSansKR-Medium.ttf` | Font file (if not using expo-google-fonts package) |
| `assets/fonts/NotoSansKR-Bold.ttf` | Font file (if not using expo-google-fonts package) |

### Files to Modify (26+ files)
| File Path | Phase | Changes |
|-----------|-------|---------|
| `package.json` | 1 | Add expo-font, @expo-google-fonts/noto-sans-kr |
| `src/constants/theme.ts` | 1 | Add typography, roleColors, shadows, opacity, sizes, chartColors, opacityToHex |
| `app/_layout.tsx` | 1, 8 | Font loading, ErrorBoundary wrapper |
| `src/components/common/Button.tsx` | 2 | Size variants, Noto Sans KR, a11y |
| `src/components/common/Card.tsx` | 2 | Touch scale feedback (reanimated), Noto Sans KR |
| `src/components/common/Input.tsx` | 2 | Validation icons, helper text, Noto Sans KR |
| `src/components/common/index.ts` | 2, 8 | Export new components |
| `app/(auth)/login.tsx` | 3 | Typography tokens, validation UX, collapsible test accounts |
| `app/(student)/_layout.tsx` | 4 | Role accent color, font family |
| `app/(student)/index.tsx` | 4 | Full token migration, greeting header, skeleton |
| `app/(student)/homework.tsx` | 4 | Tokens, EmptyState, SkeletonLoader |
| `app/(student)/solve.tsx` | 4 | Tokens, submit modal, timer, nav bar accent |
| `app/(student)/wrong-notes.tsx` | 4 | Replace inline empty/loading with components |
| `app/(student)/analytics.tsx` | 4 | Chart colors, tokens, skeleton |
| `app/(teacher)/_layout.tsx` | 5 | Role accent color (indigo), font family |
| `app/(teacher)/index.tsx` | 5 | Full token migration, role accent, attention card |
| `app/(teacher)/students.tsx` | 5 | Tokens, EmptyState, skeleton |
| `app/(teacher)/assignments.tsx` | 5 | Tokens, progress improvement, empty/skeleton |
| `app/(teacher)/grading.tsx` | 5 | Tokens, one-touch UI improvement, EmptyState |
| `app/(teacher)/problem-bank.tsx` | 5 | Tokens, EmptyState, skeleton |
| `app/(teacher)/student-analytics.tsx` | 5 | Chart colors, tokens, skeleton |
| `app/(parent)/_layout.tsx` | 6 | Role accent color (green), font family |
| `app/(parent)/index.tsx` | 6 | Full token migration, role accent, skeleton |
| `app/(parent)/schedule.tsx` | 6 | Tokens, EmptyState, calendar toggle |
| `app/(parent)/report.tsx` | 6 | Tokens, chart colors, period selector |
| `src/components/analytics/AnalysisSkeleton.tsx` | 4 | Migrate from Animated to reanimated |
| `src/components/charts/RadarChart.tsx` | 4-6 | Accept chartColors from theme (optional props already exist) |
| `src/components/charts/LineChart.tsx` | 4-6 | Accept chartColors from theme |
| `src/components/charts/BarChart.tsx` | 4-6 | Accept chartColors from theme |
| `src/components/charts/HeatMap.tsx` | 4-6 | Accept chartColors from theme |

---

## Dependency Changes

### Packages to Install

```bash
npx expo install expo-font expo-splash-screen
# Then manually download Noto Sans KR .ttf files from Google Fonts
# Place in: assets/fonts/NotoSansKR-{Regular,Medium,Bold}.ttf
```

| Package | Purpose | Notes |
|---------|---------|-------|
| `expo-font` | Load custom Noto Sans KR font files | May already be a transitive dependency |
| `expo-splash-screen` | Keep splash visible during font loading | May already be a transitive dependency |
| Manual `.ttf` files | Noto Sans KR Regular/Medium/Bold | ~300-600KB for 3 weights, no npm package needed |

**No other new packages required.** `react-native-reanimated` v4.2.1 is already installed.

### Packages NOT Needed (explicitly excluded)
- No animation library beyond existing reanimated
- No new chart library
- No dark mode library
- No additional icon library

---

## Testing Strategy

### Phase 1: Design Token System
- [ ] **TypeScript check**: `npx tsc --noEmit` passes with all new exports
- [ ] **Font loading**: App launches on iOS simulator, Android emulator, and Expo Web without crash; Noto Sans KR renders correctly for Korean text
- [ ] **Theme integration**: react-native-paper components (Button, TextInput) render with Noto Sans KR
- [ ] **Import verification**: All new exports (`typography`, `roleColors`, `shadows`, `opacity`, `sizes`, `chartColors`, `opacityToHex`) import correctly from `src/constants/theme`

### Phase 2: Common Components
- [ ] **SkeletonLoader**: Renders shimmer animation on all three platforms; no jank on 60fps
- [ ] **EmptyState**: Renders icon, title, description, and optional action button
- [ ] **Button sizes**: `sm`, `md`, `lg` render at correct heights (36, 44, 52)
- [ ] **Card touch feedback**: Scale animation (0.98) plays on press
- [ ] **Input validation**: Check icon appears for valid, X icon for invalid

### Phase 3: Login Screen
- [ ] **Visual**: Noto Sans KR renders on all text; login form looks clean
- [ ] **Validation**: Email field shows green check for valid email, red X for invalid
- [ ] **Collapsible**: Test accounts section expands/collapses
- [ ] **Function**: Login still works for all three test accounts

### Phases 4-6: Screen-Level Testing
For each screen:
- [ ] **Visual regression**: No layout breaks on tablet (1024px+) and mobile (375px)
- [ ] **Typography**: No hardcoded `fontSize` values remain (verify via search)
- [ ] **Role accent**: Teacher screens use indigo, student blue, parent green in tab bar and hero cards
- [ ] **Empty state**: When data is empty, EmptyState component renders
- [ ] **Skeleton**: When data is loading, skeleton renders instead of spinner
- [ ] **Function**: All navigation and interactions still work as before

### Phase 7: Responsive & Accessibility
- [ ] **Breakpoints**: 2-column layout activates at >768px; 1-column below
- [ ] **Touch targets**: All interactive elements are at least 44px
- [ ] **Screen reader**: VoiceOver (iOS) / TalkBack (Android) reads all `accessibilityLabel` values
- [ ] **Landscape**: Solve screen split-view works correctly

### Phase 8: Error & Empty States
- [ ] **ErrorBoundary**: Simulated throw in a child component shows error UI with retry button
- [ ] **Retry**: Clicking retry re-renders the child component
- [ ] **Comprehensive**: Every screen with data loading has been verified

### Overall Verification Commands
```bash
# TypeScript compilation check
npx tsc --noEmit

# Start on all platforms
npx expo start
npx expo start --web

# Verify no hardcoded font sizes remain (after all phases)
# Search codebase for: fontSize: [0-9]+ (in .tsx files, outside theme.ts)
```

---

## Risk Assessment

### Risk 1: Font Loading Failure
**Problem**: Noto Sans KR fails to load on some devices, causing invisible text.
**Mitigation**: The `useFonts` hook returns `fontsLoaded` boolean. We do not render the app until fonts are loaded. Splash screen remains visible. If fonts fail to load after timeout, fallback to system font by checking the loaded state.
**Additional safety**: Add a timeout fallback:
```typescript
const [fontTimeout, setFontTimeout] = useState(false);
useEffect(() => {
  const timer = setTimeout(() => setFontTimeout(true), 5000);
  return () => clearTimeout(timer);
}, []);
if (!fontsLoaded && !fontTimeout) return null;
```

### Risk 2: Reanimated Compatibility with PaperCard
**Problem**: `Animated.createAnimatedComponent(PaperCard)` may not work correctly.
**Mitigation**: Test on first implementation. If it fails, wrap PaperCard in an `Animated.View` for the scale transform instead.

### Risk 3: Web Compatibility (expo-font)
**Problem**: Custom fonts may behave differently on Expo Web vs native.
**Mitigation**: expo-font supports web via `@font-face` injection. Test on web early in Phase 1. If issues arise, provide web-specific font loading via CSS.

### Risk 4: Bundle Size Increase
**Problem**: Noto Sans KR font files add to app bundle.
**Mitigation**: Using only 3 weights (Regular, Medium, Bold) keeps the addition to approximately 300-600KB total, which is acceptable for a tablet app.

### Risk 5: Large Screen Files
**Problem**: Some screen files are 600+ lines. Adding skeleton/empty state increases complexity.
**Mitigation**: Extract reusable sub-components (e.g., `StatCard`, `HomeworkCard`) into separate files in `src/components/` domain folders. This is a refactoring opportunity but NOT required for this enhancement -- it can be done incrementally.

### Risk 6: TypeScript Strict Mode
**Problem**: New token types and component props must satisfy strict TypeScript.
**Mitigation**: All new code includes explicit TypeScript types. Use `as const` for token objects. Export types alongside values.

### Risk 7: MathText WebView Font Limitation
**Problem**: `MathText.tsx` renders HTML inside WebView/iframe. Noto Sans KR loaded via `expo-font` is NOT available inside WebView content. LaTeX and surrounding text will still use system fonts in WebView.
**Mitigation**: Add a CSS `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700')` to the KaTeX HTML template in MathText.tsx. This loads the web font for WebView content. Note: requires internet connection for first load; fonts are then cached by the browser.

### Risk 8: Performance on Mid-Range Tablets
**Problem**: Reanimated shimmer on multiple skeleton items could impact performance.
**Mitigation**: The shimmer uses a single shared value with `interpolate`, which is efficient. Test with 10+ skeleton items on an Android tablet. If performance issues arise, reduce shimmer to a simple opacity pulse (which is what we're already doing).

---

## Estimated Effort by Phase

| Phase | Estimated Effort | Files Changed |
|-------|-----------------|---------------|
| Phase 1: Design Token System | Medium | 3 new + 2 modified |
| Phase 2: Common Components | Medium | 3 new + 4 modified |
| Phase 3: Login Screen | Small | 1 modified |
| Phase 4: Student Screens | Large | 5 modified + 1 refactored |
| Phase 5: Teacher Screens | Large | 6 modified |
| Phase 6: Parent Screens | Medium | 3 modified |
| Phase 7: Responsive & A11y | Medium | 8+ modified |
| Phase 8: Error & Empty States | Small | 1 new + 2 modified |

**Total**: ~9 new files, ~26+ modified files.

---

## Summary of Key Artifacts

| Artifact | Location |
|----------|----------|
| Design tokens (all) | `src/constants/theme.ts` |
| Role theme hook | `src/hooks/useRoleTheme.ts` |
| Responsive hook | `src/hooks/useResponsive.ts` |
| SkeletonLoader | `src/components/common/SkeletonLoader.tsx` |
| EmptyState | `src/components/common/EmptyState.tsx` |
| ErrorBoundary | `src/components/common/ErrorBoundary.tsx` |
| Enhanced Button | `src/components/common/Button.tsx` |
| Enhanced Card | `src/components/common/Card.tsx` |
| Enhanced Input | `src/components/common/Input.tsx` |
| Font loading | `app/_layout.tsx` |
