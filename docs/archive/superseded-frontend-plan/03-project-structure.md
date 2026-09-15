# 03 — Project structure

## 3.1 Where the app lives

```
humbee_influencer_backend/          ← this repo
├── contracts/openapi.yaml          ← the server contract the app generates types from
├── docs/                           ← server specification
└── frontend/
    ├── docs/                       ← these documents
    └── app/                        ← the React Native application (created in Phase 0)
```

The app is a folder in this repo, not a submodule. That is the point of the co-location: a pull
request that changes `contracts/openapi.yaml` and the screen consuming it is **one** review.
CI path filters (`10-quality-testing-and-ci.md` §10.6) keep the mobile pipeline from running on
server-only commits and vice versa.

## 3.2 Inside `frontend/app/`

Feature-sliced, not layer-sliced. A layer-sliced tree (`components/`, `screens/`, `hooks/`) puts
every change to one screen in four distant folders; that is the structure that rots first.

```
frontend/app/
├── app.config.ts                 # Expo config: name, icons, plugins, permissions, EAS channels
├── eas.json                      # build profiles: development / preview / production
├── tsconfig.json                 # strict, noUncheckedIndexedAccess, path aliases
├── package.json
├── metro.config.js
├── .env.example                  # EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_ENV
│
├── src/
│   ├── routes/                   # Expo Router file tree — routing ONLY, no business logic
│   │   ├── _layout.tsx           # providers: Query, i18n, Sentry, fonts, safe-area
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx       # stack, no bottom nav
│   │   │   ├── phone.tsx
│   │   │   └── otp.tsx
│   │   ├── (app)/
│   │   │   ├── _layout.tsx       # bottom tabs: home | leaderboard | demand | inventory | rewards
│   │   │   ├── home.tsx
│   │   │   ├── leaderboard.tsx
│   │   │   ├── demand/
│   │   │   │   ├── index.tsx     # Capture Demand
│   │   │   │   └── list.tsx      # My Demands
│   │   │   ├── inventory.tsx
│   │   │   └── rewards.tsx
│   │   ├── demand-done.tsx       # full-screen, outside the tab group (no bottom nav)
│   │   └── profile.tsx           # pushed from the header person icon
│   │
│   ├── features/                 # one folder per domain. Features MUST NOT import each other.
│   │   ├── auth/
│   │   │   ├── api/              # useRequestOtp, useVerifyOtp, useLogout
│   │   │   ├── components/       # OtpBoxes, PhoneField, ResendTimer
│   │   │   ├── screens/          # PhoneScreen, OtpScreen  (the route file renders these)
│   │   │   └── model/            # session store slice, cold-start route guard
│   │   ├── home/
│   │   ├── leaderboard/
│   │   ├── demand/
│   │   ├── allocation/
│   │   ├── rewards/
│   │   └── profile/
│   │
│   ├── shared/                   # everything more than one feature needs
│   │   ├── tokens/               # GENERATED from design/tokens/*.css — never hand-edited
│   │   │   ├── colours.ts  typography.ts  spacing.ts  radius.ts  elevation.ts  motion.ts
│   │   │   └── index.ts
│   │   ├── ui/                   # the design-system primitives from handoff docs/03
│   │   │   ├── Button/ Input/ Select/ Card/ ListRow/ StatTile/ StatusBadge/
│   │   │   ├── HexMark/ Chip/ EmptyState/ Skeleton/ ProductMark/ Illustration/
│   │   │   └── Icon/             # GENERATED typed wrappers over the 102 HUMBEE glyphs
│   │   ├── composites/           # cross-feature composites from handoff docs/03 §C
│   │   │   ├── ManufacturerTabs/ PeriodPills/ AppHeader/ BannerCarousel/
│   │   │   └── ErrorRetryCard/ OfflineBanner/
│   │   ├── api/
│   │   │   ├── generated/        # GENERATED from ../../contracts/openapi.yaml
│   │   │   ├── client.ts         # fetch wrapper: envelope unwrap, auth, retry, timeout
│   │   │   ├── queryClient.ts    # TanStack Query defaults + MMKV persister
│   │   │   ├── keys.ts           # the single query-key factory
│   │   │   └── outbox.ts         # offline mutation queue
│   │   ├── store/                # Zustand slices: session, selection, demandDraft
│   │   ├── i18n/                 # i18next init + locales/{en,hi,mr}.json
│   │   ├── analytics/            # track() facade + provider adapter  (see 08 §8.4)
│   │   ├── native/               # facades over native modules: maps, camera, location, haptics
│   │   ├── format/               # en-IN number/date/quantity formatting
│   │   └── lib/                  # tiny generic utils only. If it grows a domain, it is a feature
│   │
│   └── assets/
│       ├── fonts/                # Lato-Regular, Lato-SemiBold, Lato-Bold
│       ├── icons/                # HUMBEE SVG source, input to the Icon codegen
│       ├── img/                  # copied from the handoff's assets/img
│       └── lottie/               # celebration.json, success-green.json
│
├── fixtures/                     # symlink or sync of the handoff's data/*.json (Phase 0–2)
├── scripts/
│   ├── gen-tokens.ts             # design/tokens/*.css  → src/shared/tokens/*.ts
│   ├── gen-icons.ts              # assets/icons/*.svg   → src/shared/ui/Icon/glyphs.ts
│   └── gen-api.ts                # contracts/openapi.yaml → src/shared/api/generated/
└── __tests__/                    # cross-feature integration tests; unit tests sit beside source
```

## 3.3 The import rules CI enforces

Configured with `eslint-plugin-boundaries`. These four rules are what make the tree survive.

| Rule | Rationale |
| --- | --- |
| `routes/` may import `features/` and `shared/`. Nothing may import `routes/` | Routing stays a thin edge. Swapping the router later touches one folder |
| `features/*` may import `shared/` but **never another feature** | The property that makes a 20th industry module cost the same as the 4th. If two features need something, it moves to `shared/` — deliberately, in its own commit |
| `shared/ui` and `shared/tokens` may import nothing outside themselves | Primitives stay presentational; a Button that reaches for a query hook is untestable and unreusable |
| Only `shared/api` may import `shared/api/generated` | One place absorbs a contract change |

Two more, enforced by convention and review:

- **Nothing outside `shared/native` may import a native module directly.** Screens call
  `useCamera()`, never `expo-camera`. This is what makes the migration in §8.2 a one-file change.
- **Generated folders carry a header banner and are in `.prettierignore`.** A hand-edit is a
  regeneration away from being lost; make it obvious.

## 3.4 Naming

| Thing | Convention | Example |
| --- | --- | --- |
| Component file + folder | `PascalCase/index.tsx` | `HexMark/index.tsx` |
| Hook | `useThing.ts` | `useLeaderboard.ts` |
| Query key factory entry | `keys.leaderboard(mfr)` | in `shared/api/keys.ts` only |
| Token | mirrors the design system name | `colours.primary100`, not `colours.brown` |
| Domain vocabulary | exactly the handoff's §01 table | `influencer`, `vcp`, `manufacturer`, `demand`, `allocation`. Never `user`, never `customer` |
| Test | `Thing.test.tsx` beside the source | `HexMark.test.tsx` |

The vocabulary rule is not cosmetic. The handoff is explicit that UI copy never says "user", and the
server contract uses `influencer` throughout. Code that drifts to `user` produces UI that drifts too.

## 3.5 Path aliases

```jsonc
// tsconfig.json
{ "compilerOptions": { "paths": {
  "@features/*": ["src/features/*"],
  "@shared/*":   ["src/shared/*"],
  "@tokens":     ["src/shared/tokens"],
  "@ui/*":       ["src/shared/ui/*"],
  "@assets/*":   ["src/assets/*"]
}}}
```

Aliases keep the boundary rules readable in a lint error, and they make a `../../../../` import — the
first symptom of a misplaced file — impossible to write by accident.
