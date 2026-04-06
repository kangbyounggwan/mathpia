import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, roleColors, spacing, borderRadius, shadows } from '../../src/constants/theme';

const ACCENT = roleColors.parent.accent;
const TAB_ICON_SIZE = 26;

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: ACCENT + '14' }]}>
      <MaterialCommunityIcons name={name as any} size={TAB_ICON_SIZE} color={color} />
    </View>
  );
}

export default function ParentLayout() {
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
          title: '홈',
          tabBarLabel: '홈',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home-heart" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: '스케줄',
          tabBarLabel: '스케줄',
          tabBarIcon: ({ color, focused }) => <TabIcon name="calendar-month" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: '리포트',
          tabBarLabel: '리포트',
          tabBarIcon: ({ color, focused }) => <TabIcon name="chart-line" color={color} focused={focused} />,
        }}
      />
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
