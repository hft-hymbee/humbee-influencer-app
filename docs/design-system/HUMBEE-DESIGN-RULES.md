# HUMBEE Design System — Rules & Reference

**This document replaces Figma for day-to-day design and implementation work.**
Read it instead of querying the Figma MCP server. Only go back to Figma when this document
is missing something, and when you do, **update this document in the same change**.

| | |
| --- | --- |
| Source file | `Design System- HUMBEE` — file key `fBynOaPoe2apd18PTzcJdn` |
| Library key | `lk-afd58107e937a5f86b835af0ca6624449745920e59fe50abfc6a9612ceba4270fe9c2363bd006fa7fc014e2b555ba7a8f764f991867055a6a048743e3b04fdc2` |
| Extracted from | Pages: Buttons `33:952` · Input Fields/Dropdowns `36:1000` · Badges/Chips `44:675` · Checkboxes/Radio `42:2153` · Toggle/Switch `46:78` · Snackbar/Toasts `46:76` · Table `12909:565` · Date Picker `1805:13960` · Icons `5897:30484` |
| Values cross-checked against | `humbee-mobile-app/src/app_V3/theme/{Colors,Typography,Number}.ts` |
| Last synced | 2026-08-10 |

---

## 0. Scope of this document, and what overrides it

**This is the design-system *library* reference** — the full HUMBEE component variant matrices, status
semantics, and icon inventory, extracted from Figma. Its job is to let you build **undesigned** surfaces
(screens 00 and 11, and anything in Phase 2) without inventing anything.

**It is not the app-level spec.** For the 10 designed screens, the measured values are in
`../design-spec/02-design-tokens.md`, and **those win** — they are
final, they were authored against these primitives, and fidelity is non-negotiable.

Three places where this document and the handoff genuinely conflict, all resolved in
`../02-design-system.md` §3 — read that rather than adjudicating in a PR:

| Conflict | Resolution |
| --- | --- |
| **Spacing** — §3 below says the scale is `0,2,4,8,16,32,64` with nothing between steps; the handoff uses a 4pt grid including `6,10,12,14,20,24` | **The handoff wins.** Its named steps stay as semantic aliases into the fuller scale |
| **Tap targets** — 48 dp here, 44 px in the handoff | **48 dp wins** (stricter floor). Extend the touch target with `hitSlop` rather than changing the visual size |
| **Minimum body size** — 16 here (§2), 13 in the handoff, which states no 14px size exists | **Unresolved product decision.** Build at the handoff's 13/20; treat legibility as a launch-blocking question for the beta cohort. `06-inputs-needed.md` item 29 |

Everything below is unchanged and remains authoritative for the library itself.

---

## 0. The non-negotiables

1. **Never invent a design value.** Every color, size, spacing, radius, and type style must come
   from §1–§3 below. A raw hex or magic number in a component file is a defect.
2. **Never invent a component variant.** The variant axes in §4 are exhaustive. If a design needs a
   variant that doesn't exist, that is a design-system change — raise it, don't improvise it.
3. **Semantic tokens over primitives.** Use `error.100`, not `#cc0000`. Use `spacing.m`, not `16`.
4. **Status colors are fixed by meaning** (§5). A "Pending" chip is never green because it looked
   better. The status→color mapping is a product rule, not a styling choice.
5. **The design system is Lato-only** (plus `Kalam-Bold` for one decorative style). No other family.
6. **Mobile and Web are separate variants, not a breakpoint.** Several components ship an explicit
   `Device=Mobile` / `Device=Web` variant. Pick the right one; don't scale the other.

---

## 1. Color

### 1.1 Ramps

Levels follow one convention throughout: **`5`–`25` are translucent state layers, `50` is the light
tint, `100` is the true brand/semantic value, `200` is the dark/pressed value.**

**Base**

| Token | Value |
| --- | --- |
| `base.white` | `#ffffff` |
| `base.black` | `#0d0d0d` |

**Neutral**

| Token | Value | Typical use |
| --- | --- | --- |
| `neutral.20` | `#f2f2f2` | Page/section background |
| `neutral.25` | `#e5e5e5` | Disabled button background |
| `neutral.50` | `#d9d9d9` | Borders, dividers, disabled component fill |
| `neutral.100` | `#8c8c8c` | Disabled text, outlined-neutral border |
| `neutral.200` | `#666666` | Default body text |
| `neutral.300` | `#333333` | Emphasized text, neutral icon/text |

**Primary** (brand brown-gold)

| Token | Value |
| --- | --- |
| `primary.5` | `rgba(153, 90, 0, 0.05)` |
| `primary.10` | `rgba(153, 90, 0, 0.12)` |
| `primary.20` | `rgba(153, 90, 0, 0.30)` |
| `primary.25` | `rgba(153, 90, 0, 0.50)` |
| `primary.50` | `#bf7000` |
| **`primary.100`** | **`#995a00`** ← the brand color |
| `primary.200` | `#804b00` |

**Secondary** (Humbee amber)

| Token | Value |
| --- | --- |
| `secondary.5` | `rgba(255, 165, 37, 0.08)` |
| `secondary.10` | `rgba(255, 165, 37, 0.12)` |
| `secondary.20` | `rgba(255, 165, 37, 0.20)` |
| `secondary.25` | `rgba(255, 165, 37, 0.40)` |
| `secondary.50` | `#ffc066` |
| **`secondary.100`** | **`#ffa525`** |
| `secondary.200` | `#ff9600` |

**Tertiary** (muted blue-grey — accents, illustration backgrounds)

| Token | Value |
| --- | --- |
| `tertiary.25` | `rgba(177, 211, 219, 0.30)` |
| `tertiary.50` | `#b9dde5` |
| `tertiary.100` | `#b1d3db` |
| `tertiary.200` | `#a5c5cc` |

**Semantic**

| | `10` | `20` | `25` | `50` | `100` | `200` |
| --- | --- | --- | --- | --- | --- | --- |
| **error** | `rgba(204,0,0,.08)` | `rgba(204,0,0,.12)` | `rgba(204,0,0,.20)` | `#ff3333` | `#cc0000` | `#b20000` |
| **success** | `rgba(0,128,0,.08)` | `rgba(0,128,0,.12)` | `rgba(0,128,0,.20)` | `#6cd96c` | `#008000` | `#006600` |
| **info** | `rgba(0,129,242,.08)` | `rgba(0,129,242,.12)` | `rgba(0,129,242,.20)` | `#4dacff` | `#0081f2` | `#006dcc` |
| **warning** | `rgba(255,191,64,.05)` | `rgba(255,191,64,.10)` | `rgba(255,191,64,.15)` | `#ffcc66` | `#ffbf40` | `#f2a200` |

### 1.2 Typography colors

| Token | Value |
| --- | --- |
| `typography.default` | `#666666` |
| `typography.enabled` | `#333333` |
| `typography.disabled` | `#8c8c8c` |
| `typography.black` | `#0d0d0d` |
| `typography.white` | `#ffffff` |
| `typography.primary` | `#995a00` |
| `typography.secondary` | `#ffa525` |
| `typography.error` / `.success` / `.info` / `.warning` | `#cc0000` / `#008000` / `#0081f2` / `#ffbf40` |

### 1.3 Interaction state layers

Buttons compose a base color with a translucent overlay. **Use these exact alphas** — don't compute
your own opacity.

| State | Primary overlay | Secondary overlay |
| --- | --- | --- |
| hover | `#995a000d` (5%) | `#ffa52514` (8%) |
| focus | `#995a001f` (12%) | `#ffa5251f` (12%) |
| active | `#995a004d` (30%) | `#ffa52533` (20%) |
| outlined border | `#995a0080` (50%) | `#ffa52566` (40%) |

Semantic intents follow the same pattern: background `…33` default, `…14` hover, `…1f` active.

### 1.4 Contrast rules (mandatory — these users are outdoors, on cheap screens)

- `secondary.100` `#ffa525` on white is **~2:1**. Legal as a **fill or accent only**.
  **Never as text on a light background.** Use `primary.100` or `neutral.300` for text.
- `warning.100` `#ffbf40` has the same problem. Warning *text* uses `#f2a200` (`warning.200`) or darker.
- Body text must clear **4.5:1**. `neutral.200` `#666666` on white = 5.7:1 ✅.
  `neutral.100` `#8c8c8c` = 3.0:1 — **disabled text only**, never primary content.
- Never encode meaning in color alone. Every status color pairs with an icon **and** a text label.

---

## 2. Typography

Family: **Lato** (`Lato-Regular` 400, `Lato-SemiBold` 600, `Lato-Bold` 700).
One exception: `Kalam-Bold` for the decorative `kalam` style only.

| Style | Size | Line height | Weight |
| --- | --- | --- | --- |
| `Display` | 40 | 60 | 400 |
| `Heading.large` | 24 | **40** ⚠️ | 600 |
| `Heading.medium` | 20 | 32 | 600 |
| `Heading.small` | 16 | 24 | 700 |
| `Label.large` | 16 | 24 | 600 |
| `Label.medium` | 13 | 20 | 700 |
| `Label.small` | 11 | 20 | 700 |
| `Body.large` | 16 | 24 | 400 |
| `Body.large-emphasised` | 16 | 24 | 600 |
| `Body.medium` | 13 | 20 | 400 |
| `Body.medium-emphasised` | 13 | 20 | 600 |
| `Body.small` | 11 | 20 | 400 |
| `Body.small-emphasised` | 11 | 20 | 600 |
| `Caption` | 14 | 24 | 400 |
| `OVERLINE` | 11 | 20 | 400 |
| `Chip` | 11 | 20 | 600 |
| `Button.small` | 13 | 20 | 600 |
| `Button.medium` | 16 | 24 | 600 |
| `kalam` | 20 | 24 | 400 (`Kalam-Bold`) |

⚠️ **Known divergence.** Figma defines `Heading/Large` line-height as **40**. The existing RN app
uses **30**, with a code comment saying it was reduced to fit the home banner tagline.
**Take 40 as canonical.** If a specific layout needs tighter leading, override it at that component,
never in the global token.

### Type rules for this audience

- **Minimum body size is 16** (`Body.large`) for anything the user must read to act.
  `Body.small` (11) is for metadata only — timestamps, captions, helper text.
- Layouts must survive OS font scaling to **200%** without clipping. Never fix the height of a
  container whose only content is text.
- **Design for the longest script, not for English.** Indic scripts run 15–30% longer than the
  Latin equivalent and sit taller in the line. A button sized to "Rewards" will clip "पुरस्कार".
  Use hug-content widths and let buttons grow.
- Lead with the number and the brand, not prose. This audience reads quantities faster than sentences.

### Multi-script support — PRD §4.0, §4.13

**Lato covers Latin only.** The app launches in Hindi and English, with Gujarati, Marathi, Tamil,
Telugu, Kannada and further regional languages following — and the language catalogue is
Ops-configurable from the portal, so new scripts arrive **without an app release**. The design
system has to be ready for that. These are rules, not considerations:

| Concern | Rule |
| --- | --- |
| **Font family** | Lato for Latin. Each Indic script needs a script-matched companion — the Noto Sans family (Devanagari, Gujarati, Tamil, Telugu, Kannada, Bengali) is the only set with consistent metrics across all of them. Pair by script; never substitute silently. |
| **Bundle cost** | Roughly **150–400 KB per script**. Six scripts can eat a fifth of the 30 MB APK budget from §1 of the architecture doc. Prefer on-demand font download or Android system fonts over bundling everything — and decide before the first release, not after. |
| **Line height** | The ramp above is validated for Latin and Devanagari only. **Every new script must be re-validated.** Tamil and Telugu need more leading at the same point size, so line height may become a per-script value rather than one global ramp. |
| **Fixed dimensions** | Forbidden on anything containing text. This is the single most common multi-script defect. |
| **Numerals** | Quantities and points use **Latin digits in every language** unless user research says otherwise — trade users read `500 kg` faster than `५०० kg`. Open question; confirm before locking. |
| **Glyph fallback** | A missing glyph must never render as tofu (`□`). Define an explicit fallback chain per script and test it on a 2 GB device that has no system font for that script. |

---

## 3. Spacing, radius, icon size

**Spacing** — all padding, margins, and gaps come from this scale. Nothing between steps.

| Token | Value |
| --- | --- |
| `spacing.none` | 0 |
| `spacing.xxs` | 2 |
| `spacing.xs` | 4 |
| `spacing.s` | 8 |
| `spacing.m` | 16 |
| `spacing.l` | 32 |
| `spacing.xl` | 64 |

**Radius**

| Token | Value | Use |
| --- | --- | --- |
| `radius.none` | 0 | |
| `radius.s` | 4 | Small inline elements |
| `radius.m` | 8 | **Default** — buttons, inputs, cards |
| `radius.l` | 16 | Sheets, large cards |
| `radius.xl` | 32 | Pills, fully rounded |

**Icon size**

| Token | Value | Use |
| --- | --- | --- |
| `iconSize.s` | 16 | Inside buttons |
| `iconSize.m` | 24 | **Default** — nav, list rows, standalone |
| `iconSize.l` | 32 | Feature/header |
| `iconSize.xl` | 64 | Illustration |

**Component tokens (Button)** — fixed, do not re-derive:
horizontal padding `16` · vertical padding `8` · radius `8` · internal spacing `8` ·
icon size `16` · label `16/24`.

---

## 4. Component inventory & variant matrices

These axes are **exhaustive**. Component names are given exactly as they appear in the library —
including the typos, which are load-bearing for lookup (see §7).

### 4.1 Buttons

Two component sets share the `Colour` axis: `Primary · Secondary · Error · Success · Info · Warning · Neutral`.

**`Buttons`** — `Size` × `State` × `Colour`
- `Size`: `Small` · `Medium`
- `State`: `Enabled` · `Hover` · `Active` · `Disabled`

**`Buttons` (type variants)** — `State` × `Type` × `Colour`
- `Type`: `Filled` · `Outline` · `Text`
- `State`: `enabled` · `hover` · `focused` (lowercase in this axis)

**`Icon Button`** — `State`: `Enabled` · `Hover` · `Active` · `Disbaled` *(sic)*
**`Visibility Button`**, **`Cart Quantity Button`** — single-purpose, B2B commerce.

> **Mobile tap targets:** the design system's `Medium` button is 40 dp tall. For the Influencer app
> the **minimum interactive target is 48×48 dp** — pad the touchable area beyond the visual bounds
> rather than enlarging the button. These users work with gloves and calloused hands.

### 4.2 Input fields

**`Input Fields`** — `Type` × `State`
- `Type`: `Standard` · `Outlined` · `Fetched` (read-only, server-supplied)
- `State`: `Enabled` · `Hover` · `Active` · `Disabled` · `Error`

**`Helper Text`** — `State` × `Device`
- `State`: `Default` · `Disabled` · `Error` · `Success` · `Warning`
- `Device`: `Mobile` · `Web`

**`Textarea Field`** — `State`: `Default` · `Error`

**`Drop Down`** — `Drop Down`: `Close` · `Open` · `Open with Search` · `Open for new label`
**`Drop down item`** — `State`: `Enabled` · `Hover`

### 4.3 Chips & badges

**`Chip`** — `Type` × `State`
- `Type`: `Standard` · `Neutral Filled`
- `State`: `enabled` · `Hover` · `Active` · `Disabled`
- Purpose per the system's own documentation: *"Use chips for filtering or to highlight data."*

**`Badge`** (status) — `Status` × `Type`
- `Status`: `Pending` · `New or Approved` · `Partially complete` · `Success` · `Danger`
- `Type`: `Outlined` · `Text`

**`Disclaimer Badge`** — `Colour` × `Shape` × `Type`
- `Colour`: `Danger` · `Neutral` · `Success`
- `Shape`: `Rounded` · `Flagged` · `Pill`
- `Type`: `Outlined` · `Filled`

**`Badges`** (count indicator) — `Size`: `Number` · `Size3` · `Dot`

**`Growth percentage`** — `Type` (`Increase` · `Decrease`) × `Size` (`Medium` · `Small`)

### 4.4 Selection controls

**`Checkbox`** — `State` × `Checked` × `Colour`
- `State`: `Enabled` · `Hover` · `Disabled` · `Error`
- `Checked`: `True` · `False`
- `Colour`: `Default` · `Neutral` · `Primary`

**`Radio buttons`** — `State` (`Enabled` · `Hover` · `Disabled` · `Error`) × `Checked` (`True` · `False`)

**`Grouped Cbheckbox`** *(sic — typo is in the library)* — `State`: `Standard` · `Error`.
Used for both grouped checkboxes and grouped radios.

**`Toggle`** — `Selected` × `State` × `Size`
- `Selected`: `True` · `False` · `State`: `Enabled` · `Disabled` · `Size`: `Medium` · `Small`

**`Toggle Field`** — toggle with label, single variant.

### 4.5 Feedback

**`Snackbar`** — `Type`: `Info Snackbar` · `Success Toast` · `Error Toast` · `Error Snackbar` · `Warning Snackbar`

Distinction: a **Snackbar** carries an optional action and is dismissible; a **Toast** is passive.
Error and Success exist in both forms — pick by whether the user can act on it.

### 4.6 Table

Every table part ships `Device=Web` / `Device=Mobile`. The system's own note:
*"Table component will be used for both mobile and web."*

- `Table Row` — `Device` × `State` (`Default` · `Hover` · `Selected`)
- `Table Header` — `Device`
- `Cell`, `Header`, `Chip Cell`, `Button cell` — `Device`
- `Icon Buttons Cell` — `Web` · `Mobile`; plus `Icon Buttons Cell/Edit Cell`

> For the Influencer app, prefer **card lists over tables** on mobile. The table exists for the
> Ops/Web surfaces. A 360 dp screen cannot show Date + Allocated By + Brand + Qty + Unit + Status
> as columns without becoming unreadable.

### 4.7 Date picker

- **`Modal date picker`** — `Property 1`: `Date` · `Year` · `Month`
- **`Calender components/dates`** *(sic)* — `Type` (`Default` · `Today` · `Selected` · `Null` · `Prev/Next`) × `State` (`Enabled` · `Hovered` · `Disabled`)
- **`Calender components-years/months`** — `Selected` × `State`
- **`Calender/Menu button`** — `State`: `Enabled` · `Hovered` · `Disabled`
- Opens as a dropdown from the date input field.

---

## 5. Status → color semantics (product rule, not styling)

The library documents the platform's real status vocabulary. **Reuse these mappings; do not invent
new status colors.**

| Badge status | Meaning | Existing labels using it |
| --- | --- | --- |
| `Pending` / `Incomplete` | Awaiting action or time | Pending · In Progress · Scheduled · Waiting |
| `New or Approved` | Newly created or accepted | Announced *(spelled `Annouced` in library)* · New |
| `Partially complete` | Part done | Partially Completed |
| `Success` | Terminal, good | Active · Verified · Gifted · Redeemed · Completed · Complete |
| `Danger` | Terminal, bad | Inactive · Not Verified · Failed · Cancelled |
| *(In progress)* | Mid-flight | In Shop |

### Mapping for the Influencer app

| Domain status | Badge status |
| --- | --- |
| Reward: Announced | `New or Approved` |
| Reward: Processing | `Pending` |
| Reward: Dispatched / Credited | *In progress* |
| Reward: Received | `Success` |
| Allocation: disputed / not received | `Danger` |
| Lucky draw: Pending | `Pending` |
| Lucky draw: Won | `Success` |
| Lucky draw: Not Won | `Danger` — **but reconsider.** Losing a fair draw is not a failure state. Prefer neutral. Flag to design. |
| Event: Invited | `New or Approved` |
| Event: Attended | `Success` |
| Event: Did Not Attend | Neutral, **not** `Danger` |
| Event gift: Allotted | `New or Approved` |
| Event gift: Pending Dispatch | `Pending` |
| Event gift: Handed Over at Event | `Success` |

---

## 6. Icons

`HUMBEE Icons/*`, 24×24 default, outlined and filled where both exist.

**Navigation / chrome** — `menu` · `close` · `arrow_back` · `arrow_left` · `arrow_right` ·
`keyboard_arrow_up|down|left|right` · `arrow up` · `arrow_outward` · `keyboard_arrow_insert` ·
`Side panel open|close` · `search outlined` · `manage_search` · `filter_list` · `sort` · `share`

**Account / support** — `Account` · `Profile` · `Profiler outlined` · `settings outlined` ·
`Help outlined` · `FAQ outlined` · `login` · `logout outlined` · `Password` · `call` · `mail` ·
`Email notification` · `Privacy` · `Tnc` · `Cancel policy`

**Status / feedback** — `error` · `warning` · `info outlined` · `info filled` · `disclaimer filled` ·
`check_circle` · `verified_user` · `editor_choice` · `no internet` · `invalid document`

**Domain** — `Rewards outlined` · `Benefits outlined|filled` · `Beneficiary outlined` ·
`Performance outlined|filled` · `Network` / `Network filled` · `Home outlined|filled` ·
`Business outlined|filled` · `Onboard Buyer outlined|filled` · `manufacturer` ·
`Humbee operations` · `ONE` · `Currency Rupee` · `TDS outlined` · `Dashboard` · `Employees` ·
`Cluster` · `Product price` · `VCP management`

**B2B commerce (mostly not needed for Influencer)** — `shopping_cart outlined|filled` ·
`shopping_cart_checkout` · `Create PO outlined` · `PO outlined` · `Dispatch Plan outlined` ·
`secondary order outlined` · `invoice outlined` · `Payment outlined` · `Inventory outlined` · `Refund_money`

**Utility** — `download outlined` · `upload` · `image` · `edit` · `delete` · `Add` · `minus` ·
`calendar` · `map` · `location_pin` · `Location marker` · `web` · `suitcase` · `health_metrics` ·
`notifications outlined` · `notifications_unread outlined` · `Visibility` / `Visibility off` ·
`Checkbox outlined|filled` · `Radio button outlined|filled`

### Illustration set — `HUMBEE Icons` component, `Type` × `Size`

Sizes: **48px · 64px · 100px**

`LI` · `MI` · `GAP` · `Staff Insurance` · `SHOP` · **`Umang Utsav`** · `TRIP` · `Tree` ·
`Adhyayan` · `Notification` · `Announcement` · `Approved` · `Reject` · `Humbee`

> **`Umang Utsav` already exists as an illustration** at all three sizes — use it for the event
> banner and event cards (PRD §4.5) rather than commissioning new art. `Approved`, `Reject`,
> `Announcement`, and `Notification` cover most empty and result states.

### Icons the Influencer app needs that **do not exist yet**

Raise these as a design-system addition before designing the screens that need them:

`lucky draw / raffle` · `points / coin` · `leaderboard / ranking` · `referral / invite` ·
`trophy / milestone badge` · `industry marks (Steel / Cement / Paints)` · `QR / digital ID card`

---

## 7. Known defects in the library

Preserve these spellings when **looking components up**; use correct spelling in **new code**.

| In library | Correct | Where |
| --- | --- | --- |
| `Grouped Cbheckbox` | Grouped Checkbox | Component set name |
| `Disbaled` | Disabled | `Icon Button` state; `Typography/states` |
| `Annouced` | Announced | Chip/badge labels |
| `Calender` | Calendar | Date picker components |
| `InputFiled.tsx` | InputField | RN app `app_V3/UiKit/atom` |

---

## 8. Gaps for the Influencer app

The library was built for the **B2B Distributor/Dealer** product — note `Cart Quantity Button`,
`Product/button/*` tokens, `Create PO`, `Dispatch Plan`. The Influencer app needs new components.
These are **design-system additions**, not screen-local views:

| Component | Why it belongs in the system |
| --- | --- |
| `ActivityRow` | Encodes "manufacturer · role-for-that-industry · qty in native unit". Used on Dashboard and Allocations. Getting this one component right makes the product's most-broken rule right everywhere. |
| `RoleIndustryTag` | The `Dalmia TMT · Barbender` pairing. **Must never render a role without its industry.** |
| `FulfilmentStatusStepper` | Announced → Processing → Dispatched/Credited → Received. Reused by Rewards and Umang Utsav gifts. |
| `PointsByManufacturerChart` | Bar chart with points as the cross-industry common unit |
| `QuantityWithUnit` | Quantity in the *industry's* native unit, locale-correct numerals |
| `EmptyState` · `OfflineBanner` · `PendingSyncBadge` | Offline-first is a PRD requirement — these must look designed, not like errors |
| `EventCard` | Umang Utsav upcoming/past, using the existing `Umang Utsav` illustration |

---

## 9. Using this document

**When designing or implementing a screen:**
1. Read §0. Then find the components you need in §4 and take their exact variant names.
2. Take every value from §1–§3. Never from a screenshot, and never from memory.
3. Map statuses through §5 — that mapping is product logic, not decoration.
4. Check §6 before assuming an icon needs drawing, and §8 before building a "new" component.
5. Apply the audience rules: 48 dp targets, 16 pt minimum body, Hindi-first sizing, no color-only meaning.

**When Figma changes:** re-extract with `get_metadata` (reliable) per page node, diff against §4,
and update this file plus `packages/tokens` in the same commit.

**Extraction note.** `get_variable_defs` intermittently fails against this file when the connector
routes to the Figma desktop app ("nothing selected"). `get_metadata` with an explicit `nodeId` is
the dependable path for structure; token *values* were confirmed against the RN theme files, which
are the system's own implementation and match Figma.
