/**
 * ViewModel for screen 05.
 *
 * Every value below is passed THROUGH from the server. rank, gap and show_podium are explicitly
 * server-owned — the client must never compute them, or it will eventually disagree with the
 * ledger. V2 adds `gap_label`, so even the gap SENTENCE is the server's now.
 *
 * The manufacturer tabs come from GET /me, which is the only payload carrying the
 * `company_esi_id` this endpoint requires alongside the manufacturer id.
 */
import { useCallback, useState } from 'react';
import { useLeaderboardQuery, useManufacturerScope, useMeQuery } from '../../api';

export function useLeaderboardScreen() {
  const scope = useManufacturerScope();
  const me = useMeQuery();
  const q = useLeaderboardQuery(scope.manufacturerId, scope.companyEsiId);
  const d = q.data;

  /**
   * Pull-to-refresh re-reads /me AS WELL as the board: /me is where a newly linked or unlinked
   * manufacturer shows up, and a failed /me is what the error state may be showing. The
   * leaderboard is refetched only when it has a scope — `refetch()` bypasses `enabled` and
   * would send nulls; once /me produces a scope the query enables itself and fetches.
   *
   * The spinner tracks the PULL, not `isFetching`, so a background refetch on focus does not
   * yank the indicator down on its own.
   */
  const [isRefreshing, setRefreshing] = useState(false);
  const hasScope = scope.manufacturerId != null && scope.companyEsiId != null;
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([me.refetch(), hasScope ? q.refetch() : null]);
    } finally {
      setRefreshing(false);
    }
  }, [me, q, hasScope]);

  return {
    tabs: scope.tabs,
    manufacturerId: scope.manufacturerId,
    setManufacturer: scope.setManufacturer,
    /** Mapped to no manufacturer: an empty state, not an error (V2 §3). */
    hasNoManufacturer: scope.hasNoManufacturer,

    /**
     * Per-query, not global: switching to a CACHED manufacturer is instant with no skeleton.
     * A global loading flag would break that, and the design requires it.
     */
    // A disabled query stays `isPending` forever, so without the scope guard a failed /me or an
    // unmapped influencer would sit on the skeleton and never reach their own states.
    isSkeleton: scope.isPending || (hasScope && q.isPending),
    isError: q.isError || scope.isError,
    refetch: refresh,
    isRefreshing,

    manufacturerName: d?.manufacturer.name ?? '',
    unit: d?.unit ?? '',
    district: d?.district ?? '',
    showPodium: d?.show_podium ?? false,
    pointsRule: d?.points_rule,
    top: d?.top ?? [],
    me: d?.me,
    /** The influencer's OWN id — this is what highlights their row, not the esi. */
    myInfluencerId: d?.me?.influencer_id,
  };
}
