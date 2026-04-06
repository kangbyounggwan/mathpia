// ============================================================
// src/services/interfaces/parent.ts
// ============================================================

import type { ChildDashboard, ChildSchedule, ParentLearningReport } from '../../types/parent';

export interface IParentService {
  getChildDashboard(parentId: string, childId: string): Promise<ChildDashboard>;
  getAllChildDashboards(parentId: string): Promise<ChildDashboard[]>;
  getChildSchedule(childId: string): Promise<ChildSchedule>;
  getChildReport(childId: string): Promise<ParentLearningReport>;
}
