/**
 * Component C16 — the current-user card, ALWAYS visible, even when the influencer is inside the
 * top 10. Pinned over a white gradient fade (the second of the two permitted gradients).
 *
 * V2 composes the gap SENTENCE server-side as `gap_label`, in all three variants:
 *   in top 10 → "You are in the top 10"
 *   outside   → "134.9 Ton to enter the top 10"
 *   unranked  → measured from last place, with `rank: null` — rendered as "—"
 * So the client no longer assembles that string, and the open copy question it used to work
 * around is resolved by the contract.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, gradients, spacing } from '../../../theme';
import { Card, HexMark, Text } from '../../../components';
import { formatNumber } from '../../../domain/format';
import type { LeaderboardMe } from '../../../api/types';

export function StickyMeCard({ me, unit }: { me: LeaderboardMe; unit: string }) {
  return (
    <LinearGradient
      colors={[...gradients.leaderboardFooterFade.colors]}
      locations={[...gradients.leaderboardFooterFade.locations]}
      style={{ paddingHorizontal: spacing.m, paddingTop: spacing.s20, paddingBottom: spacing.s12 }}
    >
      <Card emphasis padding={16} style={styles.card}>
        <View style={styles.row}>
          <HexMark
            size={36}
            backgroundColor={colors.primary100}
            label={me.rank != null ? String(me.rank) : '—'}
            labelColor={colors.white}
          />
          <View style={styles.grow}>
            <Text variant="rowTitle" numberOfLines={1}>{`${me.name} (You)`}</Text>
            {me.gap_label ? <Text variant="body" color={colors.textSecondary}>{me.gap_label}</Text> : null}
          </View>
          {/* C16: the VOLUME leads, in chestnut, with the points below it as grey meta. */}
          <View style={styles.right}>
            <Text variant="quantity" color={colors.primary100}>
              {`${formatNumber(me.volume)} ${unit}`}
            </Text>
            <Text variant="meta" color={colors.textTertiary}>{`${formatNumber(me.points)} pts`}</Text>
          </View>
        </View>
      </Card>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 64, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s12 },
  grow: { flex: 1 },
  right: { alignItems: 'flex-end' },
});
