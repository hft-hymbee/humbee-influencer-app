/**
 * Query-key factory — docs/10-rn-cli-implementation-guide.md §5.3.
 *
 * Every key in ONE place so a cache invalidation cannot miss a variant.
 *
 * The (screen, manufacturer, period) shape is what makes the designed behaviour fall out for
 * free: switching to a CACHED manufacturer is instant with no skeleton, an uncached one shows
 * the skeleton, and a status-filter change never refetches because it filters data already in
 * memory. A global `loading` flag would break that last one — which the design spec requires.
 *
 * V2 note: the manufacturer-scoped reads take BOTH `manufacturer_id` and `company_esi_id`, and
 * the esi is per manufacturer. The manufacturer id alone still identifies the cache entry — one
 * esi per manufacturer per influencer — so the keys keep their shape.
 */
import type { Period } from './types';

export const qk = {
  config:             ()                           => ['config'] as const,
  me:                 ()                           => ['me'] as const,
  canDeleteAccount:   ()                           => ['users', 'can-delete-account'] as const,
  industries:         ()                           => ['demand-capture', 'industries'] as const,
  products:           (mfrId: number)              => ['demand-capture', 'products', mfrId] as const,
  demands:            (mfrId: number)              => ['demand-capture', 'demands', mfrId] as const,
  home:               ()                           => ['home'] as const,
  leaderboard:        (mfrId: number)              => ['leaderboard', mfrId] as const,
  allocations:        (mfrId: number, p: Period)   => ['allocations', mfrId, p] as const,
  allocationsSummary: (mfrId: number, p: Period)   => ['allocations', 'summary', mfrId, p] as const,
  rewards:            (mfrId: number, p: Period)   => ['rewards', mfrId, p] as const,
  rewardsSummary:     (mfrId: number, p: Period)   => ['rewards', 'summary', mfrId, p] as const,
} as const;
