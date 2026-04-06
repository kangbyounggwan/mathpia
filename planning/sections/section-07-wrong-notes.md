# Section 07: Wrong Notes (오답노트)

**Phase**: 4 (Steps 3.14 + 3.15 + 3.16 from the master plan)
**Dependencies**: Section 01 (Types & Interfaces), Section 02 (Mock Data & Services), Section 03 (Zustand Stores)
**Estimated files to create/modify**: 7 new files, 1 modified file

---

## 1. Background

The Wrong Notes (오답노트) feature automatically collects problems that a student answered incorrectly and provides a structured review system. When a student submits a wrong answer during homework, the problem is automatically added to their wrong notes collection. The student can then revisit these problems in a dedicated review mode, where they re-attempt the problem, check their answer, and optionally view an AI-generated step-by-step explanation.

Mastery is tracked per wrong note: a problem is considered "learned" (숙련) only after the student answers it correctly 3 consecutive times, with at least 24 hours between each correct review attempt. This spaced repetition approach ensures genuine understanding rather than short-term memorization.

---

## 2. Prerequisites

Before implementing this section, the following must already exist from Sections 01-03:

### From Section 01 (Types & Interfaces)

**File: `src/types/wrongNote.ts`** must define:

```typescript
export type ReviewStatus = 'not_reviewed' | 'reviewing' | 'learned';

export interface WrongNote {
  id: string;
  studentId: string;
  problemId: string;
  assignmentId: string;
  problem: {
    id: string;
    content: string;
    contentHtml?: string;
    imageUrls?: string[];
    answer: string;
    solution?: string;
    difficulty: '상' | '중' | '하';
    type: '객관식' | '서술형' | '단답형';
    choices?: string[];
    topic: string;
    subject?: string;
    points: number;
  };
  studentAnswer: string;
  correctAnswer: string;
  topic: string;
  subject?: string;
  reviewCount: number;
  consecutiveCorrect: number;
  isLearned: boolean;
  lastReviewDate: string | null;    // ISO date string
  reviewHistory: ReviewAttempt[];
  createdAt: string;                // ISO date string
  updatedAt: string;                // ISO date string
}

export interface ReviewAttempt {
  attemptDate: string;              // ISO date string
  studentAnswer: string;
  isCorrect: boolean;
}

export interface WrongNoteStats {
  totalCount: number;
  notReviewedCount: number;
  reviewingCount: number;
  learnedCount: number;
  reviewCompletionRate: number;     // 0-1
}
```

If the types file from Section 01 differs slightly, adapt the code below accordingly but preserve all field semantics.

### From Section 02 (Mock Data & Services)

**File: `src/services/interfaces/wrongNote.ts`** must define:

```typescript
export interface IWrongNoteService {
  getWrongNotes(studentId: string): Promise<WrongNote[]>;
  getWrongNotesByTopic(studentId: string, topic: string): Promise<WrongNote[]>;
  getWrongNotesByDateRange(studentId: string, startDate: string, endDate: string): Promise<WrongNote[]>;
  addWrongNote(wrongNote: Omit<WrongNote, 'id' | 'reviewCount' | 'consecutiveCorrect' | 'isLearned' | 'lastReviewDate' | 'reviewHistory' | 'updatedAt'>): Promise<WrongNote>;
  updateReviewResult(wrongNoteId: string, isCorrect: boolean, studentAnswer: string): Promise<WrongNote>;
  getWrongNoteStats(studentId: string): Promise<WrongNoteStats>;
  deleteWrongNote(wrongNoteId: string): Promise<void>;
}
```

**File: `src/services/mock/mockWrongNote.ts`** must implement `IWrongNoteService` with AsyncStorage persistence.

**File: `src/services/mock/mockData.ts`** must include initial wrong note entries for mock students.

### From Section 03 (Zustand Stores)

**File: `src/stores/wrongNoteStore.ts`** must exist as a Zustand store with at least:

```typescript
interface WrongNoteState {
  wrongNotes: WrongNote[];
  stats: WrongNoteStats | null;
  isLoading: boolean;
  error: string | null;

  fetchWrongNotes: (studentId: string) => Promise<void>;
  addWrongNote: (data: Omit<WrongNote, 'id' | 'reviewCount' | 'consecutiveCorrect' | 'isLearned' | 'lastReviewDate' | 'reviewHistory' | 'updatedAt'>) => Promise<void>;
  submitReview: (wrongNoteId: string, isCorrect: boolean, studentAnswer: string) => Promise<void>;
  fetchStats: (studentId: string) => Promise<void>;
}
```

**File: `src/stores/submissionStore.ts`** must exist. The auto-collection hook (described in Section 3 below) subscribes to submission events to trigger wrong note creation.

### From the existing codebase

These files already exist and will be used:

| File | Purpose |
|------|---------|
| `src/constants/theme.ts` | `colors`, `spacing`, `borderRadius`, `tabletSizes` |
| `src/constants/curriculum.ts` | `getSubjectsByGrade()`, `getAllGrades()` |
| `src/components/common/Card.tsx` | `Card` component wrapper |
| `src/components/common/MathText.tsx` | `MathText` LaTeX renderer |
| `src/types/index.ts` | `Grade`, `User`, `Problem`, `Submission` |
| `src/stores/authStore.ts` | `useAuthStore` for current user |
| `src/services/geminiService.ts` | Gemini AI client setup pattern |

### Gemini AI dependency

The AI explanation feature calls `geminiHelper.generateStepByStep()`. This helper is formally created in Section 08 (AI Helper). However, this section includes a **minimal inline implementation** of the step-by-step generation so that the wrong notes feature works independently. When Section 08 is implemented, the inline version should be replaced with the import from `src/services/geminiHelper.ts`.

---

## 3. Architecture: Auto-Collection from Submissions

When a student submits a wrong answer, the system must automatically add the problem to the student's wrong notes. This is implemented via a Zustand `subscribe` pattern to avoid circular dependencies between `submissionStore` and `wrongNoteStore`.

### File to modify: `src/stores/wrongNoteStore.ts`

Add the following subscription setup at the bottom of the file (after the store is created):

```typescript
// ============================================================
// AUTO-COLLECTION: Subscribe to submissionStore for wrong answers
// ============================================================
// This must be placed AFTER both stores are created.
// Import at the bottom of wrongNoteStore.ts or in a shared setup file.

import { useSubmissionStore } from './submissionStore';

// Subscribe to submission changes
// When a new submission with isCorrect === false appears, auto-add to wrong notes
let previousSubmissions: string[] = [];

useSubmissionStore.subscribe((state) => {
  const currentIds = state.submissions.map((s: any) => s.id);
  const newIds = currentIds.filter((id: string) => !previousSubmissions.includes(id));

  if (newIds.length > 0) {
    const newSubmissions = state.submissions.filter(
      (s: any) => newIds.includes(s.id) && s.isCorrect === false
    );

    for (const sub of newSubmissions) {
      // Only add if problem data is available
      if (sub.problem && sub.studentAnswer !== undefined) {
        useWrongNoteStore.getState().addWrongNote({
          studentId: sub.studentId,
          problemId: sub.problemId,
          assignmentId: sub.assignmentId,
          problem: {
            id: sub.problem.id,
            content: sub.problem.content,
            contentHtml: sub.problem.contentHtml,
            imageUrls: sub.problem.imageUrls,
            answer: sub.problem.answer || sub.correctAnswer || '',
            solution: sub.problem.solution,
            difficulty: sub.problem.difficulty || '중',
            type: sub.problem.type || '단답형',
            choices: sub.problem.choices,
            topic: sub.problem.topic || '기타',
            subject: sub.problem.subject,
            points: sub.problem.points || 10,
          },
          studentAnswer: sub.studentAnswer || sub.textAnswer || '',
          correctAnswer: sub.correctAnswer || sub.problem.answer || '',
          topic: sub.problem.topic || '기타',
          subject: sub.problem.subject,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  previousSubmissions = currentIds;
});
```

**Important**: If the `submissionStore` schema from Section 03 uses different field names (e.g., `score` instead of `isCorrect`, or a separate `gradedSubmissions` array), adapt the subscription logic accordingly. The key requirement is: **if a submission is graded as wrong, create a wrong note entry automatically**.

---

## 4. Review Tracking Logic

### Mastery Criterion

A wrong note transitions to `isLearned: true` when ALL of the following conditions are met:

1. `consecutiveCorrect >= 3` -- three correct answers in a row
2. Each correct answer in the streak has at least **24 hours** gap from the previous one
3. No incorrect answers interrupt the streak (resets `consecutiveCorrect` to 0)

### State Transitions

```
[New wrong note]
  reviewCount: 0
  consecutiveCorrect: 0
  isLearned: false
  → ReviewStatus: 'not_reviewed'

[After first review attempt]
  reviewCount: 1
  consecutiveCorrect: 0 or 1
  isLearned: false
  → ReviewStatus: 'reviewing'

[After 3 consecutive correct with 24h gaps]
  reviewCount: N
  consecutiveCorrect: 3
  isLearned: true
  → ReviewStatus: 'learned'
```

### Review Status Derivation

Review status is **derived** from the data, not stored separately. Use this helper function everywhere status is needed:

```typescript
function getReviewStatus(note: WrongNote): ReviewStatus {
  if (note.isLearned) return 'learned';
  if (note.reviewCount === 0) return 'not_reviewed';
  return 'reviewing';
}
```

### Update Logic (in mock service `updateReviewResult`)

```typescript
async updateReviewResult(
  wrongNoteId: string,
  isCorrect: boolean,
  studentAnswer: string
): Promise<WrongNote> {
  const notes = await this.getAllNotes();
  const noteIndex = notes.findIndex(n => n.id === wrongNoteId);
  if (noteIndex === -1) throw new Error('Wrong note not found');

  const note = { ...notes[noteIndex] };
  const now = new Date().toISOString();

  // Add review attempt to history
  note.reviewHistory = [
    ...note.reviewHistory,
    { attemptDate: now, studentAnswer, isCorrect },
  ];
  note.reviewCount += 1;
  note.lastReviewDate = now;
  note.updatedAt = now;

  if (isCorrect) {
    note.consecutiveCorrect += 1;

    // Check mastery: 3 consecutive correct with 24h gaps
    if (note.consecutiveCorrect >= 3 && !note.isLearned) {
      const recentCorrect = note.reviewHistory
        .filter(a => a.isCorrect)
        .slice(-3);

      if (recentCorrect.length >= 3) {
        const gap1 = new Date(recentCorrect[1].attemptDate).getTime()
                    - new Date(recentCorrect[0].attemptDate).getTime();
        const gap2 = new Date(recentCorrect[2].attemptDate).getTime()
                    - new Date(recentCorrect[1].attemptDate).getTime();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        if (gap1 >= TWENTY_FOUR_HOURS && gap2 >= TWENTY_FOUR_HOURS) {
          note.isLearned = true;
        }
      }
    }
  } else {
    // Wrong answer resets consecutive streak
    note.consecutiveCorrect = 0;
  }

  notes[noteIndex] = note;
  await this.saveAllNotes(notes);
  return note;
}
```

**Note**: This logic should already be implemented in the mock service from Section 02. If it is not, implement it as part of this section. The code above is the canonical reference.

---

## 5. File: `src/components/wrongNote/WrongNoteCard.tsx`

This component displays a single wrong note as a card in the list. It shows the problem content (with LaTeX), the student's wrong answer, the correct answer, the topic tag, and a color-coded review status badge.

### Full Implementation

```tsx
// src/components/wrongNote/WrongNoteCard.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../common';
import MathText from '../common/MathText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import type { WrongNote, ReviewStatus } from '../../types/wrongNote';

// ---- Helper: derive review status from data ----
function getReviewStatus(note: WrongNote): ReviewStatus {
  if (note.isLearned) return 'learned';
  if (note.reviewCount === 0) return 'not_reviewed';
  return 'reviewing';
}

// ---- Status display config ----
const STATUS_CONFIG: Record<ReviewStatus, {
  label: string;
  color: string;
  icon: string;
}> = {
  not_reviewed: {
    label: '미복습',
    color: colors.error,
    icon: 'alert-circle-outline',
  },
  reviewing: {
    label: '복습중',
    color: colors.warning,
    icon: 'refresh',
  },
  learned: {
    label: '숙련',
    color: colors.success,
    icon: 'check-circle',
  },
};

// ---- Difficulty display config ----
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  '상': { label: '상', color: colors.error },
  '중': { label: '중', color: colors.warning },
  '하': { label: '하', color: colors.success },
};

interface WrongNoteCardProps {
  wrongNote: WrongNote;
  onPress?: (wrongNote: WrongNote) => void;
}

export default function WrongNoteCard({ wrongNote, onPress }: WrongNoteCardProps) {
  const status = getReviewStatus(wrongNote);
  const statusConfig = STATUS_CONFIG[status];
  const difficultyConfig = DIFFICULTY_CONFIG[wrongNote.problem.difficulty] || DIFFICULTY_CONFIG['중'];

  // Truncate problem content for card display (first 80 chars of raw text)
  const truncatedContent = wrongNote.problem.content.length > 80
    ? wrongNote.problem.content.substring(0, 80) + '...'
    : wrongNote.problem.content;

  // Format date for display
  const createdDate = new Date(wrongNote.createdAt);
  const dateString = `${createdDate.getMonth() + 1}/${createdDate.getDate()}`;

  return (
    <Card
      style={styles.card}
      onPress={onPress ? () => onPress(wrongNote) : undefined}
    >
      {/* Top row: status badge + date + difficulty */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '18' }]}>
            <MaterialCommunityIcons
              name={statusConfig.icon as any}
              size={14}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          {wrongNote.reviewCount > 0 && (
            <Text style={styles.reviewCountText}>
              복습 {wrongNote.reviewCount}회
            </Text>
          )}
        </View>

        <View style={styles.topRight}>
          <Chip
            compact
            style={[styles.difficultyChip, { backgroundColor: difficultyConfig.color + '15' }]}
            textStyle={{ color: difficultyConfig.color, fontSize: 11 }}
          >
            {difficultyConfig.label}
          </Chip>
          <Text style={styles.dateText}>{dateString}</Text>
        </View>
      </View>

      {/* Problem content preview */}
      <View style={styles.problemPreview}>
        <MathText
          content={truncatedContent}
          fontSize={15}
          color={colors.textPrimary}
        />
      </View>

      {/* Answer comparison row */}
      <View style={styles.answerRow}>
        <View style={styles.answerBlock}>
          <View style={styles.answerLabel}>
            <MaterialCommunityIcons name="close-circle" size={14} color={colors.error} />
            <Text style={styles.answerLabelText}>내 답</Text>
          </View>
          <Text style={[styles.answerValue, { color: colors.error }]} numberOfLines={1}>
            {wrongNote.studentAnswer || '-'}
          </Text>
        </View>

        <View style={styles.answerDivider} />

        <View style={styles.answerBlock}>
          <View style={styles.answerLabel}>
            <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
            <Text style={styles.answerLabelText}>정답</Text>
          </View>
          <Text style={[styles.answerValue, { color: colors.success }]} numberOfLines={1}>
            {wrongNote.correctAnswer || '-'}
          </Text>
        </View>
      </View>

      {/* Bottom row: topic tag + consecutive correct indicator */}
      <View style={styles.bottomRow}>
        <View style={styles.topicTag}>
          <MaterialCommunityIcons name="tag" size={14} color={colors.primary} />
          <Text style={styles.topicText}>{wrongNote.topic}</Text>
        </View>

        {status === 'reviewing' && (
          <View style={styles.streakIndicator}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.streakDot,
                  {
                    backgroundColor:
                      i < wrongNote.consecutiveCorrect
                        ? colors.success
                        : colors.surfaceVariant,
                  },
                ]}
              />
            ))}
            <Text style={styles.streakText}>
              {wrongNote.consecutiveCorrect}/3
            </Text>
          </View>
        )}

        {status === 'learned' && (
          <View style={styles.learnedBadge}>
            <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
            <Text style={styles.learnedText}>숙련 완료</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewCountText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  difficultyChip: {
    height: 24,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Problem preview
  problemPreview: {
    marginBottom: spacing.sm,
    minHeight: 40,
  },

  // Answer row
  answerRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  answerBlock: {
    flex: 1,
    alignItems: 'center',
  },
  answerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  answerLabelText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  answerValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  answerDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicText: {
    fontSize: 13,
    color: colors.primary,
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  streakText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  learnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  learnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
});
```

---

## 6. File: `src/components/wrongNote/ReviewMode.tsx`

This component implements the full review flow:
1. **Show problem** -- student sees the problem but not the answer
2. **Solve** -- student enters/writes their answer
3. **Check answer** -- compare with correct answer, show result
4. **AI explanation** -- optionally view a Gemini-generated step-by-step explanation

### Inline Gemini Helper (Minimal)

To keep this section self-contained, we include a minimal `generateStepByStep` function inline. When Section 08 (AI Helper) is implemented, replace this with `import { generateStepByStep } from '../../services/geminiHelper'`.

### Full Implementation

```tsx
// src/components/wrongNote/ReviewMode.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MathText from '../common/MathText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import type { WrongNote } from '../../types/wrongNote';

// ================================================================
// Minimal inline Gemini step-by-step generator
// Replace with: import { generateStepByStep } from '../../services/geminiHelper';
// when Section 08 is implemented.
// ================================================================
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface SolutionStep {
  step: number;
  title: string;
  content: string;
  formula?: string;
}

async function generateStepByStep(problemContent: string): Promise<SolutionStep[]> {
  try {
    const prompt = `수학 문제의 상세한 단계별 풀이를 작성해주세요.

[문제]
${problemContent}

각 단계를 명확히 구분하고, 모든 수식은 LaTeX로 표기.
JSON 배열로 출력 (다른 텍스트 없이 유효한 JSON만):
[{"step": 1, "title": "...", "content": "...", "formula": "..."}]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [{ step: 1, title: '풀이', content: '풀이를 생성할 수 없습니다.', formula: '' }];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed as SolutionStep[];
  } catch (error) {
    console.error('AI 풀이 생성 오류:', error);
    return [{ step: 1, title: '오류', content: 'AI 풀이 생성 중 오류가 발생했습니다. 다시 시도해주세요.' }];
  }
}
// ================================================================

// Review flow phases
type ReviewPhase = 'problem' | 'answer_input' | 'result' | 'explanation';

interface ReviewModeProps {
  wrongNotes: WrongNote[];
  onSubmitReview: (wrongNoteId: string, isCorrect: boolean, studentAnswer: string) => Promise<void>;
  onClose: () => void;
}

export default function ReviewMode({ wrongNotes, onSubmitReview, onClose }: ReviewModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<ReviewPhase>('problem');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [explanation, setExplanation] = useState<SolutionStep[]>([]);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const currentNote = wrongNotes[currentIndex];
  const isLastProblem = currentIndex === wrongNotes.length - 1;

  // ---- Phase: Show Problem → Move to answer input ----
  const handleStartSolving = useCallback(() => {
    setPhase('answer_input');
  }, []);

  // ---- Phase: Submit Answer → Check correctness ----
  const handleCheckAnswer = useCallback(async () => {
    if (!studentAnswer.trim()) return;

    setIsSubmitting(true);

    // Normalize answers for comparison
    const normalizedStudent = studentAnswer.trim().replace(/\s+/g, '');
    const normalizedCorrect = currentNote.correctAnswer.trim().replace(/\s+/g, '');

    // Simple string comparison (case-insensitive, whitespace-insensitive)
    // For multiple choice: compare directly (e.g. "③" === "③")
    // For short answer: compare normalized strings
    const correct =
      normalizedStudent.toLowerCase() === normalizedCorrect.toLowerCase() ||
      normalizedStudent === normalizedCorrect;

    setIsCorrect(correct);

    try {
      await onSubmitReview(currentNote.id, correct, studentAnswer.trim());
    } catch (err) {
      console.error('Review submit error:', err);
    }

    setIsSubmitting(false);
    setPhase('result');
  }, [studentAnswer, currentNote, onSubmitReview]);

  // ---- Phase: Show AI Explanation ----
  const handleShowExplanation = useCallback(async () => {
    setPhase('explanation');
    setIsLoadingExplanation(true);
    setExpandedSteps(new Set());

    try {
      const steps = await generateStepByStep(currentNote.problem.content);
      setExplanation(steps);
    } catch (err) {
      setExplanation([{
        step: 1,
        title: '오류',
        content: 'AI 해설을 불러오지 못했습니다. 다시 시도해주세요.',
      }]);
    }

    setIsLoadingExplanation(false);
  }, [currentNote]);

  // ---- Move to next problem ----
  const handleNext = useCallback(() => {
    if (isLastProblem) {
      onClose();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setPhase('problem');
    setStudentAnswer('');
    setIsCorrect(false);
    setExplanation([]);
    setExpandedSteps(new Set());
  }, [isLastProblem, onClose]);

  // ---- Toggle explanation step accordion ----
  const toggleStep = useCallback((stepNum: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNum)) {
        next.delete(stepNum);
      } else {
        next.add(stepNum);
      }
      return next;
    });
  }, []);

  if (!currentNote) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="check-all" size={64} color={colors.success} />
        <Text style={styles.emptyText}>복습할 문제가 없습니다!</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>복습 모드</Text>
          <Text style={styles.headerSubtitle}>
            {currentIndex + 1} / {wrongNotes.length}
          </Text>
        </View>

        {/* Progress dots */}
        <View style={styles.progressDots}>
          {wrongNotes.slice(0, Math.min(wrongNotes.length, 10)).map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressDot,
                idx === currentIndex && styles.progressDotActive,
                idx < currentIndex && styles.progressDotCompleted,
              ]}
            />
          ))}
          {wrongNotes.length > 10 && (
            <Text style={styles.moreDotsText}>+{wrongNotes.length - 10}</Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Problem Display (always visible) */}
        <View style={styles.problemCard}>
          <View style={styles.problemCardHeader}>
            <View style={styles.problemBadge}>
              <Text style={styles.problemBadgeText}>
                문제 {currentIndex + 1}
              </Text>
            </View>
            <View style={styles.topicBadge}>
              <MaterialCommunityIcons name="tag" size={14} color={colors.primary} />
              <Text style={styles.topicBadgeText}>{currentNote.topic}</Text>
            </View>
          </View>

          <View style={styles.problemContent}>
            <MathText
              content={currentNote.problem.content}
              fontSize={17}
              color={colors.textPrimary}
            />
          </View>

          {/* Show choices for multiple choice problems */}
          {currentNote.problem.type === '객관식' && currentNote.problem.choices && (
            <View style={styles.choicesList}>
              {currentNote.problem.choices.map((choice, idx) => (
                <View key={idx} style={styles.choiceItem}>
                  <MathText
                    content={choice}
                    fontSize={15}
                    color={colors.textPrimary}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Phase: Problem - "Start Solving" button */}
        {phase === 'problem' && (
          <View style={styles.actionSection}>
            <View style={styles.previousAnswerHint}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.previousAnswerText}>
                이전에 "{currentNote.studentAnswer}"(으)로 답했습니다
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleStartSolving}>
              <MaterialCommunityIcons name="pencil" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>다시 풀어보기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase: Answer Input */}
        {phase === 'answer_input' && (
          <View style={styles.actionSection}>
            <Text style={styles.inputLabel}>답을 입력하세요</Text>

            <TextInput
              style={styles.answerInput}
              value={studentAnswer}
              onChangeText={setStudentAnswer}
              placeholder={
                currentNote.problem.type === '객관식'
                  ? '보기 번호를 입력하세요 (예: ③)'
                  : '답을 입력하세요'
              }
              placeholderTextColor={colors.textDisabled}
              multiline={currentNote.problem.type === '서술형'}
              numberOfLines={currentNote.problem.type === '서술형' ? 4 : 1}
              autoFocus
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !studentAnswer.trim() && styles.primaryButtonDisabled,
              ]}
              onPress={handleCheckAnswer}
              disabled={!studentAnswer.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>정답 확인</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Phase: Result */}
        {phase === 'result' && (
          <View style={styles.actionSection}>
            {/* Correct/Incorrect banner */}
            <View
              style={[
                styles.resultBanner,
                isCorrect ? styles.resultBannerCorrect : styles.resultBannerWrong,
              ]}
            >
              <MaterialCommunityIcons
                name={isCorrect ? 'check-circle' : 'close-circle'}
                size={32}
                color={isCorrect ? colors.success : colors.error}
              />
              <View style={styles.resultBannerText}>
                <Text
                  style={[
                    styles.resultTitle,
                    { color: isCorrect ? colors.success : colors.error },
                  ]}
                >
                  {isCorrect ? '정답입니다!' : '틀렸습니다'}
                </Text>
                <Text style={styles.resultSubtitle}>
                  {isCorrect
                    ? `연속 정답: ${currentNote.consecutiveCorrect + 1}회`
                    : '다음에 다시 도전해보세요'}
                </Text>
              </View>
            </View>

            {/* Answer comparison */}
            <View style={styles.answerComparison}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>내 답:</Text>
                <Text
                  style={[
                    styles.comparisonValue,
                    { color: isCorrect ? colors.success : colors.error },
                  ]}
                >
                  {studentAnswer}
                </Text>
              </View>
              {!isCorrect && (
                <View style={styles.comparisonRow}>
                  <Text style={styles.comparisonLabel}>정답:</Text>
                  <Text style={[styles.comparisonValue, { color: colors.success }]}>
                    {currentNote.correctAnswer}
                  </Text>
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleShowExplanation}
              >
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>AI 해설 보기</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>
                  {isLastProblem ? '복습 완료' : '다음 문제'}
                </Text>
                <MaterialCommunityIcons
                  name={isLastProblem ? 'check-all' : 'arrow-right'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Phase: AI Explanation */}
        {phase === 'explanation' && (
          <View style={styles.actionSection}>
            <View style={styles.explanationHeader}>
              <MaterialCommunityIcons name="robot" size={20} color={colors.primary} />
              <Text style={styles.explanationTitle}>AI 단계별 풀이</Text>
            </View>

            {isLoadingExplanation ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>AI가 풀이를 생성 중입니다...</Text>
              </View>
            ) : (
              <View style={styles.stepsContainer}>
                {explanation.map((step) => (
                  <TouchableOpacity
                    key={step.step}
                    style={styles.stepCard}
                    onPress={() => toggleStep(step.step)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.stepHeader}>
                      <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumberText}>{step.step}</Text>
                      </View>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <MaterialCommunityIcons
                        name={expandedSteps.has(step.step) ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>

                    {expandedSteps.has(step.step) && (
                      <View style={styles.stepContent}>
                        <MathText
                          content={step.content}
                          fontSize={15}
                          color={colors.textPrimary}
                        />
                        {step.formula && (
                          <View style={styles.formulaBlock}>
                            <MathText
                              content={`$$${step.formula}$$`}
                              fontSize={16}
                              color={colors.textPrimary}
                            />
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Bottom action: Next problem */}
            {!isLoadingExplanation && (
              <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>
                  {isLastProblem ? '복습 완료' : '다음 문제'}
                </Text>
                <MaterialCommunityIcons
                  name={isLastProblem ? 'check-all' : 'arrow-right'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

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
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceVariant,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotCompleted: {
    backgroundColor: colors.success,
  },
  moreDotsText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 2,
  },

  // Scroll
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Problem card
  problemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  problemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  problemBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  problemBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicBadgeText: {
    fontSize: 13,
    color: colors.primary,
  },
  problemContent: {
    minHeight: 60,
  },
  choicesList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  choiceItem: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },

  // Action section
  actionSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },

  // Previous answer hint
  previousAnswerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  previousAnswerText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '12',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },

  // Answer input
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    minHeight: 48,
  },

  // Result
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  resultBannerCorrect: {
    backgroundColor: colors.success + '12',
  },
  resultBannerWrong: {
    backgroundColor: colors.error + '12',
  },
  resultBannerText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  resultSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  answerComparison: {
    gap: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 50,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  resultActions: {
    gap: spacing.sm,
  },

  // Explanation
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stepsContainer: {
    gap: spacing.sm,
  },
  stepCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  stepContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: 0,
  },
  formulaBlock: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
});
```

---

## 7. File: `src/components/wrongNote/index.ts`

Barrel export for the wrongNote components directory.

```typescript
// src/components/wrongNote/index.ts

export { default as WrongNoteCard } from './WrongNoteCard';
export { default as ReviewMode } from './ReviewMode';
```

---

## 8. File: `app/(student)/wrong-notes.tsx`

This is the main Wrong Notes screen accessible from the student tab bar. It provides:

- **Stats header**: total wrong notes, review completion rate, learned count
- **Tab switching**: "날짜별" (by date) / "단원별" (by topic)
- **Filter chips**: all, not_reviewed, reviewing, learned
- **Wrong note list**: FlatList of `WrongNoteCard` components
- **"복습 시작" (Start Review) button**: enters ReviewMode with filtered notes

### Full Implementation

```tsx
// app/(student)/wrong-notes.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WrongNoteCard, ReviewMode } from '../../src/components/wrongNote';
import { colors, spacing, borderRadius, tabletSizes } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { useWrongNoteStore } from '../../src/stores/wrongNoteStore';
import type { WrongNote, ReviewStatus } from '../../src/types/wrongNote';

// ---- Helper: derive review status ----
function getReviewStatus(note: WrongNote): ReviewStatus {
  if (note.isLearned) return 'learned';
  if (note.reviewCount === 0) return 'not_reviewed';
  return 'reviewing';
}

// ---- Tab types ----
type ViewTab = 'date' | 'topic';
type FilterStatus = 'all' | 'not_reviewed' | 'reviewing' | 'learned';

// ---- Filter label map ----
const FILTER_LABELS: Record<FilterStatus, string> = {
  all: '전체',
  not_reviewed: '미복습',
  reviewing: '복습중',
  learned: '숙련',
};

export default function WrongNotesScreen() {
  const { user } = useAuthStore();
  const {
    wrongNotes,
    stats,
    isLoading,
    fetchWrongNotes,
    fetchStats,
    submitReview,
  } = useWrongNoteStore();

  const [activeTab, setActiveTab] = useState<ViewTab>('date');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // ---- Load data on mount ----
  useEffect(() => {
    if (user?.id) {
      fetchWrongNotes(user.id);
      fetchStats(user.id);
    }
  }, [user?.id, fetchWrongNotes, fetchStats]);

  // ---- Pull to refresh ----
  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await Promise.all([fetchWrongNotes(user.id), fetchStats(user.id)]);
    setRefreshing(false);
  }, [user?.id, fetchWrongNotes, fetchStats]);

  // ---- Filter wrong notes ----
  const filteredNotes = useMemo(() => {
    let notes = [...wrongNotes];

    // Apply status filter
    if (filterStatus !== 'all') {
      notes = notes.filter((n) => getReviewStatus(n) === filterStatus);
    }

    // Apply topic filter (when in topic tab and a topic is selected)
    if (activeTab === 'topic' && selectedTopic) {
      notes = notes.filter((n) => n.topic === selectedTopic);
    }

    // Sort: by date in date tab, by topic in topic tab
    if (activeTab === 'date') {
      notes.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      notes.sort((a, b) => a.topic.localeCompare(b.topic));
    }

    return notes;
  }, [wrongNotes, filterStatus, activeTab, selectedTopic]);

  // ---- Get unique topics for topic tab ----
  const topics = useMemo(() => {
    const topicMap = new Map<string, number>();
    wrongNotes.forEach((n) => {
      topicMap.set(n.topic, (topicMap.get(n.topic) || 0) + 1);
    });
    return Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, count }));
  }, [wrongNotes]);

  // ---- Notes for review mode (only not-learned) ----
  const reviewableNotes = useMemo(() => {
    return filteredNotes.filter((n) => !n.isLearned);
  }, [filteredNotes]);

  // ---- Handle review submission ----
  const handleSubmitReview = useCallback(
    async (wrongNoteId: string, isCorrect: boolean, studentAnswer: string) => {
      await submitReview(wrongNoteId, isCorrect, studentAnswer);
      // Refresh stats after each review
      if (user?.id) {
        fetchStats(user.id);
      }
    },
    [submitReview, user?.id, fetchStats]
  );

  // ---- Handle review mode close ----
  const handleCloseReview = useCallback(() => {
    setIsReviewMode(false);
    // Refresh data after review session
    if (user?.id) {
      fetchWrongNotes(user.id);
      fetchStats(user.id);
    }
  }, [user?.id, fetchWrongNotes, fetchStats]);

  // ---- Handle card press: show detail (could open a modal, for now just log) ----
  const handleCardPress = useCallback((_note: WrongNote) => {
    // In a future enhancement, open a detail modal.
    // For now, the card tap does nothing beyond visual feedback.
  }, []);

  // ==== REVIEW MODE (full-screen overlay) ====
  if (isReviewMode) {
    return (
      <SafeAreaView style={styles.container}>
        <ReviewMode
          wrongNotes={reviewableNotes}
          onSubmitReview={handleSubmitReview}
          onClose={handleCloseReview}
        />
      </SafeAreaView>
    );
  }

  // ==== MAIN SCREEN ====
  return (
    <SafeAreaView style={styles.container}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>오답노트</Text>
        <Text style={styles.screenSubtitle}>
          틀린 문제를 복습하고 실력을 키워보세요
        </Text>
      </View>

      {/* Stats Header */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalCount ?? 0}</Text>
          <Text style={styles.statLabel}>총 오답</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {stats?.notReviewedCount ?? 0}
          </Text>
          <Text style={styles.statLabel}>미복습</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {stats?.reviewingCount ?? 0}
          </Text>
          <Text style={styles.statLabel}>복습중</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {stats?.learnedCount ?? 0}
          </Text>
          <Text style={styles.statLabel}>숙련</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {stats ? Math.round(stats.reviewCompletionRate * 100) : 0}%
          </Text>
          <Text style={styles.statLabel}>완료율</Text>
        </View>
      </View>

      {/* Tab Bar: Date / Topic */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'date' && styles.tabActive]}
          onPress={() => {
            setActiveTab('date');
            setSelectedTopic(null);
          }}
        >
          <MaterialCommunityIcons
            name="calendar"
            size={18}
            color={activeTab === 'date' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[styles.tabText, activeTab === 'date' && styles.tabTextActive]}
          >
            날짜별
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'topic' && styles.tabActive]}
          onPress={() => setActiveTab('topic')}
        >
          <MaterialCommunityIcons
            name="tag-multiple"
            size={18}
            color={activeTab === 'topic' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[styles.tabText, activeTab === 'topic' && styles.tabTextActive]}
          >
            단원별
          </Text>
        </TouchableOpacity>
      </View>

      {/* Topic Chips (only in topic tab) */}
      {activeTab === 'topic' && (
        <View style={styles.topicChipsContainer}>
          <FlatList
            horizontal
            data={topics}
            keyExtractor={(item) => item.topic}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicChipsList}
            renderItem={({ item }) => (
              <Chip
                selected={selectedTopic === item.topic}
                onPress={() =>
                  setSelectedTopic(
                    selectedTopic === item.topic ? null : item.topic
                  )
                }
                style={styles.topicChip}
                showSelectedCheck={false}
              >
                {item.topic} ({item.count})
              </Chip>
            )}
          />
        </View>
      )}

      {/* Filter Chips: Status */}
      <View style={styles.filterContainer}>
        {(Object.keys(FILTER_LABELS) as FilterStatus[]).map((status) => (
          <Chip
            key={status}
            selected={filterStatus === status}
            onPress={() => setFilterStatus(status)}
            style={styles.filterChip}
            showSelectedCheck={false}
          >
            {FILTER_LABELS[status]}
          </Chip>
        ))}
      </View>

      {/* Wrong Notes List */}
      {isLoading && wrongNotes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>오답노트를 불러오는 중...</Text>
        </View>
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
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WrongNoteCard
              wrongNote={item}
              onPress={handleCardPress}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Start Review FAB */}
      {reviewableNotes.length > 0 && (
        <TouchableOpacity
          style={styles.startReviewFab}
          onPress={() => setIsReviewMode(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="play-circle" size={24} color="#FFFFFF" />
          <Text style={styles.startReviewText}>
            복습 시작 ({reviewableNotes.length})
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Screen header
  screenHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Topic chips
  topicChipsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topicChipsList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  topicChip: {
    marginRight: spacing.xs,
  },

  // Filter
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: spacing.xs,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // List
  listContent: {
    padding: spacing.md,
    paddingBottom: 100, // space for FAB
  },

  // Start Review FAB
  startReviewFab: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  startReviewText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
```

---

## 9. Modification: Student Tab Layout

The student tab bar must include the "오답노트" tab. Add it to the existing `_layout.tsx`.

### File to modify: `app/(student)/_layout.tsx`

Add the following `<Tabs.Screen>` entry. Insert it **after** the "homework" tab and **before** the "materials" tab:

```tsx
<Tabs.Screen
  name="wrong-notes"
  options={{
    title: '오답노트',
    tabBarLabel: '오답노트',
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="notebook-edit-outline" size={size} color={color} />
    ),
  }}
/>
```

Also add the `solve` screen as a hidden tab (it is navigated to programmatically, not shown in the tab bar):

```tsx
<Tabs.Screen
  name="solve"
  options={{
    href: null, // hides from tab bar
  }}
/>
```

The full modified `_layout.tsx` should have tabs in this order: Home, Homework, Wrong Notes, Materials, Profile.

---

## 10. Files Summary

### New files to create (7)

| # | Path | Description |
|---|------|-------------|
| 1 | `src/components/wrongNote/WrongNoteCard.tsx` | Wrong note card component (Section 5) |
| 2 | `src/components/wrongNote/ReviewMode.tsx` | Full review flow component (Section 6) |
| 3 | `src/components/wrongNote/index.ts` | Barrel export (Section 7) |
| 4 | `app/(student)/wrong-notes.tsx` | Main wrong notes screen (Section 8) |

### Files to modify (1)

| # | Path | Change |
|---|------|--------|
| 1 | `app/(student)/_layout.tsx` | Add "오답노트" tab (Section 9) |

### Files from previous sections that may need adjustment (if not already implemented)

| # | Path | Change |
|---|------|--------|
| 1 | `src/stores/wrongNoteStore.ts` | Add auto-collection subscription (Section 3) |
| 2 | `src/services/mock/mockWrongNote.ts` | Ensure `updateReviewResult` has mastery logic (Section 4) |

---

## 11. Acceptance Criteria

When this section is fully implemented, the following must all be true:

### Core Functionality
- [ ] `WrongNoteCard` renders problem content (with LaTeX via `MathText`), student answer, correct answer, topic tag, and review status badge
- [ ] Review status badge shows correct state: red "미복습" / orange "복습중" / green "숙련"
- [ ] `WrongNoteCard` shows a streak indicator (0/3, 1/3, 2/3) for "reviewing" status notes
- [ ] `ReviewMode` displays problems one at a time with a progress indicator
- [ ] `ReviewMode` flow: show problem with "다시 풀어보기" button -> answer input -> check answer -> result with "AI 해설 보기" and "다음 문제" buttons
- [ ] `ReviewMode` correctly compares student answer to correct answer (normalized string comparison)
- [ ] `ReviewMode` calls `onSubmitReview` callback on each answer check
- [ ] `ReviewMode` shows AI-generated step-by-step explanation in an accordion (one step at a time)
- [ ] AI explanation is fetched from Gemini API via `generateStepByStep` with loading state and error handling

### Screen: `wrong-notes.tsx`
- [ ] Screen has a header with title "오답노트" and subtitle
- [ ] Stats header shows: total wrong notes, not reviewed count, reviewing count, learned count, completion rate %
- [ ] Two tabs work: "날짜별" (sorts by date descending) and "단원별" (shows topic chips, sorts by topic)
- [ ] Topic tab shows horizontal scrollable topic chips with counts; tapping a chip filters by that topic
- [ ] Status filter chips (전체, 미복습, 복습중, 숙련) correctly filter the list
- [ ] FlatList renders `WrongNoteCard` for each filtered wrong note
- [ ] Pull-to-refresh refreshes data
- [ ] Empty state shows when no wrong notes exist or no notes match the current filter
- [ ] "복습 시작" FAB button appears when there are reviewable (not learned) notes
- [ ] "복습 시작" button shows count of reviewable notes
- [ ] Pressing "복습 시작" enters full-screen ReviewMode with filtered non-learned notes
- [ ] Closing ReviewMode returns to the list and refreshes data

### Auto-Collection
- [ ] When `submissionStore` records a wrong answer, `wrongNoteStore` automatically receives a new wrong note entry (via subscribe pattern)
- [ ] The auto-collected wrong note contains: problemId, assignmentId, problem details, studentAnswer, correctAnswer, topic

### Review Tracking & Mastery
- [ ] Each review attempt increments `reviewCount` and records in `reviewHistory`
- [ ] Correct answer increments `consecutiveCorrect`; wrong answer resets it to 0
- [ ] A wrong note becomes `isLearned: true` only when `consecutiveCorrect >= 3` AND each of the last 3 correct answers is separated by at least 24 hours
- [ ] Learned notes are excluded from the "복습 시작" set

### Tab Integration
- [ ] "오답노트" tab appears in the student bottom tab bar with `notebook-edit-outline` icon
- [ ] Tab is positioned after "숙제" and before "강의자료"

### Error Handling & UX
- [ ] Loading spinner shows while data is being fetched
- [ ] AI explanation shows loading text "AI가 풀이를 생성 중입니다..." while fetching
- [ ] If AI explanation fails, a fallback error message is displayed (not a crash)
- [ ] The screen works correctly in both portrait and landscape orientations on tablet

---

## 12. Testing Checklist

To manually verify the implementation works end-to-end:

1. **Log in** as `student@test.com` / `123456`
2. **Navigate** to the "오답노트" tab -- should show any pre-seeded wrong notes from mock data
3. **Check stats header** -- numbers should match the actual wrong notes data
4. **Switch tabs** between "날짜별" and "단원별" -- list order and topic chips should change
5. **Apply filters** -- "미복습", "복습중", "숙련" should correctly filter the list
6. **Press "복습 시작"** -- should enter review mode with non-learned notes
7. **Complete a review** -- enter an answer, check it, verify correct/incorrect display
8. **View AI explanation** -- press "AI 해설 보기", verify loading state and step-by-step accordion
9. **Complete all reviews** -- should return to the main list with updated stats
10. **Verify mastery** -- after 3 correct reviews with 24h gaps (modify mock data timestamps to test), confirm the note becomes "숙련"
