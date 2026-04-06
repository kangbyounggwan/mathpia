// ============================================================
// src/services/interfaces/problemBank.ts
// ============================================================

import type {
  ProblemBankItem,
  ProblemBankItemCreate,
  ProblemBankItemUpdate,
  ProblemBankFilter,
  ProblemBankSortOption,
  PaginatedResult,
} from '../../types/problemBank';

export interface IProblemBankService {
  getById(id: string): Promise<ProblemBankItem | null>;
  create(data: ProblemBankItemCreate): Promise<ProblemBankItem>;
  update(id: string, data: ProblemBankItemUpdate): Promise<ProblemBankItem>;
  delete(id: string): Promise<boolean>;

  list(
    filter?: ProblemBankFilter,
    sort?: ProblemBankSortOption,
    page?: number,
    pageSize?: number,
  ): Promise<PaginatedResult<ProblemBankItem>>;

  search(query: string, limit?: number): Promise<ProblemBankItem[]>;
  getByIds(ids: string[]): Promise<ProblemBankItem[]>;
  bulkCreate(items: ProblemBankItemCreate[]): Promise<ProblemBankItem[]>;
  incrementUsageCount(id: string): Promise<void>;
  updateCorrectRate(id: string, correctRate: number): Promise<void>;
}
