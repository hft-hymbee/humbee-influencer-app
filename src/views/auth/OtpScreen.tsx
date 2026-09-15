/**
 * Screen 02 — Verify OTP. docs/design-spec/04-screens/02-login-otp.md
 *
 * The number is shown IN FULL and UNMASKED, exactly as entered. No masking, no +91 in that line.
 * "Wrong number ?" keeps the space before the question mark — that is the intended Indian
 * typographic convention, not a typo.
 *
 * The resend window and the OTP length come from the SERVER (`resend_after_seconds`,
 * `otp_length` on the OTP-request response). The design shows 4 boxes and 24s; never hardcode
 * either — an OTP provider policy change moves both.
 *
 * V2 dropped only `request_id`: verify is identified by the mobile number alone.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation, hitSlopFor, radius, spacing } from '../../theme';
import { Button, HumbeeLogo, Icon, OtpInput, Text } from '../../components';
import { formatCountdown } from '../../domain/format';
import { useRequestOtp, useVerifyOtp } from '../../api';
import { ApiError, ERROR_CODES } from '../../api/errors';
import type { OtpRequestResult } from '../../api/types';

export function OtpScreen({
  mobile, request, onBack, onVerified,
}: {
  mobile: string;
  /** The OTP-request response: the server owns the length and the resend window. */
  request: OtpRequestResult;
  onBack: () => void;
  onVerified: (args: { token: string }) => void;
}) {
  const insets = useSafeAreaInsets();
  const length = request.otp_length;
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(request.resend_after_seconds);

  const verify = useVerifyOtp();
  const resend = useRequestOtp();

  const otp = useMemo(() => digits.join(''), [digits]);
  const complete = otp.length === length && digits.every(Boolean);

  // One timer per send; a resend restarts it.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const clearBoxes = () => setDigits(Array(length).fill(''));

  const submit = async () => {
    setError(null);
    try {
      const result = await verify.mutateAsync({ mobile, otp });
      onVerified(result);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        // Wrong OTP: rings go error, boxes clear, focus returns to box 1.
        if (e.code === ERROR_CODES.OTP_INVALID) clearBoxes();
        // Expired: resend becomes active immediately.
        if (e.code === ERROR_CODES.OTP_EXPIRED) { clearBoxes(); setSecondsLeft(0); }
      } else {
        setError('We could not verify that code. Try again.');
      }
    }
  };

  const doResend = async () => {
    setError(null);
    clearBoxes();
    try {
      const next = await resend.mutateAsync({ mobile });
      setSecondsLeft(next.resend_after_seconds);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not resend the OTP.');
    }
  };

  const canResend = secondsLeft <= 0 && !resend.isPending;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{
        flexGrow: 1, padding: spacing.s24, paddingTop: insets.top + spacing.m, gap: spacing.l,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: spacing.s20, alignItems: 'flex-start' }}>
        <Pressable
          onPress={onBack}
          hitSlop={hitSlopFor(40)}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ width: 40, height: 40, borderRadius: radius.m, marginLeft: -spacing.s, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="ArrowBack" size={24} color={colors.textPrimary} />
        </Pressable>
        {/* The supplied lock-up, 36px tall — not the word set in type. */}
        <HumbeeLogo height={36} variant="full" />
        <View style={{ gap: spacing.xs }}>
          <Text variant="screenTitle">Verify OTP</Text>
          {/* Unmasked, exactly as entered. */}
          <Text variant="bodyLarge" color={colors.textTertiary}>
            {`Enter the ${length} digit OTP sent to ${mobile}`}
          </Text>
        </View>
      </View>

      <View
        style={[
          {
            gap: spacing.s24, padding: spacing.s20, borderRadius: radius.l,
            backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
          },
          elevation.e2,
        ]}
      >
        <OtpInput
          value={digits}
          onChange={next => { setDigits(next); setError(null); }}
          error={!!error}
          editable={!verify.isPending}
          length={length}
        />

        {error ? <Text variant="body" color={colors.error100}>{error}</Text> : null}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="body" color={colors.textTertiary}>
            {secondsLeft > 0 ? `Resend OTP in ${formatCountdown(secondsLeft)}` : 'You can resend the OTP'}
          </Text>
          <Pressable onPress={canResend ? doResend : undefined} disabled={!canResend} hitSlop={hitSlopFor(20)}>
            <Text variant="bodyBold" color={canResend ? colors.primary100 : '#B3B3B3'}>Resend OTP</Text>
          </Pressable>
        </View>

        <Button
          label="Verify & Log In"
          onPress={submit}
          disabled={!complete}
          loading={verify.isPending}
          fullWidth
        />
      </View>

      {/* Footer pinned to the bottom via marginTop:auto, as designed. */}
      <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, paddingBottom: insets.bottom }}>
        <Text variant="body" color={colors.textTertiary}>Wrong number ?</Text>
        <Pressable onPress={onBack} hitSlop={hitSlopFor(20)}>
          <Text variant="bodyBold" color={colors.primary100}>Change</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
