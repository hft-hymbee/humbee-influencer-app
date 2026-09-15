# CLAUDE.md — implementation rules for this handoff

You are implementing the HUMBEE Influencer App from a high-fidelity design handoff.

**If you read one file, read \`HUMBEE-INFLUENCER-APP-BUILD-SPEC.md\`** — it is this whole package as a single document (§0 kickoff and non-negotiables, §1–§10 the full spec). The \`docs/\` folder holds the same content split per topic. Then follow the rules below.

## 1. What the design files are
`prototype/prototype-standalone.html` is a **design reference**, not source to port. It was authored in a browser-based design tool whose runtime (`prototype/support.js`, `<x-dc>`, `<sc-for>`, `<sc-if>`, `<x-import>`, `renderVals()`) has no place in the product.

Translate:
- `<sc-for list="{{ items }}" as="item">` → a list render (`items.map(...)`, `FlatList`, `v-for`)
- `<sc-if value="{{ flag }}">` → conditional render
- `<x-import component-from-global-scope="HUMBEEDesignSystem_39dc75.Button">` → your own Button from the HUMBEE design system
- `renderVals()` → derived state / selectors / view-model

## 2. Design fidelity is not negotiable
- Use the exact hex values, font sizes, line-heights, radii, shadows and paddings in `02-design-tokens.md` and the screen specs.
- Type is **Lato** (400/600/700) throughout. No substitutions.
- Never introduce a colour that is not in the token file. Chestnut `#995A00` is reserved for emphasis: active nav, rank 1, the current-user row, primary buttons. Structure is grey. Points are green.
- The hexagon clip-path `polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)` is the brand shape. It appears on avatars, rank marks, trail steps and icon tiles. Keep it.
- No gradients except the two named in the token file (podium panel, leaderboard sticky-footer fade).
- No emoji anywhere in product copy.

## 3. Copy is final
Every string in the screen specs is the approved copy, including Indian typographic conventions: spaced question marks (`Wrong number ?`), `₹` with Indian digit grouping, and `en-IN` number formatting (`21,400` not `21,400` US-grouped — use `Intl.NumberFormat('en-IN')`).

## 4. Server owns the numbers
Points, ranks, quantities, unit conversions and gift statuses must all be computed server-side. The prototype computes them on the client only so the design can be demonstrated. See `08-data-model.md`.

## 5. Build order
Follow `10-implementation-plan.md`. Summary: design tokens → primitive components → navigation shell → Login → Home → Leaderboard → Demand → My Demands → Allocation → Rewards → Profile → Demand Success.

## 6. Use the fixtures first
Wire every screen to `data/*.json` before touching the network layer. Each fixture matches the response shape proposed in `07-api-contract.md`, so swapping fixtures for API calls is a one-line change per screen.

## 7. Accessibility and field conditions
This app is used on low-end Android devices, outdoors, by users who may read Marathi/Hindi more comfortably than English.
- Minimum touch target 44×44 px. Bottom-nav items and OTP boxes already meet this.
- Minimum body size 13 px; 11 px only for overlines and meta.
- Every screen must survive a 2-second slow network with a skeleton or spinner (see `09-qa-checklist.md`).
- Copy must be localisation-ready: no string concatenation that assumes English word order. Interpolate.

## 8. Do not add features
The scope is the ten screens in `04-screens/`. If something appears missing (search, notifications, chat, referral), it was deliberately excluded — see `01-product-and-scope.md` §Excluded.
