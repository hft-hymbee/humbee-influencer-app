/**
 * Four OTP boxes — docs/design-spec/02-login-otp.md.
 *
 * Auto-advance forward on entry, backspace on an empty box moves back. All four rings turn
 * error colour on a wrong code, and the boxes clear with focus returning to box 1.
 * `autoComplete="one-time-code"` + `textContentType` give SMS autofill; without it field users
 * switch apps to read the code.
 */
import React, { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export type OtpInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  error?: boolean;
  editable?: boolean;
  length?: number;
};

export function OtpInput({ value, onChange, error, editable = true, length = 4 }: OtpInputProps) {
  const refs = useRef<Array<React.ComponentRef<typeof TextInput> | null>>([]);

  const setDigit = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !value[index] && index > 0) {
      const next = [...value];
      next[index - 1] = '';
      onChange(next);
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={r => { refs.current[i] = r; }}
          value={value[i] ?? ''}
          onChangeText={t => setDigit(i, t)}
          onKeyPress={e => onKeyPress(i, e.nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={1}
          editable={editable}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          accessibilityLabel={`OTP digit ${i + 1}`}
          style={[
            typography.otpDigit,
            styles.box,
            // C10: empty = 1px neutral ring, FILLED = 2px chestnut, error = 2px error.
            error ? styles.boxError : value[i] ? styles.boxFilled : styles.boxEmpty,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.s12 },
  box: {
    flex: 1,
    height: 60,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  boxEmpty: { borderWidth: 1, borderColor: colors.border },
  boxFilled: { borderWidth: 2, borderColor: colors.primary100 },
  boxError: { borderWidth: 2, borderColor: colors.error100 },
});
