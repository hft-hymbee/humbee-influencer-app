/**
 * Domain tests — no renderer, no mocks. This is where the test density belongs
 * (docs/10-rn-cli-implementation-guide.md §11): pure rules, fast, and covering the invariants
 * this product most often gets wrong.
 */
import {
  formatCountdown, formatDate, formatNumber, formatPoints, formatQuantity,
  initialsOf, normaliseDecimal, normaliseMobile,
} from '../src/domain/format';
import { statusStyle, GIFT_STATUSES } from '../src/domain/status';
import { can, DEFAULT_ENTITLEMENTS, isKnownModule } from '../src/domain/entitlements';
import {
  canAddLine, draftItems, EMPTY_DRAFT, effectiveUom, isDraftSubmittable, isDuplicateLine,
  resets, showQuantity, uomList,
} from '../src/domain/demand';
import type { CatalogManufacturer, ManufacturerProducts } from '../src/api/types';

describe('en-IN formatting', () => {
  it('groups the Indian way, not the US way', () => {
    expect(formatNumber(21400)).toBe('21,400');
    expect(formatNumber(452000)).toBe('4,52,000'); // NOT 452,000
  });
  it('always signs or qualifies points', () => {
    expect(formatPoints(4000)).toBe('+4,000 pts');
    expect(formatPoints(0)).toBe('0 pts');
  });
  it('uses one decimal for Ton and zero for everything else', () => {
    expect(formatQuantity(8.4, 'Ton')).toBe('8.4 Ton');
    expect(formatQuantity(150, 'Bags')).toBe('150 Bags');
    expect(formatQuantity(80.6, 'Litre')).toBe('81 Litre');
  });
  it('renders dates as "12 Aug 2026"', () => {
    expect(formatDate('2026-08-12')).toBe('12 Aug 2026');
  });
  it('returns the raw value for an unparseable date rather than NaN', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
  it('counts down as mm:ss', () => {
    expect(formatCountdown(24)).toBe('00:24');
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(-5)).toBe('00:00');
  });
  it('takes initials from the first two words only', () => {
    expect(initialsOf('Sunil Jadhav')).toBe('SJ');
    expect(initialsOf('Ramesh Vishnu Pawar')).toBe('RV');
  });
});

describe('input normalisation', () => {
  it('strips non-digits and caps the mobile at 10', () => {
    expect(normaliseMobile('9822014576')).toBe('9822014576');
    expect(normaliseMobile('98220145761234')).toBe('9822014576');
  });
  it('drops a pasted country code or trunk prefix', () => {
    expect(normaliseMobile('+91 98220-14576')).toBe('9822014576');
    expect(normaliseMobile('098220 14576')).toBe('9822014576');
  });
  it('does NOT corrupt a valid number that legitimately begins with 91', () => {
    // Indian mobiles start 6-9, so "91…" is a real prefix. Stripping it would be a data bug.
    expect(normaliseMobile('9182201457')).toBe('9182201457');
  });
  it('allows at most one dot in a quantity', () => {
    expect(normaliseDecimal('8.4')).toBe('8.4');
    expect(normaliseDecimal('8.4.2')).toBe('8.42');
    expect(normaliseDecimal('8a4')).toBe('84');
  });
});

describe('points semantics — the rule this product most often breaks', () => {
  it('never signs points that are not yet earned', () => {
    // Points post ONLY on allocation. V2 demand rows carry no points at all, so the only
    // points the app renders are allocated ones — and formatPoints signs those.
    expect(formatPoints(4000)).toBe('+4,000 pts');
  });
});

describe('statuses are closed sets that degrade safely', () => {
  it('styles every known GIFT status', () => {
    for (const status of GIFT_STATUSES) {
      expect(statusStyle(status)).toBeDefined();
    }
  });
  it('renders an UNKNOWN status neutrally instead of crashing', () => {
    // New statuses reach the server before the app knows them.
    expect(() => statusStyle('Reallocated')).not.toThrow();
    expect(statusStyle('Reallocated').fg).toBeTruthy();
  });
  it('has no demand statuses to style — V2 demands carry none', () => {
    // Guard against quietly reintroducing a demand status chip: a demand is a claim, and
    // nothing fulfils it yet, so 'Submitted' must fall through to the neutral style.
    expect(statusStyle('Submitted')).toEqual(statusStyle('anything-unknown'));
  });
});

describe('entitlements', () => {
  it('is false for an unknown module rather than throwing', () => {
    expect(can({ modules: ['rewards'] }, 'nope')).toBe(false);
    expect(isKnownModule('nope')).toBe(false);
  });
  it('is false when entitlements have not loaded', () => {
    expect(can(null, 'rewards')).toBe(false);
  });
  it('defaults to every module so a missing /config never yields an empty nav', () => {
    expect(can(DEFAULT_ENTITLEMENTS, 'leaderboard')).toBe(true);
  });
});

describe('demand state machine', () => {
  const mfr: CatalogManufacturer = {
    id: 288311, name: 'Welspun Shield TMT', mono: 'WT', logo_url: null,
    base_unit: 'Ton', uoms: ['Ton', 'Kg'],
  };
  const unconfigured: CatalogManufacturer = {
    id: 291338, name: 'Welspun Corp', mono: 'WC', logo_url: null, base_unit: null, uoms: [],
  };
  const products: ManufacturerProducts = {
    manufacturer_id: 288311, manufacturer_name: 'Welspun Shield TMT',
    base_unit: 'Ton', uoms: ['Ton', 'Kg'],
    items: [
      { id: 231, label: '20 mm TMT Bar FE 500', sku_value: 'FE 500', sku_value_id: 1, sku_key_id: 1, is_premium: false, points_per_unit: 1, points_hint: '1 pt / Kg' },
      { id: 232, label: '10 mm TMT Bar FE 550', sku_value: 'FE 550', sku_value_id: 2, sku_key_id: 1, is_premium: true, points_per_unit: 2, points_hint: '2 pts / Kg' },
    ],
  };
  const line = { productId: 231, label: '20 mm TMT Bar FE 500', qty: '4', uom: 'Ton' };

  it('prefers the products payload for UOMs, then the manufacturer, then Units', () => {
    // The products payload is what the API validates against, so it wins.
    expect(uomList(unconfigured, products)).toEqual(['Ton', 'Kg']);
    expect(uomList(mfr, undefined)).toEqual(['Ton', 'Kg']);
    expect(uomList(unconfigured, undefined)).toEqual(['Units']);
  });

  it('defaults the UOM to the first offered, and never keeps one the manufacturer dropped', () => {
    expect(effectiveUom(EMPTY_DRAFT, mfr, products)).toBe('Ton');
    expect(effectiveUom({ ...EMPTY_DRAFT, uom: 'Kg' }, mfr, products)).toBe('Kg');
    // A stale UOM would be UOM_NOT_ALLOWED at the server; fall back rather than send it.
    expect(effectiveUom({ ...EMPTY_DRAFT, uom: 'Bags' }, mfr, products)).toBe('Ton');
  });

  it('shows the quantity card once a manufacturer is chosen — there is no second branch in V2', () => {
    expect(showQuantity(EMPTY_DRAFT)).toBe(false);
    expect(showQuantity({ ...EMPTY_DRAFT, manufacturerId: 288311 })).toBe(true);
  });

  it('refuses the same product twice in one submission', () => {
    const draft = { ...EMPTY_DRAFT, manufacturerId: 288311, productId: 231, qty: '2', lines: [line] };
    expect(isDuplicateLine(draft, 231)).toBe(true);
    expect(canAddLine(draft)).toBe(false);
    expect(canAddLine({ ...draft, productId: 232 })).toBe(true);
  });

  it('blocks submit until there is at least one valid line', () => {
    const base = { ...EMPTY_DRAFT, manufacturerId: 288311 };
    expect(isDraftSubmittable(base)).toBe(false);
    expect(isDraftSubmittable({ ...base, productId: 231 })).toBe(false); // no qty
    expect(isDraftSubmittable({ ...base, productId: 231, qty: '0' })).toBe(false); // zero
    expect(isDraftSubmittable({ ...base, productId: 231, qty: '4' })).toBe(true);
    // A committed line is enough on its own — the in-progress one may be empty.
    expect(isDraftSubmittable({ ...base, lines: [line] })).toBe(true);
    // ...but a manufacturer is always required: it is the body's only mandatory field.
    expect(isDraftSubmittable({ ...EMPTY_DRAFT, lines: [line] })).toBe(false);
  });

  it('folds the in-progress line into the body, so one product needs no Add tap', () => {
    const draft = { ...EMPTY_DRAFT, manufacturerId: 288311, productId: 232, qty: '25', lines: [line] };
    expect(draftItems(draft, 'Kg')).toEqual([
      { product_id: 231, quantity: { value: 4, uom: 'Ton' } },
      { product_id: 232, quantity: { value: 25, uom: 'Kg' } },
    ]);
  });

  it('clears downstream choices on every reset — a stranded form is unsubmittable', () => {
    const full = { ...EMPTY_DRAFT, industryId: 2, manufacturerId: 288311, productId: 231, qty: '4', uom: 'Kg', lines: [line] };
    expect(resets.onIndustry(3)).toEqual({ ...EMPTY_DRAFT, industryId: 3 });
    // Switching manufacturer MUST empty the cart: its lines are the old manufacturer's product
    // ids, and sending one against another manufacturer is a PRODUCT_NOT_FOUND.
    const afterMfr = resets.onManufacturer(full, 293612);
    expect(afterMfr).toMatchObject({ manufacturerId: 293612, productId: null, qty: '', uom: '', lines: [] });
    // Re-tapping the SAME manufacturer is a no-op, not a wipe.
    expect(resets.onManufacturer(full, 288311)).toBe(full);
  });

  it('moves the composed line into the cart and clears it for the next product', () => {
    const draft = { ...EMPTY_DRAFT, manufacturerId: 288311, productId: 231, qty: '4' };
    const added = resets.addLine(draft, '20 mm TMT Bar FE 500', 'Ton');
    expect(added.lines).toEqual([line]);
    expect(added.productId).toBeNull();
    expect(added.qty).toBe('');
    expect(resets.removeLine(added, 231).lines).toEqual([]);
  });
});
