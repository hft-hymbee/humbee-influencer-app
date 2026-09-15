/**
 * Screen 09 — Inventory Allocated. docs/design-spec/04-screens/09-inventory-allocated.md
 *
 * Totals arrive PRE-NORMALISED into the manufacturer's reporting unit. THE CLIENT NEVER
 * CONVERTS UOMs — the conversion factors in the design doc are illustrative and belong to the
 * server. A row's `quantity` is the raw stocking-unit figure and `normalised_quantity` is the
 * same volume in the unit the tile sums; the two units differ BY DESIGN, so the card shows the
 * first and the tile the second.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors, radius, spacing } from '../../theme';
import {
  Card, EmptyState, HexMark, Icon, ManufacturerTabs, PeriodPills, Screen, ScreenHeader,
  SkeletonCards, SkeletonTiles, StatTile, Text,
} from '../../components';
import {
  useAllocationsQuery, useAllocationsSummaryQuery, useConfigQuery, useManufacturerScope,
} from '../../api';
import { useSelectionStore } from '../../store/selectionStore';
import { formatQuantity } from '../../domain/format';
import type { Allocation } from '../../api/types';

function AllocationCard({ item }: { item: Allocation }) {
  return (
    <Card padding={16}>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <HexMark size={40} backgroundColor={colors.sunken}>
            <Icon name="InventoryOutlined" size={24} color={colors.textSecondary} />
          </HexMark>
          <View style={styles.grow}>
            {/* Long VCP names ellipsise on ONE line. */}
            <Text variant="rowTitle" numberOfLines={1}>{item.vcp.name}</Text>
            <Text variant="meta" color={colors.textTertiary}>{`${item.vcp.type} · ${item.vcp.place}`}</Text>
          </View>
          <View style={styles.right}>
            <Text variant="quantity">{formatQuantity(item.quantity.value, item.quantity.uom)}</Text>
            {/* The server composes the date label here; don't re-format it. */}
            <Text variant="meta" color={colors.textTertiary}>{item.date_label}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {/* Product pills wrap; the card grows. */}
          <View style={styles.pillWrap}>
            {item.products.map(product => (
              <View key={product} style={styles.pill}>
                <Text variant="metaBold" color={colors.textTertiary}>{product}</Text>
              </View>
            ))}
          </View>
          <Text variant="bodyBold" color={colors.success100}>{item.points_label}</Text>
        </View>
      </View>
    </Card>
  );
}

export function AllocationScreen({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { data: config } = useConfigQuery();
  const scope = useManufacturerScope();

  const period = useSelectionStore(s => s.period);
  const setPeriod = useSelectionStore(s => s.setPeriod);

  const args = { manufacturerId: scope.manufacturerId, companyEsiId: scope.companyEsiId, period };
  const list = useAllocationsQuery(args);
  const summary = useAllocationsSummaryQuery(args);

  // Offset paging: flatten the pages the user has actually scrolled to.
  const items = list.data?.pages.flatMap(p => p.items) ?? [];

  const header = (
    <>
      <ScreenHeader title="Inventory Allocated" subtitle="What your VCPs allocated" onPressAccount={onOpenProfile} />
      <ManufacturerTabs tabs={scope.tabs} value={scope.manufacturerId} onChange={scope.setManufacturer} />
    </>
  );

  if (scope.hasNoManufacturer) {
    return (
      <Screen header={header}>
        <EmptyState
          title="No manufacturer linked yet"
          body="Allocations appear once a manufacturer is linked to your account."
        />
      </Screen>
    );
  }

  if (scope.isPending || list.isPending) {
    return (
      <Screen header={header}>
        <View style={{ gap: spacing.s12 }}>
          <SkeletonTiles count={2} />
          <SkeletonCards count={3} height={120} />
        </View>
      </Screen>
    );
  }

  const totals = summary.data?.totals;

  return (
    <Screen header={header} padded={false} scroll={false}>
      <FlashList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: spacing.m, paddingTop: spacing.s14, paddingBottom: spacing.m }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.s12 }} />}
        showsVerticalScrollIndicator={false}
        onRefresh={() => { list.refetch(); summary.refetch(); }}
        refreshing={list.isFetching && !list.isPending && !list.isFetchingNextPage}
        // `has_more` is the only paging signal V2 returns — there are no totals to count against.
        onEndReachedThreshold={0.5}
        onEndReached={() => { if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage(); }}
        ListHeaderComponent={
          <View style={{ gap: spacing.s12, paddingBottom: spacing.s12 }}>
            <PeriodPills options={config?.periods} value={period} onChange={setPeriod} />
            <View style={{ flexDirection: 'row', gap: spacing.s12 }}>
              {/* Inventory Allocated is the ONE screen where the label sits above the value (C6).
                  `quantity_label` ALREADY carries the unit ("209.9 Ton"), so the label must not
                  repeat it — appending the unit here printed "Quantity allocated · Ton" over
                  "209.9 Ton". */}
              <StatTile
                layout="labelFirst"
                label="Quantity allocated"
                value={totals?.quantity_label ?? '0'}
              />
              <StatTile
                layout="labelFirst"
                label="Points earned"
                value={totals?.points_label ?? '0'}
                valueColor={colors.success100}
              />
            </View>
            {summary.data?.count_label ? (
              <Text variant="meta" color={colors.textTertiary}>{summary.data.count_label}</Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <AllocationCard item={item} />}
        ListEmptyComponent={
          <EmptyState
            title="No allocations in this period"
            body="Try a longer period or another manufacturer."
          />
        }
      />
    </Screen>
  );
}

/**
 * Styles created ONCE at module load. These components render per-row inside a FlashList, so a
 * style object built in the render body would allocate on every frame (docs/10 §10).
 */
const styles = StyleSheet.create({
  body: { gap: spacing.s12 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s12 },
  grow: { flex: 1 },
  right: { alignItems: 'flex-end' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.sunken,
    paddingTop: spacing.s12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  pillWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s6 },
  pill: {
    height: 22,
    paddingHorizontal: spacing.s,
    borderRadius: radius.pill,
    backgroundColor: colors.sunken,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
});
