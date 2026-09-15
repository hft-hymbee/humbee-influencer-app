/**
 * ViewModel for screen 03 — docs/10-rn-cli-implementation-guide.md §3.
 *
 * The View gets a flat, render-ready object. Every number here is passed THROUGH from the
 * server; nothing is computed. `points_this_year_label` in particular is the server's en-IN
 * formatting, not ours.
 */
import { useHomeQuery } from '../../api';
import { formatNumber } from '../../domain/format';
import { can } from '../../domain/entitlements';
import { useSessionStore } from '../../store/sessionStore';

export function useHomeScreen() {
  const q = useHomeQuery();
  const entitlements = useSessionStore(s => s.entitlements);
  const data = q.data;

  /**
   * Quick links are DERIVED from entitlements, exactly like the bottom nav
   * (docs/09-saas-and-module-architecture.md §6). A tenant who has not bought Rewards must not
   * get a dead tile here — this is the concrete case the module architecture exists to catch.
   */
  const quickLinks = (
    [
      { module: 'leaderboard', label: 'Leaderboard',    meta: 'Top 10 per manufacturer', icon: 'PerformanceOutlined', route: 'Leaderboard' },
      { module: 'demand',      label: 'Capture Demand', meta: 'Raise a new demand',      icon: 'ShoppingCartOutlined', route: 'Demand' },
      { module: 'allocation',  label: 'Allocations',    meta: 'Inventory allocated',     icon: 'InventoryOutlined',   route: 'Allocation' },
      { module: 'rewards',     label: 'Rewards',        meta: 'Gifts and Umang Utsav',   icon: 'RewardsOutlined',     route: 'Rewards' },
    ] as const
  ).filter(link => can(entitlements, link.module));

  return {
    isSkeleton: q.isPending,
    isError: q.isError,
    isStale: q.isStale && !q.isFetching,
    refetch: q.refetch,
    isRefreshing: q.isFetching && !q.isPending,

    name: data?.influencer.name ?? '',
    banners: data?.banners ?? [],
    // Prefer the server's label; formatNumber is the fallback for a cached payload without one.
    rewardsAllotted: data ? formatNumber(data.stats.rewards_allotted) : '0',
    pointsThisYear: data?.stats.points_this_year_label ?? (data ? formatNumber(data.stats.points_this_year) : '0'),
    recentRewards: data?.recent_rewards ?? [],
    quickLinks,
    canSeeRewards: can(entitlements, 'rewards'),
  };
}
