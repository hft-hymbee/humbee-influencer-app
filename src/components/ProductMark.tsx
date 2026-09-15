/**
 * ProductMark — the full-colour programme marks on gift cards and Home's rewards list:
 * UmangUtsav · SHOP · Approved · TRIP.
 *
 * ⚠️ PLACEHOLDER. Like the icon set, these 48px multi-colour marks are not in the handoff
 * bundle. Rendered here as a hexagon with the mark's initial in the mark's own accent colour,
 * which keeps the layout and the semantics correct. Swap this one file when the artwork lands.
 */
import React from 'react';
import { colors } from '../theme';
import { HexMark } from './HexMark';

const MARKS: Record<string, { bg: string; fg: string; short: string }> = {
  UmangUtsav: { bg: colors.primary10,  fg: colors.primary100,  short: 'UU' },
  SHOP:       { bg: colors.warning10,  fg: colors.warning200,  short: 'SH' },
  Approved:   { bg: colors.success10,  fg: colors.success200,  short: 'AP' },
  TRIP:       { bg: colors.info10,     fg: colors.info200,     short: 'TR' },
};

export function ProductMark({ name, size = 32 }: { name: string; size?: number }) {
  // Unknown marks must not crash — fall back to a neutral hexagon with the first two letters.
  const m = MARKS[name] ?? { bg: colors.sunken, fg: colors.textSecondary, short: name.slice(0, 2).toUpperCase() };
  return <HexMark size={size} backgroundColor={m.bg} label={m.short} labelColor={m.fg} labelVariant="bodyBold" />;
}
