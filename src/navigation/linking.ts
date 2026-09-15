/**
 * Deep links — a hand-written config, which is the RN CLI's cost versus file-based routing
 * (docs/01-architecture.md ADR-003).
 *
 * Generated FROM the module manifests so it cannot drift from the routes.
 */
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';
import { ALL_MODULES } from '../modules/registry';

const screens = Object.fromEntries(
  ALL_MODULES.filter(m => m.deepLinks?.length).map(m => [
    m.route,
    (m.deepLinks![0].split('://')[1] ?? m.route.toLowerCase()),
  ]),
);

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['humbee://'],
  config: {
    screens: {
      Tabs: { screens: screens as Record<string, string> },
      Profile: 'profile',
      Notifications: 'notifications',
    },
  },
};
