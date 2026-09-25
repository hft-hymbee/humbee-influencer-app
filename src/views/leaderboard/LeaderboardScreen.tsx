/**
 * Screen 05 — Leaderboard. docs/design-spec/04-screens/05-leaderboard.md
 *
 * NO time or date filter — this is the live standing. Do not add PeriodPills here.
 * The sticky current-user card is the last child and is always visible.
 */
import React from 'react';
import { View } from 'react-native';
import { spacing } from '../../theme';
import {
  EmptyState, ManufacturerTabs, Screen, ScreenHeader, SkeletonBlock, SkeletonCards,
} from '../../components';
import { Podium } from './components/Podium';
import { LeaderboardTable } from './components/LeaderboardTable';
import { StickyMeCard } from './components/StickyMeCard';
import { PointsExplainer } from './components/PointsExplainer';
import { useLeaderboardScreen } from './useLeaderboardScreen';

export function LeaderboardScreen({ onOpenProfile }: { onOpenProfile: () => void }) {
  const vm = useLeaderboardScreen();

  const header = (
    <>
      <ScreenHeader title="Leaderboard" subtitle="Top 10 in your district" onPressAccount={onOpenProfile} />
      {/* Tabs stay usable during loading and on error — only the body swaps. */}
      <ManufacturerTabs tabs={vm.tabs} value={vm.manufacturerId} onChange={vm.setManufacturer} />
    </>
  );

  if (vm.isSkeleton) {
    return (
      <Screen header={header} contentStyle={{ padding: spacing.m, gap: spacing.m }}>
        <SkeletonBlock height={64} />
        <SkeletonBlock height={150} />
        <SkeletonCards count={6} height={52} />
      </Screen>
    );
  }

  /**
   * An influencer mapped to no manufacturer gets an EMPTY STATE, not an error: every
   * manufacturer-scoped read would return ESI_UNKNOWN for them, which is a mapping gap for Ops
   * to fix, not a failure the user can retry (V2 §3).
   */
  if (vm.hasNoManufacturer) {
    return (
      <Screen header={header} onRefresh={vm.refetch} refreshing={vm.isRefreshing}>
        <EmptyState
          title="No manufacturer linked yet"
          body="Your HUMBEE ranking appears once a manufacturer is linked to your account."
        />
      </Screen>
    );
  }

  if (vm.isError) {
    return (
      <Screen header={header} onRefresh={vm.refetch} refreshing={vm.isRefreshing}>
        <EmptyState title="Could not load the leaderboard" body="Pull down to try again." />
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      padded={false}
      onRefresh={vm.refetch}
      refreshing={vm.isRefreshing}
      footer={vm.me ? <StickyMeCard me={vm.me} unit={vm.unit} /> : undefined}
    >
      <View style={{ paddingHorizontal: spacing.m, paddingTop: spacing.s14, paddingBottom: spacing.m, gap: spacing.m }}>
        {vm.pointsRule ? (
          <PointsExplainer manufacturerName={vm.manufacturerName} rule={vm.pointsRule} />
        ) : null}

        {/* Server-decided. Fewer than 3 ranked influencers → no podium. */}
        {vm.showPodium ? <Podium rows={vm.top.slice(0, 3)} unit={vm.unit} /> : null}

        {vm.top.length ? (
          // Render what exists; never pad to 10.
          <LeaderboardTable rows={vm.top} unit={vm.unit} currentInfluencerId={vm.myInfluencerId} />
        ) : (
          <EmptyState
            title="No ranking yet"
            body="Once allocations are recorded for this manufacturer, the standing appears here."
          />
        )}

      </View>
    </Screen>
  );
}
