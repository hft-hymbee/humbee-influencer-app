# 05 — Delivery Plan

Sequenced so the riskiest assumptions are tested first and nothing waits on a decision that could have
been made in week one. Scope is the 12 screens in `08-screen-inventory.md`.

---

## Phase 0 — Foundations, and two spikes that can change the plan

Nothing in Phase 1 should start before 0.1 and 0.2 have answers, because both can invalidate the stack.

| # | Work | Output |
| --- | --- | --- |
| **0.1** | **Prove the OTA mechanism.** Install `expo-updates` into the bare RN project and ship a trivial JS change over the air to a real device | A JS-only fix landing without a store release. **If this cannot be made to work, stop and re-open `07-framework-comparison.md`** — the RN CLI score drops to 223 and loses to Expo CNG and to both web options |
| **0.2** | **Run the Leaderboard performance spike** (`07-framework-comparison.md` §11). Build the screen in RN and in Vite+Capacitor; measure on the reference device | A frame-time number, and the framework decision confirmed on evidence rather than on this document |
| 0.3 | Decide **Expo CNG vs RN CLI** on the white-label question (ADR-001 amendment) | Written decision. CNG scores 12 points higher; committed white-labelling is the one good reason to stay on the CLI |
| 0.4 | pnpm workspace: `apps/mobile`, `packages/{tokens,ui,api-client,domain,i18n,config}` | `pnpm dev` runs on a device |
| 0.5 | `packages/tokens` generated from `design-spec/tokens/*.css` — colours, type ramp, spacing, radius, elevation, motion, all typed `as const` | Committed and reviewed. A colour change is a reviewable diff, not a silent runtime shift |
| 0.6 | Lato 400/600/700 bundled; **verify the 1.54 line-height ratio renders correctly on Android** with `includeFontPadding: false` | No fallback-font flash on cold start; vertical rhythm matches the prototype |
| 0.7 | The 102-glyph HUMBEE icon set compiled to typed `<Icon name size />` components via SVGR | **No substituted icon library** |
| 0.8 | The ~20 primitives: `Button`, `Input`, `Select`, `Card`, `ListRow`, `StatTile`, `StatusBadge`, `HexMark`, `Chip`, `EmptyState`, `Skeleton`, `Tabs`, `PeriodPills` | A component gallery screen |
| 0.9 | The shell: header, bottom nav **derived from the module registry** (never a hardcoded list), scroll container, safe-area handling, offline banner | Navigable empty app |
| 0.10 | `packages/api-client` generated from `contracts/openapi.yaml`, with CI failing on drift | Typed hooks; a contract change breaks the build |
| 0.11 | **The module system** — `packages/module-host` (manifest types, registry, nav builder, route guards), `can(entitlements, module)`, the `core/` vs `modules/` split with `eslint-plugin-boundaries` failing on the boundary rules, theme context with HUMBEE as the compile-time default, and the per-tenant CI test matrix. **Full checklist: `09-saas-and-module-architecture.md` §11** | One tenant, all modules entitled — so the mechanism is proven while the output is trivial. Retrofitting this after nine screens exist is the expensive version |
| 0.12 | Decide the **font strategy for Indic scripts** — bundled, on-demand, or system (`08-screen-inventory.md` §2) | Written decision, before the APK budget is spent |
| 0.13 | Analytics provider decided, event taxonomy written, `track()` facade in place | Agreed **before** instrumentation. Retrofitting a taxonomy is painful |
| 0.14 | CI: lint → typecheck → test → api-client drift check → build; dev/qa/pre/prod flavors | Green pipeline, installable QA build |
| 0.15 | Name the owner of RN upgrades; put the twice-yearly slot in the calendar | A named person. Bare RN makes this a real obligation |
| 0.16 | `.claude/` skills, agents, hooks | Team-shared conventions |

**Exit criterion:** an installable QA build that logs in with a real OTP, renders one screen at design
fidelity, and has taken a JS fix over the air.

---

## Phase 1 — Launch scope, Android first

Order follows the handoff's build order, which front-loads the shared components and leaves the
non-trivial state machine until the primitives are settled.

| Order | Screens | Why here |
| --- | --- | --- |
| 1 | **00 Language chooser** | Everything after it renders in the chosen language, including login. Building it last means retrofitting every string |
| 2 | **01, 02 Login + OTP** | Secure token storage, refresh, cold-start route guard, the unregistered-number message. Ship behind fixtures if the OTP provider is not ready |
| 3 | **03 Home** | One call (`GET /home`) fills it. Proves the shell, the carousel and the stat tiles |
| 4 | **05 Leaderboard** | The heaviest screen, and already built once in the 0.2 spike. Establishes the **manufacturer tab bar** that three screens share |
| 5 | **09 Inventory Allocated** | Adds the **period pills**, the second shared component. Read-only, so low risk |
| 6 | **10 Rewards** | Reuses tabs + pills; adds status-chip filtering **in memory, with no skeleton** |
| 7 | **06, 07, 08 Capture Demand → Captured → My Demands** | The business value and the only non-trivial state machine. Deliberately after the primitives are settled |
| 8 | **04 Profile** | Server-driven rows, Log Out, and Delete behind the Advanced disclosure |
| 9 | **11 Notifications** | Depends on contract additions (`08-screen-inventory.md` §3). FCM registration can land earlier with screen 02 |
| 10 | **Hardening** | The whole of `design-spec/09-qa-checklist.md`: skeletons, empty states, error states, offline outbox, reduced motion, and the localisation pass |

**Localisation is not step 10.** `en` + `hi` strings land with each screen, from step 1. A translation
pass bolted on at the end will not survive contact with Devanagari layout.

**Phase 1.1:** iOS parity, Marathi, additional regional languages, event photo gallery.

---

## Parallel tracks

These do not block screen work and will block launch if they start late.

| Track | Items |
| --- | --- |
| **Contract additions** | Notification list / read-receipt / preference endpoints; the language catalogue shape on `GET /config`; per-industry role on allocation and demand payloads if that rule holds |
| **Backend** (other team) | Points engine and multiplier table; district → onboarded-manufacturer resolution, which drives the demand fork; leaderboard materialisation per manufacturer per district; OTP provider, rate limits, resend policy |
| **Content** | Professional Hindi translation — trade-vocabulary-aware. Machine translation will not survive contact with a Barbender |
| **Design** | The two design-pending screens (00, 11); the Cement sub-industry illustration; the Umang Utsav banner as composed markup if venue/date/invitee count must be dynamic |
| **Legal / privacy** | Leaderboard opt-out and its privacy copy; lucky-draw winner-list consent; DPDP review; Privacy Policy and Terms reachable without login |
| **Ops readiness** | **Who records influencer allocations today?** If VCPs do not, this app launches showing empty screens — the single largest delivery risk, and it sits on another team's roadmap |

---

## Definition of Done

Per screen, the checklist is `08-screen-inventory.md` §7 — use that, not this summary.

Per release, additionally:

- Every state in `design-spec/09-qa-checklist.md` implemented for every shipped screen.
- Offline outbox exercised: submit a demand in airplane mode, reconnect, confirm exactly one demand
  exists server-side.
- Performance budget met on the reference device (`01-architecture.md`) — measured, not assumed.
- APK ≤ 30 MB with the shipped font set.
- Crash-free sessions ≥ 99% in the internal track before promotion.
- No self-registration path anywhere in the app — **verified by inspection**, every release.

---

## Release strategy

- `develop` → automatic build + internal QA track.
- `main` → Play Store internal testing → **closed beta with a real influencer cohort** → staged
  production rollout 5% → 25% → 100%.
- **Recruit the beta cohort through a friendly distributor.** This persona's feedback will not arrive
  through an in-app survey, and 20–30 real users watched in person is worth more than any amount of
  analytics.
- OTA channel for JS-only fixes between store releases, with the runtime-version policy documented so a
  native-dependency change never ships as an OTA update.
- Sentry release-health gate: **halt the rollout if crash-free sessions drop below 99%.**
- Watch Play Console vitals deliberately at 5 lakh scale — ANR and crash rates there affect store
  visibility, not just user experience.
