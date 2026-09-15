/**
 * Component C19. Must look DESIGNED, not like an error — offline-first means users meet these
 * often. The handoff's NoDataFound illustration is not in the bundle, so this uses the hex mark
 * as a neutral stand-in; swap in the illustration when it arrives.
 */
import React from 'react';
import { View } from 'react-native';
import { colors, spacing } from '../theme';
import { Text } from './Text';
import { HexMark } from './HexMark';
import { Icon } from './Icon';

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.l, gap: spacing.s12 }}>
      <HexMark size={72} backgroundColor={colors.sunken}>
        <Icon name="InventoryOutlined" size={28} color={colors.textTertiary} />
      </HexMark>
      <View style={{ gap: spacing.xs, alignItems: 'center' }}>
        <Text variant="rowTitle" color={colors.textPrimary} align="center">{title}</Text>
        {body ? <Text variant="bodyLarge" color={colors.textTertiary} align="center">{body}</Text> : null}
      </View>
    </View>
  );
}
