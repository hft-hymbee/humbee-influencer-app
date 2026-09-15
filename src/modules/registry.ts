/**
 * THE ONLY PLACE A MODULE IS NAMED.
 *
 * The bottom nav, the route tree and Home's quick links are all DERIVED from this list — not
 * one of them contains a literal module array. That is the difference between adding a module
 * and editing seven files (docs/09-saas-and-module-architecture.md §3).
 */
import type { ModuleManifest } from './types';
import { can, type Entitlements } from '../domain/entitlements';

export const ALL_MODULES: readonly ModuleManifest[] = [
  {
    id: 'home',
    entitlement: null, // core: always present, but ADAPTS to what else is entitled (doc 09 §6)
    nav: { label: 'Home', icon: { active: 'HomeFilled', inactive: 'HomeOutlined' }, order: 10 },
    route: 'Home',
  },
  {
    id: 'leaderboard',
    entitlement: 'leaderboard',
    nav: { label: 'Ranking', icon: { active: 'PerformanceFilled', inactive: 'PerformanceOutlined' }, order: 20 },
    route: 'Leaderboard',
    deepLinks: ['humbee://leaderboard'],
  },
  {
    id: 'demand',
    entitlement: 'demand',
    nav: { label: 'Demand', icon: { active: 'ShoppingCartFilled', inactive: 'ShoppingCartOutlined' }, order: 30 },
    route: 'Demand',
    deepLinks: ['humbee://demands'],
  },
  {
    id: 'allocation',
    entitlement: 'allocation',
    nav: { label: 'Inventory', icon: { active: 'InventoryFilled', inactive: 'InventoryOutlined' }, order: 40 },
    route: 'Allocation',
  },
  {
    id: 'rewards',
    entitlement: 'rewards',
    nav: { label: 'Rewards', icon: { active: 'RewardsFilled', inactive: 'RewardsOutlined' }, order: 50 },
    route: 'Rewards',
    deepLinks: ['humbee://rewards'],
  },
  // No nav entry: reached from Profile. The handoff deliberately excludes a header bell.
  { id: 'notifications', entitlement: 'notifications', route: 'Notifications' },
  // Core: reached from the header person icon, not the bottom nav.
  { id: 'profile', entitlement: null, route: 'Profile' },
];

/** Resolve what this tenant actually has. Unknown ids are ignored, never crash. */
export function resolveModules(entitlements: Entitlements): ModuleManifest[] {
  return ALL_MODULES
    .filter(m => m.entitlement === null || can(entitlements, m.entitlement))
    .slice()
    .sort((a, b) => (a.nav?.order ?? Number.MAX_SAFE_INTEGER) - (b.nav?.order ?? Number.MAX_SAFE_INTEGER));
}

/** The bottom nav is DERIVED, never a hardcoded array. */
export function buildNav(modules: ModuleManifest[]): ModuleManifest[] {
  return modules.filter(m => m.nav);
}
