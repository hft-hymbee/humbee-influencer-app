# Construction Site Address Capture — UI & Feature Design Spec

**Module:** Demand Capture → Construction Site Location
**App:** HUMBEE Influencer App (Android + iOS)
**Target path in repo:** `humbee-influencer-app/docs/construction-site-address-capture.md`
**Design source:** `HUMBEE Site Location Flow.dc.html` (8-screen flow board, 390×844 frames)
**Design system:** HUMBEE Design System — Lato, chestnut `#995A00` primary, 4pt grid, 8px default radius, borders as inset box-shadows, flat colour only (no gradients, no blur)
**Status:** Design approved for build · v1.0 · **BUILT** (Sep 2026)

> **Reconciliation note, added at build time.** §7's endpoint table is marked "proposal —
> reconcile with backend", and the reconciliation happened against
> `humbee_influencer_backend/V2/01-api-reference.md`. Three things in this document did not
> survive it, and `docs/11-feature-reference.md` §Demand Capture is the current statement:
>
> 1. **The wire carries IDS, not names.** §7's `pincode` / `district` / `state` strings are
>    `pincode_id` / `district_id` / `state_id` from `GET /address/reverse-geocode`. The server
>    derives the stored state and district from the pincode and REJECTS ids that contradict it,
>    so S6 renders those three read-only — which is what S6's own note already told the user.
> 2. **S5's search is BUILT, against two endpoints rather than the proposed one.** Not
>    `/geo/search`, but Google's own two-call model: `GET /address/search` returns candidates
>    carrying a `place_id` and nothing else — no coordinates, no ids — and
>    `GET /address/places/{place_id}` resolves the chosen one into the same shape a dropped pin
>    returns. A client `session_token` spans both so Google bills one session instead of N
>    requests. Three-character minimum, 300 ms debounce, map centre as a ranking bias.
>    **R7's saved sites are still not built** — there is no `/influencer/sites`, and the S6
>    "save this site" checkbox is omitted with it (`docs/06-inputs-needed.md` 15i).
> 3. **No `geocodeRaw`, no `accuracyM`, no `source`, no `capturedAt` on the wire.** The contract
>    stores none of them. They live on the draft, where they drive the S4 accuracy line, and
>    stop at the submit boundary.
>
> Three further changes were made on the built screens, at the client's direction (Sep 2026):
>
> 4. **S3's in-app rationale dialog is NOT built.** A modern Android system prompt already
>    carries the same three choices this dialog offered — While using the app / Only this time /
>    Don't allow — plus the Precise/Approximate picker, so showing ours first read as the same
>    question asked twice, with the powerless copy going first. "Use Current Location" now opens
>    the OS prompt directly. R4 is unchanged and still holds: the prompt fires only from that
>    explicit tap, never on screen entry.
> 5. **S2/S4's recentre FAB is NOT built.** It duplicated "Use Current Location", which is two
>    centimetres below it in the sheet and says what it does.
> 6. **The map provider is Google on Android and Apple Maps on iOS.** Forcing Google on iOS
>    needs the Google Maps iOS SDK and a second billed key for a picker that only parks a pin;
>    nothing in this flow reads a place name off the map itself — the address always comes from
>    `GET /address/reverse-geocode`.

---

## 1. Purpose

Demands raised by influencers (painters, bar benders, masons, carpenters) currently carry no delivery geography. This feature captures the **construction site** the material is meant for, as a map-pinned location plus a structured postal address, so that:

- distributors/VCPs know where to allocate and deliver;
- demand can be aggregated by district/pincode for territory planning;
- repeat demands for the same site take two taps.

**Captured fields:** Address line 1, Address line 2, Landmark, Pincode, District, State — all derived from the map pin by reverse geocoding, all correctable by the user.

---

## 2. Scope and rules

| # | Rule | Rationale |
| --- | --- | --- |
| R1 | **One site per demand cart**, not per product line. The site is a cart-level property. | The cart is already multi-product against one manufacturer; a site per line would multiply taps for no business gain. |
| R2 | Site address is **mandatory to submit** a demand. `Submit Demand` stays disabled until it exists. | Without geography the demand is not actionable downstream. |
| R3 | **The map pin is the source of truth.** Pincode, District and State are always reverse-geocoded from the pin; typing them is a *correction*, not the default path. | Prevents junk geography and guarantees a lat/lng for every demand. |
| R4 | The OS location permission prompt fires **only** on explicit tap of `Use Current Location` — never on screen entry. | Play/App Store policy, and a pre-prompt denial is unrecoverable for that install. |
| R5 | **Denied permission is never a dead end.** Manual pin + search completes the whole flow. | Site network coverage is poor; many devices have GPS off. |
| R6 | Changing products or manufacturer **keeps** the captured site. Clearing the cart clears it. | Site is about the destination, not the goods. |
| R7 | Confirmed sites can be **saved and reused** (named). | Repeat demand against the same site is the dominant case. |

Out of scope for v1: multiple sites per demand, site-wise delivery windows, site photos, geofenced attendance, site ownership/verification workflow.

---

## 3. Flow

```
Demand cart (site slot empty)
   │  tap "Add Site Address"
   ▼
Map picker  ──────────── tap search ──────────►  Search sheet
   │  tap "Use Current Location"                    │ pick saved site / result
   ▼                                                ▼
Permission rationale ──► OS prompt ──► granted ──► Map picker (pin at fix, draggable)
   │                                   denied
   ▼                                     │
Map picker + "location off" banner ◄─────┘
   │  tap "Confirm Location"
   ▼
Site Address form (prefilled, editable)  ──► "Save Site Address"
   ▼
Demand cart (site card attached, Submit enabled)
```

### Screen index

| # | Screen / state | Route | Design frame |
| --- | --- | --- | --- |
| S1 | Demand cart, site slot empty | `/demand/new` | Step 1 |
| S2 | Map picker, default (district centre, pin centred) | `/demand/new/site/map` | Step 2 |
| S3 | Permission rationale dialog + OS prompt | modal over S2 | Step 3 |
| S4 | Map picker, GPS fix acquired | `/demand/new/site/map` | Step 4 |
| S5 | Location search | `/demand/new/site/search` | Step 5 |
| S6 | Site Address form | `/demand/new/site/confirm` | Step 6 |
| S7 | Demand cart, site attached | `/demand/new` | Step 7 |
| S8 | Map picker, permission denied / GPS off | `/demand/new/site/map` | Step 8 |

---

## 4. Screen specifications

### S1 — Demand cart, site slot empty

Card inserted **below the cart lines, above `Submit Demand`**. Position is fixed so nothing shifts when it fills (S7).

- Container: `#FFFFFF`, radius 8, `box-shadow: inset 0 0 0 1px #995A00` (primary hairline marks it as the outstanding action; every other cart card uses `#E5E5E5`).
- Header row: 32px hexagon (`clip-path: polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)`), fill `rgba(153,90,0,0.1)`, 16px `HUMBEEIconsLocationPin` in `#995A00`; title **Construction Site** 15/22 700; sub "Where this material will be delivered. Required to submit." 13/20 `#666666`.
- Action: `Button type="outline" fullWidth`, height 40, label **Add Site Address**.
- `Submit Demand`: disabled style — `#F2F2F2` fill, `#999999` label (never opacity fading). Helper under it: "Add the construction site to submit", 11/20 `#666666`, centred.

### S2 — Map picker, default

Full-bleed map. **The pin is fixed to the screen centre; the map moves under it** (the standard delivery-app pattern — works one-handed and needs no precise touch on a small target).

| Element | Spec |
| --- | --- |
| Map | Edge to edge, behind the status bar. Initial camera: last used site → else district centroid from the influencer profile → else state centroid. Zoom 16 (≈ street level). |
| Search bar | Floating, top, 16px side inset, height 48, radius 8, `#FFFFFF`, `0 2px 6px rgba(0,0,0,0.15)`. Left: back arrow (24) — pops the flow. Centre: placeholder "Search area, colony or landmark" 15/22 `#999999`. Right: `HUMBEEIconsSearchOutlined` 24 `#995A00`. Whole bar tappable → S5. |
| Scrim | `linear-gradient(180deg, rgba(255,255,255,0.96) 62%, rgba(255,255,255,0))` behind the bar so it stays legible over dense map art. |
| Centre pin | 34px chestnut disc + 12×14 tail, `0 2px 6px rgba(0,0,0,0.3)`, 10×4 ground ellipse `rgba(0,0,0,0.28)`. Tooltip above: "Move map to place the pin", `#0D0D0D` fill, white 11/20 700, radius 4. Tooltip hides after the first camera move. |
| Recentre FAB | 48×48, radius 8, white, `0 4px 12px rgba(0,0,0,0.15)`, chestnut icon. Sits 16px from the right edge, 24px above the sheet. Pulses once on entry (`box-shadow` ring, 2000ms, respects `prefers-reduced-motion`). |
| Bottom sheet | Collapsed, radius `16px 16px 0 0`, `0 -2px 6px rgba(0,0,0,0.15)`, 36×4 grab handle. Content: overline **SELECTED LOCATION** 11/20 700 `#666666`; place name 16/24 700; full address 13/20 `#666666`; info strip `rgba(0,129,242,0.1)` + `HUMBEEIconsInfoOutlined` — "Pin the gate of the site, not the nearest main road."; `Use Current Location` (outline, 40); `Confirm Location` (filled large, 48). |
| Idle behaviour | On every camera idle: debounce 400ms → reverse geocode → update the sheet text. While in flight show the previous text at 40% plus a 2px indeterminate `ProgressLinear` under the handle. Never block the map. |

### S3 — Permission

Two steps, in this order.

1. **HUMBEE rationale dialog** (in-app, our design): 56px hexagon + location icon; title "Allow HUMBEE To Use Your Location ?" 20/32 600 centred (note the spaced question mark — HUMBEE typographic convention); body "We use it only to place the pin on your construction site. It is never tracked in the background." 13/20 `#666666`; three full-width 48px rows, divided by `#F2F2F2` hairlines — `While Using The App` / `Only This Time` (chestnut 16/24 700) and `Don't Allow` (`#666666`).
2. Tapping either allow row calls the **native permission API**; `Don't Allow` dismisses and returns to S8.

Rules: Android — request `ACCESS_FINE_LOCATION` (+ `ACCESS_COARSE_LOCATION`); handle `shouldShowRequestPermissionRationale` and the "don't ask again" path by routing the dialog's primary action to app settings. iOS — `NSLocationWhenInUseUsageDescription` string must match the rationale copy. Never request background/always permission.

### S4 — Map picker, GPS fix

- Camera animates to the fix, 200ms `cubic-bezier(0.4,0,0.2,1)`.
- Accuracy circle: `rgba(0,129,242,0.16)` fill, `inset 0 0 0 1px rgba(0,129,242,0.5)`, radius = reported accuracy in metres mapped to map scale.
- Camera recentres on the fix and the pin lands on it — the mark is nailed to the centre of the screen, so the map moving IS the pin moving.
- Pin grows to 40px and gains a white chip above it — `HUMBEEIconsMap` 16 + "Drag to adjust" — because after an automatic fix the user's job changes from *placing* to *checking*.
- Search bar now shows the resolved area name ("Jhotwara, Jaipur") 15/22 600 instead of the placeholder.
- Sheet expands: hexagon + address block (line 1 16/24 700, line 2 13/20 `#666666`).
- ~~**Derived chips** in a wrapping row (`Pincode 302012`, `District Jaipur`, `State Rajasthan`, `Tehsil Jhotwara`)~~ — **REMOVED from the sheet, client decision, 2026-09-21.** The sheet's job is to confirm *the place*, and the formatted address already says it. The derived geography is still shown, read-only, one screen later on S6 next to `Change On Map`, which is where a wrong pin is corrected anyway. `DerivedChip` is gone with them.
- Accuracy line: "Accurate to 8 m · GPS" 11/20 700 `#008000`. Above 100m use `#FFBF40` and the copy "Weak signal — check the pin".
- Primary: `Confirm Location` (filled, 48) → S6.

### S5 — Location search

Full-screen sheet, not an overlay — typing needs the keyboard and the whole list.

- Field: height 48, radius 8, focused style `inset 0 0 0 1px #995A00` + `0 0 0 4px rgba(153,90,0,0.1)` (the system 10%-tint 4px focus ring). Back arrow left, clear (`HUMBEEIconsClose`) right.
- Row 1, always: `Use Current Location` — chestnut icon + 15/22 700 title + "Fastest way to pin the site" 13/20 `#666666`. Triggers S3.
- Section **YOUR SAVED SITES** (overline 11/20 700 uppercase `#666666`): hexagon `rgba(255,165,37,0.2)` + `HUMBEEIconsBusinessOutlined`, site name 15/22 700, address 13/20 `#666666`. Saved sites rank above results — repeat demand is the common case.
- Section **RESULTS**: `HUMBEEIconsLocationMarker` 24 `#666666`, name 15/22 600, address 13/20 `#666666`, distance 11/20 `#666666` right-aligned.
- Rows are 1px `#F2F2F2` separated, min height 56 (≥44 hit target).
- Behaviour: debounce 300ms, min 3 characters, bias results to the influencer's district, cap at 8 results. Picking any row returns to S4 with the pin dropped there and **still draggable**. Empty results: "No match. Move the pin on the map instead." with a `Back To Map` text button.

### S6 — Site Address form

Standard app header (back arrow, title **Site Address**, subtitle "Check what we picked up from the map").

1. **Map thumbnail** — 120px tall, radius 8, `inset 0 0 0 1px #E5E5E5`, pin at centre, pill button bottom-right **Change On Map** (28px, white, chestnut 11/20 700) → back to S4 with state preserved.
2. **Guidance strip** — `rgba(255,191,64,0.25)`: "Fill in the house or plot number and a landmark — drivers need both."
3. **Fields** (HUMBEE `Input`, instructional labels per house style):

| Label | Placeholder | Source | Validation |
| --- | --- | --- | --- |
| Address Line 1 | Plot / house number, street | geocode `road`/`house_number`, usually needs typing | required, up to 120 chars (no minimum — "14" and "B2" are real plot numbers) |
| Address Line 2 | Area, colony | geocode `suburb`/`neighbourhood` | optional, ≤ 120 |
| Enter Landmark | Nearest school, temple, factory | nearest POI suggestion | required, up to 80 (no minimum) |
| Pincode | 302012 | geocode `postcode` | required, exactly 6 digits, numeric keypad, must resolve to the same state |
| District | District | geocode `state_district` | required |
| State | State | geocode `state` | required |

Pincode and District sit side by side (12px gap); the rest are full width.
4. Note under the fields: "Pincode, District and State came from the pin. Change the pin to change them." 11/20 `#666666`.
5. **Save this site for future demands** — `Checkbox`, default **on**, inside a hairline box. When on, ask nothing more: the site is named from Address line 1 and can be renamed later in My Profile → Saved Sites.
6. Primary: `Save Site Address` (filled, 48). Disabled until required fields pass. Errors show as `HelperText` under the offending field; the first error scrolls into view (use a scroll controller / `scrollTo`, not `scrollIntoView`).

### S7 — Demand cart, site attached

- One-time success strip at the top of the scroll area: `rgba(0,128,0,0.1)`, `HUMBEEIconsCheckCircle` `#008000`, "Site address saved". Dismisses on next navigation.
- **Site card** replaces the empty slot in place: 64px map thumbnail (radius 8, 18px pin) + overline **CONSTRUCTION SITE** + line 1 15/22 700 + one-line composed address 13/20 `#666666` (`line2, near landmark, district, state · pincode`) + **Change** action 13/20 700 chestnut → S6.
- `Submit Demand` now enabled (chestnut filled, 48).

### S8 — Permission denied / GPS off

- Map + search bar as S2, plus a white banner card under the bar: `HUMBEEIconsInfoOutlined` `#CC0000`, "Location access is off. Search for the area, or move the pin by hand.", and an **Open Settings** text action (Android: app settings intent; iOS: `UIApplication.openSettingsURLString`).
- Pin behaves exactly as S2 — the flow completes with a manual pin.
- Sheet shows the pin-derived address and `Confirm Location`, with the reassurance line "Every field can still be corrected on the next screen."
- The rationale dialog is **not** shown again automatically; only from an explicit `Use Current Location` tap.

---

## 5. Components to build

| Component | Notes |
| --- | --- |
| `SiteSlotCard` | Empty/filled states = S1 / S7. Single component, `site` nullable. |
| `MapPickerScreen` | Owns camera, centre pin, FAB, sheet, geocode debounce and all three map states (S2/S4/S8). |
| `CentrePin` | One SVG teardrop, tip anchored on the map centre. Widths 34 (idle) / 40 (fix), optional tooltip or drag chip. |
| `LocationSheet` | Collapsed/expanded, address block, accuracy line, actions. |
| `PermissionRationaleDialog` | Reusable for any future permission ask. |
| `LocationSearchScreen` | Field + current-location row + saved sites + results + empty state. |
| `SiteAddressForm` | Thumbnail, six inputs, save toggle, validation. |
| `SavedSitesList` | Profile-side management (rename, delete) — small follow-on screen. |

All use HUMBEE DS primitives (`Button`, `Input`, `Checkbox`, `Icon`, `HelperText`, `ProgressLinear`, `Divider`). Do not restyle raw controls; do not introduce a new icon set — the HUMBEE 102-glyph set covers `LocationPin`, `LocationMarker`, `Map`, `SearchOutlined`, `InfoOutlined`, `CheckCircle`, `Close`, `BusinessOutlined`.

---

## 6. Motion

| Transition | Spec |
| --- | --- |
| Cart → map picker | Full-screen push, 200ms `cubic-bezier(0.4,0,0.2,1)` |
| Camera to GPS fix | 200ms animated camera, no bounce |
| Sheet collapse ↔ expand | Height 200ms, same curve |
| Geocode in flight | Text to 40% opacity (120ms) + indeterminate `ProgressLinear` |
| Recentre FAB entry | One `box-shadow` pulse, 2000ms |
| Chips / success strip | 120ms fade in; nothing scales on press |

`prefers-reduced-motion` / OS "reduce motion": drop the pulse and fades, keep camera moves instantaneous.

---

## 7. Data model

```json
{
  "siteAddress": {
    "id": "site_9f2c",
    "label": "Plot 14, Road No. 3",
    "lat": 26.9421,
    "lng": 75.7461,
    "accuracyM": 8,
    "source": "gps",                 // gps | search | manual_pin
    "addressLine1": "Plot 14, Road No. 3",
    "addressLine2": "Jhotwara Industrial Area",
    "landmark": "Near Gopal Ji Temple",
    "pincode": "302012",
    "district": "Jaipur",
    "state": "Rajasthan",
    "saveForFuture": true,
    "geocodeRaw": { },               // provider response, stored for audit
    "capturedAt": "2026-09-18T09:41:12+05:30"
  }
}
```

The demand payload carries `siteAddress` at the **cart level**:

```json
{ "manufacturerId": "dalmia_bharat", "lines": [ { "skuId": "...", "qty": 40, "uom": "TON" } ], "siteAddress": { } }
```

### Endpoints (proposal — reconcile with backend)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/geo/reverse?lat=&lng=` | Pin → structured address. Returns the six fields + tehsil + formatted string. |
| `GET` | `/geo/search?q=&lat=&lng=` | Autocomplete, district-biased. |
| `GET` | `/influencer/sites` | Saved sites for the current user. |
| `POST` | `/influencer/sites` | Save a confirmed site; returns `id`. |
| `PATCH`/`DELETE` | `/influencer/sites/{id}` | Rename / remove. |
| `POST` | `/demands` | Existing endpoint, now requires `siteAddress`. |

Server-side validation: pincode ↔ district ↔ state must be consistent; lat/lng must fall inside India; reject a demand whose pin is > 150 km from the influencer's mapped district (soft warning, not a hard block, pending business confirmation).

Geocoding provider decision is open — Google Places/Geocoding gives the best Indian address granularity; MapMyIndia gives better pincode/tehsil fidelity and lower cost. **Whichever is chosen, wrap it behind `/geo/*` so the app never calls it directly** — that keeps the API key server-side and lets provider switch happen without an app release.

---

## 8. Edge cases

| Case | Behaviour |
| --- | --- |
| Reverse geocode fails / offline | Sheet shows "Could not read this location" + `Retry`; `Confirm Location` stays enabled — the pin's lat/lng is kept and the user types the address in S6. |
| Pincode not returned | Field is empty and focused first in S6, with helper "Needed for delivery". |
| GPS fix > 100m accuracy | Amber accuracy line + "Weak signal — check the pin". |
| User drags after a fix | `source` becomes `manual_pin`, accuracy circle hides, address refreshes. The camera settling at the END of our own animation is not a drag — `onRegionChangeComplete`'s `isGesture` is what tells them apart, or a 3e-5° tolerance where the platform omits it. |
| Location services off (device-level) | S8 banner copy: "Turn on device location, or move the pin by hand." |
| No network at all | Map shows cached tiles if available, else a `No internet` illustration with `Retry`; manual pin + typed address still submits, queued offline. |
| Back from S6 | Returns to S4 with pin and typed values preserved (state lives in the demand draft, not the screen). |
| Cart cleared / demand submitted | Site is cleared with the draft; saved sites persist. |
| Duplicate save | If a confirmed pin is within 50m of an existing saved site, reuse it instead of creating a second. |

---

## 9. Accessibility

- Every tap target ≥ 44×44 (list rows 56, buttons 40/48, FAB 48).
- Body text ≥ 13px; nothing below 11px and only for overlines/meta.
- Contrast: chestnut `#995A00` on white = 5.4:1; `#666666` on white = 5.7:1; white on chestnut = 5.4:1. No alpha-muted text over map art — copy sits on solid surfaces only.
- The centre-pin pattern needs an accessible alternative: expose `Confirm Location` and the address text to screen readers with a live region announcing each new reverse-geocode result ("Pin at Plot 14, Road No. 3, Jaipur").
- The map itself is marked decorative with a text summary; the sheet carries the address in text.
- All copy is Title Case for headings/buttons, sentence case for helper text — localisation-ready (Hindi first).

---

## 10. Analytics

| Event | Properties |
| --- | --- |
| `site_slot_tapped` | cart_id, product_count |
| `site_permission_prompted` | — |
| `site_permission_result` | result: while_using / once / denied |
| `site_location_source_used` | source: gps / search / manual_pin |
| `site_pin_dragged` | drag_distance_m |
| `site_geocode_failed` | reason, retry_count |
| `site_fields_edited` | fields: [addressLine1, pincode, …] — watch which derived fields users correct most; a high pincode-edit rate means the provider is wrong |
| `site_saved` | save_for_future, time_to_complete_s |
| `demand_submitted_with_site` | source, district |

---

## 11. QA checklist

- [ ] Submit disabled until a site exists; enabled immediately after save.
- [ ] Permission prompt never fires on screen entry.
- [ ] Deny → S8 → manual pin → full submit works.
- [ ] "Don't ask again" (Android) routes to app settings.
- [ ] Pin stays exactly centred across 390×844, 360×640 and 430×932; sheet never covers it.
- [ ] Sheet address updates on every camera idle, debounced, with no flicker.
- [ ] Search: 3-char minimum, district bias, saved sites first, pick → pin placed and draggable.
- [ ] S6 prefilled from the pin; editing a field does not re-trigger geocoding.
- [ ] Pincode accepts 6 digits only, numeric keypad, server cross-check on submit.
- [ ] Back from S6 preserves pin and typed values.
- [ ] Airplane mode: no crash, clear recovery, offline queue intact.
- [ ] Saved site reuse takes ≤ 2 taps from the empty slot.
- [ ] Reduce-motion honoured; TalkBack/VoiceOver pass on the map screen.

---

## 12. Build order

1. `/geo/reverse` + `/geo/search` behind the app BFF, provider chosen and keyed server-side.
2. `SiteSlotCard` + demand-draft state (site nullable, submit gating).
3. `MapPickerScreen` with centre pin, camera, debounce, sheet — manual pin path first (no permissions).
4. Permission rationale + OS request + S8 fallback.
5. `LocationSearchScreen` + saved sites API.
6. `SiteAddressForm` + validation + save.
7. Analytics, accessibility pass, offline queue.
8. Saved Sites management in My Profile (follow-on).

---

## 13. Open questions

1. Geocoding provider — Google vs MapMyIndia? Affects field fidelity (tehsil, pincode) and cost per demand.
2. Is a site allowed outside the influencer's mapped district? Hard block, soft warning, or free?
3. Should a saved site be shareable with the VCP/distributor, or stay private to the influencer?
4. Does the demand need a site *name* separate from Address line 1 (e.g. "Sharma Residency")?
5. Backend field names for the address block — this doc uses camelCase placeholders; confirm before wiring.
