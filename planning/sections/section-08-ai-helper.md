# Section 08: AI Helper (AI 풀이 도우미)

## Background

이 섹션은 학생이 문제를 풀다가 막힐 때 AI의 도움을 받을 수 있는 3가지 기능을 구현한다:
1. **힌트 (3단계 점진적 제공)**: 접근법 -> 핵심 공식 -> 풀이 첫 단계
2. **단계별 풀이**: 아코디언 형태로 한 단계씩 펼쳐 보기
3. **유사 문제 추천**: 문제은행에서 비슷한 문제를 찾아 보여주기

모든 UI 컴포넌트는 `src/components/aiHelper/` 디렉토리에 생성하고, 기존 `app/(student)/solve.tsx` 문제 풀이 화면에 통합한다. AI 호출은 Section 05에서 구현된 `src/services/geminiHelper.ts`를 사용한다.

---

## Dependencies (선행 섹션)

| 선행 섹션 | 제공하는 것 | 이 섹션에서 사용하는 부분 |
|-----------|-----------|------------------------|
| Section 01 (Types & Interfaces) | `ProblemBankItem` 타입, 서비스 인터페이스 | 문제 타입, 힌트/풀이 응답 타입 |
| Section 02 (Mock Data & Services) | Mock 문제 100개+, `mockProblemBank` 서비스 | 유사 문제 검색용 문제은행 데이터 |
| Section 03 (Zustand Stores) | `problemBankStore`, `submissionStore` | 문제 데이터 접근, 힌트 사용 기록 |
| Section 04 (Problem Bank UI) | `ProblemCard` 컴포넌트 | 유사 문제 표시용 카드 UI 재사용 |
| Section 05 (Gemini AI Services) | `geminiHelper.ts` 서비스 | `generateHint()`, `generateStepByStep()`, `findSimilarProblems()` |

---

## Existing Project Context

이 섹션 작업 시 알아야 할 기존 프로젝트 구조:

### 프로젝트 기술 스택
- **Expo SDK 54**, React 19.1, React Native 0.81.5
- **Expo Router** (파일 기반 라우팅)
- **react-native-paper** (UI 라이브러리)
- **Zustand** (상태 관리)
- **@google/genai** (Gemini API 클라이언트)
- **react-native-math-view** / **katex** (LaTeX 렌더링)
- **react-native-svg** (차트/그래픽)
- **@expo/vector-icons** (MaterialCommunityIcons)

### 디자인 시스템 (src/constants/theme.ts)
```typescript
// 색상
colors.primary     = '#4A90D9'   // 메인 파란색
colors.primaryLight = '#7AB3E8'
colors.primaryDark  = '#2E6DB3'
colors.secondary   = '#5C6BC0'   // 보라색 계열
colors.success     = '#4CAF50'   // 녹색
colors.warning     = '#FF9800'   // 주황색
colors.error       = '#F44336'   // 빨간색
colors.surface     = '#FFFFFF'
colors.surfaceVariant = '#E8E8E8'
colors.textPrimary = '#212121'
colors.textSecondary = '#757575'
colors.textDisabled = '#BDBDBD'
colors.border      = '#E0E0E0'

// 간격
spacing.xs = 4, spacing.sm = 8, spacing.md = 16, spacing.lg = 24, spacing.xl = 32

// 터치 타겟
tabletSizes.minTouchTarget = 44
tabletSizes.buttonHeight = 48
```

### 기존 MathText 컴포넌트 (src/components/common/MathText.tsx)
LaTeX 렌더링 컴포넌트가 이미 구현되어 있다. 웹에서는 KaTeX iframe, 네이티브에서는 WebView 또는 텍스트 폴백으로 동작한다.
```typescript
import MathText from '../../src/components/common/MathText';

// 사용법
<MathText content="$x^2 + 2x + 1 = 0$을 풀어라" fontSize={16} />
```

### 기존 solve.tsx 구조 요약
`app/(student)/solve.tsx`는 문제 풀이 화면으로, 다음 구조로 되어 있다:
- `SafeAreaView` > `header` > `problemNavigation` > `mainContent` > `CanvasToolbar`
- `mainContent`는 가로 모드에서 좌측 `problemSection`(45%)과 우측 `canvasSection`(55%)으로 분할
- `problemSection` 내부에 `problemCard`가 있고, 그 안에 `problemHeader`, `problemScrollView`, `problemFooter`가 있다
- 현재 `problemFooter`에는 단원 태그만 표시
- `useLocalSearchParams`로 `assignmentId`를 받고, Mock 데이터(`mockProblems`)를 사용 중

---

## Type Definitions

이 섹션에서 사용할 타입들. Section 01에서 이미 정의되어 있어야 하지만, 만약 없다면 `src/types/aiHelper.ts`로 새로 생성한다.

### 파일: `src/types/aiHelper.ts` (Section 01에 없는 경우 새로 생성)

```typescript
/**
 * AI Helper 관련 타입 정의
 */

/** 힌트 레벨 (1: 접근법, 2: 핵심 공식, 3: 풀이 첫 단계) */
export type HintLevel = 1 | 2 | 3;

/** 힌트 레벨별 설명 */
export const HINT_LEVEL_LABELS: Record<HintLevel, string> = {
  1: '접근법 힌트',
  2: '핵심 공식 힌트',
  3: '풀이 첫 단계 힌트',
};

/** 단일 힌트 응답 */
export interface HintResponse {
  level: HintLevel;
  content: string;  // LaTeX 포함 가능
}

/** 단계별 풀이의 한 단계 */
export interface SolutionStep {
  step: number;
  title: string;       // 예: "이차방정식 판별"
  content: string;     // 설명 텍스트 (LaTeX 포함 가능)
  formula?: string;    // 핵심 수식 (LaTeX)
}

/** 단계별 풀이 전체 응답 */
export interface StepByStepResponse {
  steps: SolutionStep[];
  finalAnswer: string;  // LaTeX 포함 가능
}

/** 유사 문제 매칭 결과 */
export interface SimilarProblemMatch {
  problemId: string;
  similarity: number;   // 0~1 유사도 점수
  reason: string;       // 유사 이유
}

/** 문제별 힌트 사용 추적 */
export interface HintUsageRecord {
  problemId: string;
  hintsUsed: HintLevel[];      // 사용한 힌트 레벨 목록
  solutionViewed: boolean;      // 단계별 풀이 조회 여부
  similarProblemsViewed: boolean;  // 유사 문제 조회 여부
  lastAccessedAt: string;       // ISO 날짜 문자열
}
```

위 타입이 Section 01에 이미 포함되어 있다면 그것을 import해서 사용한다. 없다면 위 파일을 새로 생성하고 `src/types/index.ts`에서 re-export한다:

```typescript
// src/types/index.ts 에 추가
export * from './aiHelper';
```

---

## Service Layer: geminiHelper.ts

Section 05에서 `src/services/geminiHelper.ts`를 이미 구현했다고 가정한다. 이 섹션에서 호출할 함수 시그니처는 다음과 같다:

```typescript
// src/services/geminiHelper.ts (Section 05에서 구현 완료 상태)

import { HintLevel, HintResponse, StepByStepResponse, SimilarProblemMatch } from '../types/aiHelper';

/**
 * 3단계 힌트 생성
 * @param problem - 문제 객체 (content, topic 등)
 * @param level - 힌트 레벨 (1, 2, 3)
 * @returns HintResponse
 */
export async function generateHint(
  problem: { content: string; topic?: string; answer?: string },
  level: HintLevel
): Promise<HintResponse>;

/**
 * 전체 단계별 풀이 생성
 * @param problem - 문제 객체
 * @returns StepByStepResponse
 */
export async function generateStepByStep(
  problem: { content: string; topic?: string; answer?: string }
): Promise<StepByStepResponse>;

/**
 * 유사 문제 매칭
 * @param problem - 현재 문제
 * @param bankSummary - 문제은행 요약 (ID, content 요약, topic, difficulty)
 * @returns SimilarProblemMatch[]
 */
export async function findSimilarProblems(
  problem: { content: string; topic?: string },
  bankSummary: Array<{ id: string; content: string; topic: string; difficulty: string }>
): Promise<SimilarProblemMatch[]>;
```

만약 Section 05가 아직 구현되지 않았다면, 아래 Mock 폴백을 `geminiHelper.ts`에 임시로 추가하여 UI 개발을 진행할 수 있다:

```typescript
// src/services/geminiHelper.ts (Mock 폴백 버전)

import { GoogleGenAI } from '@google/genai';
import {
  HintLevel,
  HintResponse,
  StepByStepResponse,
  SimilarProblemMatch,
  HINT_LEVEL_LABELS,
} from '../types/aiHelper';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ──────────────────────────────────────────────
// 힌트 생성
// ──────────────────────────────────────────────

const HINT_PROMPT = (problem: { content: string; topic?: string }, level: HintLevel) => `
당신은 친절한 수학 튜터입니다. 학생이 문제를 풀다가 막혀서 힌트를 요청했습니다.

[문제]
${problem.content}

[단원]
${problem.topic || '미지정'}

[힌트 레벨 설명]
- 레벨 1: 접근법 제시 (어떤 개념/방법을 사용해야 하는지만 알려줌)
- 레벨 2: 핵심 공식/정리 제시 (사용해야 할 구체적인 공식이나 정리)
- 레벨 3: 풀이 첫 단계 (첫 번째 식 세우기까지만)

현재 요청된 레벨: ${level} (${HINT_LEVEL_LABELS[level]})

해당 레벨의 힌트만 한국어로 작성하세요. 모든 수식은 LaTeX($...$)로 표기하세요.
반드시 아래 JSON 형식만 출력하세요:
{
  "level": ${level},
  "content": "힌트 내용"
}
`;

export async function generateHint(
  problem: { content: string; topic?: string; answer?: string },
  level: HintLevel
): Promise<HintResponse> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: HINT_PROMPT(problem, level) }] }],
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      level: parsed.level || level,
      content: parsed.content || '힌트를 생성할 수 없습니다.',
    };
  } catch (error) {
    console.error('힌트 생성 오류:', error);
    // 폴백: 기본 힌트 반환
    const fallbackHints: Record<HintLevel, string> = {
      1: '이 문제는 관련 개념을 떠올려보세요. 어떤 유형의 문제인지 먼저 파악하세요.',
      2: '이 유형의 문제에서 자주 사용되는 공식을 떠올려보세요.',
      3: '문제의 조건을 수식으로 나타내는 것부터 시작해보세요.',
    };
    return { level, content: fallbackHints[level] };
  }
}

// ──────────────────────────────────────────────
// 단계별 풀이 생성
// ──────────────────────────────────────────────

const STEP_BY_STEP_PROMPT = (problem: { content: string; topic?: string; answer?: string }) => `
당신은 수학 교육 전문가입니다. 다음 수학 문제의 상세한 단계별 풀이를 작성해주세요.

[문제]
${problem.content}

${problem.answer ? `[정답 참고]\n${problem.answer}` : ''}

[요구사항]
- 각 단계를 명확히 구분
- 모든 수식은 LaTeX($...$)로 표기
- 학생이 이해하기 쉽도록 각 단계에 설명 추가
- 한국어로 작성

반드시 아래 JSON 형식만 출력하세요:
{
  "steps": [
    {
      "step": 1,
      "title": "단계 제목",
      "content": "이 단계의 설명",
      "formula": "핵심 수식 (LaTeX)"
    }
  ],
  "finalAnswer": "최종 답 (LaTeX 포함 가능)"
}
`;

export async function generateStepByStep(
  problem: { content: string; topic?: string; answer?: string }
): Promise<StepByStepResponse> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: STEP_BY_STEP_PROMPT(problem) }] }],
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      steps: (parsed.steps || []).map((s: any, i: number) => ({
        step: s.step || i + 1,
        title: s.title || `단계 ${i + 1}`,
        content: s.content || '',
        formula: s.formula,
      })),
      finalAnswer: parsed.finalAnswer || '풀이를 완성해보세요.',
    };
  } catch (error) {
    console.error('단계별 풀이 생성 오류:', error);
    return {
      steps: [
        {
          step: 1,
          title: '풀이 생성 실패',
          content: 'AI 풀이를 생성할 수 없습니다. 다시 시도해주세요.',
        },
      ],
      finalAnswer: '-',
    };
  }
}

// ──────────────────────────────────────────────
// 유사 문제 매칭
// ──────────────────────────────────────────────

const SIMILAR_PROBLEMS_PROMPT = (
  problem: { content: string; topic?: string },
  bankSummary: Array<{ id: string; content: string; topic: string; difficulty: string }>
) => `
당신은 수학 교육 전문가입니다. 아래 [현재 문제]와 가장 유사한 문제를 [문제은행]에서 최대 5개 찾아주세요.

[현재 문제]
${problem.content}
단원: ${problem.topic || '미지정'}

[문제은행]
${bankSummary.map((p) => `ID: ${p.id} | 단원: ${p.topic} | 난이도: ${p.difficulty} | 내용: ${p.content.substring(0, 100)}`).join('\n')}

[유사도 기준]
- 같은 개념/풀이법을 사용하는 문제
- 비슷한 유형/구조의 문제
- 같은 단원의 문제 우선

반드시 아래 JSON 형식만 출력하세요:
{
  "matches": [
    {
      "problemId": "문제은행 ID",
      "similarity": 0.85,
      "reason": "유사한 이유 설명"
    }
  ]
}
`;

export async function findSimilarProblems(
  problem: { content: string; topic?: string },
  bankSummary: Array<{ id: string; content: string; topic: string; difficulty: string }>
): Promise<SimilarProblemMatch[]> {
  // 문제은행이 비어있으면 빈 배열 반환
  if (!bankSummary || bankSummary.length === 0) return [];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: SIMILAR_PROBLEMS_PROMPT(problem, bankSummary) }] },
      ],
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.matches || []).map((m: any) => ({
      problemId: m.problemId,
      similarity: m.similarity || 0,
      reason: m.reason || '',
    }));
  } catch (error) {
    console.error('유사 문제 매칭 오류:', error);
    return [];
  }
}
```

---

## Implementation

### 1. HintButton.tsx

**파일**: `src/components/aiHelper/HintButton.tsx`

3단계 점진적 힌트를 요청하는 버튼 컴포넌트. 레벨 1 -> 2 -> 3 순서로만 사용할 수 있으며, 이전 레벨의 힌트를 먼저 봐야 다음 레벨이 활성화된다.

```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MathText from '../common/MathText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { generateHint } from '../../services/geminiHelper';
import {
  HintLevel,
  HintResponse,
  HINT_LEVEL_LABELS,
} from '../../types/aiHelper';

// ─── Props ─────────────────────────────────────────────

interface HintButtonProps {
  /** 현재 문제 정보 */
  problem: {
    id: string;
    content: string;
    topic?: string;
    answer?: string;
  };
  /** 힌트 사용 시 콜백 (외부 추적용) */
  onHintUsed?: (problemId: string, level: HintLevel) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

// ─── 상수 ──────────────────────────────────────────────

const MAX_HINT_LEVEL: HintLevel = 3;

const HINT_ICONS: Record<HintLevel, string> = {
  1: 'lightbulb-outline',
  2: 'function-variant',
  3: 'calculator-variant-outline',
};

const HINT_COLORS: Record<HintLevel, string> = {
  1: colors.success,     // 초록 (가벼운 힌트)
  2: colors.warning,     // 주황 (중간 힌트)
  3: colors.error,       // 빨강 (강한 힌트)
};

// ─── Component ─────────────────────────────────────────

export default function HintButton({ problem, onHintUsed, disabled = false }: HintButtonProps) {
  // 현재까지 받은 힌트들
  const [hints, setHints] = useState<HintResponse[]>([]);
  // 현재 요청 가능한 다음 레벨
  const [nextLevel, setNextLevel] = useState<HintLevel>(1);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  // 힌트 패널 펼침 여부
  const [isExpanded, setIsExpanded] = useState(false);
  // 에러 메시지
  const [error, setError] = useState<string | null>(null);

  // 문제가 바뀌면 힌트 초기화 (problemId 기반)
  const [currentProblemId, setCurrentProblemId] = useState(problem.id);
  if (problem.id !== currentProblemId) {
    setHints([]);
    setNextLevel(1);
    setIsExpanded(false);
    setError(null);
    setCurrentProblemId(problem.id);
  }

  const allHintsUsed = nextLevel > MAX_HINT_LEVEL;

  // 힌트 요청 핸들러
  const handleRequestHint = useCallback(async () => {
    if (allHintsUsed || isLoading || disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const hint = await generateHint(problem, nextLevel);
      setHints((prev) => [...prev, hint]);
      onHintUsed?.(problem.id, nextLevel);
      setNextLevel((prev) => (prev + 1) as HintLevel);
      setIsExpanded(true);
    } catch (err) {
      setError('힌트를 불러오지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [problem, nextLevel, allHintsUsed, isLoading, disabled, onHintUsed]);

  // ─── 렌더링 ──────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* 힌트 요청 버튼 */}
      <TouchableOpacity
        style={[
          styles.hintButton,
          allHintsUsed && styles.hintButtonExhausted,
          disabled && styles.hintButtonDisabled,
        ]}
        onPress={hints.length > 0 && !isLoading ? () => setIsExpanded(!isExpanded) : handleRequestHint}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons
            name={allHintsUsed ? 'lightbulb-on' : 'lightbulb-on-outline'}
            size={20}
            color="#FFFFFF"
          />
        )}
        <Text style={styles.hintButtonText}>
          {isLoading
            ? 'AI가 힌트를 생성 중...'
            : allHintsUsed
            ? `힌트 ${hints.length}/${MAX_HINT_LEVEL}`
            : `힌트 받기 (${nextLevel}/${MAX_HINT_LEVEL})`}
        </Text>

        {/* 힌트 사용 카운터 뱃지 */}
        {hints.length > 0 && (
          <View style={styles.hintCountBadge}>
            <Text style={styles.hintCountText}>{hints.length}</Text>
          </View>
        )}

        {/* 펼침 화살표 (힌트가 있을 때) */}
        {hints.length > 0 && !isLoading && (
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#FFFFFF"
          />
        )}
      </TouchableOpacity>

      {/* 에러 메시지 */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRequestHint}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 힌트 목록 패널 */}
      {isExpanded && hints.length > 0 && (
        <View style={styles.hintsPanel}>
          {hints.map((hint, index) => (
            <View
              key={`hint-${hint.level}`}
              style={[
                styles.hintCard,
                { borderLeftColor: HINT_COLORS[hint.level] },
                index < hints.length - 1 && styles.hintCardMargin,
              ]}
            >
              <View style={styles.hintCardHeader}>
                <MaterialCommunityIcons
                  name={HINT_ICONS[hint.level] as any}
                  size={16}
                  color={HINT_COLORS[hint.level]}
                />
                <Text style={[styles.hintLevelLabel, { color: HINT_COLORS[hint.level] }]}>
                  {HINT_LEVEL_LABELS[hint.level]}
                </Text>
              </View>
              <MathText
                content={hint.content}
                fontSize={14}
                color={colors.textPrimary}
              />
            </View>
          ))}

          {/* 다음 힌트 받기 버튼 (아직 남아있을 때) */}
          {!allHintsUsed && (
            <TouchableOpacity
              style={[
                styles.nextHintButton,
                { borderColor: HINT_COLORS[nextLevel] },
              ]}
              onPress={handleRequestHint}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={HINT_COLORS[nextLevel]} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={HINT_ICONS[nextLevel] as any}
                    size={16}
                    color={HINT_COLORS[nextLevel]}
                  />
                  <Text style={[styles.nextHintText, { color: HINT_COLORS[nextLevel] }]}>
                    {HINT_LEVEL_LABELS[nextLevel]} 받기
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    minHeight: 44, // 태블릿 터치 타겟
  },
  hintButtonExhausted: {
    backgroundColor: colors.textSecondary,
  },
  hintButtonDisabled: {
    opacity: 0.5,
  },
  hintButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  hintCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  hintCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  hintsPanel: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hintCard: {
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  hintCardMargin: {
    marginBottom: spacing.md,
  },
  hintCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  hintLevelLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  nextHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    minHeight: 44,
  },
  nextHintText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
```

---

### 2. StepByStepSolution.tsx

**파일**: `src/components/aiHelper/StepByStepSolution.tsx`

아코디언 형태로 단계별 풀이를 보여주는 컴포넌트. "풀이 보기" 버튼을 누르면 AI가 전체 풀이를 생성하고, 각 단계를 하나씩 펼쳐볼 수 있다.

```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MathText from '../common/MathText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { generateStepByStep } from '../../services/geminiHelper';
import { StepByStepResponse, SolutionStep } from '../../types/aiHelper';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Props ─────────────────────────────────────────────

interface StepByStepSolutionProps {
  /** 현재 문제 정보 */
  problem: {
    id: string;
    content: string;
    topic?: string;
    answer?: string;
  };
  /** 풀이 조회 시 콜백 (외부 추적용) */
  onSolutionViewed?: (problemId: string) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

// ─── Component ─────────────────────────────────────────

export default function StepByStepSolution({
  problem,
  onSolutionViewed,
  disabled = false,
}: StepByStepSolutionProps) {
  // 풀이 데이터
  const [solution, setSolution] = useState<StepByStepResponse | null>(null);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  // 펼침 상태
  const [isExpanded, setIsExpanded] = useState(false);
  // 각 단계 펼침 상태
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  // 에러
  const [error, setError] = useState<string | null>(null);

  // 문제 변경 감지
  const [currentProblemId, setCurrentProblemId] = useState(problem.id);
  if (problem.id !== currentProblemId) {
    setSolution(null);
    setIsExpanded(false);
    setExpandedSteps(new Set());
    setError(null);
    setCurrentProblemId(problem.id);
  }

  // 풀이 요청
  const handleRequestSolution = useCallback(async () => {
    if (isLoading || disabled) return;

    // 이미 로드된 풀이가 있으면 토글만
    if (solution) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateStepByStep(problem);
      setSolution(result);
      setIsExpanded(true);
      onSolutionViewed?.(problem.id);
    } catch (err) {
      setError('풀이를 불러오지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [problem, solution, isExpanded, isLoading, disabled, onSolutionViewed]);

  // 단계 토글
  const toggleStep = useCallback((stepNumber: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  }, []);

  // 모든 단계 펼치기/접기
  const toggleAllSteps = useCallback(() => {
    if (!solution) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedSteps.size === solution.steps.length) {
      setExpandedSteps(new Set());
    } else {
      setExpandedSteps(new Set(solution.steps.map((s) => s.step)));
    }
  }, [solution, expandedSteps]);

  // ─── 렌더링 ──────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* 풀이 보기 버튼 */}
      <TouchableOpacity
        style={[
          styles.solutionButton,
          solution && styles.solutionButtonLoaded,
          disabled && styles.solutionButtonDisabled,
        ]}
        onPress={handleRequestSolution}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons
            name={solution ? 'book-open-variant' : 'book-open-page-variant-outline'}
            size={20}
            color="#FFFFFF"
          />
        )}
        <Text style={styles.solutionButtonText}>
          {isLoading
            ? 'AI가 풀이를 생성 중...'
            : solution
            ? isExpanded
              ? '풀이 접기'
              : '풀이 펼치기'
            : '단계별 풀이 보기'}
        </Text>
        {solution && !isLoading && (
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#FFFFFF"
          />
        )}
      </TouchableOpacity>

      {/* 에러 */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRequestSolution}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 풀이 패널 */}
      {isExpanded && solution && (
        <View style={styles.solutionPanel}>
          {/* 헤더: 단계 수 + 전체 펼치기 */}
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>
              풀이 ({solution.steps.length}단계)
            </Text>
            <TouchableOpacity onPress={toggleAllSteps}>
              <Text style={styles.toggleAllText}>
                {expandedSteps.size === solution.steps.length ? '모두 접기' : '모두 펼치기'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 각 단계 아코디언 */}
          {solution.steps.map((step, index) => {
            const isStepExpanded = expandedSteps.has(step.step);
            return (
              <View key={`step-${step.step}`} style={styles.stepContainer}>
                {/* 단계 헤더 (클릭하여 토글) */}
                <TouchableOpacity
                  style={[
                    styles.stepHeader,
                    isStepExpanded && styles.stepHeaderExpanded,
                  ]}
                  onPress={() => toggleStep(step.step)}
                  activeOpacity={0.7}
                >
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>{step.step}</Text>
                  </View>
                  <Text
                    style={[
                      styles.stepTitle,
                      isStepExpanded && styles.stepTitleExpanded,
                    ]}
                    numberOfLines={isStepExpanded ? undefined : 1}
                  >
                    {step.title}
                  </Text>
                  <MaterialCommunityIcons
                    name={isStepExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isStepExpanded ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>

                {/* 단계 내용 (펼쳐진 경우) */}
                {isStepExpanded && (
                  <View style={styles.stepContent}>
                    <MathText
                      content={step.content}
                      fontSize={14}
                      color={colors.textPrimary}
                    />
                    {step.formula && (
                      <View style={styles.formulaBox}>
                        <MathText
                          content={step.formula}
                          fontSize={16}
                          color={colors.primaryDark}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* 단계 간 연결선 (마지막 제외) */}
                {index < solution.steps.length - 1 && (
                  <View style={styles.stepConnector}>
                    <View style={styles.stepConnectorLine} />
                  </View>
                )}
              </View>
            );
          })}

          {/* 최종 답 */}
          <View style={styles.finalAnswerContainer}>
            <View style={styles.finalAnswerHeader}>
              <MaterialCommunityIcons name="check-decagram" size={18} color={colors.success} />
              <Text style={styles.finalAnswerLabel}>최종 답</Text>
            </View>
            <View style={styles.finalAnswerContent}>
              <MathText
                content={solution.finalAnswer}
                fontSize={18}
                color={colors.success}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  solutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    minHeight: 44,
  },
  solutionButtonLoaded: {
    backgroundColor: colors.secondaryDark,
  },
  solutionButtonDisabled: {
    opacity: 0.5,
  },
  solutionButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  solutionPanel: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toggleAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  stepContainer: {
    // each step block
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    minHeight: 44,
  },
  stepHeaderExpanded: {
    backgroundColor: colors.primary + '10',
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepTitleExpanded: {
    color: colors.primaryDark,
  },
  stepContent: {
    marginLeft: 28 + spacing.sm, // stepNumberCircle 폭 + gap
    paddingLeft: spacing.sm,
    paddingVertical: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary + '30',
  },
  formulaBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  stepConnector: {
    marginLeft: 14, // center of stepNumberCircle
    height: 8,
    justifyContent: 'center',
  },
  stepConnectorLine: {
    width: 2,
    height: '100%',
    backgroundColor: colors.border,
  },
  finalAnswerContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.success + '40',
  },
  finalAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  finalAnswerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
  },
  finalAnswerContent: {
    padding: spacing.sm,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
});
```

---

### 3. SimilarProblems.tsx

**파일**: `src/components/aiHelper/SimilarProblems.tsx`

유사 문제 목록을 보여주는 컴포넌트. 문제은행에서 AI가 매칭한 유사 문제를 난이도 뱃지와 함께 리스트로 표시한다.

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MathText from '../common/MathText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { findSimilarProblems } from '../../services/geminiHelper';
import { SimilarProblemMatch } from '../../types/aiHelper';

// ─── Props ─────────────────────────────────────────────

interface SimilarProblemsProps {
  /** 현재 문제 정보 */
  problem: {
    id: string;
    content: string;
    topic?: string;
  };
  /**
   * 문제은행 데이터 (요약).
   * problemBankStore.getState().problems 등에서 가져와 전달.
   * 각 항목은 최소 id, content, topic, difficulty 필요.
   */
  problemBank: Array<{
    id: string;
    content: string;
    topic: string;
    difficulty: string;
  }>;
  /** 유사 문제 클릭 시 콜백 */
  onProblemPress?: (problemId: string) => void;
  /** 유사 문제 조회 시 콜백 (외부 추적용) */
  onSimilarViewed?: (problemId: string) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

// ─── 난이도 뱃지 색상 ──────────────────────────────────

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  '상': { label: '상', color: colors.error, bg: colors.error + '15' },
  '중': { label: '중', color: colors.warning, bg: colors.warning + '15' },
  '하': { label: '하', color: colors.success, bg: colors.success + '15' },
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG['중'];
  return (
    <View style={[diffBadgeStyles.badge, { backgroundColor: config.bg }]}>
      <Text style={[diffBadgeStyles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const diffBadgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});

// ─── Component ─────────────────────────────────────────

export default function SimilarProblems({
  problem,
  problemBank,
  onProblemPress,
  onSimilarViewed,
  disabled = false,
}: SimilarProblemsProps) {
  // 매칭 결과
  const [matches, setMatches] = useState<SimilarProblemMatch[]>([]);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  // 펼침 상태
  const [isExpanded, setIsExpanded] = useState(false);
  // 에러
  const [error, setError] = useState<string | null>(null);
  // 로드 완료 여부
  const [isLoaded, setIsLoaded] = useState(false);

  // 문제 변경 시 초기화
  const [currentProblemId, setCurrentProblemId] = useState(problem.id);
  if (problem.id !== currentProblemId) {
    setMatches([]);
    setIsExpanded(false);
    setError(null);
    setIsLoaded(false);
    setCurrentProblemId(problem.id);
  }

  // 유사 문제 검색 핸들러
  const handleSearch = useCallback(async () => {
    if (isLoading || disabled) return;

    // 이미 로드된 결과가 있으면 토글만
    if (isLoaded) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 현재 문제를 제외한 문제은행 요약을 전달
      const bankSummary = problemBank
        .filter((p) => p.id !== problem.id)
        .slice(0, 50); // Gemini 컨텍스트 제한 고려하여 최대 50개

      const result = await findSimilarProblems(problem, bankSummary);
      setMatches(result);
      setIsLoaded(true);
      setIsExpanded(true);
      onSimilarViewed?.(problem.id);
    } catch (err) {
      setError('유사 문제를 찾지 못했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [problem, problemBank, isLoading, isLoaded, isExpanded, disabled, onSimilarViewed]);

  // 매칭된 문제의 상세 정보 가져오기 (문제은행에서 조회)
  const getMatchedProblemDetail = useCallback(
    (problemId: string) => {
      return problemBank.find((p) => p.id === problemId);
    },
    [problemBank]
  );

  // 유사도 표시 (퍼센트)
  const formatSimilarity = (score: number) => `${Math.round(score * 100)}%`;

  // ─── 렌더링 ──────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* 유사 문제 찾기 버튼 */}
      <TouchableOpacity
        style={[
          styles.searchButton,
          isLoaded && styles.searchButtonLoaded,
          disabled && styles.searchButtonDisabled,
        ]}
        onPress={handleSearch}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons
            name="file-find-outline"
            size={20}
            color="#FFFFFF"
          />
        )}
        <Text style={styles.searchButtonText}>
          {isLoading
            ? 'AI가 유사 문제를 검색 중...'
            : isLoaded
            ? isExpanded
              ? '유사 문제 접기'
              : `유사 문제 (${matches.length}건)`
            : '유사 문제 찾기'}
        </Text>
        {isLoaded && !isLoading && (
          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#FFFFFF"
          />
        )}
      </TouchableOpacity>

      {/* 에러 */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleSearch}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 유사 문제 목록 */}
      {isExpanded && isLoaded && (
        <View style={styles.resultsPanel}>
          {matches.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="file-question-outline"
                size={32}
                color={colors.textDisabled}
              />
              <Text style={styles.emptyText}>유사한 문제를 찾지 못했습니다.</Text>
            </View>
          ) : (
            matches.map((match, index) => {
              const detail = getMatchedProblemDetail(match.problemId);
              if (!detail) return null;

              return (
                <TouchableOpacity
                  key={`similar-${match.problemId}`}
                  style={[
                    styles.problemCard,
                    index < matches.length - 1 && styles.problemCardMargin,
                  ]}
                  onPress={() => onProblemPress?.(match.problemId)}
                  activeOpacity={0.7}
                >
                  {/* 카드 헤더: 유사도 + 난이도 */}
                  <View style={styles.cardHeader}>
                    <View style={styles.similarityBadge}>
                      <MaterialCommunityIcons
                        name="approximately-equal"
                        size={12}
                        color={colors.primary}
                      />
                      <Text style={styles.similarityText}>
                        유사도 {formatSimilarity(match.similarity)}
                      </Text>
                    </View>
                    <DifficultyBadge difficulty={detail.difficulty} />
                  </View>

                  {/* 문제 내용 미리보기 */}
                  <View style={styles.cardContent}>
                    <MathText
                      content={detail.content.length > 120
                        ? detail.content.substring(0, 120) + '...'
                        : detail.content}
                      fontSize={13}
                      color={colors.textPrimary}
                    />
                  </View>

                  {/* 유사 이유 */}
                  <View style={styles.cardReason}>
                    <MaterialCommunityIcons
                      name="information-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.reasonText} numberOfLines={2}>
                      {match.reason}
                    </Text>
                  </View>

                  {/* 단원 태그 */}
                  <View style={styles.cardFooter}>
                    <View style={styles.topicTag}>
                      <MaterialCommunityIcons name="tag-outline" size={12} color={colors.primary} />
                      <Text style={styles.topicText}>{detail.topic}</Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={18}
                      color={colors.textDisabled}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    minHeight: 44,
  },
  searchButtonLoaded: {
    backgroundColor: colors.primary,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  resultsPanel: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  problemCard: {
    backgroundColor: colors.surfaceVariant + '60',
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  problemCardMargin: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  similarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  similarityText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  cardContent: {
    marginVertical: spacing.xs,
  },
  cardReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  topicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topicText: {
    fontSize: 12,
    color: colors.primary,
  },
});
```

---

### 4. Barrel Export

**파일**: `src/components/aiHelper/index.ts`

```typescript
export { default as HintButton } from './HintButton';
export { default as StepByStepSolution } from './StepByStepSolution';
export { default as SimilarProblems } from './SimilarProblems';
```

---

### 5. Hint Usage Tracking (힌트 사용 추적)

힌트/풀이/유사 문제 사용 이력을 추적하기 위한 간단한 커스텀 훅. 이 데이터는 학습 분석에 활용될 수 있다.

**파일**: `src/components/aiHelper/useAIHelperTracking.ts`

```typescript
import { useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HintLevel, HintUsageRecord } from '../../types/aiHelper';

const STORAGE_KEY = 'ai_helper_usage';

/**
 * AI Helper 사용 추적 훅
 *
 * 문제별로 힌트/풀이/유사 문제 사용 기록을 AsyncStorage에 저장한다.
 * solve.tsx에서 이 훅을 사용하여 각 AI Helper 컴포넌트의 콜백에 연결한다.
 */
export function useAIHelperTracking() {
  // 메모리 캐시 (매번 AsyncStorage 읽기 방지)
  const cacheRef = useRef<Map<string, HintUsageRecord>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기 로드
  const initialize = useCallback(async () => {
    if (isInitialized) return;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const records: HintUsageRecord[] = JSON.parse(stored);
        records.forEach((r) => cacheRef.current.set(r.problemId, r));
      }
      setIsInitialized(true);
    } catch (err) {
      console.warn('AI Helper 사용 기록 로드 실패:', err);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // 저장
  const persist = useCallback(async () => {
    try {
      const records = Array.from(cacheRef.current.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
      console.warn('AI Helper 사용 기록 저장 실패:', err);
    }
  }, []);

  // 특정 문제의 사용 기록 가져오기 (없으면 새로 생성)
  const getOrCreate = useCallback((problemId: string): HintUsageRecord => {
    const existing = cacheRef.current.get(problemId);
    if (existing) return existing;

    const newRecord: HintUsageRecord = {
      problemId,
      hintsUsed: [],
      solutionViewed: false,
      similarProblemsViewed: false,
      lastAccessedAt: new Date().toISOString(),
    };
    cacheRef.current.set(problemId, newRecord);
    return newRecord;
  }, []);

  // 힌트 사용 기록
  const recordHintUsage = useCallback(
    (problemId: string, level: HintLevel) => {
      const record = getOrCreate(problemId);
      if (!record.hintsUsed.includes(level)) {
        record.hintsUsed.push(level);
      }
      record.lastAccessedAt = new Date().toISOString();
      cacheRef.current.set(problemId, record);
      persist();
    },
    [getOrCreate, persist]
  );

  // 풀이 조회 기록
  const recordSolutionViewed = useCallback(
    (problemId: string) => {
      const record = getOrCreate(problemId);
      record.solutionViewed = true;
      record.lastAccessedAt = new Date().toISOString();
      cacheRef.current.set(problemId, record);
      persist();
    },
    [getOrCreate, persist]
  );

  // 유사 문제 조회 기록
  const recordSimilarViewed = useCallback(
    (problemId: string) => {
      const record = getOrCreate(problemId);
      record.similarProblemsViewed = true;
      record.lastAccessedAt = new Date().toISOString();
      cacheRef.current.set(problemId, record);
      persist();
    },
    [getOrCreate, persist]
  );

  // 특정 문제의 힌트 사용 수
  const getHintCount = useCallback(
    (problemId: string): number => {
      return cacheRef.current.get(problemId)?.hintsUsed.length ?? 0;
    },
    []
  );

  // 전체 통계 (분석 화면에서 사용 가능)
  const getStats = useCallback(() => {
    const records = Array.from(cacheRef.current.values());
    return {
      totalProblems: records.length,
      totalHintsUsed: records.reduce((sum, r) => sum + r.hintsUsed.length, 0),
      solutionsViewed: records.filter((r) => r.solutionViewed).length,
      similarSearched: records.filter((r) => r.similarProblemsViewed).length,
    };
  }, []);

  return {
    initialize,
    recordHintUsage,
    recordSolutionViewed,
    recordSimilarViewed,
    getHintCount,
    getStats,
  };
}
```

---

### 6. Integration into solve.tsx

**파일**: `app/(student)/solve.tsx` (수정)

기존 solve.tsx에 AI Helper 컴포넌트 3개를 통합한다. 변경 포인트는 최소화하며, 기존 레이아웃을 최대한 유지한다.

#### 변경 요약

| 위치 | 변경 내용 |
|------|----------|
| import 영역 | AI Helper 컴포넌트 3개 + useAIHelperTracking 훅 import |
| 컴포넌트 내부 | useAIHelperTracking() 훅 호출, useEffect에서 initialize() |
| 문제은행 데이터 | problemBankStore에서 문제 목록 가져오기 (유사 문제용) |
| problemFooter 아래 | HintButton + StepByStepSolution + SimilarProblems 배치 |
| 새로운 styles | AI Helper 관련 스타일 추가 |

#### 전체 수정된 파일

```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawingCanvas, useCanvasControls, CanvasToolbar } from '../../src/components/canvas';
import { colors, spacing } from '../../src/constants/theme';
import { CanvasTool, CanvasBackground } from '../../src/types';

// ★ 신규 import: AI Helper
import { HintButton, StepByStepSolution, SimilarProblems } from '../../src/components/aiHelper';
import { useAIHelperTracking } from '../../src/components/aiHelper/useAIHelperTracking';

// ★ 문제은행 스토어 (Section 03에서 구현)
// 아직 미구현 시 빈 배열로 폴백
let useProblemBankStore: any;
try {
  useProblemBankStore = require('../../src/stores/problemBankStore').useProblemBankStore;
} catch {
  useProblemBankStore = null;
}

// Mock 문제 데이터 (기존과 동일 - 향후 실제 스토어 데이터로 교체)
const mockProblems = [
  {
    id: '1',
    content: '다음 이차방정식을 풀어라.\n\nx² - 5x + 6 = 0',
    imageUrl: null,
    points: 10,
    subject: '이차방정식',
    answer: 'x = 2 또는 x = 3',
  },
  {
    id: '2',
    content: '다음 이차방정식의 근을 구하시오.\n\n2x² + 3x - 2 = 0',
    imageUrl: null,
    points: 10,
    subject: '이차방정식',
    answer: 'x = 1/2 또는 x = -2',
  },
  {
    id: '3',
    content: '이차방정식 x² - 4x + k = 0이 중근을 가질 때, 상수 k의 값을 구하시오.',
    imageUrl: null,
    points: 15,
    subject: '이차방정식',
    answer: 'k = 4',
  },
];

// 문제 번호 버튼 컴포넌트 (기존과 동일)
interface ProblemNumberButtonProps {
  number: number;
  isActive: boolean;
  isCompleted: boolean;
  onPress: () => void;
}

const ProblemNumberButton: React.FC<ProblemNumberButtonProps> = ({
  number,
  isActive,
  isCompleted,
  onPress,
}) => (
  <TouchableOpacity
    style={[
      styles.problemNumberButton,
      isActive && styles.problemNumberButtonActive,
      isCompleted && !isActive && styles.problemNumberButtonCompleted,
    ]}
    onPress={onPress}
  >
    {isCompleted && !isActive ? (
      <MaterialCommunityIcons name="check" size={16} color={colors.success} />
    ) : (
      <Text
        style={[
          styles.problemNumberText,
          isActive && styles.problemNumberTextActive,
        ]}
      >
        {number}
      </Text>
    )}
  </TouchableOpacity>
);

export default function SolveScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [completedProblems, setCompletedProblems] = useState<Set<number>>(new Set());
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // 가로 모드 판단 (태블릿 가로 모드)
  const isLandscape = screenWidth > screenHeight && screenWidth > 768;

  // 캔버스 상태
  const [tool, setTool] = useState<CanvasTool>('pen');
  const [strokeColor, setStrokeColor] = useState(colors.canvasBlack);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [background, setBackground] = useState<CanvasBackground>('blank');

  const canvasControls = useCanvasControls();

  // ★ AI Helper 추적 훅
  const aiTracking = useAIHelperTracking();

  useEffect(() => {
    aiTracking.initialize();
  }, []);

  // ★ 문제은행 데이터 (유사 문제 검색용)
  const problemBankData = useProblemBankStore
    ? useProblemBankStore((state: any) => state.problems) || []
    : [];

  // 유사 문제용 문제은행 요약 (SimilarProblems 컴포넌트에 전달)
  const problemBankSummary = (problemBankData as any[]).map((p: any) => ({
    id: p.id,
    content: p.content || p.contentHtml || '',
    topic: p.topic || '',
    difficulty: p.difficulty || '중',
  }));

  // 캔버스 크기 계산
  const canvasWidth = isLandscape
    ? (screenWidth - spacing.lg * 3) * 0.55  // 풀이 영역 55%
    : screenWidth - spacing.lg * 2;
  const canvasHeight = isLandscape
    ? screenHeight - 180
    : 400;

  const currentProblem = mockProblems[currentProblemIndex];
  const progress = (currentProblemIndex + 1) / mockProblems.length;

  const handlePrevious = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1);
      canvasControls.clear();
    }
  };

  const handleNext = () => {
    if (currentProblemIndex < mockProblems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
      canvasControls.clear();
    }
  };

  const handleSave = () => {
    setCompletedProblems(prev => new Set(prev).add(currentProblemIndex));
    // TODO: 풀이 이미지 저장
  };

  const handleSubmitAll = () => {
    // TODO: 전체 숙제 제출
    alert('모든 풀이가 제출되었습니다!');
    router.back();
  };

  const goToProblem = (index: number) => {
    setCurrentProblemIndex(index);
    canvasControls.clear();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 (기존과 동일) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignmentTitle}>이차방정식 연습</Text>
            <View style={styles.assignmentMeta}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.assignmentMetaText}>오늘 마감</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {completedProblems.size}/{mockProblems.length} 완료
            </Text>
            <ProgressBar
              progress={completedProblems.size / mockProblems.length}
              color={colors.success}
              style={styles.headerProgress}
            />
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitAll}>
            <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>제출</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 문제 번호 네비게이션 (기존과 동일) */}
      <View style={styles.problemNavigation}>
        <View style={styles.problemNumbers}>
          {mockProblems.map((_, index) => (
            <ProblemNumberButton
              key={index}
              number={index + 1}
              isActive={currentProblemIndex === index}
              isCompleted={completedProblems.has(index)}
              onPress={() => goToProblem(index)}
            />
          ))}
        </View>
        <View style={styles.navArrows}>
          <TouchableOpacity
            style={[styles.navArrowButton, currentProblemIndex === 0 && styles.navArrowButtonDisabled]}
            onPress={handlePrevious}
            disabled={currentProblemIndex === 0}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={currentProblemIndex === 0 ? colors.textDisabled : colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navArrowButton, currentProblemIndex === mockProblems.length - 1 && styles.navArrowButtonDisabled]}
            onPress={handleNext}
            disabled={currentProblemIndex === mockProblems.length - 1}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={currentProblemIndex === mockProblems.length - 1 ? colors.textDisabled : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 메인 컨텐츠 */}
      <View style={[styles.mainContent, isLandscape && styles.mainContentLandscape]}>
        {/* 문제 영역 */}
        <View style={[styles.problemSection, isLandscape && styles.problemSectionLandscape]}>
          <View style={styles.problemCard}>
            <View style={styles.problemHeader}>
              <View style={styles.problemBadge}>
                <Text style={styles.problemBadgeText}>문제 {currentProblemIndex + 1}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
                <Text style={styles.pointsText}>{currentProblem.points}점</Text>
              </View>
            </View>

            <ScrollView
              style={styles.problemScrollView}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.problemText}>{currentProblem.content}</Text>
              {currentProblem.imageUrl && (
                <Image
                  source={{ uri: currentProblem.imageUrl }}
                  style={styles.problemImage}
                  resizeMode="contain"
                />
              )}

              {/* ★ AI Helper 영역: problemFooter 바로 아래에 배치 */}
              <View style={styles.problemFooter}>
                <View style={styles.subjectTag}>
                  <MaterialCommunityIcons name="tag" size={14} color={colors.primary} />
                  <Text style={styles.subjectTagText}>{currentProblem.subject}</Text>
                </View>
              </View>

              {/* ★ AI Helper 컴포넌트들 */}
              <View style={styles.aiHelperSection}>
                <View style={styles.aiHelperDivider}>
                  <View style={styles.aiHelperDividerLine} />
                  <View style={styles.aiHelperDividerLabel}>
                    <MaterialCommunityIcons name="robot-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.aiHelperDividerText}>AI 도우미</Text>
                  </View>
                  <View style={styles.aiHelperDividerLine} />
                </View>

                {/* 힌트 버튼 */}
                <HintButton
                  problem={{
                    id: currentProblem.id,
                    content: currentProblem.content,
                    topic: currentProblem.subject,
                    answer: currentProblem.answer,
                  }}
                  onHintUsed={aiTracking.recordHintUsage}
                />

                {/* 단계별 풀이 */}
                <StepByStepSolution
                  problem={{
                    id: currentProblem.id,
                    content: currentProblem.content,
                    topic: currentProblem.subject,
                    answer: currentProblem.answer,
                  }}
                  onSolutionViewed={aiTracking.recordSolutionViewed}
                />

                {/* 유사 문제 */}
                <SimilarProblems
                  problem={{
                    id: currentProblem.id,
                    content: currentProblem.content,
                    topic: currentProblem.subject,
                  }}
                  problemBank={problemBankSummary}
                  onSimilarViewed={aiTracking.recordSimilarViewed}
                  onProblemPress={(problemId) => {
                    // TODO: 유사 문제 상세 보기 모달 또는 네비게이션
                    console.log('유사 문제 클릭:', problemId);
                  }}
                />
              </View>
            </ScrollView>
          </View>
        </View>

        {/* 풀이 영역 (기존과 동일) */}
        <View style={[styles.canvasSection, isLandscape && styles.canvasSectionLandscape]}>
          <View style={styles.canvasCard}>
            <View style={styles.canvasHeader}>
              <View style={styles.canvasTitleRow}>
                <MaterialCommunityIcons name="draw" size={18} color={colors.primary} />
                <Text style={styles.canvasLabel}>풀이 작성</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  completedProblems.has(currentProblemIndex) && styles.saveButtonCompleted
                ]}
                onPress={handleSave}
              >
                <MaterialCommunityIcons
                  name={completedProblems.has(currentProblemIndex) ? "check" : "content-save"}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.saveButtonText}>
                  {completedProblems.has(currentProblemIndex) ? '저장됨' : '저장'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.canvasWrapper}>
              <DrawingCanvas
                width={canvasWidth}
                height={canvasHeight}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                tool={tool}
                background={background}
                strokes={canvasControls.strokes}
                onStrokeEnd={canvasControls.addStroke}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 툴바 (기존과 동일) */}
      <CanvasToolbar
        selectedTool={tool}
        onToolChange={setTool}
        selectedColor={strokeColor}
        onColorChange={setStrokeColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        background={background}
        onBackgroundChange={setBackground}
        onUndo={canvasControls.undo}
        onRedo={canvasControls.redo}
        onClear={canvasControls.clear}
        canUndo={canvasControls.canUndo}
        canRedo={canvasControls.canRedo}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  // ────────────────────────────────────────────────────────
  // 헤더 (기존 스타일 그대로)
  // ────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: spacing.md,
  },
  assignmentInfo: {
    gap: 2,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  assignmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignmentMetaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressInfo: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  headerProgress: {
    width: 80,
    height: 4,
    borderRadius: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ────────────────────────────────────────────────────────
  // 문제 번호 네비게이션 (기존 스타일 그대로)
  // ────────────────────────────────────────────────────────
  problemNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  problemNumbers: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  problemNumberButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  problemNumberButtonActive: {
    backgroundColor: colors.primary,
  },
  problemNumberButtonCompleted: {
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
  },
  problemNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  problemNumberTextActive: {
    color: '#FFFFFF',
  },
  navArrows: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  navArrowButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowButtonDisabled: {
    opacity: 0.5,
  },

  // ────────────────────────────────────────────────────────
  // 메인 컨텐츠 (기존 스타일 그대로)
  // ────────────────────────────────────────────────────────
  mainContent: {
    flex: 1,
    padding: spacing.md,
  },
  mainContentLandscape: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // 문제 영역
  problemSection: {
    marginBottom: spacing.md,
  },
  problemSectionLandscape: {
    flex: 0.45,
    marginBottom: 0,
  },
  problemCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    height: '100%',
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  problemBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  problemBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.warning,
  },
  problemScrollView: {
    flex: 1,
  },
  problemText: {
    fontSize: 18,
    lineHeight: 30,
    color: colors.textPrimary,
  },
  problemImage: {
    width: '100%',
    height: 200,
    marginTop: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceVariant,
  },
  problemFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subjectTagText: {
    fontSize: 13,
    color: colors.primary,
  },

  // ────────────────────────────────────────────────────────
  // ★ AI Helper 영역 (신규)
  // ────────────────────────────────────────────────────────
  aiHelperSection: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  aiHelperDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  aiHelperDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  aiHelperDividerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  aiHelperDividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // ────────────────────────────────────────────────────────
  // 풀이 영역 (기존 스타일 그대로)
  // ────────────────────────────────────────────────────────
  canvasSection: {
    flex: 1,
  },
  canvasSectionLandscape: {
    flex: 0.55,
  },
  canvasCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    height: '100%',
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  canvasTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  canvasLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonCompleted: {
    backgroundColor: colors.success,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  canvasWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
```

#### 변경 포인트 diff 요약 (기존 solve.tsx 대비)

1. **import 추가** (파일 상단):
   - `HintButton, StepByStepSolution, SimilarProblems` from `../../src/components/aiHelper`
   - `useAIHelperTracking` from `../../src/components/aiHelper/useAIHelperTracking`
   - `useProblemBankStore` from `../../src/stores/problemBankStore` (try/catch로 안전하게)

2. **mockProblems에 answer 필드 추가**: 각 Mock 문제에 `answer` 프로퍼티를 추가하여 AI가 참고할 수 있게 함

3. **컴포넌트 내부에 추가된 로직**:
   - `useAIHelperTracking()` 훅 호출 및 `useEffect`에서 `initialize()`
   - `problemBankData` / `problemBankSummary` 변수 (유사 문제 검색용)

4. **JSX 변경** (`problemScrollView` 내부):
   - 기존의 `problemFooter`를 `ScrollView` 안으로 이동 (AI Helper와 함께 스크롤되도록)
   - `problemFooter` 아래에 `aiHelperSection` View 추가
   - `aiHelperSection` 안에 구분선 + `HintButton` + `StepByStepSolution` + `SimilarProblems` 배치

5. **신규 styles 추가**: `aiHelperSection`, `aiHelperDivider`, `aiHelperDividerLine`, `aiHelperDividerLabel`, `aiHelperDividerText`

---

## Files to Create

| # | 파일 경로 | 설명 |
|---|----------|------|
| 1 | `src/types/aiHelper.ts` | AI Helper 타입 정의 (Section 01에 없는 경우) |
| 2 | `src/services/geminiHelper.ts` | Gemini AI 힌트/풀이/유사 문제 서비스 (Section 05에 없는 경우) |
| 3 | `src/components/aiHelper/HintButton.tsx` | 3단계 점진적 힌트 버튼 컴포넌트 |
| 4 | `src/components/aiHelper/StepByStepSolution.tsx` | 아코디언 단계별 풀이 컴포넌트 |
| 5 | `src/components/aiHelper/SimilarProblems.tsx` | 유사 문제 추천 목록 컴포넌트 |
| 6 | `src/components/aiHelper/index.ts` | Barrel export |
| 7 | `src/components/aiHelper/useAIHelperTracking.ts` | 힌트 사용 추적 훅 |

## Files to Modify

| # | 파일 경로 | 변경 내용 |
|---|----------|----------|
| 1 | `app/(student)/solve.tsx` | AI Helper 컴포넌트 3개 통합, 추적 훅 연결, mockProblems에 answer 추가 |
| 2 | `src/types/index.ts` | `export * from './aiHelper'` 추가 (타입 파일 생성 시) |

---

## Loading States Summary

모든 AI 호출에는 명확한 로딩/에러 UI가 적용된다:

| 컴포넌트 | 로딩 상태 텍스트 | 에러 시 | 타임아웃 |
|---------|----------------|--------|---------|
| HintButton | "AI가 힌트를 생성 중..." | "힌트를 불러오지 못했습니다" + 다시 시도 링크 | Gemini 기본값 사용 |
| StepByStepSolution | "AI가 풀이를 생성 중..." | "풀이를 불러오지 못했습니다" + 다시 시도 링크 | Gemini 기본값 사용 |
| SimilarProblems | "AI가 유사 문제를 검색 중..." | "유사 문제를 찾지 못했습니다" + 다시 시도 링크 | Gemini 기본값 사용 |

로딩 중에는 `ActivityIndicator`가 버튼 내부에 표시되고, 버튼은 `disabled` 상태가 된다.
에러 발생 시 에러 메시지와 "다시 시도" 링크가 버튼 아래에 표시된다.
Gemini API 타임아웃은 서비스 레이어(geminiHelper.ts)에서 15초로 설정하는 것을 권장하며, 실패 시 폴백 기본값을 반환한다.

---

## Hint Usage Tracking Per Problem

| 추적 항목 | 저장 위치 | 데이터 구조 |
|----------|----------|------------|
| 힌트 레벨별 사용 | AsyncStorage(`ai_helper_usage`) | `hintsUsed: HintLevel[]` |
| 풀이 조회 여부 | AsyncStorage(`ai_helper_usage`) | `solutionViewed: boolean` |
| 유사 문제 조회 여부 | AsyncStorage(`ai_helper_usage`) | `similarProblemsViewed: boolean` |
| 마지막 접근 시각 | AsyncStorage(`ai_helper_usage`) | `lastAccessedAt: string` |

추적 데이터는 `useAIHelperTracking` 훅을 통해 관리되며, 각 컴포넌트의 콜백 props(`onHintUsed`, `onSolutionViewed`, `onSimilarViewed`)를 통해 기록된다. `getStats()` 메서드로 전체 통계를 조회할 수 있어, 향후 학습 분석(Section 06)에 활용 가능하다.

---

## Acceptance Criteria

### HintButton 컴포넌트
- [ ] 힌트 버튼을 눌러 레벨 1 힌트(접근법)가 표시된다
- [ ] 레벨 1 힌트를 본 후 레벨 2 힌트(핵심 공식)를 요청할 수 있다
- [ ] 레벨 2 힌트를 본 후 레벨 3 힌트(풀이 첫 단계)를 요청할 수 있다
- [ ] 레벨 1을 건너뛰고 레벨 2를 바로 요청할 수 없다 (순차적)
- [ ] 모든 힌트(3개)를 사용하면 버튼이 "힌트 3/3" 상태로 변경된다
- [ ] 힌트 내용에 LaTeX 수식이 포함된 경우 MathText로 정상 렌더링된다
- [ ] 힌트 카운터 뱃지가 사용한 힌트 수를 표시한다
- [ ] 로딩 중 "AI가 힌트를 생성 중..." 텍스트와 ActivityIndicator가 표시된다
- [ ] AI 호출 실패 시 에러 메시지와 "다시 시도" 링크가 나타난다
- [ ] 문제를 전환하면 힌트 상태가 초기화된다

### StepByStepSolution 컴포넌트
- [ ] "단계별 풀이 보기" 버튼을 눌러 AI 풀이를 요청할 수 있다
- [ ] 풀이가 로드되면 각 단계가 아코디언 형태로 표시된다 (기본 접힌 상태)
- [ ] 각 단계의 헤더를 클릭하면 해당 단계가 펼쳐진다/접힌다
- [ ] "모두 펼치기/모두 접기" 토글이 동작한다
- [ ] 각 단계에 단계 번호 원형 뱃지, 제목, 설명, 핵심 수식이 표시된다
- [ ] 핵심 수식은 별도 박스(formulaBox)에 강조 표시된다
- [ ] 최종 답이 하단에 녹색 강조로 표시된다
- [ ] 로딩 중 "AI가 풀이를 생성 중..." 메시지가 표시된다
- [ ] 이미 로드된 풀이는 캐시되어 재요청 없이 토글만 된다
- [ ] 문제를 전환하면 풀이 상태가 초기화된다

### SimilarProblems 컴포넌트
- [ ] "유사 문제 찾기" 버튼을 눌러 검색을 시작할 수 있다
- [ ] 각 유사 문제에 유사도 퍼센트 뱃지가 표시된다
- [ ] 각 유사 문제에 난이도 뱃지(상: 빨강, 중: 주황, 하: 녹색)가 표시된다
- [ ] 유사 이유가 카드 하단에 표시된다
- [ ] 문제 내용은 최대 120자로 잘려서 미리보기로 표시된다
- [ ] 문제은행이 비어있으면 빈 배열을 반환하고 "유사한 문제를 찾지 못했습니다" 표시
- [ ] 유사 문제 카드를 클릭하면 `onProblemPress` 콜백이 호출된다
- [ ] 로딩 중 "AI가 유사 문제를 검색 중..." 메시지가 표시된다

### solve.tsx 통합
- [ ] 문제 영역 하단(단원 태그 아래)에 "AI 도우미" 구분선이 표시된다
- [ ] 구분선 아래에 힌트 버튼, 풀이 보기 버튼, 유사 문제 버튼이 순서대로 표시된다
- [ ] AI Helper 영역이 문제와 함께 스크롤된다 (ScrollView 내부)
- [ ] 문제를 전환하면(이전/다음/번호 클릭) 모든 AI Helper 상태가 초기화된다
- [ ] 가로 모드와 세로 모드 모두에서 AI Helper 영역이 정상 표시된다
- [ ] 기존 캔버스 영역과 툴바는 변경 없이 동작한다

### 힌트 사용 추적
- [ ] 힌트를 사용하면 AsyncStorage에 기록이 저장된다
- [ ] 풀이를 조회하면 AsyncStorage에 기록이 저장된다
- [ ] 유사 문제를 조회하면 AsyncStorage에 기록이 저장된다
- [ ] 앱을 재시작해도 기록이 유지된다
- [ ] `getStats()`로 전체 통계(총 문제 수, 총 힌트 수, 풀이 조회 수, 유사 검색 수)를 조회할 수 있다
