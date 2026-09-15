/**
 * Screen 04, plus the manufacturer scope every other manufacturer-bound screen runs on.
 *
 * `GET /me` is the source of truth for the manufacturer switcher in V2: it is the ONLY payload
 * carrying `company_esi_id`, which — paired with `manufacturer_id` — every scoped read requires.
 * The industry tree no longer feeds the tabs; it is the demand-capture picker and nothing else.
 *
 * `rows` is server-driven. Trade is intentionally not shown as a profile field.
 */
import { useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../client';
import { qk } from '../keys';
import { useSelectionStore } from '../../store/selectionStore';
import type { CanDeleteAccount, Me, MfrTab } from '../types';

export function useMeQuery() {
  return useQuery({ queryKey: qk.me(), queryFn: () => api.get<Me>('/me') });
}

/** Order preserved, de-duplicated. Empty means the influencer is mapped to no manufacturer. */
export function manufacturerTabs(me: Me | undefined): MfrTab[] {
  if (!me) return [];
  const seen = new Set<number>();
  const tabs: MfrTab[] = [];
  for (const m of me.manufacturers) {
    if (seen.has(m.manufacturer_id)) continue;
    seen.add(m.manufacturer_id);
    tabs.push({
      id: m.manufacturer_id,
      name: m.manufacturer_name,
      logoUrl: m.manufacturer_logo,
      companyEsiId: m.company_esi_id,
      trade: m.trade,
    });
  }
  return tabs;
}

/**
 * The (manufacturer_id, company_esi_id) pair a scoped screen runs on.
 *
 * Resolved here rather than in each screen because the pair must never be split: sending one
 * manufacturer's esi with another's id is exactly the ESI_MISMATCH the backend refuses. The
 * persisted selection is validated against the live list on every render, so a manufacturer the
 * influencer has been unmapped from falls back to the first available rather than 401-ing every
 * call on the screen.
 */
export function useManufacturerScope() {
  const { data: me, isPending, isError } = useMeQuery();
  const tabs = useMemo(() => manufacturerTabs(me), [me]);

  const stored = useSelectionStore(s => s.manufacturerId);
  const setManufacturer = useSelectionStore(s => s.setManufacturer);

  const active = tabs.find(t => t.id === stored) ?? tabs[0];

  // First run has no persisted selection; a stale one is corrected the same way.
  useEffect(() => {
    if (active && active.id !== stored) setManufacturer(active.id);
  }, [active, stored, setManufacturer]);

  return {
    tabs,
    /** null until /me resolves, or when the influencer is mapped to no manufacturer. */
    manufacturerId: active?.id ?? null,
    companyEsiId: active?.companyEsiId ?? null,
    trade: active?.trade ?? null,
    setManufacturer,
    isPending,
    isError,
    /** Every manufacturer-scoped screen shows an empty state, not an error, for this. */
    hasNoManufacturer: !isPending && tabs.length === 0,
  };
}

/**
 * Deletion is the PLATFORM's flow in V2, not an influencer endpoint, and there is no OTP step.
 * `can-delete-account` performs real business checks and CAN refuse, so it is called before the
 * button is offered — never assumed.
 */
export function useCanDeleteAccountQuery() {
  return useQuery({
    queryKey: qk.canDeleteAccount(),
    queryFn: () => api.platform.get<CanDeleteAccount>('/users/can-delete-account'),
  });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: () => api.platform.del<{ deleted?: boolean }>('/users') });
}
