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
import { resetUserStateOnSignOut } from './resetOnSignOut';

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

  /**
   * The cache is cleared on the way IN as well as on the way out, and that is not redundant:
   * sign-out is a sequence that can be interrupted — a force-kill or a crash mid-logout leaves
   * the previous user's data on disk, where the next cold start hydrates it straight back into
   * memory before anyone has logged in. Clearing here means a fresh login always starts empty,
   * whatever happened last time. It costs one refetch of `/config`.
   */
  signIn: async ({ token, name }) => {
    resetUserStateOnSignOut();
    setAccessToken(token);
    await secureStore.setToken(token);
    set({ status: 'authenticated', influencerName: name ?? null });
  },

  /**
   * Sign-out is a TEARDOWN, not a status flip. The token goes first so nothing in flight can
   * authenticate with it, then every trace of the user is dropped — query cache, stores, disk
   * (`resetUserStateOnSignOut`) — and this store's own server-derived fields go back to their
   * defaults.
   *
   * `entitlements`, `tenantId`, `themeOverride` and `featureFlags` all arrive from `/config`
   * for THIS user. Leaving them would mean the next person is rendered against the last one's
   * commercial state: modules they may not have paid for, or another tenant's theme.
   */
  signOut: async () => {
    setAccessToken(null);
    await secureStore.clear();
    resetUserStateOnSignOut();
    set({
      status: 'unauthenticated',
      influencerName: null,
      entitlements: DEFAULT_ENTITLEMENTS,
      tenantId: null,
      themeOverride: null,
      featureFlags: {},
    });
  },

  applyConfig: ({ entitlements, tenantId, themeOverride, featureFlags }) =>
    set(state => ({
      entitlements: entitlements ? { modules: entitlements } : state.entitlements,
      tenantId: tenantId ?? state.tenantId,
      themeOverride: themeOverride ?? state.themeOverride,
      featureFlags: featureFlags ?? state.featureFlags,
    })),
}));
