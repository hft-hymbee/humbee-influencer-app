/**
 * Module manifests — docs/09-saas-and-module-architecture.md §3.
 *
 * A module is a COMMERCIAL unit, so it must be a technical unit. Each module declares itself
 * here; nothing about it is registered by hand anywhere else. That is what stops the tenth
 * module from being a hunt through six files.
 */
import type { IconName } from '../components';
import type { ModuleId } from '../domain/entitlements';

export type ModuleManifest = {
  /** Stable id, matching the entitlement string the server sends. NEVER renamed — it is a contract. */
  id: ModuleId;
  /** null = core, always present. Otherwise the entitlement required to mount it. */
  entitlement: ModuleId | null;
  /** Absent = the module has screens but no bottom-nav entry (e.g. notifications). */
  nav?: {
    label: string;
    icon: { active: IconName; inactive: IconName };
    /** Sparse (10, 20, 30…) so inserting a module needs no renumbering. */
    order: number;
  };
  /** The route the nav entry lands on. */
  route: string;
  /** Deep links this module claims. */
  deepLinks?: string[];
};
