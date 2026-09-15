/**
 * Screen 09. Totals arrive PRE-NORMALISED into the manufacturer's reporting unit — the client
 * never converts UOMs (docs/design-spec/09-inventory-allocated.md).
 *
 * V2: `company_esi_id` is required alongside `manufacturer_id`, and paging is offset-based.
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, query } from '../client';
import { qk } from '../keys';
import { DEFAULT_PAGE_SIZE, type Allocation, type AllocationsSummary, type Paged, type Period } from '../types';

/** The pair is always sent together: an esi from another manufacturer is an ESI_MISMATCH. */
type Scope = { manufacturerId: number | null; companyEsiId: number | null; period: Period };

export function useAllocationsQuery({ manufacturerId, companyEsiId, period }: Scope) {
  return useInfiniteQuery({
    queryKey: qk.allocations(manufacturerId ?? 0, period),
    enabled: manufacturerId != null && companyEsiId != null,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get<Paged<Allocation> & { company_esi_id: number }>(
        `/allocations${query({
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

export function useAllocationsSummaryQuery({ manufacturerId, companyEsiId, period }: Scope) {
  return useQuery({
    queryKey: qk.allocationsSummary(manufacturerId ?? 0, period),
    queryFn: () =>
      api.get<AllocationsSummary>(
        `/allocations/summary${query({
          manufacturer_id: manufacturerId,
          company_esi_id: companyEsiId,
          period,
        })}`,
      ),
    enabled: manufacturerId != null && companyEsiId != null,
  });
}
