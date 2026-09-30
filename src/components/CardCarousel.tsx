/**
 * A horizontal carousel of CARDS — the C18 behaviour (BannerCarousel) for composed content
 * rather than remote artwork. Used by the Umang Utsav banners on Rewards.
 *
 * One card renders exactly as it would on its own: full content width, no dots, no motion.
 * With MORE THAN ONE the card is short by PEEK so the next one shows at the right edge — the
 * same "there is more than one" affordance Home's carousel uses — plus the C18 dots, and it
 * auto-advances every `motion.carouselInterval`.
 *
 * Cards stretch to the tallest one, so a card with a nullable row missing does not leave the
 * track jagged.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors, motion, radius, spacing } from '../theme';

type Props<T> = {
  items: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactElement;
};

export function CardCarousel<T>({ items, keyExtractor, renderItem }: Props<T>) {
  const { width: screenWidth } = useWindowDimensions();
  const ref = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const [index, setIndex] = useState(0);
  const single = items.length <= 1;

  const contentWidth = screenWidth - spacing.m * 2;
  const cardWidth = single ? contentWidth : contentWidth - PEEK;
  const interval = cardWidth + spacing.s12;

  // A list that shrinks under the current index must not leave the dots pointing past the end.
  useEffect(() => {
    if (index >= items.length) setIndex(0);
  }, [index, items.length]);

  useEffect(() => {
    if (single) return;
    const id = setInterval(() => {
      setIndex(prev => {
        const next = (prev + 1) % items.length;
        ref.current?.scrollTo({ x: next * interval, animated: true });
        return next;
      });
    }, motion.carouselInterval);
    return () => clearInterval(id);
  }, [items.length, single, interval]);

  if (!items.length) return null;
  if (single) return renderItem(items[0], 0);

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        // Snapping to the card pitch, not the page, is what keeps the peek aligned.
        snapToInterval={interval}
        decelerationRate="fast"
        disableIntervalMomentum
        onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / interval))}
        style={styles.track}
        contentContainerStyle={styles.trackInset}
      >
        {items.map((item, i) => (
          <View key={keyExtractor(item, i)} style={{ width: cardWidth }}>
            {renderItem(item, i)}
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {items.map((item, i) => (
          <View key={keyExtractor(item, i)} style={[styles.dot, i === index ? styles.dotActive : null]} />
        ))}
      </View>
    </View>
  );
}

/** How much of the next card shows at the right edge — the same as Home's carousel. */
const PEEK = 24;

const styles = StyleSheet.create({
  wrap: { gap: spacing.s },
  // The track bleeds to the screen edge so the peeking card is not clipped by the gutter;
  // the INSET puts the first card back on the content edge.
  track: { marginHorizontal: -spacing.m },
  trackInset: { paddingHorizontal: spacing.m, gap: spacing.s12 },
  dots: { flexDirection: 'row', gap: spacing.s6, justifyContent: 'center' },
  // Active dot is 20px wide (C18) — not a wider pill, not a circle.
  dot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.dotInactive },
  dotActive: { width: 20, backgroundColor: colors.primary100 },
});
