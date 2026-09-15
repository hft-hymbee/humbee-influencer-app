# 07 — Framework Comparison Report: React Native CLI vs Next.js + Capacitor

**Question asked.** Build the Influencer app as **React Native (CLI)**, or as **Next.js wrapped in
Capacitor** — or is there a better tool? Judged on scalability, advanced features (maps, geofencing,
charts, animations), user-journey tracking and analytics, a userbase of up to **5 lakh**, and
performance.

**Answer, up front.**

> **Build it in React Native.** It wins on the three criteria that behave as *thresholds* rather than
> as slopes — render performance on the device this audience owns, stability across the Android long
> tail at 5 lakh users, and OS-level background capability (geofencing is the clearest example).
>
> Two qualifications, and both matter more than the headline:
>
> 1. **If you go web anyway, do not use Next.js.** Inside Capacitor every feature you pay Next.js for
>    is inert (§4). Vite + React + Capacitor is the strictly better web build, and it scores **higher
>    than RN CLI on points** (241 vs 238). The web family is competitive here, not a compromise.
> 2. **Within React Native, the CLI is not the strongest option — Expo CNG is** (250 vs 238, §8).
>    The RN CLI constraint costs roughly 12 points, almost all of it OTA capability and RN upgrade
>    cost. If the CLI decision was taken because the team already runs bare RN on `humbee-mobile-app`,
>    that is sound. **If it was taken because native integrations would be hard on Expo, that reason is
>    outdated** — CNG has no native ceiling (`01-architecture.md` ADR-001 itemises it).

This document shows the work: what the app actually is (§1), the criteria and their weights (§2), each
option in detail (§3–§7), the scoring (§8), what the score cannot express (§9), and the two-day
measurement that should settle it empirically (§11).

---

## 1. What this app actually is

Tooling follows workload. From `08-screen-inventory.md`, the design handoff, and
`humbee_influencer_backend/`:

| Fact | Consequence for this decision |
| --- | --- |
| **12 screens in v1.** Nine read screens, one multi-step form (Capture Demand), two auth screens | Small surface. Time-to-v1 differences are measured in weeks, not quarters |
| **Five of them are lists** — Leaderboard, My Demands, Inventory Allocated, Rewards, Home | Scroll performance is not a detail. It **is** the app |
| **Read-heavy.** Lists filtered on two axes (manufacturer × period), ~10 requests per field session | Caching model matters more than rendering throughput |
| **531 final design variables**, authored as HTML/CSS. Inset-shadow borders, a hexagon `clip-path`, a `backdrop-filter` blur, a `max-height` transition | Every one of these is native CSS and an approximation in RN. Fidelity favours web — see §5 |
| **Restrained motion.** 120ms colour, 200ms position, 400ms fill, one 420ms carousel, one shimmer. No spring, no bounce, nothing scales on press | The animation workload does not discriminate between the options. CSS handles it; so does Reanimated |
| **Hostile runtime.** Android-first, ₹8,000–₹12,000 devices, 2–3 GB RAM, storage >80% full, intermittent 4G, outdoors | The single most discriminating fact in this document |
| **Up to 5 lakh users** on the Indian entry-level Android long tail | Turns device fragmentation from an annoyance into an operating cost — see §10 |
| **Users do not update apps.** Onboarded by a VCP, low literacy, cheap data | Over-the-air fix delivery is a product requirement, not developer convenience |
| **Named future work:** maps, geofencing, charts, analytics, further industry modules | Where the ceilings are — see §6 |

Two of those deserve emphasis because they are the ones that decide the outcome: **five list screens on
a 2 GB device**, and **geofencing**.

---

## 2. Criteria and weights

Weights come from the product facts in §1, not from taste. `5` = would sink the product; `3` = real
ongoing cost; `2` = noticeable.

| # | Criterion | Weight | Why this weight |
| --- | --- | --- | --- |
| C1 | Scroll and render performance on 2–3 GB Android | **5** | Five list screens on the device the audience owns. Not an edge case — it is the case |
| C2 | Stability at 5 lakh users across the Android long tail | **5** | OOM kills, ANRs and WebView fragmentation become a support and Play-vitals problem at scale (§10) |
| C3 | Same-day fix delivery without a store release | **5** | The audience will not update. A wrong points figure would otherwise persist for weeks |
| C4 | Fidelity to the 531-variable design spec | 4 | "Fidelity is not negotiable" — handoff `CLAUDE.md` rule 2 |
| C5 | **OS-level background capability** — geofencing, background location, SMS retriever, push | 4 | Named roadmap work, and the hardest thing to retrofit. Distinct from C6 |
| C6 | Foreground native features — maps, camera | 3 | Named roadmap work, but both options can do it |
| C7 | Charts and data visualisation | 3 | Named roadmap work; a manufacturer analytics surface is planned |
| C8 | Animation, **for this spec specifically** | 2 | Low weight deliberately: the spec is quiet enough that this barely discriminates |
| C9 | Analytics and install attribution fidelity | 3 | Needed for the KPIs, and VCP-referred installs need attribution |
| C10 | User-journey tracking / session replay | 3 | Disproportionately valuable for a low-literacy audience you cannot interview at scale |
| C11 | Codebase scalability — screens, modules, team | 4 | Further industry modules are planned; this app will outlive its first team |
| C12 | India hiring pool and community depth | 4 | Team continuity over years |
| C13 | Shared types with `contracts/openapi.yaml` | 3 | The contract is generated; drift should be a compile error |
| C14 | Time to a shippable v1 | 3 | 12 screens, one team |
| C15 | 3-year maintainability and upgrade cost | 4 | Mobile codebases die of upgrade debt, not of bad architecture |
| C16 | APK size and cold start | 3 | Play Store install conversion on cheap data plans |
| C17 | Reuse with the planned manufacturer web dashboard | 3 | A Next.js SaaS surface for manufacturers is planned (`archive/superseded-frontend-plan/15`) |

Total weight **61**; maximum score **305**.

---

## 3. Option A — React Native CLI

`react-native` on the New Architecture (Fabric + TurboModules + Bridgeless), Hermes, React Navigation,
with `expo-modules-core` and `expo-updates` installed into the bare project.

**For.**

- **Rendering is yours, not the OEM's.** RN draws real platform views through its own renderer. There is
  no WebView version, no OEM compositor, and no Chromium update in your dependency graph. At 5 lakh
  users across the Indian device long tail this is the highest-value property RN has (§10).
- **FlashList recycling.** Five list screens; recycling instead of mount-per-row is the single largest
  scroll-jank win available on a 2 GB device. There is no DOM equivalent — virtualization windows the
  list but still constructs and paints real DOM nodes per row.
- **Hermes bytecode.** JS is precompiled, so cold start does not pay parse-and-compile. Smaller heap,
  which matters when the OS is deciding what to kill.
- **Unrestricted native access.** Any native SDK, any background API, no waiting for a plugin. This is
  where geofencing lives (§6.2).
- **Native analytics SDKs.** Real install attribution, Play install-referrer, campaign attribution, and
  crash-free-session correlation against OTA release channels (§6.5).
- **TypeScript end to end**, so `contracts/openapi.yaml` generates types the app compiles against.
- **Owning `android/` and `ios/` outright** gives direct control over native assets and build variants,
  and keeps the toolchain identical to `humbee-mobile-app`, which the team already runs.

**Against, stated plainly.**

- **There is still a JS thread**, and a badly written screen can jank in a way Flutter's model makes
  harder.
- **The design spec fights the platform.** Inset-shadow borders, `clip-path`, `backdrop-filter` and
  `max-height` transitions are all native CSS and all approximations in RN. Each is a task; see §5.
- **OTA is not free on the CLI.** This is the important one — see below.
- **The upgrade treadmill is real.** With checked-in native projects, an RN bump is a manual three-way
  merge across `android/`, `ios/`, Gradle and the Podfile — and white-label flavors multiply that
  surface. Budget roughly one engineer-week per RN minor upgrade, twice a year, and **name the owner**.
- **Charts are the weak spot.** `victory-native`, `gifted-charts` and `react-native-skia` are all
  usable and all a step below the DOM/SVG charting ecosystem (§6.4).
- **Session replay is genuinely worse** than web's (§6.6).

**The OTA caveat, because it is load-bearing.** Same-day fix delivery carries weight 5 and is a large
part of why RN beats Flutter at all. Bare RN does not ship it: `expo-updates` must be installed into the
CLI project (supported in bare RN, and works with EAS Update without adopting Expo Go, Expo Router or
the managed workflow), or CodePush must be self-hosted — note that App Center's retirement took the
hosted CodePush service with it. **Decide and prove this in Phase 0, before the first screen.** Score
C3 as 4, not 5, because it is a task rather than a given; an RN CLI project with no OTA plan scores 1
there and loses to every option in this document.

---

## 4. Option B — Next.js (static export) + Capacitor

**This is the option to rule out first, and not because it is a web app.** It is the weakest member of
the web family, and the reason is worth separating from the web-vs-native question because the mistake
is common and expensive.

Next.js's value is server-side. Inside a Capacitor shell there is no server — the app runs from
`file://` or `https://localhost` on the device:

| Next.js feature | Inside Capacitor |
| --- | --- |
| SSR, React Server Components, streaming | **Gone.** No server exists |
| Route handlers, middleware, server actions | **Gone.** Not emitted by `output: 'export'` |
| ISR, revalidation, caching | **Gone** |
| `next/image` optimisation | **Degraded** to a plain `<img>` — the optimiser is a server |
| SEO, metadata, sitemaps | **Irrelevant.** Every screen is behind an OTP login |
| App Router layouts and file routing | Works, and is genuinely pleasant |

So `next build && next export` in Capacitor yields **a static React SPA carrying Next's router and
Next's build complexity, with none of Next's advantages** — plus an ongoing "which Next feature works
in export mode" research tax on every upgrade. You pay for the framework and use the router.

**If the decision goes web, use Vite + React + TanStack Router** (Option B′): faster builds, smaller
output, no dead SSR machinery, no export-mode tax. It scores 7 points higher than the Next.js variant
purely on time-to-v1 and maintainability, and it is otherwise identical.

**Keep Next.js for the surface where it earns its keep** — the planned manufacturer SaaS dashboard,
where subdomain tenant routing in middleware, SSR'd data tables, server-side per-tenant theming, CSV
export and public marketing pages are exactly its strengths. Recommending against Next.js *in a mobile
wrapper* and for it *on the web dashboard* is not a contradiction; they are different problems.

**What the web family gets right, and it is more than sceptics admit** — covered in §5 and §6.4/§6.6,
because two of these are genuine advantages RN has to compensate for.

**Also ruled out, briefly:**

- **Installable PWA, no wrapper.** No Play Store presence, and "search the Play Store for HUMBEE" is the
  entire distribution model when a VCP onboards a painter. Browser-origin storage can also be evicted
  under pressure on devices that are >80% full — an offline demand outbox the browser may garbage-collect
  is not an outbox. (This objection does *not* apply to Capacitor, whose storage lives in the app sandbox.)
- **Ionic + Capacitor.** 531 final design variables and a bespoke hexagon language mean every Ionic
  component is overridden into unrecognisability, and you inherit its DOM depth and CSS specificity for
  nothing. If web, go headless.
- **Tauri v2 mobile.** The Rust core is appealing and the mobile plugin ecosystem is a fraction of
  Capacitor's. "Is there a maintained Tauri plugin for native Google Maps / ML Kit / FCM / geofencing?"
  is not a question to be asking on a production B2B app. Revisit in a few years.

---

## 5. Design fidelity — where web wins outright

Worth its own section because fidelity is the criterion the handoff cares most about, and **web wins it,
rather than merely surviving it**. The prototype *is* HTML and CSS. Every construct in the spec is a
native CSS feature that RN has to approximate:

| Design spec construct | Web | React Native |
| --- | --- | --- |
| `inset 0 0 0 1px #E5E5E5` borders (all card chrome) | Native, exactly as specified | No inset shadow. Approximated with `borderWidth`, with a 1px content-box shift on selection |
| `clip-path: polygon(...)` hexagon — the brand shape, on 10 element types | Native, one line | `react-native-svg` clip paths per element |
| `backdrop-filter: blur(10px)` on the demand trail | Native | Needs a native blur library |
| `max-height` transition (`humbeeSlide`) | Native | No `max-height` animation; must measure height at runtime |
| `background-position` shimmer skeleton | Native — the specified keyframe verbatim | Re-implemented as a translated gradient band |
| `background-size: cover` | Native | `expo-image` `contentFit` |
| The two permitted gradients | Native | `expo-linear-gradient` |
| Lato line-height 1.54 | Just works | `includeFontPadding: false` on every `Text`, or vertical rhythm is off by 1–3px |
| **The 531-variable token export** | **Drops in unchanged as CSS custom properties. No generator** | Needs a token generator and a typed module |

Every cell in the right-hand column is a task in the RN plan. On web most of them cease to exist. Add
that the prototype's markup and CSS are a working structural reference, and a realistic estimate is
**30–45% less effort to reach 12 screens at pixel fidelity on web.**

That is not a small number, and it is the strongest honest argument for the web option. It is also why
C4 scores 5 for web and 4 for RN, and why C14 (time to v1) favours web.

---

## 6. The advanced features, one at a time

### 6.1 Maps

| | RN CLI | Next/Vite + Capacitor |
| --- | --- | --- |
| Implementation | `react-native-maps`, Google provider on both platforms | `@capacitor/google-maps` |
| What renders | A real native map view **inside the RN view tree** | A real native map view **composited behind/above the WebView** — not an iframe, not a JS map |
| Overlays (bottom sheets, custom callouts, filter chips over the map) | Compose naturally; the map is just another view | **Awkward.** The native view and the DOM are separate layers; z-ordering and hit-testing against DOM overlays is a known friction point |
| Verdict | **5** | **3** — genuinely close on map quality, meaningfully worse on composition |

Capacitor's map story is better than sceptics assume. The gap is not the map; it is everything you want
to draw on top of it.

### 6.2 Geofencing — the clearest veto in this document

This is the feature that separates the options most sharply, and it is worth being precise because
"geolocation" and "geofencing" get conflated.

**Geolocation** is "where am I now", while the app is open. Both options do it fine: the browser
Geolocation API works in a WebView, and `@capacitor/geolocation` wraps the native provider.

**Geofencing** is different in kind: you register circular regions with the OS, and **the OS wakes your
app when the device crosses one — including when the app is not running and the screen is off.** On
Android that is `GeofencingClient` delivering an intent to a receiver; on iOS, `CLCircularRegion`
monitoring relaunching the app in the background.

| | RN CLI | Capacitor (either web framework) |
| --- | --- | --- |
| Register OS geofences | Yes — direct native module access; mature libraries exist, including `react-native-background-geolocation` (commercial, and the reference implementation in this space) | Only via a plugin. `@capacitor/geolocation` does **not** do geofencing. The credible option is the same vendor's Capacitor build, plus `@capacitor-community/background-geolocation` for foreground-service tracking, which is a different thing |
| **Respond while the app is killed** | Yes — Headless JS on Android, background launch on iOS | **This is the hard part.** The WebView is the runtime. If the WebView is not alive there is no JS to run, so the plugin must either buffer events natively and replay them when the app next opens, or hold a foreground service to keep the process alive — visible to the user as a persistent notification, and a battery and Play-policy conversation |
| Battery and policy tuning at 5 lakh devices | Direct control over accuracy, intervals and OS-level fencing | Constrained to what the plugin exposes |
| Verdict | **5** | **2** |

If geofencing means "log a visit when the influencer is at a VCP shop, whether or not the app is open",
that is a background-execution problem and RN is materially the right tool. If it means "check the
influencer's location when they tap Submit on a demand", both options are fine and this section does not
apply.

**Flagged honestly: geofencing does not appear in `00-PRD.md`, in the design handoff, or in the
backend contract.** It arrived in the framework question. Since it is the strongest single argument in
RN's favour, please confirm the requirement and which of the two readings above you mean — the answer
changes C5 from a veto into a tie. It is captured in `06-inputs-needed.md`.

### 6.3 Animation — a genuine tie, and it favours web slightly

The design spec is deliberately quiet: 120ms colour, 200ms position, 400ms progress fill, a 420ms
carousel, a shimmer, and a `max-height` disclosure. Nothing springs, bounces or scales on press.

- **Web:** CSS transitions and keyframes on `opacity`, `transform` and colour are GPU-composited. The
  spec's keyframes drop in verbatim, `max-height` included.
- **RN:** every keyframe maps to a Reanimated worklet running on the UI thread, off the JS thread. That
  is a correct and performant answer, but it is *re-implementation*, and `max-height` needs runtime
  measurement.

Web scores 5, RN 4, and C8 is weighted 2 precisely because this is not where the decision lives. **The
usual "Flutter and native animate more smoothly" argument has much less force against a spec this
restrained** — which is also why Flutter's rendering advantage buys it less here than it would in a
media app.

Where it flips: any *future* high-frame-rate custom canvas — an animated analytics surface, a live site
map with hundreds of moving markers — is a Skia problem in RN and a WebGL-in-a-WebView-on-a-2 GB-device
problem on web. That is a ceiling, not a slope.

### 6.4 Charts and graphs — web wins, and it is a real loss for RN

| | RN CLI | Capacitor |
| --- | --- | --- |
| Ecosystem | `victory-native` (Skia), `react-native-gifted-charts`, `react-native-skia` for bespoke work | D3, Recharts, ECharts, visx, Observable Plot — the deepest data-visualisation ecosystem in software |
| Interaction (hover, brush, crossfilter, tooltips, keyboard) | Hand-built | Largely solved |
| Accessibility of a chart | Hand-built | SVG semantics, real focus order |
| Verdict | **3** | **5** |

If the roadmap's analytics ambitions are significant, this is a genuine ongoing tax on RN. Two
mitigations, in preference order: put the heavy analytics on the **Next.js manufacturer dashboard**,
where the whole ecosystem is available and the audience is at a desk anyway; and keep in-app charts to
the simple bar and progress forms the design actually specifies.

### 6.5 Analytics and attribution

Both options can call any analytics provider. The difference is in what the platform will tell you.

| | RN CLI | Capacitor |
| --- | --- | --- |
| SDK | Native Firebase / CleverTap / MoEngage SDK | `@capacitor-firebase/*` over the native SDK, or the web SDK inside the WebView |
| Automatic screen and session tracking | Native, consistent with Play Console | Manual instrumentation; web-SDK sessions do not match native semantics |
| **Play install-referrer and campaign attribution** | Yes | Only via the native plugin path — and this is the one to get right, because VCP-referred installs are the distribution model |
| Crash-free sessions correlated to OTA release channel | Sentry understands RN release channels and sourcemaps | Workable, less mature |
| Verdict | **5** | **3** |

Whichever is chosen: call `track('demand_submitted', {...})` through a **facade** with a typed event
catalogue, never a vendor SDK from a screen. At 5 lakh users the vendor will be renegotiated or replaced,
and the event taxonomy has to survive that.

### 6.6 User-journey tracking — web wins, and this one should sting

RN's weakest criterion, and the one where the web advantage is most likely to be underestimated.

The audience is low-literacy trade professionals who will not answer an in-app survey and cannot easily
be brought into a usability lab. **Watching where they actually get stuck is worth a great deal** — and
DOM-based session replay (PostHog, Microsoft Clarity, LogRocket) does exactly that: replays the real
session, with rage-click and dead-click detection, essentially for free, because the DOM is already a
serialisable description of the screen.

React Native has no equivalent of comparable maturity. PostHog's RN replay and the commercial mobile
replay products exist and are improving, and they are a step behind: heavier, less faithful, and more
invasive to instrument.

RN scores 2, web 5. Mitigation if RN is chosen — and please treat this as part of the decision, not an
afterthought:

1. Instrument **explicit funnels** on the Capture Demand flow (industry → sub-industry → manufacturer →
   SKU → quantity → submit), with drop-off and time-per-step per language. That flow is where the
   business value and the confusion both live.
2. Run a **moderated cohort** — the delivery plan already recruits 20–30 influencers through a friendly
   distributor. Ten screen-recorded sessions with real users beat a thousand replays nobody watches.
3. Track error and retry events as first-class analytics, not just logs.

### 6.7 OTP autofill — a small, concrete v1 regression on web

Android's SMS Retriever API fills the OTP without the user reading it — worth real completion rate on
this audience, and a v1 QA requirement. The WebOTP API needs an https origin bound to the SMS body,
which does not map cleanly onto a wrapper's origin, so the reliable route on Capacitor is a native
plugin. On RN it is a native module and a solved problem. Minor, but it lands on the login screen, which
every user meets.

### 6.8 Secure token storage

The handoff forbids plain storage for tokens. RN: `expo-secure-store` over Keychain and
EncryptedSharedPreferences. Capacitor: `@capacitor/preferences` is **not** encrypted — a Keychain/Keystore
plugin is required. Solvable on both; a deliberate task on web rather than a default.

---

## 7. Option C — Flutter, and why it is out

Included because it is the obvious "better tool" candidate and because it genuinely wins on rendering.

**For.** Its own rendering pipeline: no JS thread to starve, no platform-widget approximation. Impeller
has closed most of the old shader-jank complaints. A 531-variable system with a bespoke hexagon shape
maps cleanly onto the widget model, and implicit animations are excellent. Hiring in India is viable.

**Against, and it is decisive on two counts.**

1. **No first-party OTA.** Shorebird exists and works, and it is a third-party paid service patching
   AOT-compiled native code — a materially different risk posture from a first-party update channel, and
   one more vendor in the release path for a programme whose users genuinely will not update.
2. **Dart shares nothing with the rest of the platform.** `contracts/openapi.yaml` needs a second
   generator and a second type universe, so contract drift stops being a compile error. The planned
   Next.js manufacturer dashboard shares no tokens, no domain logic, no i18n catalogue and no API client
   with a Dart app — every domain rule gets implemented twice. C13 scores 2 and C17 scores 1.

**Verdict: 225.** Close on the general-purpose criteria, and out on the two that are specific to *this*
platform. Flutter is a fine framework and it is the wrong one here. Were OTA not a requirement and were
there no TypeScript web surface, it would be the pick on rendering quality alone.

---

## 8. Scored

Scores 1–5 against §2. `Weighted` is score × weight, summed. Max 305.

| Criterion (weight) | **A. RN CLI** | B. Next.js + Capacitor | B′. Vite + React + Capacitor | C. Flutter | *Ref: Expo CNG* |
| --- | --- | --- | --- | --- | --- |
| C1 Low-end Android performance (5) | 4 | **2** | **2** | 5 | 4 |
| C2 Stability at 5 lakh users (5) | 4 | **2** | **2** | 5 | 4 |
| C3 OTA delivery (5) | **4** | 5 | 5 | 2 | **5** |
| C4 Design fidelity (4) | 4 | **5** | **5** | 5 | 4 |
| C5 Background native / geofencing (4) | **5** | **2** | **2** | 4 | 5 |
| C6 Maps, camera (3) | 5 | 3 | 3 | 4 | 5 |
| C7 Charts (3) | **3** | **5** | **5** | 4 | 3 |
| C8 Animation, this spec (2) | 4 | 5 | 5 | 5 | 4 |
| C9 Analytics + attribution (3) | 5 | 3 | 3 | 4 | 5 |
| C10 Journey tracking / replay (3) | **2** | **5** | **5** | 2 | 2 |
| C11 Codebase scalability (4) | 4 | 4 | 4 | 4 | 4 |
| C12 India hiring (4) | 4 | 5 | 5 | 3 | 4 |
| C13 Shared types with the contract (3) | 5 | 5 | 5 | **2** | 5 |
| C14 Time to v1 (3) | 3 | 4 | **5** | 4 | 4 |
| C15 3-year maintainability (4) | **3** | 4 | **5** | 4 | **4** |
| C16 Size + cold start (3) | 3 | 3 | 3 | 4 | 3 |
| C17 Reuse with the web dashboard (3) | 4 | 5 | 5 | **1** | 4 |
| **Weighted total (max 305)** | **238** | **234** | **241** | **225** | **250** |

Four things to read out of that table, none of them the comfortable answer:

1. **Next.js + Capacitor scores 234 against RN CLI's 238.** Four points. Anyone dismissing the web
   option out of hand has not done the arithmetic — and anyone choosing *Next.js* for it has picked the
   weakest member of its own family (§4).
2. **Vite + React + Capacitor scores 241 and edges out RN CLI.** The web option is not the compromise
   it is usually assumed to be. §9 explains why it still loses.
3. **Expo CNG scores 250 — the highest of any option**, entirely on C3, C14 and C15: OTA that works out
   of the box, and regenerable native projects that turn an SDK upgrade into a regenerate rather than a
   three-way merge. The RN CLI constraint costs ~12 points.
4. **Flutter drops to 225** on C13 and C17 — the criteria specific to this platform, not general ones.

---

## 9. Why React Native still wins on a near-tie

Because **C1, C2 and C5 are thresholds, not slopes,** and a weighted average cannot express a threshold.

- **C1.** Below roughly 58 fps on the Leaderboard and Rewards lists, the product is bad on the devices
  its users actually own. No amount of C14 or C15 compensates: those criteria measure how pleasantly you
  build a thing nobody enjoys using.
- **C2.** A crash rate is not a score. Cross Play Console's bad-behaviour thresholds and store
  visibility is demoted — that is a distribution problem, not a UX ticket (§10).
- **C5.** Background geofencing is "cannot", not "worse", when the runtime is a WebView that is not
  alive. A veto does not average.

Three further arguments the score does not capture, all pointing the same way:

1. **Variance.** RN's C1 score of 4 is fairly predictable. Web's 2 could be a 3 with excellent
   engineering discipline, or a 1 on a Unisoc device under a heavy OEM skin. Choosing the
   higher-variance option **for the core screens of the app** is a different bet than the average
   suggests, and "janks on Realme, fine on Samsung" is an unpleasant class of bug to own at 5 lakh users.
2. **The direction of travel.** Every named roadmap item — maps, geofencing, camera work, further
   native-feeling modules — moves toward native strengths. Optimising v1 delivery speed against the
   roadmap's ceiling is the trade being made, and it should be made knowingly.
3. **The app is the sales demo.** If Leaderboard is pitched to a manufacturer's procurement team as a
   licensable module, jank on a Redmi in that meeting is a revenue problem.

**And the honest counter-case, so this is chosen with open eyes.** If the §11 spike shows the web build
holding 58 fps, *and* geofencing turns out to mean foreground location checks, *and* the camera roadmap
stays aspirational — then one React codebase serving the mobile app and the manufacturer dashboard, with
one language, one component library and one deployment story, is a genuinely strong answer that scores
level. Take the measurement before committing engineering years.

**A genuinely bad idea, for completeness:** building web-first *intending* to rewrite native later. The
rewrite never gets funded, and you end up permanently maintaining the higher-variance option without
ever having chosen it. Pick one, on the spike result, and commit.

---

## 10. What 5 lakh users changes

Most scaling at this number is a backend problem, and `humbee_influencer_backend/docs/12` already sizes
it. Four consequences land on the **client** decision, and they are the reason C2 carries weight 5.

| Consequence | Why it favours RN |
| --- | --- |
| **Device long tail.** 5 lakh Indian entry-level Androids means every Chromium WebView version, every OEM compositor, and Unisoc/MediaTek GPUs under heavy skins | RN's renderer is a dependency you version and ship. The WebView is a dependency **the device owner versions** — you inherit their fragmentation and cannot reproduce half of it |
| **OOM kills and cold starts.** A WebView instance carries roughly 50–100 MB before your own heap. On a 2 GB device with an OEM skin and storage >80% full, that raises the chance the OS kills the app in the background — which means **more cold starts**, the single most expensive thing in the app | Hermes' smaller heap and no WebView overhead. This compounds: worse memory → more kills → more cold starts → worse perceived performance |
| **Play Console vitals.** Excessive crash and ANR rates demote store visibility and can trigger warnings. WebView OOM kills and main-thread stalls land in exactly those buckets. At 5 lakh installs you are firmly in the sampled-and-published regime | Fewer processes to starve, and a jank budget you control |
| **Support cost per percentage point.** At 5 lakh users, 1% of sessions hitting a device-specific rendering bug is 5,000 users and a support queue | Lower variance is worth real money at this scale |

Two consequences that do **not** discriminate, so they should not be argued either way: OTA bandwidth
cost (comparable bundle sizes on both) and analytics event volume (identical taxonomy, same vendor bill).

---

## 11. The two-day spike that settles it

Do not decide this from documents — including this one. The disagreement is empirical and narrow: it is
concentrated in C1, and C1 is measurable in two days.

**Build the Leaderboard screen twice** and measure on the reference device. Leaderboard is the right
screen because it is the heaviest in the app: a gradient podium panel with three SVG medals, hex-clipped
avatars, a sticky footer card over a gradient fade, forty rows each with a progress bar animating on
entry, a horizontally scrolling tab bar, and a 25-bar shimmer skeleton.

| Step | Detail |
| --- | --- |
| 1 | Two reference devices — Redmi A3 class, 2–3 GB RAM, **OEM skin intact, storage >80% full**. A clean flagship proves nothing |
| 2 | Implement Leaderboard in **Vite + React + Capacitor**: virtualized list, transform-only animations, real card chrome |
| 3 | Implement Leaderboard in **RN CLI**: FlashList, Reanimated |
| 4 | Feed both from `humbee_influencer_backend/contracts/examples/leaderboard.json`, padded to ~200 rows |
| 5 | Measure, three runs each: cold start to first skeleton frame; a fixed 5-second swipe via `adb shell dumpsys gfxinfo <pkg> framestats`; peak RSS; tab-switch-to-content on cached data |
| 6 | Eyeball the shimmer and the progress-bar fills side by side with `design-spec/prototype/prototype-standalone.html` |

**Decision rule, written before the measurement so it cannot be rationalised afterwards:**

| Result | Decision |
| --- | --- |
| Web holds **58+ fps average with zero frames over 32 ms** | The web option is live. Confirm the geofencing reading in §6.2 first; if it is foreground-only, take Vite + Capacitor with §6 ceilings recorded as accepted risks |
| Web lands **50–58 fps, or shows occasional frames over 32 ms** | **React Native.** A marginal core screen on day one becomes an unacceptable one after two years of feature accretion |
| Web is **below 50 fps** | React Native, and the question is closed |

Alongside it, a second Phase-0 spike that is not optional: **prove the OTA mechanism.** Install
`expo-updates` into the bare project and ship a trivial JS change over the air to a real device. If that
cannot be made to work, C3 collapses from 4 to 1, RN CLI drops to ~223, and this comparison has to be
re-opened — Expo CNG and the web options all beat it at that point. Do not discover this in month six.

---

## 12. Recommendation

**React Native, in TypeScript.** The decision rests on three threshold criteria — list performance on a
2 GB device, stability across 5 lakh devices on the Android long tail, and OS-level background
capability — and on the fact that every named roadmap item moves toward native strengths.

Then, in order of how much they change:

1. **Do not build the mobile app in Next.js.** Inside Capacitor it is a static SPA with extra steps.
   Next.js is the right tool for the manufacturer SaaS dashboard and the wrong one here.
2. **Re-open Expo CNG vs RN CLI** (250 vs 238). CNG is not the old restrictive managed workflow: any
   native module autolinks, native files are editable via config plugins, and `expo prebuild` + commit is
   an escape hatch available at any time. Most of the 12-point gap is OTA and RN upgrade cost. **The good
   reasons to keep the CLI are team continuity** — `humbee-mobile-app` is already bare RN 0.79 and the
   team owns that toolchain — **and avoiding a dependency on EAS as a paid service.** Neither is about
   capability. **Per-tenant white-labelling is not the argument it appears to be**: across many tenants,
   generating identifiers, icons and Firebase files from `app.config.ts` plus one build profile each
   scales better than hand-maintained Gradle flavors and Xcode schemes
   (`09-saas-and-module-architecture.md` §12).
3. **If the CLI stands, wire `expo-updates` in Phase 0** and prove an OTA update on a real device before
   the first screen. This is the single highest-risk item in the plan.
4. **Run the §11 spike anyway.** Two days to convert the most contested decision on the project from
   opinion into a number, and it is the honest thing to do given the web option scores within four points.
5. **Compensate for RN's two real losses**, deliberately and in Phase 0, not later: instrument explicit
   Capture Demand funnels plus a moderated user cohort to replace what session replay would have given
   you (§6.6), and keep heavy charting on the Next.js dashboard rather than fighting RN's chart
   ecosystem (§6.4).
6. **Confirm what geofencing means** (§6.2). It is the strongest argument in RN's favour and it appears
   in no specification document. If it means foreground-only location, C5 stops being a veto and the
   spike in §11 becomes genuinely decisive rather than confirmatory.

## 13. What would change this answer

Written down now so the decision can be re-opened on evidence rather than on mood.

| # | Trigger | Consequence |
| --- | --- | --- |
| 1 | The §11 spike shows web at 58+ fps **and** geofencing is foreground-only | Vite + React + Capacitor becomes the better choice on points, fidelity and time-to-v1 |
| 2 | No OTA mechanism can be made to work on the CLI | RN CLI drops to ~223 and loses to Expo CNG and to both web options. Move to CNG |
| 3 | Reanimated cannot hold 60 fps on the reference device after the Phase 0 spike | Re-open against Flutter, which wins C1 and C2 outright |
| 4 | The team's bare-RN toolchain ownership stops being a factor — new team, or `humbee-mobile-app` retired | The main remaining argument for CLI over CNG disappears |
| 5 | A module needs a genuinely custom high-frame-rate canvas (a live site map with hundreds of animated markers) | A Skia problem in RN, a native strength in Flutter. Re-open for that module specifically, not for the whole app |
| 6 | The manufacturer dashboard becomes the primary product and the mobile app secondary | A single React codebase across both is worth more than it is today, which strengthens the web option |

---

*Sources: `design-spec/` in this repo (design spec, 531 tokens, motion spec);
`humbee_influencer_backend/docs/` and `contracts/openapi.yaml` (22 endpoints, caching model, capacity);
`archive/superseded-frontend-plan/02`, `14` and `15` (the earlier RN-vs-Flutter, web-stack and
SaaS analyses this document consolidates and re-scores against the criteria in §2).*
