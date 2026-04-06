// ============================================================
// src/services/mock/index.ts
//
// Service Factory - single import point for all mock services.
// Usage:
//   import { mockProblemBankService, mockAssignmentService } from '@/services/mock';
//
// To switch to Supabase later, create src/services/supabase/index.ts
// with the same shape, then change the import in src/services/index.ts.
// ============================================================

import { MockProblemBankService } from './mockProblemBank';
import { MockAssignmentService } from './mockAssignment';
import { MockAnalyticsService } from './mockAnalytics';
import { MockWrongNoteService } from './mockWrongNote';
import { MockParentService } from './mockParent';

export const mockProblemBankService = new MockProblemBankService();
export const mockAssignmentService = new MockAssignmentService();
export const mockAnalyticsService = new MockAnalyticsService();
export const mockWrongNoteService = new MockWrongNoteService();
export const mockParentService = new MockParentService();

// Re-export individual classes for testing
export {
  MockProblemBankService,
  MockAssignmentService,
  MockAnalyticsService,
  MockWrongNoteService,
  MockParentService,
};
