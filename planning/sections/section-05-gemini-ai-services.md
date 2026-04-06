# Section 05: Gemini AI Services

> **Phase**: 3 (Step 3.9) + Phase 4 (Step 3.17)
> **Dependencies**: Section 01 (Types & Interfaces), Section 02 (Mock Data & Services), Section 03 (Zustand Stores)
> **산출물**: `src/services/geminiAnalytics.ts`, `src/services/geminiHelper.ts`
> **이 문서만으로 구현 가능하도록 모든 정보를 포함합니다.**

---

## 1. 배경 및 목적

Mathpia는 Gemini AI를 활용하여 두 가지 핵심 기능을 제공한다:

1. **학습 분석 (geminiAnalytics.ts)** -- 학생의 풀이 이력을 분석하여 취약 단원 진단, 문제 추천, 종합 학습 리포트를 생성한다. 선생님/학부모 화면에서도 동일한 분석 결과를 활용한다.
2. **AI 풀이 도우미 (geminiHelper.ts)** -- 학생이 문제를 풀다가 막혔을 때, 3단계 힌트, 단계별 풀이, 유사 문제 추천을 제공한다.

기존 `src/services/geminiService.ts`는 PDF/이미지에서 문제를 추출하는 역할만 담당한다. 이 섹션에서 만드는 두 파일은 기존 파일과 **독립적으로 동작**하되, 동일한 `@google/genai` SDK와 API 키를 공유한다.

---

## 2. 사전 요구사항

### 2.1 설치되어 있어야 하는 패키지

```json
{
  "@google/genai": "^1.34.0",
  "zustand": "^5.0.9"
}
```

이미 `package.json`에 포함되어 있으므로 추가 설치 불필요.

### 2.2 환경 변수

```
EXPO_PUBLIC_GEMINI_API_KEY=<your-gemini-api-key>
```

`.env` 파일에 설정되어 있어야 한다. 코드에서는 `process.env.EXPO_PUBLIC_GEMINI_API_KEY`로 접근한다.

### 2.3 Section 01-03에서 제공되어야 하는 타입/스토어

이 섹션의 코드는 아래 타입과 스토어를 import한다. Section 01-03이 먼저 구현되어 있어야 한다. 각 타입의 구조를 아래에 명시하므로, 실제 구현 시 해당 파일의 export와 일치하는지 확인한다.

#### 필요한 타입 (src/types/index.ts, src/types/problemBank.ts, src/types/analytics.ts)

```typescript
// src/types/index.ts -- 기존 + Section 01에서 확장
export type Grade = '중1' | '중2' | '중3' | '고1' | '고2' | '고3';

export interface Problem {
  id: string;
  content: string;
  imageUrl?: string;
  answer?: string;
  points: number;
}

// src/types/problemBank.ts -- Section 01에서 신규 생성
export interface ProblemBankItem {
  id: string;
  content: string;
  contentHtml?: string;
  imageUrls?: string[];
  answer?: string;
  solution?: string;
  difficulty: '상' | '중' | '하';
  type: '객관식' | '서술형' | '단답형';
  choices?: string[];
  grade: Grade;
  subject: string;
  topic: string;
  tags?: string[];
  source?: string;
  sourceType?: 'manual' | 'ai-extracted';
  points: number;
  usageCount: number;
  correctRate: number;
}

// src/types/analytics.ts -- Section 01에서 신규 생성
export interface SubjectScore {
  subject: string;
  score: number;
}

export interface WeakTopic {
  topic: string;
  score: number;
  reason: string;
  recommendedCount: number;
}

export interface StudentAnalytics {
  studentId: string;
  subjectScores: SubjectScore[];
  weakTopics: WeakTopic[];
  strongTopics: string[];
  overallScore: number;
  totalSolved: number;
  totalCorrect: number;
  streakDays: number;
  lastAnalyzedAt: string;
  submissionCountSinceLastAnalysis: number;
}

export interface WeaknessAnalysis {
  weakTopics: WeakTopic[];
  errorPatterns: string[];
  recommendations: string[];
}

export interface LearningReport {
  studentId: string;
  generatedAt: string;
  radarData: SubjectScore[];
  timelineData: { date: string; score: number }[];
  heatmapData: { x: string; y: string; value: number }[];
  aiSummary: {
    strengths: string[];
    weaknesses: string[];
    advice: string[];
    weeklyTrend: string;
    monthlyTrend: string;
  };
}
```

#### 필요한 스토어 (src/stores/analyticsStore.ts)

```typescript
// Section 03에서 생성되는 analyticsStore 중 이 섹션이 사용하는 부분:
interface AnalyticsState {
  studentAnalytics: Record<string, StudentAnalytics>; // studentId -> analytics
  learningReports: Record<string, LearningReport>;    // studentId -> report

  // actions
  setStudentAnalytics: (studentId: string, analytics: StudentAnalytics) => void;
  setLearningReport: (studentId: string, report: LearningReport) => void;
  getStudentAnalytics: (studentId: string) => StudentAnalytics | undefined;
  getLearningReport: (studentId: string) => LearningReport | undefined;
  incrementSubmissionCount: (studentId: string) => void;
}
```

---

## 3. 공통 인프라: Gemini 클라이언트 + 유틸리티

두 파일(`geminiAnalytics.ts`, `geminiHelper.ts`)은 동일한 패턴을 사용한다. 공통 부분을 먼저 정의한다.

### 3.1 Gemini 클라이언트 초기화

각 파일의 상단에 동일하게 작성:

```typescript
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_ID = 'gemini-2.5-flash';
```

### 3.2 JSON 파싱 유틸리티 (각 파일에 포함)

Gemini 응답에서 JSON을 안전하게 추출하는 함수. 마크다운 코드블록 래핑, 추가 텍스트 등에 대응한다.

```typescript
/**
 * Gemini 응답 텍스트에서 JSON을 안전하게 추출하여 파싱한다.
 * - ```json ... ``` 코드블록 내부의 JSON 추출
 * - 순수 JSON 텍스트 직접 파싱
 * - LaTeX 백슬래시 이스케이프 자동 수정 후 재시도
 * @returns 파싱된 객체, 실패 시 null
 */
function safeParseJSON<T>(text: string): T | null {
  // 1) 코드블록에서 JSON 추출 시도
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonString = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();

  // 2) JSON 객체/배열 부분만 추출
  const jsonObjMatch = jsonString.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonObjMatch) {
    jsonString = jsonObjMatch[1];
  }

  // 3) 첫 번째 파싱 시도
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    // 4) LaTeX 백슬래시 수정 후 재시도
    try {
      const fixed = jsonString.replace(
        /:\s*"((?:[^"\\]|\\.)*)"/g,
        (_match: string, value: string) => {
          const escaped = value.replace(/\\(?!\\|n|r|t|"|')/g, '\\\\');
          return `: "${escaped}"`;
        }
      );
      return JSON.parse(fixed) as T;
    } catch {
      return null;
    }
  }
}
```

### 3.3 JSON Schema 검증 유틸리티 (각 파일에 포함)

타입 안전성을 위해 런타임에서 AI 응답 구조를 검증한다. 외부 라이브러리 없이 수동 검증한다.

```typescript
interface SchemaField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
}

/**
 * 객체가 주어진 스키마 필드를 만족하는지 검증한다.
 * @returns { valid: boolean; errors: string[] }
 */
function validateSchema(
  data: Record<string, any>,
  fields: SchemaField[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of fields) {
    const value = data[field.key];

    if (value === undefined || value === null) {
      if (field.required) {
        errors.push(`필수 필드 "${field.key}" 누락`);
      }
      continue;
    }

    if (field.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`"${field.key}" 필드는 배열이어야 합니다`);
      }
    } else if (typeof value !== field.type) {
      errors.push(`"${field.key}" 필드는 ${field.type} 타입이어야 합니다 (실제: ${typeof value})`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### 3.4 재시도 유틸리티 (각 파일에 포함)

```typescript
const MAX_RETRIES = 2;

/**
 * Gemini API 호출을 재시도 로직으로 감싼다.
 * - 최대 MAX_RETRIES(2)회 재시도
 * - 재시도 간 1초 대기
 * - 모든 시도 실패 시 null 반환
 */
async function callGeminiWithRetry<T>(
  promptFn: () => Promise<T | null>
): Promise<T | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await promptFn();
      if (result !== null) {
        return result;
      }
      // result가 null이면 파싱 실패 -- 재시도
      lastError = new Error('JSON 파싱 실패');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // 마지막 시도가 아니면 1초 대기 후 재시도
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.error(
    `Gemini API 호출 실패 (${MAX_RETRIES + 1}회 시도):`,
    lastError?.message
  );
  return null;
}
```

---

## 4. 파일 1: `src/services/geminiAnalytics.ts`

### 4.1 파일 개요

| 함수 | 용도 | 호출 시점 |
|------|------|-----------|
| `analyzeStudentWeakness()` | 학생 풀이 이력 기반 취약 단원 진단 | 학생 "내 학습 분석" 진입 시 / 선생님 "AI 진단 실행" 클릭 시 / 학부모 리포트 진입 시 |
| `recommendProblems()` | 취약 단원에 맞는 문제 추천 | 취약점 분석 완료 후 자동 호출 |
| `generateLearningReport()` | 종합 학습 리포트 생성 | 학생/학부모 리포트 화면 진입 시 |

### 4.2 캐싱 전략

**재분석 트리거 규칙**: 새 제출(submission)이 **5건** 이상 쌓이면 캐시 만료로 간주하여 재분석한다.

```
analyticsStore.studentAnalytics[studentId] = {
  ...분석결과,
  lastAnalyzedAt: ISO 날짜 문자열,
  submissionCountSinceLastAnalysis: 0   // 분석 시 리셋
};

// submissionStore에서 제출 시:
// analyticsStore.incrementSubmissionCount(studentId)로 카운터 증가

// 분석 화면 진입 시 판단 로직:
function shouldReanalyze(analytics: StudentAnalytics | undefined): boolean {
  if (!analytics) return true;                                        // 캐시 없음
  if (analytics.submissionCountSinceLastAnalysis >= 5) return true;   // 5건 이상 축적
  return false;
}
```

이 `shouldReanalyze()` 함수는 `geminiAnalytics.ts`에 export하여, 화면 컴포넌트에서 호출 여부를 판단하게 한다.

### 4.3 전체 소스 코드

```typescript
// src/services/geminiAnalytics.ts

import { GoogleGenAI } from '@google/genai';
import type { Grade } from '../types';
import type { ProblemBankItem } from '../types/problemBank';
import type {
  StudentAnalytics,
  WeaknessAnalysis,
  LearningReport,
  SubjectScore,
  WeakTopic,
} from '../types/analytics';

// ─── Gemini 클라이언트 ───────────────────────────────────────────
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_ID = 'gemini-2.5-flash';

// ─── 공통 유틸리티 ──────────────────────────────────────────────

const MAX_RETRIES = 2;

function safeParseJSON<T>(text: string): T | null {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonString = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();

  const jsonObjMatch = jsonString.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonObjMatch) {
    jsonString = jsonObjMatch[1];
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch {
    try {
      const fixed = jsonString.replace(
        /:\s*"((?:[^"\\]|\\.)*)"/g,
        (_match: string, value: string) => {
          const escaped = value.replace(/\\(?!\\|n|r|t|"|')/g, '\\\\');
          return `: "${escaped}"`;
        }
      );
      return JSON.parse(fixed) as T;
    } catch {
      return null;
    }
  }
}

interface SchemaField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
}

function validateSchema(
  data: Record<string, any>,
  fields: SchemaField[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const field of fields) {
    const value = data[field.key];
    if (value === undefined || value === null) {
      if (field.required) errors.push(`필수 필드 "${field.key}" 누락`);
      continue;
    }
    if (field.type === 'array') {
      if (!Array.isArray(value)) errors.push(`"${field.key}" 필드는 배열이어야 합니다`);
    } else if (typeof value !== field.type) {
      errors.push(`"${field.key}" 필드는 ${field.type} 타입이어야 합니다 (실제: ${typeof value})`);
    }
  }
  return { valid: errors.length === 0, errors };
}

async function callGeminiWithRetry<T>(
  promptFn: () => Promise<T | null>
): Promise<T | null> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await promptFn();
      if (result !== null) return result;
      lastError = new Error('JSON 파싱 실패');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.error(`Gemini API 호출 실패 (${MAX_RETRIES + 1}회 시도):`, lastError?.message);
  return null;
}

// ─── 캐싱 판단 ──────────────────────────────────────────────────

const REANALYSIS_THRESHOLD = 5;

/**
 * 재분석이 필요한지 판단한다.
 * - 캐시된 분석 결과가 없으면 true
 * - 마지막 분석 이후 제출이 5건 이상이면 true
 */
export function shouldReanalyze(analytics: StudentAnalytics | undefined): boolean {
  if (!analytics) return true;
  if (analytics.submissionCountSinceLastAnalysis >= REANALYSIS_THRESHOLD) return true;
  return false;
}

// ─── 입력 데이터 타입 ───────────────────────────────────────────

/** analyzeStudentWeakness 및 generateLearningReport에 전달하는 풀이 기록 */
export interface SubmissionRecord {
  problemId: string;
  problemContent: string;    // 문제 본문 (첫 100자 정도로 요약 가능)
  topic: string;             // 단원명
  subject: string;           // 과목/대단원명
  difficulty: '상' | '중' | '하';
  isCorrect: boolean;
  studentAnswer?: string;
  correctAnswer?: string;
  submittedAt: string;       // ISO 날짜 문자열
}

// ─── 폴백 기본값 ────────────────────────────────────────────────

const FALLBACK_WEAKNESS: WeaknessAnalysis = {
  weakTopics: [
    {
      topic: '분석 불가',
      score: 0,
      reason: 'AI 분석을 수행할 수 없습니다. 풀이 데이터가 충분한지 확인해주세요.',
      recommendedCount: 0,
    },
  ],
  errorPatterns: [],
  recommendations: ['더 많은 문제를 풀어보세요.'],
};

const FALLBACK_RECOMMENDATION: ProblemRecommendation = {
  recommendedProblemIds: [],
  reasons: [],
};

interface ProblemRecommendation {
  recommendedProblemIds: string[];
  reasons: string[];
}

const FALLBACK_REPORT: Omit<LearningReport, 'studentId' | 'generatedAt'> = {
  radarData: [],
  timelineData: [],
  heatmapData: [],
  aiSummary: {
    strengths: ['분석 데이터 부족'],
    weaknesses: ['분석 데이터 부족'],
    advice: ['더 많은 문제를 풀어보면 정확한 분석이 가능합니다.'],
    weeklyTrend: '데이터 부족',
    monthlyTrend: '데이터 부족',
  },
};

// ─── 스키마 정의 ────────────────────────────────────────────────

const WEAKNESS_SCHEMA: SchemaField[] = [
  { key: 'subjectScores', type: 'array', required: true },
  { key: 'weakTopics', type: 'array', required: true },
  { key: 'errorPatterns', type: 'array', required: true },
  { key: 'recommendations', type: 'array', required: true },
];

const RECOMMENDATION_SCHEMA: SchemaField[] = [
  { key: 'recommendedProblemIds', type: 'array', required: true },
  { key: 'reasons', type: 'array', required: true },
];

const REPORT_SCHEMA: SchemaField[] = [
  { key: 'radarData', type: 'array', required: true },
  { key: 'timelineData', type: 'array', required: true },
  { key: 'heatmapData', type: 'array', required: true },
  { key: 'aiSummary', type: 'object', required: true },
];

// ═══════════════════════════════════════════════════════════════
// 함수 1: analyzeStudentWeakness
// ═══════════════════════════════════════════════════════════════

const WEAKNESS_PROMPT_TEMPLATE = (grade: Grade, submissions: SubmissionRecord[]): string => `
당신은 한국 중고등학교 수학 교육 전문가이자 학습 분석 AI입니다.
아래 학생의 문제 풀이 이력을 분석하여 취약한 단원과 학습 방향을 정밀하게 진단해주세요.

═══════════════════════════════
[학생 정보]
═══════════════════════════════
- 학년: ${grade}
- 총 풀이 수: ${submissions.length}건
- 정답 수: ${submissions.filter((s) => s.isCorrect).length}건
- 전체 정답률: ${Math.round((submissions.filter((s) => s.isCorrect).length / Math.max(submissions.length, 1)) * 100)}%

═══════════════════════════════
[풀이 기록 데이터]
═══════════════════════════════
${JSON.stringify(
  submissions.map((s) => ({
    단원: s.topic,
    과목: s.subject,
    난이도: s.difficulty,
    정답여부: s.isCorrect ? '정답' : '오답',
    문제요약: s.problemContent.substring(0, 80),
    학생답: s.studentAnswer || '(미기록)',
    정답: s.correctAnswer || '(미기록)',
    날짜: s.submittedAt,
  })),
  null,
  2
)}

═══════════════════════════════
[분석 요청 항목]
═══════════════════════════════
1. **단원별 숙련도** (0~100점): 풀이한 모든 단원에 대해 정답률, 난이도, 최근 추이를 종합하여 점수를 매겨주세요.
2. **취약 단원 Top 3**: 가장 취약한 단원 3개를 선정하고, 각각에 대해:
   - 왜 취약한지 구체적 이유 (예: "분수 계산에서 통분 실수 반복", "이차방정식 근의 공식 적용 오류")
   - 해당 단원에서 추가로 풀어야 할 문제 수 (recommendedCount)
3. **오류 패턴 분석**: 학생이 반복적으로 보이는 실수 유형을 3~5가지로 정리 (예: "부호 처리 실수", "문제 조건 누락")
4. **학습 추천**: 구체적이고 실행 가능한 학습 조언 3~5개

═══════════════════════════════
[출력 JSON 형식] (반드시 이 형식만 출력)
═══════════════════════════════
{
  "subjectScores": [
    { "subject": "단원명", "score": 85 }
  ],
  "weakTopics": [
    {
      "topic": "취약 단원명",
      "score": 30,
      "reason": "취약 이유를 구체적으로 한국어로 작성",
      "recommendedCount": 5
    }
  ],
  "errorPatterns": [
    "오류 패턴 1",
    "오류 패턴 2"
  ],
  "recommendations": [
    "학습 추천 1",
    "학습 추천 2"
  ]
}

주의: 반드시 유효한 JSON만 출력하세요. 다른 텍스트나 설명을 포함하지 마세요.
`;

/**
 * 학생의 풀이 이력을 Gemini에 전달하여 취약 단원/패턴을 분석한다.
 *
 * @param grade - 학생 학년
 * @param submissions - 최근 풀이 기록 배열 (최대 50건 권장)
 * @returns WeaknessAnalysis 또는 폴백 기본값
 *
 * 사용 예시:
 * ```typescript
 * const weakness = await analyzeStudentWeakness('고1', submissionRecords);
 * // weakness.weakTopics -> 취약 단원 목록
 * // weakness.errorPatterns -> 오류 패턴
 * // weakness.recommendations -> 학습 추천
 * ```
 */
export async function analyzeStudentWeakness(
  grade: Grade,
  submissions: SubmissionRecord[]
): Promise<WeaknessAnalysis & { subjectScores: SubjectScore[] }> {
  // 풀이 데이터가 없으면 폴백 반환
  if (submissions.length === 0) {
    return { ...FALLBACK_WEAKNESS, subjectScores: [] };
  }

  // 최대 50건으로 제한 (최신순)
  const limitedSubmissions = submissions
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 50);

  const result = await callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [{ text: WEAKNESS_PROMPT_TEMPLATE(grade, limitedSubmissions) }],
        },
      ],
    });

    const text = response.text || '';
    const parsed = safeParseJSON<Record<string, any>>(text);
    if (!parsed) return null;

    // 스키마 검증
    const validation = validateSchema(parsed, WEAKNESS_SCHEMA);
    if (!validation.valid) {
      console.warn('취약점 분석 스키마 검증 실패:', validation.errors);
      return null;
    }

    return parsed as {
      subjectScores: SubjectScore[];
      weakTopics: WeakTopic[];
      errorPatterns: string[];
      recommendations: string[];
    };
  });

  if (!result) {
    return { ...FALLBACK_WEAKNESS, subjectScores: [] };
  }

  return {
    subjectScores: result.subjectScores,
    weakTopics: result.weakTopics.slice(0, 3),
    errorPatterns: result.errorPatterns,
    recommendations: result.recommendations,
  };
}

// ═══════════════════════════════════════════════════════════════
// 함수 2: recommendProblems
// ═══════════════════════════════════════════════════════════════

const RECOMMENDATION_PROMPT_TEMPLATE = (
  weakTopics: WeakTopic[],
  problemSummaries: { id: string; topic: string; difficulty: string; content: string }[]
): string => `
당신은 한국 수학 교육 전문가입니다.
학생의 취약 단원 분석 결과를 바탕으로, 주어진 문제은행에서 학습에 가장 효과적인 문제들을 추천해주세요.

═══════════════════════════════
[취약 단원 분석 결과]
═══════════════════════════════
${JSON.stringify(
  weakTopics.map((w) => ({
    단원: w.topic,
    숙련도: w.score,
    취약_이유: w.reason,
    추천_문제수: w.recommendedCount,
  })),
  null,
  2
)}

═══════════════════════════════
[문제은행 목록] (ID, 단원, 난이도, 문제 요약)
═══════════════════════════════
${JSON.stringify(
  problemSummaries.map((p) => ({
    id: p.id,
    단원: p.topic,
    난이도: p.difficulty,
    문제요약: p.content.substring(0, 60),
  })),
  null,
  2
)}

═══════════════════════════════
[추천 규칙]
═══════════════════════════════
1. 취약 단원의 문제를 우선 추천하되, 숙련도가 낮을수록 쉬운 난이도(하)부터 시작
2. 숙련도 30 미만: "하" 난이도 위주 → 숙련도 30~60: "중" 난이도 위주 → 숙련도 60 이상: "상" 난이도 도전
3. 총 추천 문제 수: 5~10개
4. 같은 단원의 문제를 연속으로 3개 이상 배치하지 않기 (다양성 확보)
5. 반드시 문제은행에 존재하는 ID만 추천

═══════════════════════════════
[출력 JSON 형식] (반드시 이 형식만 출력)
═══════════════════════════════
{
  "recommendedProblemIds": ["id1", "id2", "id3"],
  "reasons": [
    "id1: 추천 이유를 한국어로 작성",
    "id2: 추천 이유를 한국어로 작성"
  ]
}

주의: recommendedProblemIds는 반드시 위 문제은행 목록에 있는 id 값이어야 합니다.
반드시 유효한 JSON만 출력하세요.
`;

/**
 * 취약 단원 분석 결과와 문제은행을 기반으로 학생에게 적합한 문제를 추천한다.
 *
 * @param weakTopics - analyzeStudentWeakness()의 결과에서 추출한 취약 단원 목록
 * @param problemBank - 전체 문제은행 (해당 학년 필터링 후 전달 권장)
 * @returns 추천 문제 ID 목록 + 추천 이유, 또는 폴백 기본값
 *
 * 사용 예시:
 * ```typescript
 * const reco = await recommendProblems(weakness.weakTopics, filteredProblems);
 * // reco.recommendedProblemIds -> ["prob_1", "prob_5", ...]
 * // reco.reasons -> ["prob_1: 이차방정식 기초 강화...", ...]
 * ```
 */
export async function recommendProblems(
  weakTopics: WeakTopic[],
  problemBank: ProblemBankItem[]
): Promise<ProblemRecommendation> {
  if (weakTopics.length === 0 || problemBank.length === 0) {
    return FALLBACK_RECOMMENDATION;
  }

  // 취약 단원 관련 문제만 필터링하여 전달 (토큰 절약)
  const weakTopicNames = new Set(weakTopics.map((w) => w.topic));
  const relevantProblems = problemBank.filter((p) => weakTopicNames.has(p.topic));

  // 관련 문제가 없으면 전체에서 일부 전달
  const problemsToSend =
    relevantProblems.length > 0
      ? relevantProblems.slice(0, 50)
      : problemBank.slice(0, 30);

  const problemSummaries = problemsToSend.map((p) => ({
    id: p.id,
    topic: p.topic,
    difficulty: p.difficulty,
    content: p.content,
  }));

  const result = await callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [{ text: RECOMMENDATION_PROMPT_TEMPLATE(weakTopics, problemSummaries) }],
        },
      ],
    });

    const text = response.text || '';
    const parsed = safeParseJSON<Record<string, any>>(text);
    if (!parsed) return null;

    const validation = validateSchema(parsed, RECOMMENDATION_SCHEMA);
    if (!validation.valid) {
      console.warn('문제 추천 스키마 검증 실패:', validation.errors);
      return null;
    }

    return parsed as ProblemRecommendation;
  });

  if (!result) {
    return FALLBACK_RECOMMENDATION;
  }

  // 존재하는 문제 ID만 필터링 (AI가 존재하지 않는 ID를 반환할 수 있음)
  const validIds = new Set(problemBank.map((p) => p.id));
  const filteredIds = result.recommendedProblemIds.filter((id: string) => validIds.has(id));

  return {
    recommendedProblemIds: filteredIds,
    reasons: result.reasons,
  };
}

// ═══════════════════════════════════════════════════════════════
// 함수 3: generateLearningReport
// ═══════════════════════════════════════════════════════════════

const REPORT_PROMPT_TEMPLATE = (
  grade: Grade,
  submissions: SubmissionRecord[],
  subjectScores: SubjectScore[]
): string => `
당신은 한국 수학 교육 전문가이자 학습 리포트 작성 AI입니다.
학생의 전체 학습 데이터를 분석하여 종합 학습 리포트를 생성해주세요.

═══════════════════════════════
[학생 정보]
═══════════════════════════════
- 학년: ${grade}
- 총 풀이 수: ${submissions.length}건
- 전체 정답률: ${Math.round((submissions.filter((s) => s.isCorrect).length / Math.max(submissions.length, 1)) * 100)}%

═══════════════════════════════
[단원별 숙련도]
═══════════════════════════════
${JSON.stringify(subjectScores, null, 2)}

═══════════════════════════════
[풀이 이력 (날짜별)]
═══════════════════════════════
${JSON.stringify(
  submissions.map((s) => ({
    날짜: s.submittedAt,
    단원: s.topic,
    과목: s.subject,
    정답여부: s.isCorrect ? '정답' : '오답',
    난이도: s.difficulty,
  })),
  null,
  2
)}

═══════════════════════════════
[리포트 생성 요청]
═══════════════════════════════
아래 항목을 모두 포함하여 종합 리포트를 생성해주세요:

1. **radarData**: 단원별 숙련도 레이더 차트 데이터 (subjectScores를 기반으로 정리)
2. **timelineData**: 주간 성적 변화 (최근 4주, 주별 평균 정답률)
3. **heatmapData**: 단원(x) x 난이도(y) 매트릭스의 정답률 (0~100)
4. **aiSummary**:
   - strengths: 학생의 강점 3개 (구체적으로, 한국어)
   - weaknesses: 학생의 약점 3개 (구체적으로, 한국어)
   - advice: 실행 가능한 학습 조언 3~5개 (한국어)
   - weeklyTrend: 최근 1주 학습 추이 요약 (한 문장, 한국어)
   - monthlyTrend: 최근 1개월 학습 추이 요약 (한 문장, 한국어)

═══════════════════════════════
[출력 JSON 형식] (반드시 이 형식만 출력)
═══════════════════════════════
{
  "radarData": [
    { "subject": "단원명", "score": 85 }
  ],
  "timelineData": [
    { "date": "2025-01-06", "score": 72 },
    { "date": "2025-01-13", "score": 78 }
  ],
  "heatmapData": [
    { "x": "이차방정식", "y": "상", "value": 40 },
    { "x": "이차방정식", "y": "중", "value": 65 }
  ],
  "aiSummary": {
    "strengths": ["강점1", "강점2", "강점3"],
    "weaknesses": ["약점1", "약점2", "약점3"],
    "advice": ["조언1", "조언2", "조언3"],
    "weeklyTrend": "이번 주는 ...",
    "monthlyTrend": "최근 한 달간 ..."
  }
}

주의: 반드시 유효한 JSON만 출력하세요. 다른 텍스트나 설명을 포함하지 마세요.
timelineData의 date는 반드시 YYYY-MM-DD 형식이어야 합니다.
heatmapData의 value는 0~100 사이의 정수여야 합니다.
`;

/**
 * 학생의 전체 풀이 이력과 단원별 점수를 기반으로 종합 학습 리포트를 생성한다.
 *
 * @param studentId - 학생 ID (리포트에 포함)
 * @param grade - 학생 학년
 * @param submissions - 전체 풀이 기록
 * @param subjectScores - analyzeStudentWeakness()에서 얻은 단원별 점수
 * @returns LearningReport 또는 폴백 기본값
 *
 * 사용 예시:
 * ```typescript
 * const report = await generateLearningReport('student_2', '고1', allSubmissions, weakness.subjectScores);
 * // report.aiSummary.strengths -> ["일차함수 그래프 해석 능력 우수", ...]
 * // report.radarData -> 차트용 데이터
 * ```
 */
export async function generateLearningReport(
  studentId: string,
  grade: Grade,
  submissions: SubmissionRecord[],
  subjectScores: SubjectScore[]
): Promise<LearningReport> {
  const now = new Date().toISOString();

  if (submissions.length === 0) {
    return {
      studentId,
      generatedAt: now,
      ...FALLBACK_REPORT,
    };
  }

  // 최대 100건으로 제한
  const limitedSubmissions = submissions
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 100);

  const result = await callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [{ text: REPORT_PROMPT_TEMPLATE(grade, limitedSubmissions, subjectScores) }],
        },
      ],
    });

    const text = response.text || '';
    const parsed = safeParseJSON<Record<string, any>>(text);
    if (!parsed) return null;

    const validation = validateSchema(parsed, REPORT_SCHEMA);
    if (!validation.valid) {
      console.warn('학습 리포트 스키마 검증 실패:', validation.errors);
      return null;
    }

    // aiSummary 내부 필드 추가 검증
    const summary = parsed.aiSummary;
    if (
      !summary ||
      !Array.isArray(summary.strengths) ||
      !Array.isArray(summary.weaknesses) ||
      !Array.isArray(summary.advice) ||
      typeof summary.weeklyTrend !== 'string' ||
      typeof summary.monthlyTrend !== 'string'
    ) {
      console.warn('학습 리포트 aiSummary 내부 구조 불일치');
      return null;
    }

    return parsed as Omit<LearningReport, 'studentId' | 'generatedAt'>;
  });

  if (!result) {
    return {
      studentId,
      generatedAt: now,
      ...FALLBACK_REPORT,
    };
  }

  return {
    studentId,
    generatedAt: now,
    radarData: result.radarData,
    timelineData: result.timelineData,
    heatmapData: result.heatmapData,
    aiSummary: result.aiSummary,
  };
}
```

### 4.4 화면 컴포넌트에서의 호출 패턴

```typescript
// 예시: app/(student)/analytics.tsx 에서의 사용 패턴

import { useEffect, useState } from 'react';
import { useAnalyticsStore } from '../../src/stores/analyticsStore';
import {
  analyzeStudentWeakness,
  recommendProblems,
  generateLearningReport,
  shouldReanalyze,
  type SubmissionRecord,
} from '../../src/services/geminiAnalytics';

function StudentAnalyticsScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { studentAnalytics, setStudentAnalytics } = useAnalyticsStore();
  const studentId = 'current-student-id'; // authStore에서 가져옴

  useEffect(() => {
    const cached = studentAnalytics[studentId];
    if (shouldReanalyze(cached)) {
      runAnalysis();
    }
  }, []);

  async function runAnalysis() {
    setIsLoading(true);
    try {
      // 1단계: 취약점 분석 (먼저 표시)
      const submissions: SubmissionRecord[] = []; // submissionStore에서 로드
      const weakness = await analyzeStudentWeakness('고1', submissions);
      // -> UI 업데이트: 취약점 카드 표시

      // 2단계: 문제 추천 (백그라운드)
      const recommendation = await recommendProblems(weakness.weakTopics, []);
      // -> UI 업데이트: 추천 문제 목록 표시

      // 3단계: 종합 리포트 (백그라운드)
      const report = await generateLearningReport(studentId, '고1', submissions, weakness.subjectScores);
      // -> UI 업데이트: 리포트 차트 표시

      // analyticsStore에 캐싱
      setStudentAnalytics(studentId, {
        studentId,
        subjectScores: weakness.subjectScores,
        weakTopics: weakness.weakTopics,
        strongTopics: [], // subjectScores에서 점수 높은 것 추출
        overallScore: Math.round(
          weakness.subjectScores.reduce((sum, s) => sum + s.score, 0) /
          Math.max(weakness.subjectScores.length, 1)
        ),
        totalSolved: submissions.length,
        totalCorrect: submissions.filter((s) => s.isCorrect).length,
        streakDays: 0, // 별도 계산
        lastAnalyzedAt: new Date().toISOString(),
        submissionCountSinceLastAnalysis: 0, // 리셋
      });
    } finally {
      setIsLoading(false);
    }
  }
}
```

---

## 5. 파일 2: `src/services/geminiHelper.ts`

### 5.1 파일 개요

| 함수 | 용도 | 호출 시점 |
|------|------|-----------|
| `generateHint()` | 3단계 힌트 제공 | 학생이 풀이 화면에서 "힌트" 버튼 클릭 시 |
| `generateStepByStep()` | 전체 단계별 풀이 | 학생이 "풀이 보기" 버튼 클릭 시 / 오답노트 해설 |
| `findSimilarProblems()` | 유사 문제 매칭 | 오답노트에서 "비슷한 문제 풀기" 클릭 시 |

### 5.2 전체 소스 코드

```typescript
// src/services/geminiHelper.ts

import { GoogleGenAI } from '@google/genai';
import type { ProblemBankItem } from '../types/problemBank';

// ─── Gemini 클라이언트 ───────────────────────────────────────────
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_ID = 'gemini-2.5-flash';

// ─── 공통 유틸리티 ──────────────────────────────────────────────

const MAX_RETRIES = 2;

function safeParseJSON<T>(text: string): T | null {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonString = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();

  const jsonObjMatch = jsonString.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonObjMatch) {
    jsonString = jsonObjMatch[1];
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch {
    try {
      const fixed = jsonString.replace(
        /:\s*"((?:[^"\\]|\\.)*)"/g,
        (_match: string, value: string) => {
          const escaped = value.replace(/\\(?!\\|n|r|t|"|')/g, '\\\\');
          return `: "${escaped}"`;
        }
      );
      return JSON.parse(fixed) as T;
    } catch {
      return null;
    }
  }
}

interface SchemaField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
}

function validateSchema(
  data: Record<string, any>,
  fields: SchemaField[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const field of fields) {
    const value = data[field.key];
    if (value === undefined || value === null) {
      if (field.required) errors.push(`필수 필드 "${field.key}" 누락`);
      continue;
    }
    if (field.type === 'array') {
      if (!Array.isArray(value)) errors.push(`"${field.key}" 필드는 배열이어야 합니다`);
    } else if (typeof value !== field.type) {
      errors.push(`"${field.key}" 필드는 ${field.type} 타입이어야 합니다 (실제: ${typeof value})`);
    }
  }
  return { valid: errors.length === 0, errors };
}

async function callGeminiWithRetry<T>(
  promptFn: () => Promise<T | null>
): Promise<T | null> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await promptFn();
      if (result !== null) return result;
      lastError = new Error('JSON 파싱 실패');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.error(`Gemini API 호출 실패 (${MAX_RETRIES + 1}회 시도):`, lastError?.message);
  return null;
}

// ─── 출력 타입 ──────────────────────────────────────────────────

export type HintLevel = 1 | 2 | 3;

export interface HintResult {
  level: HintLevel;
  content: string;     // 힌트 텍스트 (LaTeX 포함 가능)
}

export interface StepByStepResult {
  steps: {
    step: number;
    title: string;       // 단계 제목 (예: "식 세우기")
    content: string;     // 설명 텍스트
    formula?: string;    // LaTeX 수식 (있는 경우)
  }[];
  finalAnswer: string;   // 최종 답 (LaTeX)
}

export interface SimilarProblemResult {
  similarProblemIds: string[];
  reasons: string[];     // 각 문제가 유사한 이유
}

// ─── 폴백 기본값 ────────────────────────────────────────────────

const FALLBACK_HINT: HintResult = {
  level: 1,
  content: '힌트를 생성할 수 없습니다. 문제를 다시 읽어보고, 어떤 수학적 개념이 필요한지 생각해보세요.',
};

const FALLBACK_STEP_BY_STEP: StepByStepResult = {
  steps: [
    {
      step: 1,
      title: '풀이 불가',
      content: 'AI 풀이를 생성할 수 없습니다. 선생님에게 질문해보세요.',
    },
  ],
  finalAnswer: '(풀이를 생성할 수 없습니다)',
};

const FALLBACK_SIMILAR: SimilarProblemResult = {
  similarProblemIds: [],
  reasons: [],
};

// ─── 스키마 정의 ────────────────────────────────────────────────

const HINT_SCHEMA: SchemaField[] = [
  { key: 'level', type: 'number', required: true },
  { key: 'content', type: 'string', required: true },
];

const STEP_BY_STEP_SCHEMA: SchemaField[] = [
  { key: 'steps', type: 'array', required: true },
  { key: 'finalAnswer', type: 'string', required: true },
];

const SIMILAR_SCHEMA: SchemaField[] = [
  { key: 'similarProblemIds', type: 'array', required: true },
  { key: 'reasons', type: 'array', required: true },
];

// ═══════════════════════════════════════════════════════════════
// 함수 1: generateHint
// ═══════════════════════════════════════════════════════════════

const HINT_PROMPT_TEMPLATE = (
  problemContent: string,
  problemAnswer: string | undefined,
  level: HintLevel
): string => `
당신은 친절하고 격려적인 한국 수학 과외 선생님입니다.
학생이 수학 문제를 풀다가 막혀서 힌트를 요청했습니다.
요청된 레벨에 맞는 힌트 하나만 제공해주세요.

═══════════════════════════════
[문제]
═══════════════════════════════
${problemContent}

${problemAnswer ? `[정답: ${problemAnswer}]` : ''}

═══════════════════════════════
[힌트 레벨 설명]
═══════════════════════════════
- 레벨 1 (접근법): 이 문제를 풀기 위해 어떤 수학적 개념/단원을 떠올려야 하는지만 알려줌. 공식이나 풀이 과정은 절대 언급하지 않음. 예: "이 문제는 이차방정식의 근과 계수의 관계를 활용하면 좋아요."
- 레벨 2 (핵심 공식): 필요한 공식이나 정리를 구체적으로 제시. 하지만 그 공식을 어떻게 적용하는지는 알려주지 않음. 예: "근과 계수의 관계에 의해 $\\alpha + \\beta = -\\frac{b}{a}$, $\\alpha\\beta = \\frac{c}{a}$ 입니다."
- 레벨 3 (첫 단계): 풀이의 첫 번째 단계를 구체적으로 보여줌 (식 세우기까지). 나머지는 학생이 스스로 풀도록 남김. 예: "주어진 조건에서 $x^2 + 6x - 2 = 0$이므로 $x^2 = -6x + 2$로 변환해보세요."

═══════════════════════════════
[요청: 레벨 ${level}의 힌트]
═══════════════════════════════

모든 수식은 LaTeX로 표기하세요 (인라인: $...$).
학생을 격려하는 톤으로 작성하세요 ("~해보세요", "~생각해볼까요?").
절대로 최종 정답을 직접 알려주지 마세요.

═══════════════════════════════
[출력 JSON 형식] (반드시 이 형식만 출력)
═══════════════════════════════
{
  "level": ${level},
  "content": "힌트 내용을 여기에 작성"
}

주의: 반드시 유효한 JSON만 출력하세요.
`;

/**
 * 문제에 대한 단계별 힌트를 생성한다.
 *
 * @param problemContent - 문제 본문 (LaTeX 포함)
 * @param level - 힌트 레벨 (1: 접근법, 2: 핵심 공식, 3: 풀이 첫 단계)
 * @param problemAnswer - 정답 (선택, 힌트 정확도 향상용)
 * @returns HintResult 또는 폴백 기본값
 *
 * 사용 예시:
 * ```typescript
 * // 버튼 클릭 시 레벨 1부터 순차 요청
 * const hint1 = await generateHint(problem.content, 1, problem.answer);
 * // hint1.content -> "이 문제는 이차함수의 꼭짓점을 구하는 문제예요. ..."
 *
 * // 다시 클릭하면 레벨 2
 * const hint2 = await generateHint(problem.content, 2, problem.answer);
 * ```
 */
export async function generateHint(
  problemContent: string,
  level: HintLevel,
  problemAnswer?: string
): Promise<HintResult> {
  if (!problemContent.trim()) {
    return { ...FALLBACK_HINT, level };
  }

  const result = await callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [{ text: HINT_PROMPT_TEMPLATE(problemContent, problemAnswer, level) }],
        },
      ],
    });

    const text = response.text || '';
    const parsed = safeParseJSON<Record<string, any>>(text);
    if (!parsed) return null;

    const validation = validateSchema(parsed, HINT_SCHEMA);
    if (!validation.valid) {
      console.warn('힌트 스키마 검증 실패:', validation.errors);
      return null;
    }

    return parsed as HintResult;
  });

  if (!result) {
    return { ...FALLBACK_HINT, level };
  }

  return {
    level,
    content: result.content,
  };
}

// ═══════════════════════════════════════════════════════════════
// 함수 2: generateStepByStep
// ═══════════════════════════════════════════════════════════════

const STEP_BY_STEP_PROMPT_TEMPLATE = (
  problemContent: string,
  problemAnswer: string | undefined,
  problemType: string
): string => `
당신은 한국 수학 학원의 베테랑 선생님입니다.
학생이 이해할 수 있도록 수학 문제의 상세한 단계별 풀이를 작성해주세요.

═══════════════════════════════
[문제]
═══════════════════════════════
${problemContent}

[문제 유형: ${problemType}]
${problemAnswer ? `[정답: ${problemAnswer}]` : ''}

═══════════════════════════════
[풀이 작성 규칙]
═══════════════════════════════
1. 각 단계는 하나의 논리적 행동만 포함 (식 세우기, 변환, 계산 등)
2. 학생이 "왜 이렇게 하는지" 이해할 수 있도록 각 단계에 간단한 설명 포함
3. 모든 수식은 LaTeX로 표기 (인라인: $...$, 독립 수식: $$...$$)
4. 계산 과정을 건너뛰지 말 것 (중간 과정 모두 표시)
5. 객관식이면 왜 해당 선지가 정답인지 설명
6. 서술형이면 답안 작성 방법도 안내
7. 최종 답을 명확하게 표시
8. 단계 수는 3~8단계가 적절
9. 한국어로 작성하되, 교과서 용어를 사용

═══════════════════════════════
[출력 JSON 형식] (반드시 이 형식만 출력)
═══════════════════════════════
{
  "steps": [
    {
      "step": 1,
      "title": "단계 제목 (예: 조건 정리)",
      "content": "이 단계에서 무엇을 하는지 설명",
      "formula": "$$해당 단계의 핵심 수식$$"
    },
    {
      "step": 2,
      "title": "단계 제목",
      "content": "설명",
      "formula": "$$수식$$"
    }
  ],
  "finalAnswer": "최종 답 (LaTeX 포함)"
}

주의사항:
- formula 필드는 해당 단계에 수식이 있을 때만 포함 (없으면 생략 가능)
- steps 배열의 step 값은 1부터 순차 증가
- 반드시 유효한 JSON만 출력하세요
`;

/**
 * 문제의 전체 단계별 풀이를 생성한다.
 *
 * @param problemContent - 문제 본문 (LaTeX 포함)
 * @param problemType - 문제 유형 ('객관식' | '서술형' | '단답형')
 * @param problemAnswer - 정답 (선택, 풀이 정확도 향상용)
 * @returns StepByStepResult 또는 폴백 기본값
 *
 * 사용 예시:
 * ```typescript
 * const solution = await generateStepByStep(
 *   problem.content,
 *   problem.type,
 *   problem.answer
 * );
 * // solution.steps -> [{ step: 1, title: "조건 정리", content: "...", formula: "$$...$$" }, ...]
 * // solution.finalAnswer -> "$x = 3$"
 * ```
 */
export async function generateStepByStep(
  problemContent: string,
  problemType: string = '단답형',
  problemAnswer?: string
): Promise<StepByStepResult> {
  if (!problemContent.trim()) {
    return FALLBACK_STEP_BY_STEP;
  }

  const result = await callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [
            { text: STEP_BY_STEP_PROMPT_TEMPLATE(problemContent, problemAnswer, problemType) },
          ],
        },
      ],
    });

    const text = response.text || '';
    const parsed = safeParseJSON<Record<string, any>>(text);
    if (!parsed) return null;

    const validation = validateSchema(parsed, STEP_BY_STEP_SCHEMA);
    if (!validation.valid) {
      console.warn('단계별 풀이 스키마 검증 실패:', validation.errors);
      return null;
    }

    // steps 배열 내부 요소 검증
    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      console.warn('단계별 풀이 steps 배열이 비어있음');
      return null;
    }

    for (const step of parsed.steps) {
      if (typeof step.step !== 'number' || typeof step.title !== 'string' || typeof step.content !== 'string') {
        console.warn('단계별 풀이 step 내부 구조 불일치:', step);
        return null;
      }
    }

    return parsed as StepByStepResult;
  });

  return result || FALLBACK_STEP_BY_STEP;
}

// ═══════════════════════════════════════════════════════════════
// 함수 3: findSimilarProblems
// ═══════════════════════════════════════════════════════════════

const SIMILAR_PROMPT_TEMPLATE = (
  problemContent: string,
  problemTopic: string,
  problemDifficulty: string,
  bankSummaries: { id: string; topic: string; difficulty: string; content: string }[]
): string => `
당신은 한국 수학 교육 전문가입니다.
주어진 원본 문제와 유사한 문제를 문제은행에서 찾아주세요.

═══════════════════════════════
[원본 문제]
═══════════════════════════════
- 내용: ${problemContent}
- 단원: ${problemTopic}
- 난이도: ${problemDifficulty}

═══════════════════════════════
[문제은행]
═══════════════════════════════
${JSON.stringify(
  bankSummaries.map((p) => ({
    id: p.id,
    단원: p.topic,
    난이도: p.difficulty,
    문제요약: p.content.substring(0, 80),
  })),
  null,
  2
)}

═══════════════════════════════
[유사성 판단 기준]
═══════════════════════════════
1. **같은 단원**: 동일한 수학적 개념을 다루는 문제 (가장 중요)
2. **유사한 풀이 방법**: 같은 공식/정리를 사용하여 풀 수 있는 문제
3. **비슷한 난이도**: 원본과 같거나 한 단계 높은/낮은 난이도
4. **문제 구조 유사성**: 조건 제시 방식이나 질문 형태가 비슷한 문제

═══════════════════════════════
[선정 규칙]
═══════════════════════════════
- 3~5개의 유사 문제를 선정
- 원본 문제 자체는 제외
- 반드시 문제은행에 존재하는 ID만 사용
- 유사도가 높은 순서로 정렬

═══════════════════════════════
[출력 JSON 형식] (반드시 이 형식만 출력)
═══════════════════════════════
{
  "similarProblemIds": ["id1", "id2", "id3"],
  "reasons": [
    "id1: 이 문제가 원본과 유사한 이유 (한국어)",
    "id2: 이 문제가 원본과 유사한 이유 (한국어)",
    "id3: 이 문제가 원본과 유사한 이유 (한국어)"
  ]
}

주의: similarProblemIds는 반드시 위 문제은행에 있는 id 값이어야 합니다.
반드시 유효한 JSON만 출력하세요.
`;

/**
 * 주어진 문제와 유사한 문제를 문제은행에서 찾는다.
 *
 * @param problem - 원본 문제 (현재 풀고 있는 문제 / 오답 문제)
 * @param problemBank - 검색 대상 문제은행 (해당 학년 필터링 후 전달 권장)
 * @returns SimilarProblemResult 또는 폴백 기본값
 *
 * 사용 예시:
 * ```typescript
 * const similar = await findSimilarProblems(currentProblem, allProblemsForGrade);
 * // similar.similarProblemIds -> ["prob_12", "prob_34", "prob_56"]
 * // similar.reasons -> ["prob_12: 동일한 이차방정식 단원으로...", ...]
 * ```
 */
export async function findSimilarProblems(
  problem: Pick<ProblemBankItem, 'id' | 'content' | 'topic' | 'difficulty'>,
  problemBank: ProblemBankItem[]
): Promise<SimilarProblemResult> {
  if (!problem.content.trim() || problemBank.length === 0) {
    return FALLBACK_SIMILAR;
  }

  // 원본 문제를 제외하고, 같은 단원 + 인접 단원 문제를 우선 전달
  const filtered = problemBank.filter((p) => p.id !== problem.id);

  // 같은 단원 문제 우선, 나머지도 포함 (최대 40개)
  const sameTopic = filtered.filter((p) => p.topic === problem.topic);
  const otherTopic = filtered.filter((p) => p.topic !== problem.topic);
  const combined = [...sameTopic, ...otherTopic].slice(0, 40);

  if (combined.length === 0) {
    return FALLBACK_SIMILAR;
  }

  const bankSummaries = combined.map((p) => ({
    id: p.id,
    topic: p.topic,
    difficulty: p.difficulty,
    content: p.content,
  }));

  const result = await callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: SIMILAR_PROMPT_TEMPLATE(
                problem.content,
                problem.topic,
                problem.difficulty,
                bankSummaries
              ),
            },
          ],
        },
      ],
    });

    const text = response.text || '';
    const parsed = safeParseJSON<Record<string, any>>(text);
    if (!parsed) return null;

    const validation = validateSchema(parsed, SIMILAR_SCHEMA);
    if (!validation.valid) {
      console.warn('유사 문제 스키마 검증 실패:', validation.errors);
      return null;
    }

    return parsed as SimilarProblemResult;
  });

  if (!result) {
    return FALLBACK_SIMILAR;
  }

  // 존재하는 문제 ID만 필터링
  const validIds = new Set(problemBank.map((p) => p.id));
  const filteredIds = result.similarProblemIds.filter((id: string) => validIds.has(id));

  return {
    similarProblemIds: filteredIds,
    reasons: result.reasons,
  };
}
```

### 5.3 UI 컴포넌트에서의 호출 패턴

```typescript
// 예시: HintButton 컴포넌트에서의 사용

import { useState } from 'react';
import { generateHint, type HintLevel, type HintResult } from '../../services/geminiHelper';

function HintButton({ problemContent, problemAnswer }: Props) {
  const [currentLevel, setCurrentLevel] = useState<HintLevel>(1);
  const [hints, setHints] = useState<HintResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleHintRequest() {
    if (currentLevel > 3) return; // 최대 3단계

    setIsLoading(true);
    try {
      const hint = await generateHint(problemContent, currentLevel, problemAnswer);
      setHints((prev) => [...prev, hint]);
      setCurrentLevel((prev) => Math.min(prev + 1, 3) as HintLevel);
    } finally {
      setIsLoading(false);
    }
  }

  // ... 렌더링: hints 배열을 순서대로 표시, isLoading 시 스켈레톤 UI
}
```

---

## 6. 에러 처리 패턴 종합

### 6.1 에러 발생 지점별 처리

| 에러 유형 | 발생 지점 | 처리 방식 |
|-----------|-----------|-----------|
| API 키 미설정 | 클라이언트 초기화 | SDK가 빈 문자열로 초기화, 호출 시 에러 발생 -> `callGeminiWithRetry`가 잡아서 재시도 후 폴백 |
| 네트워크 에러 | API 호출 | `callGeminiWithRetry`에서 최대 2회 재시도 (1초 간격) |
| JSON 파싱 실패 | 응답 처리 | `safeParseJSON`에서 코드블록 추출 + LaTeX 이스케이프 수정 후 재파싱. 실패 시 null -> 재시도 |
| 스키마 불일치 | 검증 단계 | `validateSchema`가 경고 로그 출력 후 null 반환 -> 재시도 |
| 모든 시도 실패 | 최종 | 각 함수의 폴백 기본값 반환 (앱 크래시 방지) |
| 빈 입력 | 함수 진입 | 즉시 폴백 반환 (API 호출 불필요) |

### 6.2 UI에서의 에러 표시

이 섹션의 서비스 함수들은 **절대 throw하지 않는다**. 모든 에러는 내부에서 처리되며, 폴백 기본값을 반환한다. UI에서는 반환값의 내용을 확인하여 적절한 메시지를 표시한다:

```typescript
// 예시: 분석 결과가 폴백인지 확인
const weakness = await analyzeStudentWeakness('고1', submissions);
const isFallback = weakness.weakTopics[0]?.topic === '분석 불가';

if (isFallback) {
  // "AI 분석을 수행할 수 없습니다" 메시지 표시 + 재시도 버튼
} else {
  // 정상 분석 결과 표시
}
```

---

## 7. 생성할 파일 목록

| # | 파일 경로 | 설명 | 크기 추정 |
|---|----------|------|----------|
| 1 | `src/services/geminiAnalytics.ts` | 학습 분석 AI 서비스 (3개 함수 + 유틸리티) | ~350줄 |
| 2 | `src/services/geminiHelper.ts` | AI 풀이 도우미 서비스 (3개 함수 + 유틸리티) | ~350줄 |

**수정할 파일**: 없음. 이 섹션은 신규 파일만 생성한다. 기존 `geminiService.ts`는 수정하지 않는다.

---

## 8. 검증 체크리스트 (Acceptance Criteria)

### 8.1 geminiAnalytics.ts

- [ ] `analyzeStudentWeakness()`가 풀이 데이터를 전달받아 취약 단원 분석 결과를 반환한다
- [ ] `analyzeStudentWeakness()`가 빈 submissions 배열에 대해 폴백 기본값을 반환한다
- [ ] `recommendProblems()`가 취약 단원 + 문제은행으로부터 추천 문제 ID 목록을 반환한다
- [ ] `recommendProblems()`가 존재하지 않는 문제 ID를 필터링하여 유효한 ID만 반환한다
- [ ] `generateLearningReport()`가 종합 리포트(레이더, 타임라인, 히트맵, AI 요약)를 반환한다
- [ ] `shouldReanalyze()`가 캐시 없으면 true, 5건 미만이면 false, 5건 이상이면 true를 반환한다
- [ ] 모든 함수에서 JSON 파싱 실패 시 최대 2회 재시도한다
- [ ] 모든 재시도 실패 시 폴백 기본값을 반환한다 (throw하지 않음)
- [ ] JSON 스키마 검증이 필수 필드 누락/타입 불일치를 감지한다
- [ ] submissions를 50건(weakness)/100건(report)으로 제한하여 토큰 사용을 최적화한다
- [ ] 프롬프트가 한국어로 작성되어 있고 수학 교육 맥락에 맞는 결과를 유도한다

### 8.2 geminiHelper.ts

- [ ] `generateHint()`가 level 1/2/3에 대해 각각 적절한 수준의 힌트를 반환한다
- [ ] `generateHint()`가 빈 문제 내용에 대해 폴백 기본값을 반환한다
- [ ] `generateStepByStep()`가 단계별 풀이(steps 배열 + finalAnswer)를 반환한다
- [ ] `generateStepByStep()`의 각 step이 step, title, content 필드를 포함한다
- [ ] `findSimilarProblems()`가 유사 문제 ID 목록을 반환한다
- [ ] `findSimilarProblems()`가 원본 문제를 결과에서 제외한다
- [ ] `findSimilarProblems()`가 문제은행에 존재하지 않는 ID를 필터링한다
- [ ] 모든 함수에서 JSON 파싱 실패 시 최대 2회 재시도한다
- [ ] 모든 재시도 실패 시 폴백 기본값을 반환한다 (throw하지 않음)
- [ ] 힌트 프롬프트가 레벨별로 정답을 직접 노출하지 않도록 설계되었다
- [ ] 모든 프롬프트에서 LaTeX 수식 사용을 지시한다

### 8.3 공통

- [ ] 두 파일 모두 `@google/genai` SDK를 사용하여 `gemini-2.5-flash` 모델을 호출한다
- [ ] 두 파일 모두 `process.env.EXPO_PUBLIC_GEMINI_API_KEY`에서 API 키를 읽는다
- [ ] 두 파일 모두 TypeScript 타입 에러 없이 컴파일된다
- [ ] 두 파일의 export된 타입과 함수가 Section 06 (Charts & Analytics UI), Section 08 (AI Helper)에서 import 가능하다
- [ ] `console.error`/`console.warn`으로 디버깅 정보를 출력하되, 사용자에게는 노출하지 않는다
