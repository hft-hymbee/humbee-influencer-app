/**
 * The two filter-chip rows. They are NOT the same component in the design:
 *
 *   C3 — Rewards status filter. Height 32. An INACTIVE chip carries its own status tint
 *        (Announced info-10, In Shop warning-10, Gifted success-10, Redeemed primary-10, All
 *        white) with that status's 200 shade as text, and a count badge in a pill.
 *   C4 — My Demands status filter. Height 30, white/`#666666` when inactive, and the count is
 *        rendered INLINE at weight 400 / 70% opacity rather than in a badge.
 *
 * Both share the active treatment: solid `#995A00`, white text, elevation-2 — never a tinted
 * outline. Counts come from /summary and are period- and manufacturer-scoped.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, elevation, radius, spacing, hitSlopFor } from '../theme';
import { statusStyle } from '../domain/status';
import { Text } from './Text';

export type ChipOption = { value: string; label: string; count?: number };

export type ChipVariant = 'status' | 'demand';

/** Inactive fill for a Rewards chip: the status's own tint; "All" stays white. */
function inactiveTint(value: string): { bg: string; fg: string } {
  if (value === 'All') return { bg: colors.surface, fg: colors.textSecondary };
  const s = statusStyle(value);
  return { bg: s.bg, fg: s.fg };
}

export function ChipRow({
  options, value, onChange, variant = 'status',
}: {
  options: ChipOption[];
  value: string;
  onChange: (v: string) => void;
  variant?: ChipVariant;
}) {
  const isDemand = variant === 'demand';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map(opt => {
        const active = opt.value === value;
        const tint = isDemand
          ? { bg: colors.surface, fg: colors.textSecondary }
          : inactiveTint(opt.value);

        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            hitSlop={hitSlopFor(isDemand ? 30 : 32)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.chip,
              isDemand ? styles.chipDemand : styles.chipStatus,
              active
                ? [styles.chipActive, elevation.e2]
                : { backgroundColor: tint.bg, borderColor: colors.border },
            ]}
          >
            <Text variant="bodyBold" color={active ? colors.white : tint.fg}>
              {opt.label}
            </Text>

            {typeof opt.count !== 'number' ? null : isDemand ? (
              // C4: inline, regular weight, 70% opacity.
              <Text
                variant="body"
                color={active ? colors.white : tint.fg}
                style={styles.inlineCount}
              >
                {opt.count}
              </Text>
            ) : (
              <View style={[styles.count, active ? styles.countActive : null]}>
                <Text variant="metaBold" color={active ? colors.white : colors.textTertiary}>
                  {opt.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.s, paddingRight: spacing.m },
  chip: {
    paddingHorizontal: spacing.s12,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s6,
  },
  chipStatus: { height: 32 },
  chipDemand: { height: 30 },
  chipActive: { backgroundColor: colors.primary100, borderColor: colors.primary100 },
  inlineCount: { opacity: 0.7 },
  count: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countActive: { backgroundColor: 'rgba(255,255,255,0.24)' },
});
