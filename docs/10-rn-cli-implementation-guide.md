# 10 — RN CLI Implementation Guide

**Decision recorded:** the app is built on the **React Native CLI** — `android/` and `ios/` are checked
in and owned. `07-framework-comparison.md` documented that Expo CNG scores higher; that comparison
stays on file for a future re-open, and this document does not re-argue it. What it *does* do is name
the three costs the CLI carries and pay each one deliberately: **OTA (§2.6)**, **the upgrade treadmill
(§12.2)**, and **native dependency review (§12.1)**.

This is the build manual: bootstrap, architecture pattern, folder structure, data layer, state, storage,
libraries, and the standards CI enforces.

| Section | |
| --- | --- |
| §1 | Bootstrap — commands, versions, native config |
| §2 | The dependency manifest, with what each replaces |
| §3 | **Architecture pattern: MVC vs MVVM vs what to actually do** |
| §4 | Folder structure, end to end |
| §5 | **The API / query layer** — keys, envelope, generated types, errors, offline |
| §6 | **State: TanStack Query + Zustand** (primary) |
| §7 | **Redux Toolkit structure** — the documented alternative, if the team prefers it |
| §8 | **Local storage: MMKV vs AsyncStorage vs SecureStore** |
| §9 | Navigation |
| §10 | Styling and the token module |
| §11 | Testing |
| §12 | Industry standards, CI gates, and the two recurring obligations |

---

## 1. Bootstrap

### 1.1 Create the project

```bash
# Node 20 LTS or 22 LTS. Verify the RN version's own Node requirement first.
npx @react-native-community/cli@latest init HumbeeInfluencer --template react-native-template-typescript
cd HumbeeInfluencer
```

Then, before writing any screen:

```bash
# Expo's module library WITHOUT the Expo workflow — this is supported in bare RN
npx install-expo-modules@latest

# OTA. §2.6 — do this in Phase 0, not later
npm i expo-updates
```

**Confirm the New Architecture is on.** It is the default on current RN, and it must be verified rather
than assumed, because every native library has to be checked against it:

- `android/gradle.properties` → `newArchEnabled=true`
- `ios/Podfile` → `RCT_NEW_ARCH_ENABLED=1` on `pod install`
- `android/app/build.gradle` → `hermesEnabled=true`

Verify at runtime once: `global.nativeFabricUIManager` is defined under Fabric.

### 1.2 Versions

**Pin exact versions, and treat `package.json` as a curated file, not an append log.** Every version
number written into any document in this repo is indicative and must be re-verified at bootstrap — RN
and the New Architecture support matrix both move faster than documentation. The verification step
belongs *before* the first commit, not after.

### 1.3 Native project config to do once

| Item | Where |
| --- | --- |
| `applicationId` / bundle identifier | `android/app/build.gradle`, Xcode target — `in.humbee.influencer` |
| Build variants: dev / qa / pre / prod | Android product flavors; iOS schemes + `.xcconfig` |
| Hermes | On, both platforms |
| ProGuard / R8 | On for release. Keep rules for Reanimated and any reflection-based lib |
| App Bundle splits | On — this is how you hold the 30 MB budget |
| Fonts | Lato 400/600/700 into `android/app/src/main/assets/fonts` and the Xcode target |
| `expo-updates` native config | `Expo.plist` (iOS), `AndroidManifest` metadata + `strings.xml` (Android). **You maintain these by hand — they must survive every RN upgrade merge** |
| Deep link scheme | `humbee://` — `AndroidManifest` intent filter + iOS `CFBundleURLTypes` |
| Firebase | `google-services.json` / `GoogleService-Info.plist`, per flavor if per-tenant |

---

## 2. Dependency manifest

Every package, why it is here, and what it replaces. Anything not on this list is a decision, not a
default — see §12.1.

### 2.1 Core

| Package | Purpose |
| --- | --- |
| `react-native`, `react` | Runtime. New Architecture + Hermes |
| `typescript` | `strict: true` + `noUncheckedIndexedAccess` |
| `expo-modules-core` | Unlocks the `expo-*` module library in bare RN |

### 2.2 Navigation

| Package | Purpose |
| --- | --- |
| `@react-navigation/native` | Core |
| `@react-navigation/native-stack` | Native stack — real platform transitions |
| `@react-navigation/bottom-tabs` | The designed shell |
| `react-native-screens`, `react-native-safe-area-context` | Required peers. `enableScreens()` is what stops off-screen routes from rendering |

### 2.3 Data and state

| Package | Purpose |
| --- | --- |
| `@tanstack/react-query` | Server state. §6 |
| `@tanstack/query-async-storage-persister` *(or a small MMKV persister)* | Cache persistence across cold starts |
| `zustand` | The three client-state slices. §6.3 |
| `openapi-typescript` (dev) | Generates types from `openapi.yaml`. §5.2 |
| `zod` + `react-hook-form` | The one real form (Capture Demand) |

### 2.4 Storage

| Package | Purpose |
| --- | --- |
| `react-native-mmkv` | Preferences, query-cache persistence, the offline outbox. §8 |
| `expo-secure-store` | **Tokens only.** Keychain / EncryptedSharedPreferences. §8.3 |

### 2.5 UI, motion, media

| Package | Purpose | Replaces |
| --- | --- | --- |
| `@shopify/flash-list` | Every list. Recycling, not mount-per-row | `FlatList` |
| `react-native-reanimated` | All motion, on the UI thread | `Animated` |
| `react-native-gesture-handler` | Gestures; Reanimated peer | |
| `react-native-svg` | The 102-glyph HUMBEE icon set, the hexagon, medals | any icon library |
| `expo-image` | Disk+memory cache, `contentFit`, placeholders | `FastImage` |
| `lottie-react-native` | `celebration.json`, `success-green.json` | |
| `expo-linear-gradient` | The two permitted gradients | |
| `expo-font` | Bundled Lato | |

### 2.6 Delivery, i18n, observability

| Package | Purpose |
| --- | --- |
| `expo-updates` | **OTA. The single highest-risk item in Phase 0** — prove a JS change reaching a real device before the first screen. If it cannot be made to work, the framework comparison has to be re-opened |
| `i18next`, `react-i18next`, `expo-localization` | `en` / `hi` / `mr`, ICU plurals |
| `@react-native-community/netinfo` | The offline banner |
| `@sentry/react-native` | Crashes + release health per OTA update |
| `@react-native-firebase/app`, `/messaging` | Push (screen 11) |

### 2.7 Deliberately not installed

| Not using | Why |
| --- | --- |
| `redux`, `@reduxjs/toolkit` | §6, §7. Almost no shared client state to hold |
| A component library (Paper, UI Kitten, Tamagui) | 531 final design variables and a bespoke hexagon language. Every component would be overridden into unrecognisability |
| NativeWind / styled-components | Runtime cost on the render path, and a class-string culture that fights a typed token system. §10 |
| `react-native-webview` | Nothing in the spec needs one, and a WebView on a 2 GB device is the fastest way to lose the performance budget |
| `moment` | `Intl` + `date-fns` if needed. Bundle size |
| Any icon pack | The HUMBEE set is the design system |

---

## 3. Architecture pattern — MVC, MVVM, or what?

**Short answer: neither, as named. Use MVVM's *separation* expressed in React's idioms — which in
practice means a four-layer split with unidirectional data flow.** Adopting either pattern by the book
would fight the framework.

### 3.1 Why not MVC

MVC assumes a Controller that receives input, mutates a Model, and tells a View to update. React
inverts that: state changes produce a re-render, and there is no controller object to hold. Building an
explicit Controller layer in React means writing an imperative shell around a declarative renderer —
you get the ceremony and lose the guarantees. MVC's real home is server-side request/response and
imperative UI toolkits.

### 3.2 Why MVVM is the right *shape*, and how it maps

MVVM's core claim is the one that matters here: **the View holds no logic and no formatting; a
ViewModel exposes ready-to-render state; the Model owns data and rules.** That is exactly the
discipline this product needs, because the single most common defect in this codebase will be a screen
computing something the server owns.

The mapping onto React Native, honestly stated:

| MVVM concept | Here |
| --- | --- |
| **Model** | `packages/domain` (pure rules, status machines, formatting) + `packages/api-client` (generated types, server as the source of truth) |
| **ViewModel** | A **custom hook per screen** — `useLeaderboardScreen()` — composing query hooks and selectors, returning a flat, render-ready view model |
| **View** | The screen component. Renders props. No `useQuery`, no arithmetic, no `toLocaleString()` |
| **Binding** | React's re-render. Do not build an observable layer for this |

**What we deliberately do not import from MVVM:** observables (MobX-style), two-way binding, and
ViewModel classes. React hooks already provide the subscription mechanism; adding a second one is how
you get two sources of truth.

### 3.3 The pattern, stated as a rule

> **Four layers, dependencies pointing one way only:**
> **View** → **ViewModel (hook)** → **Data (query hooks / stores)** → **Domain (pure TS)**
>
> A layer may only import from layers to its right. Domain imports nothing from the app.

```
┌─ View ──────────── screens/LeaderboardScreen.tsx      presentational only
│  props in, JSX out. No queries, no math, no formatting.
├─ ViewModel ─────── hooks/useLeaderboardScreen.ts      composition + derivation
│  calls query hooks, selects, derives, returns a flat view model.
├─ Data ──────────── api-client hooks · zustand stores  I/O and cache
│  TanStack Query owns server state. Zustand owns client state.
└─ Domain ────────── packages/domain                    pure, testable, no React
   status machines, entitlements, en-IN formatting, validation.
```

### 3.4 What this looks like in practice

**Domain — pure, no React, unit-tested in isolation:**

```ts
// packages/domain/src/format.ts
const inr = new Intl.NumberFormat('en-IN')
export const formatPoints = (n: number) => `${n > 0 ? '+' : ''}${inr.format(n)} pts`

// One decimal for Ton, zero for everything else — 03-api-integration-and-data.md §6
export function formatQuantity(value: number, uom: Uom): string {
  const decimals = uom === 'Ton' ? 1 : 0
  return `${value.toFixed(decimals)} ${uom}`
}
```

**ViewModel — the only place derivation happens:**

```ts
// modules/leaderboard/hooks/useLeaderboardScreen.ts
export function useLeaderboardScreen() {
  const mfr = useSelectionStore(s => s.mfr)          // client state
  const q = useLeaderboardQuery(mfr)                  // server state

  return {
    // pass server-computed values straight through — never recompute
    rows:        q.data?.rows ?? [],
    me:          q.data?.me,
    showPodium:  q.data?.showPodium ?? false,
    gapLabel:    q.data?.me.gapLabel,
    // UI-only derivation is fine here
    isSkeleton:  q.isPending,
    isStale:     q.isStale && !q.isFetching,
    onRetry:     q.refetch,
  }
}
```

**View — no logic at all:**

```tsx
export function LeaderboardScreen() {
  const vm = useLeaderboardScreen()
  if (vm.isSkeleton) return <LeaderboardSkeleton />
  return (
    <Screen>
      <ManufacturerTabs />
      {vm.showPodium && <Podium rows={vm.rows.slice(0, 3)} />}
      <FlashList data={vm.rows} renderItem={({ item }) => <LeaderboardRow row={item} />} />
      {vm.me && <StickyMeCard me={vm.me} gapLabel={vm.gapLabel} />}
    </Screen>
  )
}
```

**Why the ceremony is worth it here specifically.** Three of this product's hardest rules are enforced
by this split rather than by review vigilance:

1. **The server owns every number.** If a View cannot call `useQuery`, it cannot quietly recompute
   points; and if a ViewModel only passes server fields through, the recomputation has nowhere to live.
2. **Role-per-industry** (`08-screen-inventory.md` §6) is resolved in Domain, so it cannot be derived
   three different ways on three screens.
3. **Testability.** ViewModels test with MSW and no renderer; Domain tests with neither. The expensive
   render tests then only cover what is genuinely visual.

### 3.5 One rule that overrides the pattern

**Do not add a layer a screen does not need.** Screen 07 (Demand Captured) renders the `POST /demands`
response and has no data fetching — it needs no ViewModel hook, and inventing an empty one to satisfy
symmetry is worse than the asymmetry. The pattern is a default, not a quota.

---

## 4. Folder structure

Building on `09-saas-and-module-architecture.md` §2 — modules are sellable units, so the boundaries are
commercial, not merely tidy.

```
HumbeeInfluencer/
├── android/                      # checked in and owned (RN CLI)
├── ios/
├── apps/mobile/src/
│   ├── core/                     # always present. Never sold, never absent
│   │   ├── auth/                 #   screens 01–02, session, route guard
│   │   ├── language/             #   screen 00
│   │   ├── shell/                #   header, nav host, scroll container, offline banner
│   │   ├── navigation/           #   nav trees + linking config, both BUILT FROM the registry
│   │   └── config/               #   GET /config → tenant, entitlements, theme
│   │
│   ├── modules/                  # one folder per sellable unit
│   │   └── leaderboard/
│   │       ├── manifest.ts       #   id, entitlement, nav entry, routes, i18n ns
│   │       ├── screens/          #   View layer
│   │       ├── hooks/            #   ViewModel layer
│   │       ├── components/       #   module-local components only
│   │       ├── i18n/             #   its own namespace
│   │       └── index.ts          #   exports the manifest. NOTHING else
│   │   └── … home · demand · allocation · rewards · profile · notifications
│   │
│   ├── shared/                   # cross-cutting, non-domain
│   │   ├── providers/            #   QueryClientProvider, ThemeProvider, ErrorBoundary
│   │   ├── analytics/            #   the track() facade
│   │   └── components/           #   app-wide, non-design-system
│   └── modules/registry.ts       # the ONLY place a module is named
│
└── packages/
    ├── tokens/                   # generated from docs/design-spec/tokens/*.css
    ├── ui/                       # design-system primitives
    ├── api-client/               # generated from openapi.yaml + query hooks
    ├── domain/                   # pure TS. No React, no react-native imports
    ├── module-host/              # manifest types, registry resolution, nav builder
    ├── i18n/
    ├── analytics/                # typed event catalogue
    └── config/                   # eslint (incl. boundaries), tsconfig, prettier, jest
```

**Inside a module, the file tells you the layer:** `screens/` is View, `hooks/` is ViewModel,
`components/` is View. Nothing in a module is Domain — that lives in `packages/domain` so it is shared
and renderer-free.

---

## 5. The API / query layer

### 5.1 Structure

```
packages/api-client/
├── src/
│   ├── generated/schema.d.ts     # openapi-typescript output. NEVER hand-edited
│   ├── http.ts                   # fetch wrapper: envelope, auth, refresh, idempotency
│   ├── keys.ts                   # the query-key factory — single source of key truth
│   ├── errors.ts                 # ApiError taxonomy
│   └── hooks/                    # one file per endpoint group
│       ├── useLeaderboardQuery.ts
│       ├── useHomeQuery.ts
│       └── useSubmitDemandMutation.ts
└── package.json
```

### 5.2 Generated types, enforced in CI

```bash
npx openapi-typescript ../../docs/../..//humbee_influencer_backend/contracts/openapi.yaml \
  -o packages/api-client/src/generated/schema.d.ts
```

Wire it as `pnpm api:gen`, run it in CI, and **fail the build if the output differs from what is
committed.** A contract change that would break the app becomes a red build in the PR that made it.
This is the highest-value property available for free — do not hand-edit generated types.

### 5.3 The query-key factory

Every key in one place, so a cache invalidation cannot miss a variant:

```ts
// packages/api-client/src/keys.ts
export const qk = {
  config:      ()                          => ['config'] as const,
  home:        ()                          => ['home'] as const,
  me:          ()                          => ['me'] as const,
  catalog:     ()                          => ['catalog', 'industries'] as const,
  leaderboard: (mfr: MfrId)                => ['leaderboard', mfr] as const,
  allocations: (mfr: MfrId, p: Period)     => ['allocations', mfr, p] as const,
  allocSummary:(mfr: MfrId, p: Period)     => ['allocations', 'summary', mfr, p] as const,
  rewards:     (mfr: MfrId, p: Period)     => ['rewards', mfr, p] as const,
  rewSummary:  (mfr: MfrId, p: Period)     => ['rewards', 'summary', mfr, p] as const,
  demands:     ()                          => ['demands'] as const,
  demSummary:  ()                          => ['demands', 'summary'] as const,
} as const
```

**Why `(screen, manufacturer, period)` is the key shape.** It is what makes the designed behaviour fall
out for free: switching to a **cached** manufacturer is instant with no skeleton; switching to an
uncached one shows the skeleton; and a **status-filter change never refetches** because it filters data
already in memory. That last one is an explicit requirement in the design spec, and a global `loading`
flag would break it.

### 5.4 The HTTP wrapper

Four responsibilities, and no more:

```ts
// 1. Unwrap the envelope once, centrally
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, withAuth(init))
  if (!res.ok) throw await toApiError(res)
  const body = await res.json()
  return body.data as T                      // envelope unwrapped here, never in a screen
}

// 2. Refresh on 401, exactly once, with a single in-flight promise
//    so ten parallel 401s produce one refresh, not ten.
// 3. Attach Idempotency-Key on every mutation.
// 4. Map transport + status codes into the ApiError taxonomy below.
```

### 5.5 Error taxonomy

Screens must not branch on HTTP status codes. Map once:

| `ApiError.kind` | Cause | UI |
| --- | --- | --- |
| `offline` | No connectivity | Offline banner + cached data |
| `timeout` | Slow network | Retry affordance |
| `unauthorized` | Refresh failed | Clear session, route to login |
| `forbidden` | `403` — module not entitled | Absent from nav, or the upsell screen (`09-…` §5) |
| `notFound` | `404` | Empty state, not an error |
| `rateLimited` | `429` — OTP throttling | The specific copy, with the retry window |
| `validation` | `422` | Field-level errors on the demand form |
| `server` | `5xx` | Generic error state + retry |
| `unknown` | Anything else | Generic. **Log to Sentry; never render a raw message** |

### 5.6 Query defaults

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,          // field users re-open constantly; do not refetch on every focus
      gcTime: 24 * 60 * 60_000,       // survive a day of cold starts
      retry: (n, e) => !isOffline(e) && n < 2,
      refetchOnWindowFocus: false,    // wrong semantics on mobile
      refetchOnReconnect: true,       // right semantics on mobile
    },
    mutations: { retry: 0 },          // demands retry through the outbox, not here
  },
})
```

Persist the cache to MMKV (§8.2) so a cold start with no network paints last-known Home rather than an
error.

### 5.7 The offline outbox — **superseded by the V2 contract, not implemented**

> **Read this before building anything below.** V2 made demand capture **online-only**: the body
> carries no `client_ref` and the endpoint takes no `Idempotency-Key`, so a replayed submission
> cannot be made safe — it would create a second demand. `feature_flags.offline_demand_queue` is
> `false`, and `src/store/outbox.ts` has been removed. **Offline-first still applies to READS**
> through the persisted query cache; writes now require a connection, and Capture Demand fails in
> place with every selection intact. The design below is kept because it is the right shape for
> the day the contract carries a client ref again.



The only queued write in v1 is demand submission.

- **Generate the `Idempotency-Key` at capture time, not at send time.** A retry must carry the *same*
  key, or one demand becomes two. This is the single most important line in this section.
- Queue in MMKV; drain via `POST /demands/batch` on reconnect.
- **A queued write must never look like it succeeded** — the card shows "Pending sync" until the server
  confirms.
- Screen 07 renders the *server's* response. That is why the contract puts everything that screen needs
  in the `POST /demands` response body: it also dodges read-replica lag.

---

## 6. State: TanStack Query + Zustand (primary)

### 6.1 The split

| Kind | Owner | Examples |
| --- | --- | --- |
| **Server state** | TanStack Query | Everything from the API. Cached, keyed, persisted |
| **Client state** | Zustand | `session`, `selection` (`mfr`/`period`), `demandDraft` |
| **Derived state** | ViewModel hooks | Computed at render. **Never stored** |
| **Secrets** | `expo-secure-store` | Tokens only |

**The rule that prevents most bugs in this codebase: server data never enters a Zustand store.**
Copying it in gives you two sources of truth and a stale one wins about half the time.

### 6.2 Why not Redux here

This app is ~95% server-state reads with a hard offline requirement. Cache keys, staleness, background
refetch, pull-to-refresh, request dedup and cache persistence are the entire problem, and they are
TanStack Query's built-ins — in Redux you hand-write each one. The client state that remains is three
small slices, which is Zustand-sized: no provider tree, no reducers, no action types.

### 6.3 The three stores

```ts
// selection — persisted. Field users work with one manufacturer for weeks.
export const useSelectionStore = create(persist<SelectionState>(
  set => ({
    mfr: 'welspun',
    period: '3m',
    setMfr:    mfr    => set({ mfr }),
    setPeriod: period => set({ period }),
  }),
  { name: 'selection', storage: mmkvJSONStorage },
))
```

- **`session`** — auth status, tenant, entitlements, language. Hydrated from SecureStore + `/config`.
  **Not persisted itself** (the token is; the derived session is rebuilt).
- **`selection`** — `mfr`, `period`. **Persisted.**
- **`demandDraft`** — the multi-step form. **Not persisted** beyond the session unless the outbox is
  implemented (`design-spec/06-state-and-navigation.md`).

The reset rules when industry / sub-industry / manufacturer change are specified in the design spec —
implement them from there rather than re-deriving, because getting them wrong strands the form in an
unsubmittable state.

---

## 7. Redux Toolkit structure — the documented alternative

If the team prefers Redux for continuity with `humbee-mobile-app`, this is how to do it *correctly*.
It is a defensible choice and nothing else in the architecture changes: the four layers of §3, the
folder structure of §4, and the module boundaries all hold. **Only §5.3/§5.6 and §6 are replaced.**

**The one thing that is not acceptable either way: classic Redux slices holding server data.** That is
where most of the boilerplate in the VCP app comes from. If Redux, then **RTK Query** — not
`createAsyncThunk` fetching into a slice.

### 7.1 Structure

```
packages/api-client/src/
├── store.ts                      # configureStore
├── api/
│   ├── baseApi.ts                # createApi + fetchBaseQuery + envelope + re-auth
│   ├── leaderboard.ts            # injectEndpoints — one file per endpoint group
│   ├── demands.ts
│   └── …
└── slices/
    ├── sessionSlice.ts
    ├── selectionSlice.ts         # mfr, period — persisted
    └── demandDraftSlice.ts
```

### 7.2 `baseApi`

```ts
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: withReauth(fetchBaseQuery({
    baseUrl: BASE,
    prepareHeaders: h => { h.set('Authorization', `Bearer ${getAccessToken()}`); return h },
  })),
  // tagTypes replace the query-key factory as the invalidation vocabulary
  tagTypes: ['Home', 'Leaderboard', 'Demands', 'Allocations', 'Rewards', 'Me', 'Config'],
  endpoints: () => ({}),          // injected per module — keeps modules independent
})
```

`injectEndpoints` per module is what preserves the §4 boundaries: a module contributes its endpoints
without `baseApi` importing the module.

### 7.3 The mapping

| TanStack Query | RTK Query |
| --- | --- |
| Query key `['leaderboard', mfr]` | The endpoint's argument — RTK derives the cache key |
| `invalidateQueries` | `invalidatesTags` / `providesTags` |
| `staleTime` | `keepUnusedDataFor` + `refetchOnMountOrArgChange` |
| Persister | `redux-persist` on the api reducer, MMKV-backed |
| Mutation outbox | `listenerMiddleware` draining the MMKV queue on reconnect |
| Zustand store | A slice |

### 7.4 Rules if you go this way

- **`providesTags` on every query and `invalidatesTags` on every mutation.** Manual `dispatch` of a
  refetch is the RTK equivalent of a stale cache.
- **Serializable state only.** No class instances, no `Date` objects in the store — this is what
  `redux-persist` and time-travel both require.
- **Selectors are memoized** (`createSelector`) and live beside the slice, not in screens.
- **Persist `selection` only.** Do not persist the whole store.
- Keep `redux-thunk` for the rare imperative flow; **no sagas.** An observable-effect DSL is a large
  concept budget for an app with three writes.
- The ViewModel layer of §3 stays: screens call `useGetLeaderboardQuery` **through** a hook, never
  directly, so the View stays swappable.

**Cost, stated plainly:** roughly 30–40% more data-layer code than §6 for identical behaviour, and the
offline outbox is hand-built where TanStack Query has mutation persistence. The benefit is real too —
one mental model shared with the VCP app, and DevTools time-travel.

---

## 8. Local storage: MMKV, AsyncStorage, or SecureStore

**Three stores, three jobs. This is not a preference — mixing them up is a security bug.**

| Need | Use | Never |
| --- | --- | --- |
| Access + refresh tokens | **`expo-secure-store`** (Keychain / EncryptedSharedPreferences) | MMKV, AsyncStorage, plain files |
| Preferences, `mfr`/`period`, query cache, offline outbox | **`react-native-mmkv`** | |
| Large structured data with relational queries | SQLite (`op-sqlite`) — **not needed in v1** | |

### 8.1 MMKV over AsyncStorage — and the caveat

| | MMKV | AsyncStorage |
| --- | --- | --- |
| Access | **Synchronous** | Async, promise-based |
| Speed | ~10–30× faster on typical reads | Slower |
| Implementation | Tencent's mmap-backed C++ | Android: SQLite; iOS: files |
| Encryption | Optional, built in | **None** |
| Migration | Ships a helper for importing AsyncStorage data | — |

**Synchronous access is the reason, not the benchmark.** It means the app reads the persisted `mfr`,
`period` and language **before the first render** — no `await`, no flash of the wrong manufacturer, no
theme flicker on a cold start. With AsyncStorage every one of those becomes a loading state.

**Caveats, honestly:**

- **MMKV is not encrypted by default.** It takes an encryption key, and even encrypted it is *not* a
  Keychain substitute — the key has to live somewhere on the device. **Tokens go in SecureStore.**
- MMKV is a native module with a JSI/TurboModule binding, so it must be checked against the New
  Architecture at every RN upgrade (§12.1). AsyncStorage's community package is a lighter dependency.
- Not usable from a background/headless JS context on Android without care — relevant if geofencing
  arrives (`07-framework-comparison.md` §6.2).

### 8.2 Wiring MMKV to the query cache and Zustand

```ts
export const storage = new MMKV({ id: 'humbee' })

// Zustand persist adapter — synchronous, so hydration is complete on first render
export const mmkvJSONStorage = {
  getItem:    (k: string) => storage.getString(k) ?? null,
  setItem:    (k: string, v: string) => storage.set(k, v),
  removeItem: (k: string) => storage.delete(k),
}
```

**Namespace by tenant.** Under multi-tenancy (`09-…`), key the MMKV instance or prefix keys by
`tenantId`, so a white-label build or a tenant switch cannot read another tenant's cached data.

### 8.3 What must never be persisted

- Tokens outside SecureStore.
- OTPs, full mobile numbers in logs or breadcrumbs (**mask to the last four digits**).
- PII in Sentry — scrub before send.
- **Clear on logout:** the query cache, `demandDraft`, and SecureStore. Keep `language`; the user's
  language choice is not session state.

---

## 9. Navigation

React Navigation, with the trees **built from the module registry** — never a hardcoded list.

```
RootNavigator                       (switches on session + language state)
├── LanguageStack       → screen 00        first launch only
├── AuthStack           → screens 01–02    replace, never push, on success
└── AppTabs             → built from buildNav(resolvedModules)
    └── per-module stacks from each manifest's routes
```

- `enableScreens()` at entry, and `enableFreeze()` so off-screen tabs stop re-rendering — a measurable
  win on a 2 GB device.
- **Deep links are a hand-written linking config** (the CLI's cost versus file-based routing):
  `humbee://leaderboard?mfr=welspun`, `humbee://demands`, `humbee://rewards?status=InShop`. Generate the
  config from the manifests' `deepLinks` so it cannot drift from the routes.
- **A link to an unentitled module must degrade, not throw** — resolve it once in `core/navigation`
  (`09-…` §5 rule 6), not per call site.
- Type the param lists and export a typed `useNavigation`; untyped navigation is where refactors break
  silently.
- Bottom nav is absent on screens 00, 01, 02 and 07. The **Demand** tab is active for screens 06, 07
  *and* 08.

---

## 10. Styling and tokens

**Typed tokens + `StyleSheet.create`.** Zero runtime cost on the render path.

```ts
// packages/tokens — generated from docs/design-spec/tokens/*.css. No hand-edits.
export const colours = { primary100: '#995A00', /* … */ } as const
export type ColourToken = keyof typeof colours
```

- `StyleSheet.create` outside the component. A style object built in a render body allocates per frame.
- **Tokens resolve through the theme context** (`09-…` §7) so a tenant can override colours — but the
  typed guarantee survives: `colours.primary100` still cannot be misspelled. Do not weaken it to
  string keys.
- **`includeFontPadding: false` on every `Text`**, or Lato's 1.54 line-height ratio sits 1–3px off on
  Android and every screen drifts from the prototype.
- Borders in the design are **inset box-shadows**. RN has none: approximate with `borderWidth` and
  compensate for the 1px content-box shift on selection.
- Never a raw hex, size, radius or shadow in a feature file. `02-design-system.md` §3 resolves the
  spacing/tap-target/body-size conflicts — do not adjudicate them in a PR.

---

## 11. Testing

| Layer | Tool | What it covers |
| --- | --- | --- |
| **Domain** | Jest, no renderer | Formatting, status machines, entitlements, validation. **Fast and where the density belongs** |
| **ViewModel** | Jest + RNTL + **MSW** | Derivation, loading/empty/error branches, against real fixture payloads |
| **Component** | RNTL | Design-system primitives and their variants |
| **Module isolation** | Jest | **Boot each module solo** (`09-…` §8). The highest-value suite here |
| **E2E** | **Maestro** | Login → capture demand → see it in My Demands. Flows are readable enough for QA to own |
| **Render perf** | Reassure | Regression guard on the list screens |

- **MSW serves `docs/design-spec/data/*.json`** — the same fixtures back the tests and the dev build, so
  a passing test means the screen matches the design's data.
- **Do not chase coverage percentage.** Cover Domain heavily, ViewModels at the branch level, and Views
  barely — a snapshot test of a screen asserts nothing about whether it matches the design.

---

## 12. Industry standards and CI gates

### 12.1 The recurring obligation the CLI creates: native dependency review

On the CLI, every native dependency is a real code review — there is no config plugin to absorb it.
Before adding one:

- [ ] New Architecture (Fabric / TurboModule) support confirmed, on the version you are pinning.
- [ ] Both platforms build, on a clean checkout, from `android/` and `ios/` as committed.
- [ ] APK size delta measured against the **30 MB** budget.
- [ ] Maintenance signal checked: last release, open issues, whether one person owns it.
- [ ] `AndroidManifest` / `Info.plist` / Gradle / Podfile changes are **committed and reviewed**, not
      applied locally and forgotten.
- [ ] What it replaces is removed. `knip` in CI catches what does not get deleted.
- [ ] **Every native PEER dependency it declares is installed DIRECTLY.** RN autolinking only
      registers direct dependencies, so a transitive peer resolves in TypeScript and in Metro
      but is absent from `settings.gradle` — the JS bundle builds and the native build fails.
      This bit both `react-native-mmkv` (needs `react-native-nitro-modules`) and
      `react-native-reanimated` (needs `react-native-worklets`). See
      `11-feature-reference.md` §8c.

### 12.2 The other one: the RN upgrade

**Budget ~1 engineer-week per RN minor, twice a year, and name the owner.** With checked-in native
projects an upgrade is a manual three-way merge across `android/`, `ios/`, Gradle and the Podfile — and
per-tenant flavors multiply that surface. Use the React Native Upgrade Helper diffs.

**An RN app four versions behind is how a mobile codebase becomes unmaintainable.** The upgrade is not
optional maintenance; it is the thing that keeps every other decision in this document available.

### 12.3 Standards

| Area | Standard |
| --- | --- |
| TypeScript | `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride`. **No `any`; `unknown` + a type guard at boundaries** |
| Lint | ESLint + typescript-eslint, Prettier, **`eslint-plugin-boundaries`** (the §4/§9 import rules), `knip` (dead code) |
| Commits | Conventional Commits; squash merge; PR template referencing the screen spec and the `08-…` §7 checklist |
| Branching | Trunk-based off `develop`, short-lived branches, `main` = releasable |
| Errors | An `ErrorBoundary` per module, not one at the root — a crash in Rewards must not blank the app |
| Logging | No `console.log` in committed code (lint-enforced). Sentry breadcrumbs, PII scrubbed |
| Secrets | Never in the repo. `.env` per flavor, injected at build; **anything shipped in the binary is public** |
| Accessibility | Tap targets ≥ 48 dp, labels on every meaningful icon, layout survives 200% font scale, never colour alone |
| i18n | **Interpolate, never concatenate.** No string literals in components; `en` + `hi` land with each screen |
| Perf | FlashList everywhere, `React.memo` on list rows, stable `keyExtractor`, no style objects in render |
| a11y + perf | Verified on the **reference 2–3 GB device with its OEM skin**, not on a simulator |

### 12.4 The CI pipeline

```
lint → typecheck → api:gen --check (fail on contract drift)
     → test (domain, viewmodel, module-isolation matrix)
     → android + ios build
     → Maestro smoke on an emulator
     → [main] Sentry sourcemaps + OTA channel publish
```

**Gates that block merge:** typecheck, lint (boundaries included), contract-drift check, and the
module-isolation matrix. Those four are what keep this document true a year from now.

### 12.5 Release

- `develop` → internal QA track. `main` → store internal testing → closed beta with a real influencer
  cohort → staged rollout 5% → 25% → 100%.
- **Sentry release-health gate: halt the rollout below 99% crash-free sessions.**
- **Runtime version discipline for OTA.** A native change means a store release. Bump the runtime
  version and let mismatched clients ignore the update — a JS bundle calling a native module the
  installed binary lacks is the one way OTA hurts you.
- Watch Play Console vitals deliberately: at 5 lakh users, ANR and crash rates affect store visibility,
  not just user experience.

---

## 13. Phase 0 order

Nothing here is a screen, and everything here is expensive to retrofit.

- [ ] 1. **Prove OTA** — `expo-updates`, a JS change reaching a real device. Gates the stack (§2.6).
- [ ] 2. RN CLI project, New Architecture + Hermes verified, TS strict, flavors/schemes for four envs.
- [ ] 3. pnpm workspace; `packages/*` created empty with their boundary lint rules **landed at the same
      time as the folders** — the first violation otherwise arrives before the rule does.
- [ ] 4. `packages/tokens` generated from `docs/design-spec/tokens/*.css`; a colour change proven to
      propagate in one commit.
- [ ] 5. Lato bundled; `includeFontPadding: false` verified against the prototype on Android.
- [ ] 6. The 102-glyph icon set → typed SVG components.
- [ ] 7. `packages/api-client` generated, with the CI drift check failing on purpose once to prove it.
- [ ] 8. `packages/module-host` + registry + nav derived from it, one tenant, all modules entitled.
- [ ] 9. MMKV + SecureStore wired; query persistence proven across a cold start with no network.
- [ ] 10. The ~20 design-system primitives + the shell.
- [ ] 11. CI green end to end, including the module-isolation matrix.
- [ ] 12. Name the RN upgrade owner; book the twice-yearly slot (§12.2).

**Exit criterion:** an installable QA build that logs in with a real OTP, renders one screen at design
fidelity, survives a cold start with no network, and has taken a JS fix over the air.
