# 10 — Quality, testing and CI

## 10.1 What is worth testing in this app

The risk is not evenly distributed. Spend the testing budget where a bug costs money or trust:

| Risk | Cost of a bug | Test weight |
| --- | --- | --- |
| **Demand-draft reset cascade** | A demand submitted with the previous manufacturer's SKU. Wrong points, support ticket, lost trust | Highest — pure unit tests, exhaustive |
| **Auth: refresh single-flight, cold-start routing** | Users logged out at random, or a login flash on every open | High — integration tests |
| **Envelope + error-code mapping** | Wrong OTP shows the wrong copy; a 422 leaks a validation dump | High — unit tests over the client |
| **`en-IN` formatting** | `21400` instead of `21,400` on every screen | High, cheap — snapshot the formatters |
| **Offline outbox** | A demand silently lost | High, once it exists |
| **Loading-state rules** (skeleton on manufacturer change, none on filter change) | The most-specified behaviour in the handoff and the easiest to regress | Medium — integration tests per screen |
| **Pixel fidelity** | The thing the handoff cares most about | Medium — but by review against the prototype, not by unit test |
| Static presentational components | Low | Low — render + accessibility assertions only |

Note what is *not* on this list: business arithmetic. Points, ranks, multipliers and unit conversions
are all server-owned (handoff rule 4), so there is no client math to test. That is a deliberate design
property, and it removes what would otherwise be the largest test surface.

## 10.2 The pyramid

| Layer | Tool | Scope | Runs |
| --- | --- | --- | --- |
| Unit | **Jest** | Stores, selectors, the reset cascade, formatters, the client wrapper, error mapping | Every push |
| Component | **React Native Testing Library** | Primitives and composites: states, disabled logic, accessibility props | Every push |
| Integration | **RNTL + MSW** seeded from `../contracts/examples/*.json` | A whole screen: query → skeleton → rows → filter → empty → error | Every push |
| Contract | **Generated types + a spec-drift check** | `gen-api` output must match the committed spec | Every push |
| E2E | **Maestro** | Login → Home → capture a demand → see it in My Demands. Plus the offline cold start | Nightly + pre-release |
| Perf | **Reassure** | Render-cost regression on the five heaviest components | Every push |
| Visual | Manual, against `design/prototype-standalone.html` at 390×844 | Fidelity | Per screen, at review |

**Why MSW seeded from `contracts/examples/`:** those files were generated from the design's own
fixtures (reference date 18–19 Aug 2026). A test asserting that the leaderboard renders "Sunil Jadhav"
in the pinned footer is asserting against the same data the designer looked at. That is a materially
better guarantee than a hand-written mock, and it is free because of co-location.

**Why Maestro over Detox:** YAML flows, no build-time instrumentation, tolerant of animation timing,
and it runs against a release build. Detox is more precise but its maintenance cost on an RN app with
frequent SDK bumps is high, and E2E suites that are expensive to maintain get disabled.

## 10.3 What not to test

Written explicitly, because over-testing a UI-heavy app produces a suite that breaks on every design
tweak and gets deleted:

- **No full-screen snapshot tests.** They fail on every legitimate design change and assert nothing
  about correctness. Snapshot the formatters and the token module — values that genuinely should not
  change silently — and nothing else.
- **No tests of token values against hardcoded hexes.** The generator plus the `git diff --exit-code`
  check in CI already guarantees it, in one line instead of 531 assertions.
- **No mocking of TanStack Query.** Mock the network with MSW and let the real query client run.
  Mocking the query layer tests the mock.

## 10.4 The accessibility bar

The handoff makes accessibility a field-conditions requirement, not a compliance checkbox: *"used on
low-end Android devices, outdoors, by users who may read Marathi/Hindi more comfortably than English."*
Assert these in component tests so they cannot regress:

- [ ] Every tappable has `accessibilityRole` and an `accessibilityLabel` — and the label is a
      translation key, not an English literal
- [ ] Minimum hit area 44×44, achieved with `hitSlop` where the visual is smaller (the header person
      icon is a 40×40 visual; the OTP boxes and nav items already comply)
- [ ] Icon-only controls have labels — the header person icon, the carousel dots, the caret
- [ ] The skeleton container sets `busy`, announces "Loading" **once**, and hides its shimmer bars
      from the accessibility tree
- [ ] Reduced motion honoured per-category (§7.5) — not a single global off switch
- [ ] `maxFontSizeMultiplier` decided per component; **no global `allowFontScaling={false}`**
- [ ] Every user-visible string comes from i18n. Lint-ban string literals in JSX text position
- [ ] `en` / `hi` / `mr` all render without truncation on a 360dp-wide screen — Devanagari runs longer
      than Latin, and the chips, nav labels and table headers are the tight spots
- [ ] No string concatenation for sentences with interpolated values (handoff rule 7)

## 10.5 Review gates per screen

The handoff's own definition of done, made checkable. A screen is not done until every box is ticked
by someone other than its author.

- [ ] Matches its spec in `design_handoff/docs/04-screens/` and the live prototype at 390×844,
      compared side by side on a device
- [ ] Every state in `design_handoff/docs/09-qa-checklist.md` for that screen exists: loading, empty,
      error, offline, and each filter combination
- [ ] Skeleton shapes match the real elements — hex marks hexagonal, pills pill-shaped, card chrome real
- [ ] No colour, size, or string outside `shared/tokens/` and the locale files
- [ ] No `FlatList`, no `TouchableOpacity`, no raw `Text`, no inline hex
- [ ] Wired to a fixture **and** to the API, with all three failure modes handled
- [ ] Tested on the reference device from `09-performance-budget.md` §9.1, not only in an emulator
- [ ] Analytics events from the catalogue in §8.4 fire, with no PII in the properties

## 10.6 CI

GitHub Actions, with **path filters** — this is the one piece of pipeline configuration that the
same-repo decision makes mandatory.

```yaml
# .github/workflows/frontend.yml
on:
  pull_request:
    paths: ['frontend/**', 'contracts/openapi.yaml']   # ← the spec triggers the mobile build
```

The second path entry is the whole point: a change to `contracts/openapi.yaml` runs the mobile type
check, so a breaking field rename fails in the backend developer's own pull request. Correspondingly,
the backend workflow must **not** run on `frontend/**`.

Jobs:

| Job | Command | Gate |
| --- | --- | --- |
| Typecheck | `tsc --noEmit` | Blocking |
| Lint | `eslint .` — includes the boundary rules from §3.3 | Blocking |
| Generated-file drift | `pnpm gen:tokens && pnpm gen:icons && pnpm gen:api && git diff --exit-code` | Blocking. Catches a hand-edited generated file and a spec change without a client update |
| Unit + component + integration | `jest --coverage` | Blocking |
| Perf regression | `reassure` | Blocking on a threshold breach |
| Dead code | `knip` | Blocking |
| Bundle size | Hermes bundle size vs the base branch | Blocking above +5% |
| Preview build | `eas build --profile preview` on `main` | Non-blocking, produces an installable artifact |
| E2E | `maestro test` against the preview build | Nightly and pre-release |

Two conventions worth fixing early: **coverage thresholds only on `src/shared/store`,
`src/shared/api` and `src/shared/format`** — a global percentage target on a UI-heavy codebase
incentivises testing presentational components, which §10.3 explicitly does not want. And **the
generated-file drift check must run before the tests**, so a contract change reports as a contract
failure rather than as forty confusing test failures.
