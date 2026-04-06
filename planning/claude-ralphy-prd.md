# PRD: Mathpia Enhancement

## How to Use

```bash
ralphy --prd planning/claude-ralphy-prd.md
```

---

## Project Context

**Mathpia** is a tablet-focused math tutoring platform built with Expo SDK 54, React 19.1, Expo Router, react-native-paper, Zustand, and Gemini AI. It connects teachers, students, and parents within math academies (학원).

The current codebase has basic functionality: user authentication, material uploads, PDF-based problem extraction via Gemini AI, assignments, a canvas-based solving interface, and grading. This enhancement adds five major features:

1. **Question Bank** -- Persistent, searchable, filterable problem bank with CRUD, batch operations, and integration with the existing extraction/assignment flows.
2. **AI-Powered Learning Analytics** -- Gemini AI analyzes student submission history to identify weaknesses, recommend problems, and generate visual learning reports with radar charts, line charts, bar charts, and heatmaps.
3. **Wrong Notes (오답노트)** -- Automatic collection of incorrect answers with a structured review system and spaced-repetition mastery tracking (3 consecutive correct with 24h intervals).
4. **AI Helper** -- In-context AI tutoring during problem solving: progressive 3-level hints, step-by-step solutions, and similar problem recommendations.
5. **Parent Dashboard** -- Read-only dashboard for parents to monitor children's learning: stats overview, class schedule, and AI-generated learning reports.

The implementation is divided into 10 ordered sections with strict dependencies. Each section file in `planning/sections/` contains complete implementation details: background, requirements, file lists, full code listings, and acceptance criteria.

---

## Tech Stack

- **Runtime**: Expo SDK 54, React 19.1, React Native 0.81.5
- **Routing**: Expo Router (file-based)
- **UI Library**: react-native-paper
- **State Management**: Zustand v5 with persist middleware
- **AI**: @google/genai (Gemini 2.0 Flash)
- **Charts**: react-native-svg v15.15.1 (custom SVG components)
- **LaTeX**: react-native-math-view / KaTeX
- **Storage**: @react-native-async-storage/async-storage
- **Icons**: @expo/vector-icons (MaterialCommunityIcons)

---

## Section Reference Files

All implementation details are in the section files. Each section is self-contained -- read the referenced file for complete code, types, and acceptance criteria.

| Section | File |
|---------|------|
| Section 01 | `planning/sections/section-01-types-and-interfaces.md` |
| Section 02 | `planning/sections/section-02-mock-data-and-services.md` |
| Section 03 | `planning/sections/section-03-zustand-stores.md` |
| Section 04 | `planning/sections/section-04-problem-bank-ui.md` |
| Section 05 | `planning/sections/section-05-gemini-ai-services.md` |
| Section 06 | `planning/sections/section-06-charts-and-analytics-ui.md` |
| Section 07 | `planning/sections/section-07-wrong-notes.md` |
| Section 08 | `planning/sections/section-08-ai-helper.md` |
| Section 09 | `planning/sections/section-09-parent-dashboard.md` |
| Section 10 | `planning/sections/section-10-integration.md` |
| Index | `planning/sections/index.md` |

---

## Dependency Order

Execute sections in this order. Do not skip or reorder.

```
01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09 -> 10
```

Sections 04-08 have partial parallelism in theory (see `planning/sections/index.md` for the dependency diagram), but for simplicity execute them sequentially in the listed order.

---

## Task Checklist

- [ ] **Section 01: Types & Interfaces** -- Add `parent` to UserRole, create 4 new type files (`problemBank.ts`, `analytics.ts`, `wrongNote.ts`, `parent.ts`), define 5 service interfaces in `src/services/interfaces/`, create service factory `src/services/index.ts`. Run `npx tsc --noEmit` to verify.

- [ ] **Section 02: Mock Data & Services** -- Create `src/services/mock/mockData.ts` with 108 LaTeX problems, 15 users, 8 assignments, ~400 submissions. Implement 5 mock service classes (`MockProblemBankService`, `MockAssignmentService`, `MockAnalyticsService`, `MockWrongNoteService`, `MockParentService`) with AsyncStorage persistence. Wire into service factory.

- [ ] **Section 03: Zustand Stores** -- Install `@react-native-async-storage/async-storage`. Modify `authStore.ts` to add parent account and persist. Create 6 new stores (`problemBankStore`, `assignmentStore`, `submissionStore`, `analyticsStore`, `wrongNoteStore`, `parentStore`). Create `stores/index.ts` with subscribe interconnection for automatic wrong-note collection.

- [ ] **Section 04: Problem Bank UI** -- Create `ProblemCard` (memo'd, plain-text summary), `ProblemFilters` (multi-dimensional chip filtering), `ProblemForm` (create/edit modal with LaTeX preview), `ProblemSelector` (multi-select for assignments), `ProblemDetailModal`. Create `problem-bank.tsx` screen. Integrate with existing extraction and assignment flows.

- [ ] **Section 05: Gemini AI Services** -- Create `src/services/geminiAnalytics.ts` (weakness analysis, problem recommendations, learning report generation) and `src/services/geminiHelper.ts` (3-level hints, step-by-step solutions, similar problem search). Include JSON validation, retry logic, and caching integration.

- [ ] **Section 06: Charts & Analytics UI** -- Create 4 SVG chart components (`RadarChart`, `LineChart`, `BarChart`, `HeatMap`) using react-native-svg. Create analytics wrapper components (`AnalyticsSummaryCard`, `WeakTopicsList`, `LearningReportView`). Create student `analytics.tsx` and teacher `student-analytics.tsx` screens.

- [ ] **Section 07: Wrong Notes** -- Create `WrongNoteCard`, `ReviewMode`, `WrongNoteFilters`, `WrongNoteStats` components. Create `wrong-notes.tsx` screen. Implement review flow with mastery tracking (3 consecutive correct, 24h intervals). Integrate AI explanations on demand.

- [ ] **Section 08: AI Helper** -- Create `HintButton` (progressive 3-level), `StepByStepSolution` (accordion), `SimilarProblems` (reuses ProblemCard), `AIHelperPanel` (tabbed container). Integrate into existing `solve.tsx` problem-solving screen.

- [ ] **Section 09: Parent Dashboard** -- Create `(parent)` route group with `_layout.tsx` (3-tab bottom nav), `index.tsx` (dashboard), `schedule.tsx`, `report.tsx`. Create `ChildSelector`, `ScheduleCalendar`, `ParentReportCard` components. Reuse chart components from Section 06.

- [ ] **Section 10: Integration & Navigation** -- Wire all modules together: parent routing in `app/index.tsx`, teacher dashboard quick-actions, student 5-tab layout with wrong-notes tab, store subscription initialization in root layout, data flow connections between stores.

---

## Verification

After completing all sections, verify:

1. `npx tsc --noEmit` passes with zero errors
2. `npx expo start --web` runs without build errors
3. Teacher login (`teacher@test.com` / `123456`) shows teacher screens with problem bank and student analytics
4. Student login (`student@test.com` / `123456`) shows student screens with wrong notes and AI helper
5. Parent login (`parent@test.com` / `123456`) shows parent dashboard with child data
6. All navigation flows work without crashes
