/**
 * Colour tokens — transcribed from docs/design-spec/02-design-tokens.md.
 *
 * DO NOT hand-edit. This file is the target of `npm run tokens:build`, which parses
 * docs/design-spec/tokens/*.css. Until that script runs in CI, treat every value here as
 * owned by the design spec: a change belongs in the CSS, not here.
 */
export const colors = {
  // ---- brand ----
  primary200: '#7A4800', // hover/pressed on filled primary; Redeemed chip text
  primary100: '#995A00', // Chestnut. EMPHASIS ONLY — active nav, rank 1, primary button, links
  primary50: '#CC9A4D',
  primary50a: 'rgba(153,90,0,0.5)', // the Log Out button's ring
  primary25: 'rgba(153,90,0,0.25)',
  primary10: 'rgba(153,90,0,0.10)',
  primary5: 'rgba(153,90,0,0.05)',
  secondary100: '#FFA525', // Crayola amber. Active demand-trail step; podium gradient
  secondary18: 'rgba(255,165,37,0.18)',
  secondary04: 'rgba(255,165,37,0.04)',

  // ---- neutrals ----
  white: '#FFFFFF',
  surface: '#FFFFFF', // this app is white-first
  sunken: '#F2F2F2', // stat tiles, progress track, row hairlines, UOM group
  border: '#E5E5E5', // card borders, header/nav divider
  dotInactive: '#D9D9D9',
  textTertiary: '#8C8C8C', // meta, overlines, inactive tab label
  textSecondary: '#666666', // stat labels, sub-values
  textPrimary: '#333333',
  black: '#0D0D0D', // active manufacturer tab label + rule, active period pill
  illustrationTint: '#EDF1F6',

  // ---- semantic ----
  success100: '#008000', // points values
  successTint20: 'rgba(108,217,108,0.20)', // Allocated badge background (C5)
  success200: '#006600', // deeper green for small text (Allocated)
  success10: 'rgba(0,128,0,0.10)',
  error100: '#CC0000',
  error25: 'rgba(204,0,0,0.25)',
  error10: 'rgba(204,0,0,0.10)',
  warning10: 'rgba(255,191,64,0.10)',
  warning200: '#BF8000',
  info100: '#0081F2',
  info200: '#0067C1',
  info25: 'rgba(0,129,242,0.25)',
  info10: 'rgba(0,129,242,0.10)',
} as const;

export type ColorToken = keyof typeof colors;

/** Medal palette — leaderboard podium. Ranks 1..3 only. */
export const medals = {
  1: { avatarBg: '#995A00', avatarText: '#FFFFFF', label: 'Gold',   labelColor: '#995A00', ribbonLeft: '#7A4800', ribbonRight: '#995A00', discOuter: '#C98A0F', discMid: '#F0B542', discInner: '#FFD983', number: '#6B3F00' },
  2: { avatarBg: '#E5E5E5', avatarText: '#4A4A4A', label: 'Silver', labelColor: '#8C8C8C', ribbonLeft: '#6B6B6B', ribbonRight: '#8C8C8C', discOuter: '#9AA0A6', discMid: '#C9CDD2', discInner: '#EDEFF1', number: '#4A4A4A' },
  3: { avatarBg: '#EBD3B4', avatarText: '#8A4B12', label: 'Bronze', labelColor: '#A9662B', ribbonLeft: '#5C3600', ribbonRight: '#7A4800', discOuter: '#9A6A2E', discMid: '#BE8A4C', discInner: '#DCB07A', number: '#5C3600' },
} as const;

/** Leaderboard row rank marks — ranks 1-3 are tinted, 4+ is neutral. */
export const rankMark = (rank: number) =>
  rank === 1 ? { bg: colors.primary100, fg: colors.white }
  : rank === 2 ? { bg: colors.border, fg: colors.textPrimary }
  : rank === 3 ? { bg: colors.sunken, fg: colors.textSecondary }
  : { bg: colors.sunken, fg: colors.textSecondary };

/** Progress bar fill — top 3 are stronger. Track is always `sunken`. */
export const progressFill = (rank: number) =>
  rank <= 3 ? 'rgba(153,90,0,0.55)' : 'rgba(153,90,0,0.30)';

/**
 * The permitted gradients. Two come from the handoff; the third is the Umang Utsav banner
 * background, taken from the Figma node `27548:67897` ("BG") in VCP· HUMBEE at the client's
 * direction. Do not add a fourth, and do not retune these by eye.
 */
export const gradients = {
  podium: {
    colors: ['rgba(255,165,37,0.18)', 'rgba(255,165,37,0.04)', 'rgba(255,255,255,0)'],
    locations: [0, 0.62, 1],
  },
  leaderboardFooterFade: {
    colors: ['rgba(255,255,255,0)', '#FFFFFF'],
    locations: [0, 0.4],
  },
  /**
   * Figma `BG` 27548:67897 — a 396x203 rect filled with a linear gradient running from
   * (0, 6.83) to (375.94, 243.59), stops #B9DDE5 → #FFC066 @42.8% → #B9DDE5 @92.3%.
   * The node also carries a fractal-noise grain at 15% black, which RN cannot filter; the
   * gradient alone is the approximation.
   */
  utsavBanner: {
    colors: ['#B9DDE5', '#FFC066', '#B9DDE5'],
    locations: [0, 0.427885, 0.923077],
    start: { x: 0, y: 0.0337 },
    end: { x: 0.9493, y: 1.2 },
  },
} as const;
