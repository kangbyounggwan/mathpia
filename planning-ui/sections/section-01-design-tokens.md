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
