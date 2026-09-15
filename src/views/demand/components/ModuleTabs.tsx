/**
 * "New Demand" | "My Demands" — two equal buttons, 36px, radius 8.
 * My Demands is the SECOND TAB of the Demand module, not a fifth nav item.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, hitSlopFor, radius, spacing } from '../../../theme';
import { Text } from '../../../components';

export function ModuleTabs({
  value, onChange,
}: { value: 'new' | 'mine'; onChange: (v: 'new' | 'mine') => void }) {
  const tabs = [
    { key: 'new' as const, label: 'New Demand' },
    { key: 'mine' as const, label: 'My Demands' },
  ];
  return (
    <View style={styles.row}>
      {tabs.map(tab => {
        const active = tab.key === value;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            hitSlop={hitSlopFor(36)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
          >
            <Text variant="bodyBold" color={active ? colors.white : colors.textSecondary}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.s6, paddingHorizontal: spacing.m, paddingTop: spacing.s12 },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: colors.primary100 },
  tabInactive: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
});
