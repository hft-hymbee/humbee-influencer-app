# 09 — Performance budget

## 9.1 The target device

Budgets are meaningless without a device. The handoff names it: *"Android phone (often ₹12,000),
intermittent 4G"*.

| | Reference device |
| --- | --- |
| Class | Entry-level Android, ₹8,000–₹12,000, 2020–2023 vintage |
| Concrete examples | Redmi A2 / A3, Realme C-series, Samsung Galaxy M04, Moto E-series |
| SoC | Snapdragon 4xx / Helio G-series / Unisoc T-series |
| RAM | 2–3 GB, of which the OEM skin has already taken a lot |
| Storage | 32–64 GB eMMC, usually >80% full |
| Network | 4G that drops to 2G-equivalent throughput; 300–800ms RTT is normal |
| Android | 11–14, minSdk per the current Expo default |

**Buy two of these and keep them on the desk.** Every number below must be measured there, not on a
Pixel and not in an emulator. An emulator on an M-series Mac is faster than the target device and will
hide every problem this document exists to catch.

## 9.2 Budgets

| Metric | Budget | Fails if |
| --- | --- | --- |
| Cold start → first frame (splash to skeleton) | **< 2.0s** | > 3.0s |
| Cold start → Home interactive, warm cache | **< 2.5s** | > 4.0s |
| Warm start → interactive | **< 800ms** | > 1.5s |
| Tab switch (cached data) | **< 150ms**, no skeleton | any skeleton on cached data |
| Manufacturer switch (cached) | **< 150ms**, no skeleton | any skeleton on cached data |
| List scroll | **58+ fps average, zero frames > 32ms** | any dropped-frame cluster during a steady swipe |
| Android APK download size | **< 30 MB** per ABI split | > 45 MB |
| iOS IPA | < 60 MB | — |
| JS bundle (Hermes bytecode, release) | **< 4 MB** | > 6 MB |
| Peak JS heap on the heaviest screen | **< 120 MB** | > 200 MB |
| Payload per data screen | **< 60 KB** gzipped | > 150 KB |
| Time to skeleton after a tap | **< 100ms** — instant, no delay-before-skeleton | any blank frame |

The three in bold that will be hardest: cold start, APK size once Maps and camera land, and the
zero-frames-over-32ms clause on scroll.

## 9.3 What buys each budget

### Cold start

| Lever | Effect |
| --- | --- |
| **Hermes** with precompiled bytecode | No JS parse at launch. Single largest win; on by default, do not disable |
| **Inline requires** (Metro `inlineRequires: true`) | Modules load on first use rather than at bundle evaluation. Worth 200–500ms on this class of device |
| **Lazy-load routes** | Expo Router does this per-route already. Do not defeat it with a barrel file that imports every screen |
| **No eager SDK init** | The commonest regression. Analytics, maps and camera SDKs must initialise after first paint, or lazily on first use. Measure the delta when each lands (§8.7) |
| **MMKV for the pre-paint read** | Synchronous, so the selection state costs no `await`. SecureStore is the only unavoidable async read on the critical path |
| **Bundled fonts** | A fetched font is a network round trip before first text paint, and a guaranteed FOUT |
| **Don't over-hydrate** | Hydrating a large persisted query cache before first paint trades one problem for another. Hydrate the current route's keys, let the rest fill in |

### Scroll

| Lever | Effect |
| --- | --- |
| **FlashList** everywhere with more than ~15 rows | Recycles instead of mounting. The single largest scroll win |
| `estimatedItemSize` set accurately | A wrong estimate causes visible layout correction on first scroll. Measure a real row; the handoff gives them: leaderboard 60px, list rows 52–56px |
| **Memoised row components** with a stable `keyExtractor` | An unmemoised row re-renders on every parent state change |
| **No inline style objects or arrow closures in rows** | Both break memoisation. Lint for it |
| `removeClippedSubviews` on Android | Meaningful on long lists on this hardware |
| **Reanimated for row entry, not JS `Animated`** | Keeps entry animation off the JS thread while data is still settling |
| **Flatten the tree** | Every nested `View` costs on Fabric too. The card specs are 3–4 levels deep; keep them there |
| **`expo-image` with `recyclingKey`** | Prevents the previous row's image flashing in a recycled cell — the classic FlashList artefact |
| **Cap the entry stagger** (§7.2) | An uncapped `index * 35ms` makes fast scrolling look broken |

### Size

| Lever | Effect |
| --- | --- |
| **Android App Bundle with ABI + density splits** | Users download one architecture, not four. Roughly halves the delivered size |
| **ProGuard / R8 with resource shrinking** in release | Standard, but verify it is actually on in the EAS production profile |
| **Compress the banner PNGs** | `banner-1.png`, `banner-2.png`, `umang-utsav-banner.png` and the industry illustrations are the largest assets. Run them through a compressor, and prefer WebP for photographic content — the handoff's own note that the Umang Utsav banner may need rebuilding as markup is also a size win |
| **SVG for the icon set, not PNG at 3 densities** | 102 glyphs × 3 densities is a lot of PNG; `react-native-svg` components are kilobytes |
| **Audit Lottie JSON** | Lottie files with embedded raster images are surprisingly large. Check `celebration.json` |
| **One date library, or none** | `Intl` covers everything in `06` §6.8. Do not add moment or a full date-fns import for one format string |
| **`knip` in CI** | Finds the dependency someone added for one experiment and left in |

## 9.4 How each is measured

| Metric | Tool |
| --- | --- |
| Cold / warm start | `adb shell am start -W` for the native window, plus a `performance.now()` mark at first route paint reported to Sentry as a custom transaction |
| Frame drops | Flipper / React Native DevTools performance monitor; `adb shell dumpsys gfxinfo <pkg> framestats` for the hard numbers. Record a fixed 5-second swipe as the standard trace |
| JS render cost regressions | **Reassure** in CI on the five heaviest components. It fails a pull request on a render-count or duration regression — the only one of these that is automated rather than manual |
| Bundle composition | `npx react-native-bundle-visualizer`, run per release |
| APK size | The EAS build artifact size, recorded per release in the release notes |
| Heap | Android Studio Memory Profiler on the reference device, on Leaderboard after ten manufacturer switches — the most likely leak site |
| Payload sizes | Charles or the network panel against staging |

## 9.5 Standing regression gates in CI

Automate the cheap ones; schedule the rest.

- [ ] **Reassure** render-perf check on Leaderboard rows, gift cards, allocation cards, the skeleton, the demand trail
- [ ] **Bundle size check** — fail the build if the Hermes bundle grows more than 5% in one pull request
- [ ] **`knip`** — fail on unused dependencies and dead exports
- [ ] **Dependency count** — flag any pull request that adds a native dependency, for explicit review against §8.7
- [ ] **Manual, per release, on the reference device**: cold start ×3, the 5-second scroll trace on all four list screens, the full offline cold start

## 9.6 The three most likely regressions

Written down because they are predictable, and each one has been the cause of a "the app got slow"
report on a project of this exact shape.

1. **An eagerly-initialised SDK.** Analytics, maps, or an engagement SDK that runs at module load
   adds 200–600ms to cold start and nobody notices for two sprints because it is measured on a Pixel.
   Mitigation: §8.7's cold-start delta check, and Sentry's start-up transaction watched per release.
2. **`FlatList` creeping back in.** A new list screen gets built with `FlatList` because it is the
   default in every tutorial, and it is fine with the ten fixture rows in development. Mitigation:
   lint-ban `FlatList` outright and require an explicit override with a comment.
3. **An unmemoised row.** A card gains a prop derived inline in the parent's render, memoisation
   silently dies, and scroll goes from 58fps to 40fps. Mitigation: Reassure gates on exactly these
   components, which is why it is in CI rather than in a checklist.
