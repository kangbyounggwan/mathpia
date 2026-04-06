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
