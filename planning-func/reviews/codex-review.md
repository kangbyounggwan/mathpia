# Codex Review: Mathpia Implementation Plan

**Reviewer**: Simulated OpenAI Codex Perspective
**Date**: 2026-04-04
**Plan reviewed**: `planning-func/claude-plan.md`
**Codebase files reviewed**: service interfaces, type definitions, all stores, service factory, package.json, database schema

---

## Overall Assessment

This is a well-structured, thorough implementation plan for migrating a Korean math academy app from mock data to a Supabase backend. The plan's strongest asset is the existing **service factory pattern** -- the architecture was clearly designed with this migration in mind, and the plan correctly identifies that the stores should remain unchanged while only the service implementations swap. The 11-section breakdown with dependency ordering, acceptance criteria per section, and explicit file inventories make this highly actionable. The plan author clearly understands the codebase deeply.

However, the plan has several significant **gaps at the code-implementation level** that will likely cause real debugging time during execution. The most concerning areas are: (1) the snake_case/camelCase mapping strategy lacks specification for nested joins and relational queries, (2) the dual-persistence problem between Zustand/AsyncStorage and Supabase session management is not addressed, (3) the `IAssignmentService.create()` method signature accepts a flat `Assignment` type but the Supabase implementation requires a multi-table transactional insert across 3 tables without any transaction wrapping, and (4) several TypeScript types include `Date` objects that will silently break during Zustand JSON serialization/deserialization. These are all solvable, but the plan should call them out explicitly so they are caught during implementation rather than discovered during debugging.

---

## Code Architecture Feedback

### Service Factory Pattern

The factory pattern in `src/services/index.ts` is clean and the toggle strategy proposed in Section 4.5 is sound:

```typescript
const USE_SUPABASE = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
const services: Services = USE_SUPABASE
  ? { problemBank: supabaseProblemBankService, ... }
  : { problemBank: mockProblemBankService, ... };
```

**Issues identified:**

1. **Interface contract mismatch on `IAssignmentService.create()`**: The interface accepts `Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>`, which includes `problems: Problem[]` and `assignedStudents: string[]`. But the plan's Supabase implementation in Section 4.2 treats `create()` as a multi-step operation (insert `assignments`, then insert `assignment_problems`, then insert `assignment_students`). If any of these sub-inserts fail, you get a partially created assignment with no rollback. The interface contract implicitly promises atomic creation but the implementation does not deliver it.

   **Recommendation**: Use a Supabase RPC function (stored procedure) for assignment creation that wraps all three inserts in a single database transaction, or at minimum implement client-side cleanup (delete the assignment row if problem/student insertion fails).

2. **`submitAnswer` uses `upsert` but the interface returns `Promise<Submission>`**: The plan's Section 4.2 uses `.upsert()` for `submitAnswer`, which means re-submitting for the same problem silently overwrites the previous answer. This is probably intentional behavior, but the `submissionStore.ts` (line 69) appends the returned submission to the array with `[...get().submissions, submission]` -- this will create duplicates in the local store on re-submission. The store needs deduplication logic or should replace rather than append.

3. **The `gradeSubmission` interface mismatch**: `IAssignmentService.gradeSubmission()` accepts `Omit<Grading, 'id' | 'gradedAt'>` which includes `submissionId`, `teacherId`, `score`, and optional `feedback`. But `submissionStore.gradeSubmission()` (line 84) calls it with `{ submissionId, teacherId, score, feedback }`. The `isCorrect` field on `Submission` is never set by the grading flow -- there is no logic anywhere that determines `isCorrect` from the score. This means the `dataFlowConnector.ts` wrong-note trigger (which checks `s.isCorrect === false`) will never fire, because `isCorrect` stays `undefined` after grading.

4. **Mixed service granularity**: The `IAssignmentService` interface is doing too much. It handles assignments, submissions, and gradings -- three distinct entities. The mock implementation can get away with this, but the Supabase implementation will become a very large file. Consider whether a `ISubmissionService` should be split out. This is a design smell, not a blocker.

### Type Safety

**The snake_case to camelCase mapping is the single highest-risk area of this plan.**

The plan proposes creating `mapDbToProblemBankItem()` and `mapProblemBankItemToDb()` helper functions in `src/services/supabase/mappers.ts`. This approach works but has several problems:

1. **No specification for nested/joined query mapping**: The plan's `supabaseAssignmentService` will need to do queries like:
   ```typescript
   .select('*, assignment_problems(*, problem_bank(*)), assignment_students(*)')
   ```
   The mapper for the top-level `Assignment` type expects `problems: Problem[]` and `assignedStudents: string[]`. But the Supabase join returns `assignment_problems: [{ problem_bank: {...}, order_index: ..., points: ... }]` and `assignment_students: [{ student_id: ... }]`. The plan does not specify how these nested join results are mapped. This is where most bugs will occur.

2. **`Date` fields are a silent serialization problem**: The TypeScript types use `Date` objects (`createdAt: Date`, `dueDate: Date`, `submittedAt: Date`, etc.), but:
   - Supabase returns ISO 8601 strings, not `Date` objects
   - Zustand's `persist` middleware serializes to JSON (via `createJSONStorage(() => AsyncStorage)`), which converts `Date` objects to strings on write and does NOT restore them as `Date` objects on read
   - The `partialize` option on `assignmentStore` persists `assignments`, which includes `Date` fields
   - After app restart, `assignment.dueDate` will be a string like `"2026-04-10T00:00:00Z"`, not a `Date` object
   - Any code doing `assignment.dueDate.toLocaleDateString()` will crash

   **Recommendation**: Either (a) change all `Date` fields in types to `string` (ISO 8601), or (b) add a `merge` function to Zustand persist that revives `Date` objects, or (c) add date revival to the mapper functions and also to the persist rehydration. Option (a) is simplest and most Supabase-idiomatic.

3. **Better alternative to manual mappers -- Supabase column aliases**: Instead of writing mapper functions, you can use Supabase's `.select()` with column renaming:
   ```typescript
   .select('id, academyId:academy_id, createdBy:created_by, ...')
   ```
   This is less code, fewer bugs, and eliminates the mapper layer entirely for simple single-table queries. It does not work for nested joins, so you would still need mapper logic for relational queries. A hybrid approach (column aliases for simple queries, mappers for joins) would reduce the mapper surface area significantly.

4. **ENUM value alignment**: The TypeScript `UserRole` type is `'admin' | 'teacher' | 'student' | 'parent'`, but the DB `user_role` ENUM is `('student', 'teacher', 'admin')` -- note there is **no `'parent'` value** in the database ENUM. The plan's `handle_new_user` trigger and profile queries will fail for parent users unless the DB ENUM is updated. This is a schema-plan mismatch that must be resolved before Section 1 is executed.

5. **`ProblemBankSortField` uses camelCase but DB columns are snake_case**: The `ProblemBankSortField` type is `'createdAt' | 'difficulty' | 'usageCount' | 'correctRate'`. The plan's service implementation (Section 4.1) directly passes `sort.field` to `.order(sortField, ...)`. This will fail because Supabase expects `created_at`, `usage_count`, `correct_rate`. The mapper must also cover sort field names.

### State Management

**Zustand store patterns have two significant issues with the proposed Supabase migration:**

1. **Dual persistence conflict**: The stores use `persist` middleware with `AsyncStorage`. The plan also proposes that Supabase Auth persists sessions to `AsyncStorage`. After login, the auth token is in AsyncStorage (managed by Supabase) and user profile data is in AsyncStorage (managed by Zustand `authStore`). On logout, the plan calls `AsyncStorage.multiRemove([...])` to clear store data, but this is a manual list of keys. If a new store is added later or a key name changes, this will silently fail to clear data.

   **Recommendation**: Use `zustand`'s `persist` `clearStorage()` method for each store on logout instead of manually listing AsyncStorage keys. Or better, iterate all stores and call their reset/clear functions.

2. **Store `submissions` array grows unbounded**: The `submissionStore` persists all submissions to AsyncStorage via `partialize: (state) => ({ submissions: state.submissions })`. As students submit answers over time, this array will grow continuously. AsyncStorage has a ~6MB limit on Android. With canvas data (`canvasData: Record<string, unknown>`) potentially included in submissions, this limit could be hit after just dozens of submissions.

   **Recommendation**: Do not persist the full `canvasData` in the submission store. Only persist submission metadata (IDs, scores, timestamps). Load canvas data on-demand from Supabase Storage when needed.

3. **The `dataFlowConnector.ts` subscription will not work correctly with Supabase**: The connector subscribes to `submissionStore` state changes and checks if 5+ new submissions have accumulated to invalidate the analytics cache. But with Supabase, the `fetchByAssignment` method (line 119-127) replaces the entire `submissions` array with the query result (`set({ submissions, isLoading: false })`). This means the subscription will fire on every fetch, not just on new submissions. The count-based heuristic will produce false positives.

### Auth Flow

The Supabase Auth integration approach is **mostly correct** for React Native/Expo, with these issues:

1. **`detectSessionInUrl: false` is correct** -- good.

2. **`storage: AsyncStorage` is correct** -- this is the standard approach for React Native.

3. **Missing `onAuthStateChange` handling for `TOKEN_REFRESHED`**: The plan's `_layout.tsx` listener only handles `SIGNED_OUT`. It should also handle `SIGNED_IN` (for when a token refresh results in a new session after the old one expired). If the token expires while the app is backgrounded and the refresh succeeds, the `SIGNED_IN` event fires. Without handling it, the user's profile data in the store might be stale.

4. **Race condition on app startup**: The plan calls `initializeAuth()` (which calls `supabase.auth.getSession()`) in a `useEffect`. But the Supabase client might also emit an `onAuthStateChange` event during initialization. If both fire, the profile is fetched twice. The standard pattern is to ONLY use `onAuthStateChange` for session management and skip the separate `getSession()` call, since `onAuthStateChange` fires with `INITIAL_SESSION` event on setup.

5. **`authStore` does not use `persist` middleware**: Currently the auth store is a plain `create<AuthState>()` without persistence. This means after app restart, even though Supabase restores the session from AsyncStorage, `authStore.user` will be `null` until `initializeAuth()` completes. During this window, any screen that reads `useAuthStore().user` will see `null` and might redirect to login or show an empty state. The plan's `initializeAuth` handles this, but there will be a flash of unauthenticated state.

   **Recommendation**: Either (a) add `persist` to `authStore` so the user object is immediately available on app restart, or (b) add a splash/loading screen that blocks rendering until `initializeAuth()` completes.

---

## Implementation Risk Analysis

### High Risk Items

1. **Assignment `create()` is not transactional (Section 4.2)**
   - Inserting into `assignments`, `assignment_problems`, and `assignment_students` as three separate queries means partial failures leave orphaned rows
   - Likelihood: Medium (network instability on tablets is common)
   - Impact: High (corrupted data state that is hard to diagnose)
   - Mitigation: Use a Supabase RPC/stored procedure with `BEGIN...COMMIT`

2. **`Date` serialization breaks after Zustand persist rehydration**
   - All stores that persist entities with `Date` fields will silently convert them to strings after app restart
   - Any `.toLocaleDateString()`, `.getTime()`, or `new Date() > dueDate` comparison will throw or produce wrong results
   - Likelihood: Certain (100%)
   - Impact: High (crashes on date-dependent screens)
   - Mitigation: Use ISO string types or add Zustand `merge` reviver

3. **Missing `'parent'` role in DB ENUM `user_role`**
   - The TypeScript `UserRole` includes `'parent'` but the SQL ENUM does not
   - Parent signup will fail at the database level
   - Likelihood: Certain (100%)
   - Impact: High (parent role completely broken)
   - Mitigation: Add `'parent'` to the `user_role` ENUM in Migration 001

4. **Canvas snapshot to Supabase Storage upload (Section 8.2)**
   - The plan calls `canvasRef.current.makeImageSnapshot()` then `snapshot.encodeToBase64()`. With `@shopify/react-native-skia`, `makeImageSnapshot()` returns a `SkImage`, and `encodeToBase64()` is actually `encodeToBase64(format, quality)`. The plan does not specify format/quality
   - More critically, the plan uploads base64 data directly to Supabase Storage, but Supabase Storage's `.upload()` expects a `Blob`, `File`, `ArrayBuffer`, or `FormData` -- not a raw base64 string. You need to decode the base64 to a `Uint8Array` first (the plan mentions `decode(base64)` but does not specify what `decode` is or where it comes from)
   - The `submissions` bucket is configured as **private**, but the plan then calls `getPublicUrl()` on it, which will return a URL that requires authentication. This URL will not work in an `<Image>` component without attaching the auth header
   - Likelihood: High
   - Impact: High (student answer images will not display for teachers during grading)
   - Mitigation: Use `createSignedUrl()` instead of `getPublicUrl()` for private buckets, or make the submissions bucket public. Use `expo-file-system` to save the snapshot to a temp file and upload the file directly

5. **RLS policies will block queries during development (Section 1)**
   - The plan correctly identifies this as "High likelihood, Medium impact" in the risk table, but underestimates the debugging cost
   - Every Supabase service method will silently return empty arrays (not errors) when RLS blocks access. This makes it very hard to distinguish "no data exists" from "RLS is blocking"
   - The plan's relational queries (e.g., `.select('*, profiles!student_id(name)')`) are particularly tricky because RLS is evaluated on each joined table independently
   - Likelihood: High
   - Impact: Medium-High (days of debugging for silent empty results)
   - Mitigation: During development, temporarily disable RLS or add `service_role` key access for debugging. Add logging that distinguishes "0 results" from "query succeeded with 0 rows"

### Medium Risk Items

6. **`ProblemBankSortField` camelCase passed directly to `.order()` (Section 4.1)**
   - Will cause runtime Supabase errors for `createdAt`, `usageCount`, `correctRate` sort fields
   - Likelihood: Certain
   - Impact: Medium (sort functionality broken, but list still works with default sort)

7. **Submission store `submissions` array grows unbounded with persisted `canvasData`**
   - AsyncStorage 6MB limit on Android
   - Likelihood: Medium (depends on usage volume)
   - Impact: Medium (app crashes or data loss when limit is hit)

8. **`dataFlowConnector.ts` false positives with Supabase fetch pattern**
   - Analytics cache invalidated too frequently, causing unnecessary Gemini API calls
   - Likelihood: High
   - Impact: Medium (wasted API quota, slightly slower UX)

9. **Gemini API call with large PDFs (Section 5)**
   - The plan mentions "5-15 seconds for a PDF" but Korean math textbook PDFs can be 10-50MB
   - `readFileAsBase64()` for a 50MB PDF will create a ~67MB base64 string in memory
   - Gemini 2.5 Flash has input limits; the plan does not specify how to handle multi-page PDFs
   - Likelihood: Medium
   - Impact: Medium (OOM crash or API rejection for large files)

10. **Two Google AI packages installed**: `package.json` has both `@google/genai` (v1.34.0) and `@google/generative-ai` (v0.24.1). These are different packages. The plan does not address which one `geminiService.ts` actually uses or whether the unused one should be removed. Bundle size impact and potential version conflicts.

### Low Risk Items

11. **`expo-document-picker` and `expo-image-picker` are already installed** -- good, no new native module risk

12. **Korean text encoding in Gemini prompts** -- the plan notes this is already tested and working

13. **`react-native-url-polyfill` compatibility with Expo SDK 54** -- standard and well-tested combination

14. **Supabase free tier limits** -- 500MB database, 1GB storage, 50MB file upload limit. Adequate for demo but should be documented

---

## Suggested Improvements

### 1. Use Supabase RPC for Multi-Table Operations

Replace the multi-step `create` in `supabaseAssignmentService.ts` with a stored procedure:

```sql
CREATE OR REPLACE FUNCTION create_assignment_with_details(
  p_assignment JSONB,
  p_problems JSONB[],
  p_student_ids UUID[]
) RETURNS UUID AS $$
DECLARE
  v_assignment_id UUID;
BEGIN
  INSERT INTO assignments (...) VALUES (...) RETURNING id INTO v_assignment_id;
  -- Insert problems
  -- Insert student assignments
  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Call from the client:
```typescript
const { data } = await supabase.rpc('create_assignment_with_details', { ... });
```

### 2. Use ISO Strings Instead of Date Objects

Change all types to use `string` for date fields:

```typescript
// Before
export interface Assignment {
  dueDate: Date;
  createdAt: Date;
  // ...
}

// After
export interface Assignment {
  dueDate: string;  // ISO 8601
  createdAt: string; // ISO 8601
  // ...
}
```

This eliminates the Zustand persistence serialization problem entirely and matches what Supabase returns. Add a utility like `formatDate(isoString: string): string` for display.

**Note**: This is a breaking change to the existing types. All screens that call `.toLocaleDateString()` on these fields must be updated. The plan should include this as a preparatory step before Section 4.

### 3. Add a Column-Name Mapping Utility

Instead of per-entity mapper functions, create a generic bidirectional mapper:

```typescript
type ColumnMap = Record<string, string>;

const problemBankColumns: ColumnMap = {
  academyId: 'academy_id',
  createdBy: 'created_by',
  sourceType: 'source_type',
  // ... etc
};

function toDb<T extends Record<string, unknown>>(obj: T, map: ColumnMap): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [map[k] || k, v])
  );
}

function fromDb<T>(row: Record<string, unknown>, map: ColumnMap): T {
  const reverseMap = Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]));
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [reverseMap[k] || k, v])
  ) as T;
}
```

This is less error-prone than writing individual mapper functions for each entity.

### 4. Use Signed URLs for Private Storage Buckets

```typescript
// Instead of:
const url = supabase.storage.from('submissions').getPublicUrl(path).data.publicUrl;

// Use:
const { data } = await supabase.storage.from('submissions').createSignedUrl(path, 3600); // 1 hour
const url = data?.signedUrl;
```

### 5. Add `isCorrect` Determination Logic

The plan never specifies where `Submission.isCorrect` gets set. Add it to the grading flow:

```typescript
// In gradeSubmission:
const isCorrect = data.score >= problem.points * 0.5; // or whatever threshold
await supabase.from('submissions').update({ is_correct: isCorrect }).eq('id', submissionId);
```

Without this, the wrong-note auto-generation (which depends on `isCorrect === false`) will never trigger.

### 6. Add a Loading Gate in `_layout.tsx`

```typescript
function RootLayout() {
  const { isLoading } = useAuthStore();
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    useAuthStore.getState().initializeAuth().finally(() => setAuthInitialized(true));
  }, []);

  if (!authInitialized) {
    return <SplashScreen />; // or keep expo-splash-screen visible
  }

  // ... normal routing
}
```

### 7. Limit Persisted Submission Data

```typescript
// In submissionStore persist config:
partialize: (state) => ({
  submissions: state.submissions.map(({ canvasData, ...rest }) => rest), // Strip canvas data
}),
```

---

## Missing Technical Details

### 1. No Error Type Standardization

The plan uses `try/catch` with `error instanceof Error` checks, but Supabase errors are `PostgrestError` objects (with `code`, `message`, `details`, `hint` properties), not standard `Error` instances. The plan should define a standard error handling utility:

```typescript
function handleSupabaseError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as { code: string; message: string };
    // Map common Postgres error codes to Korean messages
    if (pgError.code === '23505') return '이미 존재하는 데이터입니다.';
    if (pgError.code === '42501') return '권한이 없습니다.';
    return pgError.message;
  }
  return '알 수 없는 오류가 발생했습니다.';
}
```

### 2. No Specification for `handle_new_user()` Trigger

Section 1 lists `handle_new_user()` as a trigger but does not show the SQL. This trigger must:
- Read `raw_user_meta_data` from the `auth.users` row to get `name`, `role`, `academy_id`
- Insert into `profiles`
- Conditionally insert into `student_profiles` or `teacher_profiles` based on role
- Handle the case where `academy_id` is null (new academies vs. joining existing ones)

This is the most complex trigger in the system and its correctness is critical. The plan should include the full SQL.

### 3. No Offline / Optimistic Update Strategy

The plan mentions "Offline fallback: Low priority" in Section 11 but does not address what happens when:
- A student is solving problems and loses network connectivity mid-session
- A teacher is grading and the network drops
- The app is opened in airplane mode

Since the stores already persist to AsyncStorage, the app will show stale data. But any write operation (submit answer, grade, create assignment) will fail with a network error. The plan should specify:
- Should writes be queued locally and retried? (optimistic updates)
- Should the canvas auto-save to local storage periodically?
- Should there be a "pending sync" indicator?

For a demo prototype, the minimum is: save canvas state locally so work is not lost on network failure, and show a clear "no network" banner.

### 4. No Specification for `@shopify/react-native-skia` Installation

The plan lists Skia as part of the tech stack and the canvas is described as "working," but `@shopify/react-native-skia` is **not in `package.json`**. Either:
- It is installed but not shown (check `node_modules`)
- It was removed at some point
- The canvas is implemented differently (perhaps with `react-native-svg` which IS installed)

The plan's Section 8.2 relies on `canvasRef.current.makeImageSnapshot()` which is a Skia API. If Skia is not actually installed, this entire section needs rework.

### 5. No React Native Rehydration / Navigation Guard

When the app starts, stores rehydrate from AsyncStorage asynchronously. During this window, `assignments` is `[]`, `submissions` is `[]`, etc. If a screen renders before rehydration completes, it will show empty lists then suddenly populate. The plan should specify that screens wait for rehydration:

```typescript
const hasHydrated = useAssignmentStore.persist.hasHydrated();
if (!hasHydrated) return <Loading />;
```

### 6. No Migration Path for Existing Mock Data Users

If developers have been using the app with mock data, their AsyncStorage will have persisted mock assignments, submissions, etc. After switching to Supabase, the app will load these stale mock items from AsyncStorage on first run, then try to fetch from Supabase. The `fetchAssignments` call will replace the store state, but there could be a flash of stale data. The plan should specify a version flag or migration step that clears AsyncStorage on first run after the Supabase migration.

### 7. No `expo-image-picker` Camera Permission Handling for iOS

The plan shows `requestCameraPermissionsAsync()` for Android, but on iOS, you also need `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` in `app.json` / `Info.plist`. The plan should verify these are configured in `app.json`.

---

## Dependency Order Validation

The proposed section order is:

```
1 (DB Schema) -> 2 (Client) -> 3 (Auth) -> 4 (Services) -> 5 (Gemini) -> 6 (Screen-Store) -> 7 (Assignment) -> 8 (Solve) -> 9 (Grading) -> 10 (Dashboard) -> 11 (Testing)
```

### Correct Dependencies

- Section 1 has no dependencies -- correct
- Section 2 depends on Section 1 -- correct
- Section 3 depends on Section 2 -- correct
- Section 4 depends on Sections 2 and 3 -- correct (RLS needs auth)
- Section 5 depends on Section 4 -- correct (saving to problem bank needs Supabase service)

### Parallelization Opportunities

1. **Sections 5 and 6 can be parallelized**: Gemini PDF extraction (Section 5) only depends on Section 4 for the "save to problem bank" step. The extraction itself (document picker + Gemini API call + result display) is independent of all Supabase work. You could start Section 5's UI wiring on Day 3 while Section 4 is in progress.

2. **Section 6 (screen-store connection) should be done BEFORE Sections 7-9, not after**: Currently, Section 6 is scheduled for Days 7-8 and Sections 7-9 for Days 9-11. But Sections 7-9 require screens to be connected to stores (how can you test "assignment creation flow" if the assignment list screen still shows hardcoded data?). Either Section 6 should move earlier, or Sections 7-9 should include their own screen-store connections for the specific screens they touch.

3. **Section 10 is largely redundant with Section 6**: Section 6 connects screens to stores. Section 10 is "Dashboard Data Integration" which is... connecting dashboard screens to stores. These should be merged. The current separation creates confusion about which section does what for dashboard screens.

### Missing Preparatory Step

**Before Section 4**, there should be a step to:
- Change all `Date` types to `string` (if adopting that approach)
- Add the `'parent'` role to the DB ENUM
- Create the generic column mapping utility
- Verify Skia is installed

This preparatory work should be called "Section 3.5: Type Alignment" or folded into Section 2.

### Suggested Revised Order

```
1  (DB Schema -- include parent role fix)
2  (Client + Types alignment)
3  (Auth Migration)
4  (Supabase Services -- problem bank first, then assignment)
5  (Screen-Store Connection -- merge current 6 into this)
   |-- 5a (Gemini extraction -- can run in parallel)
6  (Assignment Creation Flow)
7  (Solve + Submission Flow)
8  (Grading Flow)
9  (Dashboard Polish -- what remains from current 10)
10 (Testing & Polish)
```

---

## Summary of Action Items

| Priority | Item | Affected Sections |
|----------|------|-------------------|
| **CRITICAL** | Add `'parent'` to `user_role` ENUM | Section 1 |
| **CRITICAL** | Resolve `Date` vs `string` type issue | Sections 2, 4, 6-10 |
| **CRITICAL** | Make assignment creation transactional | Section 4 |
| **HIGH** | Use signed URLs for private storage buckets | Sections 8, 9 |
| **HIGH** | Add `isCorrect` logic to grading flow | Section 9 |
| **HIGH** | Verify `@shopify/react-native-skia` installation | Section 8 |
| **HIGH** | Handle sort field name mapping (camelCase to snake_case) | Section 4 |
| **HIGH** | Add auth initialization loading gate | Section 3 |
| **MEDIUM** | Fix `submitAnswer` deduplication in store | Section 8 |
| **MEDIUM** | Strip `canvasData` from persisted submissions | Section 8 |
| **MEDIUM** | Specify `handle_new_user()` trigger SQL in full | Section 1 |
| **MEDIUM** | Fix `dataFlowConnector` false positive subscription logic | Section 4 |
| **MEDIUM** | Add Supabase-specific error handling utility | Section 4 |
| **MEDIUM** | Merge Sections 6 and 10 / reorder dependencies | Plan structure |
| **LOW** | Remove unused `@google/generative-ai` package | Section 2 |
| **LOW** | Add AsyncStorage migration/clear step for mock-to-real transition | Section 3 |
| **LOW** | Add offline canvas auto-save | Section 8 |
| **LOW** | Configure iOS camera permissions in `app.json` | Section 5 |

---

*Review generated by simulated Codex perspective. All findings are based on static analysis of the plan document and existing codebase files. Runtime behavior should be verified during implementation.*
