# 05 — Interactions and motion

## Principles
Restrained and functional. 120ms for colour/shadow, 200ms for size/position, all on `cubic-bezier(0.4, 0, 0.2, 1)`. Nothing scales or shrinks on press. No bounce, no spring, no parallax.

## Keyframes (verbatim from the design)
```css
@keyframes humbeeRise  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes humbeeRowIn { from { opacity: 0; transform: translateY(8px);  } to { opacity: 1; transform: none; } }
@keyframes humbeeFill  { from { transform: scaleX(0); }  to { transform: scaleX(1); } }
@keyframes humbeeSlide { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 400px; } }
@keyframes humbeeGlow  { 0%,100% { box-shadow: 0 0 0 0 rgba(255,165,37,0); } 50% { box-shadow: 0 0 0 6px rgba(255,165,37,0.22); } }
@keyframes humbeeShimmer { from { background-position: -240px 0; } to { background-position: 240px 0; } }
```

## Where each is used
| Animation | Duration | Applied to |
| --- | --- | --- |
| `humbeeRise` | 240ms | Login brand block on mount |
| `humbeeRise` | 260ms, 70ms stagger | Podium cards |
| `humbeeRise` | 200ms | Demand screen sections as they appear (sub-industry, manufacturer, no-manufacturer branch, quantity card) |
| `humbeeRise` | 160ms | Points-explainer expanded body |
| `humbeeRowIn` | 200ms, 35ms stagger | Leaderboard rows |
| `humbeeRowIn` | 200ms, 45ms stagger | My Demands cards |
| `humbeeRowIn` | 200ms, 50ms stagger | Allocation cards, gift cards |
| `humbeeFill` | 400ms, same delay as its row | Leaderboard progress bars (`transform-origin:left`) |
| Carousel translate | 420ms | Home banner track |
| Caret rotate | 200ms | Profile "Advanced" chevron |
| Colour / background / box-shadow | 120ms | Tabs, chips, pills, cards, nav, UOM buttons, OTP rings |
| `humbeeShimmer` | 1200ms linear, infinite | Skeleton loader bars (component C21) |

All staggers are computed as `index × step` and applied as `animation-delay`, with `animation-fill-mode: both`.

## Loading behaviour
| Trigger | Treatment | Prototype timing |
| --- | --- | --- |
| Entering a data screen (Home, Leaderboard, Capture Demand, My Demands, Inventory Allocated, Rewards) | Screen skeleton in the scroll body; header and nav stay live | 900ms |
| Switching manufacturer tab | Same skeleton — the whole body is manufacturer-scoped | 600ms |
| Switching period | Same skeleton | 600ms |
| Switching status filter | **No skeleton** — filtering is local to data already loaded | — |
| Submitting a demand / requesting an OTP | Button loading state, not a skeleton | — |
| Login and Demand Captured screens | Never a skeleton | — |

In production these durations are however long the request takes. Show the skeleton immediately (no delay-before-skeleton) — on 3G the alternative is a blank screen. If a response arrives in under ~150ms, still paint one skeleton frame rather than flashing.

Failure after a skeleton: replace the skeleton with the error/retry card in the same position; do not fall back to an empty state.

## Timers
- Home carousel auto-advances every **4000ms**, wrapping 0 → 1 → 0. Tapping a dot jumps immediately; the timer should reset on manual interaction.
- OTP resend countdown is **24 seconds**.
- Both must be cleared on unmount.

## Gestures
| Gesture | Where |
| --- | --- |
| Horizontal scroll | Manufacturer tabs, sub-industry cards, status filter chips, demand filter chips. Scrollbars are hidden; content is padded 16px so the first and last item clear the edge |
| Tap | Everything else. There are no long-press, swipe-to-delete or drag interactions in v1 |
| Sticky | Demand trail (top of scroll area), leaderboard current-user card (bottom) |

## Focus and press states
Follow the DS: hover on filled → `200` dark step; hover on outline/text → `5` tint fill; pressed → `20` tint; focus → `10` tint as a 4px ring; disabled → neutral-25 background with neutral-100 text (never opacity fade).

On touch platforms, map "hover" to the pressed state.

## Reduced motion
When `prefers-reduced-motion: reduce`:
- Skip entry animations (render final state).
- Skip the celebration Lottie on the success screen; show the success mark statically.
- Keep the 120ms colour transitions — they aid comprehension and are not motion-heavy.
- Render skeleton bars as flat `#F2F2F2` with no shimmer.
- Stop the carousel auto-advance; keep the dots functional.

## Haptics (native only)
Light impact on: OTP complete, demand submitted, manufacturer tab change. Nothing else.
