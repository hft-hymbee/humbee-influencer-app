/**
 * Screen 11 — Notifications. docs/08-screen-inventory.md §3.
 *
 * TWO OPEN ITEMS, both tracked in docs/06-inputs-needed.md:
 *  1. CONTRACT GAP — V2 has no notification list, read-receipt or preference endpoints, AND no
 *     device-token endpoint either: `PUT /me/device` was removed, so nothing can even register
 *     an FCM token. Until they exist this screen cannot be wired to anything but this placeholder.
 *  2. DESIGN PENDING — no handoff spec, and the handoff deliberately EXCLUDES a header bell.
 *     That is why this screen is reached from Profile rather than from header chrome; do not
 *     add a bell to ScreenHeader to "fix" it.
 *
 * Deep links are the reason a notification is worth tapping:
 * humbee://leaderboard?mfr=…, humbee://demands, humbee://rewards?status=InShop
 */
import React from 'react';
import { View } from 'react-native';
import { colors, spacing } from '../../theme';
import { Card, EmptyState, Screen, ScreenHeader, Text } from '../../components';

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  return (
    <Screen header={<ScreenHeader title="Notifications" subtitle="Updates from HUMBEE" onBack={onBack} />}>
      <View style={{ gap: spacing.m }}>
        <EmptyState
          title="No notifications yet"
          body="Allocation, gift and Umang Utsav updates will appear here."
        />
        <Card padding={14}>
          <Text variant="meta" color={colors.textTertiary}>
            This screen is awaiting its API endpoints and its design. Push delivery is blocked on
            the same gap: there is no endpoint to register a device token against.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
