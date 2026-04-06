// ============================================================
// src/services/geminiUtils.ts
// Shared utilities for Gemini AI services
// ============================================================

import { GoogleGenAI } from '@google/genai';

// ─── Gemini 클라이언트 (싱글턴) ──────────────────────────────────
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
export const MODEL_ID = 'gemini-2.5-flash';

// ─── 재시도 설정 ────────────────────────────────────────────────
export const MAX_RETRIES = 2;

// ─── 스키마 검증 타입 ───────────────────────────────────────────

export interface SchemaField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
}

// ─── JSON 파싱 유틸리티 ─────────────────────────────────────────

/**
 * Gemini 응답 텍스트에서 JSON을 안전하게 추출하여 파싱한다.
 * - ```json ... ``` 코드블록 내부의 JSON 추출
 * - 순수 JSON 텍스트 직접 파싱
 * - LaTeX 백슬래시 이스케이프 자동 수정 후 재시도
 * @returns 파싱된 객체, 실패 시 null
 */
export function safeParseJSON<T>(text: string): T | null {
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

/**
 * parseGeminiJson: Type-safe wrapper around safeParseJSON with fallback.
 * If parsing fails, returns the provided fallback value.
 */
export function parseGeminiJson<T>(text: string, fallback: T): T {
  const result = safeParseJSON<T>(text);
  return result !== null ? result : fallback;
}

// ─── 스키마 검증 유틸리티 ───────────────────────────────────────

/**
 * 객체가 주어진 스키마 필드를 만족하는지 검증한다.
 * @returns { valid: boolean; errors: string[] }
 */
export function validateSchema(
  data: Record<string, unknown>,
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
      errors.push(
        `"${field.key}" 필드는 ${field.type} 타입이어야 합니다 (실제: ${typeof value})`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── 재시도 유틸리티 ────────────────────────────────────────────

/**
 * Gemini API 호출을 재시도 로직으로 감싼다.
 * - 최대 MAX_RETRIES(2)회 재시도
 * - 재시도 간 1초 대기
 * - 모든 시도 실패 시 null 반환
 */
export async function callGeminiWithRetry<T>(
  promptFn: () => Promise<T | null>,
  maxRetries: number = MAX_RETRIES
): Promise<T | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.error(
    `Gemini API 호출 실패 (${maxRetries + 1}회 시도):`,
    lastError?.message
  );
  return null;
}

/**
 * Gemini API를 호출하고 JSON 응답을 파싱/검증하는 통합 유틸리티.
 * prompt를 전달하면 Gemini에 요청하고, 응답을 파싱/검증 후 반환한다.
 * 실패 시 재시도하며, 최종 실패 시 null을 반환한다.
 */
export async function callGeminiAndParse<T>(
  prompt: string,
  schema?: SchemaField[],
  maxRetries: number = MAX_RETRIES
): Promise<T | null> {
  return callGeminiWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = response.text || '';
    const parsed = safeParseJSON<Record<string, unknown>>(text);
    if (!parsed) return null;

    // 스키마가 제공된 경우 검증
    if (schema) {
      const validation = validateSchema(parsed, schema);
      if (!validation.valid) {
        console.warn('Gemini 응답 스키마 검증 실패:', validation.errors);
        return null;
      }
    }

    return parsed as T;
  }, maxRetries);
}
