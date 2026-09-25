# 02 — Design System & the Token Pipeline

> **For day-to-day implementation you need two documents, and they have different jobs:**
>
> | Document | Job |
> | --- | --- |
> | `design-spec/02-design-tokens.md` | **App-level spec of record.** The exact values used by the 10 designed screens, plus the medal palette, the two permitted gradients, and the hexagon |
> | `design-system/HUMBEE-DESIGN-RULES.md` | **Library reference.** The full HUMBEE component variant matrices, status semantics and icon inventory — what exists to build *undesigned* surfaces from |
>
> This file covers the *strategy*: where values come from, how they become code, and **which document
> wins when the two disagree** (§3 — they do disagree, in three places).

---

## 1. Source of truth, in order

1. **`design-spec/tokens/*.css`** — `fig-tokens.css`, `semantic.css`, `typography.css`,
   `fonts.css`. The 531 design variables, machine-readable. **This is what `packages/tokens` is
   generated from.** Port them; do not retype values.
2. **`design-spec/02-design-tokens.md`** — the same values as prose, with usage notes that the
   CSS cannot carry ("Chestnut is reserved for emphasis; structure is grey; points are green").
3. **`design-system/HUMBEE-DESIGN-RULES.md`** — the library, extracted and verified from Figma, for
   anything the handoff does not cover.
4. **Figma** (`fBynOaPoe2apd18PTzcJdn`, via the Figma MCP server) — the upstream. Go here only when the
   three above are missing something, and **update the document above in the same change**.

**The rule that matters: no design value is ever typed by hand into a screen.** Colours, spacing, radii,
type styles and icons come from `packages/tokens` (generated) or `packages/ui` (composed). A raw hex or a
magic number in a feature file is a defect, and `07-framework-comparison.md` §5 lists what the CSS
originals cost to reproduce in RN — none of that work is an excuse to approximate a value.

---

## 2. Token generation pipeline

Tokens are **generated, committed and reviewed** — never fetched at runtime.

1. `pnpm tokens:build` parses `design-spec/tokens/*.css` into
   `packages/tokens/src/{colours,typography,spacing,radius,elevation,motion}.ts`.
2. Each is `as const` with exported union types, so `<Text variant="Body.medium">` autocompletes and a
   typo fails `tsc`.
3. **Commit the diff. Reviewing the token diff in a PR is the point** — it turns a design change into a
   visible, approvable event rather than a silent runtime shift.
4. Icons: the 102-glyph HUMBEE set → SVG → typed `react-native-svg` components via SVGR. Lottie files
   (`celebration.json`, `success-green.json`) ship as assets.

**Two emitters, one source.** The generator emits a TS object for React Native **and** CSS custom
properties, because the planned Next.js manufacturer dashboard consumes the same brand. Verify in Phase 0
that one colour change propagates to both in a single commit. A white-label theme is then one token
override consumed by two surfaces (ADR-007).

**Do not fetch tokens at runtime.** The theme *override* for a tenant arrives from `GET /config` and is
cached; the base theme is a static import so the app renders correctly before any network call.

---

## 3. Precedence — where the two documents conflict

Three real contradictions. They are resolved here so nobody has to adjudicate them mid-PR.

**The general rule:** for the 10 designed screens, **the handoff wins** — it is measured, final, and
fidelity is non-negotiable. For undesigned surfaces (screens 00 and 11, and anything in Phase 2), the
design-system library wins. Where the conflict is an **accessibility floor**, the stricter value wins in
both cases.

| # | Conflict | Resolution |
| --- | --- | --- |
| 1 | **Spacing scale.** The library says the scale is `0, 2, 4, 8, 16, 32, 64` with "nothing between steps". The handoff uses a 4pt grid including `6, 10, 12, 14, 20, 24` | **The handoff wins.** The designed screens genuinely use those values; a screen rebuilt on the coarser scale is not the designed screen. `packages/tokens` carries the handoff's full 4pt scale, and the library's named steps (`spacing.s` = 8, `spacing.m` = 16) remain as semantic aliases into it |
| 2 | **Tap targets.** The handoff says minimum 44×44 px. This repo's earlier draft and the library say 48×48 dp, "because the persona works with gloves and calloused hands" | **48 dp wins — the stricter floor.** The handoff's 44 px is the platform minimum, not a design decision, and nothing in the designed screens breaks at 48. Where a designed control is smaller than 48, **extend the touch target without changing the visual size** (`hitSlop`), so fidelity and accessibility both hold |
| 3 | **Minimum body size.** The library says minimum 16 for anything the user must read to act, with 11 for metadata. The handoff's body size is **13**, its minimum is 13, and it states there is no 14px size in the system | **Unresolved — and it needs a product decision, not a code decision.** See below |

### The 13px body-size conflict

This is the one genuine unresolved tension in the design, and it should not be quietly settled by
whoever writes the first screen.

- The **handoff is internally consistent**: the whole type ramp is built around 13/20 body, and raising
  it would reflow all ten screens.
- The **library's 16px floor is an accessibility position**, written for exactly this audience —
  low-literacy users, outdoors, on cheap screens, some with presbyopia and no reading glasses.
- Both cannot hold. Raising body text to 16 is a redesign; shipping 13 accepts a real legibility risk
  for the users least able to absorb it.

**Interim position:** build the designed screens at the handoff's 13/20, because that is the approved
design and inventing a different ramp is worse than either option. **And treat this as a launch-blocking
usability question** — put 13px in front of real influencers in the beta cohort, at default *and* at
150% OS font scale, and let that decide. Tracked in `06-inputs-needed.md`.

Non-negotiable regardless of the outcome: **the layout must survive 200% OS font scaling without
clipping.** Never fix the height of a container whose only content is text. This is what makes the
question survivable — a user who needs larger text can get it if the layout permits it.

---

## 4. Existing components worth reusing

`humbee-mobile-app/src/app_V3/UiKit` is already built against this same design system. **Port rather
than redesign** — and improve the API while porting (typed props, no implicit theme context):

- **atoms** — AppText, Avatar, Badges, Button, Chips, GradientBackground, HelperText, InputFiled *(sic)*,
  OTPInputField, RadioButton, SvgIcon, Toggle
- **molecules** — BannerCarousel, IconButton, ScreenHeader, StepperItem, TabComponent, TextInputField
- **organisms** — BottomSheet, CustomDropDown, MenuList, Stepper, SuccessScreen, TableComponent

**Directly useful for v1:** `OTPInputField` (screen 02), `BannerCarousel` (03), `TabComponent` (the
manufacturer tab bar on 05/09/10), `ScreenHeader`, `Avatar`, `Chips`, `SuccessScreen` (07).

**Check each against the New Architecture before adopting it.** The VCP app is bare RN 0.79; a component
that reaches into legacy APIs is a port, not a copy.

**New components this product needs**, built properly in `packages/ui` because they carry product
semantics rather than styling:

| Component | Why it is shared, not screen-local |
| --- | --- |
| `HexMark` | The brand shape, at ten different sizes across six screens. One component, one clip-path, or the hexagon drifts |
| `ManufacturerTabs` | Shared verbatim by Leaderboard, Inventory Allocated and Rewards. Build it once, before those three screens |
| `PeriodPills` | Shared by Inventory Allocated and Rewards. **Leaderboard has no period filter** — do not add one |
| `StatusBadge` | Encodes the closed status sets and their fixed colour mapping. Must render an unknown status neutrally rather than crash |
| `QuantityWithUnit` | The per-UOM decimal rules (one for Ton, zero for Bags/Kg/Litre) in one place |
| `Skeleton` | The designed loading state, on every data screen. It replaces screen content entirely while header and nav stay live |
| `EmptyState` / `OfflineBanner` / `PendingSyncBadge` | Offline-first is a requirement; these must look **designed**, not like errors |
| `RoleIndustryTag` | The `Dalmia Cement · Contractor` pairing — never a role without its industry. **Do not build or place this until the role question in `08-screen-inventory.md` §6 is resolved** |

---

## 5. Non-negotiables carried over from the handoff

These are the rules most likely to be broken by good intentions:

- **Chestnut `#995A00` is reserved for emphasis** — active nav, rank 1, the current-user row, primary
  buttons. **Structure is grey. Points are green.** Do not brand-colour a container because it looks nice.
- **Borders are inset box-shadows, never CSS/RN borders**, so they never affect layout. In RN this means
  approximating with `borderWidth` and compensating for the 1px content-box shift on selection — see
  `07-framework-comparison.md` §5.
- **The hexagon clip-path is the brand shape.** Keep it, everywhere it appears.
- **No gradients except the two named** (podium panel, leaderboard sticky-footer fade).
- **No emoji anywhere in product copy.**
- **Nothing scales or shrinks on press.** No bounce, no spring.
- **Copy is final**, including Indian typographic conventions — spaced question marks (`Wrong number ?`),
  `₹` with Indian digit grouping, `en-IN` number formatting.
- **Do not substitute an icon library.** No Lucide, Material or Heroicons.
- **Do not add features.** The scope is `08-screen-inventory.md`. If something looks missing — search,
  a notification bell in the header, chat, referral — it was deliberately excluded.

### 5.1 Divergences on record

Places where shipped UI does **not** match the handoff, each a deliberate client decision rather
than drift. Anything not listed here is a bug.

| What | Where | Why |
| --- | --- | --- |
| **My Demands cards carry a status chip** | `08-my-demands.md` shows none | The server now derives `fulfilment` (`OPEN` / `PARTIALLY_FULFILLED` / `FULFILLED`) from allocations. The no-chip design was built on V2's "a demand carries no status", which is no longer true. **The screen spec needs updating to match** — `06-inputs-needed.md` 15l |
| **Demand cards use `radius.l` (16), not the 8px default** | Every other card is 8 | Asked for at the client's direction. `Card` takes an opt-in `cornerRadius` prop that must be passed a TOKEN, never a number, so one screen's softer corners cannot drift the system. The scale has no 12 — **if 16 reads too round, the fix is a new token in the design spec, not a magic number in a feature file** |
| **The site flow has no in-app permission dialog** | `construction-site-address-capture.md` S3 | The Android system prompt already asks the same question with the same three choices; ours went first and could grant nothing |
| **No recentre FAB on the map picker** | S2/S4 | Duplicated "Use Current Location", two centimetres below it in the sheet |
| **S6's Pincode / District / State are read-only** | S6 shows editable inputs | The server derives them from the pincode and **rejects** contradicting ids. An editable field the server will refuse invites a correction that can only fail at submit. The spec's own note under those fields already says "change the pin to change them" |
| **No derived chips on the map sheet** | `construction-site-address-capture.md` S4 makes them "the point of this sheet" | Client decision, 2026-09-21. The sheet confirms *the place* and the formatted address already says it; the same geography is shown read-only one screen later on S6, next to `Change On Map`, which is where a wrong pin is actually corrected. `DerivedChip` is deleted |
| **No minimum length on S6's typed fields** | Spec says Address Line 1 is 3–120 and Landmark 3–80 | Client decision, 2026-09-21. Real plot numbers are shorter than three characters — "14", "B2", "7A" — so the rule rejected correct input and the only way to clear the error was to pad it. Required and the upper caps both stand |
| **The centre pin is an SVG teardrop, tip-anchored** | S2/S4 describe a 34/40px mark on a grey ground pad | Client direction, 2026-09-21, against a supplied reference. A 45°-rotated square makes a wide blunt tail; the mark is a circle with two straight tangents to a point. The **tip** sits on the map centre — centring the whole mark put it half a pin low, ~25 m at street zoom |
| **App name is `Humbee Samarth`, not `HumbeeInfluencer`** | Neither spec names the app | Client decision, 2026-09-21. `strings.xml` + `CFBundleDisplayName`; the bundle id and Xcode product name are unchanged |

---

## 6. Accessibility rules

Requirements, not polish.

| Rule | Detail |
| --- | --- |
| Tap targets | **≥ 48 dp**, via `hitSlop` where the visual control is smaller (§3) |
| Font scaling | Layout survives **200%** without clipping. No fixed-height text containers |
| Contrast | ≥ **4.5:1** for body text. Note `#FFA525` on white is ~2:1 — usable as a fill or accent, **never as text colour on a light background**. Verify each pairing |
| Status | **Never colour alone.** Every status carries a label, and an icon where the design provides one |
| Icons | Every meaningful icon gets a visible label or an `accessibilityLabel`. Icon-only actions are acceptable only for universally understood affordances — back, close, call |
| Numbers first | This audience reads quantities faster than sentences. Lead with the number and the brand; prose second |
| Hindi in review | Devanagari runs 15–30% longer than English and sits taller. A button sized to "Rewards" clips "पुरस्कार". Review layouts in Hindi, not only in English |
| Glyph fallback | A missing glyph must never render as tofu (`□`). Define an explicit per-script fallback chain and test it on a device with no system font for that script |
| Reduced motion | Honour the OS setting. Every animation in the spec is decorative; none carries information |

---

## 7. Figma Code Connect

Worth setting up once `packages/ui` has ~10 stable components. `add_code_connect_map` /
`send_code_connect_mappings` link each Figma component to its code counterpart, so a design read emits
`<Button variant="primary" size="m" />` rather than a re-derived styled `View`. For design-to-code
accuracy on this project it is the highest-leverage one-time investment available — but it comes after
the primitives are stable, not before.
