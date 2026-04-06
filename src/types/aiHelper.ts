// ============================================================
// src/types/aiHelper.ts
// AI Helper related type definitions
// ============================================================

/** Hint level (1: approach, 2: key formula, 3: first step of solution) */
export type HintLevel = 1 | 2 | 3;

/** Hint level labels in Korean */
export const HINT_LEVEL_LABELS: Record<HintLevel, string> = {
  1: '접근법 힌트',
  2: '핵심 공식 힌트',
  3: '풀이 첫 단계 힌트',
};

/** Single hint response */
export interface HintResponse {
  level: HintLevel;
  content: string; // LaTeX possible
}

/** A single step in step-by-step solution */
export interface SolutionStep {
  step: number;
  title: string; // e.g. "이차방정식 판별"
  content: string; // explanation text (LaTeX possible)
  formula?: string; // key formula (LaTeX)
}

/** Full step-by-step solution response */
export interface StepByStepResponse {
  steps: SolutionStep[];
  finalAnswer: string; // LaTeX possible
}

/** Similar problem match result */
export interface SimilarProblemMatch {
  problemId: string;
  similarity: number; // 0~1 similarity score
  reason: string; // reason for similarity
}

/** Per-problem hint usage tracking record */
export interface HintUsageRecord {
  problemId: string;
  hintsUsed: HintLevel[]; // list of used hint levels
  solutionViewed: boolean; // whether step-by-step was viewed
  similarProblemsViewed: boolean; // whether similar problems were viewed
  lastAccessedAt: string; // ISO date string
}
