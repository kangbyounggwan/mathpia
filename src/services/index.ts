// ============================================================
// src/services/index.ts
// Service factory -- central access point for all data services.
//
// Current backend: Mock + AsyncStorage
// Future backend:  Supabase (swap implementations here)
// ============================================================

import type { IProblemBankService } from './interfaces/problemBank';
import type { IAssignmentService } from './interfaces/assignment';
import type { IAnalyticsService } from './interfaces/analytics';
import type { IWrongNoteService } from './interfaces/wrongNote';
import type { IParentService } from './interfaces/parent';

import {
  mockProblemBankService,
  mockAssignmentService,
  mockAnalyticsService,
  mockWrongNoteService,
  mockParentService,
} from './mock';

export interface Services {
  problemBank: IProblemBankService;
  assignment: IAssignmentService;
  analytics: IAnalyticsService;
  wrongNote: IWrongNoteService;
  parent: IParentService;
}

const services: Services = {
  problemBank: mockProblemBankService,
  assignment: mockAssignmentService,
  analytics: mockAnalyticsService,
  wrongNote: mockWrongNoteService,
  parent: mockParentService,
};

export default services;
