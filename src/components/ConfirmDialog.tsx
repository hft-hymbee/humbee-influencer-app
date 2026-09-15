/**
 * Blocking confirmation. Used for Log Out ("Log out of HUMBEE?") and, with a stronger
 * treatment, Delete Account.
 *
 * A React Modal rather than Alert.alert so the copy and the button order match the design and
 * are localisable.
 */
import React from 'react';
import { Modal, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Text } from './Text';
import { Button } from './Button';

export function ConfirmDialog({
  visible, title, body, confirmLabel, cancelLabel = 'Cancel', destructive, loading, onConfirm, onCancel,
}: {
  visible: boolean; title: string; body?: string; confirmLabel: string; cancelLabel?: string;
  destructive?: boolean; loading?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.s24 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.l, padding: spacing.s20, gap: spacing.m }}>
          <View style={{ gap: spacing.s6 }}>
            <Text variant="sectionHeading">{title}</Text>
            {body ? <Text variant="bodyLarge" color={colors.textTertiary}>{body}</Text> : null}
          </View>
          <View style={{ gap: spacing.s }}>
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={loading}
              fullWidth
            />
            <Button label={cancelLabel} variant="text" onPress={onCancel} fullWidth />
          </View>
        </View>
      </View>
    </Modal>
  );
}
