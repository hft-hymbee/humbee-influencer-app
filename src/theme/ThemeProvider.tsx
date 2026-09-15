/**
 * Runtime theming for multi-tenancy — docs/09-saas-and-module-architecture.md §7.
 *
 * ONLY colours and brand assets are themeable. The type ramp, spacing, radii, elevation and
 * motion stay fixed: they encode the design system's structure, and a tenant changing the
 * spacing scale is how a design system dies. `Pick<Theme,'colors'>` enforces that in the type.
 *
 * Compile-time default, runtime override: HUMBEE is a static import so the first frame is
 * correct, and a tenant's overrides arrive from GET /config (cached in MMKV) so a cold start
 * never flashes the wrong brand.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { colors as humbeeColors } from './colors';

export type Theme = { colors: typeof humbeeColors; logoUrl?: string };

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
/** A tenant may override colours and the logo. Nothing else. Enforced here, not by convention. */
export type ThemeOverride = DeepPartial<Pick<Theme, 'colors'>> & { logoUrl?: string };

const humbeeTheme: Theme = { colors: humbeeColors };
const ThemeContext = createContext<Theme>(humbeeTheme);

export function ThemeProvider({ override, children }: { override?: ThemeOverride | null; children: React.ReactNode }) {
  const value = useMemo<Theme>(() => {
    if (!override) return humbeeTheme;
    return {
      colors: { ...humbeeColors, ...(override.colors ?? {}) } as typeof humbeeColors,
      logoUrl: override.logoUrl,
    };
  }, [override]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Prefer the static `colors` import for anything that cannot be tenant-branded (structure greys,
 * status colours). Use this hook where a tenant's brand colour must win — primary buttons,
 * active nav, the current-user ring.
 */
export const useTheme = () => useContext(ThemeContext);
