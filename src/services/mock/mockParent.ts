// ============================================================
// src/services/mock/mockParent.ts
//
// Implements IParentService.
// Composes data from other mock data sources and the analytics service.
// ============================================================

import type { IParentService } from '../interfaces/parent';
import type {
  ChildDashboard,
  ChildSchedule,
  ChildLearningStats,
  ClassScheduleEntry,
  UpcomingDeadline,
  ParentLearningReport,
} from '../../types/parent';
import type { User, Assignment, AssignmentStudent } from '../../types';
import type { SubjectScore, WeakTopic } from '../../types/analytics';
import {
  mockStudents,
  mockParents,
  mockAssignments,
  mockSubmissions,
  mockSchedules,
  mockWrongNotes,
} from './mockData';
import { MockAnalyticsService } from './mockAnalytics';

const analyticsService = new MockAnalyticsService();

/** Day-of-week number to label mapping */
const DOW_NAMES: Record<number, ChildSchedule['weeklyClasses'][number]['dayOfWeek']> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

// ── Service ──

export class MockParentService implements IParentService {
  /**
   * Get the dashboard data for a single child.
   */
  async getChildDashboard(parentId: string, childId: string): Promise<ChildDashboard> {
    const parent = mockParents.find(p => p.id === parentId);
    if (!parent) throw new Error(`Parent ${parentId} not found`);
    if (!parent.childrenIds?.includes(childId)) {
      throw new Error(`Child ${childId} is not linked to parent ${parentId}`);
    }

    const child = mockStudents.find(s => s.id === childId);
    if (!child) throw new Error(`Student ${childId} not found`);

    const analytics = await analyticsService.getStudentAnalytics(childId);
    const weakness = await analyticsService.analyzeWeakness(childId);

    // Build the User object for the child
    const childUser: User = {
      id: child.id,
      academyId: child.academyId,
      role: 'student',
      name: child.name,
      email: child.email,
      phone: child.phone,
      grade: child.grade,
      isActive: true,
      createdAt: child.createdAt instanceof Date ? child.createdAt : new Date(child.createdAt),
    };

    // Recent assignments for this child
    const studentAssignments = mockAssignments
      .filter(a => a.assignedStudentIds.includes(childId) && a.status !== 'draft')
      .slice(0, 5);

    const recentAssignments: ChildDashboard['recentAssignments'] = studentAssignments.map(a => {
      const subs = mockSubmissions.filter(
        s => s.assignmentId === a.id && s.studentId === childId,
      );
      const totalProblems = a.problemIds.length;
      const submittedCount = subs.length;
      const correct = subs.filter(s => s.isCorrect).length;
      const allGraded = subs.length > 0 && subs.every(s => s.gradedAt);

      let status: AssignmentStudent['status'] = 'assigned';
      if (allGraded && submittedCount >= totalProblems) {
        status = 'graded';
      } else if (submittedCount >= totalProblems) {
        status = 'submitted';
      } else if (submittedCount > 0) {
        status = 'in_progress';
      }

      const assignment: Assignment = {
        id: a.id,
        academyId: a.academyId,
        teacherId: a.teacherId,
        title: a.title,
        description: a.description,
        grade: a.grade,
        subject: a.subject,
        dueDate: a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate),
        totalPoints: a.problemIds.length * 3,
        status: a.status as Assignment['status'],
        problems: [],
        assignedStudents: a.assignedStudentIds,
        createdAt: a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt),
      };

      const studentStatus: AssignmentStudent = {
        assignmentId: a.id,
        studentId: childId,
        assignedAt: a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt),
        startedAt: subs.length > 0 ? new Date(subs[0].submittedAt) : undefined,
        completedAt:
          submittedCount >= totalProblems
            ? new Date(subs[subs.length - 1]?.submittedAt)
            : undefined,
        status,
        totalScore: subs.reduce((sum, s) => sum + s.score, 0) || undefined,
        progressPercent:
          totalProblems > 0 ? Math.round((submittedCount / totalProblems) * 100) : 0,
      };

      return {
        ...assignment,
        studentStatus,
      };
    });

    // Compute learning stats
    const childSubs = mockSubmissions.filter(s => s.studentId === childId);
    const correctCount = childSubs.filter(s => s.isCorrect).length;
    const totalStudyMinutes = childSubs.reduce(
      (sum, s) => sum + Math.round(s.timeTakenSeconds / 60),
      0,
    );
    const completedAssignments = mockAssignments.filter(a => {
      if (!a.assignedStudentIds.includes(childId)) return false;
      const subs = mockSubmissions.filter(
        s => s.assignmentId === a.id && s.studentId === childId,
      );
      return subs.length >= a.problemIds.length;
    }).length;
    const totalAssignments = mockAssignments.filter(
      a => a.assignedStudentIds.includes(childId) && a.status !== 'draft',
    ).length;

    const stats: ChildLearningStats = {
      totalSolved: analytics.totalSolved,
      correctRate: analytics.overallScore,
      studyStreakDays: analytics.streakDays,
      weeklyStudyMinutes: Math.round(totalStudyMinutes / 4), // approximate weekly average
      assignmentsCompleted: completedAssignments,
      assignmentsTotal: totalAssignments,
    };

    // AI advice
    const aiAdvice =
      `${child.name} 학생은 전체 정답률 ${analytics.overallScore}%로 ` +
      (analytics.overallScore >= 70
        ? '양호한 수준입니다. '
        : '추가 학습이 필요합니다. ') +
      `특히 ${weakness.weakTopics[0]?.topic ?? '일부 단원'}에서 보충이 필요합니다. ` +
      `최근 학습 연속 일수는 ${analytics.streakDays}일입니다.`;

    return {
      child: childUser,
      stats,
      recentAssignments,
      weakTopics: weakness.weakTopics.slice(0, 3),
      aiAdvice,
    };
  }

  /**
   * Get dashboards for all children of a parent.
   */
  async getAllChildDashboards(parentId: string): Promise<ChildDashboard[]> {
    const parent = mockParents.find(p => p.id === parentId);
    if (!parent || !parent.childrenIds) return [];

    const dashboards = await Promise.all(
      parent.childrenIds.map(childId => this.getChildDashboard(parentId, childId)),
    );
    return dashboards;
  }

  /**
   * Get the weekly class schedule and upcoming deadlines for a child.
   */
  async getChildSchedule(childId: string): Promise<ChildSchedule> {
    // Convert mock schedule items to ClassScheduleEntry
    const scheduleItems = mockSchedules.filter(s => s.studentId === childId);
    const weeklyClasses: ClassScheduleEntry[] = scheduleItems.map(s => ({
      dayOfWeek: DOW_NAMES[s.dayOfWeek] ?? 'monday',
      startTime: s.startTime,
      endTime: s.endTime,
      className: s.subject,
      teacherName: s.teacherName,
      subject: s.subject,
    }));

    // Upcoming deadlines: published assignments with future due dates
    const now = new Date();
    const upcomingDeadlines: UpcomingDeadline[] = mockAssignments
      .filter(a => {
        const due = new Date(a.dueDate);
        return (
          a.assignedStudentIds.includes(childId) &&
          a.status === 'published' &&
          due >= now
        );
      })
      .map(a => {
        const subs = mockSubmissions.filter(
          s => s.assignmentId === a.id && s.studentId === childId,
        );
        const totalProblems = a.problemIds.length;
        const submittedCount = subs.length;
        const progressPercent =
          totalProblems > 0 ? Math.round((submittedCount / totalProblems) * 100) : 0;

        let status: UpcomingDeadline['status'] = 'not_started';
        if (submittedCount >= totalProblems) {
          status = 'submitted';
        } else if (submittedCount > 0) {
          status = 'in_progress';
        }

        return {
          assignmentId: a.id,
          title: a.title,
          dueDate: a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate),
          subject: a.subject,
          progressPercent,
          status,
        };
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return {
      childId,
      weeklyClasses,
      upcomingDeadlines,
    };
  }

  /**
   * Generate a full parent-facing learning report for a child.
   */
  async getChildReport(childId: string): Promise<ParentLearningReport> {
    const child = mockStudents.find(s => s.id === childId);
    if (!child) throw new Error(`Student ${childId} not found`);

    const analytics = await analyticsService.getStudentAnalytics(childId);
    const report = await analyticsService.generateLearningReport(childId);

    // Top subjects (sorted descending by score)
    const topSubjects: SubjectScore[] = [...analytics.subjectScores]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Worst topics
    const worstTopics: WeakTopic[] = [...analytics.weakTopics].slice(0, 3);

    return {
      childId,
      childName: child.name,
      grade: child.grade ?? '중1',
      report,
      topSubjects,
      worstTopics,
    };
  }
}
