// src/services/mock/mockData.ts
//
// Central mock data store. Every mock service reads from these arrays.
// Data is designed so that:
//   - Students have deliberate weakness patterns (specific topics with low scores)
//   - Submissions are spread across the last 4 weeks
//   - Problems cover every grade's curriculum with LaTeX content

import { Grade, Difficulty, ProblemType, AssignmentStatus, SourceType } from '../../types';

// ─── Helper type used only inside mock layer ───

/** Wrong-note review status */
export type ReviewStatus = '미복습' | '복습중' | '숙련';

// ─── Helper: deterministic date generator ───

/** Returns a Date that is `days` days before today at the given hour */
export function daysAgo(days: number, hour = 10): Date {
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
  sourceType: SourceType;  // 'manual' | 'ai_extracted'
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
    sourceType: 'manual',
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
  P('중1', '수와 연산', '정수와 유리수', '상', '서술형',
    '$a = -\\frac{1}{2}$, $b = \\frac{2}{3}$일 때, $\\frac{a^2 - b}{a + b}$의 값을 구하시오. 풀이 과정을 쓰시오.',
    '$-\\frac{5}{2}$'),

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

    // Correct probability: weak topic -> 25%, normal -> 75%
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
