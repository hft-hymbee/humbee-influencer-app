/**
 * Screens 06, 07, 08 — the Demand Capture module. Replaces V1's `catalog` + `demands` pair.
 *
 * Three calls, in the order the screen makes them:
 *   1. `GET /demand-capture/industries`            — the picker, TWO levels deep
 *   2. `GET /demand-capture/manufacturers/{id}/products` — the SKUs of the chosen manufacturer
 *   3. `POST /demand-capture/demands`              — a multi-product, atomic submission
 *
 * Plus `GET /demand-capture/demands`, which REQUIRES a `manufacturer_id`. There is no
 * cross-manufacturer demand list, and no summary endpoint at all.
 *
 * Capture is ONLINE-ONLY in V2: no `client_ref`, no `Idempotency-Key`, no batch drain. The
 * offline outbox went with them (`feature_flags.offline_demand_queue` is false).
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, query } from '../client';
import { isStaleDistrict } from '../errors';
import { qk } from '../keys';
import {
  DEFAULT_PAGE_SIZE,
  type CreateDemandBody, type CreateDemandResult, type DemandCaptureIndustries,
  type DemandList, type ManufacturerProducts,
} from '../types';

/**
 * Cached hard: `catalog_version` from GET /config is the cache-buster, so in steady state this
 * is not re-fetched at all. The list is region-scoped server-side — to the district of the VCP
 * behind the influencer's last allocation, not the one on their profile.
 */
export function useIndustriesQuery() {
  return useQuery({
    queryKey: qk.industries(),
    queryFn: () => api.get<DemandCaptureIndustries>('/demand-capture/industries'),
    staleTime: 60 * 60_000,
  });
}

/**
 * Pull-to-refresh for the capture screen's catalogue.
 *
 * Refetches the industry tree, which is the part that is cached hard (an hour, and in steady
 * state not re-fetched at all because `catalog_version` gates it). The SKU lists carry
 * `staleTime: 0` and so need nothing dropped here — the next manufacturer pick fetches them
 * fresh by itself.
 */
export function useRefreshCatalogue() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: qk.industries() });
}

/**
 * `company_esi_id` is deliberately NOT sent: the picker lists manufacturers the influencer is
 * not yet mapped to, and those must still open (V2 §4).
 *
 * NOT CACHED. `staleTime: 0` means every manufacturer pick hits the network — including
 * re-picking one chosen a moment ago, because the key becomes active again while stale and
 * refetches. SKUs and their `points_hint` are the one part of the catalogue that moves without
 * `catalog_version` moving, and a demand raised against a withdrawn SKU is rejected at submit,
 * so a stale list costs the user a whole capture. One small request per pick buys that back.
 *
 * `gcTime` is left at the default: the previous response stays in cache and renders while the
 * refetch is in flight, which keeps the Select from flashing empty on a re-pick. `isPending`
 * (not `isFetching`) drives the skeleton, so only a first-ever load shows one.
 */
export function useProductsQuery(manufacturerId: number | null) {
  return useQuery({
    queryKey: qk.products(manufacturerId ?? 0),
    queryFn: () => api.get<ManufacturerProducts>(`/demand-capture/manufacturers/${manufacturerId}/products`),
    enabled: manufacturerId != null,
    staleTime: 0,
  });
}

/**
 * Offset-paged and manufacturer-scoped. `has_more` is the only signal — no totals are returned.
 * A row arriving between two page requests shifts the window and can re-show a row; that drift
 * is inherent to offset paging and was accepted when the cursor was dropped (V2 §2).
 */
export function useDemandsQuery(manufacturerId: number | null) {
  return useInfiniteQuery({
    queryKey: qk.demands(manufacturerId ?? 0),
    enabled: manufacturerId != null,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get<DemandList>(
        `/demand-capture/demands${query({
          manufacturer_id: manufacturerId,
          page: pageParam,
          page_size: DEFAULT_PAGE_SIZE,
        })}`,
      ),
    getNextPageParam: last => (last.pagination.has_more ? last.pagination.page + 1 : undefined),
  });
}

/**
 * Submit. ATOMIC: if any line fails validation (unknown product, unit not allowed for it)
 * nothing is stored, so the receipt can never list a product that was not saved.
 *
 * A product may appear only ONCE per submission — enforced in domain/demand.ts before we get
 * here, so a duplicate is a bug in the cart, not a server round trip.
 */
export function useSubmitDemand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDemandBody) =>
      api.post<CreateDemandResult>('/demand-capture/demands', body),
    onSuccess: (_result, body) => {
      qc.invalidateQueries({ queryKey: qk.demands(body.manufacturer_id) });
      qc.invalidateQueries({ queryKey: qk.home() });
    },
    /**
     * DISTRICT_INVALID means the `district_id` this submission carried names no district — the
     * industry tree it came from is stale. Drop it here rather than in the screen: the district
     * and the manufacturer tiles come from the SAME cached payload, so re-fetching is what
     * makes the next attempt use a district that still resolves. Nothing was stored, so the
     * draft is untouched and the user only has to re-pick.
     */
    onError: (error) => {
      if (isStaleDistrict(error)) qc.invalidateQueries({ queryKey: qk.industries() });
    },
  });
}
