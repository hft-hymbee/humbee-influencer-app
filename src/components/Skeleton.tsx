/**
 * The DESIGNED loading state — component C21. While a screen is pending its content is not
 * rendered at all: the skeleton takes its place inside the scroll body, with the header and
 * bottom nav still live and tappable.
 *
 * THE SHIMMER, AS SPECIFIED. The design is a `background-position` keyframe over
 * `linear-gradient(90deg, #F2F2F2 25%, #EAEAEA 37%, #F2F2F2 63%)` tiled every 240px, 1200ms,
 * linear. RN has no background-position, so — per docs/07 — it is re-implemented as a strip
 * of those 240px gradient tiles translated under a clipping view. The keyframe moves the
 * background 480px in 1200ms; the tiling repeats every 240px, so sliding the strip one tile
 * in 600ms and looping is the same picture, seamlessly.
 *
 * ONE CLOCK FOR EVERY SKELETON. The CSS animations all start together, so every block on a
 * screen sweeps in step. A single shared value driven on the native thread reproduces that and
 * costs one animation however many blocks are mounted — ten leaderboard rows are not ten loops.
 *
 * Reduced motion: a flat `sunken` block, no band.
 */
import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo, Animated, Easing, StyleSheet, View,
  type DimensionValue, type LayoutChangeEvent, type StyleProp, type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, motion, radius, spacing } from '../theme';

/** The design's `background-size` — the gradient repeats every 240px. */
const TILE = 240;
/** Time to slide exactly one tile at the keyframe's speed (480px per 1200ms). */
const TILE_DURATION = motion.shimmer / 2;

const offset = new Animated.Value(0);
let sweep: Animated.CompositeAnimation | null = null;
let mounted = 0;

/**
 * Ref-counted: the loop runs while at least one skeleton is on screen, and only then. A fresh
 * loop per run — a stopped composite is not guaranteed to restart.
 */
function useSweep() {
  useEffect(() => {
    if (mounted++ === 0) {
      offset.setValue(0);
      sweep = Animated.loop(
        Animated.timing(offset, { toValue: TILE, duration: TILE_DURATION, easing: Easing.linear, useNativeDriver: true }),
      );
      sweep.start();
    }
    return () => {
      if (--mounted === 0) { sweep?.stop(); sweep = null; }
    };
  }, []);
}

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled().then(v => { reduceMotion = v; }).catch(() => {});
AccessibilityInfo.addEventListener('reduceMotionChanged', v => { reduceMotion = v; });

/**
 * The band, laid over a `sunken` base by its parent. Starts one tile left of the box and is one
 * tile wider than it, so the strip still covers the box at both ends of its travel.
 */
function Shimmer() {
  useSweep();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const tiles = Math.ceil(width / TILE) + 1;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {width > 0 && !reduceMotion ? (
        <Animated.View style={[styles.strip, { width: tiles * TILE, transform: [{ translateX: offset }] }]}>
          <Svg width={tiles * TILE} height="100%">
            <Defs>
              <LinearGradient id="humbeeShimmer" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0.25" stopColor={colors.sunken} />
                <Stop offset="0.37" stopColor={colors.skeletonHighlight} />
                <Stop offset="0.63" stopColor={colors.sunken} />
              </LinearGradient>
            </Defs>
            {Array.from({ length: tiles }).map((_, i) => (
              <Rect key={i} x={i * TILE} y="0" width={TILE} height="100%" fill="url(#humbeeShimmer)" />
            ))}
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function SkeletonBlock({
  height = 16, width = '100%', style, round = radius.s,
}: { height?: number; width?: DimensionValue; style?: StyleProp<ViewStyle>; round?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { height, width, borderRadius: round }, style]}
    >
      <Shimmer />
    </View>
  );
}

/**
 * The skeleton for REMOTE MEDIA — a banner, a logo, a map — laid over the slot the media will
 * fill, until that media reports it has drawn. The screen's data can be loaded while its images
 * are still in flight; without this the slot sits blank and then pops.
 *
 * Absolute-fill, so the slot keeps its real size and nothing moves when the media lands; the
 * parent clips the corners. Touch passes through to whatever is underneath. Unmounted rather
 * than hidden once the media lands, so it stops holding the shared sweep running.
 */
export function SkeletonFill({ visible = true }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.base]}
    >
      <Shimmer />
    </View>
  );
}

/** A card-shaped skeleton, repeated. Matches the real card's height so nothing jumps on load. */
export function SkeletonCards({ count = 3, height = 96 }: { count?: number; height?: number }) {
  return (
    <View style={{ gap: spacing.s12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} height={height} round={radius.m} />
      ))}
    </View>
  );
}

export function SkeletonTiles({ count = 2 }: { count?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.s }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} height={64} round={radius.m} style={{ flex: 1 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.sunken, overflow: 'hidden' },
  strip: { position: 'absolute', top: 0, bottom: 0, left: -TILE },
});
