# Integration Notes: External Review Feedback

> **Date**: 2026-04-04
> **Reviews analyzed**: gemini-review.md, codex-review.md

---

## Changes INTEGRATED into claude-plan.md

### 1. Add `'parent'` to `user_role` ENUM (CRITICAL)
- **Source**: Codex Review (Critical), Gemini Review (Issue #8)
- **Reason**: TypeScript has `'parent'` role but SQL ENUM doesn't. Parent signup would fail.
- **Change**: Update Migration 001 to include `'parent'` in the ENUM.

### 2. Fix `handle_new_user` trigger to include `academy_id` (CRITICAL)
- **Source**: Gemini Review (Issue #5)
- **Reason**: Without `academy_id` in the profile, all RLS policies fail after registration.
- **Change**: Update trigger SQL to read `academy_id` from `raw_user_meta_data`.

### 3. Make assignment creation transactional via RPC (CRITICAL)
- **Source**: Gemini Review (Issue #3), Codex Review (High Risk #1)
- **Reason**: Three separate inserts without transaction = partial failures = orphaned data.
- **Change**: Add `create_assignment_with_details()` RPC function in Section 1, call it in Section 4.

### 4. Add Gemini file size check (CRITICAL)
- **Source**: Gemini Review (Issue #4), Codex Review (Medium Risk #9)
- **Reason**: Korean math PDFs 5-50MB, Gemini inline limit 20MB, OOM risk on tablets.
- **Change**: Add 10MB file size limit check in Section 5 before extraction. Note Gemini File API as alternative for larger files.

### 5. Use `createSignedUrl` for private storage (HIGH)
- **Source**: Gemini Review (Issue #10), Codex Review (High Risk #4, Suggestion #4)
- **Reason**: `getPublicUrl()` on private bucket returns 403. Canvas images won't display.
- **Change**: Update Section 8 and 9 to use `createSignedUrl()` with 1-hour expiry.

### 6. Resolve `Date` vs `string` type issue (HIGH)
- **Source**: Codex Review (High Risk #2, Suggestion #2)
- **Reason**: Zustand persist serializes Date to string, breaks `.toLocaleDateString()` after rehydration.
- **Change**: Add preparatory note in Section 2 to change date fields to ISO strings before starting service implementations. Add `formatDate` utility.

### 7. Add `isCorrect` logic to grading flow (HIGH)
- **Source**: Codex Review (Suggestion #5)
- **Reason**: Without `isCorrect`, wrong-note auto-generation trigger never fires.
- **Change**: Add `isCorrect` determination in Section 9 grading flow.

### 8. Fix sort field name mapping (HIGH)
- **Source**: Codex Review (Medium Risk #6)
- **Reason**: `ProblemBankSortField` uses camelCase but Supabase `.order()` expects snake_case.
- **Change**: Add sort field mapper in Section 4 mappers.ts.

### 9. Add auth initialization loading gate (HIGH)
- **Source**: Codex Review (Suggestion #6)
- **Reason**: Flash of unauthenticated state on app restart before `initializeAuth()` completes.
- **Change**: Add splash screen gate in Section 3.

### 10. Fix `sync_grading_score` trigger premature status (IMPORTANT)
- **Source**: Gemini Review (Issue #6)
- **Reason**: Status set to 'graded' after first problem grading, not when all are graded.
- **Change**: Add conditional status check in trigger SQL (Section 1, Migration 004).

### 11. Use RLS helper function for academy membership (IMPORTANT)
- **Source**: Gemini Review (Issue #2)
- **Reason**: Self-referencing RLS on `profiles` table creates circular dependency.
- **Change**: Add `get_my_academy_id()` SECURITY DEFINER function in Migration 001.

### 12. Add `parent_children` table (IMPORTANT)
- **Source**: Gemini Review (Issue #8)
- **Reason**: No parent-child relationship table = parent role cannot query child data.
- **Change**: Add `parent_children` table in Migration 002 with RLS policies.

### 13. Env var validation on startup (MINOR → INTEGRATED)
- **Source**: Gemini Review (Issue #12)
- **Change**: Add startup check in `src/lib/supabase.ts` instead of non-null assertions.

### 14. Seed users via TypeScript script, not SQL (MINOR → INTEGRATED)
- **Source**: Gemini Review (Issue #13)
- **Change**: Note that user seeding must use Supabase Auth API, add `scripts/seed.ts` to file list.

### 15. Merge Sections 6 and 10 (STRUCTURAL)
- **Source**: Codex Review, Gemini Review
- **Reason**: Both sections do "connect screens to stores." Redundant separation.
- **Change**: Merge Section 10 content into Section 6. Renumber subsequent sections.

### 16. Strip `canvasData` from persisted submissions (MEDIUM)
- **Source**: Codex Review (Suggestion #7)
- **Reason**: AsyncStorage 6MB limit; canvas data bloats persistence.
- **Change**: Add note in Section 8 to strip canvasData from persist partialize.

### 17. Add store hydration guard (MEDIUM)
- **Source**: Codex Review (Missing #5)
- **Reason**: Screens show empty lists during async rehydration.
- **Change**: Add note about `persist.hasHydrated()` check pattern.

---

## Suggestions NOT INTEGRATED (and why)

### 1. Supabase CLI migration approach
- **Source**: Gemini Review (Issue #1)
- **Why not**: The team is developing on Windows where Docker-based local Supabase is problematic. The dashboard SQL Editor approach is pragmatic for a 1-2 week demo. The migration files are kept on disk for documentation and repeatability, even if applied manually. We note this as tech debt.

### 2. Column aliases in `.select()` instead of mappers
- **Source**: Codex Review (Suggestion #3)
- **Why not**: Column aliases don't work for nested joins, and inconsistent approaches (aliases for simple queries, mappers for complex queries) create more confusion than a consistent mapper approach. A generic bidirectional mapper utility IS adopted though.

### 3. Offline/optimistic update strategy
- **Source**: Both reviews
- **Why not**: This is a demo/prototype with a 1-2 week timeline. Offline support is a significant feature that would take 2-3 additional days. Local canvas auto-save is noted as a nice-to-have in Section 8 but not required.

### 4. Realtime subscriptions
- **Source**: Gemini Review (Missing #6)
- **Why not**: Not in scope for the demo. Pull-to-refresh is sufficient.

### 5. Korean text search with pg_trgm
- **Source**: Gemini Review (Missing #7)
- **Why not**: ILIKE is sufficient for demo. Production optimization deferred.

### 6. Error boundary components
- **Source**: Gemini Review (Missing in Section 11)
- **Why not**: Nice-to-have but not critical for a controlled demo environment.

### 7. Monitoring/logging (Sentry, etc.)
- **Source**: Gemini Review (Missing #9)
- **Why not**: Out of scope for demo prototype.

### 8. Splitting `IAssignmentService` into separate interfaces
- **Source**: Both reviews
- **Why not**: The interface already exists and stores reference it. Splitting it now means changing store imports and service factory types. Noted as tech debt for post-demo refactor.

### 9. Verify Skia installation
- **Source**: Codex Review (Missing #4)
- **Why not**: Rather than investigating in the plan, this will be verified at implementation time. If Skia is missing, Section 8 will handle installation as a prerequisite step. The plan already notes Skia as a dependency.

### 10. Per-service toggles for incremental migration
- **Source**: Gemini Review (Section 4 feedback)
- **Why not**: The existing `USE_SUPABASE` boolean toggle with mixed services in the 1-week path already covers this. Per-service env vars would be over-engineering for a demo.
