/**
 * EVERYTHING the app holds about the person who was signed in, torn down in one place.
 *
 * WHY THIS FILE EXISTS. Clearing the token ends the SESSION; it does not end the DATA. Three
 * separate layers survive a naive sign-out, and the next person to log in on the same handset
 * sees all three:
 *
 *   1. THE QUERY CACHE, in memory. `/me`, Home, the leaderboard, demands, rewards — all still
 *      resident and all still "fresh" by `staleTime`. The next user lands on Home and reads the
 *      previous user's name and points until a refetch lands. This is the one that looks like a
 *      security bug to whoever finds it, because it is one.
 *   2. THE ZUSTAND STORES, in memory. Wiping MMKV does NOT roll back a hydrated store: zustand
 *      keeps its state and the persist middleware simply writes it back out on the next `set`.
 *      So the old manufacturer, period and — worst — the CONSTRUCTION SITE ADDRESS on the demand
 *      draft carry across. A site address is somebody's workplace.
 *   3. MMKV, on disk: the persisted query cache and the persisted selection.
 *
 * ORDER MATTERS and it is the reverse of the obvious one: reset the in-memory stores FIRST, then
 * clear the disk. The persist middleware writes on every `set`, so clearing MMKV before
 * resetting the stores means the reset immediately re-writes the file that was just deleted.
 *
 * This is deliberately NOT imported by sessionStore's dependencies in the other direction —
 * nothing here imports sessionStore — so the graph stays acyclic.
 */
import { queryClient } from '../api/queryClient';
import { useDemandDraftStore } from './demandDraftStore';
import { useSelectionStore } from './selectionStore';
import { clearSessionScopedStorage } from './storage';

export function resetUserStateOnSignOut() {
  /**
   * `clear()` and not `invalidateQueries()`: invalidation marks data stale but KEEPS it, and
   * keeping it is the whole problem. Nothing that was fetched with the old bearer token may
   * outlive it, including the in-flight requests this cancels.
   */
  queryClient.clear();

  // In memory first — see the note on ordering above.
  useDemandDraftStore.getState().reset();
  useSelectionStore.getState().reset();

  // ...then disk. `language` survives deliberately: it is a device preference, not a user's.
  clearSessionScopedStorage();
}
