// ============================================================
// src/stores/parentStore.ts
// Parent dashboard: child data, schedule, report
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import type { ChildDashboard, ChildSchedule, ParentLearningReport } from '../types';
import services from '../services';

// ─── Store Interface ──────────────────────────────────────
interface ParentState {
  // State
  childDashboards: ChildDashboard[];
  selectedChildId: string | null;
  schedule: ChildSchedule | null;
  report: ParentLearningReport | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Dashboard
  fetchAllDashboards: (parentId: string) => Promise<void>;
  fetchChildDashboard: (parentId: string, childId: string) => Promise<ChildDashboard | null>;

  // Actions - Schedule
  fetchSchedule: (childId: string) => Promise<ChildSchedule | null>;

  // Actions - Report
  fetchReport: (childId: string) => Promise<ParentLearningReport | null>;

  // Actions - Selection
  selectChild: (childId: string) => void;

  // Actions - Refresh
  refreshAll: (parentId: string, childId: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────
export const useParentStore = create<ParentState>()(
  persist(
    (set, get) => ({
      childDashboards: [],
      selectedChildId: null,
      schedule: null,
      report: null,
      isLoading: false,
      error: null,

      // ── Dashboard ──────────────────────────────────────
      fetchAllDashboards: async (parentId) => {
        set({ isLoading: true, error: null });
        try {
          const dashboards = await services.parent.getAllChildDashboards(parentId);
          set({
            childDashboards: dashboards,
            isLoading: false,
            // Auto-select first child if only one
            selectedChildId:
              dashboards.length === 1
                ? dashboards[0].child.id
                : get().selectedChildId,
          });
        } catch (e) {
          set({ error: '자녀 대시보드를 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      fetchChildDashboard: async (parentId, childId) => {
        set({ isLoading: true, error: null });
        try {
          const dashboard = await services.parent.getChildDashboard(parentId, childId);
          // Replace or add in the dashboards array
          const existing = get().childDashboards;
          const idx = existing.findIndex((d) => d.child.id === childId);
          const updated =
            idx >= 0
              ? existing.map((d, i) => (i === idx ? dashboard : d))
              : [...existing, dashboard];
          set({
            childDashboards: updated,
            isLoading: false,
          });
          return dashboard;
        } catch (e) {
          set({ error: '자녀 대시보드를 불러오는데 실패했습니다.', isLoading: false });
          return null;
        }
      },

      // ── Schedule ────────────────────────────────────────
      fetchSchedule: async (childId) => {
        set({ isLoading: true, error: null });
        try {
          const schedule = await services.parent.getChildSchedule(childId);
          set({ schedule, isLoading: false });
          return schedule;
        } catch (e) {
          set({ error: '스케줄을 불러오는데 실패했습니다.', isLoading: false });
          return null;
        }
      },

      // ── Report ──────────────────────────────────────────
      fetchReport: async (childId) => {
        set({ isLoading: true, error: null });
        try {
          const report = await services.parent.getChildReport(childId);
          set({ report, isLoading: false });
          return report;
        } catch (e) {
          set({ error: '학습 리포트를 불러오는데 실패했습니다.', isLoading: false });
          return null;
        }
      },

      // ── Selection ───────────────────────────────────────
      selectChild: (childId) => {
        set({ selectedChildId: childId });
      },

      // ── Refresh All ─────────────────────────────────────
      refreshAll: async (parentId, childId) => {
        set({ isLoading: true, error: null });
        try {
          const [dashboard, schedule, report] = await Promise.all([
            services.parent.getChildDashboard(parentId, childId),
            services.parent.getChildSchedule(childId),
            services.parent.getChildReport(childId),
          ]);

          // Update dashboard in array
          const existing = get().childDashboards;
          const idx = existing.findIndex((d) => d.child.id === childId);
          const updatedDashboards =
            idx >= 0
              ? existing.map((d, i) => (i === idx ? dashboard : d))
              : [...existing, dashboard];

          set({
            childDashboards: updatedDashboards,
            schedule,
            report,
            isLoading: false,
          });
        } catch (e) {
          set({ error: '데이터를 새로고침하는데 실패했습니다.', isLoading: false });
        }
      },
    }),
    {
      name: 'mathpia-parent',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        childDashboards: state.childDashboards,
        selectedChildId: state.selectedChildId,
        schedule: state.schedule,
        report: state.report,
      }),
    }
  )
);
