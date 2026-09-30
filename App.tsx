/**
 * App entry. docs/10-rn-cli-implementation-guide.md.
 *
 * Order matters here:
 *  1. `enableScreens` + `enableFreeze` before anything renders — freeze stops off-screen tabs
 *     re-rendering, which is a measurable win on a 2GB device.
 *  2. MMKV query-cache hydration is SYNCHRONOUS, so it completes before the first paint and a
 *     cold start with no network paints last-known data rather than an empty screen.
 *  3. ThemeProvider wraps everything so a tenant's brand is correct on the first frame.
 */
import React, { useEffect } from 'react';
import { AppState, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableFreeze, enableScreens } from 'react-native-screens';
import { QueryClientProvider } from '@tanstack/react-query';

import './src/i18n';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashGate } from './src/views/splash/SplashScreen';
import { hydrateQueryCache, persistQueryCache, queryClient } from './src/api/queryClient';
import { useSessionStore } from './src/store/sessionStore';
import { setStorageTenant } from './src/store/storage';
import { useConfigQuery } from './src/api';

enableScreens(true);
enableFreeze(true);
hydrateQueryCache();

/**
 * Applies GET /config: entitlements, tenant, theme, feature flags.
 *
 * A missing /config is NOT an empty entitlement set — the store's default keeps every core
 * module mounted, because an empty nav looks exactly like a broken app (doc 09 §4).
 */
function ConfigGate({ children }: { children: React.ReactNode }) {
  const { data } = useConfigQuery();
  const applyConfig = useSessionStore(s => s.applyConfig);
  const themeOverride = useSessionStore(s => s.themeOverride);

  useEffect(() => {
    if (!data) return;
    if (data.tenant?.id) setStorageTenant(data.tenant.id);
    applyConfig({
      entitlements: data.entitlements,
      tenantId: data.tenant?.id ?? null,
      themeOverride: data.theme?.colors
        ? { colors: data.theme.colors as never, logoUrl: data.tenant?.logo_url }
        : null,
      featureFlags: data.feature_flags,
    });
  }, [data, applyConfig]);

  return <ThemeProvider override={themeOverride}>{children}</ThemeProvider>;
}

export default function App() {
  // Persist the query cache when the app backgrounds — cheap, and it is what makes the next
  // cold start paint instantly.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') persistQueryCache();
    });
    return () => sub.remove();
  }, []);

  /**
   * The splash holds until the session has resolved as well as until its three seconds are up,
   * which is why it reads `status` here rather than owning a timer of its own. The navigator
   * renders UNDERNEATH it the whole time — that is what does the resolving.
   */
  const booting = useSessionStore(s => s.status) === 'booting';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ConfigGate>
            <StatusBar barStyle="dark-content" />
            <SplashGate booted={!booting}>
              <RootNavigator />
            </SplashGate>
          </ConfigGate>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
