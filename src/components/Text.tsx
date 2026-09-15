/**
 * The only text primitive. Variants come from the type ramp — there is no `fontSize` prop,
 * because a screen inventing a size is how a design system drifts.
 *
 * `includeFontPadding: false` is baked into every variant (see theme/typography.ts): without it
 * Lato's 1.54 line-height ratio sits 1-3px off on Android.
 */
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { colors, typography, type TypographyVariant } from '../theme';

export type AppTextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', color = colors.textPrimary, align, style, ...rest }: AppTextProps) {
  return <RNText {...rest} style={[typography[variant], { color }, align ? { textAlign: align } : null, style]} />;
}
