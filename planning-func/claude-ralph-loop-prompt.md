# Mathpia Functional Enhancement — Autonomous Implementation Prompt

## Mission

Implement the Mathpia math academy tablet app functional enhancement. This involves migrating from mock data to a real Supabase backend, integrating Gemini AI for PDF/photo problem extraction, and connecting all screens to real data stores.

Execute each section in dependency order, verifying acceptance criteria before moving to the next.

---

## Planning Directory

All planning files are in `planning-func/`:
- `claude-plan.md` — Full implementation plan
- `sections/index.md` — Section index with dependency graph
- `sections/section-01-supabase-schema.md` through `section-10-testing-polish.md` — Self-contained section files

---

## Section Index

### Dependency Graph

```
Section 1 (DB Schema) — no dependencies
  └── Section 2 (Client Integration) — requires: 1
       └── Section 3 (Auth Migration) — requires: 2
            └── Section 4 (Supabase Services) — requires: 2, 3
                 ├── Section 5 (Gemini Extraction) — requires: 4 [CAN PARALLEL with 6]
                 ├── Section 6 (Screen-Store Connection) — requires: 3, 4
                 │    └── Section 7 (Assignment Creation) — requires: 4, 5, 6
                 │         └── Section 8 (Problem Solving) — requires: 4, 7
                 │              └── Section 9 (Grading) — requires: 4, 8
                 └── Section 10 (Testing & Polish) — requires: ALL (1-9)
```

### Section Manifest

| # | File | Estimated Effort |
|---|------|-----------------|
| 1 | `planning-func/sections/section-01-supabase-schema.md` | 1 day |
| 2 | `planning-func/sections/section-02-supabase-client.md` | 2-3 hours |
| 3 | `planning-func/sections/section-03-auth-migration.md` | 1 day |
| 4 | `planning-func/sections/section-04-supabase-services.md` | 2-3 days |
| 5 | `planning-func/sections/section-05-gemini-extraction.md` | 1 day |
| 6 | `planning-func/sections/section-06-screen-store-connection.md` | 2 days |
| 7 | `planning-func/sections/section-07-assignment-creation.md` | 1 day |
| 8 | `planning-func/sections/section-08-problem-solving.md` | 1-1.5 days |
| 9 | `planning-func/sections/section-09-grading-flow.md` | 1 day |
| 10 | `planning-func/sections/section-10-testing-polish.md` | 1-2 days |

---

## Execution Rules

### For Each Section:

1. **Read the section file** — Each section is COMPLETELY SELF-CONTAINED with background, requirements, implementation details, code examples, file lists, and acceptance criteria.

2. **Implement all steps** — Follow the implementation details in order. Use the provided code examples as templates, adapting them to the actual codebase state.

3. **Verify acceptance criteria** — Every section ends with checkbox acceptance criteria. Verify each one before proceeding.

4. **Run TypeScript check** — After completing each section, run `npx tsc --noEmit` to verify no type errors were introduced.

5. **If a step fails** — Debug and fix before proceeding. Do not skip steps. If blocked, document the blocker and proceed to the next independent section if possible.

### Critical Rules:

- **DO NOT modify existing type interfaces** (`src/types/*.ts`) unless the section explicitly instructs you to
- **DO NOT modify existing store structures** (`src/stores/*.ts`) unless the section explicitly instructs you to
- **DO NOT modify existing service interfaces** (`src/services/interfaces/*.ts`) unless explicitly stated
- **Existing mock services** (`src/services/mock/`) must remain intact as fallback
- **Follow existing code patterns** — Check neighboring files for style, import patterns, and naming conventions
- **Korean text** — All user-facing strings should be in Korean (한국어)
- **Date fields** — Use ISO string format (not Date objects) per Section 2 preparatory note

### Key Architecture Points:

1. **Service Factory Pattern**: `src/services/index.ts` returns either mock or Supabase implementations. Stores call service methods through this factory. Implementing Supabase services makes stores work with real data WITHOUT changing store code.

2. **Zustand Stores**: 7 stores in `src/stores/` already have full CRUD methods that call service interfaces. They persist to AsyncStorage via `zustand/middleware`.

3. **File-Based Routing**: `app/` directory uses expo-router. Screens are organized by role: `(teacher)/`, `(student)/`, `(parent)/`, `(auth)/`.

4. **Supabase Integration**: Auth + PostgreSQL + Storage. RLS policies enforce data isolation per academy and role.

5. **Gemini AI**: `@google/genai` (Gemini 2.5 Flash) for PDF/photo problem extraction. Existing service in `src/services/geminiService.ts`.

---

## Section 1: Supabase Project Setup + DB Schema + RLS

**Read**: `planning-func/sections/section-01-supabase-schema.md`

**Summary**: Create Supabase project, apply database schema (17 tables + parent_children, ENUMs including 'parent', RLS policies, triggers including handle_new_user with academy_id, create_assignment_with_details RPC, fixed sync_grading_score), storage buckets, and seed data.

**NOTE**: This section requires manual Supabase project creation. The implementer must:
1. Create a project at https://supabase.com
2. Copy URL and anon key to `.env`
3. Execute SQL migrations in the SQL Editor
4. Create demo users via Auth API (not SQL INSERT)

---

## Section 2: Supabase Client Integration in Expo

**Read**: `planning-func/sections/section-02-supabase-client.md`

**Summary**: Install @supabase/supabase-js, create typed client with env var validation, generate TypeScript types, add URL polyfill, verify connectivity. IMPORTANT: Change all Date fields to ISO strings (preparatory step for Section 4).

---

## Section 3: Auth Migration (Mock → Supabase Auth)

**Read**: `planning-func/sections/section-03-auth-migration.md`

**Summary**: Replace mock auth in authStore.ts with Supabase Auth (signInWithPassword, signUp, signOut, getSession). Add auth state listener in _layout.tsx. Add splash screen loading gate. Update login/register screens.

---

## Section 4: Supabase Service Implementations

**Read**: `planning-func/sections/section-04-supabase-services.md`

**Summary**: Create Supabase implementations for all 5 service interfaces. Generic column mapper utility. Sort field mapper (camelCase→snake_case). Use RPC for assignment creation. Add isCorrect in grading. Switch service factory.

**This is the LARGEST section** (2-3 days). Key files:
- `src/services/supabase/mappers.ts`
- `src/services/supabase/supabaseProblemBankService.ts`
- `src/services/supabase/supabaseAssignmentService.ts`
- `src/services/supabase/supabaseAnalyticsService.ts`
- `src/services/supabase/supabaseWrongNoteService.ts`
- `src/services/supabase/supabaseParentService.ts`
- `src/services/supabase/index.ts`
- `src/services/index.ts` (modify factory)

---

## Section 5: Gemini AI - PDF/Photo Problem Extraction

**Read**: `planning-func/sections/section-05-gemini-extraction.md`

**Summary**: File size check (10MB limit), PDF upload via expo-document-picker, camera capture via expo-image-picker, loading UI during extraction, save extracted problems to problem bank.

---

## Section 6: Screen-Store Connection + Dashboard Data Integration

**Read**: `planning-func/sections/section-06-screen-store-connection.md`

**Summary**: Replace hardcoded mock data in ALL 11+ screen files with store data. Add useEffect fetches, useMemo computations, loading states, empty states. Connect dashboards to real queries. Store hydration guard.

---

## Section 7: Assignment Creation Flow (Teacher)

**Read**: `planning-func/sections/section-07-assignment-creation.md`

**Summary**: Assignment creation form, problem selection from bank (multi-select), student selection, transactional creation via RPC, publish flow.

---

## Section 8: Problem Solving + Submission Flow (Student)

**Read**: `planning-func/sections/section-08-problem-solving.md`

**Summary**: Homework list from store, solve screen with LaTeX problems, canvas drawing (verify Skia!), answer submission with Storage upload (createSignedUrl, NOT getPublicUrl), timer, progress tracking. Strip canvasData from persist.

---

## Section 9: Grading Flow (Teacher)

**Read**: `planning-func/sections/section-09-grading-flow.md`

**Summary**: Grading list, student submission view, individual problem grading UI, auto-grading for multiple choice, set isCorrect field, signed URLs for canvas images, feedback.

---

## Section 10: Testing & Polish

**Read**: `planning-func/sections/section-10-testing-polish.md`

**Summary**: 14-step end-to-end demo script, error handling verification, polish items (loading states, empty states, pull-to-refresh), AsyncStorage migration step, verify Skia installation, remove unused packages.

---

## Completion

When ALL 10 sections are implemented and ALL acceptance criteria verified:

<promise>ALL-SECTIONS-COMPLETE</promise>
