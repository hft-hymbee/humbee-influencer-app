/**
 * Root navigation — switches on language choice, then session state.
 *
 * On cold start with a valid token, land on Home WITHOUT showing login.
 * On verify, REPLACE the auth stack — back must never return to login.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { linking } from './linking';
import type { RootStackParamList } from './types';
import { AppTabs } from './AppTabs';
import { LanguageScreen, getStoredLanguage } from '../views/language/LanguageScreen';
import { LoginScreen } from '../views/auth/LoginScreen';
import { OtpScreen } from '../views/auth/OtpScreen';
import { ProfileScreen } from '../views/profile/ProfileScreen';
import { NotificationsScreen } from '../views/notifications/NotificationsScreen';
import { DemandCapturedScreen } from '../views/demand/DemandCapturedScreen';
import { useSessionStore } from '../store/sessionStore';
import { useDemandDraftStore } from '../store/demandDraftStore';
import { restoreSession, setUnauthorizedHandler } from '../api/client';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const status = useSessionStore(s => s.status);
  const setBooted = useSessionStore(s => s.setBooted);
  const signIn = useSessionStore(s => s.signIn);
  const signOut = useSessionStore(s => s.signOut);
  const resetDraft = useDemandDraftStore(s => s.reset);
  const setDemandTab = useDemandDraftStore(s => s.setTab);

  const [language, setLanguage] = useState<string | null>(getStoredLanguage());

  /**
   * Cold-start route guard. V2 has no refresh token: the stored bearer token IS the session, so
   * it is read back into the client and trusted until a call 401s.
   */
  useEffect(() => {
    (async () => {
      setBooted(await restoreSession());
    })();
  }, [setBooted]);

  /**
   * A 401 is TERMINAL in V2 — there is no refresh endpoint to repair it in flight — so the one
   * correct response is to clear the session, which swaps this stack back to Login.
   */
  useEffect(() => {
    setUnauthorizedHandler(() => { void signOut(); });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  // The language chooser appears BEFORE login, and only once.
  if (!language) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <LanguageScreen onDone={setLanguage} />
      </View>
    );
  }

  if (status === 'booting') return <View style={{ flex: 1, backgroundColor: colors.surface }} />;

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'authenticated' ? (
          <>
            <Stack.Screen name="Tabs" component={AppTabs} />
            <Stack.Screen name="Profile">
              {({ navigation }) => (
                <ProfileScreen
                  onBack={() => navigation.goBack()}
                  onSignedOut={() => { /* the stack swaps automatically on status change */ }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Notifications">
              {({ navigation }) => <NotificationsScreen onBack={() => navigation.goBack()} />}
            </Stack.Screen>
            <Stack.Screen name="DemandCaptured" options={{ gestureEnabled: false }}>
              {({ navigation, route }) => (
                <DemandCapturedScreen
                  result={route.params?.result ?? null}
                  // Reset clears the draft AND returns the module to its "New Demand" tab.
                  onCaptureAnother={() => { resetDraft(); navigation.goBack(); }}
                  // Switch the Demand module to its My Demands tab, then pop back to it.
                  onViewDemands={() => { setDemandTab('mine'); navigation.goBack(); }}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Login">
              {({ navigation }) => (
                <LoginScreen
                  onOtpSent={({ mobile, request }) =>
                    // Named explicitly, NOT spread: `navigate(route, obj)` accepts the params
                    // object loosely, so spreading hides a field-name mismatch from tsc.
                    navigation.navigate('Otp', { mobile, request })
                  }
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Otp">
              {({ navigation, route }) => (
                <OtpScreen
                  mobile={route.params.mobile}
                  request={route.params.request}
                  onBack={() => navigation.goBack()}
                  onVerified={async ({ token }) => {
                    // Replaces the auth stack by flipping session status.
                    await signIn({ token });
                  }}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
