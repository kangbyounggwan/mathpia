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
