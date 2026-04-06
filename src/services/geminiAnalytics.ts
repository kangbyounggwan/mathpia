// ============================================================
// src/services/geminiAnalytics.ts
// AI-powered learning analytics service using Gemini 2.5 Flash
// ============================================================

import type { Grade } from '../types';
import type { ProblemBankItem } from '../types/problemBank';
import type {
  StudentAnalytics,
  WeaknessAnalysis,
  WeakTopic,
  SubjectScore,
  ErrorPattern,
  LearningReport,
  RadarDataPoint,
  TimeSeriesPoint,
  HeatMapCell,
} from '../types/analytics';
import {
  ai,
  MODEL_ID,
  MAX_RETRIES,
  safeParseJSON,
  validateSchema,
  callGeminiWithRetry,
  type SchemaField,
} from './geminiUtils';

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
  problemContent: string; // 문제 본문 (첫 100자 정도로 요약 가능)
  topic: string;          // 단원명
  subject: string;        // 과목/대단원명
  difficulty: '상' | '중' | '하';
  isCorrect: boolean;
  studentAnswer?: string;
  correctAnswer?: string;
  submittedAt: string;    // ISO 날짜 문자열
}

// ─── 내부 파싱 타입 (Gemini 응답 구조) ────────────────────────────

/** Gemini가 반환하는 취약점 분석 원시 구조 */
interface WeaknessRawResponse {
  subjectScores: { subject: string; score: number }[];
  weakTopics: WeakTopic[];
  errorPatterns: { pattern: string; frequency: number; examples: string[] }[];
  recommendations: string[];
}

/** Gemini가 반환하는 문제 추천 원시 구조 */
interface RecommendationRawResponse {
  recommendedProblemIds: string[];
  reasons: string[];
}

/** 함수가 반환하는 문제 추천 결과 */
export interface ProblemRecommendationResult {
  recommendedProblemIds: string[];
  reasons: string[];
}

/** Gemini가 반환하는 학습 리포트 원시 구조 */
interface ReportRawResponse {
  radarData: RadarDataPoint[];
  timelineData: TimeSeriesPoint[];
  heatmapData: HeatMapCell[];
  aiSummary: string;
  strengths: string[];
  weaknesses: string[];
  advice: string[];
}

// ─── 폴백 기본값 ────────────────────────────────────────────────

const FALLBACK_WEAKNESS_DATA: {
  subjectScores: SubjectScore[];
  weakTopics: WeakTopic[];
  errorPatterns: ErrorPattern[];
  recommendations: string[];
} = {
  subjectScores: [],
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

const FALLBACK_RECOMMENDATION: ProblemRecommendationResult = {
  recommendedProblemIds: [],
  reasons: [],
};

const FALLBACK_REPORT_DATA: Omit<LearningReport, 'studentId' | 'generatedAt'> = {
  radarData: [],
  timelineData: [],
  heatmapData: [],
  aiSummary: '분석 데이터가 부족하여 리포트를 생성할 수 없습니다.',
  strengths: ['분석 데이터 부족'],
  weaknesses: ['분석 데이터 부족'],
  advice: ['더 많은 문제를 풀어보면 정확한 분석이 가능합니다.'],
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
  { key: 'aiSummary', type: 'string', required: true },
  { key: 'strengths', type: 'array', required: true },
  { key: 'weaknesses', type: 'array', required: true },
  { key: 'advice', type: 'array', required: true },
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
3. **오류 패턴 분석**: 학생이 반복적으로 보이는 실수 유형을 3~5가지로 정리. 각 패턴에 대해 빈도(frequency, 1~10)와 예시를 포함.
4. **학습 추천**: 구체적이고 실행 가능한 학습 조언 3~5개

═══════════════════════════════
[출력 JSON 형식] (반드시 이 형식만 출력)
═══════════════════════════════
{
  "subjectScores": [
    { "subject": "단원명", "score": 85, "totalProblems": 10, "correctProblems": 8 }
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
    {
      "pattern": "오류 패턴 설명",
      "frequency": 5,
      "examples": ["예시 1", "예시 2"]
    }
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
 * @param studentId - 학생 ID
 * @param grade - 학생 학년
 * @param submissions - 최근 풀이 기록 배열 (최대 50건 권장)
 * @returns WeaknessAnalysis (실제 타입에 맞춤) 및 부가 데이터
 */
export async function analyzeStudentWeakness(
  studentId: string,
  grade: Grade,
  submissions: SubmissionRecord[]
): Promise<{
  weakness: WeaknessAnalysis;
  subjectScores: SubjectScore[];
}> {
  const now = new Date();

  // 풀이 데이터가 없으면 폴백 반환
  if (submissions.length === 0) {
    return {
      weakness: {
        studentId,
        analyzedAt: now,
        weakTopics: FALLBACK_WEAKNESS_DATA.weakTopics,
        errorPatterns: FALLBACK_WEAKNESS_DATA.errorPatterns,
        recommendations: FALLBACK_WEAKNESS_DATA.recommendations,
      },
      subjectScores: [],
    };
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
    const parsed = safeParseJSON<Record<string, unknown>>(text);
    if (!parsed) return null;

    // 스키마 검증
    const validation = validateSchema(parsed, WEAKNESS_SCHEMA);
    if (!validation.valid) {
      console.warn('취약점 분석 스키마 검증 실패:', validation.errors);
      return null;
    }

    return parsed as unknown as WeaknessRawResponse;
  }, MAX_RETRIES);

  if (!result) {
    return {
      weakness: {
        studentId,
        analyzedAt: now,
        weakTopics: FALLBACK_WEAKNESS_DATA.weakTopics,
        errorPatterns: FALLBACK_WEAKNESS_DATA.errorPatterns,
        recommendations: FALLBACK_WEAKNESS_DATA.recommendations,
      },
      subjectScores: [],
    };
  }

  // SubjectScore 변환: Gemini 응답에서 totalProblems/correctProblems가 없으면 기본값
  const subjectScores: SubjectScore[] = result.subjectScores.map((s) => ({
    subject: s.subject,
    score: s.score,
    totalProblems: (s as Record<string, unknown>).totalProblems as number ?? 0,
    correctProblems: (s as Record<string, unknown>).correctProblems as number ?? 0,
  }));

  // ErrorPattern 변환
  const errorPatterns: ErrorPattern[] = result.errorPatterns.map((ep) => ({
    pattern: ep.pattern,
    frequency: ep.frequency ?? 1,
    examples: ep.examples ?? [],
  }));

  return {
    weakness: {
      studentId,
      analyzedAt: now,
      weakTopics: result.weakTopics.slice(0, 3),
      errorPatterns,
      recommendations: result.recommendations,
    },
    subjectScores,
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
 */
export async function recommendProblems(
  weakTopics: WeakTopic[],
  problemBank: ProblemBankItem[]
): Promise<ProblemRecommendationResult> {
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
    const parsed = safeParseJSON<Record<string, unknown>>(text);
    if (!parsed) return null;

    const validation = validateSchema(parsed, RECOMMENDATION_SCHEMA);
    if (!validation.valid) {
      console.warn('문제 추천 스키마 검증 실패:', validation.errors);
      return null;
    }

    return parsed as unknown as RecommendationRawResponse;
  }, MAX_RETRIES);

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

1. **radarData**: 단원별 숙련도 레이더 차트 데이터
2. **timelineData**: 주간 성적 변화 (최근 4주, 주별 평균 정답률)
3. **heatmapData**: 단원(x) x 난이도(y) 매트릭스의 정답률 (0~100)
4. **aiSummary**: 학생의 전반적인 학습 상태를 2~3문장으로 요약 (한국어)
5. **strengths**: 학생의 강점 3개 (구체적으로, 한국어)
6. **weaknesses**: 학생의 약점 3개 (구체적으로, 한국어)
7. **advice**: 실행 가능한 학습 조언 3~5개 (한국어)

═══════════════════════════════
[출력 JSON 형식] (반드시 이 형식만 출력)
═══════════════════════════════
{
  "radarData": [
    { "label": "단원명", "value": 85 }
  ],
  "timelineData": [
    { "date": "2025-01-06", "score": 72 },
    { "date": "2025-01-13", "score": 78 }
  ],
  "heatmapData": [
    { "x": "이차방정식", "y": "상", "value": 40 },
    { "x": "이차방정식", "y": "중", "value": 65 }
  ],
  "aiSummary": "전반적인 학습 상태 요약 (2~3문장, 한국어)",
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2", "약점3"],
  "advice": ["조언1", "조언2", "조언3"]
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
 */
export async function generateLearningReport(
  studentId: string,
  grade: Grade,
  submissions: SubmissionRecord[],
  subjectScores: SubjectScore[]
): Promise<LearningReport> {
  const now = new Date();

  if (submissions.length === 0) {
    return {
      studentId,
      generatedAt: now,
      ...FALLBACK_REPORT_DATA,
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
    const parsed = safeParseJSON<Record<string, unknown>>(text);
    if (!parsed) return null;

    const validation = validateSchema(parsed, REPORT_SCHEMA);
    if (!validation.valid) {
      console.warn('학습 리포트 스키마 검증 실패:', validation.errors);
      return null;
    }

    // 내부 필드 추가 검증
    if (
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.weaknesses) ||
      !Array.isArray(parsed.advice) ||
      typeof parsed.aiSummary !== 'string'
    ) {
      console.warn('학습 리포트 내부 구조 불일치');
      return null;
    }

    return parsed as unknown as ReportRawResponse;
  }, MAX_RETRIES);

  if (!result) {
    return {
      studentId,
      generatedAt: now,
      ...FALLBACK_REPORT_DATA,
    };
  }

  return {
    studentId,
    generatedAt: now,
    radarData: result.radarData,
    timelineData: result.timelineData,
    heatmapData: result.heatmapData,
    aiSummary: result.aiSummary,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    advice: result.advice,
  };
}
