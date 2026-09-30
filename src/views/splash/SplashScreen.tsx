/**
 * The brand splash — the HUMBEE lock-up and its tagline, held for three seconds on every cold
 * start before the app underneath is revealed.
 *
 * IT IS AN OVERLAY, NOT A ROUTE. The navigator mounts and boots BEHIND it: `restoreSession()`
 * reads the stored bearer token back, `/config` lands, the query cache rehydrates. Making the
 * splash a screen that the app replaces would stall all of that for three seconds and then
 * make the user wait for it — and, since the session is what decides whether the app opens on
 * Home or on Login, the frame after the splash would be a blank one.
 *
 * So the hold is a FLOOR, not a timer: three seconds, and never before the session has
 * finished booting. On any normal start the boot is long done and three seconds is exactly
 * what the user sees.
 *
 * The artwork is the design system's lock-up (Figma 13907-566) exported at 1x/2x/3x — not the
 * `HumbeeLogo` component, which carries no tagline.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { colors, motion } from '../../theme';

/** The brief. Measured from mount, so it covers the boot rather than queueing behind it. */
export const SPLASH_MS = 3000;

/** Design width of the lock-up, and the artwork's own 630 × 261 proportions. */
const LOCKUP_W = 240;
const LOCKUP_RATIO = 630 / 261;

export function SplashScreen() {
  return (
    <View style={styles.screen}>
      <Image
        source={require('../../assets/img/humbee-splash.png')}
        style={styles.lockup}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="HUMBEE"
      />
    </View>
  );
}

/**
 * Renders `children` from the first frame and holds the splash over them until the brief is
 * up. `booted` lets the caller extend the hold past three seconds while the session is still
 * resolving; it can never shorten it.
 */
export function SplashGate({ booted, children }: { booted: boolean; children: React.ReactNode }) {
  const [elapsed, setElapsed] = useState(false);
  const [showing, setShowing] = useState(true);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setTimeout(() => setElapsed(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!elapsed || !booted) return;
    Animated.timing(fade, { toValue: 0, duration: motion.color, useNativeDriver: true })
      .start(() => setShowing(false));
  }, [elapsed, booted, fade]);

  return (
    <>
      {children}
      {/* Unmounted once faded: an invisible full-screen layer costs a composite every frame
          for the rest of the session and buys nothing. */}
      {showing ? (
        <Animated.View style={[styles.overlay, { opacity: fade }]} pointerEvents="none">
          <SplashScreen />
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  lockup: { width: LOCKUP_W, aspectRatio: LOCKUP_RATIO },
});
