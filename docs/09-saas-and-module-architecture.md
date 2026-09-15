# 09 — SaaS & Module Architecture

**The requirement.** Modules are sold individually to manufacturers for their own influencer base:
Welspun buys Leaderboard and Rewards; Dalmia buys Demand and Allocation; a third buys everything. The
app must render what a tenant paid for and nothing else, and adding tenant #7 or module #12 must not be
a refactor.

**The principle everything below follows:** a module is a **commercial unit, so it must also be a
technical unit**. If two modules can reach into each other's code, neither can be sold or withheld
independently — you get a bundle with hidden coupling, discovered the first time a tenant declines one
of them. The boundary rule in ADR-003 started as code hygiene; here it becomes the product.

**Build this in Phase 0, with one tenant and every module entitled.** The plumbing is cheap while it is
speculative and invasive once nine screens exist. That is the whole reason it is worth doing before the
first module is sold.

---

## 1. Three layers people conflate

Getting these separated is most of the design. They have different owners, lifetimes and failure modes.

| Layer | Question it answers | Owner | Enforced where |
| --- | --- | --- | --- |
| **Entitlement** | *Has this tenant paid for this module?* | Commercial / contracts | **The API. `403` on an unentitled module.** The client only renders |
| **Feature flag** | *Is this behaviour switched on?* | Ops / engineering | Client-side, from config. Kill-switches, gradual rollouts, per-tenant behaviour tweaks |
| **Theme** | *Whose brand is this?* | The tenant | `packages/tokens` — **colours and logo only** |

**Never implement an entitlement as a feature flag.** A flag is an operational convenience anyone can
flip; an entitlement is a licence. If the only thing standing between a tenant and the Rewards module is
a boolean in the client, they have bought it. The client-side check exists to avoid rendering a dead
tab — not to protect revenue.

---

## 2. Folder architecture

```
apps/mobile/src/
├── core/                          # always present. Never sold, never entitled, never absent
│   ├── auth/                      #   login, OTP, session, route guard
│   ├── language/                  #   first-launch chooser (screen 00)
│   ├── shell/                     #   header, bottom nav host, scroll container, offline banner
│   ├── navigation/                #   the nav host + linking config, both built FROM the registry
│   └── config/                    #   GET /config fetch, tenant + entitlements + theme resolution
│
├── modules/                       # each folder is one sellable unit
│   ├── home/                      #   entitlement: null (always on, but adapts — see §6)
│   │   ├── manifest.ts            #   ← the module's entire contract with the app
│   │   ├── screens/
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── i18n/                  #   its own namespace
│   │   └── index.ts               #   the ONLY public surface: exports the manifest, nothing else
│   ├── leaderboard/
│   ├── demand/                    #   screens 06, 07, 08 — one module, three screens
│   ├── allocation/
│   ├── rewards/
│   ├── profile/                   #   entitlement: null
│   └── notifications/
│
└── shared/                        # cross-cutting, non-domain: providers, error boundaries, analytics
```

```
packages/
├── tokens/          # 531 variables + the tenant theme-override contract
├── api-client/      # generated from contracts/openapi.yaml
├── domain/          # pure TS: entitlements, status machines, en-IN formatting, validation
├── module-host/     # ← NEW. Manifest types, the registry, nav builder, route mounting, guards
├── ui/              # design-system primitives
├── i18n/            # catalogue loader + the core namespace
├── analytics/       # typed event catalogue + track() contract
└── config/          # eslint (incl. boundaries), tsconfig, prettier, jest
```

**Why `core/` and `modules/` are separate directories rather than a flag on each module.** Auth,
language and the shell have no meaningful "absent" state — an app without login is not a cheaper app,
it is a broken one. Keeping them in a different tree means "can this be switched off?" is answered by
the file path, and nobody has to remember that `entitlement: null` on `auth` was load-bearing.

---

## 3. The module manifest

A module declares itself. Nothing about it is registered by hand anywhere else — that is what stops the
tenth module from being a hunt through six files.

```ts
// packages/module-host/src/types.ts
export interface ModuleManifest {
  /** Stable id. Matches the entitlement string the server sends. Never renamed — it is a contract. */
  id: ModuleId

  /** null = core, always present. Otherwise the entitlement required to mount it. */
  entitlement: ModuleId | null

  /** Absent = the module has screens but no bottom-nav entry (e.g. notifications). */
  nav?: {
    labelKey: I18nKey          // never a literal string — see §7
    icon: { active: IconName; inactive: IconName }
    order: number              // sparse (10, 20, 30) so insertion needs no renumbering
  }

  /** Routes this module owns. Mounted only when entitled. */
  routes: RouteDef[]

  /** Which route the nav entry lands on, when the module owns several. */
  initialRoute: RouteName

  /** i18n namespace, lazily loaded with the module. */
  i18nNamespace: string

  /** Deep links this module claims: humbee://leaderboard?mfr=welspun */
  deepLinks?: DeepLinkPattern[]

  /** Analytics events this module may emit. Compile-time checked against the catalogue. */
  events?: readonly EventName[]
}
```

And the registry — the single place that knows what exists:

```ts
// apps/mobile/src/modules/registry.ts
import { home } from './home'
import { leaderboard } from './leaderboard'
// ...one line per module. This file is the only place a module is named.

export const ALL_MODULES = [home, leaderboard, demand, allocation, rewards, profile, notifications] as const
```

```ts
// packages/module-host/src/resolve.ts
export function resolveModules(all: readonly ModuleManifest[], ent: Entitlements) {
  return all
    .filter(m => m.entitlement === null || can(ent, m.entitlement))
    .sort((a, b) => (a.nav?.order ?? Infinity) - (b.nav?.order ?? Infinity))
}

export function buildNav(mods: readonly ModuleManifest[]) {
  return mods.filter(m => m.nav)   // nav is DERIVED, never a hardcoded array
}
```

**The bottom nav, the route tree and the linking config are all built from this.** Not one of them
contains a literal module list. That is the difference between adding a module and editing seven files.

---

## 4. The tenant config contract

One call at cold start, cached in MMKV so a launch with no network renders the right brand and the right
nav rather than flashing HUMBEE's and then rearranging.

```jsonc
// GET /config
{
  "tenant":       { "id": "welspun", "name": "Welspun TMT", "logoUrl": "https://…" },
  "entitlements": ["leaderboard", "rewards", "notifications"],
  "theme":        { "colours": { "primary100": "#00539F", "primary10": "rgba(0,83,159,0.10)" } },
  "flags":        { "demand.offlineQueue": true, "leaderboard.podium": false },
  "catalogVersion": 12
}
```

**Rules.**

- **Entitlements arrive from the server** — in `GET /config` or as a token claim. Never compiled in,
  never inferred from the tenant id, never stored in a build.
- **Unknown ids must not crash.** New modules will ship to the server before this build knows them.
  `resolveModules` ignores what it cannot match; `can()` returns false for anything unrecognised. Same
  defensive default as unknown status values (`03-api-integration-and-data.md` §5).
- **A missing `/config` is not an empty entitlement set.** On a cold start with no cache and no network,
  fall back to the **bundled default** (HUMBEE theme, all core modules) rather than rendering an app with
  no tabs. An empty nav looks exactly like a broken app.
- **Cache, then revalidate.** Render from the cached config immediately; apply changes on the next launch
  rather than mid-session. A nav bar that rearranges under the user's thumb is worse than being one
  session stale.
- **Entitlement changes mid-session are ignored until relaunch.** A tenant's contract does not change
  while someone is looking at a screen, and handling it live means unmounting a route the user is on.

---

## 5. The rules that keep modules sellable

These are enforced by `eslint-plugin-boundaries` in CI, not by good intentions.

| # | Rule | Why |
| --- | --- | --- |
| 1 | **A module may never import another module.** Not a component, not a hook, not a type | The load-bearing rule. One violation and the two modules are one product |
| 2 | A module may import `core/`, `shared/` and `packages/*` | The permitted directions. Anything else fails the build |
| 3 | **`core/` may never import a module** | Core must boot with zero modules mounted, or "tenant bought one module" is untestable |
| 4 | A module's `index.ts` exports **only its manifest** | If nothing else is reachable, nothing else can be depended on. This is what makes rule 1 mechanically enforceable rather than aspirational |
| 5 | Cross-module needs get **promoted**, never imported — to `packages/domain` (pure logic) or `core/` (shared UI/state) | The promotion is a deliberate, reviewable act. A direct import is not |
| 6 | Modules navigate by **route name**, never by importing another module's screen | `navigate('rewards')` is a string that can fail gracefully; an import cannot |
| 7 | **Every module must render correctly with every other module absent** | See §6 — this is the rule most likely to be broken, and it is broken by *design*, not by code |
| 8 | Shared server data crosses modules via the **query cache**, keyed by endpoint — never by passing data through navigation params | Two modules reading `GET /home` share one cache entry and one refetch, with no dependency between them |

**On rule 6, concretely:** navigating to a module the tenant does not have must degrade, not throw. The
nav host resolves an unmounted route to either a no-op (if the link came from a banner or a
notification) or a priced upsell screen (if that is the commercial intent). Decide which **once**, in
`core/navigation`, rather than per call site.

---

## 6. The problem this architecture exists to catch: Home

Worth its own section, because it is the concrete case that proves the rules are not theoretical.

**Home is `entitlement: null` — always present. But Home links to everything.** Its designed layout has
a quick-links row pointing at Leaderboard, Demand and Rewards, and a "My Rewards" list.

A tenant who buys only Demand gets a Home screen with two dead quick links and an empty rewards
section. Nobody would ship that deliberately; it ships by accident because Home was built when all
modules existed.

**So:**

- **Home's quick-link row is derived from the resolved module list**, exactly like the bottom nav. Same
  registry, same filter — not a second hardcoded list that drifts from the first.
- **`GET /home` must return only entitled sections.** The client filtering a payload it should not have
  received is a workaround; the server knowing the tenant's entitlements is the design. Raise this as a
  contract requirement — it is in `06-inputs-needed.md`.
- **Home must look designed with one module, not sparse.** A single quick link in a row built for four
  is worse than a different layout. This needs a design decision, and it is the reason §8's test matrix
  matters more than it looks.

The same reasoning applies to Profile (server-driven `rows`, so mostly safe) and to the notification
deep links, which can point at any module.

---

## 7. Theming, i18n and analytics under multi-tenancy

**Theme — colours and brand assets only.**

- **Type ramp, spacing, radii, elevation and motion stay fixed.** They encode the design system's
  structure; a tenant changing the spacing scale is how a design system dies. Enforce it in the type:
  `DeepPartial<Pick<Theme, 'colours'>> & { logoUrl?: string }`. Not a convention — a compile error.
- **The hexagon, the icon set and the motion spec are HUMBEE's product identity, not the tenant's.**
- **Compile-time default, runtime override.** HUMBEE's theme is a static import so the first frame is
  correct; the tenant's overrides arrive from config and are cached.
- **Contrast is validated server-side at tenant onboarding**, not at render time on the device. A
  tenant's brand colour can produce unreadable chips and inaccessible text, and the device is the wrong
  place to discover it.
- The typed-token guarantee survives: `colours.primary100` still cannot be misspelled — it resolves
  through a theme context instead of a module constant. **Do not weaken it to string keys.**

**i18n — per module, and per tenant only where it must be.** Each module owns a namespace, lazily
loaded with it, so an unentitled module costs nothing at runtime. Tenant-specific *copy* (a brand's
preferred term for a gift, say) is a namespace overlay resolved above the base catalogue — and it should
be resisted: every overlay is a translation matrix that grows by tenant × language.

**Analytics — one taxonomy, tenant as a dimension.** `tenantId` is a property on every event, never a
separate event name. Manifests declare the events they emit and the catalogue is compile-checked, so a
module cannot quietly invent an event that never reaches a dashboard.

---

## 8. Testing that a tenant's build actually works

The failure mode of this architecture is specific: **the app works with all modules on, and breaks with
a subset**. Nobody finds that by using the dev build, because the dev build has everything.

Add to CI:

| Test | What it catches |
| --- | --- |
| Boot with **every module entitled** | The baseline |
| Boot with **only core** — no modules | Rule 3. Core must not import a module |
| Boot with **each module solo** (one run per module) | Rule 7 — the module assuming a sibling exists |
| Boot with **each realistic tenant bundle** (e.g. `leaderboard`+`rewards`) | The combinations you will actually sell |
| Boot with an **unknown module id** in entitlements | The forward-compatibility default |
| Boot with **`/config` unreachable** and no cache | The bundled-default fallback, not an empty nav |
| Snapshot the **resolved nav and Home quick links** per bundle | Silent drift between the two derived lists |

These are fast — they mount the registry and assert on resolved routes, not on rendered pixels — so run
them on every PR. A "module solo" suite is the single highest-value test in this codebase, because it is
the only thing that exercises the product you are actually selling.

---

## 9. Packaging: how a tenant gets the app

Three models. **Pick per tenant, not once for all time** — the packaging follows the commercial deal,
and the cost differs by an order of magnitude.

| Model | What it is | When | Cost |
| --- | --- | --- | --- |
| **A. One app, tenant resolved at login** | The HUMBEE app. Entitlements and theme arrive from `/config`. The manufacturer tab bar the design already has *is* multi-tenancy in the UI | **Default. Start here** | None beyond §2–§8 |
| **B. Runtime-themed single app** | One binary, repainted from the tenant's tokens after login. Still one store listing | Several manufacturers want branding, none needs their own listing | Moderate. §7, and a contrast-validation step at onboarding |
| **C. White-label build** | A separately branded, separately listed app: `in.humbee.welspun`, their icon, splash and colours | A manufacturer pays for it. Their procurement team will ask | **Real and recurring** — see below |

**Model C is where the cost hides, and it is not the code.** It is a store listing, a review cycle, a
signing key, a Maps API key, a Firebase project and a release lane **per tenant, forever**. Four tenants
× two platforms is eight artifacts per release. A manual release process will not survive that.

- **Automate the release lane before the second tenant**, not after the fourth.
- **Cap the number of white-label builds and price them accordingly.** Prefer B whenever the customer
  will accept it.
- **Entitlements still come from the server even in a white-label build.** Hardcoding them into a
  per-tenant binary means a contract change needs a store release.

---

## 10. What this does *not* do, deliberately

| Not doing | Why |
| --- | --- |
| **Per-tenant bundle splitting** | Entitlements gate the **nav, not the bundle**. The whole app is a few MB, and the security boundary is the API. Revisit only if a tenant contractually requires that their binary not contain another module's code |
| **Dynamic/remote module loading** | Downloading a module at runtime means unsigned code paths, a store-policy conversation, and debugging a build you cannot reproduce. The OTA channel already ships JS changes; that is enough |
| **A plugin API for third parties** | Nobody outside the team writes modules. Designing for an audience that does not exist buys abstraction and costs clarity |
| **Per-tenant forks or branches** | The fastest way to lose the ability to ship. One codebase, config-driven |
| **Tenant-specific business logic in a module** | Points rules, UOMs and catalogues are already **server-driven config**. A `if (tenant === 'welspun')` in client code is a defect — it means a contract change needs an app release |

---

## 11. Phase 0 checklist

Ordered. Items 1–4 are the ones that are invasive to retrofit.

- [ ] 1. `packages/module-host`: manifest types, `resolveModules`, `buildNav`, route mounting, the
      unmounted-route guard.
- [ ] 2. `can(entitlements, module)` in `packages/domain`, with the unknown-id default returning false.
- [ ] 3. **Bottom nav, route tree and linking config all derived from the registry** — with one tenant
      and every module entitled, so the mechanism is proven while the output is trivial.
- [ ] 4. Theme context, HUMBEE as the compile-time default, `Pick<Theme,'colours'>` enforced in the type.
- [ ] 5. `core/` vs `modules/` split, with `eslint-plugin-boundaries` failing on rules 1–4 of §5. **Land
      the lint rule with the folders**, or the first violation arrives before the rule does.
- [ ] 6. `GET /config` consumed, cached in MMKV, with the bundled-default fallback path tested.
- [ ] 7. The §8 CI matrix — at minimum all-on, core-only, and each module solo.
- [ ] 8. Confirm with the backend team how tenant scoping and entitlements land in the token or
      `/config`, and that `GET /home` returns only entitled sections (§6). The platform already scopes
      tokens by audience, so this extends an existing mechanism rather than inventing one.

---

## 12. How this affects the framework decision

It sharpens one point and reverses another.

**It confirms React Native and rules Flutter out further.** A manufacturer-facing web dashboard is
certain in a SaaS model — brands paying for a Leaderboard module want their standings, pipeline and
points-rule configuration on a desktop, and nobody sells B2B analytics as a mobile-only app. That means
a TypeScript web surface exists no matter what, and a Dart mobile app shares no tokens, no domain logic,
no API client and no i18n catalogue with it. Every rule gets implemented twice.

**It does *not* settle Expo CNG vs the RN CLI in the CLI's favour — see `01-architecture.md` ADR-001.**
Per-tenant native builds are the one place the CLI was argued to win, and on inspection the advantage is
thinner than it looks: with CNG, per-tenant identifiers, icons, splash screens and Firebase files are
generated from `app.config.ts` plus one build profile per tenant, which for *many* tenants scales better
than hand-maintained Gradle flavors and Xcode schemes. Config-as-code beats config-as-checked-in-XML
precisely when the number of variants grows.
