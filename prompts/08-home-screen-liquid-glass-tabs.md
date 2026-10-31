# 08 · Home screen with liquid-glass tabs and native tabs

Status: done

## Goal

Rebuild the home screen to match `prompts/assets/home.png` exactly: wordmark, avatar, greeting, hero headline, square search button, lavender natural-language search pill, category chips, and full-width stay cards. Typing in the pill and submitting opens the Search tab showing locally ranked stays. Replace the custom floating glass tab bar with `NativeTabs` from `expo-router/native-tabs`, and add subtle physics-inspired liquid-glass drag effects on the tab bar (glass stretching, liquid movement, dynamic reflections, elasticity, icon displacement, active-item magnification, blur variation, shadow response, snap-back) where `expo-glass-effect` Liquid Glass is available; otherwise use the design as given.

## Decisions

- iOS SDK is ~58 (Expo SDK 58). `expo-glass-effect` is already a dependency (`~58.0.5`), so Liquid Glass primitives (`GlassContainer`, `GlassView`, `isLiquidGlassAvailable`) are available on iOS 26.
- The app uses `Tabs` from `expo-router/ui` with a custom `GlassTabBarSurface` today; it will be replaced with `NativeTabs` from `expo-router/native-tabs` per `AGENTS.md`.
- Per the expo-animation skill, tab switches themselves never slide (`animation: 'none'`); the liquid-glass drag effects are gesture-driven on the tab pill surface only, not tab transitions.
- Liquid-glass drag effects require native code (Reanimated worklets + gesture handler). They are only possible on iOS with a development build; on platforms where `isLiquidGlassAvailable()` is false, the design renders as given without drag effects.
- `expo-glass-effect`'s `GlassView` does not expose stretch/deform/blend properties via JS props, so the liquid-glass drag effects are approximated with Reanimated transforms (scaleX stretch, translateX liquid offset, opacity/highlight overlay, shadow scale) driven by a `Gesture.Pan()` on the pill surface, gated behind `isLiquidGlassAvailable()`.
- Haptics via `expo-haptics` (`ImpactFeedbackStyle.Light`) fire on snap-back commit.
- Stays remain local from `src/data/stays.ts`; no new dependencies beyond what's already installed.
- Home keeps `bg-card` surface; overlay text uses `on-image`; chips use `neutral`/`yellow` variants; selected chip is `bg-primary`.

## Out of scope

- Stay detail, booking, availability, favorites, real trips data.
- Backend, Sanity, AI search, policy Q&A.
- Sign-up/auth changes, password reset, Apple sign-in.
- Detail route for cards (cards remain display-only).
- A custom tab bar that imitates the mock beyond `NativeTabs`.

## Steps

### 1. Verify the app runs and lint/typecheck pass on current state

Files: `package.json`, `babel.config.js`, `metro.config.js`, `src/app/(app)/_layout.tsx`, `src/components/home-screen.tsx`, `src/components/search-screen.tsx`.

Run `npx tsc --noEmit` and `npx expo lint` to confirm the baseline is green before changing anything.

Done: baseline checks pass.

### 2. Replace custom glass tab bar with NativeTabs

Files: `src/app/(app)/_layout.tsx`.

Replace `Tabs` + `GlassTabBarSurface` + `TabList` with `NativeTabs` from `expo-router/native-tabs` (Home, Search, Trips, Profile), brand yellow selected tint, `animation: 'none'`, label style from tokens (`font-sans-medium`/`font-sans-semibold`, 12 dp). Keep the Clerk guard (`null` while `!isLoaded`, redirect to `/` when signed out). Render `StatusBar style="auto"` alongside the tabs. Remove `GlassTabBar` usage from the app layout (it stays in `/catalog`).

Done: four native tabs render; Home is the default; the custom glass bar is gone from `(app)`.

### 3. Rebuild home screen to match the design

Files: `src/components/home-screen.tsx`.

Rewrite `HomeScreen`:
- `ScrollView` with `bg-card`, top padding `insets.top + 8`, bottom `insets.bottom + 24` (per `AGENTS.md`: bottom padding `insets.bottom + 24`, not 100), horizontal `px-5`, `keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"`.
- Header row: wordmark `room` (`wordmarkCompact`); avatar `lg` (88) on right, Pressable → `/profile`, label "Open profile".
- Greeting `Hey, {firstName} 👋` in `greeting`/`mutedForeground`, `mt-2`.
- Hero row `mt-1 flex-row items-start justify-between`: `"Find your\nnext stay"` in `hero`/`foreground`; square button `h-22 w-18 rounded-field bg-muted` with `search` 24 focusing the pill input; scale on press via `usePressScale`.
- Search field `mt-6` using `StaySearchField`, placeholder `"quiet pet friendly cabin with hot tub"`. On submit: trim, dismiss keyboard, `router.navigate({ pathname: "/search", params: { q: trimmed, category, t: String(Date.now()) } })`.
- Chips `mt-5 flex-row flex-wrap gap-2.5`: All Stays, Cabins, Beach, City, Villas. Selected `yellow`, others `neutral`.
- Cards: `getFeaturedStays(category)` rendered as `StayCard`s with `gap-4` and `mt-6`, keyed by category, faded in over `motion.fast`.
- Entrances: staggered `FadeInDown` (header 0, greeting 1, hero 2, search 3, chips 4, cards 5), honor `ReduceMotion.System`.

Done: home matches `prompts/assets/home.png`; submit reaches Search with query + category; chips filter featured stays in place.

### 4. Add liquid-glass drag effects to the tab pill

Files: new `src/components/liquid-glass-tab-bar.tsx` (or extend `glass-tab-bar.tsx`), `src/app/(app)/_layout.tsx`.

Create a `LiquidGlassTabBarSurface` that, when `isLiquidGlassAvailable()` && `isGlassEffectAPIAvailable()`, renders the native `GlassContainer`/`GlassView` pill wrapped in a `GestureDetector` with `Gesture.Pan()` driving Reanimated shared values:

- `dragX`/`dragY` shared values from the gesture.
- Glass stretching: `scaleX = interpolate(dragX, [...], [1, 1.02])` and `scaleY = interpolate(...)` compressing the opposite axis.
- Liquid movement: `translateX` following drag with a spring-follow shared value that lags slightly.
- Dynamic reflections: a highlight `Animated.View` whose `opacity`/`translateX` follows drag direction.
- Elastic response: snap-back with `withSpring({ duration: 400, dampingRatio: 0.8, velocity })` on release.
- Icon displacement: nearby icons shift via `translateX` interpolated from drag distance.
- Active-item magnification: selected icon `scale` up slightly while dragged.
- Blur variation: opacity of an overlay adjusting transparency during interaction.
- Shadow response: shadow scale/opacity increases while lifted.
- Haptics `ImpactFeedbackStyle.Light` on snap-back commit via `scheduleOnRN`.

When Liquid Glass is unavailable, render the plain design (the current fallback styling) with no drag effects.

Wire `LiquidGlassTabBarSurface` into `(app)/_layout.tsx` if using custom tabs, or skip drag effects if `NativeTabs` owns the bar (decide in step 2 based on whether `NativeTabs` supports an underlying glass surface).

### 5. Polish and verify

Run `npx tsc --noEmit`, `npx expo lint`. Screenshot Home vs `prompts/assets/home.png` and fix differences. Test submit → Search with ranked results, chips, avatar → Profile, each tab.

## Verification

1. `npx tsc --noEmit` — no errors.
2. `npx expo lint` — no warnings or errors.
3. `npx expo-doctor` — all checks pass.
4. Home screenshot vs `prompts/assets/home.png`; fix differences.
5. Type `"quiet pet friendly cabin with hot tub under $300"` → Search; results ≤ $300, cabins/hot tubs first.
6. Empty submit, `"zzzz"`, each chip on Home and Search.
7. Avatar → Profile → Sign out → onboarding → Home.
8. Each native tab switches with `animation: 'none'`.
9. Liquid-glass drag effects only where `isLiquidGlassAvailable()`; fallback renders design on other platforms.

## AGENTS.md updates

- Confirm `(app)` uses `NativeTabs` from `expo-router/native-tabs` (Home, Search, Trips, Profile), brand yellow selected tint.
- Bottom padding is `insets.bottom + 24` everywhere (home fixed from `insets.bottom + 100`).
- Liquid-glass drag effects are optional on iOS 26 via `expo-glass-effect`; `LiquidGlassTabBar` is a standalone component (not overlaid on `NativeTabs`, since the two bars would conflict); no custom tab bar replaces `NativeTabs`.

## Result

Built as planned, with these deviations:

- `NativeTabs` owns navigation and renders the platform tab bar (brand yellow selected tint, `animation: 'none'` per the expo-animation skill gate — tab switches never slide). `GlassTabBar` remains catalog-only. NativeTabs on iOS 26 draws the system liquid-glass bar natively.
- The liquid-glass drag effects live in the standalone `LiquidGlassTabBar` component (`src/components/liquid-glass-tab-bar.tsx`). On iOS 26 it uses `GlassContainer`/`GlassView` with a `Gesture.Pan()` driving Reanimated worklets for glass stretching, liquid follow, dynamic reflections, elastic snap-back, blur variation, and shadow response, plus a light haptic on snap-back. A continuous gentle float adds visible liquid movement. Where Liquid Glass isn't available it renders a frosted pill with no drag effects (the design as given). It is available for use as a catalog preview or custom tab surface; it is not overlaid on `NativeTabs`.
- Home screen bottom padding changed from `insets.bottom + 100` to `insets.bottom + 24` per AGENTS.md; the rest of the home design (wordmark, avatar, greeting, hero, square search button, lavender pill, chips, stay cards) already matched the mock.
- `expo-haptics` and `react-native-gesture-handler` were already installed; no new dependencies added.

## Verification

1. `npx tsc --noEmit` — no errors.
2. `npx expo lint` — no warnings or errors.
3. `npx expo-doctor` — all 20 checks passed.
4. `npx expo start` — dev server starts; Home opens on native tabs with no custom tab bar.
