# 06 — Open Decisions & Inputs Needed

Ordered by what blocks what. Nothing here is a nice-to-have: each item, if missing, either stops a build
or causes rework.

**Recently closed** — recorded so they are not re-litigated:

| Question | Decision |
| --- | --- |
| Separate Influencer app or unified role-based app (PRD §13 Q3) | **Separate app.** ADR-001/002 |
| Which scope is v1 — the PRD's 16 features or the handoff's 10 screens | **The handoff's 10, plus the language chooser and notifications.** `08-screen-inventory.md` |
| Which repo owns client code and docs | **This one, frontend only.** The server lives in `hymbee-backend`, its spec in `humbee_influencer_backend/` |
| Framework | **React Native + TypeScript.** `07-framework-comparison.md` |
| Which API contract the app is built against | **`humbee_influencer_backend/V2/`** — captured from the running server. The app was migrated to it: snake_case throughout, offset paging, demand-capture endpoints, platform-owned account deletion |

---

## 1. Blocking — Phase 0 cannot finish without these

| # | Item | Why it blocks |
| --- | --- | --- |
| 1 | **Does the role-per-industry rule still hold?** PRD §3.1 and `CLAUDE.md` rule 3 call it the product's most important rule. **No designed screen shows a role at all**, and the handoff's model has a single scalar `trade` | Either a design change plus a contract change (role on allocation and demand payloads, a `RoleIndustryTag` component, role slots on three screens), or a deletion from the PRD, `CLAUDE.md` and the component list. A stated non-negotiable that no screen honours **will** eventually be implemented inconsistently. `08-screen-inventory.md` §6 |
| 2 | **What does "geofencing" mean here?** Registering OS geofences that wake a killed app, or a location check when the influencer taps Submit? | It is the strongest single argument for React Native over a Capacitor build, and it appears in **no** specification document. Background geofencing is a veto against web; a foreground check is a tie. `07-framework-comparison.md` §6.2 |
| 3 | **Can OTA be made to work on the RN CLI?** `expo-updates` in the bare project, or self-hosted CodePush | If not, the framework score drops to 223 and loses to Expo CNG and to both web options. Phase 0 item 0.1 — do not discover this in month six |
| 4 | **Which packaging model per tenant — one shared app, runtime-themed, or a white-label build?** (`09-saas-and-module-architecture.md` §9) | A white-label build is a store listing, review cycle, signing key, Maps key, Firebase project and release lane **per tenant, forever**. Four tenants × two platforms is eight artifacts per release. Decides whether the CI release lane must be automated before tenant #2 |
| 4b | **Which modules will actually be sold separately, and in what bundles?** | Drives the §8 per-tenant CI test matrix, and whether Home needs a designed one-module layout rather than a sparse four-link row (§6) |
| 4c | **Is the RN CLI decision held for team continuity, or because native integrations were thought hard on Expo?** | If the latter, it is worth re-opening: CNG has no native ceiling (`01-architecture.md` ADR-001), and Expo CNG scores 12 points higher |
| 5 | **Staging API base URL + a reachable `/openapi.json`** | Types are generated from it and CI fails on drift. V2 is itself generated from the running backend, so a checked-in YAML is no longer the source — the app needs the live endpoint |
| 6 | **Bundle ID / package name** (e.g. `in.humbee.influencer`) | Firebase, signing, store setup, and per-tenant `applicationId`s if (4) is yes |
| 7 | **Firebase project** for this app — `google-services.json` + `GoogleService-Info.plist` | Push notifications and screen 11 |
| 8 | **Reference test device** — a real 2–3 GB RAM entry-level Android, OEM skin intact | The performance budget and the §11 spike are both untestable on a simulator or a flagship |
| 9 | **Font strategy for Indic scripts** — bundled, on-demand, or system | Each script is 150–400 KB; six would consume a fifth of the 30 MB APK budget. Decide before the budget is spent |
| 10 | **Analytics provider** — Firebase, PostHog, CleverTap or MoEngage | The event taxonomy must exist before instrumentation. Retrofitting one is painful and, at 5 lakh users, expensive |

---

## 2. Contract gaps to raise with the backend team

Not client work-arounds — contract additions. Each one currently has no endpoint.

| # | Gap | Needed for |
| --- | --- | --- |
| 11 | **Notification list, read-receipt and preference endpoints** | Screen 11. Buildable on fixtures only until these exist |
| 12 | **The language catalogue shape on `GET /config`** — BCP-47 tag, native-script name, Latin name, script, enabled flag, display order, per-channel readiness | Screen 00. The catalogue must be Ops-configurable **without an app release** |
| 13 | **Per-industry role on allocation and demand payloads** | Only if item 1 resolves in favour of the rule |
| 14 | **Tenant scoping and entitlements in the token or `/config`** | ADR-007. The platform already scopes tokens by audience, so this is an extension of an existing mechanism |
| 15a | ~~OTP shape is no longer served~~ — **withdrawn, the V2 doc is wrong.** The running server DOES return `mobile_display`, `otp_length`, `resend_after_seconds`, `expires_in_seconds` and `attempts_remaining`; only `request_id` went away. The app reads them from the response again | Verified against the backend. **`V2/01-api-reference.md` §1 needs correcting** — it says this endpoint returns nothing |
| 15a2 | **The auth endpoints take RSA-ENCRYPTED fields and the V2 doc does not mention it.** `mobile_number` and `otp` are decrypted inside DTO validation (RSA-OAEP/SHA-256, base64). Plain digits — exactly what the doc shows — fail with a generic *"Something went wrong. Please try again later."* naming neither field nor cause | **The single highest-value correction to make to the V2 docs.** Any client following them cannot log in, and the error gives no hint why. Implemented in `src/api/crypto.ts` |
| 15b | **No device-token endpoint.** `PUT /me/device` does not exist in V2 | Screen 11 and all push delivery. Nothing can register an FCM token today |
| 15c | **`industries[].image_url` was dropped** from `GET /demand-capture/industries`; V1 carried it | Screen 06 is illustration-led. Rather than hardcode a code→asset map, the industry card is now illustrated with the **manufacturer logos the payload does carry** (`logo_url`), so a new industry renders with no app release. Restoring `image_url` would still be better — a logo is not an illustration |
| 15d | **No token-refresh endpoint.** The bearer token from verify is the whole session | A 401 now signs the user out outright. Observed TTL on the dev token is ~15 days, which is workable — but it is set server-side and nothing tells the app, so **confirm it is deliberate** |
| 15e | **`ESI_UNKNOWN` / `ESI_MISMATCH` both render as "Session expired. Please log in again."** | Deliberate (a caller probing ids must learn nothing), but it is misleading in the common case and unactionable for the user, who has no way to fix a mapping. A distinct user-facing string for "this manufacturer is not linked to you" would not leak anything |
| 15f | **`can-delete-account` can refuse with VCP copy** naming a *"Firms"* section this app does not have | Screen 04. Remapped client-side today (`deletionRefusalCopy()`), which is a string-matching workaround and will break when the copy changes |
| 15g | **`GET /home` has no all-time rewards count.** `stats.rewards_allotted` is scoped to `stats.financial_year` (it sits in the same block as `allocations_this_year` / `points_this_year`), but the Home tile it feeds is specified as *"Rewards allotted · all manufacturers"* — an all-time count matching the My Rewards list directly beneath it. A live account returns `rewards_allotted: 0` alongside a gift released **11 Feb 2026** (FY 2025-26), so the screen shows a 0 above a reward | Screen 03. The tile now reads **"Rewards allotted · FY {financial_year}"**, which is honest about the window the server counts. If the design's all-time reading is the intended one, the fix is an all-time field on `/home` — the client cannot recount it (`recent_rewards` is only the 4 most recent, and `/rewards` is manufacturer- and period-scoped) |
| 15 | **A points-decrease notification** when Ops corrects an allocation that already posted points | The ledger is append-only, so corrections are compensating entries — meaning a balance can go **down**. The user-facing story is undesigned, and an unexplained drop is the fastest way to lose this audience's trust |

---

## 3. Needed before Phase 1 ships

| # | Item |
| --- | --- |
| 16 | Apple Developer + Google Play Console access; signing keys and credentials |
| 17 | OTP provider decision, plus its rate limits and resend policy. The design shows a 24-second timer, which is now a **client constant** because V2 stopped sending one — see gap 15a |
| 18 | SMS gateway + WhatsApp Business API credentials (PRD §12 says these are reused from existing apps — confirm) |
| 19 | Sentry project and DSN for this app |
| 20 | **Lato licence confirmation for app embedding**, plus licences for each Indic companion face |
| 21 | App icon, splash, store screenshots, store listing copy (en + hi) |
| 22 | Privacy Policy + Terms URLs, DPDP-reviewed, **publicly reachable without login** |
| 23 | **Professional Hindi translation**, trade-vocabulary-aware. Machine translation will not survive contact with a Barbender |
| 24 | Seed/test data on staging — including a **multi-manufacturer** influencer (the tab bar and the esi-pairing are untestable without one), an influencer with **zero** allocations, and one mapped to **no** manufacturer (which drives the empty state on four screens) |
| 25 | Beta cohort — a friendly distributor willing to put 20–30 influencers on the app |
| 26 | The real **Cement** sub-industry illustration (currently a flat vector placeholder) |
| 27 | Whether the **Umang Utsav banner** needs dynamic venue/date/invitee count — if so it must be rebuilt as composed markup rather than a supplied bitmap |
| 28 | Designs for the two design-pending screens: 00 language chooser, 11 notifications |

---

## 4. Product decisions still open

| # | Question | Why it matters |
| --- | --- | --- |
| 29 | **Is 13px body text acceptable for this audience?** The handoff's ramp is built on 13/20; the design system's accessibility floor is 16 | Raising it reflows all ten screens; shipping it accepts a legibility risk for the users least able to absorb it. Put it in front of the beta cohort at default **and** 150% font scale. `02-design-system.md` §3 |
| 30 | **Leaderboard opt-out and its privacy copy.** PRD §4.9 requires opt-in; the handoff ships it as a core module showing peers' names and volumes | DPDP implications, and a launch blocker rather than a Phase 2 item |
| 31 | **Lucky-draw winner-list consent wording** | Same DPDP exposure as (30) |
| 32 | **Who records influencer allocations today?** PRD §12 assumes the VCP app will be extended | **The single largest delivery risk in the programme.** Points post only on allocation, so if VCPs do not record them this app launches showing empty screens and the trust story inverts. It is a dependency on a different team's roadmap |
| 33 | **Points expiry policy** — the exact rule, and grandfathering for early users | PRD §4.6 says "e.g. 12 months"; "e.g." is not shippable |
| 34 | Minimum KYC before cash rewards, and TDS thresholds (PRD §13 Q1) | May add a KYC module to v1 |
| 35 | Reward fulfilment — in-app or third-party with webhooks (PRD §13 Q2) | Changes the rewards data model |
| 36 | Does an influencer see allocations from a partner they have since unlinked? | Not covered anywhere; affects link `status` semantics |
| 37 | Latin or Devanagari numerals in Hindi | Trade users generally read `500 kg` faster than `५०० kg`. Confirm with real users rather than assuming |
| 38 | **Support stopgap for v1.** PRD §4.1 requires a support link for unregistered numbers, and §4.3's dispute flow has nowhere to land, but the handoff excludes support entirely | A `tel:` or WhatsApp deep link is the proposal. Also: what is the **dispute SLA**? Without one, the dispute flow damages trust rather than building it |
| 38b | **Should the manufacturer tab bar render when there is only one manufacturer?** ~99.99% of influencers are mapped to exactly one, and `GET /me` confirms it | **Decided for now: always render it**, so every screen matches the design PNGs. Worth revisiting with the beta cohort — a one-item tab strip is a row of chrome that never does anything |
| 38c | **Multi-product demand capture has no design.** V2 accepts a list of products per submission and the app now exposes it ("Add Another Product" + a removable line list), built from design-system primitives | Screen 06's spec describes a single-product capture. Needs a design review before launch — particularly the cart's placement and what the success screen (07) should say when several products were captured at once |
| 38d | **Demands no longer have a status or points**, so screen 08 lost its status chips, its three stat tiles and its points line | The screen is now a plain list. The designed version cannot come back until VCP-side fulfilment events exist to drive `Submitted → Confirmed → Allocated → Closed`. Confirm the interim screen is acceptable |
| 39 | **Empty-state strategy for a brand-new influencer** with zero allocations, who sees an entirely empty app | For a low-trust persona this first impression matters more than any other screen, and it is currently undesigned |
