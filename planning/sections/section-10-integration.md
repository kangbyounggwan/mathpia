# Section 10: Integration & Navigation

> **Phase**: 6 (기존 화면 개선 & 통합)
> **Plan Steps**: 3.21 + 3.22 + 3.23
> **Dependencies**: Sections 01-09 (ALL previous sections must be completed)

---

## 1. Background

Sections 01-09 created all new features as isolated modules: type system, mock data/services, Zustand stores, problem bank UI, Gemini AI services, charts & analytics UI, wrong notes, AI helper, and parent dashboard. Each was built with its own screens, stores, and components but they are not yet wired together into a cohesive application.

This section performs the final integration work:
- **Routing**: The root `app/index.tsx` splash screen must route `parent` role users to the new `(parent)` group.
- **Teacher navigation**: The existing 5-tab layout stays, but the dashboard gains quick-action buttons that push into `problem-bank.tsx` and `student-analytics.tsx` via Stack navigation. The students list gains tap-to-navigate to per-student analytics.
- **Student navigation**: The existing 4-tab layout grows to 5 tabs by adding an "Wrong Notes / My Learning" tab. The homework screen gains an AI analysis entry point. The solve screen already has AI helper integration from Section 08.
- **Data flow**: Submission completion triggers automatic wrong-note creation for incorrect answers. Submission accumulation feeds the analytics store. The parent dashboard reads analytics data for the linked child.
- **AsyncStorage package**: Must be installed for Zustand persist to work across all stores.

---

## 2. Requirements

### 2.1 Functional
1. Parent role users must be routed to `/(parent)` after login/splash.
2. Teacher dashboard must show "문제은행" and "학생분석" quick action buttons that navigate via Stack push.
3. Teacher `students.tsx` must allow tapping a student card to navigate to `student-analytics.tsx` with the student ID.
4. Student tab bar must show 5 tabs: 홈, 숙제, 오답노트, 강의자료, 내정보.
5. Student `homework.tsx` must show an "AI 학습분석" entry point button/banner.
6. When a student submits an incorrect answer, the wrong note store must automatically add an entry.
7. Submission data accumulation must trigger analytics recalculation.
8. Parent dashboard must read the linked child's analytics data from `analyticsStore`.

### 2.2 Non-Functional
- No circular dependencies between stores (use subscribe pattern).
- All navigation must animate with `slide_from_right` (already set in root `_layout.tsx`).
- Existing screens must not break; this section only adds/modifies, never removes.

---

## 3. Dependencies

### 3.1 Section Dependencies (ALL required)

| Section | What it provides | Used by this section |
|---------|-----------------|---------------------|
| 01 | Types (`UserRole`, `ProblemBankItem`, `WrongNote`, `StudentAnalytics`, etc.) | Type imports in modified files |
| 02 | Mock data & services (`MockWrongNoteService`, `MockAnalyticsService`) | Data flow connections |
| 03 | Zustand stores (`wrongNoteStore`, `analyticsStore`, `submissionStore`, `parentStore`, `authStore`) | Store subscriptions & reads |
| 04 | `app/(teacher)/problem-bank.tsx` screen | Navigation target from dashboard |
| 05 | `geminiAnalytics.ts` service | Analytics entry point from homework |
| 06 | `app/(teacher)/student-analytics.tsx`, `app/(student)/analytics.tsx` screens | Navigation targets |
| 07 | `app/(student)/wrong-notes.tsx` screen | New tab in student layout |
| 08 | AI helper integration in `solve.tsx` | Already done; this section completes remaining wiring |
| 09 | `app/(parent)/_layout.tsx` and parent screens | Routing target from `index.tsx` |

### 3.2 Package Dependency

```bash
npx expo install @react-native-async-storage/async-storage
```

This package is required by Zustand's `persist` middleware (used in Sections 03-09). Run this command before beginning implementation if not already installed.

**Verification**: After installation, confirm the package appears in `package.json` dependencies:
```json
"@react-native-async-storage/async-storage": "..."
```

---

## 4. Files to Modify

Below is the complete list of every file that must be created or modified in this section, along with the exact changes required.

### 4.1 `app/index.tsx` -- Add parent role routing

**Current state** (lines 13-16):
```typescript
if (isAuthenticated && user) {
  if (user.role === 'teacher' || user.role === 'admin') {
    router.replace('/(teacher)');
  } else {
    router.replace('/(student)');
  }
```

**Replace the role-routing block with**:
```typescript
if (isAuthenticated && user) {
  if (user.role === 'teacher' || user.role === 'admin') {
    router.replace('/(teacher)');
  } else if (user.role === 'parent') {
    router.replace('/(parent)');
  } else {
    router.replace('/(student)');
  }
```

**Full modified file** (`app/index.tsx`):
```typescript
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

---

### 4.2 `app/(teacher)/_layout.tsx` -- Add hidden Stack screens for problem-bank and student-analytics

The teacher layout currently has 5 visible tabs and 1 hidden screen (`problem-extract`). We must add 2 more hidden screens so that Stack navigation can push to them from within the tab group.

**Current hidden screen** (lines 76-81):
```typescript
<Tabs.Screen
  name="problem-extract"
  options={{
    href: null,
  }}
/>
```

**Add after the `problem-extract` entry (before the closing `</Tabs>` tag)**:
```typescript
<Tabs.Screen
  name="problem-bank"
  options={{
    href: null,
  }}
/>
<Tabs.Screen
  name="student-analytics"
  options={{
    href: null,
  }}
/>
```

**Full modified file** (`app/(teacher)/_layout.tsx`):
```typescript
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tabletSizes } from '../../src/constants/theme';

export default function TeacherLayout() {
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
          title: '대시보드',
          tabBarLabel: '대시보드',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: '학생 관리',
          tabBarLabel: '학생 관리',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: '숙제 관리',
          tabBarLabel: '숙제 관리',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          title: '강의자료',
          tabBarLabel: '강의자료',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="folder-open" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grading"
        options={{
          title: '채점',
          tabBarLabel: '채점',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="check-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="problem-extract"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="problem-bank"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="student-analytics"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
```

**Why `href: null`**: In Expo Router, setting `href: null` on a `Tabs.Screen` hides it from the tab bar but still registers it as a valid route within the tab group. This allows `router.push('/(teacher)/problem-bank')` and `router.push('/(teacher)/student-analytics')` to work as Stack pushes that overlay on top of the current tab.

---

### 4.3 `app/(teacher)/index.tsx` -- Add "문제은행" and "학생분석" quick action buttons

The teacher dashboard already has a `QuickAction` component and a "빠른 작업" section with 4 buttons. We add 2 more buttons: "문제은행" and "학생분석".

**Locate the quickActionsGrid** (currently lines 118-139):
```typescript
<Text style={styles.sectionTitle}>빠른 작업</Text>
<View style={styles.quickActionsGrid}>
  <QuickAction
    title="새 숙제 만들기"
    icon="plus-circle"
    onPress={() => router.push('/(teacher)/assignments')}
  />
  <QuickAction
    title="학생 추가"
    icon="account-plus"
    onPress={() => router.push('/(teacher)/students')}
  />
  <QuickAction
    title="자료 업로드"
    icon="upload"
    onPress={() => router.push('/(teacher)/materials')}
  />
  <QuickAction
    title="채점하기"
    icon="pencil-box-multiple"
    onPress={() => router.push('/(teacher)/grading')}
  />
</View>
```

**Replace with** (adds 2 new QuickActions):
```typescript
<Text style={styles.sectionTitle}>빠른 작업</Text>
<View style={styles.quickActionsGrid}>
  <QuickAction
    title="새 숙제 만들기"
    icon="plus-circle"
    onPress={() => router.push('/(teacher)/assignments')}
  />
  <QuickAction
    title="문제은행"
    icon="database"
    onPress={() => router.push('/(teacher)/problem-bank')}
  />
  <QuickAction
    title="학생분석"
    icon="chart-line"
    onPress={() => router.push('/(teacher)/student-analytics')}
  />
  <QuickAction
    title="학생 추가"
    icon="account-plus"
    onPress={() => router.push('/(teacher)/students')}
  />
  <QuickAction
    title="자료 업로드"
    icon="upload"
    onPress={() => router.push('/(teacher)/materials')}
  />
  <QuickAction
    title="채점하기"
    icon="pencil-box-multiple"
    onPress={() => router.push('/(teacher)/grading')}
  />
</View>
```

**Full modified file** (`app/(teacher)/index.tsx`):
```typescript
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../src/components/common';
import { useAuthStore } from '../../src/stores/authStore';
import { colors, spacing, tabletSizes } from '../../src/constants/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Card style={{ ...styles.statCard, borderLeftColor: color, borderLeftWidth: 4 }}>
    <View style={styles.statContent}>
      <MaterialCommunityIcons name={icon as any} size={32} color={color} />
      <View style={styles.statText}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  </Card>
);

interface QuickActionProps {
  title: string;
  icon: string;
  onPress: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, icon, onPress }) => (
  <Card style={styles.quickAction} onPress={onPress}>
    <View style={styles.quickActionContent}>
      <MaterialCommunityIcons name={icon as any} size={28} color={colors.primary} />
      <Text style={styles.quickActionText}>{title}</Text>
    </View>
  </Card>
);

export default function TeacherDashboard() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  // Mock 데이터
  const stats = {
    totalStudents: 24,
    pendingAssignments: 5,
    submissionsToGrade: 12,
    todayClasses: 3,
  };

  const recentSubmissions = [
    { id: '1', studentName: '김철수', assignment: '이차방정식 연습', time: '10분 전' },
    { id: '2', studentName: '이영희', assignment: '이차방정식 연습', time: '25분 전' },
    { id: '3', studentName: '박민수', assignment: '함수의 극한', time: '1시간 전' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar.Text
            size={48}
            label={user?.name?.charAt(0) || 'T'}
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>안녕하세요, {user?.name || '선생님'}!</Text>
            <Text style={styles.subGreeting}>오늘도 좋은 하루 되세요</Text>
          </View>
        </View>
        <IconButton
          icon="logout"
          size={24}
          onPress={handleLogout}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>오늘의 현황</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="전체 학생"
            value={stats.totalStudents}
            icon="account-group"
            color={colors.primary}
          />
          <StatCard
            title="진행중 숙제"
            value={stats.pendingAssignments}
            icon="clipboard-clock"
            color={colors.warning}
          />
          <StatCard
            title="채점 대기"
            value={stats.submissionsToGrade}
            icon="check-circle-outline"
            color={colors.error}
          />
          <StatCard
            title="오늘 수업"
            value={stats.todayClasses}
            icon="calendar-today"
            color={colors.success}
          />
        </View>

        <Text style={styles.sectionTitle}>빠른 작업</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="새 숙제 만들기"
            icon="plus-circle"
            onPress={() => router.push('/(teacher)/assignments')}
          />
          <QuickAction
            title="문제은행"
            icon="database"
            onPress={() => router.push('/(teacher)/problem-bank')}
          />
          <QuickAction
            title="학생분석"
            icon="chart-line"
            onPress={() => router.push('/(teacher)/student-analytics')}
          />
          <QuickAction
            title="학생 추가"
            icon="account-plus"
            onPress={() => router.push('/(teacher)/students')}
          />
          <QuickAction
            title="자료 업로드"
            icon="upload"
            onPress={() => router.push('/(teacher)/materials')}
          />
          <QuickAction
            title="채점하기"
            icon="pencil-box-multiple"
            onPress={() => router.push('/(teacher)/grading')}
          />
        </View>

        <Text style={styles.sectionTitle}>최근 제출</Text>
        {recentSubmissions.map((submission) => (
          <Card key={submission.id} style={styles.submissionCard}>
            <View style={styles.submissionContent}>
              <Avatar.Text
                size={40}
                label={submission.studentName.charAt(0)}
                style={styles.submissionAvatar}
              />
              <View style={styles.submissionInfo}>
                <Text style={styles.submissionStudent}>{submission.studentName}</Text>
                <Text style={styles.submissionAssignment}>{submission.assignment}</Text>
              </View>
              <Text style={styles.submissionTime}>{submission.time}</Text>
            </View>
          </Card>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  headerInfo: {
    marginLeft: spacing.md,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subGreeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 12,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: spacing.md,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statTitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    minWidth: 140,
  },
  quickActionContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  quickActionText: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  submissionCard: {
    marginVertical: spacing.xs,
  },
  submissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submissionAvatar: {
    backgroundColor: colors.secondary,
  },
  submissionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  submissionStudent: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  submissionAssignment: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  submissionTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
});
```

---

### 4.4 `app/(teacher)/students.tsx` -- Add click handler to navigate to student-analytics

The current `renderStudent` function wraps the student info in a `<Card>` but has no `onPress` handler. We must add navigation so that clicking a student card opens the student-analytics screen with the student's ID.

**Add `router` import** at the top (it is not currently imported):
```typescript
import { router } from 'expo-router';
```

**Modify the `renderStudent` function**. Change the `<Card>` to include an `onPress` prop:

**Current** (line 43):
```typescript
<Card style={styles.studentCard}>
```

**Replace with**:
```typescript
<Card
  style={styles.studentCard}
  onPress={() => router.push(`/(teacher)/student-analytics?studentId=${item.id}`)}
>
```

**Full modified `renderStudent` function**:
```typescript
const renderStudent = ({ item }: { item: Student }) => {
  const completionRate = Math.round((item.completedAssignments / item.totalAssignments) * 100);

  return (
    <Card
      style={styles.studentCard}
      onPress={() => router.push(`/(teacher)/student-analytics?studentId=${item.id}`)}
    >
      <View style={styles.studentContent}>
        <Avatar.Text
          size={50}
          label={item.name.charAt(0)}
          style={styles.avatar}
        />
        <View style={styles.studentInfo}>
          <View style={styles.studentHeader}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Chip compact style={styles.gradeChip}>{item.grade}</Chip>
          </View>
          <Text style={styles.studentEmail}>{item.email}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
            </View>
            <Text style={styles.progressText}>
              숙제 완료: {item.completedAssignments}/{item.totalAssignments}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>
    </Card>
  );
};
```

**Full modified file** (`app/(teacher)/students.tsx`):
```typescript
import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Avatar, Searchbar, FAB, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../src/components/common';
import { colors, spacing } from '../../src/constants/theme';
import { Grade } from '../../src/types';

interface Student {
  id: string;
  name: string;
  grade: Grade;
  email: string;
  phone: string;
  completedAssignments: number;
  totalAssignments: number;
}

const mockStudents: Student[] = [
  { id: '1', name: '김철수', grade: '고1', email: 'kim@test.com', phone: '010-1234-5678', completedAssignments: 8, totalAssignments: 10 },
  { id: '2', name: '이영희', grade: '고1', email: 'lee@test.com', phone: '010-2345-6789', completedAssignments: 10, totalAssignments: 10 },
  { id: '3', name: '박민수', grade: '고2', email: 'park@test.com', phone: '010-3456-7890', completedAssignments: 7, totalAssignments: 10 },
  { id: '4', name: '정수진', grade: '중3', email: 'jung@test.com', phone: '010-4567-8901', completedAssignments: 9, totalAssignments: 10 },
  { id: '5', name: '최동욱', grade: '고1', email: 'choi@test.com', phone: '010-5678-9012', completedAssignments: 5, totalAssignments: 10 },
];

export default function StudentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');

  const grades: (Grade | 'all')[] = ['all', '중1', '중2', '중3', '고1', '고2', '고3'];

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const renderStudent = ({ item }: { item: Student }) => {
    const completionRate = Math.round((item.completedAssignments / item.totalAssignments) * 100);

    return (
      <Card
        style={styles.studentCard}
        onPress={() => router.push(`/(teacher)/student-analytics?studentId=${item.id}`)}
      >
        <View style={styles.studentContent}>
          <Avatar.Text
            size={50}
            label={item.name.charAt(0)}
            style={styles.avatar}
          />
          <View style={styles.studentInfo}>
            <View style={styles.studentHeader}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Chip compact style={styles.gradeChip}>{item.grade}</Chip>
            </View>
            <Text style={styles.studentEmail}>{item.email}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
              </View>
              <Text style={styles.progressText}>
                숙제 완료: {item.completedAssignments}/{item.totalAssignments}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>학생 관리</Text>
        <Text style={styles.subtitle}>총 {filteredStudents.length}명</Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="학생 이름 검색"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={grades}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              selected={selectedGrade === item}
              onPress={() => setSelectedGrade(item)}
              style={styles.filterChip}
              showSelectedCheck={false}
            >
              {item === 'all' ? '전체' : item}
            </Chip>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderStudent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: 학생 추가 모달
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  searchbar: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
  },
  filterContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
  },
  studentCard: {
    marginBottom: spacing.md,
  },
  studentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: colors.primary,
  },
  studentInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  gradeChip: {
    backgroundColor: colors.primaryLight,
  },
  studentEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 100,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
});
```

**Key changes summary**:
1. Added `import { router } from 'expo-router';`
2. Added `import { MaterialCommunityIcons } from '@expo/vector-icons';`
3. Added `onPress` handler to `<Card>` in `renderStudent`
4. Added chevron-right icon at the end of student card content to indicate navigability

---

### 4.5 `app/(student)/_layout.tsx` -- Add "오답노트" tab (4 tabs --> 5 tabs)

The student layout currently has 4 tabs: 홈, 숙제, 강의자료, 내정보. We insert an "오답노트" tab between 숙제 and 강의자료 (position 3 of 5).

**Add the following `<Tabs.Screen>` after the "homework" tab and before the "materials" tab**:

```typescript
<Tabs.Screen
  name="wrong-notes"
  options={{
    title: '오답노트',
    tabBarLabel: '오답노트',
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="book-alert" size={size} color={color} />
    ),
  }}
/>
```

**Also add a hidden screen for the analytics page** (accessed from homework.tsx):
```typescript
<Tabs.Screen
  name="analytics"
  options={{
    href: null,
  }}
/>
```

**Full modified file** (`app/(student)/_layout.tsx`):
```typescript
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tabletSizes } from '../../src/constants/theme';

export default function StudentLayout() {
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
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="homework"
        options={{
          title: '숙제',
          tabBarLabel: '숙제',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wrong-notes"
        options={{
          title: '오답노트',
          tabBarLabel: '오답노트',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-alert" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          title: '강의자료',
          tabBarLabel: '강의자료',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="folder-open" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '내정보',
          tabBarLabel: '내정보',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="solve"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
```

**Important note about `solve.tsx`**: The `solve` screen already existed but was not explicitly listed as a `Tabs.Screen` with `href: null` in the original layout. Expo Router auto-discovers files in the directory, but for clarity and to prevent the `solve` screen from appearing as a tab, we explicitly add it with `href: null`. If this causes a "duplicate route" error, it means Expo Router already handles it implicitly and the `solve` entry can be omitted; test this during implementation.

---

### 4.6 `app/(student)/homework.tsx` -- Add AI analysis entry point

The homework screen currently shows a list of assignments. We add a banner card at the top that navigates to the student analytics screen.

**Add `router` import** -- already imported (line 5).

**Add a banner component above the FlatList** (between the filter chips and the list). Insert the following JSX after the closing `</View>` of `filterContainer` and before `<FlatList`:

```typescript
{/* AI 학습분석 진입 배너 */}
<View style={styles.aiBannerContainer}>
  <Card
    style={styles.aiBanner}
    onPress={() => router.push('/(student)/analytics')}
  >
    <View style={styles.aiBannerContent}>
      <View style={styles.aiBannerLeft}>
        <View style={styles.aiBannerIconContainer}>
          <MaterialCommunityIcons name="brain" size={28} color={colors.secondary} />
        </View>
        <View style={styles.aiBannerTextContainer}>
          <Text style={styles.aiBannerTitle}>AI 학습분석</Text>
          <Text style={styles.aiBannerSubtitle}>내 취약점 분석 & 맞춤 문제 추천</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </View>
  </Card>
</View>
```

**Add the corresponding styles**:
```typescript
aiBannerContainer: {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
},
aiBanner: {
  borderLeftWidth: 4,
  borderLeftColor: colors.secondary,
},
aiBannerContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
aiBannerLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
aiBannerIconContainer: {
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: colors.secondaryLight + '20',
  justifyContent: 'center',
  alignItems: 'center',
},
aiBannerTextContainer: {
  marginLeft: spacing.md,
  flex: 1,
},
aiBannerTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: colors.textPrimary,
},
aiBannerSubtitle: {
  fontSize: 13,
  color: colors.textSecondary,
  marginTop: 2,
},
```

**Full modified file** (`app/(student)/homework.tsx`):
```typescript
import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Chip, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../src/components/common';
import { colors, spacing } from '../../src/constants/theme';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  problemCount: number;
  completedCount: number;
  status: 'in_progress' | 'completed' | 'not_started';
}

const mockAssignments: Assignment[] = [
  {
    id: '1',
    title: '이차방정식 연습',
    subject: '방정식과 부등식',
    dueDate: '2024-12-25',
    problemCount: 10,
    completedCount: 7,
    status: 'in_progress',
  },
  {
    id: '2',
    title: '삼각함수 그래프',
    subject: '수학I - 삼각함수',
    dueDate: '2024-12-26',
    problemCount: 8,
    completedCount: 8,
    status: 'completed',
  },
  {
    id: '3',
    title: '함수의 극한',
    subject: '수학II - 함수의 극한',
    dueDate: '2024-12-28',
    problemCount: 12,
    completedCount: 0,
    status: 'not_started',
  },
  {
    id: '4',
    title: '미분계수',
    subject: '수학II - 미분',
    dueDate: '2024-12-30',
    problemCount: 15,
    completedCount: 3,
    status: 'in_progress',
  },
];

export default function HomeworkScreen() {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all');

  const filteredAssignments = mockAssignments.filter(
    (a) => filter === 'all' || a.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return colors.warning;
      case 'completed':
        return colors.success;
      case 'not_started':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '진행중';
      case 'completed':
        return '완료';
      case 'not_started':
        return '시작전';
      default:
        return status;
    }
  };

  const renderAssignment = ({ item }: { item: Assignment }) => {
    const progress = item.completedCount / item.problemCount;

    return (
      <Card
        style={styles.assignmentCard}
        onPress={() => router.push(`/(student)/solve?assignmentId=${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{item.title}</Text>
            <Chip
              compact
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
              textStyle={{ color: getStatusColor(item.status), fontSize: 12 }}
            >
              {getStatusText(item.status)}
            </Chip>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </View>

        <Text style={styles.subject}>{item.subject}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="file-document" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.problemCount}문제</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
            <Text style={styles.metaText}>마감: {item.dueDate}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>진행률</Text>
            <Text style={styles.progressValue}>
              {item.completedCount}/{item.problemCount} ({Math.round(progress * 100)}%)
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            color={progress === 1 ? colors.success : colors.primary}
            style={styles.progressBar}
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>숙제 목록</Text>
        <Text style={styles.headerSubtitle}>총 {filteredAssignments.length}개</Text>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'in_progress', 'not_started', 'completed'] as const).map((status) => (
          <Chip
            key={status}
            selected={filter === status}
            onPress={() => setFilter(status)}
            style={styles.filterChip}
            showSelectedCheck={false}
          >
            {status === 'all' ? '전체' : getStatusText(status)}
          </Chip>
        ))}
      </View>

      {/* AI 학습분석 진입 배너 */}
      <View style={styles.aiBannerContainer}>
        <Card
          style={styles.aiBanner}
          onPress={() => router.push('/(student)/analytics')}
        >
          <View style={styles.aiBannerContent}>
            <View style={styles.aiBannerLeft}>
              <View style={styles.aiBannerIconContainer}>
                <MaterialCommunityIcons name="brain" size={28} color={colors.secondary} />
              </View>
              <View style={styles.aiBannerTextContainer}>
                <Text style={styles.aiBannerTitle}>AI 학습분석</Text>
                <Text style={styles.aiBannerSubtitle}>내 취약점 분석 & 맞춤 문제 추천</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </View>
        </Card>
      </View>

      <FlatList
        data={filteredAssignments}
        keyExtractor={(item) => item.id}
        renderItem={renderAssignment}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: spacing.xs,
  },
  // AI 학습분석 배너
  aiBannerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  aiBanner: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiBannerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiBannerTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  aiBannerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // 숙제 목록
  listContent: {
    padding: spacing.lg,
  },
  assignmentCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusChip: {},
  subject: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});
```

---

### 4.7 `src/stores/dataFlowConnector.ts` -- NEW FILE: Cross-store data flow connections

This file sets up the event-based subscriptions that connect stores without creating circular dependencies. It must be imported once at app startup (in `app/_layout.tsx`).

**Create file**: `src/stores/dataFlowConnector.ts`

```typescript
/**
 * dataFlowConnector.ts
 *
 * Sets up cross-store subscriptions for data flow:
 *   1. submissionStore → wrongNoteStore: auto-add incorrect submissions as wrong notes
 *   2. submissionStore → analyticsStore: recalculate analytics when submissions accumulate
 *   3. analyticsStore → parentStore: parent dashboard reads child analytics (pull-based, no subscription needed)
 *
 * IMPORTANT: This file must be imported once at app startup.
 * It uses Zustand's subscribe() to avoid circular store imports.
 */

import { useSubmissionStore } from './submissionStore';
import { useWrongNoteStore } from './wrongNoteStore';
import { useAnalyticsStore } from './analyticsStore';

let isInitialized = false;

export function initializeDataFlowConnections(): void {
  if (isInitialized) return;
  isInitialized = true;

  // ─────────────────────────────────────────────────────────
  // Connection 1: Submission → WrongNote auto-add
  // ─────────────────────────────────────────────────────────
  // When a new submission is added to submissionStore and it is incorrect,
  // automatically add it to wrongNoteStore.
  //
  // We subscribe to the submissions array length. When it increases,
  // we check the latest submission(s) for incorrect answers.

  let previousSubmissionCount = useSubmissionStore.getState().submissions?.length ?? 0;

  useSubmissionStore.subscribe((state) => {
    const currentCount = state.submissions?.length ?? 0;

    if (currentCount > previousSubmissionCount) {
      // New submissions were added
      const newSubmissions = (state.submissions ?? []).slice(previousSubmissionCount);

      for (const submission of newSubmissions) {
        // Check if the answer is incorrect
        // A submission is "incorrect" if:
        //   - it has been graded (score is defined)
        //   - score is less than full points (or isCorrect === false if that field exists)
        const isIncorrect =
          submission.score !== undefined &&
          submission.score !== null &&
          submission.score < (submission.maxScore ?? submission.points ?? 100);

        if (isIncorrect) {
          try {
            useWrongNoteStore.getState().addFromSubmission(submission);
          } catch (error) {
            console.warn('[DataFlow] Failed to add wrong note from submission:', error);
          }
        }
      }
    }

    previousSubmissionCount = currentCount;
  });

  // ─────────────────────────────────────────────────────────
  // Connection 2: Submission accumulation → Analytics recalculation
  // ─────────────────────────────────────────────────────────
  // When 5+ new submissions accumulate since the last analysis,
  // mark analytics as stale so it recalculates on next view.

  let submissionCountAtLastAnalysis = useSubmissionStore.getState().submissions?.length ?? 0;

  useSubmissionStore.subscribe((state) => {
    const currentCount = state.submissions?.length ?? 0;
    const newSinceLastAnalysis = currentCount - submissionCountAtLastAnalysis;

    if (newSinceLastAnalysis >= 5) {
      try {
        useAnalyticsStore.getState().markStale();
        submissionCountAtLastAnalysis = currentCount;
      } catch (error) {
        console.warn('[DataFlow] Failed to mark analytics as stale:', error);
      }
    }
  });

  console.log('[DataFlow] Cross-store data flow connections initialized');
}

/**
 * Reset the connector state (useful for testing or logout).
 */
export function resetDataFlowConnections(): void {
  isInitialized = false;
}
```

**Important implementation notes**:
- The `addFromSubmission` method must exist on `wrongNoteStore` (created in Section 07). If Section 07 used a different method name, update the call accordingly.
- The `markStale` method must exist on `analyticsStore` (created in Section 06). It should set a flag that causes the next analytics screen visit to trigger a fresh analysis.
- Both stores' method names depend on Sections 03/06/07. Verify the exact method names before implementing.
- If the store shapes differ from what is assumed here (e.g., `submissions` is not a flat array, or `score`/`maxScore` fields are named differently), adjust the subscription logic to match the actual types from Section 01.

---

### 4.8 `app/_layout.tsx` -- Import and initialize data flow connector

**Add the import and initialization call** at the top level of the root layout.

**Add these lines at the top of the file** (after existing imports):
```typescript
import { initializeDataFlowConnections } from '../src/stores/dataFlowConnector';
```

**Add the initialization call inside the component**, before the return statement:
```typescript
React.useEffect(() => {
  initializeDataFlowConnections();
}, []);
```

**Full modified file** (`app/_layout.tsx`):
```typescript
import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { theme } from '../src/constants/theme';
import { initializeDataFlowConnections } from '../src/stores/dataFlowConnector';

export default function RootLayout() {
  React.useEffect(() => {
    initializeDataFlowConnections();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

---

### 4.9 Parent Dashboard Data Flow (Documentation only -- no additional file changes)

The parent dashboard (created in Section 09) already reads child data. The data flow works as follows and requires NO additional file changes beyond what is already specified:

```
Parent logs in → authStore has user.role === 'parent' and user.childrenIds
  ↓
app/index.tsx routes to /(parent) [Change 4.1]
  ↓
Parent dashboard (app/(parent)/index.tsx from Section 09) calls:
  parentStore.loadChildDashboard(childId)
    ↓
  parentStore internally reads:
    - analyticsStore.getStudentAnalytics(childId) → gets the child's analytics data
    - submissionStore.getStudentSubmissions(childId) → gets recent submissions
    - wrongNoteStore.getStudentWrongNotes(childId) → gets wrong note count
    ↓
  Returns ChildDashboard object with aggregated data
```

The key enabler is the data flow connector (4.7) which keeps `analyticsStore` fresh as submissions accumulate, so when the parent views the dashboard, the analytics data is up-to-date.

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SUBMISSION EVENT                          │
│  Student completes a problem in solve.tsx                    │
│  → submissionStore.addSubmission(submission)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
           ┌─────────────┴──────────────┐
           │                            │
           ▼                            ▼
┌─────────────────────┐    ┌──────────────────────────┐
│  Wrong Note Auto-Add │    │  Analytics Staleness Check │
│                     │    │                          │
│  If submission is   │    │  If 5+ new submissions   │
│  incorrect:         │    │  since last analysis:    │
│  wrongNoteStore     │    │  analyticsStore          │
│  .addFromSubmission()│    │  .markStale()            │
└─────────────────────┘    └──────────────────────────┘
           │                            │
           ▼                            ▼
┌─────────────────────┐    ┌──────────────────────────┐
│  Wrong Notes Screen  │    │  Analytics Screen         │
│  (student)          │    │  (student/teacher/parent) │
│  Shows new wrong    │    │  On next visit, detects   │
│  notes immediately  │    │  stale → re-analyzes      │
└─────────────────────┘    └──────────────────────────┘
                                       │
                                       ▼
                           ┌──────────────────────────┐
                           │  Parent Dashboard         │
                           │  Reads child's analytics  │
                           │  via parentStore           │
                           └──────────────────────────┘
```

---

## 6. Navigation Map (After Integration)

### 6.1 Root Routing (`app/index.tsx`)

```
Splash Screen
  ├── role === 'teacher' || 'admin'  → /(teacher)
  ├── role === 'parent'              → /(parent)    [NEW]
  └── role === 'student'             → /(student)
```

### 6.2 Teacher Navigation

```
Tab Bar (5 visible tabs):
  ├── 대시보드 (index.tsx)
  │     ├── [Quick Action] "문제은행"  → problem-bank.tsx (Stack push)    [NEW]
  │     └── [Quick Action] "학생분석"  → student-analytics.tsx (Stack push) [NEW]
  ├── 학생 관리 (students.tsx)
  │     └── [Student Card tap]  → student-analytics.tsx?studentId=X (Stack push) [NEW]
  ├── 숙제 관리 (assignments.tsx)
  ├── 강의자료 (materials.tsx)
  └── 채점 (grading.tsx)

Hidden screens (href: null):
  ├── problem-extract.tsx (existing)
  ├── problem-bank.tsx (from Section 04)    [NEW in layout]
  └── student-analytics.tsx (from Section 06) [NEW in layout]
```

### 6.3 Student Navigation

```
Tab Bar (5 visible tabs):                          [CHANGED: was 4 tabs]
  ├── 홈 (index.tsx)
  ├── 숙제 (homework.tsx)
  │     └── [AI 학습분석 배너 tap]  → analytics.tsx (Stack push)  [NEW]
  ├── 오답노트 (wrong-notes.tsx) (from Section 07) [NEW TAB]
  ├── 강의자료 (materials.tsx)
  └── 내정보 (profile.tsx)

Hidden screens (href: null):
  ├── solve.tsx (existing)
  └── analytics.tsx (from Section 06)    [NEW in layout]
```

### 6.4 Parent Navigation (from Section 09, no changes needed)

```
Tab Bar (3 visible tabs):
  ├── 홈 (index.tsx) - Child dashboard
  ├── 스케줄 (schedule.tsx)
  └── 리포트 (report.tsx)
```

---

## 7. AsyncStorage Installation

**Run this command before starting any implementation work**:

```bash
npx expo install @react-native-async-storage/async-storage
```

This is required because:
- All Zustand stores from Section 03 use `persist` middleware with an AsyncStorage adapter
- Without this package, store persistence will fail silently or throw runtime errors

**After installation, verify**:
1. Check `package.json` has the dependency listed
2. Run `npx expo start` and confirm no module-not-found errors
3. On iOS, run `npx pod-install` if using bare workflow (not needed for Expo managed)

---

## 8. Implementation Order

Execute changes in this order to minimize errors:

1. **Install AsyncStorage** (Section 7 above)
2. **`app/index.tsx`** (Section 4.1) -- Parent routing
3. **`app/_layout.tsx`** (Section 4.8) -- Data flow connector import
4. **`src/stores/dataFlowConnector.ts`** (Section 4.7) -- Create new file
5. **`app/(teacher)/_layout.tsx`** (Section 4.2) -- Add hidden screens
6. **`app/(teacher)/index.tsx`** (Section 4.3) -- Dashboard quick actions
7. **`app/(teacher)/students.tsx`** (Section 4.4) -- Student card navigation
8. **`app/(student)/_layout.tsx`** (Section 4.5) -- Add wrong-notes tab + hidden analytics
9. **`app/(student)/homework.tsx`** (Section 4.6) -- AI analysis banner

---

## 9. Store Method Requirements

The data flow connector (Section 4.7) depends on specific methods existing on the stores created in previous sections. Verify these methods exist before implementing:

### 9.1 `submissionStore` (from Section 03)
- **State**: `submissions: Submission[]` (or similar array)
- **Used by connector**: `useSubmissionStore.getState().submissions` -- reads the array
- **Subscribe**: `useSubmissionStore.subscribe(callback)` -- watches for changes

### 9.2 `wrongNoteStore` (from Section 03/07)
- **Method needed**: `addFromSubmission(submission: Submission): void`
  - Creates a WrongNote entry from a submission
  - Should extract: `problemId`, `studentAnswer`, `correctAnswer`, `problem` reference
  - Should set: `reviewCount: 0`, `isLearned: false`, `lastReviewDate: null`
  - Should be idempotent (skip if a wrong note for the same problemId+studentId already exists)

If this method does not exist in Section 07, add it:
```typescript
addFromSubmission: (submission: Submission) => {
  const { wrongNotes } = get();
  // Skip if already exists
  const exists = wrongNotes.some(
    (wn) => wn.problemId === submission.problemId && wn.studentId === submission.studentId
  );
  if (exists) return;

  const newWrongNote: WrongNote = {
    id: `wn-${Date.now()}`,
    problemId: submission.problemId,
    studentId: submission.studentId,
    studentAnswer: submission.textAnswer || '',
    correctAnswer: '', // Will be populated from problem data
    problem: null, // Will be populated from problemBankStore
    reviewCount: 0,
    isLearned: false,
    lastReviewDate: null,
    createdAt: new Date(),
  };

  set({ wrongNotes: [...wrongNotes, newWrongNote] });
},
```

### 9.3 `analyticsStore` (from Section 03/06)
- **Method needed**: `markStale(): void`
  - Sets a flag indicating the analytics data needs to be recalculated
  - Example implementation:
```typescript
markStale: () => {
  set({ isStale: true, lastAnalyzedAt: null });
},
```

### 9.4 `parentStore` (from Section 03/09)
- **Method needed**: `loadChildDashboard(childId: string): Promise<ChildDashboard>`
  - Reads from `analyticsStore`, `submissionStore`, `wrongNoteStore`
  - Aggregates data into a `ChildDashboard` object
  - Already implemented in Section 09; no changes needed here

---

## 10. Acceptance Criteria

### 10.1 Routing & Navigation
- [ ] Logging in as `parent@test.com` / `123456` routes to the `(parent)` group
- [ ] Logging in as `teacher@test.com` / `123456` still routes to `(teacher)` group
- [ ] Logging in as `student@test.com` / `123456` still routes to `(student)` group
- [ ] Teacher dashboard shows 6 quick action buttons (4 original + "문제은행" + "학생분석")
- [ ] Tapping "문제은행" on teacher dashboard navigates to `problem-bank.tsx`
- [ ] Tapping "학생분석" on teacher dashboard navigates to `student-analytics.tsx`
- [ ] Tapping a student card in `students.tsx` navigates to `student-analytics.tsx?studentId=X`
- [ ] Student tab bar shows 5 tabs: 홈, 숙제, 오답노트, 강의자료, 내정보
- [ ] Tapping "오답노트" tab navigates to the wrong-notes screen
- [ ] Student homework screen shows the "AI 학습분석" banner card
- [ ] Tapping the AI banner navigates to the analytics screen
- [ ] Back navigation from all stack-pushed screens returns to the originating tab

### 10.2 Data Flow
- [ ] When a student submits an incorrect answer, a new wrong note appears in the wrong notes screen
- [ ] Correct submissions do NOT create wrong notes
- [ ] Duplicate wrong notes are not created for the same problem+student combination
- [ ] After 5+ new submissions, the analytics store is marked as stale
- [ ] When the analytics screen is visited after being marked stale, it triggers re-analysis
- [ ] Parent dashboard displays up-to-date analytics data for the linked child

### 10.3 AsyncStorage
- [ ] `@react-native-async-storage/async-storage` appears in `package.json`
- [ ] App starts without AsyncStorage-related errors
- [ ] Store data persists across app restarts

### 10.4 No Regressions
- [ ] All existing teacher screens (dashboard, students, assignments, materials, grading, problem-extract) still work
- [ ] All existing student screens (home, homework, solve, materials, profile) still work
- [ ] Login/logout flow works correctly for all 3 roles
- [ ] Tab bar styling is consistent across teacher (5 tabs), student (5 tabs), and parent (3 tabs)
- [ ] No TypeScript compilation errors
- [ ] No console errors on app startup related to missing routes or undefined stores

---

## 11. Troubleshooting

### Problem: "Route not found" when pushing to problem-bank or student-analytics
**Cause**: The `.tsx` file does not exist in the `app/(teacher)/` directory.
**Fix**: Verify that Section 04 created `app/(teacher)/problem-bank.tsx` and Section 06 created `app/(teacher)/student-analytics.tsx`.

### Problem: "Route not found" when pushing to wrong-notes or analytics from student screens
**Cause**: The `.tsx` file does not exist in the `app/(student)/` directory.
**Fix**: Verify that Section 07 created `app/(student)/wrong-notes.tsx` and Section 06 created `app/(student)/analytics.tsx`.

### Problem: Tab bar shows extra or unexpected tabs
**Cause**: Expo Router auto-discovers all `.tsx` files in a tab directory and creates tabs for them.
**Fix**: Ensure all non-tab screens (like `solve.tsx`, `problem-bank.tsx`, `student-analytics.tsx`, `analytics.tsx`) have a corresponding `<Tabs.Screen name="..." options={{ href: null }} />` entry in the layout to hide them from the tab bar.

### Problem: Data flow connector methods not found (`addFromSubmission`, `markStale`)
**Cause**: Previous sections used different method names.
**Fix**: Check the actual store implementations from Sections 03/06/07 and update `dataFlowConnector.ts` to use the correct method names.

### Problem: AsyncStorage errors on startup
**Cause**: Package not installed or native modules not linked.
**Fix**: Run `npx expo install @react-native-async-storage/async-storage` again. For bare workflow, run `npx pod-install` on iOS.

### Problem: Circular dependency warnings in console
**Cause**: Store files importing each other directly.
**Fix**: The `dataFlowConnector.ts` pattern avoids this by using `subscribe()` callbacks instead of direct imports between stores. If you see circular dependency warnings, ensure no store file imports another store file directly; always go through the connector.
