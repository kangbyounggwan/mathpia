import { useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HintLevel, HintUsageRecord } from '../../types/aiHelper';

const STORAGE_KEY = 'ai_helper_usage';

/**
 * AI Helper usage tracking hook.
 *
 * Tracks per-problem hint/solution/similar-problem usage records
 * in AsyncStorage. Use in solve.tsx and connect to each AI Helper
 * component's callback props.
 */
export function useAIHelperTracking() {
  // In-memory cache (avoid reading AsyncStorage every time)
  const cacheRef = useRef<Map<string, HintUsageRecord>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initial load
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

  // Persist to storage
  const persist = useCallback(async () => {
    try {
      const records = Array.from(cacheRef.current.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
      console.warn('AI Helper 사용 기록 저장 실패:', err);
    }
  }, []);

  // Get or create a record for a specific problem
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

  // Record hint usage
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

  // Record solution viewed
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

  // Record similar problems viewed
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

  // Get hint count for a specific problem
  const getHintCount = useCallback(
    (problemId: string): number => {
      return cacheRef.current.get(problemId)?.hintsUsed.length ?? 0;
    },
    []
  );

  // Get overall stats (can be used in analytics screen)
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
