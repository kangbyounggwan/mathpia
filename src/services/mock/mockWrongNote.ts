// ============================================================
// src/services/mock/mockWrongNote.ts
//
// Implements IWrongNoteService using in-memory data + AsyncStorage.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IWrongNoteService } from '../interfaces/wrongNote';
import type {
  WrongNote,
  WrongNoteFilter,
  WrongNoteStats,
  WrongNoteStatus,
  ReviewAttempt,
} from '../../types/wrongNote';
import type { ProblemBankItem } from '../../types/problemBank';
import {
  mockWrongNotes,
  mockProblems,
  type MockWrongNote,
  type MockProblem,
} from './mockData';

const STORAGE_KEY = '@mathpia/wrongNotes';

/** 24 hours in milliseconds */
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

// ── Helpers ──

/** Map ReviewStatus from mockData (Korean) to WrongNoteStatus */
function mapReviewStatus(reviewStatus: string): WrongNoteStatus {
  switch (reviewStatus) {
    case '복습중':
      return 'reviewing';
    case '숙련':
      return 'mastered';
    case '미복습':
    default:
      return 'unreviewed';
  }
}

/** Convert a MockProblem into a ProblemBankItem snapshot for embedding in WrongNote */
function toProblemBankItem(prob: MockProblem): ProblemBankItem {
  return {
    id: prob.id,
    academyId: 'academy1',
    createdBy: prob.createdBy,
    content: prob.content,
    contentHtml: prob.contentHtml,
    imageUrls: prob.imageUrls ?? [],
    answer: prob.answer,
    solution: prob.solution,
    difficulty: prob.difficulty,
    type: prob.type,
    choices: prob.choices ?? null,
    grade: prob.grade,
    subject: prob.subject,
    topic: prob.topic,
    tags: prob.tags,
    source: prob.source,
    sourceType: 'manual',
    points: prob.points,
    usageCount: prob.usageCount,
    correctRate: prob.correctRate,
    createdAt: prob.createdAt instanceof Date ? prob.createdAt : new Date(prob.createdAt),
  };
}

/** Convert MockWrongNote to the public WrongNote type */
function toWrongNote(wn: MockWrongNote): WrongNote {
  const prob = mockProblems.find(p => p.id === wn.problemId);
  const status = mapReviewStatus(wn.reviewStatus);

  return {
    id: wn.id,
    studentId: wn.studentId,
    problemId: wn.problemId,
    assignmentId: wn.assignmentId,
    studentAnswer: wn.studentAnswer,
    correctAnswer: wn.correctAnswer,
    problem: prob ? toProblemBankItem(prob) : ({} as ProblemBankItem),
    status,
    reviewCount: wn.reviewCount,
    consecutiveCorrect: status === 'mastered' ? 3 : Math.min(wn.reviewCount, 2),
    lastReviewDate: wn.lastReviewDate
      ? wn.lastReviewDate instanceof Date
        ? wn.lastReviewDate
        : new Date(wn.lastReviewDate)
      : undefined,
    isLearned: wn.isLearned,
    createdAt: wn.createdAt instanceof Date ? wn.createdAt : new Date(wn.createdAt),
  };
}

/** Revive dates from JSON-parsed WrongNote */
function reviveDates(wn: WrongNote): WrongNote {
  return {
    ...wn,
    createdAt: new Date(wn.createdAt),
    updatedAt: wn.updatedAt ? new Date(wn.updatedAt) : undefined,
    lastReviewDate: wn.lastReviewDate ? new Date(wn.lastReviewDate) : undefined,
  };
}

// ── Service ──

export class MockWrongNoteService implements IWrongNoteService {
  private notes: WrongNote[] = [];
  private initialized = false;

  private async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.notes = (JSON.parse(stored) as WrongNote[]).map(reviveDates);
      } else {
        this.notes = mockWrongNotes.map(toWrongNote);
        await this.persist();
      }
    } catch {
      this.notes = mockWrongNotes.map(toWrongNote);
    }
    this.initialized = true;
  }

  private async persist(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.notes));
  }

  // ── CRUD ──

  async getById(id: string): Promise<WrongNote | null> {
    await this.init();
    return this.notes.find(n => n.id === id) ?? null;
  }

  async create(
    data: Omit<
      WrongNote,
      'id' | 'status' | 'reviewCount' | 'consecutiveCorrect' | 'isLearned' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<WrongNote> {
    await this.init();

    // Avoid duplicates: same student + same problem
    const existing = this.notes.find(
      n => n.studentId === data.studentId && n.problemId === data.problemId,
    );
    if (existing) return existing;

    const now = new Date();
    const newNote: WrongNote = {
      ...data,
      id: `WN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: 'unreviewed',
      reviewCount: 0,
      consecutiveCorrect: 0,
      isLearned: false,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.push(newNote);
    await this.persist();
    return newNote;
  }

  async delete(id: string): Promise<boolean> {
    await this.init();
    const before = this.notes.length;
    this.notes = this.notes.filter(n => n.id !== id);
    if (this.notes.length < before) {
      await this.persist();
      return true;
    }
    return false;
  }

  // ── List & Stats ──

  async listByStudent(studentId: string, filter?: WrongNoteFilter): Promise<WrongNote[]> {
    await this.init();
    let results = this.notes.filter(n => n.studentId === studentId);

    if (filter) {
      if (filter.status) {
        results = results.filter(n => n.status === filter.status);
      }
      if (filter.subject) {
        results = results.filter(n => n.problem.subject === filter.subject);
      }
      if (filter.topic) {
        results = results.filter(n => n.problem.topic === filter.topic);
      }
      if (filter.fromDate) {
        const from = new Date(filter.fromDate);
        results = results.filter(n => new Date(n.createdAt) >= from);
      }
      if (filter.toDate) {
        const to = new Date(filter.toDate);
        results = results.filter(n => new Date(n.createdAt) <= to);
      }
    }

    return results;
  }

  async getStats(studentId: string): Promise<WrongNoteStats> {
    await this.init();
    const studentNotes = this.notes.filter(n => n.studentId === studentId);
    const total = studentNotes.length;
    const unreviewed = studentNotes.filter(n => n.status === 'unreviewed').length;
    const reviewing = studentNotes.filter(n => n.status === 'reviewing').length;
    const mastered = studentNotes.filter(n => n.status === 'mastered').length;

    return {
      total,
      unreviewed,
      reviewing,
      mastered,
      masteryRate: total > 0 ? Math.round((mastered / total) * 100) : 0,
    };
  }

  // ── Review ──

  /**
   * Record a review attempt.
   * Mastery requires 3 consecutive correct answers with at least 24h between each review.
   */
  async recordReview(attempt: ReviewAttempt): Promise<WrongNote> {
    await this.init();
    const idx = this.notes.findIndex(n => n.id === attempt.wrongNoteId);
    if (idx === -1) throw new Error(`WrongNote ${attempt.wrongNoteId} not found`);

    const note = { ...this.notes[idx] };
    const now = attempt.reviewedAt instanceof Date ? attempt.reviewedAt : new Date(attempt.reviewedAt);

    note.reviewCount++;
    note.updatedAt = now;

    if (attempt.isCorrect) {
      // Check 24h gap from last review
      const hasEnoughGap =
        !note.lastReviewDate ||
        now.getTime() - new Date(note.lastReviewDate).getTime() >= TWENTY_FOUR_HOURS;

      if (hasEnoughGap) {
        note.consecutiveCorrect++;
      }
      // If no 24h gap, still count as review but don't increment consecutive

      note.lastReviewDate = now;
      note.status = 'reviewing';

      // Mastery: 3 consecutive correct with 24h gaps
      if (note.consecutiveCorrect >= 3) {
        note.status = 'mastered';
        note.isLearned = true;
      }
    } else {
      // Reset consecutive correct on wrong answer
      note.consecutiveCorrect = 0;
      note.lastReviewDate = now;
      note.status = 'reviewing';
    }

    this.notes[idx] = note;
    await this.persist();
    return note;
  }

  /**
   * Get wrong notes that are due for review.
   * Returns unreviewed notes and reviewing notes where last review was > 24h ago.
   */
  async getDueForReview(studentId: string, limit: number = 10): Promise<WrongNote[]> {
    await this.init();
    const now = Date.now();

    return this.notes
      .filter(n => {
        if (n.studentId !== studentId) return false;
        if (n.isLearned || n.status === 'mastered') return false;
        if (n.status === 'unreviewed') return true;
        // For 'reviewing' notes, check 24h since last review
        if (n.lastReviewDate) {
          return now - new Date(n.lastReviewDate).getTime() >= TWENTY_FOUR_HOURS;
        }
        return true;
      })
      .slice(0, limit);
  }

  /**
   * Get an AI explanation for a wrong note (mock).
   */
  async getAiExplanation(wrongNoteId: string): Promise<string> {
    await this.init();
    const note = this.notes.find(n => n.id === wrongNoteId);
    if (!note) throw new Error(`WrongNote ${wrongNoteId} not found`);

    // Return a mock AI explanation
    const prob = note.problem;
    const explanation =
      `[AI 풀이 해설]\n\n` +
      `문제: ${prob.content}\n\n` +
      `정답: ${note.correctAnswer}\n` +
      `학생 답안: ${note.studentAnswer}\n\n` +
      `풀이 과정:\n` +
      `이 문제는 ${prob.subject} > ${prob.topic} 단원의 문제입니다.\n` +
      `난이도: ${prob.difficulty}\n\n` +
      `핵심 개념:\n` +
      `- ${prob.topic}의 기본 원리를 이해해야 합니다.\n` +
      `- 공식을 정확히 적용하는 연습이 필요합니다.\n\n` +
      `학생의 오답 분석:\n` +
      `학생이 "${note.studentAnswer}"라고 답했으나, ` +
      `정답은 "${note.correctAnswer}"입니다.\n` +
      `기본 개념을 다시 복습하고, 유사한 문제를 반복해서 풀어보세요.`;

    // Cache the explanation in the note
    const idx = this.notes.findIndex(n => n.id === wrongNoteId);
    if (idx !== -1) {
      this.notes[idx] = { ...this.notes[idx], aiExplanation: explanation };
      await this.persist();
    }

    return explanation;
  }
}
