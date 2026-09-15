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
import { useLeaderboardQuery, useManufacturerScope } from '../../api';

export function useLeaderboardScreen() {
  const scope = useManufacturerScope();
  const q = useLeaderboardQuery(scope.manufacturerId, scope.companyEsiId);
  const d = q.data;

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
    isSkeleton: scope.isPending || q.isPending,
    isError: q.isError || scope.isError,
    refetch: q.refetch,
    isRefreshing: q.isFetching && !q.isPending,

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
