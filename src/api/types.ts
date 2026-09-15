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
