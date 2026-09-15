/**
 * Screen 05. NO period param — this is the LIVE standing, computed per request.
 *
 * Never compute rank, gap or podium visibility on the client; all three arrive computed. V2
 * also removed `computed_at` / `freshness_seconds`, so there is nothing to build a refetch
 * timer around: every response is already current.
 */
import { useQuery } from '@tanstack/react-query';
import { api, query } from '../client';
import { qk } from '../keys';
import type { Leaderboard } from '../types';

export function useLeaderboardQuery(manufacturerId: number | null, companyEsiId: number | null) {
  return useQuery({
    queryKey: qk.leaderboard(manufacturerId ?? 0),
    queryFn: () =>
      api.get<Leaderboard>(
        `/leaderboard${query({ manufacturer_id: manufacturerId, company_esi_id: companyEsiId })}`,
      ),
    enabled: manufacturerId != null && companyEsiId != null,
  });
}
