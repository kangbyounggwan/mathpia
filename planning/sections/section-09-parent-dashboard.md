# Section 09: Parent Dashboard

## 배경

이 섹션은 학부모 전용 화면을 구현한다. 학부모는 자녀의 학습 현황을 한눈에 파악하고, 수업 스케줄을 확인하며, AI 기반 종합 학습 리포트를 열람할 수 있어야 한다. 학부모 화면은 학생/선생님 화면과 달리 **요약 중심의 깔끔한 디자인**으로, 수학 전문 용어를 최소화하고 직관적인 시각화를 제공한다.

**Plan 단계**: Phase 5 (Steps 3.18 + 3.19 + 3.20)

**의존성**: Section 01 (Types & Interfaces), Section 02 (Mock Data & Services), Section 03 (Zustand Stores), Section 06 (Charts & Analytics UI)

---

## 요구사항 요약

1. 학부모 전용 Mock 계정 (`parent@test.com` / `123456`)으로 로그인 가능
2. 로그인 후 `(parent)` 라우팅 그룹으로 자동 이동
3. Bottom Tab 3개: 홈 / 스케줄 / 리포트
4. 다자녀 지원 (자녀 선택 UI)
5. 학부모 친화적 디자인 (요약 중심, 전문용어 최소화)

---

## 사전 조건 (이전 섹션에서 완료되어 있어야 하는 것)

### Section 01에서 완료되어야 하는 것
- `src/types/index.ts`에 `UserRole`이 `'admin' | 'teacher' | 'student' | 'parent'`로 확장됨
- `User` 인터페이스에 `childrenIds?: string[]` 필드 존재
- `src/types/parent.ts`에 아래 타입들이 정의됨:
  - `ChildDashboard` (child, stats, recentAssignments, weakTopics, aiAdvice)
  - `Schedule` (weeklyClasses, upcomingDeadlines)
  - `LearningReport` (radarData, timelineData, heatmapData, aiSummary)
- `src/types/analytics.ts`에 `StudentAnalytics`, `WeaknessAnalysis` 타입 정의됨

### Section 02에서 완료되어야 하는 것
- `src/services/interfaces/parent.ts`에 `IParentService` 인터페이스 정의됨
- `src/services/mock/mockParent.ts`에 Mock 구현 존재
- `src/services/mock/mockData.ts`에 학부모/학생 Mock 데이터 포함

### Section 03에서 완료되어야 하는 것
- `src/stores/parentStore.ts`가 존재하고 동작함
- `src/stores/authStore.ts`에 parent 역할이 추가됨 (이 섹션에서 추가 수정)
- `src/stores/analyticsStore.ts`가 존재하고 학생 분석 데이터를 제공함

### Section 06에서 완료되어야 하는 것
- `src/components/charts/RadarChart.tsx` - 레이더 차트 컴포넌트
- `src/components/charts/LineChart.tsx` - 시계열 라인 차트 컴포넌트
- `src/components/charts/BarChart.tsx` - 바 차트 컴포넌트

---

## 구현 파일 목록

```
수정할 파일:
├── src/stores/authStore.ts            # parent Mock 계정 추가
├── app/index.tsx                      # parent 역할 라우팅 추가

생성할 파일:
├── app/(parent)/
│   ├── _layout.tsx                    # Bottom Tab 3개 (홈/스케줄/리포트)
│   ├── index.tsx                      # 자녀 대시보드
│   ├── schedule.tsx                   # 스케줄 화면
│   └── report.tsx                     # 학습 리포트 화면
├── src/components/parent/
│   ├── ChildSelector.tsx              # 자녀 선택 컴포넌트
│   ├── ScheduleCalendar.tsx           # 주간 캘린더 컴포넌트
│   └── ParentReportCard.tsx           # 학습 요약 카드 컴포넌트
```

---

## Step 1: authStore에 학부모 Mock 계정 추가

**파일**: `src/stores/authStore.ts`

현재 `mockUsers` 객체에 `teacher@test.com`과 `student@test.com`만 존재한다. 여기에 `parent@test.com`을 추가한다.

### 변경 내용

`mockUsers` 객체 안에 아래 항목을 추가한다:

```typescript
// 파일: src/stores/authStore.ts

// 기존 import를 유지하되, UserRole에 'parent'가 포함된 상태여야 함
import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Mock 데이터
const mockUsers: Record<string, User & { password: string }> = {
  'teacher@test.com': {
    id: '1',
    academyId: 'academy1',
    role: 'teacher',
    name: '김선생',
    email: 'teacher@test.com',
    phone: '010-1234-5678',
    password: '123456',
    createdAt: new Date(),
  },
  'student@test.com': {
    id: '2',
    academyId: 'academy1',
    role: 'student',
    name: '이학생',
    email: 'student@test.com',
    phone: '010-8765-4321',
    grade: '고1',
    password: '123456',
    createdAt: new Date(),
  },
  // ★ 신규 추가: 학부모 계정
  'parent@test.com': {
    id: '3',
    academyId: 'academy1',
    role: 'parent',
    name: '이부모',
    email: 'parent@test.com',
    phone: '010-5555-1234',
    childrenIds: ['2'],  // 이학생(student@test.com)의 id
    password: '123456',
    createdAt: new Date(),
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockUser = mockUsers[email];
      if (mockUser && mockUser.password === password) {
        const { password: _, ...user } = mockUser;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ error: '이메일 또는 비밀번호가 올바르지 않습니다.', isLoading: false });
      }
    } catch (error) {
      set({ error: '로그인 중 오류가 발생했습니다.', isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, error: null });
  },
}));
```

**핵심 포인트**:
- `id: '3'`을 사용 (teacher=1, student=2, parent=3)
- `childrenIds: ['2']`로 `이학생`과 연결
- `role: 'parent'`는 Section 01에서 `UserRole`에 이미 추가되어 있어야 함
- `User` 인터페이스에 `childrenIds?: string[]`가 Section 01에서 이미 추가되어 있어야 함

---

## Step 2: 앱 라우팅에 parent 역할 추가

**파일**: `app/index.tsx`

현재 splash 화면에서 role 기반 라우팅이 teacher/student만 분기한다. parent를 추가한다.

### 전체 코드

```typescript
// 파일: app/index.tsx

import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { colors } from '../src/constants/theme';

export default function SplashScreen() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        if (user.role === 'teacher' || user.role === 'admin') {
          router.replace('/(teacher)');
        } else if (user.role === 'parent') {
          // ★ 신규 추가: 학부모 라우팅
          router.replace('/(parent)');
        } else {
          router.replace('/(student)');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>M</Text>
      </View>
      <Text style={styles.title}>Mathpia</Text>
      <Text style={styles.subtitle}>수학을 더 쉽게</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.primary,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.surface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.surface,
    opacity: 0.9,
  },
});
```

**변경 포인트**: `useEffect` 내 `if` 분기에 `else if (user.role === 'parent')` 블록을 추가하여 `/(parent)`로 라우팅.

---

## Step 3: 학부모 탭 레이아웃

**파일**: `app/(parent)/_layout.tsx` (신규 생성)

학생/선생님 레이아웃과 동일한 패턴으로 Bottom Tab 3개를 구성한다. 학부모 전용 색상 톤은 기존 primary 컬러를 사용하되, 아이콘을 학부모에 적합하게 선택한다.

### 전체 코드

```typescript
// 파일: app/(parent)/_layout.tsx

import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tabletSizes } from '../../src/constants/theme';

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          height: tabletSizes.tabBarHeight,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarLabel: '홈',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-heart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: '스케줄',
          tabBarLabel: '스케줄',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: '리포트',
          tabBarLabel: '리포트',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**아이콘 선택 이유**:
- `home-heart`: 학부모의 따뜻한 홈 대시보드 느낌
- `calendar-month`: 월/주간 스케줄
- `chart-line`: 학습 성적 리포트

---

## Step 4: 학부모 컴포넌트 구현

### 4-A. ChildSelector (자녀 선택 컴포넌트)

**파일**: `src/components/parent/ChildSelector.tsx` (신규 생성)

다자녀 학부모를 위한 자녀 선택 탭이다. 수평 스크롤 가능한 칩 형태로, 선택된 자녀가 강조된다. 자녀가 1명이면 탭이 보이지만 선택이 고정된다.

```typescript
// 파일: src/components/parent/ChildSelector.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface Child {
  id: string;
  name: string;
  grade?: string;
  profileImage?: string;
}

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string;
  onSelectChild: (childId: string) => void;
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({
  children: childrenList,
  selectedChildId,
  onSelectChild,
}) => {
  if (childrenList.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>자녀 선택</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {childrenList.map((child) => {
          const isSelected = child.id === selectedChildId;
          return (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childChip,
                isSelected && styles.childChipSelected,
              ]}
              onPress={() => onSelectChild(child.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.avatarContainer,
                  isSelected && styles.avatarContainerSelected,
                ]}
              >
                {child.profileImage ? (
                  <Avatar.Image size={36} source={{ uri: child.profileImage }} />
                ) : (
                  <Avatar.Icon
                    size={36}
                    icon="account"
                    style={[
                      styles.avatarIcon,
                      isSelected && styles.avatarIconSelected,
                    ]}
                    color={isSelected ? colors.surface : colors.primary}
                  />
                )}
              </View>
              <View style={styles.childInfo}>
                <Text
                  style={[
                    styles.childName,
                    isSelected && styles.childNameSelected,
                  ]}
                >
                  {child.name}
                </Text>
                {child.grade && (
                  <Text
                    style={[
                      styles.childGrade,
                      isSelected && styles.childGradeSelected,
                    ]}
                  >
                    {child.grade}
                  </Text>
                )}
              </View>
              {isSelected && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={colors.primary}
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 140,
  },
  childChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '15',
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatarContainerSelected: {},
  avatarIcon: {
    backgroundColor: colors.primaryLight + '30',
  },
  avatarIconSelected: {
    backgroundColor: colors.primary,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  childNameSelected: {
    color: colors.primaryDark,
  },
  childGrade: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  childGradeSelected: {
    color: colors.primary,
  },
  checkIcon: {
    marginLeft: spacing.xs,
  },
});
```

### 4-B. ScheduleCalendar (주간 캘린더 컴포넌트)

**파일**: `src/components/parent/ScheduleCalendar.tsx` (신규 생성)

주간 수업 시간표를 표시하는 캘린더다. 요일별 칸에 수업 정보를 보여준다. 학부모가 한 주의 수업 스케줄을 한눈에 볼 수 있다.

```typescript
// 파일: src/components/parent/ScheduleCalendar.tsx

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface ClassSchedule {
  id: string;
  dayOfWeek: number; // 0=일, 1=월, ..., 6=토
  startTime: string; // "16:00"
  endTime: string;   // "17:30"
  subject: string;
  teacherName: string;
  location?: string;
}

interface ScheduleCalendarProps {
  classes: ClassSchedule[];
  currentDate?: Date; // 기준 날짜 (기본: 오늘)
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  classes,
  currentDate = new Date(),
}) => {
  // 현재 주의 시작일(월요일) 계산
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date(currentDate);
    const dayOfWeek = today.getDay(); // 0=일
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + mondayOffset + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate]);

  // 요일별로 수업 그룹핑 (월~일 순서: 1,2,3,4,5,6,0)
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
          color={colors.primary}
        />
        <Text style={styles.headerTitle}>주간 수업 시간표</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.calendarGrid}>
          {/* 요일 헤더 */}
          <View style={styles.dayHeaderRow}>
            {dayOrder.map((dayIdx, i) => {
              const date = weekDates[dayIdx === 0 ? 6 : dayIdx - 1];
              const todayFlag = isToday(date);
              return (
                <View
                  key={dayIdx}
                  style={[
                    styles.dayHeaderCell,
                    todayFlag && styles.dayHeaderCellToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      dayIdx === 0 && styles.dayLabelSunday,
                      dayIdx === 6 && styles.dayLabelSaturday,
                      todayFlag && styles.dayLabelToday,
                    ]}
                  >
                    {DAY_LABELS[dayIdx]}
                  </Text>
                  <Text
                    style={[
                      styles.dateLabel,
                      todayFlag && styles.dateLabelToday,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 수업 셀 */}
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
                      <View key={cls.id} style={styles.classCard}>
                        <Text style={styles.classTime}>
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
    fontSize: 16,
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
    backgroundColor: colors.primary + '15',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayLabelSunday: {
    color: colors.error,
  },
  dayLabelSaturday: {
    color: colors.primary,
  },
  dayLabelToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  dateLabelToday: {
    color: colors.primary,
    fontWeight: '700',
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
    fontSize: 14,
    color: colors.textDisabled,
  },
  classCard: {
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.sm,
    padding: spacing.xs + 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  classTime: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  classSubject: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  classTeacher: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
```

### 4-C. ParentReportCard (학습 요약 카드 컴포넌트)

**파일**: `src/components/parent/ParentReportCard.tsx` (신규 생성)

학부모 친화적인 학습 요약 카드다. 복잡한 수치 대신 이해하기 쉬운 표현을 사용한다. 색상으로 상태를 직관적으로 전달한다.

```typescript
// 파일: src/components/parent/ParentReportCard.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';

type ReportStatus = 'excellent' | 'good' | 'average' | 'needsWork';

interface ParentReportCardProps {
  title: string;
  subtitle?: string;
  icon: string;
  status: ReportStatus;
  mainValue: string;
  mainLabel: string;
  details?: { label: string; value: string }[];
  advice?: string;
}

const STATUS_CONFIG: Record<
  ReportStatus,
  { color: string; bgColor: string; label: string; emoji: string }
> = {
  excellent: {
    color: colors.primary,
    bgColor: colors.primaryLight + '15',
    label: '매우 우수',
    emoji: 'star-circle',
  },
  good: {
    color: colors.success,
    bgColor: colors.success + '15',
    label: '양호',
    emoji: 'check-circle',
  },
  average: {
    color: colors.warning,
    bgColor: colors.warning + '15',
    label: '보통',
    emoji: 'minus-circle',
  },
  needsWork: {
    color: colors.error,
    bgColor: colors.error + '15',
    label: '노력 필요',
    emoji: 'alert-circle',
  },
};

export const ParentReportCard: React.FC<ParentReportCardProps> = ({
  title,
  subtitle,
  icon,
  status,
  mainValue,
  mainLabel,
  details,
  advice,
}) => {
  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <MaterialCommunityIcons
            name={icon as any}
            size={22}
            color={config.color}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
          <MaterialCommunityIcons
            name={config.emoji as any}
            size={14}
            color={config.color}
          />
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      {/* 메인 값 */}
      <View style={styles.mainValueSection}>
        <Text style={[styles.mainValue, { color: config.color }]}>
          {mainValue}
        </Text>
        <Text style={styles.mainLabel}>{mainLabel}</Text>
      </View>

      {/* 세부 항목 */}
      {details && details.length > 0 && (
        <View style={styles.detailsSection}>
          {details.map((detail, index) => (
            <View
              key={index}
              style={[
                styles.detailRow,
                index < details.length - 1 && styles.detailRowBorder,
              ]}
            >
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue}>{detail.value}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 조언 */}
      {advice && (
        <View style={styles.adviceSection}>
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={16}
            color={colors.warning}
          />
          <Text style={styles.adviceText}>{advice}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainValueSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  mainValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  mainLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  detailsSection: {
    marginTop: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  adviceSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.warning + '10',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  adviceText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
});
```

---

## Step 5: 홈 화면 (자녀 대시보드)

**파일**: `app/(parent)/index.tsx` (신규 생성)

학부모가 가장 먼저 보는 화면이다. 자녀를 선택하고, 이번 주 학습 현황을 한눈에 파악한다. 핵심 정보만 요약하여 보여주고, 상세한 내용은 리포트 탭에서 확인하도록 유도한다.

### 전체 코드

```typescript
// 파일: app/(parent)/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { Text, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useParentStore } from '../../src/stores/parentStore';
import { ChildSelector } from '../../src/components/parent/ChildSelector';
import { ParentReportCard } from '../../src/components/parent/ParentReportCard';
import { colors, spacing, borderRadius } from '../../src/constants/theme';

// ─── Mock 데이터 (parentStore가 미구현 시 폴백) ─────────────────
// parentStore에서 실제 데이터를 가져오지만, 스토어 로딩 전/에러 시 이 데이터를 사용
const FALLBACK_CHILDREN = [
  { id: '2', name: '이학생', grade: '고1' as const },
];

const FALLBACK_STATS = {
  totalSolved: 45,
  correctRate: 82,
  studyDays: 5,
  weeklyGoalProgress: 0.72,
  totalGoal: 60,
};

const FALLBACK_HOMEWORK = [
  {
    id: 'hw1',
    title: '이차방정식 연습',
    dueDate: '오늘 마감',
    progress: 0.7,
    total: 10,
    completed: 7,
    isUrgent: true,
  },
  {
    id: 'hw2',
    title: '삼각함수 그래프',
    dueDate: '내일 마감',
    progress: 0.25,
    total: 8,
    completed: 2,
    isUrgent: false,
  },
  {
    id: 'hw3',
    title: '함수의 극한',
    dueDate: '3일 후 마감',
    progress: 0,
    total: 12,
    completed: 0,
    isUrgent: false,
  },
];

const FALLBACK_WEAK_TOPICS = [
  { topic: '이차방정식의 근', score: 42, reason: '근의 공식 적용 오류가 빈번합니다' },
  { topic: '삼각함수의 그래프', score: 55, reason: '주기와 진폭 개념 혼동이 있습니다' },
  { topic: '집합의 연산', score: 61, reason: '교집합/합집합 기호 해석이 불안정합니다' },
];

const FALLBACK_AI_ADVICE =
  '이학생은 최근 이차방정식 단원에서 어려움을 겪고 있지만, 삼각함수의 기본 개념은 잘 이해하고 있습니다. 이번 주에는 이차방정식의 근의 공식 연습에 집중하면 빠른 개선이 가능합니다. 매일 3~5문제씩 꾸준히 풀면 2주 내에 눈에 띄는 향상이 기대됩니다.';

// ─── 메인 컴포넌트 ──────────────────────────────────────────────

export default function ParentDashboard() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  const user = useAuthStore((s) => s.user);
  const childrenIds = (user as any)?.childrenIds ?? ['2'];

  // parentStore 통합 (Section 03 완료 후 활성화)
  // const { childDashboard, fetchChildDashboard, isLoading } = useParentStore();
  // 임시 상태 관리
  const [selectedChildId, setSelectedChildId] = useState<string>(
    childrenIds[0] ?? '2'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 자녀 목록 구성 (실제로는 parentStore에서 가져옴)
  const childrenList = FALLBACK_CHILDREN.filter((c) =>
    childrenIds.includes(c.id)
  );

  // 데이터 (실제로는 parentStore의 childDashboard에서)
  const stats = FALLBACK_STATS;
  const homework = FALLBACK_HOMEWORK;
  const weakTopics = FALLBACK_WEAK_TOPICS;
  const aiAdvice = FALLBACK_AI_ADVICE;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // await fetchChildDashboard(selectedChildId);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, [selectedChildId]);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    // fetchChildDashboard(childId);
  };

  // 정답률에 따른 상태 결정
  const getStatusFromRate = (rate: number) => {
    if (rate >= 90) return 'excellent' as const;
    if (rate >= 75) return 'good' as const;
    if (rate >= 60) return 'average' as const;
    return 'needsWork' as const;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 헤더 */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.greeting}>
              안녕하세요, {user?.name ?? '학부모'}님
            </Text>
            <Text style={styles.headerSubtitle}>
              자녀의 이번 주 학습 현황입니다
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={colors.textSecondary}
            />
          </View>
        </View>

        {/* 자녀 선택 */}
        <ChildSelector
          children={childrenList}
          selectedChildId={selectedChildId}
          onSelectChild={handleSelectChild}
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>학습 데이터를 불러오는 중...</Text>
          </View>
        ) : (
          <View style={[styles.dashboardGrid, isWide && styles.dashboardGridWide]}>
            {/* 왼쪽 컬럼 */}
            <View style={[styles.column, isWide && styles.columnLeft]}>
              {/* 주간 학습 통계 카드 */}
              <View style={styles.weeklyStatsCard}>
                <View style={styles.weeklyStatsHeader}>
                  <View>
                    <Text style={styles.weeklyStatsTitle}>이번 주 학습</Text>
                    <Text style={styles.weeklyStatsSubtitle}>
                      목표 {stats.totalGoal}문제 중 {stats.totalSolved}문제 완료
                    </Text>
                  </View>
                  <View style={styles.weeklyProgressCircle}>
                    <Text style={styles.weeklyProgressText}>
                      {Math.round(stats.weeklyGoalProgress * 100)}%
                    </Text>
                  </View>
                </View>
                <ProgressBar
                  progress={stats.weeklyGoalProgress}
                  color="#FFFFFF"
                  style={styles.weeklyProgressBar}
                />
                <View style={styles.weeklyStatsRow}>
                  <View style={styles.weeklyStatItem}>
                    <MaterialCommunityIcons
                      name="pencil-box-multiple"
                      size={18}
                      color="rgba(255,255,255,0.9)"
                    />
                    <Text style={styles.weeklyStatValue}>{stats.totalSolved}문제</Text>
                    <Text style={styles.weeklyStatLabel}>풀이 수</Text>
                  </View>
                  <View style={styles.weeklyStatDivider} />
                  <View style={styles.weeklyStatItem}>
                    <MaterialCommunityIcons
                      name="target"
                      size={18}
                      color="rgba(255,255,255,0.9)"
                    />
                    <Text style={styles.weeklyStatValue}>{stats.correctRate}%</Text>
                    <Text style={styles.weeklyStatLabel}>정답률</Text>
                  </View>
                  <View style={styles.weeklyStatDivider} />
                  <View style={styles.weeklyStatItem}>
                    <MaterialCommunityIcons
                      name="calendar-check"
                      size={18}
                      color="rgba(255,255,255,0.9)"
                    />
                    <Text style={styles.weeklyStatValue}>{stats.studyDays}일</Text>
                    <Text style={styles.weeklyStatLabel}>학습일</Text>
                  </View>
                </View>
              </View>

              {/* AI 학습 조언 카드 */}
              <View style={styles.aiAdviceCard}>
                <View style={styles.aiAdviceHeader}>
                  <View style={styles.aiAdviceIconContainer}>
                    <MaterialCommunityIcons
                      name="robot-happy"
                      size={20}
                      color={colors.secondary}
                    />
                  </View>
                  <View>
                    <Text style={styles.aiAdviceTitle}>AI 학습 조언</Text>
                    <Text style={styles.aiAdviceSubtitle}>
                      Gemini AI 분석 기반
                    </Text>
                  </View>
                </View>
                <Text style={styles.aiAdviceText}>{aiAdvice}</Text>
              </View>

              {/* 취약 단원 요약 */}
              <View style={styles.weaknessCard}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={20}
                    color={colors.warning}
                  />
                  <Text style={styles.sectionTitle}>취약 단원 (상위 3개)</Text>
                </View>
                {weakTopics.map((topic, index) => (
                  <View key={index} style={styles.weakTopicRow}>
                    <View style={styles.weakTopicLeft}>
                      <View
                        style={[
                          styles.weakTopicRank,
                          {
                            backgroundColor:
                              index === 0
                                ? colors.error + '20'
                                : index === 1
                                ? colors.warning + '20'
                                : colors.textSecondary + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.weakTopicRankText,
                            {
                              color:
                                index === 0
                                  ? colors.error
                                  : index === 1
                                  ? colors.warning
                                  : colors.textSecondary,
                            },
                          ]}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.weakTopicInfo}>
                        <Text style={styles.weakTopicName}>{topic.topic}</Text>
                        <Text style={styles.weakTopicReason} numberOfLines={1}>
                          {topic.reason}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.weakTopicScoreContainer}>
                      <Text
                        style={[
                          styles.weakTopicScore,
                          {
                            color:
                              topic.score < 50
                                ? colors.error
                                : topic.score < 70
                                ? colors.warning
                                : colors.success,
                          },
                        ]}
                      >
                        {topic.score}점
                      </Text>
                    </View>
                  </View>
                ))}
                <Text
                  style={styles.viewMoreLink}
                  onPress={() => router.push('/(parent)/report')}
                >
                  상세 리포트 보기 &rarr;
                </Text>
              </View>
            </View>

            {/* 오른쪽 컬럼 */}
            <View style={[styles.column, isWide && styles.columnRight]}>
              {/* 최근 숙제 현황 */}
              <View style={styles.homeworkSection}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.sectionTitle}>최근 숙제 현황</Text>
                </View>
                {homework.map((hw) => (
                  <View
                    key={hw.id}
                    style={[
                      styles.homeworkItem,
                      hw.isUrgent && styles.homeworkItemUrgent,
                    ]}
                  >
                    <View style={styles.homeworkItemHeader}>
                      <View style={styles.homeworkItemLeft}>
                        <Text style={styles.homeworkItemTitle}>{hw.title}</Text>
                        <View style={styles.homeworkItemMeta}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={13}
                            color={
                              hw.isUrgent
                                ? colors.error
                                : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.homeworkItemDue,
                              hw.isUrgent && styles.homeworkItemDueUrgent,
                            ]}
                          >
                            {hw.dueDate}
                          </Text>
                          {hw.isUrgent && (
                            <View style={styles.urgentBadge}>
                              <Text style={styles.urgentBadgeText}>긴급</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.homeworkItemRight}>
                        <Text style={styles.homeworkItemPercent}>
                          {Math.round(hw.progress * 100)}%
                        </Text>
                        <Text style={styles.homeworkItemCount}>
                          {hw.completed}/{hw.total}
                        </Text>
                      </View>
                    </View>
                    <ProgressBar
                      progress={hw.progress}
                      color={
                        hw.progress === 1
                          ? colors.success
                          : hw.isUrgent
                          ? colors.error
                          : colors.primary
                      }
                      style={styles.homeworkProgressBar}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  // 헤더
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 그리드
  dashboardGrid: {
    gap: spacing.md,
  },
  dashboardGridWide: {
    flexDirection: 'row',
  },
  column: {
    gap: spacing.md,
  },
  columnLeft: {
    flex: 1,
  },
  columnRight: {
    flex: 1,
  },

  // 주간 학습 통계
  weeklyStatsCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  weeklyStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  weeklyStatsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weeklyStatsSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  weeklyProgressCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyProgressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weeklyProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: spacing.md,
  },
  weeklyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  weeklyStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weeklyStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  weeklyStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // AI 조언
  aiAdviceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  aiAdviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  aiAdviceIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.secondaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAdviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aiAdviceSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  aiAdviceText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },

  // 취약 단원
  weaknessCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weakTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  weakTopicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weakTopicRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  weakTopicRankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  weakTopicInfo: {
    flex: 1,
  },
  weakTopicName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  weakTopicReason: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  weakTopicScoreContainer: {
    marginLeft: spacing.sm,
  },
  weakTopicScore: {
    fontSize: 15,
    fontWeight: '700',
  },
  viewMoreLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'right',
    marginTop: spacing.md,
  },

  // 숙제 현황
  homeworkSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  homeworkItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant + '40',
  },
  homeworkItemUrgent: {
    borderLeftColor: colors.error,
    backgroundColor: colors.error + '08',
  },
  homeworkItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  homeworkItemLeft: {
    flex: 1,
  },
  homeworkItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  homeworkItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  homeworkItemDue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  homeworkItemDueUrgent: {
    color: colors.error,
    fontWeight: '600',
  },
  urgentBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 4,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  homeworkItemRight: {
    alignItems: 'flex-end',
  },
  homeworkItemPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  homeworkItemCount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  homeworkProgressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceVariant,
  },
});
```

**핵심 설계 결정**:
- 폴백 Mock 데이터가 인라인으로 포함되어, parentStore 연결 전에도 화면이 작동함
- `isWide` 분기로 태블릿 가로/세로 모드 모두 지원
- `RefreshControl`로 당겨서 새로고침 지원
- 취약 단원에서 "상세 리포트 보기"를 눌러 `report` 탭으로 이동 가능
- parentStore 통합은 주석으로 준비해 둠 (Section 03 완료 후 주석 해제)

---

## Step 6: 스케줄 화면

**파일**: `app/(parent)/schedule.tsx` (신규 생성)

주간 수업 캘린더, 다가오는 숙제 마감일, 최근 채점 완료 알림을 보여주는 화면이다.

### 전체 코드

```typescript
// 파일: app/(parent)/schedule.tsx

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { ChildSelector } from '../../src/components/parent/ChildSelector';
import { ScheduleCalendar } from '../../src/components/parent/ScheduleCalendar';
import { colors, spacing, borderRadius } from '../../src/constants/theme';

// ─── Mock 데이터 ─────────────────────────────────────────────

const MOCK_CHILDREN = [
  { id: '2', name: '이학생', grade: '고1' as const },
];

const MOCK_CLASSES = [
  {
    id: 'cls1',
    dayOfWeek: 1, // 월
    startTime: '16:00',
    endTime: '17:30',
    subject: '수학I',
    teacherName: '김선생',
    location: '201호',
  },
  {
    id: 'cls2',
    dayOfWeek: 3, // 수
    startTime: '16:00',
    endTime: '17:30',
    subject: '수학II',
    teacherName: '김선생',
    location: '201호',
  },
  {
    id: 'cls3',
    dayOfWeek: 5, // 금
    startTime: '16:00',
    endTime: '17:30',
    subject: '수학I 심화',
    teacherName: '김선생',
    location: '203호',
  },
];

interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  daysLeft: number;
  totalProblems: number;
  completedProblems: number;
  isOverdue: boolean;
}

const MOCK_DEADLINES: Deadline[] = [
  {
    id: 'dl1',
    title: '이차방정식 연습',
    dueDate: '4월 4일 (금)',
    daysLeft: 0,
    totalProblems: 10,
    completedProblems: 7,
    isOverdue: false,
  },
  {
    id: 'dl2',
    title: '삼각함수 그래프',
    dueDate: '4월 5일 (토)',
    daysLeft: 1,
    totalProblems: 8,
    completedProblems: 2,
    isOverdue: false,
  },
  {
    id: 'dl3',
    title: '함수의 극한',
    dueDate: '4월 7일 (월)',
    daysLeft: 3,
    totalProblems: 12,
    completedProblems: 0,
    isOverdue: false,
  },
];

interface GradingNotification {
  id: string;
  assignmentTitle: string;
  teacherName: string;
  score: number;
  totalScore: number;
  gradedAt: string;
}

const MOCK_GRADING_NOTIFICATIONS: GradingNotification[] = [
  {
    id: 'gn1',
    assignmentTitle: '인수분해 심화',
    teacherName: '김선생',
    score: 85,
    totalScore: 100,
    gradedAt: '1시간 전',
  },
  {
    id: 'gn2',
    assignmentTitle: '이차함수의 그래프',
    teacherName: '김선생',
    score: 72,
    totalScore: 100,
    gradedAt: '어제',
  },
  {
    id: 'gn3',
    assignmentTitle: '집합과 명제',
    teacherName: '김선생',
    score: 90,
    totalScore: 100,
    gradedAt: '3일 전',
  },
];

// ─── 메인 컴포넌트 ──────────────────────────────────────────────

export default function ParentScheduleScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  const user = useAuthStore((s) => s.user);
  const childrenIds = (user as any)?.childrenIds ?? ['2'];

  const [selectedChildId, setSelectedChildId] = useState<string>(
    childrenIds[0] ?? '2'
  );

  const childrenList = MOCK_CHILDREN.filter((c) =>
    childrenIds.includes(c.id)
  );

  const getScoreColor = (score: number, total: number) => {
    const rate = score / total;
    if (rate >= 0.9) return colors.primary;
    if (rate >= 0.7) return colors.success;
    if (rate >= 0.5) return colors.warning;
    return colors.error;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* 헤더 */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>스케줄</Text>
          <Text style={styles.headerSubtitle}>수업 일정과 숙제 마감일을 확인하세요</Text>
        </View>

        {/* 자녀 선택 */}
        <ChildSelector
          children={childrenList}
          selectedChildId={selectedChildId}
          onSelectChild={setSelectedChildId}
        />

        <View style={[styles.contentGrid, isWide && styles.contentGridWide]}>
          {/* 왼쪽: 캘린더 */}
          <View style={[styles.calendarSection, isWide && styles.calendarSectionWide]}>
            <ScheduleCalendar classes={MOCK_CLASSES} />
          </View>

          {/* 오른쪽: 마감일 + 알림 */}
          <View style={[styles.sideSection, isWide && styles.sideSectionWide]}>
            {/* 다가오는 숙제 마감일 */}
            <View style={styles.deadlinesCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="clock-alert-outline"
                  size={20}
                  color={colors.warning}
                />
                <Text style={styles.sectionTitle}>다가오는 마감일</Text>
              </View>
              {MOCK_DEADLINES.map((deadline) => (
                <View key={deadline.id} style={styles.deadlineItem}>
                  <View style={styles.deadlineLeft}>
                    <View
                      style={[
                        styles.deadlineDot,
                        {
                          backgroundColor:
                            deadline.daysLeft === 0
                              ? colors.error
                              : deadline.daysLeft <= 1
                              ? colors.warning
                              : colors.success,
                        },
                      ]}
                    />
                    <View style={styles.deadlineInfo}>
                      <Text style={styles.deadlineTitle}>{deadline.title}</Text>
                      <Text style={styles.deadlineDate}>{deadline.dueDate}</Text>
                    </View>
                  </View>
                  <View style={styles.deadlineRight}>
                    <Text
                      style={[
                        styles.deadlineDaysLeft,
                        {
                          color:
                            deadline.daysLeft === 0
                              ? colors.error
                              : deadline.daysLeft <= 1
                              ? colors.warning
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {deadline.daysLeft === 0
                        ? '오늘 마감'
                        : `${deadline.daysLeft}일 남음`}
                    </Text>
                    <Text style={styles.deadlineProgress}>
                      {deadline.completedProblems}/{deadline.totalProblems}문제
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* 최근 채점 알림 */}
            <View style={styles.gradingCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.sectionTitle}>최근 채점 완료</Text>
              </View>
              {MOCK_GRADING_NOTIFICATIONS.map((notification) => (
                <View key={notification.id} style={styles.gradingItem}>
                  <View style={styles.gradingItemLeft}>
                    <View
                      style={[
                        styles.gradingScoreCircle,
                        {
                          backgroundColor:
                            getScoreColor(
                              notification.score,
                              notification.totalScore
                            ) + '15',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.gradingScoreText,
                          {
                            color: getScoreColor(
                              notification.score,
                              notification.totalScore
                            ),
                          },
                        ]}
                      >
                        {notification.score}
                      </Text>
                    </View>
                    <View style={styles.gradingInfo}>
                      <Text style={styles.gradingTitle}>
                        {notification.assignmentTitle}
                      </Text>
                      <Text style={styles.gradingMeta}>
                        {notification.teacherName} | {notification.gradedAt}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.gradingTotalScore}>
                    /{notification.totalScore}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // 헤더
  headerSection: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // 그리드
  contentGrid: {
    gap: spacing.md,
  },
  contentGridWide: {
    flexDirection: 'row',
  },
  calendarSection: {},
  calendarSectionWide: {
    flex: 3,
  },
  sideSection: {
    gap: spacing.md,
  },
  sideSectionWide: {
    flex: 2,
  },

  // 공통 섹션 헤더
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // 마감일
  deadlinesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  deadlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  deadlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deadlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deadlineDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deadlineRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  deadlineDaysLeft: {
    fontSize: 13,
    fontWeight: '600',
  },
  deadlineProgress: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // 채점 알림
  gradingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  gradingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  gradingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gradingScoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  gradingScoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  gradingInfo: {
    flex: 1,
  },
  gradingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  gradingMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gradingTotalScore: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
```

---

## Step 7: 리포트 화면 (상세 학습 리포트)

**파일**: `app/(parent)/report.tsx` (신규 생성)

학부모를 위한 상세 학습 리포트이다. 차트 시각화와 AI 종합 진단을 통해 자녀의 학습 상태를 깊이 있게 파악한다. Section 06의 차트 컴포넌트를 사용한다.

### 전체 코드

```typescript
// 파일: app/(parent)/report.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { ChildSelector } from '../../src/components/parent/ChildSelector';
import { ParentReportCard } from '../../src/components/parent/ParentReportCard';
// Section 06 차트 컴포넌트 (구현 완료 후 주석 해제)
// import { RadarChart } from '../../src/components/charts/RadarChart';
// import { LineChart } from '../../src/components/charts/LineChart';
// import { BarChart } from '../../src/components/charts/BarChart';
import { colors, spacing, borderRadius } from '../../src/constants/theme';

// ─── Mock 데이터 ─────────────────────────────────────────────

const MOCK_CHILDREN = [
  { id: '2', name: '이학생', grade: '고1' as const },
];

// 레이더 차트 데이터 (단원별 역량)
const MOCK_RADAR_DATA = [
  { label: '방정식', value: 75 },
  { label: '부등식', value: 82 },
  { label: '함수', value: 68 },
  { label: '삼각함수', value: 55 },
  { label: '수열', value: 88 },
  { label: '집합/명제', value: 61 },
  { label: '확률/통계', value: 79 },
  { label: '미적분', value: 45 },
];

// 시계열 데이터 (최근 8주 성적 추이)
const MOCK_TIMELINE_DATA = [
  { date: '2월 2주', score: 68 },
  { date: '2월 3주', score: 72 },
  { date: '2월 4주', score: 65 },
  { date: '3월 1주', score: 74 },
  { date: '3월 2주', score: 78 },
  { date: '3월 3주', score: 71 },
  { date: '3월 4주', score: 80 },
  { date: '4월 1주', score: 82 },
];

// 오답 분석 (많이 틀린 단원 Top 5)
const MOCK_WRONG_ANALYSIS = [
  { topic: '이차방정식의 근', wrongCount: 12, totalCount: 18 },
  { topic: '삼각함수의 그래프', wrongCount: 9, totalCount: 15 },
  { topic: '미분계수', wrongCount: 8, totalCount: 10 },
  { topic: '집합의 연산', wrongCount: 6, totalCount: 12 },
  { topic: '등차수열', wrongCount: 4, totalCount: 14 },
];

// AI 종합 진단
const MOCK_AI_DIAGNOSIS = {
  strengths: [
    '수열 단원의 이해도가 높고, 등비수열 응용 문제도 잘 풀고 있습니다.',
    '부등식 풀이 과정이 정확하며, 절대값 부등식도 안정적입니다.',
    '최근 4주간 꾸준한 상승세를 보이고 있습니다.',
  ],
  weaknesses: [
    '삼각함수의 그래프 변환(이동, 대칭)에서 반복적인 실수가 있습니다.',
    '미적분 기초 개념(극한의 정의)이 불안정합니다.',
    '이차방정식에서 판별식 활용 시 부호 오류가 자주 발생합니다.',
  ],
  recommendations: [
    '삼각함수 그래프 연습을 주 3회, 각 5문제씩 진행하는 것을 권장합니다.',
    '미적분 진입 전 극한 개념 복습(2주 분량)이 필요합니다.',
    '이차방정식 판별식 문제를 오답노트와 병행하여 반복 학습하세요.',
  ],
  overallComment:
    '이학생은 전체적으로 성실하게 학습하고 있으며, 기본 개념 이해도는 양호합니다. 다만 삼각함수와 미적분 기초 단원에서 추가 학습이 필요합니다. 현재 상승세를 유지하면 다음 시험에서 10점 이상의 향상이 기대됩니다.',
};

// ─── 차트 플레이스홀더 ─────────────────────────────────────────
// Section 06 차트가 구현되기 전까지 사용하는 간단한 시각 표현

const RadarChartPlaceholder: React.FC<{
  data: { label: string; value: number }[];
}> = ({ data }) => (
  <View style={placeholderStyles.chartContainer}>
    <Text style={placeholderStyles.chartTitle}>단원별 역량 분석</Text>
    {data.map((item, index) => (
      <View key={index} style={placeholderStyles.barRow}>
        <Text style={placeholderStyles.barLabel}>{item.label}</Text>
        <View style={placeholderStyles.barTrack}>
          <View
            style={[
              placeholderStyles.barFill,
              {
                width: `${item.value}%`,
                backgroundColor:
                  item.value >= 80
                    ? colors.success
                    : item.value >= 60
                    ? colors.primary
                    : colors.warning,
              },
            ]}
          />
        </View>
        <Text
          style={[
            placeholderStyles.barValue,
            {
              color:
                item.value >= 80
                  ? colors.success
                  : item.value >= 60
                  ? colors.primary
                  : item.value >= 50
                  ? colors.warning
                  : colors.error,
            },
          ]}
        >
          {item.value}
        </Text>
      </View>
    ))}
  </View>
);

const TimelineChartPlaceholder: React.FC<{
  data: { date: string; score: number }[];
}> = ({ data }) => {
  const maxScore = Math.max(...data.map((d) => d.score));
  const minScore = Math.min(...data.map((d) => d.score));
  const range = maxScore - minScore || 1;

  return (
    <View style={placeholderStyles.chartContainer}>
      <Text style={placeholderStyles.chartTitle}>성적 변화 추이</Text>
      <View style={placeholderStyles.timelineRow}>
        {data.map((item, index) => {
          const heightPercent = ((item.score - minScore) / range) * 80 + 20;
          return (
            <View key={index} style={placeholderStyles.timelineItem}>
              <Text style={placeholderStyles.timelineScore}>{item.score}</Text>
              <View
                style={[
                  placeholderStyles.timelineBar,
                  { height: heightPercent },
                ]}
              />
              <Text style={placeholderStyles.timelineDate}>
                {item.date.split(' ')[1] ?? item.date}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ─── 메인 컴포넌트 ──────────────────────────────────────────────

export default function ParentReportScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  const user = useAuthStore((s) => s.user);
  const childrenIds = (user as any)?.childrenIds ?? ['2'];

  const [selectedChildId, setSelectedChildId] = useState<string>(
    childrenIds[0] ?? '2'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const childrenList = MOCK_CHILDREN.filter((c) =>
    childrenIds.includes(c.id)
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setRefreshing(false);
  }, []);

  const handleRerunAI = async () => {
    setIsLoadingAI(true);
    // 실제로는 geminiAnalytics.generateLearningReport() 호출
    await new Promise((r) => setTimeout(r, 2000));
    setIsLoadingAI(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 헤더 */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.headerTitle}>학습 리포트</Text>
            <Text style={styles.headerSubtitle}>
              자녀의 학습 성과를 상세하게 확인하세요
            </Text>
          </View>
        </View>

        {/* 자녀 선택 */}
        <ChildSelector
          children={childrenList}
          selectedChildId={selectedChildId}
          onSelectChild={setSelectedChildId}
        />

        <View
          style={[styles.reportGrid, isWide && styles.reportGridWide]}
        >
          {/* 왼쪽 컬럼 */}
          <View style={[styles.column, isWide && styles.columnLeft]}>
            {/* 레이더 차트 (단원별 역량) */}
            {/*
              Section 06 차트 컴포넌트 완성 후 아래로 교체:
              <RadarChart
                data={MOCK_RADAR_DATA}
                size={280}
                strokeColor={colors.primary}
                fillColor={colors.primary + '30'}
              />
            */}
            <RadarChartPlaceholder data={MOCK_RADAR_DATA} />

            {/* 성적 변화 추이 그래프 */}
            {/*
              Section 06 차트 컴포넌트 완성 후 아래로 교체:
              <LineChart
                data={MOCK_TIMELINE_DATA}
                height={200}
                lineColor={colors.primary}
                dotColor={colors.primaryDark}
              />
            */}
            <TimelineChartPlaceholder data={MOCK_TIMELINE_DATA} />

            {/* 오답 분석 요약 */}
            <View style={styles.wrongAnalysisCard}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={20}
                  color={colors.error}
                />
                <Text style={styles.sectionTitle}>
                  오답 분석 (많이 틀린 단원)
                </Text>
              </View>
              {MOCK_WRONG_ANALYSIS.map((item, index) => {
                const wrongRate = item.wrongCount / item.totalCount;
                return (
                  <View key={index} style={styles.wrongItem}>
                    <View style={styles.wrongItemLeft}>
                      <Text style={styles.wrongItemRank}>
                        {index + 1}.
                      </Text>
                      <View style={styles.wrongItemInfo}>
                        <Text style={styles.wrongItemTopic}>
                          {item.topic}
                        </Text>
                        <View style={styles.wrongItemBarTrack}>
                          <View
                            style={[
                              styles.wrongItemBarFill,
                              {
                                width: `${wrongRate * 100}%`,
                                backgroundColor:
                                  wrongRate > 0.6
                                    ? colors.error
                                    : wrongRate > 0.4
                                    ? colors.warning
                                    : colors.textSecondary,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                    <Text style={styles.wrongItemCount}>
                      {item.wrongCount}/{item.totalCount}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 오른쪽 컬럼 */}
          <View style={[styles.column, isWide && styles.columnRight]}>
            {/* AI 종합 진단 */}
            <View style={styles.aiDiagnosisCard}>
              <View style={styles.aiDiagnosisHeader}>
                <View style={styles.aiIconContainer}>
                  <MaterialCommunityIcons
                    name="robot-happy"
                    size={22}
                    color={colors.secondary}
                  />
                </View>
                <View style={styles.aiHeaderText}>
                  <Text style={styles.aiDiagnosisTitle}>
                    AI 종합 진단
                  </Text>
                  <Text style={styles.aiDiagnosisSubtitle}>
                    Gemini AI 분석 결과
                  </Text>
                </View>
                <View
                  style={styles.aiRefreshButton}
                  onTouchEnd={handleRerunAI}
                >
                  {isLoadingAI ? (
                    <ActivityIndicator size={18} color={colors.primary} />
                  ) : (
                    <MaterialCommunityIcons
                      name="refresh"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </View>
              </View>

              {isLoadingAI ? (
                <View style={styles.aiLoadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={colors.secondary}
                  />
                  <Text style={styles.aiLoadingText}>
                    AI가 학습 데이터를 분석 중입니다...
                  </Text>
                </View>
              ) : (
                <>
                  {/* 종합 코멘트 */}
                  <View style={styles.overallCommentBox}>
                    <Text style={styles.overallCommentText}>
                      {MOCK_AI_DIAGNOSIS.overallComment}
                    </Text>
                  </View>

                  {/* 강점 */}
                  <View style={styles.diagnosisSection}>
                    <View style={styles.diagnosisSectionHeader}>
                      <MaterialCommunityIcons
                        name="thumb-up"
                        size={16}
                        color={colors.success}
                      />
                      <Text
                        style={[
                          styles.diagnosisSectionTitle,
                          { color: colors.success },
                        ]}
                      >
                        강점
                      </Text>
                    </View>
                    {MOCK_AI_DIAGNOSIS.strengths.map((item, index) => (
                      <View key={index} style={styles.diagnosisItem}>
                        <View
                          style={[
                            styles.diagnosisDot,
                            { backgroundColor: colors.success },
                          ]}
                        />
                        <Text style={styles.diagnosisItemText}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* 약점 */}
                  <View style={styles.diagnosisSection}>
                    <View style={styles.diagnosisSectionHeader}>
                      <MaterialCommunityIcons
                        name="alert"
                        size={16}
                        color={colors.error}
                      />
                      <Text
                        style={[
                          styles.diagnosisSectionTitle,
                          { color: colors.error },
                        ]}
                      >
                        개선이 필요한 부분
                      </Text>
                    </View>
                    {MOCK_AI_DIAGNOSIS.weaknesses.map((item, index) => (
                      <View key={index} style={styles.diagnosisItem}>
                        <View
                          style={[
                            styles.diagnosisDot,
                            { backgroundColor: colors.error },
                          ]}
                        />
                        <Text style={styles.diagnosisItemText}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* 추천 학습 방향 */}
                  <View style={styles.diagnosisSection}>
                    <View style={styles.diagnosisSectionHeader}>
                      <MaterialCommunityIcons
                        name="lightbulb-on"
                        size={16}
                        color={colors.warning}
                      />
                      <Text
                        style={[
                          styles.diagnosisSectionTitle,
                          { color: colors.warning },
                        ]}
                      >
                        추천 학습 방향
                      </Text>
                    </View>
                    {MOCK_AI_DIAGNOSIS.recommendations.map(
                      (item, index) => (
                        <View key={index} style={styles.diagnosisItem}>
                          <View
                            style={[
                              styles.diagnosisDot,
                              { backgroundColor: colors.warning },
                            ]}
                          />
                          <Text style={styles.diagnosisItemText}>
                            {item}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </>
              )}
            </View>

            {/* ParentReportCard 예시: 전체 종합 */}
            <ParentReportCard
              title="이번 달 종합 평가"
              subtitle="3월 전체 학습 결과"
              icon="chart-arc"
              status="good"
              mainValue="78점"
              mainLabel="월간 평균 점수"
              details={[
                { label: '총 풀이 수', value: '142문제' },
                { label: '정답률', value: '78%' },
                { label: '학습 일수', value: '22일' },
                { label: '오답노트 복습', value: '85%' },
              ]}
              advice="현재 상승 추세이므로 이 페이스를 유지하면 됩니다. 삼각함수 단원만 집중 보강하면 다음 달에는 85점 이상 가능합니다."
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── 플레이스홀더 차트 스타일 ────────────────────────────────────

const placeholderStyles = StyleSheet.create({
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  barLabel: {
    width: 80,
    fontSize: 13,
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barValue: {
    width: 30,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    paddingTop: spacing.md,
  },
  timelineItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  timelineScore: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  timelineBar: {
    width: 20,
    backgroundColor: colors.primaryLight + '60',
    borderRadius: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  timelineDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

// ─── 메인 스타일 ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // 헤더
  headerSection: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // 그리드
  reportGrid: {
    gap: spacing.md,
  },
  reportGridWide: {
    flexDirection: 'row',
  },
  column: {
    gap: spacing.md,
  },
  columnLeft: {
    flex: 1,
  },
  columnRight: {
    flex: 1,
  },

  // 공통 섹션 헤더
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // 오답 분석
  wrongAnalysisCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  wrongItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  wrongItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  wrongItemRank: {
    width: 24,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  wrongItemInfo: {
    flex: 1,
  },
  wrongItemTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  wrongItemBarTrack: {
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  wrongItemBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  wrongItemCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    width: 40,
    textAlign: 'right',
  },

  // AI 종합 진단
  aiDiagnosisCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  aiDiagnosisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aiIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiHeaderText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  aiDiagnosisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  aiDiagnosisSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  aiRefreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiLoadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  aiLoadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  overallCommentBox: {
    backgroundColor: colors.primaryLight + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  overallCommentText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  diagnosisSection: {
    marginBottom: spacing.md,
  },
  diagnosisSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  diagnosisSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  diagnosisItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
  },
  diagnosisDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: spacing.sm,
  },
  diagnosisItemText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
```

**핵심 설계 결정**:
- 차트 컴포넌트 대신 `RadarChartPlaceholder`와 `TimelineChartPlaceholder`를 임시 제공. Section 06 완료 후 주석 처리된 실제 차트로 교체
- AI 종합 진단에 "새로고침" 버튼이 있어, 학부모가 수동으로 AI 재분석을 트리거할 수 있음
- AI 로딩 중 스켈레톤 UI + 안내 메시지 표시

---

## 디자인 원칙 (학부모 화면 전용)

### 학부모 친화적 디자인 체크리스트

1. **요약 중심**: 복잡한 수치/차트보다 "양호", "노력 필요" 같은 직관적 라벨 사용
2. **색상 코드**: 초록(우수) / 파랑(양호) / 노랑(보통) / 빨강(주의) 4단계
3. **용어 순화**: "정답률 78%" 대신 "100문제 중 78문제 정답" 식의 구체적 표현 병행
4. **액션 유도**: 학부모가 직접 할 일 보다는 "자녀에게 ~을 권장하세요" 식의 조언
5. **깔끔한 레이아웃**: 카드 간격 넉넉하게, 정보 과부하 방지
6. **알림 강조**: 긴급 마감, 낮은 점수 등 주의가 필요한 항목을 시각적으로 강조

### 다자녀 지원

- `ChildSelector`로 자녀 간 전환
- 자녀 전환 시 모든 화면의 데이터가 해당 자녀 기준으로 갱신됨
- `childrenIds` 배열이 1개여도, 2개 이상이어도 UI가 자연스럽게 동작

---

## 파일 생성/수정 요약

| 파일 경로 | 작업 | 설명 |
|-----------|------|------|
| `src/stores/authStore.ts` | **수정** | `parent@test.com` Mock 계정 추가 |
| `app/index.tsx` | **수정** | parent role 라우팅 분기 추가 |
| `app/(parent)/_layout.tsx` | **신규** | Bottom Tab 3개 레이아웃 |
| `app/(parent)/index.tsx` | **신규** | 자녀 대시보드 (홈) |
| `app/(parent)/schedule.tsx` | **신규** | 스케줄 화면 |
| `app/(parent)/report.tsx` | **신규** | 학습 리포트 화면 |
| `src/components/parent/ChildSelector.tsx` | **신규** | 자녀 선택 컴포넌트 |
| `src/components/parent/ScheduleCalendar.tsx` | **신규** | 주간 캘린더 컴포넌트 |
| `src/components/parent/ParentReportCard.tsx` | **신규** | 학습 요약 카드 컴포넌트 |

---

## parentStore 통합 가이드

Section 03에서 `parentStore`가 완성된 후, 각 화면에서 아래 패턴으로 통합한다:

```typescript
// 1. import 추가
import { useParentStore } from '../../src/stores/parentStore';

// 2. 스토어에서 데이터 가져오기
const {
  childDashboard,
  schedule,
  learningReport,
  isLoading,
  fetchChildDashboard,
  fetchSchedule,
  fetchLearningReport,
} = useParentStore();

// 3. useEffect로 데이터 로드
useEffect(() => {
  fetchChildDashboard(selectedChildId);
}, [selectedChildId]);

// 4. FALLBACK_* 상수 대신 스토어 데이터 사용
const stats = childDashboard?.stats ?? FALLBACK_STATS;
const homework = childDashboard?.recentAssignments ?? FALLBACK_HOMEWORK;
// ...
```

폴백 데이터(`FALLBACK_*`)는 스토어 연동 후에도 로딩 중이거나 에러 시 사용되므로 삭제하지 말 것.

---

## Section 06 차트 통합 가이드

Section 06 차트 컴포넌트가 완성된 후, `report.tsx`의 플레이스홀더를 교체한다:

```typescript
// 1. import 주석 해제
import { RadarChart } from '../../src/components/charts/RadarChart';
import { LineChart } from '../../src/components/charts/LineChart';

// 2. RadarChartPlaceholder를 RadarChart로 교체
<RadarChart
  data={MOCK_RADAR_DATA}
  size={280}
  strokeColor={colors.primary}
  fillColor={colors.primary + '30'}
/>

// 3. TimelineChartPlaceholder를 LineChart로 교체
<LineChart
  data={MOCK_TIMELINE_DATA}
  height={200}
  lineColor={colors.primary}
  dotColor={colors.primaryDark}
/>

// 4. 플레이스홀더 컴포넌트와 placeholderStyles 삭제
```

---

## Acceptance Criteria

- [ ] `parent@test.com` / `123456`으로 로그인하면 `(parent)` 그룹으로 이동
- [ ] Bottom Tab에 홈/스케줄/리포트 3개 탭이 표시됨
- [ ] 홈 탭: ChildSelector로 자녀 선택 가능
- [ ] 홈 탭: 주간 학습 통계 카드 (풀이 수, 정답률, 학습일, 진행률) 표시
- [ ] 홈 탭: 최근 숙제 현황 목록이 진행률 바와 함께 표시
- [ ] 홈 탭: AI 학습 조언 카드가 표시됨
- [ ] 홈 탭: 취약 단원 상위 3개가 순위/점수/이유와 함께 표시됨
- [ ] 스케줄 탭: 주간 캘린더에 요일별 수업이 표시됨
- [ ] 스케줄 탭: 다가오는 숙제 마감일 목록이 남은 일수와 함께 표시됨
- [ ] 스케줄 탭: 최근 채점 완료 알림이 점수와 함께 표시됨
- [ ] 리포트 탭: 단원별 역량 차트가 표시됨 (플레이스홀더 또는 실제 차트)
- [ ] 리포트 탭: 성적 변화 추이 그래프가 표시됨
- [ ] 리포트 탭: 오답 분석 요약 (많이 틀린 단원 Top 5)이 표시됨
- [ ] 리포트 탭: AI 종합 진단 (강점/약점/추천)이 표시됨
- [ ] 리포트 탭: AI 재분석 버튼 동작 (로딩 → 결과 표시)
- [ ] 리포트 탭: ParentReportCard가 상태 배지 + 세부항목 + 조언과 함께 표시됨
- [ ] 태블릿 가로 모드에서 2컬럼 레이아웃으로 전환됨 (width > 768)
- [ ] 태블릿 세로 모드에서 1컬럼 레이아웃으로 표시됨
- [ ] 학부모 전용 디자인: 요약 중심, 색상 코드 기반 직관적 UI
- [ ] 다자녀: childrenIds에 여러 ID가 있을 때 ChildSelector에 모두 표시됨
- [ ] Pull-to-refresh가 홈, 리포트 화면에서 동작함
- [ ] 기존 teacher/student 로그인이 영향 받지 않음
