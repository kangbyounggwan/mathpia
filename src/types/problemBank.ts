// ============================================================
// src/types/problemBank.ts
// Problem bank domain types
// ============================================================

import type { Grade, Difficulty, ProblemType, SourceType } from './index';

/**
 * A single item in the problem bank.
 * Matches DB table `problem_bank`.
 */
export interface ProblemBankItem {
  id: string;
  academyId: string;
  createdBy: string;

  // Content
  content: string;
  contentHtml?: string;
  imageUrls: string[];

  // Answer & solution
  answer?: string;
  solution?: string;

  // Classification
  difficulty: Difficulty;
  type: ProblemType;
  choices?: string[] | null;

  // Curriculum mapping
  grade: Grade;
  subject: string;
  topic: string;
  tags: string[];

  // Metadata
  source?: string;
  sourceType: SourceType;
  points: number;
  usageCount: number;
  correctRate?: number;

  createdAt: Date;
  updatedAt?: Date;
}

/** Input type for creating a new problem. */
export type ProblemBankItemCreate = Omit<
  ProblemBankItem,
  'id' | 'usageCount' | 'correctRate' | 'createdAt' | 'updatedAt'
>;

/** Input type for updating an existing problem. */
export type ProblemBankItemUpdate = Partial<ProblemBankItemCreate>;

/** Filter criteria for searching the problem bank. */
export interface ProblemBankFilter {
  grade?: Grade;
  subject?: string;
  topic?: string;
  difficulty?: Difficulty;
  type?: ProblemType;
  sourceType?: SourceType;
  tags?: string[];
  searchQuery?: string;
}

/** Sort options for problem bank listing. */
export type ProblemBankSortField = 'createdAt' | 'difficulty' | 'usageCount' | 'correctRate';

export interface ProblemBankSortOption {
  field: ProblemBankSortField;
  direction: 'asc' | 'desc';
}

/** Paginated result wrapper. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
