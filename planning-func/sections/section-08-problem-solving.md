# Section 8: Problem Solving + Submission Flow (Student)

> **Depends on**: Section 4 (Supabase Services), Section 7 (Assignment Creation Flow)
> **Blocks**: Section 9 (Grading Flow)
> **Estimated Effort**: 1-1.5 days
> **Priority**: HIGH

---

## 1. Background

This section implements the complete student problem-solving experience. Today, both `homework.tsx` and `solve.tsx` operate entirely on hardcoded mock data. The homework screen (lines 20-57) defines a `mockAssignments` array with 4 fake assignments, and the solve screen (lines 13-35) defines a `mockProblems` array with 3 fake problems. Neither screen connects to any Zustand store. The canvas drawing component works (SVG-based via `react-native-svg`), but the "save" button is a no-op (`// TODO: save image`) and the "submit" button calls `alert()` instead of persisting anything.

After this section is complete:
- The homework list displays real assignments fetched from Supabase via `assignmentStore.fetchStudentAssignments()`
- The solve screen loads real problems for the selected assignment, renders them with LaTeX via `MathText`, and supports multiple answer input types (multiple choice, short answer, essay/canvas)
- Canvas drawings are captured as PNG snapshots, uploaded to Supabase Storage (`submissions` bucket, private), and accessed via signed URLs
- Each submitted answer creates a real `submissions` row in Supabase
- Progress updates automatically via the `update_assignment_progress` database trigger
- Time spent per problem is tracked and submitted
- Large canvas stroke data (`canvasData`) is stripped from Zustand persistence to avoid exceeding AsyncStorage limits

---

## 2. Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| F8.1 | Student sees a filtered list of their assigned homework with real status, progress, and due dates | MUST |
| F8.2 | Tapping an assignment navigates to the solve screen with correct problems loaded | MUST |
| F8.3 | Problems display with LaTeX rendering via `MathText` component | MUST |
| F8.4 | Multiple-choice problems show selectable option buttons (1-5) | MUST |
| F8.5 | Short-answer problems show a text input field | MUST |
| F8.6 | Essay/canvas problems allow freehand drawing on the canvas | MUST |
| F8.7 | "Save" button captures the canvas as a PNG and uploads to Supabase Storage | MUST |
| F8.8 | "Submit" button creates a `submissions` row with answer text, image URL, and time spent | MUST |
| F8.9 | Progress bar updates after each submission (via DB trigger) | MUST |
| F8.10 | After all problems are submitted, show completion message and navigate back | MUST |
| F8.11 | Timer tracks elapsed time per problem | SHOULD |
| F8.12 | Problem navigation allows jumping to any problem number | SHOULD |
| F8.13 | Canvas stroke data is NOT persisted to AsyncStorage (stripped via `partialize`) | MUST |
| F8.14 | Store hydration guard prevents rendering empty lists during rehydration | SHOULD |

### Non-Functional Requirements

| ID | Requirement |
|----|------------|
| NF8.1 | Canvas snapshot + upload completes within 3 seconds on a modern tablet |
| NF8.2 | PNG images are compressed to reasonable size (< 500KB per snapshot) |
| NF8.3 | Signed URLs use 1-hour expiry for security |
| NF8.4 | Korean text displays correctly in all problem content and UI labels |

---

## 3. Dependencies

### Requires (must be completed first)

| Section | What is needed | Why |
|---------|---------------|-----|
| **Section 4** (Supabase Services) | `supabaseAssignmentService` with `submitAnswer()`, `listByStudent()`, `getById()`, `getProblems()` | The solve screen calls `services.assignment.submitAnswer()` via the submission store; homework list calls `services.assignment.listByStudent()` via the assignment store |
| **Section 7** (Assignment Creation) | Published assignments with problems and `assignment_students` rows | Without real assignments in the database, there is nothing for the student to solve |

### Blocks (cannot start until this section completes)

| Section | Why |
|---------|-----|
| **Section 9** (Grading Flow) | The grading screen displays submitted answers (text + canvas images) and requires `submissions` rows to exist in the database. Without real submissions, there is nothing to grade |

### External Dependencies

| Dependency | Current Status | Notes |
|-----------|---------------|-------|
| `react-native-svg` | Installed (v15.15.1) | Canvas currently uses SVG `<Path>` elements, NOT `@shopify/react-native-skia`. See Step 4.3 for Skia migration notes |
| `@supabase/supabase-js` | Installed in Section 2 | Required for Storage upload and signed URL generation |
| `base64-arraybuffer` | **NOT installed** | Required for decoding base64 to `Uint8Array` for Supabase Storage upload. Must be installed |
| Supabase Storage `submissions` bucket | Created in Section 1 | Private bucket with RLS: students can upload to their own path, teachers can read |

---

## 4. Implementation Details

### Step 8.1: Install Missing Dependency

The canvas snapshot produces a base64 string. Supabase Storage's `.upload()` method requires either a `Blob`, `File`, `ArrayBuffer`, or `Uint8Array` -- NOT a raw base64 string. Install `base64-arraybuffer` to handle the conversion:

```bash
npx expo install base64-arraybuffer
```

Verify the import works:

```typescript
import { decode } from 'base64-arraybuffer';
// decode(base64String) returns an ArrayBuffer that Supabase Storage accepts
```

### Step 8.2: Modify Homework List (`app/(student)/homework.tsx`)

**Current state**: Lines 20-57 define `mockAssignments` with 4 hardcoded items. The component uses this array directly, never calling any store.

**Target state**: Remove all mock data. Connect to `useAssignmentStore` and `useAuthStore`. Fetch real assignments on mount.

#### Full replacement for `homework.tsx`

```typescript
// app/(student)/homework.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, Chip, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, EmptyState } from '../../src/components/common';
import { colors, spacing, typography, opacity, opacityToHex } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { useAssignmentStore } from '../../src/stores/assignmentStore';
import type { Assignment, StudentAssignmentStatus } from '../../src/types';

// Map assignment + student status to a display-friendly structure
interface HomeworkDisplayItem {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  problemCount: number;
  completedCount: number;
  status: 'in_progress' | 'completed' | 'not_started' | 'graded';
  progressPercent: number;
}

/**
 * Derive display status from the assignment data.
 * The assignment object contains `assignedStudents` but the per-student
 * progress comes from the `assignment_students` table (fetched by the service
 * and mapped into the Assignment type by Section 4).
 */
const mapToDisplayItem = (
  assignment: Assignment,
  studentProgress?: { status: StudentAssignmentStatus; progressPercent: number }
): HomeworkDisplayItem => {
  const problemCount = assignment.problems?.length ?? 0;
  const progressPercent = studentProgress?.progressPercent ?? 0;
  const completedCount = Math.round((progressPercent / 100) * problemCount);

  let status: HomeworkDisplayItem['status'] = 'not_started';
  if (studentProgress?.status === 'graded') {
    status = 'graded';
  } else if (studentProgress?.status === 'submitted') {
    status = 'completed';
  } else if (studentProgress?.status === 'in_progress' || progressPercent > 0) {
    status = 'in_progress';
  }

  // Format due date as YYYY-MM-DD string
  const dueDate = typeof assignment.dueDate === 'string'
    ? assignment.dueDate.split('T')[0]
    : new Date(assignment.dueDate).toISOString().split('T')[0];

  return {
    id: assignment.id,
    title: assignment.title,
    subject: assignment.subject,
    dueDate,
    problemCount,
    completedCount,
    status,
    progressPercent,
  };
};

export default function HomeworkScreen() {
  const { user } = useAuthStore();
  const {
    assignments,
    fetchStudentAssignments,
    isLoading,
    error,
  } = useAssignmentStore();

  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch assignments on mount
  useEffect(() => {
    if (user) {
      fetchStudentAssignments(user.id);
    }
  }, [user]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchStudentAssignments(user.id);
    setRefreshing(false);
  }, [user]);

  // Map assignments to display items
  // Note: The assignment service's listByStudent() should return assignments
  // with the student's progress data embedded. If not available yet, we
  // derive what we can from the problems array.
  const displayItems: HomeworkDisplayItem[] = assignments.map((a) => mapToDisplayItem(a));

  const filteredItems = displayItems.filter(
    (item) => filter === 'all' || item.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return colors.warning;
      case 'completed':   return colors.success;
      case 'graded':      return colors.primary;
      case 'not_started': return colors.textSecondary;
      default:            return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return '진행중';
      case 'completed':   return '완료';
      case 'graded':      return '채점완료';
      case 'not_started': return '시작전';
      default:            return status;
    }
  };

  const renderAssignment = ({ item }: { item: HomeworkDisplayItem }) => {
    const progress = item.problemCount > 0
      ? item.completedCount / item.problemCount
      : 0;

    return (
      <Card
        style={styles.assignmentCard}
        onPress={() => router.push(`/(student)/solve?assignmentId=${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{item.title}</Text>
            <Chip
              compact
              style={[
                styles.statusChip,
                { backgroundColor: getStatusColor(item.status) + opacityToHex(opacity.muted) },
              ]}
              textStyle={{
                color: getStatusColor(item.status),
                fontFamily: 'NotoSansKR-Medium',
                fontSize: 12,
              }}
            >
              {getStatusText(item.status)}
            </Chip>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </View>

        <Text style={styles.subject}>{item.subject}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="file-document" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.problemCount}문제</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>마감: {item.dueDate}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>진행률</Text>
            <Text style={styles.progressValue}>
              {item.completedCount}/{item.problemCount} ({Math.round(progress * 100)}%)
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            color={progress === 1 ? colors.success : colors.primary}
            style={styles.progressBar}
          />
        </View>
      </Card>
    );
  };

  // Loading state
  if (isLoading && assignments.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md, ...typography.body, color: colors.textSecondary }}>
          숙제 목록을 불러오는 중...
        </Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && assignments.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title="오류가 발생했습니다"
          description={error}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filterContainer}>
        {(['all', 'in_progress', 'not_started', 'completed'] as const).map((status) => (
          <Chip
            key={status}
            selected={filter === status}
            onPress={() => setFilter(status)}
            style={styles.filterChip}
            showSelectedCheck={false}
            textStyle={{ fontFamily: 'NotoSansKR-Medium', fontSize: 13 }}
          >
            {status === 'all' ? '전체' : getStatusText(status)}
          </Chip>
        ))}
      </View>

      {/* AI learning analysis banner */}
      <View style={styles.aiBannerContainer}>
        <Card
          style={styles.aiBanner}
          onPress={() => router.push('/(student)/analytics')}
        >
          <View style={styles.aiBannerContent}>
            <View style={styles.aiBannerLeft}>
              <View style={styles.aiBannerIconContainer}>
                <MaterialCommunityIcons name="brain" size={28} color={colors.secondary} />
              </View>
              <View style={styles.aiBannerTextContainer}>
                <Text style={styles.aiBannerTitle}>AI 학습분석</Text>
                <Text style={styles.aiBannerSubtitle}>내 취약점 분석 & 맞춤 문제 추천</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </View>
        </Card>
      </View>

      {/* Assignment list */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderAssignment}
        contentContainerStyle={[
          styles.listContent,
          filteredItems.length === 0 && { flex: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-text-off-outline"
            title={filter === 'all' ? '숙제가 없습니다' : '조건에 맞는 숙제가 없습니다'}
            description="새로운 숙제가 배정되면 여기에 표시됩니다"
          />
        }
      />
    </SafeAreaView>
  );
}

// Styles remain the same as current homework.tsx (lines 208-335)
// Copy existing StyleSheet from the current file unchanged.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: spacing.xs,
    minHeight: 44,
  },
  aiBannerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  aiBanner: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  aiBannerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  aiBannerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  aiBannerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight + opacityToHex(opacity.muted),
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  aiBannerTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  aiBannerTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  aiBannerSubtitle: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  assignmentCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    fontSize: 18,
    color: colors.textPrimary,
  },
  statusChip: {},
  subject: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  progressSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  progressValue: {
    ...typography.label,
    color: colors.textPrimary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});
```

**Key changes from original**:
- Removed `mockAssignments` array (lines 20-57 of original)
- Added `useAuthStore` and `useAssignmentStore` imports
- Added `useEffect` to fetch on mount with `fetchStudentAssignments(user.id)`
- Added pull-to-refresh via `RefreshControl`
- Added loading and error states
- Added `mapToDisplayItem()` utility to convert `Assignment` type to display format
- Added `'graded'` status with Korean label "채점완료"

### Step 8.3: Modify Solve Screen (`app/(student)/solve.tsx`)

**Current state**: Lines 13-35 define `mockProblems` with 3 hardcoded problems. The canvas works but `handleSave` is a no-op and `confirmSubmit` calls `alert()`. The header shows hardcoded title "이차방정식 연습" (line 178).

**Target state**: Load real problems from the assignment. Render with `MathText`. Support multiple answer types. Upload canvas snapshots to Supabase Storage. Submit answers to the `submissions` table. Track time per problem.

#### Full replacement for `solve.tsx`

```typescript
// app/(student)/solve.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  ProgressBar,
  Portal,
  Dialog,
  Button as PaperButton,
  RadioButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawingCanvas, useCanvasControls, CanvasToolbar } from '../../src/components/canvas';
import MathText from '../../src/components/common/MathText';
import {
  colors,
  spacing,
  typography,
  opacity,
  opacityToHex,
  borderRadius,
} from '../../src/constants/theme';
import { useRoleTheme, useResponsive } from '../../src/hooks';
import { CanvasTool, CanvasBackground } from '../../src/types';
import type { Assignment, Problem, ProblemType } from '../../src/types';
import { useAuthStore } from '../../src/stores/authStore';
import { useAssignmentStore } from '../../src/stores/assignmentStore';
import { useSubmissionStore } from '../../src/stores/submissionStore';
import { supabase } from '../../src/lib/supabase';
import { decode } from 'base64-arraybuffer';

// ── Problem Number Button Component ─────────────────────────

interface ProblemNumberButtonProps {
  number: number;
  isActive: boolean;
  isCompleted: boolean;
  onPress: () => void;
  accentColor: string;
}

const ProblemNumberButton: React.FC<ProblemNumberButtonProps> = ({
  number,
  isActive,
  isCompleted,
  onPress,
  accentColor,
}) => (
  <TouchableOpacity
    style={[
      styles.problemNumberButton,
      isActive && [styles.problemNumberButtonActive, { backgroundColor: accentColor }],
      isCompleted && !isActive && styles.problemNumberButtonCompleted,
    ]}
    onPress={onPress}
    accessibilityLabel={`문제 ${number}${isCompleted ? ' (완료)' : ''}${isActive ? ' (현재)' : ''}`}
    accessibilityRole="button"
  >
    {isCompleted && !isActive ? (
      <MaterialCommunityIcons name="check" size={16} color={colors.success} />
    ) : (
      <Text
        style={[
          styles.problemNumberText,
          isActive && styles.problemNumberTextActive,
        ]}
      >
        {number}
      </Text>
    )}
  </TouchableOpacity>
);

// ── Multiple Choice Answer Component ────────────────────────

interface MultipleChoiceInputProps {
  choices: string[];
  selectedAnswer: string;
  onSelect: (answer: string) => void;
}

const MultipleChoiceInput: React.FC<MultipleChoiceInputProps> = ({
  choices,
  selectedAnswer,
  onSelect,
}) => (
  <View style={styles.choicesContainer}>
    <Text style={styles.answerSectionTitle}>답 선택</Text>
    {choices.map((choice, index) => {
      const label = `${index + 1}`;
      const isSelected = selectedAnswer === label;
      return (
        <TouchableOpacity
          key={index}
          style={[styles.choiceItem, isSelected && styles.choiceItemSelected]}
          onPress={() => onSelect(label)}
          accessibilityLabel={`선택지 ${label}: ${choice}`}
          accessibilityRole="radio"
          accessibilityState={{ selected: isSelected }}
        >
          <View style={[styles.choiceNumber, isSelected && styles.choiceNumberSelected]}>
            <Text style={[styles.choiceNumberText, isSelected && styles.choiceNumberTextSelected]}>
              {label}
            </Text>
          </View>
          <MathText content={choice} fontSize={15} style={{ flex: 1 }} />
        </TouchableOpacity>
      );
    })}
  </View>
);

// ── Short Answer Input Component ────────────────────────────

interface ShortAnswerInputProps {
  value: string;
  onChange: (text: string) => void;
}

const ShortAnswerInput: React.FC<ShortAnswerInputProps> = ({ value, onChange }) => (
  <View style={styles.shortAnswerContainer}>
    <Text style={styles.answerSectionTitle}>답 입력</Text>
    <TextInput
      style={styles.shortAnswerInput}
      value={value}
      onChangeText={onChange}
      placeholder="답을 입력하세요"
      placeholderTextColor={colors.textDisabled}
      returnKeyType="done"
      accessibilityLabel="단답형 답 입력"
    />
  </View>
);

// ── Canvas Snapshot Upload Helper ───────────────────────────

/**
 * Captures the SVG canvas strokes as a base64 PNG and uploads to Supabase Storage.
 *
 * IMPORTANT NOTES:
 * 1. Use `decode()` from `base64-arraybuffer` to convert base64 → ArrayBuffer
 *    because Supabase Storage `.upload()` does NOT accept raw base64 strings.
 * 2. Use `createSignedUrl()` NOT `getPublicUrl()` because the `submissions`
 *    bucket is private. `getPublicUrl()` returns a URL that 403s on private buckets.
 * 3. The signed URL has a 1-hour expiry (3600 seconds). Teachers viewing
 *    submissions in the grading screen will also use `createSignedUrl()`.
 *
 * For the current SVG-based canvas (react-native-svg), we cannot directly
 * capture a raster snapshot from the SVG. The approach depends on the canvas
 * implementation:
 *
 * Option A (current SVG): Use `react-native-view-shot` to capture the
 *   canvas View as an image. This requires installing the package.
 *
 * Option B (Skia migration): If migrated to @shopify/react-native-skia,
 *   use `canvasRef.current.makeImageSnapshot().encodeToBase64()`.
 *
 * This implementation uses Option A (react-native-view-shot).
 */
const uploadCanvasSnapshot = async (
  base64Data: string,
  userId: string,
  assignmentId: string,
  problemId: string
): Promise<string | undefined> => {
  try {
    const filePath = `${userId}/${assignmentId}/${problemId}_${Date.now()}.png`;

    // Decode base64 to ArrayBuffer for Supabase Storage upload
    const arrayBuffer = decode(base64Data);

    const { data, error } = await supabase.storage
      .from('submissions')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/png',
        upsert: true, // Overwrite if re-submitting the same problem
      });

    if (error) {
      console.error('Storage upload error:', error);
      return undefined;
    }

    // Generate a signed URL for private bucket access
    // DO NOT use getPublicUrl() -- it returns 403 on private buckets
    const { data: signedData, error: signedError } = await supabase.storage
      .from('submissions')
      .createSignedUrl(data.path, 3600); // 1-hour expiry

    if (signedError) {
      console.error('Signed URL error:', signedError);
      return undefined;
    }

    return signedData?.signedUrl;
  } catch (err) {
    console.error('Canvas upload failed:', err);
    return undefined;
  }
};

// ── Main Solve Screen ───────────────────────────────────────

export default function SolveScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { user } = useAuthStore();
  const { getAssignmentById } = useAssignmentStore();
  const { submitAnswer } = useSubmissionStore();
  const { isTablet, isLandscape: rawIsLandscape, width: screenWidth, height: screenHeight } =
    useResponsive();
  const { accent } = useRoleTheme();

  // ── State ─────────────────────────────────────────────────
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [completedProblems, setCompletedProblems] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Answer state (per problem, keyed by index)
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Timer state (per problem)
  const [problemStartTime, setProblemStartTime] = useState(Date.now());
  const [timePerProblem, setTimePerProblem] = useState<Record<number, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Canvas state
  const [tool, setTool] = useState<CanvasTool>('pen');
  const [strokeColor, setStrokeColor] = useState(colors.canvasBlack);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [background, setBackground] = useState<CanvasBackground>('blank');
  const canvasControls = useCanvasControls();
  const canvasViewRef = useRef<View>(null);

  // Submit dialog state
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Landscape mode for tablet
  const isLandscape = rawIsLandscape && isTablet;

  // ── Load Assignment ───────────────────────────────────────
  useEffect(() => {
    const loadAssignment = async () => {
      if (!assignmentId) return;
      setLoadingAssignment(true);
      try {
        const a = await getAssignmentById(assignmentId as string);
        setAssignment(a);
      } catch (err) {
        console.error('Failed to load assignment:', err);
        Alert.alert('오류', '숙제를 불러오는데 실패했습니다.', [
          { text: '확인', onPress: () => router.back() },
        ]);
      } finally {
        setLoadingAssignment(false);
      }
    };
    loadAssignment();
  }, [assignmentId]);

  // ── Timer ─────────────────────────────────────────────────
  // Track elapsed time for the current problem
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - problemStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [problemStartTime]);

  // Reset timer when problem changes
  useEffect(() => {
    // Save accumulated time for the previous problem
    setTimePerProblem((prev) => ({
      ...prev,
      [currentProblemIndex]: (prev[currentProblemIndex] ?? 0) + elapsedSeconds,
    }));
    // Reset timer for new problem
    setProblemStartTime(Date.now());
    setElapsedSeconds(0);
  }, [currentProblemIndex]);

  // ── Helpers ───────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const problems = assignment?.problems ?? [];
  const currentProblem = problems[currentProblemIndex];
  const totalProblems = problems.length;

  // Determine problem type for answer input rendering
  // The Problem type embedded in Assignment may not have `type` directly.
  // If available from ProblemBankItem (via getProblems()), use it.
  // Fallback: if choices exist, it's multiple choice; otherwise essay/short answer.
  const getProblemType = (problem: Problem): ProblemType => {
    // If the problem has choices, it's multiple choice
    if ((problem as any).choices && (problem as any).choices.length > 0) {
      return '객관식';
    }
    // If the problem has a short numeric/text answer, it's short answer
    if ((problem as any).type) {
      return (problem as any).type;
    }
    // Default to essay (canvas-based)
    return '서술형';
  };

  // Canvas size calculation
  const canvasWidth = isLandscape
    ? (screenWidth - spacing.lg * 3) * 0.55
    : screenWidth - spacing.lg * 2;
  const canvasHeight = isLandscape ? screenHeight - 180 : 400;

  // ── Navigation ────────────────────────────────────────────
  const handlePrevious = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1);
      canvasControls.clear();
    }
  };

  const handleNext = () => {
    if (currentProblemIndex < totalProblems - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
      canvasControls.clear();
    }
  };

  const goToProblem = (index: number) => {
    setCurrentProblemIndex(index);
    canvasControls.clear();
  };

  // ── Answer Management ─────────────────────────────────────
  const setCurrentAnswer = (text: string) => {
    setAnswers((prev) => ({ ...prev, [currentProblemIndex]: text }));
  };

  // ── Save (single problem) ────────────────────────────────
  const handleSave = async () => {
    if (!user || !assignment || !currentProblem) return;
    setIsSubmitting(true);

    try {
      const problemType = getProblemType(currentProblem);
      let answerImageUrl: string | undefined;

      // For essay/canvas problems, capture and upload the canvas
      if (problemType === '서술형' && canvasControls.strokes.length > 0) {
        // Use react-native-view-shot to capture the canvas view as base64 PNG
        // (See Step 8.4 for react-native-view-shot installation and setup)
        let captureRef: any;
        try {
          captureRef = require('react-native-view-shot');
        } catch {
          console.warn('react-native-view-shot not available, skipping canvas capture');
        }

        if (captureRef && canvasViewRef.current) {
          const base64 = await captureRef.captureRef(canvasViewRef.current, {
            format: 'png',
            quality: 0.8,
            result: 'base64',
          });
          answerImageUrl = await uploadCanvasSnapshot(
            base64,
            user.id,
            assignment.id,
            currentProblem.id
          );
        }
      }

      // Calculate time spent on this problem
      const currentElapsed = Math.floor((Date.now() - problemStartTime) / 1000);
      const totalTimeForProblem = (timePerProblem[currentProblemIndex] ?? 0) + currentElapsed;

      // Submit answer via store → service → Supabase
      await submitAnswer({
        assignmentId: assignment.id,
        studentId: user.id,
        problemId: currentProblem.id,
        answerText: answers[currentProblemIndex] || undefined,
        answerImageUrl,
        // NOTE: canvasData is intentionally omitted from the submission.
        // The canvas image is already uploaded as a PNG to Supabase Storage.
        // Raw stroke data is large and would bloat AsyncStorage on persist.
        timeSpentSeconds: totalTimeForProblem,
      });

      // Mark problem as completed
      setCompletedProblems((prev) => new Set(prev).add(currentProblemIndex));

      // Auto-advance to next unsolved problem
      if (currentProblemIndex < totalProblems - 1) {
        const nextUnsolved = findNextUnsolvedIndex(currentProblemIndex);
        if (nextUnsolved !== -1) {
          setCurrentProblemIndex(nextUnsolved);
          canvasControls.clear();
        }
      }
    } catch (err) {
      console.error('Save failed:', err);
      Alert.alert('저장 실패', '답안 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const findNextUnsolvedIndex = (fromIndex: number): number => {
    for (let i = fromIndex + 1; i < totalProblems; i++) {
      if (!completedProblems.has(i)) return i;
    }
    return -1;
  };

  // ── Submit All ────────────────────────────────────────────
  const handleSubmitAll = () => {
    const unsolvedCount = totalProblems - completedProblems.size;
    if (unsolvedCount > 0) {
      setShowSubmitDialog(true);
    } else {
      confirmSubmit();
    }
  };

  const confirmSubmit = async () => {
    setShowSubmitDialog(false);

    // Save current problem first if it has an answer but hasn't been saved
    if (
      !completedProblems.has(currentProblemIndex) &&
      (answers[currentProblemIndex] || canvasControls.strokes.length > 0)
    ) {
      await handleSave();
    }

    Alert.alert(
      '제출 완료',
      `${completedProblems.size}/${totalProblems} 문제가 제출되었습니다!`,
      [{ text: '확인', onPress: () => router.back() }]
    );
  };

  // ── Loading State ─────────────────────────────────────────
  if (loadingAssignment) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md, ...typography.body, color: colors.textSecondary }}>
          문제를 불러오는 중...
        </Text>
      </SafeAreaView>
    );
  }

  if (!assignment || problems.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textSecondary} />
        <Text style={{ marginTop: spacing.md, ...typography.body, color: colors.textSecondary }}>
          문제를 찾을 수 없습니다
        </Text>
        <TouchableOpacity style={{ marginTop: spacing.md }} onPress={() => router.back()}>
          <Text style={{ ...typography.label, color: colors.primary }}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const problemType = getProblemType(currentProblem);

  // ── Render ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignmentTitle} numberOfLines={1}>
              {assignment.title}
            </Text>
            <View style={styles.assignmentMeta}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.assignmentMetaText}>
                마감: {typeof assignment.dueDate === 'string'
                  ? assignment.dueDate.split('T')[0]
                  : new Date(assignment.dueDate).toISOString().split('T')[0]}
              </Text>
            </View>
          </View>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons name="timer-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {completedProblems.size}/{totalProblems} 완료
            </Text>
            <ProgressBar
              progress={totalProblems > 0 ? completedProblems.size / totalProblems : 0}
              color={colors.success}
              style={styles.headerProgress}
            />
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitAll}
            accessibilityLabel="숙제 제출"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>제출</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Problem Number Navigation */}
      <View style={styles.problemNavigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.problemNumbers}>
            {problems.map((_, index) => (
              <ProblemNumberButton
                key={index}
                number={index + 1}
                isActive={currentProblemIndex === index}
                isCompleted={completedProblems.has(index)}
                onPress={() => goToProblem(index)}
                accentColor={accent}
              />
            ))}
          </View>
        </ScrollView>
        <View style={styles.navArrows}>
          <TouchableOpacity
            style={[styles.navArrowButton, currentProblemIndex === 0 && styles.navArrowButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentProblemIndex === 0}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={currentProblemIndex === 0 ? colors.textDisabled : colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navArrowButton,
              currentProblemIndex === totalProblems - 1 && styles.navArrowButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={currentProblemIndex === totalProblems - 1}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={currentProblemIndex === totalProblems - 1 ? colors.textDisabled : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={[styles.mainContent, isLandscape && styles.mainContentLandscape]}>
        {/* Problem Display Area */}
        <View style={[styles.problemSection, isLandscape && styles.problemSectionLandscape]}>
          <View style={styles.problemCard}>
            <View style={styles.problemHeader}>
              <View style={styles.problemBadge}>
                <Text style={styles.problemBadgeText}>문제 {currentProblemIndex + 1}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
                <Text style={styles.pointsText}>{currentProblem.points}점</Text>
              </View>
            </View>

            <ScrollView style={styles.problemScrollView} showsVerticalScrollIndicator={false}>
              {/* Render problem content with LaTeX support via MathText */}
              <MathText
                content={currentProblem.content}
                fontSize={18}
                style={styles.problemMathText}
              />

              {/* Problem image if available */}
              {currentProblem.imageUrl && (
                <Image
                  source={{ uri: currentProblem.imageUrl }}
                  style={styles.problemImage}
                  resizeMode="contain"
                />
              )}

              {/* Multiple choice answer input */}
              {problemType === '객관식' && (currentProblem as any).choices && (
                <MultipleChoiceInput
                  choices={(currentProblem as any).choices}
                  selectedAnswer={answers[currentProblemIndex] ?? ''}
                  onSelect={setCurrentAnswer}
                />
              )}

              {/* Short answer input */}
              {problemType === '단답형' && (
                <ShortAnswerInput
                  value={answers[currentProblemIndex] ?? ''}
                  onChange={setCurrentAnswer}
                />
              )}
            </ScrollView>

            <View style={styles.problemFooter}>
              <View style={styles.subjectTag}>
                <MaterialCommunityIcons name="tag" size={14} color={colors.primary} />
                <Text style={styles.subjectTagText}>{assignment.subject}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Canvas Drawing Area (for essay / freehand problems) */}
        <View style={[styles.canvasSection, isLandscape && styles.canvasSectionLandscape]}>
          <View style={styles.canvasCard}>
            <View style={styles.canvasHeader}>
              <View style={styles.canvasTitleRow}>
                <MaterialCommunityIcons name="draw" size={18} color={colors.primary} />
                <Text style={styles.canvasLabel}>풀이 작성</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  completedProblems.has(currentProblemIndex) && styles.saveButtonCompleted,
                  isSubmitting && { opacity: 0.6 },
                ]}
                onPress={handleSave}
                disabled={isSubmitting}
                accessibilityLabel={
                  completedProblems.has(currentProblemIndex) ? '저장 완료' : '풀이 저장'
                }
                accessibilityRole="button"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons
                    name={completedProblems.has(currentProblemIndex) ? 'check' : 'content-save'}
                    size={16}
                    color="#FFFFFF"
                  />
                )}
                <Text style={styles.saveButtonText}>
                  {isSubmitting
                    ? '저장중...'
                    : completedProblems.has(currentProblemIndex)
                    ? '저장됨'
                    : '저장'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.canvasWrapper} ref={canvasViewRef} collapsable={false}>
              <DrawingCanvas
                width={canvasWidth}
                height={canvasHeight}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                tool={tool}
                background={background}
                strokes={canvasControls.strokes}
                onStrokeEnd={canvasControls.addStroke}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Canvas Toolbar */}
      <CanvasToolbar
        selectedTool={tool}
        onToolChange={setTool}
        selectedColor={strokeColor}
        onColorChange={setStrokeColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        background={background}
        onBackgroundChange={setBackground}
        onUndo={canvasControls.undo}
        onRedo={canvasControls.redo}
        onClear={canvasControls.clear}
        canUndo={canvasControls.canUndo}
        canRedo={canvasControls.canRedo}
      />

      {/* Submit Confirmation Dialog */}
      <Portal>
        <Dialog visible={showSubmitDialog} onDismiss={() => setShowSubmitDialog(false)}>
          <Dialog.Title style={{ fontFamily: 'NotoSansKR-Bold' }}>제출 확인</Dialog.Title>
          <Dialog.Content>
            <Text style={{ ...typography.body }}>
              풀지 않은 문제가 {totalProblems - completedProblems.size}개 있습니다. 제출하시겠습니까?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton mode="text" onPress={() => setShowSubmitDialog(false)}>
              취소
            </PaperButton>
            <PaperButton mode="contained" onPress={confirmSubmit}>
              제출
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────
// (Existing styles preserved from current solve.tsx, plus new answer input styles)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, marginLeft: spacing.md },
  assignmentInfo: { gap: 2 },
  assignmentTitle: {
    ...typography.subtitle, fontWeight: '700', color: colors.textPrimary,
  },
  assignmentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assignmentMetaText: {
    ...typography.bodySmall, fontSize: 13, color: colors.textSecondary,
  },
  timerContainer: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  timerText: { ...typography.label, color: colors.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressInfo: { alignItems: 'flex-end' },
  progressText: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  headerProgress: { width: 80, height: 4, borderRadius: 2 },
  submitButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  submitButtonText: { ...typography.label, color: '#FFFFFF' },

  // Problem number navigation
  problemNavigation: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  problemNumbers: { flexDirection: 'row', gap: spacing.sm },
  problemNumberButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center',
  },
  problemNumberButtonActive: { backgroundColor: colors.primary },
  problemNumberButtonCompleted: {
    backgroundColor: colors.success + opacityToHex(opacity.muted),
    borderWidth: 1, borderColor: colors.success,
  },
  problemNumberText: { ...typography.label, color: colors.textSecondary },
  problemNumberTextActive: { color: '#FFFFFF' },
  navArrows: { flexDirection: 'row', gap: spacing.xs },
  navArrowButton: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center', alignItems: 'center',
  },
  navArrowButtonDisabled: { opacity: 0.5 },

  // Main content
  mainContent: { flex: 1, padding: spacing.md },
  mainContentLandscape: { flexDirection: 'row', gap: spacing.md },

  // Problem section
  problemSection: { marginBottom: spacing.md },
  problemSectionLandscape: { flex: 0.45, marginBottom: 0 },
  problemCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: spacing.md, height: '100%',
  },
  problemHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  problemBadge: {
    backgroundColor: colors.primary + opacityToHex(opacity.subtle),
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6,
  },
  problemBadgeText: {
    ...typography.bodySmall, fontWeight: '500', fontSize: 13, color: colors.primary,
  },
  pointsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.warning + opacityToHex(opacity.subtle),
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6,
  },
  pointsText: {
    ...typography.bodySmall, fontWeight: '500', fontSize: 13, color: colors.warning,
  },
  problemScrollView: { flex: 1 },
  problemMathText: { marginBottom: spacing.md },
  problemImage: {
    width: '100%', height: 200, marginTop: spacing.md,
    borderRadius: 8, backgroundColor: colors.surfaceVariant,
  },
  problemFooter: {
    marginTop: spacing.md, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  subjectTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subjectTagText: {
    ...typography.bodySmall, fontSize: 13, color: colors.primary,
  },

  // Answer input styles
  choicesContainer: { marginTop: spacing.lg },
  answerSectionTitle: {
    ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm,
  },
  choiceItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: 12, marginBottom: spacing.sm,
    backgroundColor: colors.surfaceVariant, minHeight: 48,
  },
  choiceItemSelected: {
    backgroundColor: colors.primary + opacityToHex(opacity.subtle),
    borderWidth: 2, borderColor: colors.primary,
  },
  choiceNumber: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  choiceNumberSelected: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  choiceNumberText: { ...typography.label, color: colors.textSecondary },
  choiceNumberTextSelected: { color: '#FFFFFF' },
  shortAnswerContainer: { marginTop: spacing.lg },
  shortAnswerInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 16, color: colors.textPrimary, backgroundColor: colors.surface,
    minHeight: 48, fontFamily: 'NotoSansKR-Regular',
  },

  // Canvas section
  canvasSection: { flex: 1 },
  canvasSectionLandscape: { flex: 0.55 },
  canvasCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: spacing.md, height: '100%',
  },
  canvasHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  canvasTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  canvasLabel: { ...typography.label, color: colors.primary },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: 6, minHeight: 44,
  },
  saveButtonCompleted: { backgroundColor: colors.success },
  saveButtonText: {
    ...typography.bodySmall, fontWeight: '500', fontSize: 13, color: '#FFFFFF',
  },
  canvasWrapper: {
    flex: 1, borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border,
  },
});
```

**Key changes from original**:
- Removed `mockProblems` array (lines 13-35 of original)
- Added `useAuthStore`, `useAssignmentStore`, `useSubmissionStore` imports
- Load real assignment via `getAssignmentById(assignmentId)` in `useEffect`
- Replaced `<Text>` with `<MathText>` for LaTeX rendering of problem content
- Added `MultipleChoiceInput` component for type `'객관식'`
- Added `ShortAnswerInput` component for type `'단답형'`
- Implemented real `handleSave()` that uploads canvas snapshot and calls `submitAnswer()`
- Canvas snapshot uses `react-native-view-shot` with `captureRef()` (see Step 8.4)
- Upload uses `decode()` from `base64-arraybuffer` for proper binary conversion
- Uses `createSignedUrl()` (NOT `getPublicUrl()`) for the private `submissions` bucket
- Timer tracks time per problem (resets on problem navigation)
- Added loading and error states
- Dynamic header title from `assignment.title` (was hardcoded "이차방정식 연습")
- Problem navigation is now horizontally scrollable for assignments with many problems

### Step 8.4: Canvas Snapshot via `react-native-view-shot`

The current canvas uses `react-native-svg` (NOT `@shopify/react-native-skia`). SVG elements do not have a built-in `makeImageSnapshot()` method. To capture the canvas as an image, use `react-native-view-shot`:

```bash
npx expo install react-native-view-shot
```

Usage (already integrated in the solve.tsx code above):

```typescript
import { captureRef } from 'react-native-view-shot';

// The canvasViewRef wraps the DrawingCanvas View
const base64 = await captureRef(canvasViewRef.current, {
  format: 'png',
  quality: 0.8,   // 80% quality to keep file size reasonable
  result: 'base64',
});
```

The `collapsable={false}` prop on the canvas wrapper `<View>` is required on Android. Without it, React Native may optimize away the native view, causing `captureRef` to fail with "Cannot capture an unmounted view".

#### Alternative: @shopify/react-native-skia Migration

The plan mentions Skia for canvas drawing. If you migrate to Skia in the future:

1. Install: `npx expo install @shopify/react-native-skia`
2. Replace `DrawingCanvas` SVG implementation with Skia `<Canvas>` and `<Path>`
3. Use Skia's native snapshot: `canvasRef.current.makeImageSnapshot().encodeToBase64()`
4. This removes the need for `react-native-view-shot`

**For now, the SVG + react-native-view-shot approach works and avoids a risky mid-sprint canvas rewrite.**

### Step 8.5: Supabase Storage Upload -- Critical Implementation Notes

Three critical points when uploading canvas snapshots to Supabase Storage:

#### 1. Use `decode()` for base64 to ArrayBuffer conversion

```typescript
import { decode } from 'base64-arraybuffer';

// WRONG: Supabase Storage does NOT accept raw base64 strings
await supabase.storage.from('submissions').upload(path, base64String);

// CORRECT: Decode base64 to ArrayBuffer first
const arrayBuffer = decode(base64String);
await supabase.storage.from('submissions').upload(path, arrayBuffer, {
  contentType: 'image/png',
});
```

#### 2. Use `createSignedUrl()` NOT `getPublicUrl()` for private buckets

The `submissions` bucket was created as **private** in Section 1. This is correct because student submissions should not be publicly accessible.

```typescript
// WRONG: Returns a URL that 403s on private buckets
const { data } = supabase.storage.from('submissions').getPublicUrl(path);

// CORRECT: Creates a time-limited signed URL
const { data } = await supabase.storage
  .from('submissions')
  .createSignedUrl(path, 3600); // 1-hour expiry
```

The signed URL expires after 1 hour. This is sufficient for:
- The student to review their own submission
- The teacher to view submissions during a grading session (Section 9)

If a longer expiry is needed, increase the value (e.g., `86400` for 24 hours).

#### 3. File path structure

Use a predictable path structure for easy retrieval:

```
submissions/{student_id}/{assignment_id}/{problem_id}_{timestamp}.png
```

The `upsert: true` option allows re-submitting a problem without manual deletion of the old file.

### Step 8.6: Strip `canvasData` from Persisted Submissions

The `submissionStore.ts` already has a `partialize` config (line 167-169):

```typescript
partialize: (state) => ({
  submissions: state.submissions,
}),
```

This persists the full `submissions` array. However, if any submission includes `canvasData` (raw stroke data), it can be very large (hundreds of KB per problem with many strokes). Over time, this will exceed AsyncStorage's ~6MB limit.

**Modify the `partialize` function** in `src/stores/submissionStore.ts` to strip `canvasData`:

```typescript
// BEFORE (current, line 167-169):
partialize: (state) => ({
  submissions: state.submissions,
}),

// AFTER:
partialize: (state) => ({
  // Strip canvasData from all submissions before persisting to AsyncStorage.
  // The canvas image is already uploaded to Supabase Storage as a PNG,
  // so raw stroke data does not need to be persisted locally.
  // This prevents exceeding AsyncStorage's ~6MB limit.
  submissions: state.submissions.map(({ canvasData, ...rest }) => rest),
}),
```

This change is safe because:
- The canvas image has already been uploaded to Supabase Storage
- The `answerImageUrl` field contains the signed URL for display
- Raw stroke data is only needed during the active drawing session (held in component state via `useCanvasControls`)

### Step 8.7: Store Hydration Guard

When the app cold-starts, Zustand's `persist` middleware asynchronously rehydrates state from AsyncStorage. During this brief period (10-100ms), the store returns empty arrays. If the homework list renders during this window, it shows an empty state that flashes before real data appears.

Add a hydration check at the top of screens that depend on persisted data:

```typescript
// In homework.tsx or solve.tsx, before the main render:
const hasHydrated = useSubmissionStore.persist.hasHydrated();

if (!hasHydrated) {
  return (
    <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </SafeAreaView>
  );
}
```

Alternatively, use Zustand's `onRehydrateStorage` callback for more control:

```typescript
// In submissionStore.ts persist config:
{
  name: 'mathpia-submissions',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    submissions: state.submissions.map(({ canvasData, ...rest }) => rest),
  }),
  onRehydrateStorage: () => (state) => {
    // Called after rehydration completes
    console.log('[SubmissionStore] Rehydrated with', state?.submissions?.length ?? 0, 'submissions');
  },
}
```

### Step 8.8: Timer Implementation

The timer tracks time spent on each problem individually. This data is stored in the `submissions.time_spent_seconds` column and can be used for analytics (e.g., "average time per problem type").

The implementation:

```typescript
// State
const [problemStartTime, setProblemStartTime] = useState(Date.now());
const [timePerProblem, setTimePerProblem] = useState<Record<number, number>>({});
const [elapsedSeconds, setElapsedSeconds] = useState(0);

// Tick every second for display
useEffect(() => {
  const interval = setInterval(() => {
    setElapsedSeconds(Math.floor((Date.now() - problemStartTime) / 1000));
  }, 1000);
  return () => clearInterval(interval);
}, [problemStartTime]);

// Accumulate time when switching problems
useEffect(() => {
  setTimePerProblem((prev) => ({
    ...prev,
    [currentProblemIndex]: (prev[currentProblemIndex] ?? 0) + elapsedSeconds,
  }));
  setProblemStartTime(Date.now());
  setElapsedSeconds(0);
}, [currentProblemIndex]);

// On submit, calculate total time for this problem
const totalTimeForProblem =
  (timePerProblem[currentProblemIndex] ?? 0) +
  Math.floor((Date.now() - problemStartTime) / 1000);
```

This design accumulates time across multiple visits to the same problem (e.g., student works on problem 1, switches to problem 3, then returns to problem 1).

### Step 8.9: Progress Tracking (Automatic via Supabase Trigger)

When a submission is inserted into the `submissions` table, the `update_assignment_progress` trigger (created in Section 1, Migration 004) automatically:

1. Counts total problems for the assignment (from `assignment_problems`)
2. Counts submitted problems for this student (from `submissions`)
3. Updates `assignment_students.progress_percent = (submitted / total) * 100`
4. If `progress_percent` reaches 100%, sets `assignment_students.status = 'submitted'`

**No client-side code is needed for progress tracking.** The homework list will reflect updated progress on the next fetch (pull-to-refresh or re-navigation).

To provide immediate visual feedback without re-fetching, the client-side `completedProblems` set tracks which problems have been saved locally during the current session.

---

## 5. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `package.json` | **Modify** | Add `base64-arraybuffer` and `react-native-view-shot` |
| `app/(student)/homework.tsx` | **Modify** | Remove mock data, connect to `assignmentStore` and `authStore`, add loading/error/refresh states |
| `app/(student)/solve.tsx` | **Modify** | Remove mock data, load real assignment problems, add LaTeX rendering via `MathText`, implement canvas snapshot upload, add multiple answer input types, connect to `submissionStore` |
| `src/stores/submissionStore.ts` | **Modify** | Update `partialize` to strip `canvasData` from persisted submissions (line 167-169) |

---

## 6. Acceptance Criteria

### Must Pass (blocking for Section 9)

- [ ] Student sees their assigned homework list with real data from Supabase (no `mockAssignments` array)
- [ ] Tapping an assignment navigates to the solve screen and loads the correct problems
- [ ] Problem content renders with LaTeX via `MathText` component
- [ ] Multiple-choice problems (`객관식`) display selectable option buttons
- [ ] Short-answer problems (`단답형`) display a text input field
- [ ] Essay problems (`서술형`) allow freehand canvas drawing
- [ ] "Save" button captures the canvas view as a PNG via `react-native-view-shot`
- [ ] PNG is uploaded to Supabase Storage `submissions` bucket using `decode()` from `base64-arraybuffer`
- [ ] Storage URL is generated via `createSignedUrl()` (NOT `getPublicUrl()`) with 1-hour expiry
- [ ] `submitAnswer()` creates a real `submissions` row in Supabase with `answerText`, `answerImageUrl`, and `timeSpentSeconds`
- [ ] Progress bar in the header updates locally after each save
- [ ] After all problems are submitted, a completion dialog appears and navigates back to homework list
- [ ] `canvasData` is stripped from persisted submissions via `partialize` in `submissionStore.ts`
- [ ] `assignment_students.progress_percent` updates automatically in Supabase (via trigger) after each submission

### Should Pass (nice-to-have for demo)

- [ ] Timer displays elapsed time per problem and resets when navigating between problems
- [ ] Time accumulates across multiple visits to the same problem
- [ ] Pull-to-refresh on the homework list re-fetches assignment data
- [ ] Loading spinner shows while assignment data is being fetched
- [ ] Error state displays Korean message when fetch fails
- [ ] Problem navigation is scrollable for assignments with many problems (>8)
- [ ] Store hydration guard prevents flash of empty state on cold start
- [ ] Canvas snapshot quality is reasonable (<500KB per image at 80% quality)

---

## 7. Estimated Effort

**1-1.5 days** (8-12 hours)

| Task | Hours | Notes |
|------|-------|-------|
| Install dependencies (`base64-arraybuffer`, `react-native-view-shot`) | 0.5 | Quick install + verify |
| Rewrite `homework.tsx` (store connection, remove mocks) | 2 | Straightforward store wiring |
| Rewrite `solve.tsx` (load problems, answer inputs, LaTeX) | 3-4 | Most complex part: multiple answer types + MathText |
| Canvas snapshot + Supabase Storage upload | 2-3 | `react-native-view-shot` capture + `decode()` + `createSignedUrl()` |
| Timer implementation | 0.5 | Simple elapsed time tracking |
| `partialize` update in `submissionStore.ts` | 0.5 | One-line change + verification |
| Integration testing (homework list to solve to submit) | 1-2 | End-to-end flow verification |

**The canvas snapshot + upload is the trickiest part.** The `react-native-view-shot` library captures any React Native `View` as an image, which sidesteps the SVG-to-raster conversion problem. If issues arise with `captureRef`, test on a real device (not just simulator) as some Android devices handle view capture differently.

---

## Appendix A: Troubleshooting Common Issues

### "Cannot capture an unmounted view" on Android

Add `collapsable={false}` to the canvas wrapper `<View>`:

```typescript
<View ref={canvasViewRef} collapsable={false}>
  <DrawingCanvas ... />
</View>
```

### Storage upload returns 403

1. Check that RLS policies on the `submissions` bucket allow the current user to upload
2. The expected policy: students can upload to `submissions/{user_id}/*`
3. Verify the user is authenticated: `const { data: { session } } = await supabase.auth.getSession()`

### `getPublicUrl()` returns a URL that 403s

The `submissions` bucket is private. Always use `createSignedUrl()` instead:

```typescript
// This will 403:
const { data } = supabase.storage.from('submissions').getPublicUrl(path);

// This works:
const { data } = await supabase.storage.from('submissions').createSignedUrl(path, 3600);
```

### Canvas PNG is too large (>1MB)

Reduce quality or dimensions:

```typescript
const base64 = await captureRef(canvasViewRef.current, {
  format: 'png',
  quality: 0.6,    // Lower quality
  width: 800,      // Limit width
  result: 'base64',
});
```

### AsyncStorage quota exceeded after many submissions

This means `canvasData` is leaking into persistence. Verify the `partialize` function in `submissionStore.ts` correctly strips it:

```typescript
partialize: (state) => ({
  submissions: state.submissions.map(({ canvasData, ...rest }) => rest),
}),
```

### MathText renders as plain text on Android

The current `MathText` component falls back to plain `<Text>` on Android (line 47: `Platform.OS === 'web' ? ... : false`). This is a known limitation. For the demo, LaTeX renders correctly on web. For native LaTeX rendering, consider `react-native-mathjax-svg` as a post-demo enhancement.
