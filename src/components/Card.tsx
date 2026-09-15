/**
 * The card chrome every list row and panel sits in.
 *
 * The design's borders are inset box-shadows (`inset 0 0 0 1px #E5E5E5`) so they never affect
 * layout. RN has no inset shadow, so we use borderWidth — which DOES affect layout. The
 * `selected` variant therefore compensates: it swaps a 1px border for 2px and removes 1px of
 * padding, so the content box does not shift when a card is picked
 * (docs/07-framework-comparison.md §5).
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, elevation, radius } from '../theme';

export type CardProps = {
  children: React.ReactNode;
  padding?: number;
  selected?: boolean;
  /** The leaderboard current-user card: 1.5px chestnut ring + elevation-2. */
  emphasis?: boolean;
  raised?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, padding = 14, selected, emphasis, raised, style }: CardProps) {
  const borderWidth = selected ? 2 : emphasis ? 1.5 : 1;
  const borderColor = selected || emphasis ? colors.primary100 : colors.border;
  // Compensate so the content box stays put when the ring thickens.
  const pad = padding - (borderWidth - 1);

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.m,
          borderWidth,
          borderColor,
          padding: pad,
        },
        (selected || emphasis || raised) ? elevation.e2 : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
