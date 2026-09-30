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
    /**
     * CONTRACT MISMATCH, LABELLED RATHER THAN COMPUTED AROUND.
     *
     * The spec asks this tile for "Rewards allotted · all manufacturers" — an all-time count
     * matching the My Rewards list below it. The server does not send that number. What it
     * sends is `stats.rewards_allotted`, which sits in the same block as `allocations_this_year`
     * and `points_this_year` and is scoped to `stats.financial_year`: a live account returns
     *   { rewards_allotted: 0, points_this_year: 1008, financial_year: "2026-27" }
     * while `recent_rewards` carries a gift released 11 Feb 2026 — FY 2025-26, so outside the
     * window. The 0 is arithmetically right and the label was wrong.
     *
     * We cannot recount it here: `recent_rewards` is only the 4 most recent, and /rewards is
     * manufacturer- and period-scoped, so any client-side total would be a number the server
     * never sent (working rule 3). So the label names the window instead. Raised as a contract
     * gap in docs/06-inputs-needed.md — if the tile is meant to be all-time, the fix is an
     * all-time field on /home, not arithmetic here.
     */
    rewardsAllottedLabel: data?.stats.financial_year
      ? `Rewards allotted · FY ${data.stats.financial_year}`
      : 'Rewards allotted',
    pointsThisYear: data?.stats.points_this_year_label ?? (data ? formatNumber(data.stats.points_this_year) : '0'),
    recentRewards: data?.recent_rewards ?? [],
    quickLinks,
    canSeeRewards: can(entitlements, 'rewards'),
  };
}
