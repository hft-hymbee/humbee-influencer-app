---
name: humbee-feature-context
description: Use whenever working on ANY module, screen, component or API call in the Humbee Influencer app codebase — Home, Leaderboard, Capture Demand, My Demands, Inventory Allocated, Rewards, Profile, Notifications, Login/OTP, or the language chooser. Supplies the per-module map (code location, business rules, endpoints, known gaps) plus the six rules that outrank inference from the code. Trigger on any request to add, fix, refactor or review app code.
---

# Humbee Influencer App — feature context

**Read `docs/11-feature-reference.md` before editing any module.** It maps every module to its
code, its rules, its endpoints and its known gaps, and it is maintained in-repo so you do not
have to re-read the whole doc set to work on one screen.

Then read the module's own design spec: `docs/design-spec/04-screens/NN-*.md`.

## The six rules that outrank anything you infer from the code

1. **The server owns every number.** Points, ranks, gaps, `showPodium`, totals, UOM
   normalisation, period windows, counts and every `*Label` arrive computed. The HTML prototype
   computes them client-side only so the design can be demonstrated — **never port that
   arithmetic**. A missing number is a contract gap to raise.
2. **Points post only when a VCP allocates.** Earlier values are expectations and must read as
   one: "900 pts expected", never "+900 pts". Use `pointsLabelForStatus()`.
3. **No sign-up path anywhere.** No "Create account", no country-code selector, no password.
4. **Do not add features.** No search, no header notification bell, no chat, no referral, no
   period filter on Leaderboard or My Demands, no lucky-draw progress card on Rewards.
5. **No invented design values.** Everything from `src/theme`. A raw hex in a view is a defect.
6. **A module may never import another module** — they are sold separately.

## Layering

`View (views/**/screens) → ViewModel (views/**/use*.ts) → Data (api/, store/) → Domain (domain/)`

Dependencies point one way only. A screen must not call `useQuery`, do arithmetic, or call
`toLocaleString()`.

## Before you finish

- `npm run verify` (typecheck + lint + tests) must pass.
- If you added a module, extend `__tests__/modules.test.ts` so it is covered by the **solo-boot**
  matrix — the app working with all modules on but breaking on a subset is this architecture's
  characteristic failure.
- If you hit one of the 12 known gaps in `docs/11-feature-reference.md` §8, it is deliberate and
  tracked. Do not "fix" it by inventing UI — especially not the role-per-industry gap (#12),
  which is a blocking product decision.
