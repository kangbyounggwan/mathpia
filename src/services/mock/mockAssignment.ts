// ============================================================
// src/services/mock/mockAssignment.ts
//
// Implements IAssignmentService using in-memory data + AsyncStorage.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IAssignmentService } from '../interfaces/assignment';
import type {
  Assignment,
  AssignmentProblem,
  AssignmentStudent,
  AssignmentStatus,
  Submission,
  Grading,
  Problem,
} from '../../types';
import {
  mockAssignments,
  mockSubmissions,
  mockProblems,
  type MockAssignment,
  type MockSubmission,
} from './mockData';

const ASSIGNMENTS_KEY = '@mathpia/assignments';
const SUBMISSIONS_KEY = '@mathpia/submissions';
const GRADINGS_KEY = '@mathpia/gradings';

// ── Helpers ──

/** Convert MockAssignment to Assignment type */
function toAssignment(a: MockAssignment): Assignment {
  const problems: Problem[] = a.problemIds.map((pid, idx) => {
    const prob = mockProblems.find(p => p.id === pid);
    return {
      id: pid,
      content: prob?.content ?? '',
      imageUrl: prob?.imageUrls?.[0],
      answer: prob?.answer,
      points: prob?.points ?? 3,
    };
  });

  return {
    id: a.id,
    academyId: a.academyId,
    teacherId: a.teacherId,
    title: a.title,
    description: a.description,
    grade: a.grade,
    subject: a.subject,
    dueDate: a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate),
    totalPoints: problems.reduce((sum, p) => sum + p.points, 0),
    status: a.status as AssignmentStatus,
    problems,
    assignedStudents: a.assignedStudentIds,
    createdAt: a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt),
  };
}

/** Convert MockSubmission to Submission type */
function toSubmission(s: MockSubmission): Submission {
  return {
    id: s.id,
    assignmentId: s.assignmentId,
    studentId: s.studentId,
    problemId: s.problemId,
    answerText: s.studentAnswer,
    isCorrect: s.isCorrect,
    score: s.score,
    feedback: s.feedback,
    submittedAt: s.submittedAt instanceof Date ? s.submittedAt : new Date(s.submittedAt),
    gradedAt: s.gradedAt ? (s.gradedAt instanceof Date ? s.gradedAt : new Date(s.gradedAt)) : undefined,
    timeSpentSeconds: s.timeTakenSeconds,
  };
}

/** Revive Date fields from JSON-parsed objects */
function reviveAssignment(a: Assignment): Assignment {
  return {
    ...a,
    dueDate: new Date(a.dueDate),
    createdAt: new Date(a.createdAt),
    publishedAt: a.publishedAt ? new Date(a.publishedAt) : undefined,
    updatedAt: a.updatedAt ? new Date(a.updatedAt) : undefined,
  };
}

function reviveSubmission(s: Submission): Submission {
  return {
    ...s,
    submittedAt: new Date(s.submittedAt),
    gradedAt: s.gradedAt ? new Date(s.gradedAt) : undefined,
  };
}

// ── Service ──

export class MockAssignmentService implements IAssignmentService {
  private assignments: Assignment[] = [];
  private submissions: Submission[] = [];
  private gradings: Grading[] = [];
  private initialized = false;

  private async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const [aStr, sStr, gStr] = await Promise.all([
        AsyncStorage.getItem(ASSIGNMENTS_KEY),
        AsyncStorage.getItem(SUBMISSIONS_KEY),
        AsyncStorage.getItem(GRADINGS_KEY),
      ]);
      this.assignments = aStr
        ? (JSON.parse(aStr) as Assignment[]).map(reviveAssignment)
        : mockAssignments.map(toAssignment);
      this.submissions = sStr
        ? (JSON.parse(sStr) as Submission[]).map(reviveSubmission)
        : mockSubmissions.map(toSubmission);
      this.gradings = gStr ? JSON.parse(gStr) : [];

      if (!aStr) await AsyncStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(this.assignments));
      if (!sStr) await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(this.submissions));
    } catch {
      this.assignments = mockAssignments.map(toAssignment);
      this.submissions = mockSubmissions.map(toSubmission);
      this.gradings = [];
    }
    this.initialized = true;
  }

  private async persistAssignments(): Promise<void> {
    await AsyncStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(this.assignments));
  }

  private async persistSubmissions(): Promise<void> {
    await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(this.submissions));
  }

  private async persistGradings(): Promise<void> {
    await AsyncStorage.setItem(GRADINGS_KEY, JSON.stringify(this.gradings));
  }

  // ── Assignment CRUD ──

  async getById(id: string): Promise<Assignment | null> {
    await this.init();
    return this.assignments.find(a => a.id === id) ?? null;
  }

  async create(data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assignment> {
    await this.init();
    const now = new Date();
    const newA: Assignment = {
      ...data,
      id: `A-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.assignments.push(newA);
    await this.persistAssignments();
    return newA;
  }

  async update(id: string, data: Partial<Assignment>): Promise<Assignment> {
    await this.init();
    const idx = this.assignments.findIndex(a => a.id === id);
    if (idx === -1) throw new Error(`Assignment ${id} not found`);
    this.assignments[idx] = {
      ...this.assignments[idx],
      ...data,
      id,
      updatedAt: new Date(),
    };
    await this.persistAssignments();
    return this.assignments[idx];
  }

  async delete(id: string): Promise<boolean> {
    await this.init();
    const before = this.assignments.length;
    this.assignments = this.assignments.filter(a => a.id !== id);
    if (this.assignments.length < before) {
      // Also remove related submissions and gradings
      this.submissions = this.submissions.filter(s => s.assignmentId !== id);
      await Promise.all([this.persistAssignments(), this.persistSubmissions()]);
      return true;
    }
    return false;
  }

  // ── List ──

  async listByTeacher(teacherId: string, status?: AssignmentStatus): Promise<Assignment[]> {
    await this.init();
    let result = this.assignments.filter(a => a.teacherId === teacherId);
    if (status) result = result.filter(a => a.status === status);
    return result;
  }

  async listByStudent(studentId: string): Promise<Assignment[]> {
    await this.init();
    return this.assignments.filter(
      a => a.assignedStudents.includes(studentId) && a.status !== 'draft',
    );
  }

  async updateStatus(id: string, status: AssignmentStatus): Promise<void> {
    await this.init();
    const idx = this.assignments.findIndex(a => a.id === id);
    if (idx === -1) return;
    this.assignments[idx] = {
      ...this.assignments[idx],
      status,
      updatedAt: new Date(),
      publishedAt: status === 'published' ? new Date() : this.assignments[idx].publishedAt,
    };
    await this.persistAssignments();
  }

  // ── Problems ──

  async setProblems(
    assignmentId: string,
    problemIds: string[],
    pointsPerProblem?: number[],
  ): Promise<AssignmentProblem[]> {
    await this.init();
    const idx = this.assignments.findIndex(a => a.id === assignmentId);
    if (idx === -1) throw new Error(`Assignment ${assignmentId} not found`);

    const problems: Problem[] = problemIds.map((pid, i) => {
      const prob = mockProblems.find(p => p.id === pid);
      return {
        id: pid,
        content: prob?.content ?? '',
        imageUrl: prob?.imageUrls?.[0],
        answer: prob?.answer,
        points: pointsPerProblem?.[i] ?? prob?.points ?? 3,
      };
    });
    this.assignments[idx] = {
      ...this.assignments[idx],
      problems,
      totalPoints: problems.reduce((sum, p) => sum + p.points, 0),
      updatedAt: new Date(),
    };
    await this.persistAssignments();

    return problemIds.map((pid, i) => ({
      id: `AP-${assignmentId}-${pid}`,
      assignmentId,
      problemId: pid,
      orderIndex: i,
      points: pointsPerProblem?.[i] ?? problems[i]?.points,
    }));
  }

  async getProblems(assignmentId: string): Promise<AssignmentProblem[]> {
    await this.init();
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) return [];
    return assignment.problems.map((p, i) => ({
      id: `AP-${assignmentId}-${p.id}`,
      assignmentId,
      problemId: p.id,
      orderIndex: i,
      points: p.points,
    }));
  }

  // ── Student assignment ──

  async assignStudents(assignmentId: string, studentIds: string[]): Promise<void> {
    await this.init();
    const idx = this.assignments.findIndex(a => a.id === assignmentId);
    if (idx === -1) return;
    const existing = new Set(this.assignments[idx].assignedStudents);
    for (const sid of studentIds) existing.add(sid);
    this.assignments[idx] = {
      ...this.assignments[idx],
      assignedStudents: Array.from(existing),
      updatedAt: new Date(),
    };
    await this.persistAssignments();
  }

  async getStudentStatuses(assignmentId: string): Promise<AssignmentStudent[]> {
    await this.init();
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) return [];

    return assignment.assignedStudents.map(studentId => {
      const subs = this.submissions.filter(
        s => s.assignmentId === assignmentId && s.studentId === studentId,
      );
      const totalProblems = assignment.problems.length;
      const submittedCount = subs.length;
      const totalScore = subs.reduce((sum, s) => sum + (s.score ?? 0), 0);
      const allGraded = subs.length > 0 && subs.every(s => s.gradedAt);

      let status: AssignmentStudent['status'] = 'assigned';
      if (allGraded && submittedCount >= totalProblems) {
        status = 'graded';
      } else if (submittedCount >= totalProblems) {
        status = 'submitted';
      } else if (submittedCount > 0) {
        status = 'in_progress';
      }

      return {
        assignmentId,
        studentId,
        assignedAt: assignment.createdAt,
        startedAt: subs.length > 0 ? subs[0].submittedAt : undefined,
        completedAt:
          submittedCount >= totalProblems
            ? subs[subs.length - 1]?.submittedAt
            : undefined,
        status,
        totalScore: totalScore || undefined,
        progressPercent:
          totalProblems > 0
            ? Math.round((submittedCount / totalProblems) * 100)
            : 0,
      };
    });
  }

  async getStudentStatus(
    assignmentId: string,
    studentId: string,
  ): Promise<AssignmentStudent | null> {
    const statuses = await this.getStudentStatuses(assignmentId);
    return statuses.find(s => s.studentId === studentId) ?? null;
  }

  // ── Submissions ──

  async submitAnswer(data: Omit<Submission, 'id' | 'submittedAt'>): Promise<Submission> {
    await this.init();
    const now = new Date();
    const newSub: Submission = {
      ...data,
      id: `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      submittedAt: now,
    };
    this.submissions.push(newSub);
    await this.persistSubmissions();
    return newSub;
  }

  async getSubmissions(assignmentId: string, studentId: string): Promise<Submission[]> {
    await this.init();
    return this.submissions.filter(
      s => s.assignmentId === assignmentId && s.studentId === studentId,
    );
  }

  async getSubmissionsByProblem(
    assignmentId: string,
    problemId: string,
  ): Promise<Submission[]> {
    await this.init();
    return this.submissions.filter(
      s => s.assignmentId === assignmentId && s.problemId === problemId,
    );
  }

  // ── Grading ──

  async gradeSubmission(data: Omit<Grading, 'id' | 'gradedAt'>): Promise<Grading> {
    await this.init();
    const now = new Date();
    const newGrading: Grading = {
      ...data,
      id: `GRD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      gradedAt: now,
    };
    this.gradings.push(newGrading);

    // Also update the submission record
    const subIdx = this.submissions.findIndex(s => s.id === data.submissionId);
    if (subIdx !== -1) {
      this.submissions[subIdx] = {
        ...this.submissions[subIdx],
        score: data.score,
        feedback: data.feedback,
        isCorrect: data.score >= 80,
        gradedAt: now,
      };
      await this.persistSubmissions();
    }

    await this.persistGradings();
    return newGrading;
  }

  async getGrading(submissionId: string): Promise<Grading | null> {
    await this.init();
    return this.gradings.find(g => g.submissionId === submissionId) ?? null;
  }
}
