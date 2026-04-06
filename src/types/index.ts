// ============================================================
// src/types/index.ts
// Core shared types for Mathpia
// ============================================================

// ------ Enums / Literal unions ------

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export type Grade = '중1' | '중2' | '중3' | '고1' | '고2' | '고3';

export type Difficulty = '상' | '중' | '하';

export type ProblemType = '객관식' | '서술형' | '단답형';

export type SourceType = 'manual' | 'ai_extracted';

export type AssignmentStatus = 'draft' | 'published' | 'closed';

export type StudentAssignmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'graded';

// ------ Core entities ------

export interface Academy {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  logoUrl?: string;
  subscriptionPlan?: 'free' | 'basic' | 'premium';
  maxStudents?: number;
  maxTeachers?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  academyId: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  grade?: Grade;
  profileImage?: string;
  childrenIds?: string[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Lightweight problem embedded inside an Assignment.
 * For the full problem bank item see ProblemBankItem in ./problemBank.
 */
export interface Problem {
  id: string;
  content: string;
  imageUrl?: string;
  answer?: string;
  points: number;
}

export interface Assignment {
  id: string;
  academyId: string;
  teacherId: string;
  classId?: string;
  title: string;
  description: string;
  grade: Grade;
  subject: string;
  dueDate: Date;
  totalPoints?: number;
  status: AssignmentStatus;
  problems: Problem[];
  assignedStudents: string[];
  allowLateSubmission?: boolean;
  showAnswerAfterDue?: boolean;
  createdAt: Date;
  publishedAt?: Date;
  updatedAt?: Date;
}

export interface AssignmentProblem {
  id: string;
  assignmentId: string;
  problemId: string;
  orderIndex: number;
  points?: number;
}

export interface AssignmentStudent {
  assignmentId: string;
  studentId: string;
  assignedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: StudentAssignmentStatus;
  totalScore?: number;
  progressPercent: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  problemId: string;
  answerText?: string;
  answerImageUrl?: string;
  canvasData?: Record<string, unknown>;
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
  timeSpentSeconds?: number;
}

export interface Grading {
  id: string;
  submissionId: string;
  teacherId: string;
  score: number;
  feedback?: string;
  feedbackImageUrl?: string;
  gradedAt: Date;
}

export interface Material {
  id: string;
  academyId: string;
  teacherId: string;
  title: string;
  description: string;
  grade: Grade;
  subject: string;
  topic?: string;
  fileUrl: string;
  fileType: 'pdf' | 'image';
  fileSizeBytes?: number;
  thumbnailUrl?: string;
  viewCount?: number;
  isPublic?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// ------ Canvas types ------

export interface Point {
  x: number;
  y: number;
  pressure: number;
}

export type CanvasTool = 'pen' | 'pencil' | 'highlighter' | 'eraser';
export type CanvasBackground = 'blank' | 'grid' | 'coordinate';

export interface StrokeData {
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: CanvasTool;
  timestamp: number;
}

export interface CanvasState {
  strokes: StrokeData[];
  background: CanvasBackground;
  zoom: number;
  offset: { x: number; y: number };
}

// ------ Navigation param lists ------

export type AuthStackParamList = {
  login: undefined;
  register: undefined;
};

export type TeacherTabParamList = {
  index: undefined;
  students: undefined;
  assignments: undefined;
  materials: undefined;
  grading: undefined;
};

export type StudentTabParamList = {
  index: undefined;
  homework: undefined;
  solve: { assignmentId: string; problemIndex: number };
  materials: undefined;
};

export type ParentTabParamList = {
  index: undefined;
  schedule: undefined;
  report: undefined;
};

// ------ Re-exports of domain-specific type modules ------

export * from './problemBank';
export * from './analytics';
export * from './wrongNote';
export * from './parent';
export * from './aiHelper';
