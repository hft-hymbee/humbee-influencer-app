/**
 * Status machines — docs/03-api-integration-and-data.md §5.
 *
 * TWO STATUS SETS NOW. Gifts have always had one. Demands acquired one when the server began
 * deriving FULFILMENT from allocations — `OPEN`, `PARTIALLY_FULFILLED`, `FULFILLED` — which
 * supersedes V2's "a demand carries no status" and the design decision built on it.
 *
 * It is still NOT the Submitted → Confirmed → Allocated → Closed chain the PRD describes:
 * `Confirmed` needs an acknowledgement nothing emits. These are the three states the data can
 * actually answer, so they are the three the app renders.
 *
 * The gift set is CLOSED and STRICTLY ORDERED. The influencer can never change a status; there
 * is no UI for it. Colour is fixed by meaning, never by aesthetics.
 *
 * An UNKNOWN status must not crash and must not render blank — new statuses will reach the
 * server before the app knows about them. `statusStyle` falls back to a neutral chip.
 */
import { colors } from '../theme/colors';

export const GIFT_STATUSES = ['Announced', 'In Shop', 'Gifted', 'Redeemed'] as const;

export type GiftStatus = (typeof GIFT_STATUSES)[number];

export type StatusStyle = { bg: string; fg: string };

const STATUS_STYLES: Record<string, StatusStyle> = {
  Announced:  { bg: colors.info10,    fg: colors.info200 },
  'In Shop':  { bg: colors.warning10, fg: colors.warning200 },
  Gifted:     { bg: colors.success10, fg: colors.success200 },
  Redeemed:   { bg: colors.primary10, fg: colors.primary200 },
};

/** Never throws. An unrecognised status renders neutrally with its raw label. */
export function statusStyle(status: string): StatusStyle {
  return STATUS_STYLES[status] ?? { bg: colors.sunken, fg: colors.textSecondary };
}

export function isTerminal(status: string): boolean {
  return status === 'Redeemed';
}

/**
 * Demand FULFILMENT — how much of a demand a VCP has allocated against.
 *
 * Keyed on the STABLE `status` key, never on `status_label`: the label is localised copy that
 * changes with Accept-Language, and colouring by it would leave a Hindi build grey.
 *
 * Never derive the status from the quantities either. The rule is `allocated >= demanded`, it
 * belongs to the VCP order system, and it lives on the server precisely so the two cannot
 * drift.
 */
const FULFILMENT_STYLES: Record<string, StatusStyle> = {
  // Raised and waiting. Neutral, not a warning: nothing is wrong with a fresh demand.
  OPEN:                { bg: colors.sunken,     fg: colors.textSecondary },
  // Something has been allocated, something is still owed — the one state that wants attention.
  PARTIALLY_FULFILLED: { bg: colors.warning10,  fg: colors.warning200 },
  FULFILLED:           { bg: colors.success10,  fg: colors.success200 },
};

export function fulfilmentStyle(status: string): StatusStyle {
  return FULFILMENT_STYLES[status] ?? { bg: colors.sunken, fg: colors.textSecondary };
}
