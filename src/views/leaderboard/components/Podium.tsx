/**
 * Component C15 — the top-3 podium. Visible only when the server says `showPodium`.
 * Hidden for manufacturers with fewer than 3 ranked influencers — the server decides, not us.
 *
 * Built to the letter of docs/design-spec/03-ui-kit-and-components.md §C15:
 *   Panel: padding 16/12/12, radius 8, the amber gradient, ring primary-10.
 *   Three WHITE CARDS, align-items:flex-end, order 2 – 1 – 3; rank 1 margin-top 0, others 18.
 *   Card: radius 8, padding 12/6, centred column gap 6; rank 1 ring primary-25 + elevation-2,
 *         others a 1px #E5E5E5 ring.
 *   Contents: hex avatar (58 rank 1 / 46) with initials, an SVG medal (30×38) pinned
 *         bottom:-8 right:-14 with the rank number on the disc, then the uppercase medal label,
 *         the FIRST NAME, the volume, and the points as grey meta ("51,630 pts").
 *
 * The podium panel gradient is one of only TWO permitted gradients in the system.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, elevation, gradients, medals, radius, spacing } from '../../../theme';
import { HexMark, Text } from '../../../components';
import { firstNameOf, formatNumber, initialsOf } from '../../../domain/format';
import type { LeaderboardRow } from '../../../api/types';

/** Rank 1 sits centre and larger (58px avatar); 2 and 3 flank it at 46px, dropped 18px. */
const ORDER = [2, 1, 3] as const;

/** Medal art: 30×38 on a 0 0 56 72 canvas — two ribbon paths + three concentric discs. */
const MEDAL_W = 30;
const MEDAL_H = 38;

function Medal({ rank }: { rank: 1 | 2 | 3 }) {
  const m = medals[rank];
  return (
    <>
      <Svg width={MEDAL_W} height={MEDAL_H} viewBox="0 0 56 72" style={styles.medal}>
        <Path d="M12 0 L24 0 L34 26 L20 30 Z" fill={m.ribbonLeft} />
        <Path d="M44 0 L32 0 L22 26 L36 30 Z" fill={m.ribbonRight} />
        <Circle cx="28" cy="48" r="23" fill={m.discOuter} />
        <Circle cx="28" cy="48" r="19" fill={m.discMid} />
        <Circle cx="28" cy="48" r="14.5" fill={m.discInner} />
      </Svg>
      {/* The rank number is centred on the disc, not on the whole medal — hence the 13px inset. */}
      <View style={styles.medalNumber} pointerEvents="none">
        <Text variant="metaBold" color={m.number} align="center">{String(rank)}</Text>
      </View>
    </>
  );
}

export function Podium({ rows, unit }: { rows: LeaderboardRow[]; unit: string }) {
  const byRank = new Map(rows.map(r => [r.rank, r]));

  return (
    <LinearGradient
      colors={[...gradients.podium.colors]}
      locations={[...gradients.podium.locations]}
      style={styles.panel}
    >
      <View style={styles.cards}>
        {ORDER.map(rank => {
          const row = byRank.get(rank);
          if (!row) return <View key={rank} style={styles.slot} />;
          const medal = medals[rank];
          const isFirst = rank === 1;

          return (
            <View
              key={rank}
              style={[styles.card, isFirst ? styles.cardFirst : styles.cardFlank]}
            >
              <View style={[styles.avatarWrap, isFirst ? styles.avatar58 : styles.avatar46]}>
                <HexMark
                  size={isFirst ? 58 : 46}
                  backgroundColor={medal.avatarBg}
                  label={initialsOf(row.name)}
                  labelColor={medal.avatarText}
                  labelVariant="rowTitle"
                />
                <Medal rank={rank} />
              </View>

              <Text variant="tableHeader" color={medal.labelColor}>{medal.label}</Text>
              <Text variant="bodyBold" align="center" numberOfLines={1}>{firstNameOf(row.name)}</Text>
              <Text variant="rowTitle">{`${formatNumber(row.volume)} ${unit}`}</Text>
              <Text variant="meta" color={colors.textTertiary}>{`${formatNumber(row.points)} pts`}</Text>
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.primary10,
    paddingTop: spacing.m,
    paddingHorizontal: spacing.s12,
    paddingBottom: spacing.s12,
  },
  cards: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.s },
  slot: { flex: 1 },
  card: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.s6,
    paddingVertical: spacing.s12,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.m,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  cardFirst: { borderColor: colors.primary25, marginTop: 0, ...elevation.e2 },
  cardFlank: { borderColor: colors.border, marginTop: 18 },
  // The medal deliberately hangs outside the hexagon's box.
  avatarWrap: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  avatar58: { width: 58, height: 58 },
  avatar46: { width: 46, height: 46 },
  medal: { position: 'absolute', right: -14, bottom: -8 },
  medalNumber: {
    position: 'absolute',
    right: -14,
    bottom: -8,
    width: MEDAL_W,
    height: MEDAL_H,
    paddingTop: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
