/**
 * ViewModel for screen 06 — the app's core action and its only non-trivial state machine.
 *
 * All derivation lives in domain/demand.ts so it is testable without a renderer and cannot be
 * re-derived three different ways. This hook only composes.
 *
 * V2 shape: industries → manufacturers (two levels), then a SEPARATE products call for the
 * chosen manufacturer, then an atomic multi-product submission.
 *
 * The SCREEN, though, has one picker, not two: `allManufacturers` flattens the tree so the
 * influencer taps a manufacturer straight away. The industry rides along on each entry and is
 * recorded on the draft when a tile is tapped.
 */
import { useMemo } from 'react';
import {
  useIndustriesQuery, useManufacturerScope, useProductsQuery, useSubmitDemand,
} from '../../api';
import { useDemandDraftStore } from '../../store/demandDraftStore';
import {
  allManufacturers, canAddLine, draftItems, draftSummary, effectiveUom, findIndustry,
  findManufacturer, findProduct, isDraftSubmittable, isDuplicateLine, showQuantity, uomList,
} from '../../domain/demand';
import type { CreateDemandResult } from '../../api/types';

export function useCaptureDemand() {
  const { data: catalog, isPending } = useIndustriesQuery();
  const draft = useDemandDraftStore(s => s.draft);
  const store = useDemandDraftStore();
  const submit = useSubmitDemand();

  /**
   * The influencer's own manufacturer mappings, from GET /me. Used ONLY to attach the matching
   * `company_esi_id` when they capture against a manufacturer they are mapped to — the picker
   * deliberately also lists manufacturers they are not, and for those the field is omitted
   * (it is optional in V2).
   */
  const scope = useManufacturerScope();

  // Memoised: a fresh [] on every render would re-run the lookups below every time.
  const industries = useMemo(() => catalog?.industries ?? [], [catalog]);

  /**
   * The district the demand will be FILED against — read live from the industries payload,
   * never snapshotted into the draft.
   *
   * The contract asks that a cached tree cannot carry a stale district into a submit. Reading
   * `catalog.district_id` at submit time gives that for free: the same query that produced the
   * manufacturer tiles produces the district, so the two can never disagree, and a refetch
   * updates both at once. Copying it into the zustand draft when a tile is tapped would be the
   * one way to get them out of step.
   *
   * NOT `/me`'s district — see the comment on `CreateDemandBody.district_id`.
   */
  const districtId = catalog?.district_id;
  const industry = findIndustry(industries, draft.industryId);
  const manufacturer = findManufacturer(industries, draft.manufacturerId);
  /** The picker's only list: every manufacturer in the catalogue, deduped, industry attached. */
  const manufacturers = useMemo(() => allManufacturers(industries), [industries]);

  // Step 2 of the contract: the SKU list is fetched for the chosen manufacturer only.
  const productsQuery = useProductsQuery(draft.manufacturerId);
  const products = productsQuery.data;

  const uoms = uomList(manufacturer, products);
  const uom = effectiveUom(draft, manufacturer, products);
  const product = findProduct(products, draft.productId);

  const esiFor = (manufacturerId: number) =>
    scope.tabs.find(t => t.id === manufacturerId)?.companyEsiId;

  /**
   * Trail: Industry → Product → Quantity (component C11).
   * `value` is always display-ready; `done` decides the step's colour, and the trail marks the
   * first step that is not done as active. Fallbacks are "Not chosen" / "Not entered".
   */
  const lineCount = draft.lines.length + (canAddLine(draft) ? 1 : 0);
  const trailSteps = [
    {
      // Step 1 is the manufacturer now — the industry step is off the screen, so naming the
      // trail step "Industry" would point at a choice the user is never asked to make.
      label: 'Manufacturer',
      icon: 'Cluster' as const,
      done: !!manufacturer,
      value: manufacturer
        ? `${industry?.code ? `${industry.code} · ` : ''}${manufacturer.name}`
        : 'Not chosen',
    },
    {
      label: 'Product',
      icon: 'InventoryOutlined' as const,
      done: lineCount > 0,
      value: draft.lines.length > 1
        ? `${draft.lines.length} products`
        : product?.label ?? draft.lines[0]?.label ?? 'Not chosen',
    },
    {
      label: 'Quantity',
      icon: 'CheckCircle' as const,
      done: isDraftSubmittable(draft),
      value: draft.qty ? `${draft.qty} ${uom}` : draft.lines.length ? `${draft.lines.length} lines` : 'Not entered',
    },
  ];

  return {
    isSkeleton: isPending,
    industries,
    industry,
    manufacturer,
    /** THE picker — every manufacturer, flat. No industry step precedes it. */
    manufacturers,
    draft,
    uoms,
    uom,
    isLoadingProducts: productsQuery.isPending && draft.manufacturerId != null,
    productOptions: products?.items.map(p => ({ value: p.id, label: p.label })) ?? [],
    /** "1 pt / Kg" — per BASE unit, and the server's string. Never recompute a rate. */
    pointsHint: product?.points_hint ?? null,

    showQuantityCard: showQuantity(draft),
    canAdd: canAddLine(draft),
    isDuplicate: isDuplicateLine(draft, draft.productId),
    canSubmit: isDraftSubmittable(draft),
    summary: draftSummary(draft, manufacturer, products),
    trailSteps,

    chooseManufacturer: store.chooseManufacturer,
    chooseProduct: store.chooseProduct,
    setQty: store.setQty,
    setUom: store.setUom,
    addLine: () => store.addLine(product?.label ?? '', uom),
    removeLine: store.removeLine,
    reset: store.reset,

    isSubmitting: submit.isPending,

    /**
     * ATOMIC: if any line fails validation nothing is stored, so a receipt can never list a
     * product that was not saved. The in-progress line is folded into `items`, so a
     * single-product capture never needs an explicit "Add" tap.
     */
    async submitDemand(): Promise<CreateDemandResult | null> {
      if (draft.manufacturerId == null) return null;
      const items = draftItems(draft, uom);
      if (!items.length) return null;
      return submit.mutateAsync({
        manufacturer_id: draft.manufacturerId,
        company_esi_id: esiFor(draft.manufacturerId),
        district_id: districtId,
        items,
      });
    },
  };
}
