import { GoogleGenAI } from '@google/genai';
import { Platform } from 'react-native';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface ExtractedProblem {
  id: string;
  content: string;
  difficulty: '상' | '중' | '하';
  topic: string;
  type: '객관식' | '서술형' | '단답형';
  choices?: string[];  // 객관식 보기
  answer?: string;
  hasImage?: boolean;
}

export interface ExtractionResult {
  success: boolean;
  problems: ExtractedProblem[];
  error?: string;
}

const EXTRACTION_PROMPT = `
당신은 수학 문제 추출 및 LaTeX 변환 전문가입니다.
주어진 이미지/PDF에서 수학 문제들을 추출하고, 모든 수식을 LaTeX 형식으로 정확하게 변환해주세요.

## 문제 유형 구분 (중요!)
- 객관식: ①②③④⑤ 또는 (1)(2)(3)(4)(5) 등 선택지가 있는 문제
- 서술형: 풀이 과정을 서술해야 하는 문제 (증명, 설명 등)
- 단답형: 정답만 쓰는 문제 (값 구하기, 계산 등)

## 수식 변환 규칙 (반드시 준수):

### 기본 수식
- 제곱: x² → $x^2$, x³ → $x^3$
- 분수: 2/3 → $\\frac{2}{3}$
- 제곱근: √x → $\\sqrt{x}$, ³√x → $\\sqrt[3]{x}$
- 절댓값: |x| → $|x|$
- 괄호: 큰 괄호는 $\\left( \\right)$ 사용

### 지수와 로그
- 지수: e^x → $e^x$, 2^{n+1} → $2^{n+1}$
- 로그: log₂x → $\\log_2 x$, ln x → $\\ln x$, log x → $\\log x$

### 삼각함수
- sin, cos, tan, csc, sec, cot → $\\sin$, $\\cos$, $\\tan$ 등

### 미적분
- 미분: dy/dx → $\\frac{dy}{dx}$, f'(x) → $f'(x)$
- 적분: ∫ → $\\int$, 정적분: ∫₀¹ → $\\int_0^1$
- 극한: lim(x→∞) → $\\lim_{x \\to \\infty}$

### 기타 기호
- 무한대: ∞ → $\\infty$
- 부등호: ≤ → $\\leq$, ≥ → $\\geq$, ≠ → $\\neq$

## 출력 형식

각 문제에 대해 다음 JSON 형식으로 반환:
- content: 문제 본문 (조건, 질문 등을 줄바꿈으로 구분. 줄바꿈은 \\n 사용)
- type: "객관식" | "서술형" | "단답형"
- choices: 객관식인 경우 보기 배열 ["①...", "②...", ...], 아니면 null
- difficulty: "상" | "중" | "하"
- topic: 단원명
- answer: 정답 (LaTeX 형식, 객관식은 "③" 형태)
- hasImage: 문제에 그림/그래프 포함 여부

## 예시 1: 객관식 문제

{
  "problems": [
    {
      "content": "다음 이차방정식 중 공통인 해를 갖지 않는 것은?",
      "type": "객관식",
      "choices": [
        "$\\frac{1}{6}x^2 - \\frac{2}{3}x + \\frac{1}{2} = 0$",
        "$0.3x^2 - x + 0.7 = 0$",
        "$(x-1)^2 = 2x^2 - 2$",
        "$2x^2 + x - 3 = 0$",
        "$(2x+1)(2x-1) = 3x^2 - 8x - 8$"
      ],
      "difficulty": "중",
      "topic": "이차방정식",
      "answer": "⑤",
      "hasImage": false
    }
  ]
}

## 예시 2: 서술형/단답형 문제

{
  "problems": [
    {
      "content": "다음 조건을 모두 만족시키는 $a$, $b$에 대하여 $a^2 + b^2 + 6a - 2b$의 값을 구하시오.\\n(가) $a$는 이차방정식 $x^2 + 6x - 2 = 0$의 한 근이다.\\n(나) $b$는 이차방정식 $x^2 - 2x - 5 = 0$의 한 근이다.",
      "type": "단답형",
      "choices": null,
      "difficulty": "중",
      "topic": "이차방정식",
      "answer": "$7$",
      "hasImage": false
    }
  ]
}

## 주의사항
1. 문제 번호(1., 2., (1), (가) 등)는 제외하고 문제 내용만 추출
2. 객관식 보기는 choices 배열에 각각 분리하여 저장
3. 문제 내 조건이나 여러 문장은 \\n으로 줄바꿈 구분
4. 수식이 아닌 일반 텍스트는 그대로 유지
5. 인라인 수식은 $...$, 별도 줄 수식은 $$...$$
6. 반드시 유효한 JSON만 출력 (다른 텍스트 없이)
`;

// 파일을 base64로 읽기 (플랫폼별 처리)
async function readFileAsBase64(fileUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    // 웹: fetch로 blob을 가져와서 base64로 변환
    const response = await fetch(fileUri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // data:image/jpeg;base64, 부분 제거
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    // 네이티브: expo-file-system 사용
    const FileSystem = require('expo-file-system/legacy');
    return await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });
  }
}

export async function extractProblemsFromFile(fileUri: string, mimeType: string): Promise<ExtractionResult> {
  try {
    // 파일을 base64로 읽기
    const base64Data = await readFileAsBase64(fileUri);

    // Gemini 2.5 Flash로 문제 추출
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: EXTRACTION_PROMPT },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });

    const text = response.text || '';

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON 응답을 파싱할 수 없습니다');
    }

    // LaTeX 백슬래시 이스케이프 수정
    let jsonString = jsonMatch[0];

    // JSON 파싱 시도, 실패하면 백슬래시 수정 후 재시도
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      // 모든 문자열 값 내의 백슬래시를 이중으로 변환
      // LaTeX 명령어(\frac, \sqrt 등)의 백슬래시 처리
      jsonString = jsonString.replace(
        /:\s*"((?:[^"\\]|\\.)*)"/g,
        (_match, value) => {
          const fixed = value.replace(/\\(?!\\|n|r|t|"|')/g, '\\\\');
          return `: "${fixed}"`;
        }
      );
      parsed = JSON.parse(jsonString);
    }

    // LaTeX 문자열 정규화 함수
    const normalizeLatex = (str: string): string => {
      if (!str) return str;
      // 잘못 인코딩된 특수문자 복원 (♀ → \)
      // 유니코드 깨짐 복구
      return str
        .replace(/♀/g, '\\')
        .replace(/\\\\([a-zA-Z]+)/g, '\\$1'); // 이중 백슬래시 -> 단일
    };

    // ID 추가 및 데이터 정리 (LaTeX 정규화 적용)
    const problems: ExtractedProblem[] = parsed.problems.map((p: any, index: number) => ({
      id: `problem_${Date.now()}_${index}`,
      content: normalizeLatex(p.content || ''),
      difficulty: p.difficulty || '중',
      topic: p.topic || '기타',
      type: p.type || '단답형',
      choices: p.choices ? p.choices.map((c: string) => normalizeLatex(c)) : undefined,
      answer: p.answer ? normalizeLatex(p.answer) : undefined,
      hasImage: p.hasImage || false,
    }));

    return {
      success: true,
      problems,
    };
  } catch (error) {
    console.error('Gemini API 오류:', error);
    return {
      success: false,
      problems: [],
      error: error instanceof Error ? error.message : '문제 추출 중 오류가 발생했습니다',
    };
  }
}

// 난이도별 문제 그룹화
export function groupProblemsByDifficulty(problems: ExtractedProblem[]): {
  high: ExtractedProblem[];
  medium: ExtractedProblem[];
  low: ExtractedProblem[];
} {
  return {
    high: problems.filter((p) => p.difficulty === '상'),
    medium: problems.filter((p) => p.difficulty === '중'),
    low: problems.filter((p) => p.difficulty === '하'),
  };
}

// 주제별 문제 그룹화
export function groupProblemsByTopic(problems: ExtractedProblem[]): Record<string, ExtractedProblem[]> {
  return problems.reduce((acc, problem) => {
    const topic = problem.topic;
    if (!acc[topic]) {
      acc[topic] = [];
    }
    acc[topic].push(problem);
    return acc;
  }, {} as Record<string, ExtractedProblem[]>);
}
