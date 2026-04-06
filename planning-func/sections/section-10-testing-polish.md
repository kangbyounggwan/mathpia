# Section 10: Testing & Polish

> **Parent Plan**: `planning-func/claude-plan.md` -- Section 10
> **Estimated Effort**: 1-2 days (depends on bug count from Sections 1-9)
> **Priority**: HIGH

---

## Background

This is the final section of the Mathpia implementation plan. By the time this section begins, all functional pieces -- Supabase backend (Sections 1-2), authentication (Section 3), service layer (Section 4), Gemini AI extraction (Section 5), screen-store wiring (Section 6), assignment creation (Section 7), problem solving (Section 8), and grading (Section 9) -- are in place.

The goal is to verify the **entire demo flow end-to-end** across all three user roles (Teacher, Student, Parent), find and fix bugs that only surface during the full cycle, polish the UX for common paths, and ensure the app is ready for a live demonstration.

This is NOT about writing unit tests or integration test suites. This is about **manual walkthrough validation** using the 14-step demo script, fixing everything that breaks, and applying polish that makes the demo feel professional.

---

## Requirements

1. **End-to-End Validation**: Execute the full 14-step Teacher-Student-Parent demo cycle and verify every step produces the expected result.
2. **Error Handling Verification**: Trigger each known error scenario and confirm Korean error messages display correctly.
3. **UX Polish**: Ensure loading states, empty states, error toasts, pull-to-refresh, keyboard handling, and LaTeX rendering are all working across every screen.
4. **Data Migration Cleanup**: Clear any leftover AsyncStorage data from mock-to-real transition so Zustand stores rehydrate cleanly.
5. **Permission Verification**: Confirm camera permissions are declared in `app.json` for iOS.
6. **Dependency Cleanup**: Remove unused packages and verify required packages are installed.
7. **Cross-Role Consistency**: Verify that data created by one role is immediately visible to other roles (e.g., teacher creates assignment, student sees it; student submits, teacher sees submission).

---

## Dependencies

| Direction | Sections | Notes |
|-----------|----------|-------|
| **Requires** | All Sections 1-9 | Every feature must be implemented before end-to-end testing can begin |
| **Blocks** | Nothing | This is the terminal section; nothing depends on it |

---

## Implementation Details

### Step 10.1: Full 14-Step End-to-End Demo Script

Execute every step below in sequence. Each step depends on the previous step's success. Document any failures and fix them before proceeding.

| Step | Actor | Action | Screen | Expected Result |
|------|-------|--------|--------|----------------|
| 1 | Teacher | Sign up or log in with demo credentials (`teacher@mathpia.com`) | `(auth)/login.tsx` | Dashboard loads with real stats from Supabase; no hardcoded numbers visible |
| 2 | Teacher | Tap "PDF 업로드" and select a Korean math textbook PDF (<10MB) | `(teacher)/materials.tsx` | Loading overlay shows "AI가 문제를 추출하고 있습니다..."; after 10-30s, navigates to extraction results |
| 3 | Teacher | Review extracted problems, select all, tap "문제은행 저장" | `(teacher)/problem-extract.tsx` | Success alert "N개의 문제가 문제은행에 저장되었습니다"; problems appear in problem bank |
| 4 | Teacher | Tap camera icon, photograph a handwritten math problem | `(teacher)/materials.tsx` | Camera opens, photo taken, Gemini extracts problem(s), results display on extraction screen |
| 5 | Teacher | Create a new assignment: select problems from bank, choose student(s), set due date, publish | `(teacher)/assignments.tsx` + `(teacher)/problem-bank.tsx` | Assignment created via `create_assignment_with_details()` RPC; alert confirms "N명의 학생에게 배정되었습니다" |
| 6 | Student | Log out teacher, log in as student (`student@mathpia.com`) | `(auth)/login.tsx` -> `(student)/index.tsx` | Student dashboard shows the newly assigned homework with status "assigned" |
| 7 | Student | Tap the new assignment in homework list | `(student)/homework.tsx` -> `(student)/solve.tsx` | Problem list loads with correct problem count; first problem displays with LaTeX content |
| 8 | Student | Solve each problem: select multiple-choice answer OR draw on canvas for essay type | `(student)/solve.tsx` | Canvas drawing is responsive; multiple-choice selection highlights correctly |
| 9 | Student | Submit all answers (tap "제출" for each problem) | `(student)/solve.tsx` | Progress bar updates after each submission; after last problem, completion alert "모든 문제를 제출했습니다!" appears; `assignment_students.progress_percent` = 100 |
| 10 | Teacher | Log out student, log in as teacher | `(teacher)/grading.tsx` | Grading screen shows the student's submitted assignment with pending grading count |
| 11 | Teacher | Open the student's submission, grade each problem (score + feedback) | `(teacher)/grading.tsx` | Student answers display correctly (text and/or canvas image via signed URL); grading controls work |
| 12 | Teacher | Complete grading all problems for this student | `(teacher)/grading.tsx` | After grading the LAST problem, `assignment_students.status` changes to `'graded'` (verified via `sync_grading_score` trigger); success feedback shown |
| 13 | Student | Log out teacher, log in as student | `(student)/index.tsx` + `(student)/homework.tsx` | Assignment status shows "graded"; student can view scores and teacher feedback |
| 14 | Parent | Log out student, log in as parent (`parent@mathpia.com`) | `(parent)/index.tsx` | Parent dashboard shows child's assignment results, scores, and overall stats via `parent_children` table |

**Recording failures**: For each step that fails, document:
- Step number
- Actual behavior vs expected
- Error message (console + UI)
- Fix applied

### Step 10.2: Error Handling Test Cases

Trigger each scenario and verify the Korean error message displays correctly. Test both the message content and the UI mechanism (Alert, toast, inline error, etc.).

| # | Scenario | How to Trigger | Expected Korean Error Message | Display Mechanism |
|---|----------|---------------|-------------------------------|-------------------|
| E1 | Network offline during login | Disable Wi-Fi/mobile data, attempt login | "네트워크 연결을 확인해주세요" | Alert or inline error on login screen |
| E2 | Wrong email/password | Enter incorrect credentials | "이메일 또는 비밀번호가 올바르지 않습니다" | Inline error below form fields |
| E3 | Signup with existing email | Register with an already-used email | "이미 등록된 이메일입니다" | Inline error below email field |
| E4 | Gemini API failure | Temporarily set invalid API key or trigger rate limit | "AI 문제 추출에 실패했습니다. 다시 시도해주세요." | Alert with retry option |
| E5 | Large PDF (>10MB) | Select a PDF larger than 10MB | "파일 크기가 너무 큽니다 (XMB). 최대 10MB까지 지원됩니다. 파일을 분할하거나 해상도를 줄여주세요." | Alert before any API call |
| E6 | No problems extracted from PDF | Upload a non-math PDF (e.g., plain text) | "문제를 추출할 수 없습니다. 수학 문제가 포함된 파일을 선택해주세요." | Alert on extraction result |
| E7 | Submitting answer with empty canvas | Try to submit without drawing or selecting an answer | "답안을 입력해주세요" | Inline warning or Alert |
| E8 | Token expired during operation | Wait for JWT expiry (or manually clear token) | Auto-refresh should handle silently; if it fails: "세션이 만료되었습니다. 다시 로그인해주세요." | Auto-redirect to login |
| E9 | Supabase storage upload failure | Upload very large canvas image or simulate storage error | "답안 이미지 저장에 실패했습니다. 다시 시도해주세요." | Alert |
| E10 | RLS permission denied | Attempt to access another academy's data (should not happen in normal flow) | Graceful empty state, no crash | Empty list with error logged to console |

### Step 10.3: UX Polish Items

Apply these polish items across the entire app. Each item has a priority and applies to specific screens.

#### 10.3.1: Loading States (Priority: HIGH)

Every async operation must show a loading indicator. Verify the following:

| Screen | Async Operation | Loading UI |
|--------|----------------|------------|
| `(auth)/login.tsx` | `signInWithPassword()` | Button disabled + spinner inside button |
| `(teacher)/index.tsx` | Dashboard data fetch | `ActivityIndicator` centered, or skeleton placeholder |
| `(student)/index.tsx` | Dashboard data fetch | `ActivityIndicator` centered, or skeleton placeholder |
| `(parent)/index.tsx` | Child data fetch | `ActivityIndicator` centered |
| `(teacher)/problem-bank.tsx` | `fetchProblems()` | Spinner in list area |
| `(teacher)/problem-extract.tsx` | Gemini API call | Full-screen overlay with message "AI가 문제를 추출하고 있습니다..." and sub-message "PDF 크기에 따라 10-30초 소요될 수 있습니다" |
| `(teacher)/grading.tsx` | Fetch submissions | Spinner in list area |
| `(student)/homework.tsx` | `fetchStudentAssignments()` | Spinner in list area |
| `(student)/solve.tsx` | Loading problems + submitting answer | Spinner overlay during submission |
| `(student)/wrong-notes.tsx` | Fetch wrong notes | Spinner in list area |

Implementation pattern for each screen:

```typescript
const { items, isLoading, error } = useSomeStore();

if (isLoading) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={{ marginTop: 12, color: theme.colors.onSurfaceVariant }}>
        데이터를 불러오는 중...
      </Text>
    </View>
  );
}
```

#### 10.3.2: Error Toasts / Error States (Priority: HIGH)

Replace raw `Alert.alert()` calls with consistent error handling. For critical errors use `Alert`; for transient errors consider a Snackbar (react-native-paper provides `<Snackbar>`):

```typescript
import { Snackbar } from 'react-native-paper';

const [snackMessage, setSnackMessage] = useState('');

// On error:
setSnackMessage('데이터를 불러오는데 실패했습니다. 다시 시도해주세요.');

// In JSX:
<Snackbar
  visible={!!snackMessage}
  onDismiss={() => setSnackMessage('')}
  duration={4000}
  action={{ label: '닫기', onPress: () => setSnackMessage('') }}
>
  {snackMessage}
</Snackbar>
```

#### 10.3.3: Pull-to-Refresh (Priority: MEDIUM)

Add pull-to-refresh to all list screens using `RefreshControl`:

| Screen | Refresh Action |
|--------|---------------|
| `(teacher)/index.tsx` | Re-fetch dashboard stats |
| `(student)/index.tsx` | Re-fetch dashboard stats + homework |
| `(teacher)/assignments.tsx` | Re-fetch assignments |
| `(teacher)/grading.tsx` | Re-fetch pending submissions |
| `(teacher)/problem-bank.tsx` | Re-fetch problems |
| `(teacher)/students.tsx` | Re-fetch student list |
| `(student)/homework.tsx` | Re-fetch assignments |
| `(student)/wrong-notes.tsx` | Re-fetch wrong notes |
| `(parent)/index.tsx` | Re-fetch child data |

Implementation pattern:

```typescript
const [refreshing, setRefreshing] = useState(false);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await fetchData(user.id);
  setRefreshing(false);
}, [user]);

<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
  {/* content */}
</ScrollView>
```

For `FlatList`-based screens, use the built-in `refreshing` and `onRefresh` props directly.

#### 10.3.4: Empty States (Priority: MEDIUM)

When a list has no items, display a helpful message instead of a blank screen:

| Screen | Empty State Message |
|--------|-------------------|
| `(teacher)/assignments.tsx` | "아직 생성된 과제가 없습니다. 새 숙제를 만들어보세요!" |
| `(teacher)/grading.tsx` | "채점할 제출물이 없습니다." |
| `(teacher)/problem-bank.tsx` | "문제은행이 비어있습니다. PDF를 업로드하여 문제를 추출해보세요!" |
| `(teacher)/students.tsx` | "등록된 학생이 없습니다." |
| `(student)/homework.tsx` | "배정된 숙제가 없습니다. 새로운 숙제가 배정되면 여기에 표시됩니다." |
| `(student)/wrong-notes.tsx` | "오답 노트가 비어있습니다. 틀린 문제가 자동으로 추가됩니다." |
| `(parent)/index.tsx` (no children) | "연결된 자녀 정보가 없습니다. 학원에 문의해주세요." |

Implementation pattern:

```typescript
if (!isLoading && items.length === 0) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#ccc" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#999', textAlign: 'center' }}>
        배정된 숙제가 없습니다.{'\n'}새로운 숙제가 배정되면 여기에 표시됩니다.
      </Text>
    </View>
  );
}
```

#### 10.3.5: Keyboard Handling (Priority: MEDIUM)

Ensure keyboards dismiss properly and do not obscure input fields:

1. **Login/Register screens**: Wrap in `KeyboardAvoidingView`:

```typescript
import { KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    {/* form content */}
  </KeyboardAvoidingView>
</TouchableWithoutFeedback>
```

2. **Grading feedback input**: Ensure the feedback text field is visible when keyboard opens.

3. **Assignment creation form**: Ensure all form fields remain accessible when keyboard is open (use `ScrollView` inside `KeyboardAvoidingView`).

4. **Solve screen (short answer)**: Ensure text input for short-answer problems does not overlap with the problem content or submit button.

#### 10.3.6: LaTeX Rendering Verification (Priority: HIGH)

The app uses `react-native-math-view` (with `katex`) for LaTeX rendering. Verify these rendering scenarios work correctly with extracted Gemini content:

| LaTeX Pattern | Example | Verify |
|--------------|---------|--------|
| Inline math | `$x^2 + 2x + 1 = 0$` | Renders inline without line break |
| Display math | `$$\frac{a}{b} + \frac{c}{d}$$` | Renders centered, block-level |
| Korean text mixed with math | `다음 방정식을 풀어라: $2x + 3 = 7$` | Korean text renders normally; math renders in LaTeX |
| Fractions | `$\frac{1}{2}$` | Numerator and denominator aligned |
| Square roots | `$\sqrt{x^2 + y^2}$` | Square root symbol extends over content |
| Integrals | `$\int_0^1 x^2 dx$` | Integral sign with limits |
| Matrices | `$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$` | 2x2 matrix renders |
| Subscripts/Superscripts | `$a_n = a_{n-1} + d$` | Subscripts render below baseline |
| Multiple-choice numbering | `(1) $x = 2$ (2) $x = 3$` | Numbers render as text, values render as LaTeX |

If `react-native-math-view` fails on any pattern, consider fallback rendering using `react-native-webview` with KaTeX HTML.

### Step 10.4: AsyncStorage Migration / Clear Step

When switching from mock services to Supabase services, the Zustand persisted state in AsyncStorage may contain stale mock data with incompatible IDs (mock UUIDs vs real Supabase UUIDs). This causes crashes or ghost data.

**Action**: Clear all Mathpia-related AsyncStorage keys on first launch after migration:

```typescript
// src/utils/storageMigration.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const MIGRATION_VERSION_KEY = 'mathpia-migration-version';
const CURRENT_MIGRATION_VERSION = '2'; // Increment when data format changes

export const runStorageMigration = async (): Promise<void> => {
  const currentVersion = await AsyncStorage.getItem(MIGRATION_VERSION_KEY);

  if (currentVersion !== CURRENT_MIGRATION_VERSION) {
    console.log('[Migration] Clearing stale AsyncStorage data...');

    // Remove all Zustand persisted store keys
    await AsyncStorage.multiRemove([
      'mathpia-auth',
      'mathpia-assignments',
      'mathpia-submissions',
      'mathpia-problem-bank',
      'mathpia-analytics',
      'mathpia-wrong-notes',
      'mathpia-parent',
    ]);

    // Set the current migration version
    await AsyncStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION);
    console.log('[Migration] AsyncStorage cleared. Fresh start with Supabase data.');
  }
};
```

Call this in `app/_layout.tsx` during initialization, **before** `initializeAuth()`:

```typescript
useEffect(() => {
  const init = async () => {
    await runStorageMigration(); // Clear stale mock data if needed
    await useAuthStore.getState().initializeAuth();
    setAuthInitialized(true);
  };
  init();
  // ... auth state listener
}, []);
```

### Step 10.5: Camera Permissions Verification (iOS)

The current `app.json` does not include camera permission declarations for iOS. Without these, `expo-image-picker`'s `launchCameraAsync()` will crash on iOS devices.

**Verify** that the following is present in `app.json`. If missing, add it:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.mathpia.app",
      "infoPlist": {
        "NSCameraUsageDescription": "수학 문제를 촬영하여 AI로 추출하기 위해 카메라 접근이 필요합니다.",
        "NSPhotoLibraryUsageDescription": "수학 문제 이미지를 선택하기 위해 사진 라이브러리 접근이 필요합니다."
      }
    },
    "plugins": [
      "expo-router",
      "expo-font",
      [
        "expo-image-picker",
        {
          "cameraPermission": "수학 문제를 촬영하여 AI로 추출하기 위해 카메라 접근이 필요합니다.",
          "photosPermission": "수학 문제 이미지를 선택하기 위해 사진 라이브러리 접근이 필요합니다."
        }
      ],
      [
        "expo-document-picker",
        {
          "iCloudContainerEnvironment": "Production"
        }
      ]
    ]
  }
}
```

**Android**: Camera permissions are declared automatically by `expo-image-picker` at build time via Expo's autolinking; no manual changes needed.

### Step 10.6: Remove Unused `@google/generative-ai` Package

The `package.json` currently lists **two** Google AI packages:

```json
"@google/genai": "^1.34.0",         // <-- Active: new unified SDK
"@google/generative-ai": "^0.24.1"  // <-- UNUSED: old deprecated SDK
```

The existing `geminiService.ts` uses `@google/genai` (the new SDK). The old `@google/generative-ai` package is unused dead weight.

**Action**: Remove the unused package:

```bash
npm uninstall @google/generative-ai
```

Then verify:
- `geminiService.ts` still imports from `@google/genai`
- `npx expo start` launches without errors
- PDF extraction still works (Step 10.1, Step 2)

### Step 10.7: Verify `@shopify/react-native-skia` is Installed

The solve screen (`app/(student)/solve.tsx`) uses Skia for the drawing canvas. The plan lists `@shopify/react-native-skia` as part of the technology stack, but it is **NOT currently listed** in `package.json`.

**Action**: Check if Skia is installed:

```bash
# Check if it's in node_modules even if not in package.json
ls node_modules/@shopify/react-native-skia/package.json 2>/dev/null
```

If missing, install it:

```bash
npx expo install @shopify/react-native-skia
```

Then verify:
- `(student)/solve.tsx` renders the canvas without errors
- Drawing with touch/stylus works on a real device or emulator
- Canvas `makeImageSnapshot()` produces a valid base64 image for submission upload

> **Note**: `@shopify/react-native-skia` requires a native build (it does not work in Expo Go). Verify you are using a development build (`npx expo run:android` or `npx expo run:ios`) or an EAS development build.

### Step 10.8: Full Test Scenario Table

This is the comprehensive test matrix covering all critical paths. Each row should be manually tested and checked off.

#### Authentication Tests

| # | Test Case | Steps | Expected Result | Pass? |
|---|-----------|-------|----------------|-------|
| A1 | Teacher login | Enter teacher credentials, tap login | Navigates to `(teacher)/index.tsx` with real dashboard | |
| A2 | Student login | Enter student credentials, tap login | Navigates to `(student)/index.tsx` with real dashboard | |
| A3 | Parent login | Enter parent credentials, tap login | Navigates to `(parent)/index.tsx` with child data | |
| A4 | Session persistence | Login as teacher, kill app, reopen | Auto-restores session, no login screen flash | |
| A5 | Logout | Tap logout from any dashboard | Navigates to login, all store data cleared | |
| A6 | Wrong password | Enter wrong password | "이메일 또는 비밀번호가 올바르지 않습니다" | |
| A7 | Signup flow | Register new teacher account | Profile created via `handle_new_user` trigger; can login immediately | |

#### Teacher Feature Tests

| # | Test Case | Steps | Expected Result | Pass? |
|---|-----------|-------|----------------|-------|
| T1 | Dashboard stats | Login as teacher | Stats match actual DB counts (assignments, students, pending gradings) | |
| T2 | PDF extraction | Upload a PDF from problem bank screen | Gemini extracts problems; results display with LaTeX | |
| T3 | Camera extraction | Take photo of math problem | Gemini extracts problem(s) from photo | |
| T4 | Save to problem bank | Select extracted problems, save | Problems appear in problem bank list | |
| T5 | Create assignment | Select problems + students, set due date, publish | Assignment created; students see it in homework list | |
| T6 | View submissions | Open grading screen after student submits | Student submissions visible with answers | |
| T7 | Grade submission | Score + feedback for each problem | Grading saved; `sync_grading_score` trigger fires | |
| T8 | Complete grading | Grade ALL problems for one student | `assignment_students.status` = `'graded'` | |
| T9 | Large PDF rejection | Upload PDF >10MB | "파일 크기가 너무 큽니다" error before API call | |
| T10 | Problem bank filters | Filter by grade, difficulty, topic | Filtered results from Supabase | |

#### Student Feature Tests

| # | Test Case | Steps | Expected Result | Pass? |
|---|-----------|-------|----------------|-------|
| S1 | Dashboard stats | Login as student | Stats show real data (problems solved, streak, average score) | |
| S2 | Homework list | Open homework tab | Shows assigned homeworks with correct status and progress | |
| S3 | Solve multiple-choice | Open assignment, select answer, submit | Answer saved; progress updates | |
| S4 | Solve canvas drawing | Open essay problem, draw on canvas, submit | Canvas image uploaded to storage; answer saved | |
| S5 | Complete assignment | Submit all problems in an assignment | Progress = 100%; completion alert shown | |
| S6 | View graded results | Login after teacher grades | Scores and feedback visible | |
| S7 | Wrong notes | Open wrong notes after incorrect answers graded | Incorrect submissions appear as wrong notes | |
| S8 | Analytics | Open analytics screen | Charts/stats reflect real submission data | |

#### Parent Feature Tests

| # | Test Case | Steps | Expected Result | Pass? |
|---|-----------|-------|----------------|-------|
| P1 | Child dashboard | Login as parent | Shows child's name, stats (from `parent_children` table) | |
| P2 | Assignment results | View child's recent assignments | Shows graded assignments with scores | |
| P3 | Report | Open report screen | Aggregated performance data from child's submissions | |

#### Cross-Role Data Flow Tests

| # | Test Case | Steps | Expected Result | Pass? |
|---|-----------|-------|----------------|-------|
| X1 | Assignment visibility | Teacher publishes assignment | Student sees it in homework list within seconds (pull-to-refresh) | |
| X2 | Submission visibility | Student submits answers | Teacher sees submission in grading screen | |
| X3 | Grading visibility | Teacher grades all problems | Student sees scores; parent sees updated child stats | |
| X4 | Problem bank → Assignment | Teacher saves AI-extracted problems, then uses them in assignment | Problems persist and are usable across features | |

#### Performance Tests

| # | Test Case | Steps | Expected Result | Pass? |
|---|-----------|-------|----------------|-------|
| PF1 | Cold start time | Kill app, launch fresh | App loads and shows content within 3 seconds on modern tablet | |
| PF2 | Dashboard load time | Navigate to any dashboard | Data loads within 2 seconds | |
| PF3 | Problem bank scroll | Load 50+ problems, scroll through list | No jank, smooth 60fps scrolling | |
| PF4 | Canvas responsiveness | Draw rapidly on solve canvas | No lag between touch and stroke rendering | |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/utils/storageMigration.ts` | **Create** | AsyncStorage migration/clear utility for mock-to-real transition |
| `app.json` | **Modify** | Add iOS camera/photo library permissions and `expo-image-picker` plugin config |
| `app/_layout.tsx` | **Modify** | Call `runStorageMigration()` before `initializeAuth()` |
| `package.json` | **Modify** | Remove `@google/generative-ai`; verify `@shopify/react-native-skia` is listed |
| `app/(teacher)/index.tsx` | **Modify** | Add loading state, empty state, pull-to-refresh, error Snackbar |
| `app/(student)/index.tsx` | **Modify** | Add loading state, empty state, pull-to-refresh, error Snackbar |
| `app/(parent)/index.tsx` | **Modify** | Add loading state, empty state, pull-to-refresh, error Snackbar |
| `app/(teacher)/assignments.tsx` | **Modify** | Add empty state, pull-to-refresh |
| `app/(teacher)/grading.tsx` | **Modify** | Add empty state, pull-to-refresh, loading for signed URL images |
| `app/(teacher)/problem-bank.tsx` | **Modify** | Add empty state, pull-to-refresh |
| `app/(teacher)/students.tsx` | **Modify** | Add empty state, pull-to-refresh |
| `app/(student)/homework.tsx` | **Modify** | Add empty state, pull-to-refresh |
| `app/(student)/wrong-notes.tsx` | **Modify** | Add empty state, pull-to-refresh |
| `app/(student)/solve.tsx` | **Modify** | Add keyboard handling for short-answer input; loading overlay during submission |
| `app/(auth)/login.tsx` | **Modify** | Add `KeyboardAvoidingView`, button loading state |
| `app/(auth)/register.tsx` | **Modify** | Add `KeyboardAvoidingView`, button loading state |
| All screens with forms | **Modify** | Wrap in `KeyboardAvoidingView` + `TouchableWithoutFeedback` for keyboard dismissal |

---

## Acceptance Criteria

### Demo Flow
- [ ] Full 14-step demo script (Steps 1-14) completes without errors or crashes
- [ ] All three roles (Teacher, Student, Parent) can log in and see their respective dashboards with real data
- [ ] PDF extraction works with a real Korean math textbook PDF (<10MB)
- [ ] Camera extraction works with a photo of a handwritten math problem
- [ ] Full assignment cycle works: Create -> Solve -> Submit -> Grade -> View Results
- [ ] Cross-role data flow is immediate (teacher creates assignment, student sees it after refresh)

### Error Handling
- [ ] All 10 error scenarios (E1-E10) display correct Korean error messages
- [ ] No unhandled JavaScript exceptions in Metro console during the full demo flow
- [ ] Network errors are caught and displayed gracefully (no white screen of death)

### UX Polish
- [ ] Every async operation shows a loading indicator (no blank screens during data fetch)
- [ ] Error messages use `Snackbar` or `Alert` consistently across the app
- [ ] All list screens support pull-to-refresh
- [ ] Empty lists show helpful Korean messages with an icon
- [ ] Keyboards dismiss on tap outside form fields (all form screens)
- [ ] LaTeX renders correctly for fractions, square roots, integrals, and mixed Korean+math text
- [ ] App does not show a flash of login screen on restart when session exists

### Technical Cleanup
- [ ] AsyncStorage migration runs on first launch after mock-to-real transition; old data is cleared
- [ ] `app.json` includes `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` for iOS
- [ ] `@google/generative-ai` (old unused SDK) is removed from `package.json`
- [ ] `@shopify/react-native-skia` is installed and listed in `package.json`
- [ ] Korean text (`NotoSansKR` font) displays correctly throughout the app
- [ ] App loads within 3 seconds on a modern tablet (cold start)

---

## Estimated Effort

**1-2 days** depending on the number of bugs discovered during the end-to-end walkthrough.

| Task | Estimate |
|------|----------|
| Execute 14-step demo script + fix blocking bugs | 4-6 hours |
| Error handling verification (E1-E10) | 1-2 hours |
| UX polish (loading, empty states, pull-to-refresh) | 3-4 hours |
| Keyboard handling + LaTeX verification | 1-2 hours |
| Dependency cleanup + permissions + migration utility | 1-2 hours |
| Final re-test of full demo script after all fixes | 1-2 hours |
| **Total** | **11-18 hours (1.5-2.5 days)** |

> **Note**: If Sections 1-9 were implemented cleanly, this section may only take 1 day. If significant integration bugs exist (RLS policy blocking valid queries, type mismatches, missing trigger behavior), this section could extend to 2+ days. Budget for the full 2 days.
