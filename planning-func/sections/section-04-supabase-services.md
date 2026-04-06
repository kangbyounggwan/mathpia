# Section 4: Supabase Service Implementations

> **Parent Plan**: `planning-func/claude-plan.md` -- Section 4
> **Estimated Effort**: 2-3 days
> **Priority**: CRITICAL

---

## 1. Background

The Mathpia app uses a **service factory pattern** where all data flows through:

```
Screen (UI) --> Store (Zustand) --> Service Interface --> Implementation (Mock or Supabase)
```

Currently, all 5 service interfaces are backed by mock implementations that use in-memory data and AsyncStorage. This section replaces those with real Supabase implementations that query PostgreSQL via the Supabase JS client. Because the stores already call service methods (e.g., `services.assignment.create(data)` in `assignmentStore.ts`), swapping implementations requires **zero changes to store or screen code** -- only the service factory (`src/services/index.ts`) is modified.

The 5 service interfaces that need Supabase implementations are:

| Interface | File | Methods | Key DB Tables |
|-----------|------|---------|--------------|
| `IProblemBankService` | `src/services/interfaces/problemBank.ts` | 10 methods | `problem_bank` |
| `IAssignmentService` | `src/services/interfaces/assignment.ts` | 16 methods | `assignments`, `assignment_problems`, `assignment_students`, `submissions`, `gradings` |
| `IAnalyticsService` | `src/services/interfaces/analytics.ts` | 6 methods | `submissions`, `student_profiles`, `problem_bank` (computed) |
| `IWrongNoteService` | `src/services/interfaces/wrongNote.ts` | 8 methods | `submissions` (where `is_correct = false`), `problem_bank` |
| `IParentService` | `src/services/interfaces/parent.ts` | 4 methods | `parent_children`, `student_profiles`, `assignment_students`, `submissions` |

A critical cross-cutting concern is the **column naming mismatch**: the database uses `snake_case` (e.g., `academy_id`, `created_by`, `source_type`) while TypeScript types use `camelCase` (e.g., `academyId`, `createdBy`, `sourceType`). This section creates a generic bidirectional mapper utility to handle this consistently across all services.

---

## 2. Requirements

1. Implement all 5 service interfaces with Supabase-backed implementations
2. Create a generic bidirectional column mapper utility (`snake_case` <--> `camelCase`)
3. Create a sort field name mapper for `.order()` calls
4. Support the `create_assignment_with_details` RPC for transactional assignment creation
5. Include `isCorrect` in grading data for wrong-note auto-generation
6. Compute analytics client-side from submissions data (matching mock behavior)
7. Auto-generate wrong notes from incorrect submissions (`is_correct = false`)
8. Query child data via the `parent_children` table for the parent service
9. Modify the service factory to toggle between mock and Supabase via `USE_SUPABASE`
10. Maintain full backward compatibility with all existing store method signatures

---

## 3. Dependencies

### Requires (must be completed before starting)

| Section | What is needed | Why |
|---------|---------------|-----|
| **Section 2** (Supabase Client Integration) | `src/lib/supabase.ts` singleton, `src/lib/database.types.ts` generated types | All services import the typed Supabase client |
| **Section 3** (Auth Migration) | Working Supabase Auth, `auth.uid()` returning real user IDs | RLS policies on every table use `auth.uid()` to filter data; without real auth, all queries return empty or fail |

### Blocks (cannot start until this section is complete)

| Section | Why it depends on this section |
|---------|-------------------------------|
| **Section 5** (Gemini Extraction) | Needs `supabaseProblemBankService.bulkCreate()` to save extracted problems |
| **Section 6** (Screen-Store Connection) | Screens fetch data from stores, which call services; real data only exists after Supabase services are wired |
| **Section 7** (Assignment Creation) | Uses `supabaseAssignmentService.create()` with the RPC function |
| **Section 8** (Problem Solving) | Uses `supabaseAssignmentService.submitAnswer()` to persist submissions |
| **Section 9** (Grading Flow) | Uses `supabaseAssignmentService.gradeSubmission()` to create gradings |
| **Section 10** (Testing & Polish) | Cannot test end-to-end without real services |

---

## 4. Implementation Details

### 4.1 Generic Bidirectional Column Mapper Utility (`mappers.ts`)

The database uses `snake_case` column names while TypeScript types use `camelCase`. Rather than writing manual field-by-field mapping for every entity (error-prone, tedious), create a generic utility.

**File**: `src/services/supabase/mappers.ts`

```typescript
// ============================================================
// src/services/supabase/mappers.ts
//
// Generic bidirectional column mapper utility (snake_case <-> camelCase)
// and sort field name mapping for Supabase .order() calls.
// ============================================================

/**
 * Convert a snake_case string to camelCase.
 * Examples: 'academy_id' -> 'academyId', 'created_at' -> 'createdAt'
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert a camelCase string to snake_case.
 * Examples: 'academyId' -> 'academy_id', 'createdAt' -> 'created_at'
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert all keys of an object from snake_case to camelCase (shallow).
 * Use for mapping a single DB row to a TypeScript object.
 *
 * @param obj - A database row with snake_case keys
 * @returns A new object with camelCase keys
 */
export function mapRowToCamel<T extends Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value;
  }
  return result as T;
}

/**
 * Convert all keys of an object from camelCase to snake_case (shallow).
 * Use for mapping a TypeScript object to a DB insert/update payload.
 *
 * @param obj - A TypeScript object with camelCase keys
 * @returns A new object with snake_case keys
 */
export function mapRowToSnake(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}

/**
 * Convert an array of DB rows to camelCase objects.
 */
export function mapRowsToCamel<T extends Record<string, unknown>>(
  rows: Record<string, unknown>[]
): T[] {
  return rows.map((row) => mapRowToCamel<T>(row));
}
```

**Why generic instead of per-entity?** With 18+ database tables and 5+ TypeScript entity types, writing individual mapper functions for each entity leads to duplicated code and bugs from missed fields. The generic mapper handles all current and future entities automatically. Per-entity mappers are only needed when fields require transformation beyond key renaming (e.g., `Date` conversion, JSON parsing).

### 4.2 Sort Field Name Mapper

The `ProblemBankSortField` type uses camelCase (e.g., `createdAt`, `usageCount`, `correctRate`) but the Supabase `.order()` method expects the actual snake_case column name. A dedicated lookup provides explicit control over which fields are sortable.

**Added to**: `src/services/supabase/mappers.ts`

```typescript
/**
 * Explicit sort field mapping (camelCase -> snake_case).
 *
 * Only fields listed here are valid sort targets. This prevents
 * arbitrary column access and documents the supported sort options.
 */
export const sortFieldMap: Record<string, string> = {
  // ProblemBankSortField values
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  usageCount: 'usage_count',
  correctRate: 'correct_rate',
  difficulty: 'difficulty',
  grade: 'grade',

  // Assignment sort fields
  dueDate: 'due_date',
  publishedAt: 'published_at',
  title: 'title',
  status: 'status',

  // Submission sort fields
  submittedAt: 'submitted_at',
  score: 'score',
  timeSpentSeconds: 'time_spent_seconds',

  // General
  sourceType: 'source_type',
  subject: 'subject',
  topic: 'topic',
};

/**
 * Resolve a camelCase sort field to its snake_case DB column name.
 * Falls back to camelToSnake conversion if not in the explicit map.
 */
export function resolveSortField(field: string): string {
  return sortFieldMap[field] || camelToSnake(field);
}
```

### 4.3 `supabaseProblemBankService.ts` -- Full Implementation

**File**: `src/services/supabase/supabaseProblemBankService.ts`

This implements all 10 methods of `IProblemBankService`.

**Key considerations**:
- The `ProblemBankItem` type has `correctRate?: number` but the DB schema (`problem_bank` table) does not have a `correct_rate` column. The `updateCorrectRate` method will need to either (a) add this column to the DB in Section 1, or (b) compute it from submission data. For the demo, we add the column to the migration and note it as a schema addition.
- `choices` is stored as `JSONB` in the DB but as `string[] | null` in TypeScript. Supabase JS client handles this serialization automatically.
- `tags` and `image_urls` are `TEXT[]` (PostgreSQL arrays). Supabase JS handles these natively.

```typescript
// ============================================================
// src/services/supabase/supabaseProblemBankService.ts
// ============================================================

import { supabase } from '../../lib/supabase';
import type { IProblemBankService } from '../interfaces/problemBank';
import type {
  ProblemBankItem,
  ProblemBankItemCreate,
  ProblemBankItemUpdate,
  ProblemBankFilter,
  ProblemBankSortOption,
  PaginatedResult,
} from '../../types/problemBank';
import { mapRowToCamel, mapRowToSnake, mapRowsToCamel, resolveSortField } from './mappers';

// ── Per-entity mappers (handle fields needing transformation beyond key rename) ──

/**
 * Map a DB row from `problem_bank` to the TypeScript `ProblemBankItem` type.
 * The generic mapper handles key renaming; this adds Date conversion.
 */
function mapDbToProblemBankItem(row: Record<string, unknown>): ProblemBankItem {
  const item = mapRowToCamel<ProblemBankItem>(row);
  // Dates come as ISO strings from Supabase; keep as-is if using string dates
  // (see Section 2 note on Date vs ISO string)
  return item;
}

/**
 * Map a ProblemBankItemCreate to a DB insert payload.
 * Strips fields that should not be sent (id, usageCount, etc. are auto-generated).
 */
function mapCreateToDb(data: ProblemBankItemCreate): Record<string, unknown> {
  return {
    academy_id: data.academyId,
    created_by: data.createdBy,
    content: data.content,
    content_html: data.contentHtml,
    image_urls: data.imageUrls,
    answer: data.answer,
    solution: data.solution,
    difficulty: data.difficulty,
    type: data.type,
    choices: data.choices,
    grade: data.grade,
    subject: data.subject,
    topic: data.topic,
    tags: data.tags,
    source: data.source,
    source_type: data.sourceType,
    points: data.points,
  };
}

/**
 * Map a ProblemBankItemUpdate to a DB update payload.
 * Only includes fields that are present (not undefined).
 */
function mapUpdateToDb(data: ProblemBankItemUpdate): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (data.content !== undefined) result.content = data.content;
  if (data.contentHtml !== undefined) result.content_html = data.contentHtml;
  if (data.imageUrls !== undefined) result.image_urls = data.imageUrls;
  if (data.answer !== undefined) result.answer = data.answer;
  if (data.solution !== undefined) result.solution = data.solution;
  if (data.difficulty !== undefined) result.difficulty = data.difficulty;
  if (data.type !== undefined) result.type = data.type;
  if (data.choices !== undefined) result.choices = data.choices;
  if (data.grade !== undefined) result.grade = data.grade;
  if (data.subject !== undefined) result.subject = data.subject;
  if (data.topic !== undefined) result.topic = data.topic;
  if (data.tags !== undefined) result.tags = data.tags;
  if (data.source !== undefined) result.source = data.source;
  if (data.sourceType !== undefined) result.source_type = data.sourceType;
  if (data.points !== undefined) result.points = data.points;
  return result;
}

// ── Service implementation ──

export const supabaseProblemBankService: IProblemBankService = {

  async getById(id: string): Promise<ProblemBankItem | null> {
    const { data, error } = await supabase
      .from('problem_bank')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapDbToProblemBankItem(data as Record<string, unknown>);
  },

  async list(
    filter?: ProblemBankFilter,
    sort?: ProblemBankSortOption,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<PaginatedResult<ProblemBankItem>> {
    let query = supabase
      .from('problem_bank')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filter?.grade) query = query.eq('grade', filter.grade);
    if (filter?.subject) query = query.eq('subject', filter.subject);
    if (filter?.difficulty) query = query.eq('difficulty', filter.difficulty);
    if (filter?.type) query = query.eq('type', filter.type);
    if (filter?.topic) query = query.eq('topic', filter.topic);
    if (filter?.sourceType) query = query.eq('source_type', filter.sourceType);
    if (filter?.searchQuery) {
      query = query.ilike('content', `%${filter.searchQuery}%`);
    }
    if (filter?.tags && filter.tags.length > 0) {
      query = query.overlaps('tags', filter.tags);
    }

    // Apply sort -- map camelCase field names to snake_case DB column names
    const sortColumn = sort?.field
      ? resolveSortField(sort.field)
      : 'created_at';
    const ascending = sort?.direction === 'asc';
    query = query.order(sortColumn, { ascending });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(`문제 목록 조회 실패: ${error.message}`);

    return {
      items: (data || []).map((row) =>
        mapDbToProblemBankItem(row as Record<string, unknown>)
      ),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  },

  async create(data: ProblemBankItemCreate): Promise<ProblemBankItem> {
    const { data: row, error } = await supabase
      .from('problem_bank')
      .insert(mapCreateToDb(data))
      .select()
      .single();

    if (error) throw new Error(`문제 생성 실패: ${error.message}`);
    return mapDbToProblemBankItem(row as Record<string, unknown>);
  },

  async update(id: string, data: ProblemBankItemUpdate): Promise<ProblemBankItem> {
    const payload = mapUpdateToDb(data);
    const { data: row, error } = await supabase
      .from('problem_bank')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`문제 수정 실패: ${error.message}`);
    return mapDbToProblemBankItem(row as Record<string, unknown>);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('problem_bank')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`문제 삭제 실패: ${error.message}`);
    return true;
  },

  async search(query: string, limit: number = 20): Promise<ProblemBankItem[]> {
    const { data, error } = await supabase
      .from('problem_bank')
      .select('*')
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`문제 검색 실패: ${error.message}`);
    return (data || []).map((row) =>
      mapDbToProblemBankItem(row as Record<string, unknown>)
    );
  },

  async getByIds(ids: string[]): Promise<ProblemBankItem[]> {
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('problem_bank')
      .select('*')
      .in('id', ids);

    if (error) throw new Error(`문제 일괄 조회 실패: ${error.message}`);
    return (data || []).map((row) =>
      mapDbToProblemBankItem(row as Record<string, unknown>)
    );
  },

  async bulkCreate(items: ProblemBankItemCreate[]): Promise<ProblemBankItem[]> {
    if (items.length === 0) return [];

    const { data, error } = await supabase
      .from('problem_bank')
      .insert(items.map(mapCreateToDb))
      .select();

    if (error) throw new Error(`문제 일괄 생성 실패: ${error.message}`);
    return (data || []).map((row) =>
      mapDbToProblemBankItem(row as Record<string, unknown>)
    );
  },

  async incrementUsageCount(id: string): Promise<void> {
    // Use RPC or raw SQL to atomically increment.
    // Supabase JS does not support `column + 1` natively,
    // so we read-then-write (acceptable for demo; use RPC for production).
    const { data: current, error: readError } = await supabase
      .from('problem_bank')
      .select('usage_count')
      .eq('id', id)
      .single();

    if (readError) throw new Error(`사용 횟수 조회 실패: ${readError.message}`);

    const { error } = await supabase
      .from('problem_bank')
      .update({ usage_count: ((current as Record<string, unknown>)?.usage_count as number ?? 0) + 1 })
      .eq('id', id);

    if (error) throw new Error(`사용 횟수 증가 실패: ${error.message}`);
  },

  async updateCorrectRate(id: string, correctRate: number): Promise<void> {
    // NOTE: correct_rate column must be added to the problem_bank table
    // in Section 1 migration. If not present, this is a no-op for demo.
    const { error } = await supabase
      .from('problem_bank')
      .update({ correct_rate: correctRate })
      .eq('id', id);

    if (error) {
      console.warn(`정답률 업데이트 실패 (correct_rate column may not exist): ${error.message}`);
    }
  },
};
```

### 4.4 `supabaseAssignmentService.ts` -- Full Implementation

**File**: `src/services/supabase/supabaseAssignmentService.ts`

This is the largest service with 16 methods. Key design decisions:

- **`create()`** uses the `create_assignment_with_details` RPC function for transactional creation of assignment + problems + student assignments in a single database call
- **`gradeSubmission()`** includes `isCorrect` in the gradings insert so the `sync_grading_score` trigger can set `submissions.is_correct` for wrong-note auto-generation
- **`submitAnswer()`** uses `upsert` with the unique constraint `(assignment_id, student_id, problem_id)` to allow re-submission before grading

```typescript
// ============================================================
// src/services/supabase/supabaseAssignmentService.ts
// ============================================================

import { supabase } from '../../lib/supabase';
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
import { mapRowToCamel, mapRowsToCamel } from './mappers';

// ── Per-entity mappers ──

function mapDbToAssignment(row: Record<string, unknown>): Assignment {
  // The assignment row from DB has snake_case keys.
  // We also need to compose the `problems` and `assignedStudents` arrays.
  return {
    id: row.id as string,
    academyId: row.academy_id as string,
    teacherId: row.teacher_id as string,
    classId: row.class_id as string | undefined,
    title: row.title as string,
    description: (row.description as string) || '',
    grade: row.grade as Assignment['grade'],
    subject: (row.subject as string) || '',
    dueDate: row.due_date as unknown as Date,
    totalPoints: row.total_points as number | undefined,
    status: row.status as AssignmentStatus,
    problems: [], // populated separately via getProblems()
    assignedStudents: [], // populated separately via getStudentStatuses()
    allowLateSubmission: row.allow_late_submission as boolean | undefined,
    showAnswerAfterDue: row.show_answer_after_due as boolean | undefined,
    createdAt: row.created_at as unknown as Date,
    publishedAt: row.published_at as unknown as Date | undefined,
    updatedAt: row.updated_at as unknown as Date | undefined,
  };
}

function mapDbToSubmission(row: Record<string, unknown>): Submission {
  return {
    id: row.id as string,
    assignmentId: row.assignment_id as string,
    studentId: row.student_id as string,
    problemId: row.problem_id as string,
    answerText: row.answer_text as string | undefined,
    answerImageUrl: row.answer_image_url as string | undefined,
    canvasData: row.canvas_data as Record<string, unknown> | undefined,
    isCorrect: row.is_correct as boolean | undefined,
    score: row.score as number | undefined,
    feedback: row.feedback as string | undefined,
    submittedAt: row.submitted_at as unknown as Date,
    gradedAt: row.graded_at as unknown as Date | undefined,
    timeSpentSeconds: row.time_spent_seconds as number | undefined,
  };
}

function mapDbToGrading(row: Record<string, unknown>): Grading {
  return {
    id: row.id as string,
    submissionId: row.submission_id as string,
    teacherId: row.teacher_id as string,
    score: row.score as number,
    feedback: row.feedback as string | undefined,
    feedbackImageUrl: row.feedback_image_url as string | undefined,
    gradedAt: row.graded_at as unknown as Date,
  };
}

function mapDbToAssignmentProblem(row: Record<string, unknown>): AssignmentProblem {
  return {
    id: row.id as string,
    assignmentId: row.assignment_id as string,
    problemId: row.problem_id as string,
    orderIndex: row.order_index as number,
    points: row.points as number | undefined,
  };
}

function mapDbToAssignmentStudent(row: Record<string, unknown>): AssignmentStudent {
  return {
    assignmentId: row.assignment_id as string,
    studentId: row.student_id as string,
    assignedAt: row.assigned_at as unknown as Date,
    startedAt: row.started_at as unknown as Date | undefined,
    completedAt: row.completed_at as unknown as Date | undefined,
    status: row.status as AssignmentStudent['status'],
    totalScore: row.total_score as number | undefined,
    progressPercent: (row.progress_percent as number) || 0,
  };
}

/**
 * Fetch and attach problems + assigned students to a base assignment.
 * This is called after fetching the assignment row to compose the full object.
 */
async function hydrateAssignment(base: Assignment): Promise<Assignment> {
  // Fetch problems with their content from problem_bank
  const { data: apRows } = await supabase
    .from('assignment_problems')
    .select('*, problem_bank(*)')
    .eq('assignment_id', base.id)
    .order('order_index', { ascending: true });

  const problems: Problem[] = (apRows || []).map((row: Record<string, unknown>) => {
    const pb = row.problem_bank as Record<string, unknown> | null;
    return {
      id: row.problem_id as string,
      content: (pb?.content as string) || '',
      imageUrl: (pb?.image_urls as string[])?.[0],
      answer: pb?.answer as string | undefined,
      points: (row.points as number) || (pb?.points as number) || 10,
    };
  });

  // Fetch assigned student IDs
  const { data: asRows } = await supabase
    .from('assignment_students')
    .select('student_id')
    .eq('assignment_id', base.id);

  const assignedStudents = (asRows || []).map(
    (row: Record<string, unknown>) => row.student_id as string
  );

  return {
    ...base,
    problems,
    assignedStudents,
    totalPoints: problems.reduce((sum, p) => sum + p.points, 0),
  };
}

// ── Service implementation ──

export const supabaseAssignmentService: IAssignmentService = {

  async getById(id: string): Promise<Assignment | null> {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    const base = mapDbToAssignment(data as Record<string, unknown>);
    return hydrateAssignment(base);
  },

  async create(
    data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Assignment> {
    // Use the RPC function for transactional assignment creation.
    // This creates the assignment, assignment_problems, and assignment_students
    // in a single database transaction, preventing orphaned data from partial failures.
    const { data: assignmentId, error } = await supabase.rpc(
      'create_assignment_with_details',
      {
        p_assignment: {
          academy_id: data.academyId,
          teacher_id: data.teacherId,
          title: data.title,
          description: data.description,
          grade: data.grade,
          subject: data.subject,
          due_date: data.dueDate, // ISO string
          status: data.status || 'draft',
        },
        p_problems: (data.problems || []).map((p) => ({
          problem_id: p.id,
          points: p.points || 10,
        })),
        p_student_ids: data.assignedStudents || [],
      }
    );

    if (error) throw new Error(`과제 생성 실패: ${error.message}`);

    // Fetch the complete assignment to return (with hydrated problems/students)
    const created = await this.getById(assignmentId as string);
    if (!created) throw new Error('과제가 생성되었지만 조회에 실패했습니다.');
    return created;
  },

  async update(id: string, data: Partial<Assignment>): Promise<Assignment> {
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.grade !== undefined) payload.grade = data.grade;
    if (data.subject !== undefined) payload.subject = data.subject;
    if (data.dueDate !== undefined) payload.due_date = data.dueDate;
    if (data.status !== undefined) payload.status = data.status;
    if (data.allowLateSubmission !== undefined) payload.allow_late_submission = data.allowLateSubmission;
    if (data.showAnswerAfterDue !== undefined) payload.show_answer_after_due = data.showAnswerAfterDue;

    const { data: row, error } = await supabase
      .from('assignments')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`과제 수정 실패: ${error.message}`);

    const base = mapDbToAssignment(row as Record<string, unknown>);
    return hydrateAssignment(base);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`과제 삭제 실패: ${error.message}`);
    return true;
  },

  async listByTeacher(
    teacherId: string,
    status?: AssignmentStatus
  ): Promise<Assignment[]> {
    let query = supabase
      .from('assignments')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new Error(`과제 목록 조회 실패: ${error.message}`);

    // Hydrate each assignment with problems and students
    const assignments = (data || []).map((row) =>
      mapDbToAssignment(row as Record<string, unknown>)
    );

    return Promise.all(assignments.map(hydrateAssignment));
  },

  async listByStudent(studentId: string): Promise<Assignment[]> {
    // Join through assignment_students to find assignments for this student
    const { data, error } = await supabase
      .from('assignment_students')
      .select('assignment_id, assignments(*)')
      .eq('student_id', studentId);

    if (error) throw new Error(`학생 과제 목록 조회 실패: ${error.message}`);

    const assignments = (data || [])
      .filter((row: Record<string, unknown>) => row.assignments)
      .map((row: Record<string, unknown>) =>
        mapDbToAssignment(row.assignments as Record<string, unknown>)
      );

    return Promise.all(assignments.map(hydrateAssignment));
  },

  async updateStatus(id: string, status: AssignmentStatus): Promise<void> {
    const payload: Record<string, unknown> = { status };
    if (status === 'published') {
      payload.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('assignments')
      .update(payload)
      .eq('id', id);

    if (error) throw new Error(`과제 상태 변경 실패: ${error.message}`);
  },

  async setProblems(
    assignmentId: string,
    problemIds: string[],
    pointsPerProblem?: number[]
  ): Promise<AssignmentProblem[]> {
    // Delete existing problems for this assignment
    await supabase
      .from('assignment_problems')
      .delete()
      .eq('assignment_id', assignmentId);

    // Insert new problems
    const rows = problemIds.map((pid, idx) => ({
      assignment_id: assignmentId,
      problem_id: pid,
      order_index: idx,
      points: pointsPerProblem?.[idx] ?? 10,
    }));

    const { data, error } = await supabase
      .from('assignment_problems')
      .insert(rows)
      .select();

    if (error) throw new Error(`과제 문제 설정 실패: ${error.message}`);
    return (data || []).map((row) =>
      mapDbToAssignmentProblem(row as Record<string, unknown>)
    );
  },

  async getProblems(assignmentId: string): Promise<AssignmentProblem[]> {
    const { data, error } = await supabase
      .from('assignment_problems')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('order_index', { ascending: true });

    if (error) throw new Error(`과제 문제 조회 실패: ${error.message}`);
    return (data || []).map((row) =>
      mapDbToAssignmentProblem(row as Record<string, unknown>)
    );
  },

  async assignStudents(assignmentId: string, studentIds: string[]): Promise<void> {
    const rows = studentIds.map((sid) => ({
      assignment_id: assignmentId,
      student_id: sid,
    }));

    const { error } = await supabase
      .from('assignment_students')
      .upsert(rows, { onConflict: 'assignment_id,student_id' });

    if (error) throw new Error(`학생 배정 실패: ${error.message}`);
  },

  async getStudentStatuses(assignmentId: string): Promise<AssignmentStudent[]> {
    const { data, error } = await supabase
      .from('assignment_students')
      .select('*')
      .eq('assignment_id', assignmentId);

    if (error) throw new Error(`학생 상태 조회 실패: ${error.message}`);
    return (data || []).map((row) =>
      mapDbToAssignmentStudent(row as Record<string, unknown>)
    );
  },

  async getStudentStatus(
    assignmentId: string,
    studentId: string
  ): Promise<AssignmentStudent | null> {
    const { data, error } = await supabase
      .from('assignment_students')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single();

    if (error || !data) return null;
    return mapDbToAssignmentStudent(data as Record<string, unknown>);
  },

  async submitAnswer(
    data: Omit<Submission, 'id' | 'submittedAt'>
  ): Promise<Submission> {
    // Upsert: allows re-submission before grading (unique on assignment+student+problem)
    const { data: row, error } = await supabase
      .from('submissions')
      .upsert(
        {
          assignment_id: data.assignmentId,
          student_id: data.studentId,
          problem_id: data.problemId,
          answer_text: data.answerText,
          answer_image_url: data.answerImageUrl,
          canvas_data: data.canvasData,
          time_spent_seconds: data.timeSpentSeconds,
        },
        { onConflict: 'assignment_id,student_id,problem_id' }
      )
      .select()
      .single();

    if (error) throw new Error(`답안 제출 실패: ${error.message}`);
    // The update_assignment_progress trigger automatically updates progress_percent
    return mapDbToSubmission(row as Record<string, unknown>);
  },

  async getSubmissions(
    assignmentId: string,
    studentId: string
  ): Promise<Submission[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: true });

    if (error) throw new Error(`제출 내역 조회 실패: ${error.message}`);
    return (data || []).map((row) =>
      mapDbToSubmission(row as Record<string, unknown>)
    );
  },

  async getSubmissionsByProblem(
    assignmentId: string,
    problemId: string
  ): Promise<Submission[]> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('problem_id', problemId);

    if (error) throw new Error(`문제별 제출 조회 실패: ${error.message}`);
    return (data || []).map((row) =>
      mapDbToSubmission(row as Record<string, unknown>)
    );
  },

  async gradeSubmission(
    data: Omit<Grading, 'id' | 'gradedAt'>
  ): Promise<Grading> {
    // Insert into gradings table.
    // The sync_grading_score trigger automatically:
    //   1. Updates submissions.score and submissions.is_correct
    //   2. Updates assignment_students.total_score
    //   3. Sets assignment_students.status = 'graded' when ALL problems are graded
    //
    // IMPORTANT: isCorrect is determined by the caller (Section 9 grading flow).
    // The improved sync_grading_score trigger from the plan uses NEW.is_correct
    // to set submissions.is_correct. If the gradings table does not have
    // an is_correct column, the trigger derives it from score > 0.
    const { data: row, error } = await supabase
      .from('gradings')
      .insert({
        submission_id: data.submissionId,
        teacher_id: data.teacherId,
        score: data.score,
        feedback: data.feedback,
        feedback_image_url: data.feedbackImageUrl,
      })
      .select()
      .single();

    if (error) throw new Error(`채점 저장 실패: ${error.message}`);
    return mapDbToGrading(row as Record<string, unknown>);
  },

  async getGrading(submissionId: string): Promise<Grading | null> {
    const { data, error } = await supabase
      .from('gradings')
      .select('*')
      .eq('submission_id', submissionId)
      .order('graded_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return mapDbToGrading(data as Record<string, unknown>);
  },
};
```

**Key implementation notes for `gradeSubmission()`**:

The plan's Section 1 defines an improved `sync_grading_score` trigger that accepts `is_correct` from the gradings insert. However, the existing `DATABASE_SCHEMA.md` gradings table does NOT have an `is_correct` column -- the trigger derives it from `score > 0`. Two options:

1. **Add `is_correct BOOLEAN` column to `gradings` table** (recommended) -- update the Section 1 migration to add this column and use the improved trigger from the plan
2. **Keep current schema** -- the trigger uses `is_correct = (NEW.score > 0)`, which means any non-zero score is "correct". This is acceptable for the demo but less precise (a score of 2/10 would be marked "correct")

The service implementation above works with either approach. If `is_correct` is added to the gradings table, add `is_correct: data.isCorrect` to the insert payload (the `Grading` type in `src/types/index.ts` would also need an `isCorrect` field added).

### 4.5 `supabaseAnalyticsService.ts` -- Client-Side Computation

**File**: `src/services/supabase/supabaseAnalyticsService.ts`

For the demo, analytics are computed client-side from submission data. This matches the mock implementation pattern (see `mockAnalytics.ts`). A server-side approach using PostgreSQL views or Edge Functions is a post-demo enhancement.

```typescript
// ============================================================
// src/services/supabase/supabaseAnalyticsService.ts
// ============================================================

import { supabase } from '../../lib/supabase';
import type { IAnalyticsService } from '../interfaces/analytics';
import type {
  StudentAnalytics,
  WeaknessAnalysis,
  ProblemRecommendation,
  ClassAnalytics,
  LearningReport,
  SubjectScore,
  WeakTopic,
} from '../../types/analytics';

// ── Helpers ──

/** Group submissions by topic and compute per-topic scores. */
function computeSubjectScores(
  submissions: Record<string, unknown>[]
): SubjectScore[] {
  const topicMap = new Map<string, { correct: number; total: number; subject: string }>();

  for (const sub of submissions) {
    const pb = sub.problem_bank as Record<string, unknown> | null;
    if (!pb) continue;

    const topic = (pb.topic as string) || '기타';
    const subject = (pb.subject as string) || '수학';
    const isCorrect = sub.is_correct as boolean;

    const entry = topicMap.get(topic) || { correct: 0, total: 0, subject };
    entry.total += 1;
    if (isCorrect) entry.correct += 1;
    topicMap.set(topic, entry);
  }

  return Array.from(topicMap.entries()).map(([topic, stats]) => ({
    subject: stats.subject,
    topic,
    score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    totalProblems: stats.total,
    correctProblems: stats.correct,
  }));
}

/** Identify weak topics (score < 60%). */
function findWeakTopics(subjectScores: SubjectScore[]): WeakTopic[] {
  return subjectScores
    .filter((s) => s.score < 60)
    .sort((a, b) => a.score - b.score)
    .map((s) => ({
      topic: s.topic || s.subject,
      score: s.score,
      reason: `정답률이 ${s.score}%로 낮습니다. (${s.correctProblems}/${s.totalProblems})`,
      recommendedCount: Math.max(3, Math.ceil((60 - s.score) / 10)),
    }));
}

/** Compute weekly score trends from submission dates. */
function computeWeeklyScores(
  submissions: Record<string, unknown>[]
): { weekLabel: string; score: number }[] {
  const weekMap = new Map<string, { total: number; scored: number }>();

  for (const sub of submissions) {
    if (sub.score == null) continue;
    const date = new Date(sub.submitted_at as string);
    // Week label: "MM/DD" of the Monday of that week
    const monday = new Date(date);
    monday.setDate(date.getDate() - date.getDay() + 1);
    const label = `${monday.getMonth() + 1}/${monday.getDate()}`;

    const entry = weekMap.get(label) || { total: 0, scored: 0 };
    entry.total += 1;
    entry.scored += sub.score as number;
    weekMap.set(label, entry);
  }

  return Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekLabel, stats]) => ({
      weekLabel,
      score: stats.total > 0 ? Math.round(stats.scored / stats.total) : 0,
    }));
}

/** Compute daily solve counts for a heatmap. */
function computeDailySolveCounts(
  submissions: Record<string, unknown>[]
): { date: string; count: number }[] {
  const dayMap = new Map<string, number>();

  for (const sub of submissions) {
    const date = (sub.submitted_at as string).substring(0, 10); // 'YYYY-MM-DD'
    dayMap.set(date, (dayMap.get(date) || 0) + 1);
  }

  return Array.from(dayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

// ── Service implementation ──

export const supabaseAnalyticsService: IAnalyticsService = {

  async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    // Fetch all graded submissions with problem details for this student
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*, problem_bank(*)')
      .eq('student_id', studentId)
      .not('score', 'is', null);

    if (error) throw new Error(`분석 데이터 조회 실패: ${error.message}`);

    const subs = (submissions || []) as Record<string, unknown>[];

    // Fetch student profile for grade info
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('grade, study_streak')
      .eq('id', studentId)
      .single();

    const totalSolved = subs.length;
    const totalCorrect = subs.filter((s) => s.is_correct === true).length;
    const overallScore = totalSolved > 0
      ? Math.round((totalCorrect / totalSolved) * 100)
      : 0;

    const subjectScores = computeSubjectScores(subs);
    const weakTopics = findWeakTopics(subjectScores);
    const strongTopics = subjectScores
      .filter((s) => s.score >= 80)
      .sort((a, b) => b.score - a.score);

    return {
      studentId,
      grade: (profile?.grade as StudentAnalytics['grade']) || '중1',
      overallScore,
      totalSolved,
      totalCorrect,
      streakDays: (profile?.study_streak as number) || 0,
      subjectScores,
      weakTopics,
      strongTopics,
      weeklyScores: computeWeeklyScores(subs),
      dailySolveCounts: computeDailySolveCounts(subs),
      lastAnalyzedAt: new Date(),
      submissionCountSinceLastAnalysis: 0,
    };
  },

  async refreshStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    // For the demo, refresh just re-computes (no caching layer)
    return this.getStudentAnalytics(studentId);
  },

  async analyzeWeakness(studentId: string): Promise<WeaknessAnalysis> {
    const analytics = await this.getStudentAnalytics(studentId);

    return {
      studentId,
      analyzedAt: new Date(),
      weakTopics: analytics.weakTopics,
      errorPatterns: [], // AI-powered analysis (post-demo enhancement)
      recommendations: analytics.weakTopics.map(
        (t) => `${t.topic} 관련 문제를 ${t.recommendedCount}문제 더 풀어보세요.`
      ),
    };
  },

  async recommendProblems(
    studentId: string,
    limit: number = 5
  ): Promise<ProblemRecommendation[]> {
    const analytics = await this.getStudentAnalytics(studentId);

    if (analytics.weakTopics.length === 0) return [];

    // Find problems in weak topic areas
    const weakTopicNames = analytics.weakTopics.map((t) => t.topic);
    const { data: problems } = await supabase
      .from('problem_bank')
      .select('id, topic, difficulty')
      .in('topic', weakTopicNames)
      .limit(limit);

    return (problems || []).map((p: Record<string, unknown>) => {
      const weakTopic = analytics.weakTopics.find(
        (t) => t.topic === (p.topic as string)
      );
      return {
        problemId: p.id as string,
        reason: `${p.topic} 영역의 취약점 보완`,
        targetWeakTopic: (p.topic as string) || '',
        expectedDifficulty: weakTopic && weakTopic.score < 30
          ? 'easy' as const
          : 'appropriate' as const,
      };
    });
  },

  async generateLearningReport(studentId: string): Promise<LearningReport> {
    const analytics = await this.getStudentAnalytics(studentId);

    return {
      studentId,
      generatedAt: new Date(),
      radarData: analytics.subjectScores.map((s) => ({
        label: s.topic || s.subject,
        value: s.score,
      })),
      timelineData: analytics.weeklyScores.map((w) => ({
        date: w.weekLabel,
        score: w.score,
      })),
      heatmapData: analytics.dailySolveCounts.map((d) => ({
        x: d.date,
        y: 'solve',
        value: d.count,
      })),
      aiSummary: `전체 정답률 ${analytics.overallScore}%. ` +
        `총 ${analytics.totalSolved}문제 풀이, ${analytics.totalCorrect}문제 정답.`,
      strengths: analytics.strongTopics.map(
        (s) => `${s.topic || s.subject}: ${s.score}% 정답률`
      ),
      weaknesses: analytics.weakTopics.map(
        (w) => `${w.topic}: ${w.score}% 정답률`
      ),
      advice: analytics.weakTopics.map(
        (w) => `${w.topic} 유형 문제 ${w.recommendedCount}개 추가 학습 권장`
      ),
    };
  },

  async getClassAnalytics(
    teacherId: string,
    classId?: string
  ): Promise<ClassAnalytics> {
    // Get students assigned to this teacher
    let studentQuery = supabase
      .from('teacher_students')
      .select('student_id')
      .eq('teacher_id', teacherId);

    // If classId is provided, filter by class
    if (classId) {
      const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId);

      const classStudentIds = (classStudents || []).map(
        (r: Record<string, unknown>) => r.student_id as string
      );

      if (classStudentIds.length === 0) {
        return {
          classId,
          studentCount: 0,
          averageScore: 0,
          weakTopicDistribution: [],
          topPerformers: [],
          strugglingStudents: [],
        };
      }

      // Fetch analytics for each student in the class
      const studentAnalytics = await Promise.all(
        classStudentIds.map((sid) => this.getStudentAnalytics(sid))
      );

      const avgScore = studentAnalytics.length > 0
        ? Math.round(
            studentAnalytics.reduce((sum, a) => sum + a.overallScore, 0) /
            studentAnalytics.length
          )
        : 0;

      return {
        classId,
        studentCount: classStudentIds.length,
        averageScore: avgScore,
        weakTopicDistribution: [], // Simplified for demo
        topPerformers: [],
        strugglingStudents: [],
      };
    }

    // Default: all students for teacher
    const { data: tsRows } = await studentQuery;
    const studentIds = (tsRows || []).map(
      (r: Record<string, unknown>) => r.student_id as string
    );

    return {
      classId: undefined,
      studentCount: studentIds.length,
      averageScore: 0, // Would need per-student computation
      weakTopicDistribution: [],
      topPerformers: [],
      strugglingStudents: [],
    };
  },
};
```

### 4.6 `supabaseWrongNoteService.ts` -- Auto-Generated from Incorrect Submissions

**File**: `src/services/supabase/supabaseWrongNoteService.ts`

Wrong notes are **not stored in a dedicated table** for the demo. Instead, they are auto-generated by querying submissions where `is_correct = false`, joined with `problem_bank` for problem details. This is the simplest approach and avoids an additional migration.

```typescript
// ============================================================
// src/services/supabase/supabaseWrongNoteService.ts
//
// Wrong notes are auto-generated from incorrect submissions.
// No dedicated wrong_notes table is needed for the demo.
// ============================================================

import { supabase } from '../../lib/supabase';
import type { IWrongNoteService } from '../interfaces/wrongNote';
import type {
  WrongNote,
  WrongNoteFilter,
  WrongNoteStats,
  WrongNoteStatus,
  ReviewAttempt,
} from '../../types/wrongNote';
import type { ProblemBankItem } from '../../types/problemBank';
import { mapRowToCamel } from './mappers';

// ── Helpers ──

/**
 * Map an incorrect submission (joined with problem_bank) to a WrongNote.
 * The submission row has: id, assignment_id, student_id, problem_id,
 * answer_text, score, is_correct, submitted_at, problem_bank(*)
 */
function mapSubmissionToWrongNote(row: Record<string, unknown>): WrongNote {
  const pb = row.problem_bank as Record<string, unknown> | null;

  const problem: ProblemBankItem = pb
    ? (mapRowToCamel<ProblemBankItem>(pb))
    : ({
        id: row.problem_id as string,
        academyId: '',
        createdBy: '',
        content: '(문제 정보를 불러올 수 없습니다)',
        imageUrls: [],
        difficulty: '중',
        type: '단답형',
        grade: '중1',
        subject: '수학',
        topic: '',
        tags: [],
        sourceType: 'manual',
        points: 10,
        usageCount: 0,
        createdAt: new Date(),
      } as ProblemBankItem);

  return {
    id: row.id as string,
    studentId: row.student_id as string,
    problemId: row.problem_id as string,
    assignmentId: row.assignment_id as string,
    studentAnswer: (row.answer_text as string) || '',
    correctAnswer: (pb?.answer as string) || '',
    problem,
    status: 'unreviewed' as WrongNoteStatus,
    reviewCount: 0,
    consecutiveCorrect: 0,
    lastReviewDate: undefined,
    isLearned: false,
    aiExplanation: undefined,
    createdAt: new Date(row.submitted_at as string),
    updatedAt: undefined,
  };
}

// ── Service implementation ──

export const supabaseWrongNoteService: IWrongNoteService = {

  async getById(id: string): Promise<WrongNote | null> {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, problem_bank(*)')
      .eq('id', id)
      .eq('is_correct', false)
      .single();

    if (error || !data) return null;
    return mapSubmissionToWrongNote(data as Record<string, unknown>);
  },

  async create(
    data: Omit<WrongNote, 'id' | 'status' | 'reviewCount' | 'consecutiveCorrect' | 'isLearned' | 'createdAt' | 'updatedAt'>
  ): Promise<WrongNote> {
    // Wrong notes are auto-generated from incorrect submissions.
    // This method is a no-op for the Supabase implementation --
    // wrong notes appear automatically when a submission is graded as incorrect.
    // Return a synthetic WrongNote from the existing submission data.
    const { data: existing } = await supabase
      .from('submissions')
      .select('*, problem_bank(*)')
      .eq('assignment_id', data.assignmentId)
      .eq('student_id', data.studentId)
      .eq('problem_id', data.problemId)
      .single();

    if (existing) {
      return mapSubmissionToWrongNote(existing as Record<string, unknown>);
    }

    // Fallback: return a synthetic wrong note
    return {
      ...data,
      id: `wn-${Date.now()}`,
      status: 'unreviewed',
      reviewCount: 0,
      consecutiveCorrect: 0,
      isLearned: false,
      createdAt: new Date(),
    };
  },

  async delete(id: string): Promise<boolean> {
    // Since wrong notes are derived from submissions, "deleting" a wrong note
    // means marking the submission as reviewed/mastered. For the demo, this is a no-op.
    console.warn('Wrong note delete is a no-op in Supabase implementation');
    return true;
  },

  async listByStudent(
    studentId: string,
    filter?: WrongNoteFilter
  ): Promise<WrongNote[]> {
    let query = supabase
      .from('submissions')
      .select('*, problem_bank(*)')
      .eq('student_id', studentId)
      .eq('is_correct', false)
      .order('submitted_at', { ascending: false });

    // Apply filters on the joined problem_bank data (client-side for demo)
    const { data, error } = await query;
    if (error) throw new Error(`오답노트 조회 실패: ${error.message}`);

    let wrongNotes = (data || []).map((row) =>
      mapSubmissionToWrongNote(row as Record<string, unknown>)
    );

    // Client-side filtering (since we cannot filter on joined fields in Supabase)
    if (filter?.subject) {
      wrongNotes = wrongNotes.filter((wn) => wn.problem.subject === filter.subject);
    }
    if (filter?.topic) {
      wrongNotes = wrongNotes.filter((wn) => wn.problem.topic === filter.topic);
    }
    if (filter?.fromDate) {
      const from = new Date(filter.fromDate);
      wrongNotes = wrongNotes.filter((wn) => new Date(wn.createdAt) >= from);
    }
    if (filter?.toDate) {
      const to = new Date(filter.toDate);
      wrongNotes = wrongNotes.filter((wn) => new Date(wn.createdAt) <= to);
    }

    return wrongNotes;
  },

  async getStats(studentId: string): Promise<WrongNoteStats> {
    const { count: totalCount, error } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('is_correct', false);

    if (error) throw new Error(`오답노트 통계 조회 실패: ${error.message}`);

    const total = totalCount || 0;

    // For the demo, all wrong notes are "unreviewed" since we have no
    // dedicated review tracking. A real implementation would use a
    // wrong_note_reviews table.
    return {
      total,
      unreviewed: total,
      reviewing: 0,
      mastered: 0,
      masteryRate: 0,
    };
  },

  async recordReview(attempt: ReviewAttempt): Promise<WrongNote> {
    // For the demo, review tracking is simplified.
    // A full implementation would insert into a wrong_note_reviews table
    // and update the review count, consecutive correct count, etc.
    const wrongNote = await this.getById(attempt.wrongNoteId);
    if (!wrongNote) {
      throw new Error('오답노트를 찾을 수 없습니다.');
    }

    // Return the existing wrong note with updated review info (in-memory only for demo)
    return {
      ...wrongNote,
      reviewCount: wrongNote.reviewCount + 1,
      consecutiveCorrect: attempt.isCorrect
        ? wrongNote.consecutiveCorrect + 1
        : 0,
      lastReviewDate: attempt.reviewedAt,
      isLearned: attempt.isCorrect && wrongNote.consecutiveCorrect + 1 >= 3,
      status: attempt.isCorrect && wrongNote.consecutiveCorrect + 1 >= 3
        ? 'mastered'
        : 'reviewing',
    };
  },

  async getDueForReview(
    studentId: string,
    limit: number = 10
  ): Promise<WrongNote[]> {
    // Return the oldest incorrect submissions (prioritize by date)
    const allWrong = await this.listByStudent(studentId);
    return allWrong.slice(0, limit);
  },

  async getAiExplanation(wrongNoteId: string): Promise<string> {
    // Post-demo: call Gemini to generate an explanation
    // For now, return a placeholder
    const wrongNote = await this.getById(wrongNoteId);
    if (!wrongNote) return '오답노트를 찾을 수 없습니다.';

    return `이 문제는 "${wrongNote.problem.topic}" 유형의 문제입니다. ` +
      `정답은 "${wrongNote.correctAnswer}"이며, ` +
      `학생의 답변은 "${wrongNote.studentAnswer}"입니다. ` +
      `(AI 풀이 해설은 추후 Gemini 연동 시 제공됩니다.)`;
  },
};
```

### 4.7 `supabaseParentService.ts` -- Using `parent_children` Table

**File**: `src/services/supabase/supabaseParentService.ts`

The parent service queries child data via the `parent_children` junction table. This table is populated during seeding (Section 1) and links parent profile IDs to student profile IDs.

```typescript
// ============================================================
// src/services/supabase/supabaseParentService.ts
// ============================================================

import { supabase } from '../../lib/supabase';
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
import { supabaseAnalyticsService } from './supabaseAnalyticsService';

// ── Helpers ──

/** Get child IDs for a parent from the parent_children table. */
async function getChildIds(parentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('parent_children')
    .select('child_id')
    .eq('parent_id', parentId);

  if (error) throw new Error(`자녀 정보 조회 실패: ${error.message}`);
  return (data || []).map((row: Record<string, unknown>) => row.child_id as string);
}

/** Build a ChildLearningStats object from student profile and submission data. */
async function buildChildStats(childId: string): Promise<ChildLearningStats> {
  // Get student profile stats
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('total_problems_solved, average_score, study_streak')
    .eq('id', childId)
    .single();

  // Get assignment completion counts
  const { data: assignments } = await supabase
    .from('assignment_students')
    .select('status')
    .eq('student_id', childId);

  const total = (assignments || []).length;
  const completed = (assignments || []).filter(
    (a: Record<string, unknown>) =>
      a.status === 'submitted' || a.status === 'graded'
  ).length;

  // Get graded submissions for correct rate
  const { data: gradedSubs } = await supabase
    .from('submissions')
    .select('is_correct')
    .eq('student_id', childId)
    .not('score', 'is', null);

  const gradedCount = (gradedSubs || []).length;
  const correctCount = (gradedSubs || []).filter(
    (s: Record<string, unknown>) => s.is_correct === true
  ).length;

  return {
    totalSolved: (profile?.total_problems_solved as number) || 0,
    correctRate: gradedCount > 0 ? Math.round((correctCount / gradedCount) * 100) : 0,
    studyStreakDays: (profile?.study_streak as number) || 0,
    weeklyStudyMinutes: 0, // Would need study_logs aggregation (post-demo)
    assignmentsCompleted: completed,
    assignmentsTotal: total,
  };
}

/** Build a User object from a profile row. */
function mapProfileToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    academyId: row.academy_id as string,
    role: row.role as User['role'],
    name: row.name as string,
    email: '', // Not stored in profiles; from auth.users
    phone: (row.phone as string) || '',
    grade: row.grade as User['grade'],
    profileImage: row.avatar_url as string | undefined,
    isActive: row.is_active as boolean | undefined,
    createdAt: row.created_at as unknown as Date,
    updatedAt: row.updated_at as unknown as Date | undefined,
  };
}

// ── Service implementation ──

export const supabaseParentService: IParentService = {

  async getChildDashboard(
    parentId: string,
    childId: string
  ): Promise<ChildDashboard> {
    // Verify parent-child relationship
    const { data: rel, error: relError } = await supabase
      .from('parent_children')
      .select('child_id')
      .eq('parent_id', parentId)
      .eq('child_id', childId)
      .single();

    if (relError || !rel) {
      throw new Error('해당 자녀의 정보를 조회할 권한이 없습니다.');
    }

    // Fetch child profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, student_profiles(*)')
      .eq('id', childId)
      .single();

    if (profileError || !profile) {
      throw new Error('자녀 프로필을 찾을 수 없습니다.');
    }

    const child = mapProfileToUser(profile as Record<string, unknown>);
    if (profile.student_profiles) {
      child.grade = (profile.student_profiles as Record<string, unknown>).grade as User['grade'];
    }

    // Build stats
    const stats = await buildChildStats(childId);

    // Fetch recent assignments
    const { data: recentAssignmentData } = await supabase
      .from('assignment_students')
      .select('*, assignments(*)')
      .eq('student_id', childId)
      .order('assigned_at', { ascending: false })
      .limit(5);

    const recentAssignments = (recentAssignmentData || []).map(
      (row: Record<string, unknown>) => {
        const a = row.assignments as Record<string, unknown>;
        return {
          id: a.id as string,
          academyId: a.academy_id as string,
          teacherId: a.teacher_id as string,
          title: a.title as string,
          description: (a.description as string) || '',
          grade: a.grade as Assignment['grade'],
          subject: (a.subject as string) || '',
          dueDate: a.due_date as unknown as Date,
          status: a.status as Assignment['status'],
          problems: [],
          assignedStudents: [],
          createdAt: a.created_at as unknown as Date,
          studentStatus: {
            assignmentId: row.assignment_id as string,
            studentId: childId,
            assignedAt: row.assigned_at as unknown as Date,
            status: row.status as AssignmentStudent['status'],
            totalScore: row.total_score as number | undefined,
            progressPercent: (row.progress_percent as number) || 0,
          } as AssignmentStudent,
        };
      }
    );

    // Get weakness analysis
    const analytics = await supabaseAnalyticsService.getStudentAnalytics(childId);

    return {
      child,
      stats,
      recentAssignments,
      weakTopics: analytics.weakTopics,
      aiAdvice: analytics.weakTopics.length > 0
        ? `${analytics.weakTopics[0].topic} 영역에 집중 학습이 필요합니다. ` +
          `현재 정답률 ${analytics.weakTopics[0].score}%입니다.`
        : '전반적으로 잘하고 있습니다. 현재 학습 페이스를 유지해주세요.',
    };
  },

  async getAllChildDashboards(parentId: string): Promise<ChildDashboard[]> {
    const childIds = await getChildIds(parentId);
    return Promise.all(
      childIds.map((childId) => this.getChildDashboard(parentId, childId))
    );
  },

  async getChildSchedule(childId: string): Promise<ChildSchedule> {
    // Get class enrollments with schedule data
    const { data: enrollments } = await supabase
      .from('class_students')
      .select('classes(*, profiles!teacher_id(name))')
      .eq('student_id', childId)
      .eq('status', 'active');

    const weeklyClasses: ClassScheduleEntry[] = [];
    for (const enrollment of (enrollments || [])) {
      const cls = (enrollment as Record<string, unknown>).classes as Record<string, unknown>;
      if (!cls) continue;

      const schedule = cls.schedule as Record<string, { start: string; end: string }> | null;
      if (!schedule) continue;

      const teacherProfile = cls.profiles as Record<string, unknown> | null;
      const teacherName = (teacherProfile?.name as string) || '';

      for (const [day, times] of Object.entries(schedule)) {
        weeklyClasses.push({
          dayOfWeek: day as ClassScheduleEntry['dayOfWeek'],
          startTime: times.start,
          endTime: times.end,
          className: cls.name as string,
          teacherName,
          subject: (cls.subject as string) || '수학',
        });
      }
    }

    // Get upcoming assignment deadlines
    const { data: upcomingAssignments } = await supabase
      .from('assignment_students')
      .select('assignment_id, status, progress_percent, assignments(title, due_date, subject)')
      .eq('student_id', childId)
      .in('status', ['assigned', 'in_progress']);

    const upcomingDeadlines: UpcomingDeadline[] = (upcomingAssignments || []).map(
      (row: Record<string, unknown>) => {
        const a = row.assignments as Record<string, unknown>;
        const status = row.status as string;
        return {
          assignmentId: row.assignment_id as string,
          title: (a?.title as string) || '',
          dueDate: a?.due_date as unknown as Date,
          subject: (a?.subject as string) || '수학',
          progressPercent: (row.progress_percent as number) || 0,
          status: status === 'assigned'
            ? 'not_started' as const
            : status === 'in_progress'
              ? 'in_progress' as const
              : 'submitted' as const,
        };
      }
    );

    return {
      childId,
      weeklyClasses,
      upcomingDeadlines,
    };
  },

  async getChildReport(childId: string): Promise<ParentLearningReport> {
    // Get child's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, student_profiles(grade)')
      .eq('id', childId)
      .single();

    // Generate learning report via analytics service
    const report = await supabaseAnalyticsService.generateLearningReport(childId);
    const analytics = await supabaseAnalyticsService.getStudentAnalytics(childId);

    return {
      childId,
      childName: (profile?.name as string) || '',
      grade: ((profile?.student_profiles as Record<string, unknown>)?.grade as ParentLearningReport['grade']) || '중1',
      report,
      topSubjects: analytics.strongTopics,
      worstTopics: analytics.weakTopics,
    };
  },
};
```

### 4.8 Service Factory Switch (mock --> supabase with `USE_SUPABASE` toggle)

**File to modify**: `src/services/index.ts`

The factory is modified to conditionally load Supabase or mock implementations based on the presence of the `EXPO_PUBLIC_SUPABASE_URL` environment variable.

```typescript
// ============================================================
// src/services/index.ts
// Service factory -- central access point for all data services.
//
// Toggle between Mock and Supabase backends via USE_SUPABASE.
// ============================================================

import type { IProblemBankService } from './interfaces/problemBank';
import type { IAssignmentService } from './interfaces/assignment';
import type { IAnalyticsService } from './interfaces/analytics';
import type { IWrongNoteService } from './interfaces/wrongNote';
import type { IParentService } from './interfaces/parent';

import {
  mockProblemBankService,
  mockAssignmentService,
  mockAnalyticsService,
  mockWrongNoteService,
  mockParentService,
} from './mock';

import {
  supabaseProblemBankService,
  supabaseAssignmentService,
  supabaseAnalyticsService,
  supabaseWrongNoteService,
  supabaseParentService,
} from './supabase';

export interface Services {
  problemBank: IProblemBankService;
  assignment: IAssignmentService;
  analytics: IAnalyticsService;
  wrongNote: IWrongNoteService;
  parent: IParentService;
}

/**
 * USE_SUPABASE toggle:
 * - true  if EXPO_PUBLIC_SUPABASE_URL is set (Supabase services)
 * - false if not set (mock services for offline dev / testing)
 *
 * This allows developing/testing without Supabase connectivity
 * and enables a gradual migration (mix of mock and real services).
 */
const USE_SUPABASE = !!process.env.EXPO_PUBLIC_SUPABASE_URL;

const services: Services = USE_SUPABASE
  ? {
      problemBank: supabaseProblemBankService,
      assignment: supabaseAssignmentService,
      analytics: supabaseAnalyticsService,
      wrongNote: supabaseWrongNoteService,
      parent: supabaseParentService,
    }
  : {
      problemBank: mockProblemBankService,
      assignment: mockAssignmentService,
      analytics: mockAnalyticsService,
      wrongNote: mockWrongNoteService,
      parent: mockParentService,
    };

export default services;
```

**Barrel export file**: `src/services/supabase/index.ts`

```typescript
// ============================================================
// src/services/supabase/index.ts
// ============================================================

export { supabaseProblemBankService } from './supabaseProblemBankService';
export { supabaseAssignmentService } from './supabaseAssignmentService';
export { supabaseAnalyticsService } from './supabaseAnalyticsService';
export { supabaseWrongNoteService } from './supabaseWrongNoteService';
export { supabaseParentService } from './supabaseParentService';
```

**1-Week Minimum Viable Demo shortcut**: If time is short, implement only `supabaseProblemBankService` and `supabaseAssignmentService` (the two critical services), and leave the other three on mock:

```typescript
const services: Services = {
  problemBank: USE_SUPABASE ? supabaseProblemBankService : mockProblemBankService,
  assignment: USE_SUPABASE ? supabaseAssignmentService : mockAssignmentService,
  analytics: mockAnalyticsService,         // MOCK for 1-week demo
  wrongNote: mockWrongNoteService,         // MOCK for 1-week demo
  parent: mockParentService,               // MOCK for 1-week demo
};
```

---

## 5. Files to Create/Modify

### New Files (8 files)

| File | Description |
|------|-------------|
| `src/services/supabase/mappers.ts` | Generic bidirectional column mapper (snake/camel), sort field mapper |
| `src/services/supabase/supabaseProblemBankService.ts` | `IProblemBankService` implementation (10 methods) |
| `src/services/supabase/supabaseAssignmentService.ts` | `IAssignmentService` implementation (16 methods) |
| `src/services/supabase/supabaseAnalyticsService.ts` | `IAnalyticsService` implementation (6 methods, client-side computation) |
| `src/services/supabase/supabaseWrongNoteService.ts` | `IWrongNoteService` implementation (8 methods, auto-generated from submissions) |
| `src/services/supabase/supabaseParentService.ts` | `IParentService` implementation (4 methods, via `parent_children` table) |
| `src/services/supabase/supabaseClient.ts` | Re-export of `supabase` client + any Supabase-specific helpers (optional) |
| `src/services/supabase/index.ts` | Barrel export for all Supabase service instances |

### Modified Files (1 file)

| File | Change Description |
|------|-------------------|
| `src/services/index.ts` | Add `USE_SUPABASE` toggle; import Supabase services; conditionally switch factory |

### Unchanged Files (kept as fallback)

| File | Why unchanged |
|------|--------------|
| `src/services/interfaces/*` | All 5 interfaces remain exactly the same |
| `src/services/mock/*` | Kept as fallback; used when `EXPO_PUBLIC_SUPABASE_URL` is not set |
| `src/stores/*` | All 7 stores remain unchanged; they call `services.X.method()` which now hits Supabase |

### Schema Additions (coordinate with Section 1)

| Table | Change | Reason |
|-------|--------|--------|
| `problem_bank` | Add `correct_rate DECIMAL(5,2)` column | `ProblemBankItem.correctRate` exists in TypeScript but not in DB schema |
| `gradings` | (Optional) Add `is_correct BOOLEAN` column | Enables explicit `isCorrect` in grading for more precise wrong-note generation; if omitted, trigger uses `score > 0` |

---

## 6. Acceptance Criteria

### Core Service Functionality

- [ ] All 5 Supabase service implementations exist and compile without TypeScript errors
- [ ] Each service correctly maps between DB `snake_case` and TypeScript `camelCase` using the generic mapper utility
- [ ] Sort field name mapper correctly translates camelCase field names (e.g., `createdAt` --> `created_at`) for `.order()` calls
- [ ] `mappers.ts` includes working `snakeToCamel()`, `camelToSnake()`, `mapRowToCamel()`, `mapRowToSnake()`, and `resolveSortField()` functions

### Service Factory

- [ ] `src/services/index.ts` can be toggled between mock and Supabase via `EXPO_PUBLIC_SUPABASE_URL`
- [ ] With `USE_SUPABASE = true`, all services point to Supabase implementations
- [ ] With `USE_SUPABASE = false`, all services fall back to mock implementations
- [ ] Mixed mode works (e.g., real problemBank + mock analytics) for 1-week demo shortcut

### Problem Bank Service

- [ ] `problemBankStore.fetchProblems()` returns real data from the `problem_bank` table
- [ ] Filters (grade, subject, difficulty, type, topic, tags, searchQuery) work correctly
- [ ] Pagination returns correct `total`, `hasMore`, `page`, and `pageSize`
- [ ] `bulkCreate()` inserts multiple problems in a single call
- [ ] `search()` uses `ilike` for case-insensitive Korean text search

### Assignment Service

- [ ] `assignmentStore.createAssignment()` uses the `create_assignment_with_details` RPC (single transaction)
- [ ] Created assignments have hydrated `problems` and `assignedStudents` arrays
- [ ] `listByStudent()` returns only assignments assigned to that student (via `assignment_students` join)
- [ ] `listByTeacher()` returns all assignments created by that teacher

### Submission & Grading

- [ ] `submissionStore.submitAnswer()` creates a real row in the `submissions` table
- [ ] Re-submission (before grading) works via `upsert` on the unique constraint
- [ ] The `update_assignment_progress` trigger correctly updates `progress_percent` after each submission
- [ ] `submissionStore.gradeSubmission()` creates a `gradings` row
- [ ] The `sync_grading_score` trigger syncs score to `submissions.score` and `submissions.is_correct`
- [ ] `assignment_students.status` is set to `'graded'` only when ALL problems for that student-assignment pair are graded

### Analytics Service

- [ ] `getStudentAnalytics()` computes correct `overallScore`, `totalSolved`, `totalCorrect` from real submission data
- [ ] `computeSubjectScores()` correctly groups by topic and computes per-topic accuracy
- [ ] `findWeakTopics()` identifies topics with accuracy below 60%

### Wrong Note Service

- [ ] `listByStudent()` returns submissions where `is_correct = false` with joined problem data
- [ ] `getStats()` returns correct total count of incorrect submissions
- [ ] Client-side filtering by subject, topic, and date range works

### Parent Service

- [ ] `getChildDashboard()` verifies the parent-child relationship via `parent_children` table
- [ ] `getAllChildDashboards()` returns dashboards for all linked children
- [ ] `getChildSchedule()` returns class schedule from the `classes.schedule` JSONB field

### RLS Policy Compliance

- [ ] A student can only see their own submissions (not other students')
- [ ] A teacher can see submissions only for their own assignments
- [ ] A parent can only see data for their linked children (via `parent_children`)
- [ ] An unauthenticated request returns empty results (not errors)

---

## 7. Estimated Effort

**2-3 days total** (each service takes approximately 3-4 hours)

| Task | Effort | Priority |
|------|--------|----------|
| `mappers.ts` (generic mapper + sort mapper) | 1-2 hours | Day 1 |
| `supabaseProblemBankService.ts` (10 methods) | 3-4 hours | Day 1 |
| `supabaseAssignmentService.ts` (16 methods, largest) | 4-5 hours | Day 1-2 |
| `supabaseAnalyticsService.ts` (6 methods, computation) | 3 hours | Day 2 |
| `supabaseWrongNoteService.ts` (8 methods, derived from submissions) | 2-3 hours | Day 2 |
| `supabaseParentService.ts` (4 methods, via parent_children) | 2-3 hours | Day 2-3 |
| Service factory update + barrel exports | 30 minutes | Day 3 |
| Integration testing with stores | 2-3 hours | Day 3 |

**1-week minimum path**: Implement only `mappers.ts`, `supabaseProblemBankService.ts`, and `supabaseAssignmentService.ts` (Days 3-5 of the overall timeline). Keep analytics, wrong notes, and parent on mock. Estimated: 1.5 days.
