# 03 — API Integration & Client Data Rules

**This repo is frontend only.** Server internals — schema, migrations, caching, jobs, capacity — live in
`humbee_influencer_backend/docs/`, and the platform monolith is `hymbee-backend`. This document covers
only what the **client** must get right about data.

| Thing | Where |
| --- | --- |
| API contract (single source of truth) | **`../../humbee_influencer_backend/V2/`** — 15 endpoints, generated from the running backend. `contracts/openapi.yaml` is superseded wherever they disagree |
| Response examples | `../../humbee_influencer_backend/V2/examples/` — captured from the server, not written by hand |
| What changed from V1, and the 57 renamed keys | `../../humbee_influencer_backend/V2/00-what-changed.md`, `02-key-migration-map.md` |
| Screen → endpoint map, and requests per session | `../../humbee_influencer_backend/docs/07-screen-to-endpoint-map.md` |
| Envelope, pagination, error shape conventions | `../../humbee_influencer_backend/docs/05-api-conventions.md` |
| Auth and token semantics | `../../humbee_influencer_backend/docs/08-auth-and-security.md` |
| Design-time fixtures | `design-spec/data/*.json` |

---

## 1. The generated client

`packages/api-client` is **generated** from the OpenAPI spec with `openapi-typescript` — in V2 from the
running backend's `/openapi.json`, not a checked-in YAML — plus a thin hand-written wrapper that does
three things and nothing else: unwrap the response envelope, map errors, and turn a `401` into a session
reset. (V2 has no refresh endpoint and no `Idempotency-Key`: capture is online-only.)

**Wire format is `snake_case`, request and response.** There is no alias layer, so the field name is the
wire name and there is no mapping layer in the client either.

**Rules.**

- **Never hand-edit generated types.** If a type is wrong, the contract is wrong — fix it there.
- **Regeneration runs in CI and fails the build on drift.** A contract change that would break the app
  becomes a red build rather than a runtime surprise. This is the highest-value property of having the
  contract in TypeScript's reach, and hand-editing throws it away.
- One TanStack Query hook per endpoint, exported from `packages/api-client`. Screens import hooks, never
  a fetch call.
- **Query keys are `(screen, manufacturerId, period)`.** This is what makes a cached manufacturer switch
  instantly and an uncached one show a skeleton, which is exactly what the design specifies.

---

## 2. The server owns every number

The single most important client rule in this product, and the one most likely to be broken by someone
porting the prototype.

`design-spec/prototype/prototype-standalone.html` computes points, ranks, gaps, totals and formatted strings **on the
client, only so the design can be demonstrated without a server.** In the product every one of those
arrives computed:

| The prototype computes | The server field to use | From |
| --- | --- | --- |
| Rank, gap to top 10 | `me.rank`, `me.gap_to_top10`, `me.gap_label` | `GET /leaderboard` |
| Whether the podium shows | `show_podium` | `GET /leaderboard` |
| Points from a multiplier map | `points`, `points_label` | `GET /allocations`, `GET /rewards`. **Demands carry no points at all** — points post on allocation, so there is nothing to show on a claim |
| UOM conversion factors | `normalised_quantity`, `totals.quantity` | `GET /allocations`, demand rows |
| Period date windows | `period.from_date`, `period.to_date` | `GET /allocations`, `GET /rewards` |
| Status counts on filter chips | `counts[]` | `/rewards/summary` **only** — demands have no statuses and no summary endpoint |
| `en-IN` number formatting | the `*_label` fields | every endpoint |
| The per-SKU points rate | `points_hint` | `GET /demand-capture/manufacturers/{id}/products` |
| ~~The OTP resend timer~~ | **no longer served.** A client constant in `src/api/config.ts` — a gap, tracked as 15a in `06-inputs-needed.md` | — |

**If a screen needs a number the contract does not carry, that is a contract gap to raise — never a
client-side calculation to add.** A client that recomputes points will eventually disagree with the
ledger, and this product's entire value is one consistent view of data the influencer does not control.

---

## 3. Three invariants the client must respect

These are server rules. They are here because the client can violate all three by accident.

### 3.1 Role is resolved per industry, never global

An Influencer can be a **Barbender in Steel and a Contractor in Cement simultaneously**. Role belongs to
the `(influencer, industry)` pair, is assigned at onboarding, is **never self-declared**, and is resolved
at query time rather than stored on the allocation — so a corrected role label fixes history everywhere
at once.

**Client consequence:** never cache a role as a property of the user, never render a role without the
industry it belongs to, and never derive a role from the first allocation you happen to see.

**Status: this rule is currently unhonoured by the designed screens.** No handoff screen shows a role,
and the handoff's model has a single scalar `trade`. This is the highest-priority open product decision
— see `08-screen-inventory.md` §6 and `06-inputs-needed.md`. Until it is resolved, build the designed
screens as designed; do **not** invent a role tag.

### 3.2 The points ledger is append-only

Balances are derived or materialised, never mutated in place. A correction is a **compensating entry**,
not an edit.

**Client consequence:** points can go **down** after a correction. That is not a bug and it must not
look like one. A silently shrinking balance is the fastest way to lose this audience's trust, so the
decrease needs a designed notification and an explanation — currently unspecified, and tracked as an
open item.

### 3.3 Points conversion is configuration, not code

1 base unit = 1 point, where the base unit is per-industry (1 kg Steel, 1 bag Cement, 1 litre Paint) and
premium SKUs carry multipliers. All of it is Ops-editable **without an app release**.

**Client consequence:** never hardcode a ratio, a base unit, or a multiplier — not in a constant, not in
a test fixture that a screen reads, not in a comment that someone later copies. `/catalog/points-rules`
was **deleted** in V2; the identical block now arrives inline as `points_rule` on `GET /leaderboard`, and
the per-SKU rate as `points_hint` on the products call. Display what the server says.

**And points post only when a VCP allocates**, never on demand submission. V2 enforces this in the
contract rather than leaving it to copy: a demand row carries **no points field at all** — no
`expected_points`, no label, no total — so there is no number to mislabel. Do not compute one.

---

## 4. Running against the API

**There is no fixture mode.** `src/api/fixtures/` has been deleted: it existed so screens could
be built before the backend did, and the backend exists now. Every screen reads live data.

| | |
| --- | --- |
| Where the base URL lives | `src/api/config.ts` — one constant pair, `API_BASE_URL` + `PLATFORM_BASE_URL` |
| **What it is set to today** | `http://localhost:8001`, for every platform — the app is developed against a **USB-connected Android device** (Sep 2026) |
| **Android device over USB** | `localhost` works ONLY with a reverse port forward: **`npm run dev:reverse`** (or `adb reverse tcp:8001 tcp:8001` by hand). Without it `localhost` is the phone itself. It does NOT survive a replug, a reboot or `adb kill-server` — a "Network request failed" while Metro still serves the bundle is almost always this. `npm run start` and `npm run android` run `dev:reverse` first; after a mid-session replug, run it yourself |
| **When the app makes no request at all** | Not a network fault. If the JS runtime never starts there is nothing to make one — see `11-feature-reference.md` §8b-run2, where a foreign Metro on :8081 produces exactly that |
| Android emulator | `http://10.0.2.2:8001` — **`localhost` resolves to the emulator itself**, not the host running Docker. `10.0.2.2` is the AVD's alias for the host loopback |
| iOS simulator | `http://localhost:8001` — the simulator shares the host's network stack |
| iOS physical device | The host's LAN IP. There is **no `adb reverse` equivalent**, so `localhost` cannot work; the Mac and the phone must share a network and the backend must bind `0.0.0.0`, not `127.0.0.1` |
| Cleartext HTTP | Already allowed in debug via the `usesCleartextTraffic` manifest placeholder. A release build over plain HTTP will be blocked, as it should be |
| Is the backend up? | `npm run api:smoke` — logs in for real and calls all 11 endpoints the UI calls |

### The auth endpoints are encrypted, and the contract doc does not say so

`POST /auth/otp/request` and `POST /auth/otp/verify` **decrypt** `mobile_number` and `otp` inside
DTO validation — RSA, PKCS1-OAEP, SHA-256, base64 (`api/auth/helper/decryptor.py` in the
platform). The V2 reference shows plain digits, which fail with:

```
{"message":"Something went wrong. Please try again later.","error":true,"data":{}}
```

— no field, no code, and it looks exactly like a server fault. `src/api/crypto.ts` implements the
scheme with the same key and the same library as the VCP app
(`humbee-mobile-app/src/V2/Encryption/`), deliberately, so the two clients cannot drift into two
ciphers. **Only auth request bodies are encrypted; every response is plaintext.**

---

## 5. Statuses are closed sets, strictly ordered

```
Demand:  Submitted → Confirmed → Allocated → Closed
Gift:    Announced → In Shop   → Gifted    → Redeemed
```

- The influencer **can never change a status.** There is no UI for it.
- Colour is fixed by meaning, not by aesthetics — see `design-system/HUMBEE-DESIGN-RULES.md` §5.
- **An unknown status must not crash and must not render blank.** New statuses will reach the server
  before the app knows about them; render the raw label in a neutral chip and move on.
- Never pair a status with colour alone. Every status chip carries a label, and an icon where the design
  provides one.

---

## 6. Formatting — fixed rules, no local variation

| Kind | Rule |
| --- | --- |
| Numbers | `Intl.NumberFormat('en-IN')` — `21,400`, `1,404`, `15.21 Lakh`. Prefer the server's `*Label` when one exists |
| Quantities | One decimal for Ton (`8.4 Ton`); zero for Bags, Buckets, Cases, Kg, Litre, Units |
| Dates in UI | `12 Aug 2026` — day, short month, year. The API carries ISO; **IST is the display timezone**, stated explicitly rather than inherited from the device |
| Currency | `₹4,52,000` — Indian digit grouping |
| Points | Always signed or qualified: `+4,000 pts`, `900 pts expected` |
| Numerals in Hindi | **Latin digits in every language** unless research says otherwise — trade users read `500 kg` faster than `५०० kg`. Open item; confirm before locking |

Formatting helpers live in `packages/domain` and are unit-tested there. A `toLocaleString()` call inside
a screen is a defect.

---

## 7. Offline behaviour

Offline-first is a PRD requirement, and v1 has exactly three writes, which makes it tractable.

**Reads.** Cached via TanStack Query's MMKV persister and served **stale-with-indicator**. A cold start
with no network paints last-known Home rather than an error. Every data screen carries the offline
banner.

**Writes.**

| Write | Offline behaviour |
| --- | --- |
| `POST /auth/otp/verify` | Cannot be queued. Fail clearly |
| `POST /demands` | **Queue locally**, drain via `POST /demands/batch` on reconnect. Every item carries an `Idempotency-Key` generated at capture time — not at send time, or a retry creates a duplicate demand |
| `DELETE /me` | Requires network. Do not queue an account deletion |

**A queued write must never look like it succeeded.** The demand card shows an explicit **"Pending
sync"** state until the server confirms it. The success screen (07) renders the *server's* response —
which is also why the contract puts everything that screen needs in the `POST /demands` response body,
dodging replica lag.

---

## 8. Security and DPDP — the client's share

| Concern | Rule |
| --- | --- |
| Token storage | Access token **in memory**; refresh token in `expo-secure-store` (Keychain / EncryptedSharedPreferences). **Never** MMKV, AsyncStorage or plain files |
| Logging | Never log a token, an OTP, or a full mobile number. Mask to the last four digits in any log, breadcrumb or Sentry event |
| Sentry | Scrub PII before send. An influencer's name and number must not reach a crash report |
| Screens | No screenshot of an OTP screen in analytics or session tooling |
| Deletion | `DELETE /me` is OTP-gated and sits behind Profile's "Advanced" disclosure — deliberately not surfaced directly |
| Consent | The leaderboard shows one influencer's standing to peers. PRD §4.9 requires an opt-out and privacy copy; it is a **blocking pre-launch item**, not a Phase 2 nicety |
| Legal | Privacy Policy and Terms must be reachable **without login** |
