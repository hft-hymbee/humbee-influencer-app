# 02 — Alternatives considered

The recommendation is React Native + Expo. This document is the honest case for and against each
alternative, because the second-best option here (Flutter) is genuinely close, and anyone who
inherits this codebase should know why it was not chosen rather than assume nobody thought about it.

## 2.1 The criteria, weighted

Weights come from the product facts in `01-tech-stack-decision.md` §1.1, not from general taste.

| # | Criterion | Weight | Why this weight |
| --- | --- | --- | --- |
| C1 | Same-day fix delivery without a store release | 5 | The audience does not update apps. A broken points display would otherwise persist for weeks |
| C2 | Smooth UI on a 2 GB Android device | 5 | This *is* the device. Not an edge case |
| C3 | Pixel-exact reproduction of a 531-variable design system | 4 | "Fidelity is not negotiable" — handoff CLAUDE.md rule 2 |
| C4 | Native capability access (maps, camera, sensors, SMS retriever) | 4 | Named future work |
| C5 | Hiring pool and community depth in India | 4 | Team continuity over years |
| C6 | Maintainability / upgrade cost over 3 years | 4 | This app will outlive its first team |
| C7 | Shared language and types with this repo's server contract | 3 | The OpenAPI spec is one directory up |
| C8 | Time to a shippable v1 | 3 | Ten screens, one team |
| C9 | App size and cold-start cost | 3 | Play Store install conversion on cheap data plans |

## 2.2 The options

### A. React Native (New Architecture) + Expo — **recommended**

**For.** EAS Update is a first-party, store-policy-compliant OTA channel — the only option here
where same-day JS fixes are a supported product feature rather than a bolt-on. TypeScript end to
end, so `../contracts/openapi.yaml` generates types the app compiles against. The largest RN
community of any framework, and near-universal SDK support from the vendors this programme actually
uses (Firebase, Sentry, MoEngage/CleverTap, Google Maps). CNG keeps the native projects
regenerable, which is the difference between a two-hour and a two-week SDK upgrade.

**Against, stated plainly.** There is still a JS thread, and a badly written screen can jank in a
way Flutter's model makes harder. The New Architecture migration matrix means every native library
must be checked for Fabric support before adoption. App size starts higher than native. Debugging a
native crash crosses a language boundary.

**Why the "against" is survivable here.** The animation spec is intentionally quiet — no springs, no
parallax, nothing scaling on press — so the frame budget is not the constraint it would be in a
media or gaming app. Reanimated moves what animation there is off the JS thread entirely, and
FlashList removes the mount-per-row cost that produces most RN list jank.

### B. Flutter

**For.** The strongest option on C2 and C3. Its own rendering pipeline means no JS thread to starve
and no platform-widget approximation; a 531-variable design system with a bespoke hexagon shape and
inset-shadow borders maps cleanly onto its widget model, and implicit animations are excellent.
Impeller has closed most of the old first-frame shader-jank complaints. Hiring in India is viable.

**Against.** C1 is the decisive loss: there is no first-party code-push. Shorebird exists and works,
but it is a third-party paid service patching AOT-compiled native code — a materially different
risk and support posture from EAS Update, and one more vendor in the release path for a programme
whose users genuinely will not update. C7 is a second real loss: Dart cannot consume the OpenAPI
spec sitting one directory up in the same repository without a separate generator and a separate
type universe, so contract drift stops being a compile error. And every native SDK becomes "is
there a maintained Dart plugin?" — usually yes, sometimes a community wrapper.

**Verdict.** Close second. If OTA were not a requirement, or if this repo did not own the server
contract, Flutter would be the pick on rendering quality alone. Both conditions hold, so it is not.

### C. Kotlin Multiplatform + Compose Multiplatform

**For.** Shared business logic in Kotlin, best-in-class Android performance and native capability
access, and the most future-proof answer if HUMBEE ever needs the influencer domain logic inside a
different Android surface.

**Against.** iOS Compose is still the least mature of the cross-platform UI stories, the hiring pool
for KMP specifically is small in India, and no OTA path at all. It also front-loads the most
platform-specific work of any option, which is the wrong shape for a ten-screen v1 with one team.

### D. Fully native — Kotlin/Compose + Swift/SwiftUI

**For.** Wins C2, C3, C4, C9 outright. If the app were expected to live for a decade with a large
team, this is the defensible end state.

**Against.** Two codebases means two implementations of a ten-screen design system, two review
cycles for every copy change, roughly double the v1 cost, and no OTA. The handoff itself notes iOS
is for "the internal team" — so the second codebase would serve a handful of users. That is a poor
trade.

### E. Web app — PWA or Capacitor wrapper

**For.** Fastest to build, instant updates by definition, and the handoff's own §10 notes the design
translates directly to Next.js + Tailwind since it is already a mobile viewport in CSS.

**Against.** Scroll performance on the reference device is the real problem — there is no recycling
list equivalent, and the four list screens *are* this app. Two roadmap items are also outright
ceilings rather than slower paths: real-time camera frame processing, and any future high-frame-rate
custom canvas.

**This summary is too short, and the score below understates the web option.** A full evaluation —
Next.js vs Vite vs Ionic vs PWA vs Tauri, what Capacitor actually covers, and the two-day spike that
should settle the question empirically — is in **`14-web-stack-evaluation.md`**. Its conclusion:
Vite + React + Capacitor scores **149 against RN's 152**, the entire gap sits in one criterion (C2),
and Next.js specifically is the wrong web framework for a wrapper regardless.

## 2.3 Scored

Scores are 1–5. `Weighted` is the sum of score × weight from §2.1.

| Criterion (weight) | A. RN+Expo | B. Flutter | C. KMP | D. Native ×2 | E. Web |
| --- | --- | --- | --- | --- | --- |
| C1 OTA delivery (5) | 5 | 2 | 1 | 1 | 5 |
| C2 Low-end Android smoothness (5) | 4 | 5 | 5 | 5 | 2 |
| C3 Design fidelity (4) | 4 | 5 | 4 | 5 | 4 |
| C4 Native capabilities (4) | 4 | 4 | 5 | 5 | 1 |
| C5 India hiring + community (4) | 5 | 4 | 2 | 4 | 5 |
| C6 3-year maintainability (4) | 4 | 4 | 4 | 3 | 3 |
| C7 Shared types with this repo (3) | 5 | 2 | 2 | 1 | 5 |
| C8 Time to v1 (3) | 5 | 4 | 2 | 1 | 5 |
| C9 Size + cold start (3) | 3 | 4 | 4 | 5 | 4 |
| **Weighted total** | **152** | 133 | 114 | 119 | 129 |

The 19-point gap between A and B comes almost entirely from C1 and C7 — the two criteria that are
specific to *this* product and *this* repository. On the general-purpose criteria the two are within
noise of each other, which is why §2.2B is written as a genuine near-miss rather than a dismissal.

## 2.4 What would change the answer

Write these down now so the decision can be revisited on evidence rather than on mood.

1. **Reanimated cannot hold 60fps on the target device** after the Phase 0 spike in
   `12-implementation-roadmap.md`. Measure before building ten screens, not after.
2. **A future module needs a genuinely custom high-frame-rate canvas** — a live site-map with
   hundreds of animated markers, say. That is a Skia problem in RN and a native-strength problem in
   Flutter; re-open the comparison for that module specifically before assuming the whole app moves.
3. **Store policy on OTA changes.** C1 carries a weight of 5 on the assumption that EAS Update stays
   compliant. If that changed, the gap to Flutter closes to nothing.
4. **A web influencer portal becomes a first-class product.** Then a React-based shared component
   and token layer is worth more than it is today, which strengthens A further, not weakens it.
