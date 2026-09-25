# 11 — Feature Reference

**Claude: read this before touching any module.** It is the per-module map — where the code is,
what the rules are, what the API gives you, and what is deliberately absent. It exists so a
session can start work on one screen without re-reading the whole doc set.

| | |
| --- | --- |
| **Design spec of record** | `docs/design-spec/04-screens/NN-*.md` — read the screen's own spec before editing it |
| **API contract** | **`../humbee_influencer_backend/V2/`** — 15 endpoints, captured examples in `V2/examples/`. `V2/00-what-changed.md` is the migration list; `V2/02-key-migration-map.md` is the 57-key rename table. **The older `contracts/openapi.yaml` is superseded wherever the two disagree** |
| **Build manual** | `docs/10-rn-cli-implementation-guide.md` |
| **Module/SaaS rules** | `docs/09-saas-and-module-architecture.md` |

---

## 0. Six rules that outrank anything you infer from the code

1. **The server owns every number.** Points, ranks, gaps, `showPodium`, totals, UOM
   normalisation, period windows, status counts and every `*Label` arrive computed. The HTML
   prototype computes them client-side *only so the design can be demonstrated*. **Never port
   that arithmetic.** A missing number is a contract gap to raise, not a calculation to add.
2. **Points post only when a VCP allocates.** V2 takes this further than the app did: a demand
   row carries **no points field at all**, and no status either, so there is nothing to label as
   an expectation. The only points the UI renders are allocated ones, and the server sends the
   composed string. Do not reintroduce an expected-points line.
3. **No sign-up path anywhere.** No "Create account", no country-code selector, no e-Pin, no
   password. Verified by inspection every release.
4. **Do not add features.** No search, no header notification bell, no chat, no referral. Their
   absence is deliberate (`docs/design-spec/01-product-and-scope.md` §Excluded).
5. **No invented design values.** Everything comes from `src/theme`. A raw hex or magic number in
   a view is a defect. When two specs disagree, `docs/02-design-system.md` §3 has already ruled.
6. **A module may never import another module.** Modules are sold separately; an import makes
   two modules one product.

---

## 1. Where the code lives

Industry-standard RN layout — Components / API / Views — with the four-layer discipline from
`docs/10` §3 expressed through the folder a file sits in.

```
src/
├── api/          API LOGIC. client, errors, keys, queryClient, types, fixtures, endpoints/
├── components/   COMPONENTS. The design-system primitives. No screen logic, no data fetching
├── views/        VIEWS. One folder per module: screens/ (View) + use*.ts (ViewModel)
├── domain/       Pure TS. No React, no react-native imports. Where the rules live
├── store/        Zustand stores + MMKV + Keychain (no outbox — V2 capture is online-only)
├── theme/        Tokens: colors, typography, layout, ThemeProvider
├── modules/      The module registry — THE ONLY PLACE A MODULE IS NAMED
├── navigation/   Root stack, tabs (built from the registry), deep-link config
├── i18n/         Message catalogues
└── assets/       img/ · lottie/ · fonts/ (empty — see §8)
```

**The layer rule:** `View → ViewModel → Data → Domain`, dependencies pointing one way only.
A screen component must not call `useQuery`, do arithmetic, or call `toLocaleString()`.

---

## 2. Module map

Each row: the screens, the code, the endpoints, and the one thing most likely to be got wrong.

### `home` — screen 03 · always mounted

| | |
| --- | --- |
| Code | `src/views/home/HomeScreen.tsx`, `useHomeScreen.ts` |
| Spec | `docs/design-spec/04-screens/03-home.md` |
| API | `GET /home` — **one call fills the screen**, and the only read that is *not* manufacturer-scoped |
| Watch out | **Home links to every other module, so it must adapt when they are absent.** Quick links are derived from entitlements (`useHomeScreen`), never a hardcoded array. `GET /home` should also return only entitled sections — that is an open contract item |

Quick links sit **above** My Rewards, and the carousel is full width. Both were explicit client
decisions — do not reorder them. A long influencer name **wraps**; never truncate it.

### `leaderboard` — screen 05

| | |
| --- | --- |
| Code | `src/views/leaderboard/` — `LeaderboardScreen.tsx`, `useLeaderboardScreen.ts`, `components/{Podium,LeaderboardTable,StickyMeCard,PointsExplainer}.tsx` |
| Spec | `docs/design-spec/04-screens/05-leaderboard.md` |
| API | `GET /leaderboard?manufacturer_id=&company_esi_id=` — **no period param** |
| Watch out | **NO time or date filter.** This is the live standing; do not add `PeriodPills`. `rank`, `gap_to_top10`, `gap_label` and `show_podium` are server-computed. Rank marks are hexagons for **all** ranks — only the colour changes for the top three |

The sticky current-user card is **always** visible, even inside the top 10. V2 composes the gap
**sentence** server-side as `gap_label` for all three variants (in top 10 / outside / unranked),
so the client no longer assembles that string — the copy question it used to work around is
closed by the contract.

`points_rule` arrives **inline on this payload**. The standalone `/catalog/points-rules` endpoint
was deleted, so `PointsExplainer` reads it from here and there is no second way to fetch it.

### `demand` — screens 06, 07, 08 · the core action

| | |
| --- | --- |
| Code | `src/views/demand/` — `DemandTabScreen.tsx` (tab host), `CaptureDemandScreen.tsx`, `MyDemandsScreen.tsx`, `DemandCapturedScreen.tsx`, `useCaptureDemand.ts`, `components/{ModuleTabs,DemandTrail,PickCards}.tsx` |
| Rules | `src/domain/demand.ts` — **all derivation and every reset rule** |
| Spec | `docs/design-spec/04-screens/06-capture-demand.md`, `07-demand-captured.md`, `08-my-demands.md` |
| API | `GET /demand-capture/industries`, `GET /demand-capture/manufacturers/{id}/products`, `POST /demand-capture/demands`, `GET /demand-capture/demands?manufacturer_id=` |

**This module changed the most in V2. The six things that break it:**

1. **The payload is two levels — the SCREEN is one.** V2 flattened sub-industries away, and with
   them the "no manufacturer onboarded, HUMBEE will route it" branch: the industry list already
   arrives filtered to manufacturers active in the caller's region, so an industry with nothing
   behind it never appears. There is no `sku_category_id` on the wire any more.
   **The industry step was then removed from the screen entirely** (client decision, Sep 2026 —
   this DIVERGES from `docs/design-spec/04-screens/06-capture-demand.md`, which still shows an
   Industry grid as step 1). `allManufacturers()` in `domain/demand.ts` flattens the tree and
   dedupes by id — a brand listed under two industries is one tile — and the picker opens
   straight onto a grid of manufacturer logo tiles, name beneath. The industry is not lost: it
   rides on each entry, is recorded on the draft when a tile is tapped, and is what the trail
   still shows beside the manufacturer name ("CEMENT · DALMIA BHARAT CEMENT").
2. **Products are a separate call** for the chosen manufacturer, not embedded in the tree. Their
   `uoms` is what the API validates against, so it outranks the manufacturer's copy of the list.
   **The SKU list is not cached** (`staleTime: 0`, client decision Sep 2026): every manufacturer
   pick hits `GET /demand-capture/manufacturers/{id}/products`, including re-picking one chosen a
   moment ago. SKUs and `points_hint` move without `catalog_version` moving, and a demand raised
   against a withdrawn SKU is rejected at submit — one small request per pick is cheaper than
   losing a capture.
3. **A submission is a LIST of products and is ATOMIC.** Each line becomes its own demand row; if
   any line fails validation nothing is stored, so a receipt can never show a phantom product. A
   product may appear **only once** per submission — enforced in `domain/demand.ts`, not by a
   round trip.
4. **Capture is ONLINE-ONLY.** No `client_ref`, no `Idempotency-Key`, no batch drain, no outbox —
   without a client ref a replay cannot be made safe. `feature_flags.offline_demand_queue` is
   false. A failure keeps every selection on screen instead of queueing.
5. **The submit body carries a `district_id`, and there are TWO districts that are not
   interchangeable.** Send the one from `GET /demand-capture/industries` — the district the
   influencer **trades** in, the VCP behind their last allocation, and the only district the
   picker's manufacturers are active in. **Never** `GET /me`'s `influencer.district_id`, which is
   where they **registered**: for a mason onboarded in one district but buying through the next
   one's VCPs these differ, and `/me`'s value files the demand against a district that never
   offered them that manufacturer. The server validates only that the id names a *real* district,
   not that it is the caller's, so whatever the app sends is what per-district demand reporting
   shows. It is read live from the industries query at submit time (`useCaptureDemand.ts`) rather
   than snapshotted into the draft, so a cached tree cannot carry a stale district into a submit.
   The field is optional on the wire **only** as a shim for builds predating it; new builds always
   send it. `DISTRICT_INVALID` ⇒ nothing stored, the industry tree is invalidated by the mutation's
   `onError` and the user re-picks.
6. **A demand is raised FOR A CONSTRUCTION SITE, and the site is a CART-level property.** One
   site per submission, shared by every line (spec R1), because the user picks a location once
   and then ticks the SKUs they need there. Submit is blocked until it exists (R2). The flow is
   `SiteCaptureFlow` — map picker → search → address form — at `src/views/demand/site/`, and it
   is one root route because the three screens share a single pin.
   - **The pin is the source of truth** (R3). `GET /address/reverse-geocode` turns it into the
     platform's geography, and **the IDS are what get sent** — `pincode_id` is the anchor, and
     the server derives the stored state and district from it. A `district_id` or `state_id`
     that contradicts the pincode is **rejected**, not corrected, so those three fields are
     rendered READ-ONLY on the address form and the pin is how they change.
   - **`site.district_id` is not the body's `district_id`** (see rule 5). Top level = where the
     influencer trades; `site` = where the material is going. Both are sent, from their own
     sources, and nothing reconciles them.
   - **All or nothing.** `siteInput()` in `domain/site.ts` returns `undefined` rather than a
     partial block, so an incomplete site cannot reach the wire. `SITE_ADDRESS_INVALID` ⇒
     nothing stored, and the user goes back to the map.
   - **A geocode can succeed and still be unusable:** a null `pincode_id` means there is nothing
     to derive from. That arrives as a SUCCESS, so `isPinServiceable` is what turns it into "we
     do not serve this location".
   - **The OS location prompt fires only from an explicit "Use Current Location" tap** (R4),
     never on screen entry, and a denial is never a dead end (R5) — the manual pin completes the
     whole flow. All of it is behind `src/platform/location.ts`; no screen touches GPS directly.
     **There is no in-app rationale dialog** — the system prompt already asks the same question
     with the same three choices, so ours went first and could grant nothing. Spec S3 is
     superseded; see the note at the top of `docs/construction-site-address-capture.md`.
   - **The map opens on New Delhi** (Connaught Place, 28.6139 / 77.2090) at street zoom when
     there is no site on the draft and no fix yet. It is a CAMERA POSITION, not a pin: the sheet
     stays empty and Confirm stays disabled until the user moves the map or takes a fix, so a
     default cannot be confirmed as an address nobody chose. The pin itself is fixed to the
     screen centre and the MAP moves under it (`CentrePin`) — one-handed, and never a precise
     touch on a small target.
   - **A pin the user did not drag has to move the CAMERA, not just the state.** The mark is
     nailed to the centre of the screen, so setting `pin.coords` from a GPS fix or a search
     result moves nothing the user can see — the mark keeps sitting over whatever was already
     under it and silently stops describing the address in the sheet. `useSiteCapture` raises a
     `cameraTarget` and the screen animates there; it is keyed on a nonce so a second tap
     re-centres. **This is the whole of "Use Current Location".**
   - **The camera settling is not a drag.** `animateToRegion` finishing fires
     `onRegionChangeComplete` exactly like a thumb does, and `movePin` demoting that to
     `manual_pin` wipes the fresh fix and its accuracy circle the instant it lands.
     `onRegionChangeComplete`'s **`isGesture`** tells them apart, with a 3e-5° (~3.3 m)
     tolerance where the platform omits it (Apple Maps).
   - **The TIP is the coordinate.** `CentrePin` anchors with `bottom: '50%'` so the point lands
     on the map centre. Centring the whole mark instead — the obvious thing — puts the tip half
     a pin below the coordinate the sheet is describing, about 25 m at street zoom.
   - **Maps: Google on Android** (needs `HUMBEE_MAPS_API_KEY` — a blank key builds and renders a
     grey map, which is the first thing to check if the picker comes up empty) **and Apple Maps
     on iOS**, which needs no key. iOS also needs `pod install` for `react-native-maps` and
     `@react-native-community/geolocation`. The key needs **both** the Maps SDK for Android and
     the **Places API** enabled — separate console toggles, and a Geocoding-only key makes every
     address search fail with `ADDRESS_SEARCH_FAILED` while the map itself looks fine.
   - **GPS is a two-stage fix**: high accuracy for 8s, then coarse for 12s. High accuracy alone
     times out indoors while the OS *has* a wifi/cell position it is declining to hand over —
     which is what "Could not get a fix" looked like with a location icon lit in the status bar.
     A coarse fix is not a failure: it lands the map within a block, and the user was always
     going to nudge the pin onto the gate.
   - **Changing manufacturer or products KEEPS the site** (R6); clearing the cart clears it.
   - **Search is two calls, and a suggestion is not an address.** `GET /address/search` returns
     candidates with a `place_id` and no coordinates; `GET /address/places/{place_id}` resolves
     the tapped one into the reverse-geocode shape, and the app primes the reverse-geocode cache
     with it so the map reads it as a dropped pin. Do NOT re-geocode a picked place: the place
     endpoint substitutes the tapped name for `address_line_1` where the geocoder would return
     a plus code or a bare pincode, and re-resolving throws that away. One `session_token`
     (client-generated) spans both calls — that is what Google bills as one session. Minimum 3
     characters, 300 ms debounce; both are the server's rules and cost a billable request each
     if ignored. `PLACE_NOT_FOUND` is expected, not exceptional — ids expire; re-search rather
     than retry. These endpoints are **missing from `V2/01-api-reference.md`** — see the backend
     repo's `design_docs/influencer.md`.
   - Still not built, for want of an endpoint: saved sites (R7). `docs/06-inputs-needed.md` 15i.
7. **A demand row carries its `site`, and `formatted_address` is what the card shows.** The
   server's line is already de-duplicated — a geocode repeats the locality in `address_line_2`
   and again as the location name — so it is preferred over joining the parts. `site` is **null**
   for demands captured before sites existed; those rows render **without** the address block
   rather than being hidden. It is shown **whole**, under a "Construction site address"
   overline, and is deliberately NOT truncated: a cut-off address is not an address, and it is
   the one field on the card someone may have to act on.
8. **Every demand carries an ePIN — the code the influencer READS OUT to a VCP** to confirm an
   allocation against it. Four digits today, but the length is server config, so never lay out
   for a fixed count. It is on the influencer's own list and on no other endpoint: a dealer who
   could read it would not need to ask, and the asking is what records the influencer's
   agreement. **It rotates after every action on the demand**, so the app renders what the
   latest read returned and never shows a cached one — `demand-capture` queries are excluded
   from the persisted cache and the list carries `staleTime: 0` for exactly this reason. A code
   shown from a stale list is rejected, and the influencer reads it out twice before anyone
   suspects the app. `attempts_remaining` is surfaced only once it is low: at zero the demand
   cannot be verified until the code rotates, and the influencer is the only person positioned
   to notice. Rendered Uber/Rapido-style — digit boxes, above the address block on the card.
9. **`fulfilment` IS the demand status, and it is rendered.** `OPEN` /
   `PARTIALLY_FULFILLED` / `FULFILLED`, derived server-side from allocations. This supersedes
   V2's "a demand carries no status" and the no-chip design built on it (client decision, Sep
   2026). Colour comes from `fulfilmentStyle()` keyed on the STABLE `status`; the visible text
   is `status_label`, which is localised — colouring by the label would leave a Hindi build
   grey. **Never derive the status from the quantities**: the rule is `allocated >= demanded`,
   it belongs to the VCP order system, and it lives on the server so the two cannot drift.
   It is **not** the PRD's Submitted → Confirmed → Allocated → Closed chain; `Confirmed` needs
   an acknowledgement nothing emits, so do not map three states onto four. A row without
   `fulfilment` renders no chip rather than a fabricated "Open".
10. **A demand carries no status, no points and no VCP.** My Demands therefore has no status chips,
   no stat tiles and no points line, and it **is** manufacturer-scoped (`manufacturer_id` is
   required and there is no cross-manufacturer list). Rebuilding any of the removed fields would
   mean inventing them.

**The My Demands card, top to bottom:** product + manufacturer · date with the fulfilment chip
top-right → the ePIN block → the construction-site address → the quantity pair. The bands are
separated by whitespace and one hairline, not by boxes; the ePIN is the only tinted surface on
the card, which is what makes it findable when a dealer is standing there waiting for it.

**A demand draft is cleared at two points, and both are deliberate.** On a SUCCESSFUL
submission, the instant the server accepts it (`useCaptureDemand.submitDemand`) — V2 capture
carries no `client_ref`, so a duplicate cannot be de-duplicated server-side, and a filed cart
left on screen is a cart that can be filed twice. And on ENTERING the New Demand tab
(`DemandTabScreen`), so arriving at the screen always starts a new demand rather than resuming
a stale one still carrying another job's site address. The second does NOT fire when the
site-capture flow returns: that route is pushed over the tabs, so the tab never re-enters
'new'. A rejection clears nothing — the submission is atomic, so every selection is still
exactly what the user meant.

**Signing out is a teardown, not a status flip.** `resetUserStateOnSignOut()`
(`src/store/resetOnSignOut.ts`) drops the TanStack Query cache, resets the demand draft and the
persisted selection **in memory**, and then clears MMKV — in that order, because the persist
middleware writes on every `set` and clearing disk first only means the reset re-writes it.
`language` survives: it is a device preference, not a user's. The same teardown runs on sign-IN,
because a force-kill mid-logout would otherwise leave the previous user's cache on disk for the
next cold start to hydrate. Covered by `__tests__/signOut.test.ts`.

Reset rules live in `domain/demand.ts`. Switching manufacturer **empties the cart** — its lines
are the previous manufacturer's product ids, and sending one against another manufacturer is a
`PRODUCT_NOT_FOUND`. **Re-tapping the manufacturer that is already selected unticks it** and
resets the draft to empty (client decision, Sep 2026): the tile carries a tick, so a second tap
has to be able to undo the first, and the cart it held means nothing without the brand.

**Pull to refresh** (screen 06) re-reads `GET /demand-capture/industries` and **empties the
draft** (the SKU lists need no invalidation — they are never cached). The wipe is what makes it safe: every id on the draft was
resolved against the tree being replaced, so carrying a half-built cart across a refresh is how
an old product id reaches a new catalogue. Nothing is lost — capture is online-only and a draft
never left the device.

Screen 07 renders the `POST /demand-capture/demands` response and makes **no** call — the
contract puts everything it needs in the response body, which also dodges read-replica lag. Its
two Lotties mount once; re-mounting restarts the burst and reads as a glitch.

### `allocation` — screen 09

| | |
| --- | --- |
| Code | `src/views/allocation/AllocationScreen.tsx` |
| Spec | `docs/design-spec/04-screens/09-inventory-allocated.md` |
| API | `GET /allocations` + `GET /allocations/summary`, both `?manufacturer_id=&company_esi_id=&period=`; the list adds `page`/`page_size` |
| Watch out | **Totals arrive pre-normalised into the reporting unit. THE CLIENT NEVER CONVERTS UOMs.** A row's `quantity` is the raw stocking-unit figure and `normalised_quantity` is the same volume in the unit the tile sums — **the two units differ by design**, so the card shows the first and the tile the second |

Long VCP names ellipsise on one line. Product pills (`products[]`, was `skus[]`) wrap and the
card grows. `date_label` and `points_label` are server-composed — do not re-format them.

### `rewards` — screen 10

| | |
| --- | --- |
| Code | `src/views/rewards/RewardsScreen.tsx`, `components/UtsavBanner.tsx` |
| Spec | `docs/design-spec/04-screens/10-rewards.md` |
| API | `GET /rewards` + `GET /rewards/summary`, both `?manufacturer_id=&company_esi_id=&period=`; the list adds `page`/`page_size` |
| Watch out | **There is no "next lucky draw entry — N points to go" card. Removed by decision. Do not reintroduce it.** `mark` is semantic (`UmangUtsav`/`SHOP`/`Approved`/`TRIP`), never a filename |

The Umang Utsav banner is built as **composed markup**, not the supplied bitmap, because the
contract sends `city`/`venue`/`date_label`/`invited_count_label` — i.e. it must be dynamic. The
banner and the filter chips **stay** when a filter returns nothing.

Switching manufacturer resets the status filter to `All`.

### `profile` — screen 04 · always mounted

| | |
| --- | --- |
| Code | `src/views/profile/ProfileScreen.tsx` |
| Spec | `docs/design-spec/04-screens/04-profile.md` |
| API | `GET /me`, `POST /auth/logout` (**no body**), and the platform pair `GET /users/can-delete-account` + `DELETE /users` |
| Watch out | `rows` is **server-driven** — render what arrives, do not build the list. V2 drops the State row and the whole `actions` block. **Trade is intentionally not shown.** Delete Account sits behind an "Advanced" disclosure and is **no longer OTP-gated**: it is the platform's own flow, and `can-delete-account` performs real checks and **can refuse**, so it is asked before the button is offered |

**`GET /me` is also the source of the manufacturer switcher.** It is the only payload carrying
`company_esi_id`, which every manufacturer-scoped read needs paired with `manufacturer_id` —
`useManufacturerScope()` resolves that pair and validates the persisted selection against the
live list. The industry tree no longer feeds the tabs. An empty `manufacturers[]` means the
influencer is mapped to nothing: every scoped screen shows an **empty state, not an error**.

`can-delete-account`'s refusal copy can name a VCP "Firms" section this app does not have;
`deletionRefusalCopy()` remaps that one string (`api/errors.ts`).

Reached **only** from the header person icon. It is also the route to Notifications, because the
handoff excludes a header bell.

### `notifications` — screen 11 · design and contract both pending

| | |
| --- | --- |
| Code | `src/views/notifications/NotificationsScreen.tsx` — placeholder |
| Blocked on | **Contract gap:** no list/read-receipt/preference endpoints exist. **Design pending:** no handoff spec |
| Already wired | The deep links. **`PUT /me/device` no longer exists in V2** — device-token registration has no endpoint, so push delivery is blocked on the contract too |

**Do not add a bell to `ScreenHeader` to "fix" the entry point.** Its absence is a design decision.

### `auth` + `language` — screens 00, 01, 02 · core, never sold

| | |
| --- | --- |
| Code | `src/views/auth/{LoginScreen,OtpScreen}.tsx`, `src/views/language/LanguageScreen.tsx` |
| API | `POST /auth/otp/request`, `POST /auth/otp/verify` — **there is no refresh endpoint** |
| Watch out | POST the **raw 10-digit** string as `mobile_number` — never prepend `+91`. The OTP screen shows the number **in full and unmasked** |

**V2 stripped the OTP response bare**: no `request_id`, no `otp_length`, no
`resend_after_seconds`, no `attempts_remaining`. Verify is identified by the mobile number alone,
and the length (4) and resend window (24s) are now **client constants** in `api/config.ts`, taken
from the design spec. That is a drift risk — moving them onto `GET /config` is the fix, tracked in
`docs/06-inputs-needed.md`.

**There is no refresh token.** The bearer token from verify is the whole session: it is persisted
in the Keychain and restored on cold start, and a **401 is terminal** — the client calls the
handler registered by `RootNavigator`, which signs out. Do not reintroduce a refresh interceptor.

`"Wrong number ?"` keeps the space before the question mark — an intended Indian typographic
convention, not a typo. On verify, the auth stack is **replaced**; back must not return to login.

The language chooser is screen **00** because the login screen itself must render in the chosen
language, so the choice cannot sit behind auth. Each language is labelled **in its own script
first**. **Design pending** — built from primitives + PRD §4.0 rules.

---

### `splash` — app identity · not a module, not a route

| | |
| --- | --- |
| Code | `src/views/splash/SplashScreen.tsx`, mounted in `App.tsx` |
| API | none |
| Watch out | It is an **overlay over a mounted navigator**, not a screen the app replaces |

Three seconds of the HUMBEE lock-up on every cold start, over the app booting behind it. The
hold is a **floor, not a timer**: `SplashGate` waits for its three seconds *and* for the session
to stop `booting`, because the session is what decides whether the app lands on Home or on
Login, and hiding the splash first would show a blank frame. A splash that replaced the
navigator would serialise the boot behind the animation instead of hiding it.

It has no idea what comes next and must not learn: `RootNavigator` already routes a restored
token to Home and everything else to Login.

**App identity, for when the brand moves:**

| | |
| --- | --- |
| Name | `Humbee Samarth` — `android/.../values/strings.xml`, `ios/.../Info.plist` `CFBundleDisplayName` |
| Launcher icon | generated from `src/assets/humbee-logomark.svg` on a white plate. Mark at **70%** of the square, **62%** of the round PNG, **46%** of the 108dp adaptive foreground (inside the 66dp the launcher guarantees) |
| iOS icons | **no alpha channel** — the App Store rejects an icon that carries one even when it is opaque throughout |
| Splash art | `src/assets/img/humbee-splash{,@2x,@3x}.png`, Figma node `13907-566`, 240dp wide |
| Native launch screen | deliberately blank white on both platforms, so the hand-off to the JS splash is invisible. Android needed `android:windowBackground` pinned — the DayNight parent opens **black** on a device in dark mode |

---

## 3. The API layer

```
src/api/
├── config.ts        base URL (per-platform dev host), timeouts
├── crypto.ts        RSA-OAEP field encryption for the auth bodies — NOT optional, see below
├── client.ts        envelope unwrap · 401 → session reset · influencer vs platform host · error mapping
├── errors.ts        ApiError + kinds + ERROR_CODES
├── keys.ts          the query-key factory — every key in one place
├── queryClient.ts   defaults + MMKV hydrate/persist
├── types.ts         wire types (hand-written; see §8)
└── endpoints/       one file per endpoint group, exporting typed hooks
```

**Conventions that are not obvious from the code:**

- The platform envelope is `{message, error, data, formatting_args}` and **HTTP 200 carries
  business failures** with `error: true`. `401` is the one deliberate exception — and in V2 it is
  terminal, because there is nothing to refresh with.
- **Branch on `ApiError.kind` or `.code`, never on an HTTP status or on `message`** — `message`
  is localised display copy that changes with `Accept-Language`.
- Query keys are `(screen, manufacturer, period)`. That shape is what makes a cached manufacturer
  switch instantly, an uncached one show a skeleton, and an in-memory filter never refetch.
- Base URL already carries `/influencer/v1`, so paths in endpoint files are relative to it. The
  **account-deletion pair is the exception** — it lives on the platform host, reached through
  `api.platform.*`.
- **Wire format is `snake_case`, request AND response.** There is no alias layer in V2: the field
  name *is* the wire name, so there is no mapping layer here either.
- **Paging is offset-based** (`page` / `page_size`, `pagination.has_more`). No cursor, and **no
  totals** — `has_more` is the only signal. These lists are append-only, so a row arriving between
  two page requests can shift the window and re-show a row; that drift is inherent to offset
  paging and was accepted when the cursor was dropped.
- **`company_esi_id` is per manufacturer** and comes from `GET /me`. Never split the pair: an esi
  from another manufacturer is an `ESI_MISMATCH`. Note that `ESI_UNKNOWN`/`ESI_MISMATCH` both
  render as *"Session expired"* deliberately, which is misleading when debugging — the app must
  **not** sign out on them.

**Adding an endpoint:** add the type to `types.ts` → add a key to `keys.ts` → add a hook in
`endpoints/` → add a fixture branch in `fixtures/index.ts`. Never call `fetch` from a view.

### Running against the API

**There is no fixture mode** — `src/api/fixtures/` is deleted. Point `src/api/config.ts` at a
backend and run `npm run api:smoke`, which logs in for real and calls all 11 endpoints the UI
calls, printing one line each. It reuses `crypto.ts`'s key and cipher verbatim, so a green run
proves the **app's** encryption is what the server accepts.

**Set to `http://localhost:8001` today**, because the app is developed against a USB-connected
Android device. That only resolves to the Mac because of a reverse port forward —
**`adb reverse tcp:8001 tcp:8001`** — which has to be re-run after every replug, reboot or
`adb kill-server`, and after every reinstall. Metro serving the bundle while API calls fail is
the signature of it being absent.

The emulator instead wants `10.0.2.2:8001` (`localhost` there is the emulator itself); an iOS
device wants the host's LAN IP, since there is no `adb reverse` for iOS. Full table:
`docs/03-api-integration-and-data.md`.

### The auth bodies are encrypted

`mobile_number` and `otp` are RSA-OAEP(SHA-256) + base64, using the platform's public key —
`src/api/crypto.ts`, same key and library as the VCP app. **This is absent from the V2 contract
doc.** Plain digits fail DTO validation and return the generic *"Something went wrong. Please try
again later."*, which names neither the field nor the cause; the failure looks like a server
fault, not a client bug. Only auth requests are encrypted — every response is plaintext.

---

## 4. State

| Kind | Owner | Where |
| --- | --- | --- |
| Server state | TanStack Query | `src/api/endpoints/*` |
| Session, entitlements, tenant, theme | Zustand | `store/sessionStore.ts` — not persisted |
| `manufacturerId`, `period` | Zustand + MMKV | `store/selectionStore.ts` — **persisted** |
| Demand draft (incl. the multi-product cart) | Zustand | `store/demandDraftStore.ts` — not persisted |
| Derived | ViewModel hooks | computed at render, **never stored** |

**Server data never enters a Zustand store.** Copying it in gives two sources of truth and the
stale one wins about half the time.

Storage split, and mixing these up is a security bug: **tokens → Keychain**
(`store/secureStore.ts`); **everything else → MMKV** (`store/storage.ts`). MMKV is not encrypted
by default. The bearer token is held in memory for the request path **and** in the Keychain, since
V2 has no refresh token and a cold start has nothing else to rebuild the session from.

`docs/10` §7 documents the full RTK Query alternative if the team ever switches.

---

## 5. Adding a new module

Six steps, and step 1 is the one people skip.

1. **Read `docs/09-saas-and-module-architecture.md` §5** — the eight boundary rules.
2. `src/views/<module>/` with `screens/` (View) and `use<Module>Screen.ts` (ViewModel).
3. Endpoints in `src/api/endpoints/<module>.ts`; keys in `keys.ts`; fixture branch in
   `fixtures/index.ts`.
4. Pure rules into `src/domain/` — not into the hook.
5. Add the id to `MODULE_IDS` (`domain/entitlements.ts`) and a manifest to
   `modules/registry.ts`. **Nav, routes and deep links derive from it — do not hardcode.**
6. Add a case to `AppTabs.tsx`'s `screenFor`, then extend `__tests__/modules.test.ts` so the new
   module is covered by the **solo-boot** matrix.

**Never** add a module id to a nav array, a route list or Home's quick links by hand.

---

## 6. Commands

```bash
npm start                  # Metro (runs dev:reverse first)
npm run android            # device/emulator (runs dev:reverse first)
npm run dev:reverse        # adb reverse :8001 and :8081 onto every attached device
npm run typecheck          # tsc --noEmit
npm test                   # jest — domain + module-isolation
npm run verify             # typecheck + lint + test
npm run bundle:android     # proves the bundle builds
npm run api:check          # regenerate the client and FAIL on contract drift
```

**`npm run verify` is the gate.** `api:check` needs `openapi-typescript` installed and the
backend repo present at `../humbee_influencer_backend`.

**`dev:reverse` is not optional on a USB device** and is why `start` and `android` wrap it. The
app is pointed at `http://localhost:8001`, and on a phone `localhost` is the phone. The forwards
die on every replug, reboot and `adb kill-server`, so after a mid-session replug, run it by hand.
It also names the process holding **:8081** when that process is another project's Metro — see
§8b-run2, which is the failure that costs the most time to recognise.

---

## 7. Test strategy

| Suite | Covers |
| --- | --- |
| `__tests__/domain.test.ts` | en-IN formatting, points semantics, status degradation, the demand state machine and its reset rules |
| `__tests__/modules.test.ts` | The **module-isolation matrix** — all-on, core-only, each module solo, unknown ids, realistic tenant bundles |

The module-isolation suite is the highest-value one here: the failure mode of a SaaS module
architecture is that the app works with everything on and breaks on a subset, and the dev build
has everything.

Density belongs in `domain/` (no renderer), then ViewModels (MSW), then components. **Do not
snapshot screens** — a snapshot asserts nothing about whether the screen matches the design.

---

## 8. Known gaps in the code — read before filing a bug

These are deliberate and tracked, not oversights. Each is confined to one file so the swap is
mechanical.

| # | Gap | Where | Fix |
| --- | --- | --- | --- |
| 1 | **The HUMBEE icon set is not in the handoff.** The 102 in-house glyphs are absent, so the paths are stand-ins drawn to the right 24px grid and weight | `src/components/Icon.tsx` — `PATHS` | Run the real set through SVGR and replace `PATHS`. No screen changes |
| 2 | **ProductMark artwork is absent.** The 48px full-colour marks are rendered as hexagons with the mark's initials in its accent colour | `src/components/ProductMark.tsx` | Replace that one file |
| 3 | **Lato is not bundled.** The spec ships a Google Fonts *webfont* import, which does nothing in RN. `FONTS_BUNDLED = false` renders in the system font at correct sizes/weights | `src/theme/typography.ts`, `src/assets/fonts/README.md` | Add the TTFs, link them, flip the flag |
| 4 | **Lato has no 600 weight** in the Google Fonts distribution, but the spec uses 600 for the leaderboard name | same | License a SemiBold cut or reassign to 400/700. **Do not silently round to 700** |
| 5 | **`NoDataFound` illustration absent** — `EmptyState` uses a neutral hex mark | `src/components/EmptyState.tsx` | Drop the illustration in |
| 6 | **Wire types are hand-written**, not generated | `src/api/types.ts` | Point `api:gen` at the running backend's `/openapi.json` (V2 is generated from there, not from a checked-in YAML), run it in CI, and delete the hand-written half |
| 7 | **Screen copy is inline in the views**, not in i18n | `src/i18n/index.ts` | Extract per screen. The strings are approved final copy, so transcribe carefully. Hindi is a blocking input |
| 8 | **Notifications is a placeholder** | §2 | Needs endpoints and a design |
| 9 | **No `/config` entitlements or tenant block in the contract yet** — `session` falls back to all-modules-entitled | `domain/entitlements.ts` | Contract addition, tracked in `docs/06-inputs-needed.md` |
| 10 | **Inset-shadow borders are approximated** with `borderWidth`; `Card` compensates the 1px shift on selection | `src/components/Card.tsx` | Inherent to RN. Verify against the prototype |
| 11 | **Native projects are not yet configured** for flavors, ProGuard, deep-link intent filters or Firebase | `android/`, `ios/` | `docs/10` §1.3 |
| 12 | **`role-per-industry` is unimplemented** because no designed screen shows a role | — | **Blocking product decision** — `docs/06-inputs-needed.md` #1. Do **not** invent a role tag. V2 *does* now ship it: `GET /me`'s `manufacturers[].trade` is the role for that manufacturer's industry, and `useManufacturerScope()` exposes it — the data is there, the design is not |
| 14 | ~~Industry cards are illustrated with manufacturer logos~~ — **moot: the industry step is gone from screen 06.** The picker is manufacturer logo tiles, which is what `logo_url` was always for, so V2 dropping `image_url` no longer costs anything | `src/views/demand/components/PickCards.tsx` | Nothing. Closed by the picker change |
| 16 | **Device-token registration has no endpoint** (`PUT /me/device` is gone) | — | Blocks push delivery; raise with the backend |
| 13 | **~69 `no-inline-styles` lint warnings** remain in non-list screens. The per-row hot paths (LeaderboardTable, DemandCard, AllocationCard, GiftCard) **are** converted to `StyleSheet.create`, because those allocate per row per frame. The rest allocate once per screen render | `src/views/**`, `src/components/**` | Mechanical cleanup. **The rule is left ON rather than silenced** so the backlog stays visible — `npm run lint` shows 0 errors, N warnings |

---

## 8b. Current verification state

Run `npm run verify` before any commit. As of the scaffold:

| Gate | State |
| --- | --- |
| `npm run api:smoke` against the local backend | **all 11 endpoints ✓** — real login as a seeded influencer, real data on every screen's calls |
| `tsc --noEmit` (strict + `noUncheckedIndexedAccess`) | **0 errors** |
| `eslint --quiet` | **0 errors** (69 style warnings — gap #13) |
| `jest` | **37 passing** — 2 suites |
| `react-native bundle` (android) | **succeeds** |
| `react-native bundle` (android, prod) | **succeeds**, 2.8 MB JS, 28 assets |
| Native build, Android | **BUILD SUCCESSFUL** — installed and launched on a Pixel_8 API 34 emulator, New Architecture (Fabric) confirmed active |
| All 12 screens on-device, **against the live API** | **Verified by screenshot.** Real login (encrypted OTP → 9999) as a seeded influencer, then Home, Leaderboard, Inventory, Rewards (3m empty state *and* 1y with the Utsav banner), Capture Demand through to the quantity card, and Profile. Every figure on screen came from the backend |
| Native build, iOS | **not yet run** — needs `pod install` on a Mac with Xcode |
| Native config (flavors, ProGuard, deep-link intent filters, Firebase) | **not yet done** — `docs/10` §1.3 |

**The native build has not been executed.** The JS bundles cleanly and every dependency is
installed, but `pod install` and a Gradle build on a real device are the next step and may
surface native-linking work — particularly for `react-native-mmkv` (Nitro modules),
`react-native-keychain` and `lottie-react-native`.

## 8b-run. Bugs found by running it on the emulator — fixed

Four defects that `tsc`, `eslint`, `jest` and a clean `react-native bundle` all passed. Recorded
because three of them are *classes* of bug that will recur.

| # | Symptom | Root cause | Fix |
| --- | --- | --- | --- |
| 1 | **Rewards, My Demands and Inventory Allocated all rendered a blank body.** Header, tabs and nav drew; the content area was empty — not even an empty state | `Screen`'s body wrapper had no `flex: 1` in the `scroll={false}` branch. A **FlashList needs a bounded parent**; without one the wrapper collapsed to its content height, which is zero for a virtualized list | `flex: 1` applied to the body **only** in the non-scroll branch (`components/Screen.tsx`) — in the scrolling branch it would fight the ScrollView's content sizing |
| 2 | **`TypeError: Cannot read property 'otpLength' of undefined`** — the OTP screen crashed on entry | `LoginScreen` emitted `{ mobile, result }` while the route param list declares `{ mobile, request }`. `navigation.navigate('Otp', args)` **accepts the params object loosely**, so spreading it hid the field-name mismatch from `tsc` | Named each param **explicitly instead of spreading**, which restores the type check. (V2 removed the `request` param entirely — the route now carries only `mobile` — but the lesson about spreading nav params stands) |
| 3 | **"View My Demands" on the success screen went back to the empty New Demand form** | The Demand module's sub-tab was local `useState` inside `DemandTabScreen`. Screen 07 is a **root** route, so it could not reach that state — both its buttons just called `goBack()` | Sub-tab lifted into `demandDraftStore` as `tab`, so screen 07 can set `'mine'` before popping back |
| 4 | **Android's gesture-navigation pill drew straight through the tab labels** | `tabBarStyle` set a fixed `height: 60`, overriding React Navigation's own safe-area handling | Height is now `60 + insets.bottom` with matching `paddingBottom` (`navigation/AppTabs.tsx`) |

**The lesson worth keeping: a green `bundle`, `tsc`, `eslint` and `jest` do not tell you the app
renders.** Three of the five list screens were blank and every gate was green. Run it.

Two things that looked like bugs and are not:
- The quantity field showing `900.` mid-typing is correct — reformatting live would fight a user
  typing `900.5`. The trail mirrors the field deliberately.
- `4,000 pts expected` not changing with the quantity entered is correct in fixture mode: the
  **server** computes expected points, and the fixture returns a canned response. The client must
  never compute it.

## 8b-run2. Running it against a local backend — four traps

Recorded because each cost real time and none is obvious from the code. **The first two both
present as "the app cannot reach the internet"** and neither is a network problem.

| Symptom | Cause | Fix |
| --- | --- | --- |
| `POST /auth/otp/request` returns *"Something went wrong. Please try again later."*, validation logs show `value_error` on `mobile_number` | The platform **decrypts** that field. Plain digits — what the V2 doc shows — cannot be decrypted | `src/api/crypto.ts`. An empty body returns a *correct* "Mobile Number is required", which is how you tell a validation failure from a decryption one |
| **No API call ever reaches the backend** — the app looks offline, `npm run api:smoke` passes | `adb reverse tcp:8001` missing. `localhost` on a phone is the phone. The forward does not survive a replug, a reboot or `adb kill-server`, and `react-native run-android` only sets up Metro's **:8081** | `npm run dev:reverse`. `npm run start` / `npm run android` run it first |
| App boots to `TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found` — **and therefore makes no HTTP request at all**, which reads as a network fault and is not one | Another RN project's Metro owned port 8081, so the app loaded **the VCP app's bundle** (RN 0.79 against this 0.87 binary) and the JS runtime never started. Logcat says `Loading from localhost:8081…` just above the invariant | **Free the port** — stop the other Metro, start this one. `npm run dev:reverse` names the offending process by its working directory. A USB device *can* be redirected instead (`adb reverse tcp:8081 tcp:<other>`, since it asks its own `localhost`); an **emulator cannot** — RN there fetches from `10.0.2.2:8081`, a host route no forward touches |
| `installDebug` → *"Failed to install on any devices"* after a successful build | The APK was built for one ABI and the emulator is another. On Apple Silicon the emulator is **arm64-v8a**, not x86_64 | `./gradlew app:installDebug -PreactNativeArchitectures=arm64-v8a` |

## 8c. Native build gotchas — hit and fixed, keep for the next upgrade

**RN autolinking only registers DIRECT dependencies.** A package installed transitively is
present in `node_modules` and resolves fine in TypeScript and in Metro, but is **not** added to
`android/settings.gradle`, so a Gradle project that depends on it fails to evaluate. The JS
bundle builds cleanly and the native build fails — which is why `npm run bundle:android` passing
is not evidence that the app compiles.

Two packages hit this, both peers pulled in transitively:

| Failure | Cause | Fix |
| --- | --- | --- |
| `Project with path ':react-native-nitro-modules' could not be found in project ':react-native-mmkv'` | `react-native-mmkv` v4 is built on Nitro modules and declares `react-native-nitro-modules` as a **peer** | `npm i react-native-nitro-modules` — as a direct dependency |
| `[Reanimated] 'react-native-worklets' library not found` | `react-native-reanimated` v4 moved worklets into a separate package and declares it as a **peer** | `npm i react-native-worklets` — as a direct dependency |

**Rule for this repo: if a library declares a native peer dependency, install it directly.**
Add that to the dependency-review checklist in `docs/10` §12.1 — it is a two-minute check that
costs a full Gradle cycle to discover.

### SDK version pin

RN 0.87 ships `compileSdkVersion = 37` / `buildToolsVersion = "37.0.0"`. This machine has up to
SDK 36 and build-tools 36.0.0, and the SDK's bundled `sdkmanager` is the legacy
`tools/bin/sdkmanager`, which throws `NoClassDefFoundError: javax/xml/bind/annotation/XmlSchema`
on Java 17 (JAXB was removed from the JDK in 11).

`android/build.gradle` is therefore pinned to **36 / 36.0.0**, which builds and runs. To restore
the RN default, install modern cmdline-tools and then SDK 37:

```bash
# then: sdkmanager "platforms;android-37" "build-tools;37.0.0"
```

Original file is unmodified apart from those two numbers — revert them when SDK 37 is installed.

### Dev builds are 4x slower than they need to be

`android/gradle.properties` has `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`, so a
clean build compiles the C++ for **four** ABIs — that is most of why the first build took ~55
minutes. For emulator work only one is needed:

```bash
# emulator only, ~4x faster native builds. Do NOT commit this as the default.
./gradlew app:installDebug -PreactNativeArchitectures=x86_64
```

Release builds must keep all four. This is the single largest developer-experience win available
on the project.

### Animations currently use RN `Animated`, not Reanimated

`Skeleton`, `ProgressBar` and `Disclosure` are implemented with React Native's built-in
`Animated` API. `docs/10` §2.5 specifies **Reanimated** for motion, precisely so the work runs
on the UI thread rather than the JS thread.

Reanimated (+ worklets) is installed and linked but **not yet imported anywhere in `src/`**.
That is a deliberate staging decision, not an oversight: the current animation set is a colour
fade, a width fill and an opacity pulse, which `Animated` handles acceptably. Migrate before the
staggered row entries and the shimmer are tuned for 60fps on the reference device — that is the
point at which the JS thread starts to matter.

## 9. What is deliberately absent from the UI

If one of these looks missing, it was excluded on purpose. Adding it is a scope change, not a fix.

- Sign-up / account creation, e-Pin, password, `+91` country-code selector
- A notification bell in the header
- Global search · chat / support inbox · referral flow
- A period filter on Leaderboard or on My Demands
- A manufacturer switcher on Home (manufacturer context lives inside the module screens)
- The lucky-draw progress card on Rewards
- `trade` on the Profile screen
- Any third gradient, any substituted icon library, any 14px body size, any emoji in copy
