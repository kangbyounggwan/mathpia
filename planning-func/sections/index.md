# Section Index: Mathpia Functional Enhancement

> **Source Plan**: `planning-func/claude-plan.md`
> **Total Sections**: 10
> **Estimated Timeline**: 12-14 days

---

<!-- SECTION_MANIFEST
section-01-supabase-schema.md
section-02-supabase-client.md
section-03-auth-migration.md
section-04-supabase-services.md
section-05-gemini-extraction.md
section-06-screen-store-connection.md
section-07-assignment-creation.md
section-08-problem-solving.md
section-09-grading-flow.md
section-10-testing-polish.md
END_SECTION_MANIFEST -->

## Dependency Graph

```
Section 1 (DB Schema)
  └── Section 2 (Client Integration)
       └── Section 3 (Auth Migration)
            └── Section 4 (Supabase Services)
                 ├── Section 5 (Gemini Extraction) [can parallelize with 6]
                 ├── Section 6 (Screen-Store Connection + Dashboards)
                 │    └── Section 7 (Assignment Creation)
                 │         └── Section 8 (Problem Solving + Submission)
                 │              └── Section 9 (Grading Flow)
                 └── Section 10 (Testing & Polish) [after all above]
```

## Section Summary

| # | Section | Dependencies | Estimated Effort | Priority |
|---|---------|-------------|-----------------|----------|
| 1 | Supabase Project Setup + DB Schema + RLS | None | 1 day | CRITICAL |
| 2 | Supabase Client Integration in Expo | Section 1 | 2-3 hours | CRITICAL |
| 3 | Auth Migration (Mock → Supabase Auth) | Section 2 | 1 day | CRITICAL |
| 4 | Supabase Service Implementations | Sections 2, 3 | 2-3 days | CRITICAL |
| 5 | Gemini AI - PDF/Photo Problem Extraction | Section 4 | 1 day | HIGH |
| 6 | Screen-Store Connection + Dashboard Data Integration | Sections 3, 4 | 2 days | HIGH |
| 7 | Assignment Creation Flow (Teacher) | Sections 4, 5, 6 | 1 day | HIGH |
| 8 | Problem Solving + Submission Flow (Student) | Sections 4, 7 | 1-1.5 days | HIGH |
| 9 | Grading Flow (Teacher) | Sections 4, 8 | 1 day | HIGH |
| 10 | Testing & Polish | All (1-9) | 1-2 days | HIGH |

## Parallelization Notes

- **Sections 5 and 6 can run in parallel** after Section 4 is complete
- Section 5 (Gemini) only needs Section 4 for the "save to problem bank" feature; the extraction UI and API integration are independent
- Section 6 (screen-store wiring) is independent of Section 5

## 1-Week Minimum Viable Demo Path

If only 1 week available, prioritize:
- Sections 1-4: Real auth + real data storage (Days 1-5)
- Section 5: Gemini PDF extraction - the "wow" feature (Day 6)
- Sections 7-9 simplified: Basic assignment→solve→grade flow (Day 7)
- Skip: Full screen-store connections (Section 6), analytics, wrong notes, parent services use mock

## Key Technical Decisions (from plan)

1. **Service Factory Pattern**: Stores remain unchanged; only `src/services/index.ts` swaps mock→supabase implementations
2. **Date fields**: Use ISO string format (not Date objects) to avoid Zustand persist serialization issues
3. **Assignment creation**: Transactional via `create_assignment_with_details()` RPC function
4. **Private storage**: Use `createSignedUrl()` (1-hour expiry) for canvas submission images
5. **RLS helper**: `get_my_academy_id()` SECURITY DEFINER function avoids circular profiles RLS
6. **File size limit**: 10MB max for Gemini inline extraction; Gemini File API for larger files (post-demo)
7. **Fallback**: `USE_SUPABASE` env var toggle; mixed mock/real services supported
