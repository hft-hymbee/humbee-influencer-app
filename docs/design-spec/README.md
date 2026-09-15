# The design spec of record

**Authoritative for anything visual.** Every colour, size, line-height, radius, shadow, padding,
animation duration and string of copy here is final and was authored against the HUMBEE Design System.

**Read the screen spec before building a screen.** Where a value is not stated, fall back to
`02-design-tokens.md` — never to a framework default.

| Path | What it is |
| --- | --- |
| `00-handoff-readme.md` | The original handoff overview and the known gaps to confirm |
| `00-handoff-rules.md` | The handoff's own implementation rules — fidelity, copy, server-owned numbers |
| `BUILD-SPEC.md` | The entire specification as one document |
| `DESIGN-BRIEF.html` | Shareable brief for non-engineers. Opens in any browser, prints to PDF |
| `01-product-and-scope.md` | Domain vocabulary, the core loop, what v1 excludes |
| `02-design-tokens.md` | **Every colour, type style, spacing, radius, shadow, motion value** |
| `03-ui-kit-and-components.md` | Component inventory with exact specs and states |
| `04-screens/` | **One spec per screen**: layout → components → copy → states → data |
| `05-interactions-and-motion.md` | Animations, transitions, timings, keyframes |
| `06-state-and-navigation.md` | Navigation graph, state shape, derived values, **reset rules** |
| `07-api-contract.md` | The handoff's *proposed* endpoints — see the note below |
| `08-data-model.md` | Entities, relationships, points rules, formatting rules |
| `09-qa-checklist.md` | Every state that must be implemented and verified |
| `10-implementation-plan.md` | The handoff's stack recommendation — see the note below |
| `tokens/` | The 531 variables as CSS. **`packages/tokens` is generated from here** |
| `data/` | JSON fixtures matching the response shapes. Wire screens to these first |
| `assets/` | Logos, illustrations, banners, Lottie files |
| `screens/` | A PNG of every screen as designed |
| `prototype/prototype-standalone.html` | **The live visual reference.** Open in a browser — no server needed |

## Two documents here are superseded

| This file | Superseded by | Why |
| --- | --- | --- |
| `07-api-contract.md` | `humbee_influencer_backend/contracts/openapi.yaml` (22 endpoints) and `../03-api-integration-and-data.md` | It is a *proposal* derived from the design. The real contract now exists |
| `10-implementation-plan.md` | `../01-architecture.md` and `../10-rn-cli-implementation-guide.md` | It recommends RN + Expo. The decision is **RN CLI** |

Everything else here is current and authoritative.

## The rules most often broken

- **The prototype is a design reference, not source to port.** Do not port `prototype/support.js`, `<x-dc>`,
  `<sc-for>`, `<sc-if>`, `<x-import>` or `renderVals()` — those are authoring-tool constructs. Read them
  as "list", "conditional" and "component instance".
- **The prototype computes points, ranks, gaps and totals on the client only so the design can be
  demonstrated.** In the product the server owns all of them. Never port that arithmetic.
- **Copy is final**, including the Indian typographic conventions — spaced question marks
  (`Wrong number ?`), `₹` with Indian digit grouping, `en-IN` number formatting.
- **No emoji in product copy. No substituted icon library. No gradients** beyond the two named in
  `02-design-tokens.md`.
- **Two conflicts with the design-system library are already resolved** — spacing scale, tap-target
  floor and body-size — in `../02-design-system.md` §3. Do not adjudicate them in a PR.
