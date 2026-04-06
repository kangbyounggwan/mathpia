# Mathpia Functional Enhancement PRD

## How to Use
```bash
ralphy --prd planning-func/claude-ralphy-prd.md
# Or: cp planning-func/claude-ralphy-prd.md ./PRD.md && ralphy
```

## Context

This PRD implements the Mathpia math academy tablet app functional enhancement — migrating from mock data to a real Supabase backend with Gemini AI integration.

**Planning directory**: `planning-func/`
**Section index**: `planning-func/sections/index.md`
**Full plan**: `planning-func/claude-plan.md`

Each section file in `planning-func/sections/` is **self-contained** with full implementation details, code examples, file lists, and acceptance criteria. The implementer does NOT need to read the full plan — each section file has everything needed.

## Key Architecture

- **Service Factory Pattern**: Stores remain unchanged; only `src/services/index.ts` swaps mock→supabase implementations
- **Existing stores** call service interfaces (e.g., `services.assignment.create()`) — implementing Supabase services makes everything work automatically
- **Fallback**: `USE_SUPABASE` env var toggle to switch between mock and real services

## Dependency Graph

```
Section 1 (DB Schema)
  └── Section 2 (Client)
       └── Section 3 (Auth)
            └── Section 4 (Services)
                 ├── Section 5 (Gemini) [parallel with 6]
                 ├── Section 6 (Screen-Store)
                 │    └── Section 7 (Assignment Creation)
                 │         └── Section 8 (Problem Solving)
                 │              └── Section 9 (Grading)
                 └── Section 10 (Testing) [after all]
```

## Implementation Sections

Read `planning-func/sections/index.md` for the full dependency graph and timeline.

### Task List

- [ ] Section 01: Supabase Project Setup + DB Schema + RLS (`planning-func/sections/section-01-supabase-schema.md`)
- [ ] Section 02: Supabase Client Integration in Expo (`planning-func/sections/section-02-supabase-client.md`)
- [ ] Section 03: Auth Migration - Mock → Supabase Auth (`planning-func/sections/section-03-auth-migration.md`)
- [ ] Section 04: Supabase Service Implementations (`planning-func/sections/section-04-supabase-services.md`)
- [ ] Section 05: Gemini AI - PDF/Photo Problem Extraction (`planning-func/sections/section-05-gemini-extraction.md`)
- [ ] Section 06: Screen-Store Connection + Dashboard Data Integration (`planning-func/sections/section-06-screen-store-connection.md`)
- [ ] Section 07: Assignment Creation Flow - Teacher (`planning-func/sections/section-07-assignment-creation.md`)
- [ ] Section 08: Problem Solving + Submission Flow - Student (`planning-func/sections/section-08-problem-solving.md`)
- [ ] Section 09: Grading Flow - Teacher (`planning-func/sections/section-09-grading-flow.md`)
- [ ] Section 10: Testing & Polish (`planning-func/sections/section-10-testing-polish.md`)

### Execution Notes

1. Execute sections in dependency order (see graph above)
2. Sections 5 and 6 can run in parallel after Section 4
3. Each section file is self-contained with all details needed
4. Verify ALL acceptance criteria (checkboxes) before moving to the next section
5. Run `npx tsc --noEmit` after each section to check TypeScript compilation
6. Do NOT modify existing type interfaces or store structures unless explicitly stated
7. Section 1 requires manual Supabase project creation via the web dashboard
