// ============================================================
// src/services/interfaces/analytics.ts
// ============================================================

import type {
  StudentAnalytics,
  WeaknessAnalysis,
  ProblemRecommendation,
  ClassAnalytics,
  LearningReport,
} from '../../types/analytics';

export interface IAnalyticsService {
  getStudentAnalytics(studentId: string): Promise<StudentAnalytics>;
  refreshStudentAnalytics(studentId: string): Promise<StudentAnalytics>;
  analyzeWeakness(studentId: string): Promise<WeaknessAnalysis>;
  recommendProblems(studentId: string, limit?: number): Promise<ProblemRecommendation[]>;
  generateLearningReport(studentId: string): Promise<LearningReport>;
  getClassAnalytics(teacherId: string, classId?: string): Promise<ClassAnalytics>;
}
