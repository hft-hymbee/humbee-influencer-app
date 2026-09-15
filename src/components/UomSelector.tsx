/**
 * Component C13 — the UOM segmented control beside the quantity field.
 *
 * Wrapper: `gap:4`, padding 4, radius 8, background `#F2F2F2`.
 * Button: min-width 56, height 36, radius 4, 13/700 — ACTIVE is `#995A00` with WHITE text,
 * inactive is transparent with `#8C8C8C`. The 48dp tap floor comes from `hitSlop`.
 *
 * The list is the manufacturer's, else the sub-industry's, else ['Units'] (domain/demand.ts).
 * First entry is the default; the client never invents a UOM.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, hitSlopFor, radius, spacing } from '../theme';
import { Text } from './Text';

const BUTTON_HEIGHT = 36;

export function UomSelector({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (uom: string) => void }) {
  return (
    <View style={styles.block}>
      <Text variant="bodyBold" color={colors.textTertiary}>UOM</Text>
      <View style={styles.group}>
        {options.map(opt => {
          const active = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              hitSlop={hitSlopFor(BUTTON_HEIGHT)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.button, active ? styles.buttonActive : null]}
            >
              <Text variant="bodyBold" color={active ? colors.white : colors.textTertiary}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.s6 },
  group: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.m,
    backgroundColor: colors.sunken,
  },
  button: {
    minWidth: 56,
    height: BUTTON_HEIGHT,
    paddingHorizontal: spacing.s,
    borderRadius: radius.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: { backgroundColor: colors.primary100 },
});
