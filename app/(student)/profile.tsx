import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { colors, spacing, typography, shadows, opacity, opacityToHex, sizes } from '../../src/constants/theme';

interface MenuItemProps {
  icon: string;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  iconColor = colors.textSecondary,
  label,
  value,
  onPress,
  showArrow = true,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} disabled={!onPress}>
    <View style={styles.menuItemLeft}>
      <View style={[styles.menuIconContainer, { backgroundColor: iconColor + opacityToHex(opacity.subtle) }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <View style={styles.menuItemRight}>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {showArrow && onPress && (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      )}
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* 프로필 헤더 */}
        <View style={styles.profileHeader}>
          <Avatar.Text
            size={80} // Profile hero avatar - larger than sizes.avatarLg
            label={user?.name?.charAt(0) || 'S'}
            style={styles.avatar}
            accessibilityLabel={`${user?.name || '학생'} 프로필 아바타`}
          />
          <Text style={styles.userName}>{user?.name || '학생'}</Text>
          <Text style={styles.userInfo}>{user?.grade || '고1'} | {user?.email || 'student@mathpia.com'}</Text>
        </View>

        {/* 학습 통계 */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>학습 통계</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>127</Text>
              <Text style={styles.statLabel}>풀은 문제</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>89%</Text>
              <Text style={styles.statLabel}>정답률</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>15</Text>
              <Text style={styles.statLabel}>연속 학습일</Text>
            </View>
          </View>
        </View>

        {/* 계정 정보 */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>계정 정보</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="account"
              iconColor={colors.primary}
              label="이름"
              value={user?.name || '학생'}
              showArrow={false}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="email"
              iconColor={colors.primary}
              label="이메일"
              value={user?.email || 'student@mathpia.com'}
              showArrow={false}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="school"
              iconColor={colors.primary}
              label="학년"
              value={user?.grade || '고1'}
              showArrow={false}
            />
          </View>
        </View>

        {/* 학원 정보 */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>학원 정보</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="domain"
              iconColor={colors.secondary}
              label="학원"
              value="수학왕 학원"
              showArrow={false}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="map-marker"
              iconColor={colors.secondary}
              label="지점"
              value="강남점"
              showArrow={false}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="account-tie"
              iconColor={colors.secondary}
              label="담당 선생님"
              value="김선생님"
              showArrow={false}
            />
          </View>
        </View>

        {/* 설정 */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>설정</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="bell-outline"
              iconColor={colors.warning}
              label="알림 설정"
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="lock-outline"
              iconColor={colors.warning}
              label="비밀번호 변경"
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="help-circle-outline"
              iconColor={colors.warning}
              label="도움말"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="로그아웃"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        {/* 버전 정보 */}
        <Text style={styles.versionText}>버전 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 100,
  },

  // 프로필 헤더
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  userName: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  userInfo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // 학습 통계
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...typography.heading3,
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  // 메뉴 섹션
  menuSection: {
    marginBottom: spacing.lg,
  },
  menuSectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: sizes.iconContainerSm,
    height: sizes.iconContainerSm,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  menuLabel: {
    ...typography.body,
    fontSize: 15,
    color: colors.textPrimary,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  menuValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 60,
  },

  // 로그아웃 버튼
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  logoutText: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.error,
  },

  // 버전 정보
  versionText: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
