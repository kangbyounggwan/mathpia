# Section 7: Assignment Creation Flow (Teacher)

> **Depends on**: Sections 4, 5, 6
> **Blocks**: Section 8 (Problem Solving + Submission Flow)
> **Estimated Effort**: 1 day (6-8 hours)
> **Priority**: HIGH

---

## 1. Background

The assignment creation flow is the central teacher workflow in Mathpia. A teacher creates a new assignment (숙제) by filling in metadata (title, description, grade, subject, due date), selecting problems from the problem bank, and choosing which students receive it. This flow ties together three preceding sections:

- **Section 4** provides the `supabaseAssignmentService` that implements `IAssignmentService.create()` using the transactional `create_assignment_with_details()` RPC.
- **Section 5** provides the Gemini AI extraction pipeline, which populates the problem bank and also offers a direct "extracted problems to assignment" path from the `problem-extract` screen.
- **Section 6** connects all screens to Zustand stores, meaning the assignment list screen (`assignments.tsx`) now reads from `useAssignmentStore()` instead of hardcoded mock data.

After this section, a teacher can create a real assignment that is stored in Supabase, assigned to real students, and visible on the student's homework list (Section 8).

### Current State of Existing Code

| File | Current State | Key Issue |
|------|--------------|-----------|
| `app/(teacher)/assignments.tsx` | Has `mockAssignments` array (lines 24-69), FAB `onPress` is a no-op (line 208) | All data hardcoded; no creation flow |
| `app/(teacher)/problem-bank.tsx` | Has selection mode and `handleAddToAssignment` (line 188-195) that pushes to assignments screen with `bankProblems` param | Only passes serialized problems via route params; no receiving logic in assignments |
| `app/(teacher)/problem-extract.tsx` | Has `handleCreateAssignment` (line 83-90) that pushes to assignments screen with `newProblems` param | Only passes serialized problems via route params; no receiving logic in assignments |
| `src/stores/assignmentStore.ts` | `createAssignment()` at line 81 already calls `services.assignment.create(data)` | Fully wired; no changes needed |
| `src/components/problemBank/ProblemSelector.tsx` | Complete modal component with multi-select, filters, and confirm callback | Ready to use directly from the assignment creation form |

---

## 2. Requirements

### Functional Requirements

1. **Assignment metadata form**: Teacher fills in title, description (optional), grade, subject, and due date.
2. **Problem selection**: Teacher selects problems from the problem bank via a modal (`ProblemSelector` component) or receives them from route params (from `problem-bank.tsx` or `problem-extract.tsx`).
3. **Student selection**: Teacher selects which students receive the assignment from a multi-select list of academy students.
4. **Draft and publish**: Teacher can save as draft or publish immediately. Publishing changes status to `'published'` and triggers the `notify_assignment` database trigger that creates student notifications.
5. **Integration with problem-extract**: When a teacher extracts problems from a PDF via Gemini, selects them, and taps "숙제 만들기", they arrive at the assignment creation form with those problems pre-loaded.
6. **Validation**: Title is required, at least one problem must be selected, at least one student must be selected, due date must be in the future.

### Non-Functional Requirements

1. The entire assignment (assignment row, assignment_problems rows, assignment_students rows) is created in a **single database transaction** via the `create_assignment_with_details()` RPC to prevent orphaned records.
2. Form state is maintained during navigation to/from the problem selector.
3. All text is in Korean.

---

## 3. Dependencies

### Requires (must be completed first)

| Section | What It Provides |
|---------|-----------------|
| **Section 4** | `supabaseAssignmentService.create()` using `create_assignment_with_details()` RPC; `supabaseProblemBankService` for fetching problems |
| **Section 5** | Populated problem bank from Gemini extraction; `problem-extract.tsx` screen that passes extracted problems via route params |
| **Section 6** | `assignments.tsx` connected to `useAssignmentStore()` instead of mock data; `useAuthStore()` provides `user.id` and `user.academyId` |

### Blocks (depends on this section)

| Section | Why It Needs This |
|---------|------------------|
| **Section 8** | Students need published assignments with problems and student assignments to exist before they can solve them |

---

## 4. Implementation Details

### Step 7.1: Assignment Creation Form Component

Create a new `AssignmentCreateModal` component as a full-screen modal (or bottom sheet) that contains the assignment creation form. This is rendered from `assignments.tsx` when the FAB is pressed or when incoming route params carry problems.

**File**: `src/components/assignment/AssignmentCreateForm.tsx` (new)

```typescript
// ============================================================
// src/components/assignment/AssignmentCreateForm.tsx
// Full assignment creation form with problem and student selection
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Portal,
  Modal,
  Chip,
  IconButton,
  Divider,
  ActivityIndicator,
  List,
  Checkbox,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, typography, roleColors } from '../../constants/theme';
import type {
  Grade,
  ProblemBankItem,
  Assignment,
} from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { ProblemSelector } from '../problemBank';
import { supabase } from '../../lib/supabase';

// ─── Types ───────────────────────────────────────────────────

interface StudentOption {
  id: string;
  name: string;
  grade?: Grade;
}

interface AssignmentCreateFormProps {
  visible: boolean;
  onDismiss: () => void;
  onCreated?: (assignment: Assignment) => void;
  /** Pre-selected problems from problem-extract or problem-bank screen */
  initialProblems?: ProblemBankItem[];
}

// ─── Grade and Subject options ───────────────────────────────

const GRADE_OPTIONS: Grade[] = ['중1', '중2', '중3', '고1', '고2', '고3'];

const SUBJECT_OPTIONS: string[] = [
  '수학',
  '수학I',
  '수학II',
  '미적분',
  '확률과 통계',
  '기하',
];

// ─── Component ───────────────────────────────────────────────

export default function AssignmentCreateForm({
  visible,
  onDismiss,
  onCreated,
  initialProblems = [],
}: AssignmentCreateFormProps) {
  const { user } = useAuthStore();
  const { createAssignment, publishAssignment } = useAssignmentStore();

  // ── Form state ──────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState<Grade>('고1');
  const [subject, setSubject] = useState('수학');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Default: 1 week from now
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ── Problem selection state ─────────────────────────────────
  const [selectedProblems, setSelectedProblems] = useState<ProblemBankItem[]>([]);
  const [showProblemSelector, setShowProblemSelector] = useState(false);

  // ── Student selection state ─────────────────────────────────
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [studentsLoading, setStudentsLoading] = useState(false);

  // ── Submission state ────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Initialize with incoming problems ───────────────────────
  useEffect(() => {
    if (visible && initialProblems.length > 0) {
      setSelectedProblems(initialProblems);
    }
  }, [visible, initialProblems]);

  // ── Fetch students in academy when modal opens ──────────────
  useEffect(() => {
    if (visible && user?.academyId) {
      fetchAcademyStudents();
    }
  }, [visible, user?.academyId]);

  // ── Reset form when modal closes ───────────────────────────
  useEffect(() => {
    if (!visible) {
      setTitle('');
      setDescription('');
      setGrade('고1');
      setSubject('수학');
      setDueDate(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
      });
      setSelectedProblems([]);
      setSelectedStudentIds(new Set());
      setIsSubmitting(false);
    }
  }, [visible]);

  const fetchAcademyStudents = async () => {
    if (!user?.academyId) return;
    setStudentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, student_profiles(grade)')
        .eq('academy_id', user.academyId)
        .eq('role', 'student')
        .order('name');

      if (error) throw error;

      const studentList: StudentOption[] = (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        grade: s.student_profiles?.grade,
      }));
      setStudents(studentList);
    } catch (err) {
      console.error('학생 목록 조회 실패:', err);
      Alert.alert('오류', '학생 목록을 불러오는데 실패했습니다.');
    } finally {
      setStudentsLoading(false);
    }
  };

  // ── Problem selector callbacks ──────────────────────────────

  const handleProblemsConfirmed = useCallback(
    (problems: ProblemBankItem[]) => {
      setSelectedProblems((prev) => {
        // Merge, avoiding duplicates
        const existingIds = new Set(prev.map((p) => p.id));
        const newOnes = problems.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newOnes];
      });
    },
    [],
  );

  const removeProblem = useCallback((id: string) => {
    setSelectedProblems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── Student selection callbacks ─────────────────────────────

  const toggleStudent = useCallback((id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAllStudents = useCallback(() => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map((s) => s.id)));
    }
  }, [selectedStudentIds.size, students]);

  // ── Date picker ─────────────────────────────────────────────

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // iOS keeps picker open
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // ── Validation ──────────────────────────────────────────────

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!title.trim()) errors.push('제목을 입력해주세요.');
    if (selectedProblems.length === 0) errors.push('문제를 1개 이상 선택해주세요.');
    if (selectedStudentIds.size === 0) errors.push('학생을 1명 이상 선택해주세요.');
    if (dueDate <= new Date()) errors.push('마감일은 오늘 이후여야 합니다.');
    return errors;
  }, [title, selectedProblems.length, selectedStudentIds.size, dueDate]);

  const isValid = validationErrors.length === 0;

  // ── Submit handler ──────────────────────────────────────────

  const handleCreate = async (publishImmediately: boolean) => {
    if (!isValid || !user) {
      Alert.alert('입력 오류', validationErrors.join('\n'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the assignment data matching the Assignment type
      // (minus id, createdAt, updatedAt which are auto-generated)
      const assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'> = {
        academyId: user.academyId,
        teacherId: user.id,
        title: title.trim(),
        description: description.trim(),
        grade,
        subject,
        dueDate, // ISO string after Section 2's Date→string migration
        status: publishImmediately ? 'published' : 'draft',
        problems: selectedProblems.map((p) => ({
          id: p.id,
          content: p.content,
          imageUrl: p.imageUrls?.[0],
          answer: p.answer,
          points: p.points || 10,
        })),
        assignedStudents: Array.from(selectedStudentIds),
      };

      // createAssignment() calls services.assignment.create()
      // which uses create_assignment_with_details() RPC under the hood.
      // This creates assignment + assignment_problems + assignment_students
      // in a single database transaction.
      const newAssignment = await createAssignment(assignmentData);

      // If created as draft but user wants to publish, call publishAssignment
      if (publishImmediately && newAssignment.status !== 'published') {
        await publishAssignment(newAssignment.id);
      }

      Alert.alert(
        '과제 생성 완료',
        `"${title}" 과제가 ${selectedStudentIds.size}명의 학생에게 배정되었습니다.`,
      );

      onCreated?.(newAssignment);
      onDismiss();
    } catch (err) {
      console.error('과제 생성 실패:', err);
      Alert.alert('오류', '과제 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton icon="close" onPress={onDismiss} />
          <Text style={styles.headerTitle}>새 숙제 만들기</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Title ───────────────────────────────────── */}
          <TextInput
            label="제목 *"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            placeholder="예: 이차방정식 연습문제"
          />

          {/* ── Description ─────────────────────────────── */}
          <TextInput
            label="설명"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            placeholder="학생들에게 전달할 안내사항 (선택)"
          />

          {/* ── Grade ───────────────────────────────────── */}
          <Text style={styles.sectionLabel}>학년</Text>
          <View style={styles.chipRow}>
            {GRADE_OPTIONS.map((g) => (
              <Chip
                key={g}
                selected={grade === g}
                onPress={() => setGrade(g)}
                style={styles.chip}
                showSelectedCheck={false}
              >
                {g}
              </Chip>
            ))}
          </View>

          {/* ── Subject ─────────────────────────────────── */}
          <Text style={styles.sectionLabel}>과목</Text>
          <View style={styles.chipRow}>
            {SUBJECT_OPTIONS.map((s) => (
              <Chip
                key={s}
                selected={subject === s}
                onPress={() => setSubject(s)}
                style={styles.chip}
                showSelectedCheck={false}
              >
                {s}
              </Chip>
            ))}
          </View>

          {/* ── Due Date ────────────────────────────────── */}
          <Text style={styles.sectionLabel}>마감일</Text>
          <Button
            mode="outlined"
            icon="calendar"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            {formatDate(dueDate)}
          </Button>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          <Divider style={styles.divider} />

          {/* ── Selected Problems ────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              선택된 문제 ({selectedProblems.length}개)
            </Text>
            <Button
              mode="outlined"
              icon="plus"
              compact
              onPress={() => setShowProblemSelector(true)}
            >
              문제 추가
            </Button>
          </View>

          {selectedProblems.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>
                문제를 선택해주세요. 문제은행에서 추가하거나{'\n'}
                AI로 추출한 문제를 사용할 수 있습니다.
              </Text>
            </View>
          ) : (
            selectedProblems.map((problem, index) => (
              <View key={problem.id} style={styles.problemRow}>
                <View style={styles.problemInfo}>
                  <View style={styles.problemNumberBadge}>
                    <Text style={styles.problemNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.problemContent} numberOfLines={2}>
                    {problem.content.replace(/\$.*?\$/g, '[수식]')}
                  </Text>
                  <Chip compact style={styles.difficultyChip}>
                    {problem.difficulty}
                  </Chip>
                </View>
                <IconButton
                  icon="close"
                  size={18}
                  onPress={() => removeProblem(problem.id)}
                />
              </View>
            ))
          )}

          <Divider style={styles.divider} />

          {/* ── Student Selection ─────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              학생 배정 ({selectedStudentIds.size}/{students.length}명)
            </Text>
            <Button mode="text" compact onPress={toggleAllStudents}>
              {selectedStudentIds.size === students.length
                ? '선택 해제'
                : '전체 선택'}
            </Button>
          </View>

          {studentsLoading ? (
            <ActivityIndicator style={styles.loadingIndicator} />
          ) : students.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>
                학원에 등록된 학생이 없습니다.
              </Text>
            </View>
          ) : (
            students.map((student) => (
              <List.Item
                key={student.id}
                title={student.name}
                description={student.grade || ''}
                onPress={() => toggleStudent(student.id)}
                left={() => (
                  <Checkbox
                    status={
                      selectedStudentIds.has(student.id) ? 'checked' : 'unchecked'
                    }
                    onPress={() => toggleStudent(student.id)}
                    color={roleColors.teacher.accent}
                  />
                )}
                style={styles.studentItem}
              />
            ))
          )}
        </ScrollView>

        {/* ── Bottom Action Bar ────────────────────────────── */}
        <View style={styles.bottomBar}>
          {validationErrors.length > 0 && (
            <Text style={styles.errorText}>
              {validationErrors[0]}
            </Text>
          )}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => handleCreate(false)}
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
              style={styles.draftButton}
            >
              임시 저장
            </Button>
            <Button
              mode="contained"
              onPress={() => handleCreate(true)}
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
              icon="send"
              style={styles.publishButton}
              buttonColor={roleColors.teacher.accent}
            >
              배정하기
            </Button>
          </View>
        </View>

        {/* ── Problem Selector Modal ───────────────────────── */}
        <ProblemSelector
          visible={showProblemSelector}
          onDismiss={() => setShowProblemSelector(false)}
          onConfirm={handleProblemsConfirmed}
          excludeIds={selectedProblems.map((p) => p.id)}
        />
      </Modal>
    </Portal>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.sm,
    borderRadius: 16,
    maxHeight: '95%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    ...typography.heading3,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  input: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.subtitle,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginBottom: spacing.xs,
  },
  dateButton: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: spacing.lg,
  },
  emptySection: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  problemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  problemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  problemNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: roleColors.teacher.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  problemNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  problemContent: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  difficultyChip: {
    backgroundColor: colors.surfaceVariant,
  },
  studentItem: {
    paddingVertical: 0,
  },
  loadingIndicator: {
    padding: spacing.lg,
  },
  bottomBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  draftButton: {
    flex: 1,
  },
  publishButton: {
    flex: 2,
  },
});
```

Also create the barrel export:

**File**: `src/components/assignment/index.ts` (new)

```typescript
export { default as AssignmentCreateForm } from './AssignmentCreateForm';
```

### Step 7.2: Modify `assignments.tsx` -- Remove Mocks, Wire FAB, Receive Route Params

Replace the existing `app/(teacher)/assignments.tsx` entirely. The key changes are:

1. Remove the local `Assignment` interface and `mockAssignments` array (lines 12-69).
2. Connect to `useAssignmentStore()` and `useAuthStore()`.
3. Read incoming route params (`bankProblems` from `problem-bank.tsx`, `newProblems` from `problem-extract.tsx`).
4. Wire the FAB to open `AssignmentCreateForm`.
5. Map store `Assignment` data to the existing card rendering format.

```typescript
// ============================================================
// app/(teacher)/assignments.tsx (modified)
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Chip, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Card, EmptyState, SkeletonLoader } from '../../src/components/common';
import {
  colors, spacing, typography, roleColors, borderRadius, opacityToHex, opacity,
} from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks';
import { useAuthStore } from '../../src/stores/authStore';
import { useAssignmentStore } from '../../src/stores/assignmentStore';
import { AssignmentCreateForm } from '../../src/components/assignment';
import type { Assignment, AssignmentStatus, ProblemBankItem } from '../../src/types';

type FilterStatus = 'all' | 'published' | 'closed' | 'draft';

export default function AssignmentsScreen() {
  const { user } = useAuthStore();
  const { assignments, isLoading, fetchAssignments } = useAssignmentStore();
  const { accent } = useRoleTheme();

  // ── Route params: problems passed from problem-bank or problem-extract ──
  const params = useLocalSearchParams<{
    bankProblems?: string;
    newProblems?: string;
  }>();

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [incomingProblems, setIncomingProblems] = useState<ProblemBankItem[]>([]);

  // ── Fetch assignments on mount ──────────────────────────────
  useEffect(() => {
    if (user) {
      fetchAssignments(user.id);
    }
  }, [user]);

  // ── Handle incoming problems from route params ──────────────
  useEffect(() => {
    const raw = params.bankProblems || params.newProblems;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setIncomingProblems(parsed);
        setShowCreateForm(true); // Auto-open creation form
      } catch (e) {
        console.error('문제 파싱 오류:', e);
      }
    }
  }, [params.bankProblems, params.newProblems]);

  // ── Filter assignments ──────────────────────────────────────
  const filteredAssignments = useMemo(() => {
    if (filter === 'all') return assignments;
    return assignments.filter((a) => a.status === filter);
  }, [assignments, filter]);

  // ── Status helpers ──────────────────────────────────────────
  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case 'published': return colors.success;
      case 'closed':    return colors.textSecondary;
      case 'draft':     return colors.warning;
      default:          return colors.textSecondary;
    }
  };

  const getStatusText = (status: AssignmentStatus) => {
    switch (status) {
      case 'published': return '진행중';
      case 'closed':    return '완료';
      case 'draft':     return '임시저장';
      default:          return status;
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // ── Render assignment card ──────────────────────────────────
  const renderAssignment = ({ item }: { item: Assignment }) => {
    const submittedCount = item.assignedStudents?.length || 0;
    const problemCount = item.problems?.length || 0;

    return (
      <Card style={styles.assignmentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.assignmentTitle}>{item.title}</Text>
            <View style={styles.tags}>
              <Chip compact style={styles.gradeChip}>{item.grade}</Chip>
              <Chip
                compact
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(item.status) + opacityToHex(opacity.muted) },
                ]}
                textStyle={{ color: getStatusColor(item.status) }}
              >
                {getStatusText(item.status)}
              </Chip>
            </View>
          </View>
          <IconButton
            icon="dots-vertical"
            size={24}
            onPress={() => {/* TODO: context menu */}}
            accessibilityLabel="더보기 메뉴"
          />
        </View>

        <Text style={styles.subject}>{item.subject}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="file-document" size={18} color={colors.textSecondary} />
            <Text style={styles.statText}>{problemCount}문제</Text>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="calendar" size={18} color={colors.textSecondary} />
            <Text style={styles.statText}>마감: {formatDate(item.dueDate)}</Text>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="account-group" size={18} color={colors.textSecondary} />
            <Text style={styles.statText}>{submittedCount}명 배정</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filterContainer}>
        {(['all', 'published', 'closed', 'draft'] as const).map((status) => (
          <Chip
            key={status}
            selected={filter === status}
            onPress={() => setFilter(status)}
            style={styles.filterChip}
            showSelectedCheck={false}
          >
            {status === 'all' ? '전체' : getStatusText(status as AssignmentStatus)}
          </Chip>
        ))}
      </View>

      {/* Content */}
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
          onAction={filter === 'all' ? () => setShowCreateForm(true) : undefined}
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

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowCreateForm(true)}
        label="새 숙제"
      />

      {/* Assignment creation form modal */}
      <AssignmentCreateForm
        visible={showCreateForm}
        onDismiss={() => {
          setShowCreateForm(false);
          setIncomingProblems([]);
        }}
        onCreated={() => {
          // Refresh assignment list after creation
          if (user) fetchAssignments(user.id);
        }}
        initialProblems={incomingProblems}
      />
    </SafeAreaView>
  );
}

// (Keep existing styles -- see current assignments.tsx lines 217-319)
const styles = StyleSheet.create({
  // ... same styles as current file, no changes needed
  container: { flex: 1, backgroundColor: colors.background },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  filterChip: { marginRight: spacing.xs, minHeight: 44 },
  listContent: { padding: spacing.lg, paddingBottom: 100 },
  assignmentCard: { marginBottom: spacing.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  assignmentTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tags: { flexDirection: 'row', gap: spacing.sm },
  gradeChip: { backgroundColor: roleColors.teacher.accentLight },
  statusChip: {},
  subject: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  statsRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statText: { ...typography.bodySmall, color: colors.textSecondary },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: roleColors.teacher.accent,
  },
});
```

### Step 7.3: Problem Selection from Problem Bank (Multi-Select Mode)

The `problem-bank.tsx` screen already has selection mode and the `handleAddToAssignment` callback (line 188-195) that navigates to the assignments screen with `bankProblems` route params. **No changes are needed to this file** -- the existing code:

```typescript
// Already exists in problem-bank.tsx (line 188-195)
const handleAddToAssignment = useCallback(() => {
  const selected = store.problems.filter((p) => selectedIds.has(p.id));
  router.push({
    pathname: '/(teacher)/assignments',
    params: { bankProblems: JSON.stringify(selected) },
  });
  exitSelectionMode();
}, [selectedIds, store.problems, exitSelectionMode]);
```

...is already correct. The new `assignments.tsx` reads `bankProblems` from `useLocalSearchParams()` and auto-opens the creation form.

Additionally, the existing `ProblemSelector` modal component (`src/components/problemBank/ProblemSelector.tsx`) provides an in-modal selection experience that can be used directly from the creation form without leaving the screen. The `AssignmentCreateForm` component above uses both paths:

1. **In-form selection**: "문제 추가" button opens `ProblemSelector` modal.
2. **Cross-screen selection**: Problems arrive via route params from `problem-bank.tsx` or `problem-extract.tsx`.

### Step 7.4: Student Selection (Multi-Select from Academy Students)

The student list is fetched directly from Supabase inside the `AssignmentCreateForm` component:

```typescript
const fetchAcademyStudents = async () => {
  if (!user?.academyId) return;
  setStudentsLoading(true);
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, student_profiles(grade)')
      .eq('academy_id', user.academyId)
      .eq('role', 'student')
      .order('name');

    if (error) throw error;

    const studentList: StudentOption[] = (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      grade: s.student_profiles?.grade,
    }));
    setStudents(studentList);
  } catch (err) {
    Alert.alert('오류', '학생 목록을 불러오는데 실패했습니다.');
  } finally {
    setStudentsLoading(false);
  }
};
```

This query is RLS-safe: the teacher's session token is used, and the `profiles_select_same_academy` RLS policy ensures only students in the same academy are visible. The query joins with `student_profiles` to show the student's grade level next to their name.

The "전체 선택" / "선택 해제" toggle lets the teacher quickly assign to all students.

### Step 7.5: Create and Publish via Transactional RPC

When the teacher taps "배정하기" (Assign), the flow is:

```
AssignmentCreateForm.handleCreate(publishImmediately=true)
  └── assignmentStore.createAssignment(data)
       └── services.assignment.create(data)
            └── supabaseAssignmentService.create(data)
                 └── supabase.rpc('create_assignment_with_details', { ... })
```

The RPC function `create_assignment_with_details()` (defined in Section 1, Migration 004) creates three kinds of rows atomically:

1. **`assignments`** row: The main assignment record.
2. **`assignment_problems`** rows: One per selected problem, with `order_index` and `points`.
3. **`assignment_students`** rows: One per selected student, with `status = 'assigned'`.

If any INSERT fails, the entire transaction rolls back -- no orphaned problems or dangling student assignments.

The RPC call in `supabaseAssignmentService` (from Section 4) looks like:

```typescript
// From supabaseAssignmentService.ts (Section 4)
async create(data) {
  const { data: assignmentId, error } = await supabase.rpc(
    'create_assignment_with_details',
    {
      p_assignment: {
        academy_id: data.academyId,
        teacher_id: data.teacherId,
        title: data.title,
        description: data.description,
        grade: data.grade,
        subject: data.subject,
        due_date: data.dueDate,
        status: data.status,
      },
      p_problems: (data.problems || []).map((p, idx) => ({
        problem_id: p.id,
        points: p.points || 10,
      })),
      p_student_ids: data.assignedStudents || [],
    }
  );
  if (error) throw error;

  // Fetch complete assignment to return
  const created = await this.getById(assignmentId);
  if (!created) throw new Error('Assignment created but not found');
  return created;
},
```

### Step 7.6: Integration with Problem-Extract Screen (PDF to Assignment)

The `problem-extract.tsx` screen already navigates to the assignments screen with extracted problems (line 83-90):

```typescript
// Already exists in problem-extract.tsx
const handleCreateAssignment = () => {
  const selectedProblems = problems.filter((p) => selectedIds.has(p.id));
  router.push({
    pathname: '/(teacher)/assignments',
    params: { newProblems: JSON.stringify(selectedProblems) },
  });
};
```

However, the `ExtractedProblem` type from `geminiService.ts` does not exactly match `ProblemBankItem`. The extracted problems must be **saved to the problem bank first** before they can be added to an assignment (because `assignment_problems` references `problem_bank(id)` as a foreign key).

Add a "문제은행 저장 후 숙제 만들기" flow to `problem-extract.tsx`:

```typescript
// Add to problem-extract.tsx -- replaces the existing handleCreateAssignment

import { useProblemBankStore } from '../../src/stores/problemBankStore';
import { useAuthStore } from '../../src/stores/authStore';

const handleCreateAssignment = async () => {
  const { user } = useAuthStore.getState();
  const { bulkCreateProblems } = useProblemBankStore.getState();

  if (!user) {
    Alert.alert('오류', '로그인이 필요합니다.');
    return;
  }

  const selectedProblems = problems.filter((p) => selectedIds.has(p.id));

  if (selectedProblems.length === 0) {
    Alert.alert('알림', '문제를 선택해주세요.');
    return;
  }

  try {
    // Step 1: Save extracted problems to problem bank first
    // (required because assignment_problems FK references problem_bank.id)
    const problemBankItems = selectedProblems.map((ep) => ({
      academyId: user.academyId,
      createdBy: user.id,
      content: ep.content,
      imageUrls: [] as string[],
      answer: ep.answer || '',
      difficulty: ep.difficulty,
      type: ep.type,
      choices: ep.choices || null,
      grade: '고1' as Grade, // Default; teacher can change in assignment form
      subject: ep.topic || '수학',
      topic: ep.topic || '',
      tags: ep.topic ? [ep.topic] : [],
      sourceType: 'ai_extracted' as const,
      points: 10,
    }));

    const savedProblems = await bulkCreateProblems(problemBankItems);

    // Step 2: Navigate to assignments with the saved ProblemBankItems
    // (these now have real IDs from Supabase)
    router.push({
      pathname: '/(teacher)/assignments',
      params: { bankProblems: JSON.stringify(savedProblems) },
    });
  } catch (err) {
    Alert.alert('오류', '문제 저장에 실패했습니다. 다시 시도해주세요.');
  }
};
```

This ensures the flow is: **Extract (Gemini) -> Save to Problem Bank (get real IDs) -> Open Assignment Creation (with real ProblemBankItems)**. The foreign key constraint in `assignment_problems` is satisfied because the problems now exist in the `problem_bank` table with valid UUIDs.

### Step 7.7: Install DateTimePicker Dependency

The form uses `@react-native-community/datetimepicker` for the due date picker. Install if not already present:

```bash
npx expo install @react-native-community/datetimepicker
```

---

## 5. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/assignment/AssignmentCreateForm.tsx` | **Create** | Full assignment creation form modal with problem selection, student selection, and submit |
| `src/components/assignment/index.ts` | **Create** | Barrel export for assignment components |
| `app/(teacher)/assignments.tsx` | **Modify** | Remove mock data, connect to stores, read route params, wire FAB to creation form |
| `app/(teacher)/problem-extract.tsx` | **Modify** | Update `handleCreateAssignment` to save to problem bank first (get real IDs), then navigate to assignment form |
| `package.json` | **Modify** | Add `@react-native-community/datetimepicker` (if not already installed) |

### Files That Do NOT Need Changes

| File | Reason |
|------|--------|
| `src/stores/assignmentStore.ts` | `createAssignment()` (line 81) already calls `services.assignment.create(data)` and updates local state |
| `src/services/interfaces/assignment.ts` | Interface is correct; `create()` accepts `Omit<Assignment, 'id' \| 'createdAt' \| 'updatedAt'>` |
| `app/(teacher)/problem-bank.tsx` | `handleAddToAssignment` (line 188) already navigates with `bankProblems` param |
| `src/components/problemBank/ProblemSelector.tsx` | Ready-to-use modal component with multi-select, filters, and confirm callback |

---

## 6. Acceptance Criteria

- [ ] Teacher can tap the FAB ("새 숙제") on the assignments screen to open the creation form
- [ ] Creation form has fields for title, description, grade (chip selector), subject (chip selector), and due date (date picker)
- [ ] Teacher can add problems from the problem bank via the in-form `ProblemSelector` modal
- [ ] Teacher can navigate from `problem-bank.tsx` with selected problems and the creation form auto-opens with those problems pre-loaded
- [ ] Teacher can navigate from `problem-extract.tsx` with AI-extracted problems; the problems are saved to the problem bank first (getting real IDs), then the creation form opens with them
- [ ] Teacher can see the list of academy students with checkboxes and a "전체 선택" toggle
- [ ] "임시 저장" creates the assignment with status `'draft'`; "배정하기" creates with status `'published'`
- [ ] Assignment is saved to Supabase via `create_assignment_with_details()` RPC in a single transaction (assignment + assignment_problems + assignment_students created atomically)
- [ ] After creation, the assignment appears in the assignments list
- [ ] Published assignment appears in the assigned students' homework list (verified in Section 8)
- [ ] The `notify_assignment` database trigger fires on publish, creating notification rows for assigned students
- [ ] Validation prevents creation without a title, without problems, without students, or with a past due date
- [ ] Loading indicator displays during the creation API call
- [ ] Error messages display in Korean if creation fails
- [ ] No mock data remains in `assignments.tsx` (the `mockAssignments` array is removed)

---

## 7. Estimated Effort

**1 day** (6-8 hours total)

| Task | Hours |
|------|-------|
| Create `AssignmentCreateForm` component | 3-4h |
| Modify `assignments.tsx` (remove mocks, wire FAB, route params) | 1-1.5h |
| Modify `problem-extract.tsx` (save-to-bank-first flow) | 0.5-1h |
| Integration testing (create, draft, publish, verify in DB) | 1-1.5h |
| Install and verify `@react-native-community/datetimepicker` | 0.5h |

---

## Appendix: Data Flow Diagram

```
┌──────────────────────┐     ┌────────────────────┐     ┌─────────────────────┐
│  problem-extract.tsx │     │  problem-bank.tsx   │     │  AssignmentCreate   │
│  (AI extraction)     │     │  (manual browse)    │     │  Form (in-form)     │
│                      │     │                     │     │                     │
│  1. Select problems  │     │  1. Enter select    │     │  1. Tap "문제 추가"  │
│  2. Tap "숙제 만들기"│     │     mode            │     │  2. ProblemSelector  │
│  3. bulkCreate to    │     │  2. Select problems │     │     modal opens     │
│     problem bank     │     │  3. Tap "숙제에     │     │  3. Select problems │
│  4. router.push with │     │     추가"           │     │  4. Confirm         │
│     bankProblems     │     │  4. router.push     │     │                     │
│     param            │     │     with bankProblems│     │                     │
└──────────┬───────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                            │                           │
           └────────────┬───────────────┘                           │
                        ▼                                           │
           ┌────────────────────────┐                               │
           │  assignments.tsx       │◄──────────────────────────────┘
           │                        │
           │  reads route params    │
           │  opens AssignmentCreate│
           │  Form with problems    │
           │  pre-loaded            │
           └────────────┬───────────┘
                        │  handleCreate()
                        ▼
           ┌────────────────────────┐
           │  assignmentStore       │
           │  .createAssignment()   │
           └────────────┬───────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │  supabaseAssignment    │
           │  Service.create()      │
           └────────────┬───────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │  supabase.rpc(         │
           │   'create_assignment_  │
           │    with_details',      │
           │    { p_assignment,     │
           │      p_problems,       │
           │      p_student_ids })  │
           └────────────────────────┘
                        │
                 ┌──────┼──────┐
                 ▼      ▼      ▼
           assignments  assignment_  assignment_
           (1 row)      problems     students
                        (N rows)     (M rows)
```
