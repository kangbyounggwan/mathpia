# Gemini Review: Mathpia Implementation Plan

> **Reviewer**: Simulated Google Gemini perspective
> **Date**: 2026-04-04
> **Document reviewed**: `planning-func/claude-plan.md`
> **Supporting documents reviewed**: `DATABASE_SCHEMA.md`, all service interfaces, stores, `geminiService.ts`, `geminiUtils.ts`, `package.json`

---

## Overall Assessment

This is a well-structured, professionally written implementation plan that demonstrates a thorough understanding of the existing codebase. The service factory pattern was a smart architectural decision made early, and the plan correctly identifies it as the critical lever for migrating from mock to real data without touching store logic. The section-by-section breakdown, file inventories, acceptance criteria, and fallback strategy are all above average for a plan of this scope.

That said, the plan has several gaps that range from "will cause frustrating debugging sessions" to "could silently corrupt data in production." The most concerning are: (1) the schema migration approach bypasses Supabase CLI entirely, losing repeatability and version control; (2) several RLS policies have logical conflicts that will cause silent permission failures; (3) the Gemini integration has unaddressed file size limits that will fail on real Korean math textbook PDFs; and (4) the assignment creation flow in Section 4 has a non-transactional multi-table insert that is a race condition waiting to happen. The 2-week timeline is tight but achievable for a demo, provided the critical issues below are addressed early.

---

## Strengths

- **Service factory pattern is excellent.** The existing `src/services/index.ts` design means the migration is genuinely a swap, not a rewrite. The plan correctly identifies that stores do not need to change. This is the strongest architectural decision in the project.
- **Detailed code examples.** Every section includes concrete TypeScript and SQL with realistic column names and realistic Korean text. This is not a hand-wavy plan; an implementer could copy-paste and adjust.
- **Correct dependency ordering.** The section dependencies are accurate, and the plan explicitly calls out that Section 1 is the foundation with no dependencies. The 1-week minimum viable demo cutdown is pragmatic and well-prioritized.
- **Fallback strategy is realistic.** Keeping mock services as a fallback and supporting a mixed `services` object (some real, some mock) is smart for a demo. The `USE_SUPABASE` toggle based on env var is clean.
- **Korean localization awareness.** Error messages, ENUM values, and UI text are consistently in Korean. The plan does not treat localization as an afterthought.
- **Acceptance criteria are testable.** Each section ends with concrete, checkbox-style criteria that a QA pass could verify. This is unusually thorough for an AI-generated plan.
- **Existing Gemini infrastructure is solid.** The `geminiUtils.ts` retry logic, JSON parsing, LaTeX normalization, and schema validation are well-implemented. The plan correctly identifies this as "mostly done" and focuses on wiring, not rewriting.
- **Good identification of what works vs. what does not.** The "What Works Today" / "What Does NOT Work Today" table is honest and accurate based on my review of the actual source files.

---

## Concerns & Suggestions

### Critical Issues

#### 1. Schema Migration: Raw SQL in Dashboard vs. Supabase CLI Migrations

**Problem**: The plan says to execute SQL in "Supabase Dashboard > SQL Editor" (Step 1.2). It also creates files under `supabase/migrations/001_*.sql` through `006_*.sql`, but never explains how these files are applied. There is no `supabase init`, no `supabase db push`, no `supabase migration up`. The migration files exist on disk but are never used by the Supabase CLI toolchain.

**Why this matters**:
- Executing SQL manually in the dashboard is not repeatable. If you need to tear down and recreate the project (common during development), you have to re-run everything by hand.
- There is no migration state tracking. Supabase CLI tracks which migrations have been applied via `supabase_migrations.schema_migrations`. Without it, you cannot safely add `007_add_column.sql` later.
- The seed file (`supabase/seed.sql`) cannot be applied via `supabase db reset` without proper CLI setup.
- For a team of even 2 people, manual SQL execution in a dashboard will lead to schema drift within days.

**Suggestion**: Add a `supabase init` step. Use `supabase db push` (for remote) or `supabase migration up` (for local dev with Docker). If the team cannot run Docker (which is common on Windows development machines), explicitly document the "copy-paste into SQL Editor" approach as a workaround, but acknowledge the tradeoff.

#### 2. RLS Policy Conflicts: Overlapping SELECT Policies on `profiles`

**Problem**: The `profiles` table has two SELECT policies:
```sql
-- Policy 1: "Users can view own profile"
USING (id = auth.uid());

-- Policy 2: "Academy members can view each other"
USING (academy_id IN (SELECT academy_id FROM profiles WHERE id = auth.uid()));
```

These work correctly because Supabase ORs multiple SELECT policies together. However, **Policy 2 has a self-referencing subquery**: it queries `profiles` to check `academy_id`, but the query itself is subject to RLS on `profiles`. This creates a circular dependency.

**Why this matters**: In PostgreSQL with RLS enabled, a policy that queries the same table it protects can cause infinite recursion or empty results, depending on the execution plan. Supabase mitigates this in some cases but not all. If a user has `academy_id = NULL` (which the `handle_new_user` trigger allows, since `academy_id` is not set in the trigger), Policy 2 will return no rows, and the user can only see their own profile.

**Suggestion**: Mark the `handle_new_user` trigger function as `SECURITY DEFINER` (it already is) and ensure it sets `academy_id` from `raw_user_meta_data`. Alternatively, use a helper function marked `SECURITY DEFINER` for the academy membership check to avoid the self-referencing RLS issue:

```sql
CREATE OR REPLACE FUNCTION get_my_academy_id()
RETURNS UUID AS $$
  SELECT academy_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

Then use `academy_id = get_my_academy_id()` in policies instead of the subquery.

#### 3. Non-Transactional Multi-Table Insert in Assignment Creation

**Problem**: In Section 4, `supabaseAssignmentService.create()` does three separate inserts:
1. `INSERT INTO assignments`
2. `INSERT INTO assignment_problems`
3. `INSERT INTO assignment_students`

These are three independent Supabase client calls. If step 2 fails (e.g., a `problem_id` does not exist), you are left with an assignment row that has no problems.

**Why this matters**: This is a data consistency issue. The `notify_assignment` trigger fires on step 3, so students could be notified about an assignment that has no problems. Worse, if step 3 fails, the teacher sees a "success" message but no students are assigned.

**Suggestion**: Wrap the three inserts in an `rpc` call to a PostgreSQL function that performs them inside a single transaction:

```sql
CREATE OR REPLACE FUNCTION create_assignment_with_details(
  p_assignment JSONB,
  p_problems JSONB,
  p_student_ids UUID[]
) RETURNS UUID AS $$
DECLARE
  assignment_id UUID;
BEGIN
  INSERT INTO assignments (...) VALUES (...) RETURNING id INTO assignment_id;
  INSERT INTO assignment_problems SELECT ... FROM jsonb_array_elements(p_problems);
  INSERT INTO assignment_students SELECT assignment_id, unnest(p_student_ids);
  RETURN assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

For the demo, the current approach will probably work, but document this as tech debt.

#### 4. Gemini Vision API: Base64 File Size Limit for PDFs

**Problem**: The `geminiService.ts` reads the entire file as base64 via `readFileAsBase64()` and sends it as `inlineData`. The Gemini API has a **20 MB limit for inline data** and a **per-request payload limit**. Korean math textbook PDFs are commonly 5-50 MB. A 10 MB PDF becomes ~13.3 MB in base64 encoding.

Furthermore, `expo-file-system`'s `readAsStringAsync` with `encoding: 'base64'` loads the entire file into memory as a JavaScript string. On a tablet with limited memory, a 20 MB PDF converted to ~27 MB base64 string can cause an OOM crash.

**Why this matters**: The plan says "PDF 크기에 따라 10-30초 소요될 수 있습니다" but does not mention that large PDFs will fail outright. The very first real-world test with a Korean math textbook will likely hit this limit.

**Suggestion**:
- Add a file size check before extraction: reject files > 10 MB with a user-friendly message ("PDF가 너무 큽니다. 10MB 이하 파일을 사용해주세요").
- For larger PDFs, consider using the Gemini File API (`ai.files.upload()`) instead of inline data. The File API supports up to 2 GB and does not require base64 encoding.
- Alternatively, extract individual pages using a PDF library and send pages one at a time.

#### 5. `handle_new_user` Trigger: Missing `academy_id` Assignment

**Problem**: The `handle_new_user` trigger inserts into `profiles` with only `id`, `name`, and `role`:
```sql
INSERT INTO profiles (id, name, role)
VALUES (NEW.id, COALESCE(...), COALESCE(...));
```

But it does NOT set `academy_id`. The signup function in Section 3 passes `academy_id` in `options.data`:
```typescript
options: { data: { name, role, academy_id: academyId } }
```

This `academy_id` is available in `NEW.raw_user_meta_data->>'academy_id'` but the trigger ignores it.

**Why this matters**: Without `academy_id`, the new user's profile has `academy_id = NULL`. This means:
- All RLS policies that check `academy_id` will fail.
- The user cannot see any academy data, other profiles, assignments, or problems.
- The app will appear completely broken after registration.

**Suggestion**: Update the trigger to include `academy_id`:
```sql
INSERT INTO profiles (id, name, role, academy_id)
VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    (NEW.raw_user_meta_data->>'academy_id')::UUID
);
```

This is already noted in `DATABASE_SCHEMA.md` implicitly but is not called out as a critical fix in the plan.

---

### Important Suggestions

#### 6. `sync_grading_score` Trigger: Premature Status Update to 'graded'

**Problem**: The `sync_grading_score` trigger sets `assignment_students.status = 'graded'` after every single grading insert. But a teacher grades problems one at a time. After grading the first of 10 problems, the student's status becomes 'graded' even though 9 problems remain ungraded.

**Suggestion**: Only set status to 'graded' when ALL submissions for that assignment-student pair have been graded:
```sql
status = CASE
  WHEN (SELECT COUNT(*) FROM submissions s
        WHERE s.assignment_id = asn.assignment_id
        AND s.student_id = asn.student_id
        AND s.score IS NULL) = 0
  THEN 'graded'
  ELSE asn.status
END
```

#### 7. `submitAnswer` Uses `upsert` Without Conflict Handling Discussion

**Problem**: Section 4 uses `upsert` for `submitAnswer`:
```typescript
const { data: submission, error } = await supabase
  .from('submissions')
  .upsert({...})
  .select()
  .single();
```

The `submissions` table has a UNIQUE constraint on `(assignment_id, student_id, problem_id)`. An upsert will overwrite a previous submission silently. This is probably intentional (students can resubmit), but the plan does not discuss:
- Should students be able to resubmit after grading?
- Does resubmission reset the grading? (The trigger recalculates progress, but what about the existing `gradings` row?)
- The RLS policy "Students can update own submissions" allows updates, but should there be a check like `WHERE score IS NULL` to prevent updating already-graded submissions?

**Suggestion**: Add an explicit decision about resubmission policy. If resubmission is allowed, add a guard: delete the existing `gradings` row when a submission is updated, or prevent updates after grading.

#### 8. Parent Role: No `parent_children` Table or Relationship

**Problem**: The plan mentions parents viewing their child's data, and Section 4 says "For demo, can use the profile's `childrenIds` field." However:
- The `profiles` table does not have a `childrenIds` column.
- There is no `parent_children` table in the schema.
- The `teacher_students` table links teachers to students, not parents to students.
- The `student_profiles` table has `parent_phone` and `parent_name` fields, but these are strings, not foreign keys.

**Why this matters**: The parent role is one of three core roles in the app. Without a proper parent-student relationship table, RLS policies cannot enforce data access for parents, and the parent dashboard cannot query child data.

**Suggestion**: For the demo, either:
1. Add a `parent_children` table: `(parent_id UUID, child_id UUID, PRIMARY KEY(parent_id, child_id))` with appropriate RLS.
2. Or, store an array of child IDs in `profiles.metadata` JSONB column and query against it. This is less clean but faster for a demo.

#### 9. Duplicate Gemini Client Instantiation

**Problem**: Both `geminiService.ts` (line 6) and `geminiUtils.ts` (line 10) create separate `GoogleGenAI` instances:
```typescript
// geminiService.ts
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// geminiUtils.ts
export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
```

The plan does not address this duplication. `geminiService.ts` does not use `geminiUtils.ts`'s retry logic, JSON parsing, or schema validation.

**Suggestion**: Refactor `geminiService.ts` to use the shared `ai` client and `callGeminiWithRetry` from `geminiUtils.ts`. This gives the extraction flow automatic retries and avoids maintaining two separate clients.

#### 10. Storage Security: `submissions` Bucket and `getPublicUrl`

**Problem**: In Section 8, the plan uses `getPublicUrl` for canvas submission images:
```typescript
answerImageUrl = supabase.storage.from('submissions').getPublicUrl(data.path).data.publicUrl;
```

But the `submissions` bucket is **private** (created with `public: false` in `DATABASE_SCHEMA.md`). `getPublicUrl` returns a URL that requires authentication. However, this URL is then stored in the `submissions.answer_image_url` column and later loaded in the teacher's grading screen.

**Why this matters**:
- If the teacher loads the image via a standard `<Image source={{ uri: url }}>` component, the request will not include the Supabase auth token, and the request will fail with 403.
- Private bucket images require signed URLs (`createSignedUrl`) or must be downloaded through the Supabase client.

**Suggestion**: Use `createSignedUrl` with a reasonable expiry (e.g., 1 hour) when displaying submission images, or use `supabase.storage.from('submissions').download(path)` and convert to a local URI. Alternatively, make the `submissions` bucket public if the data is not sensitive (student canvas drawings are typically not sensitive, but this is a product decision).

#### 11. Missing `ISubmissionService` Interface

**Problem**: The plan says "5 service interfaces" and lists them: `IProblemBankService`, `IAssignmentService`, `IAnalyticsService`, `IWrongNoteService`, `IParentService`. Submission-related methods (`submitAnswer`, `gradeSubmission`, `getSubmissions`) are packed into `IAssignmentService`.

This is not a bug, but it means the `IAssignmentService` interface is doing too much. It has 16 methods spanning assignment CRUD, problem management, student assignment, submission, and grading. The Supabase implementation file will be very large.

**Suggestion**: For the demo this is fine, but note it as tech debt. In a production refactor, consider splitting into `IAssignmentService`, `ISubmissionService`, and `IGradingService`.

---

### Minor Suggestions

#### 12. `process.env.EXPO_PUBLIC_SUPABASE_URL!` Non-Null Assertion

The Supabase client creation uses `!` (non-null assertion):
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
```

If the env var is missing, this will create a Supabase client with `undefined` as the URL, leading to cryptic network errors. Add a startup check:
```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not configured');
}
```

#### 13. Demo Seed Data: Users Must Be Created via Auth API

The plan correctly notes that demo users "should be created via Supabase Auth (not directly in `profiles`)." However, `seed.sql` is a SQL file that cannot call the Supabase Auth API. Creating users via SQL `INSERT INTO auth.users` bypasses password hashing and breaks Supabase Auth.

**Suggestion**: Create a separate seed script in TypeScript (`scripts/seed.ts`) that uses `supabase.auth.admin.createUser()` (requires the service role key). The SQL seed file should only contain non-auth data (academies, problems, etc.).

#### 14. `@shopify/react-native-skia` Is Not in `package.json`

The plan mentions Skia for the student canvas ("Canvas drawing (Skia) works for the solve screen"), and Section 8 references `canvasRef.current.makeImageSnapshot()`. However, `@shopify/react-native-skia` is not in the current `package.json`. Either it was removed, or the plan is referencing code that does not exist yet.

**Suggestion**: Verify whether Skia is actually installed and working. If not, add it as a prerequisite for Section 8, and note that Skia installation on Expo can be tricky (it requires a dev client, not Expo Go).

#### 15. Two Google AI Packages Installed

The `package.json` includes both `@google/genai` (v1.34.0) and `@google/generative-ai` (v0.24.1). These are different packages (the former is the newer SDK). The codebase uses `@google/genai` exclusively. The plan should note removing `@google/generative-ai` to avoid confusion and reduce bundle size.

#### 16. `AsyncStorage.multiRemove` in Logout

The logout function calls `AsyncStorage.multiRemove` but does not `await` it:
```typescript
AsyncStorage.multiRemove([...]);
```

This is a fire-and-forget async operation. If the app navigates away before it completes, the cache may not be cleared. Add `await` or handle the promise.

#### 17. Timer Accuracy in Section 8

The timer implementation uses `Date.now()` at submission time:
```typescript
const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
```

This calculates time at the moment of submission, not continuously. If a student leaves the app (backgrounding), the timer keeps running. Consider pausing the timer when the app is backgrounded using `AppState` from React Native.

---

## Specific Section Feedback

### Section 1: Supabase Project Setup + DB Schema + RLS
- **Critical**: Migration files exist but are never applied via CLI (see Issue #1).
- **Critical**: `handle_new_user` trigger does not set `academy_id` (see Issue #5).
- The estimated 1 day (4-6 hours) is realistic only if everything works on the first try. Budget an extra half-day for RLS debugging.
- Consider adding `supabase/config.toml` for local development configuration.

### Section 2: Supabase Client Integration in Expo
- Solid and straightforward. The URL polyfill requirement is correctly identified.
- The connectivity test is a good idea. Consider making it a proper health check utility rather than a temporary test.
- **Minor**: The `npx supabase gen types` command requires the Supabase CLI to be installed. Add `npm install -g supabase` or `npx supabase` to prerequisites.

### Section 3: Auth Migration
- The rewrite from mock to real auth is well-planned. The `initializeAuth` pattern for session restoration is correct.
- **Issue**: The `onAuthStateChange` listener only handles `SIGNED_OUT`. Consider also handling `SIGNED_IN` for the case where a user signs in from a deep link or another device.
- **Issue**: The `signup` function does not automatically log the user in after signup. If email confirmation is disabled, the user has to log in manually after registering. Consider calling `login` after successful `signUp`.
- The note about disabling email confirmation for the demo is important and should be a first-day task.

### Section 4: Supabase Service Implementations
- This is correctly identified as the largest section (2-3 days).
- **Critical**: Non-transactional multi-table insert (see Issue #3).
- The `mapDbToProblemBankItem` / `mapProblemBankItemToDb` mapper approach is correct. Consider generating these from the `database.types.ts` to reduce manual mapping errors.
- The `USE_SUPABASE` toggle is a good pattern. Consider also supporting per-service toggles for incremental migration during development.
- **Missing**: Error handling strategy. What happens when a Supabase query fails? The examples throw errors, but the stores need to catch and display them. Add a consistent error handling pattern (e.g., a `handleServiceError` utility that maps Supabase errors to Korean messages).

### Section 5: Gemini AI - PDF/Photo Problem Extraction
- **Critical**: File size limits not addressed (see Issue #4).
- **Important**: `geminiService.ts` does not use `geminiUtils.ts` retry logic (see Issue #9).
- The LaTeX normalization is well-implemented but should be tested with real Korean math PDFs that include complex expressions (matrices, piecewise functions, etc.).
- The plan mentions `expo-document-picker` and `expo-image-picker` are already installed, which is verified by `package.json`. Good.
- Consider adding a progress indicator during the base64 encoding phase, not just the API call phase. Large file reads can take several seconds.

### Section 6: Screen-Store Connection
- The pattern (remove hardcoded data, connect to store, add useEffect for fetch) is correct and well-documented.
- 11+ screens at 2-3 hours each totals 22-33 hours, which is 3-4 days of focused work, not 2 days. The estimate is slightly optimistic.
- Consider creating a custom hook (`useDataFetch`) that handles loading, error, and retry logic to avoid duplicating this in every screen.
- **Issue**: The teacher dashboard `stats.totalStudents` is marked as `// TODO: from a students query`. This should be resolved in the plan, not left as a TODO.

### Section 7: Assignment Creation Flow
- The problem selection flow via route params is workable but fragile. Passing `selectedProblemIds` back via `router.back()` + route params is limited by URL length. Consider using a shared Zustand store for selection state instead.
- **Issue**: `problems: selectedProblemIds.map((id, i) => ({ id, content: '', points: 10 }))` passes empty `content`. The `create` method in Section 4 does not use `content` for `assignment_problems`, so this is okay, but it is confusing code.
- The student list query fetches ALL students in the academy. For large academies, consider filtering by class.

### Section 8: Problem Solving + Submission Flow
- **Important**: `getPublicUrl` on a private bucket (see Issue #10).
- **Minor**: Skia may not be installed (see Issue #14).
- The canvas snapshot → base64 → upload flow is sound but untested. Skia's `makeImageSnapshot()` returns a `SkImage`, and the `encodeToBase64()` method may not exist in all versions. Verify the exact API.
- The `decode(base64)` call references a function that is not defined or imported in the example. Presumably from `base64-arraybuffer` or similar; document the dependency.
- Consider saving canvas stroke data (`canvasData` JSONB) alongside the image so strokes can be replayed for review.

### Section 9: Grading Flow
- **Important**: `sync_grading_score` prematurely sets status to 'graded' (see Issue #6).
- The auto-grading for multiple choice is a nice touch and will make the demo more impressive.
- **Missing**: Batch grading. If a teacher wants to grade all multiple-choice problems in one click (auto-grade), there is no batch endpoint. Consider adding `autoGradeMultipleChoice(assignmentId)` as a convenience function.

### Section 10: Dashboard Data Integration
- This section feels like a continuation of Section 6 rather than a separate section. The work is "connect dashboard screens to real data," which is exactly what Section 6 does. Consider merging them.
- The parent dashboard implementation is vague because the parent-child relationship is undefined (see Issue #8).

### Section 11: Testing & Polish
- The 14-step demo script is excellent and should be used as the primary acceptance test.
- **Missing**: No mention of automated testing. Even basic smoke tests (can login, can fetch problems) would catch regressions.
- **Missing**: No mention of error boundary components. If a single screen crashes, the entire app crashes. Add `ErrorBoundary` wrappers.
- The "Large PDF (>20 pages)" row in the error handling table says "Consider splitting or warning user" but does not specify a concrete solution.

---

## Missing Considerations

### 1. No Offline/Network Error Strategy
The plan mentions "Offline fallback: Low priority" in Section 11, but there is no strategy for what happens when the network drops mid-operation. Consider:
- Optimistic updates with rollback.
- A network status indicator in the app header.
- Queuing submissions for retry when offline (particularly important for students in Korean academies that may have spotty Wi-Fi).

### 2. No Data Migration Strategy for Existing Mock Data
If the team has been testing with mock data and has state persisted in AsyncStorage, switching to Supabase will cause the app to show stale/conflicting data. The logout function clears AsyncStorage, but what if a user does not log out before the update? Add a version flag in AsyncStorage and clear on version mismatch.

### 3. No Rate Limiting or Abuse Prevention
- The Gemini API has rate limits (15 RPM on free tier, 2000 RPM on pay-as-you-go). If a teacher rapidly extracts problems from multiple PDFs, they will hit the limit.
- The notification trigger fires on every `assignment_students` INSERT. Assigning 30 students creates 30 notification rows and 30 realtime events. Consider batching.

### 4. No Consideration of Supabase Free Tier Limits
Supabase free tier has: 500 MB database, 1 GB storage, 2 GB bandwidth, 50,000 monthly active users, 500 MB edge function invocations. For a demo this is fine, but the plan should note these limits and when they would be exceeded.

### 5. No Discussion of `SECURITY DEFINER` Implications
Multiple trigger functions use `SECURITY DEFINER`, which means they run with the privileges of the function creator (typically the `postgres` superuser). This bypasses RLS. While necessary for triggers, it also means any bug in these functions could expose or modify data across academy boundaries. Document this risk.

### 6. No Realtime Subscription Plan
`DATABASE_SCHEMA.md` adds `notifications` to `supabase_realtime` publication and includes a `useNotifications` hook. The implementation plan never mentions Realtime. If real-time notifications are part of the demo, they should be a section or at least a subsection. If not, document that Realtime is deferred.

### 7. No Consideration of Korean Text Search
The `problem_bank` search uses `ilike`:
```typescript
if (filter?.searchQuery) query = query.ilike('content', `%${filter.searchQuery}%`);
```
PostgreSQL's `ILIKE` does not handle Korean text search well (no word segmentation, no morphological analysis). For a demo this is acceptable, but for production, consider `pg_trgm` extension with GIN indexes or Supabase's full-text search with a Korean dictionary.

### 8. No Discussion of Expo Dev Client vs. Expo Go
Skia, camera permissions, and document picker all require a dev client build, not Expo Go. The plan's "Quick Reference" section says `npx expo start` but does not mention `npx expo run:android` or `npx expo prebuild`. If the team has been using Expo Go for development, they will hit a wall when they try to use the camera or Skia.

### 9. No Monitoring or Logging Strategy
There is no mention of error tracking (Sentry, Bugsnag), analytics (Mixpanel, Amplitude), or structured logging. For a demo this is optional, but Supabase queries that silently return empty arrays due to RLS misconfiguration are extremely hard to debug without logging.

### 10. No Consideration of JWT Token Size
Supabase JWTs include custom claims from `raw_user_meta_data`. If you store `academy_id`, `role`, `name`, and other fields in the JWT via user metadata, the token can grow. For a Korean app where names are short, this is probably fine, but it is worth noting.

---

## Summary Verdict

| Category | Rating |
|----------|--------|
| **Completeness** | 8/10 -- covers all major features, but misses parent relationship and offline strategy |
| **Technical Accuracy** | 7/10 -- most code examples are correct, but RLS self-reference, trigger bugs, and file size limits are significant |
| **Feasibility (2 weeks)** | 7/10 -- achievable for a demo if critical issues are fixed early; the 1-week cutdown is realistic |
| **Production Readiness** | 5/10 -- this is explicitly a demo plan, and several patterns (non-transactional inserts, no error boundaries, no monitoring) would need rework |
| **Code Quality** | 8/10 -- consistent patterns, good TypeScript usage, proper separation of concerns |

**Bottom line**: This plan is good enough to ship a demo. Fix the five Critical Issues before starting implementation, and the rest can be addressed incrementally. The service factory pattern gives you a strong escape hatch if any section goes sideways.
