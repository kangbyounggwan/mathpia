// src/components/wrongNote/WrongNoteFilters.tsx

import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';
import type { WrongNoteStatus } from '../../types/wrongNote';

// ---- Filter types ----
export type FilterStatus = 'all' | WrongNoteStatus;

// ---- Filter label map ----
const FILTER_LABELS: Record<FilterStatus, string> = {
  all: '전체',
  unreviewed: '미복습',
  reviewing: '복습중',
  mastered: '숙련',
};

// ---- Filter color map ----
const FILTER_COLORS: Record<FilterStatus, string> = {
  all: colors.primary,
  unreviewed: colors.error,
  reviewing: colors.warning,
  mastered: colors.success,
};

// ---- Topic item type ----
export interface TopicItem {
  topic: string;
  count: number;
}

// ---- View tab ----
export type ViewTab = 'date' | 'topic';

interface WrongNoteFiltersProps {
  /** Currently active view tab */
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;

  /** Status filter */
  filterStatus: FilterStatus;
  onFilterStatusChange: (status: FilterStatus) => void;

  /** Topic filter (only used in topic tab) */
  topics: TopicItem[];
  selectedTopic: string | null;
  onTopicChange: (topic: string | null) => void;
}

export default function WrongNoteFilters({
  activeTab,
  onTabChange,
  filterStatus,
  onFilterStatusChange,
  topics,
  selectedTopic,
  onTopicChange,
}: WrongNoteFiltersProps) {
  return (
    <View style={styles.container}>
      {/* Tab Bar: Date / Topic */}
      <View style={styles.tabBar}>
        <View
          style={[styles.tab, activeTab === 'date' && styles.tabActive]}
        >
          <Chip
            selected={activeTab === 'date'}
            onPress={() => {
              onTabChange('date');
              onTopicChange(null);
            }}
            icon={() => (
              <MaterialCommunityIcons
                name="calendar"
                size={16}
                color={activeTab === 'date' ? colors.primary : colors.textSecondary}
              />
            )}
            style={[
              styles.tabChip,
              activeTab === 'date' && styles.tabChipActive,
            ]}
            textStyle={[
              styles.tabText,
              activeTab === 'date' && styles.tabTextActive,
            ]}
            showSelectedCheck={false}
          >
            날짜별
          </Chip>
        </View>

        <View
          style={[styles.tab, activeTab === 'topic' && styles.tabActive]}
        >
          <Chip
            selected={activeTab === 'topic'}
            onPress={() => onTabChange('topic')}
            icon={() => (
              <MaterialCommunityIcons
                name="tag-multiple"
                size={16}
                color={activeTab === 'topic' ? colors.primary : colors.textSecondary}
              />
            )}
            style={[
              styles.tabChip,
              activeTab === 'topic' && styles.tabChipActive,
            ]}
            textStyle={[
              styles.tabText,
              activeTab === 'topic' && styles.tabTextActive,
            ]}
            showSelectedCheck={false}
          >
            단원별
          </Chip>
        </View>
      </View>

      {/* Topic Chips (only in topic tab) */}
      {activeTab === 'topic' && topics.length > 0 && (
        <View style={styles.topicChipsContainer}>
          <FlatList
            horizontal
            data={topics}
            keyExtractor={(item) => item.topic}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicChipsList}
            renderItem={({ item }) => (
              <Chip
                selected={selectedTopic === item.topic}
                onPress={() =>
                  onTopicChange(
                    selectedTopic === item.topic ? null : item.topic
                  )
                }
                style={[
                  styles.topicChip,
                  selectedTopic === item.topic && styles.topicChipSelected,
                ]}
                showSelectedCheck={false}
              >
                {item.topic} ({item.count})
              </Chip>
            )}
          />
        </View>
      )}

      {/* Filter Chips: Status */}
      <View style={styles.filterContainer}>
        {(Object.keys(FILTER_LABELS) as FilterStatus[]).map((status) => (
          <Chip
            key={status}
            selected={filterStatus === status}
            onPress={() => onFilterStatusChange(status)}
            style={[
              styles.filterChip,
              filterStatus === status && {
                backgroundColor: FILTER_COLORS[status] + '18',
                borderColor: FILTER_COLORS[status],
              },
            ]}
            textStyle={[
              styles.filterChipText,
              filterStatus === status && {
                color: FILTER_COLORS[status],
                fontWeight: '600',
              },
            ]}
            showSelectedCheck={false}
          >
            {FILTER_LABELS[status]}
          </Chip>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabChip: {
    backgroundColor: 'transparent',
  },
  tabChipActive: {
    backgroundColor: colors.primary + '10',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Topic chips
  topicChipsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topicChipsList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  topicChip: {
    marginRight: spacing.xs,
  },
  topicChipSelected: {
    backgroundColor: colors.primary + '18',
  },

  // Filter
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  filterChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
