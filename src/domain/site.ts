/**
 * Construction-site rules — docs/construction-site-address-capture.md, reconciled against the
 * V2 contract (`V2/01-api-reference.md` §4 and §5).
 *
 * WHERE THE TWO DISAGREE, THE CONTRACT WINS, and it disagrees in one place that matters:
 *
 *   The UI spec's §7 data model carries pincode / district / state as EDITABLE STRINGS
 *   ("302012", "Jaipur", "Rajasthan"). The wire carries IDS, and the server REJECTS a district
 *   or state that contradicts the pincode rather than correcting it. So the geography is held
 *   here as the ids the geocode returned and is never typed into. That is not a reduction of
 *   the spec — the spec's own S6 note says "Pincode, District and State came from the pin.
 *   Change the pin to change them", and its §13 open question 5 asks for exactly this
 *   reconciliation. The three fields render read-only, and the pin is how they change.
 *
 * The free text is the other half and it IS editable: a plot number is never in a geocode.
 *
 * Kept pure so the rules are testable without a map, a GPS fix or a renderer.
 */
import type { DemandSite, GeoCoordinates, ReverseGeocode, SiteInput } from '../api/types';

/** How a pin came to be — analytics (`site_location_source_used`) and the S4 accuracy line. */
export type SiteSource = 'gps' | 'search' | 'manual_pin';

/**
 * The site as the draft holds it: the geocode's ids, frozen, plus the three lines the user may
 * correct. `coords` are the strings the device reported, carried through untouched.
 */
export type DraftSite = {
  coords: GeoCoordinates;
  source: SiteSource;
  /** Metres, from the GPS fix. Null for a pin that was placed rather than measured. */
  accuracyM: number | null;
  /** Editable. */
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  /** Frozen — the geocode's, shown for confirmation, never typed into. */
  pincodeId: number | null;
  districtId: number | null;
  districtName: string | null;
  stateId: number | null;
  stateName: string | null;
  locationId: number | null;
  locationName: string | null;
  /** The provider's own single line, for the map sheet before the form is opened. */
  formattedAddress: string;
};

/**
 * A resolved pin becomes a draft site.
 *
 * The coordinates come from the GEOCODE's echo, not from the device: the contract echoes
 * `geo_coordinates` back precisely so the digits stored against the site are the digits that
 * were resolved. `?? ''` on the two free lines because the contract allows null and an input
 * cannot be given one.
 */
export function siteFromGeocode(
  g: ReverseGeocode,
  { source, accuracyM = null }: { source: SiteSource; accuracyM?: number | null },
): DraftSite {
  return {
    coords: g.geo_coordinates,
    source,
    accuracyM,
    addressLine1: g.address_line_1 ?? '',
    addressLine2: g.address_line_2 ?? '',
    landmark: g.landmark ?? '',
    pincodeId: g.pincode_id,
    districtId: g.district_id,
    districtName: g.district_name,
    stateId: g.state_id,
    stateName: g.state_name,
    locationId: g.location_id,
    locationName: g.location_name,
    formattedAddress: g.formatted_address,
  };
}

/**
 * A pin with no `pincode_id` is UNUSABLE. The server derives state and district from the
 * pincode, so a site without one cannot be filed at all — the geocode succeeding is not the
 * same as the pin being usable, and this is the difference.
 */
export function isPinServiceable(site: DraftSite | null): boolean {
  return site?.pincodeId != null;
}

/**
 * Spec S6: required, up to 120 characters. A plot number is never in a geocode, so it is typed.
 *
 * NO MINIMUM LENGTH. The spec asks for three characters; real plot numbers are shorter than
 * that — "14", "B2", "7A" — so the rule rejected correct answers and left the user with an
 * error they could only clear by padding it. Empty is the only thing this field cannot be.
 */
export function addressLine1Error(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Add the plot or house number';
  if (v.length > 120) return 'Keep this under 120 characters';
  return null;
}

/** Spec S6: required, up to 80. Drivers need a landmark as much as an address in site
 * geography. No minimum, for the same reason as line 1. */
export function landmarkError(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Add a nearby school, temple or factory';
  if (v.length > 80) return 'Keep this under 80 characters';
  return null;
}

/** Optional, capped at 120 to match line 1. */
export function addressLine2Error(value: string): string | null {
  return value.trim().length > 120 ? 'Keep this under 120 characters' : null;
}

export type SiteErrors = {
  addressLine1: string | null;
  addressLine2: string | null;
  landmark: string | null;
};

export function siteErrors(site: DraftSite): SiteErrors {
  return {
    addressLine1: addressLine1Error(site.addressLine1),
    addressLine2: addressLine2Error(site.addressLine2),
    landmark: landmarkError(site.landmark),
  };
}

/**
 * ALL OR NOTHING — the contract's phrase. A `site` may be absent from a submission, but one
 * that is present must be complete, so this is the gate a draft site passes before it can be
 * attached to the cart at all. Nothing partial reaches the wire.
 */
export function isSiteComplete(site: DraftSite | null): site is DraftSite {
  if (!site || !isPinServiceable(site)) return false;
  const e = siteErrors(site);
  return !e.addressLine1 && !e.addressLine2 && !e.landmark;
}

/**
 * The draft site as the wire wants it. Returns null rather than a partial block, so an
 * incomplete site is structurally incapable of being submitted.
 *
 * Trimmed, and an empty optional line is sent as null rather than '' — the two mean the same
 * thing to a reader and only one of them is what "absent" looks like in the contract.
 */
export function siteInput(site: DraftSite | null): SiteInput | undefined {
  if (!isSiteComplete(site)) return undefined;
  const orNull = (v: string) => (v.trim() ? v.trim() : null);
  return {
    address_line_1: site.addressLine1.trim(),
    address_line_2: orNull(site.addressLine2),
    landmark: orNull(site.landmark),
    pincode_id: site.pincodeId!,
    district_id: site.districtId,
    state_id: site.stateId,
    location_id: site.locationId,
    latitude: site.coords.latitude,
    longitude: site.coords.longitude,
  };
}

/**
 * The one-line address under a cart's site card, composed from the parts the user just
 * confirmed — the draft has no server-composed line yet.
 *
 * On a demand ROW this is not used: `site.formatted_address` arrives already de-duplicated and
 * the contract asks for it to be preferred over joining the parts. See `demandSiteLine`.
 */
export function draftSiteLine(site: DraftSite): string {
  return [
    site.addressLine2.trim(),
    site.landmark.trim() ? `near ${site.landmark.trim()}` : '',
    site.locationName ?? '',
    site.districtName ?? '',
    site.stateName ?? '',
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * The address line on a demand card. The server's own single line, ALWAYS — it is already
 * de-duplicated, and a geocode routinely repeats the locality in `address_line_2` and again as
 * the location name, so joining the parts here would read worse and drift from what the server
 * shows everyone else.
 */
export function demandSiteLine(site: DemandSite | null): string | null {
  return site?.formatted_address?.trim() || null;
}

/**
 * Spec S4: above 100 m the fix is too loose to trust a site to, and the copy changes from
 * stating the accuracy to questioning the pin.
 */
export const WEAK_FIX_ABOVE_M = 100;

export function accuracyLabel(accuracyM: number | null, source: SiteSource): {
  text: string; weak: boolean;
} | null {
  // A pin the user placed has no measured accuracy — there is nothing honest to claim about it.
  if (accuracyM == null || source !== 'gps') return null;
  const m = Math.round(accuracyM);
  return m > WEAK_FIX_ABOVE_M
    ? { text: 'Weak signal — check the pin', weak: true }
    : { text: `Accurate to ${m} m · GPS`, weak: false };
}
