# 15 — SaaS modules, multi-tenancy, and the revised stack decision

Two new constraints arrived after `01`–`14` were written:

1. **React Native CLI, not Expo.** A decision already taken.
2. **Some modules will be sold as SaaS to manufacturers.** Welspun, Dalmia, DP Paints and others
   become paying customers of the platform, not just brands inside it.

The second one is the bigger change, and it changes the answer in a way the earlier documents did not
anticipate. This document supersedes parts of `01`, `03`, `04` and `14` — the specific revisions are
listed at §15.9.

**The answer, up front:**

> **React Native CLI for the influencer app + Next.js for the manufacturer SaaS surface, in one
> pnpm monorepo sharing tokens, the API client, and domain logic. Flutter is now clearly out. Vite is
> for internal tools, not the SaaS product.**
>
> And: **do not run bare RN truly bare.** Install `expo-modules-core` and `expo-updates` into the CLI
> project (§15.2). That recovers the OTA capability the whole stack argument rested on, at almost no
> cost, and keeps `android/` and `ios/` fully yours — which the white-label requirement needs.

---

## 15.1 Why the SaaS point changes the decision

"Sell modules as SaaS to manufacturers" implies three things that were not in the v1 brief, and each
one has frontend consequences:

| Implication | Consequence |
| --- | --- |
| **A manufacturer-facing surface exists.** A brand paying for the Leaderboard module wants to see *their* standings, demand pipeline, allocation analytics, and points-rule configuration | That surface is a **web dashboard**. Manufacturers' staff work on desktops, want data tables, export, multi-window, keyboard navigation. Nobody sells a B2B analytics product as a mobile-only app |
| **Modules become licensable units** | The `features/` slice boundary in `03` §3.3 stops being a code-hygiene rule and becomes a **commercial boundary**. What a tenant has paid for must drive what renders |
| **White-labelling becomes plausible** | A manufacturer may want a branded app. That makes theming a runtime requirement, and it makes per-tenant native builds a requirement |

The decisive consequence is the first. **You are going to build a web frontend either way.** The
question is no longer "mobile: native or web?" — it is "given that a React web surface is certain,
what is the mobile app, and how much do the two share?"

That reframing does two things:

- **It eliminates Flutter.** Dart on mobile plus TypeScript on web means two type universes, two
  generated API clients from the same `openapi.yaml`, two token pipelines, two i18n catalogues, and two
  implementations of every domain rule. Flutter scored 133 in `14` §14.6 with C7 (shared types) at 2;
  with a certain web surface, that weakness roughly doubles. Flutter is a fine framework and it is now
  the wrong one for this platform.
- **It strengthens the all-web option** (Vite/Next + Capacitor), because that option shares not just
  tokens and API types but the primitive component library too. This is dealt with honestly at §15.7 —
  it is closer than it was.

## 15.2 React Native CLI: what it costs, and the mitigation that matters

Your decision is reasonable, and for the white-label requirement it is arguably **better** than Expo:
owning `android/` and `ios/` outright makes Android product flavors and iOS schemes/targets
straightforward, and per-tenant native assets are a build-config change rather than a fight with
generated projects (§15.5).

But be clear-eyed about what leaving Expo costs, because one of the items was load-bearing in the
original recommendation.

| What you give up | Severity | Mitigation |
| --- | --- | --- |
| **EAS Update / OTA** | **Critical.** OTA carried weight 5 and was the single strongest reason RN beat Flutter (`02` §2.2B). Without it, the case for RN over Flutter substantially weakens | **Install `expo-updates` into the bare project.** It is supported in bare RN and works with EAS Update without adopting Expo Router, Expo Go, or the managed workflow. Alternatively self-host CodePush — but note App Center's retirement took the hosted CodePush service with it, so that route means running the server yourself. Verify the current state of both at bootstrap |
| `expo install` version resolution | Moderate | Pin manually; use the React Native Upgrade Helper diffs at every RN bump; treat `package.json` as a curated file, not an append log |
| Config plugins (`app.config.ts`) | Moderate | You edit `AndroidManifest.xml`, `Info.plist`, Gradle and Podfile by hand. Fine — but it means every native dependency is a real code review, so §8.7's checklist matters more, not less |
| `expo prebuild` / CNG | Moderate → **partly a benefit here** | You lose regenerable native projects, which is the main upgrade-cost argument in `01` §1.2. You gain the direct control that white-labelling needs. Accept the trade knowingly, and budget for RN upgrades |
| `expo-doctor` | Minor | Replace with a documented dependency-audit step in the bootstrap procedure (`13` §13.10) |
| The `expo-*` module library | **Not lost** | `npx install-expo-modules` adds `expo-modules-core` to a bare RN app, after which `expo-image`, `expo-secure-store`, `expo-camera`, `expo-haptics`, `expo-localization` and the rest all work. Every library recommendation in `13` stands |
| EAS Build | **Not lost** | EAS Build supports bare RN projects. Or run native builds in your own CI — with white-label flavors you will likely want that control anyway |

**The one non-negotiable:** decide the OTA mechanism **in Phase 0**, before the first screen. If the
answer turns out to be "we have no OTA", then the honest comparison against Flutter has to be reopened,
because you would have discarded the criterion that decided it. Do not discover this in month six.

**The other real cost is the RN upgrade treadmill.** With CNG, an SDK bump is a regenerate. With bare
RN, it is a manual three-way merge across `android/`, `ios/`, Gradle, and the Podfile — and with
per-tenant flavors layered on top, that merge gets harder. Budget it: roughly one engineer-week per RN
minor upgrade, twice a year, and name the person who owns it. An RN app that falls four versions behind
is how mobile codebases become unmaintainable, and the white-label variants multiply the surface.

## 15.3 The architecture: one monorepo, two frontends

This reverses `01` §1.4, which said "no monorepo — one app, one folder." That was correct for a single
mobile app. It is wrong once a SaaS web surface is certain.

```
humbee_influencer_backend/            ← this repo
├── contracts/openapi.yaml            ← still the single source of API truth
├── docs/                             ← server specification
└── frontend/
    ├── package.json                  ← pnpm workspace root
    ├── pnpm-workspace.yaml
    ├── apps/
    │   ├── influencer-mobile/        ← React Native CLI. The 10 screens.
    │   └── manufacturer-web/         ← Next.js. The SaaS product.
    └── packages/
        ├── tokens/                   ← the 531 design variables, ONE source, two outputs
        ├── api-client/               ← generated from ../../contracts/openapi.yaml + the envelope wrapper
        ├── domain/                   ← pure TS: entitlements, status machines, validation, en-IN formatting
        ├── i18n/                     ← en / hi / mr message catalogues
        └── analytics/                ← the typed event catalogue and track() contract
```

### What is shared, and what deliberately is not

| Package | Shared? | Reasoning |
| --- | --- | --- |
| `tokens` | **Yes** | One source, two emitters: a TS object for RN `StyleSheet`, and CSS custom properties for the web. This is where the SaaS story pays off most — a white-label theme is one token override consumed by both surfaces |
| `api-client` | **Yes** | `openapi-typescript` against `contracts/openapi.yaml`, plus the envelope-unwrapping wrapper from `06` §6.2. Both surfaces talk to the same platform; writing the envelope logic twice guarantees they diverge |
| `domain` | **Yes** | Entitlement checks, the demand/gift status machines, `en-IN` formatting, quantity display rules. Pure functions, no React, no platform imports. Highest-value sharing after tokens |
| `i18n` | **Yes** | The dashboard needs `en` at minimum; keeping one catalogue means a copy change lands in both |
| `analytics` | **Contract only** | The typed event names and property shapes are shared; the provider adapters are per-platform |
| **UI components** | **No** | This is the important one. A mobile influencer app and a manufacturer analytics dashboard share almost no components in practice — the dashboard is data tables, filter panels, date-range pickers, charts and CSV export; the mobile app is hex avatars, podiums and pick cards. Sharing the *tokens* gets you a consistent brand; sharing *components* would mean building every primitive twice as abstract and using each once |

**Do not use `react-native-web` to build the dashboard.** It is a real technology and it works, but a
desktop B2B analytics surface needs hover states, keyboard navigation, right-click, text selection,
print styles, dense data tables and real `<table>` semantics for accessibility. RNW fights all of that.
Build the dashboard as a normal Next.js app that imports `@humbee/tokens`.

## 15.4 Why Next.js for the SaaS surface — and why that is not a contradiction

`14` §14.1 said to drop Next.js. That was specifically about wrapping Next in Capacitor to make a
*mobile* app, where every server-side feature is inert. For a **manufacturer-facing web dashboard**,
those same features are exactly what you need. Both statements hold:

| Requirement of a multi-tenant SaaS dashboard | Next.js |
| --- | --- |
| Tenant routing — `welspun.humbee.in`, `dalmia.humbee.in` | Middleware resolves the subdomain to a tenant before render. This is the canonical Next.js multi-tenancy pattern |
| Data-heavy tables rendered fast on a mediocre office desktop | RSC / SSR keeps the payload and the client JS small; the dashboard is read-heavy, exactly SSR's strength |
| Public marketing and pricing pages for the SaaS product | SSG/ISR + real SEO. You are selling a product; it needs to be findable |
| Server-side session handling, and a BFF that hides platform internals from a tenant's browser | Route handlers and server actions |
| Per-tenant theming at request time | Resolve the tenant's token overrides server-side and emit them as CSS variables in the document — no flash of the wrong brand |
| CSV/XLSX export, scheduled reports | Route handlers, and a server that can stream |

**Where Vite fits:** internal tools. An ops console, a QA fixture viewer, a token playground — things
with no SEO, no tenant subdomains and no server rendering needs. Do not build the revenue-generating
tenant-facing product in a Vite SPA; you would reimplement middleware routing, server-side theming and
SEO by hand.

## 15.5 Multi-tenancy for the mobile app

Three models. Pick per-tenant, not once for all time — and the packaging follows the commercial deal.

| Model | What it is | When | Cost |
| --- | --- | --- | --- |
| **A. One app, tenant from login** | The HUMBEE app. `mfr` is already a first-class axis in the design — the manufacturer tab bar *is* multi-tenancy in the UI | **Default. Start here.** It is what the design and the API already describe | None. Already built |
| **B. White-label build** | A separately branded, separately listed app: `com.humbee.welspun`, Welspun icon, splash, colours | When a manufacturer pays for it. Their procurement team will ask | Real: a store listing, review cycle, signing keys, Maps API key, and a release lane **per tenant** |
| **C. Runtime-themed single app** | One binary that repaints from the tenant's tokens after login | If several manufacturers want branding but none wants a separate listing | Moderate. Needs §15.6 |

**B is where owning `android/` and `ios/` pays off**, and it justifies your CLI decision:

- **Android:** product flavors in `build.gradle` — one flavor per tenant, each with its own
  `applicationId`, `res/` overrides for icon and splash, and its own `google-services.json` if Firebase
  is per-tenant.
- **iOS:** one target or scheme per tenant with per-tenant `xcconfig` and asset catalogues.
- **CI:** the build matrix multiplies. Four tenants × two platforms is eight artifacts per release, and
  a manual release process will not survive that. **Automate the release lane before the second
  tenant**, not after.
- **Cap it.** Every white-label build is a permanent release-and-support obligation. Price it that way,
  and prefer C over B whenever the customer will accept it.

## 15.6 The two things the SaaS requirement forces on the frontend

### Runtime theming — revising `04` §4.6

`04` §4.6 said: no theme provider, do not build one "for later". **That is now wrong.** White-labelling
and per-tenant branding make theming a product requirement, so build it — but build it narrowly:

```ts
// packages/tokens — the shape
export const humbeeTheme: Theme = { colours: {...}, type: {...}, radius: {...}, elevation: {...} };
export type Theme = typeof humbeeTheme;

// A tenant supplies overrides only. Anything absent falls back to HUMBEE.
export type ThemeOverride = DeepPartial<Pick<Theme, 'colours'>> & { logoUrl?: string };
```

Rules that keep this from becoming a mess:

- **Only colours and brand assets are themeable.** Type ramp, spacing, radii, elevation and motion stay
  fixed. They encode the design system's structure, and a tenant changing the spacing scale is how a
  design system dies. `Pick<Theme, 'colours'>` in the type enforces it.
- **Compile-time default, runtime override.** The HUMBEE theme is a static import so the app renders
  correctly before any network call. Tenant overrides arrive from `/config` and are cached in MMKV so a
  cold start does not flash the wrong brand.
- **The typed-token guarantee from `04` §4.2 survives.** `colours.primary100` still cannot be
  misspelled; it now resolves through a theme context instead of a module constant. Do not weaken it to
  string keys.
- **Contrast is a validation problem.** A tenant supplying their brand colour can produce unreadable
  chips and inaccessible text. Validate contrast ratios when a theme is accepted — server-side, at
  onboarding — not at render time on the device.
- **The hexagon stays.** The brand shape, the icon set and the motion spec are HUMBEE's product
  identity, not the tenant's. Theming means colours and a logo.

### Entitlements — modules as commercial units

`03` §3.3's rule that features cannot import each other was written for maintainability. It now also
makes each `features/` slice independently sellable. Add the layer that makes it commercial:

```ts
// packages/domain/entitlements.ts
export type ModuleId = 'leaderboard' | 'demand' | 'allocation' | 'rewards' | 'analytics';
export function can(entitlements: Entitlements, module: ModuleId): boolean;
```

| Rule | Why |
| --- | --- |
| **Entitlements come from the server, in the token or `/config`** | A client-side entitlement is a licence anyone can edit. The `/config` endpoint already exists in `contracts/openapi.yaml`; extend it |
| **The server enforces; the client only renders** | Same discipline as `06` §6.8's "server owns the numbers". An unentitled module must 403 at the API, not merely be hidden in the nav |
| **Nav is derived from entitlements, never hardcoded** | The bottom nav is five fixed items in v1. Build it from a filtered list now, or every tenant permutation becomes a code change |
| **An unentitled module degrades gracefully** | Not a crash, not a blank tab — either absent from the nav, or a priced upsell screen if that is the commercial intent |
| **Unknown module ids must not crash** | Same defensive-default rule as `08` §8.6's status badges. New modules will ship to the server before the app knows about them |

One decision to take deliberately: **entitlements gate the nav, not the bundle.** Code-splitting a
React Native bundle per tenant is possible and rarely worth it — the whole app is a few MB and the
security boundary is the API, not the bundle. Revisit only if a tenant contractually requires that
their build not contain another module's code.

## 15.7 Re-scored, with the two new criteria

Same weights as `14` §14.6, plus:

- **C10 — SaaS web surface reuse (weight 4).** How much of the mobile work serves the manufacturer
  dashboard.
- **C11 — White-label / per-tenant builds (weight 3).**

Options, all assuming the Next.js dashboard exists in every case:

| Criterion (weight) | **A. RN CLI + expo-updates** | A′. RN CLI, no OTA plan | B. Flutter | C. Vite+React+Capacitor |
| --- | --- | --- | --- | --- |
| C1 OTA delivery (5) | 5 | **1** | 2 | 5 |
| C2 Low-end Android smoothness (5) | 4 | 4 | 5 | **2** |
| C3 Design fidelity (4) | 4 | 4 | 5 | 5 |
| C4 Native capabilities (4) | **5** | 5 | 4 | 3 |
| C5 India hiring + community (4) | 5 | 5 | 4 | 5 |
| C6 3-year maintainability (4) | 3 | 3 | 4 | 5 |
| C7 Shared types with the contract (3) | 5 | 5 | 2 | 5 |
| C8 Time to v1 (3) | 3 | 3 | 4 | 5 |
| C9 Size + cold start (3) | 3 | 3 | 4 | 4 |
| C10 SaaS web reuse (4) | 4 | 4 | **1** | **5** |
| C11 White-label builds (3) | **5** | 5 | 4 | 4 |
| **Weighted total (max 210)** | **181** | **161** | 149 | **181** |

Three things to read out of that table, none of them comfortable:

1. **Flutter drops to 149 and is now clearly out.** C10 at 1 is the reason — with a certain TypeScript
   web surface, a Dart mobile app shares nothing.
2. **RN CLI *without* an OTA plan (A′) scores 161 and loses to everything.** This is the single most
   important number here. The CLI decision is fine; the CLI decision *without* `expo-updates` or a
   self-hosted CodePush throws away 20 points and, with them, the original argument for RN.
3. **A and C tie at 181.** The SaaS requirement genuinely closed the gap: the all-web option gains on
   C10 (shared primitives), C6 and C8, while RN CLI gives up ground on C6 and C8 versus the Expo
   version scored in `14`. Anyone who tells you this is obvious is not doing the arithmetic.

## 15.8 So why still React Native, on a tie?

Because **C2 is a threshold, not a slope**, and a weighted average cannot express that.

Below roughly 58fps on the Leaderboard and Rewards lists, the product is bad on the devices its users
actually own — and no amount of C6, C8 or C10 compensates, because those criteria measure how
pleasantly you build a thing nobody enjoys using. Above that threshold, web's advantages are real and
it deserves to win. That is precisely why `14` §14.8's spike is the decisive artefact, and the SaaS
requirement makes it *more* important, not less.

Three additional arguments that the score does not capture, all pointing the same way:

1. **The mobile app is now your sales demo.** When you pitch the Leaderboard module to a manufacturer's
   procurement team, the app is the product. Jank on a Redmi in that meeting is a revenue problem, not
   a UX ticket. Native quality is worth more once the app is being sold than when it is merely being
   used.
2. **The ceilings from `14` §14.4 are unchanged.** Real-time camera frame processing — OCR of a VCP
   invoice, continuous bag-tag scanning — is "cannot" in a WebView, and it is a plausible module to
   sell.
3. **Bare RN CLI maximises exactly what white-labelling needs** (C4 and C11 both at 5). Product
   flavors, per-tenant native assets, any native module without waiting for a plugin. Your constraint
   and this requirement fit together well.

**And the honest counter-case**, so the decision is made with open eyes: if the spike shows the web
build holding 58fps, and if the roadmap's camera work stays aspirational, then a single React codebase
serving both the mobile app and the dashboard — one team, one language, one component library, one
deployment story — is a genuinely strong answer, and it scores level. Take the measurement before
committing engineering years.

## 15.9 What this document revises

| Document | Section | Change |
| --- | --- | --- |
| `01-tech-stack-decision.md` | §1.2 toolchain row | Expo CNG → **RN CLI with `expo-modules-core` + `expo-updates` installed**. Native projects are checked in and owned |
| `01` | §1.2 navigation row | Expo Router assumed Expo. With bare RN use **React Navigation** directly — native stack + bottom tabs, as the handoff originally recommended. Deep links (`05` §5.2) become a hand-written linking config instead of a file tree |
| `01` | §1.4 "Not using: a monorepo" | **Reversed.** pnpm workspaces, per §15.3 |
| `03-project-structure.md` | §3.1–3.2 | The app moves to `frontend/apps/influencer-mobile/`; shared code moves to `frontend/packages/*`. The feature-slice rules inside the app are unchanged — and now also define sellable units |
| `04-design-tokens-and-theming.md` | §4.6 "no theming" | **Reversed.** Runtime theming is required; scoped to colours and brand assets only, per §15.6 |
| `04` | §4.2 generator | Now emits two targets from one source: a TS theme object for RN, CSS custom properties for Next.js |
| `11-release-and-ota.md` | Throughout | EAS Update still applies via `expo-updates` in bare RN, but verify the mechanism at bootstrap. The build matrix multiplies by tenant (§15.5) |
| `13-dependency-manifest.md` | §13.2 | Remove `expo`, `expo-router`. Add `react-native`, `@react-navigation/*`, `expo-modules-core`, `expo-updates`. Every other `expo-*` module recommendation stands via `install-expo-modules` |
| `14-web-stack-evaluation.md` | §14.9 | The recommendation stands, but the margin is thinner: with a SaaS web surface, all-web ties rather than trails. The §14.8 spike is now the decisive step, not a formality |

## 15.10 Phase 0 additions

Add these to `12-implementation-roadmap.md` Phase 0, before any screen:

- [ ] **Decide and prove the OTA mechanism.** `expo-updates` in the bare project, or a self-hosted
      CodePush. Ship a trivial JS change over the air to a real device and confirm it lands. This gates
      everything — see A′ in §15.7
- [ ] Set up the pnpm workspace with `tokens`, `api-client`, `domain` before either app has a screen.
      Retrofitting a monorepo after two apps exist is a week nobody budgets
- [ ] Token generator emits **both** targets; verify a colour change propagates to RN and Next in one
      commit
- [ ] Theme context wired in the mobile app with HUMBEE as the compile-time default, even though only
      one tenant exists. The plumbing is cheap now and invasive later
- [ ] `can(entitlements, module)` in `packages/domain`, and the bottom nav derived from it — with all
      five modules entitled. Same reasoning
- [ ] Name the owner of RN upgrades, and put the twice-yearly slot in the calendar (§15.2)
- [ ] Run the `14` §14.8 spike. It is now the decisive input, not a formality
- [ ] Confirm with the backend team how tenant scoping lands in the token and `/config` — the platform
      already scopes tokens by audience (`../docs/08-auth-and-security.md`), so this is an extension of
      an existing mechanism rather than a new one
