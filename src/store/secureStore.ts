/**
 * Secure token storage — Keychain (iOS) / EncryptedSharedPreferences-backed Keystore (Android).
 *
 * docs/10 §8 specifies expo-secure-store; on a pure RN CLI project without expo-modules we use
 * react-native-keychain, which is the equivalent. This file is the ONLY place that changes if
 * the team later runs `install-expo-modules` and switches — that is why it is an interface.
 *
 * WHAT V2 CHANGED: there is no refresh token and no refresh endpoint. The bearer token from
 * `POST /auth/otp/verify` IS the session, so it is what gets persisted here — without that, a
 * cold start would mean logging in again every launch. It still never goes to MMKV, which is
 * not encrypted and is not a Keychain substitute.
 */
import * as Keychain from 'react-native-keychain';

const SERVICE = 'in.humbee.influencer.token';

export const secureStore = {
  async setToken(token: string): Promise<void> {
    await Keychain.setGenericPassword('token', token, { service: SERVICE });
  },
  async getToken(): Promise<string | null> {
    try {
      const creds = await Keychain.getGenericPassword({ service: SERVICE });
      return creds ? creds.password : null;
    } catch {
      return null;
    }
  },
  async clear(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: SERVICE });
    } catch {
      // Nothing stored is not an error.
    }
  },
};
