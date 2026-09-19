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
import { colors, spacing } from '../../theme';
import {
  Card, EmptyState, HexMark, Icon, ManufacturerTabs, Screen, ScreenHeader, SkeletonCards, Text,
} from '../../components';
import { ModuleTabs } from './components/ModuleTabs';
import { useDemandsQuery, useManufacturerScope } from '../../api';
import { formatDate, formatQuantity } from '../../domain/format';
import { demandSiteLine } from '../../domain/site';
import type { Demand } from '../../api/types';

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

  return (
    <Card padding={14}>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <HexMark size={34} backgroundColor={colors.sunken} label={demand.manufacturer.mono} />
          <View style={styles.grow}>
            <Text variant="rowTitle" numberOfLines={1}>{demand.product}</Text>
            <Text variant="meta" color={colors.textTertiary}>
              {`${demand.manufacturer.name} · ${formatDate(demand.date)}`}
            </Text>
          </View>
        </View>

        {site ? (
          <View style={styles.siteRow}>
            <Icon name="LocationPin" size={16} color={colors.textTertiary} />
            <Text variant="body" color={colors.textSecondary} style={styles.grow} numberOfLines={2}>
              {site}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text variant="rowTitle" style={styles.grow}>
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
  cardBody: { gap: spacing.s10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10 },
  siteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s6 },
  grow: { flex: 1 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.sunken,
    paddingTop: spacing.s10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
});
