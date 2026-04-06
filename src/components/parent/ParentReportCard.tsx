// ============================================================
// src/components/parent/ParentReportCard.tsx
// Parent-friendly learning summary card with status indicators
// ============================================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  opacity,
  opacityToHex,
  sizes,
} from '../../constants/theme';

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
    bgColor: colors.primaryLight + opacityToHex(opacity.subtle),
    label: '매우 우수',
    emoji: 'star-circle',
  },
  good: {
    color: colors.success,
    bgColor: colors.success + opacityToHex(opacity.subtle),
    label: '양호',
    emoji: 'check-circle',
  },
  average: {
    color: colors.warning,
    bgColor: colors.warning + opacityToHex(opacity.subtle),
    label: '보통',
    emoji: 'minus-circle',
  },
  needsWork: {
    color: colors.error,
    bgColor: colors.error + opacityToHex(opacity.subtle),
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
      {/* Header */}
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

      {/* Main value */}
      <View style={styles.mainValueSection}>
        <Text style={[styles.mainValue, { color: config.color }]}>
          {mainValue}
        </Text>
        <Text style={styles.mainLabel}>{mainLabel}</Text>
      </View>

      {/* Detail rows */}
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

      {/* Advice */}
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
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: sizes.iconContainerLg,
    height: sizes.iconContainerLg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
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
    ...typography.caption,
    fontFamily: 'NotoSansKR-Medium',
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
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 36,
    fontWeight: '700',
  },
  mainLabel: {
    fontFamily: 'NotoSansKR-Regular',
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
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.label,
    color: colors.textPrimary,
  },
  adviceSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.warning + opacityToHex(opacity.subtle),
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  adviceText: {
    flex: 1,
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
});
