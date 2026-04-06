# Mathpia Enhancement -- Autonomous Implementation Prompt

## Mission

Implement the Mathpia app enhancement plan -- a math education platform with Question Bank, AI-powered learning analytics, Wrong Notes, AI Helper, and Parent Dashboard.

You are executing a multi-section implementation plan. Each section is self-contained with full implementation details, acceptance criteria, and dependency information. Follow the dependency order strictly. Do NOT skip sections. Verify all acceptance criteria before proceeding to the next section.

---

## Section Manifest & Dependency Diagram

<!--
SECTION_MANIFEST:
- section-01-types-and-interfaces
- section-02-mock-data-and-services
- section-03-zustand-stores
- section-04-problem-bank-ui
- section-05-gemini-ai-services
- section-06-charts-and-analytics-ui
- section-07-wrong-notes
- section-08-ai-helper
- section-09-parent-dashboard
- section-10-integration
-->

### Dependency Diagram

```
Section 01: Types & Interfaces
  |
Section 02: Mock Data & Services  (depends on 01)
  |
Section 03: Zustand Stores  (depends on 01, 02)
  |
+-----------------------+----------------------------+
|                       |                            |
Section 04:             Section 05:                  |
Problem Bank UI         Gemini AI Services           |
(depends on 01-03)      (depends on 01-03)           |
|                       |                            |
|                       v                            |
|                Section 06:                         |
|                Charts & Analytics UI               |
|                (depends on 01-03, 05)              |
|                       |                            |
+-----------------------+                            |
|                       |                            |
Section 07:             Section 08:                  |
Wrong Notes             AI Helper                    |
(depends on 01-03)      (depends on 01-03, 04, 05)  |
|                       |                            |
+----------+------------+----------------------------+
           |
           v
     Section 09: Parent Dashboard
     (depends on 01-03, 06)
           |
           v
     Section 10: Integration & Navigation
     (depends on ALL previous sections)
```

### Section List

| # | Section | File | Dependencies | Summary |
|---|---------|------|-------------|---------|
| 01 | Types & Interfaces | section-01-types-and-interfaces.md | None (first) | Add parent to UserRole, create problemBank/analytics/wrongNote/parent types, service interfaces, service factory |
| 02 | Mock Data & Services | section-02-mock-data-and-services.md | 01 | 108+ mock problems, mock users/assignments/submissions, 5 mock services with AsyncStorage |
| 03 | Zustand Stores | section-03-zustand-stores.md | 01, 02 | 6 new stores + authStore modification, persist middleware, subscribe pattern for wrongNote auto-collection |
| 04 | Problem Bank UI | section-04-problem-bank-ui.md | 01-03 | ProblemCard, ProblemFilters, ProblemForm, ProblemSelector, problem-bank screen |
| 05 | Gemini AI Services | section-05-gemini-ai-services.md | 01-03 | geminiAnalytics.ts (weakness analysis, recommendations, reports), geminiHelper.ts (hints, step-by-step, similar problems) |
| 06 | Charts & Analytics UI | section-06-charts-and-analytics-ui.md | 01-03, 05 | RadarChart, LineChart, BarChart, HeatMap; student analytics.tsx, teacher student-analytics.tsx |
| 07 | Wrong Notes | section-07-wrong-notes.md | 01-03 | WrongNoteCard, ReviewMode components; wrong-notes.tsx screen; auto-collection + mastery tracking |
| 08 | AI Helper | section-08-ai-helper.md | 01-03, 04, 05 | HintButton, StepByStepSolution, SimilarProblems components; integration into solve.tsx |
| 09 | Parent Dashboard | section-09-parent-dashboard.md | 01-03, 06 | (parent) route group with 3 screens; ChildSelector, ScheduleCalendar, ParentReportCard |
| 10 | Integration & Navigation | section-10-integration.md | ALL | Tab structure updates, data flow wiring, index.tsx routing, full integration |

---

## Execution Rules

1. **Follow dependency order strictly**: Section 01 -> 02 -> 03 -> then 04-08 in order -> 09 -> 10
2. **Verify ALL acceptance criteria checkboxes** for each section before proceeding to next
3. **Run `npx expo start --web`** after each section to verify no build errors
4. **If a section fails**, fix all issues before proceeding to the next section
5. **Do not skip any section** -- each section builds on the previous ones
6. **Read each section's "Files to Create / Modify" table** and implement every file listed
7. **Run `npx tsc --noEmit`** after each section where TypeScript changes are made to verify type safety
8. **Install required packages** when indicated (e.g., `npx expo install @react-native-async-storage/async-storage`)

---

## SECTION 01: Types & Interfaces

> **Dependencies**: None (first section)
> **Blocks**: All subsequent sections

### Background

Mathpia is a tablet-focused math tutoring platform connecting teachers, students, and parents. The current codebase has a minimal type system (`src/types/index.ts`) that covers only basic entities: `User`, `Problem`, `Assignment`, `Submission`, `Material`, and canvas-related types. The `UserRole` type is limited to `'admin' | 'teacher' | 'student'` -- there is no parent role.

This section establishes the complete type foundation for all upcoming features: problem bank, learning analytics, wrong-note review, AI tutoring helper, and parent dashboard. It also defines service interfaces that abstract data access so that the current Mock+AsyncStorage implementation can later be swapped for Supabase without changing any UI or store code.

### Requirements

1. `UserRole` includes `'parent'` and `User` has an optional `childrenIds` field.
2. Four new type files exist: `problemBank.ts`, `analytics.ts`, `wrongNote.ts`, `parent.ts`.
3. Five service interface files exist in `src/services/interfaces/`.
4. A service factory `src/services/index.ts` exports a typed `services` object.
5. All types align with the database schema tables.
6. Existing code that imports from `src/types` continues to compile without changes.
7. `npx tsc --noEmit` passes with zero errors.

### Files to Create / Modify

| Action | File Path | Description |
|--------|-----------|-------------|
| **Modify** | `src/types/index.ts` | Add `'parent'` to UserRole, add `childrenIds` to User, add `AssignmentStatus`, expand `Submission`, update navigation types |
| **Create** | `src/types/problemBank.ts` | Problem bank item types |
| **Create** | `src/types/analytics.ts` | Learning analytics types |
| **Create** | `src/types/wrongNote.ts` | Wrong-note types |
| **Create** | `src/types/parent.ts` | Parent dashboard types |
| **Create** | `src/services/interfaces/problemBank.ts` | IProblemBankService |
| **Create** | `src/services/interfaces/assignment.ts` | IAssignmentService |
| **Create** | `src/services/interfaces/analytics.ts` | IAnalyticsService |
| **Create** | `src/services/interfaces/wrongNote.ts` | IWrongNoteService |
| **Create** | `src/services/interfaces/parent.ts` | IParentService |
| **Create** | `src/services/interfaces/index.ts` | Re-exports all interfaces |
| **Create** | `src/services/index.ts` | Service factory (placeholder -- concrete implementations come in Section 02) |

### Implementation Details

Refer to `planning/sections/section-01-types-and-interfaces.md` for complete code listings for every file. Key changes to `src/types/index.ts`:

- `UserRole` becomes `'admin' | 'teacher' | 'student' | 'parent'`
- `User` gains `childrenIds?: string[]`
- New shared literal types: `Difficulty`, `ProblemType`, `SourceType`, `AssignmentStatus`, `StudentAssignmentStatus`
- New interfaces: `AssignmentProblem`, `AssignmentStudent`, `Grading`, `ParentTabParamList`
- Re-exports from `./problemBank`, `./analytics`, `./wrongNote`, `./parent`

New type files: `ProblemBankItem`, `ProblemBankFilter`, `PaginatedResult`, `StudentAnalytics`, `WeaknessAnalysis`, `LearningReport`, chart data types, `WrongNote`, `WrongNoteStats`, `ReviewAttempt`, `ChildDashboard`, `ChildSchedule`, `ParentLearningReport`.

Service interfaces: `IProblemBankService` (CRUD, list, search, bulk), `IAssignmentService` (CRUD, problem linking, submissions, grading), `IAnalyticsService` (student/class analytics, weakness analysis, recommendations), `IWrongNoteService` (CRUD, review, AI explanation), `IParentService` (dashboards, schedule, report).

Service factory: typed `services` singleton with placeholder `null as unknown as IXxxService` for each service.

### Implementation Order

1. Create `src/types/problemBank.ts`
2. Create `src/types/analytics.ts`
3. Create `src/types/wrongNote.ts`
4. Create `src/types/parent.ts`
5. Modify `src/types/index.ts` (includes re-exports of above)
6. Create `src/services/interfaces/problemBank.ts`
7. Create `src/services/interfaces/assignment.ts`
8. Create `src/services/interfaces/analytics.ts`
9. Create `src/services/interfaces/wrongNote.ts`
10. Create `src/services/interfaces/parent.ts`
11. Create `src/services/interfaces/index.ts`
12. Create `src/services/index.ts`
13. Run `npx tsc --noEmit` and fix any errors
14. Verify existing code still compiles

### Acceptance Criteria

- [ ] AC-01: `src/types/index.ts` compiles and exports `UserRole` that includes `'parent'`
- [ ] AC-02: `User` interface has optional `childrenIds?: string[]` field
- [ ] AC-03: Shared literal types exist: `Difficulty`, `ProblemType`, `SourceType`, `AssignmentStatus`, `StudentAssignmentStatus`
- [ ] AC-04: New interfaces exist: `AssignmentProblem`, `AssignmentStudent`, `Grading`, `ParentTabParamList`
- [ ] AC-05: `src/types/problemBank.ts` exists with `ProblemBankItem`, `ProblemBankItemCreate`, `ProblemBankItemUpdate`, `ProblemBankFilter`, `ProblemBankSortOption`, `PaginatedResult`
- [ ] AC-06: `src/types/analytics.ts` exists with `StudentAnalytics`, `WeaknessAnalysis`, `ProblemRecommendation`, `ClassAnalytics`, `LearningReport`, and all chart data types
- [ ] AC-07: `src/types/wrongNote.ts` exists with `WrongNote`, `WrongNoteFilter`, `WrongNoteStats`, `ReviewAttempt`, `WrongNoteStatus`
- [ ] AC-08: `src/types/parent.ts` exists with `ChildDashboard`, `ChildLearningStats`, `ChildSchedule`, `ClassScheduleEntry`, `UpcomingDeadline`, `ParentLearningReport`
- [ ] AC-09: `src/services/interfaces/problemBank.ts` exports `IProblemBankService` with CRUD, list, search, getByIds, bulkCreate
- [ ] AC-10: `src/services/interfaces/assignment.ts` exports `IAssignmentService` with full CRUD, problem linking, submissions, grading
- [ ] AC-11: `src/services/interfaces/analytics.ts` exports `IAnalyticsService` with student/class analytics, weakness analysis, recommendations, reports
- [ ] AC-12: `src/services/interfaces/wrongNote.ts` exports `IWrongNoteService` with CRUD, review, getDueForReview, AI explanation
- [ ] AC-13: `src/services/interfaces/parent.ts` exports `IParentService` with dashboards, schedule, report
- [ ] AC-14: `src/services/interfaces/index.ts` re-exports all 5 interfaces
- [ ] AC-15: `src/services/index.ts` exports a typed `services` singleton of type `Services` with all 5 service fields
- [ ] AC-16: Existing imports in `src/stores/authStore.ts` still resolve correctly
- [ ] AC-17: Existing imports in `src/constants/curriculum.ts` still resolve correctly
- [ ] AC-18: `npx tsc --noEmit` passes with zero errors

---

## SECTION 02: Mock Data & Services

> **Dependencies**: Section 01
> **Blocks**: Section 03 and all subsequent sections

### Background

This section implements the mock data layer and five mock service classes that power the entire Mathpia application during the front-end-only development phase. All data is stored in-memory with AsyncStorage persistence.

### Requirements

1. Create 108 mock math problems spanning grades (18 per grade), covering all major subjects, with LaTeX content, mixed difficulties and types.
2. Create mock users: 10 students, 2 teachers, 3 parents (with `childrenIds` linking to students).
3. Create 8+ mock assignments in various statuses (draft / published / closed).
4. Create 30-50 mock submissions per student with realistic date distribution over 4 weeks and deliberate weakness patterns.
5. Implement 5 mock services with AsyncStorage persistence: ProblemBank, Assignment, Analytics, WrongNote, Parent.
6. Export a unified service factory from `src/services/mock/index.ts`.
7. Update `src/services/index.ts` to use the mock services.

### Files to Create

```
src/services/mock/
  mockData.ts           # All raw mock data (users, problems, assignments, submissions)
  mockProblemBank.ts     # MockProblemBankService implements IProblemBankService
  mockAssignment.ts      # MockAssignmentService implements IAssignmentService
  mockAnalytics.ts       # MockAnalyticsService implements IAnalyticsService
  mockWrongNote.ts       # MockWrongNoteService implements IWrongNoteService
  mockParent.ts          # MockParentService implements IParentService
  index.ts               # Service factory - single import point
```

Also modify: `src/services/index.ts` to import and instantiate mock services.

### Key Design

- **mockData.ts**: Contains `mockTeachers` (T1, T2), `mockStudents` (S1-S10 with designed weakness patterns), `mockParents` (P1-P3), `mockProblems` (108 problems with LaTeX), `mockAssignments` (8 with various statuses), `mockSubmissions` (~400 total from `generateSubmissions()`), `mockWrongNotes` (derived from incorrect submissions), `mockSchedules`.
- Each mock service: init from AsyncStorage (fallback to mockData), persist on write.
- Student weakness patterns: S1-S3 weak in geometry/statistics, S4-S6 weak in coordinate geometry, S7-S8 weak in calculus, S9-S10 weak in integral calculus.

### Acceptance Criteria

- [ ] `src/services/mock/mockData.ts` exports 108+ problems across 6 grades
- [ ] `src/services/mock/mockData.ts` exports 10 students, 2 teachers, 3 parents with childrenIds
- [ ] `src/services/mock/mockData.ts` exports 8 assignments in draft/published/closed statuses
- [ ] `src/services/mock/mockData.ts` generates 30-50 submissions per student with weakness bias
- [ ] `MockProblemBankService` implements all `IProblemBankService` methods with AsyncStorage persistence
- [ ] `MockAssignmentService` implements all `IAssignmentService` methods
- [ ] `MockAnalyticsService` implements all `IAnalyticsService` methods with computed analytics
- [ ] `MockWrongNoteService` implements all `IWrongNoteService` methods
- [ ] `MockParentService` implements all `IParentService` methods
- [ ] `src/services/index.ts` exports working `services` singleton with all 5 real mock service instances
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx expo start --web` runs without build errors

---

## SECTION 03: Zustand Stores

> **Dependencies**: Section 01, 02
> **Blocks**: Sections 04-10

### Background

This section creates 6 new Zustand stores plus modifies the existing `authStore`. All stores use `persist` middleware with `AsyncStorage`. The key design pattern is a subscribe callback from `submissionStore` to `wrongNoteStore` for automatic wrong-note collection.

### Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `src/stores/authStore.ts` | Modify | Add parent account, apply persist middleware |
| `src/stores/problemBankStore.ts` | Create | Problem bank CRUD, search, filters |
| `src/stores/assignmentStore.ts` | Create | Assignment CRUD, status management |
| `src/stores/submissionStore.ts` | Create | Submissions, grading, wrong-note trigger |
| `src/stores/analyticsStore.ts` | Create | AI analysis with caching strategy (reanalyze threshold: 5 new submissions) |
| `src/stores/wrongNoteStore.ts` | Create | Wrong note auto-collection, review tracking, mastery (3 consecutive correct with 24h intervals) |
| `src/stores/parentStore.ts` | Create | Parent dashboard, child data |
| `src/stores/index.ts` | Create | Re-exports + subscribe interconnection |

### Key Design

- **Persist**: All stores use `zustand/middleware` `persist` with `createJSONStorage(() => AsyncStorage)`
- **Zustand v5 syntax**: `create<T>()(persist((set, get) => ..., { name, storage, partialize }))`
- **Caching**: `analyticsStore` reanalyzes only when `submissionCountSinceLastAnalysis >= 5`
- **Mastery**: `wrongNoteStore` requires 3 consecutive correct answers with >= 24h between reviews
- **Subscribe**: `stores/index.ts` exports `initializeStoreSubscriptions()` that wires `submissionStore.lastAddedSubmission` -> `wrongNoteStore.addFromSubmission()`
- **partialize**: Only persist data fields; exclude `isLoading`, `error`

### Required Package

```bash
npx expo install @react-native-async-storage/async-storage
```

### Acceptance Criteria

- [ ] `@react-native-async-storage/async-storage` package is installed
- [ ] `authStore.ts` uses persist middleware with key `mathpia-auth`
- [ ] `parent@test.com` / `123456` login works with `role: 'parent'` and `childrenIds: ['2']`
- [ ] 6 new store files exist in `src/stores/`
- [ ] All stores use persist middleware with `mathpia-` prefix keys
- [ ] `isLoading` and `error` fields are NOT persisted (partialize check)
- [ ] `problemBankStore.setFilters()` auto-updates `filteredProblems`
- [ ] `assignmentStore.publishAssignment()` changes status to `'published'`
- [ ] `analyticsStore.shouldReanalyze()` returns false when < 5 submissions, true when >= 5
- [ ] `wrongNoteStore.recordReview()` sets `isLearned: true` after 3 consecutive correct with 24h gaps
- [ ] `parentStore.fetchChildren()` auto-selects child if only 1 exists
- [ ] `initializeStoreSubscriptions()` exists and wires submission -> wrongNote auto-collection
- [ ] No duplicate wrong notes for same problem
- [ ] `npx tsc --noEmit` passes
- [ ] `npx expo start --web` runs without errors

---

## SECTION 04: Problem Bank UI

> **Dependencies**: Section 01-03
> **Blocks**: Section 08 (reuses ProblemCard)

### Background

This section implements the teacher-facing Problem Bank screen: a searchable, filterable collection of math problems with CRUD, batch selection, and integration with existing extraction and assignment flows.

### Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/problemBank/ProblemCard.tsx` | Create | Compact card with text summary (no LaTeX in list), memo'd with custom comparator |
| `src/components/problemBank/ProblemFilters.tsx` | Create | Horizontal chip rows for grade/difficulty/type/topic + search bar |
| `src/components/problemBank/ProblemForm.tsx` | Create | Modal form for creating/editing problems with live LaTeX preview |
| `src/components/problemBank/ProblemSelector.tsx` | Create | Multi-select modal for choosing problems from bank (used by assignments) |
| `src/components/problemBank/ProblemDetailModal.tsx` | Create | Full LaTeX render + solution + stats |
| `src/components/problemBank/index.ts` | Create | Barrel exports |
| `app/(teacher)/problem-bank.tsx` | Create | Main problem bank screen |
| `app/(teacher)/_layout.tsx` | Modify | Add problem-bank tab |
| `app/(teacher)/problem-extract.tsx` | Modify | Connect extraction to problem bank (save extracted problems) |
| `app/(teacher)/assignments.tsx` | Modify | Use ProblemSelector to pick from bank |

### Key Design

- **Performance**: ProblemCard shows plain-text summary (LaTeX stripped) -- full LaTeX only in detail modal
- **Fixed height cards**: `CARD_HEIGHT = 120` for `getItemLayout` optimization
- **Selection mode**: Long-press to enter, tap to toggle, bottom bar shows "N selected" with actions
- **Filter logic**: Array filters are OR'd within dimension, AND'd across dimensions
- **FAB menu**: "Direct create" opens ProblemForm; "AI extract" opens existing PdfUploadModal

### Acceptance Criteria

- [ ] `ProblemCard` renders plain-text summary, NOT full LaTeX in the list
- [ ] `ProblemCard` is memo'd and only re-renders on meaningful prop changes
- [ ] `ProblemFilters` supports grade, difficulty, type, topic, and search query filters
- [ ] `ProblemForm` modal creates/edits problems with LaTeX preview toggle
- [ ] `ProblemSelector` modal allows multi-select for assignment creation
- [ ] `problem-bank.tsx` shows virtualized FlatList with filter, search, FAB
- [ ] Long-press enters selection mode; bottom bar shows with "add to assignment" and "delete" actions
- [ ] AI-extracted problems from `problem-extract.tsx` are saved to the problem bank
- [ ] `assignments.tsx` can pick problems from the bank via ProblemSelector
- [ ] `npx expo start --web` runs without errors

---

## SECTION 05: Gemini AI Services

> **Dependencies**: Section 01-03
> **Blocks**: Section 06, 08

### Background

This section creates two new Gemini AI service files:

1. **`src/services/geminiAnalytics.ts`** -- Student weakness analysis, problem recommendations, learning report generation
2. **`src/services/geminiHelper.ts`** -- 3-level hints, step-by-step solutions, similar problem recommendations

Both use the existing `@google/genai` SDK and `EXPO_PUBLIC_GEMINI_API_KEY`.

### Key Design

- **JSON validation**: All Gemini responses are validated against expected schema; retry up to 3 times on parse failure
- **Caching**: Results cached in analyticsStore; re-analysis triggers when submissionCountSinceLastAnalysis >= 5
- **Retry logic**: exponential backoff (1s, 2s, 4s) on API errors
- **Model**: `gemini-2.0-flash` for all calls
- **Temperature**: 0.3 for analysis (deterministic), 0.7 for creative (hints, explanations)

### Files to Create

| File | Description |
|------|-------------|
| `src/services/geminiAnalytics.ts` | `analyzeStudentWeakness()`, `recommendProblems()`, `generateLearningReport()` |
| `src/services/geminiHelper.ts` | `generateHint()`, `generateStepByStepSolution()`, `findSimilarProblems()` |

### Acceptance Criteria

- [ ] `geminiAnalytics.ts` exports `analyzeStudentWeakness()` that returns `WeaknessAnalysis`
- [ ] `geminiAnalytics.ts` exports `recommendProblems()` that returns `ProblemRecommendation[]`
- [ ] `geminiAnalytics.ts` exports `generateLearningReport()` that returns `LearningReport`
- [ ] `geminiHelper.ts` exports `generateHint()` with 3 progressive levels
- [ ] `geminiHelper.ts` exports `generateStepByStepSolution()` with ordered steps
- [ ] `geminiHelper.ts` exports `findSimilarProblems()` that returns similar problems from the bank
- [ ] All functions include JSON validation and retry logic (max 3 retries)
- [ ] All functions gracefully handle API errors and return fallback data
- [ ] `npx tsc --noEmit` passes
- [ ] `npx expo start --web` runs without errors

---

## SECTION 06: Charts & Analytics UI

> **Dependencies**: Section 01-03, 05
> **Blocks**: Section 09

### Background

This section implements the visual analytics layer: four custom SVG chart components using `react-native-svg`, analytics wrapper components, and two screen pages (student analytics and teacher student-analytics).

### Files to Create

| File | Description |
|------|-------------|
| `src/components/charts/RadarChart.tsx` | SVG radar/spider chart for subject scores |
| `src/components/charts/LineChart.tsx` | SVG time-series line chart for weekly scores |
| `src/components/charts/BarChart.tsx` | SVG bar chart for topic breakdown |
| `src/components/charts/HeatMap.tsx` | SVG heatmap for topic x difficulty correct rates |
| `src/components/charts/index.ts` | Barrel exports |
| `src/components/analytics/AnalyticsSummaryCard.tsx` | Overall stats (score, solved, streak) |
| `src/components/analytics/WeakTopicsList.tsx` | AI weak topics with recommendations |
| `src/components/analytics/LearningReportView.tsx` | Full report with all charts + AI summary |
| `app/(student)/analytics.tsx` | Student's own analytics screen |
| `app/(teacher)/student-analytics.tsx` | Teacher view of any student's analytics |

### Acceptance Criteria

- [ ] `RadarChart` renders correctly with 5+ data points as a polygon overlay
- [ ] `LineChart` renders time-series data with axes and dot markers
- [ ] `BarChart` renders labeled bars with values
- [ ] `HeatMap` renders grid cells with color intensity based on value
- [ ] All charts are responsive to container size
- [ ] `AnalyticsSummaryCard` shows overall score, total solved, correct rate, streak
- [ ] `WeakTopicsList` shows AI-identified weak topics with reasons
- [ ] `LearningReportView` combines all charts with AI summary text
- [ ] Student analytics screen loads data from `analyticsStore`
- [ ] Teacher student-analytics screen accepts `studentId` param and shows that student's data
- [ ] "AI Diagnosis" button triggers `triggerManualAnalysis` and shows loading state
- [ ] `npx expo start --web` runs without errors

---

## SECTION 07: Wrong Notes

> **Dependencies**: Section 01-03
> **Blocks**: Section 10

### Background

The Wrong Notes feature automatically collects problems that a student answered incorrectly and provides a structured review system. Mastery requires 3 consecutive correct answers with at least 24 hours between each review.

### Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/wrongNotes/WrongNoteCard.tsx` | Create | Card showing wrong note with status badge |
| `src/components/wrongNotes/ReviewMode.tsx` | Create | Interactive review mode with answer input and result display |
| `src/components/wrongNotes/WrongNoteFilters.tsx` | Create | Filter by status, topic, date range |
| `src/components/wrongNotes/WrongNoteStats.tsx` | Create | Dashboard stats (total, unreviewed, reviewing, mastered) |
| `src/components/wrongNotes/index.ts` | Create | Barrel exports |
| `app/(student)/wrong-notes.tsx` | Create | Main wrong notes screen |

### Key Design

- **Auto-collection**: When submission is graded as incorrect, wrong note is auto-created via subscribe pattern (Section 03)
- **Review mode**: Student re-attempts the problem, checks answer, optionally views AI explanation
- **Mastery tracking**: 3 consecutive correct with >= 24h intervals -> `isLearned = true`
- **AI explanation**: On-demand via `geminiHelper.ts` or `wrongNoteService.getAiExplanation()`

### Acceptance Criteria

- [ ] `WrongNoteCard` displays problem summary, student/correct answers, status badge
- [ ] `ReviewMode` allows answer input, shows correct/incorrect result, shows AI explanation
- [ ] Wrong notes are filterable by status (unreviewed/reviewing/mastered), topic, date
- [ ] Stats dashboard shows total, unreviewed, reviewing, mastered counts
- [ ] `wrong-notes.tsx` screen has a working review mode flow
- [ ] Mastery logic works: 3 consecutive correct with 24h gaps marks as learned
- [ ] AI explanation is fetched on demand and cached on the wrong note
- [ ] `npx expo start --web` runs without errors

---

## SECTION 08: AI Helper

> **Dependencies**: Section 01-03, 04, 05
> **Blocks**: Section 10

### Background

This section implements 3 AI helper features integrated into the student's solve screen:
1. **3-level progressive hints**: Approach -> Key formula -> First step
2. **Step-by-step solution**: Accordion-style expandable steps
3. **Similar problem recommendations**: From the problem bank

### Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/aiHelper.ts` | Create | Hint, StepByStep, SimilarProblem types |
| `src/components/aiHelper/HintButton.tsx` | Create | Progressive hint reveal button |
| `src/components/aiHelper/StepByStepSolution.tsx` | Create | Accordion step-by-step view |
| `src/components/aiHelper/SimilarProblems.tsx` | Create | Similar problem cards (reuses ProblemCard) |
| `src/components/aiHelper/AIHelperPanel.tsx` | Create | Container panel with tabs for all 3 features |
| `src/components/aiHelper/index.ts` | Create | Barrel exports |
| `app/(student)/solve.tsx` | Modify | Integrate AIHelperPanel into problem footer |

### Acceptance Criteria

- [ ] `HintButton` progressively reveals 3 hint levels (not all at once)
- [ ] `StepByStepSolution` shows steps in accordion format, expandable one at a time
- [ ] `SimilarProblems` shows related problems from the bank using ProblemCard
- [ ] `AIHelperPanel` has tab navigation between hints, solution, and similar problems
- [ ] All AI calls use `geminiHelper.ts` service functions
- [ ] Loading states shown during AI API calls
- [ ] Error states handled gracefully with retry option
- [ ] `solve.tsx` has AI helper integrated in the problem section footer
- [ ] `npx expo start --web` runs without errors

---

## SECTION 09: Parent Dashboard

> **Dependencies**: Section 01-03, 06
> **Blocks**: Section 10

### Background

This section implements the parent-facing screens: a dashboard showing children's learning status, class schedule, and AI-generated learning reports. Parent-friendly design with minimal math jargon.

### Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `app/(parent)/_layout.tsx` | Create | Bottom Tab with 3 tabs: Home, Schedule, Report |
| `app/(parent)/index.tsx` | Create | Child dashboard with stats, recent assignments, weak topics, AI advice |
| `app/(parent)/schedule.tsx` | Create | Weekly class schedule + upcoming deadlines |
| `app/(parent)/report.tsx` | Create | Full learning report with charts (reuses Section 06 chart components) |
| `src/components/parent/ChildSelector.tsx` | Create | Multi-child selector (for parents with multiple children) |
| `src/components/parent/ScheduleCalendar.tsx` | Create | Weekly calendar view |
| `src/components/parent/ParentReportCard.tsx` | Create | Learning summary card |
| `app/index.tsx` | Modify | Add parent role routing to `/(parent)` |

### Acceptance Criteria

- [ ] `parent@test.com` / `123456` login routes to `/(parent)` group
- [ ] Bottom tab shows 3 tabs: Home (icon: home), Schedule (icon: calendar), Report (icon: chart)
- [ ] `ChildSelector` shows when parent has multiple children, auto-selects if only one
- [ ] Dashboard shows child's stats: total solved, correct rate, streak, weekly study minutes
- [ ] Dashboard shows recent assignments with progress
- [ ] Dashboard shows AI-generated advice
- [ ] Schedule screen shows weekly class timetable
- [ ] Schedule screen shows upcoming assignment deadlines
- [ ] Report screen shows RadarChart, LineChart, and AI summary
- [ ] Report screen reuses chart components from Section 06
- [ ] `npx expo start --web` runs without errors

---

## SECTION 10: Integration & Navigation

> **Dependencies**: ALL previous sections (01-09)

### Background

This is the final integration section. It wires together all isolated modules into a cohesive application: routing, navigation, data flow connections, and store subscriptions.

### Requirements

1. Parent role users routed to `/(parent)` after login/splash.
2. Teacher dashboard shows "Problem Bank" and "Student Analytics" quick-action buttons.
3. Teacher students list allows tap-to-navigate to student analytics.
4. Student tab bar shows 5 tabs: Home, Homework, Wrong Notes, Materials, My Info.
5. Student homework screen shows "AI Learning Analysis" entry point.
6. Incorrect submission -> automatic wrong note creation.
7. Submission accumulation triggers analytics recalculation.
8. Parent dashboard reads linked child's analytics data.

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `app/index.tsx` | Modify | Add parent role routing |
| `app/(teacher)/_layout.tsx` | Modify | Ensure problem-bank and student-analytics are accessible |
| `app/(teacher)/index.tsx` | Modify | Add quick-action buttons to dashboard |
| `app/(teacher)/students.tsx` | Modify | Add tap-to-navigate to student analytics |
| `app/(student)/_layout.tsx` | Modify | Add wrong-notes tab (5th tab) |
| `app/(student)/homework.tsx` | Modify | Add AI analysis entry point |
| `app/_layout.tsx` | Modify | Initialize store subscriptions |

### Key Changes

- Root `_layout.tsx` calls `initializeStoreSubscriptions()` on mount
- `app/index.tsx` adds `else if (user.role === 'parent')` routing branch
- Student layout adds 5th tab for wrong-notes/analytics
- Teacher dashboard adds navigation buttons to problem-bank and student-analytics screens

### Acceptance Criteria

- [ ] Parent login routes to `/(parent)` screens
- [ ] Teacher dashboard has "Problem Bank" button that navigates to problem-bank screen
- [ ] Teacher dashboard has "Student Analytics" button
- [ ] Teacher students list: tapping a student navigates to student-analytics with studentId
- [ ] Student tab bar shows 5 tabs
- [ ] Student homework screen has "AI Learning Analysis" button
- [ ] `initializeStoreSubscriptions()` is called in root layout
- [ ] Incorrect submission automatically creates wrong note entry
- [ ] All navigation works without crashes
- [ ] All screens render correctly
- [ ] No circular dependency errors
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx expo start --web` runs without errors

---

## Important Implementation References

For complete code listings (full file contents with all TypeScript code), refer to the section files:

- `planning/sections/section-01-types-and-interfaces.md` -- Complete type definitions and service interface code
- `planning/sections/section-02-mock-data-and-services.md` -- Full mock data with 108 LaTeX problems, mock service implementations
- `planning/sections/section-03-zustand-stores.md` -- Complete store code for all 7 stores
- `planning/sections/section-04-problem-bank-ui.md` -- Full React Native component code for problem bank
- `planning/sections/section-05-gemini-ai-services.md` -- Complete Gemini API integration code
- `planning/sections/section-06-charts-and-analytics-ui.md` -- Full SVG chart component code
- `planning/sections/section-07-wrong-notes.md` -- Complete wrong notes UI code
- `planning/sections/section-08-ai-helper.md` -- Full AI helper component code
- `planning/sections/section-09-parent-dashboard.md` -- Complete parent dashboard code
- `planning/sections/section-10-integration.md` -- All integration modifications

**Each section file contains the COMPLETE implementation code.** When implementing a section, read the corresponding file for full code listings that you can use directly.

---

## Completion Signal

When all 10 sections are implemented and all acceptance criteria are verified:

<promise>ALL-SECTIONS-COMPLETE</promise>
