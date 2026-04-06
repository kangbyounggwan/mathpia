import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Chip, Searchbar, Button } from 'react-native-paper';
import { colors, spacing } from '../../constants/theme';
import { getSubjectsByGrade, getAllGrades } from '../../constants/curriculum';
import type { Grade, Difficulty, ProblemType } from '../../types';
import type { ProblemFilters as ProblemFiltersType } from '../../stores/problemBankStore';

const ALL_GRADES: Grade[] = getAllGrades();
const ALL_DIFFICULTIES: Difficulty[] = ['\u{c0c1}', '\u{c911}', '\u{d558}'];
const ALL_TYPES: ProblemType[] = [
  '\u{ac1d}\u{ad00}\u{c2dd}',
  '\u{c11c}\u{c220}\u{d615}',
  '\u{b2e8}\u{b2f5}\u{d615}',
];

const getDifficultyColor = (d: Difficulty): string => {
  switch (d) {
    case '\u{c0c1}':
      return colors.error;
    case '\u{c911}':
      return colors.warning;
    case '\u{d558}':
      return colors.success;
  }
};

// ─── Props ───────────────────────────────────────────────────
interface ProblemFiltersProps {
  filters: ProblemFiltersType;
  onFilterChange: (filters: Partial<ProblemFiltersType>) => void;
  onClearAll: () => void;
  totalCount: number;
  filteredCount: number;
}

// ─── Component ───────────────────────────────────────────────
export default function ProblemFilters({
  filters,
  onFilterChange,
  onClearAll,
  totalCount,
  filteredCount,
}: ProblemFiltersProps) {
  const hasActiveFilters =
    !!filters.grade ||
    !!filters.difficulty ||
    !!filters.type ||
    !!filters.subjectId ||
    !!filters.chapter ||
    !!(filters.searchQuery && filters.searchQuery.trim());

  // Dynamic subjects & chapters based on selected grade
  const subjects = useMemo(
    () => (filters.grade ? getSubjectsByGrade(filters.grade) : []),
    [filters.grade],
  );

  const chapters = useMemo(() => {
    if (!filters.subjectId) return [];
    const found = subjects.find((s) => s.name === filters.subjectId);
    return found?.chapters || [];
  }, [subjects, filters.subjectId]);

  const handleGradeSelect = useCallback(
    (grade: Grade) => {
      if (filters.grade === grade) {
        // Deselect
        onFilterChange({ grade: undefined, subjectId: undefined, chapter: undefined });
      } else {
        onFilterChange({ grade, subjectId: undefined, chapter: undefined });
      }
    },
    [filters.grade, onFilterChange],
  );

  const handleDifficultySelect = useCallback(
    (diff: Difficulty) => {
      onFilterChange({
        difficulty: filters.difficulty === diff ? undefined : diff,
      });
    },
    [filters.difficulty, onFilterChange],
  );

  const handleTypeSelect = useCallback(
    (type: ProblemType) => {
      onFilterChange({
        type: filters.type === type ? undefined : type,
      });
    },
    [filters.type, onFilterChange],
  );

  const handleSubjectSelect = useCallback(
    (subjectName: string) => {
      if (filters.subjectId === subjectName) {
        onFilterChange({ subjectId: undefined, chapter: undefined });
      } else {
        onFilterChange({ subjectId: subjectName, chapter: undefined });
      }
    },
    [filters.subjectId, onFilterChange],
  );

  const handleChapterSelect = useCallback(
    (chapter: string) => {
      onFilterChange({
        chapter: filters.chapter === chapter ? undefined : chapter,
      });
    },
    [filters.chapter, onFilterChange],
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <Searchbar
        placeholder={'\u{bb38}\u{c81c} \u{ac80}\u{c0c9} (\u{b0b4}\u{c6a9}, \u{b2e8}\u{c6d0}, \u{d0dc}\u{adf8}...)'}
        value={filters.searchQuery || ''}
        onChangeText={(text) => onFilterChange({ searchQuery: text })}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
        elevation={0}
      />

      {/* Filter result count + clear button */}
      <View style={styles.resultRow}>
        <Text style={styles.resultText}>
          {hasActiveFilters
            ? `${filteredCount}\u{ac1c} / \u{c804}\u{ccb4} ${totalCount}\u{ac1c}`
            : `\u{c804}\u{ccb4} ${totalCount}\u{ac1c}`}
        </Text>
        {hasActiveFilters && (
          <Button compact mode="text" onPress={onClearAll} textColor={colors.error}>
            {'\u{d544}\u{d130} \u{cd08}\u{ae30}\u{d654}'}
          </Button>
        )}
      </View>

      {/* Grade chips */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>{'\u{d559}\u{b144}'}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
        >
          {ALL_GRADES.map((grade) => (
            <Chip
              key={grade}
              selected={filters.grade === grade}
              onPress={() => handleGradeSelect(grade)}
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
        <Text style={styles.filterLabel}>{'\u{b09c}\u{c774}\u{b3c4}'}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
        >
          {ALL_DIFFICULTIES.map((diff) => (
            <Chip
              key={diff}
              selected={filters.difficulty === diff}
              onPress={() => handleDifficultySelect(diff)}
              style={[
                styles.filterChip,
                filters.difficulty === diff && {
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
        <Text style={styles.filterLabel}>{'\u{c720}\u{d615}'}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
        >
          {ALL_TYPES.map((type) => (
            <Chip
              key={type}
              selected={filters.type === type}
              onPress={() => handleTypeSelect(type)}
              style={styles.filterChip}
              showSelectedCheck={false}
              selectedColor={colors.primary}
            >
              {type}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Subject chips (dynamic, only shown when grade is selected) */}
      {subjects.length > 0 && (
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>{'\u{acfc}\u{baa9}'}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {subjects.map((s) => (
              <Chip
                key={s.id}
                selected={filters.subjectId === s.name}
                onPress={() => handleSubjectSelect(s.name)}
                style={styles.filterChip}
                showSelectedCheck={false}
                selectedColor={colors.secondary}
              >
                {s.name}
              </Chip>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Chapter chips (dynamic, only shown when subject is selected) */}
      {chapters.length > 0 && (
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>{'\u{b2e8}\u{c6d0}'}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {chapters.map((ch) => (
              <Chip
                key={ch}
                selected={filters.chapter === ch}
                onPress={() => handleChapterSelect(ch)}
                style={styles.filterChip}
                showSelectedCheck={false}
                selectedColor={colors.secondary}
              >
                {ch}
              </Chip>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────

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
    minHeight: 44,
  },
});
