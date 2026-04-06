// ============================================================
// src/types/parent.ts
// Parent dashboard domain types
// ============================================================

import type { User, Grade, Assignment, AssignmentStudent } from './index';
import type { SubjectScore, WeakTopic, LearningReport } from './analytics';

/** High-level learning stats shown on the parent dashboard. */
export interface ChildLearningStats {
  totalSolved: number;
  correctRate: number;
  studyStreakDays: number;
  weeklyStudyMinutes: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
}

/** Complete data object for a single child's dashboard card. */
export interface ChildDashboard {
  child: User;
  stats: ChildLearningStats;
  recentAssignments: (Assignment & {
    studentStatus: AssignmentStudent;
  })[];
  weakTopics: WeakTopic[];
  aiAdvice: string;
}

/** A single class schedule entry. */
export interface ClassScheduleEntry {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  className: string;
  teacherName: string;
  subject: string;
}

/** An upcoming deadline shown on the schedule page. */
export interface UpcomingDeadline {
  assignmentId: string;
  title: string;
  dueDate: Date;
  subject: string;
  progressPercent: number;
  status: 'not_started' | 'in_progress' | 'submitted';
}

/** Aggregated schedule data for the schedule screen. */
export interface ChildSchedule {
  childId: string;
  weeklyClasses: ClassScheduleEntry[];
  upcomingDeadlines: UpcomingDeadline[];
}

/** Full parent-facing learning report. */
export interface ParentLearningReport {
  childId: string;
  childName: string;
  grade: Grade;
  report: LearningReport;
  topSubjects: SubjectScore[];
  worstTopics: WeakTopic[];
}
