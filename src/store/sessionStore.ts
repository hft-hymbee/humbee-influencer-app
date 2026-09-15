/**
 * Session — docs/10 §6.3.
 *
 * V2 has no refresh token and no refresh endpoint, so the bearer token IS the session: it is
 * persisted in the Keychain and read back on cold start. A 401 is therefore terminal — the
 * client hands it here through `setUnauthorizedHandler`, and the only correct response is to
 * clear the session and return to Login.
 */
import { create } from 'zustand';
import type { Entitlements } from '../domain/entitlements';
import { DEFAULT_ENTITLEMENTS } from '../domain/entitlements';
import type { ThemeOverride } from '../theme/ThemeProvider';
import { setAccessToken } from '../api/client';
import { secureStore } from './secureStore';
import { clearSessionScopedStorage } from './storage';

export type SessionStatus = 'booting' | 'unauthenticated' | 'authenticated';

type SessionState = {
  status: SessionStatus;
  influencerName: string | null;
  /** Commercial, from the server. The client renders; the API enforces. */
  entitlements: Entitlements;
  tenantId: string | null;
  themeOverride: ThemeOverride | null;
  featureFlags: Record<string, boolean>;

  setBooted: (authenticated: boolean) => void;
  signIn: (args: { token: string; name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  applyConfig: (args: {
    entitlements?: string[]; tenantId?: string | null;
    themeOverride?: ThemeOverride | null; featureFlags?: Record<string, boolean>;
  }) => void;
};

export const useSessionStore = create<SessionState>(set => ({
  status: 'booting',
  influencerName: null,
  entitlements: DEFAULT_ENTITLEMENTS,
  tenantId: null,
  themeOverride: null,
  featureFlags: {},

  setBooted: authenticated =>
    set({ status: authenticated ? 'authenticated' : 'unauthenticated' }),

  signIn: async ({ token, name }) => {
    setAccessToken(token);
    await secureStore.setToken(token);
    set({ status: 'authenticated', influencerName: name ?? null });
  },

  signOut: async () => {
    setAccessToken(null);
    await secureStore.clear();
    clearSessionScopedStorage();
    set({ status: 'unauthenticated', influencerName: null });
  },

  applyConfig: ({ entitlements, tenantId, themeOverride, featureFlags }) =>
    set(state => ({
      entitlements: entitlements ? { modules: entitlements } : state.entitlements,
      tenantId: tenantId ?? state.tenantId,
      themeOverride: themeOverride ?? state.themeOverride,
      featureFlags: featureFlags ?? state.featureFlags,
    })),
}));
