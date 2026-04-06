import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Portal, Modal, Button, IconButton } from 'react-native-paper';
import { colors, spacing } from '../../constants/theme';
import type { ProblemBankItem } from '../../types';
import { useProblemBankStore } from '../../stores/problemBankStore';
import { ProblemCard, PROBLEM_CARD_HEIGHT } from './ProblemCard';
import ProblemFilters from './ProblemFilters';

// ─── Props ───────────────────────────────────────────────────

interface ProblemSelectorProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (selectedProblems: ProblemBankItem[]) => void;
  excludeIds?: string[];
}

// ─── Component ───────────────────────────────────────────────

export default function ProblemSelector({
  visible,
  onDismiss,
  onConfirm,
  excludeIds = [],
}: ProblemSelectorProps) {
  const {
    filteredProblems,
    filters,
    isLoading,
    fetchProblems,
    setFilters,
    clearFilters,
    applyFilters,
    problems,
  } = useProblemBankStore();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load data when modal opens
  useEffect(() => {
    if (visible) {
      fetchProblems();
      setSelectedIds(new Set());
      clearFilters();
    }
  }, [visible, fetchProblems, clearFilters]);

  // Re-apply filters whenever they change
  useEffect(() => {
    if (visible) {
      applyFilters();
    }
  }, [filters, visible, applyFilters]);

  // Exclude problems already in the assignment
  const availableProblems = filteredProblems.filter(
    (p) => !excludeIds.includes(p.id),
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
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ProblemBankItem; index: number }) => (
      <ProblemCard
        problem={item}
        index={index}
        isSelected={selectedIds.has(item.id)}
        selectionMode={true}
        onPress={() => toggleSelect(item.id)}
        onLongPress={() => toggleSelect(item.id)}
        onToggleSelect={toggleSelect}
      />
    ),
    [selectedIds, toggleSelect],
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
          <Text style={styles.title}>
            {'\u{bb38}\u{c81c} \u{c120}\u{d0dd}'}
          </Text>
          <View style={styles.headerRight}>
            <Button compact mode="text" onPress={handleSelectAll}>
              {selectedIds.size === availableProblems.length
                ? '\u{c120}\u{d0dd} \u{d574}\u{c81c}'
                : '\u{c804}\u{ccb4} \u{c120}\u{d0dd}'}
            </Button>
            <IconButton icon="close" onPress={onDismiss} accessibilityLabel="닫기" />
          </View>
        </View>

        {/* Filters */}
        <ProblemFilters
          filters={filters}
          onFilterChange={setFilters}
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
            {selectedIds.size}
            {'\u{ac1c} \u{c120}\u{d0dd}\u{b428}'}
          </Text>
          <Button
            mode="contained"
            onPress={handleConfirm}
            disabled={selectedIds.size === 0}
            icon="plus"
          >
            {'\u{c219}\u{c81c}\u{c5d0} \u{cd94}\u{ac00}'}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

// ─── Styles ──────────────────────────────────────────────────

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
