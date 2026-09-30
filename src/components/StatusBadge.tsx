/**
 * Status chip. Colour is fixed by MEANING, not aesthetics (domain/status.ts).
 *
 * An unknown status renders neutrally with its raw label rather than crashing or going blank —
 * new statuses reach the server before the app knows them.
 *
 * Never colour alone: the label always renders.
 */
import React from 'react';
import { View } from 'react-native';
import { radius, spacing } from '../theme';
import { statusStyle } from '../domain/status';
import { Text } from './Text';

export function StatusBadge({
  status, label, height = 24, styleFor = statusStyle,
}: {
  /** The STABLE key. Colour is chosen from this, never from the label. */
  status: string;
  /** Server-localised display copy, when it differs from the key (demand fulfilment). */
  label?: string;
  height?: number;
  /** Which status machine this belongs to — gifts by default (domain/status.ts). */
  styleFor?: (status: string) => { bg: string; fg: string };
}) {
  const s = styleFor(status);
  const text = label ?? status;
  return (
    <View
      accessibilityLabel={`Status: ${text}`}
      style={{
        height,
        // C5: 8px at the 22px height (Home's list), 10px at 24px (cards).
        paddingHorizontal: height <= 22 ? spacing.s : spacing.s10,
        borderRadius: radius.pill,
        backgroundColor: s.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="metaBold" color={s.fg} numberOfLines={1}>{text}</Text>
    </View>
  );
}
