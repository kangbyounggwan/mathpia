// ============================================================
// src/stores/wrongNoteStore.ts
// Wrong note auto-collection, review status, mastery check
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import type {
  WrongNote,
  WrongNoteFilter,
  WrongNoteStats,
  WrongNoteStatus,
  ReviewAttempt,
  Submission,
  ProblemBankItem,
} from '../types';
import services from '../services';

// ─── Store Interface ──────────────────────────────────────
interface WrongNoteState {
  // State
  wrongNotes: WrongNote[];
  stats: WrongNoteStats | null;
  selectedNotes: WrongNote[];  // Notes selected for review
  isLoading: boolean;
  error: string | null;

  // Actions - Fetch
  fetchByStudent: (studentId: string, filter?: WrongNoteFilter) => Promise<void>;
  fetchStats: (studentId: string) => Promise<void>;

  // Actions - Add (called by subscribe callback)
  addWrongNote: (data: Omit<WrongNote, 'id' | 'status' | 'reviewCount' | 'consecutiveCorrect' | 'isLearned' | 'createdAt' | 'updatedAt'>) => Promise<void>;

  // Actions - Review
  recordReview: (attempt: ReviewAttempt) => Promise<void>;
  getDueForReview: (studentId: string, limit?: number) => Promise<WrongNote[]>;
  getAiExplanation: (wrongNoteId: string) => Promise<string>;

  // Actions - Selection
  setSelectedNotes: (notes: WrongNote[]) => void;
  clearSelectedNotes: () => void;

  // Actions - Filter helpers (client-side)
  getByStatus: (status: WrongNoteStatus) => WrongNote[];
  getByTopic: (topic: string) => WrongNote[];

  // Actions - Delete
  deleteWrongNote: (id: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────
export const useWrongNoteStore = create<WrongNoteState>()(
  persist(
    (set, get) => ({
      wrongNotes: [],
      stats: null,
      selectedNotes: [],
      isLoading: false,
      error: null,

      // ── Fetch ───────────────────────────────────────────
      fetchByStudent: async (studentId, filter?) => {
        set({ isLoading: true, error: null });
        try {
          const notes = await services.wrongNote.listByStudent(studentId, filter);
          set({ wrongNotes: notes, isLoading: false });
        } catch (e) {
          set({ error: '오답노트를 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      fetchStats: async (studentId) => {
        try {
          const stats = await services.wrongNote.getStats(studentId);
          set({ stats });
        } catch (e) {
          set({ error: '오답노트 통계를 불러오는데 실패했습니다.' });
        }
      },

      // ── Add from Submission (event callback) ───────────
      addWrongNote: async (data) => {
        // Check for duplicate wrong note for same problem + student
        const existing = get().wrongNotes.find(
          (n) =>
            n.problemId === data.problemId &&
            n.studentId === data.studentId
        );

        if (existing) {
          // Already exists, don't add duplicate
          return;
        }

        try {
          const newNote = await services.wrongNote.create(data);
          set({ wrongNotes: [...get().wrongNotes, newNote] });
        } catch (e) {
          console.warn('오답노트 자동 추가 실패:', e);
        }
      },

      // ── Review ──────────────────────────────────────────
      recordReview: async (attempt) => {
        try {
          const updatedNote = await services.wrongNote.recordReview(attempt);
          set({
            wrongNotes: get().wrongNotes.map((n) =>
              n.id === attempt.wrongNoteId ? updatedNote : n
            ),
          });
        } catch (e) {
          set({ error: '복습 기록 저장에 실패했습니다.' });
        }
      },

      getDueForReview: async (studentId, limit?) => {
        try {
          const notes = await services.wrongNote.getDueForReview(studentId, limit);
          return notes;
        } catch {
          return [];
        }
      },

      getAiExplanation: async (wrongNoteId) => {
        try {
          const explanation = await services.wrongNote.getAiExplanation(wrongNoteId);
          // Update the wrong note with the AI explanation
          set({
            wrongNotes: get().wrongNotes.map((n) =>
              n.id === wrongNoteId ? { ...n, aiExplanation: explanation } : n
            ),
          });
          return explanation;
        } catch {
          return '';
        }
      },

      // ── Selection ───────────────────────────────────────
      setSelectedNotes: (notes) => set({ selectedNotes: notes }),
      clearSelectedNotes: () => set({ selectedNotes: [] }),

      // ── Filter helpers (client-side) ────────────────────
      getByStatus: (status) => {
        return get().wrongNotes.filter((n) => n.status === status);
      },

      getByTopic: (topic) => {
        return get().wrongNotes.filter((n) => n.problem.topic === topic);
      },

      // ── Delete ──────────────────────────────────────────
      deleteWrongNote: async (id) => {
        try {
          await services.wrongNote.delete(id);
          set({ wrongNotes: get().wrongNotes.filter((n) => n.id !== id) });
        } catch (e) {
          set({ error: '오답노트 삭제에 실패했습니다.' });
        }
      },
    }),
    {
      name: 'mathpia-wrong-notes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        wrongNotes: state.wrongNotes,
      }),
    }
  )
);
