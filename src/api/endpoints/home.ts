/**
 * Screen 03 — ONE call fills the screen. Quick links are static navigation, not data.
 *
 * `GET /home` is the only read that is NOT manufacturer-scoped: it spans every mapping the
 * influencer has. No `generated_at` in V2.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../client';
import { qk } from '../keys';
import type { Home } from '../types';

export function useHomeQuery() {
  return useQuery({ queryKey: qk.home(), queryFn: () => api.get<Home>('/home') });
}
