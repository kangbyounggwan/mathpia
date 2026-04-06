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
