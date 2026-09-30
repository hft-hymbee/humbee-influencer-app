/**
 * Selection — PERSISTED. "Field users work with one manufacturer for weeks"
 * (docs/design-spec/06-state-and-navigation.md), so `mfr` and `period` survive launches.
 *
 * Because MMKV is synchronous this is hydrated before the first render — the user never sees
 * the default manufacturer flash before their own.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvJSONStorage } from './storage';
import type { Period } from '../api/types';

type SelectionState = {
  manufacturerId: number | null;
  period: Period;
  setManufacturer: (id: number) => void;
  setPeriod: (p: Period) => void;
  /** Back to first-run defaults. Called on sign-out — a manufacturer is per-USER, not per-device. */
  reset: () => void;
};

export const useSelectionStore = create<SelectionState>()(
  persist(
    set => ({
      // Resolved on first run from GET /me's first manufacturer, and re-validated against that
      // list on every render — a mapping the influencer has lost must not keep 401-ing its screen.
      manufacturerId: null,
      period: '3m',
      setManufacturer: id => set({ manufacturerId: id }),
      setPeriod: period => set({ period }),
      reset: () => set({ manufacturerId: null, period: '3m' }),
    }),
    { name: 'selection', storage: createJSONStorage(() => mmkvJSONStorage) },
  ),
);
