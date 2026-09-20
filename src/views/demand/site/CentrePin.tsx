/**
 * The pin that does not move. Spec S2/S4.
 *
 * It is absolutely positioned at the centre of the screen and the MAP travels under it, so
 * "where the pin is" is always "the middle of what you are looking at". Nothing here is
 * touchable — the map takes every gesture, and that is the point of the pattern: no precise
 * touch on a 34px target, which is what a draggable marker would demand from someone standing
 * on a site in the sun.
 *
 * The mark is two views and no renderer: a circle with one squared corner, rotated 45° into a
 * teardrop, over a grey ground pad. No SVG, because this sits on top of a map that is already
 * the most expensive thing on the screen.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../../theme';
import { Icon, Text } from '../../../components';

export function CentrePin({
  size = 34, showTooltip, dragChip,
}: { size?: number; showTooltip?: boolean; dragChip?: boolean }) {
  return (
    <View style={styles.centre} pointerEvents="none">
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

      <View style={styles.pinWrap}>
        {/*
          A teardrop: a circle with ONE square corner, rotated 45° so that corner becomes the
          downward point. The square corner must be the BOTTOM-RIGHT one — under a clockwise
          45° turn, bottom-right lands at 6 o'clock. (Squaring bottom-LEFT instead points the
          pin at 9 o'clock, i.e. sideways.) The glyph is counter-rotated to sit upright.
        */}
        <View style={[styles.drop, { width: size, height: size, borderTopLeftRadius: size / 2, borderTopRightRadius: size / 2, borderBottomLeftRadius: size / 2 }]}>
          <View style={styles.upright}>
            <Icon name="LocationPin" size={size === 34 ? 16 : 19} color={colors.white} />
          </View>
        </View>
        {/* The pad the pin stands on — grey, so it reads as shadow on the ground, not as part
            of the mark. It is what stops the tip looking like it floats. */}
        <View style={styles.pad} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
  pinWrap: { alignItems: 'center' },
  drop: {
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
    // 45° turns the one square corner into the downward point.
    transform: [{ rotate: '45deg' }],
  },
  upright: { transform: [{ rotate: '-45deg' }] },
  pad: {
    width: 14,
    height: 6,
    borderRadius: 3,
    // Overlaps the tip so the pin sits IN the pad rather than above it.
    marginTop: -3,
    backgroundColor: colors.dotInactive,
  },
});
