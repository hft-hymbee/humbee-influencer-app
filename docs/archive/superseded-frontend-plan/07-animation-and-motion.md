# 07 — Animation and motion

## 7.1 The mandate

The handoff's motion spec (docs/05) is short and strict: *"Restrained and functional. 120ms for
colour/shadow, 200ms for size/position, all on `cubic-bezier(0.4, 0, 0.2, 1)`. Nothing scales or
shrinks on press. No bounce, no spring, no parallax."*

That single easing curve is the whole motion system:

```ts
// shared/tokens/motion.ts — GENERATED
import { Easing } from 'react-native-reanimated';
export const motion = {
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  colour: 120, expand: 160, position: 200, rise: 240, section: 260,
  fill: 400, slide: 420, carouselInterval: 4000,
  shimmer: 1200, otpResendSeconds: 24,
} as const;
```

Ban `withSpring` in lint. Every animation in this app is `withTiming(value, { duration, easing:
motion.standard })`. A single spring anywhere is a visible spec violation.

## 7.2 Every keyframe, mapped

| Handoff keyframe | Where | Reanimated implementation |
| --- | --- | --- |
| `humbeeRise` — opacity 0→1, translateY 16→0 | Login brand block (240ms); demand sections (200ms); points body (160ms); podium cards (260ms, 70ms stagger) | `entering={FadeInDown.duration(d).easing(motion.standard).delay(i*step)}` on a `Animated.View`, or a shared value pair for the collapsible |
| `humbeeRowIn` — opacity 0→1, translateY 8→0 | Leaderboard rows (200ms, 35ms stagger); My Demands (45ms); allocation + gift cards (50ms) | Same entering-animation pattern, `translateY: 8` |
| `humbeeFill` — `scaleX(0→1)` | Leaderboard progress bars, 400ms, same delay as its row, `transform-origin: left` | `withDelay(i*35, withTiming(1, {duration: 400}))` driving `scaleX`, with `transformOrigin: 'left'` (or a left-anchored wrapper on older RN) |
| `humbeeSlide` — opacity + max-height | Points explainer expand | **Do not port `max-height`.** RN has no `max-height` animation. Use Reanimated's `useAnimatedStyle` over a measured height, or `LinearTransition` layout animation on the parent |
| `humbeeGlow` — pulsing box-shadow ring | Attention pulse | `withRepeat(withTiming(...), -1, true)` on a sibling overlay view's opacity + scale. Animating shadow radius directly is expensive on Android; animate an absolutely-positioned ring view instead |
| `humbeeShimmer` — background-position sweep | Skeleton, 1200ms linear infinite | An `expo-linear-gradient` band translated across the bar by `withRepeat(withTiming(width, {duration: 1200, easing: Easing.linear}), -1)`. Do not animate `backgroundPosition` — it does not exist in RN |
| Carousel translate, 420ms | Home banner track | `withTiming(-index * slideWidth, {duration: 420, easing: motion.standard})` on the track's `translateX` |
| Caret rotate 180°, 200ms | Profile "Advanced" | `withTiming` on `rotate` |
| Colour / background / shadow, 120ms | Tabs, chips, pills, cards, nav, UOM buttons, OTP rings | `interpolateColor` inside `useAnimatedStyle` over a 0→1 progress shared value |

### The stagger

The handoff specifies `index × step` as `animation-delay` with `animation-fill-mode: both`. In
Reanimated, `entering` animations accept `.delay(ms)`, and `fill-mode: both` is the default
behaviour — the view is not visible before its delay elapses. So:

```tsx
<Animated.View entering={FadeInDown.duration(200).delay(index * 35).easing(motion.standard)} />
```

**With FlashList, cap the stagger.** Recycled rows re-run their entering animation on reuse, so an
un-capped `index * 35` means row 40 fades in over 1.4 seconds mid-scroll. Apply the stagger only to
indices below the first viewport (roughly `Math.min(index, 8) * 35`) and disable it entirely for rows
mounted during a scroll. This is the one place where the handoff's web-prototype semantics and a
recycling list genuinely conflict, and the design intent — "the first screenful arrives in sequence" —
is preserved by the cap.

## 7.3 Press states

The handoff maps hover to pressed on touch: filled → the `200` dark step, outline/text → the `5`
tint, pressed → the `20` tint, disabled → `neutral25` background with `neutral100` text and
**never an opacity fade**.

That last clause rules out bare `TouchableOpacity`, whose entire behaviour is an opacity fade. Use
`Pressable` with a style function driving a 120ms colour transition, and build it once into
`shared/ui/Button` and a `PressableRow` primitive so no screen reaches for a Touchable.

Also: `android_ripple` must be configured or disabled deliberately. The Material ripple is the default
on Android and is not in this design system — an unmanaged ripple is a fidelity bug in every tappable
row of the app.

## 7.4 The skeleton

Component C21 is the most reused animation in the app and its rules are exact:

- **Shapes match the real element**: `radius.s` (4) for text lines, `radius.m` (8) for cards and
  tiles, pill for chips, and the **hexagon clip-path** for hex marks. The handoff is emphatic: *"Never
  grey blocks with the wrong shape."* The hexagon requires `react-native-svg` (a `ClipPath`, or an
  `Svg` polygon filled with the shimmer band), not a `borderRadius`.
- **Card chrome is real** — white background, `radius.m`, 1px `neutral25` border, 16px padding. Only
  the content inside shimmers. This is what makes it read as "the screen, loading".
- **`accessibilityState={{ busy: true }}`** on the container, and "Loading" announced **once** — not
  per bar. Set `accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"` on
  the shimmer bars so TalkBack does not read forty anonymous views.
- **Counts are fixed**: 4 tabs, 2 tiles, 3 cards. Do not animate the count.
- Under reduced motion, flat `neutral10` with no shimmer.

One performance note: a screen skeleton contains ~25 shimmering bars. Drive them all from **one**
shared value in a context, not 25 independent `withRepeat` loops. Twenty-five infinite timers on a
2 GB device is measurable, and it is the first frame the user ever sees.

## 7.5 Reduced motion

`AccessibilityInfo.isReduceMotionEnabled()` plus its change listener, exposed as
`useReducedMotion()`. The handoff's rules, which are more nuanced than "turn everything off":

| Under reduced motion | Behaviour |
| --- | --- |
| Entry animations (`humbeeRise`, `humbeeRowIn`) | Skip — render the final state |
| Celebration Lottie on Demand Captured | Skip; show the success mark statically |
| 120ms colour transitions | **Keep.** *"They aid comprehension and are not motion-heavy"* |
| Skeleton shimmer | Flat `neutral10` |
| Carousel auto-advance | Stop; dots stay functional |

The "keep colour transitions" clause is the interesting one — the naive implementation, gating every
animation behind one boolean, breaks the design intent. Gate per-category.

## 7.6 Haptics

`expo-haptics`, light impact, on exactly three events: OTP complete, demand submitted, manufacturer
tab change. *"Nothing else."* Put them behind `shared/native/haptics.ts` so the three call sites are
greppable and a fourth requires a deliberate change.

## 7.7 Timers

Both timers in the app must be cleared on unmount (handoff §05), and both have a subtlety:

- **Carousel, 4000ms**, wrapping 0 → 1 → 0. Tapping a dot jumps *and resets the timer*. It must also
  pause when the screen is not focused (`useFocusEffect`) — otherwise it keeps ticking behind the
  Leaderboard, burning CPU and battery on a device that has neither to spare.
- **OTP resend, 24s.** Compute from a stored start timestamp, not by decrementing a counter. A
  decrementing interval drifts when the app is backgrounded and can leave resend disabled forever
  after a phone call interrupts the flow.

## 7.8 When to reach for Skia

`@shopify/react-native-skia` is deliberately **not** in the v1 stack. Nothing in these ten screens
needs it: the medals are static SVG, the hexagons are clip-paths, the shimmer is a translated
gradient.

Add it when a real canvas requirement appears — a custom points chart with 60fps interaction, a live
site map with hundreds of animated markers, an image annotation surface on top of the camera. Adding
it then costs an install; adding it now costs an ongoing native dependency and a second rendering
mental model for no benefit.
