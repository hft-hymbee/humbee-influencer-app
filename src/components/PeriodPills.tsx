/**
 * Component C2 — "PERIOD" overline + 3 Months / 6 Months / 1 Year, all on ONE row.
 *
 * Shared by Inventory Allocated (09) and Rewards (10) ONLY.
 * LEADERBOARD HAS NO PERIOD FILTER — it is the live standing. Do not give it one.
 *
 * The pills are deliberately SMALLER than the manufacturer tabs (26px, 11/700, `flex:1`):
 * manufacturer is the primary axis, period the secondary. The 48dp tap floor is reached with
 * `hitSlop`, not by growing the pill.
 *
 * Options come from GET /config, not a hardcoded array.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, hitSlopFor, radius, spacing } from '../theme';
import { Text } from './Text';
import type { Period, PeriodOption } from '../api/types';

const FALLBACK: PeriodOption[] = [
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
];

const PILL_HEIGHT = 26;

export function PeriodPills({
  options, value, onChange,
}: { options?: PeriodOption[]; value: Period; onChange: (p: Period) => void }) {
  const opts = options?.length ? options : FALLBACK;
  return (
    <View style={styles.row}>
      <Text variant="tableHeader" color={colors.textTertiary}>Period</Text>
      {opts.map(opt => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            hitSlop={hitSlopFor(PILL_HEIGHT)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
          >
            <Text variant="metaBold" color={active ? colors.white : colors.textSecondary}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s6 },
  pill: {
    flex: 1,
    height: PILL_HEIGHT,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: colors.black },
  pillInactive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
});
