// app/(student)/wrong-notes.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  WrongNoteCard,
  ReviewMode,
  WrongNoteStats,
  WrongNoteFilters,
} from '../../src/components/wrongNote';
import type { FilterStatus, ViewTab, TopicItem } from '../../src/components/wrongNote';
import { colors, spacing, borderRadius, typography, shadows, opacity, opacityToHex } from '../../src/constants/theme';
import { EmptyState, SkeletonLoader } from '../../src/components/common';
import { useAuthStore } from '../../src/stores/authStore';
import { useWrongNoteStore } from '../../src/stores/wrongNoteStore';
import type { WrongNote, ReviewAttempt } from '../../src/types/wrongNote';

export default function WrongNotesScreen() {
  const { user } = useAuthStore();
  const {
    wrongNotes,
    stats,
    isLoading,
    fetchByStudent,
    fetchStats,
    recordReview,
  } = useWrongNoteStore();

  const [activeTab, setActiveTab] = useState<ViewTab>('date');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // ---- Load data on mount ----
  useEffect(() => {
    if (user?.id) {
      fetchByStudent(user.id);
      fetchStats(user.id);
    }
  }, [user?.id, fetchByStudent, fetchStats]);

  // ---- Pull to refresh ----
  const handleRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await Promise.all([fetchByStudent(user.id), fetchStats(user.id)]);
    setRefreshing(false);
  }, [user?.id, fetchByStudent, fetchStats]);

  // ---- Filter wrong notes ----
  const filteredNotes = useMemo(() => {
    let notes = [...wrongNotes];

    // Apply status filter
    if (filterStatus !== 'all') {
      notes = notes.filter((n) => n.status === filterStatus);
    }

    // Apply topic filter (when in topic tab and a topic is selected)
    if (activeTab === 'topic' && selectedTopic) {
      notes = notes.filter((n) => n.problem.topic === selectedTopic);
    }

    // Sort: by date in date tab, by topic in topic tab
    if (activeTab === 'date') {
      notes.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      notes.sort((a, b) => a.problem.topic.localeCompare(b.problem.topic));
    }

    return notes;
  }, [wrongNotes, filterStatus, activeTab, selectedTopic]);

  // ---- Get unique topics for topic tab ----
  const topics = useMemo<TopicItem[]>(() => {
    const topicMap = new Map<string, number>();
    wrongNotes.forEach((n) => {
      topicMap.set(n.problem.topic, (topicMap.get(n.problem.topic) || 0) + 1);
    });
    return Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([topic, count]) => ({ topic, count }));
  }, [wrongNotes]);

  // ---- Notes for review mode (only not-learned) ----
  const reviewableNotes = useMemo(() => {
    return filteredNotes.filter((n) => !n.isLearned && n.status !== 'mastered');
  }, [filteredNotes]);

  // ---- Mastery progress ----
  const masteredCount = wrongNotes.filter((n) => n.status === 'mastered').length;
  const masteryRate = wrongNotes.length > 0 ? masteredCount / wrongNotes.length : 0;

  // ---- Handle review submission ----
  const handleSubmitReview = useCallback(
    async (attempt: ReviewAttempt) => {
      await recordReview(attempt);
      // Refresh stats after each review
      if (user?.id) {
        fetchStats(user.id);
      }
    },
    [recordReview, user?.id, fetchStats]
  );

  // ---- Handle review mode close ----
  const handleCloseReview = useCallback(() => {
    setIsReviewMode(false);
    // Refresh data after review session
    if (user?.id) {
      fetchByStudent(user.id);
      fetchStats(user.id);
    }
  }, [user?.id, fetchByStudent, fetchStats]);

  // ---- Handle card press (future: detail modal) ----
  const handleCardPress = useCallback((_note: WrongNote) => {
    // In a future enhancement, open a detail modal.
  }, []);

  // ==== REVIEW MODE (full-screen overlay) ====
  if (isReviewMode) {
    return (
      <SafeAreaView style={styles.container}>
        <ReviewMode
          wrongNotes={reviewableNotes}
          onSubmitReview={handleSubmitReview}
          onClose={handleCloseReview}
        />
      </SafeAreaView>
    );
  }

  // ==== MAIN SCREEN ====
  return (
    <SafeAreaView style={styles.container}>
      {/* Stats Summary */}
      <WrongNoteStats stats={stats} />

      {/* Filters: Tabs + Topic Chips + Status Chips */}
      <WrongNoteFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        topics={topics}
        selectedTopic={selectedTopic}
        onTopicChange={setSelectedTopic}
      />

      {/* Mastery Progress Bar */}
      {wrongNotes.length > 0 && (
        <View style={styles.masteryContainer}>
          <View style={styles.masteryHeader}>
            <Text style={styles.masteryLabel}>전체 숙달도</Text>
            <Text style={styles.masteryValue}>{Math.round(masteryRate * 100)}%</Text>
          </View>
          <ProgressBar
            progress={masteryRate}
            color={colors.success}
            style={styles.masteryBar}
          />
          <Text style={styles.masterySubtext}>
            {masteredCount}/{wrongNotes.length}개 숙달 완료
          </Text>
        </View>
      )}

      {/* Wrong Notes List */}
      {isLoading && wrongNotes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <SkeletonLoader variant="listItem" count={5} gap={spacing.sm} />
        </View>
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          icon={wrongNotes.length === 0 ? 'notebook-check-outline' : 'filter-off-outline'}
          title={wrongNotes.length === 0
            ? '오답이 없습니다!'
            : '필터 조건에 맞는 오답이 없습니다'}
          description={wrongNotes.length === 0
            ? '잘하고 있어요! 틀린 문제가 생기면 자동으로 수집됩니다'
            : '다른 필터를 선택해보세요'}
        />
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WrongNoteCard
              wrongNote={item}
              onPress={handleCardPress}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Start Review FAB */}
      {reviewableNotes.length > 0 && (
        <TouchableOpacity
          style={styles.startReviewFab}
          onPress={() => setIsReviewMode(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="play-circle" size={24} color="#FFFFFF" />
          <Text style={styles.startReviewText}>
            복습 시작 ({reviewableNotes.length})
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Mastery progress
  masteryContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  masteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  masteryLabel: {
    ...typography.label,
    color: colors.textPrimary,
  },
  masteryValue: {
    ...typography.label,
    fontWeight: '700',
    color: colors.success,
  },
  masteryBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceVariant,
  },
  masterySubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    padding: spacing.md,
  },

  // List
  listContent: {
    padding: spacing.md,
    paddingBottom: 100, // space for FAB
  },

  // Start Review FAB
  startReviewFab: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
  },
  startReviewText: {
    ...typography.subtitle,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
