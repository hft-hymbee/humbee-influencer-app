/**
 * The DESIGNED loading state — component C21. While a screen is pending its content is not
 * rendered at all: the skeleton takes its place inside the scroll body, with the header and
 * bottom nav still live and tappable.
 *
 * The design's shimmer is a `background-position` keyframe; RN has no equivalent, so this is
 * the specified re-implementation — an opacity pulse via Animated (docs/07 §5). Respects
 * reduced-motion by falling back to a static block.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { AccessibilityInfo } from 'react-native';
import { colors, radius, spacing } from '../theme';

export function SkeletonBlock({
  height = 16, width = '100%', style, round = radius.s,
}: { height?: number; width?: DimensionValue; style?: StyleProp<ViewStyle>; round?: number }) {
  const pulse = useRef(new Animated.Value(0.5)).current;
  const reduced = useRef(false);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      reduced.current = enabled;
      if (enabled) { pulse.setValue(0.8); return; }
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height, width, borderRadius: round, backgroundColor: colors.sunken, opacity: pulse }, style]}
    />
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
