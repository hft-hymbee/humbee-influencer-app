/**
 * Component C18 — Home's banner carousel. Auto-advances every 4s.
 *
 * A SINGLE banner is full-bleed, as designed. With MORE THAN ONE the slide is narrower than
 * the screen so the next banner peeks in at the right edge — the affordance the client asked
 * for, so it is obvious there is more than one banner. A single slide hides the dots and
 * disables auto-advance (docs/design-spec/04-screens/03-home.md).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, View } from 'react-native';
import { colors, motion, radius, spacing } from '../theme';
import type { Banner } from '../api/types';

/**
 * Banners are remote, always. `GET /home` sends absolute CloudFront URLs and Ops changes them
 * without an app release — mapping them onto bundled copies would pin the carousel to whatever
 * artwork happened to ship in the binary.
 */
function sourceFor(url: string) {
  return { uri: url };
}

/**
 * The design shows each banner at its NATURAL aspect ratio, full width — the caption strip
 * baked into the artwork must not be cropped. Bundled assets carry their own dimensions;
 * a remote URL is measured once.
 */
function useAspect(url: string): number | null {
  const source = useMemo(() => sourceFor(url), [url]);
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    if (aspect != null || !source.uri) return;
    let live = true;
    Image.getSize(source.uri, (w, h) => { if (live && h > 0) setAspect(w / h); }, () => {});
    return () => { live = false; };
  }, [aspect, source]);

  return aspect;
}

function Slide({ banner, width, rounded }: { banner: Banner; width: number; rounded: boolean }) {
  const aspect = useAspect(banner.image_url);
  return (
    <Image
      source={sourceFor(banner.image_url)}
      accessibilityLabel={banner.alt}
      resizeMode="cover"
      style={[
        styles.slide,
        rounded ? styles.slideRounded : null,
        { width, aspectRatio: aspect ?? undefined },
      ]}
    />
  );
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const screenWidth = Dimensions.get('window').width;
  const ref = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const [index, setIndex] = useState(0);
  const single = banners.length <= 1;

  /**
   * One banner: full-bleed edge to edge. Several: inset by the screen gutter and short by
   * PEEK, so the neighbour is visible. `interval` is what a swipe snaps to.
   */
  const slideWidth = single ? screenWidth : screenWidth - spacing.m * 2 - PEEK;
  const interval = single ? screenWidth : slideWidth + spacing.s12;

  useEffect(() => {
    if (single) return;
    const id = setInterval(() => {
      setIndex(prev => {
        const next = (prev + 1) % banners.length;
        ref.current?.scrollTo({ x: next * interval, animated: true });
        return next;
      });
    }, motion.carouselInterval);
    return () => clearInterval(id);
  }, [banners.length, single, interval]);

  if (!banners.length) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        // Snapping to the slide pitch, not the page, is what keeps the peek aligned.
        snapToInterval={interval}
        decelerationRate="fast"
        disableIntervalMomentum
        onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / interval))}
        style={styles.track}
        contentContainerStyle={single ? undefined : styles.trackInset}
      >
        {banners.map(b => (
          <Slide key={b.id} banner={b} width={slideWidth} rounded={!single} />
        ))}
      </ScrollView>
      {!single ? (
        <View style={styles.dots}>
          {banners.map((b, i) => (
            <View key={b.id} style={[styles.dot, i === index ? styles.dotActive : null]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** How much of the next banner shows at the right edge. */
const PEEK = 24;

const styles = StyleSheet.create({
  wrap: { gap: spacing.s },
  // The track is full-bleed either way; the INSET moves the slides, not the viewport.
  track: { marginHorizontal: -spacing.m },
  trackInset: { paddingHorizontal: spacing.m, gap: spacing.s12 },
  slide: { backgroundColor: colors.sunken },
  slideRounded: { borderRadius: radius.m },
  dots: { flexDirection: 'row', gap: spacing.s6, justifyContent: 'center' },
  // Active dot is 20px wide (C18) — not a wider pill, not a circle.
  dot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.dotInactive },
  dotActive: { width: 20, backgroundColor: colors.primary100 },
});
