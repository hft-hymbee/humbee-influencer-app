/**
 * Component C1 — shared VERBATIM by Leaderboard (05), Inventory Allocated (09) and Rewards (10).
 * Built once, before those three screens, per docs/05-delivery-plan.md.
 *
 * Tabs are flattened from the cached industry tree (api/endpoints/catalog.ts), never hardcoded.
 * Anatomy: items `gap:20px` with no padding of their own, each a centred column with
 * `padding-top:12px` and `gap:6px`; the label is 15/20 — **700 when active, 400 when not** —
 * and the underline is a 2px bar the full width of the item, transparent when inactive.
 *
 * This is the manufacturer switcher; it is deliberately NOT a chip row.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, hitSlopFor, spacing } from '../theme';
import { Text } from './Text';
import type { MfrTab } from '../api/types';

export function ManufacturerTabs({
  tabs, value, onChange,
}: { tabs: MfrTab[]; value: number | null; onChange: (id: number) => void }) {
  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
      >
        {tabs.map(tab => {
          const active = tab.id === value;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              hitSlop={hitSlopFor(38)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={styles.item}
            >
              <Text
                variant={active ? 'rowTitle' : 'bodyLarge'}
                color={active ? colors.black : colors.textTertiary}
              >
                {tab.name}
              </Text>
              <View style={[styles.underline, active ? styles.underlineActive : null]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderBottomWidth: 1, borderBottomColor: colors.border },
  track: { paddingHorizontal: spacing.m, gap: spacing.s20 },
  item: { alignItems: 'center', gap: spacing.s6, paddingTop: spacing.s12 },
  // Full item width, 2px, rounded only at the top where it meets the label.
  underline: {
    height: 2,
    alignSelf: 'stretch',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: 'transparent',
  },
  underlineActive: { backgroundColor: colors.black },
});
