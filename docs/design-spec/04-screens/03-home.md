# 03 — Home

![](../screens/03-home.png)

## Purpose
Orient the influencer: who they are, what the programme is running, and one tap to every module. Home is the landing screen after login.

## Layout
Header (title "Home", subtitle "HUMBEE Influencer Programme") + bottom nav.
Scroll body: column, `gap:20px`, padding 16px.

## Components, top to bottom
1. **Welcome block** — column, `gap:2px`
   - "Welcome back" 13/18 `#8C8C8C`
   - Influencer name 24/32/700 `#333333`
2. **Banner carousel** (component C18) — full-bleed via `margin:0 -16px`; two slides, images at natural aspect ratio, `width:100%`; auto-advance 4s; dots below
   - Slide 1 `../assets/img/banner-1.png` — alt "Hoga Yogdaan Ka Samaan"
   - Slide 2 `../assets/img/banner-2.png` — alt "15.21+ Lakh Shilpkars recognised and rewarded"
3. **Stat tiles** — two, `gap:8px` (component C6)
   - "Rewards allotted · all manufacturers" — count across all manufacturers, value in `#008000`
   - "Points earned this year" — `en-IN` formatted, `#008000`
4. **Quick links** — overline "QUICK LINKS", then a 2×2 grid, `gap:12px`
   - Card: white, radius 8, padding 14px, ring `inset 0 0 0 1px #E5E5E5`, column `gap:10px`; hover ring primary-25 + elevation-1
   - 36px hex tile (primary-10 bg, `#995A00` icon 20px), then label 15/20/700 and meta 11/16 `#8C8C8C`
   | Label | Meta | Icon | Target |
   | --- | --- | --- | --- |
   | Leaderboard | Top 10 per manufacturer | PerformanceOutlined | Leaderboard |
   | Capture Demand | Raise a new demand | ShoppingCartOutlined | Capture Demand |
   | Allocations | Inventory allocated | InventoryOutlined | Inventory Allocated |
   | Rewards | Gifts and Umang Utsav | RewardsOutlined | Rewards |
5. **My Rewards** — header row: overline "MY REWARDS" + "View All" (11/16/700 `#995A00`, → Rewards)
   - List container (component C9); **4 most recent gifts across all manufacturers**, newest first
   - Row: min-height 56px, padding `10px 14px`, `gap:12px`: `ProductMark size={48}` rendered at 32px box, then gift name 15/20/700 + meta "{Manufacturer} · {date}" 11/16 `#8C8C8C`, then a 22px status badge. Whole row taps through to Rewards

## Order note
Quick links sit **above** My Rewards. Carousel is full width. Both were explicit client decisions.

## States
| State | Behaviour |
| --- | --- |
| Loading | Skeletons: welcome name, two tiles, four quick-link cards, four reward rows |
| No rewards yet | Replace the list with a one-line card: "No gifts yet. Capture demands to enter the next lucky draw." Keep quick links |
| Carousel single slide | Hide the dots, disable auto-advance |
| Long name | Welcome name wraps to two lines; do not truncate |
