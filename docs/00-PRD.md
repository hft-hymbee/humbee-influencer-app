# Humbee Influencer App — PRD (markdown transcription)

> Transcribed from `Humbee_Influencer_App_PRD_without_registration.docx` (v1.0 Draft, 30 Jul 2026).
> The .docx remains the sign-off artifact; this file is the machine-readable working copy.
> If the two diverge, reconcile explicitly — do not silently prefer one.

| Field | Detail |
| --- | --- |
| Product | Humbee Influencer App (companion to the Humbee B2B platform) |
| Parent Entity | Twenty Point Nine Five Ventures Pvt. Ltd. (20p95) |
| Website | https://humbee.in/ |
| Version | v1.0 (Draft) |
| Date | 30 July 2026 |
| Status | Draft — for review |

Tagline: *Empowering Shilpkars, Masons, Contractors, Engineers, Barbenders and Painters — the real influencers of the value chain.*

---

> ## ⚠️ Read this before treating any section below as v1 scope
>
> **This document is broader than v1.** It is the transcribed product requirement, and it was written
> before the design handoff existed. **`08-screen-inventory.md` defines what is actually being built**:
> the design handoff's 10 screens, plus the first-launch language chooser (§4.0) and the notification
> surface (§4.7) — 12 screens in total. Everything else in §4 and §5 below is Phase 2 backlog, listed
> with its deferral reason in `08-screen-inventory.md` §4.
>
> **Four sections below are contradicted by the approved design, and the design wins:**
>
> | This PRD says | The design says | Resolution |
> | --- | --- | --- |
> | §2 — demand capture is **out of scope** | Capture Demand is the **core loop**, screens 06–08 of 10 | **In v1.** §2 is annotated below |
> | §4.9 — the leaderboard is **opt-in** and privacy-sensitive | A core module showing peers' names and volumes | **Ships as designed**; the opt-out and privacy copy are launch-blocking, not Phase 2 |
> | §3.1 — role-per-industry is the product's **most important rule** | **No screen displays a role at all** | **Unresolved and blocking.** `06-inputs-needed.md` item 1 |
> | §4.1 — unregistered numbers get a **support link** | Support is excluded entirely | A `tel:`/WhatsApp deep link is the v1 stopgap |
>
> The `.docx` remains the sign-off artifact. Where it and the design handoff diverge, the divergence is
> recorded in `08-screen-inventory.md` §5 rather than silently resolved in code.

---

## 1. Goals & Objectives

Give Influencers direct, self-serve visibility into their standing within the Humbee network:

- See exactly how much product has been allocated to me, by whom, and for which brand/manufacturer.
- Track and verify rewards and lucky draw prizes won in my name, and know when/how I will receive them.
- Build a track record / reputation that Distributors and Dealers can see and trust.
- Access welfare and recognition benefits similar to what Distributors and Dealers already receive.
- Get simple, mobile-first access without lengthy forms or an office visit.

## 2. Scope

> **Annotated.** "Everything else from §4 onward is in scope" is no longer true — see the banner above
> and `08-screen-inventory.md`. And the first exclusion below is **reversed**: demand capture is the
> core loop of the approved design and is in v1. It is struck through rather than deleted so the change
> is visible to anyone comparing this file against the signed `.docx`.

**Out of scope for Phase 1** (everything else from §4 onward is in scope):

- ~~In-app direct e-commerce/ordering by Influencers.~~ **Reversed for demand capture:** an Influencer
  captures a *demand*, which a VCP then allocates against. This is not ordering — no payment, no cart,
  no fulfilment by the Influencer — and it is the core loop of the approved design (screens 06–08).
  Direct e-commerce remains out of scope.
- Peer-to-peer chat between Influencers and Distributors/Dealers.
- Insurance policy issuance workflow (visibility only in Phase 1, enrollment later).
- AI-based recommendation or route-planning tools for field sales.
- Full e-KYC with document OCR (Phase 1 = lightweight self-declared KYC **on record**, not self-entered).
- **Self-service registration or account creation within the app.**

## 3. User Roles

### 3.1 Role varies by industry

An Influencer's role label is **not fixed** — it is specific to the industry they are active in.
**Confirmed business rule:** one Influencer can be active in multiple industries at once, each with
its own role label (e.g. Barbender in Steel, Contractor in Cement, Painter in Paints — simultaneously
and independently). The app must always show the correct role alongside the relevant industry and
activity, never a single role assumed for the whole Influencer.

| Industry | Example role labels (not exhaustive) |
| --- | --- |
| Steel (TMT) | Barbender, Engineer, Architect, Contractor |
| Cement | Contractor, Mason, Engineer |
| Paints | Painter, Contractor |

Role labels per industry are configured by Humbee Ops/Manufacturers and assigned at onboarding or
when a new industry link is added (`InfluencerIndustryRole`, §6). They are **not self-declared**.

| Role | Access in Influencer App | Notes |
| --- | --- | --- |
| **Influencer** (primary user) | Full self-service: dashboard, allocations, rewards, profile, points, support | Only role that logs into this app |
| Distributor | Not a user; appears as data source ("allocated by") | Uses existing Distributor portal/app |
| Dealer | Not a user; appears as data source ("allocated by") | Uses existing Dealer portal/app |
| Manufacturer/Brand Admin | Not a user; brand name/logo surfaced as scheme/reward attribution | Separate manufacturer dashboard |
| Humbee Support/Ops | Backend/admin console: disputes, KYC verification, reward fulfilment | Internal tool, outside this app |

---

## 4. Functional Requirements

### 4.0 Language Selection (First Launch)

> As an Influencer who reads Hindi more comfortably than English, I want to choose my language the
> moment I open the app, so that every screen — including the login screen — is already in a
> language I understand.

**Numbered 4.0 because it happens before everything else, including login.** The login screen
itself must render in the user's chosen language, so the choice cannot sit behind authentication.

**First launch**

- On the very first app launch, before the login screen, the Influencer is shown a **language
  chooser** as a full screen. No other action is available until a language is selected.
- Each language is labelled **in its own script first** (हिन्दी, ગુજરાતી, தமிழ்), with its Latin
  name as a secondary label — never only in English ("Hindi"), which the target user may not be
  able to read. The screen must be usable by someone who cannot read the instruction above the options.
- The screen appears **only once**. Subsequent launches go straight to login or the dashboard.

**The language catalogue is configuration, not code** *(same principle as the §4.6 points table)*

- The list of available languages is **served by the portal and configured by Humbee Ops**.
  Enabling a new regional language, or withdrawing one, must not require an app release.
- Each catalogue entry carries: BCP-47 tag, native-script name, Latin name, script, enabled flag,
  display order, and per-channel readiness flags (see *Coverage* below).
- The app caches the catalogue and ships with a bundled fallback list so the chooser still works on
  a first launch with no connectivity.
- The design must scale to **10+ languages without a redesign** — a scrolling list, not a
  fixed set of options. Target set per §4.13: Hindi, English, Gujarati, Marathi, Tamil, Telugu,
  Kannada, plus others by geography.

**Ordering**

Ordering matters more as the list grows, because scrolling past unreadable scripts is the failure
mode. Order by:

1. Language matching the device locale, if it is in the catalogue.
2. Language(s) common to the SIM/region, where derivable pre-login.
3. Hindi and English, always visible without scrolling.
4. Remaining languages in the Ops-configured display order.

After login the user's registered state is known, so the **Profile** chooser (below) orders by
region first. The first-launch chooser cannot do this — no user record exists yet.

**Coverage and fallback**

A regional language may be fully translated in the app but not yet in SMS templates, or vice versa.
Coverage is tracked **per channel**, and the catalogue exposes it:

| Channel | If the chosen language is unavailable |
| --- | --- |
| App UI | Fall back **per string** to Hindi, then English. A missing string never renders as a raw key. |
| Push / SMS / WhatsApp | Fall back to Hindi, then English, **and raise an alert to Ops** — never sent silently in the wrong language (§7). |
| Learning Center content (§4.10) | Show available languages for that item; do not hide the item. |

- A language is only offered in the chooser once **app UI coverage is complete**. Partial UI
  translation is a worse experience than not offering the language at all.
- Ops must be able to see per-language, per-channel coverage before enabling a language.

**Fonts and scripts** *(see §9 Compatibility)*

The design system is Lato, which covers Latin only. **Every Indic script requires its own font
file** — Devanagari (Hindi, Marathi), Gujarati, Tamil, Telugu, Kannada, Bengali are six separate
faces. This has three consequences that must be designed for, not discovered:

- **APK size.** Each bundled script adds roughly 150–400 KB. Bundling all of them conflicts with
  the entry-level-device constraint in §9. Prefer per-script downloadable font assets, or
  Android's system fonts where the device already provides the script.
- **Vertical metrics differ by script.** Devanagari and Tamil have taller ascenders/descenders than
  Latin at the same point size. Line heights in the type ramp must be validated per script; no
  fixed-height text container survives this.
- **Text length varies by script**, typically 15–30% longer than the English equivalent.

**Persistence and sync**

- The selection is stored **device-locally** immediately, because at this point no user is
  authenticated and no server record can be written.
- On successful login, the device-local selection is written to `Influencer.language` (§6).
- **Conflict rule:** where a device-local selection and a stored server value disagree, the
  **most recent explicit user choice wins.** A first-launch pick on a new device is an explicit
  choice and therefore overwrites the stored server value; the server value is authoritative only
  when the user has made no choice on that device.
- Re-login on a new device restores the language from the server, so a user who loses a phone does
  not have to rediscover the setting.

**Scope of the setting**

The chosen language governs, in order of visibility to the user:

1. All app UI text, including the login and OTP screens.
2. **All outbound notifications** — push, SMS, and WhatsApp (§4.7, §7). A user who chose Hindi must
   not receive English SMS.
3. Content language defaults in the Learning Center (§4.10), which may be overridden per-item.

**Changing language later**

- **Profile → Language** exposes the same chooser at any time (§4.8, Account).
- The change applies **immediately, without an app restart**, and without loss of navigation state
  or unsaved input.
- Changing the language updates `Influencer.language` server-side so notification language follows
  on the next send.

**Acceptance criteria**

- A first-time user never sees an English-only screen before choosing a language.
- Every option is legible to a user who reads **only** that option's script.
- After choosing any language, no string from another language appears in UI, push, SMS or WhatsApp
  except through the documented fallback chain — and every fallback in a notification raises an Ops alert.
- Enabling a new language on the portal makes it appear in the chooser **without an app release**.
- The chooser remains usable at 10+ languages, including on a 360 dp screen at 200% font scale.
- Language can be changed from Profile in at most two taps and takes effect without restart.
- Uninstall/reinstall returns the user to the chooser; logout does **not**.

### 4.1 Login & Authentication

> As an already-registered Influencer, I want a fast, password-free login.

**There is no self-registration or account-creation flow anywhere in this app.**

- Primary login: **mobile number + OTP**. No "Create account"/"Sign up" path shown anywhere.
- **Unrecognized number**: show *"This number isn't registered with Humbee yet — please ask your
  Distributor or Dealer to add you"* plus a link to support/helpdesk. Never start a signup flow.
- **Session persistence**: stay logged in on trusted device; re-auth only after logout, reinstall,
  or extended inactivity (e.g. 90 days).
- **Optional second factor**: 4-digit app PIN or biometric (fingerprint/Face ID) for quick unlock.
- **Change mobile number**: OTP on *both* old and new numbers; change logged and visible to all
  linked Distributors/Dealers (anti-identity-fraud).
- **Account recovery**: re-login on a new device via OTP restores full history (data is server-side).
- **Rate limiting and lockout** after repeated failed OTP attempts.

### 4.2 Home Dashboard

> As an Influencer, I want one screen that summarizes my entire relationship with Humbee.

- **Header**: name, profile photo, linked-partner summary (e.g. "3 industries, 5 partners").
  No single fixed trade label here — role varies by industry (§3.1).
- **Summary cards**: linked partners count, active industries count, current points balance.
- **Points by Manufacturer chart**: bar chart of points earned per manufacturer this month
  (e.g. Dalmia TMT, Vastav Cement, MasterChow Paint), using the converted point value (§4.6) as the
  common comparable unit. *This deliberately replaces a currency-value chart* — points are the one
  figure both meaningful to the Influencer and comparable across industries and base units.
- **Recent Activity feed**: chronological (newest first) allocation / reward / points events. Each
  entry shows manufacturer/brand, **the Influencer's role for that entry's industry inline**
  (e.g. "Dalmia TMT · Barbender"), counterparty name, quantity in native unit, timestamp.
- **Active Schemes / Lucky Draws banner**: running schemes the Influencer is eligible for, with
  countdown / eligibility criteria.
- **Quick links**: all allocations, all rewards, points wallet, refer a friend, support.
- **Pull-to-refresh** and **offline-cached last-known state** for low-connectivity areas.

### 4.3 Allocation & Business Tracking

> As an Influencer, I want a detailed, filterable log of everything allocated to me.

- **List view** columns: Date · Allocated By (name + role) · Manufacturer/Brand · Product/Category ·
  Quantity · Unit · Status.
- **Role inline on every row**, e.g. "Dalmia TMT — Barbender — 500 kg". Same pattern as §4.2.
- **Industry is a first-class filter** alongside partner, manufacturer, product category.
- **Filters**: date range, industry, manufacturer/brand, allocator, product category.
- **Detail view**: full breakdown, any associated scheme/reward, running cumulative total for that
  manufacturer/brand **in its native unit**.
- **Dispute/flag**: mark an allocation "incorrect" or "not received" → creates a support ticket
  routed to Humbee Ops *and* the relevant Distributor/Dealer.
- **Many-to-many partner model (confirmed business rule)**: an Influencer may be linked to multiple
  Distributors *and* multiple Dealers concurrently, and through them receive allocations from
  multiple manufacturer brands across multiple industries, each carrying its own role. Allocations
  and Dashboard **aggregate across every linked partner/manufacturer/industry by default**, while
  still supporting filtering down to one.

### 4.4 Rewards & Lucky Draw

> As an Influencer, I want full transparency on every gift and lucky draw I've won.

**Rewards tracking**

- List fields: reward name/description · Type (Cash / Gift item / Points / Lucky Draw prize /
  Tour or experience) · Value (if disclosed) · Granted By (Distributor/Dealer/Manufacturer scheme) ·
  Manufacturer/Brand tag · Date announced · Fulfilment status.
- **Fulfilment stages**: Announced → Processing → Dispatched/Credited → Received.
  Influencer self-confirms receipt in-app, with optional photo upload for gift items.
- **Detail screen** shows the specific scheme/campaign and eligibility rule
  (e.g. "Top 50 Barbenders — Q3 Dalmia TMT Volume Drive").

**Lucky draw specifics**

- **Entries screen**: draws entered, entry basis (e.g. per 1 tonne purchased = 1 entry), entries held,
  draw date, result status (Pending / Won / Not Won).
- **Winner announcement**: in-app banner + push + SMS the moment results publish; **opt-in publicly
  viewable winner list** per draw for transparency and social proof.
- **Full audit trail**: every draw shows which Distributor/Dealer or Manufacturer campaign ran it.

### 4.5 Umang Utsav — Influencer Meet & Rewards Event

> As an Influencer, I want to know when the next Umang Utsav is, whether I attended past ones, and
> exactly what I won there.

Umang Utsav is a periodic in-person Influencer meet — one day of entertainment (food, games, live
programs) plus recognition, where high-performing Influencers receive big-ticket "white goods" gifts
(washing machine, refrigerator, bike) based on performance over a defined period. **Phase 1 scope**:
surface event info and personal event history in-app; on-ground operations stay manual/offline.

- **Event banner** (Home + dedicated Events area): next event name, date, city/venue teaser,
  countdown. Auto-switches to a post-event highlight banner once concluded (e.g. *"You won a
  Refrigerator at Umang Utsav 2026!"*).
- **Upcoming Events**: list/carousel of events the Influencer is eligible for — date, venue/city,
  eligibility note (e.g. "Open to Top 100 performers — Jan–Jun cycle").
- **Past Events**: chronological list with attendance status.
- **Attendance status**: Invited → Attended / Did Not Attend. Recorded by Ops/on-ground staff
  (e.g. QR/digital-ID check-in scan). **Read-only in the app.**
- **Gift allotment per event**: item(s) awarded (e.g. "LG 7kg Washing Machine"), performance basis
  (e.g. "Top 20 Barbenders — Dalmia TMT, Jan–Jun 2026"), granting Manufacturer/Distributor, and
  fulfilment status (Allotted → Handed Over at Event / Pending Dispatch) — reusing the §4.4 pattern.
- **Event detail screen**: banner/highlights placeholder, attendance stamp, gifts won at that event,
  optional photo gallery (Phase 1.1).
- **Eligibility and gift tiering are decided outside the app** by Ops/Manufacturers from allocation
  data. The app displays outcomes only; it runs no eligibility calculation.
- **Notifications**: event announced, reminders (7 days, 1 day), post-event gift-allotment confirmation.

### 4.6 Points & Loyalty

> As an Influencer, I want to earn points for engagement and volume.

**Conversion — 1 base unit = 1 point.** Simple and hand-verifiable, and gives one common unit for
cross-industry comparison.

| Industry | Base unit | Points |
| --- | --- | --- |
| Steel (TMT) | 1 kg | 1 point |
| Cement | 1 bag | 1 point |
| Paints | 1 litre | 1 point |

- This table is **configurable per industry by Ops** — new industries or a changed base unit/ratio
  must **not** require an app release. It is shown in-app on the Points screen so the balance is
  always traceable back to actual allocation volume.
- **Points earned from**: allocation volume (via conversion above), profile completion, referrals,
  engagement streaks (e.g. weekly check-in), manufacturer-specific campaigns.
- **Points wallet**: balance, earn history, redemption history, expiry rules (e.g. expire after
  12 months of inactivity, clearly disclosed).
- **Redemption catalogue**: Phase 1 view-only or simple e-voucher; full marketplace is Phase 2.
- **Ledger must be auditable** and reconcilable to the source event (allocation, reward, referral),
  including which industry/base-unit conversion produced each entry.

### 4.7 Notifications

- **Channels**: Push (primary), SMS (fallback / critical), WhatsApp (where integrated).
- **Triggers**: new allocation; reward announced; reward status change; lucky draw entry confirmed;
  draw result published; points credited / expiring soon; new scheme for the Influencer's category;
  KYC/profile action needed; support ticket update.
- **In-app Notification Center** with read/unread state and 90-day history.
- **Preferences screen**: toggle categories (Allocations, Rewards, Schemes, Promotions).
  **Critical account/security notifications cannot be disabled.**

### 4.8 Profile Management

> As an Influencer, I want one place that holds who I am, who I work with, and how Humbee can reach
> or pay me — so I never have to ask my Distributor for information about my own account.

Profile is the app's **identity and self-service surface**. It is organised as clearly separated
sections, matching the validated design prototypes. Sections are ordered by how often a real user
opens them, not by how the data model is structured.

#### 4.8.1 Identity — "About you"

| Field | Editable | Notes |
| --- | --- | --- |
| Profile photo | Yes | Camera/pencil badge on the avatar. Camera-first, gallery second. Used on the digital ID card (§5) and at Umang Utsav check-in. |
| Name | **No** | Set at onboarding by Ops/partner. A change request goes through Support (§4.12) so it can be verified — the name appears on reward and gift paperwork. |
| Mobile number | **View-only here** | It is the login identifier. Changed only via the dedicated §4.1 flow with OTP on both old and new numbers. |
| Email | Yes | Inline edit; a verification link/OTP goes to the **new** address before it takes effect. Optional field — many users will not have one. |
| Address | Yes | Inline edit. Used for physical gift and reward delivery (Umang Utsav white goods, mailed vouchers). |
| Preferred language | Yes | Opens the §4.0 chooser. Applies immediately; also governs push/SMS/WhatsApp. |
| Member since | No | Registration date. Feeds the loyalty milestones in §4.9. |

#### 4.8.2 Your roles — by industry, surfaced by brand

Read-only. The **stored** model is one role per industry (`InfluencerIndustryRole`, §6), but the
**display** groups the manufacturers the Influencer actually deals with under each industry+role
pair, because a barbender recognises "Dalmia TMT" long before he recognises "Steel (TMT)":

```
Steel (TMT) — Barbender          Cement — Contractor        Paints — Painter
  Dalmia TMT                       Vastav Cement              MasterChow
```

The manufacturer list is **derived at query time** from the Influencer's Allocation and Reward
records (§6). It is never stored as a role-to-manufacturer mapping — role belongs to the industry,
and denormalising it per brand would break the moment a brand's industry classification changed.

Each row states **who can change it**: "Set by Sharma Steel Traders. Contact them to change."
Self-declaration is not permitted (§3.1).

#### 4.8.3 Linked partners

- List every linked Distributor and Dealer, with partner type, territory, the brands they carry,
  and the date the link was created.
- **Request a new link** — the Influencer nominates a partner; the request is only active once
  **that partner confirms on their side**, which prevents spam linking.
- **Request removal** of a link. Removal stops future allocations but **does not delete history** —
  past allocations, points and rewards remain visible and auditable (NFR §9).

#### 4.8.4 KYC & documents

- Show current `kyc_status` in plain language, not a system enum: *Verified* / *Pending with Humbee* /
  *Action needed from you*.
- Where action is needed, state exactly what and who to give it to.
- Self-declared ID details only in Phase 1 (§2). **No ID number is ever displayed in full** — last
  four digits only, and never stored in plaintext (NFR §9).

#### 4.8.5 Payout details — *conditional, gated by PRD §13 Q1*

Needed only once cash rewards exist (§4.4 reward type `cash`). Bank account or UPI ID, plus PAN
where a TDS threshold applies.

**This section must not ship until the §13 Q1 KYC/TDS question is answered.** Collecting bank
details without the regulatory position settled is a compliance risk, and showing an empty payout
section to a user who has never won cash is noise. Hide the section entirely until the user has a
cash reward pending.

#### 4.8.6 Nominee & family details — *Phase 1, data capture only*

Per §5. Name, relationship, and contact for a nominee. Explicitly framed as groundwork for welfare
and insurance benefits, with a clear statement that **no insurance is active yet** — otherwise this
field reads as a promise the product has not made.

#### 4.8.7 Preferences

- **Notification preferences** — toggle categories (Allocations, Rewards, Schemes, Promotions).
  Critical account and security notifications cannot be disabled (§4.7).
- **Leaderboard visibility** — opt in or out of appearing on the §4.9 leaderboard. Default **off**;
  peers seeing your volume is a disclosure the user must actively choose.
- **App language** — §4.0.

#### 4.8.8 Shortcuts

Compact entries that link out rather than duplicating their module:

- **My Humbee card** — digital ID with QR (§5, Phase 1)
- **Rewards summary** — e.g. "1 processing, 3 received" → §4.4
- **Refer a friend** → §4.11
- **Learning centre** → §4.10
- **Leaderboard** → §4.9 *(only when opted in)*

#### 4.8.9 Help, legal and account

- **Help & Support** — direct call-helpline and WhatsApp entry points (§4.12).
- **Privacy Policy & Terms of Use** — must be reachable **without being logged in**
  (app-store requirement), so these also appear on the login screen.
- **App version and device ID** — small, at the foot. Support cannot diagnose a field issue on an
  entry-level Android without it.
- **Log Out** — clearly separated and visually distinct, at the bottom. Ends the session, returns to
  Login, deletes no data. Requires a confirmation step, because re-login needs an OTP the user may
  not be able to receive at a work site.
- **Delete / deactivate account request** — per Privacy Policy and DPDP (NFR §9), with an explicit
  retention disclosure and a statement of what happens to unredeemed points and pending rewards.

#### Acceptance criteria

- Every field states whether the user can change it, and if not, **who can**.
- No role is ever displayed without its industry (§3.1).
- Privacy Policy and Terms are reachable while logged out.
- No full ID or bank number is rendered anywhere in the UI.
- Any destructive action (logout, delete request, unlink partner) requires confirmation and states
  its consequence.

### 4.9 Leaderboard & Gamification

- **Opt-in leaderboard**: top Influencers by volume/points within a Distributor's or Dealer's
  network, by category (e.g. Top Barbenders this quarter for a given manufacturer).
- **Badges/milestones** on profile (e.g. "100 Tonnes Club", "5-Year Loyal Partner").
- **Anniversary/recognition moments** — automated "Thank you" on registration anniversary or
  milestone volumes.

### 4.10 Learning & Knowledge Center

- Short video/audio content **in regional languages**: product application best practices, safety,
  new product launches.
- Especially valuable for Engineers and Contractors; optional completion certificates.

### 4.11 Referral Program

- Each Influencer gets a unique **referral code**. Since there is no in-app self-registration, the
  peer quotes this code to their Distributor/Dealer or Ops at onboarding time so it can be credited.
- Referrer earns points/rewards once the referred peer is onboarded and verified (and optionally
  hits a first-activity milestone, to deter fraud).
- **Status tracker**: Invited → Onboarded → Verified → Rewarded.

### 4.12 Support / Helpdesk

- **Raise a ticket** with category (allocation dispute, reward not received, KYC issue, account
  issue, other), photo attachment, status tracking.
- **Direct contact**: call center (Humbee's toll-free **1800 2100 123**) and WhatsApp support.
- **FAQ / Help Center**, searchable, in regional languages.

### 4.13 Localization & Accessibility

- **Hindi + English at launch**; Gujarati, Marathi, Tamil, Telugu, Kannada and further regional
  languages follow by geography. The **set of languages is Ops-configurable from the portal**, so
  each addition ships without an app release — see **§4.0**. Language is chosen by the user on
  first launch, before login, and changeable at any time from Profile.
- **Language files are namespaced per feature** and structured so a new language is a data addition,
  never a code change. Each Indic script additionally requires its own font asset (§4.0, Fonts).
- **Icon-led, low-text-dependency UI** given variable literacy among target personas.
- Large tap targets, high-contrast mode, optional **voice-assist** for key actions (e.g. reading out
  reward announcements).

---

## 5. Suggested Additional Features (recommended, prioritized)

| Feature | Why it helps | Phase |
| --- | --- | --- |
| Geo-tagged site/project logging | Demand-signal data for Distributors/Manufacturers; unlocks site-based schemes | 2 |
| **Digital ID / Loyalty card** (QR) | Shareable card to instantly establish/verify Humbee identity with a new Dealer | **1** |
| **Family/nominee details** | Groundwork before extending Life/Medical Insurance to this tier | **1 (data capture only)** |
| Emergency assistance button | One-tap call to support/insurance helpline | 2 |
| Price/scheme transparency board | Read-only current schemes and price bands in the Influencer's area | 2 |
| Peer community / regional groups | Light community feed per district/trade | 2 |
| **Offline mode with sync** | Many work sites have poor connectivity | **1** |
| Voice-based OTP/IVR login fallback | Accessibility for low-literacy users | 2 |
| Annual "Impact Statement" | Shareable yearly summary — volume influenced, rewards, rank | 2 |

---

## 6. Data Model — Key Entities

| Entity | Key attributes |
| --- | --- |
| **Influencer** | `influencer_id`, `mobile_number` (unique), `name`, `email`, `address`, `photo_url`, `location`, `language` (BCP-47 tag, e.g. `hi` / `en`; set from the §4.0 chooser and used for all outbound push/SMS/WhatsApp), `kyc_status`, `registered_date`, `points_balance`. Relationships are **many-to-many via join tables**: `InfluencerDistributorLink[]` (influencer_id, distributor_id, linked_date, status), `InfluencerDealerLink[]` (influencer_id, dealer_id, linked_date, status). **Linked manufacturers are not stored on the Influencer** — derived at query time from distinct `manufacturer_id` across Allocation and Reward records, since one linked partner may carry multiple brands. |
| **Industry** | `industry_id`, `name` (Steel/Cement/Paints/…), `base_unit` (kg/bag/litre/…), `points_per_base_unit` (default 1; Ops-configurable without an app release — §4.6). |
| **InfluencerIndustryRole** | `influencer_id`, `industry_id`, `role_label` (Barbender/Contractor/Painter/Engineer/Architect — §3.1), `assigned_date`, `status`. **One row per industry the Influencer is active in**, each with its own independent role_label. This is what makes the multi-industry/multi-role model possible and is the source of the role shown inline on every Allocation/Activity entry. |
| **Distributor** | `distributor_id`, `name`, `territory`, `linked_manufacturer_ids[]` |
| **Dealer** | `dealer_id`, `name`, `linked_distributor_id`, `territory` |
| **Manufacturer** | `manufacturer_id`, `brand_name`, `industry_id` (determines base_unit and points conversion), `category` (TMT/Cement/Paints/…) |
| **Allocation** | `allocation_id`, `allocator_id`, `allocator_role` (Distributor/Dealer), `influencer_id`, `manufacturer_id`, product/category, `quantity`, `unit`, `date`, `status`, `source_type` (scheme/sale). **Role is resolved at query time** by joining influencer_id + the allocation's manufacturer's industry_id against InfluencerIndustryRole — **never stored redundantly on the Allocation.** |
| **Scheme** | `scheme_id`, `name`, `manufacturer_id`, `owner_id` (Distributor/Dealer), `eligibility_rule`, `start_date`, `end_date`, `category_target` |
| **Reward** | `reward_id`, `influencer_id`, `scheme_id` (nullable), `type` (cash/gift/points/lucky_draw/experience), `value`, `granted_by_id`, `granted_by_role`, `manufacturer_id`, `announced_date`, `fulfilment_status` |
| **LuckyDraw** | `draw_id`, `scheme_id`, `entries[]` (influencer_id, entry_count), `draw_date`, `winners[]`, `status` |
| **PointsLedgerEntry** | `entry_id`, `influencer_id`, `event_type` (earn/redeem/expire), `points`, `source_reference_id`, `industry_id` (which base-unit conversion produced it), `date` |
| **Notification** | `notification_id`, `influencer_id`, `type`, `channel`, `content`, `sent_date`, `read_status` |
| **SupportTicket** | `ticket_id`, `influencer_id`, `category`, `description`, `attachment`, `status`, `linked_allocation_or_reward_id` |
| **Event** | `event_id`, `name` ("Umang Utsav 2026"), `type`, `date`, `city`, `venue`, `banner_image`, `status` (Upcoming/Live/Past), `eligibility_rule` |
| **EventAttendance** | `attendance_id`, `event_id`, `influencer_id`, `invited` (bool), `attended` (bool), `checked_in_at`, `checked_in_by` |
| **EventGift** | `gift_id`, `event_id`, `influencer_id`, `item_name`, `category` (White Goods/Vehicle/Other), `performance_basis`, `granted_by_id`, `granted_by_role`, `manufacturer_id`, `fulfilment_status` (Allotted / Handed Over at Event / Pending Dispatch) |

---

## 7. Notification Triggers

**All messages below are sent in the Influencer's chosen language** (`Influencer.language`, §4.0).
Templates must exist in every supported language before a trigger goes live; a missing translation
falls back to English **and** raises an alert — it is never silently sent in the wrong language.

| Event | Channel(s) | Message intent |
| --- | --- | --- |
| New allocation recorded | Push, SMS | "[Partner] allocated [qty] [unit] of [Brand] to you on [date]." |
| Reward announced | Push, SMS, WhatsApp | "You've been awarded [reward] by [name] under [scheme]. Track status in-app." |
| Reward status updated | Push | "Your reward [reward] is now [Dispatched/Credited]." |
| Lucky draw entry confirmed | Push | "You now have [n] entries in the [draw name] draw." |
| Lucky draw result published | Push, SMS | "Results are out for [draw name] — tap to see if you won!" |
| Points expiring soon | Push | "[n] points expire on [date] — check redemption options." |
| New scheme for your category | Push | "[Manufacturer] launched a new scheme for [category] in your area." |
| KYC/profile action needed | Push, SMS | "Please complete your profile to keep receiving rewards without interruption." |
| Referral milestone reached | Push | "Your referral [name] just joined — you earned [points/reward]." |
| Umang Utsav announced | Push, SMS | "Umang Utsav [year] is happening on [date] in [city] — check if you're invited." |
| Umang Utsav reminder (7d / 1d) | Push, SMS | "Umang Utsav [year] is coming up on [date] — don't miss it!" |
| Umang Utsav gift allotted | Push, SMS, WhatsApp | "You've been allotted a [gift item] at Umang Utsav [year] — see details in-app." |

---

## 8. Roles & Permissions Matrix

| Capability | Influencer | Distributor/Dealer (own app) | Humbee Ops (Admin) |
| --- | --- | --- | --- |
| View own allocations/rewards | Yes | Yes (only own issued) | Yes (all, for support) |
| Create allocation to an Influencer | No | Yes | Yes (override/correction) |
| Announce reward / lucky draw | No | Yes (within scheme rules) | Yes |
| Confirm receipt of reward | Yes (self) | No | Yes (on behalf, if disputed) |
| Edit own profile | Yes | N/A | Yes (support-assisted) |
| Resolve disputes/tickets | Raise only | Respond only | Yes (final resolution) |
| Mark event attendance / allot event gift | View only | No | Yes (on-ground check-in & event ops) |
| View aggregated analytics | Own data only | Own network only | Full platform |

---

## 9. Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| **Performance** | Dashboard loads within **3 s on 4G**; core screens usable on 3G with graceful degradation. |
| **Scalability** | Must scale to the platform's stated reach (**1,200,000+ value chain partners**) plus a multiple more for the Influencer tier, which is typically larger in headcount than Distributors/Dealers. |
| **Availability** | **99.5% uptime** for core APIs; offline-first caching for dashboard viewing. |
| **Security** | OTP auth, TLS in transit, encryption at rest, rate-limited login, **no plaintext storage of ID numbers**. |
| **Data Privacy** | India **DPDP Act** compliance — explicit consent capture, right to access/delete, minimal Phase 1 KYC data. |
| **Compatibility** | **Android primary at launch**; iOS parity as Phase 1.1. Must run acceptably on **entry-level 2 GB RAM** devices. |
| **Localization** | Hindi + English at launch; language files structured for easy addition. |
| **Auditability** | Every allocation, reward, and points transaction traceable to a source event and issuing party. |
| **Accessibility** | Icon-forward UI, large fonts/tap targets, minimal typed text entry. |

---

## 10. Success Metrics (Year 1, illustrative)

| Metric | Target |
| --- | --- |
| Influencer accounts onboarded | Sized against Distributor/Dealer network size |
| Monthly Active Influencers | 50%+ of registered base |
| Allocation reconciliation rate (viewed/acked within 7 days) | 80%+ |
| Reward dispute rate | < 3% |
| Referral-driven onboarding | 20%+ |
| Push opt-in / open rate | 70%+ opt-in, 40%+ open |
| NPS | Benchmark vs existing Distributor/Dealer NPS |
| Umang Utsav attendance rate (of invited viewers) | 70%+ |
| Umang Utsav gift acknowledgement within 14 days | 85%+ |

---

## 11. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Distributors/Dealers under-report or delay allocations → Influencer data looks incomplete/unfair | Fast allocation-entry tools in the Distributor/Dealer app; reminders/nudges; Influencer-side dispute flagging surfaces gaps |
| Low digital literacy limits adoption | Icon-led UI, regional language + voice support, assisted onboarding via field staff, WhatsApp flows |
| Duplicate/fraudulent registrations gaming referrals or draws | Mobile-number uniqueness; referral reward only after verified activity milestone; backend anomaly detection |
| Influencers distrust an app adjacent to the Distributor they depend on | Transparent audit trail; opt-in public winner lists; **independent dispute channel via Humbee Ops, not the Distributor** |
| Privacy concerns around KYC for an unorganized-sector user base | Minimal Phase 1 KYC, clear consent flows, DPDP-aligned policy, visible privacy link |
| Device/connectivity constraints | Lightweight build, offline caching, SMS fallback notifications |

---

## 12. Assumptions & Dependencies

- The existing Humbee Distributor/Dealer platform will be extended (or a companion module built) so
  partners can record allocations and rewards against an Influencer's mobile number.
  **This app is a read/track/engage surface for data primarily entered on the VCP side.**
- Mobile-number uniqueness is sufficient as system-of-record identity for Phase 1; formal
  document KYC is a later enhancement.
- Existing SMS/WhatsApp gateway and push infrastructure can be reused.
- Manufacturer-funded schemes and draws continue to be configured through existing commercial
  agreements; this app only surfaces and tracks them.
- Insurance/social-security enrollment needs a separate underwriting decision, outside Phase 1.

## 13. Open Questions

1. Minimum KYC before an Influencer is eligible for **cash/monetary rewards** (TDS/regulatory
   implications above certain thresholds)?
2. Should reward **fulfilment logistics** be tracked inside this app, or handed to a third-party
   logistics partner with only status webhooks surfaced here?
3. **Is a unified single Humbee app (role-based views for Distributor/Dealer/Influencer) preferred
   over a fully separate Influencer app?** — *Highest-impact architectural fork; see `01-architecture.md`.*
4. Which languages/regions to prioritize for the Phase 1 localization rollout?

## 14. Future Roadmap (Phase 2+)

- Full insurance enrollment and claims tracking.
- Points redemption marketplace (vouchers, merchandise, UPI cash-out).
- In-app ordering/procurement assistance connecting Influencers to nearby Dealers.
- Community/social features — regional peer groups, success stories, network-wide leaderboards.
- Advanced analytics for Manufacturers on influencer-level brand pull-through.
- AI-driven personalized scheme recommendations.
- Feature-phone/IVR access channel.
