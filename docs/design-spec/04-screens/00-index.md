# 04 — Screens

Canvas for every screen: **390 × 844** (iPhone 14 logical size; design is fluid — nothing is pinned to 390 except the prototype frame). Screen background is white. Content scroll area sits between the header and the bottom nav.

| # | File | Screen | Header / nav | Notes |
| --- | --- | --- | --- | --- |
| 01 | `01-login-mobile.md` | Login — mobile number | none | 24px padding, logo lockup |
| 02 | `02-login-otp.md` | Verify OTP | none | 4 boxes, full number shown |
| 03 | `03-home.md` | Home | yes | Carousel, stats, quick links, my rewards |
| 04 | `04-profile.md` | My Profile | yes | Log Out + Advanced → Delete |
| 05 | `05-leaderboard.md` | Leaderboard | yes | Tabs, points card, podium, table, sticky me |
| 06 | `06-capture-demand.md` | Capture Demand | yes | Tabs, sticky trail, 3-step picker |
| 07 | `07-demand-captured.md` | Demand Captured | none | Two Lotties |
| 08 | `08-my-demands.md` | My Demands | yes | Stats, filters, demand cards |
| 09 | `09-inventory-allocated.md` | Inventory Allocated | yes | Tabs, period, totals, allocation cards |
| 10 | `10-rewards.md` | Rewards | yes | Tabs, period, Umang Utsav, gift list |

Each spec follows the same shape: **Purpose → Layout → Components (top to bottom) → Copy → States → Data**.

Open `../prototype/prototype-standalone.html` and use the left rail to view any screen live; the rail label for each screen is given in the table below.

| Screen | Rail label |
| --- | --- |
| Login — mobile number | Mobile Number |
| Verify OTP | OTP Verification |
| Home | Banners & Quick Links |
| My Profile | My Profile |
| Leaderboard | Manufacturer Wise Ranking |
| Capture Demand | Industry, Product, Quantity |
| Demand Captured | Demand Submitted |
| My Demands | My Demands |
| Inventory Allocated | Allocation Of Inventory |
| Rewards | Rewards & Umang Utsav |
