import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { sizes, borderRadius } from '../../constants/theme';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  onPress: () => void;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
  size?: ButtonSize;
  accessibilityLabel?: string;
}

const sizeConfig: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: sizes.buttonSm, paddingHorizontal: 12, fontSize: 13 },
  md: { height: sizes.buttonMd, paddingHorizontal: 16, fontSize: 15 },
  lg: { height: sizes.buttonLg, paddingHorizontal: 24, fontSize: 16 },
};

export const Button: React.FC<ButtonProps> = ({
  mode = 'contained',
  onPress,
  children,
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = false,
  size = 'md',
  accessibilityLabel,
}) => {
  const config = sizeConfig[size];

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      icon={icon}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        style,
      ]}
      contentStyle={{
        height: config.height,
        paddingHorizontal: config.paddingHorizontal,
      }}
      labelStyle={{
        fontFamily: 'NotoSansKR-Medium',
        fontSize: config.fontSize,
        fontWeight: '500',
      }}
    >
      {children}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
});
