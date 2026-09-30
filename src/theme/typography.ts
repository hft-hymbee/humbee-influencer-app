/**
 * Type ramp — docs/design-spec/02-design-tokens.md.
 *
 * Lato only, weights 400/600/700. Ratio 1.54.
 * There is NO 14px body size in this system. Do not introduce one.
 *
 * `includeFontPadding: false` is applied to every variant. Without it Lato's line-height sits
 * 1-3px off on Android and every screen drifts from the prototype (QA requirement).
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * ⚠️ TWO FONT ISSUES THAT NEED RESOLVING BEFORE LAUNCH — see docs/06-inputs-needed.md
 *
 * 1. THE LATO FILES ARE NOT IN THE HANDOFF. docs/design-spec/tokens/fonts.css imports Lato
 *    from Google Fonts as a WEBFONT, which does nothing in React Native — RN needs the .ttf
 *    files bundled into the native projects. Until they are dropped into
 *    src/assets/fonts/ and linked, `FONTS_BUNDLED` below stays false and the app renders in
 *    the platform's system font at the correct sizes and weights. Nothing crashes, and the
 *    layout is right, but it is NOT the brand typeface. QA also requires "no fallback font
 *    flash on a cold start", which only bundled fonts can guarantee.
 *
 * 2. LATO HAS NO 600 WEIGHT in the Google Fonts distribution (it ships 100/300/400/700/900),
 *    yet the design spec calls for 400/600/700 and uses 600 for the leaderboard influencer
 *    name and several emphasised styles. Either the brand licenses a Lato SemiBold cut, or
 *    those styles need reassigning to 400/700. Do not silently round 600 to 700 — it changes
 *    the visual weight of the leaderboard, which is the app's most-looked-at screen.
 * ───────────────────────────────────────────────────────────────────────────────────────────
 */
import { Platform, type TextStyle } from 'react-native';

/**
 * Flip to true once Lato-Regular.ttf / Lato-SemiBold.ttf / Lato-Bold.ttf are in
 * src/assets/fonts/ AND linked into android/app/src/main/assets/fonts + the Xcode target.
 * Then run: npx react-native-asset  (or link manually per docs/10 §1.3).
 */
export const FONTS_BUNDLED = false;

export const fontFamily = {
  400: 'Lato-Regular',
  600: 'Lato-SemiBold',
  700: 'Lato-Bold',
} as const;

/** Numeric weights, used only in the un-bundled fallback path. */
const fontWeight = {
  400: '400',
  600: '600',
  700: '700',
} as const;

/**
 * Resolve a weight to whichever mechanism is available. Referencing a font family that is not
 * installed renders unpredictably per-platform, so we choose deliberately rather than hoping.
 */
function face(weight: 400 | 600 | 700): TextStyle {
  if (FONTS_BUNDLED) return { fontFamily: fontFamily[weight] };
  return {
    fontWeight: fontWeight[weight] as TextStyle['fontWeight'],
    // Keep the platform's own UI face rather than an arbitrary substitute.
    ...(Platform.OS === 'ios' ? {} : { fontFamily: 'sans-serif' }),
  };
}

const t = (fontSize: number, lineHeight: number, weight: 400 | 600 | 700, extra?: TextStyle): TextStyle => ({
  fontSize,
  lineHeight,
  ...face(weight),
  includeFontPadding: false,
  ...extra,
});

export const typography = {
  /** "Log In", "Verify OTP", "Demand Captured", Home welcome name */
  screenTitle: t(24, 32, 700),
  /** App-bar title */
  headerTitle: t(17, 24, 700),
  /** App-bar second line */
  headerSubtitle: t(13, 18, 400),
  /** Profile name */
  sectionHeading: t(20, 28, 700),
  /** Stat tiles */
  statValue: t(20, 28, 700),
  /** Login subtitles, empty-state body */
  bodyLarge: t(15, 22, 400),
  /** Card titles, quick-link labels, manufacturer names */
  rowTitle: t(15, 20, 700),
  /** Influencer name in leaderboard rows — the 600 weight flagged above */
  leaderboardName: t(15, 20, 600),
  /** Profile keys, helper lines, summary */
  body: t(13, 20, 400),
  /** Chip labels, points card title, medal figures */
  bodyBold: t(13, 20, 700),
  /**
   * In-screen section headers — "Quick Links", "My Rewards".
   *
   * This is `Heading/small` from the HUMBEE design-system file (Figma node 1-7, the type ramp
   * the VCP app is built on): Lato Bold 16/24. It REPLACES `overline` for section headers on
   * Home, where the 11px uppercase grey read as too small and too light against the 15px card
   * titles beneath it. `overline` stays for the small uppercase labels it was drawn for
   * ("INDUSTRY", "PERIOD"), which sit above form controls, not above sections.
   */
  sectionHeader: t(16, 24, 700),
  /** "INDUSTRY", "PERIOD" — small uppercase labels above a control */
  overline: t(11, 20, 700, { letterSpacing: 0.5, textTransform: 'uppercase' }),
  /** Card meta, VCP line, stat labels */
  meta: t(11, 16, 400),
  metaBold: t(11, 16, 600),
  /** Leaderboard column header */
  tableHeader: t(11, 16, 700, { letterSpacing: 0.6, textTransform: 'uppercase' }),
  /** Bottom nav */
  navLabel: t(10, 14, 700),
  /** OTP boxes */
  otpDigit: t(24, 32, 700, { textAlign: 'center' }),
  /** Allocation card quantity */
  quantity: t(17, 22, 700),
} as const;

export type TypographyVariant = keyof typeof typography;
