# 06 — Data layer and API

## 6.1 The advantage of co-location

`../contracts/openapi.yaml` is in this repository — 22 endpoints, 20 paths, three server URLs
including a mock seeded from `contracts/examples/*.json`. The data layer's design follows from that:
**the client never hand-writes a response type.**

```
contracts/openapi.yaml  ──openapi-typescript──▶  src/shared/api/generated/schema.d.ts
                                                          │
                                    openapi-fetch ────────┴──▶ typed client
```

`scripts/gen-api.ts` runs `openapi-typescript`; CI re-runs it and fails on a diff. A backend
developer who renames `pointsEarned` breaks the mobile build **in their own pull request**, which is
the entire reason the app lives in this repo.

Why `openapi-fetch` rather than a heavyweight generator (openapi-generator, orval's full client): it
emits no runtime code per endpoint — it is a ~5 kB typed wrapper over `fetch` that reads the generated
types. Nothing to regenerate into a 400-file client, nothing to review.

## 6.2 The envelope

The platform envelope (`../docs/05-api-conventions.md`) is unusual and the client must handle it
deliberately:

```json
{ "message": "Allocations fetched successfully", "error": false, "data": { … } }
```

- **HTTP 200 for every business outcome.** A wrong OTP is a 200 with `error: true`.
- **`data.code` is the machine-readable branch point**; `message` is localised human copy that must
  never be compared against.
- **401 is the one transport-level exception**, deliberately, so the refresh interceptor has a signal.
- **422 is FastAPI DTO validation** — a client bug, not a user error.

The client wrapper therefore does one job before anything else sees a response:

```ts
// shared/api/client.ts (shape, not final code)
async function request<T>(path, init): Promise<T> {
  const res  = await fetchWithTimeout(path, withAuth(init));   // 10s connect, 20s total
  if (res.status === 401) throw new UnauthorizedError();        // → refresh interceptor
  if (res.status === 422) throw new ContractError(await res.json()); // → Sentry, not the user
  const body = await res.json() as Envelope<T>;
  if (body.error) throw new ApiError(body.data?.code ?? 'UNKNOWN', body.message);
  return body.data;
}
```

Two consequences worth stating:

1. **Screens never see the envelope.** A screen receives `data` or an `ApiError` with a `code`. No
   feature file should contain the string `"error"`.
2. **`ApiError.code` is what the UI branches on**, and the handoff needs exactly this: `OTP_INVALID`
   → clear boxes and re-focus; `OTP_EXPIRED` → different copy and enable resend; `NOT_REGISTERED` →
   different copy again. Three distinct behaviours the `message` string cannot safely distinguish.
3. **`ContractError` is telemetry, not UX.** A 422 means the app sent something the DTO rejected —
   report it to Sentry with the path and show a generic failure. Never surface a validation dump.

## 6.3 Auth

| Concern | Approach |
| --- | --- |
| Storage | Access + refresh token in `expo-secure-store` (Keychain / EncryptedSharedPreferences). Handoff §06 forbids plain storage |
| Attach | `Authorization: Bearer` added by the client wrapper. No screen touches a token |
| Refresh | On 401: **single-flight**. The first 401 starts one refresh; every concurrent request parks on that promise and retries once when it settles |
| Refresh failure | Clear session, clear the query cache, `router.replace('/(auth)/phone')`. Never loop |
| Logout | `POST /auth/logout` (best-effort, fire and forget), then clear SecureStore, MMKV session keys and the whole query cache |
| Delete account | `DELETE /me`, requires a fresh OTP per the contract. Confirmation must name the consequence (QA) |

The single-flight detail is not optional. A data screen mounts three queries at once (list, summary,
catalog); a naive per-request refresh fires three refreshes, and a server that rotates refresh tokens
invalidates two of them and logs the user out on every token expiry.

## 6.4 Caching

TanStack Query defaults, tuned for a field device on intermittent 4G:

```ts
new QueryClient({ defaultOptions: { queries: {
  staleTime: 60_000,           // a leaderboard is not real-time; 1 min avoids refetch storms
  gcTime: 24 * 60 * 60 * 1000, // survive a day so a cold start on no network still paints
  retry: 2,
  retryDelay: a => Math.min(1000 * 2 ** a, 8000),  // exponential, capped
  refetchOnWindowFocus: false, // on mobile this fires on every app foreground — too aggressive
  refetchOnReconnect: true,    // this one is exactly right for the audience
}}});
```

Per-endpoint overrides where the data's nature differs:

| Query | `staleTime` | Reasoning |
| --- | --- | --- |
| `config`, `catalog/industries` | 24 h, with the contract's catalog version as the invalidation trigger | Reference data. Refetching it on every demand entry wastes the user's data plan |
| `me` | 1 h | Changes only on the ops platform |
| `home`, `leaderboard` | 60 s | The default |
| `demands`, `allocations`, `rewards` | 60 s, plus explicit invalidation after a submit | Correctness after a write matters more than freshness before one |

**Persistence.** Persist the cache to MMKV with `@tanstack/query-persist-client`, with two rules:
persist reference and read data; **never persist `me` or anything derived from a token**, and clear
the persister on logout. A persisted cache surviving a logout is a data-leak on a shared phone, which
in this audience is a realistic scenario.

## 6.5 Pagination

Cursor-based in the contract (`{ nextCursor, pageSize, hasMore }`), so `useInfiniteQuery` with
`getNextPageParam: last => last.pagination.nextCursor ?? undefined`.

Counts and totals come from the sibling `/summary` endpoint, not from the list — which is why the stat
tiles on Inventory Allocated must read the summary query and never `items.length`. A tile computed
from a first page shows "3" when the answer is 340.

## 6.6 Offline

Required by QA: *"Offline banner + retry on every data screen."* Three separate mechanisms.

1. **Reads.** The persisted cache plus `refetchOnReconnect` means a cold start with no network paints
   yesterday's leaderboard rather than an error. Show the offline banner above it; do not blank the
   screen.
2. **Writes — the outbox.** A demand captured on a site with no signal must not be lost. Queue the
   mutation in MMKV, show it in My Demands with a local `Pending sync` treatment, and drain on
   reconnect. Two details that decide whether this is safe:
   - **Idempotency key per queued demand**, generated client-side, sent on submit. Without it, a
     retry after an ambiguous timeout double-submits — and every duplicate demand becomes a support
     ticket about points.
   - **Validate against the catalog at drain time, not at queue time.** A SKU can be withdrawn while
     the phone is offline. A drain that fails should surface as an actionable error on the demand, not
     a silent drop.
   Note this is Phase 4 work in `12-implementation-roadmap.md`, and note that until it exists the
   demand form must simply refuse to submit offline with clear copy. A submit button that appears to
   work offline and loses the demand is worse than no offline support.
3. **Detection.** `@react-native-community/netinfo`. Treat "connected but no internet" as offline —
   `isInternetReachable`, not `isConnected`. Captive portals and dead 4G cells are the normal case
   here, not the exception.

## 6.7 Fixtures before network

Handoff CLAUDE.md rule 6: wire every screen to `data/*.json` first. This is also the fastest path to
a demo. Two levels:

- **Development:** an `EXPO_PUBLIC_API_MODE=fixtures` switch inside `shared/api/client.ts` that
  resolves from `fixtures/` with an artificial 900ms delay — matching the prototype's own skeleton
  timing so loading states are visible during development instead of only in production.
- **Tests:** **MSW** with handlers seeded from `../contracts/examples/*.json`. Those examples are
  generated from the same fixtures the design used, so a test asserting on a rendered row is
  asserting against the design's own data. That is a stronger guarantee than a hand-written mock, and
  it is another dividend of co-location.

Both must go through the same client wrapper as production, so envelope handling, error mapping and
`en-IN` formatting are exercised in every mode.

## 6.8 Formatting is a data-layer concern

`shared/format/` — not per screen, because the handoff makes these product rules.

| Rule | Implementation |
| --- | --- |
| `en-IN` digit grouping everywhere (`21,400`) | `Intl.NumberFormat('en-IN')`. Hermes ships full ICU, but verify on a physical Android device early — a stripped ICU build silently falls back to US grouping, and the bug looks like a data problem |
| `₹` with Indian grouping | Same formatter, `style: 'currency', currency: 'INR', maximumFractionDigits: 0` |
| Quantity | The contract sends `{value, uom}` plus a normalised value. Render the pair; **never** recompute the normalisation client-side. Handoff rule 4: the server owns the numbers |
| Points, ranks, multipliers | Display only. No client arithmetic, ever |
| Mobile number | `+91 98220 14576` on Profile; unmasked full number on the OTP screen (QA) |
| Dates | ISO-8601 in, `en-IN` out. One formatter, not `toLocaleDateString` scattered across features |
