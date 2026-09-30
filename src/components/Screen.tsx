/**
 * The shell — header, scroll body, offline banner, safe-area handling.
 *
 * The header carries a title + subtitle and the person icon that is the ONLY route to Profile.
 * There is deliberately NO notification bell here: the handoff excludes it, and screen 11 is
 * reached from Profile (docs/08-screen-inventory.md §3).
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, hitSlopFor, radius, spacing } from '../theme';
import { Text } from './Text';
import { Icon } from './Icon';
import { HumbeeLogo } from './HumbeeLogo';
import { OfflineBanner } from './OfflineBanner';

export function ScreenHeader({
  title, subtitle, onPressAccount, onBack,
}: { title: string; subtitle?: string; onPressAccount?: () => void; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[headerStyles.bar, { paddingTop: insets.top + spacing.s12 }]}>
      {/* Stack screens keep a back affordance — they sit outside the bottom-nav shell. */}
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={hitSlopFor(24)} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="ArrowBack" size={24} color={colors.textPrimary} />
        </Pressable>
      ) : null}

      {/* B2: the 32px logomark, on the left of every app-bar. */}
      <HumbeeLogo height={32} />

      <View style={headerStyles.titles}>
        <Text variant="headerTitle" color={colors.textPrimary} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text variant="headerSubtitle" color={colors.textTertiary} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>

      {/* 40x40 tap target, radius 8, optically aligned with -8px on the right. No bell, ever. */}
      {onPressAccount ? (
        <Pressable
          onPress={onPressAccount}
          accessibilityRole="button"
          accessibilityLabel="My Profile"
          style={headerStyles.accountButton}
        >
          <Icon name="Account" size={24} color={colors.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  bar: {
    minHeight: 76,
    paddingBottom: spacing.m,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
  },
  titles: { flex: 1, minWidth: 0 },
  accountButton: {
    width: 40,
    height: 40,
    marginRight: -spacing.s,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * Scrollable screen body. `scroll={false}` for screens that manage their own list (FlashList)
 * — a virtualized list inside a ScrollView defeats the recycling that keeps a 2GB device smooth.
 */
export function Screen({
  children, header, padded = true, scroll = true, onRefresh, refreshing, contentStyle, footer,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  padded?: boolean;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
}) {
  /**
   * In the `scroll={false}` case the body MUST carry flex:1. A FlashList needs a bounded
   * parent; without it the wrapper collapses to its content height (zero for a virtualized
   * list) and the screen renders blank — which silently emptied Rewards, My Demands and
   * Inventory Allocated. In the scrolling case flex:1 would instead fight the ScrollView's
   * content sizing, so it is applied only where it belongs.
   */
  const insets = useSafeAreaInsets();
  const body = (
    <View style={[scroll ? null : styles.fill, padded ? styles.padded : null, contentStyle]}>
      {children}
    </View>
  );
  return (
    <View style={styles.screen}>
      {header}
      <OfflineBanner />
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          /**
           * Clear the gesture bar / nav buttons. Without it the last element of a scrolling
           * screen — usually the primary button — ends flush against the system bar and is
           * partly under it. `contentContainerStyle`, not `style`, so it pads the CONTENT and
           * does not shrink the scrollable area.
           */
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.s }}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary100} /> : undefined
          }
        >
          {body}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{body}</View>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  fill: { flex: 1 },
  padded: { padding: spacing.m },
});
