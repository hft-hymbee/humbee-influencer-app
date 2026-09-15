# 09 — QA checklist

Every row is a state a developer must implement and a reviewer must see. Tick per platform.

## Global
- [ ] Lato loads (400/600/700); no fallback font flash on a cold start
- [ ] No colour outside the token file appears anywhere
- [ ] Every tap target ≥ 44×44
- [ ] Header shows the logomark, title, subtitle and the person icon — **no** notification bell, no hexagon on the person icon
- [ ] Header subtitle never repeats the selected manufacturer name
- [ ] Bottom nav: correct item active on all seven screens, Demand active for all three demand routes
- [ ] Horizontal scrollers hide their scrollbar and pad 16px at both ends
- [ ] `prefers-reduced-motion` honoured
- [ ] Skeleton (component C21) appears on entering every data screen, and on manufacturer / period change
- [ ] Skeleton keeps the header and bottom nav live and tappable
- [ ] Skeleton shapes match the real elements (card chrome real, hex marks hexagonal, pills pill-shaped)
- [ ] Status-filter changes do **not** trigger a skeleton
- [ ] No skeleton on login, OTP or Demand Captured
- [ ] Shimmer removed under `prefers-reduced-motion`
- [ ] Failure after a skeleton shows the retry card, not an empty state
- [ ] `aria-busy="true"` on the skeleton container; "Loading" announced once
- [ ] Offline banner + retry on every data screen
- [ ] Back button (Android hardware) behaves per screen; never returns to login after auth
- [ ] Numbers use `en-IN` grouping everywhere
- [ ] Long-name truncation: influencer names, VCP names, gift names, SKU labels

## Login
- [ ] Get OTP disabled until exactly 10 digits
- [ ] Non-digits stripped from the number field
- [ ] No "Need help?" line, no `+91` selector, no sign-up link
- [ ] OTP screen shows the **full unmasked** number
- [ ] OTP boxes auto-advance and backspace-retreat
- [ ] SMS autofill works (Android SMS Retriever / iOS one-time-code)
- [ ] Resend disabled during the 24s countdown, enabled after
- [ ] Wrong OTP: error rings, message, boxes cleared, focus reset
- [ ] Expired OTP message differs from wrong OTP
- [ ] "Change" returns to the number screen with the number retained
- [ ] Verify replaces the auth stack

## Home
- [ ] Carousel is full-bleed and auto-advances every 4s
- [ ] Dots: active 20px chestnut, inactive 6px `#D9D9D9`; tap jumps and resets the timer
- [ ] Quick links appear **above** My Rewards
- [ ] All four quick links navigate correctly
- [ ] My Rewards shows the 4 newest gifts across **all** manufacturers
- [ ] "View All" opens Rewards
- [ ] Empty rewards state

## Profile
- [ ] Reached only from the header person icon
- [ ] Initials = first letters of the first two words
- [ ] Number formatted `+91 98220 14576`
- [ ] No Trade row
- [ ] Delete Account hidden until "Advanced" is opened; closed again on every visit
- [ ] Delete requires a confirmation naming the consequence
- [ ] Log Out confirms, clears the session, returns to login

## Leaderboard
- [ ] Manufacturer tabs: active label black + 2px black rule; inactive grey, weight 400
- [ ] Switching manufacturer changes the unit column header and every value
- [ ] No period filter present
- [ ] Points explainer collapsed by default; expands with the right base line per manufacturer
- [ ] Podium order is 2 – 1 – 3 with rank 1 raised; medals gold / silver / bronze with the rank number legible on the medal
- [ ] Podium hidden when fewer than 3 ranked influencers
- [ ] Rows stagger in; bars fill left-to-right; bar width = points ÷ rank-1 points
- [ ] Points column is green; unit column shows value + unit
- [ ] Current-user card sticks to the bottom over a white fade, with a 1.5px chestnut ring
- [ ] Gap line reads correctly, including when the influencer is inside the top 10

## Capture Demand
- [ ] Module tabs switch between New Demand and My Demands
- [ ] Trail is sticky, shows Industry / Product / Quantity with live values and no step counter
- [ ] Trail step colours: done chestnut, active amber, pending neutral
- [ ] Industry cards: selected ring, veil and tick badge
- [ ] Sub-industry row scrolls; six BCM entries, one FMCG entry
- [ ] Manufacturer path: TMT, Paints, Cement, Food
- [ ] No-manufacturer path: ERW Pipes, Steel Angles → info banner + SKU category list
- [ ] Quantity card appears only after a manufacturer or category is chosen
- [ ] SKU select is searchable (manufacturer path only)
- [ ] Quantity accepts digits and one decimal point only
- [ ] UOM options change per manufacturer / category; first is preselected
- [ ] Summary line composes correctly
- [ ] Submit disabled until quantity **and** product are set
- [ ] All reset rules fire (see docs/06)
- [ ] Offline: demand queues locally with an idempotency key and syncs later

## Demand Captured
- [ ] No header, no bottom nav
- [ ] Success Lottie plays once, celebration loops, neither remounts on re-render
- [ ] "Capture Another Demand" clears the form and returns to a blank demand screen
- [ ] "View My Demands" opens My Demands

## My Demands
- [ ] Three stat tiles with correct counts and colours
- [ ] Five status chips with counts; filtering works
- [ ] Cards show mono hex, product, manufacturer · date, status badge, quantity, note, points
- [ ] Allocated points are `#006600`; Closed are grey
- [ ] Empty state per filter
- [ ] No period filter present

## Inventory Allocated
- [ ] Manufacturer tabs + PERIOD pills (26px, smaller than the tabs)
- [ ] Period changes both totals and the card list
- [ ] Totals expressed in the manufacturer's base unit, points in green
- [ ] Count line singular / plural
- [ ] Cards show VCP, type · place, quantity, date, SKU pills (wrapping) and +points
- [ ] Empty state for a period with no allocations

## Rewards
- [ ] Manufacturer tabs + PERIOD pills
- [ ] Umang Utsav banner renders full width at radius 8
- [ ] **No** lucky-draw progress card
- [ ] Five status chips with period-aware counts; correct tint per status
- [ ] Gift cards show the right ProductMark, kind · released date, status badge, VCP line
- [ ] Empty state per filter
