/**
 * Required on every data screen. Reads are served stale-with-indicator, so the user is told the
 * data is cached rather than being shown an error — offline-first is a PRD requirement.
 *
 * It no longer drains a demand outbox: V2 capture is ONLINE-ONLY (the body carries no
 * `client_ref`, so a replay could not be made safe, and `feature_flags.offline_demand_queue` is
 * false). READS stay offline-first through the persisted query cache; WRITES now require a
 * connection, and the capture screen says so by failing in place with its selections intact.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { colors, spacing } from '../theme';
import { Text } from './Text';
import { Icon } from './Icon';

export function useIsOffline() {
  const [offline, setOffline] = useState(false);
  useEffect(() => NetInfo.addEventListener(s => setOffline(!(s.isConnected ?? true))), []);
  return offline;
}

export function OfflineBanner() {
  const offline = useIsOffline();
  if (!offline) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        backgroundColor: colors.sunken,
      }}
    >
      <Icon name="InfoOutlined" size={16} color={colors.textSecondary} />
      <Text variant="meta" color={colors.textSecondary} style={{ flex: 1 }}>
        You are offline. Showing your last saved data.
      </Text>
    </View>
  );
}
