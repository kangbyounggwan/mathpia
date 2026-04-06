import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { Platform, ViewStyle } from 'react-native';

// ============================================================
// Font Configuration (MD3 type scale with Noto Sans KR)
// ============================================================

const fontConfig = {
  displayLarge:   { fontFamily: 'NotoSansKR-Regular', fontSize: 57, fontWeight: '400' as const, lineHeight: 64 },
  displayMedium:  { fontFamily: 'NotoSansKR-Regular', fontSize: 45, fontWeight: '400' as const, lineHeight: 52 },
  displaySmall:   { fontFamily: 'NotoSansKR-Regular', fontSize: 36, fontWeight: '400' as const, lineHeight: 44 },
  headlineLarge:  { fontFamily: 'NotoSansKR-Bold',    fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  headlineMedium: { fontFamily: 'NotoSansKR-Bold',    fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  headlineSmall:  { fontFamily: 'NotoSansKR-Medium',  fontSize: 24, fontWeight: '500' as const, lineHeight: 32 },
  titleLarge:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 22, fontWeight: '500' as const, lineHeight: 28 },
  titleMedium:    { fontFamily: 'NotoSansKR-Medium',  fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  titleSmall:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  bodyLarge:      { fontFamily: 'NotoSansKR-Regular', fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium:     { fontFamily: 'NotoSansKR-Regular', fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall:      { fontFamily: 'NotoSansKR-Regular', fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  labelLarge:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  labelMedium:    { fontFamily: 'NotoSansKR-Medium',  fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  labelSmall:     { fontFamily: 'NotoSansKR-Medium',  fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
};

// ============================================================
// Semantic Typography Tokens
// ============================================================

export const typography = {
  heading1: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 32,
    lineHeight: 40,
  },
  heading2: {
    fontFamily: 'NotoSansKR-Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  heading3: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  labelSmall: {
    fontFamily: 'NotoSansKR-Medium',
    fontSize: 11,
    lineHeight: 16,
  },
} as const;

// ============================================================
// Color Palette
// ============================================================

export const colors = {
  primary: '#4A90D9',
  primaryLight: '#7AB3E8',
  primaryDark: '#2E6DB3',
  secondary: '#5C6BC0',
  secondaryLight: '#8E99D6',
  secondaryDark: '#3949AB',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#E8E8E8',
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  border: '#E0E0E0',
  divider: '#EEEEEE',
  // 캔버스 색상
  canvasBlack: '#212121',
  canvasBlue: '#1976D2',
  canvasRed: '#D32F2F',
  canvasGreen: '#388E3C',
  canvasYellow: '#FBC02D',
};

// ============================================================
// Role-Based Accent Colors
// ============================================================

export const roleColors = {
  teacher: {
    accent: '#5C6BC0',
    accentLight: '#8E99D6',
    accentDark: '#3949AB',
    accentSubtle: 'rgba(92, 107, 192, 0.08)',
    accentMuted: 'rgba(92, 107, 192, 0.16)',
  },
  student: {
    accent: '#4A90D9',
    accentLight: '#7AB3E8',
    accentDark: '#2E6DB3',
    accentSubtle: 'rgba(74, 144, 217, 0.08)',
    accentMuted: 'rgba(74, 144, 217, 0.16)',
  },
  parent: {
    accent: '#66BB6A',
    accentLight: '#A5D6A7',
    accentDark: '#388E3C',
    accentSubtle: 'rgba(102, 187, 106, 0.08)',
    accentMuted: 'rgba(102, 187, 106, 0.16)',
  },
} as const;

export type RoleColorKey = keyof typeof roleColors;

// ============================================================
// MD3 Theme
// ============================================================

export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    error: colors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: colors.textPrimary,
    onSurface: colors.textPrimary,
    onError: '#FFFFFF',
    outline: colors.border,
  },
  roundness: 12,
};

// ============================================================
// Spacing
// ============================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ============================================================
// Border Radius
// ============================================================

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ============================================================
// Shadow Tokens
// ============================================================

export const shadows: Record<string, ViewStyle> = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 12,
  },
};

// ============================================================
// Opacity Tokens
// ============================================================

export const opacity = {
  subtle: 0.08,
  muted: 0.16,
  medium: 0.38,
  high: 0.60,
  veryHigh: 0.80,
  full: 1.0,
} as const;

export function opacityToHex(value: number): string {
  const hex = Math.round(value * 255).toString(16).padStart(2, '0');
  return hex.toUpperCase();
}

// ============================================================
// Component Size Tokens
// ============================================================

export const sizes = {
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 40,

  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 64,

  iconContainerSm: 32,
  iconContainerMd: 40,
  iconContainerLg: 48,

  badgeSm: 20,
  badgeMd: 28,
  badgeLg: 36,

  progressRingSm: 44,
  progressRingMd: 64,
  progressRingLg: 88,

  buttonSm: 36,
  buttonMd: 44,
  buttonLg: 52,
} as const;

// ============================================================
// Chart Color Tokens
// ============================================================

export const chartColors = {
  primaryFill: 'rgba(74, 144, 217, 0.25)',
  primaryStroke: '#4A90D9',
  secondaryFill: 'rgba(92, 107, 192, 0.25)',
  secondaryStroke: '#5C6BC0',
  grid: '#E0E0E0',
  label: '#212121',
  valueLabel: '#757575',
  successFill: 'rgba(76, 175, 80, 0.25)',
  successStroke: '#4CAF50',
  warningFill: 'rgba(255, 152, 0, 0.25)',
  warningStroke: '#FF9800',
  errorFill: 'rgba(244, 67, 54, 0.25)',
  errorStroke: '#F44336',
  heatLow: '#E8F5E9',
  heatMid: '#FFF9C4',
  heatHigh: '#FFCDD2',
} as const;

// ============================================================
// Tablet-Optimized Sizes (existing, unchanged)
// ============================================================

// 태블릿 최적화 사이즈
export const tabletSizes = {
  minTouchTarget: 44,
  iconSize: 24,
  iconSizeLarge: 32,
  avatarSize: 48,
  avatarSizeLarge: 64,
  buttonHeight: 48,
  inputHeight: 56,
  toolbarHeight: 64,
  tabBarHeight: 72,
};
