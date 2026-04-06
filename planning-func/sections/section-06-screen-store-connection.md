# Section 6: Screen-Store Connection + Dashboard Data Integration (All Roles)

> **Merged from**: Original Sections 6 (Screen-Store Connection) and 10 (Dashboard Data Integration)
> **Estimated Effort**: 2 days
> **Priority**: HIGH

---

## 1. Background

Currently, almost every screen in the Mathpia app renders hardcoded mock data defined directly inside the component file. For example:

- **Teacher Dashboard** (`app/(teacher)/index.tsx` lines 62-73): `const stats = { totalStudents: 24, pendingAssignments: 5, ... }` and `const recentSubmissions = [{ id: '1', studentName: '김철수', ... }]` are literal objects.
- **Student Dashboard** (`app/(student)/index.tsx` lines 29-57): `const mockHomework: HomeworkItem[] = [...]` with 3 hardcoded homework items, plus hardcoded stats `value="45"`, `value="7일"`, `value="92%"` and hardcoded academy info `수학왕 학원`, `다음 수업 오늘 오후 4:00`.
- **Teacher Assignments** (`app/(teacher)/assignments.tsx` lines 24-69): `const mockAssignments: Assignment[] = [...]` with 4 hardcoded items.
- **Teacher Grading** (`app/(teacher)/grading.tsx` lines 22-28): `const mockSubmissions: Submission[] = [...]` with 5 hardcoded items.
- **Teacher Students** (`app/(teacher)/students.tsx` lines 24-30): `const mockStudents: Student[] = [...]` with 5 hardcoded items.
- **Student Homework** (`app/(student)/homework.tsx` lines 20-57): `const mockAssignments: Assignment[] = [...]` with 4 hardcoded items.
- **Parent Dashboard** (`app/(parent)/index.tsx` lines 37-89): `FALLBACK_CHILDREN`, `FALLBACK_STATS`, `FALLBACK_HOMEWORK`, `FALLBACK_WEAK_TOPICS`, `FALLBACK_AI_ADVICE` -- all hardcoded.
- **Parent Schedule** (`app/(parent)/schedule.tsx` lines 35-143): `MOCK_CHILDREN`, `MOCK_CLASSES`, `MOCK_DEADLINES`, `MOCK_GRADING_NOTIFICATIONS` -- all hardcoded.
- **Parent Report** (`app/(parent)/report.tsx` lines 39-95): `MOCK_CHILDREN`, `MOCK_RADAR_DATA`, `MOCK_TIMELINE_DATA`, `MOCK_WRONG_ANALYSIS`, `MOCK_AI_DIAGNOSIS` -- all hardcoded.

Meanwhile, the Zustand stores (`assignmentStore`, `submissionStore`, `problemBankStore`, `analyticsStore`, `wrongNoteStore`, `parentStore`) already have full CRUD methods that call service interfaces. After Sections 3 and 4 (Auth + Supabase Services), these stores return real data.

**Two screens are already well-connected:**
- **Teacher Problem Bank** (`app/(teacher)/problem-bank.tsx`): Already imports `useProblemBankStore` and calls `store.fetchProblems()` on mount. No hardcoded mock data.
- **Student Wrong Notes** (`app/(student)/wrong-notes.tsx`): Already imports `useWrongNoteStore` and calls `fetchByStudent(user.id)` on mount.
- **Student Analytics** (`app/(student)/analytics.tsx`): Already imports `useAnalyticsStore` and calls `fetchStudentAnalytics(studentId)` on mount.
- **Teacher Student Analytics** (`app/(teacher)/student-analytics.tsx`): Already imports `useAnalyticsStore`.

This section bridges the gap: remove ALL remaining hardcoded mock data from screen components, replace it with data fetched from stores, and connect every dashboard to display live, store-driven data.

---

## 2. Requirements

1. **Remove all hardcoded mock data** from every screen component body (no `const mock...`, no `FALLBACK_...`, no `MOCK_...` inside screens).
2. **Connect each screen to its relevant Zustand store(s)** using the standard pattern: `useEffect` fetch on mount, `useMemo` for computed values.
3. **Add loading states** (spinner or skeleton) for every screen while data is being fetched.
4. **Add empty states** for every list screen when there is no data (using the existing `<EmptyState>` component).
5. **Add error states** that display user-friendly Korean messages when data fetching fails.
6. **Dashboard cards must show real computed values**, not placeholder numbers.
7. **Parent screens must query child data via the `parent_children` table** relationship, not via hardcoded child IDs.
8. **Store hydration guard**: Screens that depend on persisted store data must check `persist.hasHydrated()` before rendering, to avoid showing empty lists during the brief async rehydration period after app restart.

---

## 3. Dependencies

### Requires

| Section | What it provides |
|---------|-----------------|
| **Section 3** (Auth Migration) | `authStore.user` with real `id`, `role`, `academyId` -- needed for every fetch call |
| **Section 4** (Supabase Services) | Stores return real data from Supabase instead of mock data |

### Blocks

| Section | Why it depends on this |
|---------|----------------------|
| **Section 7** (Assignment Creation) | Relies on `assignments.tsx` being wired to the store, not mock data |
| **Section 8** (Problem Solving + Submission) | Relies on `homework.tsx` displaying real assignment list from store |
| **Section 9** (Grading Flow) | Relies on `grading.tsx` displaying real submissions from store |
| **Section 10** (Testing & Polish) | Full end-to-end flow requires all screens displaying real data |

---

## 4. Implementation Details

### 4.1 Standard Pattern: Connecting a Screen to a Store

Every screen migration follows this same three-step pattern:

**Step A: Import store hooks and add useEffect to fetch on mount**

```typescript
import { useAuthStore } from '../../src/stores/authStore';
import { useAssignmentStore } from '../../src/stores/assignmentStore';

export default function SomeScreen() {
  const { user } = useAuthStore();
  const { assignments, isLoading, error, fetchAssignments } = useAssignmentStore();

  useEffect(() => {
    if (user?.id) {
      fetchAssignments(user.id);
    }
  }, [user?.id]);
```

**Step B: Replace hardcoded data with useMemo computed values**

```typescript
  const stats = useMemo(() => ({
    activeAssignments: assignments.filter(a => a.status === 'published').length,
    pendingGradings: submissions.filter(s => s.score === null || s.score === undefined).length,
  }), [assignments, submissions]);
```

**Step C: Add loading, empty, and error states**

```typescript
  if (isLoading) {
    return <SkeletonLoader variant="card" count={3} />;
  }

  if (error) {
    return (
      <EmptyState
        icon="alert-circle-outline"
        title="데이터를 불러올 수 없습니다"
        description={error}
        actionLabel="다시 시도"
        onAction={() => fetchAssignments(user.id)}
      />
    );
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon="clipboard-text-off-outline"
        title="숙제가 없습니다"
        description="새 숙제를 만들어 학생들에게 배정하세요"
      />
    );
  }
```

### 4.2 Store Hydration Guard

Zustand persist middleware rehydrates from AsyncStorage asynchronously. During this brief window (typically <100ms), the store state is in its initial empty state. Screens that render lists from persisted stores should check hydration status:

```typescript
const hasHydrated = useAssignmentStore.persist.hasHydrated();

if (!hasHydrated) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
```

This guard should be applied to screens where data is expected to be available immediately from cache (e.g., dashboards, homework list), not to screens where a fresh fetch is always triggered.

### 4.3 Teacher Dashboard: `app/(teacher)/index.tsx`

**Remove (lines 61-73):**
```typescript
const stats = { totalStudents: 24, pendingAssignments: 5, submissionsToGrade: 12, todayClasses: 3 };
const recentSubmissions = [
  { id: '1', studentName: '김철수', assignment: '이차방정식 연습', time: '10분 전' },
  ...
];
```

**Replace with:**

```typescript
import { useAssignmentStore } from '../../src/stores/assignmentStore';
import { useSubmissionStore } from '../../src/stores/submissionStore';
import { supabase } from '../../src/lib/supabase';

const { user } = useAuthStore();
const { assignments, fetchAssignments, isLoading: assignmentsLoading } = useAssignmentStore();
const { submissions } = useSubmissionStore();
const [studentCount, setStudentCount] = useState(0);
const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
const [dashboardLoading, setDashboardLoading] = useState(true);

useEffect(() => {
  if (!user?.id) return;

  const loadDashboard = async () => {
    setDashboardLoading(true);
    try {
      // Fetch assignments for this teacher
      await fetchAssignments(user.id);

      // Fetch student count for this academy
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('academy_id', user.academyId)
        .eq('role', 'student');
      setStudentCount(count ?? 0);

      // Fetch recent submissions for this teacher's assignments
      const { data: recentSubs } = await supabase
        .from('submissions')
        .select('id, submitted_at, profiles!student_id(name), assignments!assignment_id(title)')
        .order('submitted_at', { ascending: false })
        .limit(5);

      if (recentSubs) {
        setRecentSubmissions(recentSubs.map(s => ({
          id: s.id,
          studentName: s.profiles?.name ?? '학생',
          assignment: s.assignments?.title ?? '과제',
          time: formatRelativeTime(s.submitted_at),
        })));
      }
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setDashboardLoading(false);
    }
  };

  loadDashboard();
}, [user?.id]);

const stats = useMemo(() => ({
  totalStudents: studentCount,
  pendingAssignments: assignments.filter(a => a.status === 'published').length,
  submissionsToGrade: submissions.filter(s => s.score === null || s.score === undefined).length,
  todayClasses: 0, // from schedule data or leave as 0 for demo
}), [assignments, submissions, studentCount]);
```

Also add a `formatRelativeTime` utility (or import from a shared utils file):

```typescript
function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}
```

### 4.4 Student Dashboard: `app/(student)/index.tsx`

**Remove (lines 29-57):**
```typescript
const mockHomework: HomeworkItem[] = [...]
```
**Also remove hardcoded stat values (lines 184, 192, 198):**
```typescript
value="45"   // hardcoded completed problems
value="7일"  // hardcoded streak
value="92%"  // hardcoded average score
```
**Also remove hardcoded academy info (lines 234-265):**
```typescript
<Text>수학왕 학원</Text>
<Text>강남점</Text>
<Text>오늘 오후 4:00</Text>
```

**Replace with:**

```typescript
import { useAssignmentStore } from '../../src/stores/assignmentStore';
import { useSubmissionStore } from '../../src/stores/submissionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';

const { user } = useAuthStore();
const { assignments, fetchStudentAssignments, isLoading } = useAssignmentStore();
const [studentProfile, setStudentProfile] = useState<StudentProfileData | null>(null);
const [academyInfo, setAcademyInfo] = useState<AcademyInfo | null>(null);

useEffect(() => {
  if (!user?.id) return;

  fetchStudentAssignments(user.id);

  // Fetch student profile stats
  const loadProfile = async () => {
    const { data } = await supabase
      .from('student_profiles')
      .select('total_problems_solved, average_score, study_streak')
      .eq('id', user.id)
      .single();
    if (data) setStudentProfile(data);
  };

  // Fetch academy info
  const loadAcademy = async () => {
    const { data } = await supabase
      .from('academies')
      .select('name, address')
      .eq('id', user.academyId)
      .single();
    if (data) setAcademyInfo(data);
  };

  loadProfile();
  loadAcademy();
}, [user?.id]);

// Map assignments to HomeworkItem format
const homeworkItems: HomeworkItem[] = useMemo(() =>
  assignments.map(a => ({
    id: a.id,
    title: a.title,
    subject: a.subject,
    dueDate: formatDueDate(a.dueDate),
    problemCount: a.problems?.length ?? 0,
    completedCount: a.progressPercent
      ? Math.round((a.progressPercent / 100) * (a.problems?.length ?? 0))
      : 0,
    isUrgent: isUrgent(a.dueDate),
  })),
  [assignments]
);

// Real stats
const completedProblems = studentProfile?.total_problems_solved ?? 0;
const averageScore = studentProfile?.average_score ?? 0;
const streakDays = studentProfile?.study_streak ?? 0;
```

Then in the JSX, replace `mockHomework` references with `homeworkItems`, and replace hardcoded stat values:
- `value="45"` -> `value={String(completedProblems)}`
- `value="7일"` -> `value={`${streakDays}일`}`
- `value="92%"` -> `value={`${Math.round(averageScore)}%`}`
- `수학왕 학원` -> `{academyInfo?.name ?? '학원'}`

### 4.5 Teacher Assignments: `app/(teacher)/assignments.tsx`

**Remove (lines 24-69):**
```typescript
const mockAssignments: Assignment[] = [...]
```

**Replace with:**

```typescript
import { useAssignmentStore } from '../../src/stores/assignmentStore';
import { useAuthStore } from '../../src/stores/authStore';

const { user } = useAuthStore();
const { assignments, fetchAssignments, isLoading } = useAssignmentStore();

useEffect(() => {
  if (user?.id) {
    fetchAssignments(user.id);
  }
}, [user?.id]);

// Map store assignments to local Assignment interface
const mappedAssignments = useMemo(() =>
  assignments.map(a => ({
    id: a.id,
    title: a.title,
    grade: a.grade,
    subject: a.subject,
    dueDate: a.dueDate,
    problemCount: a.problems?.length ?? 0,
    submittedCount: a.submittedCount ?? 0,
    totalStudents: a.assignedStudents?.length ?? 0,
    status: mapAssignmentStatus(a.status),
  })),
  [assignments]
);

const filteredAssignments = mappedAssignments.filter(
  (a) => filter === 'all' || a.status === filter
);
```

Remove the fake `setTimeout` loading simulation (lines 76-79) and use the store's real `isLoading` state.

### 4.6 Teacher Grading: `app/(teacher)/grading.tsx`

**Remove (lines 22-28):**
```typescript
const mockSubmissions: Submission[] = [...]
```

**Replace with:**

```typescript
import { useSubmissionStore } from '../../src/stores/submissionStore';
import { useAuthStore } from '../../src/stores/authStore';

const { user } = useAuthStore();
const { submissions, isLoading, fetchByAssignment } = useSubmissionStore();

// Fetch all ungraded submissions for this teacher's assignments
useEffect(() => {
  if (user?.id) {
    loadUngradedSubmissions(user.id);
  }
}, [user?.id]);

const loadUngradedSubmissions = async (teacherId: string) => {
  // Query submissions for teacher's assignments that are ungraded
  const { data } = await supabase
    .from('submissions')
    .select(`
      id, submitted_at, score,
      profiles!student_id(name),
      assignments!assignment_id(title, teacher_id),
      problem_bank!problem_id(id)
    `)
    .is('score', null)
    .order('submitted_at', { ascending: false });

  // Filter to only this teacher's assignments and map to UI format
  // ...
};
```

### 4.7 Teacher Students: `app/(teacher)/students.tsx`

**Remove (lines 24-30):**
```typescript
const mockStudents: Student[] = [...]
```

**Replace with:**

```typescript
import { useAuthStore } from '../../src/stores/authStore';
import { supabase } from '../../src/lib/supabase';

const { user } = useAuthStore();
const [students, setStudents] = useState<Student[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  if (!user?.academyId) return;

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, phone, student_profiles(grade)')
        .eq('academy_id', user.academyId)
        .eq('role', 'student');

      if (data) {
        // Also fetch assignment completion stats per student
        const studentList = data.map(d => ({
          id: d.id,
          name: d.name,
          grade: d.student_profiles?.grade ?? '고1',
          email: d.email,
          phone: d.phone ?? '',
          completedAssignments: 0, // computed below
          totalAssignments: 0,
        }));
        setStudents(studentList);
      }
    } finally {
      setIsLoading(false);
    }
  };

  loadStudents();
}, [user?.academyId]);
```

Remove the fake `setTimeout` loading simulation (lines 38-41).

### 4.8 Teacher Problem Bank: `app/(teacher)/problem-bank.tsx`

This screen is **already connected** to `useProblemBankStore`. No changes needed for mock data removal. However, ensure that `store.fetchProblems()` respects the current user's `academyId` for scoping, and that loading/empty states are properly handled (they already are).

### 4.9 Student Homework: `app/(student)/homework.tsx`

**Remove (lines 20-57):**
```typescript
const mockAssignments: Assignment[] = [...]
```

**Replace with:**

```typescript
import { useAssignmentStore } from '../../src/stores/assignmentStore';
import { useAuthStore } from '../../src/stores/authStore';

const { user } = useAuthStore();
const { assignments, fetchStudentAssignments, isLoading } = useAssignmentStore();

useEffect(() => {
  if (user?.id) {
    fetchStudentAssignments(user.id);
  }
}, [user?.id]);

// Map store assignments to the local Assignment interface
const mappedAssignments = useMemo(() =>
  assignments.map(a => ({
    id: a.id,
    title: a.title,
    subject: a.subject,
    dueDate: a.dueDate,
    problemCount: a.problems?.length ?? 0,
    completedCount: Math.round((a.progressPercent ?? 0) / 100 * (a.problems?.length ?? 0)),
    status: mapStudentAssignmentStatus(a.studentStatus),
  })),
  [assignments]
);

const filteredAssignments = mappedAssignments.filter(
  (a) => filter === 'all' || a.status === filter
);
```

### 4.10 Student Wrong Notes: `app/(student)/wrong-notes.tsx`

This screen is **already connected** to `useWrongNoteStore`. It already calls `fetchByStudent(user.id)` and `fetchStats(user.id)` on mount and has proper loading/empty states. No changes needed.

### 4.11 Student Analytics: `app/(student)/analytics.tsx`

This screen is **already connected** to `useAnalyticsStore`. It already calls `fetchStudentAnalytics(studentId)` on mount and has proper loading/error/empty states. No changes needed.

### 4.12 Parent Dashboard: `app/(parent)/index.tsx`

**Remove (lines 37-89):** All `FALLBACK_*` constants:
```typescript
const FALLBACK_CHILDREN = [...]
const FALLBACK_STATS = { totalSolved: 45, correctRate: 82, ... }
const FALLBACK_HOMEWORK = [...]
const FALLBACK_WEAK_TOPICS = [...]
const FALLBACK_AI_ADVICE = '...'
```

**Replace with:**

```typescript
import { useParentStore } from '../../src/stores/parentStore';
import { useAuthStore } from '../../src/stores/authStore';

const { user } = useAuthStore();
const {
  childDashboards,
  selectedChildId: storeSelectedChildId,
  isLoading,
  fetchAllDashboards,
  selectChild,
} = useParentStore();

useEffect(() => {
  if (user?.id) {
    fetchAllDashboards(user.id);
  }
}, [user?.id]);

// Derive children list from store data
const childrenList = useMemo(() =>
  childDashboards.map(d => ({
    id: d.child.id,
    name: d.child.name,
    grade: d.child.grade,
  })),
  [childDashboards]
);

// Get selected child's dashboard data
const selectedDashboard = useMemo(() =>
  childDashboards.find(d => d.child.id === selectedChildId) ?? null,
  [childDashboards, selectedChildId]
);

const stats = useMemo(() => {
  if (!selectedDashboard) return null;
  return {
    totalSolved: selectedDashboard.stats.totalSolved,
    correctRate: selectedDashboard.stats.correctRate,
    studyDays: selectedDashboard.stats.studyDays,
    weeklyGoalProgress: selectedDashboard.stats.weeklyGoalProgress,
    totalGoal: selectedDashboard.stats.totalGoal,
    streakDays: selectedDashboard.stats.streakDays,
    assignmentsCompleted: selectedDashboard.stats.assignmentsCompleted,
    assignmentsTotal: selectedDashboard.stats.assignmentsTotal,
  };
}, [selectedDashboard]);
```

The parent store's `fetchAllDashboards()` calls `services.parent.getAllChildDashboards(parentId)`, which internally queries the `parent_children` table to find children associated with this parent, then aggregates their data from `student_profiles`, `assignment_students`, and `submissions`.

### 4.13 Parent Schedule: `app/(parent)/schedule.tsx`

**Remove (lines 35-143):** All `MOCK_*` constants:
```typescript
const MOCK_CHILDREN = [...]
const MOCK_CLASSES = [...]
const MOCK_DEADLINES: Deadline[] = [...]
const MOCK_GRADING_NOTIFICATIONS: GradingNotification[] = [...]
```

**Replace with:**

```typescript
import { useParentStore } from '../../src/stores/parentStore';
import { useAuthStore } from '../../src/stores/authStore';

const { user } = useAuthStore();
const { childDashboards, schedule, fetchSchedule, isLoading } = useParentStore();

useEffect(() => {
  if (selectedChildId) {
    fetchSchedule(selectedChildId);
  }
}, [selectedChildId]);

// Derive classes, deadlines, and grading notifications from schedule data
const classes = schedule?.classes ?? [];
const deadlines = schedule?.upcomingDeadlines ?? [];
const gradingNotifications = schedule?.recentGradings ?? [];
```

### 4.14 Parent Report: `app/(parent)/report.tsx`

**Remove (lines 39-95):** All `MOCK_*` constants:
```typescript
const MOCK_CHILDREN = [...]
const MOCK_RADAR_DATA = [...]
const MOCK_TIMELINE_DATA = [...]
const MOCK_WRONG_ANALYSIS = [...]
const MOCK_AI_DIAGNOSIS = { strengths: [...], weaknesses: [...], ... }
```

**Replace with:**

```typescript
import { useParentStore } from '../../src/stores/parentStore';
import { useAuthStore } from '../../src/stores/authStore';

const { user } = useAuthStore();
const { childDashboards, report, fetchReport, isLoading } = useParentStore();

useEffect(() => {
  if (selectedChildId) {
    fetchReport(selectedChildId);
  }
}, [selectedChildId]);

// Derive chart data from report
const radarData = report?.subjectScores ?? [];
const timelineData = report?.weeklyScores ?? [];
const wrongAnalysis = report?.wrongAnalysis ?? [];
const aiDiagnosis = report?.aiDiagnosis ?? null;
```

### 4.15 Dashboard Data: Supabase Queries

For dashboard-specific data that does not fit neatly into a single store, use direct Supabase queries within `useEffect`. Key queries:

**Teacher: Recent Submissions (5 most recent)**
```typescript
const { data } = await supabase
  .from('submissions')
  .select('id, submitted_at, profiles!student_id(name), assignments!assignment_id(title)')
  .order('submitted_at', { ascending: false })
  .limit(5);
```

**Teacher: Student Count**
```typescript
const { count } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true })
  .eq('academy_id', user.academyId)
  .eq('role', 'student');
```

**Teacher: Pending Grading Count**
```typescript
const { count } = await supabase
  .from('submissions')
  .select('*', { count: 'exact', head: true })
  .is('score', null)
  .in('assignment_id', teacherAssignmentIds);
```

**Student: Profile Stats**
```typescript
const { data } = await supabase
  .from('student_profiles')
  .select('total_problems_solved, average_score, study_streak')
  .eq('id', user.id)
  .single();
```

**Parent: Child List via parent_children**
```typescript
const { data } = await supabase
  .from('parent_children')
  .select('child_id, profiles!child_id(id, name, student_profiles(grade))')
  .eq('parent_id', user.id);
```

### 4.16 Loading States and Empty States

Every screen must implement:

**Loading state** -- use `SkeletonLoader` (already available) or `ActivityIndicator`:
```typescript
if (isLoading && items.length === 0) {
  return <SkeletonLoader variant="card" height={120} count={3} gap={spacing.md} />;
}
```

**Empty state** -- use the existing `<EmptyState>` component:
```typescript
if (!isLoading && items.length === 0) {
  return (
    <EmptyState
      icon="clipboard-text-off-outline"
      title="데이터가 없습니다"
      description="새로운 데이터가 생기면 여기에 표시됩니다"
    />
  );
}
```

**Error state:**
```typescript
if (error) {
  return (
    <EmptyState
      icon="alert-circle-outline"
      title="오류가 발생했습니다"
      description={error}
      actionLabel="다시 시도"
      onAction={handleRetry}
    />
  );
}
```

---

## 5. Files to Create/Modify

### Files to Modify (11 screens)

| # | File | Store(s) to Connect | Current Issue |
|---|------|---------------------|---------------|
| 1 | `app/(teacher)/index.tsx` | assignmentStore, submissionStore, supabase direct | Lines 62-73: `stats` and `recentSubmissions` hardcoded |
| 2 | `app/(teacher)/assignments.tsx` | assignmentStore | Lines 24-69: `mockAssignments` hardcoded |
| 3 | `app/(teacher)/grading.tsx` | submissionStore, supabase direct | Lines 22-28: `mockSubmissions` hardcoded |
| 4 | `app/(teacher)/students.tsx` | supabase direct (profiles query) | Lines 24-30: `mockStudents` hardcoded |
| 5 | `app/(student)/index.tsx` | assignmentStore, supabase direct | Lines 29-57: `mockHomework` + lines 184-265: hardcoded stats and academy info |
| 6 | `app/(student)/homework.tsx` | assignmentStore | Lines 20-57: `mockAssignments` hardcoded |
| 7 | `app/(parent)/index.tsx` | parentStore | Lines 37-89: all `FALLBACK_*` constants |
| 8 | `app/(parent)/schedule.tsx` | parentStore | Lines 35-143: all `MOCK_*` constants |
| 9 | `app/(parent)/report.tsx` | parentStore | Lines 39-95: all `MOCK_*` constants |

### Files Already Connected (no changes needed)

| # | File | Store | Notes |
|---|------|-------|-------|
| 10 | `app/(teacher)/problem-bank.tsx` | problemBankStore | Already fetches on mount, has loading/empty states |
| 11 | `app/(student)/wrong-notes.tsx` | wrongNoteStore | Already fetches on mount, has loading/empty states |
| 12 | `app/(student)/analytics.tsx` | analyticsStore | Already fetches on mount, has loading/error/empty states |
| 13 | `app/(teacher)/student-analytics.tsx` | analyticsStore | Already fetches on mount |

### Utility Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/utils/formatDate.ts` | **Create** | `formatRelativeTime(isoString)` and `formatDueDate(isoString)` utilities for display formatting |
| `src/utils/index.ts` | **Modify** | Export new date formatting utilities |

---

## 6. Acceptance Criteria

- [ ] **Zero hardcoded mock data remains** in any screen component body (no `const mock...`, `FALLBACK_...`, or `MOCK_...` inside screens)
- [ ] Every screen fetches data from stores or Supabase on mount (using `user.id` or `user.academyId` from `authStore`)
- [ ] Store hydration guard is present on screens that read persisted data immediately
- [ ] **Teacher Dashboard** shows real counts: student count, active assignments, pending gradings
- [ ] **Teacher Dashboard** shows real "최근 제출" (recent submissions) with student names and relative times
- [ ] **Teacher Assignments** shows real assignment list from store with correct status, problem counts, and submission rates
- [ ] **Teacher Grading** shows real ungraded submissions from store
- [ ] **Teacher Students** shows real student list from profiles table, scoped to the teacher's academy
- [ ] **Student Dashboard** shows real homework items mapped from assignment store
- [ ] **Student Dashboard** stats (완료 문제, 연속 학습, 평균 점수) come from `student_profiles` table
- [ ] **Student Dashboard** academy info comes from `academies` table
- [ ] **Student Homework** shows real assignment list with real progress percentages
- [ ] **Parent Dashboard** shows real child data fetched via `parent_children` table
- [ ] **Parent Schedule** shows real class schedule and upcoming deadlines for selected child
- [ ] **Parent Report** shows real chart data, wrong-answer analysis, and AI diagnosis for selected child
- [ ] Loading indicators (skeleton or spinner) display while data is being fetched on every screen
- [ ] Empty states display when lists have no items
- [ ] Error states display with Korean messages when fetch fails, with retry option
- [ ] All dashboard numbers update in real time after mutations (creating assignments, submitting answers, grading)

---

## 7. Estimated Effort

**2 days** (approximately 14-16 hours total)

| Task | Time |
|------|------|
| Teacher Dashboard connection + Supabase queries | 3 hours |
| Student Dashboard connection + stats/academy queries | 3 hours |
| Teacher Assignments, Grading, Students screens | 3 hours |
| Student Homework screen | 1 hour |
| Parent Dashboard, Schedule, Report screens | 3 hours |
| Date formatting utilities | 0.5 hours |
| Loading/empty/error states audit across all screens | 1 hour |
| Integration testing (verify all screens render real data) | 1.5 hours |

The 4 already-connected screens (problem-bank, wrong-notes, analytics, student-analytics) need no work, saving approximately half a day compared to connecting all 13 screens from scratch.
