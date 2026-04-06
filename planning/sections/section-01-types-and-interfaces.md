# Section 01: Types & Interfaces

## Background

Mathpia is a tablet-focused math tutoring platform connecting teachers, students, and parents. The current codebase has a minimal type system (`src/types/index.ts`) that covers only basic entities: `User`, `Problem`, `Assignment`, `Submission`, `Material`, and canvas-related types. The `UserRole` type is limited to `'admin' | 'teacher' | 'student'` -- there is no parent role.

This section establishes the **complete type foundation** for all upcoming features: problem bank, learning analytics, wrong-note review, AI tutoring helper, and parent dashboard. It also defines **service interfaces** that abstract data access so that the current Mock+AsyncStorage implementation can later be swapped for Supabase without changing any UI or store code.

This section MUST be completed first. Every subsequent section depends on the types and interfaces defined here.

---

## Dependencies

| Direction | Section | Reason |
|-----------|---------|--------|
| **Requires** | _None_ | This is the first section |
| **Blocks** | Section 02 (Mock Data & Services) | Mock services implement these interfaces |
| **Blocks** | Section 03 (Zustand Stores) | Stores use these types for state |
| **Blocks** | Section 04-10 (All UI sections) | All components consume these types |

---

## Requirements (What Must Be True When Complete)

1. `UserRole` includes `'parent'` and `User` has an optional `childrenIds` field.
2. Four new type files exist: `problemBank.ts`, `analytics.ts`, `wrongNote.ts`, `parent.ts`.
3. Five service interface files exist in `src/services/interfaces/`.
4. A service factory `src/services/index.ts` exports a typed `services` object.
5. All types align with the database schema tables (problem_bank, submissions, assignments, etc.).
6. Existing code that imports from `src/types` continues to compile without changes.
7. `npx tsc --noEmit` passes with zero errors.

---

## Files to Create / Modify

| Action | File Path | Description |
|--------|-----------|-------------|
| **Modify** | `src/types/index.ts` | Add `'parent'` to UserRole, add `childrenIds` to User, add `AssignmentStatus`, expand `Submission`, update navigation types |
| **Create** | `src/types/problemBank.ts` | Problem bank item types |
| **Create** | `src/types/analytics.ts` | Learning analytics types |
| **Create** | `src/types/wrongNote.ts` | Wrong-note types |
| **Create** | `src/types/parent.ts` | Parent dashboard types |
| **Create** | `src/services/interfaces/problemBank.ts` | IProblemBankService |
| **Create** | `src/services/interfaces/assignment.ts` | IAssignmentService |
| **Create** | `src/services/interfaces/analytics.ts` | IAnalyticsService |
| **Create** | `src/services/interfaces/wrongNote.ts` | IWrongNoteService |
| **Create** | `src/services/interfaces/parent.ts` | IParentService |
| **Create** | `src/services/interfaces/index.ts` | Re-exports all interfaces |
| **Create** | `src/services/index.ts` | Service factory (placeholder -- concrete implementations come in Section 02) |

---

## Detailed Implementation

### Step 1: Modify `src/types/index.ts`

The existing file defines `UserRole`, `User`, `Problem`, `Assignment`, `Submission`, `Material`, canvas types, and navigation param types. We add the parent role, expand several interfaces, add new shared enums/types, and re-export the new type modules.

**Current file** (before changes -- abbreviated for reference):

```typescript
export type UserRole = 'admin' | 'teacher' | 'student';
export type Grade = '중1' | '중2' | '중3' | '고1' | '고2' | '고3';

export interface User {
  id: string;
  academyId: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  grade?: Grade;
  profileImage?: string;
  createdAt: Date;
}

// ... Problem, Assignment, Submission, Material, Canvas types, Navigation types
```

**Replace the ENTIRE file** with:

```typescript
// ============================================================
// src/types/index.ts
// Core shared types for Mathpia
// ============================================================

// ------ Enums / Literal unions ------

/** User roles. 'parent' added for parent dashboard feature. */
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

/** Korean grade levels (middle school 1-3, high school 1-3). */
export type Grade = '중1' | '중2' | '중3' | '고1' | '고2' | '고3';

/** Problem difficulty. Matches DB ENUM difficulty_level. */
export type Difficulty = '상' | '중' | '하';

/** Problem type. Matches DB ENUM problem_type. */
export type ProblemType = '객관식' | '서술형' | '단답형';

/** How the problem was created. Matches DB ENUM source_type. */
export type SourceType = 'manual' | 'ai_extracted';

/** Assignment lifecycle status. Matches DB ENUM assignment_status. */
export type AssignmentStatus = 'draft' | 'published' | 'closed';

/** Per-student assignment status. Matches DB ENUM student_assignment_status. */
export type StudentAssignmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'graded';

// ------ Core entities ------

/** Academy (학원). Matches DB table `academies`. */
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

/**
 * User profile. Matches DB table `profiles`.
 * - Teachers may have `subjects` and `grades` arrays.
 * - Students have an optional `grade`.
 * - Parents have an optional `childrenIds`.
 */
export interface User {
  id: string;
  academyId: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  grade?: Grade;
  profileImage?: string;
  /** Parent-only: IDs of linked student accounts. */
  childrenIds?: string[];
  isActive?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Lightweight problem embedded inside an Assignment.
 * Kept for backward-compatibility with the existing codebase.
 * For the full problem bank item see `ProblemBankItem` in `./problemBank`.
 */
export interface Problem {
  id: string;
  content: string;
  imageUrl?: string;
  answer?: string;
  points: number;
}

/** Assignment (숙제). Matches DB table `assignments`. */
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
  /** Legacy inline problems. New flow uses assignmentProblems join. */
  problems: Problem[];
  assignedStudents: string[];
  allowLateSubmission?: boolean;
  showAnswerAfterDue?: boolean;
  createdAt: Date;
  publishedAt?: Date;
  updatedAt?: Date;
}

/**
 * Join entity linking an assignment to a problem-bank item.
 * Matches DB table `assignment_problems`.
 */
export interface AssignmentProblem {
  id: string;
  assignmentId: string;
  problemId: string;
  orderIndex: number;
  points?: number;
}

/**
 * Per-student assignment tracking.
 * Matches DB table `assignment_students`.
 */
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

/** Single problem submission. Matches DB table `submissions`. */
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

/** Grading record. Matches DB table `gradings`. */
export interface Grading {
  id: string;
  submissionId: string;
  teacherId: string;
  score: number;
  feedback?: string;
  feedbackImageUrl?: string;
  gradedAt: Date;
}

/** Teaching material. Matches DB table `materials`. */
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

// ------ Canvas types (unchanged) ------

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
// Consumers can do:  import { ProblemBankItem } from '@/types'
// or:                import { ProblemBankItem } from '@/types/problemBank'

export * from './problemBank';
export * from './analytics';
export * from './wrongNote';
export * from './parent';
```

**Key changes vs. the original file:**

| Change | Reason |
|--------|--------|
| `UserRole` now includes `'parent'` | Parent dashboard feature |
| `User.childrenIds?: string[]` | Links parent to children |
| New shared literal types: `Difficulty`, `ProblemType`, `SourceType`, `AssignmentStatus`, `StudentAssignmentStatus` | Used across problem bank, analytics, and services |
| `AssignmentProblem`, `AssignmentStudent`, `Grading` interfaces | Matches DB join tables |
| `Assignment.status` field added | Track draft/published/closed |
| `Submission` expanded with `isCorrect`, `canvasData`, `timeSpentSeconds` | Matches DB `submissions` table |
| `ParentTabParamList` added | Navigation for parent screens |
| `Academy` expanded with new fields | Matches DB `academies` table |
| Re-exports from new type modules at bottom | Barrel export convenience |

---

### Step 2: Create `src/types/problemBank.ts`

This file defines the full problem bank item and related filter/search types. Fields map directly to the DB `problem_bank` table.

```typescript
// ============================================================
// src/types/problemBank.ts
// Problem bank domain types
// ============================================================

import type { Grade, Difficulty, ProblemType, SourceType } from './index';

/**
 * A single item in the problem bank.
 * Matches DB table `problem_bank`.
 */
export interface ProblemBankItem {
  id: string;
  academyId: string;
  createdBy: string;

  // Content
  content: string;
  /** Optional HTML-rendered content (for rich display). */
  contentHtml?: string;
  imageUrls: string[];

  // Answer & solution
  answer?: string;
  /** Full worked solution (LaTeX). */
  solution?: string;

  // Classification
  difficulty: Difficulty;
  type: ProblemType;
  /** Multiple-choice options. null for non-MC problems. */
  choices?: string[] | null;

  // Curriculum mapping
  grade: Grade;
  subject: string;
  topic: string;
  tags: string[];

  // Metadata
  /** Human-readable source label, e.g. "2024 수능 모의고사". */
  source?: string;
  sourceType: SourceType;
  points: number;
  usageCount: number;
  /** Rolling correct-answer rate (0-100). Computed from submissions. */
  correctRate?: number;

  createdAt: Date;
  updatedAt?: Date;
}

/** Input type for creating a new problem (id and computed fields omitted). */
export type ProblemBankItemCreate = Omit<
  ProblemBankItem,
  'id' | 'usageCount' | 'correctRate' | 'createdAt' | 'updatedAt'
>;

/** Input type for updating an existing problem (all fields optional). */
export type ProblemBankItemUpdate = Partial<ProblemBankItemCreate>;

/**
 * Filter criteria for searching the problem bank.
 * All fields optional -- omitted fields mean "no filter".
 */
export interface ProblemBankFilter {
  grade?: Grade;
  subject?: string;
  topic?: string;
  difficulty?: Difficulty;
  type?: ProblemType;
  sourceType?: SourceType;
  tags?: string[];
  /** Free-text search over content, topic, tags. */
  searchQuery?: string;
}

/** Sort options for problem bank listing. */
export type ProblemBankSortField = 'createdAt' | 'difficulty' | 'usageCount' | 'correctRate';

export interface ProblemBankSortOption {
  field: ProblemBankSortField;
  direction: 'asc' | 'desc';
}

/** Paginated result wrapper (reusable). */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

---

### Step 3: Create `src/types/analytics.ts`

These types power the Gemini AI learning-analysis features and chart data.

```typescript
// ============================================================
// src/types/analytics.ts
// Learning analytics domain types
// ============================================================

import type { Grade } from './index';

/** Per-subject/topic mastery score. */
export interface SubjectScore {
  subject: string;
  topic?: string;
  score: number;         // 0-100
  totalProblems: number;
  correctProblems: number;
}

/** AI-identified weakness. */
export interface WeakTopic {
  topic: string;
  score: number;             // 0-100 (lower = weaker)
  reason: string;            // AI-generated explanation
  recommendedCount: number;  // suggested # of practice problems
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

  // Summary stats
  overallScore: number;      // weighted average (0-100)
  totalSolved: number;
  totalCorrect: number;
  streakDays: number;

  // Breakdowns
  subjectScores: SubjectScore[];
  weakTopics: WeakTopic[];
  strongTopics: SubjectScore[];

  // Time-series data for charts
  /** Weekly score snapshots. */
  weeklyScores: { weekLabel: string; score: number }[];
  /** Daily solve counts over last 28 days. */
  dailySolveCounts: { date: string; count: number }[];

  // Cache metadata
  lastAnalyzedAt: Date;
  submissionCountSinceLastAnalysis: number;
}

/**
 * Full weakness analysis returned by Gemini.
 * Used as input to AI problem recommendations.
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
  /** Expected difficulty relative to student level. */
  expectedDifficulty: 'easy' | 'appropriate' | 'challenging';
}

/** Class-level aggregate analytics (teacher view). */
export interface ClassAnalytics {
  classId?: string;
  studentCount: number;
  averageScore: number;
  /** Distribution of weak topics across students. */
  weakTopicDistribution: { topic: string; studentCount: number }[];
  topPerformers: { studentId: string; name: string; score: number }[];
  strugglingStudents: { studentId: string; name: string; score: number }[];
}

// ------ Chart data shapes ------

/** RadarChart data point. */
export interface RadarDataPoint {
  label: string;
  value: number;   // 0-100
}

/** LineChart data point. */
export interface TimeSeriesPoint {
  date: string;    // ISO date string or label
  score: number;
}

/** BarChart data point. */
export interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

/** HeatMap cell. */
export interface HeatMapCell {
  x: string;       // e.g. topic
  y: string;       // e.g. difficulty
  value: number;   // 0-100 (lower = weaker)
}

/**
 * Complete learning report (parent & teacher view).
 * Generated by Gemini's `generateLearningReport`.
 */
export interface LearningReport {
  studentId: string;
  generatedAt: Date;
  radarData: RadarDataPoint[];
  timelineData: TimeSeriesPoint[];
  heatmapData: HeatMapCell[];
  /** AI-written natural-language summary. */
  aiSummary: string;
  strengths: string[];
  weaknesses: string[];
  advice: string[];
}
```

---

### Step 4: Create `src/types/wrongNote.ts`

```typescript
// ============================================================
// src/types/wrongNote.ts
// Wrong-note (오답노트) domain types
// ============================================================

import type { ProblemBankItem } from './problemBank';

/** Review mastery status. */
export type WrongNoteStatus = 'unreviewed' | 'reviewing' | 'mastered';

/**
 * A single wrong-note entry.
 * Auto-created when a student submits an incorrect answer.
 */
export interface WrongNote {
  id: string;
  studentId: string;
  problemId: string;
  assignmentId: string;

  /** The student's incorrect answer. */
  studentAnswer: string;
  /** The correct answer. */
  correctAnswer: string;

  /** Denormalized problem snapshot (so it survives problem edits). */
  problem: ProblemBankItem;

  // Review tracking
  status: WrongNoteStatus;
  reviewCount: number;
  /** Number of consecutive correct reviews. 3+ = mastered. */
  consecutiveCorrect: number;
  lastReviewDate?: Date;
  /**
   * Mastery requires 3 consecutive correct answers
   * with at least 24h between each review.
   */
  isLearned: boolean;

  /** AI-generated detailed explanation (populated on demand). */
  aiExplanation?: string;

  createdAt: Date;
  updatedAt?: Date;
}

/** Filter criteria for wrong-note listing. */
export interface WrongNoteFilter {
  status?: WrongNoteStatus;
  subject?: string;
  topic?: string;
  /** Date range start (ISO string). */
  fromDate?: string;
  /** Date range end (ISO string). */
  toDate?: string;
}

/** Summary statistics for the wrong-note dashboard. */
export interface WrongNoteStats {
  total: number;
  unreviewed: number;
  reviewing: number;
  mastered: number;
  /** mastered / total as percentage 0-100. */
  masteryRate: number;
}

/** Result of a single review attempt inside ReviewMode. */
export interface ReviewAttempt {
  wrongNoteId: string;
  answer: string;
  isCorrect: boolean;
  reviewedAt: Date;
}
```

---

### Step 5: Create `src/types/parent.ts`

```typescript
// ============================================================
// src/types/parent.ts
// Parent dashboard domain types
// ============================================================

import type { User, Grade, Assignment, AssignmentStudent } from './index';
import type { SubjectScore, WeakTopic, LearningReport } from './analytics';

/** High-level learning stats shown on the parent dashboard. */
export interface ChildLearningStats {
  totalSolved: number;
  correctRate: number;          // 0-100
  studyStreakDays: number;
  /** Total minutes studied this week. */
  weeklyStudyMinutes: number;
  assignmentsCompleted: number;
  assignmentsTotal: number;
}

/**
 * Complete data object for a single child's dashboard card.
 */
export interface ChildDashboard {
  child: User;
  stats: ChildLearningStats;
  recentAssignments: (Assignment & {
    studentStatus: AssignmentStudent;
  })[];
  weakTopics: WeakTopic[];
  /** AI-generated one-paragraph advice for the parent. */
  aiAdvice: string;
}

/** A single class schedule entry. */
export interface ClassScheduleEntry {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;   // "HH:mm"
  endTime: string;     // "HH:mm"
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

/**
 * Full parent-facing learning report.
 * Wraps the base LearningReport with parent-friendly extras.
 */
export interface ParentLearningReport {
  childId: string;
  childName: string;
  grade: Grade;
  report: LearningReport;
  /** Top 3 subjects by mastery. */
  topSubjects: SubjectScore[];
  /** Top 3 worst topics. */
  worstTopics: WeakTopic[];
}
```

---

### Step 6: Create Service Interfaces

All service interfaces use `Promise`-based async methods so the same signatures work for both Mock (in-memory + AsyncStorage) and future Supabase implementations.

#### 6a. `src/services/interfaces/problemBank.ts`

```typescript
// ============================================================
// src/services/interfaces/problemBank.ts
// ============================================================

import type {
  ProblemBankItem,
  ProblemBankItemCreate,
  ProblemBankItemUpdate,
  ProblemBankFilter,
  ProblemBankSortOption,
  PaginatedResult,
} from '../../types/problemBank';

export interface IProblemBankService {
  // ------ CRUD ------

  /** Get a single problem by ID. Returns null if not found. */
  getById(id: string): Promise<ProblemBankItem | null>;

  /** Create a new problem. Returns the created item with generated ID. */
  create(data: ProblemBankItemCreate): Promise<ProblemBankItem>;

  /** Update an existing problem. Returns the updated item. */
  update(id: string, data: ProblemBankItemUpdate): Promise<ProblemBankItem>;

  /** Delete a problem by ID. Returns true if deleted. */
  delete(id: string): Promise<boolean>;

  // ------ Listing & Search ------

  /**
   * Get a paginated, filtered, sorted list of problems.
   * @param filter  - field-level filters (all optional)
   * @param sort    - sort field + direction (default: createdAt desc)
   * @param page    - 1-based page number (default: 1)
   * @param pageSize - items per page (default: 20)
   */
  list(
    filter?: ProblemBankFilter,
    sort?: ProblemBankSortOption,
    page?: number,
    pageSize?: number,
  ): Promise<PaginatedResult<ProblemBankItem>>;

  /** Full-text search across content, topic, tags. */
  search(query: string, limit?: number): Promise<ProblemBankItem[]>;

  // ------ Bulk operations ------

  /** Retrieve multiple problems by their IDs (for assignment composition). */
  getByIds(ids: string[]): Promise<ProblemBankItem[]>;

  /** Bulk-create problems (e.g. after AI extraction). Returns created items. */
  bulkCreate(items: ProblemBankItemCreate[]): Promise<ProblemBankItem[]>;

  // ------ Statistics ------

  /** Increment usage count (called when problem is added to an assignment). */
  incrementUsageCount(id: string): Promise<void>;

  /** Update the rolling correct rate for a problem. */
  updateCorrectRate(id: string, correctRate: number): Promise<void>;
}
```

#### 6b. `src/services/interfaces/assignment.ts`

```typescript
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
  Grade,
} from '../../types';

export interface IAssignmentService {
  // ------ Assignment CRUD ------

  getById(id: string): Promise<Assignment | null>;

  create(data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assignment>;

  update(id: string, data: Partial<Assignment>): Promise<Assignment>;

  delete(id: string): Promise<boolean>;

  /** List assignments filtered by teacher and/or status. */
  listByTeacher(
    teacherId: string,
    status?: AssignmentStatus,
  ): Promise<Assignment[]>;

  /** List published assignments assigned to a specific student. */
  listByStudent(studentId: string): Promise<Assignment[]>;

  /** Change assignment status (e.g. draft -> published -> closed). */
  updateStatus(id: string, status: AssignmentStatus): Promise<void>;

  // ------ Problem linking ------

  /** Set the problems for an assignment (replaces existing). */
  setProblems(assignmentId: string, problemIds: string[], pointsPerProblem?: number[]): Promise<AssignmentProblem[]>;

  /** Get problems linked to an assignment, ordered by orderIndex. */
  getProblems(assignmentId: string): Promise<AssignmentProblem[]>;

  // ------ Student assignment ------

  /** Assign students to an assignment. */
  assignStudents(assignmentId: string, studentIds: string[]): Promise<void>;

  /** Get tracking info for all students assigned to an assignment. */
  getStudentStatuses(assignmentId: string): Promise<AssignmentStudent[]>;

  /** Get a single student's tracking info for an assignment. */
  getStudentStatus(assignmentId: string, studentId: string): Promise<AssignmentStudent | null>;

  // ------ Submissions ------

  /** Submit an answer for a single problem. */
  submitAnswer(data: Omit<Submission, 'id' | 'submittedAt'>): Promise<Submission>;

  /** Get all submissions for a student in an assignment. */
  getSubmissions(assignmentId: string, studentId: string): Promise<Submission[]>;

  /** Get all submissions for a specific problem across all students. */
  getSubmissionsByProblem(assignmentId: string, problemId: string): Promise<Submission[]>;

  // ------ Grading ------

  /** Grade a submission. Creates a Grading record and updates Submission. */
  gradeSubmission(data: Omit<Grading, 'id' | 'gradedAt'>): Promise<Grading>;

  /** Get grading record for a submission. */
  getGrading(submissionId: string): Promise<Grading | null>;
}
```

#### 6c. `src/services/interfaces/analytics.ts`

```typescript
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
  // ------ Student analytics ------

  /**
   * Get or compute the analytics snapshot for a student.
   * Returns cached version if fresh; recomputes otherwise.
   */
  getStudentAnalytics(studentId: string): Promise<StudentAnalytics>;

  /**
   * Force recomputation of analytics (ignores cache).
   * Typically called by a teacher via "AI 진단 실행" button.
   */
  refreshStudentAnalytics(studentId: string): Promise<StudentAnalytics>;

  // ------ AI weakness analysis ------

  /**
   * Run Gemini AI weakness analysis on a student's submission history.
   * Results are cached. Re-analysis triggers when
   * submissionCountSinceLastAnalysis >= 5.
   */
  analyzeWeakness(studentId: string): Promise<WeaknessAnalysis>;

  // ------ AI problem recommendation ------

  /**
   * Get AI-recommended problems for a student based on their weaknesses.
   * @param studentId
   * @param limit   max number of recommendations (default: 10)
   */
  recommendProblems(studentId: string, limit?: number): Promise<ProblemRecommendation[]>;

  // ------ Learning report ------

  /**
   * Generate a comprehensive learning report for a student.
   * Used by parent dashboard and teacher detail view.
   */
  generateLearningReport(studentId: string): Promise<LearningReport>;

  // ------ Class/group analytics ------

  /**
   * Compute aggregate analytics for all students in a class or
   * all students assigned to a teacher.
   */
  getClassAnalytics(teacherId: string, classId?: string): Promise<ClassAnalytics>;
}
```

#### 6d. `src/services/interfaces/wrongNote.ts`

```typescript
// ============================================================
// src/services/interfaces/wrongNote.ts
// ============================================================

import type {
  WrongNote,
  WrongNoteFilter,
  WrongNoteStats,
  ReviewAttempt,
} from '../../types/wrongNote';

export interface IWrongNoteService {
  // ------ CRUD ------

  /** Get a single wrong note by ID. */
  getById(id: string): Promise<WrongNote | null>;

  /**
   * Add a wrong note. Typically called automatically when a student
   * submits an incorrect answer.
   */
  create(data: Omit<WrongNote, 'id' | 'status' | 'reviewCount' | 'consecutiveCorrect' | 'isLearned' | 'createdAt' | 'updatedAt'>): Promise<WrongNote>;

  /** Delete a wrong note (student chose to remove). */
  delete(id: string): Promise<boolean>;

  // ------ Listing ------

  /** List wrong notes for a student with optional filters. */
  listByStudent(
    studentId: string,
    filter?: WrongNoteFilter,
  ): Promise<WrongNote[]>;

  /** Get summary statistics for a student's wrong notes. */
  getStats(studentId: string): Promise<WrongNoteStats>;

  // ------ Review ------

  /**
   * Record a review attempt. Updates review count, consecutive-correct
   * counter, and mastery status.
   *
   * Mastery rule: 3 consecutive correct answers with >= 24h between reviews.
   */
  recordReview(attempt: ReviewAttempt): Promise<WrongNote>;

  /** Get wrong notes due for review (unreviewed + reviewing, sorted by oldest). */
  getDueForReview(studentId: string, limit?: number): Promise<WrongNote[]>;

  // ------ AI explanation ------

  /**
   * Request an AI-generated explanation for a wrong note.
   * The explanation is cached on the WrongNote.aiExplanation field.
   */
  getAiExplanation(wrongNoteId: string): Promise<string>;
}
```

#### 6e. `src/services/interfaces/parent.ts`

```typescript
// ============================================================
// src/services/interfaces/parent.ts
// ============================================================

import type { ChildDashboard, ChildSchedule, ParentLearningReport } from '../../types/parent';

export interface IParentService {
  /**
   * Get the full dashboard data for one child.
   * Includes stats, recent assignments, weak topics, and AI advice.
   */
  getChildDashboard(parentId: string, childId: string): Promise<ChildDashboard>;

  /**
   * Get dashboards for all children linked to this parent.
   */
  getAllChildDashboards(parentId: string): Promise<ChildDashboard[]>;

  /**
   * Get the weekly class schedule and upcoming deadlines for a child.
   */
  getChildSchedule(childId: string): Promise<ChildSchedule>;

  /**
   * Get a detailed learning report for a child.
   * Wraps IAnalyticsService.generateLearningReport with parent-friendly extras.
   */
  getChildReport(childId: string): Promise<ParentLearningReport>;
}
```

#### 6f. `src/services/interfaces/index.ts`

Barrel re-export of all interfaces.

```typescript
// ============================================================
// src/services/interfaces/index.ts
// Re-exports all service interfaces
// ============================================================

export type { IProblemBankService } from './problemBank';
export type { IAssignmentService } from './assignment';
export type { IAnalyticsService } from './analytics';
export type { IWrongNoteService } from './wrongNote';
export type { IParentService } from './parent';
```

---

### Step 7: Create `src/services/index.ts` (Service Factory)

This file is the **single entry point** for all data services. In this section we define only the typed shape. Concrete mock implementations will be plugged in by Section 02. For now we use `null as any` placeholders so the file compiles, with a clear `TODO` comment.

```typescript
// ============================================================
// src/services/index.ts
// Service factory -- central access point for all data services.
//
// Current backend: Mock + AsyncStorage
// Future backend:  Supabase (swap implementations here)
// ============================================================

import type { IProblemBankService } from './interfaces/problemBank';
import type { IAssignmentService } from './interfaces/assignment';
import type { IAnalyticsService } from './interfaces/analytics';
import type { IWrongNoteService } from './interfaces/wrongNote';
import type { IParentService } from './interfaces/parent';

// TODO [Section 02]: Replace placeholders with MockXxxService instances.
// import { MockProblemBankService } from './mock/mockProblemBank';
// import { MockAssignmentService } from './mock/mockAssignment';
// import { MockAnalyticsService } from './mock/mockAnalytics';
// import { MockWrongNoteService } from './mock/mockWrongNote';
// import { MockParentService } from './mock/mockParent';

export interface Services {
  problemBank: IProblemBankService;
  assignment: IAssignmentService;
  analytics: IAnalyticsService;
  wrongNote: IWrongNoteService;
  parent: IParentService;
}

/**
 * Singleton services object.
 *
 * Usage in stores / components:
 *   import services from '@/services';
 *   const problems = await services.problemBank.list();
 *
 * To switch to Supabase later, change the instantiations below.
 */
const services: Services = {
  // Placeholders -- Section 02 will provide real implementations
  problemBank: null as unknown as IProblemBankService,
  assignment: null as unknown as IAssignmentService,
  analytics: null as unknown as IAnalyticsService,
  wrongNote: null as unknown as IWrongNoteService,
  parent: null as unknown as IParentService,
};

export default services;
```

> **Important**: After Section 02 is complete, the `null as unknown as ...` lines will be replaced with real `new MockXxxService()` calls. The file is structured this way so that `import services from '@/services'` works immediately and TypeScript understands the full shape of each service.

---

## Mapping: Types to Database Schema

This table shows how each TypeScript type maps to the Supabase database table defined in `DATABASE_SCHEMA.md`:

| TypeScript Type | DB Table | Notes |
|----------------|----------|-------|
| `Academy` | `academies` | camelCase <-> snake_case |
| `User` | `profiles` | `profileImage` -> `avatar_url`, `childrenIds` is client-side only (no DB column yet) |
| `ProblemBankItem` | `problem_bank` | All columns covered |
| `Assignment` | `assignments` | `problems` array kept for legacy compat |
| `AssignmentProblem` | `assignment_problems` | Join table |
| `AssignmentStudent` | `assignment_students` | Join table |
| `Submission` | `submissions` | `canvasData` -> `canvas_data` JSONB |
| `Grading` | `gradings` | -- |
| `Material` | `materials` | -- |
| `StudentAnalytics` | _(computed, not persisted)_ | Cached in Zustand + AsyncStorage |
| `WrongNote` | _(new table needed later)_ | Currently Mock only |
| `ChildDashboard` | _(computed view)_ | Assembled from multiple tables |

---

## Acceptance Criteria

- [ ] **AC-1**: `src/types/index.ts` compiles and exports `UserRole` that includes `'parent'`
- [ ] **AC-2**: `User` interface has optional `childrenIds?: string[]` field
- [ ] **AC-3**: Shared literal types exist: `Difficulty`, `ProblemType`, `SourceType`, `AssignmentStatus`, `StudentAssignmentStatus`
- [ ] **AC-4**: New interfaces exist: `AssignmentProblem`, `AssignmentStudent`, `Grading`, `ParentTabParamList`
- [ ] **AC-5**: `src/types/problemBank.ts` exists with `ProblemBankItem`, `ProblemBankItemCreate`, `ProblemBankItemUpdate`, `ProblemBankFilter`, `ProblemBankSortOption`, `PaginatedResult`
- [ ] **AC-6**: `src/types/analytics.ts` exists with `StudentAnalytics`, `WeaknessAnalysis`, `ProblemRecommendation`, `ClassAnalytics`, `LearningReport`, and all chart data types (`RadarDataPoint`, `TimeSeriesPoint`, `BarDataPoint`, `HeatMapCell`)
- [ ] **AC-7**: `src/types/wrongNote.ts` exists with `WrongNote`, `WrongNoteFilter`, `WrongNoteStats`, `ReviewAttempt`, `WrongNoteStatus`
- [ ] **AC-8**: `src/types/parent.ts` exists with `ChildDashboard`, `ChildLearningStats`, `ChildSchedule`, `ClassScheduleEntry`, `UpcomingDeadline`, `ParentLearningReport`
- [ ] **AC-9**: `src/services/interfaces/problemBank.ts` exports `IProblemBankService` with CRUD, list, search, getByIds, bulkCreate, incrementUsageCount, updateCorrectRate
- [ ] **AC-10**: `src/services/interfaces/assignment.ts` exports `IAssignmentService` with assignment CRUD, problem linking, student assignment, submission, and grading methods
- [ ] **AC-11**: `src/services/interfaces/analytics.ts` exports `IAnalyticsService` with getStudentAnalytics, refreshStudentAnalytics, analyzeWeakness, recommendProblems, generateLearningReport, getClassAnalytics
- [ ] **AC-12**: `src/services/interfaces/wrongNote.ts` exports `IWrongNoteService` with CRUD, listByStudent, getStats, recordReview, getDueForReview, getAiExplanation
- [ ] **AC-13**: `src/services/interfaces/parent.ts` exports `IParentService` with getChildDashboard, getAllChildDashboards, getChildSchedule, getChildReport
- [ ] **AC-14**: `src/services/interfaces/index.ts` re-exports all 5 interfaces
- [ ] **AC-15**: `src/services/index.ts` exports a typed `services` singleton of type `Services` with all 5 service fields
- [ ] **AC-16**: Existing imports in `src/stores/authStore.ts` (`User`, `UserRole`) still resolve correctly
- [ ] **AC-17**: Existing imports in `src/constants/curriculum.ts` (`Grade`) still resolve correctly
- [ ] **AC-18**: `npx tsc --noEmit` passes with zero errors after all files are created/modified

---

## Implementation Order

Execute these steps in order. Each step should compile before proceeding:

1. Create `src/types/problemBank.ts`
2. Create `src/types/analytics.ts`
3. Create `src/types/wrongNote.ts`
4. Create `src/types/parent.ts`
5. Modify `src/types/index.ts` (includes re-exports of above)
6. Create `src/services/interfaces/problemBank.ts`
7. Create `src/services/interfaces/assignment.ts`
8. Create `src/services/interfaces/analytics.ts`
9. Create `src/services/interfaces/wrongNote.ts`
10. Create `src/services/interfaces/parent.ts`
11. Create `src/services/interfaces/index.ts`
12. Create `src/services/index.ts`
13. Run `npx tsc --noEmit` and fix any errors
14. Verify existing code still compiles (authStore, curriculum imports)
