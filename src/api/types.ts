/**
 * Wire types — transcribed from humbee_influencer_backend/V2/01-api-reference.md and verified
 * against V2/examples/*.json (captured from the running server, not written by hand).
 *
 * INTERIM. docs/10-rn-cli-implementation-guide.md §5.2 specifies these come from
 * `openapi-typescript` against the live `/openapi.json`, with CI failing on drift. Until that
 * is reachable from CI, treat this file as generated: if a type is wrong, the contract is
 * wrong — fix it there.
 *
 * WIRE FORMAT IS snake_case, request AND response. There is no alias layer: the field name IS
 * the wire name (V2/00-what-changed.md §1). Do not camelCase anything that crosses the wire.
 *
 * Base URL carries /influencer/v1, so paths here are relative to that — except account
 * deletion, which uses the platform's own /users endpoints (see PLATFORM_BASE_URL).
 */

/**
 * The platform envelope. HTTP 200 for every business outcome; `error` signals the result.
 * 401 is the single exception, for a missing or invalid token.
 */
export type Envelope<T> = { message: string; error: boolean; data: T; formatting_args: unknown };

/**
 * OFFSET pagination (V2 §2). The cursor is gone. No totals are returned — `has_more` is the
 * only signal, and these lists are append-only, so a row arriving mid-scroll can shift the
 * window. That drift is inherent to offset paging and is accepted.
 */
export type Pagination = { page: number; page_size: number; has_more: boolean };
export type Paged<T> = { items: T[]; pagination: Pagination };

export type Period = '3m' | '6m' | '1y';
export type PeriodOption = { value: Period; label: string };

/** Server default is 20, max 50. */
export const DEFAULT_PAGE_SIZE = 20;

// ---------- config ----------
export type Config = {
  config_version: string;
  min_supported_app_version: { android: string; ios: string };
  latest_app_version: { android: string; ios: string };
  force_upgrade: boolean;
  asset_base_url: string;
  /** Cache-buster for /demand-capture/industries — skip that call while it is unchanged. */
  catalog_version: string;
  locale_bundle_version: string;
  supported_locales: string[];
  /** snake_case keys: offline_demand_queue, demand_capture, leaderboard, utsav_banner_dynamic. */
  feature_flags: Record<string, boolean>;
  periods: PeriodOption[];
  gift_statuses: string[];
  /** Multi-tenancy — doc 09 §4. Absent in the current contract; raise as a gap, do not fake it. */
  tenant?: { id: string; name: string; logo_url?: string };
  entitlements?: string[];
  theme?: { colors?: Record<string, string> };
};

// ---------- auth ----------
/**
 * `POST /auth/otp/request`.
 *
 * ⚠️ The V2 doc says this returns nothing. **It does not** — the running server sends the block
 * below, verified against it. Only `request_id` genuinely went away; the mobile number now
 * identifies the challenge on verify. So the OTP length and the resend window are SERVER-OWNED
 * again, exactly as the design spec always assumed. Do not hardcode 4 and 24.
 *
 * Request fields are RSA-encrypted — see api/crypto.ts.
 */
export type OtpRequestResult = {
  mobile_display: string;
  otp_length: number;
  /** The server owns the resend window. The design shows 24s; never hardcode it. */
  resend_after_seconds: number;
  expires_in_seconds: number;
  attempts_remaining: number;
};
/** No refresh token in V2. This bearer token is the whole session. */
export type OtpVerifyResult = { token: string };
export type LogoutResult = { revoked: boolean };

/** Platform endpoint, not an influencer one. It performs real checks and CAN refuse. */
export type CanDeleteAccount = { can_delete: boolean; message?: string; reason?: string };

// ---------- profile ----------
export type ProfileRow = { key: string; value: string };
/**
 * `company_esi_id` is PER MANUFACTURER and lives here, not at the top level. Every
 * manufacturer-scoped read sends the pair matching the tab the screen is on.
 */
export type MeManufacturer = {
  manufacturer_id: number;
  manufacturer_name: string;
  manufacturer_logo: string | null;
  company_esi_id: number;
  /** The influencer's role FOR THIS MANUFACTURER's industry. Role is never global. */
  trade: string;
};
export type Me = {
  influencer: {
    id: number; name: string; initials: string; mobile: string; mobile_display: string;
    district: string; district_id: number; state: string; status: string; member_since: string;
  };
  /** Source of truth for the manufacturer switcher. Empty = mapped to no manufacturer. */
  manufacturers: MeManufacturer[];
  /** Server-driven. Render what arrives. No State row, and no `actions` block in V2. */
  rows: ProfileRow[];
};

// ---------- demand capture (was: catalog) ----------
/** A manufacturer as it appears in the industry picker. `base_unit`/`uoms` may be empty. */
export type CatalogManufacturer = {
  id: number; name: string; mono: string; logo_url: string | null;
  base_unit: string | null; uoms: string[];
};
/**
 * TWO LEVELS ONLY: industries[] → manufacturers[]. V2 flattened away `sub_industries` and
 * removed the embedded `products` — SKUs are a separate call for the chosen manufacturer.
 * Branch on `code` (CEMENT, STEEL, ERW, ANGLE, FMCG, PAINTS, PERSONAL_HYGIENE, STONE),
 * never on `name`, which is display copy.
 */
export type Industry = { id: number; code: string; name: string; manufacturers: CatalogManufacturer[] };
export type DemandCaptureIndustries = {
  catalog_version: string;
  /** The region the list was resolved for: the district of the VCP behind the last allocation. */
  district_id: number;
  district: string;
  industries: Industry[];
};

export type Product = {
  id: number; label: string;
  sku_value: string; sku_value_id: number; sku_key_id: number;
  is_premium: boolean;
  /** Per BASE unit, not per reporting unit — `points_hint` reads "1 pt / Kg". */
  points_per_unit: number;
  points_hint: string;
};
export type ManufacturerProducts = {
  manufacturer_id: number; manufacturer_name: string;
  /** The REPORTING unit (Ton, Bags). `uoms` is what the quantity field may offer. */
  base_unit: string | null;
  uoms: string[];
  items: Product[];
};

export type Quantity = { value: number; uom: string };
export type DemandManufacturer = { id: number; name: string; mono: string; logo_url: string | null };

/**
 * ---------- the construction site ----------
 *
 * Coordinates are STRINGS on every one of these types, and that is deliberate: the contract
 * says to echo `geo_coordinates` back exactly as it arrived, digit for digit. Parsing to a
 * float and re-serialising would quietly round the pin the device reported (V2 §4).
 */
export type GeoCoordinates = { latitude: string; longitude: string };

/**
 * `GET /address/reverse-geocode` — a pin in, the platform's own geography out.
 *
 * THE IDS ARE THE POINT. The `*_name` fields exist so the user can confirm what they picked;
 * the ids are what a site is stored against. Never send a name back.
 *
 * `pincode_id` can be null, and a null pin is UNUSABLE for a site: the server derives state and
 * district from the pincode, so a site without one cannot be filed. `location_id` can also be
 * null — that one is routine (the locality Google names is simply not one the platform lists)
 * and is sent through as null.
 */
export type ReverseGeocode = {
  formatted_address: string;
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  state_id: number | null;
  state_name: string | null;
  district_id: number | null;
  district_name: string | null;
  location_id: number | null;
  location_name: string | null;
  pincode_id: number | null;
  geo_coordinates: GeoCoordinates;
};

/**
 * `GET /address/search` — one row of the dropdown.
 *
 * A suggestion is a CANDIDATE, not an address: it carries no coordinates and no component ids.
 * `place_id` is the only field that goes back to the server, and it is opaque and short-lived —
 * Google's ids are not stable identifiers. Never persist one, never send one as a site's
 * address; a stale one returns `PLACE_NOT_FOUND` and the answer is to search again.
 *
 * `main_text` / `secondary_text` are Google's split for a two-line row; `description` is the
 * two joined for a one-line row. Render one shape or the other, not both.
 */
export type AddressSuggestion = {
  place_id: string;
  description: string | null;
  main_text: string | null;
  secondary_text: string | null;
  /** Where the typed words matched, as [offset, length] into the string each list names. */
  main_text_matched: { offset: number; length: number }[];
  description_matched: { offset: number; length: number }[];
  types: string[];
  /**
   * Present only when the request carried coordinates, and STRAIGHT-LINE, not travel distance.
   * Never sort by it: the list arrives in Google's relevance order, which already accounts for
   * proximity, and re-sorting would demote the better match.
   */
  distance_metres: number | null;
};

export type AddressSearchResult = {
  /**
   * Echoed back so a LATE ANSWER CAN BE DISCARDED. Autocomplete fires per keystroke and the
   * replies arrive out of order — a response for "adi" landing after one for "adina" would
   * otherwise repaint the list with stale rows.
   */
  query: string;
  session_token: string | null;
  /** Empty is a normal answer — nothing matched. It is not an error and not a retry prompt. */
  suggestions: AddressSuggestion[];
};

/**
 * `GET /address/places/{place_id}` — a chosen suggestion, resolved.
 *
 * IDENTICAL to the reverse-geocode response plus the two place fields, and deliberately so:
 * the app has ONE path from "an address the user settled on" into the `site` block, whether
 * they searched for it or dropped a pin on it. The component ids come from geocoding the
 * place's COORDINATES through the same resolver the pin uses, not from parsing Google's
 * address text — so a searched place and a pin on the same spot cannot land in different
 * districts.
 */
export type PlaceDetails = ReverseGeocode & {
  place_id: string;
  /** The place's own label ("Adina Station"). Not part of the address and not stored. */
  place_name: string | null;
};

/**
 * The `site` block on a demand submission. Built from a reverse-geocode, with the two free-text
 * lines and the landmark editable — a plot number is never in a geocode.
 *
 * ALL OR NOTHING. `site` may be omitted from the body entirely, but a site that is present must
 * carry every required field; there is no half-captured site. `domain/site.ts` is where that is
 * enforced, so a partial one cannot reach the wire.
 *
 * THE PINCODE WINS. The stored state and district are the pincode's, not these. A `district_id`
 * or `state_id` that CONTRADICTS the pincode is rejected outright rather than corrected, so
 * these must be the ids the geocode returned and not ids assembled from anywhere else.
 */
export type SiteInput = {
  address_line_1: string;
  address_line_2?: string | null;
  landmark?: string | null;
  /** REQUIRED and the anchor — state and district are derived from it server-side. */
  pincode_id: number;
  /** Optional but recommended: 28 pincodes span two districts and this disambiguates. */
  district_id?: number | null;
  state_id?: number | null;
  location_id?: number | null;
  latitude: string;
  longitude: string;
};

/**
 * The site as it comes BACK — on the create response and on every demand row. It carries the
 * resolved names beside the ids, plus `formatted_address`, the server's single already
 * de-duplicated line. PREFER `formatted_address` over joining the parts in the app: a geocode
 * routinely repeats the locality in `address_line_2` and again as the location name.
 */
export type DemandSite = {
  id: number;
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  pincode_id: number;
  district_id: number;
  district: string;
  state_id: number;
  state: string;
  location_id: number | null;
  location: string | null;
  latitude: string;
  longitude: string;
  formatted_address: string;
};

/**
 * The code the influencer READS OUT to a VCP to confirm an allocation against this demand.
 * Uber's trip PIN, for cement.
 *
 * It is on the influencer's OWN list and on no other endpoint — a dealer who could read it
 * would not need to ask, and the asking is the whole point: it is how the demand records that
 * the influencer agreed to this allocation.
 *
 * NEVER CACHE IT. It rotates after every action on the demand — a successful verification
 * issues a new one, and so does an allocation being attributed — so a code shown from a stale
 * list WILL BE REJECTED. That is why the demand list is excluded from the persisted query
 * cache (api/queryClient.ts) and refetches on mount.
 *
 * `attempts_remaining` counts down as the VCP mistypes; at zero the demand cannot be verified
 * until the code rotates. It is shown to the INFLUENCER precisely because they are the one who
 * can see something going wrong and say so.
 *
 * `code` is null on rows predating the column — render the card without the block, not a blank.
 */
export type DemandEpin = {
  /** Length is server config (`DEMAND_EPIN_LENGTH`), today 4. Never assume it in a layout. */
  code: string | null;
  issued_at: string | null;
  attempts_remaining: number;
  /** The LAST successful verification — which used the PREVIOUS code, not this one. */
  verified_at: string | null;
};

/**
 * How much of a demand has been met.
 *
 * RENDERED as the status chip on My Demands (client decision, Sep 2026), superseding V2's "a
 * demand carries no status" and the no-chip design built on it. It is still NOT the PRD's
 * Submitted → Confirmed → Allocated → Closed chain — `Confirmed` needs an acknowledgement
 * nothing emits — so do not map these three onto those four.
 *
 * `status` is the stable key to branch on (`OPEN`, `PARTIALLY_FULFILLED`, `FULFILLED`);
 * `status_label` is the localised copy to render. Never derive the status from the numbers:
 * the rule is `allocated >= demanded`, it belongs to the VCP order system, and it lives on the
 * server so the two cannot drift. All three quantities are in the BASE unit.
 */
export type DemandFulfilment = {
  status: string;
  status_label: string | null;
  demanded: Quantity;
  allocated: Quantity;
  remaining: Quantity;
};

/**
 * A demand row. It carries NO status, NO VCP, NO points and NO `date_label` — those arrive
 * with the fulfilment mechanism that does not exist yet (V2 §4). Do not render a status chip
 * or a points figure against a claim.
 */
export type Demand = {
  id: number;
  manufacturer: DemandManufacturer;
  product_id: number;
  product: string;
  quantity: Quantity;
  normalised_quantity: Quantity;
  /**
   * NULL for demands captured before sites existed, or by a build that sends none. Render
   * those rows WITHOUT the address block — never hide the row itself.
   */
  site: DemandSite | null;
  /** The code read out to a VCP. Display what the latest read returned; never cache it. */
  epin: DemandEpin;
  /**
   * Optional because rows predating the derivation carry none — those render with no chip
   * rather than a fabricated "Open".
   */
  fulfilment?: DemandFulfilment;
  /** ISO. The app formats it — there is no server-composed label. */
  date: string;
};
export type DemandList = Paged<Demand> & { manufacturer_id: number };

/** One line of a submission. A product may appear only ONCE per submission. */
export type DemandItemInput = { product_id: number; quantity: Quantity };
export type CreateDemandBody = {
  manufacturer_id: number;
  /** Optional in V2. Send it when the manufacturer is one the influencer is mapped to. */
  company_esi_id?: number;
  /**
   * THE DISTRICT THE DEMAND IS FILED AGAINST — and there are two districts in this app that
   * are NOT interchangeable:
   *
   *   `GET /demand-capture/industries` → `district_id`  the district they TRADE in (the VCP
   *                                                     behind their last allocation). ✅ this one
   *   `GET /me` → `influencer.district_id`              the district they REGISTERED in. ❌ never
   *
   * For a mason onboarded in one district but buying through the next one's VCPs these differ,
   * and `/me`'s value would file the demand against a district that never offered them this
   * manufacturer. The picker only lists manufacturers active in the trading district, so the
   * industries payload is the only correct source.
   *
   * Optional on the wire ONLY as a compatibility shim for builds that predate the field — those
   * fall back to the server resolving the district. New builds always send it. An id naming no
   * district is `DISTRICT_INVALID` and stores nothing. Not echoed in the response: it is stored
   * for per-district demand reporting, never rendered.
   */
  district_id?: number;
  /**
   * The construction site — ONE PER SUBMISSION, shared by every line, because the user picks a
   * location once and then ticks the SKUs they need there.
   *
   * `site.district_id` IS NOT the `district_id` above. The top-level one is where the influencer
   * TRADES (from the picker); this one is where the concrete is GOING. They differ whenever
   * someone buys near home for a site a district away, and nothing reconciles them — both are
   * sent, each from its own source.
   *
   * Optional on the wire only so older builds keep working; this build always sends it, and the
   * screen will not let a demand be submitted without one.
   */
  site?: SiteInput;
  items: DemandItemInput[];
};
/** Atomic: if any line fails validation nothing is stored, so this can never list a phantom. */
export type CreateDemandResult = {
  manufacturer: DemandManufacturer;
  items: Demand[];
  date: string;
};

// ---------- home ----------
export type Banner = { id: number; image_url: string; alt: string; deeplink: string | null; sort_order: number };
export type RecentReward = {
  id: number; gift: string; brand: string | null; kind: string; status: string; mark: string;
  released_on: string; released_on_label: string;
  manufacturer_id: number; manufacturer_name: string;
  vcp: { id: number; name: string; type: string | null; place: string | null };
};
/** The one read that spans every mapping — not manufacturer-scoped. No `generated_at` in V2. */
export type Home = {
  influencer: { id: number; name: string; initials: string };
  banners: Banner[];
  stats: {
    rewards_allotted: number;
    allocations_this_year: number;
    points_this_year: number;
    points_this_year_label: string;
    financial_year: string;
  };
  recent_rewards: RecentReward[];
};

// ---------- leaderboard ----------
export type LeaderboardRow = {
  rank: number; influencer_id: number; name: string; points: number; volume: number; unit: string;
};
/** Three server-labelled variants; `gap_label` is composed server-side for all three. */
export type LeaderboardMe = {
  rank: number | null; influencer_id: number; name: string; points: number; volume: number;
  unit: string; in_top10: boolean;
  gap_to_top10: { points: number; volume: number } | null;
  gap_label: string;
};
export type PointsRule = { base: string; tiers: { label: string; value: string; premium: boolean }[] };
/**
 * Live standing — NO period parameter, and no `computed_at` / `freshness_seconds`: the board is
 * computed per request, so every response is already current. Do not build refetch timers.
 */
export type Leaderboard = {
  company_esi_id: number;
  manufacturer: { id: number; name: string; base_unit: string | null };
  scope: string; district_id: number; district: string;
  /** The column header for the volume column. */
  unit: string;
  /** Server-computed (needs ≥ 3 ranked). Hide the podium when false; never decide it here. */
  show_podium: boolean;
  ranked_influencer_count: number;
  /** The "How You Earn Points" block — the former, now deleted, /catalog/points-rules. */
  points_rule: PointsRule;
  /** May be shorter than 10. Render what arrives; never pad. */
  top: LeaderboardRow[];
  me: LeaderboardMe;
};

// ---------- allocations ----------
export type Allocation = {
  id: number;
  invoice_no: string;
  vcp: { id: number; name: string; type: string; place: string };
  /** The raw stocking-unit figure for the card. */
  quantity: Quantity;
  /** The same volume in the reporting unit the tile sums. The two units differ BY DESIGN. */
  normalised_quantity: Quantity;
  products: string[];
  date: string;
  date_label: string;
  points: number;
  points_label: string;
};
export type PeriodWindow = { value: Period; label: string; from_date: string; to_date: string };
export type SummaryManufacturer = { id: number; name: string; mono: string; logo_url: string | null };
export type AllocationsSummary = {
  company_esi_id: number;
  manufacturer: SummaryManufacturer;
  period: PeriodWindow;
  /** Pre-normalised into the reporting unit. The client NEVER converts UOMs. */
  totals: { quantity: { value: number; uom: string | null }; quantity_label: string; points: number; points_label: string };
  count: number; count_label: string; generated_at: string;
};

// ---------- rewards ----------
export type Gift = {
  id: number; gift: string; brand: string | null; kind: string;
  /** Stays English — a key the app maps to an icon and colour, not display copy. */
  status: string;
  /** Semantic, not a filename: UmangUtsav | SHOP | Approved | TRIP. */
  mark: string;
  released_on: string; released_on_label: string;
  manufacturer_id: number; manufacturer_name: string;
  vcp: { id: number; name: string; type: string | null; place: string | null };
};
/**
 * `venue` and `banner_image_url` are NULLABLE on the live API — the eligible-but-venue-not-yet-
 * announced case is real (observed on a production-shaped record). The banner must render
 * without them rather than printing "null".
 */
export type Utsav = {
  eligible: boolean; city: string; venue: string | null; date: string;
  invited_count: number; banner_image_url: string | null;
  invited_count_label: string; date_label: string;
};
export type RewardsSummary = {
  company_esi_id: number;
  manufacturer: SummaryManufacturer;
  period: PeriodWindow;
  utsav: Utsav | null;
  /** Ordered, "All" first, a status with no rows still gets `count: 0`. Render in server order. */
  counts: { value: string; label: string; count: number }[];
  generated_at: string;
};

/**
 * The manufacturer tab bar on screens 05/08/09/10, built from GET /me — NOT from the industry
 * tree, because only /me carries the `company_esi_id` every scoped read needs.
 */
export type MfrTab = {
  id: number;
  name: string;
  logoUrl: string | null;
  companyEsiId: number;
  /** The influencer's role in THIS manufacturer's industry. Role is per-industry, never global. */
  trade: string;
};
