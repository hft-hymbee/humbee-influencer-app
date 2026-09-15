/**
 * Leaderboard row bar — 5px, pill radius, `#F2F2F2` track (C14). Fills with `humbeeFill` 400ms on the row's stagger delay.
 * Percentage = influencer points ÷ rank-1 points, computed by the caller from server values.
 */
import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import { colors, motion, radius } from '../theme';

export function ProgressBar({
  ratio, color, delay = 0, height = 5,
}: { ratio: number; color: string; delay?: number; height?: number }) {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (reduced) { width.setValue(clamped); return; }
      Animated.timing(width, {
        toValue: clamped,
        duration: motion.fill,
        delay,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false, // animating width%, which the native driver cannot do
      }).start();
    });
  }, [clamped, delay, width]);

  return (
    <View style={{ height, borderRadius: radius.pill, backgroundColor: colors.sunken, overflow: 'hidden' }}>
      <Animated.View
        style={{
          height,
          borderRadius: radius.pill,
          backgroundColor: color,
          width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}
