// ============================================================
// src/stores/index.ts
// Re-export all stores + subscribe inter-communication setup
// ============================================================

// ─── Re-exports ───────────────────────────────────────────
export { useAuthStore } from './authStore';
export { useProblemBankStore } from './problemBankStore';
export type { ProblemFilters } from './problemBankStore';
export { useAssignmentStore } from './assignmentStore';
export { useSubmissionStore } from './submissionStore';
export { useAnalyticsStore } from './analyticsStore';
export { useWrongNoteStore } from './wrongNoteStore';
export { useParentStore } from './parentStore';

// ─── Store Inter-communication Setup ─────────────────────
import { useSubmissionStore } from './submissionStore';
import { useWrongNoteStore } from './wrongNoteStore';
import { useProblemBankStore } from './problemBankStore';

/**
 * submissionStore -> wrongNoteStore event linkage
 *
 * When submissionStore.lastAddedSubmission changes,
 * if the submission is incorrect (isCorrect === false) and graded,
 * automatically add it to wrongNoteStore.
 *
 * Call this function once at app startup in app/_layout.tsx:
 *
 *   import { initializeStoreSubscriptions } from '@/stores';
 *   useEffect(() => {
 *     const unsubscribe = initializeStoreSubscriptions();
 *     return unsubscribe;
 *   }, []);
 */
let isInitialized = false;

export function initializeStoreSubscriptions(): () => void {
  if (isInitialized) {
    return () => {}; // Already initialized, return no-op
  }

  const unsubscribe = useSubmissionStore.subscribe(
    (state, prevState) => {
      const { lastAddedSubmission } = state;
      const prevLast = prevState.lastAddedSubmission;

      // New submission was added, is graded, and is incorrect
      if (
        lastAddedSubmission &&
        lastAddedSubmission !== prevLast &&
        lastAddedSubmission.gradedAt &&
        lastAddedSubmission.isCorrect === false
      ) {
        // Get the problem data from problem bank store
        const problemBankState = useProblemBankStore.getState();
        const problem = problemBankState.problems.find(
          (p) => p.id === lastAddedSubmission.problemId
        );

        if (problem) {
          useWrongNoteStore.getState().addWrongNote({
            studentId: lastAddedSubmission.studentId,
            problemId: lastAddedSubmission.problemId,
            assignmentId: lastAddedSubmission.assignmentId,
            studentAnswer: lastAddedSubmission.answerText || '[이미지 답안]',
            correctAnswer: problem.answer || '',
            problem,
            lastReviewDate: undefined,
            aiExplanation: undefined,
          });
        }

        // Clear lastAddedSubmission to prevent duplicate triggers
        useSubmissionStore.getState().clearLastAdded();
      }
    }
  );

  isInitialized = true;

  return () => {
    unsubscribe();
    isInitialized = false;
  };
}
