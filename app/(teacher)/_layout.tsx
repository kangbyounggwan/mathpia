import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, roleColors, spacing, borderRadius, shadows } from '../../src/constants/theme';

const ACCENT = roleColors.teacher.accent;
const TAB_ICON_SIZE = 26;

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: ACCENT + '14' }]}>
      <MaterialCommunityIcons name={name as any} size={TAB_ICON_SIZE} color={color} />
    </View>
  );
}

export default function TeacherLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '대시보드',
          tabBarLabel: '대시보드',
          tabBarIcon: ({ color, focused }) => <TabIcon name="view-dashboard" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: '학생 관리',
          tabBarLabel: '학생 관리',
          tabBarIcon: ({ color, focused }) => <TabIcon name="account-group" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: '숙제 관리',
          tabBarLabel: '숙제 관리',
          tabBarIcon: ({ color, focused }) => <TabIcon name="clipboard-text" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="materials"
        options={{
          title: '강의자료',
          tabBarLabel: '강의자료',
          tabBarIcon: ({ color, focused }) => <TabIcon name="folder-open" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="grading"
        options={{
          title: '채점',
          tabBarLabel: '채점',
          tabBarIcon: ({ color, focused }) => <TabIcon name="check-circle" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen name="problem-extract" options={{ href: null }} />
      <Tabs.Screen name="problem-bank" options={{ href: null }} />
      <Tabs.Screen name="student-analytics" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    paddingBottom: 0,
    ...shadows.lg,
    ...Platform.select({
      android: { elevation: 8 },
      default: {},
    }),
  },
  tabLabel: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  tabItem: {
    paddingTop: 8,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
