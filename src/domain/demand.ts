/**
 * Capture Demand rules — docs/design-spec/06-capture-demand.md + 06-state-and-navigation.md,
 * reworked against the V2 contract.
 *
 * WHAT V2 CHANGED, and why this file looks different:
 *   - The picker is TWO levels (industry → manufacturer), not four. Sub-industry is gone, and
 *     with it the sub-industry UOM fallback. **The industry level was then removed from the
 *     SCREEN as well** (client decision, after the V2 rework): the payload is still a tree, but
 *     `allManufacturers` flattens it and the user picks a manufacturer in one tap. The industry
 *     survives as metadata on the draft and in the trail, not as a step.
 *   - Products are a SEPARATE fetch for the chosen manufacturer, not embedded in the tree.
 *   - There is no "no manufacturer onboarded" branch any more: the industry list is already
 *     filtered to manufacturers active in the caller's region, so an industry with no
 *     manufacturer simply does not appear. `sku_category_id` no longer exists on the wire.
 *   - A submission carries a LIST of products, so the draft holds a cart of lines.
 *
 * Kept pure so it is testable without a renderer, and so the screen cannot re-derive the same
 * rule three different ways.
 */
import type { CatalogManufacturer, DemandItemInput, Industry, ManufacturerProducts, Product } from '../api/types';

/** One line of the cart. `uom` is always resolved — never the empty string. */
export type DraftLine = { productId: number; label: string; qty: string; uom: string };

export type DemandDraft = {
  industryId: number | null;
  manufacturerId: number | null;
  /** The line being composed, before it is added to `lines`. */
  productId: number | null;
  qty: string;
  /** '' means "first UOM the manufacturer offers". */
  uom: string;
  lines: DraftLine[];
};

export const EMPTY_DRAFT: DemandDraft = {
  industryId: null, manufacturerId: null, productId: null, qty: '', uom: '', lines: [],
};

export function findIndustry(industries: Industry[], id: number | null): Industry | undefined {
  return id == null ? undefined : industries.find(i => i.id === id);
}

/** A manufacturer plus the industry it was listed under — the picker's row type. */
export type PickableManufacturer = CatalogManufacturer & {
  industryId: number;
  industryCode: string;
  industryName: string;
};

/**
 * EVERY manufacturer in the catalogue, flattened out of the industry tree.
 *
 * The picker shows manufacturers directly — the industry step was removed from screen 06 —
 * so the two-level payload has to collapse to one list. The industry is not discarded: it
 * rides along on each entry, because the draft still records `industryId` and the trail still
 * shows the industry code beside the manufacturer name.
 *
 * DEDUPED BY ID. The same manufacturer can be listed under more than one industry (a cement
 * brand that also sells TMT), and the API takes the manufacturer id alone — so a duplicate
 * tile would be two ways to make the identical selection. First listing wins, which keeps the
 * server's ordering.
 */
export function allManufacturers(industries: Industry[]): PickableManufacturer[] {
  const seen = new Set<number>();
  const out: PickableManufacturer[] = [];
  for (const ind of industries) {
    for (const m of ind.manufacturers) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      out.push({ ...m, industryId: ind.id, industryCode: ind.code, industryName: ind.name });
    }
  }
  return out;
}

/**
 * Manufacturers are searched across EVERY industry, not just the selected one: the same
 * manufacturer can be listed under more than one industry code, and the id is what the API
 * takes.
 */
export function findManufacturer(industries: Industry[], id: number | null): CatalogManufacturer | undefined {
  if (id == null) return undefined;
  for (const ind of industries) {
    const found = ind.manufacturers.find(m => m.id === id);
    if (found) return found;
  }
  return undefined;
}

export function findProduct(products: ManufacturerProducts | undefined, id: number | null): Product | undefined {
  if (!products || id == null) return undefined;
  return products.items.find(p => p.id === id);
}

/**
 * UOM list: the products payload's (authoritative for what the API will accept), else the
 * manufacturer's from the tree, else ['Units']. The client NEVER invents a unit — an empty
 * `uoms` from the server means the manufacturer is not fully configured, and the fallback keeps
 * the screen usable rather than blank.
 */
export function uomList(
  manufacturer: CatalogManufacturer | undefined,
  products: ManufacturerProducts | undefined,
): string[] {
  if (products?.uoms?.length) return products.uoms;
  if (manufacturer?.uoms?.length) return manufacturer.uoms;
  return ['Units'];
}

export function effectiveUom(
  draft: DemandDraft,
  manufacturer: CatalogManufacturer | undefined,
  products: ManufacturerProducts | undefined,
): string {
  const list = uomList(manufacturer, products);
  // A persisted UOM that the chosen manufacturer does not offer would be UOM_NOT_ALLOWED.
  if (draft.uom && list.includes(draft.uom)) return draft.uom;
  return list[0] ?? 'Units';
}

/** The quantity card appears once a manufacturer is chosen — there is no second branch in V2. */
export function showQuantity(draft: DemandDraft): boolean {
  return draft.manufacturerId != null;
}

function parsedQty(qty: string): number {
  const n = parseFloat(qty);
  return Number.isFinite(n) ? n : 0;
}

/**
 * A product may appear ONLY ONCE per submission (V2 §4). Enforced here so a duplicate is caught
 * in the cart rather than costing a round trip and an atomic rejection.
 */
export function isDuplicateLine(draft: DemandDraft, productId: number | null): boolean {
  return productId != null && draft.lines.some(l => l.productId === productId);
}

/** "Add" is enabled once a product is picked, the quantity is > 0, and it is not already in. */
export function canAddLine(draft: DemandDraft): boolean {
  return draft.productId != null
    && parsedQty(draft.qty) > 0
    && !isDuplicateLine(draft, draft.productId);
}

/**
 * Submit is enabled when the cart has at least one line, or the line being composed is itself
 * valid — so a single-product capture never requires an explicit "Add" tap first.
 */
export function isDraftSubmittable(draft: DemandDraft): boolean {
  return draft.manufacturerId != null && (draft.lines.length > 0 || canAddLine(draft));
}

/**
 * The body's `items`. The in-progress line is folded in, so the common single-product path is
 * one tap. Quantities are parsed here and nowhere else.
 */
export function draftItems(draft: DemandDraft, resolvedUom: string): DemandItemInput[] {
  const items: DemandItemInput[] = draft.lines.map(l => ({
    product_id: l.productId,
    quantity: { value: parsedQty(l.qty), uom: l.uom },
  }));
  if (canAddLine(draft)) {
    items.push({ product_id: draft.productId!, quantity: { value: parsedQty(draft.qty), uom: resolvedUom } });
  }
  return items;
}

/**
 * Reset rules. Getting these wrong strands the form in an unsubmittable state — or worse, sends
 * a product id belonging to a manufacturer the user has since switched away from, which the
 * server rejects as PRODUCT_NOT_FOUND. That is why they live here rather than inline.
 */
export const resets = {
  /**
   * Changing manufacturer empties the cart: its lines are that manufacturer's product ids.
   *
   * `industryId` is recorded FROM the chosen manufacturer rather than chosen separately — the
   * industry step is no longer on screen 06, but the industry is still what the trail shows
   * beside the manufacturer name, and it is carried on every entry `allManufacturers` returns.
   */
  onManufacturer: (d: DemandDraft, manufacturerId: number, industryId: number | null = null): DemandDraft =>
    d.manufacturerId === manufacturerId
      ? d
      : { ...d, industryId, manufacturerId, productId: null, qty: '', uom: '', lines: [] },
  onProduct: (d: DemandDraft, productId: number): DemandDraft => ({ ...d, productId }),
  addLine: (d: DemandDraft, label: string, uom: string): DemandDraft =>
    canAddLine(d)
      ? { ...d, lines: [...d.lines, { productId: d.productId!, label, qty: d.qty, uom }], productId: null, qty: '' }
      : d,
  removeLine: (d: DemandDraft, productId: number): DemandDraft => ({
    ...d, lines: d.lines.filter(l => l.productId !== productId),
  }),
};

/** The summary line under the quantity field: "{qty or 0} {UOM} of {product or manufacturer}". */
export function draftSummary(
  draft: DemandDraft,
  manufacturer: CatalogManufacturer | undefined,
  products: ManufacturerProducts | undefined,
): string {
  const uom = effectiveUom(draft, manufacturer, products);
  const qty = draft.qty || '0';
  const product = findProduct(products, draft.productId)?.label;
  return `${qty} ${uom} of ${product ?? manufacturer?.name ?? '—'}`;
}
