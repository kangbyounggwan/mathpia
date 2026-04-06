// ============================================================
// src/types/wrongNote.ts
// Wrong-note (오답노트) domain types
// ============================================================

import type { ProblemBankItem } from './problemBank';

/** Review mastery status. */
export type WrongNoteStatus = 'unreviewed' | 'reviewing' | 'mastered';

/**
 * A single wrong-note entry.
 * Auto-created when a student submits an incorrect answer.
 */
export interface WrongNote {
  id: string;
  studentId: string;
  problemId: string;
  assignmentId: string;

  studentAnswer: string;
  correctAnswer: string;

  /** Denormalized problem snapshot. */
  problem: ProblemBankItem;

  status: WrongNoteStatus;
  reviewCount: number;
  consecutiveCorrect: number;
  lastReviewDate?: Date;
  /**
   * Mastery requires 3 consecutive correct answers
   * with at least 24h between each review.
   */
  isLearned: boolean;

  aiExplanation?: string;

  createdAt: Date;
  updatedAt?: Date;
}

/** Filter criteria for wrong-note listing. */
export interface WrongNoteFilter {
  status?: WrongNoteStatus;
  subject?: string;
  topic?: string;
  fromDate?: string;
  toDate?: string;
}

/** Summary statistics for the wrong-note dashboard. */
export interface WrongNoteStats {
  total: number;
  unreviewed: number;
  reviewing: number;
  mastered: number;
  masteryRate: number;
}

/** Result of a single review attempt. */
export interface ReviewAttempt {
  wrongNoteId: string;
  answer: string;
  isCorrect: boolean;
  reviewedAt: Date;
}
