/**
 * Component C20 — the Profile "Advanced" disclosure, and nothing else.
 *
 * A 40px CENTRED row, `gap:6`, 13/20/700 `#8C8C8C`: the label plus a caret that rotates 180°
 * over 200ms. No card around it, no "View"/"Hide" link, closed on every visit
 * (docs/design-spec/03-ui-kit-and-components.md §C20).
 *
 * The design animates `max-height`, which RN cannot do; we mount/unmount and animate opacity
 * plus a small translateY instead (docs/07 §5).
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { colors, hitSlopFor, motion, spacing } from '../theme';
import { Text } from './Text';
import { Icon } from './Icon';

const ROW_HEIGHT = 40;

export function Disclosure({
  title, children,
}: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (reduced) { anim.setValue(open ? 1 : 0); return; }
      Animated.timing(anim, {
        toValue: open ? 1 : 0,
        duration: motion.position,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }).start();
    });
  }, [open, anim]);

  return (
    <View>
      <Pressable
        onPress={() => setOpen(o => !o)}
        hitSlop={hitSlopFor(ROW_HEIGHT)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.row}
      >
        <Text variant="bodyBold" color={colors.textTertiary}>{title}</Text>
        <Animated.View
          style={{
            transform: [{ rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
          }}
        >
          <Icon name="ChevronDown" size={20} color={colors.textTertiary} />
        </Animated.View>
      </Pressable>

      {open ? (
        <Animated.View
          style={{
            opacity: anim,
            transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) }],
          }}
        >
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s6,
  },
});
