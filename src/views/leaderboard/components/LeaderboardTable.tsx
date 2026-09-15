/**
 * Component C14 — the ranked table.
 *
 * Rank marks are HEXAGONS FOR ALL RANKS; only the colour changes for the top three.
 * Progress ratio = this influencer's points ÷ rank-1 points, from server values only.
 * Rows enter with a 35ms stagger and the bars fill on the same delay.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, motion, progressFill, radius, rankMark, spacing } from '../../../theme';
import { ProgressBar, Text } from '../../../components';
import { HexMark } from '../../../components';
import { formatNumber } from '../../../domain/format';
import type { LeaderboardRow } from '../../../api/types';

export function LeaderboardTable({
  rows, unit, currentInfluencerId,
}: { rows: LeaderboardRow[]; unit: string; currentInfluencerId?: number }) {
  const topPoints = rows[0]?.points ?? 0;

  return (
    <View style={styles.container}>
      {/* Column header — Rank 32 · Influencer flex · unit 76 right · Points 56 right */}
      <View style={styles.header}>
        <Text variant="tableHeader" color={colors.textSecondary} style={styles.colRank}>Rank</Text>
        <Text variant="tableHeader" color={colors.textSecondary} style={styles.colName}>Influencer</Text>
        <Text variant="tableHeader" color={colors.textSecondary} style={styles.colUnit}>{unit}</Text>
        <Text variant="tableHeader" color={colors.textSecondary} style={styles.colPoints}>Points</Text>
      </View>

      {rows.map((row, i) => {
        const mark = rankMark(row.rank);
        const isMe = currentInfluencerId != null && row.influencer_id === currentInfluencerId;
        return (
          <View
            key={row.influencer_id}
            style={[styles.row, isMe ? styles.rowMe : null]}
          >
            <View style={styles.rowInner}>
              <View style={styles.rankCell}>
                <HexMark size={32} backgroundColor={mark.bg} label={String(row.rank)} labelColor={mark.fg} />
              </View>
              {/* The 5px bar sits UNDER THE NAME, not across the row (C14). */}
              <View style={styles.colName}>
                <Text variant="leaderboardName" numberOfLines={1}>
                  {isMe ? `${row.name} (You)` : row.name}
                </Text>
                <ProgressBar
                  ratio={topPoints > 0 ? row.points / topPoints : 0}
                  color={progressFill(row.rank)}
                  delay={i * motion.stagger.row}
                />
              </View>
              {/* Value over its unit label, both right-aligned (C14). */}
              <View style={styles.colUnit}>
                <Text variant="rowTitle" align="right">{formatNumber(row.volume)}</Text>
                <Text variant="meta" color={colors.textTertiary} align="right">{unit}</Text>
              </View>
              <View style={styles.colPoints}>
                <Text variant="rowTitle" color={colors.success100} align="right">
                  {formatNumber(row.points)}
                </Text>
                <Text variant="meta" color={colors.textTertiary} align="right">points</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Styles are created ONCE at module load. A style object built in a render body allocates on
 * every frame, and this table renders up to 200 rows with an animating bar each — it is the
 * hottest path in the app on a 2GB device (docs/10 §10).
 */
const styles = StyleSheet.create({
  container: {
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    minHeight: 44,
    backgroundColor: colors.sunken,
    paddingVertical: spacing.s12,
    paddingHorizontal: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.sunken,
    paddingVertical: spacing.s10,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.surface,
    gap: spacing.s6,
    justifyContent: 'center',
  },
  rowMe: { backgroundColor: colors.primary5 },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.s12 },
  rankCell: { width: 32, alignItems: 'flex-start' },
  colRank: { width: 32 },
  colName: { flex: 1, gap: spacing.xs },
  colUnit: { width: 76 },
  colPoints: { width: 56 },
});
