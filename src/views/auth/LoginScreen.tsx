/**
 * Screen 01 — Login: mobile number. docs/design-spec/04-screens/01-login-mobile.md
 *
 * NO SIGN-UP PATH ANYWHERE. No "Create account", no country-code selector, no terms checkbox,
 * no "Need help?" line. Verified by inspection every release.
 */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation, radius, spacing } from '../../theme';
import { Button, HumbeeLogo, Input, Text } from '../../components';
import { normaliseMobile } from '../../domain/format';
import { useRequestOtp } from '../../api';
import { ApiError, ERROR_CODES } from '../../api/errors';

import type { OtpRequestResult } from '../../api/types';

export function LoginScreen({
  onOtpSent,
}: { onOtpSent: (args: { mobile: string; request: OtpRequestResult }) => void }) {
  const insets = useSafeAreaInsets();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const requestOtp = useRequestOtp();

  const valid = mobile.length === 10;

  const submit = async () => {
    setError(null);
    try {
      // No request_id in V2 — the mobile number identifies the challenge on verify. The
      // response still carries the OTP length and the resend window, so it is handed on.
      const request = await requestOtp.mutateAsync({ mobile });
      onOtpSent({ mobile, request });
    } catch (e) {
      // The server message is display-ready in the caller's locale; prefer it.
      // We branch on `code`, never on the message text.
      if (e instanceof ApiError && e.code === ERROR_CODES.INFLUENCER_NOT_REGISTERED) {
        setError(e.message);
      } else if (e instanceof ApiError) {
        setError(e.message || 'We could not send the OTP. Try again.');
      } else {
        setError('We could not send the OTP. Try again.');
      }
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{
        flexGrow: 1, padding: spacing.s24, paddingTop: insets.top + spacing.s24, gap: spacing.l,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Brand block */}
      <View style={{ gap: spacing.s24, alignItems: 'flex-start', paddingTop: spacing.m }}>
        {/* The supplied lock-up, 36px tall — not the word set in type. */}
        <HumbeeLogo height={36} variant="full" />
        <View style={{ gap: spacing.xs }}>
          <Text variant="screenTitle">Log In</Text>
          <Text variant="bodyLarge" color={colors.textTertiary}>
            Log in with the registered mobile number
          </Text>
        </View>
      </View>

      {/* Form panel. The design's backdrop-filter blur has no RN equivalent; a solid surface
          with the same ring and elevation is the specified approximation. */}
      <View
        style={[
          {
            gap: spacing.s24, padding: spacing.s20, borderRadius: radius.l,
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
          },
          elevation.e2,
        ]}
      >
        <Input
          label="Enter Mobile Number"
          placeholder="10 digit mobile number"
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={10}
          value={mobile}
          onChangeText={t => { setMobile(normaliseMobile(t)); setError(null); }}
          error={error}
          autoFocus
        />
        <Button
          label="Get OTP"
          onPress={submit}
          disabled={!valid}
          loading={requestOtp.isPending}
          fullWidth
        />
      </View>
    </ScrollView>
  );
}
