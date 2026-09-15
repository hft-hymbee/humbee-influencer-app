/**
 * The bottom nav, BUILT FROM the module registry.
 *
 * Absent on screens 00, 01, 02 and 07 — those live outside this navigator.
 * The Demand tab covers screens 06, 07 and 08 (one module, three screens).
 *
 * IMPORTANT: every screen component here is defined at MODULE level and looked up from a
 * frozen map. Building them inside the render (`component={() => <X/>}`) hands React Navigation
 * a new component type on every render, which remounts the tab and throws away its scroll
 * position and query state.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing, typography } from '../theme';
import { Icon } from '../components';
import { buildNav, resolveModules } from '../modules/registry';
import { useSessionStore } from '../store/sessionStore';
import type { RootStackParamList, TabParamList } from './types';

import { HomeScreen } from '../views/home/HomeScreen';
import { LeaderboardScreen } from '../views/leaderboard/LeaderboardScreen';
import { DemandTabScreen } from '../views/demand/DemandTabScreen';
import { AllocationScreen } from '../views/allocation/AllocationScreen';
import { RewardsScreen } from '../views/rewards/RewardsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

/** Profile is reached from the header person icon on every tab, so each screen needs it. */
function useOpenProfile() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return React.useCallback(() => nav.navigate('Profile'), [nav]);
}

function HomeTab() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const openProfile = useOpenProfile();
  const entitlements = useSessionStore(s => s.entitlements);
  const mounted = React.useMemo(
    () => new Set(buildNav(resolveModules(entitlements)).map(m => m.route)),
    [entitlements],
  );

  const onNavigate = React.useCallback(
    (route: string) => {
      // A link to an unmounted module must DEGRADE, not throw (doc 09 §5 rule 6).
      if (mounted.has(route)) nav.navigate('Tabs', { screen: route } as never);
    },
    [mounted, nav],
  );

  return <HomeScreen onOpenProfile={openProfile} onNavigate={onNavigate} />;
}

function LeaderboardTab() { return <LeaderboardScreen onOpenProfile={useOpenProfile()} />; }
function DemandTab()      { return <DemandTabScreen onOpenProfile={useOpenProfile()} />; }
function AllocationTab()  { return <AllocationScreen onOpenProfile={useOpenProfile()} />; }
function RewardsTab()     { return <RewardsScreen onOpenProfile={useOpenProfile()} />; }

/** Route name → screen. Adding a module adds one entry here and one manifest. */
const SCREENS: Record<string, React.ComponentType> = {
  Home: HomeTab,
  Leaderboard: LeaderboardTab,
  Demand: DemandTab,
  Allocation: AllocationTab,
  Rewards: RewardsTab,
};

/**
 * A FIXED height here overrode React Navigation's own safe-area handling, so Android's
 * gesture-navigation pill drew straight through the tab labels. The bar must grow by the
 * bottom inset instead — 60dp of content plus whatever the system reserves.
 */
const TAB_CONTENT_HEIGHT = 60;

/**
 * B3: the ACTIVE item sits on a primary-10 pill, radius 8 — the navigator has no option for
 * that, so each item is wrapped. Colour and icon variant still come from screenOptions.
 */
function NavItemButton({
  children, style: _style, href: _href, pressColor: _pressColor, pressOpacity: _pressOpacity, ...rest
}: BottomTabBarButtonProps) {
  const focused = rest.accessibilityState?.selected ?? false;
  return (
    <Pressable {...rest} style={navStyles.item}>
      <View style={[navStyles.pill, focused ? navStyles.pillActive : null]}>{children}</View>
    </Pressable>
  );
}

const navStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'stretch', justifyContent: 'center' },
  pill: {
    flex: 1,
    borderRadius: radius.m,
    paddingVertical: spacing.s6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  pillActive: { backgroundColor: colors.primary10 },
});

export function AppTabs() {
  const insets = useSafeAreaInsets();
  const entitlements = useSessionStore(s => s.entitlements);
  const navModules = React.useMemo(
    () => buildNav(resolveModules(entitlements)),
    [entitlements],
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary100,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: typography.navLabel,
        tabBarButton: NavItemButton,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          height: TAB_CONTENT_HEIGHT + insets.bottom,
          // B3: 8px around the bar; the bottom inset carries the home-indicator gap.
          paddingTop: spacing.s,
          paddingHorizontal: spacing.s,
          paddingBottom: insets.bottom || spacing.s,
        },
      }}
    >
      {navModules.map(m => {
        const component = SCREENS[m.route];
        // An unknown route from the registry must not crash the shell.
        if (!component) return null;
        return (
          <Tab.Screen
            key={m.id}
            name={m.route as keyof TabParamList}
            component={component}
            options={{
              tabBarLabel: m.nav!.label,
              tabBarIcon: ({ focused, color }) => (
                <Icon name={focused ? m.nav!.icon.active : m.nav!.icon.inactive} size={24} color={color} />
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
