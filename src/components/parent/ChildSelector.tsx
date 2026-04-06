// ============================================================
// src/components/parent/ChildSelector.tsx
// Horizontal scrollable chip selector for switching between children
// ============================================================

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  opacity,
  opacityToHex,
} from '../../constants/theme';

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
  accentColor?: string;
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({
  children: childrenList,
  selectedChildId,
  onSelectChild,
  accentColor,
}) => {
  if (childrenList.length === 0) {
    return null;
  }

  const activeColor = accentColor ?? colors.primary;
  const activeColorLight = accentColor
    ? accentColor
    : colors.primaryLight;

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
                isSelected && [
                  styles.childChipSelected,
                  {
                    borderColor: activeColor,
                    backgroundColor: activeColorLight + opacityToHex(opacity.subtle),
                  },
                ],
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
                      { backgroundColor: activeColorLight + opacityToHex(opacity.muted) },
                      isSelected && { backgroundColor: activeColor },
                    ]}
                    color={isSelected ? colors.surface : activeColor}
                  />
                )}
              </View>
              <View style={styles.childInfo}>
                <Text
                  style={[
                    styles.childName,
                    isSelected && { color: activeColor },
                  ]}
                >
                  {child.name}
                </Text>
                {child.grade && (
                  <Text
                    style={[
                      styles.childGrade,
                      isSelected && { color: activeColor },
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
                  color={activeColor}
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
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 13,
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
    // borderColor and backgroundColor set dynamically via inline style
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatarContainerSelected: {},
  avatarIcon: {
    // backgroundColor set dynamically via inline style
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.textPrimary,
  },
  childGrade: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  checkIcon: {
    marginLeft: spacing.xs,
  },
});
