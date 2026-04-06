# Section 5: Gemini AI - PDF/Photo Problem Extraction

> **Estimated Effort**: 1 day (6-8 hours)
> **Priority**: HIGH
> **Requires**: Section 4 (Supabase Service Implementations)
> **Blocks**: Section 7 (Assignment Creation Flow)

---

## 1. Background

Mathpia is a Korean math academy (학원) tablet app. One of its key differentiating features is the ability for teachers to **upload a PDF or take a camera photo** of a math worksheet, and have Google Gemini 2.5 Flash Vision automatically extract individual math problems -- complete with LaTeX-formatted equations, difficulty ratings, topic classification, and answer keys.

### Current State of the Codebase

The extraction pipeline is partially built but has **never been triggered from a real user flow**:

| Component | File | Status |
|-----------|------|--------|
| **Gemini Service** | `src/services/geminiService.ts` (255 lines) | Complete: `extractProblemsFromFile()` reads a file as base64, sends it to Gemini 2.5 Flash with a detailed Korean math extraction prompt, parses JSON, normalizes LaTeX. Has platform-specific base64 reading (web/native). |
| **Gemini Utilities** | `src/services/geminiUtils.ts` (185 lines) | Complete: `safeParseJSON()`, `callGeminiWithRetry()`, `validateSchema()`. Provides retry logic (2 retries with 1s delay), JSON extraction from code blocks, and LaTeX backslash escape fixing. |
| **PdfUploadModal** | `src/components/teacher/PdfUploadModal.tsx` (266 lines) | Complete: Modal UI with PDF picker (`expo-document-picker`), image gallery picker (`expo-image-picker`), loading states (`idle`, `selecting`, `analyzing`, `error`), error display with retry button. Already calls `extractProblemsFromFile()`. |
| **Problem Extract Screen** | `app/(teacher)/problem-extract.tsx` (512 lines) | Mostly complete: Receives extracted problems via route params, displays them with LaTeX rendering (`MathText`), allows difficulty filtering, select/deselect, difficulty adjustment. Has a "숙제 만들기" (Create Assignment) button but **no "문제은행 저장" (Save to Problem Bank) button**. |
| **Materials Screen** | `app/(teacher)/materials.tsx` (262 lines) | Partial: Has a FAB with "PDF 문제 추출" action that opens `PdfUploadModal`. Has `handleExtractComplete()` that navigates to `problem-extract` screen. But **no camera capture button** and **no file size validation**. |
| **Problem Bank Screen** | `app/(teacher)/problem-bank.tsx` (443 lines) | Has FAB with "AI 문제 추출" action that opens `PdfUploadModal`. Has `handleExtractComplete()` that saves directly to problem bank via `store.bulkCreateProblems()`. Already working end-to-end for the problem bank flow. |
| **Problem Bank Store** | `src/stores/problemBankStore.ts` (219 lines) | Complete: `bulkCreateProblems()` calls `services.problemBank.bulkCreate()`. Client-side filtering, CRUD, all wired to service interfaces. |
| **Type Definitions** | `src/types/problemBank.ts` | Complete: `ProblemBankItem`, `ProblemBankItemCreate`, `ProblemBankFilter`, `PaginatedResult`, etc. |

### What This Section Delivers

After this section is complete, the full end-to-end flow works:

```
Teacher taps "PDF 문제 추출" or "카메라 촬영"
  → File size check (10MB limit, Korean error if exceeded)
  → File read as base64 → Gemini 2.5 Flash Vision API call
  → JSON response parsed → LaTeX normalized
  → Problems displayed on problem-extract screen
  → Teacher reviews, adjusts difficulty, selects problems
  → "문제은행 저장" button saves to Supabase via problemBankStore.bulkCreateProblems()
  → "숙제 만들기" button navigates to assignment creation with selected problems
```

### Installed Dependencies (Already Available)

All required packages are already in `package.json`:

| Package | Version | Purpose |
|---------|---------|---------|
| `@google/genai` | `^1.34.0` | Gemini 2.5 Flash API client |
| `expo-document-picker` | `~14.0.8` | PDF file picker |
| `expo-image-picker` | `~17.0.10` | Camera + image gallery picker |
| `expo-file-system` | `~19.0.21` | File reading, file info (size check) |
| `react-native-paper` | `^5.14.5` | UI components (Modal, Button, ActivityIndicator, etc.) |

No new package installations are required for this section.

---

## 2. Requirements

### Functional Requirements

1. **PDF Upload**: Teacher can pick a PDF file from the device and trigger AI extraction.
2. **Camera Capture**: Teacher can take a photo with the device camera and trigger AI extraction.
3. **Image Gallery**: Teacher can pick an image from the gallery and trigger AI extraction (already works via PdfUploadModal).
4. **File Size Validation**: Files exceeding 10MB are rejected with a clear Korean error message before any API call is made.
5. **Extraction Display**: Extracted problems are displayed with LaTeX rendering, difficulty badges, topic tags, and answer keys.
6. **Problem Review**: Teacher can adjust difficulty, select/deselect individual problems, and filter by difficulty.
7. **Save to Problem Bank**: Teacher can save selected problems to the Supabase-backed problem bank.
8. **Create Assignment**: Teacher can navigate to assignment creation with selected problems (existing functionality).
9. **Loading UI**: A loading overlay with Korean text is shown during extraction (5-30 seconds depending on file size).
10. **Error Handling**: All failure modes (network, API rate limit, invalid file, no problems found, file too large) show user-friendly Korean error messages.

### Non-Functional Requirements

1. **Performance**: Files are validated (size check) before base64 encoding to prevent OOM on tablets.
2. **UX**: Loading state clearly communicates that extraction takes time (10-30 seconds).
3. **Reliability**: Gemini calls use retry logic (2 retries with 1s delay) via `geminiUtils.ts`.
4. **Data Integrity**: Extracted problems are typed as `ProblemBankItemCreate` before saving to ensure schema compliance.

---

## 3. Dependencies

### Requires (must be complete before starting)

| Section | Reason |
|---------|--------|
| **Section 4: Supabase Service Implementations** | `problemBankStore.bulkCreateProblems()` must hit the real `supabaseProblemBankService.bulkCreate()` to persist extracted problems. Without Section 4, saves go to the mock service and are lost on restart. |

### Blocks (cannot start until this section is complete)

| Section | Reason |
|---------|--------|
| **Section 7: Assignment Creation Flow** | The assignment creation flow allows teachers to select problems from the problem bank. Section 5 populates the problem bank with AI-extracted problems, which Section 7 consumes. |

### Environment Prerequisites

- `.env` must have `EXPO_PUBLIC_GEMINI_API_KEY` set with a valid Google AI API key (already present in the project).
- A Gemini API key with Gemini 2.5 Flash access enabled.

---

## 4. Implementation Details

### Step 5.1: Add File Size Check to `geminiService.ts`

**File**: `src/services/geminiService.ts`

Before sending any file to Gemini, check the file size. Korean math textbook PDFs can be 5-50MB, but Gemini's inline data approach requires the entire file to be base64-encoded in memory. On tablets with limited RAM, large base64 strings (a 10MB file becomes ~13.3MB in base64) can cause out-of-memory crashes. Enforce a **10MB limit** with a clear user-facing Korean error message.

Add the following at the top of `geminiService.ts`, after the existing imports:

```typescript
// --- Add this import ---
import * as FileSystem from 'expo-file-system';

// --- Add this constant and function ---
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Checks that a file does not exceed the 10MB size limit.
 * Throws an Error with a Korean message if the file is too large.
 * This check runs BEFORE reading the file as base64, preventing
 * out-of-memory crashes on tablets from large base64 strings.
 */
async function checkFileSize(fileUri: string): Promise<void> {
  const fileInfo = await FileSystem.getInfoAsync(fileUri, { size: true });
  if (fileInfo.exists && fileInfo.size && fileInfo.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `파일 크기가 너무 큽니다 (${sizeMB}MB). ` +
      `최대 10MB까지 지원됩니다. 파일을 분할하거나 해상도를 줄여주세요.`
    );
  }
}
```

Then modify `extractProblemsFromFile()` to call `checkFileSize()` as the very first operation:

```typescript
export async function extractProblemsFromFile(
  fileUri: string,
  mimeType: string
): Promise<ExtractionResult> {
  try {
    // *** NEW: Check file size before reading as base64 ***
    await checkFileSize(fileUri);

    // 파일을 base64로 읽기 (existing code, unchanged)
    const base64Data = await readFileAsBase64(fileUri);

    // ... rest of existing function unchanged ...
  } catch (error) {
    console.error('Gemini API 오류:', error);
    return {
      success: false,
      problems: [],
      error: error instanceof Error ? error.message : '문제 추출 중 오류가 발생했습니다',
    };
  }
}
```

**Why 10MB?** The Gemini API supports inline data up to 20MB, but:
- Base64 encoding inflates file size by ~33% (10MB file -> 13.3MB base64 string)
- Tablets have limited memory; holding 13MB+ in a JS string can cause jank or crashes
- 10MB covers the vast majority of single-chapter Korean math worksheets
- Larger files should use the Gemini File API (post-demo enhancement, see note below)

**Complete modified `extractProblemsFromFile()` function:**

```typescript
import { GoogleGenAI } from '@google/genai';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// --- Types (unchanged) ---
export interface ExtractedProblem {
  id: string;
  content: string;
  difficulty: '상' | '중' | '하';
  topic: string;
  type: '객관식' | '서술형' | '단답형';
  choices?: string[];
  answer?: string;
  hasImage?: boolean;
}

export interface ExtractionResult {
  success: boolean;
  problems: ExtractedProblem[];
  error?: string;
}

// --- File size check ---
async function checkFileSize(fileUri: string): Promise<void> {
  const fileInfo = await FileSystem.getInfoAsync(fileUri, { size: true });
  if (fileInfo.exists && fileInfo.size && fileInfo.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `파일 크기가 너무 큽니다 (${sizeMB}MB). ` +
      `최대 10MB까지 지원됩니다. 파일을 분할하거나 해상도를 줄여주세요.`
    );
  }
}

// --- EXTRACTION_PROMPT (unchanged, 115 lines) ---
const EXTRACTION_PROMPT = `
당신은 수학 문제 추출 및 LaTeX 변환 전문가입니다.
... (existing prompt, unchanged) ...
`;

// --- readFileAsBase64 (unchanged) ---
async function readFileAsBase64(fileUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    const FS = require('expo-file-system/legacy');
    return await FS.readAsStringAsync(fileUri, { encoding: 'base64' });
  }
}

// --- Main extraction function (modified: added checkFileSize call) ---
export async function extractProblemsFromFile(
  fileUri: string,
  mimeType: string
): Promise<ExtractionResult> {
  try {
    // Step 1: Validate file size BEFORE reading as base64
    await checkFileSize(fileUri);

    // Step 2: Read file as base64
    const base64Data = await readFileAsBase64(fileUri);

    // Step 3: Call Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: EXTRACTION_PROMPT },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });

    const text = response.text || '';

    // Step 4: Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON 응답을 파싱할 수 없습니다');
    }

    let jsonString = jsonMatch[0];
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      jsonString = jsonString.replace(
        /:\s*"((?:[^"\\]|\\.)*)"/g,
        (_match, value) => {
          const fixed = value.replace(/\\(?!\\|n|r|t|"|')/g, '\\\\');
          return `: "${fixed}"`;
        }
      );
      parsed = JSON.parse(jsonString);
    }

    // Step 5: Normalize LaTeX strings
    const normalizeLatex = (str: string): string => {
      if (!str) return str;
      return str
        .replace(/♀/g, '\\')
        .replace(/\\\\([a-zA-Z]+)/g, '\\$1');
    };

    // Step 6: Map to ExtractedProblem array with generated IDs
    const problems: ExtractedProblem[] = parsed.problems.map(
      (p: any, index: number) => ({
        id: `problem_${Date.now()}_${index}`,
        content: normalizeLatex(p.content || ''),
        difficulty: p.difficulty || '중',
        topic: p.topic || '기타',
        type: p.type || '단답형',
        choices: p.choices
          ? p.choices.map((c: string) => normalizeLatex(c))
          : undefined,
        answer: p.answer ? normalizeLatex(p.answer) : undefined,
        hasImage: p.hasImage || false,
      })
    );

    return { success: true, problems };
  } catch (error) {
    console.error('Gemini API 오류:', error);
    return {
      success: false,
      problems: [],
      error:
        error instanceof Error
          ? error.message
          : '문제 추출 중 오류가 발생했습니다',
    };
  }
}

// --- Helper functions (unchanged) ---
export function groupProblemsByDifficulty(problems: ExtractedProblem[]) {
  return {
    high: problems.filter((p) => p.difficulty === '상'),
    medium: problems.filter((p) => p.difficulty === '중'),
    low: problems.filter((p) => p.difficulty === '하'),
  };
}

export function groupProblemsByTopic(
  problems: ExtractedProblem[]
): Record<string, ExtractedProblem[]> {
  return problems.reduce((acc, problem) => {
    const topic = problem.topic;
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(problem);
    return acc;
  }, {} as Record<string, ExtractedProblem[]>);
}
```

> **Post-Demo Enhancement: Gemini File API for Larger Files**
>
> For files exceeding 10MB, the Gemini File API (`ai.files.upload()`) can upload the file to Google's servers first, then reference it by URI in the generation request. This avoids base64 encoding entirely and supports files up to 2GB. The implementation would look like:
>
> ```typescript
> // Post-demo: For files > 10MB, use the File API instead of inline base64
> const uploadResult = await ai.files.upload({
>   file: fileUri,
>   config: { mimeType: mimeType },
> });
>
> const response = await ai.models.generateContent({
>   model: 'gemini-2.5-flash',
>   contents: [{
>     role: 'user',
>     parts: [
>       { text: EXTRACTION_PROMPT },
>       { fileData: { fileUri: uploadResult.uri, mimeType: mimeType } },
>     ],
>   }],
> });
> ```
>
> This is not needed for the demo (10MB covers most single-chapter worksheets), but should be implemented when moving to production to handle full textbook PDFs.

---

### Step 5.2: Verify Existing `geminiService.ts` Works

Before making any UI changes, verify the existing extraction pipeline works by testing it manually.

**Test procedure:**

1. Prepare a sample PDF file (a Korean math worksheet, ideally 1-5 pages, under 10MB).
2. Add a temporary test button in any screen:

```typescript
import { extractProblemsFromFile } from '../../src/services/geminiService';
import * as DocumentPicker from 'expo-document-picker';

const testExtraction = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return;

  const file = result.assets[0];
  console.log('Testing extraction for:', file.name, file.size);

  const extraction = await extractProblemsFromFile(
    file.uri,
    'application/pdf'
  );

  console.log('Extraction result:', JSON.stringify(extraction, null, 2));
  console.log('Problems found:', extraction.problems.length);
};
```

3. Verify in the console:
   - API key is valid (no 401/403 errors)
   - Response is valid JSON
   - Problems array is populated with correct fields
   - LaTeX strings render correctly (no double backslashes or broken unicode)

**If the test fails**, check:
- `EXPO_PUBLIC_GEMINI_API_KEY` is set in `.env`
- The API key has Gemini 2.5 Flash access enabled
- The file is a valid PDF (not corrupted)
- Network connectivity exists

---

### Step 5.3: Add Camera Capture Trigger to `PdfUploadModal`

**File**: `src/components/teacher/PdfUploadModal.tsx`

The existing `PdfUploadModal` already has PDF picker and image gallery picker. Add a **camera capture** option.

Add a new handler after the existing `handleSelectImage` function:

```typescript
const handleTakePhoto = async () => {
  try {
    setState('selecting');

    // Request camera permission
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('카메라 권한이 필요합니다. 설정에서 카메라 권한을 허용해주세요.');
      setState('error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8, // Slightly compressed to reduce file size
      allowsEditing: false,
    });

    if (result.canceled) {
      setState('idle');
      return;
    }

    const image = result.assets[0];
    const imageName = '카메라 촬영';
    setFileName(imageName);
    setState('analyzing');

    // Determine MIME type from file extension
    const extension = image.uri.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg';
    if (extension === 'png') mimeType = 'image/png';
    else if (extension === 'heic' || extension === 'heif') mimeType = 'image/heic';

    // Call Gemini for extraction (checkFileSize is now called inside extractProblemsFromFile)
    const extractionResult = await extractProblemsFromFile(image.uri, mimeType);

    if (extractionResult.success) {
      onExtractComplete(extractionResult.problems);
      resetAndClose();
    } else {
      setErrorMessage(extractionResult.error || '문제 추출에 실패했습니다');
      setState('error');
    }
  } catch (error) {
    console.error('카메라 촬영 오류:', error);
    const message = error instanceof Error
      ? error.message
      : '카메라 촬영 중 오류가 발생했습니다';
    setErrorMessage(message);
    setState('error');
  }
};
```

Then update the `getStateContent()` function's `'idle'` case to add the camera button:

```typescript
case 'idle':
case 'selecting':
  return (
    <>
      <View style={styles.iconWrapper}>
        <MaterialCommunityIcons
          name="file-document-multiple"
          size={64}
          color={colors.primary}
        />
      </View>
      <Text style={styles.title}>문제 추출</Text>
      <Text style={styles.description}>
        수학 문제가 포함된 PDF 또는 이미지를 업로드하면{'\n'}
        AI가 문제를 추출하고 난이도를 분류합니다
      </Text>
      <View style={styles.buttonGroup}>
        <Button
          mode="contained"
          onPress={handleSelectPdf}
          style={styles.selectButton}
          loading={state === 'selecting'}
          icon="file-pdf-box"
        >
          PDF 선택
        </Button>
        <Button
          mode="outlined"
          onPress={handleSelectImage}
          style={styles.selectButton}
          loading={state === 'selecting'}
          icon="image"
        >
          이미지 선택
        </Button>
        <Button
          mode="outlined"
          onPress={handleTakePhoto}
          style={styles.selectButton}
          loading={state === 'selecting'}
          icon="camera"
        >
          카메라 촬영
        </Button>
      </View>
    </>
  );
```

Also update the 'analyzing' state to show a more informative loading message:

```typescript
case 'analyzing':
  return (
    <>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.title}>AI 분석 중...</Text>
      <Text style={styles.fileName}>{fileName}</Text>
      <Text style={styles.description}>
        문제를 추출하고 난이도를 분류하고 있습니다{'\n'}
        PDF 크기에 따라 10-30초 소요될 수 있습니다
      </Text>
    </>
  );
```

**Complete modified `PdfUploadModal.tsx`:**

```typescript
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  Portal,
  Modal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '../../constants/theme';
import {
  extractProblemsFromFile,
  ExtractedProblem,
} from '../../services/geminiService';

interface PdfUploadModalProps {
  visible: boolean;
  onDismiss: () => void;
  onExtractComplete: (problems: ExtractedProblem[]) => void;
}

type UploadState = 'idle' | 'selecting' | 'uploading' | 'analyzing' | 'error';

export default function PdfUploadModal({
  visible,
  onDismiss,
  onExtractComplete,
}: PdfUploadModalProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // --- PDF picker (existing, unchanged) ---
  const handleSelectPdf = async () => {
    try {
      setState('selecting');

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setState('idle');
        return;
      }

      const file = result.assets[0];
      setFileName(file.name);
      setState('analyzing');

      const extractionResult = await extractProblemsFromFile(
        file.uri,
        'application/pdf'
      );

      if (extractionResult.success) {
        onExtractComplete(extractionResult.problems);
        resetAndClose();
      } else {
        setErrorMessage(
          extractionResult.error || '문제 추출에 실패했습니다'
        );
        setState('error');
      }
    } catch (error) {
      console.error('PDF 선택 오류:', error);
      const message =
        error instanceof Error
          ? error.message
          : '파일을 처리하는 중 오류가 발생했습니다';
      setErrorMessage(message);
      setState('error');
    }
  };

  // --- Image gallery picker (existing, unchanged) ---
  const handleSelectImage = async () => {
    try {
      setState('selecting');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (result.canceled) {
        setState('idle');
        return;
      }

      const image = result.assets[0];
      const imageName = image.uri.split('/').pop() || '이미지';
      setFileName(imageName);
      setState('analyzing');

      const extension = image.uri.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'webp') mimeType = 'image/webp';
      else if (extension === 'gif') mimeType = 'image/gif';

      const extractionResult = await extractProblemsFromFile(
        image.uri,
        mimeType
      );

      if (extractionResult.success) {
        onExtractComplete(extractionResult.problems);
        resetAndClose();
      } else {
        setErrorMessage(
          extractionResult.error || '문제 추출에 실패했습니다'
        );
        setState('error');
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      const message =
        error instanceof Error
          ? error.message
          : '이미지를 처리하는 중 오류가 발생했습니다';
      setErrorMessage(message);
      setState('error');
    }
  };

  // --- NEW: Camera capture ---
  const handleTakePhoto = async () => {
    try {
      setState('selecting');

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage(
          '카메라 권한이 필요합니다. 설정에서 카메라 권한을 허용해주세요.'
        );
        setState('error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled) {
        setState('idle');
        return;
      }

      const image = result.assets[0];
      setFileName('카메라 촬영');
      setState('analyzing');

      const extension = image.uri.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'heic' || extension === 'heif')
        mimeType = 'image/heic';

      const extractionResult = await extractProblemsFromFile(
        image.uri,
        mimeType
      );

      if (extractionResult.success) {
        onExtractComplete(extractionResult.problems);
        resetAndClose();
      } else {
        setErrorMessage(
          extractionResult.error || '문제 추출에 실패했습니다'
        );
        setState('error');
      }
    } catch (error) {
      console.error('카메라 촬영 오류:', error);
      const message =
        error instanceof Error
          ? error.message
          : '카메라 촬영 중 오류가 발생했습니다';
      setErrorMessage(message);
      setState('error');
    }
  };

  const resetAndClose = () => {
    setState('idle');
    setFileName('');
    setErrorMessage('');
    onDismiss();
  };

  const getStateContent = () => {
    switch (state) {
      case 'idle':
      case 'selecting':
        return (
          <>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name="file-document-multiple"
                size={64}
                color={colors.primary}
              />
            </View>
            <Text style={styles.title}>문제 추출</Text>
            <Text style={styles.description}>
              수학 문제가 포함된 PDF 또는 이미지를 업로드하면
              {'\n'}
              AI가 문제를 추출하고 난이도를 분류합니다
            </Text>
            <View style={styles.buttonGroup}>
              <Button
                mode="contained"
                onPress={handleSelectPdf}
                style={styles.selectButton}
                loading={state === 'selecting'}
                icon="file-pdf-box"
              >
                PDF 선택
              </Button>
              <Button
                mode="outlined"
                onPress={handleSelectImage}
                style={styles.selectButton}
                loading={state === 'selecting'}
                icon="image"
              >
                이미지 선택
              </Button>
              <Button
                mode="outlined"
                onPress={handleTakePhoto}
                style={styles.selectButton}
                loading={state === 'selecting'}
                icon="camera"
              >
                카메라 촬영
              </Button>
            </View>
            <Text style={styles.sizeHint}>
              최대 파일 크기: 10MB
            </Text>
          </>
        );

      case 'analyzing':
        return (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.title}>AI 분석 중...</Text>
            <Text style={styles.fileName}>{fileName}</Text>
            <Text style={styles.description}>
              문제를 추출하고 난이도를 분류하고 있습니다{'\n'}
              PDF 크기에 따라 10-30초 소요될 수 있습니다
            </Text>
          </>
        );

      case 'error':
        return (
          <>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={64}
                color={colors.error}
              />
            </View>
            <Text style={styles.title}>오류 발생</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <View style={styles.errorButtons}>
              <Button
                mode="outlined"
                onPress={resetAndClose}
                style={styles.errorButton}
              >
                취소
              </Button>
              <Button
                mode="contained"
                onPress={handleSelectPdf}
                style={styles.errorButton}
              >
                다시 시도
              </Button>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={state === 'analyzing' ? undefined : resetAndClose}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.content}>{getStateContent()}</View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.xl,
    borderRadius: 16,
    maxWidth: 400,
    alignSelf: 'center',
    width: '90%',
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  fileName: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  buttonGroup: {
    width: '100%',
    gap: spacing.sm,
  },
  selectButton: {
    width: '100%',
  },
  sizeHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  errorButton: {
    flex: 1,
  },
});
```

---

### Step 5.4: Add "문제은행 저장" Button to `problem-extract.tsx`

**File**: `app/(teacher)/problem-extract.tsx`

The existing `problem-extract.tsx` screen has a "숙제 만들기" (Create Assignment) button in the bottom bar (lines 303-316). Add a **second button** "문제은행 저장" (Save to Problem Bank) that saves selected problems to Supabase via `problemBankStore.bulkCreateProblems()`.

Add the following imports at the top of the file:

```typescript
// --- Add these imports ---
import { Alert } from 'react-native';
import { useProblemBankStore } from '../../src/stores/problemBankStore';
import { useAuthStore } from '../../src/stores/authStore';
import type { ProblemBankItemCreate, Grade, SourceType } from '../../src/types';
```

Add the save handler inside the component, after the existing `handleCreateAssignment` function:

```typescript
const handleSaveToProblemBank = async () => {
  const { user } = useAuthStore.getState();
  if (!user) {
    Alert.alert('오류', '로그인이 필요합니다.');
    return;
  }

  const selectedProblems = problems.filter((p) => selectedIds.has(p.id));
  if (selectedProblems.length === 0) {
    Alert.alert('알림', '저장할 문제를 선택해주세요.');
    return;
  }

  try {
    // Map ExtractedProblem[] to ProblemBankItemCreate[]
    const problemBankItems: ProblemBankItemCreate[] = selectedProblems.map(
      (p) => ({
        academyId: user.academyId,
        createdBy: user.id,
        content: p.content,
        imageUrls: [],
        answer: p.answer || '',
        solution: '',
        difficulty: p.difficulty,
        type: p.type,
        choices: p.choices || null,
        grade: '고1' as Grade, // Default grade; teacher can edit later in problem bank
        subject: p.topic,      // Use topic as subject for now
        topic: p.topic,
        tags: [p.topic],
        source: 'AI 추출',
        sourceType: 'ai_extracted' as SourceType,
        points: 10,
      })
    );

    const { bulkCreateProblems } = useProblemBankStore.getState();
    await bulkCreateProblems(problemBankItems);

    Alert.alert(
      '저장 완료',
      `${selectedProblems.length}개의 문제가 문제은행에 저장되었습니다.`,
      [
        {
          text: '문제은행 보기',
          onPress: () => router.replace('/(teacher)/problem-bank'),
        },
        {
          text: '계속 선택',
          style: 'cancel',
        },
      ]
    );
  } catch (error) {
    console.error('문제 저장 오류:', error);
    Alert.alert(
      '저장 실패',
      '문제를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.'
    );
  }
};
```

Update the bottom bar JSX to include both buttons. Replace the existing bottom bar (lines 304-317) with:

```typescript
{selectedIds.size > 0 && (
  <View style={styles.bottomBar}>
    <Text style={styles.selectedCount}>
      {selectedIds.size}개 문제 선택됨
    </Text>
    <View style={styles.bottomActions}>
      <Button
        mode="outlined"
        onPress={handleSaveToProblemBank}
        icon="database-plus"
        compact
      >
        문제은행 저장
      </Button>
      <Button
        mode="contained"
        onPress={handleCreateAssignment}
        icon="clipboard-plus"
      >
        숙제 만들기
      </Button>
    </View>
  </View>
)}
```

Add the `bottomActions` style to the StyleSheet:

```typescript
bottomActions: {
  flexDirection: 'row',
  gap: spacing.sm,
  alignItems: 'center',
},
```

**Complete modified bottom bar and new handler in `problem-extract.tsx`:**

```typescript
// File: app/(teacher)/problem-extract.tsx
// Only showing the changed/added sections; all other code remains unchanged.

// --- ADDED IMPORTS (add to existing import block) ---
import { Alert } from 'react-native';
import { useProblemBankStore } from '../../src/stores/problemBankStore';
import { useAuthStore } from '../../src/stores/authStore';
import type { ProblemBankItemCreate, Grade, SourceType } from '../../src/types';

// --- Inside the component, after handleCreateAssignment ---

const handleSaveToProblemBank = async () => {
  const { user } = useAuthStore.getState();
  if (!user) {
    Alert.alert('오류', '로그인이 필요합니다.');
    return;
  }

  const selectedProblems = problems.filter((p) => selectedIds.has(p.id));
  if (selectedProblems.length === 0) {
    Alert.alert('알림', '저장할 문제를 선택해주세요.');
    return;
  }

  try {
    const problemBankItems: ProblemBankItemCreate[] = selectedProblems.map(
      (p) => ({
        academyId: user.academyId,
        createdBy: user.id,
        content: p.content,
        imageUrls: [],
        answer: p.answer || '',
        solution: '',
        difficulty: p.difficulty,
        type: p.type,
        choices: p.choices || null,
        grade: '고1' as Grade,
        subject: p.topic,
        topic: p.topic,
        tags: [p.topic],
        source: 'AI 추출',
        sourceType: 'ai_extracted' as SourceType,
        points: 10,
      })
    );

    const { bulkCreateProblems } = useProblemBankStore.getState();
    await bulkCreateProblems(problemBankItems);

    Alert.alert(
      '저장 완료',
      `${selectedProblems.length}개의 문제가 문제은행에 저장되었습니다.`,
      [
        {
          text: '문제은행 보기',
          onPress: () => router.replace('/(teacher)/problem-bank'),
        },
        { text: '계속 선택', style: 'cancel' },
      ]
    );
  } catch (error) {
    console.error('문제 저장 오류:', error);
    Alert.alert(
      '저장 실패',
      '문제를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.'
    );
  }
};

// --- MODIFIED JSX: Bottom bar with two buttons ---
{selectedIds.size > 0 && (
  <View style={styles.bottomBar}>
    <Text style={styles.selectedCount}>
      {selectedIds.size}개 문제 선택됨
    </Text>
    <View style={styles.bottomActions}>
      <Button
        mode="outlined"
        onPress={handleSaveToProblemBank}
        icon="database-plus"
        compact
      >
        문제은행 저장
      </Button>
      <Button
        mode="contained"
        onPress={handleCreateAssignment}
        icon="clipboard-plus"
      >
        숙제 만들기
      </Button>
    </View>
  </View>
)}

// --- ADDED STYLE ---
// Add to the StyleSheet.create({...}) object:
bottomActions: {
  flexDirection: 'row' as const,
  gap: spacing.sm,
  alignItems: 'center' as const,
},
```

---

### Step 5.5: Add Camera FAB Action to `materials.tsx`

**File**: `app/(teacher)/materials.tsx`

The existing FAB has "자료 업로드" and "PDF 문제 추출" actions. Add a "카메라로 문제 추출" action. Note that this action simply opens the same `PdfUploadModal` (which now has the camera button from Step 5.3), but we also add a direct camera shortcut for faster access.

Update the FAB actions array:

```typescript
<FAB.Group
  open={fabOpen}
  visible
  icon={fabOpen ? 'close' : 'plus'}
  actions={[
    {
      icon: 'upload',
      label: '자료 업로드',
      onPress: () => {},
    },
    {
      icon: 'file-document-edit',
      label: 'PDF 문제 추출',
      onPress: () => {
        setPdfModalVisible(true);
        setFabOpen(false);
      },
    },
    {
      icon: 'camera',
      label: '카메라로 문제 추출',
      onPress: () => {
        setPdfModalVisible(true);
        setFabOpen(false);
        // The PdfUploadModal now has a camera button (Step 5.3)
      },
    },
  ]}
  onStateChange={({ open }) => setFabOpen(open)}
  style={styles.fabGroup}
  fabStyle={styles.fab}
/>
```

No other changes are needed in `materials.tsx` since the `PdfUploadModal` (now with camera support) handles the actual extraction flow.

---

### Step 5.6: Loading UI During Extraction

The loading UI is already handled by `PdfUploadModal` (the `'analyzing'` state shows `ActivityIndicator` + Korean text). The updated text from Step 5.3 now reads:

```
AI 분석 중...
[fileName]
문제를 추출하고 난이도를 분류하고 있습니다
PDF 크기에 따라 10-30초 소요될 수 있습니다
```

**For the `problem-bank.tsx` flow**, loading is handled differently because `handleExtractComplete` saves problems immediately via `store.bulkCreateProblems()`. The store's `isLoading` state is set to `true` during the bulk create, which triggers the `SkeletonLoader` overlay already present in the screen (line 266-269).

No additional loading UI changes are needed. The existing infrastructure covers both entry points.

---

### Step 5.7: Error Message Reference

All error messages in this section are in Korean for the target user base (Korean math academy teachers). Here is the complete error message inventory:

| Error Scenario | Korean Message | Where |
|---------------|---------------|-------|
| File exceeds 10MB | `파일 크기가 너무 큽니다 (X.XMB). 최대 10MB까지 지원됩니다. 파일을 분할하거나 해상도를 줄여주세요.` | `geminiService.ts` `checkFileSize()` |
| JSON parse failure | `JSON 응답을 파싱할 수 없습니다` | `geminiService.ts` |
| Generic extraction failure | `문제 추출 중 오류가 발생했습니다` | `geminiService.ts` catch block |
| Camera permission denied | `카메라 권한이 필요합니다. 설정에서 카메라 권한을 허용해주세요.` | `PdfUploadModal.tsx` `handleTakePhoto()` |
| PDF processing error | `파일을 처리하는 중 오류가 발생했습니다` | `PdfUploadModal.tsx` `handleSelectPdf()` |
| Image processing error | `이미지를 처리하는 중 오류가 발생했습니다` | `PdfUploadModal.tsx` `handleSelectImage()` |
| Camera processing error | `카메라 촬영 중 오류가 발생했습니다` | `PdfUploadModal.tsx` `handleTakePhoto()` |
| Generic extraction failure (modal) | `문제 추출에 실패했습니다` | `PdfUploadModal.tsx` (all handlers) |
| Not logged in | `로그인이 필요합니다.` | `problem-extract.tsx` `handleSaveToProblemBank()` |
| No problems selected | `저장할 문제를 선택해주세요.` | `problem-extract.tsx` `handleSaveToProblemBank()` |
| Save success | `X개의 문제가 문제은행에 저장되었습니다.` | `problem-extract.tsx` `handleSaveToProblemBank()` |
| Save failure | `문제를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.` | `problem-extract.tsx` `handleSaveToProblemBank()` |

---

## 5. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/geminiService.ts` | **Modify** | Add `import * as FileSystem`, add `MAX_FILE_SIZE_BYTES` constant, add `checkFileSize()` function, call `checkFileSize()` at the start of `extractProblemsFromFile()` |
| `src/components/teacher/PdfUploadModal.tsx` | **Modify** | Add `handleTakePhoto()` handler with camera permission request and `launchCameraAsync()`; add camera button to idle state UI; update analyzing state description text; add `sizeHint` style and text |
| `app/(teacher)/problem-extract.tsx` | **Modify** | Add `Alert` import; add `useProblemBankStore` and `useAuthStore` imports; add `ProblemBankItemCreate`, `Grade`, `SourceType` type imports; add `handleSaveToProblemBank()` handler; modify bottom bar to include "문제은행 저장" button alongside existing "숙제 만들기" button; add `bottomActions` style |
| `app/(teacher)/materials.tsx` | **Modify** | Add camera FAB action entry ("카메라로 문제 추출") |
| `src/services/geminiUtils.ts` | **No change** | Already has retry logic, JSON parsing, schema validation -- all used by geminiService.ts |
| `app/(teacher)/problem-bank.tsx` | **No change** | Already has complete extraction-to-save flow via `handleExtractComplete` and `store.bulkCreateProblems()` |
| `src/stores/problemBankStore.ts` | **No change** | Already has `bulkCreateProblems()` that calls `services.problemBank.bulkCreate()` |

---

## 6. Acceptance Criteria

- [ ] **File size validation**: Files over 10MB are rejected with the Korean error message `파일 크기가 너무 큽니다 (X.XMB). 최대 10MB까지 지원됩니다.` before any base64 encoding or API call is attempted.
- [ ] **PDF upload trigger**: Teacher can tap "PDF 문제 추출" FAB action (on materials or problem-bank screen) to open `PdfUploadModal`, select a PDF, and trigger Gemini extraction.
- [ ] **Camera capture trigger**: Teacher can tap "카메라 촬영" button in `PdfUploadModal` to take a camera photo and trigger Gemini extraction.
- [ ] **Image gallery trigger**: Teacher can tap "이미지 선택" button in `PdfUploadModal` to pick a gallery image and trigger Gemini extraction (already works, verify still works after changes).
- [ ] **Loading indicator**: During extraction, the modal shows "AI 분석 중..." with `ActivityIndicator`, the file name, and the text "PDF 크기에 따라 10-30초 소요될 수 있습니다".
- [ ] **Extraction results display**: Extracted problems display on the `problem-extract` screen with correct LaTeX rendering via `MathText`, difficulty badges (상/중/하), type badges (객관식/서술형/단답형), topic tags, and answer keys.
- [ ] **Save to problem bank**: Teacher can select problems on the `problem-extract` screen and tap "문제은행 저장" to persist them to Supabase via `problemBankStore.bulkCreateProblems()`.
- [ ] **Saved problems appear in bank**: After saving, navigating to the problem bank screen shows the newly saved problems.
- [ ] **Create assignment flow**: Teacher can select problems and tap "숙제 만들기" to navigate to assignment creation with the selected problems (existing functionality, verify still works).
- [ ] **Error handling -- invalid file**: Uploading a non-PDF/non-image file shows an appropriate error in the modal.
- [ ] **Error handling -- API failure**: If Gemini API returns an error (rate limit, network issue), the modal shows the error with a "다시 시도" (Retry) button.
- [ ] **Error handling -- no problems found**: If Gemini returns zero problems (e.g., blank page), the `problem-extract` screen shows the "추출된 문제가 없습니다" empty state.
- [ ] **Error handling -- file too large**: A 15MB file is rejected with the size error before any processing begins.
- [ ] **Camera permission**: If camera permission is denied, a Korean error message is shown: "카메라 권한이 필요합니다."
- [ ] **Problem bank direct flow**: The "AI 문제 추출" button on the problem-bank screen still works (extracts and saves directly to bank without going through `problem-extract` screen).

---

## 7. Estimated Effort

**1 day** (6-8 hours)

| Task | Estimated Hours | Notes |
|------|----------------|-------|
| Step 5.1: Add file size check to `geminiService.ts` | 0.5h | Small change: add import, constant, function, one function call |
| Step 5.2: Verify existing extraction works | 1h | Manual testing with a real PDF; debug any API key or parsing issues |
| Step 5.3: Add camera capture to `PdfUploadModal.tsx` | 1.5h | New handler + permission logic + UI button; test on device |
| Step 5.4: Add "문제은행 저장" to `problem-extract.tsx` | 1.5h | New handler + type mapping + Alert dialog + bottom bar redesign |
| Step 5.5: Add camera FAB to `materials.tsx` | 0.5h | Small FAB action addition |
| Step 5.6: Verify loading UI | 0.5h | Test all loading states appear correctly |
| Integration testing (all flows) | 2h | Test PDF, camera, gallery; test save to bank; test assignment creation; test error cases |
| **Total** | **~7.5h** | |

Most of the infrastructure is already built. The primary work is:
1. Adding the file size guard to prevent OOM
2. Adding camera capture support
3. Adding the "Save to Problem Bank" button on the extraction results screen
4. Integration testing all three input paths (PDF, camera, gallery) end-to-end
