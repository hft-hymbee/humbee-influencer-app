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
  allManufacturers, canAddLine, draftItems, EMPTY_DRAFT, effectiveUom, isDraftSubmittable,
  isDuplicateLine, resets, showQuantity, uomList,
} from '../src/domain/demand';
import {
  accuracyLabel, demandSiteLine, draftSiteLine, isPinServiceable, isSiteComplete, siteFromGeocode,
  siteInput, type DraftSite,
} from '../src/domain/site';
import type {
  CatalogManufacturer, DemandSite, Industry, ManufacturerProducts, ReverseGeocode,
} from '../src/api/types';

/**
 * A confirmed site. Every submit test needs one now: a demand without geography is not
 * submittable (spec R2), so this is what the other rules are exercised on top of.
 */
const SITE: DraftSite = {
  coords: { latitude: '25.0089183', longitude: '88.1391062' },
  source: 'gps',
  accuracyM: 8,
  addressLine1: 'Plot 14, Sector 3',
  addressLine2: 'Near the water tank',
  landmark: 'Opposite the primary school',
  pincodeId: 732101,
  districtId: 434,
  districtName: 'MALDA',
  stateId: 24,
  stateName: 'WEST BENGAL',
  locationId: 828,
  locationName: 'ADINA STATION',
  formattedAddress: 'Plot 14, Sector 3, ADINA STATION, MALDA, WEST BENGAL, 732101',
};

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

describe('the flattened manufacturer picker', () => {
  const mfr = (id: number, name: string): CatalogManufacturer =>
    ({ id, name, mono: name.slice(0, 2), logo_url: null, base_unit: null, uoms: [] });
  const catalogue: Industry[] = [
    { id: 1, code: 'CEMENT', name: 'Cement', manufacturers: [mfr(10, 'Dalmia'), mfr(11, 'Shree')] },
    // Dalmia again, under a second industry — the API takes the manufacturer id alone.
    { id: 2, code: 'STEEL', name: 'Steel', manufacturers: [mfr(10, 'Dalmia'), mfr(12, 'Welspun')] },
  ];

  it('flattens every industry into one list, in server order', () => {
    expect(allManufacturers(catalogue).map(m => m.id)).toEqual([10, 11, 12]);
  });

  it('shows a manufacturer listed under two industries exactly once', () => {
    expect(allManufacturers(catalogue).filter(m => m.id === 10)).toHaveLength(1);
  });

  it('keeps the industry on each entry — the trail and the draft still need it', () => {
    const [dalmia, , welspun] = allManufacturers(catalogue);
    // First listing wins, so Dalmia carries Cement rather than Steel.
    expect(dalmia).toMatchObject({ industryId: 1, industryCode: 'CEMENT', industryName: 'Cement' });
    expect(welspun).toMatchObject({ industryId: 2, industryCode: 'STEEL' });
  });

  it('is empty, not broken, for a catalogue with no manufacturers', () => {
    expect(allManufacturers([{ id: 1, code: 'CEMENT', name: 'Cement', manufacturers: [] }])).toEqual([]);
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
    const base = { ...EMPTY_DRAFT, manufacturerId: 288311, site: SITE };
    expect(isDraftSubmittable(base)).toBe(false);
    expect(isDraftSubmittable({ ...base, productId: 231 })).toBe(false); // no qty
    expect(isDraftSubmittable({ ...base, productId: 231, qty: '0' })).toBe(false); // zero
    expect(isDraftSubmittable({ ...base, productId: 231, qty: '4' })).toBe(true);
    // A committed line is enough on its own — the in-progress one may be empty.
    expect(isDraftSubmittable({ ...base, lines: [line] })).toBe(true);
    // ...but a manufacturer is always required: it is the body's only mandatory field.
    expect(isDraftSubmittable({ ...EMPTY_DRAFT, lines: [line], site: SITE })).toBe(false);
  });

  it('blocks submit until a construction site is attached', () => {
    const ready = { ...EMPTY_DRAFT, manufacturerId: 288311, lines: [line] };
    // Everything else in place, no site: a demand with no destination is not actionable.
    expect(isDraftSubmittable(ready)).toBe(false);
    expect(isDraftSubmittable({ ...ready, site: SITE })).toBe(true);
    // A site that is PRESENT but incomplete is no better than none — the block is all-or-nothing.
    expect(isDraftSubmittable({ ...ready, site: { ...SITE, pincodeId: null } })).toBe(false);
    expect(isDraftSubmittable({ ...ready, site: { ...SITE, landmark: '' } })).toBe(false);
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
    // Switching manufacturer MUST empty the cart: its lines are the old manufacturer's product
    // ids, and sending one against another manufacturer is a PRODUCT_NOT_FOUND.
    const afterMfr = resets.onManufacturer(full, 293612, 7);
    expect(afterMfr).toMatchObject({
      industryId: 7, manufacturerId: 293612, productId: null, qty: '', uom: '', lines: [],
    });
    // ...but the SITE survives it (spec R6): it is where the material is going, and that does
    // not change because the brand did.
    expect(resets.onManufacturer({ ...full, site: SITE }, 293612, 7).site).toBe(SITE);
    // Re-tapping the SAME manufacturer UNSELECTS it and empties everything with it — the tile
    // is a tick, so a second tap unticks. A cart of its product ids means nothing without it.
    expect(resets.onManufacturer(full, 288311, 2)).toEqual(EMPTY_DRAFT);
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

describe('construction site', () => {
  const geocode: ReverseGeocode = {
    formatted_address: 'Plot 14, Sector 3, Adina Station, Malda, West Bengal 732101, India',
    address_line_1: 'Plot 14, Sector 3',
    address_line_2: 'Near the water tank',
    landmark: 'Opposite the primary school',
    state_id: 24, state_name: 'WEST BENGAL',
    district_id: 434, district_name: 'MALDA',
    location_id: 828, location_name: 'ADINA STATION',
    pincode_id: 732101,
    geo_coordinates: { latitude: '25.0089183', longitude: '88.1391062' },
  };

  it('carries the geocode coordinates through as STRINGS, digit for digit', () => {
    const site = siteFromGeocode(geocode, { source: 'gps', accuracyM: 8 });
    // The contract echoes geo_coordinates precisely so the digits stored are the digits
    // resolved. Parsing to a float and back would round the pin.
    expect(site.coords).toEqual({ latitude: '25.0089183', longitude: '88.1391062' });
    expect(siteInput(site)!.latitude).toBe('25.0089183');
  });

  it('treats a pin with no pincode as unusable, even though the geocode succeeded', () => {
    const noPin = siteFromGeocode({ ...geocode, pincode_id: null }, { source: 'manual_pin' });
    expect(isPinServiceable(noPin)).toBe(false);
    expect(isSiteComplete(noPin)).toBe(false);
    // ...and a null LOCATION is routine, not an error — it is sent through as null.
    const noLocality = siteFromGeocode({ ...geocode, location_id: null }, { source: 'manual_pin' });
    expect(isSiteComplete(noLocality)).toBe(true);
    expect(siteInput(noLocality)!.location_id).toBeNull();
  });

  it('refuses to build a partial site block — all or nothing', () => {
    expect(siteInput(null)).toBeUndefined();
    expect(siteInput({ ...SITE, addressLine1: '' })).toBeUndefined();
    expect(siteInput({ ...SITE, addressLine1: 'ab' })).toBeUndefined();   // under 3
    expect(siteInput({ ...SITE, landmark: '' })).toBeUndefined();         // required
    expect(siteInput({ ...SITE, pincodeId: null })).toBeUndefined();
  });

  it('sends ids, never names, and trims an empty optional line to null', () => {
    const body = siteInput({ ...SITE, addressLine2: '   ' })!;
    expect(body).toEqual({
      address_line_1: 'Plot 14, Sector 3',
      address_line_2: null,
      landmark: 'Opposite the primary school',
      pincode_id: 732101,
      district_id: 434,
      state_id: 24,
      location_id: 828,
      latitude: '25.0089183',
      longitude: '88.1391062',
    });
    // No name of any kind reaches the wire: the site is stored against the platform's geography.
    expect(JSON.stringify(body)).not.toContain('MALDA');
    expect(JSON.stringify(body)).not.toContain('WEST BENGAL');
  });

  it("prefers the server's own line on a demand row, and tolerates a row with no site", () => {
    const site = { formatted_address: 'Plot 14, Sector 3, MALDA, WEST BENGAL, 732101' } as DemandSite;
    expect(demandSiteLine(site)).toBe('Plot 14, Sector 3, MALDA, WEST BENGAL, 732101');
    // Demands captured before sites existed. The row still renders — without the address block.
    expect(demandSiteLine(null)).toBeNull();
    expect(demandSiteLine({ formatted_address: '  ' } as DemandSite)).toBeNull();
  });

  it('composes the cart card line from the parts, since a draft has no server line', () => {
    expect(draftSiteLine(SITE)).toBe(
      'Near the water tank, near Opposite the primary school, ADINA STATION, MALDA, WEST BENGAL',
    );
  });

  it('only claims an accuracy it actually measured', () => {
    expect(accuracyLabel(8, 'gps')).toEqual({ text: 'Accurate to 8 m · GPS', weak: false });
    expect(accuracyLabel(140, 'gps')).toEqual({ text: 'Weak signal — check the pin', weak: true });
    // A pin the user placed by hand was never measured — there is nothing honest to claim.
    expect(accuracyLabel(8, 'manual_pin')).toBeNull();
    expect(accuracyLabel(null, 'gps')).toBeNull();
  });
});
