# 06 — State and navigation

## Navigation graph
```
login-phone ──Get OTP──▶ login-otp ──Verify──▶ home
     ▲                        │
     └────Change / Back───────┘

home ─┬─▶ leaderboard
      ├─▶ demand ──Submit──▶ demand-done ─┬─▶ demand (reset)
      │      ▲                            └─▶ demands
      │      └── tab ──▶ demands
      ├─▶ allocation
      ├─▶ rewards
      └─▶ profile (header person icon)

profile ──Log Out──▶ login-phone   (clears session)
```

Bottom nav is present on: `home`, `profile`, `leaderboard`, `demand`, `demands`, `allocation`, `rewards`.
Bottom nav is absent on: `login-phone`, `login-otp`, `demand-done`.
The **Demand** nav tab is active for `demand`, `demands` and `demand-done`.

## State shape (prototype, as a reference for your view models)
```js
{
  screen: 'login-phone',      // route
  phone: '',                  // 10 digits, no country code
  otp: ['', '', '', ''],      // one digit per box

  mfr: 'welspun',             // selected manufacturer — leaderboard / allocation / rewards
  period: '3m',               // '3m' | '6m' | '1y' — allocation / rewards
  giftFilter: 'All',          // rewards status filter
  demandFilter: 'All',        // my-demands status filter
  pointsOpen: false,          // leaderboard points explainer
  banner: 0,                  // home carousel index
  advancedOpen: false,        // profile advanced disclosure
  loading: false,             // screen-level data fetch in flight → show the skeleton

  // demand capture
  industry: '',               // 'bcm' | 'fmcg'
  sub: '',                    // 'tmt' | 'erw' | 'angles' | 'painthw' | 'cement' | 'food'
  dmfr: '',                   // chosen manufacturer id (branch a)
  cat: '',                    // chosen SKU category (branch b)
  sku: '',                    // chosen SKU (branch a)
  qty: '',                    // numeric string
  uom: ''                     // '' means "first UOM in the list"
}
```

## Derived values (compute, never store)
- `hasMfr` = a sub-industry is chosen **and** at least one manufacturer maps to it
- `noMfr` = a sub-industry is chosen **and** none maps to it
- `showQty` = `(hasMfr && dmfr) || (noMfr && cat)`
- `demandInvalid` = no quantity, or (branch a: no SKU / branch b: no category)
- `uomList` = chosen manufacturer's UOMs → else the sub-industry's category UOMs → else `['Units']`
- `activeNav` = `screen.startsWith('demand') ? 'demand' : screen`

## Loading state
`loading` is set true when the influencer enters a data screen, switches manufacturer, or switches period, and false when the data lands. While it is true the screen's own content is not rendered at all — the skeleton (component C21) takes its place inside the scroll body, with the header and bottom nav still live and tappable.

In a real client this flag is per-query, not global: use your data layer's `isLoading`/`isPending` per screen (one query key per manufacturer + period), so a cached manufacturer switches instantly and only uncached data shows a skeleton. Filter changes must never set it — filtering happens on data already in memory.

## Reset rules
| Action | Clears |
| --- | --- |
| Choose industry | sub, dmfr, cat, sku, qty, uom |
| Choose sub-industry | dmfr, cat, sku, qty, uom |
| Choose manufacturer | sku, uom |
| Choose SKU category | uom |
| Switch manufacturer tab | giftFilter → 'All'; loading → true |
| Switch period | loading → true |
| Log out | screen → login-phone, phone → '', otp → empty |
| "Capture Another Demand" | industry, sub, dmfr, cat, sku, qty, uom |

## Session and persistence
- Auth token in secure storage (Keychain / EncryptedSharedPreferences). Never in plain local storage.
- Persist the last selected `mfr` and `period` across launches — field users work with one manufacturer for weeks.
- Do **not** persist demand-in-progress selections beyond the session unless the offline queue is implemented.
- On cold start with a valid token, land on Home without showing login.

## Deep links (recommended)
`humbee://leaderboard?mfr=welspun`, `humbee://demands`, `humbee://rewards?status=InShop` — useful for the SMS/WhatsApp notifications the programme sends.
