/**
 * Component C11 — the sticky demand trail. Reflects live choices.
 *
 * Three EQUAL COLUMNS, not a row of label/value pairs: each step is a centred column
 * (`gap:4`) with a 2px connector line running behind it at `top:15px`, then a 32px hex with a
 * 16px icon, the label 11/14/700 and the chosen value 11/14 — ellipsised on one line.
 *
 *   Done   → hex `#995A00` / white icon, label `#333333`, connector primary-25
 *   Active → hex `#FFA525` / `#0D0D0D` icon, label `#333333`, connector neutral-25
 *   Pending→ hex neutral-25 / text-disabled icon, label `#666666`, connector neutral-25
 *
 * Step 1 Industry (Cluster) → Step 2 Product (InventoryOutlined) → Step 3 Quantity (CheckCircle).
 * Values fall back to "Not chosen" / "Not entered". There is NO "Step 1 of 3" counter.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../../theme';
import { HexMark, Icon, Text } from '../../../components';
import type { IconName } from '../../../components';

export type TrailStep = {
  label: string;
  /** Always display-ready — "Not chosen" / "Not entered" when nothing is picked yet. */
  value: string;
  icon: IconName;
  /** Completion is decided by the view-model, not inferred from the label. */
  done: boolean;
};

export function DemandTrail({ steps }: { steps: TrailStep[] }) {
  return (
    <View style={styles.bar}>
      {steps.map((step, i) => {
        const done = step.done;
        // The active step is the first incomplete one.
        const active = !done && (i === 0 || steps[i - 1].done);

        const hexBg = done ? colors.primary100 : active ? colors.secondary100 : colors.border;
        const hexFg = done ? colors.white : active ? colors.black : colors.textTertiary;

        return (
          <View key={step.label} style={styles.step}>
            {/* The connector sits behind the hex, at its vertical centre. */}
            <View style={[styles.line, { backgroundColor: done ? colors.primary25 : colors.border }]} />
            <HexMark size={32} backgroundColor={hexBg}>
              <Icon name={step.icon} size={16} color={hexFg} />
            </HexMark>
            <Text
              variant="metaBold"
              align="center"
              color={done || active ? colors.textPrimary : colors.textSecondary}
            >
              {step.label}
            </Text>
            <Text variant="meta" align="center" color={colors.textSecondary} numberOfLines={1}>
              {step.value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  step: { flex: 1, alignItems: 'center', gap: spacing.xs },
  line: { position: 'absolute', top: 15, left: 0, right: 0, height: 2 },
});
