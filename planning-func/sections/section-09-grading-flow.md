# Section 9: Grading Flow (Teacher)

> **Source Plan**: `planning-func/claude-plan.md` -- Section 9
> **Estimated Effort**: 1 day
> **Priority**: HIGH
> **Requires**: Sections 4 (Supabase Services), 8 (Problem Solving + Submission)
> **Blocks**: Section 10 (Testing & Polish)

---

## 1. Background

After a student solves and submits answers (Section 8), the teacher must review, grade, and provide feedback on each problem. This section implements the **complete teacher grading workflow**:

1. Teacher opens the grading screen and sees a list of assignments that have ungraded (pending) submissions.
2. Teacher selects an assignment and sees a per-student breakdown of submissions.
3. For each student, the teacher opens the individual problem grading UI which displays:
   - The problem content (LaTeX-rendered math)
   - The student's submitted answer (text and/or canvas drawing image loaded via signed URL)
   - The correct answer from the problem bank
4. Teacher marks the problem correct/incorrect, enters a score, and optionally writes feedback.
5. For multiple-choice (`객관식`) problems, auto-grading pre-fills the score by comparing the student answer to the known correct answer.
6. The `isCorrect` field is determined by a threshold rule: `score >= 50% of problem points` means correct.
7. Each grading insert fires the `sync_grading_score` database trigger, which updates `submissions.score`, `submissions.is_correct`, and `assignment_students.total_score`. The trigger only sets `assignment_students.status = 'graded'` when **ALL** problems for that student-assignment pair have been graded.
8. When `is_correct = false`, the client-side wrong-note auto-generation logic triggers via the `submissionStore.lastAddedSubmission` subscriber (see `dataFlowConnector.ts`), creating an entry in the wrong note store for later review.

---

## 2. Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| G-01 | Teacher sees a list of assignments with pending (ungraded) submissions | Must |
| G-02 | Each assignment card shows the count of pending vs total submissions | Must |
| G-03 | Teacher can drill into an assignment to see per-student submission status | Must |
| G-04 | Student submission view shows: student name, problems submitted count, status | Must |
| G-05 | Individual problem grading UI displays problem content (LaTeX), student answer, correct answer side by side | Must |
| G-06 | Canvas drawing images are loaded via Supabase Storage signed URLs (1-hour expiry) | Must |
| G-07 | Teacher can enter a numeric score for each problem | Must |
| G-08 | Teacher can toggle correct/incorrect (auto-computed from score threshold) | Must |
| G-09 | Teacher can enter optional feedback text per problem | Should |
| G-10 | Multiple-choice problems are auto-graded with teacher override capability | Must |
| G-11 | `isCorrect` is determined by: `score >= problem.points * 0.5` | Must |
| G-12 | Grading insert triggers `sync_grading_score` which updates submission score and assignment status | Must |
| G-13 | `assignment_students.status` becomes `'graded'` only when ALL problems for that student are graded | Must |
| G-14 | Wrong-note auto-generation fires when a graded submission has `isCorrect = false` | Must |
| G-15 | After grading a problem, UI advances to the next ungraded problem automatically | Should |
| G-16 | Filter chips: "채점 대기" (pending), "채점 완료" (graded), "전체" (all) | Must |

### Non-Functional Requirements

| Requirement | Detail |
|-------------|--------|
| Performance | Grading list loads within 2 seconds |
| UX | Loading spinners during all async operations |
| Accessibility | All buttons have `accessibilityLabel` in Korean |
| Error handling | Korean error messages for all failure states |

---

## 3. Dependencies

### Requires (must be completed first)

| Section | What It Provides | Why It Is Needed |
|---------|-----------------|------------------|
| **Section 4** (Supabase Services) | `supabaseAssignmentService.gradeSubmission()`, `supabaseAssignmentService.getSubmissions()`, `supabaseAssignmentService.getSubmissionsByProblem()` | The grading action calls `services.assignment.gradeSubmission()` which inserts into the `gradings` table. Submission queries fetch the data to display. |
| **Section 8** (Problem Solving + Submission) | Real `submissions` rows in the database with `answer_text`, `answer_image_url`, and references to `assignment_problems` | Without submitted answers, there is nothing to grade. The grading UI depends on submissions existing with canvas image URLs in Supabase Storage. |

### Blocks (cannot start until this section is done)

| Section | Why It Is Blocked |
|---------|-------------------|
| **Section 10** (Testing & Polish) | The end-to-end demo flow requires grading to complete the assignment lifecycle (assign -> solve -> grade -> view results). |

### Internal Dependencies (within this section)

```
Step 9.1: Grading list (assignment-level)
  └── Step 9.2: Student submission view (per-assignment, per-student)
       └── Step 9.3: Individual problem grading UI
            ├── Step 9.4: Auto-grading for multiple choice
            └── Step 9.5: Wrong-note trigger on isCorrect=false
```

---

## 4. Implementation Details

### Step 9.1: Grading List -- Show Assignments with Pending Gradings

Replace the hardcoded `mockSubmissions` array in `app/(teacher)/grading.tsx` with real data from stores. The grading list screen shows assignments (not individual submissions) grouped by assignment, with a pending count.

**Current state** (`app/(teacher)/grading.tsx` lines 22-28):
```typescript
// REMOVE THIS -- hardcoded mock data
const mockSubmissions: Submission[] = [
  { id: '1', studentName: '김철수', assignmentTitle: '이차방정식 연습', ... },
  { id: '2', studentName: '이영희', assignmentTitle: '이차방정식 연습', ... },
  // ...
];
```

**Replace with store-connected data**:

```typescript
// app/(teacher)/grading.tsx -- FULL REWRITE

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, Chip, Avatar, TextInput, Modal, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, EmptyState } from '../../src/components/common';
import {
  colors, spacing, typography, roleColors, borderRadius, sizes, opacityToHex, opacity,
} from '../../src/constants/theme';
import { useRoleTheme } from '../../src/hooks';
import { useAuthStore } from '../../src/stores/authStore';
import { useAssignmentStore } from '../../src/stores/assignmentStore';
import { useSubmissionStore } from '../../src/stores/submissionStore';
import { useProblemBankStore } from '../../src/stores/problemBankStore';
import { supabase } from '../../src/lib/supabase';
import type { Assignment, Submission, Problem } from '../../src/types';

// ─── Types ────────────────────────────────────────────────

/** Assignment with grading summary for the grading list. */
interface GradingAssignment {
  assignment: Assignment;
  totalSubmissions: number;
  pendingCount: number;
  gradedCount: number;
}

/** A student's submission group for one assignment. */
interface StudentSubmissionGroup {
  studentId: string;
  studentName: string;
  submissions: Submission[];
  pendingCount: number;
  gradedCount: number;
  totalScore: number;
}

// ─── View Modes ───────────────────────────────────────────

type ViewMode = 'assignments' | 'students' | 'grading';

export default function GradingScreen() {
  const { user } = useAuthStore();
  const { assignments, fetchAssignments } = useAssignmentStore();
  const { submissions, fetchByAssignment, gradeSubmission } = useSubmissionStore();
  const { accent } = useRoleTheme();

  // ── State ──────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('assignments');
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('pending');
  const [isLoading, setIsLoading] = useState(false);

  // Selected assignment & student for drill-down
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [studentGroups, setStudentGroups] = useState<StudentSubmissionGroup[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSubmissionGroup | null>(null);

  // Individual problem grading state
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [canvasImageUrl, setCanvasImageUrl] = useState<string | null>(null);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  // ── Load assignments on mount ──────────────────────────
  useEffect(() => {
    if (user) {
      fetchAssignments(user.id, 'published');
    }
  }, [user]);

  // ── Compute grading summaries for each assignment ──────
  const [gradingAssignments, setGradingAssignments] = useState<GradingAssignment[]>([]);

  useEffect(() => {
    const loadGradingSummaries = async () => {
      if (!user || assignments.length === 0) return;
      setIsLoading(true);

      try {
        const summaries: GradingAssignment[] = [];

        for (const assignment of assignments) {
          // Query submission counts for this assignment
          const { data: subs, error } = await supabase
            .from('submissions')
            .select('id, score', { count: 'exact' })
            .eq('assignment_id', assignment.id);

          if (error) continue;

          const total = subs?.length ?? 0;
          const pending = subs?.filter((s) => s.score === null).length ?? 0;
          const graded = total - pending;

          if (total > 0) {
            summaries.push({
              assignment,
              totalSubmissions: total,
              pendingCount: pending,
              gradedCount: graded,
            });
          }
        }

        setGradingAssignments(summaries);
      } catch (e) {
        console.warn('Failed to load grading summaries:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadGradingSummaries();
  }, [assignments, user]);

  // ── Filter grading assignments ─────────────────────────
  const filteredAssignments = gradingAssignments.filter((ga) => {
    if (filter === 'pending') return ga.pendingCount > 0;
    if (filter === 'graded') return ga.pendingCount === 0;
    return true; // 'all'
  });

  // ... (continued in Step 9.2 and 9.3)
```

**Assignment card rendering in the grading list**:

```typescript
  const renderAssignmentCard = ({ item }: { item: GradingAssignment }) => (
    <Card style={styles.submissionCard}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleSelectAssignment(item.assignment)}
        accessibilityLabel={`${item.assignment.title} 채점하기`}
      >
        <Avatar.Icon
          size={sizes.avatarMd}
          icon="clipboard-check-outline"
          style={{
            backgroundColor: item.pendingCount > 0
              ? colors.warning + opacityToHex(opacity.subtle)
              : colors.success + opacityToHex(opacity.subtle),
          }}
          color={item.pendingCount > 0 ? colors.warning : colors.success}
        />
        <View style={styles.submissionInfo}>
          <Text style={styles.studentName}>{item.assignment.title}</Text>
          <Text style={styles.assignmentTitle}>
            {item.assignment.grade} | {item.assignment.subject}
          </Text>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="account-group" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              채점 대기 {item.pendingCount}건 / 전체 {item.totalSubmissions}건
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </Card>
  );
```

---

### Step 9.2: Student Submission View (Per Assignment)

When the teacher taps an assignment, fetch all submissions for that assignment and group them by student.

```typescript
  // ── Handler: Select assignment → load student submissions ─
  const handleSelectAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsLoading(true);

    try {
      // Fetch all submissions for this assignment with student names
      const { data: subs, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles!student_id ( id, name )
        `)
        .eq('assignment_id', assignment.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Group submissions by student
      const groupMap = new Map<string, StudentSubmissionGroup>();

      for (const sub of subs || []) {
        const studentId = sub.student_id;
        const studentName = sub.profiles?.name ?? '알 수 없음';

        if (!groupMap.has(studentId)) {
          groupMap.set(studentId, {
            studentId,
            studentName,
            submissions: [],
            pendingCount: 0,
            gradedCount: 0,
            totalScore: 0,
          });
        }

        const group = groupMap.get(studentId)!;
        group.submissions.push({
          id: sub.id,
          assignmentId: sub.assignment_id,
          studentId: sub.student_id,
          problemId: sub.problem_id,
          answerText: sub.answer_text,
          answerImageUrl: sub.answer_image_url,
          canvasData: sub.canvas_data,
          isCorrect: sub.is_correct,
          score: sub.score,
          submittedAt: sub.submitted_at,
          gradedAt: sub.graded_at,
          timeSpentSeconds: sub.time_spent_seconds,
        });

        if (sub.score === null) {
          group.pendingCount += 1;
        } else {
          group.gradedCount += 1;
          group.totalScore += sub.score ?? 0;
        }
      }

      setStudentGroups(Array.from(groupMap.values()));
      setViewMode('students');
    } catch (e) {
      Alert.alert('오류', '제출 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render student list for selected assignment ─────────
  const renderStudentCard = ({ item }: { item: StudentSubmissionGroup }) => (
    <Card style={styles.submissionCard}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => handleSelectStudent(item)}
        accessibilityLabel={`${item.studentName} 답안 채점하기`}
      >
        <Avatar.Text
          size={sizes.avatarMd}
          label={item.studentName.charAt(0)}
          style={{
            backgroundColor: item.pendingCount > 0 ? colors.warning : colors.success,
          }}
        />
        <View style={styles.submissionInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.studentName}>{item.studentName}</Text>
            {item.pendingCount === 0 && (
              <Chip compact style={styles.scoreChip}>
                {item.totalScore}점
              </Chip>
            )}
          </View>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="file-document" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {item.submissions.length}문제 제출 | 채점 대기 {item.pendingCount}건
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </Card>
  );
```

---

### Step 9.3: Individual Problem Grading UI

When the teacher selects a student, display the grading interface for each problem: problem content, student answer, correct answer, and grading controls.

```typescript
  // ── Handler: Select student → open grading UI ───────────
  const handleSelectStudent = async (group: StudentSubmissionGroup) => {
    setSelectedStudent(group);
    setCurrentProblemIdx(0);
    setViewMode('grading');

    // Load the canvas image for the first problem
    const firstSub = group.submissions[0];
    if (firstSub) {
      await loadCanvasImage(firstSub);
      prefillAutoGrade(firstSub);
    }
  };

  // ── Load canvas drawing image via signed URL ────────────
  const loadCanvasImage = async (submission: Submission) => {
    setCanvasImageUrl(null);

    if (!submission.answerImageUrl) return;

    try {
      // The answerImageUrl stores the storage path, e.g. "studentId/assignmentId/problemId.png"
      // For private buckets, we must use createSignedUrl (getPublicUrl returns 403)
      const storagePath = submission.answerImageUrl;

      const { data: signedData, error } = await supabase.storage
        .from('submissions')
        .createSignedUrl(storagePath, 3600); // 1-hour expiry

      if (error) {
        console.warn('Failed to create signed URL:', error.message);
        return;
      }

      setCanvasImageUrl(signedData?.signedUrl ?? null);
    } catch (e) {
      console.warn('Failed to load canvas image:', e);
    }
  };
```

**Grading UI component rendering**:

```typescript
  // ── Render individual problem grading view ──────────────
  const renderGradingView = () => {
    if (!selectedStudent || !selectedAssignment) return null;

    const submission = selectedStudent.submissions[currentProblemIdx];
    if (!submission) return null;

    // Find the problem from the assignment's problems list
    const problem = selectedAssignment.problems.find(
      (p) => p.id === submission.problemId
    );
    const maxPoints = problem?.points ?? 10;
    const isAlreadyGraded = submission.score !== null && submission.score !== undefined;

    return (
      <View style={styles.gradingContainer}>
        {/* Header: problem counter */}
        <View style={styles.gradingHeader}>
          <Text style={styles.gradingHeaderText}>
            문제 {currentProblemIdx + 1} / {selectedStudent.submissions.length}
          </Text>
          <Text style={styles.gradingHeaderSub}>
            배점: {maxPoints}점
          </Text>
        </View>

        {/* Problem content */}
        <Card style={styles.problemCard}>
          <Text style={styles.sectionLabel}>문제</Text>
          <Text style={styles.problemContent}>
            {problem?.content ?? '문제 내용을 불러올 수 없습니다.'}
          </Text>
        </Card>

        {/* Student answer */}
        <Card style={styles.answerCard}>
          <Text style={styles.sectionLabel}>학생 답안</Text>

          {/* Text answer */}
          {submission.answerText && (
            <View style={styles.answerTextContainer}>
              <Text style={styles.answerText}>{submission.answerText}</Text>
            </View>
          )}

          {/* Canvas drawing image (loaded via signed URL) */}
          {canvasImageUrl && (
            <View style={styles.canvasImageContainer}>
              <Image
                source={{ uri: canvasImageUrl }}
                style={styles.canvasImage}
                resizeMode="contain"
                accessibilityLabel="학생 필기 답안 이미지"
              />
            </View>
          )}

          {!submission.answerText && !canvasImageUrl && (
            <Text style={styles.noAnswerText}>답안이 제출되지 않았습니다.</Text>
          )}
        </Card>

        {/* Correct answer */}
        <Card style={styles.correctAnswerCard}>
          <Text style={styles.sectionLabel}>정답</Text>
          <Text style={styles.correctAnswerText}>
            {problem?.answer ?? '정답 정보 없음'}
          </Text>
        </Card>

        {/* Grading controls */}
        {!isAlreadyGraded ? (
          <View style={styles.gradingControls}>
            {/* Score input */}
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>점수</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={scoreInput}
                onChangeText={setScoreInput}
                style={styles.scoreInput}
                placeholder={`0 ~ ${maxPoints}`}
                accessibilityLabel="점수 입력"
              />
              <Text style={styles.scoreMax}>/ {maxPoints}점</Text>
            </View>

            {/* Correct/Incorrect quick toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.gradeBtn,
                  styles.gradeBtnCorrect,
                  scoreInput && parseInt(scoreInput) >= maxPoints * 0.5 && styles.gradeBtnActive,
                ]}
                onPress={() => setScoreInput(String(maxPoints))}
                accessibilityLabel="정답 처리 (만점)"
              >
                <MaterialCommunityIcons name="check-bold" size={sizes.iconMd} color={colors.success} />
                <Text style={styles.toggleLabel}>정답</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gradeBtn,
                  styles.gradeBtnIncorrect,
                  scoreInput && parseInt(scoreInput) < maxPoints * 0.5 && styles.gradeBtnActive,
                ]}
                onPress={() => setScoreInput('0')}
                accessibilityLabel="오답 처리 (0점)"
              >
                <MaterialCommunityIcons name="close-thick" size={sizes.iconMd} color={colors.error} />
                <Text style={styles.toggleLabel}>오답</Text>
              </TouchableOpacity>
            </View>

            {/* Feedback text input */}
            <TextInput
              mode="outlined"
              label="피드백 (선택)"
              value={feedbackInput}
              onChangeText={setFeedbackInput}
              multiline
              numberOfLines={3}
              style={styles.feedbackInput}
              placeholder="학생에게 전달할 피드백을 입력하세요"
              accessibilityLabel="피드백 입력"
            />

            {/* Submit grading button */}
            <Button
              mode="contained"
              onPress={() => handleSubmitGrade(submission, maxPoints)}
              loading={isSubmittingGrade}
              disabled={!scoreInput || isSubmittingGrade}
              style={styles.submitGradeButton}
            >
              채점 완료
            </Button>
          </View>
        ) : (
          <View style={styles.alreadyGraded}>
            <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
            <Text style={styles.alreadyGradedText}>
              채점 완료 | {submission.score}점
              {submission.feedback ? ` | ${submission.feedback}` : ''}
            </Text>
          </View>
        )}

        {/* Navigation: Previous / Next problem */}
        <View style={styles.navRow}>
          <Button
            mode="outlined"
            onPress={() => navigateProblem(-1)}
            disabled={currentProblemIdx === 0}
            icon="chevron-left"
            accessibilityLabel="이전 문제"
          >
            이전
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigateProblem(1)}
            disabled={currentProblemIdx >= selectedStudent.submissions.length - 1}
            icon="chevron-right"
            contentStyle={{ flexDirection: 'row-reverse' }}
            accessibilityLabel="다음 문제"
          >
            다음
          </Button>
        </View>
      </View>
    );
  };
```

**Grading submission handler -- the core grading logic**:

```typescript
  // ── Submit grade for a single problem ───────────────────
  const handleSubmitGrade = async (submission: Submission, maxPoints: number) => {
    const score = parseInt(scoreInput);

    // Validate score
    if (isNaN(score) || score < 0 || score > maxPoints) {
      Alert.alert('입력 오류', `점수는 0에서 ${maxPoints} 사이여야 합니다.`);
      return;
    }

    setIsSubmittingGrade(true);

    try {
      // Determine isCorrect: score >= 50% of the problem's max points = correct.
      // This threshold matters because:
      //   1. The sync_grading_score trigger copies isCorrect to submissions.is_correct
      //   2. Wrong-note auto-generation only fires when is_correct = false
      //   3. Student stats (correct rate) depend on this field
      const isCorrect = score >= maxPoints * 0.5;

      // Call the store's gradeSubmission, which calls services.assignment.gradeSubmission()
      // Under the hood, this inserts into the `gradings` table.
      // The sync_grading_score trigger then:
      //   a) Updates submissions.score and submissions.is_correct
      //   b) Updates assignment_students.total_score
      //   c) Only sets assignment_students.status = 'graded' when ALL problems are graded
      await gradeSubmission(submission.id, user!.id, {
        score,
        feedback: feedbackInput || undefined,
        isCorrect,
      });

      // Reset inputs
      setScoreInput('');
      setFeedbackInput('');

      // Auto-advance to the next ungraded problem
      const nextUngradedIdx = selectedStudent!.submissions.findIndex(
        (s, idx) => idx > currentProblemIdx && s.score === null
      );

      if (nextUngradedIdx >= 0) {
        setCurrentProblemIdx(nextUngradedIdx);
        const nextSub = selectedStudent!.submissions[nextUngradedIdx];
        await loadCanvasImage(nextSub);
        prefillAutoGrade(nextSub);
      } else {
        // All problems graded for this student
        Alert.alert(
          '채점 완료',
          `${selectedStudent!.studentName} 학생의 모든 문제 채점이 완료되었습니다.`,
          [
            {
              text: '학생 목록으로',
              onPress: () => {
                setViewMode('students');
                // Refresh student groups to reflect updated grading counts
                if (selectedAssignment) {
                  handleSelectAssignment(selectedAssignment);
                }
              },
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert('채점 실패', '채점 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  // ── Navigate between problems ───────────────────────────
  const navigateProblem = async (direction: -1 | 1) => {
    const newIdx = currentProblemIdx + direction;
    if (newIdx < 0 || !selectedStudent || newIdx >= selectedStudent.submissions.length) return;

    setCurrentProblemIdx(newIdx);
    const sub = selectedStudent.submissions[newIdx];
    await loadCanvasImage(sub);
    prefillAutoGrade(sub);
  };
```

---

### Step 9.4: Auto-Grading for Multiple Choice Problems

For `객관식` (multiple choice) problems, compare the student's answer text to the correct answer in the problem bank. Auto-fill the score if they match.

```typescript
  // ── Auto-grade multiple choice problems ─────────────────
  const prefillAutoGrade = (submission: Submission) => {
    // Reset inputs for the new problem
    setScoreInput('');
    setFeedbackInput('');

    if (!selectedAssignment) return;

    // Find the problem from the assignment
    const problem = selectedAssignment.problems.find(
      (p) => p.id === submission.problemId
    );
    if (!problem) return;

    // Skip if already graded
    if (submission.score !== null && submission.score !== undefined) return;

    // Auto-grade logic: Only for 객관식 (multiple choice) with a known answer
    // The problem type can be fetched from the problem bank if not on the
    // lightweight Problem object. For efficiency, we check answer match directly.
    const isAutoGradable = problem.answer && submission.answerText;

    if (isAutoGradable) {
      // Normalize both answers: trim whitespace, compare case-insensitively
      const studentAnswer = submission.answerText!.trim().toLowerCase();
      const correctAnswer = problem.answer!.trim().toLowerCase();
      const isCorrect = studentAnswer === correctAnswer;

      // Pre-fill score: full points if correct, 0 if incorrect
      const maxPoints = problem.points ?? 10;
      const suggestedScore = isCorrect ? maxPoints : 0;
      setScoreInput(String(suggestedScore));

      // Pre-fill feedback for auto-graded problems
      if (isCorrect) {
        setFeedbackInput('');
      } else {
        setFeedbackInput(`정답: ${problem.answer}`);
      }
    }
  };
```

> **Important**: Auto-grading only pre-fills the score. The teacher can always override the suggested score before submitting. The auto-fill is a convenience, not a forced action.

---

### Step 9.5: `isCorrect` Field and `sync_grading_score` Trigger Behavior

The `isCorrect` field has a specific rule:

```
isCorrect = score >= (problem.points * 0.5)
```

**Why 50%?** Partial credit is common in Korean math education. A student who earns 6/10 points on a problem demonstrates sufficient understanding and should not have that problem added to their wrong-note queue. The 50% threshold balances correctness tracking with practical pedagogy.

**The `sync_grading_score` trigger** (defined in Section 1, `004_triggers_and_functions.sql`) fires on every `INSERT` or `UPDATE` to the `gradings` table:

```sql
-- This is the ENHANCED version from claude-plan.md Section 1.
-- It only sets status='graded' when ALL problems are graded.
CREATE OR REPLACE FUNCTION sync_grading_score()
RETURNS TRIGGER AS $$
DECLARE
    v_assignment_id UUID;
    v_student_id UUID;
    v_total_problems INT;
    v_graded_count INT;
BEGIN
    -- Step 1: Update the submission's score and is_correct
    UPDATE submissions
    SET score = NEW.score,
        is_correct = NEW.is_correct
    WHERE id = NEW.submission_id
    RETURNING assignment_id, student_id INTO v_assignment_id, v_student_id;

    -- Step 2: Update total_score in assignment_students
    UPDATE assignment_students
    SET total_score = (
        SELECT COALESCE(SUM(s.score), 0)
        FROM submissions s
        WHERE s.assignment_id = v_assignment_id
          AND s.student_id = v_student_id
          AND s.score IS NOT NULL
    )
    WHERE assignment_id = v_assignment_id
      AND student_id = v_student_id;

    -- Step 3: Only set status to 'graded' when ALL problems are graded
    SELECT COUNT(*) INTO v_total_problems
    FROM assignment_problems
    WHERE assignment_id = v_assignment_id;

    SELECT COUNT(*) INTO v_graded_count
    FROM submissions
    WHERE assignment_id = v_assignment_id
      AND student_id = v_student_id
      AND score IS NOT NULL;

    IF v_graded_count >= v_total_problems THEN
        UPDATE assignment_students
        SET status = 'graded'
        WHERE assignment_id = v_assignment_id
          AND student_id = v_student_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Key behaviors:
- **Per-problem**: Each grading insert updates the individual `submissions.score` and `submissions.is_correct`.
- **Running total**: `assignment_students.total_score` is recalculated from all graded submissions after each grading.
- **Status guard**: `assignment_students.status` only flips to `'graded'` when `v_graded_count >= v_total_problems`. This prevents premature status changes when only some problems have been graded.

> **Note on `is_correct` in the trigger**: The `gradeSubmission()` service method passes `is_correct` directly from the client-side computation (`score >= 50% of points`). The trigger copies this value to `submissions.is_correct`. The existing `DATABASE_SCHEMA.md` trigger uses `(NEW.score > 0)` which should be updated to use the passed `NEW.is_correct` value. The enhanced trigger in Section 1 (`claude-plan.md`) already handles this correctly.

---

### Step 9.6: Updating `gradeSubmission` to Pass `isCorrect`

The current `submissionStore.gradeSubmission()` does not pass `isCorrect`. The store's `gradeSubmission` interface accepts `{ score, feedback }`, but we need to pass `isCorrect` as well.

**Modify the store action** (in `src/stores/submissionStore.ts`):

```typescript
// Current interface (line 28-34):
gradeSubmission: (
  submissionId: string,
  teacherId: string,
  data: {
    score: number;
    feedback?: string;
  }
) => Promise<void>;

// UPDATED interface:
gradeSubmission: (
  submissionId: string,
  teacherId: string,
  data: {
    score: number;
    feedback?: string;
    isCorrect?: boolean; // NEW -- add this field
  }
) => Promise<void>;
```

**Update the store action implementation** (line 81-116):

```typescript
gradeSubmission: async (submissionId, teacherId, data) => {
  set({ isLoading: true, error: null });
  try {
    const grading = await services.assignment.gradeSubmission({
      submissionId,
      teacherId,
      score: data.score,
      feedback: data.feedback,
      isCorrect: data.isCorrect ?? (data.score > 0), // fallback: score > 0
    });

    // Update the submission with grading results
    const submissions = get().submissions.map((s) =>
      s.id === submissionId
        ? {
            ...s,
            score: grading.score,
            feedback: grading.feedback,
            isCorrect: data.isCorrect ?? (data.score > 0),
            gradedAt: grading.gradedAt,
          }
        : s
    );

    // If the submission was graded as incorrect, trigger wrongNote via lastAddedSubmission
    const gradedSub = submissions.find((s) => s.id === submissionId);
    set({
      submissions,
      isLoading: false,
      lastAddedSubmission:
        gradedSub && gradedSub.isCorrect === false
          ? gradedSub
          : get().lastAddedSubmission,
    });
  } catch (e) {
    set({ error: '채점에 실패했습니다.', isLoading: false });
  }
},
```

**Also update the `Grading` type** to include `isCorrect` (in `src/types/index.ts`):

```typescript
// Current (line 121-129):
export interface Grading {
  id: string;
  submissionId: string;
  teacherId: string;
  score: number;
  feedback?: string;
  feedbackImageUrl?: string;
  gradedAt: Date;
}

// UPDATED:
export interface Grading {
  id: string;
  submissionId: string;
  teacherId: string;
  score: number;
  isCorrect: boolean;  // NEW
  feedback?: string;
  feedbackImageUrl?: string;
  gradedAt: Date;
}
```

**And the `IAssignmentService.gradeSubmission` parameter type** (in `src/services/interfaces/assignment.ts`):

The existing signature `gradeSubmission(data: Omit<Grading, 'id' | 'gradedAt'>): Promise<Grading>` already inherits the new `isCorrect` field from the updated `Grading` type, so no change is needed to the interface itself.

---

### Step 9.7: Wrong-Note Auto-Generation

When `isCorrect = false`, the wrong-note auto-generation fires through the existing `submissionStore` -> `wrongNoteStore` subscriber pattern:

1. `gradeSubmission()` sets `lastAddedSubmission` to the graded submission when `isCorrect === false` (see code in Step 9.6).
2. The `wrongNoteStore` subscribes to `submissionStore` changes (via `dataFlowConnector.ts` or a direct subscription).
3. When `lastAddedSubmission` changes and `isCorrect === false`, `wrongNoteStore.addWrongNote()` is called.

**The subscription** (already partially scaffolded in `dataFlowConnector.ts`) should include:

```typescript
// Add to initializeDataFlowConnections() in src/stores/dataFlowConnector.ts

import { useWrongNoteStore } from './wrongNoteStore';
import { useProblemBankStore } from './problemBankStore';

// Connection: Graded submission (incorrect) -> Wrong note creation
useSubmissionStore.subscribe((state, prevState) => {
  const current = state.lastAddedSubmission;
  const previous = prevState.lastAddedSubmission;

  // Only trigger when lastAddedSubmission changes and is marked incorrect
  if (
    current &&
    current !== previous &&
    current.isCorrect === false &&
    current.gradedAt // Ensure this is from grading, not initial submission
  ) {
    const addWrongNote = useWrongNoteStore.getState().addWrongNote;

    // Fetch the problem details for the wrong note snapshot
    const problemStore = useProblemBankStore.getState();
    const problem = problemStore.problems.find((p) => p.id === current.problemId);

    if (problem) {
      addWrongNote({
        studentId: current.studentId,
        problemId: current.problemId,
        assignmentId: current.assignmentId,
        studentAnswer: current.answerText ?? '',
        correctAnswer: problem.answer ?? '',
        problem: problem, // Denormalized snapshot
      }).catch((e) => {
        console.warn('[DataFlow] Failed to auto-create wrong note:', e);
      });
    }
  }
});
```

This ensures that every incorrectly graded submission automatically generates a wrong-note entry for the student to review later.

---

### Step 9.8: Complete Grading Screen Render Method

Tie all view modes together in the main render:

```typescript
  // ── Main render ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Back button for drill-down views */}
      {viewMode !== 'assignments' && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (viewMode === 'grading') {
              setViewMode('students');
            } else {
              setViewMode('assignments');
              setSelectedAssignment(null);
            }
          }}
          accessibilityLabel="뒤로 가기"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          <Text style={styles.backButtonText}>
            {viewMode === 'grading'
              ? `${selectedStudent?.studentName} 채점`
              : selectedAssignment?.title ?? '채점'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Filter chips (only on assignment list view) */}
      {viewMode === 'assignments' && (
        <View style={styles.filterContainer}>
          <Chip
            selected={filter === 'pending'}
            onPress={() => setFilter('pending')}
            style={styles.filterChip}
            showSelectedCheck={false}
          >
            채점 대기
          </Chip>
          <Chip
            selected={filter === 'graded'}
            onPress={() => setFilter('graded')}
            style={styles.filterChip}
            showSelectedCheck={false}
          >
            채점 완료
          </Chip>
          <Chip
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
            style={styles.filterChip}
            showSelectedCheck={false}
          >
            전체
          </Chip>
        </View>
      )}

      {/* Content based on view mode */}
      {viewMode === 'assignments' && (
        filteredAssignments.length === 0 ? (
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
        ) : (
          <FlatList
            data={filteredAssignments}
            keyExtractor={(item) => item.assignment.id}
            renderItem={renderAssignmentCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      {viewMode === 'students' && (
        <FlatList
          data={studentGroups}
          keyExtractor={(item) => item.studentId}
          renderItem={renderStudentCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="account-off-outline"
              title="제출한 학생이 없습니다"
              description="학생이 답안을 제출하면 여기에 표시됩니다"
            />
          }
        />
      )}

      {viewMode === 'grading' && renderGradingView()}
    </SafeAreaView>
  );
}
```

---

### Step 9.9: Additional Styles

Add new styles for the grading UI components:

```typescript
// Add to the existing StyleSheet in grading.tsx
const styles = StyleSheet.create({
  // ... existing styles remain ...

  // Back navigation
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButtonText: {
    ...typography.subtitle,
    marginLeft: spacing.sm,
    color: colors.textPrimary,
  },

  // Grading container
  gradingContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  gradingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  gradingHeaderText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  gradingHeaderSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // Problem display
  problemCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  problemContent: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 24,
  },

  // Student answer display
  answerCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  answerTextContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  answerText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  canvasImageContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  canvasImage: {
    width: '100%',
    height: 300,
    borderRadius: borderRadius.md,
  },
  noAnswerText: {
    ...typography.bodySmall,
    color: colors.textDisabled,
    fontStyle: 'italic',
  },

  // Correct answer
  correctAnswerCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  correctAnswerText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  // Grading controls
  gradingControls: {
    marginTop: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  scoreLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    width: 50,
  },
  scoreInput: {
    width: 80,
    textAlign: 'center',
  },
  scoreMax: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  toggleLabel: {
    ...typography.caption,
    marginTop: 4,
  },
  gradeBtnActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  feedbackInput: {
    marginBottom: spacing.md,
  },
  submitGradeButton: {
    marginBottom: spacing.lg,
  },

  // Already graded indicator
  alreadyGraded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + opacityToHex(opacity.subtle),
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  alreadyGradedText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },

  // Navigation row
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
```

---

## 5. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/(teacher)/grading.tsx` | **Modify** | Complete rewrite: remove mock data, add three-level drill-down (assignments -> students -> problem grading), implement grading controls, canvas image display via signed URLs, auto-grading for multiple choice |
| `src/stores/submissionStore.ts` | **Modify** | Add `isCorrect` to `gradeSubmission()` data parameter |
| `src/types/index.ts` | **Modify** | Add `isCorrect: boolean` to `Grading` interface |
| `src/stores/dataFlowConnector.ts` | **Modify** | Add wrong-note auto-generation subscriber for graded incorrect submissions |

---

## 6. Acceptance Criteria

### Must Pass

- [ ] **G-AC-01**: Teacher sees a list of assignments that have submitted (ungraded) answers -- no hardcoded mock data remains.
- [ ] **G-AC-02**: Each assignment card shows the count of pending gradings vs total submissions.
- [ ] **G-AC-03**: Tapping an assignment shows a list of students with their submission counts and grading status.
- [ ] **G-AC-04**: Tapping a student opens the individual problem grading UI with problem content, student answer, and correct answer displayed.
- [ ] **G-AC-05**: Canvas drawing images load correctly via Supabase Storage signed URLs (`createSignedUrl()` with 1-hour expiry, NOT `getPublicUrl()` since the submissions bucket is private).
- [ ] **G-AC-06**: Teacher can enter a numeric score within the valid range (0 to max points).
- [ ] **G-AC-07**: Correct/Incorrect toggle buttons set the score to full points or zero respectively.
- [ ] **G-AC-08**: `isCorrect` is computed as `score >= problem.points * 0.5` and passed to the grading service.
- [ ] **G-AC-09**: Multiple-choice problems auto-fill score (full if answer matches, 0 if not) with teacher override capability.
- [ ] **G-AC-10**: Teacher can enter optional feedback text per problem.
- [ ] **G-AC-11**: Grading saves to Supabase: a new row is inserted into the `gradings` table via `services.assignment.gradeSubmission()`.
- [ ] **G-AC-12**: The `sync_grading_score` trigger correctly updates `submissions.score` and `submissions.is_correct` after each grading.
- [ ] **G-AC-13**: The `sync_grading_score` trigger correctly updates `assignment_students.total_score` (running sum).
- [ ] **G-AC-14**: `assignment_students.status` only changes to `'graded'` when ALL problems for that student-assignment pair have been graded -- NOT after each individual problem grading.
- [ ] **G-AC-15**: When a submission is graded with `isCorrect = false`, a wrong-note is auto-generated via the `dataFlowConnector` subscriber calling `wrongNoteStore.addWrongNote()`.
- [ ] **G-AC-16**: After grading a problem, the UI auto-advances to the next ungraded problem. If all problems are graded, a completion alert is shown.
- [ ] **G-AC-17**: Filter chips ("채점 대기", "채점 완료", "전체") correctly filter the assignment list.
- [ ] **G-AC-18**: Loading spinners are displayed during all async operations (fetching submissions, submitting grades).
- [ ] **G-AC-19**: Korean error messages display for all failure states (network error, invalid score input, grading save failure).

### Verification Script

To verify the trigger behavior after grading, run this in Supabase SQL Editor:

```sql
-- Check that grading a single problem does NOT set status to 'graded'
-- when there are still ungraded problems
SELECT
  asn.assignment_id,
  asn.student_id,
  asn.status,
  asn.total_score,
  (SELECT COUNT(*) FROM assignment_problems ap WHERE ap.assignment_id = asn.assignment_id) AS total_problems,
  (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = asn.assignment_id AND s.student_id = asn.student_id AND s.score IS NOT NULL) AS graded_count
FROM assignment_students asn
WHERE asn.status = 'graded';
-- All rows should have graded_count = total_problems
```

---

## 7. Estimated Effort

**1 day** (6-8 hours)

| Task | Hours |
|------|-------|
| Step 9.1: Grading list (replace mock data, add assignment summaries) | 1h |
| Step 9.2: Student submission view (group by student, display counts) | 1h |
| Step 9.3: Individual problem grading UI (problem/answer/correct display, canvas images) | 2h |
| Step 9.4: Auto-grading for multiple choice | 0.5h |
| Step 9.5-9.6: `isCorrect` logic, type updates, store changes | 1h |
| Step 9.7: Wrong-note auto-generation subscriber | 0.5h |
| Step 9.8-9.9: View integration, styles, polish | 1h |
| Manual testing of full grading flow | 1h |

---

## Appendix: Data Flow Diagram

```
Teacher taps "채점 완료" button
         │
         ▼
  handleSubmitGrade()
  ├── Compute isCorrect = score >= points * 0.5
  └── Call gradeSubmission(submissionId, teacherId, { score, feedback, isCorrect })
         │
         ▼
  submissionStore.gradeSubmission()
  ├── services.assignment.gradeSubmission() → INSERT INTO gradings
  │         │
  │         ▼
  │   ┌─────────────────────────────────────────┐
  │   │ DB TRIGGER: sync_grading_score()        │
  │   │  1. UPDATE submissions.score/is_correct │
  │   │  2. UPDATE assignment_students.total_score │
  │   │  3. IF all graded → status = 'graded'   │
  │   └─────────────────────────────────────────┘
  │
  ├── Update local submissions array
  └── If isCorrect === false → set lastAddedSubmission
         │
         ▼
  ┌────────────────────────────────────────────┐
  │ dataFlowConnector subscriber               │
  │  Detects lastAddedSubmission change        │
  │  If isCorrect=false && gradedAt exists:    │
  │    → wrongNoteStore.addWrongNote()         │
  │      → services.wrongNote.create()         │
  └────────────────────────────────────────────┘
```
