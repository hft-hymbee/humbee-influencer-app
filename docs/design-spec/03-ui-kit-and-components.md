# 03 — UI kit and component inventory

Every component below is either (a) a HUMBEE Design System primitive you should take from the DS package, or (b) an app-level composite assembled in this design. Specs are exact.

---

## A. Design-system primitives used

| Component | Props used in this app | Notes |
| --- | --- | --- |
| `Button` | `size="large"`, `fullWidth`, `disabled`, `type="text"` | Large = 48px height, radius 8, Lato 700. Filled primary `#995A00`, hover → `#7A4800`, disabled → neutral-25 bg + neutral-100 text (never opacity fade) |
| `Input` | `label`, `placeholder`, `inputMode`, `maxLength`, `value`, `onChange` | 40px control + label above; total block ≈68px. Label copy is instructional ("Enter Mobile Number") |
| `Select` | `label`, `placeholder`, `options`, `value`, `onChange`, `searchable` | Used once, for SKU choice |
| `Icon` | `name`, `size` | See icon table in tokens doc |
| `ProductMark` | `name`, `size={48}` | Gift/programme marks |
| `Illustration` | `name="NoDataFound"`, `size={120}` | Empty states |
| `Chip` | — | Present in the DS; this build uses custom pills for filters (spec below) because of the count badge |
| `ProgressLinear` | — | Available; not used in the current build |

---

## B. App shell

### B1. Status bar (prototype only)
44px, transparent, 11/20/700. `9:41` left, `4G LTE 96%` right. **Replace with the platform status bar.**

### B2. App header (`showChrome` = every screen except the two login screens and Demand Captured)
- Layout: `flex`, `align-items:center`, `gap:12px`, padding `12px 16px 16px 16px`, min-height 76px
- Background `#FFFFFF`, divider `inset 0 -1px 0 #E5E5E5`, `z-index:2`
- **Left**: HUMBEE logomark, 32×32 (`assets/humbee-logomark.svg`)
- **Centre**: title 17/24/700 + subtitle 13/18 `#8C8C8C`; both single-line with ellipsis
- **Right**: 40×40 tap target, radius 8, `Icon name="Account" size={24}`, colour `#333333`, hover fill `primary-5`, `margin-right:-8px` for optical alignment. Navigates to Profile. **No hexagon around it, no notification bell.**

Titles and subtitles by screen:
| Screen | Title | Subtitle |
| --- | --- | --- |
| Home | Home | HUMBEE Influencer Programme |
| Profile | My Profile | Account and login details |
| Leaderboard | Leaderboard | Top 10 in your district |
| Capture Demand | Capture Demand | Raise quantity against your manufacturer |
| My Demands | My Demands | Everything you have raised on HUMBEE |
| Inventory Allocated | Inventory Allocated | What your VCPs allocated |
| Rewards | Rewards | Gifts you have earned |

The subtitle must **never** repeat the selected manufacturer name — the manufacturer tab bar already shows it.

### B3. Bottom navigation (same visibility rule as the header)
- `flex`, background `#FFFFFF`, top divider `inset 0 1px 0 #E5E5E5`, padding `8px 8px 20px 8px` (the 20px is the home-indicator inset)
- Five equal items: **Home · Leaderboard · Demand · Inventory · Rewards**
- Item: column, `gap:2px`, padding `6px 0`, radius 8; icon 24 then label 10/14/700
- Active: filled icon, colour `#995A00`, background `primary-10`. Inactive: outlined icon, colour `#8C8C8C`, transparent
- `demand`, `demands` and `demand-done` all activate the **Demand** tab

---

## C. Composites

### C1. Manufacturer tab bar — `ManufacturerTabs`
Appears on Leaderboard, Inventory Allocated and Rewards. **This is the manufacturer switcher; it is deliberately not a chip row.**
- Horizontal scroll container, `gap:20px`, padding `0 16px`, bottom rule `inset 0 -1px 0 #E5E5E5`, scrollbar hidden
- Item: column, centred, `gap:6px`, `padding-top:12px`
- Label 15/20; active `#0D0D0D` weight 700, inactive `#8C8C8C` weight 400; colour transitions 120ms
- Underline: full item width, 2px, radius `2px 2px 0 0`; active `#0D0D0D`, inactive transparent
- Selecting a manufacturer resets the gift status filter to `All`

### C2. Period filter — `PeriodPills`
Inventory Allocated and Rewards only.
- Row: overline `PERIOD` (11/16/700, +0.4px, `#8C8C8C`) then three equal pills, `gap:6px`
- Pill: `flex:1`, height **26px**, radius pill, 11px/700 centred
- Active: bg `#0D0D0D`, text `#FFFFFF`, no ring. Inactive: bg `#FFFFFF`, text `#666666`, ring `inset 0 0 0 1px #E5E5E5`
- Options: `3 Months` (default) · `6 Months` · `1 Year`
- Deliberately **smaller than the manufacturer tabs** — manufacturer is the primary axis, period the secondary

### C3. Status filter chip (Rewards) — `StatusFilterChip`
- `flex:none`, height 32px, padding `0 12px`, radius pill, `gap:6px`
- Label 13/18/700 + count badge: min-width 18, height 18, radius pill, 11/700
- Inactive: background = that status's tint (`Announced` info-10, `In Shop` warning-10, `Gifted` success-10, `Redeemed` primary-10; `All` = `rgba(255,255,255,0.9)`), text = that status's 200 shade, ring `inset 0 0 0 1px` border-subtle, count badge `rgba(0,0,0,0.06)` on `#8C8C8C`
- Active: background `#995A00`, text `#FFFFFF`, shadow elevation-2, count badge `rgba(255,255,255,0.24)` on `#FFFFFF`
- Order: `All · Announced · In Shop · Gifted · Redeemed`; counts are period-filtered

### C4. Demand status filter chip (My Demands)
Same anatomy, height **30px**, count rendered inline at weight 400 / opacity 0.7. Active bg `#995A00` / `#FFFFFF`; inactive `#FFFFFF` / `#666666` with `inset 0 0 0 1px #E5E5E5`. Order: `All · Submitted · Confirmed · Allocated · Closed`.

### C5. Status badge (read-only) — `StatusBadge`
Height 22px (Home list) or 24px (cards), padding `0 8px` / `0 10px`, radius pill, 11/16/700.
| Status | Background | Text |
| --- | --- | --- |
| Announced | info-10 | info-200 |
| In Shop | warning-10 | warning-200 |
| Gifted | success-10 | success-200 |
| Redeemed | primary-10 | primary-200 |
| Submitted | `#F2F2F2` | `#666666` |
| Confirmed | primary-10 | primary-200 |
| Allocated | `rgba(108,217,108,0.20)` | `#006600` |
| Closed | `#F2F2F2` | `#8C8C8C` |

### C6. Stat tile — `StatTile`
`flex:1`, padding `12px 14px` (10px 12px in My Demands), radius 8, background `#F2F2F2`, column, `gap:2px`.
Home / My Demands: value 20/26/700 above label 11/16 `#666666`. Inventory Allocated: label **above** value (label 11/16 `#666666`, value 20/28/700).

### C7. Hex avatar / mark — `HexMark`
Square box with the brand clip-path. Content is either initials (Lato 700, size scales with box) or a 16–24px icon. Sizes and colour pairs listed in the tokens doc.

### C8. Card — `Card`
White, radius 8, `inset 0 0 0 1px #E5E5E5`, padding 14 or 16, column with `gap:10–12px`. A card's footer row is separated by `inset 0 1px 0 #F2F2F2` (or border-subtle) with `padding-top:10–12px` — never a real border.

### C9. List container
White, radius 8, `inset 0 0 0 1px #E5E5E5`, `overflow:hidden`; each row carries `inset 0 -1px 0 #F2F2F2` as its own hairline. Row min-height 52–56px, padding `10–12px 14px`.

### C10. OTP box
4 boxes, `gap:12px`, each `flex:1`, height 60px, radius 8, centred Lato 700 24px, no border, no outline.
Empty ring `inset 0 0 0 1px` neutral-100; filled ring `inset 0 0 0 2px #995A00`; 120ms transition. `inputMode="numeric"`, `maxLength=1`, digits only.

### C11. Demand trail (honeycomb stepper) — `DemandTrail`
Sticky at the top of the Capture Demand scroll area (`top:0`, `z-index:2`), padding `12px 16px`, background `rgba(255,255,255,0.94)` + `backdrop-filter: blur(10px)`, bottom rule `inset 0 -1px 0 #E5E5E5`.
Three equal steps: **Industry · Product · Quantity**. Each step is a column (`gap:4px`) containing a connector line (absolute, `top:15px`, 2px), a 32px hex with a 16px icon, a label 11/14/700 and the chosen value 11/14 `#8C8C8C` (ellipsised).
| Step state | Hex bg | Hex fg | Label | Connector |
| --- | --- | --- | --- | --- |
| Done | `#995A00` | `#FFFFFF` | `#333333` | primary-25 |
| Active (next to fill) | `#FFA525` | `#0D0D0D` | `#333333` | neutral-25 |
| Pending | neutral-25 | text-disabled | `#8C8C8C` | neutral-25 |

Icons: `Cluster`, `InventoryOutlined`, `CheckCircle`. Values fall back to "Not chosen" / "Not entered". **No "Step 1 of 3" counter.**

### C12. Image selection card — `PickCard`
Industry (2-up grid, image 92px tall) and sub-industry (horizontal scroll, 116px wide, image 76px tall).
- Radius 8, white, `overflow:hidden`; ring `inset 0 0 0 1px` border-subtle → selected `inset 0 0 0 2px #995A00` + elevation-2
- Image area `background-size:cover; background-position:center`; selected adds a `rgba(153,90,0,0.18)` veil
- Industry card only: 24px circular tick badge top-right — selected `#995A00`/white, unselected `rgba(255,255,255,0.75)`/transparent icon
- Caption: industry = code 15/20/700 + name 11/16 `#8C8C8C`; sub-industry = label 13/18/700, single line

### C13. UOM segmented control
Wrapper: `gap:4px`, padding 4px, radius 8, background `#F2F2F2`. Button: min-width 56, height 36, radius 4, 13/700. Active `#995A00`/white; inactive transparent/`#8C8C8C`. First UOM in the list is the default.

### C14. Leaderboard table
Header row: min-height 44px, padding `12px 16px`, background `#F2F2F2`, bottom rule `inset 0 -1px 0 #E5E5E5`, 11/16/700 +0.6px uppercase `#666666`. Columns: `Rank` (32px) · `Influencer` (flex) · unit label (76px, right) · `Points` (56px, right).
Data row: min-height 60px, padding `10px 16px`, `gap:12px`, hairline `inset 0 -1px 0 #F2F2F2`; 32px hex rank mark; name 15/20/600 with a 5px progress bar underneath (radius pill, track `#F2F2F2`); volume column = value 15/18/700 + unit 11/14 `#8C8C8C`; points column = value 15/18/700 `#008000` + "points" 11/14 `#8C8C8C`.

### C15. Podium
Panel: padding `16px 12px 12px`, radius 8, the amber gradient, ring primary-10. Three cards in `align-items:flex-end`, order **2 – 1 – 3**; rank 1 has `margin-top:0`, others `18px`.
Card: white, radius 8, padding `12px 6px`, centred column `gap:6px`; rank 1 ring primary-25 + elevation-2, others `inset 0 0 0 1px #E5E5E5`.
Contents: hex avatar (58px rank 1 / 46px) with initials; an SVG medal (30×38, `bottom:-8px right:-14px`, `drop-shadow(0 1px 2px rgba(0,0,0,0.20))`) built from two ribbon paths + three concentric discs, with the **rank number centred on the disc**; then medal label 11/14/700 +0.6px uppercase, first name 13/18/700, volume 15/20/700, points 11/14 `#8C8C8C`.

### C16. Current-user card (sticky)
`position:sticky; bottom:0`, wrapper padding `8px 16px 16px`, wrapper background = the white fade gradient.
Card: min-height 64px, padding `12px 16px`, radius 8, white, `inset 0 0 0 1.5px #995A00` + elevation-2. 36px hex mark with rank; name "{Name} (You)" 15/20/700; gap line 13/18 `#666666`; right column volume 18/22/700 `#995A00` + points 11/14 `#8C8C8C`.

### C17. Points explainer (collapsible)
Card with a 52px tap row: 28px hex tile with `InfoOutlined` 16 → title "How You Earn Points" 13/18/700 + base line 11/16 `#8C8C8C` ("{Manufacturer} · 1 Kg = 1 point") → right link `View` / `Hide` 11/16/700 `#995A00`.
Expanded body (`humbeeRise` 160ms): rows min-height 34px, padding `7px 10px`, radius 4, background `#F2F2F2`, label 13/18 `#333333` left, value 13/18/700 right (first row `#333333`, premium rows `#995A00`), then the note "Premium SKUs carry multiplied points. Points post once your distributor confirms the allocation." 11/16 `#8C8C8C`.

### C18. Banner carousel
Full-bleed (`margin:0 -16px`), `overflow:hidden`. Track is 200% wide with two 50% slides; `transform: translateX(-50% × index)`, 420ms. Auto-advances every 4000ms. Dots below, centred, `gap:6px`, height 6px, radius pill; active 20px wide `#995A00`, inactive 6px `#D9D9D9`; tapping a dot jumps.

### C19. Empty state
Centred column, padding `32px 16px`, `gap:12px`: `Illustration name="NoDataFound" size={120}`, heading 15/22/700, body 13/20 `#666666`. Copy per screen in the screen specs.

### C20. Advanced disclosure (Profile)
40px centred row, `gap:6px`, 13/20/700 `#8C8C8C`: label "Advanced" + a caret glyph that rotates 180° over 200ms when open. Revealing shows the destructive Delete Account button and its warning line. Closed by default on every visit.

### C21. Skeleton loader — `Skeleton`
The loading state for every data screen. Shown while the screen's data is in flight; **never** a spinner on a full screen.

**Atom.** A rectangle that shimmers:
```css
background: linear-gradient(90deg, #F2F2F2 25%, #EAEAEA 37%, #F2F2F2 63%);
background-size: 240px 100%;
animation: humbeeShimmer 1200ms linear infinite;
```
```css
@keyframes humbeeShimmer { from { background-position: -240px 0; } to { background-position: 240px 0; } }
```
Radius follows the real element it stands in for: **4px** for text lines, **8px** (`--radius-m`) for cards and tiles, **pill** for chips and pills, and the **hex clip-path** for hex marks. Never grey blocks with the wrong shape.

**Sizes for text lines**: title 13px tall at 60–65% width; meta 10px tall at 35–40% width; overline 10px tall at 44px wide.

**Screen skeleton** (the shape used in the prototype, matching the three data-list screens):
1. Tab-bar row — 4 bars, 84×14, `gap:20px`, padding `12px 16px 14px`, with the same `inset 0 -1px 0 #E5E5E5` rule as the real tab bar
2. Period row — a 44×10 overline bar + three `flex:1` pills 26px tall, `gap:8px`
3. Two `flex:1` tiles, 66px tall, radius 8, `gap:12px`
4. Three cards — real card chrome (white, radius 8, `inset 0 0 0 1px #E5E5E5`, padding 16px) containing a 40px hex mark, two text lines, a 56×22 pill, then a footer row (`inset 0 1px 0 #F2F2F2`, `padding-top:12px`) with two pills and a 52×12 value bar

**Rules**
- The skeleton keeps the **header and bottom nav live** — only the scroll body is replaced, so the user can still navigate away.
- Card and tile chrome is real; only the content inside shimmers. This is why the skeleton reads as "the screen, loading" rather than "grey boxes".
- Container carries `aria-busy="true"`; announce "Loading" once to screen readers, not per shimmer.
- Under `prefers-reduced-motion`, drop the shimmer animation and render the bars as flat `#F2F2F2`.
- Skeleton counts match what the screen typically shows (3 cards, 4 tabs, 2 tiles) — do not animate the count.
- **Do not** show a skeleton for: the two login screens, the Demand Captured screen, or any action in flight (those use the button's own loading state).
