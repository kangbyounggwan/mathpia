# Mathpia Implementation Plan - Complete Functional Enhancement

> **Target**: 1-2 week demo-ready prototype
> **Date**: 2026-04-04
> **Author**: Claude Opus 4.6 (AI-generated plan)

---

## Table of Contents

1. [Project Context & Current State](#1-project-context--current-state)
2. [Section 1: Supabase Project Setup + DB Schema + RLS](#section-1-supabase-project-setup--db-schema--rls)
3. [Section 2: Supabase Client Integration in Expo](#section-2-supabase-client-integration-in-expo)
4. [Section 3: Auth Migration (Mock → Supabase Auth)](#section-3-auth-migration-mock--supabase-auth)
5. [Section 4: Supabase Service Implementations](#section-4-supabase-service-implementations)
6. [Section 5: Gemini AI - PDF/Photo Problem Extraction](#section-5-gemini-ai---pdfphoto-problem-extraction)
7. [Section 6: Screen-Store Connection + Dashboard Data Integration (All Roles)](#section-6-screen-store-connection--dashboard-data-integration-all-roles)
8. [Section 7: Assignment Creation Flow (Teacher)](#section-7-assignment-creation-flow-teacher)
9. [Section 8: Problem Solving + Submission Flow (Student)](#section-8-problem-solving--submission-flow-student)
10. [Section 9: Grading Flow (Teacher)](#section-9-grading-flow-teacher)
11. [Section 10: Testing & Polish](#section-10-testing--polish)
12. [Timeline & Priority Matrix](#timeline--priority-matrix)
13. [Risk Mitigation](#risk-mitigation)

---

## 1. Project Context & Current State

### What is Mathpia?

Mathpia is a **Korean math academy (학원) tablet app** built with Expo SDK 54, React Native, and TypeScript. It supports three user roles:

| Role | Korean | Key Functions |
|------|--------|--------------|
| **Teacher** (선생님) | 선생님 | Create assignments, grade submissions, manage students, extract problems from PDFs |
| **Student** (학생) | 학생 | Solve assigned problems on a drawing canvas, submit answers, view wrong notes |
| **Parent** (학부모) | 학부모 | View child's learning progress, schedule, reports |

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Expo SDK 54 / React Native / TypeScript |
| **State Management** | Zustand v5 + AsyncStorage persistence |
| **UI** | react-native-paper (Material Design 3), NotoSansKR font |
| **Canvas** | @shopify/react-native-skia (for student problem-solving drawing) |
| **AI** | @google/genai (Gemini 2.5 Flash) |
| **Backend (NEW)** | Supabase (Auth + PostgreSQL + Storage) |
| **Routing** | expo-router v6 (file-based routing) |

### Architecture Overview

The app uses a **service factory pattern** that is central to the migration strategy:

```
Screen (UI) → Store (Zustand) → Service Interface → Implementation (Mock or Supabase)
```

- **Screens** (`app/` directory): 26 screen files organized by role (`(teacher)/`, `(student)/`, `(parent)/`, `(auth)/`)
- **Stores** (`src/stores/`): 7 Zustand stores (auth, problemBank, assignment, submission, analytics, wrongNote, parent) + dataFlowConnector
- **Service Interfaces** (`src/services/interfaces/`): 5 interfaces (IProblemBankService, IAssignmentService, IAnalyticsService, IWrongNoteService, IParentService)
- **Service Factory** (`src/services/index.ts`): Currently returns mock implementations; will be switched to Supabase implementations
- **Mock Services** (`src/services/mock/`): Complete mock implementations with 108 problems, 15 users, 8 assignments, ~400 submissions

### What Works Today

- UI/UX is ~80% complete (all screen layouts exist)
- All 7 Zustand stores have full structure and are wired to service interfaces
- Stores already call `services.assignment.create()`, `services.problemBank.list()`, etc.
- Mock services return realistic data
- Canvas drawing (Skia) works for the solve screen
- Gemini service file (`geminiService.ts`) has a complete prompt, base64 file reading, and JSON parsing -- but has never been called from a real UI flow

### What Does NOT Work Today

| Feature | Status | Key Issue |
|---------|--------|-----------|
| Authentication | 0% real | `authStore.ts` line 55-58: checks `mockUser.password === password` against hardcoded data |
| Screen-Store connection | ~30% | Most screens (teacher dashboard, student dashboard, etc.) have `const mockHomework = [...]` hardcoded inside the component |
| Assignment CRUD | 0% real | UI exists, but create/update/delete never saves anywhere real |
| Grading | 0% real | UI exists, but grading logic has no real backend |
| Submission | ~20% | Canvas exists, but submitted answers are not persisted |
| Gemini AI | 0% real | Framework exists (`geminiUtils.ts`, `geminiService.ts`), but no UI triggers the API |
| PDF extraction | 0% real | `problem-extract.tsx` screen exists and renders results, but nothing uploads/extracts |
| Backend | 0% | No Supabase project, no database, no storage buckets |

### Key Migration Insight

Because stores already call service interfaces (e.g., `services.assignment.create(data)` in `assignmentStore.ts` line 84), **implementing Supabase services that match the existing interfaces will make the stores work with real data without changing store code**. The only file that needs changing is `src/services/index.ts` (the factory), which swaps `mockProblemBankService` for `supabaseProblemBankService`, etc.

---

## Section 1: Supabase Project Setup + DB Schema + RLS

### Objective

Create the Supabase project, apply the complete database schema (tables, ENUMs, RLS policies, triggers, views, storage buckets), and verify the setup works via the Supabase dashboard.

### Dependencies

- None (this is the foundation for everything else)

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.env` | **Modify** | Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| `supabase/migrations/001_enums_and_functions.sql` | **Create** | ENUM types + `update_updated_at()` function + `get_my_academy_id()` helper |
| `supabase/migrations/002_tables.sql` | **Create** | All tables in dependency order (including `parent_children`) |
| `supabase/migrations/003_rls_policies.sql` | **Create** | All RLS policies |
| `supabase/migrations/004_triggers_and_functions.sql` | **Create** | Business logic triggers + `create_assignment_with_details()` RPC |
| `supabase/migrations/005_views.sql` | **Create** | Dashboard views |
| `supabase/migrations/006_storage.sql` | **Create** | Storage buckets + policies |
| `supabase/seed.sql` | **Create** | Demo seed data (1 academy, sample problems) -- non-auth data only |
| `scripts/seed.ts` | **Create** | TypeScript seed script for auth users (uses Supabase Auth API, since SQL cannot call the Auth API directly) |

### Implementation Details

#### Step 1.1: Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Region: Select the closest region (Northeast Asia for Korea, e.g., `ap-northeast-1` Tokyo or `ap-northeast-2` Seoul if available)
3. Set a strong database password
4. Wait for project provisioning (~2 minutes)
5. Copy the **Project URL** and **anon public key** from Settings > API

#### Step 1.2: SQL Migration Execution Order

The database schema is already fully designed in `DATABASE_SCHEMA.md`. Execute in this exact order in Supabase Dashboard > SQL Editor:

**Migration 001: ENUMs and Base Functions**

```sql
-- ENUM types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'parent');
CREATE TYPE grade_level AS ENUM ('중1', '중2', '중3', '고1', '고2', '고3');
CREATE TYPE problem_type AS ENUM ('객관식', '서술형', '단답형');
CREATE TYPE difficulty_level AS ENUM ('상', '중', '하');
CREATE TYPE source_type AS ENUM ('manual', 'ai_extracted');
CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE student_assignment_status AS ENUM ('assigned', 'in_progress', 'submitted', 'graded');
CREATE TYPE notification_type AS ENUM ('new_assignment', 'assignment_due_soon', 'grading_complete', 'new_material', 'submission_received', 'system');
CREATE TYPE activity_type AS ENUM ('problem_solved', 'material_viewed', 'assignment_started', 'assignment_completed', 'login');

-- Base function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS helper: get the current user's academy_id without self-referencing the profiles table
-- This avoids circular RLS dependency when profiles RLS policies need to check academy membership.
CREATE OR REPLACE FUNCTION get_my_academy_id()
RETURNS UUID AS $$
  SELECT academy_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

**Migration 002: Tables** (in dependency order)

1. `academies` (no foreign keys)
2. `profiles` (references `auth.users`, `academies`)
3. `student_profiles` (references `profiles`)
4. `teacher_profiles` (references `profiles`)
5. `parent_children` (parent_id UUID REFERENCES profiles(id), child_id UUID REFERENCES profiles(id), PRIMARY KEY (parent_id, child_id)) -- parent-child relationship table for parent role queries
6. `classes` (references `academies`, `profiles`)
7. `class_students` (references `classes`, `profiles`)
8. `teacher_students` (references `profiles`)
9. `problem_bank` (references `academies`, `profiles`)
10. `assignments` (references `academies`, `profiles`, `classes`)
11. `assignment_problems` (references `assignments`, `problem_bank`)
12. `assignment_students` (references `assignments`, `profiles`)
13. `submissions` (references `assignments`, `profiles`, `problem_bank`)
14. `gradings` (references `submissions`, `profiles`)
15. `materials` (references `academies`, `profiles`)
16. `material_access` (references `materials`, `profiles`)
17. `notifications` (references `profiles`)
18. `study_logs` (references `profiles`)

All table definitions are in `DATABASE_SCHEMA.md` -- apply them verbatim with their indexes and `updated_at` triggers.

**Migration 003: RLS Policies**

Enable RLS on every table and create all policies as defined in `DATABASE_SCHEMA.md`. Key policies:

- Teachers see their academy's data (use `get_my_academy_id()` helper to avoid circular RLS on profiles)
- Students see only their own assignments/submissions
- Parents see only their children's data (via `parent_children` table)

Example using the RLS helper for profiles:

```sql
-- Profiles: users can see profiles within their own academy
CREATE POLICY "profiles_select_same_academy" ON profiles
  FOR SELECT USING (academy_id = get_my_academy_id());
```

**Migration 004: Triggers and Functions**

1. `handle_new_user()` -- auto-creates a `profiles` row when a new `auth.users` row is inserted, **including `academy_id` from `raw_user_meta_data`**:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role, academy_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role,
        (NEW.raw_user_meta_data->>'academy_id')::UUID
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

2. `update_assignment_progress()` -- auto-updates `assignment_students.progress_percent` when a submission is inserted
3. `sync_grading_score()` -- syncs grading score to `submissions.score` and `submissions.is_correct`, and updates `assignment_students.total_score`. **Only sets `assignment_students.status = 'graded'` when ALL submissions for that assignment-student pair have been graded** (not after each individual grading):

```sql
CREATE OR REPLACE FUNCTION sync_grading_score()
RETURNS TRIGGER AS $$
DECLARE
    v_assignment_id UUID;
    v_student_id UUID;
    v_total_problems INT;
    v_graded_count INT;
BEGIN
    -- Update the submission's score and is_correct
    UPDATE submissions
    SET score = NEW.score,
        is_correct = NEW.is_correct
    WHERE id = NEW.submission_id
    RETURNING assignment_id, student_id INTO v_assignment_id, v_student_id;

    -- Update total_score in assignment_students
    UPDATE assignment_students
    SET total_score = (
        SELECT COALESCE(SUM(s.score), 0)
        FROM submissions s
        WHERE s.assignment_id = v_assignment_id
          AND s.student_id = v_student_id
          AND s.score IS NOT NULL
    )
    WHERE assignment_id = v_assignment_id
      AND student_id = v_student_id;

    -- Only set status to 'graded' when ALL problems are graded
    SELECT COUNT(*) INTO v_total_problems
    FROM assignment_problems
    WHERE assignment_id = v_assignment_id;

    SELECT COUNT(*) INTO v_graded_count
    FROM submissions
    WHERE assignment_id = v_assignment_id
      AND student_id = v_student_id
      AND score IS NOT NULL;

    IF v_graded_count >= v_total_problems THEN
        UPDATE assignment_students
        SET status = 'graded'
        WHERE assignment_id = v_assignment_id
          AND student_id = v_student_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

4. `update_student_stats()` -- updates `student_profiles.total_problems_solved` and `average_score`
5. `create_notification()` + `notify_assignment()` -- auto-creates notifications when assignments are assigned

6. `create_assignment_with_details()` -- **RPC function** that creates an assignment, its problems, and its student assignments in a single transaction:

```sql
CREATE OR REPLACE FUNCTION create_assignment_with_details(
    p_assignment JSONB,
    p_problems JSONB,
    p_student_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
    v_assignment_id UUID;
    v_problem JSONB;
    v_student_id UUID;
    v_idx INT := 0;
BEGIN
    -- Insert assignment
    INSERT INTO assignments (
        academy_id, teacher_id, title, description,
        grade, subject, due_date, status
    )
    VALUES (
        (p_assignment->>'academy_id')::UUID,
        (p_assignment->>'teacher_id')::UUID,
        p_assignment->>'title',
        p_assignment->>'description',
        (p_assignment->>'grade')::grade_level,
        p_assignment->>'subject',
        (p_assignment->>'due_date')::TIMESTAMPTZ,
        COALESCE((p_assignment->>'status')::assignment_status, 'draft')
    )
    RETURNING id INTO v_assignment_id;

    -- Insert assignment_problems
    FOR v_problem IN SELECT * FROM jsonb_array_elements(p_problems)
    LOOP
        INSERT INTO assignment_problems (assignment_id, problem_id, order_index, points)
        VALUES (
            v_assignment_id,
            (v_problem->>'problem_id')::UUID,
            v_idx,
            COALESCE((v_problem->>'points')::INT, 10)
        );
        v_idx := v_idx + 1;
    END LOOP;

    -- Insert assignment_students
    FOREACH v_student_id IN ARRAY p_student_ids
    LOOP
        INSERT INTO assignment_students (assignment_id, student_id)
        VALUES (v_assignment_id, v_student_id);
    END LOOP;

    RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql;
```

**Migration 005: Views**

- `student_dashboard` -- aggregated student stats
- `teacher_dashboard` -- aggregated teacher stats
- `assignment_progress_view` -- per-student progress on each assignment

**Migration 006: Storage Buckets**

Create 5 buckets: `avatars` (public), `problems` (private), `materials` (private), `submissions` (private), `gradings` (private).

Apply storage RLS policies from `DATABASE_SCHEMA.md`.

#### Step 1.3: Seed Data for Demo

Create seed data in two parts:

**Part A: `supabase/seed.sql`** -- non-auth data (academy, sample problems):

- 1 academy ("수학왕 학원")
- 10-20 sample problems in `problem_bank` (inserted after users exist)
- 2-3 sample assignments with problems and student assignments (inserted after users exist)

**Part B: `scripts/seed.ts`** -- TypeScript script for auth users (because SQL cannot call the Supabase Auth API):

- 3 demo users (1 teacher, 1 student, 1 parent) via `supabase.auth.admin.createUser()`
- Corresponding `profiles`, `student_profiles`, `teacher_profiles` are auto-created by the `handle_new_user` trigger
- `teacher_students` relationship linking teacher to student
- `parent_children` relationship linking parent to student

```bash
# Run seed script
npx tsx scripts/seed.ts
```

> **Important**: Demo users must be created via Supabase Auth (not directly in `profiles`) so the `handle_new_user` trigger fires. The TypeScript seed script uses the Supabase service role key to call `auth.admin.createUser()`.

#### Step 1.4: Environment Variables

Update `.env`:

```bash
EXPO_PUBLIC_GEMINI_API_KEY=<existing key>
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Acceptance Criteria

- [ ] Supabase project is created and accessible
- [ ] All 18 tables are created with correct columns and relationships (including `parent_children`)
- [ ] All ENUM types exist (including `'parent'` in `user_role`)
- [ ] `get_my_academy_id()` SECURITY DEFINER function exists and works
- [ ] All RLS policies are active (test by querying as anon -- should return nothing)
- [ ] All triggers fire correctly (test by inserting a row into `submissions` and checking `assignment_students.progress_percent` updates)
- [ ] `handle_new_user` trigger correctly reads `academy_id` from `raw_user_meta_data`
- [ ] `sync_grading_score` trigger only sets status='graded' when ALL submissions are graded
- [ ] `create_assignment_with_details()` RPC function works and is transactional
- [ ] All 5 storage buckets exist with correct policies
- [ ] Demo seed data (1 academy, 3 users, sample problems, sample assignments) is loaded via `scripts/seed.ts` and `seed.sql`
- [ ] `.env` has both Supabase and Gemini credentials

### Estimated Effort

**1 day** (4-6 hours for schema execution, testing, and seed data)

---

## Section 2: Supabase Client Integration in Expo

### Objective

Install the Supabase JS client, create the typed client singleton, generate TypeScript types from the database, and verify connectivity from the Expo app.

### Dependencies

- Section 1 (Supabase project must exist with schema applied)

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `package.json` | **Modify** | Add `@supabase/supabase-js`, `react-native-url-polyfill` |
| `src/lib/supabase.ts` | **Create** | Supabase client singleton with env var validation |
| `src/lib/database.types.ts` | **Create** | Auto-generated TypeScript types from Supabase schema |
| `app/_layout.tsx` | **Modify** | Import URL polyfill at app entry |

### Implementation Details

#### Step 2.1: Install Dependencies

```bash
npx expo install @supabase/supabase-js react-native-url-polyfill
```

Note: `@react-native-async-storage/async-storage` is already installed (used by Zustand persistence).

#### Step 2.2: Create Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './database.types';

// Validate required environment variables at startup instead of using non-null assertions.
// This surfaces missing config immediately with a clear error message rather than
// failing later with cryptic "invalid URL" or network errors.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

Key configuration notes:
- `storage: AsyncStorage` -- persists auth tokens across app restarts
- `autoRefreshToken: true` -- automatically refreshes JWT before expiry
- `detectSessionInUrl: false` -- required for React Native (no URL-based auth flow)

> **Preparatory note for Section 4**: Before implementing Supabase services, change all `Date` fields in TypeScript types/interfaces to ISO `string` format. Zustand's `persist` middleware serializes `Date` objects to strings via `JSON.stringify()`, which means after rehydration, fields like `createdAt` become strings instead of `Date` objects. Calling `.toLocaleDateString()` on a rehydrated string silently fails or crashes. The fix is to store dates as ISO strings throughout the app and use a `formatDate(isoString: string): string` utility for display formatting. This change should be made across type definitions before starting service implementations.

#### Step 2.3: Generate TypeScript Types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

This generates type-safe types matching the exact DB schema, including all ENUM values and JSONB column types.

#### Step 2.4: Add URL Polyfill to App Entry

In `app/_layout.tsx`, add at the very top (before any other imports):

```typescript
import 'react-native-url-polyfill/auto';
```

This is required because React Native does not have a built-in URL implementation that Supabase depends on.

#### Step 2.5: Verify Connectivity

Add a temporary test in any screen:

```typescript
import { supabase } from '../src/lib/supabase';

// Test: should return empty array (RLS blocks unauthenticated)
const { data, error } = await supabase.from('academies').select('*');
console.log('Supabase test:', { data, error });
```

### Acceptance Criteria

- [ ] `@supabase/supabase-js` and `react-native-url-polyfill` installed
- [ ] `src/lib/supabase.ts` exports a typed `supabase` client with env var validation
- [ ] `src/lib/database.types.ts` has types matching all 18 tables
- [ ] App launches without errors after adding the polyfill
- [ ] A test query to Supabase returns a valid response (empty array or RLS error, not a network error)
- [ ] Missing env vars cause an immediate, clear error message at startup

### Estimated Effort

**2-3 hours**

---

## Section 3: Auth Migration (Mock → Supabase Auth)

### Objective

Replace the current mock authentication in `authStore.ts` (which checks hardcoded passwords) with real Supabase Auth. After this section, users can sign up, log in with email/password, and the app correctly routes them by role.

### Dependencies

- Section 2 (Supabase client must be available)

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/stores/authStore.ts` | **Modify** | Replace mock login/logout with Supabase Auth calls |
| `app/(auth)/login.tsx` | **Modify** | Add error handling for Supabase auth errors |
| `app/(auth)/register.tsx` | **Modify** | Wire up to `supabase.auth.signUp()` with role metadata |
| `app/_layout.tsx` | **Modify** | Listen to `supabase.auth.onAuthStateChange()` for auto-login + auth loading gate |

### Implementation Details

#### Step 3.1: Rewrite `authStore.ts`

The current `authStore.ts` does this (lines 48-64):

```typescript
// Current (MOCK):
login: async (email, password) => {
  await new Promise((resolve) => setTimeout(resolve, 1000)); // fake delay
  const mockUser = mockUsers[email];
  if (mockUser && mockUser.password === password) {
    set({ user, isAuthenticated: true });
  }
}
```

Replace with:

```typescript
import { supabase } from '../lib/supabase';

login: async (email: string, password: string) => {
  set({ isLoading: true, error: null });
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Fetch profile from profiles table (includes role, academy, etc.)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, student_profiles(*), teacher_profiles(*)')
      .eq('id', data.user.id)
      .single();
    if (profileError) throw profileError;

    const user: User = {
      id: profile.id,
      academyId: profile.academy_id,
      role: profile.role as UserRole,
      name: profile.name,
      email: data.user.email!,
      phone: profile.phone || '',
      grade: profile.student_profiles?.grade,
      // ... map other fields
      createdAt: new Date(profile.created_at),
    };

    set({ user, isAuthenticated: true, isLoading: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.';
    set({ error: message, isLoading: false });
  }
},

logout: async () => {
  await supabase.auth.signOut();
  set({ user: null, isAuthenticated: false, error: null });
  // Clear all persisted store data
  AsyncStorage.multiRemove([
    'mathpia-assignments',
    'mathpia-submissions',
    'mathpia-problem-bank',
    // ... other store keys
  ]);
},
```

Add a new `signup` action:

```typescript
signup: async (email: string, password: string, name: string, role: UserRole, academyId?: string) => {
  set({ isLoading: true, error: null });
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, academy_id: academyId },
      },
    });
    if (error) throw error;
    // handle_new_user trigger will create the profiles row automatically
    // (including academy_id from raw_user_meta_data)
    // The user may need email confirmation depending on Supabase settings
    set({ isLoading: false });
  } catch (error) {
    set({ error: '회원가입 중 오류가 발생했습니다.', isLoading: false });
  }
},
```

Add session listener initialization:

```typescript
initializeAuth: async () => {
  set({ isLoading: true });
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Fetch profile and set user (same logic as login)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (profile) {
        set({
          user: mapProfileToUser(profile, session.user.email!),
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    }
    set({ isLoading: false });
  } catch {
    set({ isLoading: false });
  }
},
```

#### Step 3.2: Auth State Listener + Loading Gate in `app/_layout.tsx`

Add an auth initialization loading gate (splash screen) to prevent a flash of unauthenticated state on app restart. The app should not render any routes until `initializeAuth()` completes:

```typescript
import { useAuthStore } from '../src/stores/authStore';
import { supabase } from '../src/lib/supabase';

export default function RootLayout() {
  const { isLoading: authLoading } = useAuthStore();
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth on app start (checks for existing session)
    useAuthStore.getState().initializeAuth().finally(() => {
      setAuthInitialized(true);
    });

    // Listen for auth state changes (token refresh, sign out from another tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          useAuthStore.getState().logout();
        }
        // TOKEN_REFRESHED is handled automatically by the client
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Show splash/loading screen until auth initialization completes
  if (!authInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ... render normal layout with routing
}
```

This prevents users from briefly seeing the login screen before being auto-redirected to their dashboard when a valid session exists.

#### Step 3.3: Update Registration Screen

Wire `app/(auth)/register.tsx` to call `signup()` with role selection (teacher/student/parent).

For the demo, consider disabling email confirmation in Supabase Dashboard > Auth > Settings > Email > "Confirm email" toggle OFF. This allows immediate login after signup.

#### Step 3.4: Remove Mock User Dependencies

- Remove `import { allMockUsers } from '../services/mock/mockData'` from `authStore.ts`
- Remove the `mockUsers` object construction (lines 21-35 of current `authStore.ts`)

### Acceptance Criteria

- [ ] User can sign up with email/password and role selection
- [ ] User can log in with email/password
- [ ] After login, `authStore.user` contains correct profile data including role
- [ ] Role-based routing works (teacher → `(teacher)/`, student → `(student)/`, etc.)
- [ ] App auto-restores session on restart (no re-login needed)
- [ ] Auth loading gate prevents flash of unauthenticated state on restart
- [ ] Logout clears session and navigates to login screen
- [ ] Error messages display in Korean for common cases (wrong password, network error)
- [ ] Mock user data imports are removed from authStore

### Estimated Effort

**1 day** (6-8 hours including testing all auth flows)

---

## Section 4: Supabase Service Implementations

### Objective

Create Supabase-backed implementations of all 5 service interfaces, then switch the service factory from mock to Supabase. After this, every store operation (CRUD on problems, assignments, submissions, etc.) hits the real database.

### Dependencies

- Section 2 (Supabase client)
- Section 3 (Auth -- needed because RLS policies use `auth.uid()`)

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/supabase/supabaseClient.ts` | **Create** | Re-export supabase client + helper utilities |
| `src/services/supabase/supabaseProblemBankService.ts` | **Create** | Implements `IProblemBankService` |
| `src/services/supabase/supabaseAssignmentService.ts` | **Create** | Implements `IAssignmentService` |
| `src/services/supabase/supabaseAnalyticsService.ts` | **Create** | Implements `IAnalyticsService` |
| `src/services/supabase/supabaseWrongNoteService.ts` | **Create** | Implements `IWrongNoteService` |
| `src/services/supabase/supabaseParentService.ts` | **Create** | Implements `IParentService` |
| `src/services/supabase/index.ts` | **Create** | Export all Supabase service instances |
| `src/services/supabase/mappers.ts` | **Create** | Generic bidirectional column mapper utility (snake_case ↔ camelCase) |
| `src/services/index.ts` | **Modify** | Switch factory from mock → supabase |

### Implementation Details

#### Step 4.1: `supabaseProblemBankService.ts`

This implements `IProblemBankService` (from `src/services/interfaces/problemBank.ts`):

```typescript
import { sortFieldMap } from './mappers';

export const supabaseProblemBankService: IProblemBankService = {
  async getById(id: string): Promise<ProblemBankItem | null> {
    const { data, error } = await supabase
      .from('problem_bank')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return mapDbToProblemBankItem(data);
  },

  async list(filter?, sort?, page = 1, pageSize = 50): Promise<PaginatedResult<ProblemBankItem>> {
    let query = supabase.from('problem_bank').select('*', { count: 'exact' });

    // Apply filters
    if (filter?.grade) query = query.eq('grade', filter.grade);
    if (filter?.subject) query = query.eq('subject', filter.subject);
    if (filter?.difficulty) query = query.eq('difficulty', filter.difficulty);
    if (filter?.type) query = query.eq('type', filter.type);
    if (filter?.topic) query = query.eq('topic', filter.topic);
    if (filter?.searchQuery) query = query.ilike('content', `%${filter.searchQuery}%`);
    if (filter?.tags?.length) query = query.overlaps('tags', filter.tags);

    // Apply sort -- map camelCase field names to snake_case DB column names
    const sortField = sort?.field
      ? sortFieldMap[sort.field] || sort.field
      : 'created_at';
    const sortDir = sort?.direction === 'asc';
    query = query.order(sortField, { ascending: sortDir });

    // Apply pagination
    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      items: (data || []).map(mapDbToProblemBankItem),
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > page * pageSize,
    };
  },

  async create(data): Promise<ProblemBankItem> {
    const { data: row, error } = await supabase
      .from('problem_bank')
      .insert(mapProblemBankItemToDb(data))
      .select()
      .single();
    if (error) throw error;
    return mapDbToProblemBankItem(row);
  },

  async bulkCreate(items): Promise<ProblemBankItem[]> {
    const { data, error } = await supabase
      .from('problem_bank')
      .insert(items.map(mapProblemBankItemToDb))
      .select();
    if (error) throw error;
    return (data || []).map(mapDbToProblemBankItem);
  },

  // ... remaining methods: update, delete, search, getByIds, incrementUsageCount, updateCorrectRate
};
```

**Sort field name mapper**: `ProblemBankSortField` uses camelCase (e.g., `createdAt`, `usageCount`, `correctRate`) but Supabase `.order()` expects snake_case (e.g., `created_at`, `usage_count`, `correct_rate`). Add a sort field mapper in `mappers.ts`:

```typescript
// mappers.ts -- sort field name mapping (camelCase → snake_case)
export const sortFieldMap: Record<string, string> = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  usageCount: 'usage_count',
  correctRate: 'correct_rate',
  sourceType: 'source_type',
  difficulty: 'difficulty',
  grade: 'grade',
};
```

**Column name mapping**: The DB uses `snake_case` (e.g., `academy_id`, `created_by`, `source_type`) while TypeScript types use `camelCase` (e.g., `academyId`, `createdBy`, `sourceType`). Create `mapDbToProblemBankItem()` and `mapProblemBankItemToDb()` helper functions for each entity.

> **Note**: `mappers.ts` should include a generic bidirectional column mapper utility (e.g., `snakeToCamel()` and `camelToSnake()`) that can be reused across all service implementations, rather than writing manual field-by-field mapping for every entity. This keeps the mapper code DRY and reduces bugs from missed fields.

#### Step 4.2: `supabaseAssignmentService.ts`

This implements `IAssignmentService`, which is the largest interface. Key methods:

```typescript
export const supabaseAssignmentService: IAssignmentService = {
  async create(data) {
    // Use the RPC function for transactional assignment creation
    // This creates the assignment, assignment_problems, and assignment_students
    // in a single database transaction, preventing orphaned data from partial failures.
    const { data: assignmentId, error } = await supabase.rpc(
      'create_assignment_with_details',
      {
        p_assignment: {
          academy_id: data.academyId,
          teacher_id: data.teacherId,
          title: data.title,
          description: data.description,
          grade: data.grade,
          subject: data.subject,
          due_date: data.dueDate, // ISO string (see Section 2 Date note)
          status: data.status,
        },
        p_problems: (data.problems || []).map((p) => ({
          problem_id: p.id,
          points: p.points || 10,
        })),
        p_student_ids: data.assignedStudents || [],
      }
    );
    if (error) throw error;

    // Fetch the complete assignment to return
    const created = await this.getById(assignmentId);
    if (!created) throw new Error('Assignment created but not found');
    return created;
  },

  async submitAnswer(data) {
    const { data: submission, error } = await supabase
      .from('submissions')
      .upsert({
        assignment_id: data.assignmentId,
        student_id: data.studentId,
        problem_id: data.problemId,
        answer_text: data.answerText,
        answer_image_url: data.answerImageUrl,
        canvas_data: data.canvasData,
        time_spent_seconds: data.timeSpentSeconds,
      })
      .select()
      .single();
    if (error) throw error;
    return mapDbToSubmission(submission);
  },

  async gradeSubmission(data) {
    const { data: grading, error } = await supabase
      .from('gradings')
      .insert({
        submission_id: data.submissionId,
        teacher_id: data.teacherId,
        score: data.score,
        feedback: data.feedback,
        is_correct: data.isCorrect, // determined by caller (see Section 9)
      })
      .select()
      .single();
    if (error) throw error;
    // The sync_grading_score trigger automatically updates submissions.score,
    // submissions.is_correct, and (when all problems are graded) assignment_students.status
    return mapDbToGrading(grading);
  },

  // ... remaining methods
};
```

#### Step 4.3: `supabaseAnalyticsService.ts`

For the demo, analytics can be computed client-side from submission data (matching the mock implementation). The `getStudentAnalytics()` method queries submissions and computes stats:

```typescript
async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
  // Query all submissions for this student with problem details
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, problem_bank(*)')
    .eq('student_id', studentId)
    .not('score', 'is', null);

  // Compute analytics from raw data
  return computeAnalytics(submissions);
}
```

#### Step 4.4: `supabaseWrongNoteService.ts` and `supabaseParentService.ts`

- **Wrong notes**: For demo, wrong notes can be auto-generated from incorrect submissions (query `submissions where is_correct = false`). A dedicated `wrong_notes` table is optional for the demo; we can use a view or query.
- **Parent service**: Queries child's data via the `parent_children` table. For demo, this table is populated during seeding with the parent-child relationships.

#### Step 4.5: Switch Service Factory

Modify `src/services/index.ts`:

```typescript
// BEFORE (current):
import { mockProblemBankService, ... } from './mock';
const services: Services = {
  problemBank: mockProblemBankService,
  assignment: mockAssignmentService,
  ...
};

// AFTER:
import { supabaseProblemBankService, ... } from './supabase';
const services: Services = {
  problemBank: supabaseProblemBankService,
  assignment: supabaseAssignmentService,
  ...
};
```

**Fallback strategy**: Keep mock services available. Consider an environment variable toggle:

```typescript
const USE_SUPABASE = !!process.env.EXPO_PUBLIC_SUPABASE_URL;
const services: Services = USE_SUPABASE
  ? { problemBank: supabaseProblemBankService, ... }
  : { problemBank: mockProblemBankService, ... };
```

This allows developing/testing without Supabase connectivity.

### Acceptance Criteria

- [ ] All 5 Supabase service implementations exist and compile without errors
- [ ] Each service correctly maps between DB `snake_case` and TypeScript `camelCase`
- [ ] Sort field name mapper correctly translates camelCase field names to snake_case for `.order()` calls
- [ ] `mappers.ts` includes a generic bidirectional column mapper utility
- [ ] `services/index.ts` can be toggled between mock and Supabase
- [ ] `problemBankStore.fetchProblems()` returns real data from Supabase
- [ ] `assignmentStore.createAssignment()` uses the `create_assignment_with_details` RPC (single transaction)
- [ ] `submissionStore.submitAnswer()` creates a real row in `submissions` table
- [ ] `submissionStore.gradeSubmission()` creates a `gradings` row and triggers score sync
- [ ] RLS policies correctly restrict data (student can only see their own submissions, etc.)

### Estimated Effort

**2-3 days** (this is the largest section; each service takes 3-4 hours)

---

## Section 5: Gemini AI - PDF/Photo Problem Extraction

### Objective

Complete the end-to-end flow: Teacher uploads a PDF or takes a camera photo → Gemini 2.5 Flash Vision extracts math problems → Problems are displayed for review → Teacher saves selected problems to the problem bank (Supabase).

### Dependencies

- Section 4 (Supabase problem bank service for saving extracted problems)
- `.env` must have `EXPO_PUBLIC_GEMINI_API_KEY` (already present)

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/geminiService.ts` | **Modify** | Already has `extractProblemsFromFile()` -- verify it works, add camera support, add file size check |
| `app/(teacher)/materials.tsx` | **Modify** | Add PDF upload and camera capture buttons that trigger extraction |
| `app/(teacher)/problem-extract.tsx` | **Modify** | Add "문제은행에 저장" (Save to Problem Bank) button |
| `app/(teacher)/problem-bank.tsx` | **Modify** | Add PDF/camera extraction entry point button |
| `src/services/geminiUtils.ts` | No change | Already has retry logic, JSON parsing, schema validation |

### Implementation Details

#### Step 5.1: File Size Check

Before sending any file to Gemini, check the file size. Korean math PDFs can be 5-50MB, but Gemini's inline data limit is 20MB and tablets can run out of memory reading large base64 strings. Add a **10MB limit** with a clear user-facing error:

```typescript
import * as FileSystem from 'expo-file-system';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const checkFileSize = async (fileUri: string): Promise<void> => {
  const fileInfo = await FileSystem.getInfoAsync(fileUri, { size: true });
  if (fileInfo.exists && fileInfo.size && fileInfo.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `파일 크기가 너무 큽니다 (${sizeMB}MB). ` +
      `최대 10MB까지 지원됩니다. 파일을 분할하거나 해상도를 줄여주세요.`
    );
  }
};
```

Call this at the beginning of `extractProblemsFromFile()` before reading the file as base64.

> **Alternative for larger files**: For files exceeding 10MB, the Gemini File API (`genai.files.upload()`) can be used to upload the file to Google's servers first, then reference it by URI in the generation request. This avoids base64 encoding entirely and supports files up to 2GB. This is a post-demo enhancement; for the demo, the 10MB limit with a clear error message is sufficient.

#### Step 5.2: Verify `geminiService.ts` Works

The existing `geminiService.ts` already has:
- `extractProblemsFromFile(fileUri, mimeType)` that reads a file as base64, sends it to Gemini 2.5 Flash with a detailed Korean math extraction prompt, and parses the JSON response.
- `readFileAsBase64()` with platform-specific handling (web vs native)
- LaTeX normalization

**Test**: Call `extractProblemsFromFile()` with a sample PDF to verify the API key works and the response parses correctly.

#### Step 5.3: Add PDF Upload Trigger

In `app/(teacher)/materials.tsx` or `app/(teacher)/problem-bank.tsx`, add a button that:

1. Opens document picker (already available via `expo-document-picker`):

```typescript
import * as DocumentPicker from 'expo-document-picker';

const pickPDF = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return;

  const file = result.assets[0];
  setIsExtracting(true);

  try {
    // Check file size before extraction
    await checkFileSize(file.uri);

    const extractionResult = await extractProblemsFromFile(file.uri, file.mimeType || 'application/pdf');

    if (extractionResult.success) {
      // Navigate to problem-extract screen with results
      router.push({
        pathname: '/(teacher)/problem-extract',
        params: { problems: JSON.stringify(extractionResult.problems) },
      });
    } else {
      Alert.alert('추출 실패', extractionResult.error);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.';
    Alert.alert('오류', message);
  }

  setIsExtracting(false);
};
```

#### Step 5.4: Add Camera Capture Trigger

```typescript
import * as ImagePicker from 'expo-image-picker';

const takePhoto = async () => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('카메라 권한이 필요합니다');
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: 'images',
    quality: 0.8,
    base64: false,
  });

  if (result.canceled) return;

  const asset = result.assets[0];
  setIsExtracting(true);

  const extractionResult = await extractProblemsFromFile(
    asset.uri,
    asset.mimeType || 'image/jpeg'
  );

  if (extractionResult.success) {
    router.push({
      pathname: '/(teacher)/problem-extract',
      params: { problems: JSON.stringify(extractionResult.problems) },
    });
  } else {
    Alert.alert('추출 실패', extractionResult.error);
  }

  setIsExtracting(false);
};
```

#### Step 5.5: Save Extracted Problems to Problem Bank

In `app/(teacher)/problem-extract.tsx`, the "숙제 만들기" (Create Assignment) button already exists (line 84-89). Add a **second button**: "문제은행 저장" (Save to Problem Bank):

```typescript
import { useProblemBankStore } from '../../src/stores/problemBankStore';
import { useAuthStore } from '../../src/stores/authStore';

const handleSaveToProblemBank = async () => {
  const { user } = useAuthStore.getState();
  const { bulkCreateProblems } = useProblemBankStore.getState();

  const selectedProblems = problems.filter((p) => selectedIds.has(p.id));

  const problemBankItems = selectedProblems.map((p) => ({
    academyId: user!.academyId,
    createdBy: user!.id,
    content: p.content,
    imageUrls: [],
    answer: p.answer,
    difficulty: p.difficulty,
    type: p.type,
    choices: p.choices || null,
    grade: '고1' as Grade, // default, user can change later
    subject: '수학',
    topic: p.topic,
    tags: [p.topic],
    sourceType: 'ai_extracted' as SourceType,
    points: 10,
  }));

  await bulkCreateProblems(problemBankItems);
  Alert.alert('저장 완료', `${selectedProblems.length}개의 문제가 문제은행에 저장되었습니다.`);
  router.back();
};
```

#### Step 5.6: Loading UI During Extraction

Since Gemini API calls take 5-15 seconds for a PDF, add a proper loading state:

```typescript
{isExtracting && (
  <View style={styles.extractingOverlay}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.extractingText}>AI가 문제를 추출하고 있습니다...</Text>
    <Text style={styles.extractingSubtext}>PDF 크기에 따라 10-30초 소요될 수 있습니다</Text>
  </View>
)}
```

### Acceptance Criteria

- [ ] Teacher can tap a button to pick a PDF file and trigger extraction
- [ ] Teacher can tap a button to take a camera photo and trigger extraction
- [ ] Files over 10MB are rejected with a clear Korean error message before attempting extraction
- [ ] Loading indicator shows during extraction
- [ ] Extracted problems display on the `problem-extract` screen with correct LaTeX rendering
- [ ] Teacher can select problems and save them to the problem bank (Supabase)
- [ ] Saved problems appear in the problem bank list
- [ ] Error handling works (invalid file, API failure, no problems found, file too large)

### Estimated Effort

**1 day** (most infrastructure exists; primary work is UI wiring and testing)

---

## Section 6: Screen-Store Connection + Dashboard Data Integration (All Roles)

### Objective

Replace all hardcoded mock data inside screen components with data fetched from Zustand stores, and connect all three role dashboards to real data so the demo shows a living, data-driven app. After this section, every screen displays real data.

### Dependencies

- Section 3 (Auth -- `user` object must be available in stores)
- Section 4 (Supabase services -- stores must return real data)

### Files to Modify

| Screen File | Store to Connect | Current Issue |
|------------|-----------------|---------------|
| `app/(teacher)/index.tsx` | assignmentStore, submissionStore | Lines 62-73: `const stats = { totalStudents: 24, ... }` and `const recentSubmissions = [...]` hardcoded |
| `app/(student)/index.tsx` | assignmentStore, submissionStore | Lines 29-57: `const mockHomework: HomeworkItem[] = [...]` hardcoded |
| `app/(teacher)/assignments.tsx` | assignmentStore | Likely has hardcoded assignment lists |
| `app/(teacher)/grading.tsx` | submissionStore | Likely has hardcoded submission lists |
| `app/(teacher)/students.tsx` | Supabase direct query or new store | Likely has hardcoded student lists |
| `app/(teacher)/student-analytics.tsx` | analyticsStore | Likely has hardcoded analytics data |
| `app/(student)/homework.tsx` | assignmentStore | Likely has hardcoded homework lists |
| `app/(student)/wrong-notes.tsx` | wrongNoteStore | Likely has hardcoded wrong notes |
| `app/(student)/analytics.tsx` | analyticsStore | Likely has hardcoded analytics data |
| `app/(parent)/index.tsx` | parentStore | Likely has hardcoded child data |
| `app/(parent)/schedule.tsx` | parentStore | Likely has hardcoded schedule |
| `app/(parent)/report.tsx` | parentStore | Likely has hardcoded report data |

### Implementation Details

#### Pattern: Connecting a Screen to a Store

For each screen, the migration follows the same pattern:

**Before** (hardcoded):
```typescript
export default function TeacherDashboard() {
  const stats = { totalStudents: 24, pendingAssignments: 5, ... }; // HARDCODED
  return <View><Text>{stats.totalStudents}</Text></View>;
}
```

**After** (store-connected):
```typescript
export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const { assignments, fetchAssignments } = useAssignmentStore();
  const { submissions } = useSubmissionStore();

  useEffect(() => {
    if (user) {
      fetchAssignments(user.id);
    }
  }, [user]);

  const stats = useMemo(() => ({
    totalStudents: 24, // TODO: from a students query
    pendingAssignments: assignments.filter(a => a.status === 'published').length,
    submissionsToGrade: submissions.filter(s => !s.gradedAt).length,
    todayClasses: 3, // TODO: from schedule
  }), [assignments, submissions]);

  return <View><Text>{stats.totalStudents}</Text></View>;
}
```

#### Step 6.1: Teacher Dashboard (`app/(teacher)/index.tsx`)

Remove:
- `const stats = { totalStudents: 24, ... }` (line 62-67)
- `const recentSubmissions = [...]` (line 69-73)

Add:
- `useAssignmentStore()` for assignment counts
- `useSubmissionStore()` for pending grading count
- `useEffect` to fetch data on mount
- Compute `stats` from store data with `useMemo`

**Final dashboard integration**:
```typescript
const stats = useMemo(() => {
  // Query teacher_dashboard view or compute from stores
  const activeAssignments = assignments.filter(a => a.status === 'published');
  const pendingGradings = submissions.filter(s => s.score === undefined || s.score === null);

  return {
    totalStudents: studentCount, // from a Supabase query
    pendingAssignments: activeAssignments.length,
    submissionsToGrade: pendingGradings.length,
    todayClasses: todayScheduleCount, // from schedule data or hardcoded for demo
  };
}, [assignments, submissions, studentCount]);
```

For "최근 제출" (Recent Submissions), query the 5 most recent:

```typescript
const { data: recentSubs } = await supabase
  .from('submissions')
  .select('*, profiles!student_id(name), assignments!assignment_id(title)')
  .order('submitted_at', { ascending: false })
  .limit(5);
```

#### Step 6.2: Student Dashboard (`app/(student)/index.tsx`)

Remove:
- `const mockHomework: HomeworkItem[] = [...]` (lines 29-57)
- Hardcoded stats: `value="45"`, `value="7일"`, `value="92%"` (lines 183-199)
- Hardcoded academy info: `수학왕 학원`, `다음 수업 오늘 오후 4:00` (lines 234-262)

Add:
- `useAssignmentStore()` to fetch student assignments
- Map assignments to the `HomeworkItem` format the component expects
- Compute stats from submission data

Replace all hardcoded stats:
- "완료 문제" → from `student_profiles.total_problems_solved`
- "연속 학습" → from `student_profiles.study_streak`
- "평균 점수" → from `student_profiles.average_score`
- Academy info and next class → from `classes` table and `class_students`

#### Step 6.3: Parent Dashboard

The parent service needs to aggregate child data via the `parent_children` table:

```typescript
const getChildDashboard = async (parentId, childId) => {
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('*, profiles!inner(*)')
    .eq('id', childId)
    .single();

  const { data: assignments } = await supabase
    .from('assignment_students')
    .select('*, assignments!inner(*)')
    .eq('student_id', childId)
    .order('assigned_at', { ascending: false })
    .limit(10);

  return {
    child: mapToChildInfo(profile),
    recentAssignments: assignments,
    stats: {
      totalProblems: profile.total_problems_solved,
      averageScore: profile.average_score,
      streak: profile.study_streak,
    },
  };
};
```

#### Step 6.4: All Other Screens

Apply the same pattern to each remaining screen. For each:
1. Identify hardcoded data (look for `const mock...` or literal arrays/objects)
2. Import the relevant store
3. Add `useEffect` to fetch on mount (using `user.id` from authStore)
4. Replace hardcoded data with store state
5. Add loading states (`isLoading` from store) and error states

### Acceptance Criteria

- [ ] No screen has hardcoded mock data in the component body
- [ ] Every screen fetches data from stores on mount
- [ ] Loading indicators show while data is being fetched
- [ ] Error states show when fetch fails
- [ ] Teacher dashboard shows real counts (assignments, pending gradings)
- [ ] Teacher dashboard shows real-time stats that match actual database state
- [ ] Student dashboard shows real assigned homework with correct progress
- [ ] Student dashboard shows real progress, streak, and score
- [ ] Parent dashboard shows real child data via `parent_children` table
- [ ] All numbers update after creating assignments, submitting answers, grading
- [ ] No hardcoded mock data remains in any dashboard

### Estimated Effort

**2-3 days** (11+ screens, ~2-3 hours per screen for data connection + testing, including dashboard final integration)

---

## Section 7: Assignment Creation Flow (Teacher)

### Objective

Implement the complete assignment creation flow: Teacher selects problems from the problem bank → Creates an assignment with title, due date, grade → Assigns to students → Publishes.

### Dependencies

- Section 4 (Supabase assignment service)
- Section 5 (Problem bank populated with extracted problems)
- Section 6 (Screens connected to stores)

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/(teacher)/assignments.tsx` | **Modify** | Add "새 숙제 만들기" form with problem selection |
| `app/(teacher)/problem-bank.tsx` | **Modify** | Add multi-select mode for assignment creation |
| `src/stores/assignmentStore.ts` | No change | `createAssignment()` already calls service |

### Implementation Details

#### Step 7.1: Assignment Creation Form

On the `assignments.tsx` screen, add a creation modal or inline form:

1. **Title** (text input)
2. **Description** (text input, optional)
3. **Grade** (dropdown: 중1-고3)
4. **Subject** (dropdown: 수학I, 수학II, etc.)
5. **Due Date** (date picker)
6. **Problems** (navigate to problem bank to select, or receive from `problem-extract` screen)
7. **Students** (multi-select from student list)

#### Step 7.2: Problem Selection from Problem Bank

In `problem-bank.tsx`, add a "숙제에 추가" (Add to Assignment) mode:

1. User enters selection mode
2. Checkboxes appear on each problem card
3. "선택 완료" (Selection Complete) button at bottom
4. Selected problem IDs are passed back to the assignment creation flow

This can be done via:
- Route params: `router.push('/(teacher)/problem-bank?selectMode=true')`
- The screen checks `selectMode` and shows checkboxes
- On "완료", it calls `router.back()` with selected IDs via a shared store or route params

#### Step 7.3: Student Assignment

Query the list of students in the teacher's academy:

```typescript
const { data: students } = await supabase
  .from('profiles')
  .select('id, name')
  .eq('academy_id', user.academyId)
  .eq('role', 'student');
```

Display as a multi-select checkbox list. Teacher selects which students receive the assignment.

#### Step 7.4: Create and Publish

```typescript
const handleCreate = async () => {
  // Uses RPC create_assignment_with_details() under the hood (see Section 4)
  const newAssignment = await createAssignment({
    academyId: user.academyId,
    teacherId: user.id,
    title,
    description,
    grade,
    subject,
    dueDate,
    status: 'draft',
    problems: selectedProblemIds.map((id, i) => ({ id, content: '', points: 10 })),
    assignedStudents: selectedStudentIds,
  });

  // Optionally publish immediately
  await publishAssignment(newAssignment.id);

  Alert.alert('과제 생성 완료', `${selectedStudentIds.length}명의 학생에게 배정되었습니다.`);
  router.back();
};
```

### Acceptance Criteria

- [ ] Teacher can create an assignment with title, description, due date
- [ ] Teacher can select problems from the problem bank
- [ ] Teacher can select students to assign
- [ ] Assignment is saved to Supabase via `create_assignment_with_details()` RPC (single transaction)
- [ ] Publishing an assignment changes its status to 'published'
- [ ] Published assignment appears in the student's homework list
- [ ] `notify_assignment` trigger creates a notification for assigned students

### Estimated Effort

**1 day** (UI form building + integration testing)

---

## Section 8: Problem Solving + Submission Flow (Student)

### Objective

Implement the complete student problem-solving flow: Student selects an assignment → Sees problem list → Solves each problem on the canvas → Submits answer → Progress updates.

### Dependencies

- Section 7 (Assignments must exist with problems and student assignments)
- Section 4 (Supabase submission service)

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/(student)/homework.tsx` | **Modify** | Show real assignment list from store, navigate to solve |
| `app/(student)/solve.tsx` | **Modify** | Wire canvas submission to `submissionStore.submitAnswer()` |
| `src/stores/submissionStore.ts` | No change | `submitAnswer()` already calls service |

### Implementation Details

#### Step 8.1: Homework List (`homework.tsx`)

Connect to `assignmentStore.fetchStudentAssignments(user.id)`:

```typescript
const { user } = useAuthStore();
const { assignments, fetchStudentAssignments } = useAssignmentStore();

useEffect(() => {
  if (user) fetchStudentAssignments(user.id);
}, [user]);
```

Display each assignment with:
- Title, subject, due date
- Progress (from `assignment_students.progress_percent`)
- Status badge (assigned, in_progress, submitted, graded)

Tap navigates to `/(student)/solve?assignmentId=XXX`.

#### Step 8.2: Solve Screen (`solve.tsx`)

The solve screen already has a Skia canvas for drawing. Wire up:

1. **Load problems**: When the screen opens, fetch problems for this assignment:

```typescript
const { assignmentId, problemIndex = '0' } = useLocalSearchParams();
const [assignment, setAssignment] = useState<Assignment | null>(null);
const [currentProblemIdx, setCurrentProblemIdx] = useState(parseInt(problemIndex));

useEffect(() => {
  const load = async () => {
    const a = await getAssignmentById(assignmentId);
    setAssignment(a);
  };
  load();
}, [assignmentId]);
```

2. **Display current problem**: Show problem content (LaTeX rendered via MathText component), choices for multiple-choice problems.

3. **Answer input**:
   - **Multiple choice**: Tap to select an option (e.g., 1 2 3 4 5)
   - **Short answer**: Text input field
   - **Essay**: Canvas drawing + optional text

4. **Submit answer**:

```typescript
const handleSubmit = async () => {
  const problem = assignment.problems[currentProblemIdx];

  // For canvas-based answers, capture the canvas as an image
  let answerImageUrl: string | undefined;
  if (canvasRef.current) {
    const snapshot = canvasRef.current.makeImageSnapshot();
    const base64 = snapshot.encodeToBase64();
    // Upload to Supabase Storage
    const { data } = await supabase.storage
      .from('submissions')
      .upload(`${user.id}/${assignmentId}/${problem.id}.png`, decode(base64), {
        contentType: 'image/png',
      });
    if (data) {
      // Use createSignedUrl for private buckets (getPublicUrl returns 403 on private buckets)
      const { data: signedData } = await supabase.storage
        .from('submissions')
        .createSignedUrl(data.path, 3600); // 1-hour expiry
      answerImageUrl = signedData?.signedUrl;
    }
  }

  await submitAnswer({
    assignmentId,
    studentId: user.id,
    problemId: problem.id,
    answerText: selectedAnswer,
    answerImageUrl,
    // Note: canvasData (stroke data) is NOT included here -- see persistence note below
    timeSpentSeconds: elapsedTime,
  });

  // Move to next problem or show completion
  if (currentProblemIdx < assignment.problems.length - 1) {
    setCurrentProblemIdx(prev => prev + 1);
    resetCanvas();
  } else {
    Alert.alert('제출 완료', '모든 문제를 제출했습니다!');
    router.back();
  }
};
```

5. **Progress tracking**: The `update_assignment_progress` trigger in Supabase automatically updates `assignment_students.progress_percent` after each submission.

> **Persistence note -- strip `canvasData` from persisted submissions**: Canvas stroke data can be very large (hundreds of KB per problem) and will quickly exceed AsyncStorage's ~6MB limit if persisted via Zustand. Use `partialize` in the submission store's persist config to exclude `canvasData`:
>
> ```typescript
> persist(
>   (set, get) => ({ /* store definition */ }),
>   {
>     name: 'mathpia-submissions',
>     storage: createJSONStorage(() => AsyncStorage),
>     partialize: (state) => ({
>       ...state,
>       // Strip canvasData from all submissions before persisting
>       submissions: state.submissions.map(({ canvasData, ...rest }) => rest),
>     }),
>   }
> )
> ```
>
> The canvas image is already uploaded to Supabase Storage as a PNG, so the raw stroke data does not need to be persisted locally.

> **Store hydration guard**: Screens that depend on persisted submission data should check `persist.hasHydrated()` before rendering, to avoid showing empty lists during the brief async rehydration period:
>
> ```typescript
> const hasHydrated = useSubmissionStore.persist.hasHydrated();
> if (!hasHydrated) return <LoadingIndicator />;
> ```

#### Step 8.3: Timer

Add a simple timer that tracks `timeSpentSeconds` for each problem:

```typescript
const [startTime, setStartTime] = useState(Date.now());
useEffect(() => { setStartTime(Date.now()); }, [currentProblemIdx]);
const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
```

### Acceptance Criteria

- [ ] Student sees their assigned homework list with real data
- [ ] Tapping an assignment opens the solve screen with the correct problems
- [ ] Multiple-choice problems show selectable options
- [ ] Canvas drawing works for essay/short-answer problems
- [ ] "제출" button submits the answer to Supabase
- [ ] Canvas images are uploaded using `createSignedUrl()` (not `getPublicUrl()`) for private storage buckets
- [ ] Progress bar updates after each submission
- [ ] Completing all problems shows a completion message
- [ ] Canvas drawings are uploaded to Supabase Storage as images
- [ ] Time spent is tracked per problem
- [ ] `canvasData` is stripped from persisted submissions via `partialize`

### Estimated Effort

**1-1.5 days** (canvas integration is the trickiest part)

---

## Section 9: Grading Flow (Teacher)

### Objective

Implement the teacher grading flow: Teacher sees submitted assignments → Views each student's answers (including canvas drawings) → Marks correct/incorrect → Adds score and feedback → Saves grading.

### Dependencies

- Section 8 (Submissions must exist to grade)
- Section 4 (Supabase grading service)

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/(teacher)/grading.tsx` | **Modify** | Show real submissions list, implement grading UI |
| `src/stores/submissionStore.ts` | No change | `gradeSubmission()` already calls service |

### Implementation Details

#### Step 9.1: Grading List

Show assignments that have pending (ungraded) submissions:

```typescript
const { user } = useAuthStore();
const { assignments, fetchAssignments } = useAssignmentStore();

useEffect(() => {
  if (user) fetchAssignments(user.id, 'published');
}, [user]);

// For each assignment, show count of pending gradings
// This can be computed from the assignment_progress_view or by querying submissions
```

#### Step 9.2: Student Submission View

When teacher selects an assignment, show a list of students with their submission status:

```typescript
// Fetch all submissions for this assignment
const { data: submissions } = await supabase
  .from('submissions')
  .select('*, profiles!student_id(name)')
  .eq('assignment_id', assignmentId)
  .is('score', null); // Only ungraded
```

For each student, show:
- Student name
- Number of problems submitted vs total
- Status (submitted, partially submitted)

#### Step 9.3: Individual Problem Grading

When teacher clicks a student's submission:

1. Show the problem content (LaTeX)
2. Show the student's answer:
   - Text answer (if provided)
   - Canvas image (loaded via **signed URL** from Supabase Storage -- use `createSignedUrl()` since the submissions bucket is private):

```typescript
// Load canvas image for display
const { data: signedData } = await supabase.storage
  .from('submissions')
  .createSignedUrl(submission.answer_image_path, 3600); // 1-hour expiry
const imageUrl = signedData?.signedUrl;
```

3. Show the correct answer (from problem bank)
4. Grading controls:
   - **Correct/Incorrect** toggle (or partial credit slider)
   - **Score** input (numeric)
   - **Feedback** text input (optional)
5. **Submit grading** button

```typescript
const handleGrade = async (submissionId: string, score: number, feedback?: string) => {
  // Determine isCorrect: score >= 50% of the problem's max points counts as correct.
  // This is important because wrong-note auto-generation relies on is_correct = false.
  const problem = getProblemForSubmission(submissionId);
  const isCorrect = score >= (problem.points * 0.5);

  await gradeSubmission(submissionId, user.id, { score, feedback, isCorrect });
  // The sync_grading_score trigger updates submissions.score, submissions.is_correct,
  // and sets assignment_students.status = 'graded' only when ALL problems are graded.
  // Move to next ungraded submission
};
```

#### Step 9.4: Auto-Grading for Multiple Choice

For multiple-choice problems, auto-check the answer:

```typescript
const isAutoGradable = problem.type === '객관식' && problem.answer;
if (isAutoGradable) {
  const isCorrect = submission.answerText === problem.answer;
  // Pre-fill score: full points if correct, 0 if incorrect
  setSuggestedScore(isCorrect ? problem.points : 0);
  setSuggestedIsCorrect(isCorrect);
}
```

Teachers can override the auto-grade.

### Acceptance Criteria

- [ ] Teacher sees a list of assignments with pending gradings
- [ ] Teacher can view each student's submissions
- [ ] Canvas drawing images load correctly via signed URLs (not public URLs)
- [ ] Teacher can mark correct/incorrect and enter a score
- [ ] Teacher can add optional feedback text
- [ ] Multiple-choice auto-grading suggests correct/incorrect
- [ ] `isCorrect` field is set when grading (score >= 50% of points = correct)
- [ ] Grading saves to Supabase and triggers `sync_grading_score`
- [ ] After grading ALL problems, `assignment_students.status` updates to 'graded' (not after each one)
- [ ] Student stats (`student_profiles.average_score`) update via trigger
- [ ] Wrong notes are auto-generated from submissions where `is_correct = false`

### Estimated Effort

**1 day** (UI for viewing answers + grading controls)

---

## Section 10: Testing & Polish

### Objective

Verify the entire demo flow works end-to-end, fix bugs, improve UX for common paths, and ensure the app is demo-ready.

### Dependencies

- All previous sections (1-9)

### Test Scenarios

#### End-to-End Demo Script

| Step | Actor | Action | Expected Result |
|------|-------|--------|----------------|
| 1 | Teacher | Sign up / log in | Dashboard with real stats |
| 2 | Teacher | Upload PDF | Gemini extracts problems |
| 3 | Teacher | Save problems to bank | Problems appear in problem bank |
| 4 | Teacher | Take camera photo | Gemini extracts problems from photo |
| 5 | Teacher | Create assignment | Select problems, assign to students, publish |
| 6 | Student | Log in | Dashboard shows new assignment |
| 7 | Student | Open assignment | Problem list loads |
| 8 | Student | Solve problems | Canvas drawing, answer selection works |
| 9 | Student | Submit all answers | Progress reaches 100%, status changes |
| 10 | Teacher | Open grading | Sees student's submissions |
| 11 | Teacher | Grade each problem | Score + feedback saved |
| 12 | Teacher | Complete grading | Student's status becomes 'graded' |
| 13 | Student | View results | Sees scores and feedback |
| 14 | Parent | Log in | Sees child's assignment results |

#### Error Handling Test Cases

| Scenario | Expected Behavior |
|----------|------------------|
| Network offline during login | Error message: "네트워크 연결을 확인해주세요" |
| Wrong email/password | Error message: "이메일 또는 비밀번호가 올바르지 않습니다" |
| Gemini API failure | Error alert with retry option |
| Large PDF (>10MB) | Clear error: "파일 크기가 너무 큽니다 (XMB). 최대 10MB까지 지원됩니다." |
| Submitting after due date | Warning or block based on `allow_late_submission` |

### Polish Items

| Item | Priority | Description |
|------|----------|-------------|
| Loading states | High | Every async operation shows a spinner |
| Error toasts | High | User-friendly Korean error messages |
| Pull-to-refresh | Medium | Allow refreshing data on list screens |
| Empty states | Medium | Show helpful messages when lists are empty |
| Keyboard handling | Medium | Dismiss keyboard properly on form screens |
| LaTeX rendering | High | Verify MathText component renders all extracted problems correctly |
| Offline fallback | Low | Show cached data when offline (AsyncStorage already persists) |

### Acceptance Criteria

- [ ] Full demo script (14 steps above) completes without errors
- [ ] All three roles can log in and see their respective dashboards
- [ ] PDF extraction works with a real Korean math textbook PDF
- [ ] Camera extraction works with a photo of a math problem
- [ ] Assignment → Solve → Grade full cycle works
- [ ] No JavaScript errors in the console during the demo flow
- [ ] Korean text displays correctly throughout
- [ ] App loads within 3 seconds on a modern tablet

### Estimated Effort

**1-2 days** (depends on bug count from previous sections)

---

## Timeline & Priority Matrix

### Two-Week Schedule

| Day | Section | Task | Priority |
|-----|---------|------|----------|
| **Day 1** | Section 1 | Supabase setup, schema, seed data | CRITICAL |
| **Day 2** | Section 2 + 3 | Client integration + Auth migration | CRITICAL |
| **Day 3-4** | Section 4 | Supabase service implementations (problem bank, assignment) | CRITICAL |
| **Day 5** | Section 4 (cont.) | Supabase service implementations (submission, analytics, parent) | CRITICAL |
| **Day 6** | Section 5 | Gemini PDF/photo extraction end-to-end | HIGH |
| **Day 7-8** | Section 6 | Screen-store connection + dashboard data integration (all roles) | HIGH |
| **Day 9** | Section 7 | Assignment creation flow | HIGH |
| **Day 10** | Section 8 | Problem solving + submission flow | HIGH |
| **Day 11** | Section 9 | Grading flow | HIGH |
| **Day 12-14** | Section 10 | Testing, bug fixes, polish | HIGH |

### If Time is Short (1-Week Minimum Viable Demo)

If only 1 week is available, prioritize:

| Priority | Sections | What You Get |
|----------|----------|-------------|
| **Must Have** | 1, 2, 3, 4 (partial) | Real auth + real data storage |
| **Must Have** | 5 | Gemini PDF extraction (the "wow" feature) |
| **Must Have** | 7, 8, 9 (simplified) | Basic assignment → solve → grade flow |
| **Nice to Have** | 6 | All screens show real data + dashboard integration |
| **Nice to Have** | 10 | Testing and polish |

For a 1-week demo, you could skip:
- `supabaseAnalyticsService` (use mock)
- `supabaseWrongNoteService` (use mock)
- `supabaseParentService` (use mock)
- Parent dashboard real data
- Student analytics real data

This lets the service factory use a mix:
```typescript
const services: Services = {
  problemBank: supabaseProblemBankService, // REAL
  assignment: supabaseAssignmentService,   // REAL
  analytics: mockAnalyticsService,         // MOCK (for now)
  wrongNote: mockWrongNoteService,         // MOCK (for now)
  parent: mockParentService,               // MOCK (for now)
};
```

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gemini API rate limits | Medium | High | Cache extracted results; batch problems in single prompt |
| RLS policy blocks valid queries | High | Medium | Test each RLS policy individually; use `get_my_academy_id()` helper to avoid circular deps; use Supabase dashboard to debug |
| Type mismatches (DB vs TS) | High | Low | Auto-generate types with `supabase gen types`; create mapper functions |
| Canvas image upload size | Medium | Medium | Compress canvas snapshots; set max resolution |
| Expo SDK 54 + Supabase compatibility | Low | High | `react-native-url-polyfill` is required; test on real device early |
| AsyncStorage size limits | Low | Medium | Don't persist large submission data; strip `canvasData` from persist via `partialize` |
| Korean text in Gemini prompts | Low | Low | Existing prompt is already Korean-optimized and tested |
| File size OOM on tablet | Medium | High | Enforce 10MB file size limit before Gemini extraction; note Gemini File API for larger files post-demo |
| Partial assignment creation failure | Medium | High | Use `create_assignment_with_details()` RPC for transactional creation |
| Date serialization after Zustand rehydration | High | Medium | Use ISO strings instead of Date objects; add `formatDate()` utility |

### Fallback Plan

If Supabase integration hits blockers, the app can still demo using mock services:
1. Keep `src/services/mock/` intact (it's already complete)
2. Toggle `src/services/index.ts` back to mock implementations
3. Screen-store connections (Section 6) work identically with mock or Supabase
4. Gemini extraction (Section 5) works independently of the backend

This means **partial completion is still demo-able** -- the worst case is a demo with real AI extraction but mock backend data.

---

## File Inventory Summary

### New Files (17 files)

```
src/lib/
  supabase.ts                              # Supabase client singleton (with env var validation)
  database.types.ts                        # Auto-generated DB types

src/services/supabase/
  supabaseClient.ts                        # Re-export + helpers
  supabaseProblemBankService.ts            # IProblemBankService impl
  supabaseAssignmentService.ts             # IAssignmentService impl
  supabaseAnalyticsService.ts              # IAnalyticsService impl
  supabaseWrongNoteService.ts              # IWrongNoteService impl
  supabaseParentService.ts                 # IParentService impl
  index.ts                                 # Export all services
  mappers.ts                               # Generic bidirectional column mapper utility (snake_case <-> camelCase) + sort field mapper

supabase/migrations/
  001_enums_and_functions.sql              # ENUMs (incl. 'parent' role) + update_updated_at() + get_my_academy_id()
  002_tables.sql                           # All tables (incl. parent_children)
  003_rls_policies.sql                     # RLS policies (using get_my_academy_id() helper)
  004_triggers_and_functions.sql           # Triggers + create_assignment_with_details() RPC
  005_views.sql
  006_storage.sql

supabase/
  seed.sql                                 # Demo seed data (non-auth: academy, problems, assignments)

scripts/
  seed.ts                                  # TypeScript seed script for auth users (calls Supabase Auth API)
```

### Modified Files (15+ files)

```
.env                                       # Add Supabase credentials
package.json                               # Add Supabase deps
src/services/index.ts                      # Switch mock -> supabase
src/stores/authStore.ts                    # Mock -> Supabase Auth
app/_layout.tsx                            # URL polyfill + auth listener + auth loading gate
app/(auth)/login.tsx                       # Supabase error handling
app/(auth)/register.tsx                    # Supabase signup
app/(teacher)/index.tsx                    # Store connection + dashboard integration
app/(teacher)/assignments.tsx              # Assignment creation
app/(teacher)/grading.tsx                  # Grading flow (with isCorrect + signed URLs)
app/(teacher)/problem-bank.tsx             # Problem selection
app/(teacher)/problem-extract.tsx          # Save to bank button
app/(teacher)/materials.tsx                # PDF upload / camera (with file size check)
app/(teacher)/student-analytics.tsx        # Store connection
app/(student)/index.tsx                    # Store connection + dashboard integration
app/(student)/homework.tsx                 # Store connection
app/(student)/solve.tsx                    # Submit answers (signed URLs, no canvasData persist)
app/(parent)/index.tsx                     # Store connection (via parent_children)
app/(parent)/schedule.tsx                  # Store connection
app/(parent)/report.tsx                    # Store connection
+ remaining screens as needed
```

### Unchanged Files

```
src/services/interfaces/*                  # All 5 interfaces stay the same
src/services/mock/*                        # Kept as fallback
src/stores/problemBankStore.ts             # Already calls services
src/stores/assignmentStore.ts              # Already calls services
src/stores/submissionStore.ts              # Already calls services
src/stores/analyticsStore.ts               # Already calls services
src/stores/wrongNoteStore.ts              # Already calls services
src/stores/parentStore.ts                  # Already calls services
src/stores/dataFlowConnector.ts            # Cross-store subscriptions work as-is
src/services/geminiUtils.ts                # Utility functions unchanged
src/types/*                                # All type definitions unchanged
src/components/*                           # All UI components unchanged
src/constants/*                            # Theme, design tokens unchanged
```

---

## Quick Reference: Key Commands

```bash
# Install dependencies
npx expo install @supabase/supabase-js react-native-url-polyfill

# Generate DB types (run after any schema change)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

# Run seed script for auth users
npx tsx scripts/seed.ts

# Start dev server
npx expo start

# Run on tablet
npx expo start --android  # or --ios
```
