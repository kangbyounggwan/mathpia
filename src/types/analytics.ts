// ============================================================
// src/types/analytics.ts
// Learning analytics domain types
// ============================================================

import type { Grade } from './index';

/** Per-subject/topic mastery score. */
export interface SubjectScore {
  subject: string;
  topic?: string;
  score: number;
  totalProblems: number;
  correctProblems: number;
}

/** AI-identified weakness. */
export interface WeakTopic {
  topic: string;
  score: number;
  reason: string;
  recommendedCount: number;
}

/** AI-generated error-pattern description. */
export interface ErrorPattern {
  pattern: string;
  frequency: number;
  examples: string[];
}

/**
 * Complete student analytics snapshot.
 * Cached in analyticsStore; refreshed when new submissions exceed threshold.
 */
export interface StudentAnalytics {
  studentId: string;
  grade: Grade;

  overallScore: number;
  totalSolved: number;
  totalCorrect: number;
  streakDays: number;

  subjectScores: SubjectScore[];
  weakTopics: WeakTopic[];
  strongTopics: SubjectScore[];

  weeklyScores: { weekLabel: string; score: number }[];
  dailySolveCounts: { date: string; count: number }[];

  lastAnalyzedAt: Date;
  submissionCountSinceLastAnalysis: number;
}

/**
 * Full weakness analysis returned by Gemini.
 */
export interface WeaknessAnalysis {
  studentId: string;
  analyzedAt: Date;
  weakTopics: WeakTopic[];
  errorPatterns: ErrorPattern[];
  recommendations: string[];
}

/** AI-generated problem recommendation. */
export interface ProblemRecommendation {
  problemId: string;
  reason: string;
  targetWeakTopic: string;
  expectedDifficulty: 'easy' | 'appropriate' | 'challenging';
}

/** Class-level aggregate analytics (teacher view). */
export interface ClassAnalytics {
  classId?: string;
  studentCount: number;
  averageScore: number;
  weakTopicDistribution: { topic: string; studentCount: number }[];
  topPerformers: { studentId: string; name: string; score: number }[];
  strugglingStudents: { studentId: string; name: string; score: number }[];
}

// ------ Chart data shapes ------

export interface RadarDataPoint {
  label: string;
  value: number;
}

export interface TimeSeriesPoint {
  date: string;
  score: number;
}

export interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface HeatMapCell {
  x: string;
  y: string;
  value: number;
}

/**
 * Complete learning report (parent & teacher view).
 */
export interface LearningReport {
  studentId: string;
  generatedAt: Date;
  radarData: RadarDataPoint[];
  timelineData: TimeSeriesPoint[];
  heatmapData: HeatMapCell[];
  aiSummary: string;
  strengths: string[];
  weaknesses: string[];
  advice: string[];
}
