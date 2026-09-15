/**
 * Icons.
 *
 * ⚠️ PLACEHOLDER GEOMETRY — READ BEFORE SHIPPING.
 *
 * The design system forbids substituting Lucide / Material / Heroicons, and specifies the
 * in-house HUMBEE set (102 glyphs, 24x24 grid, solid fills, tinted with currentColor).
 * That SVG set is NOT in the handoff bundle (docs/design-spec/assets/ has logos, illustrations
 * and Lottie only), so the paths below are stand-ins drawn to the right grid and weight.
 *
 * They are deliberately confined to this one file so the swap is mechanical: when the real set
 * arrives, run it through SVGR and replace `PATHS` — no screen changes. Tracked as an input in
 * docs/06-inputs-needed.md.
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors, iconSize } from '../theme';

export type IconName =
  | 'Account' | 'ArrowBack'
  | 'HomeFilled' | 'HomeOutlined'
  | 'PerformanceFilled' | 'PerformanceOutlined'
  | 'ShoppingCartFilled' | 'ShoppingCartOutlined'
  | 'InventoryFilled' | 'InventoryOutlined'
  | 'RewardsFilled' | 'RewardsOutlined'
  | 'InfoOutlined' | 'CheckCircle' | 'Cluster' | 'VCPManagement'
  | 'LogoutOutlined' | 'Delete' | 'ChevronDown' | 'ChevronUp' | 'Bell' | 'Search' | 'Close';

/** 24x24 viewBox paths. Solid fills, tinted with the `color` prop. */
const PATHS: Record<IconName, string[]> = {
  Account: ['M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z'],
  ArrowBack: ['M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z'],
  HomeFilled: ['M12 3l9 8h-3v10h-5v-6h-2v6H6V11H3z'],
  HomeOutlined: ['M12 3l9 8h-3v10h-5v-6h-2v6H6V11H3l9-8zm0 2.7L7 10.2V19h2v-6h6v6h2v-8.8l-5-4.5z'],
  PerformanceFilled: ['M4 20h4v-8H4zm6 0h4V4h-4zm6 0h4v-5h-4z'],
  PerformanceOutlined: ['M4 20h4v-8H4v8zm1.5-6.5h1v5h-1zM10 20h4V4h-4v16zm1.5-14.5h1v13h-1zM16 20h4v-5h-4v5zm1.5-3.5h1v2h-1z'],
  ShoppingCartFilled: ['M7 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM3 3h2.4l3.1 9.6h9.1L20 6H7.5L6.8 4H3z'],
  ShoppingCartOutlined: ['M3 3h2.4l.7 2H20l-2.4 6.6H8.5L7.8 9.6 6.1 4.5H3V3zm5.6 4l1.4 4h6.2l1.1-3H8.6zM7 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z'],
  InventoryFilled: ['M3 4h18v4H3zm1 6h16v10H4zm4 3v2h8v-2z'],
  InventoryOutlined: ['M3 4h18v4H3V4zm1.5 1.5v1h15v-1h-15zM4 10h16v10H4V10zm1.5 1.5v7h13v-7h-13zM8 13h8v2H8v-2z'],
  RewardsFilled: ['M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8zM8 19h8v3H8z'],
  RewardsOutlined: ['M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2zm0 3.4L10.5 8.5l-3.4.5 2.5 2.4-.6 3.4 3-1.6 3 1.6-.6-3.4 2.5-2.4-3.4-.5L12 5.4zM8 19h8v3H8v-3z'],
  InfoOutlined: ['M12 2a10 10 0 100 20 10 10 0 000-20zm0 1.8a8.2 8.2 0 110 16.4 8.2 8.2 0 010-16.4zM11 7h2v2h-2zm0 4h2v6h-2z'],
  CheckCircle: ['M12 2a10 10 0 100 20 10 10 0 000-20zm-1 14.4l-4-4L8.4 11l2.6 2.6L15.6 9 17 10.4z'],
  Cluster: ['M12 2l3.5 2v4L12 10 8.5 8V4zM5 12l3.5 2v4L5 20l-3.5-2v-4zm14 0l3.5 2v4L19 20l-3.5-2v-4z'],
  VCPManagement: ['M4 4h7v7H4zm9 0h7v4h-7zm0 6h7v10h-7zM4 13h7v7H4z'],
  LogoutOutlined: ['M10 4v2H6v12h4v2H4V4h6zm4.6 3.6L18.9 12l-4.3 4.4-1.4-1.4 2-2H9v-2h6.2l-2-2z'],
  Delete: ['M9 3h6l1 2h4v2H4V5h4zM5 8h14l-1 13H6z'],
  ChevronDown: ['M7.4 8.6L12 13.2l4.6-4.6L18 10l-6 6-6-6z'],
  // The same chevron mirrored — the dropdown's `Open` state (DS §4.2).
  ChevronUp: ['M16.6 15.4L12 10.8l-4.6 4.6L6 14l6-6 6 6z'],
  Bell: ['M12 2a6 6 0 016 6v4l2 3H4l2-3V8a6 6 0 016-6zm0 18a3 3 0 002.8-2H9.2A3 3 0 0012 20z'],
  Search: ['M10 3a7 7 0 015.5 11.3l4.6 4.6-1.4 1.4-4.6-4.6A7 7 0 1110 3zm0 2a5 5 0 100 10 5 5 0 000-10z'],
  Close: ['M6.4 5L12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z'],
};

export type IconProps = { name: IconName; size?: number; color?: string };

export function Icon({ name, size = iconSize.l, color = colors.textPrimary }: IconProps) {
  const paths = PATHS[name];
  // An unknown icon must never crash a screen — render nothing rather than throwing.
  if (!paths) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths.map((d, i) => <Path key={i} d={d} fill={color} />)}
    </Svg>
  );
}
