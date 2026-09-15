# 12 — Implementation roadmap

Build order follows the handoff's own plan (`design_handoff/docs/10-implementation-plan.md`), with the
stack-specific work from these documents slotted in. The sequencing principle: **the primitives and
the two shared composites must be right before the seven screens that reuse them are built**, because
a token or Card change after screen seven is seven diffs instead of one.

## Phase 0 — foundations and the spike

Nothing in this phase is a screen, and skipping it is the most expensive mistake available.

| # | Task | Output |
| --- | --- | --- |
| 0.1 | `create-expo-app` with TypeScript, New Architecture on, Expo Router. `expo prebuild` succeeds | `frontend/app/` boots on a device |
| 0.2 | **Buy two reference devices** (§9.1) and install a development build on both | The only environment that counts |
| 0.3 | `scripts/gen-tokens.ts` — 531 variables → typed modules; drift check wired into CI | `shared/tokens/` |
| 0.4 | Lato 400/600/700 bundled; the `Text` wrapper with `includeFontPadding: false`; verify the 1.54 line-height ratio on Android | `shared/ui/Text` |
| 0.5 | `scripts/gen-icons.ts` — the 102 HUMBEE SVGs → typed `<Icon name size />` | `shared/ui/Icon` |
| 0.6 | `scripts/gen-api.ts` — `../contracts/openapi.yaml` → generated types; client wrapper with envelope unwrap, error mapping, timeouts | `shared/api` |
| 0.7 | Query client with the §6.4 defaults + MMKV persister; Zustand slices; MSW harness seeded from `contracts/examples/` | `shared/store`, test harness |
| 0.8 | i18n scaffolding with `en`, plus `hi`/`mr` files stubbed from day one so no English literal ever lands in JSX | `shared/i18n` |
| 0.9 | **The animation spike.** Build the leaderboard skeleton *and* twenty animated rows with staggered entry and progress fills. Measure fps on the reference device | A go/no-go on `02-alternatives-considered.md` §2.4.1 |
| 0.10 | Primitives: `Button`, `Input`, `Select`, `Card`, `ListRow`, `StatTile`, `StatusBadge`, `HexMark`, `Chip`, `EmptyState`, `Skeleton`, `ProductMark`, `Illustration` | `shared/ui` |
| 0.11 | Shell: `AppHeader` (logomark, title, subtitle, person icon — no bell, no hexagon), bottom nav with the Demand-tab rule, safe-area handling | `shared/composites` |
| 0.12 | CI: typecheck, lint with boundary rules, drift check, tests, path filters | `.github/workflows/frontend.yml` |
| 0.13 | Sentry wired with sourcemap upload; the analytics facade with a no-op provider | `shared/analytics` |
| 0.14 | Store accounts, signing keys, data-safety groundwork (§11.7) | Unblocks the first release |

**Phase 0 exit criteria.** A blank screen renders the real header and bottom nav; a hardcoded hex or a
non-token font size fails `tsc`; the spike holds 58fps on the reference device; a change to
`contracts/openapi.yaml` fails CI.

The spike gate is the important one. If Reanimated cannot hold the frame budget on real hardware, that
is the moment to reopen the framework decision — twenty rows of work in, not ten screens in.

## Phase 1 — auth

| Task | Notes |
| --- | --- |
| Login — mobile number | Get OTP disabled until exactly 10 digits; non-digits stripped; no `+91` selector, no help line, no sign-up |
| Login — verify OTP | 4 boxes, auto-advance, backspace-retreat, 24s resend from a stored timestamp (§7.7), full unmasked number, "Change" retains the number |
| SMS autofill | Android SMS Retriever — needs the 11-char app hash in the SMS template, and it **differs per signing key** (§8.5). Start the SMS-provider conversation now, it has a lead time |
| Error branches | `OTP_INVALID` → error rings, boxes cleared, focus reset. `OTP_EXPIRED` → different copy, resend enabled. `NOT_REGISTERED` → different copy again. Three distinct paths off `data.code` |
| Session | SecureStore, single-flight refresh, cold-start route guard, `replace` not `push` |
| Deep-link deferral | Stash an unauthenticated deep link and resume after login (§5.2) |

Ship against fixtures if the OTP endpoint is not ready.

## Phase 2 — the read screens

Highest value, lowest risk, and they share the most. Build `ManufacturerTabs` and `PeriodPills` first —
three screens depend on them.

| Order | Screen | The hard part |
| --- | --- | --- |
| 2.1 | `ManufacturerTabs` + `PeriodPills` + `ErrorRetryCard` + `OfflineBanner` | Manufacturer switch resets the gift filter to `All`; period pills are deliberately smaller than the tabs |
| 2.2 | **Leaderboard** | The podium (SVG medals, order 2-1-3, staggered rise), the sticky current-user card over a gradient fade, progress bars filling with a per-row delay, the points explainer, FlashList with a capped stagger |
| 2.3 | **Inventory Allocated** | Manufacturer × period query keys; stat tiles read `/summary`, never `items.length` (§6.5); label-above-value tile variant |
| 2.4 | **Rewards** | Status filter chips with period-filtered counts; **filtering must not trigger a skeleton**; the Umang Utsav banner; the empty state |
| 2.5 | **Home** | Full-bleed carousel, 4000ms auto-advance that pauses off-focus, dots with tap-to-jump and timer reset, quick links above My Rewards, 4 newest gifts across all manufacturers |

Every screen in this phase must land with all five states: skeleton, content, empty, error-retry,
offline.

## Phase 3 — the core action

The business value, and the only non-trivial state machine. Deliberately after the primitives settle.

| Order | Task | The hard part |
| --- | --- | --- |
| 3.1 | `demandDraft` slice + the reset cascade, unit-tested against the handoff's table | A missed reset submits the wrong SKU. Test this before building the UI |
| 3.2 | `DemandTrail` — sticky honeycomb stepper | Three states per step, connector lines, values ellipsised, no "Step 1 of 3" counter |
| 3.3 | **Capture Demand** — branch A (manufacturer → SKU) | `PickCard` grids, selected ring without a 1px content jump (§4.4), UOM segmented control with the documented fallback chain |
| 3.4 | **Capture Demand** — branch B (no manufacturer in district) | Info banner + flat SKU-category list. Fire `demand_no_manufacturer_shown` — it is a business signal (§8.4) |
| 3.5 | Submit | Button loading state, not a skeleton. Idempotency key from day one, even before the outbox exists |
| 3.6 | **Demand Captured** | Lottie celebration, skipped under reduced motion. No bottom nav. "Capture Another Demand" resets the draft. Android back must not return to the submitted form |
| 3.7 | **My Demands** | Demand status filter chips, stat tiles from `/summary`, FlashList |

## Phase 4 — profile and hardening

| Task | Notes |
| --- | --- |
| **Profile** | Initials from the first two words, `+91 98220 14576` format, no Trade row, Advanced disclosure closed on every visit |
| Log out / delete account | Both confirm and name the consequence. Logout clears SecureStore, MMKV session keys and the persisted query cache — the last one is a data-leak risk on a shared phone |
| **Offline outbox** | §6.6. Until it exists, the demand form refuses to submit offline with clear copy — never a submit that appears to work and loses the demand |
| **Localisation pass** | `hi` and `mr` filled in and laid out. Devanagari runs longer; the chips, nav labels and table headers are where it breaks |
| **Reduced motion pass** | Per-category, not one global switch (§7.5) |
| **The full QA checklist** | `design_handoff/docs/09-qa-checklist.md`, every row, on the reference device |
| Perf pass | Every budget in `09` measured and recorded |
| Analytics | Real provider swapped in behind the facade; event catalogue verified; no PII in any property |

## Phase 5 — release

Staged rollout per `11-release-and-ota.md` §11.4, Sentry release health watched for 24 hours at 10%
before proceeding.

## Post-v1 — the named roadmap

Each of these enters through the §8.7 checklist, and each is a **native** change, so each costs a store
release rather than an OTA:

| Order | Capability | Prerequisite |
| --- | --- | --- |
| 1 | Push notifications (`POST /me/device` already exists) | Backend campaign trigger. Design for unreliable delivery on Xiaomi/Oppo/Vivo (§8.5) |
| 2 | Camera — photo capture | A product decision on what a photo is *for*, plus the pre-signed upload path and compression (§8.2) |
| 3 | Analytics provider upgrade / engagement SDK | A defined funnel worth instrumenting, and a store-listing update |
| 4 | Google Maps | A real map feature — nearest VCP is the strongest candidate — plus API keys, billing, and the SHA-1 restriction work (§8.1) |
| 5 | New industry modules | Mostly **server-side catalog data with no client release** (§8.6). Only a genuinely new flow needs a release |
| 6 | Frame processors (barcode / OCR) | The `expo-camera` → VisionCamera migration, which the facade makes a one-file change |

## Sequencing risks worth naming now

| Risk | Mitigation |
| --- | --- |
| The API is not ready when Phase 2 starts | Fixtures first, per handoff rule 6. `contracts/examples/` is a mock server already |
| Backend field names drift from the contract | The drift check in CI (§10.6) makes it a build failure in the backend's own pull request |
| The Cement illustration and the Umang Utsav banner are known open items in the handoff | Both are assets, not code. Ship with the placeholder and swap via OTA |
| The reference device arrives late | Everything in `09` is unmeasured until it does. Order it in week one |
| The SMS app-hash round trip blocks Phase 1 | Start it during Phase 0. It has an external dependency and a lead time |
