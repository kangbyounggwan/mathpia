# Section 2: Supabase Client Integration in Expo

> **Status**: Not started
> **Estimated Effort**: 2-3 hours
> **Priority**: CRITICAL
> **Source Plan**: `planning-func/claude-plan.md` - Section 2

---

## 1. Background

After Section 1 establishes the Supabase project (database schema, RLS policies, storage buckets, seed data), the Expo app needs a way to communicate with it. This section installs the Supabase JavaScript client library, creates a typed singleton client, auto-generates TypeScript types from the live database schema, and verifies that the app can reach Supabase from a React Native runtime.

The Supabase JS client requires two things that React Native does not provide out of the box:

1. **A URL polyfill** -- React Native lacks a spec-compliant `URL` global that `@supabase/supabase-js` depends on internally for request construction. The `react-native-url-polyfill` package fills this gap.
2. **An async storage adapter** -- The Supabase auth module needs a persistent key-value store to save and restore session tokens across app restarts. `@react-native-async-storage/async-storage` (already installed for Zustand persistence) serves this purpose.

This section also introduces a preparatory design decision about **Date field representation** that affects every subsequent section. Zustand's `persist` middleware serializes state through `JSON.stringify()`, which converts `Date` objects into ISO strings. On rehydration, those fields remain strings -- not `Date` instances. Code that calls `.toLocaleDateString()` or `.getTime()` on a rehydrated value will silently fail or crash. The fix is to standardize on ISO strings throughout the app before building Supabase services.

### Current State of the Codebase (relevant to this section)

| Aspect | Current Value |
|--------|--------------|
| `package.json` dependencies | No `@supabase/supabase-js`, no `react-native-url-polyfill` |
| `@react-native-async-storage/async-storage` | Already installed (version `2.2.0`, used by Zustand) |
| `src/lib/` directory | Does not exist yet |
| `.env` | Contains only `EXPO_PUBLIC_GEMINI_API_KEY` |
| `app/_layout.tsx` | Loads fonts, initializes store subscriptions, renders `<Stack>` -- no URL polyfill, no Supabase references |
| `tsconfig.json` | Has `baseUrl: "."` and path alias `@/*` mapped to `src/*` |
| TypeScript Date fields | `createdAt: Date`, `dueDate: Date`, etc. across `src/types/index.ts` and `src/types/problemBank.ts` |

---

## 2. Requirements

When this section is complete, the following must be true:

1. The Supabase JS client is installed and importable from any file in the project.
2. A typed Supabase client singleton (`supabase`) is exported from `src/lib/supabase.ts`.
3. Environment variable validation happens at module load time with a clear error if variables are missing -- no `!` non-null assertions on `process.env` values.
4. Auto-generated TypeScript types in `src/lib/database.types.ts` match the live database schema (all 18 tables, all ENUM types).
5. The URL polyfill is loaded before any Supabase code runs.
6. The app starts without errors on Android, iOS, and Expo Go.
7. A test query to Supabase returns a valid response (empty array from RLS, or an auth error) -- not a network error or URL construction crash.

---

## 3. Dependencies

### Requires

| Section | What it provides |
|---------|-----------------|
| **Section 1** (Supabase Project Setup + DB Schema + RLS) | A live Supabase project with schema applied, `.env` populated with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

### Blocks

| Section | Why it needs this section |
|---------|--------------------------|
| **Section 3** (Auth Migration) | Imports `supabase` from `src/lib/supabase.ts` for `signInWithPassword`, `signUp`, `onAuthStateChange` |
| **Section 4** (Supabase Services) | Imports `supabase` client and `Database` types for all service implementations |
| **Section 5** (Gemini Extraction) | Needs Section 4, which needs this section |
| **Section 6** (Screen-Store Connection) | Needs Section 4, which needs this section |
| **Section 7** (Assignment Creation) | Needs Section 4, which needs this section |
| **Section 8** (Problem Solving) | Needs Section 4, which needs this section |
| **Section 9** (Grading Flow) | Needs Section 4, which needs this section |
| **Section 10** (Testing & Polish) | Needs all previous sections |

---

## 4. Implementation Details

### Step 2.1: Install Dependencies

Run in the project root:

```bash
npx expo install @supabase/supabase-js react-native-url-polyfill
```

**Why `npx expo install` instead of `npm install`?** Expo's install command resolves compatible versions for the current SDK (54). Using `npm install` directly may pull versions that are incompatible with the React Native version bundled in Expo SDK 54.

**What about `@react-native-async-storage/async-storage`?** It is already in `package.json` at version `2.2.0` (used by Zustand's `createJSONStorage`). No action needed.

After installation, `package.json` should show these new entries under `dependencies`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "react-native-url-polyfill": "^2.x.x"
  }
}
```

The exact versions will be resolved by `npx expo install`.

---

### Step 2.2: Ensure `.env` Has Supabase Credentials

After Section 1, `.env` should already have these values. Verify the file looks like this:

```bash
# .env (project root)
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...existing key...
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: The `EXPO_PUBLIC_` prefix is required. Expo only exposes environment variables that start with `EXPO_PUBLIC_` to the client bundle via `process.env`. Variables without this prefix are stripped at build time and will be `undefined` at runtime.

---

### Step 2.3: Create `src/lib/supabase.ts` -- The Client Singleton

Create the directory and file:

**File**: `src/lib/supabase.ts`

```typescript
// ============================================================
// src/lib/supabase.ts
// Supabase client singleton for the Mathpia Expo app.
//
// This file is the single entry point for all Supabase operations.
// It validates environment variables at module load time and
// configures the client for React Native (AsyncStorage for auth
// persistence, URL polyfill for spec-compliant URL handling).
// ============================================================

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './database.types';

// ---------------------------------------------------------------------------
// Environment variable validation
// ---------------------------------------------------------------------------
// We validate at module load time instead of using non-null assertions (!)
// so that a missing .env file or a typo in variable names produces a clear,
// immediate error rather than a cryptic "Invalid URL" or network failure
// later when the first Supabase call is made.
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    '[Mathpia] Missing EXPO_PUBLIC_SUPABASE_URL. ' +
    'Add it to your .env file in the project root. ' +
    'You can find it in the Supabase Dashboard under Settings > API > Project URL.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    '[Mathpia] Missing EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Add it to your .env file in the project root. ' +
    'You can find it in the Supabase Dashboard under Settings > API > anon public key.'
  );
}

// ---------------------------------------------------------------------------
// Client creation
// ---------------------------------------------------------------------------

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist auth tokens (access_token, refresh_token) in AsyncStorage
    // so the user stays logged in across app restarts.
    storage: AsyncStorage,

    // Automatically refresh the access token before it expires.
    // The default JWT lifetime in Supabase is 3600 seconds (1 hour).
    autoRefreshToken: true,

    // Keep the session alive across app restarts by loading tokens from
    // AsyncStorage on initialization.
    persistSession: true,

    // React Native does not use URL-based OAuth callbacks the way web apps do.
    // Setting this to false prevents the client from trying to parse the
    // current URL for auth tokens (which would fail in React Native).
    detectSessionInUrl: false,
  },
});
```

**Design decisions explained:**

| Decision | Rationale |
|----------|-----------|
| Env var validation with `throw` | A missing URL causes `createClient` to construct invalid fetch URLs, producing opaque errors like "TypeError: Invalid URL". The explicit throw with a human-readable message including where to find the value saves debugging time. |
| `storage: AsyncStorage` | Supabase stores two tokens: `access_token` (JWT, ~1KB) and `refresh_token` (~100 bytes). AsyncStorage handles this easily. This is the same AsyncStorage instance Zustand uses for state persistence -- no conflict because Supabase uses its own key prefix (`sb-<project-ref>-auth-token`). |
| `detectSessionInUrl: false` | On web, Supabase Auth reads tokens from URL fragments after OAuth redirects. In React Native there is no browser URL bar, so this must be `false` to prevent the client from calling `window.location` (which does not exist). |
| `autoRefreshToken: true` | Without this, the JWT expires after 1 hour and all subsequent queries fail with a 401. The client automatically calls `supabase.auth.refreshSession()` before expiry. |
| Generic `<Database>` type parameter | Makes every `.from('table_name')` call type-safe -- the compiler knows the columns, their types, and which are nullable. |

---

### Step 2.4: Generate TypeScript Types from the Database

After the database schema is applied (Section 1), generate types using the Supabase CLI:

```bash
# Install Supabase CLI if not already installed
npm install -D supabase

# Login (one-time)
npx supabase login

# Generate types -- replace YOUR_PROJECT_ID with the actual project reference
# (found in Supabase Dashboard > Settings > General > Reference ID)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

**What this generates**: A single TypeScript file containing a `Database` interface with:
- A `public` schema containing all 18 tables
- For each table: `Row` (select), `Insert` (insert), and `Update` (update) types
- All ENUM types as string literal unions (e.g., `'student' | 'teacher' | 'admin' | 'parent'`)
- JSONB columns typed as `Json` (which is `string | number | boolean | null | { [key: string]: Json } | Json[]`)
- Nullable columns correctly marked with `| null`

The generated file will look approximately like this (abbreviated):

```typescript
// src/lib/database.types.ts (auto-generated -- DO NOT EDIT MANUALLY)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academies: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          subscription_plan: string | null
          max_students: number | null
          max_teachers: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          // ... remaining fields with defaults marked optional
        }
        Update: {
          id?: string
          name?: string
          // ... all fields optional
        }
        Relationships: [
          // ... foreign key relationships
        ]
      }
      profiles: {
        Row: {
          id: string
          academy_id: string
          role: Database['public']['Enums']['user_role']
          name: string
          email: string
          phone: string | null
          profile_image: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        // Insert, Update, Relationships...
      }
      problem_bank: {
        Row: {
          id: string
          academy_id: string
          created_by: string
          content: string
          content_html: string | null
          image_urls: string[]
          answer: string | null
          solution: string | null
          difficulty: Database['public']['Enums']['difficulty_level']
          type: Database['public']['Enums']['problem_type']
          choices: Json | null
          grade: Database['public']['Enums']['grade_level']
          subject: string
          topic: string
          tags: string[]
          source: string | null
          source_type: Database['public']['Enums']['source_type']
          points: number
          usage_count: number
          correct_rate: number | null
          created_at: string
          updated_at: string
        }
        // Insert, Update, Relationships...
      }
      // ... all 18 tables: academies, profiles, student_profiles,
      //     teacher_profiles, parent_children, classes, class_students,
      //     teacher_students, problem_bank, assignments,
      //     assignment_problems, assignment_students, submissions,
      //     gradings, materials, material_access, notifications, study_logs
    }
    Views: {
      student_dashboard: { /* ... */ }
      teacher_dashboard: { /* ... */ }
      assignment_progress_view: { /* ... */ }
    }
    Functions: {
      create_assignment_with_details: {
        Args: {
          p_assignment: Json
          p_problems: Json
          p_student_ids: string[]
        }
        Returns: string
      }
      get_my_academy_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      user_role: 'student' | 'teacher' | 'admin' | 'parent'
      grade_level: '중1' | '중2' | '중3' | '고1' | '고2' | '고3'
      problem_type: '객관식' | '서술형' | '단답형'
      difficulty_level: '상' | '중' | '하'
      source_type: 'manual' | 'ai_extracted'
      assignment_status: 'draft' | 'published' | 'closed'
      student_assignment_status: 'assigned' | 'in_progress' | 'submitted' | 'graded'
      notification_type: 'new_assignment' | 'assignment_due_soon' | 'grading_complete' | 'new_material' | 'submission_received' | 'system'
      activity_type: 'problem_solved' | 'material_viewed' | 'assignment_started' | 'assignment_completed' | 'login'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for convenience
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
```

**Re-generation**: Run the `gen types` command again whenever the database schema changes (e.g., after adding a column or table). The generated file is a complete replacement -- do not manually edit it.

**Add a convenience re-export** at the bottom of `database.types.ts` (or in a separate file) so that service code can import table row types concisely:

```typescript
// These helper types are sometimes included by supabase gen types automatically.
// If not, add them manually at the bottom of database.types.ts:
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
```

Usage in later sections:

```typescript
import type { Tables, TablesInsert, Enums } from '@/lib/database.types';

type ProblemBankRow = Tables<'problem_bank'>;
type ProblemBankInsert = TablesInsert<'problem_bank'>;
type DifficultyEnum = Enums<'difficulty_level'>; // '상' | '중' | '하'
```

---

### Step 2.5: Add URL Polyfill to App Entry Point

**File**: `app/_layout.tsx`

Add the polyfill import as the **very first line** of the file, before any other imports. This ensures the `URL` global is patched before any library (including Supabase) tries to use it.

The current file starts with:

```typescript
import React from 'react';
import { Stack } from 'expo-router';
```

Change to:

```typescript
import 'react-native-url-polyfill/auto';
import React from 'react';
import { Stack } from 'expo-router';
```

The full modified `app/_layout.tsx`:

```typescript
import 'react-native-url-polyfill/auto';
import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from '../src/constants/theme';
import { initializeStoreSubscriptions } from '../src/stores';
import { initializeDataFlowConnections } from '../src/stores/dataFlowConnector';
import { ErrorBoundary } from '../src/components/common/ErrorBoundary';

// Prevent splash screen from auto-hiding (must be called at module scope)
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'NotoSansKR-Regular': require('../assets/fonts/NotoSansKR-Regular.ttf'),
    'NotoSansKR-Medium': require('../assets/fonts/NotoSansKR-Medium.ttf'),
    'NotoSansKR-Bold': require('../assets/fonts/NotoSansKR-Bold.ttf'),
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  React.useEffect(() => {
    const unsubscribe = initializeStoreSubscriptions();
    initializeDataFlowConnections();
    return unsubscribe;
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <ErrorBoundary>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
          </ErrorBoundary>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

**Why at the top of `_layout.tsx`?** In Expo Router, `app/_layout.tsx` is the root layout -- it is the first component file that executes. Placing the polyfill import here guarantees it runs before any Supabase import anywhere in the app. The `import 'react-native-url-polyfill/auto'` side-effect import patches `globalThis.URL` immediately when the module is evaluated.

**Note**: The polyfill import also appears in `src/lib/supabase.ts`. This is intentional redundancy -- if `supabase.ts` is ever imported from a test file or script that does not go through `_layout.tsx`, the polyfill is still applied. The `auto` import is idempotent (safe to call multiple times).

---

### Step 2.6: Verify Connectivity

After completing steps 2.1-2.5, verify the Supabase client works from the running app.

**Option A: Temporary inline test (recommended for first verification)**

Add this temporarily to any screen component (e.g., `app/(auth)/login.tsx`):

```typescript
import { supabase } from '../../src/lib/supabase';

// Inside the component:
React.useEffect(() => {
  const testConnection = async () => {
    console.log('[Supabase Test] Starting connectivity test...');

    // Test 1: Basic query (should return empty array due to RLS)
    const { data, error } = await supabase.from('academies').select('id').limit(1);
    console.log('[Supabase Test] Query result:', { data, error });

    // Test 2: Auth health check
    const { data: session } = await supabase.auth.getSession();
    console.log('[Supabase Test] Session:', session);

    if (error) {
      console.error('[Supabase Test] FAILED:', error.message);
    } else {
      console.log('[Supabase Test] SUCCESS - Connection established');
    }
  };

  testConnection();
}, []);
```

**Expected results:**

| Test | Expected Output | Meaning |
|------|----------------|---------|
| Query `academies` | `{ data: [], error: null }` | RLS is active, no authenticated user, empty result is correct |
| Query `academies` | `{ data: null, error: { message: "..." } }` | If RLS denies even `SELECT` to anon -- also acceptable |
| `getSession()` | `{ session: null }` | No user is logged in yet -- correct |

**What indicates a FAILURE:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| `TypeError: Invalid URL` | URL polyfill not loaded | Ensure `import 'react-native-url-polyfill/auto'` is at top of `_layout.tsx` |
| `FetchError: Network request failed` | Wrong Supabase URL or no internet | Check `EXPO_PUBLIC_SUPABASE_URL` in `.env` |
| App crashes on launch with `Missing Supabase environment variables` | `.env` not loaded or variable names wrong | Restart Expo dev server (`npx expo start --clear`) after adding `.env` values |
| `TypeError: Cannot read property 'getItem' of undefined` | AsyncStorage not installed | Run `npx expo install @react-native-async-storage/async-storage` |

**Option B: Standalone test script (for CI or headless verification)**

```typescript
// scripts/test-supabase-connection.ts
// Run with: npx tsx scripts/test-supabase-connection.ts

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing env vars. Run with:');
  console.error('EXPO_PUBLIC_SUPABASE_URL=... EXPO_PUBLIC_SUPABASE_ANON_KEY=... npx tsx scripts/test-supabase-connection.ts');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  // Test basic connectivity
  const { data, error } = await supabase.from('academies').select('count');
  if (error) {
    console.error('Connection FAILED:', error.message);
    process.exit(1);
  }
  console.log('Connection SUCCESS. Response:', data);

  // Test that types generation will work
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_my_academy_id')
    .maybeSingle();
  console.log('RPC test (get_my_academy_id):', { tables, error: tablesError });
  // This will return null since we are not authenticated -- that is expected.
}

main();
```

**Remove the test code** after verification is complete. It should not remain in the final codebase.

---

### Step 2.7: IMPORTANT -- Date-to-ISO-String Preparatory Note

> **This step is NOT code you write in Section 2. It is a design decision to be aware of now, and to implement at the start of Section 4 before writing Supabase services.**

#### The Problem

The current TypeScript types use `Date` objects for timestamp fields:

```typescript
// src/types/index.ts (current)
export interface Assignment {
  // ...
  dueDate: Date;          // <-- Date object
  createdAt: Date;        // <-- Date object
  publishedAt?: Date;     // <-- Date object
  updatedAt?: Date;       // <-- Date object
}

export interface Submission {
  // ...
  submittedAt: Date;      // <-- Date object
  gradedAt?: Date;        // <-- Date object
}

// src/types/problemBank.ts (current)
export interface ProblemBankItem {
  // ...
  createdAt: Date;        // <-- Date object
  updatedAt?: Date;       // <-- Date object
}
```

This causes two issues:

1. **Zustand persist serialization**: `JSON.stringify(new Date())` produces `"2026-04-04T12:00:00.000Z"` (a string). After rehydration via `JSON.parse()`, the field is a `string`, not a `Date`. Calling `.toLocaleDateString()` on it silently returns `undefined` or throws.

2. **Supabase response format**: Supabase returns timestamps as ISO 8601 strings (e.g., `"2026-04-04T12:00:00+00:00"`), not `Date` objects. The auto-generated `database.types.ts` types all timestamp columns as `string`, not `Date`.

#### The Solution (to implement in Section 4)

Change all `Date` fields to `string` (ISO 8601 format) across the type definitions:

```typescript
// src/types/index.ts (AFTER change -- do this at the start of Section 4)
export interface Assignment {
  // ...
  dueDate: string;          // ISO 8601 string, e.g. "2026-04-15T23:59:59+09:00"
  createdAt: string;        // ISO 8601 string
  publishedAt?: string;     // ISO 8601 string
  updatedAt?: string;       // ISO 8601 string
}
```

Create a formatting utility:

```typescript
// src/utils/date.ts (create in Section 4)

/**
 * Format an ISO date string for display in Korean locale.
 * @param isoString - ISO 8601 date string from Supabase or Zustand
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string, e.g. "2026년 4월 4일" or "4/4 오후 3:00"
 */
export function formatDate(
  isoString: string | undefined | null,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
): string {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleDateString('ko-KR', options);
  } catch {
    return isoString;
  }
}

/**
 * Format a relative time string, e.g. "3일 전", "방금 전".
 */
export function formatRelativeDate(isoString: string | undefined | null): string {
  if (!isoString) return '-';
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 30) return `${diffDays}일 전`;
  return formatDate(isoString);
}

/**
 * Check if a due date has passed.
 */
export function isPastDue(dueDateIso: string | undefined | null): boolean {
  if (!dueDateIso) return false;
  return new Date(dueDateIso).getTime() < Date.now();
}
```

**Files affected by the Date-to-string migration** (reference for Section 4):

| File | Fields to change |
|------|-----------------|
| `src/types/index.ts` | `Academy.createdAt/updatedAt`, `User.createdAt/updatedAt`, `Assignment.dueDate/createdAt/publishedAt/updatedAt`, `AssignmentStudent.assignedAt/startedAt/completedAt`, `Submission.submittedAt/gradedAt`, `Grading.gradedAt`, `Material.createdAt/updatedAt` |
| `src/types/problemBank.ts` | `ProblemBankItem.createdAt/updatedAt` |
| `src/types/analytics.ts` | Any `Date` fields |
| `src/types/wrongNote.ts` | Any `Date` fields |
| `src/types/parent.ts` | Any `Date` fields |
| `src/services/mock/*.ts` | Change `new Date(...)` to `new Date(...).toISOString()` in mock data |
| Screen components | Change `.toLocaleDateString()` calls to `formatDate(isoString)` |

**Why document this now?** Because `src/lib/database.types.ts` (generated in this section) uses `string` for all timestamps. If the app types continue using `Date`, every Supabase service mapper will need `new Date(row.created_at)` conversions that will break on Zustand rehydration. Aligning on strings from the start avoids this entire class of bugs.

---

## 5. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `package.json` | **Modify** | New dependencies: `@supabase/supabase-js`, `react-native-url-polyfill` |
| `package-lock.json` | **Auto-modified** | Updated by `npx expo install` |
| `.env` | **Verify** | Must contain `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (added in Section 1) |
| `src/lib/supabase.ts` | **Create** | Supabase client singleton with typed `Database` generic and env var validation |
| `src/lib/database.types.ts` | **Create** | Auto-generated TypeScript types from `npx supabase gen types` |
| `app/_layout.tsx` | **Modify** | Add `import 'react-native-url-polyfill/auto'` as the first import line |

**Files NOT modified in this section** (but noted for awareness):

| File | Section | Reason |
|------|---------|--------|
| `src/types/index.ts` | Section 4 | Date-to-string migration |
| `src/types/problemBank.ts` | Section 4 | Date-to-string migration |
| `src/services/index.ts` | Section 4 | Service factory swap |
| `src/stores/authStore.ts` | Section 3 | Auth migration |

---

## 6. Acceptance Criteria

- [ ] `@supabase/supabase-js` is listed in `package.json` dependencies and installed in `node_modules`
- [ ] `react-native-url-polyfill` is listed in `package.json` dependencies and installed in `node_modules`
- [ ] `src/lib/supabase.ts` exists and exports a `supabase` client with the `Database` type parameter
- [ ] `src/lib/supabase.ts` validates `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` at module load -- no `!` non-null assertions
- [ ] Removing `EXPO_PUBLIC_SUPABASE_URL` from `.env` and restarting the app produces the error message: `[Mathpia] Missing EXPO_PUBLIC_SUPABASE_URL...`
- [ ] Removing `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env` and restarting the app produces the error message: `[Mathpia] Missing EXPO_PUBLIC_SUPABASE_ANON_KEY...`
- [ ] `src/lib/database.types.ts` exists and contains type definitions for all 18 tables
- [ ] `src/lib/database.types.ts` contains the `Tables`, `TablesInsert`, `TablesUpdate`, and `Enums` helper types
- [ ] `app/_layout.tsx` has `import 'react-native-url-polyfill/auto'` as its first import
- [ ] The app launches without errors in Expo Go on Android
- [ ] The app launches without errors in Expo Go on iOS (if available)
- [ ] A test query `supabase.from('academies').select('id').limit(1)` returns `{ data: [], error: null }` or a valid RLS error -- NOT a network error or URL parsing crash
- [ ] `supabase.auth.getSession()` returns `{ data: { session: null } }` (no user logged in yet)
- [ ] After clearing Metro cache (`npx expo start --clear`), the app still starts correctly
- [ ] The Date-to-ISO-string preparatory note is understood and documented for Section 4

---

## 7. Estimated Effort

**2-3 hours total**, broken down as:

| Task | Time |
|------|------|
| Install dependencies | 5 minutes |
| Verify `.env` values | 5 minutes |
| Create `src/lib/supabase.ts` | 15 minutes |
| Generate `src/lib/database.types.ts` | 15 minutes (includes Supabase CLI setup) |
| Modify `app/_layout.tsx` | 5 minutes |
| Verify connectivity (test query, debug if needed) | 30-60 minutes |
| Review generated types match schema expectations | 15-30 minutes |
| Troubleshooting (env vars, polyfill, Metro cache) | 0-60 minutes (depends on issues) |

**Possible blockers and their resolution times:**

| Blocker | Resolution |
|---------|-----------|
| Supabase CLI `gen types` fails with auth error | Run `npx supabase login` and authenticate via browser (~5 min) |
| Metro bundler caches old `.env` values | Stop server, run `npx expo start --clear` (~2 min) |
| `react-native-url-polyfill` conflicts with Expo SDK 54 | Check Expo compatibility -- very unlikely with SDK 54 but if so, use `expo install` to get the correct version (~10 min) |
| Generated types are empty or missing tables | Schema was not applied in Section 1 -- go back and run migrations first |

---

## Appendix: Quick Command Reference

```bash
# 1. Install dependencies
npx expo install @supabase/supabase-js react-native-url-polyfill

# 2. Install Supabase CLI (dev dependency)
npm install -D supabase

# 3. Login to Supabase CLI
npx supabase login

# 4. Generate TypeScript types (replace YOUR_PROJECT_ID)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

# 5. Clear Metro cache and restart (after .env changes)
npx expo start --clear

# 6. Regenerate types after schema changes
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```
