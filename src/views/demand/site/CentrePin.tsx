/**
 * The pin that does not move. Spec S2/S4.
 *
 * It is absolutely positioned at the centre of the screen and the MAP travels under it, so
 * "where the pin is" is always "the middle of what you are looking at". Nothing here is
 * touchable — the map takes every gesture, and that is the point of the pattern: no precise
 * touch on a 34px target, which is what a draggable marker would demand from someone standing
 * on a site in the sun.
 *
 * THE TIP IS THE COORDINATE, so the tip — not the middle of the mark — has to land on the
 * map's centre. That is what `bottom: '50%'` on the anchor buys: the column's bottom edge sits
 * exactly on the vertical centre line and the mark grows upward out of it. Centring the mark
 * itself instead (the obvious thing, and what this did before) puts the tip half a pin BELOW
 * the coordinate the sheet is describing — about 25 m at street zoom.
 *
 * It is drawn as one SVG path rather than a rotated square, because a 45°-rotated square makes
 * a wide, blunt tail and the mark is a teardrop: a full circle with two straight tangents
 * running down to a point. `react-native-svg` is already loaded for the icon set, the path is
 * static, and this re-renders only when the fix state changes — never per map frame.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { colors, elevation, radius, spacing } from '../../../theme';
import { Icon, Text } from '../../../components';

/**
 * The mark, in its own 48 × 55 space; `size` scales this whole box.
 *
 * Body: r = 24 about (24, 24). Tip: (24, 55). The arc ends are the TANGENT POINTS from the tip
 * — cos α = r/d = 24/31 — so the straight edges meet the circle without a crease. Move the tip
 * and these two numbers have to move with it.
 */
const PIN_W = 48;
const PIN_H = 55;
const PIN_PATH = 'M8.8 42.57A24 24 0 1 1 39.2 42.57L24 55Z';

/** The white glyph inside the body: the icon set's LocationMarker, centred in the circle. */
const GLYPH_PATH = 'M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 11a4 4 0 110-8 4 4 0 010 8z';
const GLYPH_SCALE = 1.2;
const GLYPH_OFFSET = 24 - 12 * GLYPH_SCALE;

export function CentrePin({
  size = 34, showTooltip, dragChip,
}: {
  /** Width of the mark. Height follows the 48:55 aspect — the tip stays on the centre either way. */
  size?: number;
  showTooltip?: boolean;
  dragChip?: boolean;
}) {
  const height = (size * PIN_H) / PIN_W;

  return (
    <View style={styles.centre} pointerEvents="none">
      <View style={styles.anchor}>
        {/* Tooltip on arrival (S2); after a fix it becomes the "Drag to adjust" chip (S4) — the
            user's job changes from PLACING the pin to CHECKING it, so the copy changes with it. */}
        {dragChip ? (
          <View style={styles.chip}>
            <Icon name="Map" size={16} color={colors.textPrimary} />
            <Text variant="metaBold" color={colors.textPrimary}>Drag to adjust</Text>
          </View>
        ) : showTooltip ? (
          <View style={styles.tooltip}>
            <Text variant="metaBold" color={colors.white}>Move map to place the pin</Text>
          </View>
        ) : null}

        {/* The shadow is on the wrapper, not the path: RN cannot shadow an SVG path, and a
            shadow is what stops the mark reading as painted flat onto the map. */}
        <View style={[styles.mark, { width: size, height }]}>
          <Svg width={size} height={height} viewBox={`0 0 ${PIN_W} ${PIN_H}`}>
            <Path d={PIN_PATH} fill={colors.primary100} />
            <G transform={`translate(${GLYPH_OFFSET} ${GLYPH_OFFSET}) scale(${GLYPH_SCALE})`}>
              <Path d={GLYPH_PATH} fill={colors.white} />
            </G>
          </Svg>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  /**
   * Bottom edge on the vertical centre line, full width so the chip centres over the mark
   * however wide its copy gets. The column grows upward: chip, gap, mark, tip.
   */
  anchor: {
    position: 'absolute',
    bottom: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.s,
  },
  tooltip: {
    backgroundColor: colors.black,
    borderRadius: radius.s,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.s,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s6,
  },
  mark: { ...elevation.e2 },
});
