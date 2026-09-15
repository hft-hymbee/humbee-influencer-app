# HUMBEE Influencer App — Frontend

Companion to the two specification bundles that already exist:

| Bundle | What it owns |
| --- | --- |
| `~/Desktop/design_handoff_humbee_influencer_app/` | The **client specification** — 10 screens, 531 design variables, component inventory, motion, fixtures, assets |
| `../docs/`, `../contracts/openapi.yaml` (this repo) | The **server specification** — 22 endpoints, envelope, auth, caching, capacity |
| `frontend/` (you are here) | The **client implementation plan** — tech stack, architecture, and the rules the app code will follow |

This folder currently contains **documentation only**. No application code has been scaffolded
yet; `docs/12-implementation-roadmap.md` is the order in which to create it.

---

## The recommendation up front

> Build the HUMBEE Influencer app as **React Native (New Architecture) in strict TypeScript**, with
> React Navigation, TanStack Query for server state, a typed tokens module generated from the design
> system's CSS, Reanimated for motion, FlashList for every data list, and an over-the-air update
> channel for delivery.

**Amended by `docs/15`.** Two constraints arrived after `01`–`14` were written: **React Native CLI
rather than Expo**, and **selling modules as SaaS to manufacturers**. The framework answer survives
both — Flutter is now more clearly out, not less — but the toolchain, the repo layout and the theming
approach all change. `docs/15-saas-multi-tenant-and-stack-revision.md` lists every superseded section;
read it before acting on `01`, `03`, `04` or `13`.

Three reasons this stack, and not the obvious alternatives:

1. **Over-the-air updates are a product requirement, not a convenience.** The audience is field
   influencers on ₹8,000–₹12,000 Android phones with intermittent 4G who will not reliably update
   from the Play Store. A JS-only over-the-air fix lands the same day. This is the single strongest
   argument against Flutter and against fully native, and it is discussed honestly in
   `docs/02-alternatives-considered.md`. **On the RN CLI this capability is not free** — see
   `docs/15` §15.2 for the mitigation, and §15.7 for what the stack scores without it.
2. **The server contract lives in this very repo.** `../contracts/openapi.yaml` generates the
   client's TypeScript types in CI. A contract change that would break the app fails the build in
   the same pull request that made it. No other stack choice gets this for free.
3. **The design is deliberately restrained.** No springs, no parallax, no bounce, nothing scales on
   press (`design_handoff/docs/05-interactions-and-motion.md`). The animation workload is colour
   transitions, translateY entries, a 420ms carousel and a shimmer — all comfortably inside
   Reanimated's worklet budget on a low-end device. The usual "Flutter renders more smoothly"
   argument has much less force against a spec this quiet.

## Read these in order

| File | What it gives you |
| --- | --- |
| `docs/01-tech-stack-decision.md` | The stack, layer by layer, with the reason for each choice |
| `docs/02-alternatives-considered.md` | React Native vs Flutter vs KMP vs native vs web, scored against the stated criteria |
| `docs/03-project-structure.md` | Folder layout, module boundaries, the import rules CI enforces |
| `docs/04-design-tokens-and-theming.md` | How 531 Figma variables become typed constants, and the codegen that keeps them honest |
| `docs/05-navigation-and-state.md` | Route tree, deep links, the server-state / client-state split |
| `docs/06-data-layer-and-api.md` | Envelope unwrapping, generated types, auth refresh, offline outbox |
| `docs/07-animation-and-motion.md` | Every keyframe in the handoff mapped to a Reanimated implementation |
| `docs/08-native-capabilities-roadmap.md` | **Google Maps, camera, analytics, push** and the next wave of industry features |
| `docs/09-performance-budget.md` | Numeric targets on the target device, and how each is measured |
| `docs/10-quality-testing-and-ci.md` | Test pyramid, contract tests, CI with path filters, review gates |
| `docs/11-release-and-ota.md` | EAS channels, runtime versions, the OTA policy that keeps store review happy |
| `docs/12-implementation-roadmap.md` | Phase 0 → Phase 5, with a definition of done per screen |
| `docs/13-dependency-manifest.md` | Every package proposed, what it costs, and what it replaces |
| `docs/14-web-stack-evaluation.md` | **Next.js / Vite / Ionic / PWA / Tauri in a native wrapper**, scored against RN and Flutter — and the two-day spike that settles it |
| `docs/15-saas-multi-tenant-and-stack-revision.md` | **Read this second.** React Native CLI instead of Expo, and selling modules as SaaS to manufacturers — what both change, and which parts of `01`/`03`/`04`/`14` they supersede |

## A note on versions

Package versions in these documents are **indicative of August 2026 and must be re-verified at
bootstrap**. Two things move fast enough to invalidate a written version number: Expo's SDK
cadence, and each library's New Architecture support. `docs/13-dependency-manifest.md` records the
verification procedure — run it before `git commit` on the first install, not after.
