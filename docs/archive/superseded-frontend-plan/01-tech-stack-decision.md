# 01 — Tech stack decision

## 1.1 What this app actually is

Before choosing tooling, be precise about the workload. From the design handoff:

- **10 screens.** Seven read screens, one multi-step form (Capture Demand), two auth screens.
- **Read-heavy.** Leaderboard, Inventory Allocated and Rewards are lists filtered along two axes
  (manufacturer × period). The only write paths in v1 are OTP verify, demand submit, and delete
  account.
- **Pixel-exact.** 531 design variables are final. Every hex, size, line-height, radius, shadow and
  padding is specified, borders are inset shadows, and the brand shape is a hexagon clip-path.
- **Restrained motion.** 120ms colour, 200ms position, one 420ms carousel, one shimmer. No spring,
  no bounce, no parallax, nothing scales on press.
- **Hostile runtime.** Android-first, ₹8,000–₹12,000 devices, 2–3 GB RAM, intermittent 4G,
  outdoors in sunlight, users more fluent in Marathi/Hindi than English.
- **Growing surface.** Google Maps, camera, high-performance animation, analytics, and further
  industry modules are already named as near-term work.

Those five facts, not fashion, decide the stack.

## 1.2 The stack

| Layer | Choice | Why this and not the alternative |
| --- | --- | --- |
| Language | **TypeScript, `strict: true`** + `noUncheckedIndexedAccess` | Non-negotiable at this size. Also lets the OpenAPI spec in `../contracts/` become compile-time truth |
| Runtime | **React Native on the New Architecture** (Fabric + TurboModules + Bridgeless), **Hermes** engine | Fabric removes the async bridge from the render path, which is exactly where low-end Android jank came from. Hermes gives precompiled bytecode: faster cold start, smaller heap |
| Toolchain | **Expo SDK** with **Continuous Native Generation** (`expo prebuild`, config plugins) | Not "Expo Go managed" — CNG. You keep the ability to add any native module (maps, VisionCamera, Firebase) while `android/` and `ios/` stay generated, so an SDK upgrade is a regenerate rather than a three-day merge |
| Navigation | **Expo Router** (file-based, typed routes) — React Navigation native stack + bottom tabs underneath | The handoff asks for React Navigation; Expo Router *is* React Navigation with a router on top. It also makes the `humbee://leaderboard?mfr=welspun` deep links from the handoff a file path instead of a hand-written linking config |
| Server state | **TanStack Query v5**, one query key per `(screen, manufacturer, period)` | The handoff's §06 already describes per-query loading, cached manufacturer switching and no-skeleton-on-filter-change. That is TanStack Query's exact model. Persisted to MMKV so a cold start on no network paints last-known data |
| Client state | **Zustand** with an MMKV persist adapter | Three slices only: session, selection (`mfr`, `period` — persisted, "field users work with one manufacturer for weeks"), and demand-draft. Small, no Provider tree, no reducers |
| Styling | **Typed tokens module + `StyleSheet.create`**, generated from `design/tokens/*.css` | Zero runtime cost on the render path. Rejected: styled-components (per-render string parsing), NativeWind (a build step and a class-string culture that fights a 531-variable design system). See `04-design-tokens-and-theming.md` |
| Lists | **Shopify FlashList** for leaderboard rows, demand cards, allocation cards, gift cards | Recycling instead of `FlatList`'s mount-per-row. This is the single largest scroll-jank win available on a 2 GB device |
| Animation | **Reanimated** (worklets on the UI thread) + **react-native-gesture-handler** | Every handoff keyframe maps to a worklet or a layout animation — see `07-animation-and-motion.md`. `Animated` from core is not enough for the shimmer and staggered entries at 60fps |
| Vector / icons | **react-native-svg**, with the 102-glyph HUMBEE set compiled to typed components | The handoff forbids substituting Lucide/Material. The hexagon clip-path, the three-disc medals and the honeycomb trail are all SVG work |
| Images | **expo-image** | Disk + memory cache, `contentFit` parity with `background-size: cover`, placeholder support for the banner carousel |
| Lottie | **lottie-react-native** | `celebration.json`, `success-green.json` on the Demand Captured screen |
| Fonts | **expo-font** with Lato 400/600/700 bundled as assets, not fetched | QA requires "no fallback font flash on a cold start". Bundled fonts are the only way to guarantee that |
| Secure storage | **expo-secure-store** (Keychain / EncryptedSharedPreferences) | Access + refresh token only. Handoff §06 forbids plain storage |
| Fast storage | **react-native-mmkv** | Preferences, the query cache persister, and the offline mutation outbox. Synchronous reads mean no `await` before the first paint |
| i18n | **i18next + react-i18next + expo-localization**, ICU message format | `en` / `hi` / `mr`. Handoff rule 7: no concatenation, interpolate. `Intl.NumberFormat('en-IN')` for every number |
| Network status | **@react-native-community/netinfo** | The offline banner required on every data screen |
| Crash + perf | **Sentry (@sentry/react-native)** | Sourcemap upload wired to EAS, release health per OTA update, and JS + native traces in one place. Chosen over Crashlytics because it understands OTA release channels |
| Product analytics | **Facade + one provider** — see `08-native-capabilities-roadmap.md` §8.4 | The app calls `track('demand_submitted', {...})`; the provider is swappable. Never call a vendor SDK from a screen |
| Build + delivery | **EAS Build** + **EAS Update** (OTA), GitHub Actions | See `11-release-and-ota.md` |
| Test | **Jest + React Native Testing Library**, **MSW** for the API, **Maestro** for E2E, **Reassure** for render-perf regression | See `10-quality-testing-and-ci.md` |
| Lint | ESLint + typescript-eslint, Prettier, `eslint-plugin-boundaries`, `knip` | Boundaries is what keeps `03-project-structure.md` true a year from now |

## 1.3 How this scores against the stated criteria

### Scalability

Scalability for a client app means three different things, and they need separating.

- **Screen-count scalability.** The v1 surface is 10 screens; the roadmap adds industry modules.
  The answer is the feature-sliced structure in `03-project-structure.md` — a new module is a new
  folder under `src/features/`, a route file, and a query hook. Nothing existing is edited. CI
  enforces that features cannot import each other, so module #20 costs the same as module #4.
- **Data-volume scalability.** Cursor pagination is already in the server contract. FlashList plus
  TanStack Query's `useInfiniteQuery` means a 6-lakh-row leaderboard renders the same as a 20-row
  one, because only the top 10 plus the pinned user is ever requested.
- **Team scalability.** Typed tokens, generated API types, and a component library mean a new
  developer's first pull request cannot invent a colour or a field name. Both classes of mistake
  fail `tsc`.

### Maintainability

The three highest-churn things in a mobile codebase are the design system, the API contract, and
the native project files. This stack makes all three **generated**, not hand-written: tokens from
CSS, API types from OpenAPI, `android/`+`ios/` from `app.config.ts`. Hand-maintained native
projects are how mobile apps become unupgradable, and CNG is the specific defence.

### Performance

Numeric targets and their measurement live in `09-performance-budget.md`. The structural choices
that get you there: Hermes bytecode, New Architecture, `StyleSheet` over runtime CSS, FlashList
recycling, Reanimated worklets off the JS thread, and `expo-image` disk cache. The design's own
restraint helps more than any of them.

### Developer experience

Fast refresh, one `npx expo start`, a real debugger, and — the one that matters most on this
project — the ability for a designer or PM to open the handoff prototype in a browser next to the
running app on a device and compare. Expo's dev client on a physical low-end Android is a five
minute setup, and every fidelity bug should be found there rather than in review.

### Community and hiring

React Native and Flutter both have deep Indian talent pools; React Native's is larger among people
who already write TypeScript, which matters because this repo's server contract is TypeScript-typed
and the wider HUMBEE platform is FastAPI + Pydantic (camelCase wire format, per
`../docs/05-api-conventions.md`). One language across the client, the generated types, and the
tooling scripts is a real ongoing saving.

### Fit with the named future work

| Named requirement | Stack answer | Detail |
| --- | --- | --- |
| Google Maps | `react-native-maps` (Google provider on both platforms) behind a `MapView` facade | §8.1 |
| Camera | `expo-camera` for capture; `react-native-vision-camera` the moment frame processors are needed (barcode on SKU bags, OCR of a VCP invoice) | §8.2 |
| High-performance animation | Reanimated worklets; Skia only if a genuinely custom canvas appears | §8.3 |
| Analytics | Vendor-agnostic `track()` facade over one provider | §8.4 |
| New industry modules | Feature slice + route file + query hook; catalog is already server-driven (`GET /catalog/industries`) | §8.6 |

## 1.4 What is deliberately *not* in the stack

| Not using | Because |
| --- | --- |
| Redux / Redux Toolkit | The app has almost no shared client state. TanStack Query owns the server cache; three Zustand slices own the rest. Redux would be ceremony around nothing |
| GraphQL / Apollo | The server contract is a fixed REST envelope with `/summary` siblings, already designed screen-by-screen in `../docs/07-screen-to-endpoint-map.md`. There is no over-fetching problem to solve |
| A component library (Paper, UI Kitten, Tamagui UI) | 531 final design variables and a bespoke hexagon language. Every library component would need overriding into unrecognisability. Build the ~20 primitives the handoff lists instead |
| NativeWind / Tailwind | See `04-design-tokens-and-theming.md` §4.5 |
| A monorepo | One app, one folder. If a web influencer portal appears later, promote `src/tokens` and `src/api` into pnpm workspace packages then — not now |
| Expo Go as the dev target | Native modules (maps, camera, Firebase) do not exist in Expo Go. Use a **development build** from day one so the dev environment never diverges from production |
| `react-native-webview` screens | Nothing in the spec needs one, and a WebView on a 2 GB device is the fastest way to lose the performance budget |
