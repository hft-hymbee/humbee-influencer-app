/**
 * Screen 07 — Demand Captured. docs/design-spec/04-screens/07-demand-captured.md
 *
 * NO header, NO bottom nav — the two buttons are the only exits, and the screen REPLACES the
 * demand screen in the stack.
 *
 * It renders the POST /demands response, so there is no fetch here. That is deliberate: the
 * contract puts everything this screen needs in the response body, which also dodges
 * read-replica lag.
 *
 * Each Lottie mounts ONCE — remounting on re-render restarts the burst, which reads as a glitch.
 * Reduced motion skips the celebration entirely and shows the success mark statically.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { Button, HexMark, Icon, Text } from '../../components';
import type { CreateDemandResult } from '../../api/types';

export function DemandCapturedScreen({
  onCaptureAnother, onViewDemands,
}: {
  /**
   * Kept on the route for the navigator, but the designed screen shows only the title,
   * the subtitle and the two buttons — no points line. Do not render an expectation here.
   */
  result?: CreateDemandResult | null;
  onCaptureAnother: () => void;
  onViewDemands: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  // Guard against re-mounting the animations on re-render.
  const mounted = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    mounted.current = true;
  }, []);

  const showAnimations = reducedMotion === false;

  return (
    <View
      style={{
        flex: 1, backgroundColor: colors.surface, overflow: 'hidden',
        paddingHorizontal: spacing.s24, paddingTop: insets.top + spacing.l,
        paddingBottom: insets.bottom + spacing.l,
        alignItems: 'center', justifyContent: 'center', gap: spacing.s24,
      }}
    >
      {showAnimations ? (
        <LottieView
          source={require('../../assets/lottie/celebration.json')}
          autoPlay
          loop
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 520, zIndex: 2, pointerEvents: 'none' }}
        />
      ) : null}

      {showAnimations ? (
        <LottieView
          source={require('../../assets/lottie/success-green.json')}
          autoPlay
          loop={false}
          style={{ width: 180, height: 180, zIndex: 1 }}
        />
      ) : (
        // Reduced-motion / pre-check fallback: the success mark, static.
        <HexMark size={120} backgroundColor={colors.success10}>
          <Icon name="CheckCircle" size={56} color={colors.success100} />
        </HexMark>
      )}

      <View style={{ gap: spacing.s6, zIndex: 3 }}>
        <Text variant="screenTitle" align="center">Demand Captured</Text>
        <Text variant="bodyLarge" color={colors.textTertiary} align="center">
          Well done. Your distributor will confirm the allocation shortly.
        </Text>
      </View>

      <View style={{ alignSelf: 'stretch', gap: spacing.s, zIndex: 3 }}>
        <Button label="Capture Another Demand" onPress={onCaptureAnother} fullWidth />
        <Button label="View My Demands" variant="text" onPress={onViewDemands} fullWidth />
      </View>
    </View>
  );
}
