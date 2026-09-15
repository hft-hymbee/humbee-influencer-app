# 01 — Product and scope

## Who uses it
**Influencers** in the Indian construction and FMCG trade: painters, bar benders, masons, carpenters, contractors. They influence which brand of material a site or household buys but do not own the purchase. HUMBEE rewards that influence.

Typical user profile: Android phone (often <₹12,000), intermittent 4G, comfortable with WhatsApp-level UI, reads Marathi/Hindi more fluently than English, motivated by tangible gifts and public recognition.

## Vocabulary (use these exact terms in code and UI)
| Term | Meaning |
| --- | --- |
| **Influencer** | The app's user. Never "customer" or "user" in UI copy. |
| **VCP** | Value Chain Partner — a distributor or dealer. Shown as "Distributor" / "Dealer" in UI. |
| **Manufacturer** | The brand whose material is sold (Welspun TMT, Dalmia Cement, DP Paints, Masterchow). |
| **Industry** | Top-level category: BCM (Building Construction Materials) or FMCG. |
| **Sub-industry** | TMT, ERW Pipes, Steel Angles, Paints, Cement, Food. |
| **Demand** | A quantity of a SKU an influencer says they need/influenced. |
| **Allocation** | A VCP assigning inventory against demand. Points post on allocation. |
| **Points** | Earned per unit allocated; multiplied for premium SKUs. |
| **Umang Utsav** | The programme's influencer recognition event. |
| **Lucky draw** | Gift mechanism; entries earned with points. |
| **Shilpkar** | Programme term for the influencer community (appears on Home banner). |

## The core loop
1. Influencer captures a **demand** (industry → sub-industry → manufacturer → SKU → quantity + UOM).
2. A **VCP allocates** inventory against it.
3. **Points post** on allocation, per the manufacturer's multiplier table.
4. Points drive **leaderboard rank** (per manufacturer) and **lucky-draw entries**.
5. **Gifts** are announced, placed in shop, gifted, redeemed. Top influencers get **Umang Utsav** invites.

## Modules in v1 (10 screens)
| # | Screen | Route id in prototype |
| --- | --- | --- |
| 1 | Login — mobile number | `login-phone` |
| 2 | Login — verify OTP | `login-otp` |
| 3 | Home | `home` |
| 4 | Profile | `profile` |
| 5 | Leaderboard | `leaderboard` |
| 6 | Capture Demand | `demand` |
| 7 | Demand Captured (success) | `demand-done` |
| 8 | My Demands | `demands` |
| 9 | Inventory Allocated | `allocation` |
| 10 | Rewards | `rewards` |

## Excluded from v1 — deliberate
- No account creation in-app. Influencers are onboarded by a VCP on the operations platform; the app only logs in an already-registered mobile number.
- No e-Pin, no password, no `+91` country-code selector (India-only).
- No notifications centre and no bell icon in the header.
- No global search, no chat/support inbox, no referral flow.
- No time/date filter on the leaderboard (it is always the live standing).
- No manufacturer switcher on Home — manufacturer context lives inside the module screens.
- Delete Account exists but is intentionally **not** surfaced directly; it sits behind an "Advanced" disclosure on Profile.

## Business rules encoded in the design
1. Leaderboard shows the **top 10 for one manufacturer at a time**; the logged-in influencer is pinned in a sticky footer card with the gap needed to enter the top 10.
2. Leaderboard has **no period filter**. Allocation and Rewards **do** (3 months / 6 months / 1 year).
3. A sub-industry may have **no onboarded manufacturer in the influencer's district**. The demand flow then replaces the manufacturer picker with an info banner plus a flat SKU-category list, and HUMBEE routes the demand.
4. Quantity is always captured with a **UOM** from a manufacturer-specific list, and points are computed on the base unit.
5. Gift statuses are exactly: **Announced → In Shop → Gifted → Redeemed**.
6. Demand statuses are exactly: **Submitted → Confirmed → Allocated → Closed**.
