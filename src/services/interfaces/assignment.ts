// ============================================================
// src/services/interfaces/assignment.ts
// ============================================================

import type {
  Assignment,
  AssignmentProblem,
  AssignmentStudent,
  AssignmentStatus,
  Submission,
  Grading,
} from '../../types';

export interface IAssignmentService {
  getById(id: string): Promise<Assignment | null>;
  create(data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assignment>;
  update(id: string, data: Partial<Assignment>): Promise<Assignment>;
  delete(id: string): Promise<boolean>;

  listByTeacher(teacherId: string, status?: AssignmentStatus): Promise<Assignment[]>;
  listByStudent(studentId: string): Promise<Assignment[]>;
  updateStatus(id: string, status: AssignmentStatus): Promise<void>;

  setProblems(assignmentId: string, problemIds: string[], pointsPerProblem?: number[]): Promise<AssignmentProblem[]>;
  getProblems(assignmentId: string): Promise<AssignmentProblem[]>;

  assignStudents(assignmentId: string, studentIds: string[]): Promise<void>;
  getStudentStatuses(assignmentId: string): Promise<AssignmentStudent[]>;
  getStudentStatus(assignmentId: string, studentId: string): Promise<AssignmentStudent | null>;

  submitAnswer(data: Omit<Submission, 'id' | 'submittedAt'>): Promise<Submission>;
  getSubmissions(assignmentId: string, studentId: string): Promise<Submission[]>;
  getSubmissionsByProblem(assignmentId: string, problemId: string): Promise<Submission[]>;

  gradeSubmission(data: Omit<Grading, 'id' | 'gradedAt'>): Promise<Grading>;
  getGrading(submissionId: string): Promise<Grading | null>;
}
