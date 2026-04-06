// ============================================================
// src/services/interfaces/wrongNote.ts
// ============================================================

import type {
  WrongNote,
  WrongNoteFilter,
  WrongNoteStats,
  ReviewAttempt,
} from '../../types/wrongNote';

export interface IWrongNoteService {
  getById(id: string): Promise<WrongNote | null>;
  create(data: Omit<WrongNote, 'id' | 'status' | 'reviewCount' | 'consecutiveCorrect' | 'isLearned' | 'createdAt' | 'updatedAt'>): Promise<WrongNote>;
  delete(id: string): Promise<boolean>;

  listByStudent(studentId: string, filter?: WrongNoteFilter): Promise<WrongNote[]>;
  getStats(studentId: string): Promise<WrongNoteStats>;

  recordReview(attempt: ReviewAttempt): Promise<WrongNote>;
  getDueForReview(studentId: string, limit?: number): Promise<WrongNote[]>;
  getAiExplanation(wrongNoteId: string): Promise<string>;
}
