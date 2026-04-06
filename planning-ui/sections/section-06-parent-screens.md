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
