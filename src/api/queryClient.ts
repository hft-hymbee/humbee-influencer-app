/**
 * Query defaults — docs/10-rn-cli-implementation-guide.md §5.6.
 *
 * Persisted to MMKV so a cold start with no network paints last-known Home rather than an
 * error. Offline-first is a PRD requirement, not a nicety.
 */
import { QueryClient } from '@tanstack/react-query';
import { storage } from '../store/storage';
import { isOffline } from './errors';

const CACHE_KEY = 'rq-cache-v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,        // field users re-open constantly; do not refetch on every focus
      gcTime: MAX_AGE_MS,           // survive a day of cold starts
      retry: (count, error) => !isOffline(error) && count < 2,
      refetchOnWindowFocus: false,  // wrong semantics on mobile
      refetchOnReconnect: true,     // right semantics on mobile
    },
    // V2 capture is online-only and carries no client ref, so a retry could duplicate a demand.
    mutations: { retry: 0 },
  },
});

/**
 * A deliberately small persister rather than a dependency: MMKV is synchronous, so hydration
 * completes before the first render and there is no flash of an empty screen.
 */
export function hydrateQueryCache() {
  try {
    const raw = storage.getString(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { at: number; queries: [readonly unknown[], unknown][] };
    if (Date.now() - parsed.at > MAX_AGE_MS) return;
    for (const [key, data] of parsed.queries) queryClient.setQueryData(key, data);
  } catch {
    // A corrupt cache must never stop the app booting.
    storage.remove(CACHE_KEY);
  }
}

/**
 * Queries that must NEVER survive the process.
 *
 * The demand list carries each demand's ePIN, and that code rotates after every action on the
 * demand. Painting a persisted one on a cold start would show the influencer a code the VCP's
 * app will reject — and they would read it out, twice, before anyone suspected the app. Offline
 * -first is worth a stale points total; it is not worth a stale credential.
 */
const NEVER_PERSIST = ['demand-capture'];

export function persistQueryCache() {
  try {
    const queries = queryClient
      .getQueryCache()
      .getAll()
      .filter(q => !NEVER_PERSIST.includes(String(q.queryKey[0])))
      .filter(q => q.state.status === 'success' && q.state.data !== undefined)
      .map(q => [q.queryKey, q.state.data] as [readonly unknown[], unknown]);
    storage.set(CACHE_KEY, JSON.stringify({ at: Date.now(), queries }));
  } catch {
    // Persistence is best-effort; never throw from a lifecycle handler.
  }
}
