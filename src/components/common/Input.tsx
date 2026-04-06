import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, tabletSizes, borderRadius } from '../../constants/theme';

type ValidationState = 'none' | 'valid' | 'invalid';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: boolean;
  errorText?: string;
  disabled?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
  validationState?: ValidationState;
  helperText?: string;
  accessibilityLabel?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = false,
  errorText,
  disabled = false,
  left,
  right,
  style,
  multiline = false,
  numberOfLines = 1,
  validationState = 'none',
  helperText,
  accessibilityLabel,
}) => {
  const rightIcon =
    right ??
    (validationState === 'valid' ? (
      <TextInput.Icon
        icon={() => (
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
        )}
      />
    ) : validationState === 'invalid' ? (
      <TextInput.Icon
        icon={() => (
          <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
        )}
      />
    ) : undefined);

  return (
    <>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        error={error}
        disabled={disabled}
        left={left}
        right={rightIcon}
        style={[styles.input, style]}
        outlineStyle={styles.outline}
        contentStyle={styles.content}
        multiline={multiline}
        numberOfLines={numberOfLines}
        accessibilityLabel={accessibilityLabel}
      />
      {(errorText || helperText) && (
        <HelperText type={error ? 'error' : 'info'} visible={!!(errorText || helperText)}>
          {errorText || helperText}
        </HelperText>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    fontFamily: 'NotoSansKR-Regular',
  },
  outline: {
    borderRadius: borderRadius.lg,
  },
  content: {
    minHeight: tabletSizes.inputHeight,
    fontFamily: 'NotoSansKR-Regular',
  },
});
