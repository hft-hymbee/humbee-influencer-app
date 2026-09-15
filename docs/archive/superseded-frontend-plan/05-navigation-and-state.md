# 05 — Navigation and state

## 5.1 Route tree

The handoff's navigation graph (docs/06) maps to Expo Router groups. The group parentheses are what
give the two login screens no bottom nav without a second navigator being hand-wired.

```
src/routes/
├── _layout.tsx              Root stack. Providers + the cold-start route guard.
├── (auth)/                  No bottom nav.
│   ├── phone.tsx            login-phone
│   └── otp.tsx              login-otp     ?phone=98220…   (Change → back, number retained)
├── (app)/                   Bottom nav present. Five tabs.
│   ├── home.tsx             home
│   ├── leaderboard.tsx      leaderboard   ?mfr=welspun
│   ├── demand/
│   │   ├── index.tsx        demand        ← tab target
│   │   └── list.tsx         demands
│   ├── inventory.tsx        allocation    ?mfr=&period=
│   └── rewards.tsx          rewards       ?mfr=&period=&status=
├── demand-done.tsx          Full screen, outside (app) → no bottom nav, per the handoff
└── profile.tsx              Pushed from the header person icon only
```

Three rules from the handoff that need explicit implementation, because no router does them by
default:

1. **The Demand tab stays active on `demand`, `demands` *and* `demand-done`.** Since `demand-done`
   sits outside the tab group it has no tab state at all, and `demands` is a sibling route rather
   than the tab's index. Set the tab's active state from a derived selector —
   `activeNav = pathname.startsWith('/demand') ? 'demand' : segment` — rather than from the
   navigator's own focus.
2. **Verify replaces the auth stack.** `router.replace('/(app)/home')`, never `push`. QA:
   *"never returns to login after auth."*
3. **Android hardware back.** On `home` it should exit the app, not pop to login. On `demand-done` it
   should behave as "Capture Another Demand" or go to `demands` — not return to a submitted form.
   Both need explicit `BackHandler` behaviour; the default is wrong in both cases.

## 5.2 Deep links

The handoff recommends `humbee://leaderboard?mfr=welspun`, `humbee://demands`,
`humbee://rewards?status=InShop` — these matter because the programme sends SMS and WhatsApp
notifications, which is how a field influencer actually re-enters the app.

With Expo Router these are the file paths, so there is no linking config to keep in sync. What does
need building:

- **`scheme: 'humbee'`** in `app.config.ts`, plus Android App Links and iOS Universal Links for
  `https://` variants later (a raw custom scheme in a WhatsApp message is often not tappable).
- **A deferred-link guard.** A deep link arriving while unauthenticated must stash the intended route,
  run the login flow, and resume — not drop the link. Implement once in the root `_layout.tsx`.
- **Query-param validation.** `?mfr=` is attacker-controlled input from an SMS. Validate against the
  catalog before it reaches a query key, or a malformed link becomes a cache-poisoning bug.

## 5.3 The state split

The handoff's §06 state shape mixes three genuinely different kinds of state. Keep them separate;
collapsing them into one store is the mistake that makes the loading rules in §5.4 impossible.

| Handoff field | Kind | Owner |
| --- | --- | --- |
| `screen` | Navigation | The router. Never mirrored in a store |
| `phone`, `otp` | Ephemeral form | Local `useState` in the screen |
| `mfr`, `period` | **Persisted** selection | Zustand `selection` slice + MMKV |
| `giftFilter`, `demandFilter`, `pointsOpen`, `banner`, `advancedOpen` | Ephemeral UI | Local `useState` |
| `loading` | **Derived** | TanStack Query `isPending`. Never stored |
| `industry`, `sub`, `dmfr`, `cat`, `sku`, `qty`, `uom` | Session-scoped draft | Zustand `demandDraft` slice, **not** persisted |
| Everything server-owned (rows, points, ranks, gifts) | Server cache | TanStack Query |

### Why `mfr` and `period` are persisted

Handoff §06: *"field users work with one manufacturer for weeks."* Persist both through MMKV so a
cold start lands on the manufacturer the influencer actually cares about. Persist nothing else.

### Why `demandDraft` is not persisted

Handoff §06: *"Do not persist demand-in-progress selections beyond the session unless the offline
queue is implemented."* Once the outbox in `06-data-layer-and-api.md` §6.6 exists, a **submitted**
demand is durable; a half-filled form deliberately is not, because a stale draft resurfacing days
later against a changed catalog is worse than an empty form.

### Reset rules

The handoff's reset table is a cascade, and it is the highest-risk logic in the app — a missed reset
means a demand submitted with a SKU from the previous manufacturer. Implement it as **one action per
user event** on the `demandDraft` slice, never as scattered setters:

```ts
chooseIndustry(id)  // clears sub, dmfr, cat, sku, qty, uom
chooseSub(id)       // clears dmfr, cat, sku, qty, uom
chooseManufacturer(id) // clears sku, uom
chooseCategory(id)  // clears uom
reset()             // "Capture Another Demand"
```

Unit-test the cascade directly against the handoff's table. It is pure state — the cheapest thing in
the app to test and the most expensive to get wrong.

### Derived values are selectors, never stored

`hasMfr`, `noMfr`, `showQty`, `demandInvalid`, `uomList`, `activeNav` — all computed. The handoff says
so explicitly (*"compute, never store"*), and storing them is how the demand fork gets out of sync
with the catalog.

## 5.4 Loading, and the three rules that are easy to get wrong

The handoff's loading behaviour is unusually precise, and it maps exactly onto TanStack Query if the
query keys are right.

| Trigger | Behaviour | Implementation |
| --- | --- | --- |
| Enter a data screen | Skeleton in the scroll body; header and nav stay live | `isPending` on that screen's query |
| Switch manufacturer | Skeleton — *unless already cached, then instant* | `mfr` is part of the query key |
| Switch period | Skeleton | `period` is part of the query key |
| Switch status filter | **No skeleton** | Filter is `useMemo` over data already in cache. Never a refetch |
| Submit demand / request OTP | Button loading state | `isPending` on the mutation |
| Login, Demand Captured | Never a skeleton | No query on those screens |

Three specifics:

1. **The skeleton replaces only the scroll body.** Header and bottom nav must stay mounted and
   tappable. Structurally this means the skeleton lives *inside* the screen component, below the
   shared shell — not as a full-screen route state. Get this wrong and every QA row about "keeps the
   header live" fails at once.
2. **Paint at least one skeleton frame.** Handoff: *"If a response arrives in under ~150ms, still
   paint one skeleton frame rather than flashing."* A cached response resolving synchronously should
   render content directly (no skeleton at all); a network response resolving in 40ms should not
   flash. These are different cases — distinguish them by whether the query had cached data.
3. **Failure after a skeleton shows the retry card in the same position**, never an empty state.
   `ErrorRetryCard` and `EmptyState` are different components with different copy, and confusing them
   tells a user with a dead connection that they have earned no rewards.

## 5.5 Query keys

One factory, one file. Ad-hoc key arrays scattered across features are how cache invalidation stops
working.

```ts
// shared/api/keys.ts
export const keys = {
  me:            ()                      => ['me'] as const,
  config:        ()                      => ['config'] as const,
  home:          ()                      => ['home'] as const,
  catalog:       ()                      => ['catalog', 'industries'] as const,
  skus:          (mfrId: string)         => ['catalog', 'skus', mfrId] as const,
  pointsRules:   (mfrId: string)         => ['catalog', 'points-rules', mfrId] as const,
  leaderboard:   (mfr: string)           => ['leaderboard', mfr] as const,
  allocations:   (mfr: string, p: Period)=> ['allocations', mfr, p] as const,
  allocSummary:  (mfr: string, p: Period)=> ['allocations', 'summary', mfr, p] as const,
  rewards:       (mfr: string, p: Period)=> ['rewards', mfr, p] as const,
  rewardsSummary:(mfr: string, p: Period)=> ['rewards', 'summary', mfr, p] as const,
  demands:       ()                      => ['demands'] as const,
  demandsSummary:()                      => ['demands', 'summary'] as const,
  demand:        (id: string)            => ['demands', id] as const,
} as const;
```

The prefix hierarchy is deliberate: after a successful demand submit, invalidating `['demands']`
refreshes both the list and its summary in one call, and leaves the leaderboard cache — which the
server has not updated yet, since points post on *allocation* — untouched.

## 5.6 Cold start

The sequence on app launch, in order, because getting it wrong produces a login-screen flash on every
open — the single most-noticed polish defect in an app like this.

1. Splash screen held (`expo-splash-screen`, `preventAutoHideAsync`).
2. Read the token from SecureStore and `mfr`/`period` from MMKV — MMKV is synchronous, SecureStore is
   not, so this is one `await`.
3. Load fonts (`useFonts`) and hydrate the persisted query cache.
4. Route: valid token → `/(app)/home`; expired but refreshable → refresh, then home; nothing →
   `/(auth)/phone`. Handoff: *"On cold start with a valid token, land on Home without showing login."*
5. Hide the splash only after the destination route has painted its first frame — which, on a data
   screen, is the skeleton. Hiding earlier shows a white flash.
