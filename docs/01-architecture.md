# 01 — Architecture & Technology Decisions

**This repo is frontend only** — the Influencer app client and its documentation. The server lives in
`hymbee-backend` (the platform monolith) with the influencer module's specification and API contract in
`humbee_influencer_backend/`. Nothing here defines server behaviour; where this document touches the
API it is describing what the client consumes.

Each decision is an ADR with the alternative that was rejected and why, so a future reader — human or
Claude — can re-open it deliberately rather than by accident.

**Two things settled before these ADRs:**

1. **Separate Influencer app, not a unified role-based app** (PRD §13 Q3). The VCP app already carries
   Cashfree, Easebuzz, Maps, Firestore and charts — too heavy for a 2 GB-RAM persona — and an influencer
   regression must never ship next to order booking and payments.
2. **v1 is 12 screens**: the design handoff's 10, plus the first-launch language chooser and the
   notification surface. See `08-screen-inventory.md`.

---

## ADR-001 — React Native + TypeScript, on the React Native CLI

**Decision.** React Native on the **New Architecture** (Fabric + TurboModules + Bridgeless) with the
**Hermes** engine, in **TypeScript `strict`** plus `noUncheckedIndexedAccess`. Delivered on the
**React Native CLI** — `android/` and `ios/` are checked in and owned — with **`expo-modules-core` and
`expo-updates` installed into the bare project**. Navigation via **React Navigation** (native stack +
bottom tabs).

**Why React Native.** The full comparison, scored against scalability, maps, geofencing, charts,
animation, journey tracking, analytics, a 5 lakh userbase and performance, is
**`07-framework-comparison.md`**. The summary:

| Option | Score /305 | Verdict |
| --- | --- | --- |
| Expo CNG | **250** | Highest scoring. See the amendment below |
| Vite + React + Capacitor | 241 | Genuinely competitive; loses on threshold criteria, not on points |
| **React Native CLI** | **238** | **Chosen** |
| Next.js + Capacitor | 234 | The weakest web variant — inside a wrapper, every Next.js advantage is inert |
| Flutter | 225 | Out on OTA and on sharing nothing with a TypeScript platform |

React Native wins on the three criteria that behave as **thresholds rather than slopes**: list render
performance on a 2–3 GB Android device (five of twelve screens are lists), stability across the Android
long tail at 5 lakh users, and OS-level background capability — of which geofencing is the clearest
case, because a WebView that is not alive cannot respond to an OS geofence event.

It also keeps TypeScript end to end, so `humbee_influencer_backend/contracts/openapi.yaml` generates
types the app compiles against and contract drift is a build failure.

**Status: decided — React Native CLI.** The amendments below are kept as the record of what the choice
costs, not as an open question. `10-rn-cli-implementation-guide.md` is the build manual, and it pays
each cost explicitly: OTA in Phase 0, native-dependency review per addition, and a budgeted RN upgrade.

**What the CLI costs, recorded rather than buried:**

- **Expo CNG scores 12 points higher than the CLI**, almost entirely on OTA-out-of-the-box and on
  regenerable native projects turning an SDK upgrade into a regenerate rather than a three-way merge.
  **The reason usually given for avoiding Expo — "we may need native integrations later" — does not
  apply to CNG.** Stated precisely, because it is the most common way teams pay this 12-point cost by
  accident:

  | Native need | On Expo CNG |
  | --- | --- |
  | Any npm package with native code — maps, VisionCamera, Firebase, background geolocation | Autolinks, exactly as on the CLI |
  | Editing `AndroidManifest.xml`, `Info.plist`, Gradle, the Podfile | A config plugin — or commit the generated `android/`/`ios/` and edit them directly |
  | A custom native module you write yourself | Expo Modules API, a local library, or plain RN native code in the generated projects |
  | A vendor SDK with manual native install steps | A config plugin (many ship one) or the committed native dirs |
  | Escape entirely | `expo prebuild`, commit the output, stop regenerating. You are then bare RN **with** the `expo-*` module library available |

  The restriction people are remembering is **Expo Go** — the sandbox app, which cannot load custom
  native code. A **development build** has no such ceiling, and iOS is fully supported rather than
  secondary. There is no native-integration ceiling on CNG and no one-way door.

  **Two reasons that genuinely do favour the CLI here**, neither about capability: the team already runs
  bare RN on `humbee-mobile-app` (RN 0.79) and owns that toolchain, signing and CI; and hand-owned native
  projects avoid a dependency on EAS as a paid service and on Expo's SDK cadence. Both are defensible.
  **Per-tenant white-labelling is *not* the argument it first appears to be** —
  `09-saas-and-module-architecture.md` §12 explains why config-as-code scales better across many tenants
  than checked-in Gradle flavors and Xcode schemes.

  **Net:** the CLI is reasonable on team-continuity grounds, and it costs ~12 points that have to be
  bought back deliberately — chiefly by wiring OTA (below) and budgeting the upgrade treadmill. Tracked
  in `06-inputs-needed.md`.
- **OTA is a task on the CLI, not a given.** `expo-updates` is supported in bare RN and works with EAS
  Update without adopting Expo Go or Expo Router; self-hosted CodePush is the alternative, noting that
  App Center's retirement took the hosted service with it. **Prove an over-the-air update on a real
  device in Phase 0.** Without it the framework score drops to 223 and loses to every other option in
  the comparison — this is the single highest-risk item in the plan.

**Trade-offs accepted.** Checked-in native projects mean a manual merge across `android/`, `ios/`,
Gradle and the Podfile on every RN bump — budget roughly one engineer-week per minor upgrade, twice a
year, and **name the owner**. Every native dependency is a real code review rather than a config-plugin
line. `expo-doctor` and `expo install`'s version resolution are replaced by a documented dependency
audit and a curated `package.json`.

**Not lost by leaving Expo:** `npx install-expo-modules` adds `expo-modules-core`, after which
`expo-image`, `expo-secure-store`, `expo-camera`, `expo-localization`, `expo-font` and the rest all work.
EAS Build also supports bare RN projects.

**Rejected:** Flutter (no first-party OTA; Dart shares no types, tokens, domain logic or i18n with the
planned Next.js manufacturer dashboard). Kotlin Multiplatform (shares logic, not UI — wrong trade for a
UI-heavy, logic-light app; no OTA; smallest hiring pool). Fully native ×2 (two implementations of a
12-screen design system for an iOS audience the handoff describes as "the internal team"). Next.js +
Capacitor (§4 of the comparison — a static SPA carrying Next's build complexity and none of its
advantages).

---

## ADR-002 — Repo layout: pnpm workspace, frontend only

```
humbee-influencer-app/
├── apps/
│   └── mobile/               # React Native CLI app — Android first, iOS parity in 1.1
├── packages/
│   ├── tokens/               # The 531 design variables, generated. No hand-edits
│   ├── ui/                   # HUMBEE primitives: atoms → molecules → organisms
│   ├── api-client/           # Generated from contracts/openapi.yaml + TanStack Query hooks
│   ├── domain/               # Pure TS: status machines, entitlements, en-IN formatting, validation
│   ├── module-host/          # Module manifests, registry, nav builder, route guards — see doc 09
│   ├── i18n/                 # en / hi / mr catalogues, ICU plurals
│   └── config/               # Shared eslint, tsconfig, prettier, jest
└── docs/                     # This documentation set
```

**Why a workspace for one app.** `tokens`, `api-client` and `domain` are the three things a second
surface would need, and a manufacturer-facing **Next.js** dashboard is planned
(`archive/superseded-frontend-plan/15`). Retrofitting a workspace once two apps exist is a week
nobody budgets; creating one now is an afternoon. `packages/domain` in particular means the demand and
gift status machines and the `en-IN` formatting rules are written once and unit-tested without a
renderer.

**What is deliberately *not* shared with that future dashboard: UI components.** A mobile influencer app
and a desktop analytics dashboard share almost no components in practice — the dashboard is data tables,
filter panels, date-range pickers and CSV export; this app is hex avatars, podiums and pick cards.
Sharing *tokens* gets a consistent brand. Sharing *components* would mean building every primitive twice
as abstract and using each once.

**And do not build that dashboard with `react-native-web`.** It works, and a desktop B2B surface needs
hover, keyboard navigation, right-click, text selection, print styles and real `<table>` semantics for
accessibility. RNW fights all of it. This reverses the `apps/web` target in the earlier draft of this
document: the web surface is a separate Next.js app in its own repo that imports `@humbee/tokens`, not
an RNW build of this one.

**Rejected:** a single app folder with no packages (cheaper on day one, and the token generator then has
one consumer and no contract). Turborepo (fine, and unnecessary at one app — add it when build times
justify it, not before).

---

## ADR-003 — Layering inside `apps/mobile`

> **Superseded in shape by `09-saas-and-module-architecture.md` §2.** Because modules are sold
> individually to manufacturers, `features/` becomes `core/` + `modules/`, each module declares
> itself through a manifest, and the nav and route tree are *derived* from a registry rather than
> hardcoded. **The import rules below are unchanged and matter more, not less** — they are what
> makes a module independently sellable. Read doc 09 for the layout; read this for the rules.

Feature-first, not type-first. Each feature owns its screens, hooks and components; only genuinely
cross-cutting things go in `shared/`.

```
apps/mobile/src/
├── navigation/               # React Navigation trees + the linking config for humbee:// deep links
├── features/
│   ├── language/             # Screen 00 — first-launch chooser
│   ├── auth/                 # Screens 01, 02
│   ├── home/                 # Screen 03
│   ├── profile/              # Screen 04
│   ├── leaderboard/          # Screen 05
│   ├── demand/               # Screens 06, 07, 08
│   ├── allocation/           # Screen 09
│   ├── rewards/              # Screen 10
│   └── notifications/        # Screen 11
└── shared/                   # providers, error boundaries, analytics facade, offline banner
```

**Rule, enforced by `eslint-plugin-boundaries` in CI:** a feature may import from `shared/` and
`packages/*` — **never from another feature.** Cross-feature needs get promoted into `packages/domain` or
`shared/`.

This began as a maintainability rule and now carries commercial weight: if modules are licensed to
manufacturers, a `features/` slice is a **sellable unit**, and a slice that reaches into another one
cannot be sold or withheld independently. It is also what makes module #20 cost the same as module #4.

**Deep links** are a hand-written linking config here rather than a file tree, because React Navigation
rather than Expo Router: `humbee://leaderboard?mfr=welspun`, `humbee://demands`,
`humbee://rewards?status=InShop`.

---

## ADR-004 — TanStack Query + MMKV for server state; Zustand for client state

**Decision.**

- **Server state:** TanStack Query v5, **one query key per `(screen, manufacturer, period)`**, persisted
  to `react-native-mmkv` so a cold start with no network paints last-known data.
- **Client state:** Zustand, three slices only — `session`, `selection` (`mfr`, `period`) and
  `demandDraft`.
- **Secure storage:** `expo-secure-store` (Keychain / EncryptedSharedPreferences) for access and refresh
  tokens. **Never MMKV.**

**Why.** The handoff's state spec already describes TanStack Query's exact model without naming it:
loading is per-query rather than global, a cached manufacturer switches instantly with no skeleton, and
a **filter change must never show a skeleton** because it filters data already in memory. Hand-writing
that in Redux slices is where most of the boilerplate in `humbee-mobile-app` comes from.

**Deliberate deviation from the VCP app's Redux Toolkit.** This app is ~95% server-state reads with a
hard offline requirement. RTK Query would be a defensible substitute and would match team muscle memory
— if the team prefers it, nothing else in this architecture changes. What is **not** acceptable is
classic Redux slices holding server data.

**Persist `mfr` and `period` across launches.** Field users work with one manufacturer for weeks. Do
**not** persist a demand-in-progress beyond the session unless the offline outbox is implemented.

**Offline contract.** Reads are cached and served stale-with-indicator. The only v1 writes are OTP
verify, demand submit and delete account. Queue demand submits locally and drain them via
`POST /demands/batch`, each carrying an `Idempotency-Key`, with explicit **"Pending sync"** UI. Never
let a queued write look like it succeeded.

---

## ADR-005 — The client consumes a contract it does not own

The server is not in this repo. `humbee_influencer_backend/contracts/openapi.yaml` is the single source
of API truth — **22 endpoints** covering auth, config, catalog, home, leaderboard, demands, allocations
and rewards.

**Decision.**

1. `packages/api-client` is **generated** from that spec (`openapi-typescript`), never hand-written, with
   a thin wrapper that unwraps the response envelope and handles token refresh.
2. Regeneration runs in CI. **A contract change that would break the app fails the build.** This is the
   single most valuable property of the whole arrangement and it is free — do not throw it away by
   hand-editing generated types.
3. **The server owns every number.** Points, ranks, gaps, podium visibility, UOM normalisation, period
   windows, status counts and `en-IN`-formatted `*Label` fields all arrive computed. The prototype
   computes them client-side **only so the design can be demonstrated**. The client must never
   recompute one — see `07-screen-to-endpoint-map.md` "Screen state → server ownership".
4. **One call per screen where the contract offers one.** `GET /home` fills Home. A typical field session
   is ~10 requests, ~7 Redis-served. A naive implementation of the same screens is 25+ requests with 5
   heavy aggregates — at 5 lakh DAU that is the difference between two database instances and twenty.

**Client-side gaps to raise against the contract, not work around:** notification list, read-receipt and
preference endpoints (screen 11), the language catalogue shape on `GET /config` (screen 00), and — if
the role-per-industry rule holds — per-industry role on the allocation and demand payloads. All tracked
in `06-inputs-needed.md`.

---

## ADR-006 — Authentication

Matching the contract as specified:

1. `POST /auth/otp/request` — mobile number, **no `+91` in the payload**, India-only. Returns
   `resendAfterSeconds`, which drives the OTP screen's timer; the design shows 24 seconds but the
   **server owns the value**.
2. The **unregistered number** case must be distinguishable, because PRD §4.1 requires a specific
   message and forbids any signup path. Rate-limit that response hard, keyed by number **and** IP, so
   the endpoint cannot be used to enumerate the influencer base.
3. `POST /auth/otp/verify` — returns a short-lived access JWT plus a rotating refresh token bound to a
   device id. On success **replace the auth stack** (never push), then `PUT /me/device` fire-and-forget
   for the FCM token.
4. Access token in memory; refresh token in `expo-secure-store`. **Nothing in MMKV or AsyncStorage.**
5. `POST /auth/token/refresh` with reuse detection → revoke the whole device family on replay.
6. Idle expiry at 90 days (PRD §4.1). An optional PIN or biometric unlock is a **local gate over a
   still-valid session**, not a second server credential.
7. On cold start with a valid token, land on Home without showing login.
8. Account deletion is OTP-gated: `POST /auth/otp/request` with `purpose: ACCOUNT_DELETE`, then
   `DELETE /me`. It sits behind Profile's "Advanced" disclosure — **deliberately not surfaced directly.**

**There is no self-registration anywhere in this app.** No "Create account", no "Sign up", no e-Pin, no
password, no country-code selector. Verify by inspection at review.

---

## ADR-007 — Runtime theming and entitlements

> **Full design: `09-saas-and-module-architecture.md`.** That document covers the module manifest and
> registry, the folder split, the `/config` contract, the boundary rules CI enforces, the per-tenant
> test matrix, and the three packaging models. This ADR states the decision; doc 09 is how it is built.

Modules are **sold individually to manufacturers for their own influencer base**, which makes two
things product requirements rather than speculative architecture. Both are cheap now and invasive later, so the plumbing goes in during
Phase 0 with a single tenant and all modules entitled.

**Runtime theming, scoped narrowly.**

- **Only colours and brand assets are themeable.** Type ramp, spacing, radii, elevation and motion stay
  fixed — they encode the design system's structure, and a tenant changing the spacing scale is how a
  design system dies. Enforce it in the type: `DeepPartial<Pick<Theme, 'colours'>> & { logoUrl?: string }`.
- **Compile-time default, runtime override.** The HUMBEE theme is a static import so the app renders
  correctly before any network call. Tenant overrides arrive from `GET /config` and are cached in MMKV
  so a cold start never flashes the wrong brand.
- **The typed-token guarantee survives.** `colours.primary100` still cannot be misspelled; it resolves
  through a theme context instead of a module constant. Do not weaken it to string keys.
- **Contrast is a validation problem, server-side at onboarding** — not a render-time problem on the
  device. A tenant's brand colour can produce unreadable chips.
- **The hexagon stays.** The brand shape, the icon set and the motion spec are HUMBEE's product identity,
  not the tenant's.

**Entitlements.**

- `can(entitlements, module)` lives in `packages/domain`. Entitlements come **from the server**, in the
  token or `GET /config` — a client-side entitlement is a licence anyone can edit.
- **The server enforces; the client only renders.** An unentitled module must `403` at the API, not
  merely be hidden in the nav.
- **The bottom nav is derived from entitlements, never hardcoded.** Build it from a filtered list now,
  or every tenant permutation becomes a code change.
- **Unknown module ids must not crash** — new modules will reach the server before the app knows them.
- **Entitlements gate the nav, not the bundle.** Per-tenant bundle splitting is possible and rarely
  worth it; the security boundary is the API.

---

## ADR-008 — Cross-cutting choices

| Concern | Choice | Note |
| --- | --- | --- |
| Styling | **Typed tokens + `StyleSheet.create`** | Zero runtime cost on the render path. Rejected: styled-components (per-render string parsing) and NativeWind (a build step and a class-string culture that fights a 531-variable system) |
| Lists | **Shopify FlashList** | Recycling, not `FlatList`'s mount-per-row. The largest scroll-jank win available on a 2 GB device. Never `ScrollView` + `.map()` |
| Animation | **Reanimated** + `react-native-gesture-handler` | Worklets on the UI thread. Every handoff keyframe maps to one; core `Animated` is not enough for the shimmer and staggered row entries at 60 fps |
| Icons | **`react-native-svg`**, the 102-glyph HUMBEE set compiled to typed components via SVGR | **Do not substitute Lucide / Material / Heroicons.** The hexagon clip-path, the three medal discs and the honeycomb trail are all SVG work |
| Images | `expo-image` | Disk + memory cache, `contentFit` parity with `background-size: cover`, placeholders for the banner carousel |
| Lottie | `lottie-react-native` | `celebration.json`, `success-green.json` on Demand Captured |
| Fonts | `expo-font`, Lato 400/600/700 **bundled as assets** | QA requires no fallback-font flash on cold start. Bundling is the only guarantee. Indic scripts: see `08-screen-inventory.md` §2 |
| Localization | `i18next` + `react-i18next` + `expo-localization` | ICU plurals; `en`/`hi` at launch, `mr` next; keys namespaced per feature. **Interpolate, never concatenate** |
| Charts | Keep in-app charts to the bar and progress forms the design specifies | RN's charting ecosystem is its weakest area. Put heavy analytics on the Next.js dashboard — `07-framework-comparison.md` §6.4 |
| Network status | `@react-native-community/netinfo` | The offline banner required on every data screen |
| Push | FCM via `@react-native-firebase/messaging` | Token via `PUT /me/device`. Notification language follows `Influencer.language` |
| Crash / perf | Sentry (`@sentry/react-native`) | Sourcemaps wired to the build, release health **per OTA update**. Chosen over Crashlytics because it understands OTA release channels |
| Analytics | A `track()` **facade** over one provider, with a typed event catalogue | Never call a vendor SDK from a screen. At 5 lakh users the vendor will be renegotiated; the taxonomy must survive it. **Decide the provider before Phase 1 build starts** |
| Journey tracking | Explicit funnels on Capture Demand + a moderated cohort | RN has no mature session-replay equivalent. This is a deliberate compensation, not an oversight — `07-framework-comparison.md` §6.6 |
| Forms | `react-hook-form` + `zod` | Zod schemas shared with `packages/api-client` |
| Testing | Jest + React Native Testing Library, **MSW** for the API, **Maestro** for E2E, **Reassure** for render-perf regression | Maestro flows are readable enough for QA to own |
| Lint | ESLint + typescript-eslint, Prettier, `eslint-plugin-boundaries`, `knip` | Boundaries is what keeps ADR-003 true a year from now |
| CI/CD | GitHub Actions (`hft-hymbee`) | lint → typecheck → test → **regenerate api-client and fail on drift** → build → OTA channel on merge to `develop` |
| Env config | Build flavors / schemes per environment | dev / qa / pre / prod, mirroring the existing app's split |

---

## Performance budget

Non-negotiable targets to design against, not to discover during UAT. The reference device is a
**2–3 GB RAM entry-level Android with its OEM skin intact and storage >80% full** — a clean flagship
proves nothing. Keep one on a desk.

| Metric | Budget |
| --- | --- |
| Home interactive, 4G | **≤ 3 s** |
| Home rendered from cache, warm start | **≤ 1 s** |
| Cold start | **≤ 2.5 s** |
| Scroll, all list screens | **58+ fps average, zero frames over 32 ms** |
| Android APK | **≤ 30 MB** — App Bundle splits; audit every dependency's contribution, including per-script fonts |
| Requests per field session | **~10**, per the contract's caching design |

Measure with `adb shell dumpsys gfxinfo <pkg> framestats`, three runs, on the reference device. The
58 fps figure is also the decision rule for the framework spike in `07-framework-comparison.md` §11 —
it is the same number for the same reason.
