/** Text field with label + error helper. The design has no floating labels. */
import React from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { colors, MIN_TAP, radius, spacing, typography } from '../theme';
import { Text } from './Text';

export type InputProps = TextInputProps & { label?: string; error?: string | null; helper?: string };

export function Input({ label, error, helper, style, ...rest }: InputProps) {
  return (
    <View style={{ gap: spacing.s6 }}>
      {label ? <Text variant="bodyBold" color={colors.textSecondary}>{label}</Text> : null}
      <TextInput
        {...rest}
        placeholderTextColor={colors.textTertiary}
        style={[
          {
            minHeight: MIN_TAP,
            borderRadius: radius.m,
            borderWidth: 1,
            borderColor: error ? colors.error100 : colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.s12,
            color: colors.textPrimary,
            // Never hardcode a face; take it from the ramp so the FONTS_BUNDLED switch applies.
            ...typography.bodyLarge,
          },
          style,
        ]}
      />
      {error ? <Text variant="meta" color={colors.error100}>{error}</Text>
        : helper ? <Text variant="meta" color={colors.textTertiary}>{helper}</Text> : null}
    </View>
  );
}
