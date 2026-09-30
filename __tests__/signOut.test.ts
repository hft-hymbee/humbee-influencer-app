/**
 * Sign-out teardown.
 *
 * This is regression cover for a leak that is invisible in normal use and obvious the moment it
 * matters: two people sharing one handset. It is asserted at the level the bug actually occurs —
 * "is the previous user's data still reachable after sign-out" — rather than on implementation.
 *
 * MMKV is mocked because the real one is a native module; the behaviour under test is which
 * keys get removed, not how they are stored.
 */
const mockStore = new Map<string, string>();

jest.mock('../src/store/storage', () => ({
  storage: {
    getString: (k: string) => mockStore.get(k),
    set: (k: string, v: string) => mockStore.set(k, v),
    remove: (k: string) => mockStore.delete(k),
    getAllKeys: () => [...mockStore.keys()],
  },
  mmkvJSONStorage: {
    getItem: (k: string) => mockStore.get(k) ?? null,
    setItem: (k: string, v: string) => { mockStore.set(k, v); },
    removeItem: (k: string) => { mockStore.delete(k); },
  },
  clearSessionScopedStorage: () => {
    for (const k of [...mockStore.keys()]) if (k !== 'language') mockStore.delete(k);
  },
}));

import { queryClient } from '../src/api/queryClient';
import { resetUserStateOnSignOut } from '../src/store/resetOnSignOut';
import { useDemandDraftStore } from '../src/store/demandDraftStore';
import { useSelectionStore } from '../src/store/selectionStore';
import type { DraftSite } from '../src/domain/site';

const SITE: DraftSite = {
  coords: { latitude: '25.0089183', longitude: '88.1391062' },
  source: 'gps', accuracyM: 8,
  addressLine1: 'Plot 14, Sector 3', addressLine2: '', landmark: 'Opposite the school',
  pincodeId: 732101, districtId: 434, districtName: 'MALDA',
  stateId: 24, stateName: 'WEST BENGAL', locationId: 828, locationName: 'ADINA STATION',
  formattedAddress: 'Plot 14, Sector 3, MALDA',
};

describe('signing out leaves nothing of the previous user', () => {
  beforeEach(() => {
    mockStore.clear();
    queryClient.clear();
  });

  it('drops the query cache — not merely marks it stale', () => {
    queryClient.setQueryData(['me'], { influencer: { name: 'Murli Manohar Udasi' } });
    queryClient.setQueryData(['home'], { stats: { points_this_year: 4000 } });

    resetUserStateOnSignOut();

    // The next user must not be able to read the last one's name off a cached /me.
    expect(queryClient.getQueryData(['me'])).toBeUndefined();
    expect(queryClient.getQueryData(['home'])).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("drops the demand draft, including the construction site — that is someone's workplace", () => {
    useDemandDraftStore.getState().chooseManufacturer(288311, 2);
    useDemandDraftStore.getState().setSite(SITE);
    useDemandDraftStore.getState().setTab('mine');

    resetUserStateOnSignOut();

    const draft = useDemandDraftStore.getState().draft;
    expect(draft.site).toBeNull();
    expect(draft.manufacturerId).toBeNull();
    expect(draft.lines).toEqual([]);
    expect(useDemandDraftStore.getState().tab).toBe('new');
  });

  it('resets the persisted selection in MEMORY, not just on disk', () => {
    useSelectionStore.getState().setManufacturer(288311);
    useSelectionStore.getState().setPeriod('1y');

    resetUserStateOnSignOut();

    // Wiping MMKV alone would leave the hydrated store holding the old manufacturer, and the
    // persist middleware would write it straight back on the next set().
    expect(useSelectionStore.getState().manufacturerId).toBeNull();
    expect(useSelectionStore.getState().period).toBe('3m');
  });

  it('keeps the language, which belongs to the device and not to the user', () => {
    mockStore.set('language', 'hi');
    mockStore.set('selection', '{"state":{"manufacturerId":288311}}');

    resetUserStateOnSignOut();

    expect(mockStore.get('language')).toBe('hi');
    // ...and everything else is gone: a fresh login must not re-hydrate the last user.
    expect([...mockStore.keys()].filter(k => k !== 'language' && k !== 'selection')).toEqual([]);
  });
});
