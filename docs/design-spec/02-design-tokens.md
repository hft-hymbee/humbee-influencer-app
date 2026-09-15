# 02 — Design tokens

Source: HUMBEE Design System (Figma `HUMBEE_Design_System.fig`, 531 variables). The CSS token files shipped in `tokens/` are the machine-readable version — port them to your platform's token format rather than retyping values.

## Colour

### Brand
| Token | Value | Use in this app |
| --- | --- | --- |
| `--brand-primary` / primary-100 | `#995A00` | Chestnut. Emphasis only: primary button, active nav, rank-1 medal, current-user ring, links, active UOM, selected card ring |
| primary-200 (dark) | `#7A4800` | Hover/pressed on filled primary; status text on Redeemed chip |
| primary-50 | `#CC9A4D` | — |
| primary-25 | `rgba(153,90,0,0.25)` | Card ring on hover, podium panel ring |
| primary-10 | `rgba(153,90,0,0.10)` | Icon-tile background, active nav pill, Redeemed chip background |
| primary-5 | `rgba(153,90,0,0.05)` | Hover fill on text/ghost controls |
| `--brand-secondary` | `#FFA525` | Crayola amber. Active step in the demand trail; podium gradient |
| secondary tint | `rgba(255,165,37,0.18)` → `0.04` | Podium panel gradient |

### Neutrals used in this app
| Value | Use |
| --- | --- |
| `#FFFFFF` | All surfaces: header, cards, screen background, bottom nav |
| `#F7F7F7` | DS page background (not used — this app is white-first) |
| `#F2F2F2` | Sunken fills: stat tiles, table header, progress track, row hairlines, UOM group |
| `#E5E5E5` | Card borders (as `inset 0 0 0 1px`), header/nav divider, silver medal hex |
| `#D9D9D9` | Inactive carousel dot |
| `#8C8C8C` | Tertiary text: meta, overlines, inactive tab label, captions |
| `#666666` | Secondary text: stat labels, sub-values, inactive filter text |
| `#333333` | Primary text |
| `#0D0D0D` | Base black. Active manufacturer tab label + its 2px rule, active period pill |
| `#EDF1F6` | Unified background tint of all industry illustrations |

### Semantic
| Token | Value | Use |
| --- | --- | --- |
| success-100 | `#008000` | Points values, "Points earned" stat |
| success (custom) | `#006600` | Allocated demand emphasis (deeper green for small text) |
| success-10 / -200 | `rgba(0,128,0,0.10)` / `#006600` | Gifted status chip bg / fg |
| error-100 | `#CC0000` | Delete Account label |
| error-25 / -10 | `rgba(204,0,0,0.25)` / `rgba(204,0,0,0.10)` | Delete button ring / hover |
| warning-10 / -200 | `rgba(255,191,64,0.10)` / `#BF8000` | In Shop status chip |
| info-10 / -25 / -100 / -200 | `rgba(0,129,242,0.10)` / `0.25` / `#0081F2` / `#0067C1` | No-manufacturer banner; Announced status chip |

### Medal palette (leaderboard podium)
| Rank | Hex avatar bg | Avatar text | Label | Label colour | Ribbon dark / light | Disc outer / mid / inner | Number |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Gold | `#995A00` | `#FFFFFF` | Gold | `#995A00` | `#7A4800` / `#995A00` | `#C98A0F` / `#F0B542` / `#FFD983` | `#6B3F00` |
| 2 Silver | `#E5E5E5` | `#4A4A4A` | Silver | `#8C8C8C` | `#6B6B6B` / `#8C8C8C` | `#9AA0A6` / `#C9CDD2` / `#EDEFF1` | `#4A4A4A` |
| 3 Bronze | `#EBD3B4` | `#8A4B12` | Bronze | `#A9662B` | `#5C3600` / `#7A4800` | `#9A6A2E` / `#BE8A4C` / `#DCB07A` | `#5C3600` |

Leaderboard row rank marks (ranks 1–3) use `#995A00`/white, `#E5E5E5`/`#333333`, `#F2F2F2`/`#666666` respectively; rank 4+ uses `#F2F2F2`/`#666666`.

Progress bars: rank 1–3 `rgba(153,90,0,0.55)`, rank 4+ `rgba(153,90,0,0.30)`, on a `#F2F2F2` track.

### The two permitted gradients
1. Podium panel: `linear-gradient(180deg, rgba(255,165,37,0.18) 0%, rgba(255,165,37,0.04) 62%, rgba(255,255,255,0) 100%)`
2. Leaderboard sticky footer fade: `linear-gradient(0deg, #FFFFFF 60%, rgba(255,255,255,0))`

## Typography — Lato
Ratio 1.54. Weights: 400 Regular, 600 SemiBold, 700 Bold.

| Role | Size / line-height / weight | Where |
| --- | --- | --- |
| Screen title (login) | 24 / 32 / 700 | "Log In", "Verify OTP", "Demand Captured", Home welcome name |
| Header title | 17 / 24 / 700 | App-bar title |
| Header subtitle | 13 / 18 / 400 | App-bar second line |
| Section heading | 20 / 28 / 700 | Profile name |
| Stat value | 20 / 26–28 / 700 | Stat tiles |
| Body large | 15 / 22 / 400 | Login subtitles, empty-state body |
| Row title | 15 / 20 / 700 | Card titles, quick-link labels, manufacturer names |
| Leaderboard name | 15 / 20 / 600 | Influencer name in rows |
| Body | 13 / 20 / 400 | Profile keys, helper lines, summary |
| Body bold | 13 / 18–20 / 700 | Chip labels, points card title, medal figures |
| Overline | 11 / 20 / 700, +0.5px, UPPERCASE | "INDUSTRY", "QUICK LINKS", "MY REWARDS", "PERIOD" |
| Meta | 11 / 16 / 400 | Card meta, VCP line, stat labels |
| Table header | 11 / 16 / 700, +0.6px, UPPERCASE | Leaderboard column header |
| Nav label | 10 / 14 / 700 | Bottom nav |
| OTP digit | 24 / — / 700, centred | OTP boxes |

There is **no 14px body size** in the system. Do not introduce one.

## Spacing
4pt grid. Used values: 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32.

Screen padding is **16px**; login screens use **24px**. Card inner padding is **14px** or **16px**. Gap between stacked cards is **12px**; between sections **16–20px**.

## Radius
| Token | Value | Use |
| --- | --- | --- |
| `--radius-s` | 4 | Point-rule rows, UOM buttons |
| `--radius-m` | 8 | **Default.** Cards, tiles, buttons, inputs, nav pills, OTP boxes |
| `--radius-l` | 16 | Login/OTP form panel |
| `--radius-pill` | 32 / 999 | Status chips, filter chips, period pills, carousel dots, progress bars |
| — | 40 | Phone frame in the prototype only (not a product value) |

## Borders
Borders are **inset box-shadows**, never CSS borders, so they never affect layout.
- Card: `inset 0 0 0 1px #E5E5E5`
- Selected card: `inset 0 0 0 2px #995A00` + elevation-2
- Current-user row: `inset 0 0 0 1.5px #995A00` + elevation-2
- Row hairline: `inset 0 -1px 0 #F2F2F2`
- Section divider: `inset 0 -1px 0 #E5E5E5` (below header) / `inset 0 1px 0 #E5E5E5` (above nav)
- Outline button: `inset 0 0 0 1px rgba(153,90,0,0.5)`

## Elevation
Black at 15% opacity. Five steps, 0–4.
| Token | Value | Use |
| --- | --- | --- |
| `--elevation-1` | `0 1px 3px rgba(0,0,0,0.15)` | Resting cards (rail panels) |
| `--elevation-2` | `0 2px 8px rgba(0,0,0,0.15)` | Selected cards, current-user card, login panel, active filter chip |
| `--elevation-4` | `0 8px 24px rgba(0,0,0,0.15)` | Prototype phone frame only |

No coloured or tinted shadows.

## Motion
| Duration | Easing | Use |
| --- | --- | --- |
| 120ms | `cubic-bezier(0.4,0,0.2,1)` | Colour, background, box-shadow changes |
| 160ms | same | Points-card expand |
| 200ms | same | Size/position change; row entry; caret rotate |
| 240–260ms | same | Screen/section rise |
| 400ms | same | Progress-bar fill |
| 420ms | same | Carousel slide |
| 4000ms interval | — | Carousel auto-advance |

Keyframes used (see `05-interactions-and-motion.md` for full definitions): `humbeeRise`, `humbeeRowIn`, `humbeeFill`, `humbeeSlide`, `humbeeGlow`.

Nothing scales or shrinks on press. No bounce, no spring.

## Iconography
The HUMBEE icon set (102 in-house glyphs, 24×24 grid, solid fills, tinted with `currentColor`). **Do not substitute Lucide / Material / Heroicons.** Icons used in this app:

| Icon name | Where | Size |
| --- | --- | --- |
| `Account` | Header profile button | 24 |
| `ArrowBack` | Back button (OTP screen) | 24 |
| `HomeFilled` / `HomeOutlined` | Bottom nav — Home | 24 |
| `PerformanceFilled` / `PerformanceOutlined` | Bottom nav — Leaderboard; Home quick link | 24 / 20 |
| `ShoppingCartFilled` / `ShoppingCartOutlined` | Bottom nav — Demand; Home quick link | 24 / 20 |
| `InventoryOutlined` | Bottom nav — Inventory; allocation card; SKU rows; trail step 2 | 24 / 20 |
| `RewardsOutlined` | Bottom nav — Rewards; Home quick link | 24 / 20 |
| `InfoOutlined` | Points card tile; no-manufacturer banner | 16 / 20 |
| `CheckCircle` | Selection ticks; trail step 3 | 16 / 20 / 24 |
| `Cluster` | Trail step 1 (Industry) | 16 |
| `VCPManagement` | Gift card VCP line | 16 |
| `LogoutOutlined` | Profile — Log Out | 20 |
| `Delete` | Profile — Delete Account | 20 |

Filled = active, outlined = inactive, for every nav glyph.

**ProductMark** (full-colour programme marks, 48px): `UmangUtsav`, `SHOP`, `Approved`, `TRIP` — used on gift cards and the Home rewards list.
**Illustration** (multi-colour, 120px): `NoDataFound` — used in both empty states.

## The brand shape
`clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)`

A flat-top hexagon. Applied to: leaderboard rank marks (32px), podium avatars (58px rank 1 / 46px others), profile avatar (72px), current-user mark (36px), quick-link icon tiles (36px), points-card icon tile (28px), demand trail steps (32px), manufacturer initials (36px), My Demands manufacturer mark (34px), allocation icon tile (40px).
