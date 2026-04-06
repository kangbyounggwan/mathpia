// ============================================================
// src/stores/analyticsStore.ts
// AI learning analytics with caching strategy
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import type {
  StudentAnalytics,
  WeaknessAnalysis,
  ProblemRecommendation,
  LearningReport,
  ClassAnalytics,
} from '../types';
import services from '../services';

// ─── Cache Entry ──────────────────────────────────────────
interface AnalysisCacheEntry {
  lastAnalyzedAt: string;              // ISO date string (persist compatible)
  submissionCountAtAnalysis: number;   // Submission count at analysis time
  weakness: WeaknessAnalysis | null;
  report: LearningReport | null;
  recommendations: ProblemRecommendation[];
}

// ─── Store Interface ──────────────────────────────────────
interface AnalyticsState {
  // State
  studentAnalytics: Record<string, StudentAnalytics>;  // studentId -> analytics
  analysisCacheMap: Record<string, AnalysisCacheEntry>; // studentId -> cache
  classAnalytics: ClassAnalytics | null;
  isLoading: boolean;
  isAnalyzing: boolean;  // AI analysis in progress
  error: string | null;

  // Actions - Student Analytics
  fetchStudentAnalytics: (studentId: string) => Promise<StudentAnalytics | null>;
  refreshAnalytics: (studentId: string) => Promise<StudentAnalytics | null>;
  fetchClassAnalytics: (teacherId: string, classId?: string) => Promise<void>;

  // Actions - AI Analysis
  analyzeWeakness: (
    studentId: string,
    currentSubmissionCount: number
  ) => Promise<WeaknessAnalysis | null>;
  generateReport: (
    studentId: string,
    currentSubmissionCount: number
  ) => Promise<LearningReport | null>;
  getRecommendedProblems: (studentId: string, limit?: number) => Promise<ProblemRecommendation[]>;

  // Actions - Cache
  shouldReanalyze: (studentId: string, currentSubmissionCount: number) => boolean;
  invalidateCache: (studentId: string) => void;
  getCachedWeakness: (studentId: string) => WeaknessAnalysis | null;
  getCachedReport: (studentId: string) => LearningReport | null;

  // Actions - Manual Trigger (teacher)
  triggerManualAnalysis: (
    studentId: string,
    currentSubmissionCount: number
  ) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────
const REANALYSIS_THRESHOLD = 5; // Re-analyze when 5+ new submissions

// ─── Store ────────────────────────────────────────────────
export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      studentAnalytics: {},
      analysisCacheMap: {},
      classAnalytics: null,
      isLoading: false,
      isAnalyzing: false,
      error: null,

      // ── Student Analytics ──────────────────────────────
      fetchStudentAnalytics: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const analytics = await services.analytics.getStudentAnalytics(studentId);
          set({
            studentAnalytics: {
              ...get().studentAnalytics,
              [studentId]: analytics,
            },
            isLoading: false,
          });
          return analytics;
        } catch (e) {
          set({ error: '학생 분석 데이터를 불러오는데 실패했습니다.', isLoading: false });
          return null;
        }
      },

      refreshAnalytics: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const analytics = await services.analytics.refreshStudentAnalytics(studentId);
          set({
            studentAnalytics: {
              ...get().studentAnalytics,
              [studentId]: analytics,
            },
            isLoading: false,
          });
          return analytics;
        } catch (e) {
          set({ error: '학생 분석 새로고침에 실패했습니다.', isLoading: false });
          return null;
        }
      },

      fetchClassAnalytics: async (teacherId, classId?) => {
        set({ isLoading: true, error: null });
        try {
          const classData = await services.analytics.getClassAnalytics(teacherId, classId);
          set({ classAnalytics: classData, isLoading: false });
        } catch (e) {
          set({ error: '반 분석 데이터를 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      // ── AI Analysis ────────────────────────────────────
      analyzeWeakness: async (studentId, currentSubmissionCount) => {
        // Check cache
        if (!get().shouldReanalyze(studentId, currentSubmissionCount)) {
          return get().getCachedWeakness(studentId);
        }

        set({ isAnalyzing: true, error: null });
        try {
          const weakness = await services.analytics.analyzeWeakness(studentId);
          const recommendations = await services.analytics.recommendProblems(studentId);

          // Update cache
          const existingCache = get().analysisCacheMap[studentId] || {
            lastAnalyzedAt: '',
            submissionCountAtAnalysis: 0,
            weakness: null,
            report: null,
            recommendations: [],
          };

          set({
            analysisCacheMap: {
              ...get().analysisCacheMap,
              [studentId]: {
                ...existingCache,
                lastAnalyzedAt: new Date().toISOString(),
                submissionCountAtAnalysis: currentSubmissionCount,
                weakness,
                recommendations,
              },
            },
            isAnalyzing: false,
          });

          return weakness;
        } catch (e) {
          set({ error: 'AI 취약점 분석에 실패했습니다.', isAnalyzing: false });
          return null;
        }
      },

      generateReport: async (studentId, currentSubmissionCount) => {
        // Check cache
        if (!get().shouldReanalyze(studentId, currentSubmissionCount)) {
          return get().getCachedReport(studentId);
        }

        set({ isAnalyzing: true, error: null });
        try {
          const report = await services.analytics.generateLearningReport(studentId);

          const existingCache = get().analysisCacheMap[studentId] || {
            lastAnalyzedAt: '',
            submissionCountAtAnalysis: 0,
            weakness: null,
            report: null,
            recommendations: [],
          };

          set({
            analysisCacheMap: {
              ...get().analysisCacheMap,
              [studentId]: {
                ...existingCache,
                lastAnalyzedAt: new Date().toISOString(),
                submissionCountAtAnalysis: currentSubmissionCount,
                report,
              },
            },
            isAnalyzing: false,
          });

          return report;
        } catch (e) {
          set({ error: 'AI 리포트 생성에 실패했습니다.', isAnalyzing: false });
          return null;
        }
      },

      getRecommendedProblems: async (studentId, limit?) => {
        const cache = get().analysisCacheMap[studentId];
        if (cache?.recommendations && cache.recommendations.length > 0) {
          return cache.recommendations;
        }

        // No cached recommendations; run fresh analysis
        try {
          const recommendations = await services.analytics.recommendProblems(studentId, limit);
          return recommendations;
        } catch {
          return [];
        }
      },

      // ── Cache ──────────────────────────────────────────
      shouldReanalyze: (studentId, currentSubmissionCount) => {
        const cache = get().analysisCacheMap[studentId];
        if (!cache || !cache.lastAnalyzedAt) {
          return true; // No analysis history
        }
        const diff = currentSubmissionCount - cache.submissionCountAtAnalysis;
        return diff >= REANALYSIS_THRESHOLD;
      },

      invalidateCache: (studentId) => {
        const { [studentId]: _, ...rest } = get().analysisCacheMap;
        set({ analysisCacheMap: rest });
      },

      getCachedWeakness: (studentId) => {
        return get().analysisCacheMap[studentId]?.weakness || null;
      },

      getCachedReport: (studentId) => {
        return get().analysisCacheMap[studentId]?.report || null;
      },

      // ── Manual Trigger (teacher) ─────────────────────
      triggerManualAnalysis: async (studentId, currentSubmissionCount) => {
        // Invalidate cache and force re-analysis
        get().invalidateCache(studentId);
        await get().analyzeWeakness(studentId, currentSubmissionCount);
        await get().generateReport(studentId, currentSubmissionCount);
      },
    }),
    {
      name: 'mathpia-analytics',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        studentAnalytics: state.studentAnalytics,
        analysisCacheMap: state.analysisCacheMap,
        classAnalytics: state.classAnalytics,
      }),
    }
  )
);
