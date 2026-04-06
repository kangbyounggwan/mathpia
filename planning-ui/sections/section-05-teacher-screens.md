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
