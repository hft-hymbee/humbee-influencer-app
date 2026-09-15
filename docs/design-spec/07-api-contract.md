# 07 — API contract (proposal)

**Status: proposal.** These shapes are derived from the design, not from the HUMBEE operations platform. Reconcile field names with the backend team before implementing; the fixtures in `data/` match these shapes exactly, so the client can be built against them today and repointed later.

Conventions: JSON, camelCase, ISO-8601 dates (`2026-08-14`), all money/points as integers, all quantities as `{value, uom}` plus a normalised value.

---

## Auth

### `POST /auth/otp/request`
```json
{ "mobile": "9822014576" }
```
```json
{ "requestId": "otp_7f3a…", "resendAfterSeconds": 24, "otpLength": 4 }
```
Errors: `404 NOT_REGISTERED`, `429 RATE_LIMITED`.

### `POST /auth/otp/verify`
```json
{ "requestId": "otp_7f3a…", "mobile": "9822014576", "otp": "4821" }
```
```json
{
  "accessToken": "…", "refreshToken": "…", "expiresIn": 3600,
  "influencer": {
    "id": "inf_1042", "name": "Sunil Jadhav", "mobile": "9822014576",
    "district": "Nashik", "trade": "Bar Bender"
  }
}
```
Errors: `400 OTP_INVALID`, `410 OTP_EXPIRED`.

### `POST /auth/logout` · `DELETE /influencer/me`
Logout revokes the refresh token. Delete is a soft-delete with a retention window; require a fresh OTP.

---

## Reference data

### `GET /catalog/industries`
Drives the demand picker. `manufacturers` is resolved **for the caller's district**.
```json
[
  {
    "id": "bcm", "code": "BCM", "name": "Building Construction Materials",
    "imageUrl": "…/bcm.png",
    "subIndustries": [
      {
        "id": "tmt", "label": "TMT", "imageUrl": "…/tmt.png",
        "manufacturers": [
          { "id": "welspun", "name": "Welspun TMT", "mono": "WT",
            "uoms": ["Ton", "Kg"], "baseUnit": "Ton",
            "skus": [ { "id": "sku_1", "label": "Fe 500D 8mm" } ] }
        ],
        "skuCategories": []
      },
      {
        "id": "angles", "label": "Steel Angles", "imageUrl": "…/angles.png",
        "manufacturers": [],
        "uoms": ["Kg", "Nos"],
        "skuCategories": [ { "id": "cat_1", "label": "MS Angle 25x25x3" } ]
      }
    ]
  }
]
```
An empty `manufacturers` array is what triggers the no-manufacturer branch in the UI. The server decides this — the client must not infer it from a hardcoded map.

### `GET /manufacturers`
The tab bar source, ordered.
```json
[ { "id": "welspun", "name": "Welspun TMT", "shortName": "Welspun TMT",
    "mono": "WT", "baseUnit": "Ton" } ]
```

---

## Leaderboard

### `GET /leaderboard?manufacturerId=welspun`
```json
{
  "manufacturer": { "id": "welspun", "name": "Welspun TMT", "baseUnit": "Ton" },
  "scope": "district", "district": "Nashik",
  "pointsRule": {
    "base": "1 Kg = 1 point",
    "tiers": [
      { "label": "Fe 500D — all diameters", "value": "1 pt / Kg", "premium": false },
      { "label": "Fe 550D CRS (premium)",   "value": "2 pts / Kg", "premium": true }
    ]
  },
  "top": [
    { "rank": 1, "influencerId": "inf_88", "name": "Ramesh Pawar",
      "points": 54200, "volume": 135.5, "unit": "Ton" }
  ],
  "me": { "rank": 14, "name": "Sunil Jadhav", "points": 21400,
          "volume": 53.5, "unit": "Ton",
          "inTop10": false, "gapToTop10": { "points": 3200, "volume": 8.0 } }
}
```
No period parameter — the leaderboard is the live standing.

---

## Demands

### `POST /demands`
```json
{
  "industryId": "bcm", "subIndustryId": "tmt",
  "manufacturerId": "welspun",          // null on the no-manufacturer path
  "skuId": "sku_4",                     // null on the no-manufacturer path
  "skuCategoryId": null,                // set on the no-manufacturer path
  "quantity": { "value": 4, "uom": "Ton" },
  "clientRef": "uuid-for-idempotency"
}
```
```json
{ "id": "dem_9931", "status": "Submitted",
  "expectedPoints": 4000, "createdAt": "2026-08-14T09:22:11Z" }
```
`clientRef` makes the call idempotent — required for the offline queue.

### `GET /demands?status=&page=`
```json
{
  "summary": { "raised": 6, "allocated": 2, "awaiting": 2 },
  "counts": { "All": 6, "Submitted": 1, "Confirmed": 1, "Allocated": 2, "Closed": 2 },
  "items": [
    { "id": "dem_9931", "manufacturer": { "id": "welspun", "name": "Welspun TMT", "mono": "WT" },
      "product": "Fe 550D 16mm", "quantity": { "value": 4, "uom": "Ton" },
      "date": "2026-08-14", "status": "Allocated",
      "points": 4000, "pointsLabel": "+4,000 pts",
      "note": "Mahalaxmi Steel Traders" }
  ]
}
```
All manufacturers in one list — this screen is not manufacturer-scoped.

---

## Allocations

### `GET /allocations?manufacturerId=welspun&period=3m`
`period` ∈ `3m | 6m | 1y`.
```json
{
  "totals": { "quantity": { "value": 14.0, "uom": "Ton" }, "points": 1404 },
  "count": 3,
  "items": [
    { "id": "alc_51",
      "vcp": { "name": "Mahalaxmi Steel Traders", "type": "Distributor", "place": "Satpur" },
      "quantity": { "value": 8.4, "uom": "Ton" },
      "date": "2026-08-12",
      "skus": ["Fe 500D 12mm", "Fe 550D 16mm"],
      "points": 840 }
  ]
}
```
The server returns `totals` already normalised into the manufacturer's base unit. The client must not convert UOMs.

---

## Rewards

### `GET /rewards?manufacturerId=welspun&period=3m`
```json
{
  "utsav": { "eligible": true, "city": "Ahmedabad", "venue": "Gandhi Dham",
             "date": "2026-06-24", "invitedCount": 56,
             "bannerImageUrl": "…/umang-utsav-banner.png" },
  "counts": { "All": 5, "Announced": 1, "In Shop": 1, "Gifted": 1, "Redeemed": 2 },
  "items": [
    { "id": "gft_12", "gift": "Washing Machine", "kind": "Lucky draw",
      "status": "In Shop", "mark": "SHOP",
      "releasedOn": "2026-08-10",
      "vcp": { "name": "Mahalaxmi Steel Traders" } }
  ]
}
```
`mark` maps to a ProductMark name: `UmangUtsav | SHOP | Approved | TRIP`. Prefer sending a semantic value the client maps, rather than an asset name.

### `GET /home`
One call to fill the Home screen — banners, stats and the four latest rewards across all manufacturers.
```json
{
  "influencer": { "name": "Sunil Jadhav" },
  "banners": [ { "imageUrl": "…/banner-1.png", "alt": "Hoga Yogdaan Ka Samaan", "deeplink": null } ],
  "stats": { "rewardsAllotted": 11, "pointsThisYear": 21400 },
  "recentRewards": [
    { "gift": "Washing Machine", "manufacturerName": "Welspun TMT",
      "date": "2026-08-10", "status": "In Shop", "mark": "SHOP" }
  ]
}
```

---

## Cross-cutting
- **Auth**: `Authorization: Bearer <accessToken>`; refresh on 401 once, then force re-login.
- **Errors**: `{ "error": { "code": "OTP_INVALID", "message": "…", "field": "otp" } }`. Show `message` when the server sends one — do not invent client copy for server failures.
- **Localisation**: send an `Accept-Language` header; server returns display strings (`pointsLabel`, `kind`, status labels) already localised, or the client maps enum values through its own catalogue. Pick one and be consistent.
- **Pagination**: demands, allocations and rewards should page (`page`, `pageSize`, `hasMore`) — an active influencer accumulates hundreds of rows a year.
