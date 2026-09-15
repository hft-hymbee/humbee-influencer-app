/**
 * Module entitlements — docs/09-saas-and-module-architecture.md §1, §3.
 *
 * Entitlements are COMMERCIAL and arrive from the server (GET /config or a token claim). This
 * client-side check exists only to avoid rendering a dead tab — it is NOT the revenue boundary.
 * The server enforces: an unentitled module must 403 at the API.
 *
 * An unknown module id returns false rather than throwing: new modules ship to the server
 * before this build knows about them.
 */
export const MODULE_IDS = [
  'home', 'leaderboard', 'demand', 'allocation', 'rewards', 'profile', 'notifications',
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

export type Entitlements = { modules: readonly string[] };

export function can(entitlements: Entitlements | null | undefined, module: string): boolean {
  if (!entitlements) return false;
  return entitlements.modules.includes(module);
}

export function isKnownModule(id: string): id is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(id);
}

/**
 * The bundled default, used on a cold start with no cache and no network.
 * A missing /config is NOT an empty entitlement set — an empty nav looks exactly like a
 * broken app (doc 09 §4).
 */
export const DEFAULT_ENTITLEMENTS: Entitlements = { modules: [...MODULE_IDS] };
