/**
 * Spacing, radius, elevation, motion, icon sizes — docs/design-spec/02-design-tokens.md.
 *
 * NOTE ON THE SPACING SCALE: the designed screens use a full 4pt grid (2,4,6,8,10,12,14,16,20,24,32),
 * which is wider than the design-system library's 2/4/8/16/32/64. The handoff wins for designed
 * screens — see docs/02-design-system.md §3. `s`/`m` below are semantic aliases into this scale.
 */
export const spacing = {
  xxs: 2, xs: 4, s6: 6, s: 8, s10: 10, s12: 12, s14: 14, m: 16, s20: 20, s24: 24, l: 32,
} as const;

export const radius = {
  s: 4,     // point-rule rows, UOM buttons
  m: 8,     // DEFAULT — cards, tiles, buttons, inputs, nav pills, OTP boxes
  l: 16,    // login/OTP form panel
  pill: 999,
} as const;

export const iconSize = { s: 16, m: 20, l: 24, xl: 32 } as const;

/**
 * Elevation — black at 15%. RN needs both iOS shadow* and Android elevation.
 * Borders in the design are inset box-shadows, which RN has no equivalent for; we approximate
 * with borderWidth and compensate for the 1px content-box shift on selection.
 */
export const elevation = {
  none: {},
  e1: {
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  e2: {
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
} as const;

/** Motion — docs/design-spec/05-interactions-and-motion.md. Nothing scales on press. No spring. */
export const motion = {
  color: 120,        // colour, background, shadow
  pointsExpand: 160,
  position: 200,     // size/position, row entry, caret rotate
  rise: 240,         // screen/section rise
  fill: 400,         // progress bar
  carousel: 420,
  carouselInterval: 4000,
  stagger: { row: 35, demandCard: 45, allocationCard: 50 },
} as const;

/**
 * Minimum tap target. 48dp, not the handoff's 44px — the stricter accessibility floor wins
 * (docs/02-design-system.md §3). Use `hitSlop` to reach 48 without changing visual size.
 */
export const MIN_TAP = 48;

export const hitSlopFor = (visual: number) => {
  const pad = Math.max(0, Math.ceil((MIN_TAP - visual) / 2));
  return { top: pad, bottom: pad, left: pad, right: pad };
};

/** The brand shape: a flat-top hexagon. clip-path polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%) */
export const HEX_POINTS = (size: number) =>
  `${size * 0.5},0 ${size},${size * 0.25} ${size},${size * 0.75} ${size * 0.5},${size} 0,${size * 0.75} 0,${size * 0.25}`;
