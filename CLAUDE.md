# Humbee Influencer App — Claude Context

**Read this first in every session.** It is the entry point for all context on this product.

## What this is

The **frontend** — app code and client documentation — for a mobile app used by **Influencers**
(Shilpkars, Masons, Contractors, Engineers, Barbenders, Painters): the trade professionals in Humbee's
B2B value chain.

**The core loop:** an Influencer **captures a demand** (industry → sub-industry → manufacturer → SKU →
quantity + UOM); a **VCP** (Value Chain Partner — a distributor or dealer) **allocates** inventory
against it; **points post on allocation**, never on submission; points drive a **per-manufacturer
leaderboard** and lucky-draw entries; **gifts** and **Umang Utsav** invitations follow.

**The app is scaffolded and running.** React Native CLI 0.87, TypeScript strict, 12 screens
built against the design spec and wired to the contract fixtures. `npm run verify` is the gate.
**Start at `docs/11-feature-reference.md`** — it maps every module to its code, rules, endpoints
and known gaps.

**There is no self-registration.** Influencers are onboarded outside the app by Humbee Ops or VCP field
staff. The only entry point is mobile + OTP for a number that already exists.

Parent entity: Twenty Point Nine Five Ventures Pvt. Ltd. (20p95) · https://humbee.in/

## Where things are

| Thing | Location |
| --- | --- |
| **v1 scope — the 12 screens, routes, endpoints, and what was deferred** | **`docs/08-screen-inventory.md`** |
| **Framework decision: RN CLI vs Next.js + Capacitor, scored** | **`docs/07-framework-comparison.md`** |
| Architecture + tech decisions, as ADRs | `docs/01-architecture.md` |
| **SaaS: selling modules per client — folder layout, manifests, entitlements, white-labelling** | **`docs/09-saas-and-module-architecture.md`** |
| **PER-MODULE CONTEXT — read before touching any module** | **`docs/11-feature-reference.md`** |
| How to build it: RN CLI bootstrap, MVVM layering, query/state/storage structure, libraries, CI | `docs/10-rn-cli-implementation-guide.md` |
| **The design spec of record** — 10 screen specs, tokens, fixtures, assets, prototype | **`docs/design-spec/`** |
| **Construction-site capture** — the 8-screen site flow on Demand Capture, and what the V2 contract changed about it | **`docs/construction-site-address-capture.md`** |
| Design system strategy, token pipeline, **and the precedence rules when specs conflict** | `docs/02-design-system.md` |
| API integration + client data rules | `docs/03-api-integration-and-data.md` |
| Design-system library reference (variant matrices, icons, status semantics) | `docs/design-system/HUMBEE-DESIGN-RULES.md` (loaded by the `humbee-design-system` skill) |
| Product requirements (broader than v1 — read with `08` beside it) | `docs/00-PRD.md` |
| Phased delivery plan | `docs/05-delivery-plan.md` |
| **Open questions and inputs still needed** | `docs/06-inputs-needed.md` |
| How to use Claude tooling here | `docs/04-claude-workflow.md` |

## The other folders on this machine

Sibling directories under `/Users/hariom/Documents/Projects/`:

| Folder | What it is | How to treat it |
| --- | --- | --- |
| `Influencer_App_Docs/humbee_influencer_backend` | The **server specification** for the influencer module. **`V2/` is what the backend actually serves** — 15 endpoints, captured from the running server, and it supersedes `contracts/openapi.yaml` wherever they disagree | Authoritative for the API; start at `V2/00-what-changed.md`. Its `frontend/docs/` is an **earlier draft of this repo's plan — superseded**; see the note below |
| `hymbee-backend` | The existing FastAPI + Postgres + Alembic + Redis monolith | Where the server actually runs. **Not this repo's concern** |
| `humbee-mobile-app` | The existing VCP React Native app (RN 0.79, React 19, Redux Toolkit) | `src/app_V3/theme` and `src/app_V3/UiKit` are built against the same design system. **Reuse, don't reinvent** — but check New Architecture compatibility before porting |
| `humbee-support` / `next-humbee-support` | Internal Ops consoles | Where Ops resolves disputes and allots gifts |

## The docs folder

**All frontend documentation now lives in `docs/`.** Nothing is referenced from a sibling folder any
more except the backend's API contract.

```
docs/
├── 00-PRD.md … 10-rn-cli-implementation-guide.md   the working doc set
├── design-spec/          THE DESIGN SPEC OF RECORD — authoritative for anything visual
│   ├── 01-product-and-scope.md … 10-implementation-plan.md
│   ├── 04-screens/       one spec per screen. Read this before building a screen
│   ├── tokens/           the 531 design variables as CSS — packages/tokens is generated from here
│   ├── data/             JSON fixtures. Wire screens to these before the API
│   ├── assets/           logos, illustrations, banners, Lottie
│   ├── screens/          a PNG of every screen as designed
│   └── prototype/        prototype-standalone.html — open in a browser, the live visual reference
├── design-system/        HUMBEE-DESIGN-RULES.md — the library reference (variant matrices, icons)
└── archive/              superseded. Do not build from anything in here
    ├── superseded-frontend-plan/   an earlier plan for this same client
    └── early-exploration/          pre-handoff wireframes and visual directions
```

**On `docs/archive/`:** `superseded-frontend-plan/` holds 15 documents planning this same client,
written earlier — good analysis, incorporated into this doc set, but **where the two disagree this doc
set wins**, and its internal relative paths are now stale. `early-exploration/` predates the design
handoff and matches nothing in the approved design. Do not edit or build from either.

## The stack

React Native on the **New Architecture**, **TypeScript strict**, on the **React Native CLI** with
`expo-modules-core` + `expo-updates` installed. React Navigation. TanStack Query + MMKV for server
state, Zustand for the little client state there is. Typed tokens + `StyleSheet`. FlashList for every
list. Reanimated for motion. `react-native-svg` for the HUMBEE icon set.

Rationale, the alternatives, and the scoring: `docs/07-framework-comparison.md`. Two live caveats —
**Expo CNG scores higher than the CLI** (re-open unless white-labelling is committed), and **OTA must be
proven in Phase 0** or the framework choice has to be revisited.

## Working rules for Claude in this repo

1. **Never invent product behavior.** If it is not in `docs/00-PRD.md` or `docs/08-screen-inventory.md`,
   ask or flag it. **Do not add features** — no search, no header notification bell, no chat, no
   referral. Their absence is deliberate.
2. **Never invent design values.** Pull from `packages/tokens` (generated from the handoff's CSS) or the
   handoff's `docs/design-spec/02-design-tokens.md`. A raw hex or magic number in a feature file is a defect. When
   two specs disagree, `docs/02-design-system.md` §3 says which wins — don't adjudicate it yourself.
3. **The server owns every number.** Points, ranks, gaps, totals, UOM conversions, period windows,
   status counts and `en-IN`-formatted labels all arrive computed. The HTML prototype computes them
   client-side *only so the design can be demonstrated*. **Never port that arithmetic.** If a number is
   missing, it is a contract gap to raise.
4. **Points post only on allocation.** V2 makes this structural rather than a matter of copy: a demand
   row carries **no points field at all**, so there is no number to mislabel. Never compute one. If a
   figure is ever shown before allocation it must read as an expectation — "900 pts expected", never
   "900 pts earned".
5. **Points conversion is config-driven.** Never hardcode a ratio, a base unit or a multiplier. The
   `/catalog/points-rules` endpoint was removed in V2 — the same block now arrives inline as
   `points_rule` on `GET /leaderboard`, and the per-SKU rate as `points_hint` on
   `GET /demand-capture/manufacturers/{id}/products`.
6. **Role is resolved per industry, never global.** An Influencer can be a Barbender in Steel *and* a
   Contractor in Cement simultaneously; any UI showing an allocation or activity must show the role for
   *that entry's* industry. **Caveat: no designed screen currently honours this**, and the question is
   open — `docs/06-inputs-needed.md` item 1. Until it resolves, build the designed screens as designed
   and **do not invent a role tag.**
7. **Low-literacy, entry-level Android (2–3 GB RAM) is the target**, outdoors, up to 5 lakh users.
   Icon-forward, large tap targets (≥ 48 dp), minimal typed input, Hindi + English at launch. Weigh
   every dependency against the 30 MB APK budget. Lists use FlashList, never `ScrollView` + `.map()`.
8. **The app runs on the live API. There is no fixture mode** — `src/api/fixtures/` is deleted.
   Point `src/api/config.ts` at a backend (`http://10.0.2.2:8001` from the Android emulator,
   which is the AVD's alias for the host's localhost) and run `npm run api:smoke` to confirm the
   backend is up before blaming the app.
9. **The auth endpoints take RSA-ENCRYPTED fields.** `mobile_number` and `otp` are encrypted with
   the platform's public key (RSA-OAEP/SHA-256 → base64) — `src/api/crypto.ts`. This is **not in
   the V2 contract doc**; sending plain digits fails with a generic "Something went wrong"
   that names neither the field nor the cause.
10. **Prefer editing the design-system packages** over one-off styles in screens.
11. **A module is a commercial unit, so it is a technical unit.** Modules are sold individually to
    manufacturers. **A module may never import another module**, the bottom nav and route tree are
    *derived* from the module registry rather than hardcoded, and every module must render correctly
    with every other module absent. `docs/09-saas-and-module-architecture.md` §5 has the full rules —
    they are enforced by `eslint-plugin-boundaries` in CI, so a violation is a red build.
12. **This repo is frontend only.** Server work belongs in `hymbee-backend`; server *specification*
    belongs in `humbee_influencer_backend/`. Don't add backend design here.
