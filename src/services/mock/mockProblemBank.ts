// ============================================================
// src/services/mock/mockProblemBank.ts
//
// Implements IProblemBankService using in-memory data + AsyncStorage.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IProblemBankService } from '../interfaces/problemBank';
import type {
  ProblemBankItem,
  ProblemBankItemCreate,
  ProblemBankItemUpdate,
  ProblemBankFilter,
  ProblemBankSortOption,
  PaginatedResult,
} from '../../types/problemBank';
import { mockProblems, type MockProblem } from './mockData';

const STORAGE_KEY = '@mathpia/problemBank';

// ── Helpers ──

/** Convert internal MockProblem to the public ProblemBankItem type */
function toItem(p: MockProblem): ProblemBankItem {
  return {
    id: p.id,
    academyId: 'academy1',
    createdBy: p.createdBy,
    content: p.content,
    contentHtml: p.contentHtml,
    imageUrls: p.imageUrls ?? [],
    answer: p.answer,
    solution: p.solution,
    difficulty: p.difficulty,
    type: p.type,
    choices: p.choices ?? null,
    grade: p.grade,
    subject: p.subject,
    topic: p.topic,
    tags: p.tags,
    source: p.source,
    // MockProblem uses 'textbook' | 'exam' | 'custom'; map to SourceType 'manual' | 'ai_extracted'
    sourceType: 'manual',
    points: p.points,
    usageCount: p.usageCount,
    correctRate: p.correctRate,
    createdAt: p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt),
  };
}

/** Parse dates that may have been stringified through AsyncStorage */
function reviveDates(item: ProblemBankItem): ProblemBankItem {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
  };
}

/** Difficulty ordering for sorting */
const DIFFICULTY_ORDER: Record<string, number> = { '하': 1, '중': 2, '상': 3 };

// ── Service ──

export class MockProblemBankService implements IProblemBankService {
  private problems: ProblemBankItem[] = [];
  private initialized = false;

  /** Load from AsyncStorage, falling back to mockData */
  private async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.problems = (JSON.parse(stored) as ProblemBankItem[]).map(reviveDates);
      } else {
        this.problems = mockProblems.map(toItem);
        await this.persist();
      }
    } catch {
      this.problems = mockProblems.map(toItem);
    }
    this.initialized = true;
  }

  private async persist(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.problems));
  }

  // ── CRUD ──

  async getById(id: string): Promise<ProblemBankItem | null> {
    await this.init();
    return this.problems.find(p => p.id === id) ?? null;
  }

  async create(data: ProblemBankItemCreate): Promise<ProblemBankItem> {
    await this.init();
    const now = new Date();
    const newItem: ProblemBankItem = {
      ...data,
      id: `PROB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      usageCount: 0,
      correctRate: undefined,
      createdAt: now,
      updatedAt: undefined,
    };
    this.problems.unshift(newItem);
    await this.persist();
    return newItem;
  }

  async update(id: string, data: ProblemBankItemUpdate): Promise<ProblemBankItem> {
    await this.init();
    const idx = this.problems.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Problem ${id} not found`);
    this.problems[idx] = {
      ...this.problems[idx],
      ...data,
      id,
      updatedAt: new Date(),
    };
    await this.persist();
    return this.problems[idx];
  }

  async delete(id: string): Promise<boolean> {
    await this.init();
    const before = this.problems.length;
    this.problems = this.problems.filter(p => p.id !== id);
    if (this.problems.length < before) {
      await this.persist();
      return true;
    }
    return false;
  }

  // ── List with filter, sort, pagination ──

  async list(
    filter?: ProblemBankFilter,
    sort?: ProblemBankSortOption,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResult<ProblemBankItem>> {
    await this.init();
    let results = [...this.problems];

    // Apply filters
    if (filter) {
      if (filter.grade) results = results.filter(p => p.grade === filter.grade);
      if (filter.subject) results = results.filter(p => p.subject === filter.subject);
      if (filter.topic) results = results.filter(p => p.topic === filter.topic);
      if (filter.difficulty) results = results.filter(p => p.difficulty === filter.difficulty);
      if (filter.type) results = results.filter(p => p.type === filter.type);
      if (filter.sourceType) results = results.filter(p => p.sourceType === filter.sourceType);
      if (filter.tags && filter.tags.length > 0) {
        results = results.filter(p =>
          filter.tags!.some(tag => p.tags.includes(tag)),
        );
      }
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        results = results.filter(
          p =>
            p.content.toLowerCase().includes(q) ||
            p.topic.toLowerCase().includes(q) ||
            p.subject.toLowerCase().includes(q) ||
            p.tags.some(t => t.toLowerCase().includes(q)),
        );
      }
    }

    // Apply sorting
    if (sort) {
      results.sort((a, b) => {
        let cmp = 0;
        switch (sort.field) {
          case 'createdAt':
            cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'difficulty':
            cmp = (DIFFICULTY_ORDER[a.difficulty] ?? 0) - (DIFFICULTY_ORDER[b.difficulty] ?? 0);
            break;
          case 'usageCount':
            cmp = a.usageCount - b.usageCount;
            break;
          case 'correctRate':
            cmp = (a.correctRate ?? 0) - (b.correctRate ?? 0);
            break;
        }
        return sort.direction === 'desc' ? -cmp : cmp;
      });
    }

    // Pagination
    const total = results.length;
    const startIdx = (page - 1) * pageSize;
    const paged = results.slice(startIdx, startIdx + pageSize);

    return {
      items: paged,
      total,
      page,
      pageSize,
      hasMore: startIdx + pageSize < total,
    };
  }

  // ── Search ──

  async search(query: string, limit: number = 20): Promise<ProblemBankItem[]> {
    await this.init();
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return this.problems
      .filter(
        p =>
          p.content.toLowerCase().includes(q) ||
          p.topic.toLowerCase().includes(q) ||
          p.subject.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q)),
      )
      .slice(0, limit);
  }

  // ── Batch operations ──

  async getByIds(ids: string[]): Promise<ProblemBankItem[]> {
    await this.init();
    const idSet = new Set(ids);
    return this.problems.filter(p => idSet.has(p.id));
  }

  async bulkCreate(items: ProblemBankItemCreate[]): Promise<ProblemBankItem[]> {
    await this.init();
    const now = new Date();
    const created: ProblemBankItem[] = items.map((data, i) => ({
      ...data,
      id: `PROB-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      usageCount: 0,
      correctRate: undefined,
      createdAt: now,
      updatedAt: undefined,
    }));
    this.problems.unshift(...created);
    await this.persist();
    return created;
  }

  // ── Stat updates ──

  async incrementUsageCount(id: string): Promise<void> {
    await this.init();
    const item = this.problems.find(p => p.id === id);
    if (item) {
      item.usageCount = (item.usageCount ?? 0) + 1;
      await this.persist();
    }
  }

  async updateCorrectRate(id: string, correctRate: number): Promise<void> {
    await this.init();
    const item = this.problems.find(p => p.id === id);
    if (item) {
      item.correctRate = correctRate;
      item.updatedAt = new Date();
      await this.persist();
    }
  }
}
