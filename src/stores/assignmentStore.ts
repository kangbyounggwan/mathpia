// ============================================================
// src/stores/assignmentStore.ts
// Assignment CRUD, problem linking, status management
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import type { Assignment, AssignmentStatus, Grade } from '../types';
import services from '../services';

// ─── Store Interface ──────────────────────────────────────
interface AssignmentState {
  // State
  assignments: Assignment[];
  selectedAssignment: Assignment | null;
  isLoading: boolean;
  error: string | null;

  // Actions - CRUD
  fetchAssignments: (teacherId: string, status?: AssignmentStatus) => Promise<void>;
  fetchStudentAssignments: (studentId: string) => Promise<void>;
  getAssignmentById: (id: string) => Promise<Assignment | null>;
  createAssignment: (data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Assignment>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;

  // Actions - Status
  publishAssignment: (id: string) => Promise<void>;
  closeAssignment: (id: string) => Promise<void>;

  // Actions - Problems
  addProblemsToAssignment: (assignmentId: string, problemIds: string[], pointsPerProblem?: number[]) => Promise<void>;

  // Actions - Selection
  setSelectedAssignment: (assignment: Assignment | null) => void;

  // Actions - Utility
  getAssignmentsByStatus: (status: AssignmentStatus) => Assignment[];
}

// ─── Store ────────────────────────────────────────────────
export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set, get) => ({
      assignments: [],
      selectedAssignment: null,
      isLoading: false,
      error: null,

      // ── CRUD ────────────────────────────────────────────
      fetchAssignments: async (teacherId, status?) => {
        set({ isLoading: true, error: null });
        try {
          const assignments = await services.assignment.listByTeacher(teacherId, status);
          set({ assignments, isLoading: false });
        } catch (e) {
          set({ error: '숙제 목록을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      fetchStudentAssignments: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const assignments = await services.assignment.listByStudent(studentId);
          set({ assignments, isLoading: false });
        } catch (e) {
          set({ error: '숙제 목록을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      getAssignmentById: async (id) => {
        try {
          return await services.assignment.getById(id);
        } catch {
          return null;
        }
      },

      createAssignment: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const newAssignment = await services.assignment.create(data);
          set({
            assignments: [...get().assignments, newAssignment],
            isLoading: false,
          });
          return newAssignment;
        } catch (e) {
          set({ error: '숙제 생성에 실패했습니다.', isLoading: false });
          throw e;
        }
      },

      updateAssignment: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          await services.assignment.update(id, updates);
          set({
            assignments: get().assignments.map((a) =>
              a.id === id ? { ...a, ...updates } : a
            ),
            isLoading: false,
          });
        } catch (e) {
          set({ error: '숙제 수정에 실패했습니다.', isLoading: false });
        }
      },

      deleteAssignment: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await services.assignment.delete(id);
          set({
            assignments: get().assignments.filter((a) => a.id !== id),
            isLoading: false,
          });
        } catch (e) {
          set({ error: '숙제 삭제에 실패했습니다.', isLoading: false });
        }
      },

      // ── Status ──────────────────────────────────────────
      publishAssignment: async (id) => {
        try {
          await services.assignment.updateStatus(id, 'published');
          set({
            assignments: get().assignments.map((a) =>
              a.id === id ? { ...a, status: 'published' as AssignmentStatus, publishedAt: new Date() } : a
            ),
          });
        } catch (e) {
          set({ error: '숙제 발행에 실패했습니다.' });
        }
      },

      closeAssignment: async (id) => {
        try {
          await services.assignment.updateStatus(id, 'closed');
          set({
            assignments: get().assignments.map((a) =>
              a.id === id ? { ...a, status: 'closed' as AssignmentStatus } : a
            ),
          });
        } catch (e) {
          set({ error: '숙제 마감에 실패했습니다.' });
        }
      },

      // ── Problems ────────────────────────────────────────
      addProblemsToAssignment: async (assignmentId, problemIds, pointsPerProblem?) => {
        try {
          await services.assignment.setProblems(assignmentId, problemIds, pointsPerProblem);
          const updated = await services.assignment.getById(assignmentId);
          if (updated) {
            set({
              assignments: get().assignments.map((a) =>
                a.id === assignmentId ? updated : a
              ),
            });
          }
        } catch (e) {
          set({ error: '문제 추가에 실패했습니다.' });
        }
      },

      // ── Selection ───────────────────────────────────────
      setSelectedAssignment: (assignment) =>
        set({ selectedAssignment: assignment }),

      // ── Utility ─────────────────────────────────────────
      getAssignmentsByStatus: (status) => {
        return get().assignments.filter((a) => a.status === status);
      },
    }),
    {
      name: 'mathpia-assignments',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        assignments: state.assignments,
      }),
    }
  )
);
