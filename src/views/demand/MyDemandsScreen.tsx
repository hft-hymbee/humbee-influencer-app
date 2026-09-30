/**
 * Screen 08 — My Demands. docs/design-spec/04-screens/08-my-demands.md
 *
 * WHAT V2 REMOVED FROM THIS SCREEN, and why none of it can be rebuilt client-side:
 *   - No `status`. There is no status column at all: Submitted → Confirmed → Allocated → Closed
 *     is driven by VCP-side events that nothing emits yet. So no status chips, and no chip-count
 *     row — the /demands/summary endpoint is gone with them.
 *   - No points. Points are calculated when a VCP allocates stock, so a figure on a claim would
 *     be a number nothing has earned. No tiles, no points line.
 *   - No VCP. Nothing allocates against a demand yet, so there is no partner to name.
 *   - No `date_label`. One ISO `date`; the app formats it.
 * Rebuilding any of the above would mean inventing it. They come back when the contract does.
 *
 * There is NO period filter on this screen. The list IS manufacturer-scoped — `manufacturer_id`
 * is a required parameter, and there is no cross-manufacturer demand list — so the manufacturer
 * tabs are load-bearing here, not decoration.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors, radius, spacing } from '../../theme';
import { fulfilmentStyle } from '../../domain/status';
import {
  Card, EmptyState, HexMark, Icon, ManufacturerTabs, Screen, ScreenHeader, SkeletonCards,
  StatusBadge, Text,
} from '../../components';
import { ModuleTabs } from './components/ModuleTabs';
import { useDemandsQuery, useManufacturerScope } from '../../api';
import { formatDate, formatQuantity } from '../../domain/format';
import { demandSiteLine } from '../../domain/site';
import type { Demand } from '../../api/types';

/** Below this many tries left, the count is worth surfacing. Above it, it is noise. */
const LOW_ATTEMPTS = 2;

/**
 * One demand, in four bands top to bottom: WHAT was asked for, the ePIN that confirms it,
 * WHERE it is going, and HOW MUCH.
 *
 * The bands are separated by whitespace and one hairline rather than by boxes — a card that is
 * mostly borders reads as a form. The ePIN is the only tinted surface on the card, which is
 * what makes it findable at a glance when a dealer is standing there waiting for it.
 */
function DemandCard({ demand }: { demand: Demand }) {
  /**
   * The SERVER's single line, never a join of the parts. It arrives already de-duplicated — a
   * geocode routinely repeats the locality in `address_line_2` and again as the location name —
   * and it is what every other surface shows for this demand.
   *
   * Null for demands captured before sites existed. Those rows render WITHOUT the address
   * block, never hidden: the demand is still real and still the influencer's.
   */
  const site = demandSiteLine(demand.site);
  const epin = demand.epin;
  const fulfilment = demand.fulfilment;

  return (
    <Card padding={16} cornerRadius={radius.l}>
      <View style={styles.cardBody}>
        {/* 1. What was demanded, and where it stands. */}
        <View style={styles.cardTop}>
          <HexMark size={34} backgroundColor={colors.sunken} label={demand.manufacturer.mono} />
          <View style={styles.grow}>
            <Text variant="rowTitle" numberOfLines={2}>{demand.product}</Text>
            <Text variant="meta" color={colors.textTertiary} numberOfLines={1}>
              {`${demand.manufacturer.name} · ${formatDate(demand.date)}`}
            </Text>
          </View>
          {/*
            Coloured from the stable `status` key and LABELLED from `status_label`: the label is
            localised copy, so colouring by it would leave a Hindi build grey.
          */}
          {fulfilment ? (
            <StatusBadge
              status={fulfilment.status}
              label={fulfilment.status_label ?? fulfilment.status}
              styleFor={fulfilmentStyle}
            />
          ) : null}
        </View>

        {/*
          2. THE ePIN — the code the influencer reads out to the VCP, in the shape Uber and
          Rapido use for a trip PIN: digit boxes, large, high contrast, above the fold of the
          card so it is findable at arm's length in daylight while someone waits to be told it.

          Digits are rendered from the string as it arrived rather than into a fixed count of
          boxes: the length is server config, and a layout assuming four would silently truncate
          a five-digit code.
        */}
        {epin?.code ? (
          <View style={styles.epin}>
            <Text variant="overline" color={colors.primary200}>Confirmation ePIN</Text>
            <View style={styles.epinRow}>
              <Text variant="body" color={colors.textSecondary} style={styles.grow}>
                Read this out when the dealer allocates
              </Text>
              <View style={styles.epinDigits}>
                {epin.code.split('').map((d, i) => (
                  <View key={`${i}-${d}`} style={styles.epinBox}>
                    <Text variant="statValue" color={colors.primary100}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/*
              Shown only once it starts running out. At full count it is noise; at zero the
              demand cannot be verified until the code rotates, and the influencer is the only
              person positioned to notice and say something.
            */}
            {epin.attempts_remaining <= LOW_ATTEMPTS ? (
              <Text
                variant="meta"
                color={epin.attempts_remaining === 0 ? colors.error100 : colors.warning200}
              >
                {epin.attempts_remaining === 0
                  ? 'Too many wrong tries. Ask the dealer to try again after this demand updates.'
                  : `${epin.attempts_remaining} tries left on this PIN`}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* 3. Where it is going. Shown WHOLE — a truncated address is not an address, and this
            is the one field a dealer may have to act on. */}
        {site ? (
          <View style={styles.siteBlock}>
            <Text variant="overline" color={colors.textTertiary}>Construction site address</Text>
            <View style={styles.siteRow}>
              <Icon name="LocationPin" size={16} color={colors.textTertiary} />
              <Text variant="body" color={colors.textSecondary} style={styles.grow}>
                {site}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 4. How much. */}
        <View style={styles.cardFooter}>
          <Text variant="quantity" style={styles.grow}>
            {formatQuantity(demand.quantity.value, demand.quantity.uom)}
          </Text>
          {/* The same volume in the reporting unit — the server's conversion, never ours. */}
          <Text variant="meta" color={colors.textTertiary}>
            {formatQuantity(demand.normalised_quantity.value, demand.normalised_quantity.uom)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export function MyDemandsScreen({
  onOpenProfile, onTabChange,
}: { onOpenProfile: () => void; onTabChange: (tab: 'new' | 'mine') => void }) {
  const scope = useManufacturerScope();
  const list = useDemandsQuery(scope.manufacturerId);

  const items = list.data?.pages.flatMap(p => p.items) ?? [];

  const header = (
    <>
      <ScreenHeader title="My Demands" subtitle="Everything you have raised on HUMBEE" onPressAccount={onOpenProfile} />
      <ModuleTabs value="mine" onChange={onTabChange} />
      <ManufacturerTabs tabs={scope.tabs} value={scope.manufacturerId} onChange={scope.setManufacturer} />
    </>
  );

  if (scope.hasNoManufacturer) {
    return (
      <Screen header={header}>
        <EmptyState
          title="No manufacturer linked yet"
          body="Demands you raise appear here once a manufacturer is linked to your account."
        />
      </Screen>
    );
  }

  if (scope.isPending || list.isPending) {
    return (
      <Screen header={header}>
        <View style={{ gap: spacing.s12 }}>
          <SkeletonCards count={4} height={96} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={header} padded={false} scroll={false}>
      <FlashList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ padding: spacing.m }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.s12 }} />}
        showsVerticalScrollIndicator={false}
        onRefresh={() => list.refetch()}
        refreshing={list.isFetching && !list.isPending && !list.isFetchingNextPage}
        onEndReachedThreshold={0.5}
        onEndReached={() => { if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage(); }}
        renderItem={({ item }) => <DemandCard demand={item} />}
        ListEmptyComponent={
          <EmptyState
            title="No demands yet"
            body="Capture a demand and it will show up here."
          />
        }
      />
    </Screen>
  );
}

/**
 * Styles created ONCE at module load — DemandCard renders per-row inside a FlashList
 * (docs/10 §10).
 */
const styles = StyleSheet.create({
  cardBody: { gap: spacing.s14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s10 },
  grow: { flex: 1 },

  epin: {
    backgroundColor: colors.primary5,
    borderRadius: radius.m,
    padding: spacing.s12,
    gap: spacing.s,
  },
  epinRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10 },
  epinDigits: { flexDirection: 'row', gap: spacing.s6 },
  epinBox: {
    minWidth: 38,
    height: 44,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.primary25,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s6,
  },

  siteBlock: { gap: spacing.s6 },
  siteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s6 },

  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.sunken,
    paddingTop: spacing.s12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
});
