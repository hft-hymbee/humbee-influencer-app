/**
 * Module-isolation matrix — docs/09-saas-and-module-architecture.md §8.
 *
 * THE failure mode of a module architecture is that the app works with everything on and breaks
 * on a subset. Nobody finds that by using the dev build, because the dev build has everything.
 *
 * These assert on the resolved registry rather than on pixels, so they are fast enough to run
 * on every PR.
 */
import { ALL_MODULES, buildNav, resolveModules } from '../src/modules/registry';
import { MODULE_IDS, DEFAULT_ENTITLEMENTS } from '../src/domain/entitlements';

const CORE = ALL_MODULES.filter(m => m.entitlement === null).map(m => m.id);

describe('module registry', () => {
  it('mounts everything when every module is entitled', () => {
    const resolved = resolveModules(DEFAULT_ENTITLEMENTS);
    expect(resolved).toHaveLength(ALL_MODULES.length);
  });

  it('still mounts core when NOTHING is entitled — an empty nav looks like a broken app', () => {
    const resolved = resolveModules({ modules: [] });
    expect(resolved.map(m => m.id).sort()).toEqual([...CORE].sort());
    // Home is core, so the nav is never completely empty.
    expect(buildNav(resolved).length).toBeGreaterThan(0);
  });

  it.each(MODULE_IDS.filter(id => !CORE.includes(id)))(
    'boots with only "%s" entitled, alongside core',
    moduleId => {
      const resolved = resolveModules({ modules: [moduleId] });
      const ids = resolved.map(m => m.id);
      expect(ids).toContain(moduleId);
      for (const core of CORE) expect(ids).toContain(core);
      // Nothing unentitled leaked in.
      for (const other of MODULE_IDS) {
        if (other === moduleId || CORE.includes(other)) continue;
        expect(ids).not.toContain(other);
      }
    },
  );

  it('ignores an unknown module id from the server instead of crashing', () => {
    expect(() => resolveModules({ modules: ['leaderboard', 'time-machine'] })).not.toThrow();
    const ids = resolveModules({ modules: ['leaderboard', 'time-machine'] }).map(m => m.id);
    expect(ids).not.toContain('time-machine' as never);
  });

  it('derives the nav from the registry, sorted, with no duplicates', () => {
    const nav = buildNav(resolveModules(DEFAULT_ENTITLEMENTS));
    const orders = nav.map(m => m.nav!.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(nav.map(m => m.id)).size).toBe(nav.length);
  });

  it('gives every module a unique, stable id — ids are a contract with the server', () => {
    expect(new Set(ALL_MODULES.map(m => m.id)).size).toBe(ALL_MODULES.length);
  });

  it('realistic tenant bundles resolve to what was sold', () => {
    const welspun = resolveModules({ modules: ['leaderboard', 'rewards'] }).map(m => m.id);
    expect(welspun).toContain('leaderboard');
    expect(welspun).toContain('rewards');
    expect(welspun).not.toContain('demand');
    expect(welspun).not.toContain('allocation');
  });
});
