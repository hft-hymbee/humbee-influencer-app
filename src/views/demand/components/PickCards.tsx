/**
 * Component C12 — the selectable manufacturer tiles.
 *
 * ONE PICKER, NOT TWO. V2 flattened the catalogue to industry → manufacturer; the screen then
 * dropped the industry step entirely (client decision), so the influencer taps a manufacturer
 * on the first screenful. `allManufacturers` in domain/demand.ts does the flattening and the
 * de-duplication — a manufacturer listed under two industries is one tile here.
 *
 * ARTWORK COMES FROM THE API. Every manufacturer carries a real `logo_url`, so the tile is the
 * brand's own logo with its name beneath. Nothing is keyed to a bundled file: a manufacturer
 * Ops onboards tomorrow renders correctly with no app release, which a hardcoded id→asset map
 * could not do. The `mono` hexagon is the fallback when a brand has no artwork on file.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../../theme';
import { Card, HexMark, Icon, RemoteSvg, Text } from '../../../components';
import type { PickableManufacturer } from '../../../domain/demand';

function Monogram({ mono }: { mono: string }) {
  return (
    <HexMark size={52} backgroundColor={colors.surface} label={mono} labelColor={colors.textSecondary} />
  );
}

/**
 * The manufacturer picker: a 2-up grid of SQUARE logo tiles, brand name along the bottom.
 *
 * SQUARE, AND ALWAYS HALF-WIDTH. The cell is `width: '50%'` with a 6px inner gutter and the
 * grid cancels the outer half with a negative margin, so the 12px column gap is exact at every
 * screen width without measuring anything. `flexGrow` is deliberately absent: with it, a lone
 * manufacturer — the common case for an influencer mapped to one brand — stretched into a
 * full-width banner.
 */
export function ManufacturerGrid({
  items, value, onChange,
}: {
  items: PickableManufacturer[];
  value: number | null;
  onChange: (id: number, industryId: number) => void;
}) {
  return (
    <View style={styles.grid}>
      {items.map(m => {
        const active = m.id === value;
        return (
          <Pressable
            key={m.id}
            onPress={() => onChange(m.id, m.industryId)}
            style={styles.gridCell}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${m.name}, ${m.industryName}`}
          >
            <Card selected={active} padding={0} style={styles.clip}>
              <View style={styles.tile}>
                {/* Art fills whatever the square has left once the caption is laid out. */}
                <View style={styles.artWrap}>
                  <View style={styles.art}>
                    {m.logo_url ? (
                      // Logos arrive as S3 `.svg`, which <Image> cannot decode. The WebView
                      // must not swallow the tap — the whole tile is the button.
                      <View
                        style={styles.logo}
                        pointerEvents="none"
                        accessible
                        accessibilityRole="image"
                        accessibilityLabel={m.name}
                      >
                        <RemoteSvg uri={m.logo_url} fit="cover" />
                      </View>
                    ) : (
                      // No artwork on file — the brand's monogram keeps the grid's rhythm.
                      <Monogram mono={m.mono} />
                    )}
                  </View>
                  {active ? <View style={styles.veil} /> : null}
                  {/* 24px tick badge, over the art only — never over the name. */}
                  <View style={[styles.tick, active ? styles.tickOn : styles.tickOff]}>
                    {active ? <Icon name="CheckCircle" size={16} color={colors.white} /> : null}
                  </View>
                </View>
                <View style={styles.caption}>
                  <Text variant="rowTitle" numberOfLines={2}>{m.name}</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * The cart. One submission may carry several products, each becoming its own demand row, and a
 * product may appear only ONCE — so a committed line is removable but not editable in place.
 */
export function CartLines({
  lines, onRemove,
}: { lines: { productId: number; label: string; qty: string; uom: string }[]; onRemove: (productId: number) => void }) {
  if (!lines.length) return null;
  return (
    <View style={styles.cart}>
      {lines.map((line, i) => (
        <View
          key={line.productId}
          style={[styles.cartRow, i < lines.length - 1 ? styles.cartRowDivided : null]}
        >
          <View style={{ flex: 1 }}>
            <Text variant="rowTitle" numberOfLines={1}>{line.label}</Text>
            <Text variant="meta" color={colors.textTertiary}>{`${line.qty} ${line.uom}`}</Text>
          </View>
          <Pressable
            onPress={() => onRemove(line.productId)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${line.label}`}
            hitSlop={12}
          >
            <Icon name="Delete" size={20} color={colors.error100} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Wraps: the flattened catalogue is dozens of manufacturers, not a fixed two-column row.
   * The 12px column gap is built from a 6px gutter on each cell, with the outer halves pulled
   * back by this negative margin — percentage widths and absolute gaps cannot be mixed in one
   * `gap`, and this way nothing has to be measured.
   */
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridCell: { width: '50%', paddingHorizontal: 6, paddingBottom: spacing.s12 },
  clip: { overflow: 'hidden' },
  /** The tile is square; the caption takes what it needs and the art keeps the rest. */
  tile: { aspectRatio: 1 },
  artWrap: { flex: 1 },
  art: {
    flex: 1,
    backgroundColor: colors.illustrationTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Edge to edge, `cover`: the logo fills the art area as designed. The S3 logos carry their
  // own white margin around the mark, so the crop eats padding, not the brand.
  logo: { width: '100%', height: '100%' },
  // Selected cards get a chestnut veil over the illustration.
  veil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(153,90,0,0.18)' },
  tick: {
    position: 'absolute',
    top: spacing.s,
    right: spacing.s,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: { backgroundColor: colors.primary100 },
  tickOff: { backgroundColor: 'rgba(255,255,255,0.75)' },
  caption: { paddingHorizontal: spacing.s10, paddingVertical: spacing.s10 },
  cart: {
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cartRow: {
    minHeight: 52,
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.s10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
  },
  cartRowDivided: { borderBottomWidth: 1, borderBottomColor: colors.sunken },
});
