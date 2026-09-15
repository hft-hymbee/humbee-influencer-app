---
name: humbee-design-system
description: Use whenever designing, mocking up, or implementing ANY Humbee UI — screens, components, mockups, prototypes, or styling. Supplies the HUMBEE design system rules (colors, typography, spacing, component variants, status semantics, icons) from the local rules document instead of querying Figma. Trigger on any request to design a screen, build a component, style something, pick a color/size/spacing, choose a status badge, or find an icon for Humbee.
---

# HUMBEE Design System

**Two documents, different jobs. Read both before writing any UI.**

1. **`docs/design-spec/02-design-tokens.md`** — the **app-level spec
   of record**: the measured, final values used by the 10 designed screens. **For a designed screen,
   this wins.**
2. **`docs/design-system/HUMBEE-DESIGN-RULES.md`** — the **library reference**: full component variant
   matrices, status semantics and the icon inventory. Use it for *undesigned* surfaces (the language
   chooser, notifications, Phase 2) and for anything the handoff doesn't cover.

Use both *instead of* the Figma MCP server; Figma is upstream. Only query it when both are genuinely
missing something — and then **update the rules doc in the same change**.

**Where the two conflict, `docs/02-design-system.md` §3 has already resolved it — do not adjudicate
in a PR.** Summary: the handoff's 4pt spacing scale wins; **48 dp** tap targets win (stricter floor,
via `hitSlop` so the visual size is unchanged); the 13px-vs-16px body-size conflict is an **open
product decision** — build at the handoff's 13/20 and treat legibility as a launch-blocking question.

## The five rules that matter most

1. **No invented values.** Every color, size, spacing, and radius comes from the rules doc.
   A raw hex or magic number in a component file is a defect. Use `error.100`, not `#cc0000`.
   Use `spacing.m`, not `16`.
2. **No invented variants.** The variant matrices in §4 are exhaustive. A variant that isn't listed
   is a design-system change — raise it, don't improvise it.
3. **Status colors are product logic.** Map through §5 (Pending / New or Approved / Partially
   complete / Success / Danger). Never pick a status color because it looked better.
4. **Role never renders without its industry** — `Dalmia Cement · Contractor`, never a bare role.
   **But: no designed screen currently shows a role at all**, and whether the rule still holds is an
   open question (`docs/06-inputs-needed.md` item 1). Until it resolves, build the designed screens as
   designed and **do not invent a role tag** — an invented role label is worse than an absent one,
   because it looks authoritative.
5. **Audience constraints are requirements, not polish.** 48×48 dp minimum tap target; survives
   200% font scaling with no fixed-height text containers; Hindi-first sizing (Devanagari runs 15–30%
   longer and sits taller); never colour alone to convey meaning. **Body size: use the handoff's
   13/20 on designed screens** — the library's 16 pt floor is an accessibility position that the
   approved design does not meet, and the conflict is unresolved (see above).

## Quick reference

Reach for the full doc for anything beyond this.

- **Brand**: primary `#995a00`, secondary `#ffa525` (⚠️ fill/accent only — ~2:1 on white, never text)
- **Semantic**: error `#cc0000` · success `#008000` · info `#0081f2` · warning `#ffbf40`
  (warning *text* must use `#f2a200` or darker)
- **Text**: body `#666666` · emphasized `#333333` · disabled `#8c8c8c`
- **Type (library)**: Lato only. Body 16/24/400 · Label 16/24/600 · Heading M 20/32/600 · Heading L 24/40/600
- **Type (designed screens)**: body **13/20/400** · row title 15/20/700 · stat value 20/26–28/700 ·
  overline 11/20/700 uppercase · nav label 10/14/700. **There is no 14px body size — do not add one**
- **Spacing**: the designed screens use a **4pt grid** — 2·4·6·8·10·12·14·16·20·24·32. Screen padding
  16 (login 24), card padding 14 or 16, stacked-card gap 12. The library's 2·4·8·16·32·64 are semantic
  aliases into this, not a narrower permitted set
- **Radius**: 8 default, 16 sheets, 32 pill · **Icon**: 24 default, 16 in-button
- **Button**: 16h × 8v padding, radius 8, gap 8, icon 16

## Before you build a "new" component

Check §8 of the rules doc first. The library was built for the B2B Distributor/Dealer app, so the
Influencer app legitimately needs new components — but they belong in `packages/ui` as design-system
additions, not as screen-local views. The v1 list and the reason each is shared is in
`docs/02-design-system.md` §4: `HexMark`, `ManufacturerTabs`, `PeriodPills`, `StatusBadge`,
`QuantityWithUnit`, `Skeleton`, `EmptyState`, `OfflineBanner`, `PendingSyncBadge`.

Three cautions: **`ManufacturerTabs` and `PeriodPills` must be built before** the three screens that
share them; **Leaderboard has no period filter** — do not give it one; and **do not build
`RoleIndustryTag`** until the role question above is resolved.

## Before you draw a "missing" icon

Check §6. The set is large, and `Umang Utsav`, `Rewards`, `Benefits`, `Announcement`, `Approved`,
and `Reject` illustrations already exist at 48/64/100px. Genuinely missing: lucky draw, points/coin,
leaderboard, referral, trophy, industry marks, QR/digital ID.

## Watch for library typos

Look components up with the library's spelling; write new code with the correct one:
`Grouped Cbheckbox` → Grouped Checkbox · `Disbaled` → Disabled · `Annouced` → Announced ·
`Calender` → Calendar.

## Re-syncing from Figma

File key `fBynOaPoe2apd18PTzcJdn`. Use `get_metadata` with an explicit `nodeId` — it is the
dependable path. `get_variable_defs` intermittently fails on this file ("nothing selected") when
the connector routes to the Figma desktop app. Page nodes are listed at the top of the rules doc.
