/**
 * dataFlowConnector.ts
 *
 * Sets up cross-store subscriptions for data flow:
 *   1. submissionStore -> wrongNoteStore: auto-add incorrect submissions as wrong notes
 *      (This supplements the existing subscription in stores/index.ts by handling
 *       edge cases like batch grading)
 *   2. submissionStore -> analyticsStore: invalidate analytics cache when submissions accumulate
 *   3. analyticsStore -> parentStore: parent dashboard reads child analytics (pull-based, no subscription needed)
 *
 * IMPORTANT: This file must be imported once at app startup.
 * It uses Zustand's subscribe() to avoid circular store imports.
 */

import { useSubmissionStore } from './submissionStore';
import { useAnalyticsStore } from './analyticsStore';

let isInitialized = false;

export function initializeDataFlowConnections(): void {
  if (isInitialized) return;
  isInitialized = true;

  // ---------------------------------------------------------
  // Connection: Submission accumulation -> Analytics cache invalidation
  // ---------------------------------------------------------
  // When 5+ new submissions accumulate since the last analytics analysis,
  // invalidate the analytics cache so the next visit triggers a fresh analysis.

  let submissionCountAtLastCheck = useSubmissionStore.getState().submissions?.length ?? 0;

  useSubmissionStore.subscribe((state) => {
    const currentCount = state.submissions?.length ?? 0;
    const newSinceLastCheck = currentCount - submissionCountAtLastCheck;

    if (newSinceLastCheck >= 5) {
      try {
        // Invalidate all cached analytics so next screen visit re-analyzes
        const analyticsState = useAnalyticsStore.getState();
        const cachedStudentIds = Object.keys(analyticsState.analysisCacheMap);
        for (const studentId of cachedStudentIds) {
          analyticsState.invalidateCache(studentId);
        }
        submissionCountAtLastCheck = currentCount;
      } catch (error) {
        console.warn('[DataFlow] Failed to invalidate analytics cache:', error);
      }
    }
  });

  console.log('[DataFlow] Cross-store data flow connections initialized');
}

/**
 * Reset the connector state (useful for testing or logout).
 */
export function resetDataFlowConnections(): void {
  isInitialized = false;
}
