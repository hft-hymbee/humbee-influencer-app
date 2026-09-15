/**
 * Screen 04 — My Profile. docs/design-spec/04-screens/04-profile.md
 *
 * `rows` is SERVER-DRIVEN — we render what the server sends, we do not build the list here.
 * V2 drops the State row; trade is intentionally not shown as a field.
 *
 * DELETION CHANGED IN V2 (§7). It is no longer `DELETE /me` behind a second OTP: it is the
 * platform's own `GET /users/can-delete-account` + `DELETE /users`, and there is no OTP step.
 * `can-delete-account` runs real business checks and CAN refuse, so it is asked first and its
 * answer decides whether the button is offered at all — the client never assumes.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { colors, spacing } from '../../theme';
import {
  Button, Card, ConfirmDialog, Disclosure, HexMark, ListContainer,
  Screen, ScreenHeader, SkeletonBlock, Text,
} from '../../components';
import { deletionRefusalCopy, useCanDeleteAccountQuery, useDeleteAccount, useLogout, useMeQuery } from '../../api';
import { useSessionStore } from '../../store/sessionStore';

export function ProfileScreen({ onBack, onSignedOut }: { onBack: () => void; onSignedOut: () => void }) {
  const { data, isPending } = useMeQuery();
  const canDelete = useCanDeleteAccountQuery();
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();
  const signOut = useSessionStore(s => s.signOut);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doLogout = async () => {
    // Best-effort server call; the local session is cleared regardless so the user is never
    // stuck. V2's /auth/logout takes NO body and revokes this session only.
    try { await logout.mutateAsync(); } catch { /* ignore */ }
    await signOut();
    setConfirmLogout(false);
    onSignedOut();
  };

  const doDelete = async () => {
    setError(null);
    try {
      await deleteAccount.mutateAsync();
      setConfirmDelete(false);
      await signOut();
      onSignedOut();
    } catch (e) {
      setConfirmDelete(false);
      setError(e instanceof Error ? deletionRefusalCopy(e.message) : 'Could not delete the account.');
    }
  };

  const header = <ScreenHeader title="My Profile" subtitle="Account and login details" onBack={onBack} />;

  if (isPending || !data) {
    return (
      <Screen header={header}>
        <View style={{ gap: spacing.m }}>
          <SkeletonBlock height={180} />
          <SkeletonBlock height={44} />
          <SkeletonBlock height={44} />
        </View>
      </Screen>
    );
  }

  const { influencer, rows } = data;

  return (
    <Screen header={header}>
      <View style={{ gap: spacing.m }}>
        {/* Identity card */}
        <Card padding={16}>
          <View style={{ alignItems: 'center', gap: spacing.s10, paddingVertical: spacing.s }}>
            <HexMark
              size={72}
              backgroundColor={colors.primary100}
              label={influencer.initials}
              labelColor={colors.white}
              labelVariant="screenTitle"
            />
            <Text variant="sectionHeading">{influencer.name}</Text>
            <Text variant="body" color={colors.textSecondary}>{influencer.mobile_display}</Text>
          </View>
        </Card>

        {/* Server-driven detail rows */}
        <ListContainer>
          {rows.map(row => (
            <View
              key={row.key}
              style={{
                minHeight: 48, paddingHorizontal: spacing.s14, paddingVertical: spacing.s10,
                flexDirection: 'row', alignItems: 'center', gap: spacing.s12,
              }}
            >
              <Text variant="body" color={colors.textTertiary} style={{ flex: 1 }}>{row.key}</Text>
              <Text variant="rowTitle">{row.value}</Text>
            </View>
          ))}
        </ListContainer>

        {/* Actions */}
        <View style={{ gap: spacing.s }}>
          <Button label="Log Out" variant="outline" icon="LogoutOutlined" onPress={() => setConfirmLogout(true)} fullWidth />

          {/* C20 — a bare centred "Advanced" row, no card around it. Closed on every visit.
              Offered ONLY when the platform says this account can actually be deleted. */}
          {canDelete.data?.can_delete ? (
            <Disclosure title="Advanced">
              <View style={{ gap: spacing.s, paddingTop: spacing.s }}>
                <Button label="Delete Account" variant="danger" icon="Delete" onPress={() => setConfirmDelete(true)} fullWidth />
                <Text variant="meta" color={colors.textTertiary} align="center">
                  Deleting your account removes your points and gift history permanently.
                </Text>
              </View>
            </Disclosure>
          ) : null}

          {error ? <Text variant="body" color={colors.error100} align="center">{error}</Text> : null}
        </View>
      </View>

      <ConfirmDialog
        visible={confirmLogout}
        title="Log out of HUMBEE?"
        confirmLabel="Log Out"
        loading={logout.isPending}
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />
      <ConfirmDialog
        visible={confirmDelete}
        title="Delete your account?"
        body="This removes your points and gift history permanently. This cannot be undone."
        confirmLabel="Delete Account"
        destructive
        loading={deleteAccount.isPending}
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  );
}
