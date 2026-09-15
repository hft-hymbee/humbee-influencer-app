/**
 * Screen 10. Chip counts are period- AND manufacturer-scoped and come from /summary.
 * `mark` is semantic (UmangUtsav | SHOP | Approved | TRIP), never a filename, and `status`
 * stays English — it is a key the app maps to colour, not copy.
 *
 * V2: `company_esi_id` is required alongside `manufacturer_id`, and paging is offset-based.
 * The status filter still runs IN MEMORY (no refetch, no skeleton on a chip tap), even though
 * the endpoint would accept a `status` param.
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, query } from '../client';
import { qk } from '../keys';
import { DEFAULT_PAGE_SIZE, type Gift, type Paged, type Period, type RewardsSummary } from '../types';

type Scope = { manufacturerId: number | null; companyEsiId: number | null; period: Period };

export function useRewardsQuery({ manufacturerId, companyEsiId, period }: Scope) {
  return useInfiniteQuery({
    queryKey: qk.rewards(manufacturerId ?? 0, period),
    enabled: manufacturerId != null && companyEsiId != null,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get<Paged<Gift> & { company_esi_id: number }>(
        `/rewards${query({
          manufacturer_id: manufacturerId,
          company_esi_id: companyEsiId,
          period,
          page: pageParam,
          page_size: DEFAULT_PAGE_SIZE,
        })}`,
      ),
    getNextPageParam: last => (last.pagination.has_more ? last.pagination.page + 1 : undefined),
  });
}

export function useRewardsSummaryQuery({ manufacturerId, companyEsiId, period }: Scope) {
  return useQuery({
    queryKey: qk.rewardsSummary(manufacturerId ?? 0, period),
    queryFn: () =>
      api.get<RewardsSummary>(
        `/rewards/summary${query({
          manufacturer_id: manufacturerId,
          company_esi_id: companyEsiId,
          period,
        })}`,
      ),
    enabled: manufacturerId != null && companyEsiId != null,
  });
}
