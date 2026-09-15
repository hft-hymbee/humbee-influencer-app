/**
 * Screen 10 — Rewards. docs/design-spec/04-screens/10-rewards.md
 *
 * There is NO "next lucky draw entry — N points to go" progress card here. It was removed by
 * decision. Do not reintroduce it.
 *
 * Status chips filter IN MEMORY; their counts are period- and manufacturer-scoped and come from
 * /summary, in the server's own order with "All" first. `mark` is semantic, never a filename,
 * and `status` stays English — it is a key, not copy.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { colors, spacing } from '../../theme';
import {
  Card, ChipRow, EmptyState, Icon, ManufacturerTabs, PeriodPills, ProductMark, Screen,
  ScreenHeader, SkeletonBlock, SkeletonCards, StatusBadge, Text,
} from '../../components';
import { UtsavBanner } from './components/UtsavBanner';
import { useConfigQuery, useManufacturerScope, useRewardsQuery, useRewardsSummaryQuery } from '../../api';
import { useSelectionStore } from '../../store/selectionStore';
import type { Gift } from '../../api/types';

function GiftCard({ gift }: { gift: Gift }) {
  return (
    <Card padding={16}>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <ProductMark name={gift.mark} size={48} />
          <View style={styles.grow}>
            <Text variant="rowTitle" numberOfLines={1}>{gift.gift}</Text>
            {/* The server composes the release-date label; don't re-format the ISO date. */}
            <Text variant="meta" color={colors.textTertiary}>
              {`${gift.kind} · Released ${gift.released_on_label}`}
            </Text>
          </View>
          <StatusBadge status={gift.status} />
        </View>

        {gift.vcp.name ? (
          <View style={styles.footerTight}>
            <Icon name="VCPManagement" size={16} color={colors.primary100} />
            <Text variant="meta" color={colors.textTertiary}>{gift.vcp.name}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

export function RewardsScreen({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { data: config } = useConfigQuery();
  const scope = useManufacturerScope();

  const period = useSelectionStore(s => s.period);
  const setPeriod = useSelectionStore(s => s.setPeriod);

  const [filter, setFilter] = useState('All');

  // Switching manufacturer resets the status filter to All (design spec reset rules).
  useEffect(() => { setFilter('All'); }, [scope.manufacturerId]);

  const args = { manufacturerId: scope.manufacturerId, companyEsiId: scope.companyEsiId, period };
  const list = useRewardsQuery(args);
  const summary = useRewardsSummaryQuery(args);

  const items = list.data?.pages.flatMap(p => p.items) ?? [];
  const visible = filter === 'All' ? items : items.filter(g => g.status === filter);

  const header = (
    <>
      <ScreenHeader title="Rewards" subtitle="Gifts you have earned" onPressAccount={onOpenProfile} />
      <ManufacturerTabs tabs={scope.tabs} value={scope.manufacturerId} onChange={scope.setManufacturer} />
    </>
  );

  if (scope.hasNoManufacturer) {
    return (
      <Screen header={header}>
        <EmptyState
          title="No manufacturer linked yet"
          body="Gifts appear once a manufacturer is linked to your account."
        />
      </Screen>
    );
  }

  if (scope.isPending || list.isPending) {
    return (
      <Screen header={header}>
        <View style={{ gap: spacing.s12 }}>
          <SkeletonBlock height={150} />
          <SkeletonCards count={3} height={120} />
        </View>
      </Screen>
    );
  }

  const utsav = summary.data?.utsav;

  return (
    <Screen header={header} padded={false} scroll={false}>
      <FlashList
        data={visible}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: spacing.m, paddingTop: spacing.s14, paddingBottom: spacing.m }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.s12 }} />}
        showsVerticalScrollIndicator={false}
        onRefresh={() => { list.refetch(); summary.refetch(); }}
        refreshing={list.isFetching && !list.isPending && !list.isFetchingNextPage}
        onEndReachedThreshold={0.5}
        // Paging follows the UNFILTERED list: the chip filter is in-memory, so a narrow filter
        // must still be able to pull the next page in behind it.
        onEndReached={() => { if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage(); }}
        ListHeaderComponent={
          <View style={{ gap: spacing.s12, paddingBottom: spacing.s12 }}>
            <PeriodPills options={config?.periods} value={period} onChange={setPeriod} />
            {/* The banner and the filters STAY when a filter returns nothing. */}
            {utsav?.eligible ? <UtsavBanner utsav={utsav} /> : null}
            <ChipRow
              options={summary.data?.counts ?? [{ value: 'All', label: 'All' }]}
              value={filter}
              onChange={setFilter}
            />
          </View>
        }
        renderItem={({ item }) => <GiftCard gift={item} />}
        ListEmptyComponent={
          <EmptyState title="No gifts in this status" body="Try another status or manufacturer." />
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
  footerTight: {
    borderTopWidth: 1,
    borderTopColor: colors.sunken,
    paddingTop: spacing.s12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s6,
  },
});
