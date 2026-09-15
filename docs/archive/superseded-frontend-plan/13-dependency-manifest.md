# 13 — Dependency manifest

## 13.1 How to read this

**Versions are not pinned here on purpose.** Two things move fast enough that a written version number
is a liability: Expo's SDK cadence, and each library's New Architecture support. What is durable is
*which* library and *why*.

The rule at bootstrap: **install Expo-managed packages with `npx expo install`, never `npm install`.**
`expo install` resolves the version that matches the installed SDK. A manual `npm install
react-native-reanimated@latest` is the standard way to break an Expo project.

## 13.2 Core

| Package | Role | Notes |
| --- | --- | --- |
| `expo` | SDK + CNG + config plugins | Pin the SDK; upgrade deliberately, one SDK at a time |
| `react-native` | Runtime | Whatever the SDK pins. New Architecture enabled |
| `react`, `react-dom` | — | SDK-pinned |
| `typescript` | `strict`, `noUncheckedIndexedAccess` | |
| `expo-router` | File-based routing over React Navigation | Typed routes on |
| `react-native-screens`, `react-native-safe-area-context` | Native screen containers, insets | Router peers. The 20px home-indicator inset in the nav spec comes from here |
| `expo-constants`, `expo-linking`, `expo-splash-screen`, `expo-status-bar` | Platform basics | Splash controls the cold-start sequence in §5.6 |

## 13.3 State and data

| Package | Role | Why this one |
| --- | --- | --- |
| `@tanstack/react-query` | Server state | The handoff's loading semantics are its exact model |
| `@tanstack/query-persist-client` + `@tanstack/query-sync-storage-persister` | Cache persistence | Offline cold start. Backed by MMKV |
| `zustand` | Client state | Three small slices, no Provider tree |
| `react-native-mmkv` | Fast sync storage | Synchronous, so nothing awaits before first paint |
| `expo-secure-store` | Tokens only | Keychain / EncryptedSharedPreferences |
| `openapi-typescript` (dev) | Generates types from `../contracts/openapi.yaml` | Build-time only, no runtime cost |
| `openapi-fetch` | Typed `fetch` wrapper | ~5 kB, no per-endpoint generated code |
| `@react-native-community/netinfo` | Connectivity | Use `isInternetReachable`, not `isConnected` |

**Not included:** Redux, Apollo, axios. `fetch` plus the §6.2 wrapper covers everything; axios adds a
dependency for interceptors that thirty lines already provide.

## 13.4 UI, tokens and motion

| Package | Role | Why this one |
| --- | --- | --- |
| `react-native-reanimated` | All animation | Worklets on the UI thread. Requires the Babel plugin — a missing plugin produces confusing runtime errors, so verify it in the first commit |
| `react-native-gesture-handler` | Gestures | Reanimated peer; also the correct `Pressable` foundation |
| `@shopify/flash-list` | Every list | Recycling. The largest scroll win available |
| `react-native-svg` | Icons, medals, hexagons, skeleton hex shapes | The 102-glyph HUMBEE set compiles to components |
| `expo-image` | All images | Disk + memory cache, `recyclingKey` for FlashList cells |
| `expo-linear-gradient` | The two permitted gradients + the shimmer band | The handoff permits exactly two gradients; this is not a licence for more |
| `lottie-react-native` | `celebration.json`, `success-green.json` | Demand Captured only |
| `expo-font` | Lato 400/600/700 | Bundled, not fetched — no cold-start FOUT |
| `expo-haptics` | Three events, per §7.6 | |
| `expo-clipboard` | OTP paste | Small, and users do paste OTPs |

**Not included:** any component library, NativeWind, styled-components, `@shopify/react-native-skia`.
Reasons in `01` §1.4, `04` §4.5 and `07` §7.8.

## 13.5 i18n and formatting

| Package | Role | Notes |
| --- | --- | --- |
| `i18next`, `react-i18next` | Translation | ICU message format for plurals — Hindi and Marathi plural rules are not English's |
| `expo-localization` | Device locale | Default from the device, but let the user override; a Marathi speaker may have an English phone |

**No date library.** `Intl.DateTimeFormat` and `Intl.NumberFormat` with `en-IN` cover every case in
§6.8. **Verify full ICU is present in the Hermes build on a physical Android device early** — a
stripped ICU silently falls back to US digit grouping, so a value that must render `21,40,000`
comes out as `2,140,000`. That looks like a data bug and gets debugged as one.

## 13.6 Observability

| Package | Role | Notes |
| --- | --- | --- |
| `@sentry/react-native` | Crashes, traces, release health | Sourcemap upload wired to EAS; OTA updates reported as releases |
| Analytics provider | One of Firebase Analytics / PostHog | Behind the facade in `shared/analytics`. Decide with the product funnel, not now (§8.4) |

## 13.7 Deferred — the roadmap dependencies

Listed so nobody researches them twice. **None of these is installed in v1.** Each enters through the
§8.7 checklist.

| Package | For | Gate |
| --- | --- | --- |
| `react-native-maps` | Google Maps | §8.1. Verify Fabric support; API keys per bundle id; SHA-1 restriction |
| `expo-location` | Location for maps | While-in-use only, never background |
| `expo-camera` | Photo capture | §8.2 |
| `expo-image-manipulator` | Compress before upload | Ships **with** the camera, not after. Non-negotiable on rural 4G |
| `react-native-vision-camera` | Frame processors — barcode, OCR | Only when a frame processor is genuinely needed |
| `expo-notifications` **or** `@react-native-firebase/messaging` | Push | Pick one, never both |
| `@shopify/react-native-skia` | A genuinely custom canvas | §7.8 |
| An engagement SDK (MoEngage / CleverTap) | Campaigns | A store-listing change. Plan with a release |

## 13.8 Dev tooling

| Package | Role |
| --- | --- |
| `eslint`, `typescript-eslint`, `eslint-config-expo`, `prettier` | Lint and format |
| `eslint-plugin-boundaries` | Enforces the import rules in §3.3 — the load-bearing lint rule |
| `jest`, `jest-expo`, `@testing-library/react-native` | Unit and component tests |
| `msw` | API mocking, seeded from `../contracts/examples/*.json` |
| `reassure` | Render-perf regression gates in CI |
| `maestro` (binary, not npm) | E2E flows |
| `knip` | Dead code and unused dependencies |
| `react-native-bundle-visualizer` | Bundle composition per release |

## 13.9 Custom lint rules to write

Small, and they are what make the rules in these documents self-enforcing rather than aspirational.

| Ban | Instead | Why |
| --- | --- | --- |
| `FlatList` | `FlashList` | §9.6 regression #2 |
| `TouchableOpacity`, `TouchableHighlight` | `Pressable` via `shared/ui` | The handoff forbids opacity-fade press states |
| `Text` from `react-native` | `shared/ui/Text` | `includeFontPadding: false` and token typography |
| Hex/rgba literals in source | `colours.*` | "Never introduce a colour that is not in the token file" |
| Numeric `fontSize` literals | `type.*` | There is no 14px in this system |
| String literals in JSX text position | `t('key')` | Localisation-ready from day one, not retrofitted |
| `withSpring` | `withTiming` + `motion.standard` | "No bounce, no spring" |
| Direct imports of native SDKs outside `shared/native` | The facade | §8.0 |
| Direct imports of `shared/api/generated` outside `shared/api` | The client | §3.3 |
| Emoji in source strings | — | Handoff rule 2: no emoji in product copy |

## 13.10 The bootstrap verification procedure

Run this **before the first commit of `frontend/app/`**, and record the results in a
`frontend/app/BOOTSTRAP.md`. It takes an afternoon and it is the cheapest afternoon on the project.

1. `npx create-expo-app` with the current SDK; enable the New Architecture.
2. `npx expo install` every package in §13.2–13.6.
3. **`npx expo-doctor`** — resolves version mismatches and flags packages without New Architecture
   support. Fix everything it reports before writing a screen.
4. `npx expo prebuild --clean` — must succeed from a clean checkout.
5. Build a development build for Android and install it on the reference device.
6. **Record the actual installed versions and the SDK number in `BOOTSTRAP.md`.** That file, not this
   document, is the pinned record.
7. Run the animation spike from `12-implementation-roadmap.md` §0.9 and record the measured fps.
8. Measure the empty-app cold start and APK size on the reference device — these are the baselines
   every number in `09-performance-budget.md` is compared against.
