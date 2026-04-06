// ============================================================
// src/services/mock/mockAnalytics.ts
//
// Implements IAnalyticsService.
// All analytics are computed from submission data with AsyncStorage caching.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IAnalyticsService } from '../interfaces/analytics';
import type {
  StudentAnalytics,
  WeaknessAnalysis,
  ProblemRecommendation,
  ClassAnalytics,
  LearningReport,
  SubjectScore,
  WeakTopic,
  ErrorPattern,
  RadarDataPoint,
  TimeSeriesPoint,
  HeatMapCell,
} from '../../types/analytics';
import {
  mockSubmissions,
  mockProblems,
  mockStudents,
  type MockSubmission,
} from './mockData';

const ANALYTICS_CACHE_KEY = '@mathpia/analyticsCache';

// ── Helpers ──

/** Fetch all submissions for a student (from AsyncStorage or in-memory fallback) */
async function getStudentSubmissions(studentId: string): Promise<MockSubmission[]> {
  try {
    const stored = await AsyncStorage.getItem('@mathpia/submissions');
    const subs: MockSubmission[] = stored ? JSON.parse(stored) : mockSubmissions;
    return subs.filter(s => s.studentId === studentId);
  } catch {
    return mockSubmissions.filter(s => s.studentId === studentId);
  }
}

/** Format a Date as YYYY-MM-DD */
function formatDate(d: Date): string {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** Day-of-week labels (Mon-Sun) */
const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Service ──

export class MockAnalyticsService implements IAnalyticsService {
  /**
   * Get cached analytics or compute fresh.
   */
  async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    // Try cache first
    try {
      const cacheStr = await AsyncStorage.getItem(ANALYTICS_CACHE_KEY);
      if (cacheStr) {
        const cache: Record<string, StudentAnalytics> = JSON.parse(cacheStr);
        if (cache[studentId]) {
          const cached = cache[studentId];
          // Return cached if analyzed within the last hour
          const analyzedAt = new Date(cached.lastAnalyzedAt);
          if (Date.now() - analyzedAt.getTime() < 3600000) {
            return {
              ...cached,
              lastAnalyzedAt: new Date(cached.lastAnalyzedAt),
            };
          }
        }
      }
    } catch {
      // Ignore cache read errors
    }

    return this.computeAndCacheAnalytics(studentId);
  }

  /**
   * Force-refresh analytics regardless of cache.
   */
  async refreshStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    return this.computeAndCacheAnalytics(studentId);
  }

  /**
   * Analyze weaknesses for a student.
   */
  async analyzeWeakness(studentId: string): Promise<WeaknessAnalysis> {
    const analytics = await this.getStudentAnalytics(studentId);

    // Sort subject scores ascending to find weakest
    const sorted = [...analytics.subjectScores].sort((a, b) => a.score - b.score);
    const weakTopics: WeakTopic[] = sorted.slice(0, 5).map(ts => ({
      topic: ts.topic ?? ts.subject,
      score: ts.score,
      reason:
        ts.score < 40
          ? `정답률 ${ts.score}%로 매우 낮습니다. 기초 개념 복습이 필요합니다.`
          : `정답률 ${ts.score}%로 보통 이하입니다. 유형별 추가 연습이 필요합니다.`,
      recommendedCount: ts.score < 40 ? 10 : 5,
    }));

    // Generate mock error patterns
    const errorPatterns: ErrorPattern[] = [
      {
        pattern: '계산 실수',
        frequency: Math.floor(Math.random() * 10) + 3,
        examples: ['부호 오류', '분수 계산 오류', '지수 법칙 혼동'],
      },
      {
        pattern: '개념 혼동',
        frequency: Math.floor(Math.random() * 8) + 2,
        examples: ['공식 적용 오류', '조건 누락'],
      },
      {
        pattern: '문제 이해 부족',
        frequency: Math.floor(Math.random() * 5) + 1,
        examples: ['조건 해석 오류', '문제 유형 파악 실패'],
      },
    ];

    const recommendations = weakTopics.map(
      wt => `${wt.topic} 단원의 기본 개념을 복습하고, 난이도 '하' 문제부터 단계적으로 풀어보세요.`,
    );

    return {
      studentId,
      analyzedAt: new Date(),
      weakTopics,
      errorPatterns,
      recommendations,
    };
  }

  /**
   * Recommend problems for a student based on weakness analysis.
   */
  async recommendProblems(
    studentId: string,
    limit: number = 5,
  ): Promise<ProblemRecommendation[]> {
    const weakness = await this.analyzeWeakness(studentId);
    const student = mockStudents.find(s => s.id === studentId);
    const gradeProblems = mockProblems.filter(p => p.grade === student?.grade);

    const recommendations: ProblemRecommendation[] = [];

    for (const wt of weakness.weakTopics) {
      if (recommendations.length >= limit) break;

      // Find problems matching the weak topic
      const matching = gradeProblems.filter(
        p => p.topic.includes(wt.topic) || p.subject.includes(wt.topic),
      );

      for (const prob of matching) {
        if (recommendations.length >= limit) break;
        if (recommendations.some(r => r.problemId === prob.id)) continue;

        recommendations.push({
          problemId: prob.id,
          reason: `${wt.topic} 단원의 정답률이 ${wt.score}%로 낮습니다. 이 문제로 연습해 보세요.`,
          targetWeakTopic: wt.topic,
          expectedDifficulty:
            prob.difficulty === '하'
              ? 'easy'
              : prob.difficulty === '중'
                ? 'appropriate'
                : 'challenging',
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate a full learning report with chart data.
   */
  async generateLearningReport(studentId: string): Promise<LearningReport> {
    const analytics = await this.getStudentAnalytics(studentId);
    const subs = await getStudentSubmissions(studentId);
    const student = mockStudents.find(s => s.id === studentId);

    // Radar data: subject scores
    const radarData: RadarDataPoint[] = analytics.subjectScores.map(ss => ({
      label: ss.topic ?? ss.subject,
      value: ss.score,
    }));

    // Timeline data: daily scores over the past 4 weeks
    const dateScoreMap = new Map<string, { correct: number; total: number }>();
    for (const sub of subs) {
      const d = formatDate(new Date(sub.submittedAt));
      const cur = dateScoreMap.get(d) ?? { correct: 0, total: 0 };
      cur.total++;
      if (sub.isCorrect) cur.correct++;
      dateScoreMap.set(d, cur);
    }
    const timelineData: TimeSeriesPoint[] = Array.from(dateScoreMap.entries())
      .map(([date, val]) => ({
        date,
        score: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Heatmap data: day-of-week x hour activity
    const heatmapData: HeatMapCell[] = [];
    const heatmapMap = new Map<string, number>();
    for (const sub of subs) {
      const dt = new Date(sub.submittedAt);
      const dow = DOW_LABELS[dt.getDay()];
      const hour = `${String(dt.getHours()).padStart(2, '0')}:00`;
      const key = `${dow}-${hour}`;
      heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + 1);
    }
    for (const [key, value] of heatmapMap.entries()) {
      const [x, y] = key.split('-');
      heatmapData.push({ x, y, value });
    }

    // Identify strengths and weaknesses
    const sortedScores = [...analytics.subjectScores].sort((a, b) => b.score - a.score);
    const strengths = sortedScores
      .slice(0, 3)
      .map(s => `${s.topic ?? s.subject}: 정답률 ${s.score}%`);
    const weaknesses = sortedScores
      .slice(-3)
      .reverse()
      .map(s => `${s.topic ?? s.subject}: 정답률 ${s.score}%`);

    const advice = [
      `${student?.name ?? '학생'}님은 전체 정답률 ${analytics.overallScore}%입니다.`,
      analytics.overallScore >= 70
        ? '전반적으로 양호한 수준이며, 심화 문제에 도전해 보세요.'
        : '기초 개념 복습에 집중하고, 오답노트를 활용해 보세요.',
      `약점 단원(${analytics.weakTopics.map(wt => wt.topic).join(', ')})에 대한 집중 학습을 권장합니다.`,
    ];

    return {
      studentId,
      generatedAt: new Date(),
      radarData,
      timelineData,
      heatmapData,
      aiSummary:
        `최근 4주간 총 ${analytics.totalSolved}문제를 풀었으며, 전체 정답률은 ${analytics.overallScore}%입니다. ` +
        `강점 단원: ${analytics.strongTopics.map(st => st.topic ?? st.subject).slice(0, 2).join(', ')}. ` +
        `보충 필요 단원: ${analytics.weakTopics.map(wt => wt.topic).slice(0, 2).join(', ')}.`,
      strengths,
      weaknesses,
      advice,
    };
  }

  /**
   * Class-level analytics for a teacher.
   */
  async getClassAnalytics(teacherId: string, classId?: string): Promise<ClassAnalytics> {
    // Get all students for this teacher's academy
    const students = mockStudents.filter(s => s.academyId === 'academy1');
    const allAnalytics = await Promise.all(
      students.map(s => this.getStudentAnalytics(s.id)),
    );

    const avg =
      allAnalytics.length > 0
        ? Math.round(
            allAnalytics.reduce((sum, a) => sum + a.overallScore, 0) / allAnalytics.length,
          )
        : 0;

    // Count how many students are weak in each topic
    const topicCount = new Map<string, number>();
    for (const a of allAnalytics) {
      for (const wt of a.weakTopics) {
        topicCount.set(wt.topic, (topicCount.get(wt.topic) ?? 0) + 1);
      }
    }

    const weakTopicDistribution = Array.from(topicCount.entries())
      .map(([topic, studentCount]) => ({ topic, studentCount }))
      .sort((a, b) => b.studentCount - a.studentCount);

    // Top performers and struggling students
    const sorted = allAnalytics
      .map(a => {
        const student = mockStudents.find(s => s.id === a.studentId);
        return { studentId: a.studentId, name: student?.name ?? '', score: a.overallScore };
      })
      .sort((a, b) => b.score - a.score);

    return {
      classId,
      studentCount: students.length,
      averageScore: avg,
      weakTopicDistribution,
      topPerformers: sorted.slice(0, 3),
      strugglingStudents: sorted.slice(-3).reverse(),
    };
  }

  // ── Private: compute and cache analytics ──

  private async computeAndCacheAnalytics(studentId: string): Promise<StudentAnalytics> {
    const subs = await getStudentSubmissions(studentId);
    const student = mockStudents.find(s => s.id === studentId);

    // Per-subject/topic aggregation
    const topicMap = new Map<string, { subject: string; correct: number; total: number }>();
    for (const sub of subs) {
      const prob = mockProblems.find(p => p.id === sub.problemId);
      if (!prob) continue;
      const key = prob.topic;
      const cur = topicMap.get(key) ?? { subject: prob.subject, correct: 0, total: 0 };
      cur.total++;
      if (sub.isCorrect) cur.correct++;
      topicMap.set(key, cur);
    }

    const subjectScores: SubjectScore[] = [];
    topicMap.forEach((val, topic) => {
      subjectScores.push({
        subject: val.subject,
        topic,
        score: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
        totalProblems: val.total,
        correctProblems: val.correct,
      });
    });

    // Sort to find weak and strong topics
    const sorted = [...subjectScores].sort((a, b) => a.score - b.score);
    const weakTopics: WeakTopic[] = sorted.slice(0, 3).map(ts => ({
      topic: ts.topic ?? ts.subject,
      score: ts.score,
      reason:
        ts.score < 40
          ? `정답률 ${ts.score}%로 매우 낮습니다.`
          : `정답률 ${ts.score}%로 보통 이하입니다.`,
      recommendedCount: ts.score < 40 ? 10 : 5,
    }));
    const strongTopics: SubjectScore[] = sorted.slice(-3).reverse();

    const totalCorrect = subs.filter(s => s.isCorrect).length;
    const overallScore =
      subs.length > 0 ? Math.round((totalCorrect / subs.length) * 100) : 0;

    // Calculate streak days
    const dateSet = new Set(
      subs.map(s => {
        const d = new Date(s.submittedAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
    );
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 28; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (dateSet.has(key)) {
        streakDays++;
      } else if (i > 0) {
        break;
      }
    }

    // Weekly scores (last 4 weeks)
    const weeklyScores: { weekLabel: string; score: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - w * 7);
      const weekSubs = subs.filter(s => {
        const d = new Date(s.submittedAt);
        return d >= weekStart && d < weekEnd;
      });
      const correct = weekSubs.filter(s => s.isCorrect).length;
      weeklyScores.push({
        weekLabel: `W${4 - w}`,
        score: weekSubs.length > 0 ? Math.round((correct / weekSubs.length) * 100) : 0,
      });
    }

    // Daily solve counts (last 28 days)
    const dailySolveCounts: { date: string; count: number }[] = [];
    for (let d = 27; d >= 0; d--) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - d);
      const dateStr = formatDate(dt);
      const count = subs.filter(s => formatDate(new Date(s.submittedAt)) === dateStr).length;
      dailySolveCounts.push({ date: dateStr, count });
    }

    const analytics: StudentAnalytics = {
      studentId,
      grade: (student?.grade as StudentAnalytics['grade']) ?? '중1',
      overallScore,
      totalSolved: subs.length,
      totalCorrect,
      streakDays,
      subjectScores,
      weakTopics,
      strongTopics,
      weeklyScores,
      dailySolveCounts,
      lastAnalyzedAt: new Date(),
      submissionCountSinceLastAnalysis: 0,
    };

    // Cache the result
    try {
      const cacheStr = await AsyncStorage.getItem(ANALYTICS_CACHE_KEY);
      const cache: Record<string, StudentAnalytics> = cacheStr ? JSON.parse(cacheStr) : {};
      cache[studentId] = analytics;
      await AsyncStorage.setItem(ANALYTICS_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore cache write errors
    }

    return analytics;
  }
}
