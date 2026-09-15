/**
 * MMKV — docs/10-rn-cli-implementation-guide.md §8.
 *
 * WHY MMKV and not AsyncStorage: it is SYNCHRONOUS. That is the reason, not the benchmark.
 * The app reads the persisted manufacturer, period and language BEFORE the first render, so
 * there is no flash of the wrong manufacturer and no theme flicker on a cold start. With
 * AsyncStorage every one of those becomes a loading state.
 *
 * MMKV IS NOT ENCRYPTED BY DEFAULT, and even encrypted it is not a Keychain substitute.
 * Tokens go to src/store/secureStore.ts. Never here.
 */
import { createMMKV, type MMKV } from 'react-native-mmkv';

/**
 * Namespaced by tenant so a white-label build or a tenant switch cannot read another tenant's
 * cached data (doc 09 §7). `default` until /config resolves a tenant.
 */
let instanceId = 'humbee-default';
export let storage: MMKV = createMMKV({ id: instanceId });

export function setStorageTenant(tenantId: string) {
  const next = `humbee-${tenantId}`;
  if (next === instanceId) return;
  instanceId = next;
  storage = createMMKV({ id: next });
}

/** Zustand persist adapter. Synchronous, so hydration is complete on first render. */
export const mmkvJSONStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

/** Cleared on logout. `language` is deliberately NOT session state and survives. */
export function clearSessionScopedStorage() {
  for (const key of storage.getAllKeys()) {
    if (key === 'language') continue;
    storage.remove(key);
  }
}
