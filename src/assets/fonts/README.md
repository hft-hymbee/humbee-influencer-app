# Lato font files go here

**Currently empty, and that is a tracked gap** — see `src/theme/typography.ts` and
`docs/06-inputs-needed.md`.

The design spec ships `docs/design-spec/tokens/fonts.css`, which imports Lato from Google Fonts
as a **webfont**. That does nothing in React Native: RN needs the `.ttf` files bundled into the
native projects.

## To fix

1. Drop these files here:
   - `Lato-Regular.ttf` (400)
   - `Lato-SemiBold.ttf` (600) — **see the caveat below**
   - `Lato-Bold.ttf` (700)
2. Link them: `npx react-native-asset`, or manually into
   `android/app/src/main/assets/fonts/` and the Xcode target's `Info.plist` `UIAppFonts`.
3. Set `FONTS_BUNDLED = true` in `src/theme/typography.ts`.
4. Verify the 1.54 line-height ratio on a real Android device against
   `docs/design-spec/prototype/prototype-standalone.html`. `includeFontPadding: false` is
   already applied to every variant; without it the rhythm is off by 1-3px.

## The 600-weight caveat

Google Fonts' Lato ships **100 / 300 / 400 / 700 / 900 — there is no 600**. The design spec
calls for 400/600/700 and uses 600 for the leaderboard influencer name and several emphasised
styles.

Either license a Lato SemiBold cut, or reassign those styles to 400/700. **Do not silently round
600 up to 700** — it changes the visual weight of the leaderboard, which is the most-looked-at
screen in the app. Confirm with the designer before shipping.

## Licence

Lato is under the SIL Open Font License, which permits app embedding — but confirm the specific
cut you ship, and confirm licensing for every Indic companion face too (Noto Sans Devanagari,
Gujarati, Tamil, …). Each script adds roughly 150-400 KB against a 30 MB APK budget, so the
bundled-vs-on-demand decision belongs in Phase 0.
