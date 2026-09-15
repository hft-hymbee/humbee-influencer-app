/**
 * Status machines — docs/03-api-integration-and-data.md §5.
 *
 * ONLY GIFTS HAVE A STATUS IN V2. Demands carry no status column at all: the
 * Submitted → Confirmed → Allocated → Closed chain is driven by VCP-side events that nothing
 * emits yet, so the field arrives with the mechanism that writes it (V2 §4). Rendering a demand
 * status chip would mean inventing one — don't reintroduce DEMAND_STATUSES until the contract
 * carries them.
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
