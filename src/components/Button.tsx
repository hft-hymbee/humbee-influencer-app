/**
 * Button. Sizes and variants only — no arbitrary style prop, and NOTHING SCALES ON PRESS
 * (design rule: no bounce, no spring, no transform on press). Press feedback is a colour change
 * at 120ms, which is what `activeOpacity`-free Pressable + a pressed background gives us.
 */
import React from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, MIN_TAP, radius, spacing } from '../theme';
import { Text } from './Text';
import { Icon, type IconName } from './Icon';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'text' | 'danger';
  size?: 'large' | 'medium';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label, onPress, variant = 'primary', size = 'large',
  disabled, loading, fullWidth, icon, style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const height = size === 'large' ? MIN_TAP : 40;

  const palette = (pressed: boolean) => {
    if (variant === 'primary') {
      return {
        bg: isDisabled ? colors.border : pressed ? colors.primary200 : colors.primary100,
        fg: isDisabled ? colors.textTertiary : colors.white,
        border: 'transparent',
      };
    }
    if (variant === 'outline') {
      return {
        bg: pressed ? colors.primary5 : colors.surface,
        fg: isDisabled ? colors.textTertiary : colors.primary100,
        // Spec 04 §3: the outline ring is chestnut at 50%, not 25%.
        border: colors.primary50a,
      };
    }
    if (variant === 'danger') {
      return {
        bg: pressed ? colors.error10 : colors.surface,
        fg: colors.error100,
        border: colors.error25,
      };
    }
    return { bg: pressed ? colors.primary5 : 'transparent', fg: colors.primary100, border: 'transparent' };
  };

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      accessibilityLabel={label}
      style={({ pressed }) => {
        const p = palette(pressed);
        return [
          {
            height,
            minHeight: MIN_TAP,
            borderRadius: radius.m,
            backgroundColor: p.bg,
            borderWidth: variant === 'outline' || variant === 'danger' ? 1 : 0,
            borderColor: p.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.s,
            paddingHorizontal: spacing.m,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
          },
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const p = palette(pressed);
        return (
          <>
            {loading ? <ActivityIndicator size="small" color={p.fg} /> : null}
            {!loading && icon ? <Icon name={icon} size={20} color={p.fg} /> : null}
            <Text variant="rowTitle" color={p.fg}>{label}</Text>
            <View />
          </>
        );
      }}
    </Pressable>
  );
}
