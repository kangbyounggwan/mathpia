// ============================================================
// src/components/parent/ScheduleCalendar.tsx
// Weekly class schedule calendar view
// ============================================================

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  opacity,
  opacityToHex,
} from '../../constants/theme';

interface ClassSchedule {
  id: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // "16:00"
  endTime: string;   // "17:30"
  subject: string;
  teacherName: string;
  location?: string;
}

interface ScheduleCalendarProps {
  classes: ClassSchedule[];
  currentDate?: Date;
  accentColor?: string;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  classes,
  currentDate = new Date(),
  accentColor,
}) => {
  const accent = accentColor ?? colors.primary;
  const accentLight = accentColor ?? colors.primaryLight;

  // Calculate week dates starting from Monday
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date(currentDate);
    const dayOfWeek = today.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + mondayOffset + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate]);

  // Day order: Mon-Sun (1,2,3,4,5,6,0)
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="calendar-week"
          size={20}
          color={accent}
        />
        <Text style={styles.headerTitle}>주간 수업 시간표</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.calendarGrid}>
          {/* Day headers */}
          <View style={styles.dayHeaderRow}>
            {dayOrder.map((dayIdx) => {
              const date = weekDates[dayIdx === 0 ? 6 : dayIdx - 1];
              const todayFlag = isToday(date);
              return (
                <View
                  key={dayIdx}
                  style={[
                    styles.dayHeaderCell,
                    todayFlag && [
                      styles.dayHeaderCellToday,
                      { backgroundColor: accent + opacityToHex(opacity.subtle) },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      dayIdx === 0 && styles.dayLabelSunday,
                      dayIdx === 6 && { color: accent },
                      todayFlag && { color: accent, fontWeight: '700' },
                    ]}
                  >
                    {DAY_LABELS[dayIdx]}
                  </Text>
                  <Text
                    style={[
                      styles.dateLabel,
                      todayFlag && { color: accent, fontWeight: '700' },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Class cells */}
          <View style={styles.classRow}>
            {dayOrder.map((dayIdx) => {
              const dayClasses = classes
                .filter((c) => c.dayOfWeek === dayIdx)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <View key={dayIdx} style={styles.dayCell}>
                  {dayClasses.length === 0 ? (
                    <View style={styles.emptyCell}>
                      <Text style={styles.emptyCellText}>-</Text>
                    </View>
                  ) : (
                    dayClasses.map((cls) => (
                      <View
                        key={cls.id}
                        style={[
                          styles.classCard,
                          {
                            backgroundColor: accentLight + opacityToHex(opacity.muted),
                            borderLeftColor: accent,
                          },
                        ]}
                      >
                        <Text style={[styles.classTime, { color: accent }]}>
                          {cls.startTime}~{cls.endTime}
                        </Text>
                        <Text style={styles.classSubject} numberOfLines={1}>
                          {cls.subject}
                        </Text>
                        <Text style={styles.classTeacher} numberOfLines={1}>
                          {cls.teacherName}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const CELL_WIDTH = 100;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  calendarGrid: {
    minWidth: CELL_WIDTH * 7,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayHeaderCell: {
    width: CELL_WIDTH,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  dayHeaderCellToday: {
    // backgroundColor set dynamically via inline style
  },
  dayLabel: {
    ...typography.caption,
    fontFamily: 'NotoSansKR-Medium',
    color: colors.textSecondary,
  },
  dayLabelSunday: {
    color: colors.error,
  },
  dateLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: 2,
  },
  classRow: {
    flexDirection: 'row',
  },
  dayCell: {
    width: CELL_WIDTH,
    minHeight: 80,
    paddingHorizontal: 4,
    gap: 4,
  },
  emptyCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCellText: {
    ...typography.bodySmall,
    color: colors.textDisabled,
  },
  classCard: {
    // backgroundColor and borderLeftColor set dynamically via inline style
    borderRadius: borderRadius.sm,
    padding: spacing.xs + 2,
    borderLeftWidth: 3,
  },
  classTime: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 10,
    // color set dynamically via inline style
    marginBottom: 2,
  },
  classSubject: {
    ...typography.caption,
    fontFamily: 'NotoSansKR-Medium',
    color: colors.textPrimary,
  },
  classTeacher: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
