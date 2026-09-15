# Humbee Influencer App — Frontend

The mobile app for Influencers in Humbee's B2B value chain — Shilpkars, Masons, Contractors, Engineers,
Barbenders and Painters. They **capture demand** for a manufacturer's material, a Distributor or Dealer
**allocates** inventory against it, and **points post on allocation** — driving a per-manufacturer
leaderboard, gifts, lucky draws and Umang Utsav invitations.

**Status: scaffolded and running.** React Native CLI 0.87 · React 19 · TypeScript strict, with the
12 v1 screens built against the design spec and wired to the API contract's own fixtures.

```bash
npm install && npm start      # then: npm run android
npm run verify                # typecheck + lint + tests (the merge gate)
```

The app runs in **fixture mode** (`src/api/config.ts` `USE_FIXTURES = true`), serving every
request from `humbee_influencer_backend/contracts/examples/`, so the whole UI is explorable
before the backend module exists. Flip one flag to go live.

**Known gaps are catalogued in [`docs/11-feature-reference.md`](./docs/11-feature-reference.md) §8** —
the HUMBEE icon set, ProductMark artwork and the Lato font files are not in the design handoff, so
those three are stand-ins confined to one file each.

**Scope: frontend only.** The server lives in `hymbee-backend`; the influencer module's API
specification lives in `humbee_influencer_backend/`.

## Start here

| Doc | Read it for |
| --- | --- |
| [`CLAUDE.md`](./CLAUDE.md) | Session-start context: what this is, where everything lives, working rules |
| [`docs/08-screen-inventory.md`](./docs/08-screen-inventory.md) | **The v1 surface** — 12 screens, routes, endpoints, what was deferred and why |
| [`docs/07-framework-comparison.md`](./docs/07-framework-comparison.md) | **RN CLI vs Next.js + Capacitor**, scored on scalability, maps, geofencing, charts, analytics, 5 lakh users and performance |
| [`docs/01-architecture.md`](./docs/01-architecture.md) | Tech stack decisions with rationale, in ADR format |
| [`docs/09-saas-and-module-architecture.md`](./docs/09-saas-and-module-architecture.md) | **Selling modules per client** — folder layout, module manifests, entitlements vs flags vs theming, white-labelling |
| [`docs/11-feature-reference.md`](./docs/11-feature-reference.md) | **Per-module reference** — where each module's code lives, its rules, endpoints, and known gaps. **Start here for code work** |
| [`docs/10-rn-cli-implementation-guide.md`](./docs/10-rn-cli-implementation-guide.md) | The build manual — RN CLI bootstrap, MVC/MVVM decision, API + query structure, state, MMKV vs AsyncStorage, library manifest, CI gates |
| [`docs/design-spec/`](./docs/design-spec/) | **The design spec of record** — screen specs, tokens, fixtures, assets, and the live prototype |
| [`docs/02-design-system.md`](./docs/02-design-system.md) | Token pipeline, and which spec wins when two disagree |
| [`docs/03-api-integration-and-data.md`](./docs/03-api-integration-and-data.md) | The generated client, and the data rules a client can violate by accident |
| [`docs/05-delivery-plan.md`](./docs/05-delivery-plan.md) | Phase 0 (including two spikes that can change the plan) through launch |
| [`docs/06-inputs-needed.md`](./docs/06-inputs-needed.md) | **Open decisions and inputs still needed** |
| [`docs/00-PRD.md`](./docs/00-PRD.md) | Full product requirements — broader than v1; read with `08` beside it |
| [`docs/04-claude-workflow.md`](./docs/04-claude-workflow.md) | How to use Claude Code, MCP, skills and hooks here |

**All documentation now lives in `docs/`** — the working doc set, the design spec of record
(`docs/design-spec/`, including tokens, fixtures, assets and the live prototype), the design-system
library reference, and an `archive/` of superseded material. Read the relevant
`docs/design-spec/04-screens/` spec before building a screen.

## Five things to know before writing any code

1. **The stack is React Native + TypeScript**, chosen on threshold criteria rather than on points: list
   performance on a 2–3 GB Android device, stability across 5 lakh devices, and OS-level background
   capability. Two caveats are live — Expo CNG scores higher than the RN CLI, and **OTA must be proven
   in Phase 0** or the decision reopens.
2. **The server owns every number.** The HTML prototype computes points, ranks and totals on the client
   only so the design can be demonstrated. Never port that arithmetic.
3. **Points post only when a VCP allocates**, never on demand submission. Anything shown earlier is an
   expectation and must be labelled as one.
4. **There is no signup.** The only entry point is mobile + OTP for a number that already exists. No
   "Create account" path anywhere — verified by inspection every release.
5. **Fidelity is not negotiable, and neither is accessibility.** Build from the handoff's tokens; where
   the two specs conflict, `docs/02-design-system.md` §3 has already resolved it.
