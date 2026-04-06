# Section 02: Mock Data & Services

## Background

This section implements the mock data layer and five mock service classes that power the entire Mathpia application during the front-end-only development phase. All data is stored in-memory with AsyncStorage persistence. The service layer uses an interface-based abstraction so that every mock service can be replaced with a Supabase implementation later without changing any store or UI code.

**Phase**: 1 (Infrastructure)
**Plan Reference**: Steps 3.3 (Mock Data Generation) + 3.4 (Mock Service Implementation)

## Dependencies

| Dependency | What It Provides | Status |
|---|---|---|
| Section 01: Types & Interfaces | All TypeScript types (`ProblemBankItem`, `StudentAnalytics`, `WrongNoteItem`, `ChildDashboard`, `Schedule`, `LearningReport`) and all five service interfaces (`IProblemBankService`, `IAssignmentService`, `IAnalyticsService`, `IWrongNoteService`, `IParentService`) | Must be completed first |

**Existing files used (already in repo, do NOT modify)**:
- `src/types/index.ts` - base types: `User`, `UserRole`, `Grade`, `Assignment`, `Submission`, `Problem`
- `src/constants/curriculum.ts` - curriculum data for grades, subjects, chapters
- `src/stores/authStore.ts` - existing mock user pattern (reference only)

## Requirements

1. Create 108 mock math problems spanning grades 중1 through 고3 (18 per grade), covering all major subjects, with LaTeX content, mixed difficulties and types.
2. Create mock users: 10 students, 2 teachers, 3 parents (with `childrenIds` linking to students).
3. Create 8+ mock assignments in various statuses (draft / published / closed).
4. Create 30-50 mock submissions per student with realistic date distribution over 4 weeks and deliberate weakness patterns.
5. Implement 5 mock services with AsyncStorage persistence: ProblemBank, Assignment, Analytics, WrongNote, Parent.
6. Export a unified service factory from `src/services/mock/index.ts`.

## Files to Create

```
src/services/mock/
  mockData.ts           # All raw mock data (users, problems, assignments, submissions)
  mockProblemBank.ts     # MockProblemBankService implements IProblemBankService
  mockAssignment.ts      # MockAssignmentService implements IAssignmentService
  mockAnalytics.ts       # MockAnalyticsService implements IAnalyticsService
  mockWrongNote.ts       # MockWrongNoteService implements IWrongNoteService
  mockParent.ts          # MockParentService implements IParentService
  index.ts               # Service factory - single import point
```

---

## File 1: `src/services/mock/mockData.ts`

This is the largest file. It contains all raw mock data used by the services.

```typescript
// src/services/mock/mockData.ts
//
// Central mock data store. Every mock service reads from these arrays.
// Data is designed so that:
//   - Students have deliberate weakness patterns (specific topics with low scores)
//   - Submissions are spread across the last 4 weeks
//   - Problems cover every grade's curriculum with LaTeX content

import { Grade } from '../../types';

// ─── Re-export simple helper types used only inside mock layer ───

/** Difficulty level for a problem */
export type Difficulty = '상' | '중' | '하';

/** Problem type */
export type ProblemType = '객관식' | '단답형' | '서술형';

/** Assignment status */
export type AssignmentStatus = 'draft' | 'published' | 'closed';

/** Wrong-note review status */
export type ReviewStatus = '미복습' | '복습중' | '숙련';

// ─── Helper: deterministic date generator ───

/** Returns a Date that is `daysAgo` days before today at the given hour */
function daysAgo(days: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// =========================================================================
//  1. MOCK USERS
// =========================================================================

export interface MockUser {
  id: string;
  academyId: string;
  role: 'teacher' | 'student' | 'parent';
  name: string;
  email: string;
  phone: string;
  password: string;
  grade?: Grade;
  childrenIds?: string[];
  createdAt: Date;
}

// ── Teachers ──
export const mockTeachers: MockUser[] = [
  {
    id: 'T1',
    academyId: 'academy1',
    role: 'teacher',
    name: '김수학',
    email: 'teacher@test.com',
    phone: '010-1111-0001',
    password: '123456',
    createdAt: daysAgo(120),
  },
  {
    id: 'T2',
    academyId: 'academy1',
    role: 'teacher',
    name: '박기하',
    email: 'teacher2@test.com',
    phone: '010-1111-0002',
    password: '123456',
    createdAt: daysAgo(90),
  },
];

// ── Students ──
// Designed weakness patterns:
//   S1-S3 (중1-중3): weak in 도형/통계
//   S4-S6 (고1):     weak in 도형의 방정식
//   S7-S8 (고2):     weak in 미분/적분
//   S9-S10 (고3):    weak in 미적분-적분법

export const mockStudents: MockUser[] = [
  {
    id: 'S1', academyId: 'academy1', role: 'student',
    name: '이준서', email: 'student1@test.com', phone: '010-2222-0001',
    password: '123456', grade: '중1', createdAt: daysAgo(100),
  },
  {
    id: 'S2', academyId: 'academy1', role: 'student',
    name: '김서연', email: 'student2@test.com', phone: '010-2222-0002',
    password: '123456', grade: '중2', createdAt: daysAgo(100),
  },
  {
    id: 'S3', academyId: 'academy1', role: 'student',
    name: '박지호', email: 'student3@test.com', phone: '010-2222-0003',
    password: '123456', grade: '중3', createdAt: daysAgo(95),
  },
  {
    id: 'S4', academyId: 'academy1', role: 'student',
    name: '최예은', email: 'student4@test.com', phone: '010-2222-0004',
    password: '123456', grade: '고1', createdAt: daysAgo(90),
  },
  {
    id: 'S5', academyId: 'academy1', role: 'student',
    name: '정민준', email: 'student@test.com', phone: '010-2222-0005',
    password: '123456', grade: '고1', createdAt: daysAgo(90),
  },
  {
    id: 'S6', academyId: 'academy1', role: 'student',
    name: '한소윤', email: 'student6@test.com', phone: '010-2222-0006',
    password: '123456', grade: '고1', createdAt: daysAgo(88),
  },
  {
    id: 'S7', academyId: 'academy1', role: 'student',
    name: '윤도현', email: 'student7@test.com', phone: '010-2222-0007',
    password: '123456', grade: '고2', createdAt: daysAgo(85),
  },
  {
    id: 'S8', academyId: 'academy1', role: 'student',
    name: '임하은', email: 'student8@test.com', phone: '010-2222-0008',
    password: '123456', grade: '고2', createdAt: daysAgo(85),
  },
  {
    id: 'S9', academyId: 'academy1', role: 'student',
    name: '강현우', email: 'student9@test.com', phone: '010-2222-0009',
    password: '123456', grade: '고3', createdAt: daysAgo(80),
  },
  {
    id: 'S10', academyId: 'academy1', role: 'student',
    name: '송지아', email: 'student10@test.com', phone: '010-2222-0010',
    password: '123456', grade: '고3', createdAt: daysAgo(80),
  },
];

// ── Parents ──
export const mockParents: MockUser[] = [
  {
    id: 'P1', academyId: 'academy1', role: 'parent',
    name: '이부모', email: 'parent@test.com', phone: '010-5555-0001',
    password: '123456', childrenIds: ['S1', 'S3'], createdAt: daysAgo(100),
  },
  {
    id: 'P2', academyId: 'academy1', role: 'parent',
    name: '최학부모', email: 'parent2@test.com', phone: '010-5555-0002',
    password: '123456', childrenIds: ['S4'], createdAt: daysAgo(90),
  },
  {
    id: 'P3', academyId: 'academy1', role: 'parent',
    name: '윤보호자', email: 'parent3@test.com', phone: '010-5555-0003',
    password: '123456', childrenIds: ['S7', 'S9'], createdAt: daysAgo(85),
  },
];

/** All users combined for lookup */
export const allMockUsers: MockUser[] = [
  ...mockTeachers,
  ...mockStudents,
  ...mockParents,
];

// =========================================================================
//  2. MOCK PROBLEM BANK  (108 problems: 18 per grade, 6 grades)
// =========================================================================

export interface MockProblem {
  id: string;
  content: string;        // LaTeX-enabled markdown
  contentHtml?: string;
  imageUrls?: string[];
  answer: string;
  solution?: string;       // Step-by-step solution (LaTeX)
  difficulty: Difficulty;
  type: ProblemType;
  choices?: string[];      // For 객관식 only
  grade: Grade;
  subject: string;         // matches curriculum subject name
  topic: string;           // matches curriculum chapter name
  tags: string[];
  source: string;          // e.g. "2024 중1 기출" or "자체 제작"
  sourceType: 'textbook' | 'exam' | 'custom';
  points: number;
  usageCount: number;
  correctRate: number;     // 0-100
  createdAt: Date;
  createdBy: string;       // teacher id
}

// Helper to create a problem entry concisely
let _pid = 0;
function P(
  grade: Grade, subject: string, topic: string,
  difficulty: Difficulty, type: ProblemType,
  content: string, answer: string,
  extra?: Partial<MockProblem>,
): MockProblem {
  _pid++;
  const id = `PROB-${String(_pid).padStart(3, '0')}`;
  return {
    id,
    content,
    answer,
    difficulty,
    type,
    grade,
    subject,
    topic,
    tags: [topic, difficulty],
    source: '자체 제작',
    sourceType: 'custom',
    points: difficulty === '상' ? 5 : difficulty === '중' ? 3 : 1,
    usageCount: Math.floor(Math.random() * 30),
    correctRate: Math.floor(40 + Math.random() * 50),
    createdAt: daysAgo(30 + Math.floor(Math.random() * 60)),
    createdBy: 'T1',
    ...extra,
  };
}

export const mockProblems: MockProblem[] = [
  // ═══════════════════════════════════════════════════════════════════
  //  중1 (18 problems)
  // ═══════════════════════════════════════════════════════════════════

  // 수와 연산 - 소인수분해
  P('중1', '수와 연산', '소인수분해', '하', '단답형',
    '$72$를 소인수분해하시오.',
    '$2^3 \\times 3^2$'),
  P('중1', '수와 연산', '소인수분해', '중', '객관식',
    '$180$의 소인수를 모두 구하면?',
    '④',
    { choices: ['$2, 3$', '$2, 5$', '$3, 5$', '$2, 3, 5$', '$2, 3, 5, 9$'] }),
  P('중1', '수와 연산', '소인수분해', '상', '서술형',
    '두 자연수 $a$, $b$에 대해 $a = 2^3 \\times 3$, $b = 2 \\times 3^2$일 때, $\\text{lcm}(a, b)$와 $\\gcd(a, b)$를 구하고, $\\text{lcm}(a, b) = \\gcd(a, b) \\times k$를 만족시키는 $k$의 값을 구하시오.',
    '$\\text{lcm}=72,\\ \\gcd=6,\\ k=12$'),

  // 수와 연산 - 정수와 유리수
  P('중1', '수와 연산', '정수와 유리수', '하', '단답형',
    '$(-3) + (+7) - (-2)$의 값을 구하시오.',
    '$6$'),
  P('중1', '수와 연산', '정수와 유리수', '중', '객관식',
    '$\\frac{-2}{3} \\times \\frac{9}{-4}$의 값은?',
    '③',
    { choices: ['$-\\frac{3}{2}$', '$-\\frac{1}{2}$', '$\\frac{3}{2}$', '$\\frac{1}{2}$', '$6$'] }),

  // 문자와 식 - 일차방정식
  P('중1', '문자와 식', '일차방정식', '하', '단답형',
    '$3x - 5 = 7$을 풀면 $x$의 값은?',
    '$x = 4$'),
  P('중1', '문자와 식', '일차방정식', '중', '단답형',
    '$\\frac{2x+1}{3} = \\frac{x-1}{2}$을 만족시키는 $x$의 값을 구하시오.',
    '$x = -5$'),
  P('중1', '문자와 식', '일차방정식', '상', '서술형',
    '연속하는 세 짝수의 합이 $78$일 때, 가장 큰 수를 구하시오. 풀이 과정을 쓰시오.',
    '$28$'),

  // 좌표평면과 그래프
  P('중1', '좌표평면과 그래프', '좌표평면', '하', '객관식',
    '점 $A(-3, 4)$는 제 몇 사분면 위의 점인가?',
    '②',
    { choices: ['제1사분면', '제2사분면', '제3사분면', '제4사분면', '축 위의 점'] }),
  P('중1', '좌표평면과 그래프', '그래프와 비례 관계', '중', '단답형',
    '$y = -2x$의 그래프 위의 점 중 $x$좌표가 $3$인 점의 $y$좌표를 구하시오.',
    '$-6$'),

  // 기본 도형
  P('중1', '기본 도형', '기본 도형', '하', '객관식',
    '두 직선이 한 점에서 만날 때 생기는 맞꼭지각에 대한 설명 중 옳은 것은?',
    '②',
    { choices: ['항상 직각이다', '서로 같다', '합이 $90°$이다', '합이 $360°$이다', '보각 관계이다'] }),
  P('중1', '기본 도형', '작도와 합동', '중', '서술형',
    '삼각형의 합동 조건 SSS를 이용하여 $\\triangle ABC \\cong \\triangle DEF$임을 보이시오. ($AB=DE=5$, $BC=EF=7$, $CA=FD=8$)',
    'SSS 합동: 세 쌍의 대응변의 길이가 같으므로 합동'),
  P('중1', '기본 도형', '평면도형의 성질', '중', '단답형',
    '정오각형의 한 내각의 크기를 구하시오.',
    '$108°$'),
  P('중1', '기본 도형', '입체도형의 성질', '상', '단답형',
    '밑면의 반지름이 $3$cm, 높이가 $4$cm인 원기둥의 겉넓이를 구하시오.',
    '$42\\pi\\ \\text{cm}^2$'),

  // 통계
  P('중1', '통계', '자료의 정리와 해석', '하', '단답형',
    '자료 $3, 5, 7, 5, 10$의 평균을 구하시오.',
    '$6$'),
  P('중1', '통계', '자료의 정리와 해석', '중', '객관식',
    '도수분포표에서 계급의 크기가 $10$이고, 계급값이 $25$인 계급은?',
    '③',
    { choices: ['$15$ 이상 $20$ 미만', '$20$ 이상 $25$ 미만', '$20$ 이상 $30$ 미만', '$25$ 이상 $30$ 미만', '$25$ 이상 $35$ 미만'] }),
  P('중1', '통계', '자료의 정리와 해석', '상', '서술형',
    '히스토그램에서 각 계급의 도수가 $2, 5, 8, 4, 1$일 때, 상대도수가 가장 큰 계급의 상대도수를 구하시오.',
    '$0.4$'),

  // ═══════════════════════════════════════════════════════════════════
  //  중2 (18 problems)
  // ═══════════════════════════════════════════════════════════════════

  P('중2', '유리수와 순환소수', '유리수와 순환소수', '하', '단답형',
    '$\\frac{5}{11}$을 순환소수로 나타내시오.',
    '$0.\\overline{45}$'),
  P('중2', '유리수와 순환소수', '유리수와 순환소수', '중', '단답형',
    '순환소수 $0.\\overline{36}$을 기약분수로 나타내시오.',
    '$\\frac{4}{11}$'),
  P('중2', '식의 계산', '단항식의 계산', '하', '단답형',
    '$3a^2b \\times 2ab^3$을 계산하시오.',
    '$6a^3b^4$'),
  P('중2', '식의 계산', '다항식의 계산', '중', '단답형',
    '$(2x+3)(x-4)$를 전개하시오.',
    '$2x^2 - 5x - 12$'),
  P('중2', '부등식과 연립방정식', '일차부등식', '하', '단답형',
    '$2x - 3 > 5$를 풀면?',
    '$x > 4$'),
  P('중2', '부등식과 연립방정식', '일차부등식', '중', '객관식',
    '$-3x + 6 \\leq 0$의 해를 수직선 위에 나타낼 때, 해에 포함되는 가장 작은 정수는?',
    '③',
    { choices: ['$0$', '$1$', '$2$', '$3$', '$4$'] }),
  P('중2', '부등식과 연립방정식', '연립일차방정식', '중', '단답형',
    '$\\begin{cases} x + y = 5 \\\\ 2x - y = 1 \\end{cases}$의 해를 구하시오.',
    '$x = 2,\\ y = 3$'),
  P('중2', '부등식과 연립방정식', '연립일차방정식', '상', '서술형',
    '현재 아버지의 나이는 아들 나이의 $4$배이고, $6$년 후에는 $3$배가 된다고 할 때, 현재 아들의 나이를 구하시오.',
    '$6$세'),
  P('중2', '일차함수', '일차함수와 그래프', '하', '객관식',
    '$y = 2x - 1$의 그래프의 $y$절편은?',
    '②',
    { choices: ['$2$', '$-1$', '$1$', '$-2$', '$0$'] }),
  P('중2', '일차함수', '일차함수와 그래프', '중', '단답형',
    '두 점 $(1, 3)$, $(4, 9)$를 지나는 일차함수의 식을 구하시오.',
    '$y = 2x + 1$'),
  P('중2', '일차함수', '일차함수와 일차방정식의 관계', '상', '서술형',
    '일차함수 $y = ax + b$의 그래프가 점 $(2, 5)$를 지나고 $x$절편이 $-3$일 때, $a + b$의 값을 구하시오.',
    '$a = 1,\\ b = 3,\\ a+b = 4$'),
  P('중2', '도형의 성질', '삼각형의 성질', '하', '단답형',
    '이등변삼각형의 꼭지각이 $40°$일 때, 밑각의 크기를 구하시오.',
    '$70°$'),
  P('중2', '도형의 성질', '사각형의 성질', '중', '객관식',
    '평행사변형의 성질이 아닌 것은?',
    '④',
    { choices: ['두 쌍의 대변이 평행', '두 쌍의 대변의 길이가 같다', '두 쌍의 대각의 크기가 같다', '두 대각선의 길이가 같다', '두 대각선이 서로를 이등분한다'] }),
  P('중2', '도형의 닮음과 피타고라스 정리', '피타고라스 정리', '중', '단답형',
    '직각삼각형에서 두 변의 길이가 $3$, $4$일 때, 빗변의 길이를 구하시오.',
    '$5$'),
  P('중2', '도형의 닮음과 피타고라스 정리', '도형의 닮음', '상', '서술형',
    '$\\triangle ABC \\sim \\triangle DEF$이고 닮음비가 $2:3$이다. $\\triangle ABC$의 넓이가 $12$일 때, $\\triangle DEF$의 넓이를 구하시오.',
    '$27$'),
  P('중2', '확률', '경우의 수', '하', '단답형',
    '주사위 한 개를 던질 때, 짝수의 눈이 나오는 경우의 수를 구하시오.',
    '$3$'),
  P('중2', '확률', '확률', '중', '단답형',
    '주사위를 두 번 던질 때, 눈의 합이 $7$인 확률을 구하시오.',
    '$\\frac{1}{6}$'),
  P('중2', '확률', '확률', '상', '서술형',
    '빨간 공 $3$개, 파란 공 $5$개가 든 주머니에서 공을 $2$개 꺼낼 때, 모두 빨간 공일 확률을 구하시오.',
    '$\\frac{3}{28}$'),

  // ═══════════════════════════════════════════════════════════════════
  //  중3 (18 problems)
  // ═══════════════════════════════════════════════════════════════════

  P('중3', '제곱근과 실수', '제곱근과 실수', '하', '단답형',
    '$\\sqrt{49}$의 값을 구하시오.',
    '$7$'),
  P('중3', '제곱근과 실수', '근호를 포함한 식의 계산', '중', '단답형',
    '$\\sqrt{12} + \\sqrt{27} - \\sqrt{3}$을 간단히 하시오.',
    '$4\\sqrt{3}$'),
  P('중3', '제곱근과 실수', '근호를 포함한 식의 계산', '상', '서술형',
    '$\\frac{1}{\\sqrt{3}+\\sqrt{2}} + \\frac{1}{\\sqrt{3}-\\sqrt{2}}$의 값을 구하시오. (유리화 과정을 포함하시오)',
    '$2\\sqrt{3}$'),
  P('중3', '다항식의 곱셈과 인수분해', '다항식의 곱셈', '하', '단답형',
    '$(x+3)^2$을 전개하시오.',
    '$x^2 + 6x + 9$'),
  P('중3', '다항식의 곱셈과 인수분해', '인수분해', '중', '단답형',
    '$x^2 - 5x + 6$을 인수분해하시오.',
    '$(x-2)(x-3)$'),
  P('중3', '다항식의 곱셈과 인수분해', '인수분해', '상', '서술형',
    '$x^4 - 5x^2 + 4$를 인수분해하시오.',
    '$(x-1)(x+1)(x-2)(x+2)$'),
  P('중3', '이차방정식', '이차방정식의 풀이', '하', '단답형',
    '$x^2 - 4 = 0$의 해를 구하시오.',
    '$x = \\pm 2$'),
  P('중3', '이차방정식', '이차방정식의 풀이', '중', '객관식',
    '이차방정식 $2x^2 - 3x - 2 = 0$의 두 근의 합은?',
    '③',
    { choices: ['$-\\frac{3}{2}$', '$1$', '$\\frac{3}{2}$', '$2$', '$-1$'] }),
  P('중3', '이차방정식', '이차방정식의 활용', '상', '서술형',
    '연속하는 두 자연수의 곱이 $72$일 때, 두 수를 구하시오.',
    '$8, 9$'),
  P('중3', '이차함수', '이차함수와 그래프', '하', '객관식',
    '$y = x^2 - 4x + 3$의 그래프의 꼭짓점 좌표는?',
    '③',
    { choices: ['$(4, 3)$', '$(2, 3)$', '$(2, -1)$', '$(-2, -1)$', '$(-2, 3)$'] }),
  P('중3', '이차함수', '이차함수와 그래프', '중', '단답형',
    '이차함수 $y = a(x-1)^2 + 3$의 그래프가 점 $(3, 5)$를 지날 때, $a$의 값을 구하시오.',
    '$a = \\frac{1}{2}$'),
  P('중3', '이차함수', '이차함수의 활용', '상', '서술형',
    '공을 지면에서 수직으로 위로 던졌을 때, $t$초 후의 높이가 $h = -5t^2 + 20t$ (m)이다. 최고 높이와 그때의 시간을 구하시오.',
    '$t=2$초, $h=20$m'),
  P('중3', '통계', '대푯값과 산포도', '하', '단답형',
    '자료 $2, 4, 6, 8, 10$의 분산을 구하시오.',
    '$8$'),
  P('중3', '통계', '대푯값과 산포도', '중', '단답형',
    '자료 $3, 7, 5, 9, 6$의 표준편차를 구하시오.',
    '$2$'),
  P('중3', '통계', '상관관계', '중', '객관식',
    '두 변량 사이에 양의 상관관계가 있을 때, 산점도의 점들은 어떤 방향으로 분포하는가?',
    '①',
    { choices: ['오른쪽 위로 향하는 띠 모양', '오른쪽 아래로 향하는 띠 모양', '원 모양', '수평 방향', '수직 방향'] }),
  P('중3', '통계', '상관관계', '상', '서술형',
    '수학 성적과 과학 성적의 상관계수가 $0.85$일 때, 이 상관관계의 의미를 서술하시오.',
    '강한 양의 상관관계: 수학 성적이 높을수록 과학 성적도 높은 경향이 있다.'),
  P('중3', '이차방정식', '이차방정식의 풀이', '중', '단답형',
    '이차방정식 $x^2 + 6x + k = 0$이 중근을 가질 때, $k$의 값을 구하시오.',
    '$k = 9$'),
  P('중3', '다항식의 곱셈과 인수분해', '인수분해', '중', '객관식',
    '$x^2 + 2x - 15$를 인수분해한 것은?',
    '②',
    { choices: ['$(x+3)(x-5)$', '$(x+5)(x-3)$', '$(x-5)(x+3)$', '$(x+15)(x-1)$', '$(x-15)(x+1)$'] }),

  // ═══════════════════════════════════════════════════════════════════
  //  고1 (18 problems)
  // ═══════════════════════════════════════════════════════════════════

  P('고1', '다항식', '다항식의 연산', '하', '단답형',
    '$(2x^3 + 3x - 1) + (x^3 - 5x + 4)$를 계산하시오.',
    '$3x^3 - 2x + 3$'),
  P('고1', '다항식', '나머지정리', '중', '단답형',
    '다항식 $f(x) = x^3 - 2x^2 + 3x - 4$를 $(x-1)$로 나눈 나머지를 구하시오.',
    '$-2$'),
  P('고1', '다항식', '인수분해', '상', '서술형',
    '$x^3 + 3x^2 - 4$를 인수분해하시오.',
    '$(x-1)(x^2+4x+4) = (x-1)(x+2)^2$'),
  P('고1', '방정식과 부등식', '복소수', '하', '단답형',
    '$(2+3i) + (4-i)$를 계산하시오. (단, $i = \\sqrt{-1}$)',
    '$6 + 2i$'),
  P('고1', '방정식과 부등식', '복소수', '중', '단답형',
    '$(1+2i)(3-i)$를 계산하시오.',
    '$5 + 5i$'),
  P('고1', '방정식과 부등식', '이차방정식', '중', '객관식',
    '이차방정식 $x^2 - 4x + 1 = 0$의 두 근의 곱은?',
    '①',
    { choices: ['$1$', '$4$', '$-1$', '$-4$', '$2$'] }),
  P('고1', '방정식과 부등식', '여러 가지 부등식', '상', '서술형',
    '부등식 $|2x - 3| < 5$를 풀고, 정수인 해의 개수를 구하시오.',
    '$-1 < x < 4$이므로 정수 해: $0, 1, 2, 3$ → $4$개'),
  P('고1', '도형의 방정식', '평면좌표', '하', '단답형',
    '두 점 $A(1, 2)$, $B(5, 6)$ 사이의 거리를 구하시오.',
    '$4\\sqrt{2}$'),
  P('고1', '도형의 방정식', '직선의 방정식', '중', '단답형',
    '두 점 $(1, 3)$, $(3, 7)$을 지나는 직선의 방정식을 구하시오.',
    '$y = 2x + 1$'),
  P('고1', '도형의 방정식', '원의 방정식', '중', '객관식',
    '원 $(x-2)^2 + (y+1)^2 = 9$의 중심과 반지름은?',
    '③',
    { choices: ['중심 $(2,1)$, 반지름 $3$', '중심 $(-2,1)$, 반지름 $9$', '중심 $(2,-1)$, 반지름 $3$', '중심 $(2,-1)$, 반지름 $9$', '중심 $(-2,-1)$, 반지름 $3$'] }),
  P('고1', '도형의 방정식', '원의 방정식', '상', '서술형',
    '원 $x^2 + y^2 = 25$ 위의 점 $(3, 4)$에서의 접선의 방정식을 구하시오.',
    '$3x + 4y = 25$'),
  P('고1', '도형의 방정식', '도형의 이동', '중', '단답형',
    '점 $(3, -2)$를 $x$축에 대하여 대칭이동한 점의 좌표를 구하시오.',
    '$(3, 2)$'),
  P('고1', '집합과 명제', '집합', '하', '객관식',
    '$A = \\{1, 2, 3\\}$, $B = \\{2, 3, 4\\}$일 때, $A \\cap B$는?',
    '②',
    { choices: ['$\\{1, 2, 3, 4\\}$', '$\\{2, 3\\}$', '$\\{1\\}$', '$\\{4\\}$', '$\\{1, 4\\}$'] }),
  P('고1', '집합과 명제', '명제', '중', '객관식',
    '명제 "모든 소수는 홀수이다"의 반례는?',
    '①',
    { choices: ['$2$', '$3$', '$5$', '$7$', '반례 없음'] }),
  P('고1', '함수', '함수', '중', '단답형',
    '$f(x) = 2x + 1$이고 $g(x) = x^2$일 때, $(g \\circ f)(2)$의 값을 구하시오.',
    '$25$'),
  P('고1', '함수', '유리함수와 무리함수', '상', '서술형',
    '$y = \\frac{2x+1}{x-1}$의 그래프의 점근선을 모두 구하시오.',
    '수직점근선: $x = 1$, 수평점근선: $y = 2$'),
  P('고1', '방정식과 부등식', '이차함수와 이차방정식', '중', '단답형',
    '이차함수 $y = x^2 - 6x + 5$의 최솟값을 구하시오.',
    '$-4$'),
  P('고1', '다항식', '나머지정리', '상', '서술형',
    '다항식 $f(x)$를 $(x-1)(x+2)$로 나눈 나머지가 $2x+3$이다. $f(1)$, $f(-2)$의 값을 각각 구하시오.',
    '$f(1) = 5,\\ f(-2) = -1$'),

  // ═══════════════════════════════════════════════════════════════════
  //  고2 (18 problems)
  // ═══════════════════════════════════════════════════════════════════

  P('고2', '수학I - 지수와 로그', '지수', '하', '단답형',
    '$2^3 \\times 2^5$를 계산하시오.',
    '$2^8 = 256$'),
  P('고2', '수학I - 지수와 로그', '로그', '중', '단답형',
    '$\\log_2 32$의 값을 구하시오.',
    '$5$'),
  P('고2', '수학I - 지수와 로그', '로그', '상', '서술형',
    '$\\log_3 5 = a$, $\\log_3 7 = b$일 때, $\\log_3 \\frac{35}{9}$를 $a$, $b$로 나타내시오.',
    '$a + b - 2$'),
  P('고2', '수학I - 지수함수와 로그함수', '지수함수', '중', '객관식',
    '함수 $y = 3^{x-1} + 2$의 그래프의 점근선은?',
    '④',
    { choices: ['$y = 0$', '$y = 1$', '$x = 1$', '$y = 2$', '$x = 2$'] }),
  P('고2', '수학I - 지수함수와 로그함수', '로그함수', '중', '단답형',
    '$\\log_2(x+3) = 4$를 만족시키는 $x$의 값을 구하시오.',
    '$x = 13$'),
  P('고2', '수학I - 삼각함수', '삼각함수', '하', '단답형',
    '$\\sin 30° + \\cos 60°$의 값을 구하시오.',
    '$1$'),
  P('고2', '수학I - 삼각함수', '삼각함수의 그래프', '중', '객관식',
    '$y = 2\\sin(x - \\frac{\\pi}{3})$의 주기는?',
    '②',
    { choices: ['$\\pi$', '$2\\pi$', '$3\\pi$', '$\\frac{\\pi}{3}$', '$4\\pi$'] }),
  P('고2', '수학I - 삼각함수', '사인법칙과 코사인법칙', '상', '서술형',
    '$\\triangle ABC$에서 $a = 7$, $b = 8$, $C = 60°$일 때, $c$의 값을 구하시오. (코사인법칙 사용)',
    '$c = \\sqrt{57}$'),
  P('고2', '수학I - 수열', '등차수열과 등비수열', '하', '단답형',
    '첫째항이 $3$, 공차가 $2$인 등차수열의 제$10$항을 구하시오.',
    '$21$'),
  P('고2', '수학I - 수열', '수열의 합', '중', '단답형',
    '$\\sum_{k=1}^{10} (2k - 1)$의 값을 구하시오.',
    '$100$'),
  P('고2', '수학I - 수열', '수학적 귀납법', '상', '서술형',
    '수학적 귀납법을 이용하여 $1 + 2 + 3 + \\cdots + n = \\frac{n(n+1)}{2}$임을 증명하시오.',
    '(i) $n=1$: 좌변$=1$, 우변$=1$ (참)\n(ii) $n=k$ 성립 가정, $n=k+1$일 때 좌변$=\\frac{k(k+1)}{2}+(k+1)=\\frac{(k+1)(k+2)}{2}$'),
  P('고2', '수학II - 함수의 극한과 연속', '함수의 극한', '하', '단답형',
    '$\\lim_{x \\to 2} (3x + 1)$의 값을 구하시오.',
    '$7$'),
  P('고2', '수학II - 함수의 극한과 연속', '함수의 연속', '중', '객관식',
    '함수 $f(x) = \\begin{cases} x^2 & (x \\neq 1) \\\\ k & (x = 1) \\end{cases}$가 $x = 1$에서 연속이 되려면 $k$의 값은?',
    '①',
    { choices: ['$1$', '$0$', '$2$', '$-1$', '존재하지 않는다'] }),
  P('고2', '수학II - 미분', '미분계수와 도함수', '중', '단답형',
    '$f(x) = x^3 - 3x^2 + 2x$일 때, $f\'(1)$의 값을 구하시오.',
    '$-1$'),
  P('고2', '수학II - 미분', '도함수의 활용', '상', '서술형',
    '함수 $f(x) = x^3 - 6x^2 + 9x + 1$의 극댓값과 극솟값을 구하시오.',
    '극댓값: $f(1) = 5$, 극솟값: $f(3) = 1$'),
  P('고2', '수학II - 적분', '부정적분', '하', '단답형',
    '$\\int (3x^2 + 2x) \\, dx$를 구하시오.',
    '$x^3 + x^2 + C$'),
  P('고2', '수학II - 적분', '정적분', '중', '단답형',
    '$\\int_0^2 (x^2 + 1) \\, dx$의 값을 구하시오.',
    '$\\frac{14}{3}$'),
  P('고2', '수학II - 적분', '정적분의 활용', '상', '서술형',
    '곡선 $y = x^2$과 직선 $y = 2x$로 둘러싸인 도형의 넓이를 구하시오.',
    '$\\frac{4}{3}$'),

  // ═══════════════════════════════════════════════════════════════════
  //  고3 (18 problems)
  // ═══════════════════════════════════════════════════════════════════

  P('고3', '확률과 통계 - 경우의 수', '순열과 조합', '하', '단답형',
    '$_5P_2$의 값을 구하시오.',
    '$20$'),
  P('고3', '확률과 통계 - 경우의 수', '순열과 조합', '중', '단답형',
    '$_7C_3$의 값을 구하시오.',
    '$35$'),
  P('고3', '확률과 통계 - 경우의 수', '이항정리', '상', '서술형',
    '$(x + 2)^5$의 전개식에서 $x^3$의 계수를 구하시오.',
    '$_5C_2 \\cdot 2^2 = 40$'),
  P('고3', '확률과 통계 - 확률', '확률의 뜻과 활용', '하', '객관식',
    '서로 독립인 두 사건 $A$, $B$에 대해 $P(A) = 0.3$, $P(B) = 0.5$일 때, $P(A \\cap B)$는?',
    '②',
    { choices: ['$0.8$', '$0.15$', '$0.2$', '$0.35$', '$0.65$'] }),
  P('고3', '확률과 통계 - 확률', '조건부확률', '중', '단답형',
    '$P(A) = 0.6$, $P(B|A) = 0.5$일 때, $P(A \\cap B)$의 값을 구하시오.',
    '$0.3$'),
  P('고3', '확률과 통계 - 확률', '조건부확률', '상', '서술형',
    '주머니에 흰 공 $4$개, 검은 공 $6$개가 있다. 공을 하나 꺼낸 후 되돌려 넣지 않고 두 번째 공을 꺼낼 때, 첫 번째가 흰 공이고 두 번째도 흰 공일 확률을 구하시오.',
    '$\\frac{4}{10} \\times \\frac{3}{9} = \\frac{2}{15}$'),
  P('고3', '확률과 통계 - 통계', '확률분포', '중', '단답형',
    '이산확률변수 $X$의 확률분포가 $P(X=0)=0.1$, $P(X=1)=0.3$, $P(X=2)=0.4$, $P(X=3)=0.2$일 때, $E(X)$를 구하시오.',
    '$1.7$'),
  P('고3', '확률과 통계 - 통계', '통계적 추정', '상', '서술형',
    '정규분포 $N(50, 4^2)$을 따르는 모집단에서 크기 $16$인 표본을 추출할 때, 표본평균 $\\bar{X}$의 분포를 구하시오.',
    '$\\bar{X} \\sim N(50, 1^2)$'),
  P('고3', '미적분 - 수열의 극한', '수열의 극한', '하', '단답형',
    '$\\lim_{n \\to \\infty} \\frac{3n+1}{n+2}$의 값을 구하시오.',
    '$3$'),
  P('고3', '미적분 - 수열의 극한', '급수', '중', '단답형',
    '$\\sum_{n=1}^{\\infty} \\frac{1}{2^n}$의 값을 구하시오.',
    '$1$'),
  P('고3', '미적분 - 미분법', '여러 가지 함수의 미분', '중', '단답형',
    '$y = e^{2x} \\sin x$일 때, $y\'$을 구하시오.',
    '$y\' = e^{2x}(2\\sin x + \\cos x)$'),
  P('고3', '미적분 - 미분법', '여러 가지 미분법', '상', '서술형',
    '$y = \\ln(x^2 + 1)$을 미분하시오.',
    '$y\' = \\frac{2x}{x^2 + 1}$'),
  P('고3', '미적분 - 미분법', '도함수의 활용', '중', '객관식',
    '함수 $f(x) = xe^{-x}$의 극댓값을 가지는 $x$의 값은?',
    '③',
    { choices: ['$0$', '$-1$', '$1$', '$2$', '$e$'] }),
  P('고3', '미적분 - 적분법', '여러 가지 적분법', '중', '단답형',
    '$\\int x e^x \\, dx$를 구하시오. (부분적분 사용)',
    '$(x-1)e^x + C$'),
  P('고3', '미적분 - 적분법', '정적분의 활용', '상', '서술형',
    '곡선 $y = e^x$, $x$축, 직선 $x = 0$, $x = 1$로 둘러싸인 도형의 넓이를 구하시오.',
    '$e - 1$'),
  P('고3', '기하 - 이차곡선', '이차곡선', '중', '단답형',
    '포물선 $y^2 = 12x$의 초점의 좌표를 구하시오.',
    '$(3, 0)$'),
  P('고3', '기하 - 평면벡터', '벡터의 연산', '하', '단답형',
    '$\\vec{a} = (2, 3)$, $\\vec{b} = (1, -1)$일 때, $\\vec{a} + \\vec{b}$를 구하시오.',
    '$(3, 2)$'),
  P('고3', '기하 - 평면벡터', '평면벡터의 성분과 내적', '중', '단답형',
    '$\\vec{a} = (1, 2)$, $\\vec{b} = (3, -1)$일 때, $\\vec{a} \\cdot \\vec{b}$의 값을 구하시오.',
    '$1$'),
];

// =========================================================================
//  3. MOCK ASSIGNMENTS (8 assignments)
// =========================================================================

export interface MockAssignment {
  id: string;
  academyId: string;
  teacherId: string;
  title: string;
  description: string;
  grade: Grade;
  subject: string;
  dueDate: Date;
  problemIds: string[];         // references into mockProblems
  assignedStudentIds: string[];
  status: AssignmentStatus;
  createdAt: Date;
}

export const mockAssignments: MockAssignment[] = [
  {
    id: 'A1', academyId: 'academy1', teacherId: 'T1',
    title: '중1 수와 연산 기본 테스트',
    description: '소인수분해와 정수 연산 기초 문제입니다.',
    grade: '중1', subject: '수와 연산',
    dueDate: daysAgo(-2),  // 2 days from now (future)
    problemIds: ['PROB-001', 'PROB-002', 'PROB-003', 'PROB-004', 'PROB-005'],
    assignedStudentIds: ['S1'],
    status: 'published',
    createdAt: daysAgo(7),
  },
  {
    id: 'A2', academyId: 'academy1', teacherId: 'T1',
    title: '중2 연립방정식 연습',
    description: '일차부등식과 연립일차방정식 풀기입니다.',
    grade: '중2', subject: '부등식과 연립방정식',
    dueDate: daysAgo(-1),
    problemIds: ['PROB-023', 'PROB-024', 'PROB-025', 'PROB-026'],
    assignedStudentIds: ['S2'],
    status: 'published',
    createdAt: daysAgo(10),
  },
  {
    id: 'A3', academyId: 'academy1', teacherId: 'T1',
    title: '중3 이차방정식 종합',
    description: '이차방정식의 풀이와 활용 종합 테스트입니다.',
    grade: '중3', subject: '이차방정식',
    dueDate: daysAgo(3),
    problemIds: ['PROB-043', 'PROB-044', 'PROB-045', 'PROB-052', 'PROB-053'],
    assignedStudentIds: ['S3'],
    status: 'closed',
    createdAt: daysAgo(14),
  },
  {
    id: 'A4', academyId: 'academy1', teacherId: 'T1',
    title: '고1 다항식과 방정식',
    description: '다항식의 연산, 나머지정리, 복소수 문제입니다.',
    grade: '고1', subject: '다항식',
    dueDate: daysAgo(-3),
    problemIds: ['PROB-055', 'PROB-056', 'PROB-057', 'PROB-058', 'PROB-059', 'PROB-060'],
    assignedStudentIds: ['S4', 'S5', 'S6'],
    status: 'published',
    createdAt: daysAgo(5),
  },
  {
    id: 'A5', academyId: 'academy1', teacherId: 'T2',
    title: '고1 도형의 방정식 심화',
    description: '원의 방정식과 접선 문제 심화입니다.',
    grade: '고1', subject: '도형의 방정식',
    dueDate: daysAgo(1),
    problemIds: ['PROB-062', 'PROB-063', 'PROB-064', 'PROB-065', 'PROB-066'],
    assignedStudentIds: ['S4', 'S5', 'S6'],
    status: 'closed',
    createdAt: daysAgo(12),
  },
  {
    id: 'A6', academyId: 'academy1', teacherId: 'T2',
    title: '고2 미적분 기초',
    description: '극한, 미분계수, 부정적분 기초 문제입니다.',
    grade: '고2', subject: '수학II - 미분',
    dueDate: daysAgo(-4),
    problemIds: ['PROB-084', 'PROB-085', 'PROB-086', 'PROB-087', 'PROB-088', 'PROB-089'],
    assignedStudentIds: ['S7', 'S8'],
    status: 'published',
    createdAt: daysAgo(3),
  },
  {
    id: 'A7', academyId: 'academy1', teacherId: 'T2',
    title: '고3 확률과 통계',
    description: '순열, 조합, 조건부확률 문제입니다.',
    grade: '고3', subject: '확률과 통계 - 확률',
    dueDate: daysAgo(5),
    problemIds: ['PROB-091', 'PROB-092', 'PROB-093', 'PROB-094', 'PROB-095', 'PROB-096'],
    assignedStudentIds: ['S9', 'S10'],
    status: 'closed',
    createdAt: daysAgo(18),
  },
  {
    id: 'A8', academyId: 'academy1', teacherId: 'T1',
    title: '고3 미적분 심화 (초안)',
    description: '급수, 미분법, 적분법 심화 - 아직 배포 전입니다.',
    grade: '고3', subject: '미적분 - 미분법',
    dueDate: daysAgo(-10),
    problemIds: ['PROB-099', 'PROB-100', 'PROB-101', 'PROB-102', 'PROB-103', 'PROB-104', 'PROB-105'],
    assignedStudentIds: ['S9', 'S10'],
    status: 'draft',
    createdAt: daysAgo(1),
  },
];

// =========================================================================
//  4. MOCK SUBMISSIONS  (30-50 per student, ~400 total)
// =========================================================================

export interface MockSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  problemId: string;
  studentAnswer: string;
  isCorrect: boolean;
  score: number;           // 0-100 per problem
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
  timeTakenSeconds: number; // how long the student took
}

/**
 * Generate submissions for a student.
 * `weakTopics` is a list of topic strings the student is weak in;
 * problems matching those topics have a lower correct probability.
 */
function generateSubmissions(
  studentId: string,
  grade: Grade,
  weakTopics: string[],
  count: number,
): MockSubmission[] {
  // Filter problems for this grade
  const gradeProblems = mockProblems.filter(p => p.grade === grade);
  const subs: MockSubmission[] = [];

  // Find assignments for this student
  const studentAssignments = mockAssignments.filter(
    a => a.assignedStudentIds.includes(studentId) && a.status !== 'draft'
  );

  for (let i = 0; i < count; i++) {
    // Pick a problem: cycle through grade problems
    const prob = gradeProblems[i % gradeProblems.length];
    const isWeakTopic = weakTopics.some(t =>
      prob.topic.includes(t) || prob.subject.includes(t)
    );

    // Correct probability: weak topic → 25%, normal → 75%
    const isCorrect = Math.random() < (isWeakTopic ? 0.25 : 0.75);

    // Pick a matching assignment or use A1 as fallback
    const matchingAssignment = studentAssignments.find(
      a => a.problemIds.includes(prob.id)
    ) || studentAssignments[0] || mockAssignments[0];

    const dayOffset = Math.floor((i / count) * 28); // spread across 4 weeks
    const submitted = daysAgo(28 - dayOffset, 14 + Math.floor(Math.random() * 6));

    subs.push({
      id: `SUB-${studentId}-${String(i + 1).padStart(3, '0')}`,
      assignmentId: matchingAssignment.id,
      studentId,
      problemId: prob.id,
      studentAnswer: isCorrect ? prob.answer : '오답 답안',
      isCorrect,
      score: isCorrect ? 100 : Math.floor(Math.random() * 40),
      feedback: isCorrect ? '잘 풀었습니다!' : undefined,
      submittedAt: submitted,
      gradedAt: new Date(submitted.getTime() + 86400000), // graded next day
      timeTakenSeconds: 60 + Math.floor(Math.random() * 540), // 1-10 min
    });
  }
  return subs;
}

export const mockSubmissions: MockSubmission[] = [
  ...generateSubmissions('S1', '중1', ['기본 도형', '통계'], 35),
  ...generateSubmissions('S2', '중2', ['도형의 성질', '확률'], 40),
  ...generateSubmissions('S3', '중3', ['통계', '이차함수'], 38),
  ...generateSubmissions('S4', '고1', ['도형의 방정식'], 45),
  ...generateSubmissions('S5', '고1', ['도형의 방정식', '집합과 명제'], 42),
  ...generateSubmissions('S6', '고1', ['도형의 방정식'], 30),
  ...generateSubmissions('S7', '고2', ['수학II - 미분', '수학II - 적분'], 48),
  ...generateSubmissions('S8', '고2', ['수학II - 적분'], 35),
  ...generateSubmissions('S9', '고3', ['미적분 - 적분법'], 50),
  ...generateSubmissions('S10', '고3', ['미적분 - 적분법', '기하 - 이차곡선'], 40),
];

// =========================================================================
//  5. MOCK WRONG NOTES  (derived from incorrect submissions)
// =========================================================================

export interface MockWrongNote {
  id: string;
  studentId: string;
  problemId: string;
  assignmentId: string;
  studentAnswer: string;
  correctAnswer: string;
  reviewCount: number;
  reviewStatus: ReviewStatus;
  isLearned: boolean;
  lastReviewDate?: Date;
  createdAt: Date;
}

/** Auto-generate wrong notes from incorrect submissions */
export const mockWrongNotes: MockWrongNote[] = mockSubmissions
  .filter(s => !s.isCorrect)
  .map((s, idx) => ({
    id: `WN-${String(idx + 1).padStart(4, '0')}`,
    studentId: s.studentId,
    problemId: s.problemId,
    assignmentId: s.assignmentId,
    studentAnswer: s.studentAnswer,
    correctAnswer: mockProblems.find(p => p.id === s.problemId)?.answer || '',
    reviewCount: Math.floor(Math.random() * 4),
    reviewStatus: (['미복습', '복습중', '숙련'] as ReviewStatus[])[
      Math.floor(Math.random() * 3)
    ],
    isLearned: Math.random() < 0.15,
    lastReviewDate: Math.random() > 0.5 ? daysAgo(Math.floor(Math.random() * 7)) : undefined,
    createdAt: s.submittedAt,
  }));

// =========================================================================
//  6. MOCK SCHEDULES (for parent view)
// =========================================================================

export interface MockScheduleItem {
  id: string;
  studentId: string;
  dayOfWeek: number;     // 0=Sun ... 6=Sat
  startTime: string;     // 'HH:mm'
  endTime: string;
  subject: string;
  teacherName: string;
}

export const mockSchedules: MockScheduleItem[] = [
  { id: 'SCH-1', studentId: 'S1', dayOfWeek: 1, startTime: '16:00', endTime: '18:00', subject: '수학 기초반', teacherName: '김수학' },
  { id: 'SCH-2', studentId: 'S1', dayOfWeek: 3, startTime: '16:00', endTime: '18:00', subject: '수학 기초반', teacherName: '김수학' },
  { id: 'SCH-3', studentId: 'S1', dayOfWeek: 5, startTime: '16:00', endTime: '17:30', subject: '수학 보충', teacherName: '박기하' },
  { id: 'SCH-4', studentId: 'S3', dayOfWeek: 2, startTime: '17:00', endTime: '19:00', subject: '수학 심화반', teacherName: '김수학' },
  { id: 'SCH-5', studentId: 'S3', dayOfWeek: 4, startTime: '17:00', endTime: '19:00', subject: '수학 심화반', teacherName: '김수학' },
  { id: 'SCH-6', studentId: 'S4', dayOfWeek: 1, startTime: '18:00', endTime: '20:00', subject: '고등 수학', teacherName: '박기하' },
  { id: 'SCH-7', studentId: 'S4', dayOfWeek: 3, startTime: '18:00', endTime: '20:00', subject: '고등 수학', teacherName: '박기하' },
  { id: 'SCH-8', studentId: 'S7', dayOfWeek: 2, startTime: '19:00', endTime: '21:00', subject: '수학II 정규반', teacherName: '김수학' },
  { id: 'SCH-9', studentId: 'S7', dayOfWeek: 4, startTime: '19:00', endTime: '21:00', subject: '수학II 정규반', teacherName: '김수학' },
  { id: 'SCH-10', studentId: 'S9', dayOfWeek: 1, startTime: '19:00', endTime: '21:30', subject: '수능대비반', teacherName: '박기하' },
  { id: 'SCH-11', studentId: 'S9', dayOfWeek: 3, startTime: '19:00', endTime: '21:30', subject: '수능대비반', teacherName: '박기하' },
  { id: 'SCH-12', studentId: 'S9', dayOfWeek: 5, startTime: '19:00', endTime: '21:00', subject: '모의고사 풀이', teacherName: '김수학' },
];
```

---

## File 2: `src/services/mock/mockProblemBank.ts`

```typescript
// src/services/mock/mockProblemBank.ts
//
// Implements IProblemBankService using in-memory data + AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IProblemBankService, ProblemBankFilters } from '../interfaces/problemBank';
import type { ProblemBankItem } from '../../types/problemBank';
import { mockProblems, MockProblem } from './mockData';

const STORAGE_KEY = '@mathpia/problemBank';

/** Convert internal MockProblem to the public ProblemBankItem type */
function toItem(p: MockProblem): ProblemBankItem {
  return {
    id: p.id,
    content: p.content,
    contentHtml: p.contentHtml,
    imageUrls: p.imageUrls || [],
    answer: p.answer,
    solution: p.solution,
    difficulty: p.difficulty,
    type: p.type,
    choices: p.choices,
    grade: p.grade,
    subject: p.subject,
    topic: p.topic,
    tags: p.tags,
    source: p.source,
    sourceType: p.sourceType,
    points: p.points,
    usageCount: p.usageCount,
    correctRate: p.correctRate,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    createdBy: p.createdBy,
  };
}

export class MockProblemBankService implements IProblemBankService {
  private problems: ProblemBankItem[] = [];
  private initialized = false;

  /** Load from AsyncStorage, falling back to mockData */
  private async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.problems = JSON.parse(stored);
      } else {
        this.problems = mockProblems.map(toItem);
        await this.persist();
      }
    } catch {
      this.problems = mockProblems.map(toItem);
    }
    this.initialized = true;
  }

  private async persist(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.problems));
  }

  // ── CRUD ──

  async getAll(): Promise<ProblemBankItem[]> {
    await this.init();
    return [...this.problems];
  }

  async getById(id: string): Promise<ProblemBankItem | null> {
    await this.init();
    return this.problems.find(p => p.id === id) || null;
  }

  async getByIds(ids: string[]): Promise<ProblemBankItem[]> {
    await this.init();
    const idSet = new Set(ids);
    return this.problems.filter(p => idSet.has(p.id));
  }

  async create(item: Omit<ProblemBankItem, 'id' | 'createdAt'>): Promise<ProblemBankItem> {
    await this.init();
    const newItem: ProblemBankItem = {
      ...item,
      id: `PROB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.problems.unshift(newItem);
    await this.persist();
    return newItem;
  }

  async update(id: string, updates: Partial<ProblemBankItem>): Promise<ProblemBankItem | null> {
    await this.init();
    const idx = this.problems.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.problems[idx] = { ...this.problems[idx], ...updates, id };
    await this.persist();
    return this.problems[idx];
  }

  async delete(id: string): Promise<boolean> {
    await this.init();
    const before = this.problems.length;
    this.problems = this.problems.filter(p => p.id !== id);
    if (this.problems.length < before) {
      await this.persist();
      return true;
    }
    return false;
  }

  // ── Search & Filter ──

  async search(query: string, filters?: ProblemBankFilters): Promise<ProblemBankItem[]> {
    await this.init();
    let results = [...this.problems];

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(p =>
        p.content.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Apply filters
    if (filters) {
      if (filters.grade) results = results.filter(p => p.grade === filters.grade);
      if (filters.subject) results = results.filter(p => p.subject === filters.subject);
      if (filters.topic) results = results.filter(p => p.topic === filters.topic);
      if (filters.difficulty) results = results.filter(p => p.difficulty === filters.difficulty);
      if (filters.type) results = results.filter(p => p.type === filters.type);
      if (filters.sourceType) results = results.filter(p => p.sourceType === filters.sourceType);
    }

    return results;
  }

  async incrementUsageCount(id: string): Promise<void> {
    await this.init();
    const item = this.problems.find(p => p.id === id);
    if (item) {
      item.usageCount = (item.usageCount || 0) + 1;
      await this.persist();
    }
  }
}
```

---

## File 3: `src/services/mock/mockAssignment.ts`

```typescript
// src/services/mock/mockAssignment.ts
//
// Implements IAssignmentService.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IAssignmentService } from '../interfaces/assignment';
import type { Grade } from '../../types';
import {
  mockAssignments, MockAssignment, AssignmentStatus,
  mockSubmissions, MockSubmission,
} from './mockData';

const ASSIGNMENTS_KEY = '@mathpia/assignments';
const SUBMISSIONS_KEY = '@mathpia/submissions';

export class MockAssignmentService implements IAssignmentService {
  private assignments: MockAssignment[] = [];
  private submissions: MockSubmission[] = [];
  private initialized = false;

  private async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const [aStr, sStr] = await Promise.all([
        AsyncStorage.getItem(ASSIGNMENTS_KEY),
        AsyncStorage.getItem(SUBMISSIONS_KEY),
      ]);
      this.assignments = aStr ? JSON.parse(aStr) : [...mockAssignments];
      this.submissions = sStr ? JSON.parse(sStr) : [...mockSubmissions];
      if (!aStr) await AsyncStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(this.assignments));
      if (!sStr) await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(this.submissions));
    } catch {
      this.assignments = [...mockAssignments];
      this.submissions = [...mockSubmissions];
    }
    this.initialized = true;
  }

  private async persistAssignments(): Promise<void> {
    await AsyncStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(this.assignments));
  }

  private async persistSubmissions(): Promise<void> {
    await AsyncStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(this.submissions));
  }

  // ── Assignment CRUD ──

  async getAllAssignments(teacherId?: string): Promise<MockAssignment[]> {
    await this.init();
    if (teacherId) return this.assignments.filter(a => a.teacherId === teacherId);
    return [...this.assignments];
  }

  async getAssignmentById(id: string): Promise<MockAssignment | null> {
    await this.init();
    return this.assignments.find(a => a.id === id) || null;
  }

  async getAssignmentsForStudent(studentId: string): Promise<MockAssignment[]> {
    await this.init();
    return this.assignments.filter(
      a => a.assignedStudentIds.includes(studentId) && a.status !== 'draft'
    );
  }

  async createAssignment(data: Omit<MockAssignment, 'id' | 'createdAt'>): Promise<MockAssignment> {
    await this.init();
    const newA: MockAssignment = {
      ...data,
      id: `A-${Date.now()}`,
      createdAt: new Date(),
    };
    this.assignments.push(newA);
    await this.persistAssignments();
    return newA;
  }

  async updateAssignment(id: string, updates: Partial<MockAssignment>): Promise<MockAssignment | null> {
    await this.init();
    const idx = this.assignments.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.assignments[idx] = { ...this.assignments[idx], ...updates, id };
    await this.persistAssignments();
    return this.assignments[idx];
  }

  async updateStatus(id: string, status: AssignmentStatus): Promise<void> {
    await this.updateAssignment(id, { status });
  }

  // ── Submissions ──

  async getSubmissionsForAssignment(assignmentId: string): Promise<MockSubmission[]> {
    await this.init();
    return this.submissions.filter(s => s.assignmentId === assignmentId);
  }

  async getSubmissionsForStudent(studentId: string): Promise<MockSubmission[]> {
    await this.init();
    return this.submissions.filter(s => s.studentId === studentId);
  }

  async submitAnswer(submission: Omit<MockSubmission, 'id'>): Promise<MockSubmission> {
    await this.init();
    const newSub: MockSubmission = {
      ...submission,
      id: `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    this.submissions.push(newSub);
    await this.persistSubmissions();
    return newSub;
  }

  async gradeSubmission(
    submissionId: string,
    score: number,
    feedback?: string,
  ): Promise<MockSubmission | null> {
    await this.init();
    const idx = this.submissions.findIndex(s => s.id === submissionId);
    if (idx === -1) return null;
    this.submissions[idx] = {
      ...this.submissions[idx],
      score,
      feedback,
      isCorrect: score >= 80,
      gradedAt: new Date(),
    };
    await this.persistSubmissions();
    return this.submissions[idx];
  }

  // ── Statistics ──

  async getAssignmentStats(assignmentId: string): Promise<{
    totalStudents: number;
    submittedCount: number;
    averageScore: number;
    completionRate: number;
  }> {
    await this.init();
    const assignment = this.assignments.find(a => a.id === assignmentId);
    if (!assignment) return { totalStudents: 0, submittedCount: 0, averageScore: 0, completionRate: 0 };

    const subs = this.submissions.filter(s => s.assignmentId === assignmentId);
    const uniqueStudents = new Set(subs.map(s => s.studentId));
    const scores = subs.filter(s => s.score !== undefined).map(s => s.score);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    return {
      totalStudents: assignment.assignedStudentIds.length,
      submittedCount: uniqueStudents.size,
      averageScore: Math.round(avg),
      completionRate: assignment.assignedStudentIds.length > 0
        ? Math.round((uniqueStudents.size / assignment.assignedStudentIds.length) * 100)
        : 0,
    };
  }
}
```

---

## File 4: `src/services/mock/mockAnalytics.ts`

```typescript
// src/services/mock/mockAnalytics.ts
//
// Implements IAnalyticsService. All analytics are computed from submission data.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IAnalyticsService, StudentAnalytics, WeaknessAnalysis, TopicScore } from '../interfaces/analytics';
import { mockSubmissions, mockProblems, mockStudents, MockSubmission } from './mockData';

const ANALYTICS_CACHE_KEY = '@mathpia/analyticsCache';

export class MockAnalyticsService implements IAnalyticsService {
  /** Get all submissions for a student (from AsyncStorage or in-memory fallback) */
  private async getStudentSubmissions(studentId: string): Promise<MockSubmission[]> {
    try {
      const stored = await AsyncStorage.getItem('@mathpia/submissions');
      const subs: MockSubmission[] = stored ? JSON.parse(stored) : mockSubmissions;
      return subs.filter(s => s.studentId === studentId);
    } catch {
      return mockSubmissions.filter(s => s.studentId === studentId);
    }
  }

  async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    const subs = await this.getStudentSubmissions(studentId);
    const student = mockStudents.find(s => s.id === studentId);

    // Per-topic aggregation
    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const sub of subs) {
      const prob = mockProblems.find(p => p.id === sub.problemId);
      if (!prob) continue;
      const key = prob.topic;
      const cur = topicMap.get(key) || { correct: 0, total: 0 };
      cur.total++;
      if (sub.isCorrect) cur.correct++;
      topicMap.set(key, cur);
    }

    const subjectScores: TopicScore[] = [];
    topicMap.forEach((val, topic) => {
      subjectScores.push({
        topic,
        score: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
        totalAttempts: val.total,
        correctCount: val.correct,
      });
    });

    // Sort to find weak and strong topics
    const sorted = [...subjectScores].sort((a, b) => a.score - b.score);
    const weakTopics = sorted.slice(0, 3).map(t => t.topic);
    const strongTopics = sorted.slice(-3).reverse().map(t => t.topic);

    const totalCorrect = subs.filter(s => s.isCorrect).length;
    const overallScore = subs.length > 0 ? Math.round((totalCorrect / subs.length) * 100) : 0;

    // Calculate streak days (consecutive days with submissions in last 4 weeks)
    const dateSet = new Set(
      subs.map(s => {
        const d = new Date(s.submittedAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
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

    return {
      studentId,
      studentName: student?.name || '',
      grade: student?.grade || '중1',
      subjectScores,
      weakTopics,
      strongTopics,
      overallScore,
      totalSolved: subs.length,
      totalCorrect,
      streakDays,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getWeaknessAnalysis(studentId: string): Promise<WeaknessAnalysis> {
    const analytics = await this.getStudentAnalytics(studentId);
    const weakScores = analytics.subjectScores
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    return {
      studentId,
      weakTopics: weakScores.map(ts => ({
        topic: ts.topic,
        score: ts.score,
        reason: ts.score < 40
          ? `정답률 ${ts.score}%로 매우 낮습니다. 기초 개념 복습이 필요합니다.`
          : `정답률 ${ts.score}%로 보통 이하입니다. 유형별 추가 연습이 필요합니다.`,
        recommendedCount: ts.score < 40 ? 10 : 5,
      })),
      analyzedAt: new Date().toISOString(),
    };
  }

  async getClassAnalytics(teacherId: string): Promise<{
    averageScore: number;
    studentCount: number;
    weakTopicDistribution: { topic: string; count: number }[];
  }> {
    // Get all students for this teacher's academy
    const students = mockStudents.filter(s => s.academyId === 'academy1');
    const allAnalytics = await Promise.all(
      students.map(s => this.getStudentAnalytics(s.id))
    );

    const avg = allAnalytics.length > 0
      ? Math.round(allAnalytics.reduce((sum, a) => sum + a.overallScore, 0) / allAnalytics.length)
      : 0;

    // Count how many students are weak in each topic
    const topicCount = new Map<string, number>();
    for (const a of allAnalytics) {
      for (const topic of a.weakTopics) {
        topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
      }
    }

    const weakTopicDistribution = Array.from(topicCount.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    return {
      averageScore: avg,
      studentCount: students.length,
      weakTopicDistribution,
    };
  }

  async getScoreTimeline(studentId: string): Promise<{ date: string; score: number }[]> {
    const subs = await this.getStudentSubmissions(studentId);
    // Group by date
    const dateMap = new Map<string, { correct: number; total: number }>();
    for (const sub of subs) {
      const d = new Date(sub.submittedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const cur = dateMap.get(key) || { correct: 0, total: 0 };
      cur.total++;
      if (sub.isCorrect) cur.correct++;
      dateMap.set(key, cur);
    }

    return Array.from(dateMap.entries())
      .map(([date, val]) => ({
        date,
        score: Math.round((val.correct / val.total) * 100),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
```

---

## File 5: `src/services/mock/mockWrongNote.ts`

```typescript
// src/services/mock/mockWrongNote.ts
//
// Implements IWrongNoteService.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IWrongNoteService } from '../interfaces/wrongNote';
import type { WrongNoteItem } from '../../types/wrongNote';
import { mockWrongNotes, MockWrongNote, mockProblems, ReviewStatus } from './mockData';

const STORAGE_KEY = '@mathpia/wrongNotes';

function toItem(wn: MockWrongNote): WrongNoteItem {
  const prob = mockProblems.find(p => p.id === wn.problemId);
  return {
    id: wn.id,
    studentId: wn.studentId,
    problemId: wn.problemId,
    assignmentId: wn.assignmentId,
    studentAnswer: wn.studentAnswer,
    correctAnswer: wn.correctAnswer,
    problem: prob ? {
      id: prob.id,
      content: prob.content,
      answer: prob.answer,
      difficulty: prob.difficulty,
      type: prob.type,
      grade: prob.grade,
      subject: prob.subject,
      topic: prob.topic,
      choices: prob.choices,
    } : undefined,
    reviewCount: wn.reviewCount,
    reviewStatus: wn.reviewStatus,
    isLearned: wn.isLearned,
    lastReviewDate: wn.lastReviewDate ? new Date(wn.lastReviewDate).toISOString() : undefined,
    createdAt: new Date(wn.createdAt).toISOString(),
  };
}

export class MockWrongNoteService implements IWrongNoteService {
  private notes: WrongNoteItem[] = [];
  private initialized = false;

  private async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.notes = JSON.parse(stored);
      } else {
        this.notes = mockWrongNotes.map(toItem);
        await this.persist();
      }
    } catch {
      this.notes = mockWrongNotes.map(toItem);
    }
    this.initialized = true;
  }

  private async persist(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.notes));
  }

  async getByStudent(studentId: string): Promise<WrongNoteItem[]> {
    await this.init();
    return this.notes.filter(n => n.studentId === studentId);
  }

  async getByStudentAndStatus(studentId: string, status: ReviewStatus): Promise<WrongNoteItem[]> {
    await this.init();
    return this.notes.filter(n => n.studentId === studentId && n.reviewStatus === status);
  }

  async addWrongNote(data: Omit<WrongNoteItem, 'id' | 'createdAt' | 'reviewCount' | 'reviewStatus' | 'isLearned'>): Promise<WrongNoteItem> {
    await this.init();
    // Avoid duplicates: same student + same problem
    const existing = this.notes.find(
      n => n.studentId === data.studentId && n.problemId === data.problemId
    );
    if (existing) return existing;

    const newNote: WrongNoteItem = {
      ...data,
      id: `WN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reviewCount: 0,
      reviewStatus: '미복습',
      isLearned: false,
      createdAt: new Date().toISOString(),
    };
    this.notes.push(newNote);
    await this.persist();
    return newNote;
  }

  async updateReviewStatus(
    noteId: string,
    isCorrectOnReview: boolean,
  ): Promise<WrongNoteItem | null> {
    await this.init();
    const idx = this.notes.findIndex(n => n.id === noteId);
    if (idx === -1) return null;

    const note = { ...this.notes[idx] };
    note.reviewCount++;
    note.lastReviewDate = new Date().toISOString();

    if (isCorrectOnReview) {
      // Mastery rule: 3 consecutive correct reviews with 24h gaps
      // Simplified: after 3 correct reviews, mark as 숙련
      if (note.reviewCount >= 3) {
        note.reviewStatus = '숙련';
        note.isLearned = true;
      } else {
        note.reviewStatus = '복습중';
      }
    } else {
      // Reset progress on incorrect review
      note.reviewStatus = '복습중';
    }

    this.notes[idx] = note;
    await this.persist();
    return note;
  }

  async markAsLearned(noteId: string): Promise<void> {
    await this.init();
    const idx = this.notes.findIndex(n => n.id === noteId);
    if (idx === -1) return;
    this.notes[idx] = {
      ...this.notes[idx],
      isLearned: true,
      reviewStatus: '숙련',
    };
    await this.persist();
  }

  async getStats(studentId: string): Promise<{
    total: number;
    unreviewed: number;
    reviewing: number;
    mastered: number;
  }> {
    await this.init();
    const studentNotes = this.notes.filter(n => n.studentId === studentId);
    return {
      total: studentNotes.length,
      unreviewed: studentNotes.filter(n => n.reviewStatus === '미복습').length,
      reviewing: studentNotes.filter(n => n.reviewStatus === '복습중').length,
      mastered: studentNotes.filter(n => n.reviewStatus === '숙련').length,
    };
  }
}
```

---

## File 6: `src/services/mock/mockParent.ts`

```typescript
// src/services/mock/mockParent.ts
//
// Implements IParentService. Composes data from other mock data sources.

import type { IParentService, ChildDashboard, LearningReport } from '../interfaces/parent';
import {
  mockStudents, mockParents, mockAssignments, mockSubmissions,
  mockSchedules, mockProblems, mockWrongNotes, MockScheduleItem,
} from './mockData';
import { MockAnalyticsService } from './mockAnalytics';

const analyticsService = new MockAnalyticsService();

export class MockParentService implements IParentService {

  async getChildren(parentId: string): Promise<{ id: string; name: string; grade: string }[]> {
    const parent = mockParents.find(p => p.id === parentId);
    if (!parent || !parent.childrenIds) return [];
    return parent.childrenIds
      .map(cid => mockStudents.find(s => s.id === cid))
      .filter(Boolean)
      .map(s => ({ id: s!.id, name: s!.name, grade: s!.grade || '중1' }));
  }

  async getChildDashboard(childId: string): Promise<ChildDashboard> {
    const child = mockStudents.find(s => s.id === childId);
    if (!child) throw new Error(`Student ${childId} not found`);

    const analytics = await analyticsService.getStudentAnalytics(childId);
    const weakness = await analyticsService.getWeaknessAnalysis(childId);

    // Recent assignments
    const studentAssignments = mockAssignments
      .filter(a => a.assignedStudentIds.includes(childId) && a.status !== 'draft')
      .slice(0, 5);

    const recentAssignments = studentAssignments.map(a => {
      const subs = mockSubmissions.filter(
        s => s.assignmentId === a.id && s.studentId === childId
      );
      const totalProblems = a.problemIds.length;
      const submitted = subs.length;
      const correct = subs.filter(s => s.isCorrect).length;
      return {
        id: a.id,
        title: a.title,
        dueDate: a.dueDate instanceof Date ? a.dueDate.toISOString() : a.dueDate,
        status: a.status,
        progress: totalProblems > 0 ? Math.round((submitted / totalProblems) * 100) : 0,
        score: submitted > 0 ? Math.round((correct / submitted) * 100) : 0,
      };
    });

    return {
      child: {
        id: child.id,
        name: child.name,
        grade: child.grade || '중1',
        email: child.email,
      },
      stats: {
        totalSolved: analytics.totalSolved,
        correctRate: analytics.overallScore,
        streakDays: analytics.streakDays,
        totalStudyMinutes: mockSubmissions
          .filter(s => s.studentId === childId)
          .reduce((sum, s) => sum + Math.round(s.timeTakenSeconds / 60), 0),
      },
      recentAssignments,
      weakTopics: weakness.weakTopics.slice(0, 3),
      aiAdvice: `${child.name} 학생은 전체 정답률 ${analytics.overallScore}%로 `
        + (analytics.overallScore >= 70 ? '양호한 수준입니다.' : '추가 학습이 필요합니다.')
        + ` 특히 ${weakness.weakTopics[0]?.topic || '일부 단원'}에서 보충이 필요합니다.`,
    };
  }

  async getSchedule(childId: string): Promise<{
    weeklyClasses: MockScheduleItem[];
    upcomingDeadlines: { assignmentId: string; title: string; dueDate: string }[];
  }> {
    const weeklyClasses = mockSchedules.filter(s => s.studentId === childId);

    const now = new Date();
    const upcomingDeadlines = mockAssignments
      .filter(a => {
        const due = new Date(a.dueDate);
        return a.assignedStudentIds.includes(childId)
          && a.status === 'published'
          && due >= now;
      })
      .map(a => ({
        assignmentId: a.id,
        title: a.title,
        dueDate: a.dueDate instanceof Date ? a.dueDate.toISOString() : String(a.dueDate),
      }));

    return { weeklyClasses, upcomingDeadlines };
  }

  async getLearningReport(childId: string): Promise<LearningReport> {
    const analytics = await analyticsService.getStudentAnalytics(childId);
    const timeline = await analyticsService.getScoreTimeline(childId);

    // Build radar data from subjectScores
    const radarData = analytics.subjectScores.map(s => ({
      label: s.topic,
      value: s.score,
    }));

    // Wrong note summary
    const wrongNotes = mockWrongNotes.filter(wn => wn.studentId === childId);
    const topicErrorCount = new Map<string, number>();
    for (const wn of wrongNotes) {
      const prob = mockProblems.find(p => p.id === wn.problemId);
      if (prob) {
        topicErrorCount.set(prob.topic, (topicErrorCount.get(prob.topic) || 0) + 1);
      }
    }
    const topWrongTopics = Array.from(topicErrorCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, count]) => ({ topic, errorCount: count }));

    return {
      studentId: childId,
      radarData,
      timelineData: timeline,
      topWrongTopics,
      aiSummary: `최근 4주간 총 ${analytics.totalSolved}문제를 풀었으며, 전체 정답률은 ${analytics.overallScore}%입니다. `
        + `강점 단원: ${analytics.strongTopics.slice(0, 2).join(', ')}. `
        + `보충 필요 단원: ${analytics.weakTopics.slice(0, 2).join(', ')}.`,
      generatedAt: new Date().toISOString(),
    };
  }
}
```

---

## File 7: `src/services/mock/index.ts`

```typescript
// src/services/mock/index.ts
//
// Service Factory - single import point for all mock services.
// Usage:  import services from '@/services/mock';
//         const problems = await services.problemBank.getAll();
//
// To switch to Supabase later, create src/services/supabase/index.ts
// with the same shape, then change the import in src/services/index.ts.

import { MockProblemBankService } from './mockProblemBank';
import { MockAssignmentService } from './mockAssignment';
import { MockAnalyticsService } from './mockAnalytics';
import { MockWrongNoteService } from './mockWrongNote';
import { MockParentService } from './mockParent';

const services = {
  problemBank: new MockProblemBankService(),
  assignment: new MockAssignmentService(),
  analytics: new MockAnalyticsService(),
  wrongNote: new MockWrongNoteService(),
  parent: new MockParentService(),
};

export default services;

// Re-export individual classes for testing
export {
  MockProblemBankService,
  MockAssignmentService,
  MockAnalyticsService,
  MockWrongNoteService,
  MockParentService,
};
```

Also create the top-level re-export at `src/services/index.ts`:

```typescript
// src/services/index.ts
//
// Top-level service export. Stores and UI import from here.
// To switch from mock to Supabase, change this one line.

export { default as services } from './mock';
export { default } from './mock';
```

---

## Data Coverage Summary

### Problem Distribution (108 total)

| Grade | Count | Subjects Covered | Types |
|-------|-------|-----------------|-------|
| 중1 | 18 | 수와 연산, 문자와 식, 좌표평면과 그래프, 기본 도형, 통계 | 객관식 5, 단답형 9, 서술형 4 |
| 중2 | 18 | 유리수와 순환소수, 식의 계산, 부등식과 연립방정식, 일차함수, 도형의 성질, 도형의 닮음과 피타고라스 정리, 확률 | 객관식 4, 단답형 8, 서술형 6 |
| 중3 | 18 | 제곱근과 실수, 다항식의 곱셈과 인수분해, 이차방정식, 이차함수, 통계 | 객관식 4, 단답형 8, 서술형 6 |
| 고1 | 18 | 다항식, 방정식과 부등식, 도형의 방정식, 집합과 명제, 함수 | 객관식 4, 단답형 8, 서술형 6 |
| 고2 | 18 | 수학I (지수와 로그, 지수함수와 로그함수, 삼각함수, 수열), 수학II (극한과 연속, 미분, 적분) | 객관식 3, 단답형 10, 서술형 5 |
| 고3 | 18 | 확률과 통계 (경우의 수, 확률, 통계), 미적분 (수열의 극한, 미분법, 적분법), 기하 (이차곡선, 평면벡터) | 객관식 3, 단답형 10, 서술형 5 |

### Difficulty Distribution (per grade, approximate)

| Difficulty | Count per grade |
|---|---|
| 하 | 5-6 |
| 중 | 7-8 |
| 상 | 4-6 |

### User Summary

| Role | Count | IDs | Notes |
|---|---|---|---|
| Teachers | 2 | T1, T2 | Both in academy1 |
| Students | 10 | S1-S10 | Grades: 중1(1), 중2(1), 중3(1), 고1(3), 고2(2), 고3(2) |
| Parents | 3 | P1, P2, P3 | P1 → [S1, S3], P2 → [S4], P3 → [S7, S9] |

### Submission Volume

| Student | Grade | Submission Count | Weak Topics | Expected Accuracy |
|---|---|---|---|---|
| S1 | 중1 | 35 | 기본 도형, 통계 | ~60% |
| S2 | 중2 | 40 | 도형의 성질, 확률 | ~60% |
| S3 | 중3 | 38 | 통계, 이차함수 | ~62% |
| S4 | 고1 | 45 | 도형의 방정식 | ~65% |
| S5 | 고1 | 42 | 도형의 방정식, 집합과 명제 | ~55% |
| S6 | 고1 | 30 | 도형의 방정식 | ~65% |
| S7 | 고2 | 48 | 수학II - 미분, 수학II - 적분 | ~50% |
| S8 | 고2 | 35 | 수학II - 적분 | ~60% |
| S9 | 고3 | 50 | 미적분 - 적분법 | ~62% |
| S10 | 고3 | 40 | 미적분 - 적분법, 기하 - 이차곡선 | ~55% |

**Total submissions**: ~403
**Total wrong notes**: derived from incorrect submissions (~160-180)

### Login Credentials (for testing)

| Email | Password | Role |
|---|---|---|
| teacher@test.com | 123456 | Teacher (김수학, T1) |
| teacher2@test.com | 123456 | Teacher (박기하, T2) |
| student@test.com | 123456 | Student (정민준, S5, 고1) |
| student1@test.com | 123456 | Student (이준서, S1, 중1) |
| parent@test.com | 123456 | Parent (이부모, P1, children: S1+S3) |
| parent2@test.com | 123456 | Parent (최학부모, P2, child: S4) |
| parent3@test.com | 123456 | Parent (윤보호자, P3, children: S7+S9) |

---

## AsyncStorage Keys

| Key | Service | Content |
|---|---|---|
| `@mathpia/problemBank` | MockProblemBankService | Array of ProblemBankItem |
| `@mathpia/assignments` | MockAssignmentService | Array of MockAssignment |
| `@mathpia/submissions` | MockAssignmentService | Array of MockSubmission |
| `@mathpia/wrongNotes` | MockWrongNoteService | Array of WrongNoteItem |
| `@mathpia/analyticsCache` | MockAnalyticsService | Reserved for future caching |

Each service follows the same pattern:
1. On first access, check AsyncStorage.
2. If data exists, load it.
3. If not, seed from the in-memory `mockData.ts` arrays.
4. After every mutation (create/update/delete), persist to AsyncStorage.

---

## Acceptance Criteria

- [ ] `mockData.ts` exports 108 mock problems with LaTeX content spanning 중1 through 고3
- [ ] `mockData.ts` exports 10 students, 2 teachers, 3 parents (with correct `childrenIds`)
- [ ] `mockData.ts` exports 8 assignments with statuses `draft`, `published`, `closed`
- [ ] `mockData.ts` generates 30-50 submissions per student (~400 total) with realistic weak-topic patterns
- [ ] `mockData.ts` auto-derives wrong notes from incorrect submissions
- [ ] `mockData.ts` exports schedule data for parent view
- [ ] `MockProblemBankService` implements full CRUD + search/filter + AsyncStorage persistence
- [ ] `MockAssignmentService` implements assignment CRUD + submission CRUD + grading + statistics
- [ ] `MockAnalyticsService` computes per-topic scores, weakness analysis, class-level analytics, and score timeline from submission data
- [ ] `MockWrongNoteService` implements wrong note CRUD + review status updates + mastery tracking + stats
- [ ] `MockParentService` composes child dashboard, schedule, and learning report from other data sources
- [ ] `src/services/mock/index.ts` exports a single `services` object with all 5 services
- [ ] `src/services/index.ts` re-exports the mock service factory for top-level import
- [ ] All services initialize lazily (first access triggers AsyncStorage load)
- [ ] All services persist mutations to AsyncStorage immediately
- [ ] Problem difficulty distribution is roughly balanced (하/중/상)
- [ ] Problem type distribution is approximately 객관식 60%, 단답형 30%, 서술형 10%
- [ ] Every grade's curriculum subjects from `curriculum.ts` are represented in the problem bank
- [ ] Login credential `student@test.com / 123456` still works (S5 maps to existing pattern)
- [ ] `parent@test.com / 123456` login works for parent role
- [ ] TypeScript compiles with no errors (`npx tsc --noEmit`)
- [ ] No circular dependencies between mock service files
