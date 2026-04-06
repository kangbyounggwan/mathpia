// ============================================================
// src/stores/submissionStore.ts
// Student answer submission, grading, wrong-note trigger via subscribe
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import type { Submission } from '../types';
import services from '../services';

// ─── Store Interface ──────────────────────────────────────
interface SubmissionState {
  // State
  submissions: Submission[];
  currentSubmission: Submission | null;
  isLoading: boolean;
  error: string | null;

  // Last added submission (subscribe detection for wrongNote trigger)
  lastAddedSubmission: Submission | null;

  // Actions - Submit
  submitAnswer: (data: Omit<Submission, 'id' | 'submittedAt'>) => Promise<Submission>;

  // Actions - Grade (teacher)
  gradeSubmission: (
    submissionId: string,
    teacherId: string,
    data: {
      score: number;
      feedback?: string;
    }
  ) => Promise<void>;

  // Actions - Query
  fetchByAssignment: (assignmentId: string, studentId: string) => Promise<void>;
  getSubmissionsByProblem: (assignmentId: string, problemId: string) => Promise<void>;

  // Actions - Stats
  getStudentStats: (studentId: string) => {
    totalSubmissions: number;
    totalCorrect: number;
    correctRate: number;
  };

  // Actions - Utility
  setCurrentSubmission: (submission: Submission | null) => void;
  clearLastAdded: () => void;
}

// ─── Store ────────────────────────────────────────────────
export const useSubmissionStore = create<SubmissionState>()(
  persist(
    (set, get) => ({
      submissions: [],
      currentSubmission: null,
      isLoading: false,
      error: null,
      lastAddedSubmission: null,

      // ── Submit ──────────────────────────────────────────
      submitAnswer: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const submission = await services.assignment.submitAnswer(data);
          set({
            submissions: [...get().submissions, submission],
            lastAddedSubmission: submission,
            isLoading: false,
          });
          return submission;
        } catch (e) {
          set({ error: '답안 제출에 실패했습니다.', isLoading: false });
          throw e;
        }
      },

      // ── Grade ───────────────────────────────────────────
      gradeSubmission: async (submissionId, teacherId, data) => {
        set({ isLoading: true, error: null });
        try {
          const grading = await services.assignment.gradeSubmission({
            submissionId,
            teacherId,
            score: data.score,
            feedback: data.feedback,
          });

          // Update the submission with grading results
          const submissions = get().submissions.map((s) =>
            s.id === submissionId
              ? {
                  ...s,
                  score: grading.score,
                  feedback: grading.feedback,
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

      // ── Query ───────────────────────────────────────────
      fetchByAssignment: async (assignmentId, studentId) => {
        set({ isLoading: true, error: null });
        try {
          const submissions = await services.assignment.getSubmissions(assignmentId, studentId);
          set({ submissions, isLoading: false });
        } catch (e) {
          set({ error: '제출 목록을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      getSubmissionsByProblem: async (assignmentId, problemId) => {
        try {
          const subs = await services.assignment.getSubmissionsByProblem(assignmentId, problemId);
          // Merge into existing submissions avoiding duplicates
          const existing = get().submissions;
          const existingIds = new Set(existing.map((s) => s.id));
          const newSubs = subs.filter((s) => !existingIds.has(s.id));
          if (newSubs.length > 0) {
            set({ submissions: [...existing, ...newSubs] });
          }
        } catch (e) {
          // silently fail for supplementary fetch
        }
      },

      // ── Stats ───────────────────────────────────────────
      getStudentStats: (studentId) => {
        const studentSubs = get().submissions.filter(
          (s) => s.studentId === studentId && s.gradedAt
        );
        const totalSubmissions = studentSubs.length;
        const totalCorrect = studentSubs.filter((s) => s.isCorrect).length;
        const correctRate =
          totalSubmissions > 0
            ? Math.round((totalCorrect / totalSubmissions) * 100)
            : 0;
        return { totalSubmissions, totalCorrect, correctRate };
      },

      // ── Utility ─────────────────────────────────────────
      setCurrentSubmission: (submission) =>
        set({ currentSubmission: submission }),

      clearLastAdded: () => set({ lastAddedSubmission: null }),
    }),
    {
      name: 'mathpia-submissions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        submissions: state.submissions,
      }),
    }
  )
);
