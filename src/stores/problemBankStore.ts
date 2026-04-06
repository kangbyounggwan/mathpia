// ============================================================
// src/stores/problemBankStore.ts
// Problem bank CRUD, search, client-side filtering
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import type {
  ProblemBankItem,
  ProblemBankItemCreate,
  ProblemBankItemUpdate,
  Grade,
  Difficulty,
  ProblemType,
} from '../types';
import services from '../services';

// ─── Filter State ─────────────────────────────────────────
export interface ProblemFilters {
  grade?: Grade;
  subjectId?: string;
  chapter?: string;
  difficulty?: Difficulty;
  type?: ProblemType;
  searchQuery?: string;
  tags?: string[];
}

// ─── Store Interface ──────────────────────────────────────
interface ProblemBankState {
  // State
  problems: ProblemBankItem[];
  selectedProblem: ProblemBankItem | null;
  filters: ProblemFilters;
  filteredProblems: ProblemBankItem[];
  isLoading: boolean;
  error: string | null;

  // Actions - CRUD
  fetchProblems: () => Promise<void>;
  getProblemById: (id: string) => Promise<ProblemBankItem | null>;
  createProblem: (problem: ProblemBankItemCreate) => Promise<ProblemBankItem>;
  updateProblem: (id: string, updates: ProblemBankItemUpdate) => Promise<void>;
  deleteProblem: (id: string) => Promise<void>;

  // Actions - Selection
  setSelectedProblem: (problem: ProblemBankItem | null) => void;

  // Actions - Filtering
  setFilters: (filters: Partial<ProblemFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;

  // Actions - Bulk
  bulkCreateProblems: (problems: ProblemBankItemCreate[]) => Promise<ProblemBankItem[]>;
}

// ─── Helper: Client-side Filtering ───────────────────────
function filterProblems(
  problems: ProblemBankItem[],
  filters: ProblemFilters
): ProblemBankItem[] {
  let result = [...problems];

  if (filters.grade) {
    result = result.filter((p) => p.grade === filters.grade);
  }
  if (filters.subjectId) {
    result = result.filter((p) => p.subject === filters.subjectId);
  }
  if (filters.chapter) {
    result = result.filter((p) => p.topic === filters.chapter);
  }
  if (filters.difficulty) {
    result = result.filter((p) => p.difficulty === filters.difficulty);
  }
  if (filters.type) {
    result = result.filter((p) => p.type === filters.type);
  }
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    result = result.filter(
      (p) =>
        p.content.toLowerCase().includes(query) ||
        p.tags?.some((t) => t.toLowerCase().includes(query)) ||
        p.topic?.toLowerCase().includes(query)
    );
  }
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((p) =>
      filters.tags!.some((tag) => p.tags?.includes(tag))
    );
  }

  return result;
}

// ─── Store ────────────────────────────────────────────────
export const useProblemBankStore = create<ProblemBankState>()(
  persist(
    (set, get) => ({
      // Initial State
      problems: [],
      selectedProblem: null,
      filters: {},
      filteredProblems: [],
      isLoading: false,
      error: null,

      // ── CRUD ────────────────────────────────────────────
      fetchProblems: async () => {
        set({ isLoading: true, error: null });
        try {
          // IProblemBankService uses list() which returns PaginatedResult
          const result = await services.problemBank.list();
          const problems = result.items;
          const filtered = filterProblems(problems, get().filters);
          set({ problems, filteredProblems: filtered, isLoading: false });
        } catch (e) {
          set({ error: '문제 목록을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      getProblemById: async (id: string) => {
        try {
          const problem = await services.problemBank.getById(id);
          return problem;
        } catch {
          return null;
        }
      },

      createProblem: async (problemData) => {
        set({ isLoading: true, error: null });
        try {
          const newProblem = await services.problemBank.create(problemData);
          const problems = [...get().problems, newProblem];
          const filtered = filterProblems(problems, get().filters);
          set({ problems, filteredProblems: filtered, isLoading: false });
          return newProblem;
        } catch (e) {
          set({ error: '문제 생성에 실패했습니다.', isLoading: false });
          throw e;
        }
      },

      updateProblem: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          await services.problemBank.update(id, updates);
          const problems = get().problems.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          );
          const filtered = filterProblems(problems, get().filters);
          set({ problems, filteredProblems: filtered, isLoading: false });
        } catch (e) {
          set({ error: '문제 수정에 실패했습니다.', isLoading: false });
        }
      },

      deleteProblem: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await services.problemBank.delete(id);
          const problems = get().problems.filter((p) => p.id !== id);
          const filtered = filterProblems(problems, get().filters);
          set({ problems, filteredProblems: filtered, isLoading: false });
        } catch (e) {
          set({ error: '문제 삭제에 실패했습니다.', isLoading: false });
        }
      },

      // ── Selection ───────────────────────────────────────
      setSelectedProblem: (problem) => set({ selectedProblem: problem }),

      // ── Filtering ──────────────────────────────────────
      setFilters: (newFilters) => {
        const filters = { ...get().filters, ...newFilters };
        const filtered = filterProblems(get().problems, filters);
        set({ filters, filteredProblems: filtered });
      },

      clearFilters: () => {
        set({ filters: {}, filteredProblems: get().problems });
      },

      applyFilters: () => {
        const filtered = filterProblems(get().problems, get().filters);
        set({ filteredProblems: filtered });
      },

      // ── Bulk ────────────────────────────────────────────
      bulkCreateProblems: async (problemsData) => {
        set({ isLoading: true, error: null });
        try {
          const newProblems = await services.problemBank.bulkCreate(problemsData);
          const problems = [...get().problems, ...newProblems];
          const filtered = filterProblems(problems, get().filters);
          set({ problems, filteredProblems: filtered, isLoading: false });
          return newProblems;
        } catch (e) {
          set({ error: '문제 일괄 생성에 실패했습니다.', isLoading: false });
          throw e;
        }
      },
    }),
    {
      name: 'mathpia-problem-bank',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        problems: state.problems,
        filters: state.filters,
      }),
    }
  )
);
