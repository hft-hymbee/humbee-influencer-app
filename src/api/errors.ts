/**
 * Error taxonomy — docs/10-rn-cli-implementation-guide.md §5.5.
 *
 * Screens must NEVER branch on an HTTP status or on `message` (which is localised display copy
 * that changes with Accept-Language). They branch on `kind`, or on `code` for the specific
 * business cases. Mapping happens once, here.
 */
export type ApiErrorKind =
  | 'offline' | 'timeout' | 'unauthorized' | 'forbidden' | 'notFound'
  | 'rateLimited' | 'validation' | 'server' | 'business' | 'unknown';

/** Stable, uppercase, never localised — backend V2/01-api-reference.md §Error codes. */
export const ERROR_CODES = {
  // identity / mapping
  ESI_UNKNOWN: 'ESI_UNKNOWN',
  ESI_MISMATCH: 'ESI_MISMATCH',
  MANUFACTURER_NOT_MAPPED: 'MANUFACTURER_NOT_MAPPED',
  MANUFACTURER_NOT_FOUND: 'MANUFACTURER_NOT_FOUND',
  DISTRICT_NOT_RESOLVED: 'DISTRICT_NOT_RESOLVED',
  // catalogue
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  UOM_NOT_ALLOWED: 'UOM_NOT_ALLOWED',
  DISTRICT_INVALID: 'DISTRICT_INVALID',
  // construction site
  COORDINATES_INVALID: 'COORDINATES_INVALID',
  PINCODE_NOT_SERVICEABLE: 'PINCODE_NOT_SERVICEABLE',
  REVERSE_GEOCODE_FAILED: 'REVERSE_GEOCODE_FAILED',
  SITE_ADDRESS_INVALID: 'SITE_ADDRESS_INVALID',
  // otp
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_ATTEMPTS_EXCEEDED: 'OTP_ATTEMPTS_EXCEEDED',
  OTP_SEND_FAILED: 'OTP_SEND_FAILED',
  // influencer
  INFLUENCER_NOT_REGISTERED: 'INFLUENCER_NOT_REGISTERED',
  INFLUENCER_INACTIVE: 'INFLUENCER_INACTIVE',
  NOT_AN_INFLUENCER: 'NOT_AN_INFLUENCER',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  // client-side only
  MODULE_NOT_ENTITLED: 'MODULE_NOT_ENTITLED',
} as const;

/**
 * The catalogue moved under the influencer's feet: the SKU is gone, or the unit is no longer
 * valid for it. Both are recoverable by re-fetching the catalogue, so the screens treat them
 * as one case rather than two.
 */
export const isStaleCatalog = (e: unknown) =>
  e instanceof ApiError &&
  (e.code === ERROR_CODES.PRODUCT_NOT_FOUND || e.code === ERROR_CODES.UOM_NOT_ALLOWED);

/**
 * The `district_id` sent with a demand names no district. Kept SEPARATE from `isStaleCatalog`
 * even though both are fixed by re-fetching the industry list, because the user-facing story is
 * different: a stale SKU asks them to pick the product again, whereas a stale district means
 * the region their picker was built for no longer resolves and the whole picker must reload.
 * Nothing is stored in either case.
 */
export const isStaleDistrict = (e: unknown) =>
  e instanceof ApiError && e.code === ERROR_CODES.DISTRICT_INVALID;

/**
 * The pin cannot become a site. Three codes, one user action in all three — move the pin:
 *
 *   COORDINATES_INVALID     not a point on earth; validated BEFORE any geocode is attempted,
 *                           so a transposed pair fails fast and costs nothing
 *   PINCODE_NOT_SERVICEABLE a real place the platform does not serve
 *   REVERSE_GEOCODE_FAILED  the provider failed — the one of the three that is RETRYABLE
 *
 * A null `pincode_id` on an otherwise successful geocode belongs here too, but it arrives as a
 * SUCCESS, not an error: `domain/site.ts` is what turns it into "we do not serve this location".
 */
export const isPinUnusable = (e: unknown) =>
  e instanceof ApiError &&
  (e.code === ERROR_CODES.COORDINATES_INVALID ||
   e.code === ERROR_CODES.PINCODE_NOT_SERVICEABLE ||
   e.code === ERROR_CODES.REVERSE_GEOCODE_FAILED);

/** Only REVERSE_GEOCODE_FAILED is worth a Retry button; the other two need a new pin. */
export const isGeocodeRetryable = (e: unknown) =>
  e instanceof ApiError && e.code === ERROR_CODES.REVERSE_GEOCODE_FAILED;

/**
 * The `site` on a submission did not validate — an unserved pincode, a district or state that
 * contradicts it, a locality outside it, or coordinates that are not a point on earth.
 *
 * The server REJECTS a contradiction rather than silently correcting it, precisely so a site is
 * never quietly filed somewhere the app never showed the user. `message` names which check
 * failed and is the only place that detail exists — but it is localised display copy, so it is
 * shown, never branched on. The app's action is the same in all five cases: back to the map.
 */
export const isSiteRejected = (e: unknown) =>
  e instanceof ApiError && e.code === ERROR_CODES.SITE_ADDRESS_INVALID;

/**
 * ESI_UNKNOWN and ESI_MISMATCH both render as "Session expired. Please log in again." — the
 * backend does that deliberately, so a caller probing ids learns nothing. It also means that
 * copy is MISLEADING in the common case: the real cause is usually a wrong `company_esi_id`
 * (it is `external_system_id.id` from GET /me, NOT the ERP code ops tools show), not a dead
 * session. So the app must NOT sign the user out on these — it re-reads /me instead.
 */
export const isEsiProblem = (e: unknown) =>
  e instanceof ApiError &&
  (e.code === ERROR_CODES.ESI_UNKNOWN || e.code === ERROR_CODES.ESI_MISMATCH);

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly code?: string;
  readonly field?: string;
  readonly status?: number;
  readonly data?: Record<string, unknown>;

  constructor(args: {
    kind: ApiErrorKind; message: string; code?: string; field?: string;
    status?: number; data?: Record<string, unknown>;
  }) {
    super(args.message);
    this.name = 'ApiError';
    this.kind = args.kind;
    this.code = args.code;
    this.field = args.field;
    this.status = args.status;
    this.data = args.data;
  }

  get retryAfterSeconds(): number | undefined {
    const v = this.data?.retry_after_seconds;
    return typeof v === 'number' ? v : undefined;
  }
}

export const isOffline = (e: unknown) => e instanceof ApiError && e.kind === 'offline';
export const isUnauthorized = (e: unknown) => e instanceof ApiError && e.kind === 'unauthorized';
export const hasCode = (e: unknown, code: string) => e instanceof ApiError && e.code === code;

/**
 * Generic fallback copy. A raw server `message` is display-ready and preferred; this is for
 * transport failures where there is no server message at all.
 *
 * NOTE: these strings are English placeholders. Real copy is approved per-screen in the design
 * spec and must be routed through i18n before launch — see src/i18n.
 */
export function fallbackMessage(kind: ApiErrorKind): string {
  switch (kind) {
    case 'offline':      return 'You are offline. Showing your last saved data.';
    case 'timeout':      return 'That took too long. Try again.';
    case 'rateLimited':  return 'Too many attempts. Wait a moment and try again.';
    case 'server':       return 'Something went wrong at our end. Try again.';
    default:             return 'Something went wrong. Try again.';
  }
}

/**
 * `GET /users/can-delete-account` is a VCP-side endpoint. Its refusal copy can name a "Firms"
 * section that does not exist in this app (V2 §7, "Known copy problem"), so that one string is
 * remapped rather than shown. Everything else passes through as sent.
 */
export function deletionRefusalCopy(serverMessage: string): string {
  if (/firms/i.test(serverMessage)) {
    return 'Your account cannot be deleted right now. Contact HUMBEE support for help.';
  }
  return serverMessage;
}
