# Handoff — HUMBEE Influencer App (Mobile, v1)

## Overview
The HUMBEE Influencer App is a **B2B Android/iOS app for construction and FMCG influencers** — painters, bar benders, masons, carpenters. Distributors and dealers (collectively **VCPs**) allocate inventory against an influencer's demand; the influencer earns **points**, climbs a **manufacturer-wise leaderboard**, and receives **gifts** and **Umang Utsav** invitations.

This bundle contains the complete design specification for six modules:

1. Login (mobile number + 4-digit OTP)
2. Home (banners, quick links, my rewards)
3. Leaderboard (top 10 per manufacturer, my rank pinned)
4. Demand Capturing (industry → sub-industry → manufacturer/SKU → quantity) + My Demands
5. Allocation of Inventory (per-manufacturer allocation history)
6. Rewards (Umang Utsav banner, gift list with status filters)

Plus Profile and a Demand Success screen. **10 screens total.**

## About the design files
The files in `design/` are **design references created in HTML**. They are prototypes that show intended look, copy and behaviour — **they are not production code to copy directly**.

The task is to **recreate these designs in the target codebase's environment**, using its established patterns and libraries. If no app codebase exists yet, choose the framework (see `10-implementation-plan.md` for a recommendation) and implement the designs there.

Do **not** port the prototype's templating runtime (`prototype/support.js`, `<x-dc>`, `sc-for`, `sc-if`, `x-import`). Those are authoring-tool constructs. Read them as "list", "conditional" and "component instance".

## Fidelity
**High fidelity (hifi).** Every colour, font size, line-height, radius, shadow, padding, animation duration and string of copy in this bundle is final and was authored against the HUMBEE Design System. Recreate the UI pixel-accurately. Where a value is not stated, fall back to the design tokens in `02-design-tokens.md`, never to framework defaults.

The **mock data** (people, quantities, gifts, VCP names, dates) is placeholder and comes from the backend in production. It is provided as fixtures in `data/` so screens can be built and tested before the API exists.

## Read these in order

| File | What it gives you |
| --- | --- |
| `DESIGN-BRIEF.html` | **Shareable brief for the wider team** — self-contained, opens in any browser, prints to PDF. Non-engineers should start (and can stop) here. |
| `BUILD-SPEC.md` | **The whole specification as one document** — the file to hand to a coding agent. Sections 0–10 contain everything in `design-spec/`, plus a kickoff prompt and the non-negotiables. |
| `CLAUDE.md` | Working rules for implementing this package. **Read first.** |
| `01-product-and-scope.md` | Domain vocabulary, user, what v1 includes and excludes |
| `02-design-tokens.md` | Every colour, type, spacing, radius, shadow, motion value |
| `03-ui-kit-and-components.md` | The component inventory with exact specs and states |
| `04-screens/` | One spec per screen: layout, components, copy, states |
| `05-interactions-and-motion.md` | Animations, transitions, gestures, timing |
| `06-state-and-navigation.md` | State shape, transitions, navigation graph |
| `07-api-contract.md` | Proposed endpoints with request/response JSON |
| `08-data-model.md` | Entities, relationships, points calculation rules |
| `09-qa-checklist.md` | Every state that must be implemented and verified |
| `10-implementation-plan.md` | Stack recommendation and build order |

## What is in this bundle

> **Note.** This bundle has been consolidated into `docs/design-spec/` in the frontend repo, so the
> layout below is the *original* handoff shape. The current layout is in `README.md` beside this file:
> the specs sit flat in `design-spec/`, the handoff's own `README.md` and `CLAUDE.md` became
> `00-handoff-readme.md` (this file) and `00-handoff-rules.md`, `BUILD-SPEC.md` kept its content, and
> `design/` was split into `tokens/` and `prototype/`.

```
docs/design-spec/
├── README.md                     ← start here (the current index)
├── 00-handoff-readme.md          ← you are here (the original handoff overview)
├── 00-handoff-rules.md           ← implementation rules for the coding agent
├── BUILD-SPEC.md                 ← everything as ONE document
├── DESIGN-BRIEF.html             ← shareable team brief (offline, printable)
├── 01-…-10-…md                   ← the specification, flat
├── 04-screens/                   ← one spec per screen
├── data/                         ← JSON fixtures mirroring the prototype's mock data
├── screens/                      ← PNG of every screen as designed
├── tokens/                       ← HUMBEE design-system CSS token files
├── prototype/
│   ├── prototype-standalone.html ← open in any browser, no server needed
│   ├── HUMBEE Influencer App.dc.html ← authoring source (reference only)
│   └── support.js                ← prototype runtime (do not port)
└── assets/                       ← logos, illustrations, banners, Lottie files
```

## How to view the design
Open `prototype/prototype-standalone.html` in a browser. Every screen shows its **skeleton loader** for a beat as you navigate to it, and again when you switch manufacturer or period — that is the designed loading state, not a glitch. The left rail is a screen navigator — click any entry to jump to that screen. The centre is a live 390×844 phone. Everything in it is interactive: type a number, request an OTP, switch manufacturers, capture a demand, filter rewards.

The prototype is the visual reference of record — it is interactive, so it shows hover, selected, filtered, empty and success states that a still cannot. To capture stills for a slide or a ticket, open the prototype and screenshot the phone frame.

## Assets
| File | Use |
| --- | --- |
| `assets/humbee-logo.svg` | Full lockup — login screens only |
| `assets/humbee-logomark.svg` | Hex bee mark — app header, 32×32 |
| `assets/img/banner-1.png`, `banner-2.png` | Home carousel slides |
| `assets/img/umang-utsav-banner.png` | Rewards screen Umang Utsav banner |
| `assets/img/bcm.png`, `fmcg.png` | Industry cards |
| `assets/img/tmt.png`, `erw.png`, `angles.png`, `paints.png`, `food.png` | Sub-industry cards |
| `assets/img/cement.svg` | Cement sub-industry card (placeholder — awaiting real illustration) |
| `assets/celebration.json`, `assets/success-green.json` | Lottie animations, Demand Success screen |
| `assets/img/pattern-hive.svg` | Honeycomb background pattern (not used in current build; kept for reference) |

Industry illustrations were supplied by the client with mismatched pastel backgrounds; all have been keyed to a single `#EDF1F6` tint so the set reads as one family. Keep that treatment for any new illustration.

## Known gaps — confirm before building
1. **Backend field names** for the leaderboard, allocation and rewards payloads are not yet defined. `07-api-contract.md` is a *proposal* derived from the design; reconcile it with the HUMBEE operations platform.
2. **Cement** sub-industry still uses a flat vector placeholder; a real illustration is pending.
3. **OTP provider**, resend policy and rate limits are not specified. The design shows a 24-second resend timer.
4. **Points multipliers** in the design are illustrative per manufacturer. Server must own the real rules.
5. **Umang Utsav banner** is a supplied bitmap; if venue/date/invitee count must be dynamic, it needs rebuilding as composed markup (spec included in the Rewards screen doc).
