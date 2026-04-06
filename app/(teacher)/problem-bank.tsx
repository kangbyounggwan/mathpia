import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Text,
  FAB,
  IconButton,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  colors, spacing, typography, roleColors, shadows, borderRadius,
} from '../../src/constants/theme';
import { EmptyState, SkeletonLoader } from '../../src/components/common';
import type { ProblemBankItem, Grade } from '../../src/types';
import { useProblemBankStore } from '../../src/stores/problemBankStore';
import {
  ProblemCard,
  PROBLEM_CARD_HEIGHT,
  ProblemFilters,
  ProblemForm,
  ProblemDetail,
} from '../../src/components/problemBank';
import type { ProblemFormData } from '../../src/components/problemBank/ProblemForm';
import PdfUploadModal from '../../src/components/teacher/PdfUploadModal';
import type { ExtractedProblem } from '../../src/services/geminiService';

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function ProblemBankScreen() {
  const store = useProblemBankStore();

  // Local UI state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [detailProblem, setDetailProblem] = useState<ProblemBankItem | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProblem, setEditingProblem] = useState<
    ProblemBankItem | undefined
  >(undefined);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    store.fetchProblems();
  }, []);

  // Re-apply filters when they change
  useEffect(() => {
    store.applyFilters();
  }, [store.filters]);

  // ─── Selection handlers ──────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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
  }, [selectedIds.size, store.filteredProblems, exitSelectionMode]);

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

  const handleFormSave = useCallback(
    async (data: ProblemFormData) => {
      if (editingProblem) {
        await store.updateProblem(editingProblem.id, {
          ...data,
          imageUrls: editingProblem.imageUrls,
          tags: data.tags,
          choices: data.choices,
          sourceType: editingProblem.sourceType,
        });
      } else {
        await store.createProblem({
          ...data,
          imageUrls: [],
          tags: data.tags,
          choices: data.choices,
          sourceType: 'manual' as const,
          academyId: '',
          createdBy: '',
        });
      }
    },
    [editingProblem, store],
  );

  // ─── Delete ──────────────────────────────────────────────────────
  const handleDeleteSingle = useCallback(
    async (id: string) => {
      await store.deleteProblem(id);
      closeDetail();
    },
    [store, closeDetail],
  );

  const handleDeleteSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await store.deleteProblem(id);
    }
    exitSelectionMode();
  }, [selectedIds, store, exitSelectionMode]);

  // ─── AI Extract -> save to bank ──────────────────────────────────
  const handleExtractComplete = useCallback(
    async (extracted: ExtractedProblem[]) => {
      setShowPdfModal(false);

      const newItems = extracted.map((ep) => ({
        content: ep.content,
        answer: ep.answer || '',
        solution: '',
        difficulty: ep.difficulty,
        type: ep.type,
        choices: ep.choices || null,
        grade: '\uace0\u0031' as Grade,
        subject: ep.topic,
        topic: ep.topic,
        tags: [] as string[],
        source: 'AI \u{cd94}\u{cd9c}',
        sourceType: 'ai_extracted' as const,
        points: 10,
        imageUrls: [] as string[],
        academyId: '',
        createdBy: '',
      }));

      await store.bulkCreateProblems(newItems);
      await store.fetchProblems();
    },
    [store],
  );

  // ─── Batch add to assignment ─────────────────────────────────────
  const handleAddToAssignment = useCallback(() => {
    const selected = store.problems.filter((p) => selectedIds.has(p.id));
    router.push({
      pathname: '/(teacher)/assignments',
      params: { bankProblems: JSON.stringify(selected) },
    });
    exitSelectionMode();
  }, [selectedIds, store.problems, exitSelectionMode]);

  // ─── FlatList optimization ───────────────────────────────────────
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: PROBLEM_CARD_HEIGHT,
      offset: PROBLEM_CARD_HEIGHT * index,
      index,
    }),
    [],
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
    [selectedIds, selectionMode, openDetail, enterSelectionMode, toggleSelect],
  );

  const keyExtractor = useCallback(
    (item: ProblemBankItem) => item.id,
    [],
  );

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>
            {'\u{bb38}\u{c81c}\u{c740}\u{d589}'}
          </Text>
          {selectionMode && (
            <View style={styles.headerActions}>
              <Button compact mode="text" onPress={handleSelectAll}>
                {'\u{c804}\u{ccb4} \u{c120}\u{d0dd}'}
              </Button>
              <IconButton
                icon="close"
                size={20}
                onPress={exitSelectionMode}
              />
            </View>
          )}
        </View>
      </View>

      {/* Filters */}
      <ProblemFilters
        filters={store.filters}
        onFilterChange={store.setFilters}
        onClearAll={store.clearFilters}
        totalCount={store.problems.length}
        filteredCount={store.filteredProblems.length}
      />

      {/* Loading state */}
      {store.isLoading && (
        <View style={styles.loadingOverlay}>
          <SkeletonLoader variant="card" height={120} count={4} gap={spacing.md} />
        </View>
      )}

      {/* Empty state */}
      {!store.isLoading && store.filteredProblems.length === 0 && (
        <EmptyState
          icon="database-off-outline"
          title={store.problems.length === 0 ? '문제가 없습니다' : '조건에 맞는 문제가 없습니다'}
          description={
            store.problems.length === 0
              ? '문제를 추가하여 문제은행을 만드세요'
              : '필터 조건을 변경해보세요'
          }
          actionLabel={store.problems.length === 0 ? '문제 추가' : undefined}
          onAction={store.problems.length === 0 ? openCreateForm : undefined}
        />
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
            {selectedIds.size}
            {'\u{ac1c} \u{c120}\u{d0dd}\u{b428}'}
          </Text>
          <View style={styles.bottomActions}>
            <Button
              mode="outlined"
              onPress={handleDeleteSelected}
              textColor={colors.error}
              icon="delete"
              compact
            >
              {'\u{c0ad}\u{c81c}'}
            </Button>
            <Button
              mode="contained"
              onPress={handleAddToAssignment}
              icon="clipboard-plus"
            >
              {'\u{c219}\u{c81c}\u{c5d0} \u{cd94}\u{ac00}'}
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
              label: '\u{c9c1}\u{c811} \u{b4f1}\u{b85d}',
              onPress: openCreateForm,
            },
            {
              icon: 'file-document-edit',
              label: 'AI \u{bb38}\u{c81c} \u{cd94}\u{cd9c}',
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
      <ProblemDetail
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

// ─── Styles ──────────────────────────────────────────────────

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
    ...typography.heading3,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingOverlay: {
    flex: 1,
    padding: spacing.md,
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
    ...shadows.lg,
  },
  selectedCount: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fab: {
    backgroundColor: roleColors.teacher.accent,
  },
});
