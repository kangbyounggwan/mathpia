// ============================================================
// src/services/geminiHelper.ts
// AI tutoring helper service using Gemini 2.5 Flash
// ============================================================

import type { ProblemBankItem } from '../types/problemBank';
import {
  ai,
  MODEL_ID,
  MAX_RETRIES,
  safeParseJSON,
  validateSchema,
  callGeminiWithRetry,
  type SchemaField,
} from './geminiUtils';

// ─── 출력 타입 ──────────────────────────────────────────────────

export type HintLevel = 1 | 2 | 3;

export interface HintResult {
  level: HintLevel;
  content: string; // 힌트 텍스트 (LaTeX 포함 가능)
}

export interface StepByStepResult {
  steps: {
    step: number;
    title: string;    // 단계 제목 (예: "식 세우기")
    content: string;  // 설명 텍스트
    formula?: string; // LaTeX 수식 (있는 경우)
  }[];
  finalAnswer: string; // 최종 답 (LaTeX)
}

export interface SimilarProblemResult {
  similarProblemIds: string[];
  reasons: string[]; // 각 문제가 유사한 이유
}

export interface WrongAnswerExplanation {
  whyWrong: string;        // 오답인 이유
  correctApproach: string; // 올바른 접근 방법
  keyConceptReview: string; // 복습해야 할 핵심 개념
  encouragement: string;   // 격려 메시지
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

const FALLBACK_WRONG_ANSWER: WrongAnswerExplanation = {
  whyWrong: '오답 분석을 수행할 수 없습니다.',
  correctApproach: '선생님에게 질문해보세요.',
  keyConceptReview: '',
  encouragement: '다시 도전해보세요! 실수에서 배우는 것이 가장 효과적인 학습입니다.',
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

const WRONG_ANSWER_SCHEMA: SchemaField[] = [
  { key: 'whyWrong', type: 'string', required: true },
  { key: 'correctApproach', type: 'string', required: true },
  { key: 'keyConceptReview', type: 'string', required: true },
  { key: 'encouragement', type: 'string', required: true },
];

// ═══════════════════════════════════════════════════════════════
// 함수 1: getHint (progressive hints)
// ═══════════════════════════════════════════════════════════════

const HINT_PROMPT_TEMPLATE = (
  problemContent: string,
  problemAnswer: string | undefined,
  level: HintLevel,
  attemptCount: number
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
[학생 시도 횟수: ${attemptCount}회]
═══════════════════════════════

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
 * attemptCount에 따라 자동으로 힌트 레벨이 결정되며,
 * 시도 횟수가 많을수록 구체적인 힌트가 제공된다.
 *
 * @param problemContent - 문제 본문 (LaTeX 포함)
 * @param attemptCount - 학생의 시도 횟수 (1부터 시작)
 * @param problemAnswer - 정답 (선택, 힌트 정확도 향상용)
 * @returns HintResult 또는 폴백 기본값
 */
export async function getHint(
  problemContent: string,
  attemptCount: number,
  problemAnswer?: string
): Promise<HintResult> {
  // 시도 횟수에 따라 힌트 레벨 결정 (1~3)
  const level: HintLevel = Math.min(Math.max(attemptCount, 1), 3) as HintLevel;

  if (!problemContent.trim()) {
    return { ...FALLBACK_HINT, level };
  }

  const result = await callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [{ text: HINT_PROMPT_TEMPLATE(problemContent, problemAnswer, level, attemptCount) }],
        },
      ],
    });

    const text = response.text || '';
    const parsed = safeParseJSON<Record<string, unknown>>(text);
    if (!parsed) return null;

    const validation = validateSchema(parsed, HINT_SCHEMA);
    if (!validation.valid) {
      console.warn('힌트 스키마 검증 실패:', validation.errors);
      return null;
    }

    return parsed as unknown as HintResult;
  }, MAX_RETRIES);

  if (!result) {
    return { ...FALLBACK_HINT, level };
  }

  return {
    level,
    content: result.content,
  };
}

// ═══════════════════════════════════════════════════════════════
// 함수 2: getStepByStepSolution
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
 */
export async function getStepByStepSolution(
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
    const parsed = safeParseJSON<Record<string, unknown>>(text);
    if (!parsed) return null;

    const validation = validateSchema(parsed, STEP_BY_STEP_SCHEMA);
    if (!validation.valid) {
      console.warn('단계별 풀이 스키마 검증 실패:', validation.errors);
      return null;
    }

    // steps 배열 내부 요소 검증
    const steps = parsed.steps as Record<string, unknown>[];
    if (!Array.isArray(steps) || steps.length === 0) {
      console.warn('단계별 풀이 steps 배열이 비어있음');
      return null;
    }

    for (const step of steps) {
      if (
        typeof step.step !== 'number' ||
        typeof step.title !== 'string' ||
        typeof step.content !== 'string'
      ) {
        console.warn('단계별 풀이 step 내부 구조 불일치:', step);
        return null;
      }
    }

    return parsed as unknown as StepByStepResult;
  }, MAX_RETRIES);

  return result || FALLBACK_STEP_BY_STEP;
}

// ═══════════════════════════════════════════════════════════════
// 함수 3: getSimilarProblems
// ═══════════════════════════════════════════════════════════════

const SIMILAR_PROMPT_TEMPLATE = (
  problemContent: string,
  problemTopic: string,
  problemDifficulty: string,
  bankSummaries: { id: string; topic: string; difficulty: string; content: string }[],
  count: number
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
- ${count}개의 유사 문제를 선정
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
 * @param count - 추천할 유사 문제 수 (기본값: 3)
 * @returns SimilarProblemResult 또는 폴백 기본값
 */
export async function getSimilarProblems(
  problem: Pick<ProblemBankItem, 'id' | 'content' | 'topic' | 'difficulty'>,
  problemBank: ProblemBankItem[],
  count: number = 3
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
                bankSummaries,
                count
              ),
            },
          ],
        },
      ],
    });

    const text = response.text || '';
    const parsed = safeParseJSON<Record<string, unknown>>(text);
    if (!parsed) return null;

    const validation = validateSchema(parsed, SIMILAR_SCHEMA);
    if (!validation.valid) {
      console.warn('유사 문제 스키마 검증 실패:', validation.errors);
      return null;
    }

    return parsed as unknown as SimilarProblemResult;
  }, MAX_RETRIES);

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

// ═══════════════════════════════════════════════════════════════
// 함수 4: explainWrongAnswer
// ═══════════════════════════════════════════════════════════════

const WRONG_ANSWER_PROMPT_TEMPLATE = (
  problemContent: string,
  studentAnswer: string,
  correctAnswer: string
): string => `
당신은 친절하고 이해심 많은 한국 수학 과외 선생님입니다.
학생이 문제를 틀렸을 때 왜 틀렸는지 분석하고, 올바른 풀이 방향을 안내해주세요.

═══════════════════════════════
[문제]
═══════════════════════════════
${problemContent}

═══════════════════════════════
[학생의 답: ${studentAnswer}]
[정답: ${correctAnswer}]
═══════════════════════════════

═══════════════════════════════
[분석 요청]
═══════════════════════════════
1. **whyWrong**: 학생의 답이 왜 틀렸는지 구체적으로 분석. 어떤 개념을 잘못 이해했거나 어디서 실수했는지 추론. LaTeX 수식을 사용해 설명.
2. **correctApproach**: 이 문제를 올바르게 푸는 접근법을 단계별로 간략히 설명. LaTeX 수식 포함.
3. **keyConceptReview**: 이 문제를 틀린 학생이 반드시 복습해야 할 핵심 개념 (단원명, 공식, 정리 등)
4. **encouragement**: 학생을 격려하는 따뜻한 메시지 (한 문장)

═══════════════════════════════
[출력 JSON 형식] (반드시 이 형식만 출력)
═══════════════════════════════
{
  "whyWrong": "오답 분석 내용 (LaTeX 포함, 한국어)",
  "correctApproach": "올바른 접근법 (LaTeX 포함, 한국어)",
  "keyConceptReview": "복습할 핵심 개념 (한국어)",
  "encouragement": "격려 메시지 (한국어)"
}

주의: 반드시 유효한 JSON만 출력하세요. 모든 수식은 LaTeX($...$)로 표기하세요.
`;

/**
 * 학생의 오답에 대해 왜 틀렸는지 분석하고 올바른 접근법을 안내한다.
 *
 * @param problemContent - 문제 본문 (LaTeX 포함)
 * @param studentAnswer - 학생이 제출한 답
 * @param correctAnswer - 정답
 * @returns WrongAnswerExplanation 또는 폴백 기본값
 */
export async function explainWrongAnswer(
  problemContent: string,
  studentAnswer: string,
  correctAnswer: string
): Promise<WrongAnswerExplanation> {
  if (!problemContent.trim() || !studentAnswer.trim() || !correctAnswer.trim()) {
    return FALLBACK_WRONG_ANSWER;
  }

  const result = await callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: WRONG_ANSWER_PROMPT_TEMPLATE(problemContent, studentAnswer, correctAnswer),
            },
          ],
        },
      ],
    });

    const text = response.text || '';
    const parsed = safeParseJSON<Record<string, unknown>>(text);
    if (!parsed) return null;

    const validation = validateSchema(parsed, WRONG_ANSWER_SCHEMA);
    if (!validation.valid) {
      console.warn('오답 분석 스키마 검증 실패:', validation.errors);
      return null;
    }

    return parsed as unknown as WrongAnswerExplanation;
  }, MAX_RETRIES);

  return result || FALLBACK_WRONG_ANSWER;
}
