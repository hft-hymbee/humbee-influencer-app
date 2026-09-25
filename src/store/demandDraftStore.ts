/**
 * Demand draft — NOT persisted. V2 capture is ONLINE-ONLY (`feature_flags.offline_demand_queue`
 * is false, and the body carries no `client_ref` to make a replay safe), so there is nothing to
 * survive a relaunch and no outbox behind it.
 *
 * The reset rules live in domain/demand.ts so they are testable and cannot be re-derived
 * inconsistently.
 */
import { create } from 'zustand';
import { EMPTY_DRAFT, resets, type DemandDraft } from '../domain/demand';
import type { DraftSite } from '../domain/site';

export type DemandTab = 'new' | 'mine';

type DraftState = {
  draft: DemandDraft;
  /**
   * Which sub-tab of the Demand module is showing. Lifted out of the screen because the
   * Demand Captured screen (07) is a ROOT route and its "View My Demands" button has to be
   * able to switch this — local screen state is unreachable from there.
   */
  tab: DemandTab;
  setTab: (tab: DemandTab) => void;
  /** `industryId` is the industry the tapped tile was listed under — not a separate step. */
  chooseManufacturer: (id: number, industryId: number | null) => void;
  chooseProduct: (id: number) => void;
  setQty: (qty: string) => void;
  setUom: (uom: string) => void;
  /** Commits the in-progress line to the cart. `uom` is the resolved one, never ''. */
  addLine: (label: string, uom: string) => void;
  removeLine: (productId: number) => void;
  /**
   * Attach or clear the construction site. It lives on the DRAFT rather than in the site
   * screens' own state so that backing out of the address form and returning keeps the pin and
   * the typed lines (spec §8, "Back from S6").
   */
  setSite: (site: DraftSite | null) => void;
  reset: () => void;
};

export const useDemandDraftStore = create<DraftState>(set => ({
  draft: EMPTY_DRAFT,
  tab: 'new',
  setTab: tab => set({ tab }),
  chooseManufacturer: (id, industryId) =>
    set(s => ({ draft: resets.onManufacturer(s.draft, id, industryId) })),
  chooseProduct: id => set(s => ({ draft: resets.onProduct(s.draft, id) })),
  setQty: qty => set(s => ({ draft: { ...s.draft, qty } })),
  setUom: uom => set(s => ({ draft: { ...s.draft, uom } })),
  addLine: (label, uom) => set(s => ({ draft: resets.addLine(s.draft, label, uom) })),
  removeLine: productId => set(s => ({ draft: resets.removeLine(s.draft, productId) })),
  setSite: site => set(s => ({ draft: resets.setSite(s.draft, site) })),
  reset: () => set({ draft: EMPTY_DRAFT, tab: 'new' }),
}));
