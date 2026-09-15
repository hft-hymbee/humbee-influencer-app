/** App bootstrap — one call at cold start. Drives entitlements, theme and the version gate. */
import { useQuery } from '@tanstack/react-query';
import { api } from '../client';
import { qk } from '../keys';
import type { Config } from '../types';

export function useConfigQuery(enabled = true) {
  return useQuery({
    queryKey: qk.config(),
    queryFn: () => api.get<Config>('/config'),
    enabled,
    staleTime: 30 * 60_000, // config changes rarely; do not spend a request per launch
  });
}
