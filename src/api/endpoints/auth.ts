/** Screens 01, 02 — docs/design-spec/01-login-mobile.md, 02-login-otp.md */
import { useMutation } from '@tanstack/react-query';
import { api } from '../client';
import { encryptField } from '../crypto';
import type { LogoutResult, OtpRequestResult, OtpVerifyResult } from '../types';

/**
 * `mobile_number` is sent RSA-ENCRYPTED, not as digits — the server decrypts it inside DTO
 * validation (see api/crypto.ts). Plain digits fail with an unhelpful generic message.
 *
 * Still: NEVER prepend +91. The backend owns country context, and the value inside the
 * ciphertext is the raw 10-digit string.
 *
 * V2 dropped `purpose`: there is no ACCOUNT_DELETE OTP any more, because deletion moved to the
 * platform's own flow (V2 §7).
 */
export function useRequestOtp() {
  return useMutation({
    mutationFn: (vars: { mobile: string }) =>
      api.post<OtpRequestResult>('/auth/otp/request', {
        mobile_number: encryptField(vars.mobile),
      }),
  });
}

/**
 * Both fields are encrypted. No `request_id` in V2 — the mobile number identifies the challenge.
 */
export function useVerifyOtp() {
  return useMutation({
    mutationFn: (vars: { mobile: string; otp: string }) =>
      api.post<OtpVerifyResult>('/auth/otp/verify', {
        mobile_number: encryptField(vars.mobile),
        otp: encryptField(vars.otp),
      }),
  });
}

/**
 * NO REQUEST BODY in V2. `all_devices` is gone: this revokes the calling session only, which
 * the bearer token names. Sweeping every session is an account-deletion action, not a logout one.
 */
export function useLogout() {
  return useMutation({ mutationFn: () => api.post<LogoutResult>('/auth/logout') });
}
