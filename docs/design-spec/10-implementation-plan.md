# 10 — Implementation plan

## Recommended stack
| Layer | Choice | Why |
| --- | --- | --- |
| Client | **React Native + Expo** (TypeScript) | One codebase for the Android-first field audience with an iOS build for the internal team; OTA updates matter when users cannot be relied on to update from the store |
| Navigation | React Navigation — native stack + bottom tabs | Matches the design's shell exactly |
| State / data | TanStack Query for server state, Zustand (or Context) for UI state | The screens are read-heavy with per-manufacturer/period caching |
| Styling | A tokens module + `StyleSheet` (or Unistyles / Tamagui) | Tokens must be typed and single-sourced |
| Storage | `expo-secure-store` for tokens, MMKV for preferences and the offline queue | |
| Animation | Reanimated 3 | Covers every keyframe in docs/05 |
| Lottie | `lottie-react-native` | Success screen |
| API | Generated client from an OpenAPI spec once docs/07 is agreed | |

If the product must be a **web app** instead, use Next.js + Tailwind with the tokens as CSS variables; the design is a mobile viewport and translates directly.

## Phase 0 — foundations (before any screen)
1. Port `tokens/*.css` into a typed tokens module: colours, type ramp, spacing, radius, elevation, motion.
2. Set up Lato (400/600/700) and verify the 1.54 line-height ratio renders correctly on Android.
3. Extract the HUMBEE icon set as a typed `<Icon name size />` component. **Do not substitute another icon library.**
4. Build the primitives: `Button`, `Input`, `Select`, `Card`, `ListRow`, `StatTile`, `StatusBadge`, `HexMark`, `Chip`, `EmptyState`, `Skeleton`.
5. Build the shell: header, bottom nav, scroll container, safe-area handling.

## Phase 1 — auth
Login → OTP → Home, with secure token storage, refresh, and a cold-start route guard. Ship behind fixtures if the OTP API is not ready.

## Phase 2 — read screens (highest value, lowest risk)
Leaderboard → Inventory Allocated → Rewards. All three share the manufacturer tab bar and (for two) the period pills; build those as shared components first.

## Phase 3 — the core action
Capture Demand → Demand Captured → My Demands. This is where the business value sits and where the state machine is non-trivial; leave it until the primitives are settled.

## Phase 4 — profile and hardening
Profile, Log Out, Delete Account, then the whole of `09-qa-checklist.md`: skeletons, empty states, offline queue, reduced motion, localisation pass.

## Backend work to run in parallel
1. Agree `07-api-contract.md` field names against the operations platform.
2. Points engine: multiplier table per manufacturer/SKU, posting on allocation, ledger.
3. District → onboarded-manufacturer resolution (this drives the demand fork).
4. OTP provider, rate limits, resend policy.
5. Leaderboard materialisation — rank per manufacturer per district, refreshed on ledger writes rather than computed per request.

## Definition of done for a screen
- Matches its spec in `04-screens/` and the live prototype at 390×844.
- Every state in `09-qa-checklist.md` for that screen is implemented.
- Wired to a fixture, then to the API, with loading / empty / error handled.
- No hardcoded colour, size or string outside the tokens module and the copy catalogue.
