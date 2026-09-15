/**
 * Component C12 — the selectable industry cards and the manufacturer rows.
 *
 * V2 flattened the picker to TWO levels, so the sub-industry row and the "no manufacturer
 * onboarded" branch are gone: the industry list is already filtered to manufacturers active in
 * the caller's region, so an industry with nothing behind it never arrives.
 *
 * ARTWORK COMES FROM THE API. V2's industry objects carry no `image_url`, but every
 * manufacturer carries a real `logo_url`, so an industry card is illustrated with the logos of
 * the manufacturers it actually contains — which is both live data and more informative than a
 * generic industry illustration. Nothing here is keyed to a bundled file: a new industry from
 * Ops renders correctly with no app release, which a hardcoded code→asset map could not do.
 */
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../../theme';
import { Card, HexMark, Icon, Text } from '../../../components';
import type { CatalogManufacturer, Industry } from '../../../api/types';

/** Up to three logos per industry card; more than that and they stop being legible. */
const MAX_LOGOS = 3;

export function IndustryGrid({
  items, value, onChange,
}: { items: Industry[]; value: number | null; onChange: (id: number) => void }) {
  return (
    <View style={styles.grid}>
      {items.map(item => {
        const active = item.id === value;
        const logos = item.manufacturers.filter(m => m.logo_url).slice(0, MAX_LOGOS);
        return (
          <Pressable key={item.id} onPress={() => onChange(item.id)} style={styles.gridCell}
            accessibilityRole="button" accessibilityState={{ selected: active }}>
            <Card selected={active} padding={0} style={styles.clip}>
              <View>
                <View style={styles.industryArt}>
                  {logos.length ? (
                    logos.map(m => (
                      <Image
                        key={m.id}
                        source={{ uri: m.logo_url! }}
                        resizeMode="contain"
                        style={[styles.logo, logos.length > 1 ? styles.logoSmall : null]}
                        accessibilityLabel={m.name}
                      />
                    ))
                  ) : (
                    // Every manufacturer in this industry is missing a logo — keep the rhythm.
                    <Icon name="Cluster" size={28} color={colors.textTertiary} />
                  )}
                </View>
                {active ? <View style={styles.veil} /> : null}
                {/* 24px tick badge, industry cards only. */}
                <View style={[styles.tick, active ? styles.tickOn : styles.tickOff]}>
                  {active ? <Icon name="CheckCircle" size={16} color={colors.white} /> : null}
                </View>
              </View>
              <View style={styles.caption}>
                <Text variant="rowTitle" numberOfLines={1}>{item.name}</Text>
                <Text variant="meta" color={colors.textTertiary} numberOfLines={1}>
                  {`${item.manufacturers.length} manufacturer${item.manufacturers.length === 1 ? '' : 's'}`}
                </Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * The manufacturers of the chosen industry — now the LAST step of the picker before products.
 * The real `logo_url` leads, with the `mono` hexagon as the fallback for a manufacturer that
 * has no artwork on file. `base_unit` and `uoms` can both be empty for a partially-configured
 * manufacturer; the row says so rather than showing a blank line.
 */
export function ManufacturerRows({
  items, value, onChange,
}: { items: CatalogManufacturer[]; value: number | null; onChange: (id: number) => void }) {
  return (
    <View style={{ gap: spacing.s }}>
      {items.map(m => {
        const active = m.id === value;
        return (
          <Pressable key={m.id} onPress={() => onChange(m.id)}
            accessibilityRole="button" accessibilityState={{ selected: active }}>
            <Card selected={active} padding={14}>
              <View style={styles.mfrRow}>
                {m.logo_url ? (
                  <Image
                    source={{ uri: m.logo_url }}
                    resizeMode="contain"
                    style={styles.mfrLogo}
                    accessibilityLabel={m.name}
                  />
                ) : (
                  <HexMark
                    size={36}
                    backgroundColor={active ? colors.primary100 : colors.sunken}
                    label={m.mono}
                    labelColor={active ? colors.white : colors.textSecondary}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text variant="rowTitle">{m.name}</Text>
                  <Text variant="meta" color={colors.textTertiary}>
                    {m.base_unit ? `Reported in ${m.base_unit}` : 'Onboarded on HUMBEE · your district'}
                  </Text>
                </View>
                <Icon name="CheckCircle" size={24} color={active ? colors.primary100 : colors.border} />
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
  // Wraps: V2 can return up to eight industries, where V1's two-column row assumed two.
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s12 },
  gridCell: { flexGrow: 1, flexBasis: '46%' },
  clip: { overflow: 'hidden' },
  industryArt: {
    width: '100%',
    height: 92,
    backgroundColor: colors.illustrationTint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.s,
  },
  logo: { width: 64, height: 64 },
  logoSmall: { width: 40, height: 40 },
  mfrRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s12 },
  mfrLogo: { width: 36, height: 36 },
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
  caption: { paddingHorizontal: spacing.s12, paddingVertical: spacing.s10 },
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
