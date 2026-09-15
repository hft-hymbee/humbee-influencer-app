/**
 * The brand shape — a flat-top hexagon, used at ten different sizes across six screens.
 * ONE component, one polygon, or the hexagon drifts.
 *
 * The design specifies `clip-path: polygon(...)`, which RN has no equivalent for; an SVG
 * <Polygon> is the faithful approximation (docs/07-framework-comparison.md §5).
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { colors, HEX_POINTS } from '../theme';
import { Text } from './Text';
import type { TypographyVariant } from '../theme';

export type HexMarkProps = {
  size: number;
  backgroundColor?: string;
  /** Two-letter mono, initials, or a rank number. Mutually exclusive with `children`. */
  label?: string;
  labelColor?: string;
  labelVariant?: TypographyVariant;
  /** An icon, typically. Centred over the hexagon. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HexMark({
  size, backgroundColor = colors.sunken, label, labelColor = colors.textSecondary,
  labelVariant = 'bodyBold', children, style,
}: HexMarkProps) {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Polygon points={HEX_POINTS(size)} fill={backgroundColor} />
      </Svg>
      {label ? <Text variant={labelVariant} color={labelColor}>{label}</Text> : children}
    </View>
  );
}
