# Section 04: Problem Bank UI

## Background

This section implements the **Problem Bank UI** -- the teacher-facing screens and components for managing a persistent, searchable, filterable collection of math problems. It covers Phase 2 of the plan (Steps 3.6, 3.7, and 3.8).

Currently, math problems exist only transiently: the teacher uploads a PDF/image through the materials screen (`app/(teacher)/materials.tsx`), Gemini AI extracts problems into `ExtractedProblem[]`, and those problems are displayed in `app/(teacher)/problem-extract.tsx`. From there the teacher can create an assignment, but the problems themselves are never persisted to a bank. Similarly, `app/(teacher)/assignments.tsx` uses hardcoded mock assignments with no way to pull from a shared problem bank.

This section builds the bridge: a dedicated problem bank screen with CRUD operations, multi-dimensional filtering, batch selection, and integration points that connect the existing extraction and assignment flows to the persistent problem bank store.

---

## Dependencies (Sections 01-03)

This section assumes the following are already implemented and available. All types, services, and stores referenced below are defined in Sections 01-03. The relevant pieces are reproduced here so you never need to open another document.

### From Section 01: Types & Interfaces

**`src/types/problemBank.ts`** must export:

```typescript
import { Grade } from './index';

export type Difficulty = '상' | '중' | '하';
export type ProblemType = '객관식' | '서술형' | '단답형';
export type SourceType = 'manual' | 'ai_extracted' | 'imported';

export interface ProblemBankItem {
  id: string;
  content: string;              // LaTeX-enabled text (e.g. "$x^2 + 3x$를 인수분해하시오.")
  contentHtml?: string;         // Pre-rendered HTML (optional cache, NOT used in this section)
  imageUrls?: string[];
  answer?: string;
  solution?: string;            // Step-by-step solution (LaTeX)
  difficulty: Difficulty;
  type: ProblemType;
  choices?: string[];           // For 객관식 only
  grade: Grade;
  subject: string;              // e.g. "방정식과 부등식"
  topic: string;                // e.g. "이차방정식"
  tags?: string[];
  source?: string;              // e.g. "2024 모의고사"
  sourceType: SourceType;
  points: number;
  usageCount: number;
  correctRate?: number;         // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface ProblemBankFilters {
  grades: Grade[];
  topics: string[];
  difficulties: Difficulty[];
  types: ProblemType[];
  searchQuery: string;
}
```

**`src/types/index.ts`** must export (existing):

```typescript
export type Grade = '중1' | '중2' | '중3' | '고1' | '고2' | '고3';
```

### From Section 02: Mock Data & Services

**`src/services/interfaces/problemBank.ts`** must define:

```typescript
import { ProblemBankItem, ProblemBankFilters } from '../../types/problemBank';

export interface IProblemBankService {
  getAll(): Promise<ProblemBankItem[]>;
  getById(id: string): Promise<ProblemBankItem | null>;
  create(item: Omit<ProblemBankItem, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<ProblemBankItem>;
  createBatch(items: Omit<ProblemBankItem, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[]): Promise<ProblemBankItem[]>;
  update(id: string, updates: Partial<ProblemBankItem>): Promise<ProblemBankItem>;
  delete(id: string): Promise<void>;
  search(filters: ProblemBankFilters): Promise<ProblemBankItem[]>;
  getTopics(grade?: Grade): Promise<string[]>;
}
```

**`src/services/mock/mockProblemBank.ts`** implements the above with AsyncStorage persistence and 100+ seed problems.

**`src/services/index.ts`** (Service Factory) must export:

```typescript
import { MockProblemBankService } from './mock/mockProblemBank';

const services = {
  problemBank: new MockProblemBankService(),
  // ... other services
};
export default services;
```

### From Section 03: Zustand Stores

**`src/stores/problemBankStore.ts`** must export:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProblemBankItem, ProblemBankFilters, Difficulty, ProblemType } from '../types/problemBank';
import { Grade } from '../types';
import services from '../services';

interface ProblemBankState {
  problems: ProblemBankItem[];
  filters: ProblemBankFilters;
  filteredProblems: ProblemBankItem[];
  isLoading: boolean;
  error: string | null;
  topics: string[];

  // Actions
  fetchProblems: () => Promise<void>;
  fetchTopics: (grade?: Grade) => Promise<void>;
  addProblem: (item: Omit<ProblemBankItem, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<ProblemBankItem>;
  addProblems: (items: Omit<ProblemBankItem, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[]) => Promise<ProblemBankItem[]>;
  updateProblem: (id: string, updates: Partial<ProblemBankItem>) => Promise<void>;
  deleteProblem: (id: string) => Promise<void>;
  setFilter: (key: keyof ProblemBankFilters, value: any) => void;
  clearFilters: () => void;
  applyFilters: () => Promise<void>;
}
```

### Existing codebase references

The following files already exist and are referenced throughout this section:

| File | Purpose |
|------|---------|
| `src/constants/theme.ts` | `colors`, `spacing`, `borderRadius`, `tabletSizes` |
| `src/constants/curriculum.ts` | `curriculum`, `getSubjectsByGrade()`, `getAllGrades()`, `Subject` |
| `src/components/common/index.ts` | `Card`, `CardHeader`, `Button`, `Input` |
| `src/components/common/MathText.tsx` | LaTeX rendering component |
| `src/services/geminiService.ts` | `ExtractedProblem`, `extractProblemsFromFile()` |
| `src/components/teacher/PdfUploadModal.tsx` | PDF/Image upload + AI extraction modal |
| `app/(teacher)/_layout.tsx` | Expo Router Tabs layout (5 visible tabs + hidden problem-extract) |
| `app/(teacher)/problem-extract.tsx` | Displays extracted problems, batch select, create assignment |
| `app/(teacher)/assignments.tsx` | Assignment list with mock data |
| `app/(teacher)/materials.tsx` | Materials list with FAB for PDF extraction |

---

## What to Build

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│  problem-bank.tsx (Screen)                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Header: "문제은행" + count + search bar              │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ ProblemFilters (horizontal chip rows)                 │  │
│  │  [학년: 전체|중1|...|고3] [난이도: 전체|상|중|하]    │  │
│  │  [유형: 전체|객관식|서술형|단답형] [단원: 동적 chips] │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ FlatList (virtualized)                                │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ ProblemCard (text summary, NOT full LaTeX)      │  │  │
│  │  │  [#1] [중] [객관식] [이차방정식] ☐             │  │  │
│  │  │  "다음 이차방정식 중 공통인 해를..."            │  │  │
│  │  │  정답률 78% · 사용 3회                          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ ProblemCard ...                                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ...                                                  │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Bottom Bar (visible when selection > 0)               │  │
│  │  "3개 선택됨"        [숙제에 추가] [삭제]            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                   [+ FAB]   │
│                                          ┌────────────────┐ │
│                                          │ 직접 등록       │ │
│                                          │ AI 문제 추출   │ │
│                                          └────────────────┘ │
│                                                             │
│  ─── Modals ───                                             │
│  ProblemDetailModal: Full LaTeX render + solution + stats   │
│  ProblemForm: Create/edit problem                           │
│  ProblemSelector: Used from assignments.tsx                 │
│  PdfUploadModal: Existing (reused)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## File 1: `src/components/problemBank/ProblemCard.tsx`

### Purpose
Renders a single problem as a compact card in the FlatList. **Critical performance decision**: in the list view, the card shows a **plain-text summary** (first 50 characters, LaTeX markers stripped) rather than rendering LaTeX via WebView/iframe. Full LaTeX rendering only happens in the detail modal.

### Props

```typescript
import { ProblemBankItem } from '../../types/problemBank';

interface ProblemCardProps {
  problem: ProblemBankItem;
  index: number;
  isSelected: boolean;
  selectionMode: boolean;       // true when any card is selected (shows checkboxes)
  onPress: (problem: ProblemBankItem) => void;        // Opens detail modal
  onLongPress: (problem: ProblemBankItem) => void;     // Enters selection mode
  onToggleSelect: (problemId: string) => void;
}
```

### Implementation

```typescript
import React, { memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip, Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { ProblemBankItem } from '../../types/problemBank';

// Strip LaTeX markers for plain-text summary
const stripLatex = (content: string): string => {
  return content
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')   // Remove $$ blocks
    .replace(/\$([\s\S]*?)\$/g, '$1')         // Remove $ inline
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]*)\}/g, 'sqrt($1)')
    .replace(/\\[a-zA-Z]+/g, '')              // Remove \commands
    .replace(/[{}]/g, '')                      // Remove braces
    .replace(/\s+/g, ' ')                      // Collapse whitespace
    .trim();
};

const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case '상': return colors.error;
    case '중': return colors.warning;
    case '하': return colors.success;
    default: return colors.textSecondary;
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case '객관식': return colors.primary;
    case '서술형': return colors.warning;
    case '단답형': return colors.success;
    default: return colors.textSecondary;
  }
};

const CARD_HEIGHT = 120; // Fixed height for getItemLayout optimization

function ProblemCardInner({
  problem,
  index,
  isSelected,
  selectionMode,
  onPress,
  onLongPress,
  onToggleSelect,
}: ProblemCardProps) {
  const summary = stripLatex(problem.content).slice(0, 80) + (problem.content.length > 80 ? '...' : '');

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      onPress={() => selectionMode ? onToggleSelect(problem.id) : onPress(problem)}
      onLongPress={() => onLongPress(problem)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        {/* Problem number badge */}
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{index + 1}</Text>
        </View>

        {/* Difficulty chip */}
        <Chip
          compact
          style={[
            styles.chip,
            { backgroundColor: getDifficultyColor(problem.difficulty) + '20' },
          ]}
          textStyle={{ color: getDifficultyColor(problem.difficulty), fontSize: 11 }}
        >
          {problem.difficulty}
        </Chip>

        {/* Type chip */}
        <Chip
          compact
          style={[
            styles.chip,
            { backgroundColor: getTypeColor(problem.type) + '20' },
          ]}
          textStyle={{ color: getTypeColor(problem.type), fontSize: 11 }}
        >
          {problem.type}
        </Chip>

        {/* Topic chip */}
        <Chip compact style={[styles.chip, styles.topicChip]}>
          {problem.topic}
        </Chip>

        {/* Checkbox (selection mode) or grade badge */}
        <View style={styles.rightSection}>
          {selectionMode ? (
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => onToggleSelect(problem.id)}
              color={colors.primary}
            />
          ) : (
            <Chip compact style={styles.gradeChip}>
              {problem.grade}
            </Chip>
          )}
        </View>
      </View>

      {/* Text summary (NO LaTeX rendering for performance) */}
      <Text style={styles.summaryText} numberOfLines={2}>
        {summary}
      </Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {problem.correctRate !== undefined && (
          <View style={styles.stat}>
            <MaterialCommunityIcons name="percent" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>정답률 {problem.correctRate}%</Text>
          </View>
        )}
        <View style={styles.stat}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.statText}>사용 {problem.usageCount}회</Text>
        </View>
        {problem.source && (
          <View style={styles.stat}>
            <MaterialCommunityIcons name="bookmark-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{problem.source}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Memo with custom comparison: only re-render when meaningful props change
export const ProblemCard = memo(ProblemCardInner, (prev, next) => {
  return (
    prev.problem.id === next.problem.id &&
    prev.problem.updatedAt === next.problem.updatedAt &&
    prev.isSelected === next.isSelected &&
    prev.selectionMode === next.selectionMode &&
    prev.index === next.index
  );
});

// Export fixed height for FlatList getItemLayout
export const PROBLEM_CARD_HEIGHT = CARD_HEIGHT + spacing.sm; // card + marginBottom

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    height: CARD_HEIGHT,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '15',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  chip: {
    height: 24,
  },
  topicChip: {
    backgroundColor: colors.surfaceVariant,
  },
  gradeChip: {
    backgroundColor: colors.primaryLight + '30',
  },
  rightSection: {
    marginLeft: 'auto',
  },
  summaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
```

### Key design decisions

1. **`memo()` with custom comparator** -- prevents re-renders when the parent FlatList re-renders due to filter changes that do not affect this specific card.
2. **`stripLatex()` utility** -- aggressively removes LaTeX syntax to produce a readable plain-text summary. This avoids loading a WebView/iframe for every card in the list.
3. **Fixed `CARD_HEIGHT` = 120** -- used by `getItemLayout` on the FlatList to avoid dynamic measurement of off-screen items. The constant is exported so the screen can use it.
4. **Long-press to enter selection mode** -- follows the material design pattern. Once in selection mode, tapping toggles selection.

---

## File 2: `src/components/problemBank/ProblemFilters.tsx`

### Purpose
Horizontal scrollable chip rows for multi-dimensional filtering: grade, difficulty, type, topic. Also includes a search bar.

### Props

```typescript
import { ProblemBankFilters, Difficulty, ProblemType } from '../../types/problemBank';
import { Grade } from '../../types';

interface ProblemFiltersProps {
  filters: ProblemBankFilters;
  availableTopics: string[];     // Dynamically loaded based on selected grade
  onFilterChange: (key: keyof ProblemBankFilters, value: any) => void;
  onClearAll: () => void;
  totalCount: number;
  filteredCount: number;
}
```

### Implementation

```typescript
import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Chip, Searchbar, Button } from 'react-native-paper';
import { colors, spacing } from '../../constants/theme';
import { ProblemBankFilters, Difficulty, ProblemType } from '../../types/problemBank';
import { Grade } from '../../types';

const ALL_GRADES: Grade[] = ['중1', '중2', '중3', '고1', '고2', '고3'];
const ALL_DIFFICULTIES: Difficulty[] = ['상', '중', '하'];
const ALL_TYPES: ProblemType[] = ['객관식', '서술형', '단답형'];

const getDifficultyColor = (d: Difficulty): string => {
  switch (d) {
    case '상': return colors.error;
    case '중': return colors.warning;
    case '하': return colors.success;
  }
};

export default function ProblemFilters({
  filters,
  availableTopics,
  onFilterChange,
  onClearAll,
  totalCount,
  filteredCount,
}: ProblemFiltersProps) {
  // Toggle a value in an array filter (e.g. grades, difficulties)
  const toggleArrayFilter = useCallback(
    (key: 'grades' | 'topics' | 'difficulties' | 'types', value: string) => {
      const current = filters[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onFilterChange(key, next);
    },
    [filters, onFilterChange]
  );

  const hasActiveFilters =
    filters.grades.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.types.length > 0 ||
    filters.topics.length > 0 ||
    filters.searchQuery.length > 0;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <Searchbar
        placeholder="문제 검색 (내용, 단원, 태그...)"
        value={filters.searchQuery}
        onChangeText={(text) => onFilterChange('searchQuery', text)}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
        elevation={0}
      />

      {/* Filter result count + clear button */}
      <View style={styles.resultRow}>
        <Text style={styles.resultText}>
          {hasActiveFilters
            ? `${filteredCount}개 / 전체 ${totalCount}개`
            : `전체 ${totalCount}개`}
        </Text>
        {hasActiveFilters && (
          <Button compact mode="text" onPress={onClearAll} textColor={colors.error}>
            필터 초기화
          </Button>
        )}
      </View>

      {/* Grade chips */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>학년</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {ALL_GRADES.map((grade) => (
            <Chip
              key={grade}
              selected={filters.grades.includes(grade)}
              onPress={() => toggleArrayFilter('grades', grade)}
              style={styles.filterChip}
              showSelectedCheck={false}
              selectedColor={colors.primary}
            >
              {grade}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Difficulty chips */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>난이도</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {ALL_DIFFICULTIES.map((diff) => (
            <Chip
              key={diff}
              selected={filters.difficulties.includes(diff)}
              onPress={() => toggleArrayFilter('difficulties', diff)}
              style={[
                styles.filterChip,
                filters.difficulties.includes(diff) && {
                  backgroundColor: getDifficultyColor(diff) + '25',
                  borderColor: getDifficultyColor(diff),
                  borderWidth: 1,
                },
              ]}
              showSelectedCheck={false}
              selectedColor={getDifficultyColor(diff)}
            >
              {diff}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Type chips */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>유형</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {ALL_TYPES.map((type) => (
            <Chip
              key={type}
              selected={filters.types.includes(type)}
              onPress={() => toggleArrayFilter('types', type)}
              style={styles.filterChip}
              showSelectedCheck={false}
              selectedColor={colors.primary}
            >
              {type}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Topic chips (dynamic, only shown when there are topics) */}
      {availableTopics.length > 0 && (
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>단원</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {availableTopics.map((topic) => (
              <Chip
                key={topic}
                selected={filters.topics.includes(topic)}
                onPress={() => toggleArrayFilter('topics', topic)}
                style={styles.filterChip}
                showSelectedCheck={false}
                selectedColor={colors.secondary}
              >
                {topic}
              </Chip>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchbar: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    height: 44,
  },
  searchInput: {
    fontSize: 14,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  resultText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    marginTop: spacing.xs,
  },
  filterLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    width: 40,
    flexShrink: 0,
  },
  chipScroll: {
    flexGrow: 0,
  },
  filterChip: {
    marginRight: spacing.xs,
    height: 30,
  },
});
```

### Key design decisions

1. **Toggle array pattern** -- each filter dimension is an array. An empty array means "show all" for that dimension. Multiple selections in the same dimension are OR'd (e.g. selecting both "중1" and "중2" shows problems from either grade). Across dimensions they are AND'd (e.g. grade=중1 AND difficulty=상).
2. **Topic chips are dynamic** -- they change when the grade filter changes. The parent screen calls `store.fetchTopics(selectedGrade)` to update `availableTopics`.
3. **Search bar at the top** -- searches across `content`, `topic`, `tags`, and `source` fields (handled by the store/service layer).

---

## File 3: `src/components/problemBank/ProblemForm.tsx`

### Purpose
A modal form for manually creating or editing a problem. Includes a live LaTeX preview toggle.

### Props

```typescript
import { ProblemBankItem, Difficulty, ProblemType } from '../../types/problemBank';
import { Grade } from '../../types';

interface ProblemFormProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (data: ProblemFormData) => Promise<void>;
  initialData?: ProblemBankItem;     // If provided, form is in edit mode
}

interface ProblemFormData {
  content: string;
  answer: string;
  solution: string;
  difficulty: Difficulty;
  type: ProblemType;
  choices: string[];               // Only used when type === '객관식'
  grade: Grade;
  subject: string;
  topic: string;
  tags: string[];
  source: string;
  points: number;
}
```

### Implementation

```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Text, Portal, Modal, Button, TextInput, Chip,
  SegmentedButtons, IconButton, Switch,
} from 'react-native-paper';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { getSubjectsByGrade, getAllGrades } from '../../constants/curriculum';
import MathText from '../common/MathText';
import { ProblemBankItem, Difficulty, ProblemType } from '../../types/problemBank';
import { Grade } from '../../types';

const DIFFICULTIES: Difficulty[] = ['하', '중', '상'];
const TYPES: ProblemType[] = ['객관식', '서술형', '단답형'];

export default function ProblemForm({
  visible,
  onDismiss,
  onSave,
  initialData,
}: ProblemFormProps) {
  const isEditMode = !!initialData;

  // Form state
  const [content, setContent] = useState('');
  const [answer, setAnswer] = useState('');
  const [solution, setSolution] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('중');
  const [type, setType] = useState<ProblemType>('단답형');
  const [choices, setChoices] = useState<string[]>(['', '', '', '', '']);
  const [grade, setGrade] = useState<Grade>('고1');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState('');
  const [source, setSource] = useState('');
  const [points, setPoints] = useState('10');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      setContent(initialData.content);
      setAnswer(initialData.answer || '');
      setSolution(initialData.solution || '');
      setDifficulty(initialData.difficulty);
      setType(initialData.type);
      setChoices(initialData.choices || ['', '', '', '', '']);
      setGrade(initialData.grade);
      setSubject(initialData.subject);
      setTopic(initialData.topic);
      setTags(initialData.tags?.join(', ') || '');
      setSource(initialData.source || '');
      setPoints(String(initialData.points));
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setContent('');
    setAnswer('');
    setSolution('');
    setDifficulty('중');
    setType('단답형');
    setChoices(['', '', '', '', '']);
    setGrade('고1');
    setSubject('');
    setTopic('');
    setTags('');
    setSource('');
    setPoints('10');
    setShowPreview(false);
  };

  // Dynamic subject/topic options based on grade
  const subjects = useMemo(() => getSubjectsByGrade(grade), [grade]);
  const topicOptions = useMemo(() => {
    const found = subjects.find((s) => s.name === subject);
    return found?.chapters || [];
  }, [subjects, subject]);

  const updateChoice = (index: number, value: string) => {
    const next = [...choices];
    next[index] = value;
    setChoices(next);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        content: content.trim(),
        answer: answer.trim(),
        solution: solution.trim(),
        difficulty,
        type,
        choices: type === '객관식' ? choices.filter((c) => c.trim()) : [],
        grade,
        subject,
        topic,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        source: source.trim(),
        points: parseInt(points, 10) || 10,
      });
      resetForm();
      onDismiss();
    } catch (e) {
      console.error('문제 저장 실패:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditMode ? '문제 수정' : '문제 등록'}
            </Text>
            <IconButton icon="close" onPress={onDismiss} />
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Grade selector */}
            <Text style={styles.sectionLabel}>학년 *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getAllGrades().map((g) => (
                <Chip
                  key={g}
                  selected={grade === g}
                  onPress={() => {
                    setGrade(g);
                    setSubject('');
                    setTopic('');
                  }}
                  style={styles.selectorChip}
                  showSelectedCheck={false}
                  selectedColor={colors.primary}
                >
                  {g}
                </Chip>
              ))}
            </ScrollView>

            {/* Subject selector */}
            <Text style={styles.sectionLabel}>과목 *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {subjects.map((s) => (
                <Chip
                  key={s.id}
                  selected={subject === s.name}
                  onPress={() => {
                    setSubject(s.name);
                    setTopic('');
                  }}
                  style={styles.selectorChip}
                  showSelectedCheck={false}
                  selectedColor={colors.primary}
                >
                  {s.name}
                </Chip>
              ))}
            </ScrollView>

            {/* Topic selector */}
            {topicOptions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>단원 *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {topicOptions.map((t) => (
                    <Chip
                      key={t}
                      selected={topic === t}
                      onPress={() => setTopic(t)}
                      style={styles.selectorChip}
                      showSelectedCheck={false}
                      selectedColor={colors.secondary}
                    >
                      {t}
                    </Chip>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Difficulty */}
            <Text style={styles.sectionLabel}>난이도 *</Text>
            <SegmentedButtons
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as Difficulty)}
              buttons={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
              style={styles.segmented}
            />

            {/* Type */}
            <Text style={styles.sectionLabel}>유형 *</Text>
            <SegmentedButtons
              value={type}
              onValueChange={(v) => setType(v as ProblemType)}
              buttons={TYPES.map((t) => ({ value: t, label: t }))}
              style={styles.segmented}
            />

            {/* Content (LaTeX input) */}
            <View style={styles.contentHeader}>
              <Text style={styles.sectionLabel}>문제 내용 * (LaTeX 지원: $...$)</Text>
              <View style={styles.previewToggle}>
                <Text style={styles.previewLabel}>미리보기</Text>
                <Switch value={showPreview} onValueChange={setShowPreview} />
              </View>
            </View>
            <TextInput
              mode="outlined"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              style={styles.textArea}
              placeholder="예: $x^2 + 3x + 2 = 0$의 해를 구하시오."
            />
            {showPreview && content.trim() && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>미리보기:</Text>
                <MathText content={content} fontSize={15} />
              </View>
            )}

            {/* Choices (only for 객관식) */}
            {type === '객관식' && (
              <>
                <Text style={styles.sectionLabel}>보기</Text>
                {choices.map((choice, idx) => (
                  <View key={idx} style={styles.choiceRow}>
                    <Text style={styles.choiceLabel}>
                      {['①', '②', '③', '④', '⑤'][idx]}
                    </Text>
                    <TextInput
                      mode="outlined"
                      value={choice}
                      onChangeText={(v) => updateChoice(idx, v)}
                      style={styles.choiceInput}
                      placeholder={`보기 ${idx + 1}`}
                      dense
                    />
                  </View>
                ))}
              </>
            )}

            {/* Answer */}
            <Text style={styles.sectionLabel}>정답</Text>
            <TextInput
              mode="outlined"
              value={answer}
              onChangeText={setAnswer}
              style={styles.input}
              placeholder={type === '객관식' ? '예: ③' : '예: $x = -1$ 또는 $x = -2$'}
              dense
            />

            {/* Solution */}
            <Text style={styles.sectionLabel}>풀이</Text>
            <TextInput
              mode="outlined"
              value={solution}
              onChangeText={setSolution}
              multiline
              numberOfLines={3}
              style={styles.textArea}
              placeholder="단계별 풀이를 입력하세요 (LaTeX 지원)"
            />

            {/* Source */}
            <Text style={styles.sectionLabel}>출처</Text>
            <TextInput
              mode="outlined"
              value={source}
              onChangeText={setSource}
              style={styles.input}
              placeholder="예: 2024 수능 모의고사"
              dense
            />

            {/* Tags */}
            <Text style={styles.sectionLabel}>태그 (쉼표로 구분)</Text>
            <TextInput
              mode="outlined"
              value={tags}
              onChangeText={setTags}
              style={styles.input}
              placeholder="예: 인수분해, 근의공식, 판별식"
              dense
            />

            {/* Points */}
            <Text style={styles.sectionLabel}>배점</Text>
            <TextInput
              mode="outlined"
              value={points}
              onChangeText={setPoints}
              keyboardType="numeric"
              style={styles.input}
              placeholder="10"
              dense
            />

            {/* Spacer for bottom buttons */}
            <View style={{ height: 80 }} />
          </ScrollView>

          {/* Bottom action buttons */}
          <View style={styles.bottomButtons}>
            <Button mode="outlined" onPress={onDismiss} style={styles.cancelButton}>
              취소
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isSaving}
              disabled={!content.trim() || !grade || !subject || !topic || isSaving}
              style={styles.saveButton}
            >
              {isEditMode ? '수정' : '등록'}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 16,
    maxHeight: '90%',
    maxWidth: 600,
    alignSelf: 'center',
    width: '95%',
  },
  keyboardAvoid: {
    flex: 1,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  selectorChip: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  segmented: {
    marginBottom: spacing.sm,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  previewLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  textArea: {
    backgroundColor: colors.surface,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.surface,
    fontSize: 14,
  },
  previewBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
  },
  previewTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  choiceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    width: 24,
    textAlign: 'center',
  },
  choiceInput: {
    flex: 1,
    backgroundColor: colors.surface,
    fontSize: 14,
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
});
```

### Key design decisions

1. **LaTeX preview toggle** -- the preview pane uses the existing `MathText` component. It is off by default (one extra `MathText` instance is fine in a modal, but we do not want it re-rendering on every keystroke by default). The teacher can toggle it on to check their input.
2. **Cascading selectors** -- grade -> subject -> topic. When grade changes, subject and topic reset. The options come from `curriculum.ts` via `getSubjectsByGrade()`.
3. **Validation** -- the save button is disabled until `content`, `grade`, `subject`, and `topic` are all filled.

---

## File 4: `src/components/problemBank/ProblemSelector.tsx`

### Purpose
A modal component used from `assignments.tsx` when the teacher wants to select problems from the bank to add to an assignment. It embeds `ProblemFilters` and renders a FlatList of `ProblemCard` components in forced selection mode.

### Props

```typescript
import { ProblemBankItem } from '../../types/problemBank';

interface ProblemSelectorProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (selectedProblems: ProblemBankItem[]) => void;
  excludeIds?: string[];           // Problems already in the assignment
}
```

### Implementation

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Portal, Modal, Button, IconButton } from 'react-native-paper';
import { colors, spacing } from '../../constants/theme';
import { ProblemBankItem, ProblemBankFilters } from '../../types/problemBank';
import { useProblemBankStore } from '../../stores/problemBankStore';
import { ProblemCard, PROBLEM_CARD_HEIGHT } from './ProblemCard';
import ProblemFilters from './ProblemFilters';

export default function ProblemSelector({
  visible,
  onDismiss,
  onConfirm,
  excludeIds = [],
}: ProblemSelectorProps) {
  const {
    filteredProblems,
    filters,
    topics,
    isLoading,
    fetchProblems,
    fetchTopics,
    setFilter,
    clearFilters,
    applyFilters,
    problems,
  } = useProblemBankStore();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load data when modal opens
  useEffect(() => {
    if (visible) {
      fetchProblems();
      fetchTopics();
      setSelectedIds(new Set());
      clearFilters();
    }
  }, [visible]);

  // Re-apply filters whenever they change
  useEffect(() => {
    if (visible) {
      applyFilters();
    }
  }, [filters]);

  // Exclude problems already in the assignment
  const availableProblems = filteredProblems.filter(
    (p) => !excludeIds.includes(p.id)
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleConfirm = () => {
    const selected = problems.filter((p) => selectedIds.has(p.id));
    onConfirm(selected);
    onDismiss();
  };

  const handleSelectAll = () => {
    if (selectedIds.size === availableProblems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableProblems.map((p) => p.id)));
    }
  };

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: PROBLEM_CARD_HEIGHT,
      offset: PROBLEM_CARD_HEIGHT * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ProblemBankItem; index: number }) => (
      <ProblemCard
        problem={item}
        index={index}
        isSelected={selectedIds.has(item.id)}
        selectionMode={true}     // Always in selection mode in the selector
        onPress={() => toggleSelect(item.id)}
        onLongPress={() => toggleSelect(item.id)}
        onToggleSelect={toggleSelect}
      />
    ),
    [selectedIds, toggleSelect]
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>문제 선택</Text>
          <View style={styles.headerRight}>
            <Button compact mode="text" onPress={handleSelectAll}>
              {selectedIds.size === availableProblems.length ? '선택 해제' : '전체 선택'}
            </Button>
            <IconButton icon="close" onPress={onDismiss} />
          </View>
        </View>

        {/* Filters */}
        <ProblemFilters
          filters={filters}
          availableTopics={topics}
          onFilterChange={setFilter}
          onClearAll={clearFilters}
          totalCount={problems.length - excludeIds.length}
          filteredCount={availableProblems.length}
        />

        {/* Problem list */}
        <FlatList
          data={availableProblems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.selectedCount}>
            {selectedIds.size}개 선택됨
          </Text>
          <Button
            mode="contained"
            onPress={handleConfirm}
            disabled={selectedIds.size === 0}
            icon="plus"
          >
            숙제에 추가
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 16,
    maxHeight: '90%',
    maxWidth: 700,
    alignSelf: 'center',
    width: '95%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  selectedCount: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
```

### Key design decisions

1. **Always in selection mode** -- unlike the main problem bank screen, this modal forces `selectionMode={true}` on every card so the user can tap to select without long-pressing first.
2. **`excludeIds`** -- prevents the teacher from double-adding problems already in the assignment.
3. **FlatList virtualization** -- uses `getItemLayout`, `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`, and `removeClippedSubviews` for smooth scrolling with 100+ items.

---

## File 5: `src/components/problemBank/index.ts`

Barrel export file:

```typescript
export { ProblemCard, PROBLEM_CARD_HEIGHT } from './ProblemCard';
export { default as ProblemFilters } from './ProblemFilters';
export { default as ProblemForm } from './ProblemForm';
export { default as ProblemSelector } from './ProblemSelector';
```

---

## File 6: `app/(teacher)/problem-bank.tsx`

### Purpose
The main Problem Bank screen accessible from the teacher dashboard. This is the most complex file in this section.

### Implementation

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, IconButton, Button, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing } from '../../src/constants/theme';
import { ProblemBankItem } from '../../src/types/problemBank';
import { useProblemBankStore } from '../../src/stores/problemBankStore';
import {
  ProblemCard,
  PROBLEM_CARD_HEIGHT,
  ProblemFilters,
  ProblemForm,
} from '../../src/components/problemBank';
import MathText from '../../src/components/common/MathText';
import PdfUploadModal from '../../src/components/teacher/PdfUploadModal';
import { ExtractedProblem } from '../../src/services/geminiService';

// ─── Detail Modal Sub-component ────────────────────────────────────────────
interface DetailModalProps {
  problem: ProblemBankItem | null;
  visible: boolean;
  onDismiss: () => void;
  onEdit: (problem: ProblemBankItem) => void;
  onDelete: (id: string) => void;
}

function ProblemDetailModal({ problem, visible, onDismiss, onEdit, onDelete }: DetailModalProps) {
  if (!problem) return null;

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case '상': return colors.error;
      case '중': return colors.warning;
      case '하': return colors.success;
      default: return colors.textSecondary;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={detailStyles.container}
      >
        <View style={detailStyles.header}>
          <Text style={detailStyles.title}>문제 상세</Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        <ScrollView style={detailStyles.scrollContent}>
          {/* Meta chips */}
          <View style={detailStyles.metaRow}>
            <Chip compact style={{ backgroundColor: getDifficultyColor(problem.difficulty) + '20' }}>
              {problem.difficulty}
            </Chip>
            <Chip compact>{problem.type}</Chip>
            <Chip compact>{problem.grade}</Chip>
            <Chip compact>{problem.topic}</Chip>
          </View>

          {/* Full LaTeX rendering (THIS is where we use MathText) */}
          <View style={detailStyles.contentBox}>
            <Text style={detailStyles.sectionTitle}>문제</Text>
            <MathText content={problem.content} fontSize={16} />
          </View>

          {/* Choices for 객관식 */}
          {problem.type === '객관식' && problem.choices && (
            <View style={detailStyles.choicesBox}>
              {problem.choices.map((choice, idx) => (
                <View key={idx} style={detailStyles.choiceRow}>
                  <Text style={detailStyles.choiceNum}>
                    {['①', '②', '③', '④', '⑤'][idx]}
                  </Text>
                  <MathText content={choice} fontSize={14} />
                </View>
              ))}
            </View>
          )}

          {/* Answer */}
          {problem.answer && (
            <View style={detailStyles.contentBox}>
              <Text style={detailStyles.sectionTitle}>정답</Text>
              <MathText content={problem.answer} fontSize={15} color={colors.success} />
            </View>
          )}

          {/* Solution */}
          {problem.solution && (
            <View style={detailStyles.contentBox}>
              <Text style={detailStyles.sectionTitle}>풀이</Text>
              <MathText content={problem.solution} fontSize={14} />
            </View>
          )}

          {/* Stats */}
          <View style={detailStyles.statsBox}>
            <Text style={detailStyles.sectionTitle}>통계</Text>
            <View style={detailStyles.statsGrid}>
              <View style={detailStyles.statItem}>
                <Text style={detailStyles.statValue}>
                  {problem.correctRate !== undefined ? `${problem.correctRate}%` : '-'}
                </Text>
                <Text style={detailStyles.statLabel}>정답률</Text>
              </View>
              <View style={detailStyles.statItem}>
                <Text style={detailStyles.statValue}>{problem.usageCount}</Text>
                <Text style={detailStyles.statLabel}>사용 횟수</Text>
              </View>
              <View style={detailStyles.statItem}>
                <Text style={detailStyles.statValue}>{problem.points}</Text>
                <Text style={detailStyles.statLabel}>배점</Text>
              </View>
            </View>
          </View>

          {/* Source & tags */}
          {(problem.source || (problem.tags && problem.tags.length > 0)) && (
            <View style={detailStyles.metaBox}>
              {problem.source && (
                <Text style={detailStyles.metaText}>출처: {problem.source}</Text>
              )}
              {problem.tags && problem.tags.length > 0 && (
                <View style={detailStyles.tagsRow}>
                  {problem.tags.map((tag) => (
                    <Chip key={tag} compact style={detailStyles.tagChip}>#{tag}</Chip>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Action buttons */}
        <View style={detailStyles.actions}>
          <Button
            mode="outlined"
            onPress={() => onDelete(problem.id)}
            textColor={colors.error}
            icon="delete"
            style={detailStyles.actionButton}
          >
            삭제
          </Button>
          <Button
            mode="contained"
            onPress={() => onEdit(problem)}
            icon="pencil"
            style={[detailStyles.actionButton, { flex: 2 }]}
          >
            수정
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

// ─── NOTE: Import ScrollView & Chip at the top ────────────────────────────
// Add these to the existing imports at the top of the file:
// import { ScrollView } from 'react-native';      (already in RN import)
// import { Chip } from 'react-native-paper';       (add to Paper import)

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function ProblemBankScreen() {
  const store = useProblemBankStore();

  // Local UI state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [detailProblem, setDetailProblem] = useState<ProblemBankItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState<ProblemBankItem | undefined>(undefined);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    store.fetchProblems();
    store.fetchTopics();
  }, []);

  // Re-apply filters when they change
  useEffect(() => {
    store.applyFilters();
  }, [store.filters]);

  // Update topics when grade filter changes
  useEffect(() => {
    const selectedGrade = store.filters.grades.length === 1
      ? store.filters.grades[0]
      : undefined;
    store.fetchTopics(selectedGrade);
  }, [store.filters.grades]);

  // ─── Selection handlers ──────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Exit selection mode if nothing selected
      if (next.size === 0) {
        setSelectionMode(false);
      }
      return next;
    });
  }, []);

  const enterSelectionMode = useCallback((problem: ProblemBankItem) => {
    setSelectionMode(true);
    setSelectedIds(new Set([problem.id]));
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === store.filteredProblems.length) {
      exitSelectionMode();
    } else {
      setSelectionMode(true);
      setSelectedIds(new Set(store.filteredProblems.map((p) => p.id)));
    }
  }, [selectedIds.size, store.filteredProblems]);

  // ─── Detail modal ────────────────────────────────────────────────
  const openDetail = useCallback((problem: ProblemBankItem) => {
    setDetailProblem(problem);
    setShowDetailModal(true);
  }, []);

  const closeDetail = useCallback(() => {
    setShowDetailModal(false);
    setDetailProblem(null);
  }, []);

  // ─── Form modal (create / edit) ─────────────────────────────────
  const openCreateForm = useCallback(() => {
    setEditingProblem(undefined);
    setShowFormModal(true);
  }, []);

  const openEditForm = useCallback((problem: ProblemBankItem) => {
    setEditingProblem(problem);
    setShowFormModal(true);
    setShowDetailModal(false);
  }, []);

  const handleFormSave = useCallback(async (data: any) => {
    if (editingProblem) {
      await store.updateProblem(editingProblem.id, {
        ...data,
        sourceType: editingProblem.sourceType,
      });
    } else {
      await store.addProblem({
        ...data,
        sourceType: 'manual' as const,
      });
    }
  }, [editingProblem, store]);

  // ─── Delete ──────────────────────────────────────────────────────
  const handleDeleteSingle = useCallback(async (id: string) => {
    await store.deleteProblem(id);
    closeDetail();
  }, [store]);

  const handleDeleteSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await store.deleteProblem(id);
    }
    exitSelectionMode();
  }, [selectedIds, store]);

  // ─── AI Extract → save to bank ──────────────────────────────────
  const handleExtractComplete = useCallback(async (extracted: ExtractedProblem[]) => {
    setShowPdfModal(false);

    // Convert ExtractedProblem[] to ProblemBankItem-like objects and save
    const newItems = extracted.map((ep) => ({
      content: ep.content,
      answer: ep.answer || '',
      solution: '',
      difficulty: ep.difficulty,
      type: ep.type,
      choices: ep.choices,
      grade: '고1' as const,    // Default; user can edit afterward
      subject: ep.topic,         // Best guess from extraction
      topic: ep.topic,
      tags: [],
      source: 'AI 추출',
      sourceType: 'ai_extracted' as const,
      points: 10,
    }));

    await store.addProblems(newItems);
    await store.fetchProblems();
  }, [store]);

  // ─── Batch add to assignment ─────────────────────────────────────
  const handleAddToAssignment = useCallback(() => {
    const selected = store.problems.filter((p) => selectedIds.has(p.id));
    router.push({
      pathname: '/(teacher)/assignments',
      params: { bankProblems: JSON.stringify(selected) },
    });
    exitSelectionMode();
  }, [selectedIds, store.problems]);

  // ─── FlatList optimization ───────────────────────────────────────
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: PROBLEM_CARD_HEIGHT,
      offset: PROBLEM_CARD_HEIGHT * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ProblemBankItem; index: number }) => (
      <ProblemCard
        problem={item}
        index={index}
        isSelected={selectedIds.has(item.id)}
        selectionMode={selectionMode}
        onPress={openDetail}
        onLongPress={enterSelectionMode}
        onToggleSelect={toggleSelect}
      />
    ),
    [selectedIds, selectionMode, openDetail, enterSelectionMode, toggleSelect]
  );

  const keyExtractor = useCallback((item: ProblemBankItem) => item.id, []);

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
          <Text style={styles.headerTitle}>문제은행</Text>
          {selectionMode && (
            <View style={styles.headerActions}>
              <Button compact mode="text" onPress={handleSelectAll}>
                전체 선택
              </Button>
              <IconButton icon="close" size={20} onPress={exitSelectionMode} />
            </View>
          )}
        </View>
      </View>

      {/* Filters */}
      <ProblemFilters
        filters={store.filters}
        availableTopics={store.topics}
        onFilterChange={store.setFilter}
        onClearAll={store.clearFilters}
        totalCount={store.problems.length}
        filteredCount={store.filteredProblems.length}
      />

      {/* Loading state */}
      {store.isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Empty state */}
      {!store.isLoading && store.filteredProblems.length === 0 && (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="database-off" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>
            {store.problems.length === 0
              ? '문제은행이 비어있습니다'
              : '조건에 맞는 문제가 없습니다'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {store.problems.length === 0
              ? 'FAB 버튼으로 문제를 추가해보세요'
              : '필터 조건을 변경해보세요'}
          </Text>
        </View>
      )}

      {/* Problem list */}
      {!store.isLoading && store.filteredProblems.length > 0 && (
        <FlatList
          data={store.filteredProblems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

      {/* Selection bottom bar */}
      {selectionMode && selectedIds.size > 0 && (
        <View style={styles.bottomBar}>
          <Text style={styles.selectedCount}>
            {selectedIds.size}개 선택됨
          </Text>
          <View style={styles.bottomActions}>
            <Button
              mode="outlined"
              onPress={handleDeleteSelected}
              textColor={colors.error}
              icon="delete"
              compact
            >
              삭제
            </Button>
            <Button
              mode="contained"
              onPress={handleAddToAssignment}
              icon="clipboard-plus"
            >
              숙제에 추가
            </Button>
          </View>
        </View>
      )}

      {/* FAB (hidden during selection mode) */}
      {!selectionMode && (
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'pencil-plus',
              label: '직접 등록',
              onPress: openCreateForm,
            },
            {
              icon: 'file-document-edit',
              label: 'AI 문제 추출',
              onPress: () => {
                setShowPdfModal(true);
                setFabOpen(false);
              },
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          fabStyle={styles.fab}
        />
      )}

      {/* Modals */}
      <ProblemDetailModal
        problem={detailProblem}
        visible={showDetailModal}
        onDismiss={closeDetail}
        onEdit={openEditForm}
        onDelete={handleDeleteSingle}
      />

      <ProblemForm
        visible={showFormModal}
        onDismiss={() => setShowFormModal(false)}
        onSave={handleFormSave}
        initialData={editingProblem}
      />

      <PdfUploadModal
        visible={showPdfModal}
        onDismiss={() => setShowPdfModal(false)}
        onExtractComplete={handleExtractComplete}
      />
    </SafeAreaView>
  );
}

const detailStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 16,
    maxHeight: '90%',
    maxWidth: 600,
    alignSelf: 'center',
    width: '95%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  contentBox: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant + '50',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  choicesBox: {
    marginBottom: spacing.lg,
    paddingLeft: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary + '40',
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  choiceNum: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    width: 24,
  },
  statsBox: {
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant + '40',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metaBox: {
    marginBottom: spacing.lg,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tagChip: {
    backgroundColor: colors.surfaceVariant,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  actionButton: {
    flex: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fab: {
    backgroundColor: colors.primary,
  },
});
```

### Key design decisions

1. **LaTeX rendering strategy**: List cards show `stripLatex()` text summary. The detail modal uses `MathText` for full rendering. This keeps the FlatList fast.
2. **FlatList virtualization**: `getItemLayout` (fixed card height), `initialNumToRender=8`, `maxToRenderPerBatch=10`, `windowSize=5`, `removeClippedSubviews=true`.
3. **FAB.Group** with two actions: "직접 등록" (opens ProblemForm) and "AI 문제 추출" (opens PdfUploadModal). The FAB hides during selection mode to avoid visual clutter.
4. **AI extraction flow**: When extraction completes, the extracted problems are immediately converted and saved to the problem bank via `store.addProblems()`. The grade defaults to '고1' since the Gemini extraction response does not include grade. The teacher can edit each problem afterward.
5. **Selection mode**: Entered by long-pressing a card. Exited by pressing X or deselecting all. Bottom bar shows "숙제에 추가" and "삭제" buttons.
6. **"숙제에 추가" flow**: Navigates to `/(teacher)/assignments` with the selected problems serialized as `bankProblems` query param. The assignments screen must handle this param (see modifications below).

---

## Modifications to Existing Files

### Modification 1: `app/(teacher)/_layout.tsx`

Add the `problem-bank` route as a hidden tab (same pattern as `problem-extract`):

```typescript
// ADD after the existing problem-extract Tabs.Screen:
<Tabs.Screen
  name="problem-bank"
  options={{
    href: null,    // Hidden from tab bar; accessed via Stack navigation
  }}
/>
```

**Full change**: Add the following JSX element inside the `<Tabs>` component, right after the existing `<Tabs.Screen name="problem-extract" .../>`:

```tsx
<Tabs.Screen
  name="problem-bank"
  options={{
    href: null,
  }}
/>
```

### Modification 2: `app/(teacher)/problem-extract.tsx`

Add a "문제은행에 저장" button alongside the existing "숙제 만들기" button.

**Changes**:

1. Add import for `useProblemBankStore`:

```typescript
import { useProblemBankStore } from '../../src/stores/problemBankStore';
```

2. Inside the component function, add the store reference and a save handler:

```typescript
const problemBankStore = useProblemBankStore();

const handleSaveToBank = async () => {
  const selectedProblems = problems.filter((p) => selectedIds.has(p.id));
  const newItems = selectedProblems.map((ep) => ({
    content: ep.content,
    answer: ep.answer || '',
    solution: '',
    difficulty: ep.difficulty,
    type: ep.type,
    choices: ep.choices,
    grade: '고1' as const,     // Default grade; editable later
    subject: ep.topic,
    topic: ep.topic,
    tags: [],
    source: 'AI 추출',
    sourceType: 'ai_extracted' as const,
    points: 10,
  }));
  await problemBankStore.addProblems(newItems);
  // Show success feedback (Alert or Snackbar)
  Alert.alert('저장 완료', `${newItems.length}개 문제가 문제은행에 저장되었습니다.`);
};
```

3. Add `Alert` to the React Native imports:

```typescript
import { View, StyleSheet, FlatList, ScrollView, Alert } from 'react-native';
```

4. Modify the bottom bar (the block that renders when `selectedIds.size > 0`). Replace the existing bottom bar content:

```tsx
{selectedIds.size > 0 && (
  <View style={styles.bottomBar}>
    <Text style={styles.selectedCount}>
      {selectedIds.size}개 문제 선택됨
    </Text>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Button
        mode="outlined"
        onPress={handleSaveToBank}
        icon="database-plus"
      >
        문제은행에 저장
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

### Modification 3: `app/(teacher)/assignments.tsx`

Add the ability to receive problems from the problem bank and open the ProblemSelector modal.

**Changes**:

1. Add imports:

```typescript
import { useLocalSearchParams } from 'expo-router';
import { ProblemBankItem } from '../../src/types/problemBank';
import ProblemSelector from '../../src/components/problemBank/ProblemSelector';
```

2. Inside the component, handle the `bankProblems` param and add the selector modal state:

```typescript
const params = useLocalSearchParams<{ bankProblems?: string }>();
const [showProblemSelector, setShowProblemSelector] = useState(false);

// Handle problems arriving from problem-bank screen
useEffect(() => {
  if (params.bankProblems) {
    try {
      const incoming = JSON.parse(params.bankProblems) as ProblemBankItem[];
      // TODO: Open assignment creation form with these problems pre-filled
      console.log('Received problems from bank:', incoming.length);
    } catch (e) {
      console.error('문제 파싱 오류:', e);
    }
  }
}, [params.bankProblems]);

const handleProblemsSelected = (selected: ProblemBankItem[]) => {
  // TODO: Add selected problems to the current assignment being created/edited
  console.log('Selected from bank:', selected.length);
  setShowProblemSelector(false);
};
```

3. Modify the FAB to add a "문제은행에서 선택" action. Replace the existing `<FAB>` with a `<FAB.Group>`:

```tsx
<FAB.Group
  open={fabOpen}
  visible
  icon={fabOpen ? 'close' : 'plus'}
  actions={[
    {
      icon: 'clipboard-plus',
      label: '새 숙제',
      onPress: () => {
        // TODO: Open new assignment form
      },
    },
    {
      icon: 'database-search',
      label: '문제은행에서 선택',
      onPress: () => {
        setShowProblemSelector(true);
        setFabOpen(false);
      },
    },
  ]}
  onStateChange={({ open }) => setFabOpen(open)}
  fabStyle={styles.fab}
/>
```

4. Add the `ProblemSelector` modal at the end of the returned JSX (before `</SafeAreaView>`):

```tsx
<ProblemSelector
  visible={showProblemSelector}
  onDismiss={() => setShowProblemSelector(false)}
  onConfirm={handleProblemsSelected}
/>
```

5. Add `fabOpen` state and `useEffect` import:

```typescript
const [fabOpen, setFabOpen] = useState(false);
```

### Modification 4: `app/(teacher)/materials.tsx`

After AI extraction, add an option to save to the problem bank instead of only going to problem-extract.

**Changes**:

1. Add imports:

```typescript
import { Alert } from 'react-native';
import { useProblemBankStore } from '../../src/stores/problemBankStore';
```

2. Add store reference:

```typescript
const problemBankStore = useProblemBankStore();
```

3. Modify `handleExtractComplete` to show a choice dialog:

```typescript
const handleExtractComplete = (problems: ExtractedProblem[]) => {
  setPdfModalVisible(false);

  Alert.alert(
    '문제 추출 완료',
    `${problems.length}개 문제가 추출되었습니다. 어떻게 처리하시겠습니까?`,
    [
      {
        text: '문제 확인 / 숙제 만들기',
        onPress: () => {
          router.push({
            pathname: '/(teacher)/problem-extract',
            params: { problems: JSON.stringify(problems) },
          });
        },
      },
      {
        text: '문제은행에 바로 저장',
        onPress: async () => {
          const items = problems.map((ep) => ({
            content: ep.content,
            answer: ep.answer || '',
            solution: '',
            difficulty: ep.difficulty,
            type: ep.type,
            choices: ep.choices,
            grade: '고1' as const,
            subject: ep.topic,
            topic: ep.topic,
            tags: [],
            source: 'AI 추출',
            sourceType: 'ai_extracted' as const,
            points: 10,
          }));
          await problemBankStore.addProblems(items);
          Alert.alert('저장 완료', `${items.length}개 문제가 문제은행에 저장되었습니다.`);
        },
      },
      { text: '취소', style: 'cancel' },
    ]
  );
};
```

---

## Files Summary

### Files to CREATE

| # | Path | Description |
|---|------|-------------|
| 1 | `src/components/problemBank/ProblemCard.tsx` | Memoized problem card with text summary, chips, stats |
| 2 | `src/components/problemBank/ProblemFilters.tsx` | Multi-dimension filter chips + search bar |
| 3 | `src/components/problemBank/ProblemForm.tsx` | Modal form for creating/editing problems |
| 4 | `src/components/problemBank/ProblemSelector.tsx` | Modal for selecting problems to add to assignment |
| 5 | `src/components/problemBank/index.ts` | Barrel exports |
| 6 | `app/(teacher)/problem-bank.tsx` | Main problem bank screen with detail modal |

### Files to MODIFY

| # | Path | What changes |
|---|------|-------------|
| 7 | `app/(teacher)/_layout.tsx` | Add `problem-bank` as hidden Tabs.Screen (`href: null`) |
| 8 | `app/(teacher)/problem-extract.tsx` | Add "문제은행에 저장" button; import store |
| 9 | `app/(teacher)/assignments.tsx` | Handle `bankProblems` param; add FAB.Group with "문제은행에서 선택"; render ProblemSelector modal |
| 10 | `app/(teacher)/materials.tsx` | Show Alert after extraction with choice: view problems vs save to bank |

---

## LaTeX Rendering Strategy

This is a critical performance concern. The existing `MathText` component (`src/components/common/MathText.tsx`) uses:
- **Web**: iframe with KaTeX CDN
- **Native (iOS/Android)**: WebView with KaTeX (but currently disabled on Android, falling back to plain text)

Each `MathText` instance is relatively expensive because it creates an iframe/WebView. In a list of 100+ problems, this would cause severe scroll jank.

**Solution implemented in this section**:

| Context | Rendering method | Why |
|---------|-----------------|-----|
| Problem list (FlatList cards) | `stripLatex()` plain text, 80 chars max | Performance: no WebView per card |
| Problem detail modal | Full `MathText` component | Only 1 instance at a time |
| Problem form preview | `MathText` behind a toggle | User opt-in, only when composing |
| ProblemSelector modal | Same as list: plain text | Same performance rationale |

The `stripLatex()` function removes `$...$` wrappers, replaces `\frac{a}{b}` with `a/b`, removes `\command` sequences, and strips braces. The result is readable but imperfect (e.g. `$\sqrt{2}$` becomes `sqrt(2)`). This is acceptable because the user can tap any card to see the full LaTeX rendering in the detail modal.

---

## FlatList Virtualization Configuration

Both the main screen and the ProblemSelector use the same virtualization settings:

```typescript
<FlatList
  data={problems}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  getItemLayout={getItemLayout}           // Fixed height = PROBLEM_CARD_HEIGHT
  initialNumToRender={8}                  // Render 8 cards initially (fills most tablets)
  maxToRenderPerBatch={10}                // Render 10 cards per frame during scroll
  windowSize={5}                          // Keep 5 viewport-heights of items in memory
  removeClippedSubviews={true}            // Detach off-screen views (Android perf)
/>
```

The fixed card height (`CARD_HEIGHT = 120` + `spacing.sm` margin) enables `getItemLayout`, which means React Native never needs to measure card heights dynamically. This is the single most important optimization for lists with 100+ items.

---

## Multi-Filter Chip Behavior

The filter system follows these rules:

1. **Within a dimension** (e.g., grade): multiple selections are OR'd.
   - Selecting "중1" and "중2" shows problems from either grade.
2. **Across dimensions**: selections are AND'd.
   - Selecting grade="중1" AND difficulty="상" shows only hard problems for grade 중1.
3. **Empty selection** in a dimension means "no filter" (show all).
   - If no grades are selected, all grades are shown.
4. **Topic chips are dynamic**: when exactly one grade is selected, the topic chips update to show only topics relevant to that grade (from `curriculum.ts`). When zero or multiple grades are selected, all topics from the current problem set are shown.
5. **Search query** filters across `content`, `topic`, `tags[]`, and `source` fields (case-insensitive substring match).
6. **"필터 초기화" button** appears whenever any filter is active and clears all filters.

---

## FAB (Floating Action Button) Behavior

The FAB on the problem bank screen uses `FAB.Group` (expandable FAB from react-native-paper) with two actions:

| Icon | Label | Action |
|------|-------|--------|
| `pencil-plus` | 직접 등록 | Opens `ProblemForm` modal in create mode |
| `file-document-edit` | AI 문제 추출 | Opens existing `PdfUploadModal`, extracted problems saved directly to bank |

The FAB is hidden when the user is in selection mode (to avoid visual conflict with the bottom action bar).

---

## Batch Select → Add to Assignment Flow

The complete flow for adding problems from the bank to an assignment:

```
1. Teacher opens problem-bank.tsx
2. Long-presses a card → enters selection mode
3. Taps additional cards to select them
4. Presses "숙제에 추가" in the bottom bar
5. router.push('/(teacher)/assignments', { bankProblems: JSON.stringify(selected) })
6. assignments.tsx receives bankProblems param
7. assignments.tsx shows assignment creation form with pre-filled problems
```

Alternatively, from the assignments screen:

```
1. Teacher is in assignments.tsx
2. Taps FAB → "문제은행에서 선택"
3. ProblemSelector modal opens
4. Teacher filters, searches, selects problems
5. Presses "숙제에 추가"
6. ProblemSelector calls onConfirm(selectedProblems)
7. assignments.tsx receives selected problems and adds them to current assignment
```

---

## Acceptance Criteria

Complete implementation is verified when ALL of the following are true:

### Components
- [ ] `ProblemCard` renders problem summary as plain text (no WebView/iframe in list)
- [ ] `ProblemCard` shows difficulty chip with correct color (상=red, 중=orange, 하=green)
- [ ] `ProblemCard` shows type chip with correct color (객관식=blue, 서술형=orange, 단답형=green)
- [ ] `ProblemCard` shows topic chip, grade badge, usage count, and correct rate
- [ ] `ProblemCard` supports selection mode: long-press enters, tap toggles, checkbox visible
- [ ] `ProblemCard` is wrapped in `React.memo` with custom comparator
- [ ] `ProblemFilters` renders search bar and 4 chip rows (grade, difficulty, type, topic)
- [ ] `ProblemFilters` supports multi-select within each dimension
- [ ] `ProblemFilters` dynamically updates topic chips when grade changes
- [ ] `ProblemFilters` shows "N개 / 전체 M개" count and "필터 초기화" button
- [ ] `ProblemForm` opens as a modal with all fields (content, answer, solution, difficulty, type, choices, grade, subject, topic, tags, source, points)
- [ ] `ProblemForm` shows cascading grade -> subject -> topic selectors from curriculum.ts
- [ ] `ProblemForm` has LaTeX preview toggle using MathText
- [ ] `ProblemForm` works in both create and edit modes
- [ ] `ProblemForm` validates required fields (content, grade, subject, topic)
- [ ] `ProblemSelector` opens as a modal with filters and forced selection mode
- [ ] `ProblemSelector` excludes problems already in the assignment via `excludeIds`
- [ ] `ProblemSelector` has "전체 선택" and confirm button with count

### Screen
- [ ] `problem-bank.tsx` loads problems from `useProblemBankStore` on mount
- [ ] `problem-bank.tsx` renders ProblemFilters at the top
- [ ] `problem-bank.tsx` renders FlatList with virtualization (getItemLayout, initialNumToRender, etc.)
- [ ] `problem-bank.tsx` shows empty state when no problems / no filter matches
- [ ] `problem-bank.tsx` shows loading spinner during data fetch
- [ ] `problem-bank.tsx` has FAB.Group with "직접 등록" and "AI 문제 추출"
- [ ] `problem-bank.tsx` FAB "직접 등록" opens ProblemForm in create mode
- [ ] `problem-bank.tsx` FAB "AI 문제 추출" opens PdfUploadModal; extracted problems saved to bank
- [ ] `problem-bank.tsx` long-press card enters selection mode
- [ ] `problem-bank.tsx` selection mode shows bottom bar with "숙제에 추가" and "삭제"
- [ ] `problem-bank.tsx` "숙제에 추가" navigates to assignments with selected problems
- [ ] `problem-bank.tsx` tapping a card (non-selection mode) opens detail modal
- [ ] Detail modal renders full LaTeX via MathText (content, choices, answer, solution)
- [ ] Detail modal shows stats (정답률, 사용 횟수, 배점)
- [ ] Detail modal has "수정" and "삭제" buttons
- [ ] "수정" opens ProblemForm in edit mode with pre-filled data

### Integration
- [ ] `_layout.tsx` includes `problem-bank` as hidden tab route
- [ ] `problem-extract.tsx` has new "문제은행에 저장" button in the bottom bar
- [ ] `problem-extract.tsx` saves selected extracted problems to problemBankStore
- [ ] `assignments.tsx` handles `bankProblems` param from problem-bank navigation
- [ ] `assignments.tsx` FAB has "문제은행에서 선택" action opening ProblemSelector
- [ ] `assignments.tsx` renders ProblemSelector modal
- [ ] `materials.tsx` shows Alert after extraction: "문제 확인" vs "문제은행에 바로 저장"
- [ ] `materials.tsx` "문제은행에 바로 저장" saves all extracted problems to bank

### Performance
- [ ] FlatList scrolls smoothly with 100+ problems (no LaTeX WebViews in cards)
- [ ] `ProblemCard` does not re-render when sibling cards change (memo works)
- [ ] `getItemLayout` is used with correct fixed height matching `PROBLEM_CARD_HEIGHT`
- [ ] `removeClippedSubviews={true}` is set on the FlatList
