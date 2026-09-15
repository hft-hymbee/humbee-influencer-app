# 14 — Web frameworks in a native wrapper: a full evaluation

`02-alternatives-considered.md` §2.2E dismissed the web option in a paragraph. That was too short for
a choice this consequential, and the dismissal was partly wrong: on a weighted score, **a web app in a
Capacitor shell finishes within a few points of React Native**, and it is the *fastest* option to a
high-fidelity v1. This document is the long version.

The short answer is at §14.9. The honest version of the recommendation is that the entire decision
reduces to **one empirical question that can be settled in two days** (§14.8).

---

## 14.1 First: Next.js is the wrong web framework for this

Worth separating from the web-vs-native question, because it is a common and expensive mistake.

Next.js's value is server-side: SSR, React Server Components, route handlers, ISR, streaming, the
image optimisation server, and SEO. **Inside a native wrapper, every one of those is unavailable or
pointless:**

| Next.js feature | Inside a Capacitor shell |
| --- | --- |
| SSR / RSC / streaming | Gone. There is no server; the app runs from `file://` or `https://localhost` on the device |
| Route handlers, middleware | Gone. Not exported by `output: 'export'` |
| ISR, revalidation | Gone |
| `next/image` optimisation | Degraded to plain `<img>` — the optimiser is a server |
| SEO, metadata, sitemaps | Irrelevant. Every screen is behind an OTP login |
| App Router layouts, file routing | Works, and is genuinely nice |

So `next build` with `output: 'export'` inside Capacitor gives you **a static React SPA with Next's
router and Next's build complexity, and none of Next's advantages**. You pay for the framework and use
the router.

If the decision goes web, use **Vite + React + TanStack Router** (or React Router). Faster builds,
smaller output, no dead SSR machinery, and no ongoing "which Next feature works in export mode"
research tax. Keep Next.js for an actual server-rendered surface — a VCP ops dashboard or a public
marketing site, where its strengths are real.

**And note what barely matters:** whether you pick React, Vue/Nuxt, Svelte or Solid inside the shell
changes almost nothing about the outcomes in this document. The wrapper and the WebView dominate; the
framework inside it is a rounding error. Do not spend a week on that comparison — spend it on §14.8.

## 14.2 The five web-family options, distinguished

These get conflated constantly and they have very different risk profiles.

| Option | What it is | Store presence | Native access |
| --- | --- | --- | --- |
| **A. Vite + React + Capacitor** | Web app bundled into a native shell, assets served locally | Yes, both stores | Via Capacitor plugins — real native code |
| **B. Next.js (static export) + Capacitor** | Same, with more build machinery | Yes | Same as A |
| **C. Ionic + Capacitor** | A, plus a mobile-idiomatic component library | Yes | Same as A |
| **D. Installable PWA, no wrapper** | Browser-installed, no store | No | Web APIs only |
| **E. Tauri v2 mobile** | Rust-backed shell instead of Capacitor | Yes | Via Tauri plugins — a much thinner ecosystem |

**D is the one to rule out first**, for reasons specific to this product rather than general PWA
scepticism:

- No Play Store presence. For a B2B loyalty programme where a VCP onboards the influencer and tells
  them to install the app, "search the Play Store for HUMBEE" is the whole distribution model. "Open
  this URL and add it to your home screen", given to a painter on a Redmi A3, loses users at step one.
- Push notifications on iOS PWAs are constrained and require a home-screen install first.
- **Storage eviction is a genuine risk here, unlike in the wrapper options.** Browser-origin storage
  can be evicted under storage pressure, and the reference devices are >80% full
  (`09-performance-budget.md` §9.1). An offline demand outbox the browser can garbage-collect is not
  an outbox. This concern does **not** apply to A/B/C — Capacitor storage lives in the app sandbox and
  persists like any app's data. Worth stating plainly, because the eviction objection gets misapplied
  to Capacitor constantly.

**E is too young for this.** Tauri v2 does support Android and iOS and the Rust core is appealing, but
the mobile plugin ecosystem is a fraction of Capacitor's. "Is there a maintained Tauri plugin for the
native Google Maps view / ML Kit barcode scanning / FCM?" is not a question you want to be asking on a
production B2B app. Revisit in a few years.

**C — Ionic** — fails the same test a React Native component library did in `01` §1.4: 531 final
design variables and a bespoke hexagon language mean every Ionic component gets overridden into
unrecognisability, and you inherit its DOM depth and CSS specificity for nothing. If web, go headless:
option A.

So the real contest is **A (Vite + React + Capacitor) vs React Native vs Flutter**.

## 14.3 Where web genuinely wins — and it wins bigger than §2.2E admitted

### Design fidelity: web is the best option available, not merely adequate

This deserves emphasis, because fidelity is the criterion the handoff cares most about (*"fidelity is
not negotiable"*) and web wins it outright. **The prototype is HTML/CSS.** Every construct in the spec
is a native CSS feature that RN and Flutter have to approximate:

| Design spec construct | Web | React Native |
| --- | --- | --- |
| `inset 0 0 0 1px #E5E5E5` borders | Native. Exactly as specified | No inset shadow. Approximated with `borderWidth`, with a 1px content-box shift on selection (`04` §4.4) |
| `clip-path: polygon(...)` hexagon | Native, one line | Requires `react-native-svg` clip paths |
| `backdrop-filter: blur(10px)` on the demand trail | Native | Requires a native blur library |
| `background-size: cover` | Native | `expo-image` `contentFit` |
| `background-position` shimmer | Native — the specified keyframe, verbatim | Must be re-implemented as a translated gradient band |
| `max-height` transition (`humbeeSlide`) | Native | No `max-height` animation; must measure height (`07` §7.2) |
| The two permitted gradients | Native | `expo-linear-gradient` |
| The 531-variable token export | **Drops in unchanged as CSS custom properties. No generator.** | Needs `scripts/gen-tokens.ts` (`04` §4.2) |
| Lato line-height 1.54 | Just works | `includeFontPadding: false` on every Text, or the vertical rhythm is off by 1–3px |

Every row in the right-hand column is a task in these documents. On web, most of them cease to exist.
The handoff's own §10 says as much: *"If the product must be a web app instead, use Next.js + Tailwind
with the tokens as CSS variables; the design is a mobile viewport and translates directly."*

### Time to v1: materially faster

Combine the above with the prototype's markup and CSS being a working structural reference, and a
realistic estimate is **30–45% less effort to reach the ten screens at pixel fidelity**. That is not a
small number on a project whose stated top priority is fidelity.

### OTA: as good as RN, arguably better

Web assets update trivially. Capacitor supports live updates; you can also load a remote bundle,
though bundling locally and updating on a schedule is the better trade — a remote-URL-only app both
hurts offline cold start and raises the App Store 4.2 question in §14.5.

### Shared types with this repo: identical to RN

`openapi-typescript` against `../contracts/openapi.yaml` works exactly the same. The whole co-location
advantage in `06` §6.1 is preserved. This is where web beats Flutter outright and matches RN.

### Hiring pool: the largest of any option

Web React developers substantially outnumber RN developers, and they overlap with whoever would build
a VCP web dashboard.

## 14.4 Where web loses — and one of these is decisive

### Scroll performance on the reference device: the whole ballgame

This app is four list screens — Leaderboard, My Demands, Inventory Allocated, Rewards — plus Home. The
reference device is a 2–3 GB entry-level Android with an OEM skin already resident
(`09-performance-budget.md` §9.1). The budget is **58+ fps average with zero frames over 32ms**.

The honest position, without dogma in either direction:

- **The WebView is modern.** Android System WebView is Chromium and updates through the Play Store, so
  even an Android 11 device has a recent engine. This is not 2015, and arguments from that era should
  be discarded.
- **DOM list scrolling is still the weak spot.** There is no FlashList equivalent. TanStack Virtual or
  react-virtuoso do windowing well, but momentum scroll plus repaint across a card with a border, a
  shadow, a hex-clipped avatar and an entry-animating progress bar is more work per frame than a
  recycled native row — and it lands on the same single JS thread that is doing the filtering.
- **Memory pressure compounds it.** A WebView instance carries roughly 50–100 MB of overhead before
  your app's own heap. On a 2 GB device with an OEM skin, that raises the chance the OS kills the app
  in the background, which means **more cold starts** — and a cold start is the most expensive thing
  in the app.
- **Fragmentation is a real debugging tax.** "Janks on Realme, fine on Samsung" is a WebView-version
  and OEM-compositor problem, and an unpleasant class of bug to chase.

I am not claiming this cannot be made to work. With virtualization, `content-visibility`,
transform-only animations and disciplined DOM depth, a competent team can get close. The claim is
narrower: **it is the highest-variance risk in the web option, it lands squarely on the screens that
are this app, and it is cheap to measure before committing** (§14.8).

### Cold start

Capacitor serves assets locally, so there is no network on the critical path — that helps a lot. But
there is no Hermes-equivalent bytecode precompilation: the JS is parsed and compiled on every cold
start, then the DOM is built and styles computed. A realistic range on the reference device is
**1.2–2.5s to first meaningful paint** against a budget of <2.0s. Achievable, with less headroom than
RN, and it degrades faster as the bundle grows.

### The native roadmap: adequate today, a hard ceiling tomorrow

Capacitor covers more than sceptics assume. Against your named list specifically:

| Named requirement | Capacitor answer | Verdict |
| --- | --- | --- |
| **Google Maps** | `@capacitor/google-maps` renders the **real native map view**, composited with the WebView — not an iframe, not a JS map | **Good.** Genuinely close to RN quality. Some awkwardness composing native views with DOM overlays |
| **Camera — photo capture** | `@capacitor/camera` | **Fine.** Covers proof-of-delivery photos entirely |
| **Camera — barcode/QR on a bag tag** | `@capacitor-mlkit/barcode-scanning` (real ML Kit) | **Good** |
| **Camera — real-time frame processing, OCR of a VCP invoice** | No equivalent of VisionCamera frame processors | **Cannot.** A ceiling, not a slower path |
| **High-performance animation** | CSS transitions and keyframes are GPU-composited and handle *this* spec well — it is opacity, transform and colour | **Fine for v1.** But a future custom canvas (animated charts, a map with hundreds of live markers) means WebGL in a WebView on a 2 GB device, materially worse than Skia or Reanimated |
| **Analytics** | Firebase / PostHog web SDKs, or Capacitor plugins over the native SDKs | **Fine.** The facade in `08` §8.4 is unchanged |
| **Push notifications** | `@capacitor/push-notifications` over FCM/APNs — real native push | **Fine** |
| **New industry modules** | Server-driven catalog, identical to `08` §8.6 | **Fine** |
| **OTP autofill — Android SMS Retriever** | The WebOTP API needs an https origin bound to the SMS body and does not map cleanly onto a wrapper's origin; the reliable route is a native plugin | **Awkward.** A concrete regression on the app's login screen, which QA lists as a v1 requirement |
| **Secure token storage** | `@capacitor/preferences` is **not** encrypted; needs a Keychain/Keystore plugin | **Requires care.** Handoff §06 forbids plain storage, so this must be solved deliberately rather than assumed |

Two of those matter more than the rest: **frame processors are a hard no**, and **OTP autofill, a v1
requirement, gets harder**.

### Weighted scores flatten veto conditions

Read §14.6 with this caveat. A score of 3 on "native capabilities" reads as "somewhat worse", but the
underlying reality is a mix of "equally good" and "impossible". If real-time frame processing becomes a
requirement, no amount of strength elsewhere compensates. Scores compare similar things; vetoes have
to be checked separately.

## 14.5 Store review

Proportionate rather than alarmist, because this objection is usually overstated:

- **Android:** no meaningful risk. Google does not object to WebView-based apps.
- **iOS:** guideline 4.2 (minimum functionality) is used against apps that are a thin wrapper around a
  website. A Capacitor app with **bundled offline assets and real native integrations** — push,
  camera, maps, Keychain — is not what 4.2 targets and routinely passes. An app that merely loads a
  remote URL is at genuine risk.
- Practical consequence: **bundle the assets, ship real native plugins, do not build a remote-URL
  shell.** That is also the better engineering choice for offline behaviour.

Given the handoff notes iOS is mainly for "the internal team", this is low-stakes here regardless.

## 14.6 Scored against the same weights

Same criteria and weights as `02-alternatives-considered.md` §2.1, so the numbers are directly
comparable. Weights: C1 OTA 5 · C2 low-end smoothness 5 · C3 fidelity 4 · C4 native capabilities 4 ·
C5 hiring 4 · C6 maintainability 4 · C7 shared types 3 · C8 time to v1 3 · C9 size and cold start 3.

| Criterion (weight) | RN + Expo | Flutter | **Vite+React +Capacitor** | Next.js +Capacitor | PWA only |
| --- | --- | --- | --- | --- | --- |
| C1 OTA delivery (5) | 5 | 2 | 5 | 5 | 5 |
| C2 Low-end Android smoothness (5) | 4 | 5 | **2** | 2 | 2 |
| C3 Design fidelity (4) | 4 | 5 | **5** | 5 | 5 |
| C4 Native capabilities (4) | 4 | 4 | **3** | 3 | 1 |
| C5 India hiring + community (4) | 5 | 4 | **5** | 5 | 5 |
| C6 3-year maintainability (4) | 4 | 4 | **5** | 4 | 5 |
| C7 Shared types with this repo (3) | 5 | 2 | **5** | 5 | 5 |
| C8 Time to v1 (3) | 5 | 4 | **5** | 4 | 5 |
| C9 Size + cold start (3) | 3 | 4 | **4** | 3 | 5 |
| **Weighted total** | **152** | 133 | **149** | 142 | 144 |

Read that carefully. **Vite + React + Capacitor scores 149 against React Native's 152** — inside the
noise of the weighting itself. And note where the whole gap lives: C2, low-end Android smoothness,
where RN scores 4 and web scores 2. On a weight of 5 that single criterion is a 10-point swing, and
every other criterion nets out roughly even.

Which means the framework debate here is one measurable question, not a matter of taste.

## 14.7 What the score does not capture

Three things, all favouring RN, none of which fit a weighted table:

1. **The ceilings in §14.4.** Frame processors and a future high-frame-rate canvas are "cannot", not
   "worse".
2. **Variance.** RN's C2 score of 4 is fairly predictable. Web's 2 could be a 3 with excellent
   engineering discipline, or a 1 on a Unisoc device under a heavy OEM skin. Choosing the
   higher-variance option for the *core screens of the app* is a different bet than the average
   suggests.
3. **The direction of travel.** Every item on your stated roadmap — maps, camera, high-performance
   animation, new native-feeling modules — moves toward native strengths. Optimising v1 delivery speed
   at the cost of the roadmap's ceiling is the trade being made, and it should be made knowingly.

And one thing the score does not capture that favours **web**: if a VCP-facing dashboard or an
influencer web portal is coming, a React web codebase shares components with it directly. RN's answer
to that is `react-native-web`, which works but is a second rendering target to maintain.

## 14.8 The two-day spike that settles it

Do not decide this from documents — including this one. The disagreement is empirical and narrow.

**Build the Leaderboard screen twice**, once in each candidate, and measure on the reference device.
Leaderboard is the right screen because it is the heaviest: a gradient podium panel with three SVG
medals, hex-clipped avatars, a sticky footer card over a gradient fade, forty rows each with a
progress bar animating on entry, a horizontally scrolling tab bar, and a 25-bar shimmer skeleton.

| Step | Detail |
| --- | --- |
| 1 | Get two reference devices (`09` §9.1) — Redmi A3 class, 2–3 GB RAM, OEM skin intact, storage >80% full |
| 2 | Implement Leaderboard in **Vite + React + Capacitor**: virtualized list, transform-only animations, real card chrome |
| 3 | Implement Leaderboard in **RN + Expo**: FlashList, Reanimated |
| 4 | Feed both from `../contracts/examples/leaderboard.json`, padded to ~200 rows |
| 5 | Measure, three runs each: cold start to first skeleton frame; a fixed 5-second swipe via `adb shell dumpsys gfxinfo <pkg> framestats`; peak RSS; tab-switch-to-content on cached data |
| 6 | Compare against `09` §9.2, and eyeball the shimmer and the progress-bar fills side by side with the prototype |

**Decision rule, written before the measurement so it cannot be rationalised afterwards:**

- Web holds **58+ fps average with zero frames over 32ms** → the web option is live, and the fidelity
  and speed advantages in §14.3 become the deciding factors. Take it, with the §14.4 ceilings recorded
  as accepted risks.
- Web lands in **50–58 fps, or shows occasional frames over 32ms** → RN. A marginal core screen on day
  one becomes an unacceptable one after two years of feature accretion.
- Web is **below 50 fps** → RN or Flutter, and the question is closed.

Two days, and the most contested decision on the project turns from opinion into a number.

## 14.9 Recommendation

**React Native + Expo remains the recommendation**, but for narrower and more honest reasons than
`02` §2.2E implied:

1. **On paper the web option is nearly equal (149 vs 152)** and is genuinely *better* on design
   fidelity, time to v1, and — if a web portal is coming — code sharing. Anyone dismissing it out of
   hand has not looked at the numbers.
2. **The gap is concentrated in one criterion**: scroll smoothness on entry-level Android, on the four
   list screens that *are* this app.
3. **Two roadmap items are ceilings, not slopes**: real-time camera frame processing, and any future
   high-frame-rate custom canvas.
4. **RN keeps the web option's best properties anyway** — OTA delivery, and TypeScript types generated
   from the OpenAPI spec in this repo. Web wins nothing on C1 or C7; it wins C3 and C8, loses C2 and C4.

**If Next.js specifically was the plan, drop that part regardless of the outcome.** Inside a wrapper it
is a static SPA with extra steps (§14.1). Use Vite + React if you go web; save Next.js for a real
server-rendered surface such as a VCP dashboard.

**When web is the right call** — stated plainly, because these conditions are not far-fetched:

- The timeline is the binding constraint, and a fast, pixel-exact v1 matters more than the roadmap's
  ceiling.
- The maps/camera/animation roadmap is genuinely aspirational rather than committed.
- A VCP or influencer **web** surface is definitely coming, making a shared React codebase worth real
  money.
- And the §14.8 spike clears 58 fps.

Under those four conditions, Vite + React + Capacitor is a defensible, professional choice for this
app — not a compromise to be embarrassed by. Absent them, RN's slightly higher score plus its much
lower variance and higher ceiling is the better bet.

**A genuinely bad idea, for completeness:** building it web-first *intending* to rewrite native later.
The rewrite never gets funded, and you end up maintaining the higher-variance option permanently
without ever having chosen it. Pick one, on the spike result, and commit.
