# 08 — v1 Screen Inventory

The agreed v1 surface: **the design handoff's 10 screens, plus the first-launch language chooser and
the notification surface**. Everything else in `00-PRD.md` §4 is Phase 2 — see §4 below.

Design source of record for screens 01–10 is
`design-spec/04-screens/`, with the live reference at
`design-spec/prototype/prototype-standalone.html`. **The `04-screens/` paths
in the table below are relative to that directory.** Endpoints are from
`../../humbee_influencer_backend/contracts/openapi.yaml`.

---

## 1. The 12 screens

| # | Screen | Route | Nav | Design source | Primary calls |
| --- | --- | --- | --- | --- | --- |
| 00 | **Language chooser** (first launch) | `/language` | none | **design pending** — PRD §4.0 | `GET /config` (language catalogue) |
| 01 | Login — mobile number | `/(auth)/login` | none | `04-screens/01-login-mobile.md` | `POST /auth/otp/request` |
| 02 | Verify OTP | `/(auth)/otp` | none | `04-screens/02-login-otp.md` | `POST /auth/otp/verify`, then `PUT /me/device` |
| 03 | Home | `/(tabs)/home` | yes | `04-screens/03-home.md` | `GET /home` |
| 04 | My Profile | `/profile` | yes | `04-screens/04-profile.md` | `GET /me`; `POST /auth/logout`; `DELETE /me` |
| 05 | Leaderboard | `/(tabs)/leaderboard` | yes | `04-screens/05-leaderboard.md` | `GET /leaderboard?manufacturerId=` |
| 06 | Capture Demand | `/(tabs)/demand` | yes | `04-screens/06-capture-demand.md` | `GET /catalog/industries`; `POST /demands` |
| 07 | Demand Captured | `/demand/done` | none | `04-screens/07-demand-captured.md` | none — renders the `POST /demands` response |
| 08 | My Demands | `/demands` | yes | `04-screens/08-my-demands.md` | `GET /demands/summary` + `GET /demands` |
| 09 | Inventory Allocated | `/(tabs)/allocation` | yes | `04-screens/09-inventory-allocated.md` | `GET /allocations/summary` + `GET /allocations` |
| 10 | Rewards | `/(tabs)/rewards` | yes | `04-screens/10-rewards.md` | `GET /rewards/summary` + `GET /rewards` |
| 11 | **Notification centre** | `/notifications` | yes | **design pending** — PRD §4.7 | **contract gap** — see §3 |

Canvas is **390 × 844**, fluid; nothing is pinned to 390. Screen background is white.

Bottom nav is present on screens 03–06 and 08–11, absent on 00, 01, 02 and 07. The **Demand** tab is
active for screens 06, 07 and 08.

Full navigation graph, state shape, reset rules and derived values:
`design-spec/06-state-and-navigation.md`. Do not re-derive them.

---

## 2. Screen 00 — Language chooser

In v1 because it cannot be retrofitted: PRD §4.0 requires the **login screen itself** to render in the
chosen language, so the choice cannot sit behind authentication.

| Requirement | Detail |
| --- | --- |
| Placement | Full screen, before login, on first launch only. No other action available |
| Labelling | Each language in **its own script first** (हिन्दी, ગુજરાતી, தமிழ்), Latin name secondary. Must be usable by someone who reads only one of the options — including the instruction above them |
| Catalogue | **Served by `GET /config`, configured by Ops.** Enabling a language must not require an app release. Cached locally, with a bundled fallback list so a first launch with no connectivity still works |
| Scale | A scrolling list, not a fixed set. Must survive **10+ languages** at 360 dp and 200% font scale |
| Ordering | Device locale → SIM/region → Hindi and English always visible without scrolling → Ops display order |
| Persistence | Stored device-locally immediately (no user exists yet); written to `Influencer.language` on successful login. **Most recent explicit user choice wins** on conflict |
| Reachable later | Profile → Language, same chooser, applies immediately without restart or loss of navigation state |
| Launch set | `en` + `hi` at launch; `mr` next. A language is only offered once **app UI coverage is complete** — partial translation is worse than not offering it |

**Fonts are the hidden cost.** Lato covers Latin only; every Indic script is a separate face at roughly
150–400 KB. Six scripts would consume a fifth of the APK budget. Decide bundled vs on-demand vs system
fonts **before the first release** — see `design-system/HUMBEE-DESIGN-RULES.md` §2 multi-script.

**Design status: pending.** This screen has no handoff spec. Build it from the design system primitives
and the rules above; get it reviewed against the handoff's visual language before it ships.

---

## 3. Screen 11 — Notifications

In v1 because the delivery triggers (PRD §7) are what bring this audience back into the app, and because
the token registration path (`PUT /me/device`) already exists in the contract.

| Element | Decision |
| --- | --- |
| Transport | FCM. Device token registered via `PUT /me/device`, fire-and-forget after OTP verify |
| Language | **Push, SMS and WhatsApp all follow `Influencer.language`.** A user who chose Hindi must not receive an English SMS. Every fallback raises an Ops alert (PRD §4.0) |
| In-app surface | A notification list at `/notifications`. **The handoff explicitly excludes a bell icon from the header** — reach it from Profile, or add a nav entry. Do not add header chrome the design does not have |
| Deep links | `humbee://leaderboard?mfr=welspun`, `humbee://demands`, `humbee://rewards?status=InShop` — already recommended by the handoff, and the reason a notification is worth tapping |
| Preferences | Per-category opt-out in Profile |

**Two open items, both tracked in `06-inputs-needed.md`:**

1. **Contract gap.** `contracts/openapi.yaml` has no notification list, read-receipt or preference
   endpoints. They need adding before this screen can be built against anything but fixtures.
2. **Design pending.** No handoff spec, and the handoff deliberately excluded the header bell. The
   placement above is a proposal, not an approved design.

---

## 4. Deferred to Phase 2 — and why

Deferred with the PRD section that specifies each, so nothing is lost:

| PRD | Feature | Why deferred |
| --- | --- | --- |
| §4.9 | Badges and gamification beyond the leaderboard | Leaderboard itself **is** in v1 (screen 05). Badges have no design |
| §4.10 | Learning & Knowledge Center | No design; content pipeline does not exist |
| §4.11 | Referral programme | Explicitly excluded by the handoff; no design |
| §4.12 | Support / helpdesk inbox | Explicitly excluded by the handoff. **Note the residual risk:** PRD §4.1 requires an unregistered number to be shown a support link, and §4.3's allocation-dispute flow has nowhere to land without this. A phone number or WhatsApp deep link is the v1 stopgap |
| §4.8.4–.6 | KYC documents, payout details, nominee capture | Handoff Profile is server-driven `rows`; these are additional row types plus a form each |
| §5 | Digital ID / QR loyalty card | No design |
| §4.3 | Allocation dispute flow | Needs §4.12 to exist first |
| §4.6 | Points ledger detail view and conversion table | Leaderboard's points explainer covers the v1 need |
| §4.5 | Umang Utsav event history and photo gallery | The Rewards screen's Umang Utsav banner covers v1 |

**Phase 1.1:** iOS parity, additional regional languages beyond `en`/`hi`/`mr`.

---

## 5. Reconciling the PRD with the handoff

Four places where the two documents disagree. These are resolved, not open — recorded here because
each was a genuine contradiction and a reader will otherwise hit it and stop.

| # | Conflict | Resolution |
| --- | --- | --- |
| 1 | **PRD §2 puts demand capture out of scope; the handoff makes it the core loop** and screens 06–08 of 10 | **The handoff wins.** Capture Demand is in v1. The PRD's exclusion was written against an earlier read/track-only framing; the designed, costed artefact supersedes it. `00-PRD.md` §2 is annotated accordingly |
| 2 | **PRD §4.9 makes the leaderboard opt-in and privacy-sensitive; the handoff makes it a core module** with names and volumes visible to peers | **The handoff wins on placement, the PRD wins on consent.** The screen ships as designed; the opt-out and its privacy copy are required before launch, not after. Tracked as a blocking input |
| 3 | **PRD §3.1 makes role-per-industry the product's most important rule; no handoff screen displays a role at all** | **Genuine gap, and the PRD wins.** The rule is correct and the designed screens do not honour it. See §6 |
| 4 | **PRD §4.1 requires a support link for unregistered numbers; the handoff excludes support entirely** | Stopgap: a `tel:` or WhatsApp deep link on the login error, no inbox. Full flow is Phase 2 |

---

## 6. The role-per-industry gap

`CLAUDE.md` rule 3 and PRD §3.1 state that an Influencer's role is **per-industry, never global** — the
same person is a Barbender in Steel and a Contractor in Cement, simultaneously — and that any UI showing
an allocation or activity must show the role inline for *that entry's* industry.

**None of the 10 designed screens shows a role.** The handoff's data model has `Influencer.trade` as a
single scalar field, and its Profile spec explicitly notes "no `trade` field" in the rendered rows.

This is not a design oversight to paper over in code, and it is not something to invent UI for either.
It needs a product decision, and it is the highest-priority item in `06-inputs-needed.md`:

- **If the rule holds**, the Inventory Allocated card, the My Demands card and the Profile rows each
  need a role slot, `RoleIndustryTag` needs adding to the component inventory, and the backend needs
  `InfluencerIndustryRole` resolved at query time and carried on the allocation and demand payloads.
  That is a design change plus a contract change, and it should be scoped now rather than discovered
  in Phase 3.
- **If the rule has been dropped**, say so explicitly and remove it from `CLAUDE.md`, the PRD and the
  design-system component list. Leaving a stated non-negotiable that no screen honours guarantees that
  someone will eventually implement it inconsistently.

Until it is resolved, **build the designed screens as designed.** Do not add a role tag on your own
initiative — an invented role label is worse than an absent one, because it looks authoritative.

---

## 7. Per-screen definition of done

A screen is done when all of the following hold. This is the checklist to review against, not a summary.

- [ ] Matches its spec in `04-screens/` and the live prototype at 390 × 844.
- [ ] Every state for that screen in
      `design-spec/09-qa-checklist.md` is implemented — loading
      skeleton, empty, error, offline.
- [ ] Wired to the `data/*.json` fixture first, then to the API. Fixtures match the response shapes, so
      the swap is one line per screen.
- [ ] **No hardcoded colour, size, radius, shadow or string** outside the tokens module and the copy
      catalogue.
- [ ] All numbers formatted with `Intl.NumberFormat('en-IN')`; every server-computed value taken from
      the server, never recomputed (`07-screen-to-endpoint-map.md` "Screen state → server ownership").
- [ ] `en` + `hi` strings complete; layout survives Devanagari and 200% font scale without clipping.
- [ ] Tap targets ≥ 48 dp (see `02-design-system.md` §Precedence — the stricter floor wins).
- [ ] Lists use FlashList, never `ScrollView` + `.map()`.
- [ ] Analytics events fired per the taxonomy; Capture Demand steps instrumented as a funnel.
- [ ] Verified on the reference 2–3 GB Android device inside the `01-architecture.md` performance budget.
- [ ] `/code-review` and `/security-review` clean.
