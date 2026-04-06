# Section 03: Zustand Stores

## 배경 및 목적

이 섹션은 Mathpia 앱의 **상태 관리 레이어**를 구현한다. 기존 `authStore.ts` 하나로 관리되던 전역 상태를 확장하여, 문제은행/숙제/제출/분석/오답노트/학부모 도메인별로 독립된 Zustand 스토어를 생성한다.

모든 스토어는 `zustand/middleware`의 `persist`를 사용하여 `AsyncStorage`에 데이터를 영속화하며, 각 스토어는 Section 02에서 구현한 Mock 서비스(서비스 팩토리)를 통해 데이터를 조회/저장한다.

**핵심 설계 원칙**:
- 스토어는 UI 컴포넌트와 서비스 레이어 사이의 **중간 캐시** 역할
- 스토어 간 직접 import를 최소화하여 순환 의존 방지
- `submissionStore` -> `wrongNoteStore` 연동은 **subscribe 콜백** 패턴으로 구현
- `analyticsStore`의 AI 분석 결과는 **캐싱 전략**으로 불필요한 API 호출 방지

---

## 의존성

| 의존 섹션 | 사용하는 것 |
|-----------|------------|
| **Section 01** (Types & Interfaces) | `UserRole`, `ProblemBankItem`, `Assignment`, `Submission`, `StudentAnalytics`, `WeaknessAnalysis`, `WrongNote`, `ChildDashboard`, `Schedule`, `LearningReport`, 모든 서비스 인터페이스 |
| **Section 02** (Mock Data & Services) | `services` 팩토리 객체 (`src/services/index.ts`), 각 Mock 서비스의 메서드 |

> **중요**: Section 01, 02가 완료된 후에 이 섹션을 구현해야 한다.

---

## 필수 패키지

`package.json`에 이미 설치된 패키지:
- `zustand` (^5.0.9) -- 이미 설치됨

추가 설치 필요:
```bash
npx expo install @react-native-async-storage/async-storage
```

> Zustand v5의 persist 미들웨어는 `zustand/middleware`에서 import한다.
> AsyncStorage는 persist의 `storage` 옵션에 커스텀 어댑터로 제공한다.

---

## 파일 목록

| 파일 경로 | 작업 | 설명 |
|-----------|------|------|
| `src/stores/authStore.ts` | **수정** | parent 역할 추가, Mock 학부모 계정 추가, persist 미들웨어 적용 |
| `src/stores/problemBankStore.ts` | **신규 생성** | 문제은행 CRUD, 검색, 필터 |
| `src/stores/assignmentStore.ts` | **신규 생성** | 숙제 CRUD, 문제 연결, 상태 관리 |
| `src/stores/submissionStore.ts` | **신규 생성** | 제출/채점, 오답 연동 트리거 |
| `src/stores/analyticsStore.ts` | **신규 생성** | AI 학습 분석, 캐싱 전략 |
| `src/stores/wrongNoteStore.ts` | **신규 생성** | 오답 자동 수집, 복습 상태, 숙련 판정 |
| `src/stores/parentStore.ts` | **신규 생성** | 학부모 대시보드, 자녀 데이터 조회 |
| `src/stores/index.ts` | **신규 생성** | 스토어 통합 export + subscribe 연동 초기화 |

---

## 공통: AsyncStorage 어댑터

모든 스토어에서 사용할 공통 persist storage 설정이다. 각 스토어 파일 내에서 직접 정의하거나, 아래처럼 별도 헬퍼로 추출할 수 있다. 이 문서에서는 각 스토어 파일 안에 인라인으로 포함하는 패턴을 사용한다.

```typescript
// 공통 패턴 -- 각 스토어 파일 상단에 동일하게 작성
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

const asyncStorage = createJSONStorage(() => AsyncStorage);
```

> Zustand v5에서는 `createJSONStorage`가 `() => storageApi` 형태의 함수를 받는다.
> `AsyncStorage`는 `getItem`, `setItem`, `removeItem`을 이미 제공하므로 직접 전달 가능.

---

## 1. authStore.ts 수정

### 1.1 변경 사항 요약

1. `UserRole`에 `'parent'` 타입이 추가됨 (Section 01에서 타입 수정 완료)
2. `User` 인터페이스에 `childrenIds?: string[]` 필드 추가됨 (Section 01)
3. Mock 사용자에 `parent@test.com` 계정 추가
4. `persist` 미들웨어 적용하여 로그인 상태 유지
5. 로그인 시 role 기반 라우팅 지원을 위해 state에 변경 없음 (라우팅은 Section 10)

### 1.2 현재 파일 (수정 전)

현재 `src/stores/authStore.ts`는 아래와 같다:
- `create<AuthState>` 사용 (persist 미적용)
- `mockUsers`에 teacher, student 2명만 존재
- `UserRole`은 `'admin' | 'teacher' | 'student'` (Section 01에서 `'parent'` 추가됨)

### 1.3 수정된 전체 파일: `src/stores/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import { User, UserRole } from '../types';

// ─── State Interface ──────────────────────────────────────
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// ─── Mock Users ───────────────────────────────────────────
// 나중에 Supabase Auth로 대체
const mockUsers: Record<string, User & { password: string }> = {
  'teacher@test.com': {
    id: '1',
    academyId: 'academy1',
    role: 'teacher',
    name: '김선생',
    email: 'teacher@test.com',
    phone: '010-1234-5678',
    password: '123456',
    createdAt: new Date(),
  },
  'student@test.com': {
    id: '2',
    academyId: 'academy1',
    role: 'student',
    name: '이학생',
    email: 'student@test.com',
    phone: '010-8765-4321',
    grade: '고1',
    password: '123456',
    createdAt: new Date(),
  },
  'parent@test.com': {
    id: '3',
    academyId: 'academy1',
    role: 'parent',
    name: '이부모',
    email: 'parent@test.com',
    phone: '010-5555-1234',
    childrenIds: ['2'], // 이학생(student@test.com)의 자녀
    password: '123456',
    createdAt: new Date(),
  },
};

// ─── Store ────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // 임시 Mock 로그인 (나중에 Supabase Auth로 대체)
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const mockUser = mockUsers[email];
          if (mockUser && mockUser.password === password) {
            const { password: _, ...user } = mockUser;
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            set({
              error: '이메일 또는 비밀번호가 올바르지 않습니다.',
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: '로그인 중 오류가 발생했습니다.',
            isLoading: false,
          });
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, error: null });
      },
    }),
    {
      name: 'mathpia-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // isLoading, error는 영속화하지 않음
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 1.4 주요 변경 포인트

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| Store 생성 | `create<AuthState>((set) => ...)` | `create<AuthState>()(persist((set) => ..., { ... }))` |
| Mock 사용자 | teacher, student (2명) | teacher, student, **parent** (3명) |
| 학부모 계정 | 없음 | `parent@test.com` / `123456` (childrenIds: ['2']) |
| 영속화 | 없음 | persist middleware, key: `mathpia-auth` |
| partialize | 없음 | `user`, `isAuthenticated`만 저장 (error/loading 제외) |

> **Zustand v5 참고**: `create<T>()( persist(...) )` 형태로 이중 호출 필요.
> v4에서는 `create<T>( persist(...) )`였지만, v5에서 타입 안정성을 위해 변경됨.

---

## 2. problemBankStore.ts (신규)

### 2.1 목적
문제은행 데이터의 CRUD, 검색, 필터링을 관리한다. 선생님이 문제를 등록/수정/삭제하고, 학생은 문제를 조회한다.

### 2.2 인터페이스 및 전체 코드: `src/stores/problemBankStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import {
  ProblemBankItem,
  Grade,
  ProblemDifficulty,
  ProblemType,
} from '../types';
import services from '../services';

// ─── Filter State ─────────────────────────────────────────
export interface ProblemFilters {
  grade?: Grade;
  subjectId?: string;
  chapter?: string;
  difficulty?: ProblemDifficulty;  // '상' | '중' | '하'
  type?: ProblemType;              // '객관식' | '단답형' | '서술형'
  searchQuery?: string;
  tags?: string[];
}

// ─── Store Interface ──────────────────────────────────────
interface ProblemBankState {
  // State
  problems: ProblemBankItem[];
  selectedProblem: ProblemBankItem | null;
  filters: ProblemFilters;
  filteredProblems: ProblemBankItem[];
  isLoading: boolean;
  error: string | null;

  // Actions - CRUD
  fetchProblems: () => Promise<void>;
  getProblemById: (id: string) => Promise<ProblemBankItem | null>;
  createProblem: (problem: Omit<ProblemBankItem, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'correctRate'>) => Promise<ProblemBankItem>;
  updateProblem: (id: string, updates: Partial<ProblemBankItem>) => Promise<void>;
  deleteProblem: (id: string) => Promise<void>;

  // Actions - Selection
  setSelectedProblem: (problem: ProblemBankItem | null) => void;

  // Actions - Filtering
  setFilters: (filters: Partial<ProblemFilters>) => void;
  clearFilters: () => void;
  applyFilters: () => void;

  // Actions - Bulk
  bulkCreateProblems: (problems: Omit<ProblemBankItem, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'correctRate'>[]) => Promise<ProblemBankItem[]>;
}

// ─── Helper: Client-side Filtering ───────────────────────
function filterProblems(
  problems: ProblemBankItem[],
  filters: ProblemFilters
): ProblemBankItem[] {
  let result = [...problems];

  if (filters.grade) {
    result = result.filter((p) => p.grade === filters.grade);
  }
  if (filters.subjectId) {
    result = result.filter((p) => p.subject === filters.subjectId);
  }
  if (filters.chapter) {
    result = result.filter((p) => p.topic === filters.chapter);
  }
  if (filters.difficulty) {
    result = result.filter((p) => p.difficulty === filters.difficulty);
  }
  if (filters.type) {
    result = result.filter((p) => p.type === filters.type);
  }
  if (filters.searchQuery && filters.searchQuery.trim()) {
    const query = filters.searchQuery.toLowerCase();
    result = result.filter(
      (p) =>
        p.content.toLowerCase().includes(query) ||
        p.tags?.some((t) => t.toLowerCase().includes(query)) ||
        p.topic?.toLowerCase().includes(query)
    );
  }
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((p) =>
      filters.tags!.some((tag) => p.tags?.includes(tag))
    );
  }

  return result;
}

// ─── Store ────────────────────────────────────────────────
export const useProblemBankStore = create<ProblemBankState>()(
  persist(
    (set, get) => ({
      // Initial State
      problems: [],
      selectedProblem: null,
      filters: {},
      filteredProblems: [],
      isLoading: false,
      error: null,

      // ── CRUD ────────────────────────────────────────────
      fetchProblems: async () => {
        set({ isLoading: true, error: null });
        try {
          const problems = await services.problemBank.getAll();
          const filtered = filterProblems(problems, get().filters);
          set({ problems, filteredProblems: filtered, isLoading: false });
        } catch (e) {
          set({ error: '문제 목록을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      getProblemById: async (id: string) => {
        try {
          const problem = await services.problemBank.getById(id);
          return problem;
        } catch {
          return null;
        }
      },

      createProblem: async (problemData) => {
        set({ isLoading: true, error: null });
        try {
          const newProblem = await services.problemBank.create(problemData);
          const problems = [...get().problems, newProblem];
          const filtered = filterProblems(problems, get().filters);
          set({ problems, filteredProblems: filtered, isLoading: false });
          return newProblem;
        } catch (e) {
          set({ error: '문제 생성에 실패했습니다.', isLoading: false });
          throw e;
        }
      },

      updateProblem: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          await services.problemBank.update(id, updates);
          const problems = get().problems.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          );
          const filtered = filterProblems(problems, get().filters);
          set({ problems, filteredProblems: filtered, isLoading: false });
        } catch (e) {
          set({ error: '문제 수정에 실패했습니다.', isLoading: false });
        }
      },

      deleteProblem: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await services.problemBank.delete(id);
          const problems = get().problems.filter((p) => p.id !== id);
          const filtered = filterProblems(problems, get().filters);
          set({ problems, filteredProblems: filtered, isLoading: false });
        } catch (e) {
          set({ error: '문제 삭제에 실패했습니다.', isLoading: false });
        }
      },

      // ── Selection ───────────────────────────────────────
      setSelectedProblem: (problem) => set({ selectedProblem: problem }),

      // ── Filtering ──────────────────────────────────────
      setFilters: (newFilters) => {
        const filters = { ...get().filters, ...newFilters };
        const filtered = filterProblems(get().problems, filters);
        set({ filters, filteredProblems: filtered });
      },

      clearFilters: () => {
        set({ filters: {}, filteredProblems: get().problems });
      },

      applyFilters: () => {
        const filtered = filterProblems(get().problems, get().filters);
        set({ filteredProblems: filtered });
      },

      // ── Bulk ────────────────────────────────────────────
      bulkCreateProblems: async (problemsData) => {
        set({ isLoading: true, error: null });
        try {
          const newProblems: ProblemBankItem[] = [];
          for (const data of problemsData) {
            const created = await services.problemBank.create(data);
            newProblems.push(created);
          }
          const problems = [...get().problems, ...newProblems];
          const filtered = filterProblems(problems, get().filters);
          set({ problems, filteredProblems: filtered, isLoading: false });
          return newProblems;
        } catch (e) {
          set({ error: '문제 일괄 생성에 실패했습니다.', isLoading: false });
          throw e;
        }
      },
    }),
    {
      name: 'mathpia-problem-bank',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        problems: state.problems,
        filters: state.filters,
      }),
    }
  )
);
```

### 2.3 참조 타입 (Section 01에서 정의)

이 스토어가 사용하는 `ProblemBankItem`은 Section 01에서 아래와 같이 정의된다:

```typescript
// src/types/problemBank.ts (Section 01에서 생성)
export type ProblemDifficulty = '상' | '중' | '하';
export type ProblemType = '객관식' | '단답형' | '서술형';
export type SourceType = 'manual' | 'ai-extracted' | 'imported';

export interface ProblemBankItem {
  id: string;
  content: string;           // 문제 본문 (LaTeX 포함 가능)
  contentHtml?: string;       // HTML 렌더링용
  imageUrls?: string[];       // 문제 이미지
  answer: string;             // 정답
  solution?: string;          // 풀이
  difficulty: ProblemDifficulty;
  type: ProblemType;
  choices?: string[];          // 객관식 보기 (type === '객관식'일 때)
  grade: Grade;
  subject: string;            // Subject.id 참조
  topic: string;              // chapter명
  tags?: string[];
  source?: string;            // 출처 (교과서명, 기출 등)
  sourceType: SourceType;
  points: number;
  usageCount: number;         // 숙제에서 사용된 횟수
  correctRate: number;        // 전체 정답률 (0~100)
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. assignmentStore.ts (신규)

### 3.1 목적
숙제의 생성/수정/삭제/발행, 문제 연결, 상태 관리(draft/published/closed)를 담당한다.

### 3.2 전체 코드: `src/stores/assignmentStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import { Assignment, Grade } from '../types';
import services from '../services';

// ─── 숙제 상태 (Section 01에서 정의) ──────────────────────
// export type AssignmentStatus = 'draft' | 'published' | 'closed';
// Assignment 인터페이스에 status: AssignmentStatus 필드 포함

// ─── Store Interface ──────────────────────────────────────
interface AssignmentState {
  // State
  assignments: Assignment[];
  selectedAssignment: Assignment | null;
  isLoading: boolean;
  error: string | null;

  // Actions - CRUD
  fetchAssignments: (teacherId?: string) => Promise<void>;
  fetchStudentAssignments: (studentId: string) => Promise<void>;
  getAssignmentById: (id: string) => Promise<Assignment | null>;
  createAssignment: (data: {
    teacherId: string;
    title: string;
    description: string;
    grade: Grade;
    subject: string;
    dueDate: Date;
    problemIds: string[];
    assignedStudents: string[];
  }) => Promise<Assignment>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;

  // Actions - Status
  publishAssignment: (id: string) => Promise<void>;
  closeAssignment: (id: string) => Promise<void>;

  // Actions - Problems
  addProblemsToAssignment: (assignmentId: string, problemIds: string[]) => Promise<void>;
  removeProblemsFromAssignment: (assignmentId: string, problemIds: string[]) => Promise<void>;

  // Actions - Selection
  setSelectedAssignment: (assignment: Assignment | null) => void;

  // Actions - Utility
  getAssignmentsByStatus: (status: 'draft' | 'published' | 'closed') => Assignment[];
}

// ─── Store ────────────────────────────────────────────────
export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set, get) => ({
      assignments: [],
      selectedAssignment: null,
      isLoading: false,
      error: null,

      // ── CRUD ────────────────────────────────────────────
      fetchAssignments: async (teacherId) => {
        set({ isLoading: true, error: null });
        try {
          const assignments = teacherId
            ? await services.assignment.getByTeacher(teacherId)
            : await services.assignment.getAll();
          set({ assignments, isLoading: false });
        } catch (e) {
          set({ error: '숙제 목록을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      fetchStudentAssignments: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const assignments = await services.assignment.getByStudent(studentId);
          set({ assignments, isLoading: false });
        } catch (e) {
          set({ error: '숙제 목록을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      getAssignmentById: async (id) => {
        try {
          return await services.assignment.getById(id);
        } catch {
          return null;
        }
      },

      createAssignment: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const newAssignment = await services.assignment.create(data);
          set({
            assignments: [...get().assignments, newAssignment],
            isLoading: false,
          });
          return newAssignment;
        } catch (e) {
          set({ error: '숙제 생성에 실패했습니다.', isLoading: false });
          throw e;
        }
      },

      updateAssignment: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          await services.assignment.update(id, updates);
          set({
            assignments: get().assignments.map((a) =>
              a.id === id ? { ...a, ...updates } : a
            ),
            isLoading: false,
          });
        } catch (e) {
          set({ error: '숙제 수정에 실패했습니다.', isLoading: false });
        }
      },

      deleteAssignment: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await services.assignment.delete(id);
          set({
            assignments: get().assignments.filter((a) => a.id !== id),
            isLoading: false,
          });
        } catch (e) {
          set({ error: '숙제 삭제에 실패했습니다.', isLoading: false });
        }
      },

      // ── Status ──────────────────────────────────────────
      publishAssignment: async (id) => {
        await get().updateAssignment(id, { status: 'published' });
      },

      closeAssignment: async (id) => {
        await get().updateAssignment(id, { status: 'closed' });
      },

      // ── Problems ────────────────────────────────────────
      addProblemsToAssignment: async (assignmentId, problemIds) => {
        try {
          await services.assignment.addProblems(assignmentId, problemIds);
          const updated = await services.assignment.getById(assignmentId);
          if (updated) {
            set({
              assignments: get().assignments.map((a) =>
                a.id === assignmentId ? updated : a
              ),
            });
          }
        } catch (e) {
          set({ error: '문제 추가에 실패했습니다.' });
        }
      },

      removeProblemsFromAssignment: async (assignmentId, problemIds) => {
        try {
          await services.assignment.removeProblems(assignmentId, problemIds);
          const updated = await services.assignment.getById(assignmentId);
          if (updated) {
            set({
              assignments: get().assignments.map((a) =>
                a.id === assignmentId ? updated : a
              ),
            });
          }
        } catch (e) {
          set({ error: '문제 제거에 실패했습니다.' });
        }
      },

      // ── Selection ───────────────────────────────────────
      setSelectedAssignment: (assignment) =>
        set({ selectedAssignment: assignment }),

      // ── Utility ─────────────────────────────────────────
      getAssignmentsByStatus: (status) => {
        return get().assignments.filter((a) => a.status === status);
      },
    }),
    {
      name: 'mathpia-assignments',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        assignments: state.assignments,
      }),
    }
  )
);
```

---

## 4. submissionStore.ts (신규)

### 4.1 목적
학생의 문제 풀이 제출과 채점 결과를 관리한다. 제출 시 오답이면 `wrongNoteStore`로 자동 전달하는 이벤트 트리거를 포함한다.

### 4.2 핵심 설계: 오답 연동

`submissionStore`가 `wrongNoteStore`를 직접 import하면 순환 의존이 발생할 수 있다. 이를 방지하기 위해 **Zustand subscribe 패턴**을 사용한다:

```
submissionStore.submitAnswer()
  → state 업데이트 (새 submission 추가)
  → subscribe 콜백이 state 변경 감지
  → 오답인 경우 wrongNoteStore.addFromSubmission() 호출
```

이 subscribe 연동은 `src/stores/index.ts`에서 앱 시작 시 1회 초기화한다.

### 4.3 전체 코드: `src/stores/submissionStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import { Submission } from '../types';
import services from '../services';

// ─── Store Interface ──────────────────────────────────────
interface SubmissionState {
  // State
  submissions: Submission[];
  currentSubmission: Submission | null;
  isLoading: boolean;
  error: string | null;

  // 마지막으로 추가된 제출 (subscribe에서 감지용)
  lastAddedSubmission: Submission | null;

  // Actions - Submit
  submitAnswer: (data: {
    assignmentId: string;
    studentId: string;
    problemId: string;
    answerImageUrl?: string;
    textAnswer?: string;
  }) => Promise<Submission>;

  // Actions - Grade (선생님)
  gradeSubmission: (
    submissionId: string,
    data: {
      score: number;
      isCorrect: boolean;
      feedback?: string;
      correctAnswer: string;
    }
  ) => Promise<void>;

  // Actions - Query
  fetchByAssignment: (assignmentId: string) => Promise<void>;
  fetchByStudent: (studentId: string) => Promise<void>;
  fetchByStudentAndAssignment: (
    studentId: string,
    assignmentId: string
  ) => Promise<Submission[]>;
  getSubmissionsByProblem: (problemId: string) => Submission[];

  // Actions - Stats
  getStudentStats: (studentId: string) => {
    totalSubmissions: number;
    totalCorrect: number;
    correctRate: number;
  };

  // Actions - Utility
  setCurrentSubmission: (submission: Submission | null) => void;
  clearLastAdded: () => void;
}

// ─── Store ────────────────────────────────────────────────
export const useSubmissionStore = create<SubmissionState>()(
  persist(
    (set, get) => ({
      submissions: [],
      currentSubmission: null,
      isLoading: false,
      error: null,
      lastAddedSubmission: null,

      // ── Submit ──────────────────────────────────────────
      submitAnswer: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const submission = await services.assignment.submitAnswer(data);
          set({
            submissions: [...get().submissions, submission],
            lastAddedSubmission: submission,
            isLoading: false,
          });
          return submission;
        } catch (e) {
          set({ error: '답안 제출에 실패했습니다.', isLoading: false });
          throw e;
        }
      },

      // ── Grade ───────────────────────────────────────────
      gradeSubmission: async (submissionId, data) => {
        set({ isLoading: true, error: null });
        try {
          await services.assignment.gradeSubmission(submissionId, data);
          const updatedSubmission: Partial<Submission> = {
            score: data.score,
            isCorrect: data.isCorrect,
            feedback: data.feedback,
            correctAnswer: data.correctAnswer,
            gradedAt: new Date(),
          };

          const submissions = get().submissions.map((s) =>
            s.id === submissionId ? { ...s, ...updatedSubmission } : s
          );

          // 채점 후 오답이면 lastAddedSubmission을 갱신하여 subscribe 트리거
          const gradedSub = submissions.find((s) => s.id === submissionId);
          set({
            submissions,
            isLoading: false,
            // 오답인 경우에만 lastAddedSubmission 갱신 (wrongNote 연동 트리거)
            lastAddedSubmission:
              gradedSub && !data.isCorrect ? (gradedSub as Submission) : get().lastAddedSubmission,
          });
        } catch (e) {
          set({ error: '채점에 실패했습니다.', isLoading: false });
        }
      },

      // ── Query ───────────────────────────────────────────
      fetchByAssignment: async (assignmentId) => {
        set({ isLoading: true, error: null });
        try {
          const submissions = await services.assignment.getSubmissionsByAssignment(assignmentId);
          set({ submissions, isLoading: false });
        } catch (e) {
          set({ error: '제출 목록을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      fetchByStudent: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const submissions = await services.assignment.getSubmissionsByStudent(studentId);
          set({ submissions, isLoading: false });
        } catch (e) {
          set({ error: '제출 목록을 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      fetchByStudentAndAssignment: async (studentId, assignmentId) => {
        try {
          const result = await services.assignment.getSubmissionsByStudentAndAssignment(
            studentId,
            assignmentId
          );
          return result;
        } catch {
          return [];
        }
      },

      getSubmissionsByProblem: (problemId) => {
        return get().submissions.filter((s) => s.problemId === problemId);
      },

      // ── Stats ───────────────────────────────────────────
      getStudentStats: (studentId) => {
        const studentSubs = get().submissions.filter(
          (s) => s.studentId === studentId && s.gradedAt
        );
        const totalSubmissions = studentSubs.length;
        const totalCorrect = studentSubs.filter((s) => s.isCorrect).length;
        const correctRate =
          totalSubmissions > 0
            ? Math.round((totalCorrect / totalSubmissions) * 100)
            : 0;
        return { totalSubmissions, totalCorrect, correctRate };
      },

      // ── Utility ─────────────────────────────────────────
      setCurrentSubmission: (submission) =>
        set({ currentSubmission: submission }),

      clearLastAdded: () => set({ lastAddedSubmission: null }),
    }),
    {
      name: 'mathpia-submissions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        submissions: state.submissions,
      }),
    }
  )
);
```

### 4.4 참조 타입 (Section 01 확장)

Section 01에서 기존 `Submission` 타입에 다음 필드를 추가해야 한다:

```typescript
// src/types/index.ts (Section 01에서 수정)
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  problemId: string;
  answerImageUrl?: string;    // 변경: optional
  textAnswer?: string;
  score?: number;
  isCorrect?: boolean;        // 추가: 정답 여부
  correctAnswer?: string;     // 추가: 정답 (오답노트용)
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
}
```

---

## 5. analyticsStore.ts (신규)

### 5.1 목적
학생 학습 분석 데이터를 관리한다. Gemini AI 분석 결과를 캐싱하여 불필요한 API 호출을 방지한다.

### 5.2 캐싱 전략

```
┌─────────────────────────────────────────────────────────┐
│                    analyticsStore                        │
│                                                         │
│  analysisCacheMap: {                                    │
│    [studentId]: {                                       │
│      lastAnalyzedAt: Date,          ← 마지막 분석 시각   │
│      submissionCountAtAnalysis: number, ← 분석 시점 제출수│
│      weakness: WeaknessAnalysis,    ← AI 분석 결과 캐시  │
│      report: LearningReport,        ← AI 리포트 캐시    │
│    }                                                    │
│  }                                                      │
│                                                         │
│  shouldReanalyze(studentId):                            │
│    현재 제출수 - 분석시점 제출수 >= 5  → true (재분석 필요)│
│    or lastAnalyzedAt이 null          → true             │
│    otherwise                         → false            │
└─────────────────────────────────────────────────────────┘
```

**재분석 트리거 조건**:
1. 캐시에 해당 학생의 분석이 없을 때
2. 분석 이후 새로운 제출이 **5건 이상** 쌓였을 때

이 카운팅은 `submissionCountSinceLastAnalysis`로 추적한다. `submissionStore`의 `submissions.length`가 아닌, `analysisCacheMap[studentId].submissionCountAtAnalysis`와 현재 해당 학생의 전체 제출 수를 비교한다.

### 5.3 전체 코드: `src/stores/analyticsStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import {
  StudentAnalytics,
  WeaknessAnalysis,
  LearningReport,
} from '../types';
import services from '../services';

// ─── Cache Entry ──────────────────────────────────────────
interface AnalysisCacheEntry {
  lastAnalyzedAt: string;              // ISO date string (persist 호환)
  submissionCountAtAnalysis: number;   // 분석 시점의 해당 학생 제출 수
  weakness: WeaknessAnalysis | null;
  report: LearningReport | null;
  recommendations: string[];           // 추천 문제 ID 목록
}

// ─── Store Interface ──────────────────────────────────────
interface AnalyticsState {
  // State
  studentAnalytics: Record<string, StudentAnalytics>;  // studentId → analytics
  analysisCacheMap: Record<string, AnalysisCacheEntry>; // studentId → cache
  classAnalytics: {
    averageScore: number;
    totalStudents: number;
    weakTopicDistribution: Record<string, number>;
  } | null;
  isLoading: boolean;
  isAnalyzing: boolean;  // AI 분석 진행 중
  error: string | null;

  // Actions - Student Analytics
  fetchStudentAnalytics: (studentId: string) => Promise<StudentAnalytics | null>;
  fetchClassAnalytics: (teacherId: string) => Promise<void>;

  // Actions - AI Analysis (Gemini)
  analyzeWeakness: (
    studentId: string,
    currentSubmissionCount: number
  ) => Promise<WeaknessAnalysis | null>;
  generateReport: (
    studentId: string,
    currentSubmissionCount: number
  ) => Promise<LearningReport | null>;
  getRecommendedProblems: (studentId: string) => Promise<string[]>;

  // Actions - Cache
  shouldReanalyze: (studentId: string, currentSubmissionCount: number) => boolean;
  invalidateCache: (studentId: string) => void;
  getCachedWeakness: (studentId: string) => WeaknessAnalysis | null;
  getCachedReport: (studentId: string) => LearningReport | null;

  // Actions - Class Level (선생님)
  triggerManualAnalysis: (
    studentId: string,
    currentSubmissionCount: number
  ) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────
const REANALYSIS_THRESHOLD = 5; // 새 제출 5건 이상이면 재분석

// ─── Store ────────────────────────────────────────────────
export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      studentAnalytics: {},
      analysisCacheMap: {},
      classAnalytics: null,
      isLoading: false,
      isAnalyzing: false,
      error: null,

      // ── Student Analytics ──────────────────────────────
      fetchStudentAnalytics: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const analytics = await services.analytics.getStudentAnalytics(studentId);
          set({
            studentAnalytics: {
              ...get().studentAnalytics,
              [studentId]: analytics,
            },
            isLoading: false,
          });
          return analytics;
        } catch (e) {
          set({ error: '학생 분석 데이터를 불러오는데 실패했습니다.', isLoading: false });
          return null;
        }
      },

      fetchClassAnalytics: async (teacherId) => {
        set({ isLoading: true, error: null });
        try {
          const classData = await services.analytics.getClassAnalytics(teacherId);
          set({ classAnalytics: classData, isLoading: false });
        } catch (e) {
          set({ error: '반 분석 데이터를 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      // ── AI Analysis ────────────────────────────────────
      analyzeWeakness: async (studentId, currentSubmissionCount) => {
        // 캐시 확인
        if (!get().shouldReanalyze(studentId, currentSubmissionCount)) {
          return get().getCachedWeakness(studentId);
        }

        set({ isAnalyzing: true, error: null });
        try {
          const weakness = await services.analytics.analyzeWeakness(studentId);
          const recommendations = await services.analytics.recommendProblems(
            studentId,
            weakness
          );

          // 캐시 업데이트
          const existingCache = get().analysisCacheMap[studentId] || {
            lastAnalyzedAt: '',
            submissionCountAtAnalysis: 0,
            weakness: null,
            report: null,
            recommendations: [],
          };

          set({
            analysisCacheMap: {
              ...get().analysisCacheMap,
              [studentId]: {
                ...existingCache,
                lastAnalyzedAt: new Date().toISOString(),
                submissionCountAtAnalysis: currentSubmissionCount,
                weakness,
                recommendations,
              },
            },
            isAnalyzing: false,
          });

          return weakness;
        } catch (e) {
          set({ error: 'AI 취약점 분석에 실패했습니다.', isAnalyzing: false });
          return null;
        }
      },

      generateReport: async (studentId, currentSubmissionCount) => {
        // 캐시 확인
        if (!get().shouldReanalyze(studentId, currentSubmissionCount)) {
          return get().getCachedReport(studentId);
        }

        set({ isAnalyzing: true, error: null });
        try {
          const report = await services.analytics.generateReport(studentId);

          const existingCache = get().analysisCacheMap[studentId] || {
            lastAnalyzedAt: '',
            submissionCountAtAnalysis: 0,
            weakness: null,
            report: null,
            recommendations: [],
          };

          set({
            analysisCacheMap: {
              ...get().analysisCacheMap,
              [studentId]: {
                ...existingCache,
                lastAnalyzedAt: new Date().toISOString(),
                submissionCountAtAnalysis: currentSubmissionCount,
                report,
              },
            },
            isAnalyzing: false,
          });

          return report;
        } catch (e) {
          set({ error: 'AI 리포트 생성에 실패했습니다.', isAnalyzing: false });
          return null;
        }
      },

      getRecommendedProblems: async (studentId) => {
        const cache = get().analysisCacheMap[studentId];
        if (cache?.recommendations && cache.recommendations.length > 0) {
          return cache.recommendations;
        }

        // 캐시에 추천이 없으면 취약점 분석부터 실행
        try {
          const weakness = await services.analytics.analyzeWeakness(studentId);
          const recommendations = await services.analytics.recommendProblems(
            studentId,
            weakness
          );
          return recommendations;
        } catch {
          return [];
        }
      },

      // ── Cache ──────────────────────────────────────────
      shouldReanalyze: (studentId, currentSubmissionCount) => {
        const cache = get().analysisCacheMap[studentId];
        if (!cache || !cache.lastAnalyzedAt) {
          return true; // 분석 이력 없음
        }
        const diff = currentSubmissionCount - cache.submissionCountAtAnalysis;
        return diff >= REANALYSIS_THRESHOLD;
      },

      invalidateCache: (studentId) => {
        const { [studentId]: _, ...rest } = get().analysisCacheMap;
        set({ analysisCacheMap: rest });
      },

      getCachedWeakness: (studentId) => {
        return get().analysisCacheMap[studentId]?.weakness || null;
      },

      getCachedReport: (studentId) => {
        return get().analysisCacheMap[studentId]?.report || null;
      },

      // ── Manual Trigger (선생님) ─────────────────────────
      triggerManualAnalysis: async (studentId, currentSubmissionCount) => {
        // 캐시 무효화 후 강제 재분석
        get().invalidateCache(studentId);
        await get().analyzeWeakness(studentId, currentSubmissionCount);
        await get().generateReport(studentId, currentSubmissionCount);
      },
    }),
    {
      name: 'mathpia-analytics',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        studentAnalytics: state.studentAnalytics,
        analysisCacheMap: state.analysisCacheMap,
        classAnalytics: state.classAnalytics,
      }),
    }
  )
);
```

### 5.4 참조 타입 (Section 01에서 정의)

```typescript
// src/types/analytics.ts (Section 01에서 생성)
export interface StudentAnalytics {
  studentId: string;
  subjectScores: { subject: string; score: number }[];
  weakTopics: { topic: string; score: number; reason: string }[];
  strongTopics: { topic: string; score: number }[];
  overallScore: number;
  totalSolved: number;
  totalCorrect: number;
  streakDays: number;
  lastUpdated: Date;
}

export interface WeaknessAnalysis {
  studentId: string;
  weakTopics: {
    topic: string;
    score: number;
    reason: string;
    recommendedCount: number;
  }[];
  errorPatterns: string[];
  recommendations: string[];
  analyzedAt: Date;
}

export interface LearningReport {
  studentId: string;
  radarData: { label: string; value: number }[];
  timelineData: { date: string; score: number }[];
  heatmapData: { x: string; y: string; value: number }[];
  aiSummary: string;
  strengths: string[];
  weaknesses: string[];
  advice: string[];
  generatedAt: Date;
}
```

---

## 6. wrongNoteStore.ts (신규)

### 6.1 목적
오답 자동 수집, 복습 상태 관리, 숙련 판정을 담당한다. `submissionStore`의 subscribe 콜백을 통해 오답이 자동으로 추가된다.

### 6.2 숙련 판정 로직

```
숙련 기준: 최소 24시간 간격의 3회 연속 정답
  → reviewHistory 배열에서 최근 3개가 모두 correct
  → 각 간격이 24시간 이상
  → 조건 충족 시 isLearned = true

복습 상태:
  - 'unreviewed': reviewCount === 0
  - 'reviewing':  reviewCount > 0 && !isLearned
  - 'learned':    isLearned === true
```

### 6.3 전체 코드: `src/stores/wrongNoteStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import { WrongNote, Submission } from '../types';
import services from '../services';

// ─── Review Status ────────────────────────────────────────
export type ReviewStatus = 'unreviewed' | 'reviewing' | 'learned';

// ─── Review History Entry ─────────────────────────────────
export interface ReviewHistoryEntry {
  reviewedAt: string;  // ISO date string
  isCorrect: boolean;
}

// ─── Store Interface ──────────────────────────────────────
interface WrongNoteState {
  // State
  wrongNotes: WrongNote[];
  isLoading: boolean;
  error: string | null;

  // Actions - Fetch
  fetchWrongNotes: (studentId: string) => Promise<void>;

  // Actions - Add (called by subscribe callback)
  addFromSubmission: (submission: Submission, problemContent: string) => Promise<void>;

  // Actions - Review
  recordReview: (
    wrongNoteId: string,
    isCorrect: boolean
  ) => Promise<void>;
  markAsLearned: (wrongNoteId: string) => void;

  // Actions - Filter
  getByStatus: (status: ReviewStatus) => WrongNote[];
  getByTopic: (topic: string) => WrongNote[];
  getByDateRange: (start: Date, end: Date) => WrongNote[];

  // Actions - Stats
  getStats: (studentId: string) => {
    total: number;
    unreviewed: number;
    reviewing: number;
    learned: number;
    reviewCompletionRate: number;
  };

  // Actions - Utility
  deleteWrongNote: (id: string) => Promise<void>;
  getReviewStatus: (wrongNote: WrongNote) => ReviewStatus;
}

// ─── Constants ────────────────────────────────────────────
const MASTERY_CONSECUTIVE_CORRECT = 3;  // 연속 정답 3회
const MASTERY_MIN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24시간 (ms)

// ─── Helpers ──────────────────────────────────────────────
function checkMastery(reviewHistory: ReviewHistoryEntry[]): boolean {
  if (reviewHistory.length < MASTERY_CONSECUTIVE_CORRECT) return false;

  // 최근 3개 기록 확인
  const recent = reviewHistory.slice(-MASTERY_CONSECUTIVE_CORRECT);

  // 모두 정답인지
  if (!recent.every((r) => r.isCorrect)) return false;

  // 각 간격이 24시간 이상인지
  for (let i = 1; i < recent.length; i++) {
    const prev = new Date(recent[i - 1].reviewedAt).getTime();
    const curr = new Date(recent[i].reviewedAt).getTime();
    if (curr - prev < MASTERY_MIN_INTERVAL_MS) return false;
  }

  return true;
}

function getReviewStatusFromNote(note: WrongNote): ReviewStatus {
  if (note.isLearned) return 'learned';
  if (note.reviewCount > 0) return 'reviewing';
  return 'unreviewed';
}

// ─── Store ────────────────────────────────────────────────
export const useWrongNoteStore = create<WrongNoteState>()(
  persist(
    (set, get) => ({
      wrongNotes: [],
      isLoading: false,
      error: null,

      // ── Fetch ───────────────────────────────────────────
      fetchWrongNotes: async (studentId) => {
        set({ isLoading: true, error: null });
        try {
          const notes = await services.wrongNote.getByStudent(studentId);
          set({ wrongNotes: notes, isLoading: false });
        } catch (e) {
          set({ error: '오답노트를 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      // ── Add from Submission (event callback) ───────────
      addFromSubmission: async (submission, problemContent) => {
        // 이미 동일 문제에 대한 오답노트가 있는지 확인
        const existing = get().wrongNotes.find(
          (n) =>
            n.problemId === submission.problemId &&
            n.studentId === submission.studentId
        );

        if (existing) {
          // 이미 있으면 중복 추가하지 않음 (복습 기록은 recordReview로)
          return;
        }

        try {
          const newNote = await services.wrongNote.create({
            studentId: submission.studentId,
            problemId: submission.problemId,
            assignmentId: submission.assignmentId,
            studentAnswer: submission.textAnswer || '[이미지 답안]',
            correctAnswer: submission.correctAnswer || '',
            problemContent: problemContent,
            reviewCount: 0,
            isLearned: false,
            reviewHistory: [],
            lastReviewDate: null,
            createdAt: new Date().toISOString(),
          });

          set({ wrongNotes: [...get().wrongNotes, newNote] });
        } catch (e) {
          console.warn('오답노트 자동 추가 실패:', e);
        }
      },

      // ── Review ──────────────────────────────────────────
      recordReview: async (wrongNoteId, isCorrect) => {
        const note = get().wrongNotes.find((n) => n.id === wrongNoteId);
        if (!note) return;

        const newEntry: ReviewHistoryEntry = {
          reviewedAt: new Date().toISOString(),
          isCorrect,
        };

        const updatedHistory = [...(note.reviewHistory || []), newEntry];
        const isLearned = checkMastery(updatedHistory);

        const updatedNote: WrongNote = {
          ...note,
          reviewCount: note.reviewCount + 1,
          reviewHistory: updatedHistory,
          lastReviewDate: new Date().toISOString(),
          isLearned,
        };

        try {
          await services.wrongNote.update(wrongNoteId, updatedNote);
          set({
            wrongNotes: get().wrongNotes.map((n) =>
              n.id === wrongNoteId ? updatedNote : n
            ),
          });
        } catch (e) {
          set({ error: '복습 기록 저장에 실패했습니다.' });
        }
      },

      markAsLearned: (wrongNoteId) => {
        set({
          wrongNotes: get().wrongNotes.map((n) =>
            n.id === wrongNoteId ? { ...n, isLearned: true } : n
          ),
        });
      },

      // ── Filter ──────────────────────────────────────────
      getByStatus: (status) => {
        return get().wrongNotes.filter(
          (n) => getReviewStatusFromNote(n) === status
        );
      },

      getByTopic: (topic) => {
        return get().wrongNotes.filter((n) => n.topic === topic);
      },

      getByDateRange: (start, end) => {
        return get().wrongNotes.filter((n) => {
          const created = new Date(n.createdAt);
          return created >= start && created <= end;
        });
      },

      // ── Stats ───────────────────────────────────────────
      getStats: (studentId) => {
        const notes = get().wrongNotes.filter(
          (n) => n.studentId === studentId
        );
        const total = notes.length;
        const unreviewed = notes.filter(
          (n) => getReviewStatusFromNote(n) === 'unreviewed'
        ).length;
        const reviewing = notes.filter(
          (n) => getReviewStatusFromNote(n) === 'reviewing'
        ).length;
        const learned = notes.filter(
          (n) => getReviewStatusFromNote(n) === 'learned'
        ).length;
        const reviewCompletionRate =
          total > 0 ? Math.round((learned / total) * 100) : 0;

        return { total, unreviewed, reviewing, learned, reviewCompletionRate };
      },

      // ── Utility ─────────────────────────────────────────
      deleteWrongNote: async (id) => {
        try {
          await services.wrongNote.delete(id);
          set({ wrongNotes: get().wrongNotes.filter((n) => n.id !== id) });
        } catch (e) {
          set({ error: '오답노트 삭제에 실패했습니다.' });
        }
      },

      getReviewStatus: (wrongNote) => getReviewStatusFromNote(wrongNote),
    }),
    {
      name: 'mathpia-wrong-notes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        wrongNotes: state.wrongNotes,
      }),
    }
  )
);
```

### 6.4 참조 타입 (Section 01에서 정의)

```typescript
// src/types/wrongNote.ts (Section 01에서 생성)
export interface WrongNote {
  id: string;
  studentId: string;
  problemId: string;
  assignmentId: string;
  studentAnswer: string;
  correctAnswer: string;
  problemContent: string;      // 문제 본문 (스냅샷)
  topic?: string;              // 단원명
  reviewCount: number;
  isLearned: boolean;
  reviewHistory: {
    reviewedAt: string;
    isCorrect: boolean;
  }[];
  lastReviewDate: string | null;
  createdAt: string;
}
```

---

## 7. parentStore.ts (신규)

### 7.1 목적
학부모가 자녀의 학습 대시보드, 스케줄, 리포트를 조회하는 데이터를 관리한다.

### 7.2 전체 코드: `src/stores/parentStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import { ChildDashboard, Schedule, LearningReport, User } from '../types';
import services from '../services';

// ─── Store Interface ──────────────────────────────────────
interface ParentState {
  // State
  children: User[];                              // 자녀 목록
  selectedChildId: string | null;                // 현재 선택된 자녀
  childDashboards: Record<string, ChildDashboard>; // childId → dashboard
  schedules: Record<string, Schedule>;            // childId → schedule
  reports: Record<string, LearningReport>;        // childId → report
  isLoading: boolean;
  error: string | null;

  // Actions - Children
  fetchChildren: (parentId: string) => Promise<void>;
  selectChild: (childId: string) => void;
  getSelectedChild: () => User | null;

  // Actions - Dashboard
  fetchChildDashboard: (childId: string) => Promise<ChildDashboard | null>;

  // Actions - Schedule
  fetchChildSchedule: (childId: string) => Promise<Schedule | null>;

  // Actions - Report
  fetchChildReport: (childId: string) => Promise<LearningReport | null>;

  // Actions - Refresh
  refreshAll: (childId: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────
export const useParentStore = create<ParentState>()(
  persist(
    (set, get) => ({
      children: [],
      selectedChildId: null,
      childDashboards: {},
      schedules: {},
      reports: {},
      isLoading: false,
      error: null,

      // ── Children ────────────────────────────────────────
      fetchChildren: async (parentId) => {
        set({ isLoading: true, error: null });
        try {
          const children = await services.parent.getChildren(parentId);
          set({
            children,
            isLoading: false,
            // 자녀가 1명이면 자동 선택
            selectedChildId:
              children.length === 1
                ? children[0].id
                : get().selectedChildId,
          });
        } catch (e) {
          set({ error: '자녀 정보를 불러오는데 실패했습니다.', isLoading: false });
        }
      },

      selectChild: (childId) => {
        set({ selectedChildId: childId });
      },

      getSelectedChild: () => {
        const { children, selectedChildId } = get();
        return children.find((c) => c.id === selectedChildId) || null;
      },

      // ── Dashboard ──────────────────────────────────────
      fetchChildDashboard: async (childId) => {
        set({ isLoading: true, error: null });
        try {
          const dashboard = await services.parent.getChildDashboard(childId);
          set({
            childDashboards: {
              ...get().childDashboards,
              [childId]: dashboard,
            },
            isLoading: false,
          });
          return dashboard;
        } catch (e) {
          set({ error: '자녀 대시보드를 불러오는데 실패했습니다.', isLoading: false });
          return null;
        }
      },

      // ── Schedule ────────────────────────────────────────
      fetchChildSchedule: async (childId) => {
        set({ isLoading: true, error: null });
        try {
          const schedule = await services.parent.getChildSchedule(childId);
          set({
            schedules: {
              ...get().schedules,
              [childId]: schedule,
            },
            isLoading: false,
          });
          return schedule;
        } catch (e) {
          set({ error: '스케줄을 불러오는데 실패했습니다.', isLoading: false });
          return null;
        }
      },

      // ── Report ──────────────────────────────────────────
      fetchChildReport: async (childId) => {
        set({ isLoading: true, error: null });
        try {
          const report = await services.parent.getChildReport(childId);
          set({
            reports: {
              ...get().reports,
              [childId]: report,
            },
            isLoading: false,
          });
          return report;
        } catch (e) {
          set({ error: '학습 리포트를 불러오는데 실패했습니다.', isLoading: false });
          return null;
        }
      },

      // ── Refresh All ─────────────────────────────────────
      refreshAll: async (childId) => {
        set({ isLoading: true, error: null });
        try {
          const [dashboard, schedule, report] = await Promise.all([
            services.parent.getChildDashboard(childId),
            services.parent.getChildSchedule(childId),
            services.parent.getChildReport(childId),
          ]);

          set({
            childDashboards: {
              ...get().childDashboards,
              [childId]: dashboard,
            },
            schedules: {
              ...get().schedules,
              [childId]: schedule,
            },
            reports: {
              ...get().reports,
              [childId]: report,
            },
            isLoading: false,
          });
        } catch (e) {
          set({ error: '데이터를 새로고침하는데 실패했습니다.', isLoading: false });
        }
      },
    }),
    {
      name: 'mathpia-parent',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        children: state.children,
        selectedChildId: state.selectedChildId,
        childDashboards: state.childDashboards,
        schedules: state.schedules,
        reports: state.reports,
      }),
    }
  )
);
```

### 7.3 참조 타입 (Section 01에서 정의)

```typescript
// src/types/parent.ts (Section 01에서 생성)
export interface ChildDashboard {
  child: User;
  stats: {
    totalSolved: number;
    correctRate: number;
    studyTimeMinutes: number;
    streakDays: number;
  };
  recentAssignments: {
    id: string;
    title: string;
    progress: number;      // 0~100
    dueDate: string;
    status: 'in_progress' | 'completed' | 'overdue';
  }[];
  weakTopics: { topic: string; score: number }[];
  aiAdvice: string;
}

export interface Schedule {
  weeklyClasses: {
    dayOfWeek: number;     // 0(일) ~ 6(토)
    startTime: string;     // "14:00"
    endTime: string;       // "16:00"
    subject: string;
    teacher: string;
  }[];
  upcomingDeadlines: {
    assignmentId: string;
    title: string;
    dueDate: string;
    daysLeft: number;
  }[];
  recentGraded: {
    assignmentId: string;
    title: string;
    gradedAt: string;
    score: number;
  }[];
}
```

---

## 8. stores/index.ts (신규) -- 통합 Export 및 Subscribe 연동

### 8.1 목적
1. 모든 스토어를 한곳에서 re-export
2. `submissionStore` -> `wrongNoteStore` subscribe 연동을 앱 시작 시 1회 초기화

### 8.2 전체 코드: `src/stores/index.ts`

```typescript
// ─── Re-exports ───────────────────────────────────────────
export { useAuthStore } from './authStore';
export { useProblemBankStore } from './problemBankStore';
export type { ProblemFilters } from './problemBankStore';
export { useAssignmentStore } from './assignmentStore';
export { useSubmissionStore } from './submissionStore';
export { useAnalyticsStore } from './analyticsStore';
export { useWrongNoteStore } from './wrongNoteStore';
export type { ReviewStatus, ReviewHistoryEntry } from './wrongNoteStore';
export { useParentStore } from './parentStore';

// ─── Store Inter-communication Setup ─────────────────────
import { useSubmissionStore } from './submissionStore';
import { useWrongNoteStore } from './wrongNoteStore';
import { useProblemBankStore } from './problemBankStore';

/**
 * submissionStore → wrongNoteStore 이벤트 연동
 *
 * submissionStore의 lastAddedSubmission이 변경될 때,
 * 해당 제출이 오답(isCorrect === false)이면 wrongNoteStore에 자동 추가한다.
 *
 * 이 함수를 앱 최상위 레이아웃 (app/_layout.tsx)에서 1회 호출한다.
 *
 * 사용법:
 *   import { initializeStoreSubscriptions } from '@/stores';
 *   useEffect(() => {
 *     const unsubscribe = initializeStoreSubscriptions();
 *     return unsubscribe;
 *   }, []);
 */
let isInitialized = false;

export function initializeStoreSubscriptions(): () => void {
  if (isInitialized) {
    return () => {}; // 이미 초기화됨, no-op 반환
  }

  const unsubscribe = useSubmissionStore.subscribe(
    (state, prevState) => {
      const { lastAddedSubmission } = state;
      const prevLast = prevState.lastAddedSubmission;

      // 새로운 제출이 추가되었고, 채점 완료 상태이며, 오답인 경우
      if (
        lastAddedSubmission &&
        lastAddedSubmission !== prevLast &&
        lastAddedSubmission.gradedAt &&
        lastAddedSubmission.isCorrect === false
      ) {
        // 문제 내용을 가져와서 오답노트에 추가
        const problemBankState = useProblemBankStore.getState();
        const problem = problemBankState.problems.find(
          (p) => p.id === lastAddedSubmission.problemId
        );
        const problemContent = problem?.content || '[문제 내용 없음]';

        useWrongNoteStore
          .getState()
          .addFromSubmission(lastAddedSubmission, problemContent);

        // lastAddedSubmission 초기화 (중복 트리거 방지)
        useSubmissionStore.getState().clearLastAdded();
      }
    }
  );

  isInitialized = true;

  return () => {
    unsubscribe();
    isInitialized = false;
  };
}
```

### 8.3 앱 레이아웃에서 초기화하는 방법

`app/_layout.tsx`에 아래 코드를 추가한다 (이 작업은 Section 10에서 수행하지만, 참고를 위해 명시):

```typescript
// app/_layout.tsx 내부
import { initializeStoreSubscriptions } from '@/stores';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    const unsubscribe = initializeStoreSubscriptions();
    return unsubscribe;
  }, []);

  // ... 기존 레이아웃 코드
}
```

---

## 9. 서비스 메서드 참조표

각 스토어가 호출하는 Mock 서비스 메서드 목록이다. Section 02에서 이 메서드들이 구현되어 있어야 한다.

### services.problemBank (IProblemBankService)

| 메서드 | 스토어 액션 | 반환 타입 |
|--------|-----------|----------|
| `getAll()` | `fetchProblems` | `Promise<ProblemBankItem[]>` |
| `getById(id)` | `getProblemById` | `Promise<ProblemBankItem>` |
| `create(data)` | `createProblem`, `bulkCreateProblems` | `Promise<ProblemBankItem>` |
| `update(id, data)` | `updateProblem` | `Promise<void>` |
| `delete(id)` | `deleteProblem` | `Promise<void>` |

### services.assignment (IAssignmentService)

| 메서드 | 스토어 액션 | 반환 타입 |
|--------|-----------|----------|
| `getAll()` | `fetchAssignments` | `Promise<Assignment[]>` |
| `getByTeacher(teacherId)` | `fetchAssignments` | `Promise<Assignment[]>` |
| `getByStudent(studentId)` | `fetchStudentAssignments` | `Promise<Assignment[]>` |
| `getById(id)` | `getAssignmentById` | `Promise<Assignment>` |
| `create(data)` | `createAssignment` | `Promise<Assignment>` |
| `update(id, data)` | `updateAssignment` | `Promise<void>` |
| `delete(id)` | `deleteAssignment` | `Promise<void>` |
| `addProblems(id, problemIds)` | `addProblemsToAssignment` | `Promise<void>` |
| `removeProblems(id, problemIds)` | `removeProblemsFromAssignment` | `Promise<void>` |
| `submitAnswer(data)` | `submitAnswer` | `Promise<Submission>` |
| `gradeSubmission(id, data)` | `gradeSubmission` | `Promise<void>` |
| `getSubmissionsByAssignment(id)` | `fetchByAssignment` | `Promise<Submission[]>` |
| `getSubmissionsByStudent(id)` | `fetchByStudent` | `Promise<Submission[]>` |
| `getSubmissionsByStudentAndAssignment(sId, aId)` | `fetchByStudentAndAssignment` | `Promise<Submission[]>` |

### services.analytics (IAnalyticsService)

| 메서드 | 스토어 액션 | 반환 타입 |
|--------|-----------|----------|
| `getStudentAnalytics(studentId)` | `fetchStudentAnalytics` | `Promise<StudentAnalytics>` |
| `getClassAnalytics(teacherId)` | `fetchClassAnalytics` | `Promise<ClassAnalytics>` |
| `analyzeWeakness(studentId)` | `analyzeWeakness` | `Promise<WeaknessAnalysis>` |
| `recommendProblems(studentId, weakness)` | `analyzeWeakness`, `getRecommendedProblems` | `Promise<string[]>` |
| `generateReport(studentId)` | `generateReport` | `Promise<LearningReport>` |

### services.wrongNote (IWrongNoteService)

| 메서드 | 스토어 액션 | 반환 타입 |
|--------|-----------|----------|
| `getByStudent(studentId)` | `fetchWrongNotes` | `Promise<WrongNote[]>` |
| `create(data)` | `addFromSubmission` | `Promise<WrongNote>` |
| `update(id, data)` | `recordReview` | `Promise<void>` |
| `delete(id)` | `deleteWrongNote` | `Promise<void>` |

### services.parent (IParentService)

| 메서드 | 스토어 액션 | 반환 타입 |
|--------|-----------|----------|
| `getChildren(parentId)` | `fetchChildren` | `Promise<User[]>` |
| `getChildDashboard(childId)` | `fetchChildDashboard` | `Promise<ChildDashboard>` |
| `getChildSchedule(childId)` | `fetchChildSchedule` | `Promise<Schedule>` |
| `getChildReport(childId)` | `fetchChildReport` | `Promise<LearningReport>` |

---

## 10. 데이터 흐름 다이어그램

```
┌──────────────────────────────────────────────────────────────────────┐
│                          UI Components                               │
│                                                                      │
│  Teacher: problem-bank, assignments, student-analytics               │
│  Student: homework, solve, analytics, wrong-notes                    │
│  Parent:  index, schedule, report                                    │
└───────┬──────┬───────┬───────┬───────┬───────┬───────┬──────────────┘
        │      │       │       │       │       │       │
        ▼      ▼       ▼       ▼       ▼       ▼       ▼
   ┌────────┐┌─────┐┌──────┐┌──────┐┌─────┐┌─────┐┌──────┐
   │ auth   ││prob ││assign││submit││analy││wrong││parent│
   │ Store  ││Bank ││Store ││Store ││tics ││Note ││Store │
   │        ││Store││      ││      ││Store││Store││      │
   └────┬───┘└──┬──┘└──┬───┘└──┬───┘└──┬──┘└──┬──┘└──┬───┘
        │       │      │       │       │      │      │
        │       │      │       │  subscribe   │      │
        │       │      │       │──────────────►│      │
        │       │      │       │  (오답 자동)    │      │
        │       │      │       │               │      │
        ▼       ▼      ▼       ▼       ▼      ▼      ▼
   ┌──────────────────────────────────────────────────────┐
   │              Service Factory (services/index.ts)      │
   │                                                       │
   │  services.problemBank  services.assignment            │
   │  services.analytics    services.wrongNote             │
   │  services.parent                                      │
   └───────────────────────┬───────────────────────────────┘
                           │
                           ▼
   ┌──────────────────────────────────────────────────────┐
   │           Mock Services + AsyncStorage                │
   │           (향후 Supabase로 교체)                       │
   └──────────────────────────────────────────────────────┘
```

---

## 11. Persist Key 요약

각 스토어의 AsyncStorage 키와 영속화 대상 필드:

| 스토어 | Storage Key | 영속화 필드 | 제외 필드 |
|--------|------------|------------|----------|
| authStore | `mathpia-auth` | `user`, `isAuthenticated` | `isLoading`, `error` |
| problemBankStore | `mathpia-problem-bank` | `problems`, `filters` | `selectedProblem`, `filteredProblems`, `isLoading`, `error` |
| assignmentStore | `mathpia-assignments` | `assignments` | `selectedAssignment`, `isLoading`, `error` |
| submissionStore | `mathpia-submissions` | `submissions` | `currentSubmission`, `lastAddedSubmission`, `isLoading`, `error` |
| analyticsStore | `mathpia-analytics` | `studentAnalytics`, `analysisCacheMap`, `classAnalytics` | `isLoading`, `isAnalyzing`, `error` |
| wrongNoteStore | `mathpia-wrong-notes` | `wrongNotes` | `isLoading`, `error` |
| parentStore | `mathpia-parent` | `children`, `selectedChildId`, `childDashboards`, `schedules`, `reports` | `isLoading`, `error` |

> **원칙**: `isLoading`, `error` 같은 UI 임시 상태는 절대 영속화하지 않는다.
> 앱 재시작 시 loading이 true로 고착되는 버그를 방지한다.

---

## 12. 구현 순서

1. **`@react-native-async-storage/async-storage` 설치** (이미 없는 경우)
2. **`src/stores/authStore.ts` 수정** -- parent 계정 추가 + persist 적용
3. **`src/stores/problemBankStore.ts` 생성**
4. **`src/stores/assignmentStore.ts` 생성**
5. **`src/stores/submissionStore.ts` 생성**
6. **`src/stores/analyticsStore.ts` 생성**
7. **`src/stores/wrongNoteStore.ts` 생성**
8. **`src/stores/parentStore.ts` 생성**
9. **`src/stores/index.ts` 생성** -- re-export + subscribe 연동

> 순서 중요: `submissionStore`와 `wrongNoteStore`가 모두 생성된 후에 `index.ts`의 subscribe 연동을 작성한다.

---

## 13. 수락 기준 (Acceptance Criteria)

### 기본 기능

- [ ] `@react-native-async-storage/async-storage` 패키지가 설치되어 있다
- [ ] `authStore.ts`가 persist 미들웨어를 사용한다
- [ ] `authStore.ts`에 `parent@test.com` / `123456` 으로 로그인할 수 있다
- [ ] `parent@test.com` 로그인 시 `user.role`이 `'parent'`이고 `user.childrenIds`가 `['2']`이다
- [ ] 6개 신규 스토어 파일이 `src/stores/` 디렉토리에 존재한다
- [ ] 모든 스토어가 `zustand/middleware`의 `persist`를 사용한다
- [ ] 모든 스토어의 storage key가 `mathpia-` 접두사로 시작한다

### 데이터 영속화

- [ ] 앱을 종료 후 재시작해도 로그인 상태가 유지된다
- [ ] 앱을 종료 후 재시작해도 문제은행 데이터가 유지된다
- [ ] `isLoading`, `error` 필드는 영속화되지 않는다 (partialize 확인)

### 스토어 기능

- [ ] `problemBankStore.setFilters()`로 필터 설정 시 `filteredProblems`가 자동 갱신된다
- [ ] `problemBankStore.clearFilters()`로 필터 초기화 시 전체 문제가 표시된다
- [ ] `assignmentStore.publishAssignment()`로 숙제 상태가 `'published'`로 변경된다
- [ ] `submissionStore.submitAnswer()` 후 `submissions` 배열에 새 항목이 추가된다
- [ ] `analyticsStore.shouldReanalyze()`가 제출 5건 미만일 때 `false`를 반환한다
- [ ] `analyticsStore.shouldReanalyze()`가 제출 5건 이상일 때 `true`를 반환한다
- [ ] `analyticsStore.invalidateCache()`로 캐시 무효화 후 `shouldReanalyze()`가 `true`를 반환한다
- [ ] `wrongNoteStore.recordReview()`에서 24시간 간격 3회 연속 정답 시 `isLearned`가 `true`가 된다
- [ ] `parentStore.fetchChildren()` 후 자녀가 1명이면 자동으로 `selectedChildId`가 설정된다

### Subscribe 연동

- [ ] `src/stores/index.ts`의 `initializeStoreSubscriptions()`가 존재한다
- [ ] `submissionStore`에서 채점 완료된 오답이 추가되면 `wrongNoteStore`에 자동으로 오답노트가 생성된다
- [ ] 동일 문제의 중복 오답노트가 생성되지 않는다
- [ ] `initializeStoreSubscriptions()`를 2회 호출해도 subscribe가 중복 등록되지 않는다

### 타입 안전성

- [ ] 모든 스토어가 TypeScript 에러 없이 컴파일된다
- [ ] Zustand v5 문법(`create<T>()( persist(...) )`)을 올바르게 사용한다

---

## 14. 주의사항 및 트러블슈팅

### Zustand v5 persist 문법

```typescript
// Zustand v5 올바른 문법 (이중 호출)
export const useStore = create<StateType>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'key', storage: createJSONStorage(() => AsyncStorage) }
  )
);

// Zustand v4 문법 (v5에서는 타입 에러 발생)
// export const useStore = create<StateType>(
//   persist(...)
// );
```

### Date 직렬화

AsyncStorage에 저장할 때 `Date` 객체는 자동으로 문자열로 변환된다. 읽을 때는 `new Date(string)`으로 복원해야 한다. 이 문서의 코드에서는 `Date` 대신 ISO string(`string`)을 사용하는 것을 권장한다 (wrongNoteStore의 `createdAt`, `lastReviewDate` 등).

### subscribe 콜백에서의 비동기 처리

`useSubmissionStore.subscribe()` 콜백 내에서 `async` 함수를 호출할 때, 에러가 콜백 밖으로 전파되지 않으므로 반드시 `try/catch`를 사용하거나 `.catch()`로 처리한다.

### partialize와 hydration

`partialize`로 일부 필드만 저장하면, 앱 시작 시 저장되지 않은 필드는 초기값으로 설정된다. `isLoading: false`, `error: null`이 초기값이므로 별도 hydration 로직이 필요 없다.
