# 08 — Native capabilities roadmap

The five capabilities named as future work — **Google Maps, camera, high-performance animation,
analytics, and new industry modules** — are the reason the stack in `01` is shaped the way it is.
This document is the plan for each: the library, the rejected alternative, the platform cost, and the
thing that will actually go wrong.

## 8.0 The rule that makes all of this cheap

> **No screen imports a native module. Every one sits behind a facade in `src/shared/native/`.**

```
src/shared/native/
├── map/       index.ts        → useMap(), <HumbeeMap>, geocode()
├── camera/    index.ts        → useCamera(), captureCompressed()
├── location/  index.ts        → useLocation(), requestPermission()
├── haptics/   index.ts        → tap()
└── permissions/ index.ts      → ensure('camera' | 'location' | 'notifications')
```

Three payoffs, all of which this roadmap will need:

1. **Swapping a provider is one file.** `expo-camera` → `react-native-vision-camera` (§8.2) touches
   `shared/native/camera/`, not eleven screens.
2. **Permission UX lives in one place.** Every native capability here needs a permission, and the
   correct flow for this audience — explain *before* the OS dialog, handle "denied forever" with a
   settings deep link — is the same flow every time. Written once.
3. **Tests and web previews get a stub.** A screen that imports `expo-camera` cannot render in Jest.
   A screen that calls `useCamera()` can.

## 8.1 Google Maps

**Recommendation: `react-native-maps`**, with the **Google provider on both platforms**
(`provider={PROVIDER_GOOGLE}`), behind a `<HumbeeMap>` facade.

Why: it is the mature, widely-deployed RN map, it wraps the real native Google Maps SDKs (so
rendering and gestures are native-quality), it has an Expo config plugin, and Google Maps is what
this audience already recognises — a field influencer navigating to a dealer expects the map they use
every day.

**Rejected alternative — `@rnmapbox/maps`.** Genuinely better at two things this app may eventually
want: offline vector tiles (real value in rural districts with no signal) and cost at very high map
loads. Rejected for v1 because it introduces a second mapping vendor, a different styling model, and
an unfamiliar map look, for benefits that are speculative until there is a map feature at all.
Re-evaluate specifically if offline maps become a requirement — the facade is what makes that a
contained decision.

**What will actually cost time:**

| Item | Detail |
| --- | --- |
| API keys and billing | Separate keys for Android (SHA-1-restricted, and the **EAS build credentials' SHA-1 differs from your local debug keystore** — the classic "map is blank in the build but works locally") and iOS. Maps SDK billing must be enabled or tiles render grey with no error |
| Key management | Keys go in EAS secrets and `app.config.ts`, never committed. Note that an Android Maps key is extractable from the APK — restrict it by package name + SHA-1 rather than relying on secrecy |
| New Architecture | Verify Fabric support for the exact version at install time. This is the library most likely to lag |
| Performance | Marker clustering is mandatory past ~50 markers on the target device. Custom marker views are far more expensive than image markers — use `<Marker image>` and only fall back to children when the design demands it |
| Location | `expo-location`. Request **while-in-use**, never background, unless a feature genuinely needs it — background location triggers a Play Store declaration and a review process |
| Permission copy | The audience will decline a bare OS dialog. Explain the benefit in-app first, in their language, then request |
| Android footprint | The Maps SDK adds several MB. Budget it in `09-performance-budget.md` before the feature lands, not after |

**Likely first features:** locate the nearest onboarded VCP for a manufacturer; show the influencer's
district boundary in relation to the demand fork (a sub-industry with no onboarded manufacturer in
the district is already a designed state); optionally geotag a demand's site. Note that geotagging is
**not** in v1 scope — the handoff's rule 8 is explicit about not adding features — so it needs a
product decision, and a privacy notice, before it is built.

## 8.2 Camera

**Recommendation: start with `expo-camera`. Move to `react-native-vision-camera` the moment a frame
processor is needed.** Both behind the same `useCamera()` facade, so the move is contained.

The distinction is precise, and choosing on it avoids both a rewrite and premature complexity:

| Requirement | Library |
| --- | --- |
| Take a photo — proof of delivery, site photo, a gift-received confirmation | `expo-camera`. Simpler, already in the Expo dependency graph, one config plugin |
| Scan a QR or barcode on a cement bag or TMT bundle tag | `expo-camera`'s barcode scanning covers straightforward cases; VisionCamera + `vision-camera-code-scanner` if you need continuous high-rate scanning |
| **Real-time frame processing** — OCR a VCP invoice, read a batch number, ML inference on a product photo | `react-native-vision-camera` + Worklets. This is what it exists for and `expo-camera` cannot do it |

Given this programme's shape — demands raised against SKUs, allocations confirmed by VCPs — invoice
OCR and bag-tag scanning are plausible enough that the facade matters. Do not adopt VisionCamera
speculatively; it is a heavier native dependency with a stricter build story.

**What will actually cost time:**

| Item | Detail |
| --- | --- |
| Compress before upload | `expo-image-manipulator`: resize to a max edge of ~1600px and JPEG quality ~0.7. A raw 12 MP photo is 4–6 MB; on rural 4G that upload fails, retries, and burns the user's data. This is the single most important line in this section |
| Upload path | Direct-to-S3 via a pre-signed URL from the backend, not a multipart POST through the API. Resumable, and it keeps large bodies off the app servers |
| Retry | Photo uploads join the offline outbox (§6.6). A photo taken on a site with no signal must survive |
| Permissions | Camera, and on older Android, storage. Handle "denied forever" with a deep link to app settings |
| Storage hygiene | Write captures to the cache directory and clean up after a successful upload. Filling a 16 GB phone is a support ticket |
| Low-light | The audience works outdoors and in half-built structures. Test in bad light on a cheap device; auto-flash behaviour differs wildly across Android OEMs |

## 8.3 High-performance animation

Covered in full in `07-animation-and-motion.md`. The roadmap position:

| Need | Tool | Status |
| --- | --- | --- |
| Everything in the current spec — colour transitions, staggered entries, progress fills, carousel, shimmer | **Reanimated** worklets on the UI thread | v1 |
| Gestures beyond tap and horizontal scroll — a swipeable card, a bottom sheet, pull-to-refresh with custom art | **react-native-gesture-handler** (already a Reanimated companion) | when a spec needs it |
| Shared-element transitions between screens | Reanimated shared element transitions | when a spec needs it |
| A genuinely custom canvas — animated charts, a map overlay with hundreds of animated markers, image annotation | **@shopify/react-native-skia** | deferred; see §7.8 |
| Vector motion designed in After Effects | **lottie-react-native** — already in v1 for the success screen | v1 |

The structural reason this scales: Reanimated animations run in worklets on the UI thread, so they do
not degrade when the JS thread is busy fetching. On a 2 GB device that separation is the difference
between smooth and unusable, and it is why animation quality is not the constraint that pushes this
project toward Flutter (`02-alternatives-considered.md` §2.2B).

**Guardrail:** every new animation must be spec'd with a duration and the standard easing, and must
respect `useReducedMotion()`. "High performance" in this design system means *restrained*, not
elaborate — an animation that is not in the spec is a defect regardless of its frame rate.

## 8.4 Analytics

**Recommendation: a vendor-agnostic facade, one product-analytics provider, one crash provider, and
an event catalogue that is reviewed like an API.**

```ts
// shared/analytics/index.ts
export function track<E extends EventName>(event: E, props: EventProps[E]): void;
export function identify(influencerId: string, traits: Traits): void;
export function screen(name: RouteName): void;
```

`EventProps` is a typed map, so `track('demand_submitted', { manufacturerId, subIndustryId, qty,
uom })` compiles and `track('demand_submited', {})` does not. Analytics that drift into free-form
strings produce dashboards nobody trusts within two quarters.

| Layer | Recommendation | Why |
| --- | --- | --- |
| Crash + performance | **Sentry** (`@sentry/react-native`) | Sourcemaps wired to EAS, release health per OTA channel, JS + native in one timeline. An OTA-aware crash reporter is not optional when OTA is a core delivery mechanism |
| Product analytics | **Firebase Analytics** (GA4) via `@react-native-firebase/analytics`, or **PostHog** if self-hosting and session replay matter | Firebase: free at this scale, no data cap concerns, and brings Remote Config + FCM in the same SDK. PostHog: better product-analytics ergonomics and funnels, at a cost |
| Engagement / campaigns | **MoEngage** or **CleverTap** — evaluate when campaigns are a requirement, not before | The programme already sends SMS and WhatsApp notifications. These platforms own that orchestration for Indian consumer apps and both have maintained RN SDKs. Adding one *later* is cheap precisely because of the facade |
| Feature flags / kill switches | **Firebase Remote Config** (if Firebase) or a `GET /config` field | The server contract already has `/config` with a version gate — extend that before adding a vendor |

**The event catalogue.** Define it before the first `track()` call, in
`shared/analytics/events.ts`, keyed to the funnel this business actually runs on:

```
app_opened, login_otp_requested, login_otp_verified, login_otp_failed{code}
home_banner_tapped{index}, home_quick_link_tapped{target}
leaderboard_manufacturer_changed{from,to}, leaderboard_points_explainer_opened
demand_started, demand_industry_chosen{id}, demand_sub_chosen{id},
demand_manufacturer_chosen{id}, demand_no_manufacturer_shown{sub},
demand_sku_chosen{id}, demand_submitted{...}, demand_submit_failed{code}
demand_captured_another_tapped, demands_filter_changed{status}
allocation_period_changed{period}, rewards_status_filter_changed{status}
profile_logout, profile_delete_requested
screen_viewed{name}, api_error{path,code}, offline_banner_shown
```

`demand_no_manufacturer_shown` is the highest-value event in that list: it is the app telling
operations exactly which district × sub-industry pairs have no onboarded manufacturer. That is a
business input, not a vanity metric.

**Privacy, which is a real constraint and not boilerplate.** The users are individuals in India
whose mobile number is their identity, under the DPDP Act.

- Never send the mobile number, name, or precise location as an event property. Identify by the
  server's `influencerId` only.
- Analytics initialisation must be gated on consent where consent is required, and the facade is where
  that gate lives — one `if`, not forty.
- Both stores require a data-safety / privacy-manifest declaration listing every SDK's collection.
  Adding an engagement SDK later is a store-listing change, so plan it with a release, not mid-sprint.
- `api_error` must carry the path and `data.code`, never the response body — the envelope's `message`
  can contain user-facing text and, in a bad case, PII.

## 8.5 Push notifications and OTP autofill

Not in the named list but adjacent, and both will be asked for.

| Need | Approach |
| --- | --- |
| Push | `expo-notifications` (with FCM on Android) or `@react-native-firebase/messaging` if Firebase is already in for analytics — do not run both. `POST /me/device` already exists in the contract for token registration |
| Android battery managers | Xiaomi, Oppo, Vivo and Realme dominate this price bracket and aggressively kill background apps. Push delivery will be unreliable for a meaningful fraction of users. Design for it: treat push as a nudge, never as the only path to information, and keep SMS/WhatsApp as the reliable channel |
| OTP autofill — Android | SMS Retriever API (`react-native-otp-verify` or equivalent). Requires an **11-character app hash in the SMS body**, which the backend's SMS template must include and which **differs per signing key** — so the production hash differs from the debug hash. Budget a round trip with the SMS provider |
| OTP autofill — iOS | `textContentType="oneTimeCode"` on the OTP input. Works with no server change |

QA requires SMS autofill on both platforms, so this is v1 scope, not roadmap.

## 8.6 New and current industry-based features

This is the scalability question that actually matters for this product, and the encouraging part is
that **the server contract is already built for it**: `GET /catalog/industries` returns industries →
sub-industries → manufacturers → SKUs, resolved for the caller's district, and `GET
/catalog/points-rules` returns the multiplier table. The client renders a catalog; it does not
encode one.

**The rule: adding an industry must be a server-side data change, with zero client release.**

What that demands of the client:

| Requirement | Implementation |
| --- | --- |
| No hardcoded industry or sub-industry ids in logic | The handoff's prototype state uses literals (`'bcm'`, `'tmt'`, `'painthw'`). Those are prototype conveniences. Production code branches on **capabilities in the payload**, never on an id |
| Server-driven illustrations | Industry and sub-industry images come from `imageUrl`, cached by `expo-image`. Note the handoff's treatment rule — every illustration is keyed to a single `#EDF1F6` tint — which is now an **asset-pipeline requirement on whoever adds the industry**, since the client cannot retint an arbitrary bitmap. Document it for the ops team |
| Server-driven UOM lists | Already in the contract, per manufacturer and per category. `uomList` is a selector over the payload with a documented fallback chain (manufacturer → category → `['Units']`) |
| Server-driven points rules | Already in the contract. The client displays; it never multiplies |
| Graceful unknown values | A new gift status or demand status must not crash the app. `StatusBadge` needs a **default branch** — neutral chip, raw label — for any status outside the known five. An exhaustive `switch` over a server enum is a future crash with a release-cycle-long fix, which OTA mitigates but should not have to |
| A version gate for genuinely new UI | `GET /config` already carries a version gate. A new industry that needs a new *screen* is a client release; one that needs new *data* is not. Keep that line clean and most industry work needs no app release at all |

**When a new module does need real UI** — a new screen, a new flow — the cost is bounded by
`03-project-structure.md`: a folder under `src/features/`, a route file, a query hook, and entries in
the token-safe primitive library that already exists. Features cannot import each other, so module
#20 does not slow down module #4. That property is worth protecting with the lint rule even when it
feels bureaucratic on module #2.

## 8.7 Capability adoption checklist

Run this for every item above before it merges. It is short on purpose.

- [ ] Sits behind a facade in `shared/native/` or `shared/analytics/`; no screen imports the SDK
- [ ] New Architecture (Fabric) support verified for the pinned version, on a real build
- [ ] Config plugin added to `app.config.ts`; `expo prebuild --clean` succeeds on a clean checkout
- [ ] Permission flow: in-app explanation → OS request → denied-forever path to settings
- [ ] APK/IPA size delta measured and recorded against the budget in `09`
- [ ] Cold-start delta measured — an SDK that initialises eagerly is the usual cause of a 400ms regression
- [ ] Store declarations updated: Android data safety, iOS privacy manifest, and any new permission's justification
- [ ] Offline and failure behaviour defined — not "it throws"
- [ ] Jest stub exists so screens using it stay testable
- [ ] Reviewed against handoff rule 8: is this in scope, or is it a feature nobody asked for?
