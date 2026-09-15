/**
 * Component C17 — "How You Earn Points", collapsed by default.
 *
 * Anatomy, verbatim from docs/design-spec/03-ui-kit-and-components.md §C17:
 *   A 52px tap row — 28px hex tile with `InfoOutlined` 16 → title 13/18/700 plus the base line
 *   11/16 `#8C8C8C` ("{Manufacturer} · 1 Kg = 1 point") → a right-hand `View` / `Hide` link
 *   11/16/700 in chestnut.
 *   Expanded: rows of min-height 34, padding `7px 10px`, radius 4, background `#F2F2F2`,
 *   label 13/18 `#333333` left and value 13/18/700 right — chestnut on premium tiers — then
 *   the note in 11/16 `#8C8C8C`.
 *
 * The rate table comes from the server's `pointsRule`. Points conversion is CONFIGURATION:
 * never hardcode a ratio, a base unit or a multiplier here (docs/03-api-integration-and-data.md §3.3).
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { colors, hitSlopFor, motion, radius, spacing } from '../../../theme';
import { Card, HexMark, Icon, Text } from '../../../components';
import type { PointsRule } from '../../../api/types';

/** Fixed copy from the spec. Do not paraphrase it. */
const NOTE = 'Premium SKUs carry multiplied points. Points post once your distributor confirms the allocation.';

export function PointsExplainer({
  manufacturerName, rule,
}: { manufacturerName: string; rule: PointsRule }) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (reduced) { anim.setValue(open ? 1 : 0); return; }
      Animated.timing(anim, {
        toValue: open ? 1 : 0,
        duration: motion.pointsExpand,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }).start();
    });
  }, [open, anim]);

  return (
    <Card padding={0}>
      <Pressable
        onPress={() => setOpen(o => !o)}
        hitSlop={hitSlopFor(52)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.tapRow}
      >
        <HexMark size={28} backgroundColor={colors.primary10}>
          <Icon name="InfoOutlined" size={16} color={colors.primary100} />
        </HexMark>
        <View style={styles.titleBlock}>
          <Text variant="bodyBold">How You Earn Points</Text>
          <Text variant="meta" color={colors.textTertiary} numberOfLines={1}>
            {`${manufacturerName} · ${rule.base}`}
          </Text>
        </View>
        <Text variant="metaBold" color={colors.primary100}>{open ? 'Hide' : 'View'}</Text>
      </Pressable>

      {open ? (
        <Animated.View
          style={[
            styles.body,
            {
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) }],
            },
          ]}
        >
          {rule.tiers.map(tier => (
            <View key={tier.label} style={styles.tier}>
              <Text variant="body" style={styles.tierLabel}>{tier.label}</Text>
              <Text variant="bodyBold" color={tier.premium ? colors.primary100 : colors.textPrimary}>
                {tier.value}
              </Text>
            </View>
          ))}
          <Text variant="meta" color={colors.textTertiary}>{NOTE}</Text>
        </Animated.View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  tapRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s10,
    paddingHorizontal: spacing.s14,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  body: {
    paddingHorizontal: spacing.s14,
    paddingBottom: spacing.s12,
    gap: spacing.s6,
  },
  tier: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: 7,
    paddingHorizontal: spacing.s10,
    borderRadius: radius.s,
    backgroundColor: colors.sunken,
  },
  tierLabel: { flex: 1 },
});
