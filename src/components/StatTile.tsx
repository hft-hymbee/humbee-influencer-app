/**
 * Component C6 — the sunken stat tile.
 *
 * Home and My Demands put the VALUE ABOVE the label; Inventory Allocated is the one screen
 * that inverts it (`layout="labelFirst"`). See docs/design-spec/03-ui-kit-and-components.md §C6.
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Text } from './Text';

export function StatTile({
  label, value, valueColor = colors.textPrimary, layout = 'valueFirst', compact, style,
}: {
  label: string;
  value: string;
  valueColor?: string;
  layout?: 'valueFirst' | 'labelFirst';
  /** My Demands' denser tiles: padding 10/12 instead of 12/14. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const valueText = <Text variant="statValue" color={valueColor}>{value}</Text>;
  const labelText = <Text variant="meta" color={colors.textSecondary}>{label}</Text>;

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.sunken,
          borderRadius: radius.m,
          paddingVertical: compact ? spacing.s10 : spacing.s12,
          paddingHorizontal: compact ? spacing.s12 : spacing.s14,
          gap: spacing.xxs,
        },
        style,
      ]}
    >
      {layout === 'valueFirst' ? valueText : labelText}
      {layout === 'valueFirst' ? labelText : valueText}
    </View>
  );
}
