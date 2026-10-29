# 06 · Home, search, and native tabs

Status: done

## Goal

Guests land on a home screen that matches `prompts/assets/home.png`: a "room" wordmark, avatar, greeting, hero headline with a square search button, the lavender natural-language search pill, category chips, and full-width stay cards. Submitting the pill opens a Search tab with locally matched stays, and the four tabs (Home, Search, Trips, Profile) use Expo native tabs.

## Decisions

- The design's floating yellow-pill tab bar is replaced by `NativeTabs` from `expo-router/native-tabs`, per the request. On iOS 26 the system draws a liquid-glass bar; the selected tab uses the brand yellow tint, not a solid yellow pill. `GlassTabBar` stays as a catalog-only preview because it is part of the design system.
- Home search submits on the keyboard's search key or the pill's arrow button and navigates to `/search?q=…`. The field stays on Home; it does not open a focused search screen.
- An empty submit opens Search with no query, which lists all stays.
- Category chips on Home filter the cards in place. The Search tab repeats the chips to filter results.
- Cards are display-only for now: no detail route and no press action. The chevron stays because it is in the design.
- Sign-out moves to the Profile tab. The avatar on Home opens Profile.
- Stays come from a local seed (`src/data/stays.ts`), not Sanity or a backend. Search and filtering are pure local functions.
- Photos are remote Unsplash placeholders, allowed by `AGENTS.md`. No new dependencies, including no gradient or haptics package.
- Motion is Reanimated on the UI thread: one-time staggered entrances, a 150 ms press scale on button-like controls, a 200 ms image crossfade, and a fade when filters change. All entrance animations honor the system reduce-motion setting. No `animate-*` classes and no infinite loops.
- New design tokens, proposed rather than hardcoded:
  - `typography.hero` (46/50, Poppins Bold, −1.5), `typography.greeting` (28/34, Poppins Regular), `typography.wordmarkCompact` (32/34, Poppins ExtraBold, −1.5), and `typography.cardTitle` (27/32, Poppins Bold, −0.6).
  - `light.onImage` and `dark.onImage` = `#FFFFFF`, so text over photos does not flip in dark mode.
  - `palette.imageScrim` = `rgba(11,11,26,0.82)`, used only in the card's inline gradient.
  - `spacing["18"]` = 72 and `spacing["22"]` = 88 for the square search button and the 88 dp avatar. Other sizes use the existing 4-pt scale: `h-60` (240) card image, `h-16` (64) pill, `h-12` (48) submit circle, `h-11` (44) chip and rating badge.
- The home screen keeps the design's white `bg-card` surface. Overlay text uses `on-image`; the chevron/rating surfaces use `bg-card`.
- `StatusBar style="auto"` lives in the `(app)` layout, replacing the hardcoded `dark` in the current home.
- Defaults picked: 12 stays, three per category; `modern-cabin-hot-tub` is featured; home sorts featured first then rating. Search matches title, location, category, description, amenities, and tags, ranks by matched token count then rating, and parses `under $N` / `below $N` / `less than $N` / `max $N` into a price ceiling.

## Out of scope

- Stay detail, booking, availability/calendar, favorites, real trips data, and saving.
- Backend, Sanity, or AI search, and policy Q&A.
- A custom tab bar that imitates the mockup.
- Sign-up/auth changes, password reset, Apple sign-in.
- A dedicated dark-mode design pass beyond using semantic tokens.

## Steps

### 1. Tokens, local stay data, and search helpers

Files: `src/theme/tokens.json`, `src/components/ui/text.tsx`, `src/data/stays.ts`, `src/lib/user-name.ts`.

Add the tokens from Decisions. Add `onImage: "text-on-image"` to `AppText`'s `toneClasses`. Do not add `imageScrim` to `light`/`dark`; it lives in `palette` and is used only by the inline card gradient, so Tailwind never has to parse its `rgba()` value.

Create `src/data/stays.ts` with:

```ts
export type StayCategory = "cabins" | "beach" | "city" | "villas";

export type Stay = {
  id: string;
  title: string;
  location: string;
  category: StayCategory;
  price: number;
  rating: number;
  reviewCount: number;
  guests: number;
  bedrooms: number;
  baths: number;
  amenities: string[];
  tags: string[];
  description: string;
  image: string;
  featured?: boolean;
};

export const STAY_CATEGORIES: {
  id: StayCategory | "all";
  label: string;
  icon: IconName;
}[];
```

Seed these 12 stays (add a realistic one- or two-sentence description and 4–6 amenities each; tags are the soft-intent words search uses):

| id | title | location | category | price | rating | reviews | tags |
| --- | --- | --- | --- | --- | --- | --- | --- |
| modern-cabin-hot-tub | Modern Cabin with Hot Tub | Lake Arrowhead, CA | cabins | 280 | 4.9 | 342 | quiet, pet friendly, hot tub, fireplace, forest |
| cedar-ridge-cabin | Cedar Ridge Retreat | Big Bear Lake, CA | cabins | 215 | 4.8 | 186 | secluded, cozy, hot tub, dog friendly, fireplace |
| pine-a-frame | Pine A-Frame Hideaway | Tahoe City, CA | cabins | 245 | 4.7 | 214 | cozy, fireplace, pet friendly, hot tub, snowy |
| ocean-view-beach-house | Ocean View Beach House | Malibu, CA | beach | 420 | 4.9 | 508 | ocean view, steps to sand, patio, bright |
| gullwing-cottage | Gullwing Beach Cottage | Santa Cruz, CA | beach | 265 | 4.7 | 173 | quiet, pet friendly, walk to beach, cozy |
| mendocino-coast-cottage | Mendocino Coast Cottage | Mendocino, CA | beach | 295 | 4.8 | 261 | quiet, ocean view, pet friendly, fireplace |
| downtown-arts-loft | Downtown Arts Loft | Portland, OR | city | 185 | 4.8 | 402 | walkable, coffee, workspace, lively |
| skyline-studio | Skyline Studio | Seattle, WA | city | 230 | 4.6 | 328 | skyline view, pet friendly, gym, workspace |
| brick-rowhouse-suite | Brick Rowhouse Suite | Boston, MA | city | 210 | 4.7 | 197 | historic, walkable, quiet, workspace |
| palm-springs-pool-villa | Palm Springs Pool Villa | Palm Springs, CA | villas | 395 | 4.9 | 286 | pool, mountain view, quiet, sunny |
| hillside-garden-villa | Hillside Garden Villa | Ojai, CA | villas | 340 | 4.8 | 152 | secluded, garden, hot tub, quiet |
| saguaro-desert-villa | Saguaro Desert Villa | Scottsdale, AZ | villas | 310 | 4.8 | 219 | pool, secluded, mountain view, sunny |

Use these Unsplash photos in order (append `?auto=format&fit=crop&w=1200&q=80`): `photo-1542718610-a1d656d1884c`, `photo-1449158743715-0a90ebb6d2d8`, `photo-1510798831971-661eb04b3739`, `photo-1499793983690-e29da59ef1c2`, `photo-1507525428034-b723cf961d3e`, `photo-1518780664697-55e3ad937233`, `photo-1502672260266-1c1ef2d93688`, `photo-1522708323590-d24dbb6b0267`, `photo-1600607687939-ce8a6c25118c`, `photo-1613490493576-7fde63acd811`, `photo-1600585154340-be6161a56a0c`, `photo-1600047509807-ba8f99d2cdde`.

Also export:

- `CATEGORY_LABELS`: category id → label, used in search text.
- `filterStays(category: StayCategory | "all")`: filter, then sort featured first and by rating descending.
- `searchStays(query: string, category: StayCategory | "all")`: parse the query, apply the price ceiling and category, score each stay by matching tokens against the combined lowercased title, location, category label, description, amenities, and tags, keep stays with a score above zero (or all when there are no tokens), sort by score descending then rating descending.
- `parseStayQuery(query)`: return `{ tokens, maxPrice }`; drop stop words such as `a`, `an`, `the`, `with`, `and`, `for`, `in`, `under`, `near`, `per`, `night`, `stay`, `place`, and strip the price phrase before tokenizing.

Move the existing `displayNameFor` helper out of `home-screen.tsx` into `src/lib/user-name.ts` and add `firstNameFor`. Both accept a structural user type (`firstName`, `fullName`, `primaryEmailAddress`, `imageUrl`) so they work with Clerk's resource without importing a Clerk type.

Done: `npx tsc --noEmit` and `npx expo lint` pass; no screen changes yet.

### 2. Shared home components

Files: `src/components/stay-card.tsx`, `src/components/stay-search-field.tsx`, `src/components/user-avatar.tsx`, `src/lib/use-press-scale.ts`, `src/app/catalog.tsx`.

**`usePressScale`** returns `{ animatedStyle, onPressIn, onPressOut }`. Use `useSharedValue(1)`, `useAnimatedStyle` for `transform: [{ scale }]`, `withTiming(0.97, { duration: motion.fast })` on press-in, `withTiming(1, { duration: motion.base })` on press-out, and `useReducedMotion()` to skip scaling. This is for the square search button, the pill's arrow, and the avatar. Do not scale full-width list rows.

**`StayCard`** takes `{ stay: Stay; className?: string }` and renders a non-interactive, accessible `View`:

- `h-60` image card, `rounded-card`, `bg-muted`, `overflow-hidden`.
- `expo-image` cover with `transition={200}`.
- Full-bleed overlay: `style={{ backgroundImage: \`linear-gradient(to top, ${palette.imageScrim} 0%, transparent 70%)\` }}`. `backgroundImage` gradients are supported by React Native 0.88 and avoid a new dependency.
- Rating pill top-right: `h-11`, `rounded-pill`, `bg-card`, `px-4`, star icon in `colors.star` filled, rating in `label` / `foreground`.
- Bottom content `p-5`: location row (`mapPin` at 14, `caption`, `tone="onImage"`), title (`cardTitle`, `tone="onImage"`, max two lines), chevron circle on the right (`h-12 w-12`, `bg-card`, `chevronRight` 22 in `foreground`).
- Accessibility: `accessible`, label `${title}, ${location}, rated ${rating} of 5, $${price} per night`.

**`StaySearchField`** props: `value`, `onChangeText`, `onSubmit`, `placeholder`, `inputRef`, `className`. Renders the lavender pill: `h-16`, `rounded-pill`, `bg-lavender`, `pl-4 pr-2`, sparkles icon at 18 in `lavenderForeground`, a `TextInput` using `typography.caption` (14/21 Poppins Medium) with `lavenderForeground` text, `returnKeyType="search"`, `onSubmitEditing`, and a `h-12 w-12` white circular submit button with `arrowUpRight` 20. Label it "Search stays"; scale it with `usePressScale`.

**`UserAvatar`** props `{ size?: "md" | "lg"; className?: string }`; `md` is `h-14 w-14` (56) and `lg` is `h-22 w-22` (88). Home and Profile both use `lg`, matching the mock's roughly 88 dp avatar. Read `useUser()`; render the Clerk image with `expo-image` or a `bg-primary` fallback with the first initial in `title`/`heading`. `overflow-hidden rounded-full`.

Update `src/app/catalog.tsx`: add a "Stay card (home)" preview using the first seed stay next to the existing listing card, and change the bottom-navigation subtitle to say it is a catalog preview because the app now uses native tabs. Keep `GlassTabBar` exported.

Done: catalog shows the new card; the tab bar subtitle is accurate.

### 3. Native tabs and the home screen

Files: `src/app/(app)/_layout.tsx`, `src/app/(app)/home.tsx`, `src/components/home-screen.tsx`, new placeholder `src/app/(app)/search.tsx`, `src/app/(app)/trips.tsx`, `src/app/(app)/profile.tsx`.

Replace the protected `Stack` with:

```tsx
<NativeTabs
  tintColor={colors.primary}
  minimizeBehavior="never"
  labelStyle={{
    default: { fontFamily: fontFamily.sansMedium, fontSize: 12 },
    selected: { fontFamily: fontFamily.sansSemiBold, fontSize: 12 },
  }}
>
  <NativeTabs.Trigger name="home">
    <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
    <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
  </NativeTabs.Trigger>
  <NativeTabs.Trigger name="search">
    <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
    <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
  </NativeTabs.Trigger>
  <NativeTabs.Trigger name="trips">
    <NativeTabs.Trigger.Icon sf="calendar" md="calendar_today" />
    <NativeTabs.Trigger.Label>Trips</NativeTabs.Trigger.Label>
  </NativeTabs.Trigger>
  <NativeTabs.Trigger name="profile">
    <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} md="person" />
    <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
  </NativeTabs.Trigger>
</NativeTabs>
```

Import from `expo-router/native-tabs`, not the deprecated `unstable-native-tabs`. Keep the Clerk guard exactly: return `null` while `!isLoaded`, redirect to `/` when signed out, then render the tabs. Render `<StatusBar style="auto" />` alongside the tabs. Keep `activityEnabled` default.

Create the three new route files in this step so the triggers resolve. In this step, put a minimal inline placeholder in each (a safe-area `View` with the screen name); steps 4 and 5 replace them with the real components. Do not import `SearchScreen`, `ProfileScreen`, or `TripsScreen` before those files exist. Remove `GlassTabBar` usage and the custom absolute bar from Home now. `home.tsx` keeps rendering `HomeScreen`.

Rewrite `src/components/home-screen.tsx` as:

1. `ScrollView` with `bg-card`, `contentInsetAdjustmentBehavior="never"`, top padding `insets.top + 8`, horizontal `px-5`, bottom padding `insets.bottom + 100`, `keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"`.
2. Header row: wordmark `room` with `wordmarkCompact`; avatar `lg` (88) on the right, wrapped in a Pressable that navigates to `/profile`, labeled "Open profile". No sign-out icon.
3. Greeting: `Hey, {firstName} 👋` in `greeting` / `mutedForeground`, `mt-7`.
4. Hero row `mt-1 flex-row items-start justify-between`: headline `"Find your\nnext stay"` in `hero` / `foreground`; square button `h-22 w-18 rounded-field bg-muted` with `search` 24, pressing it focuses the pill input. Scale the button on press.
5. Search field `mt-6` using `StaySearchField`, placeholder `"quiet pet friendly cabin with hot tub"`. On submit: trim; dismiss the keyboard; `router.navigate({ pathname: "/search", params: { q: trimmed, t: String(Date.now()) } })`. The `t` nonce makes a repeated submission of the same query update the Search tab even when `q` is unchanged.
6. Chips `mt-5 flex-row flex-wrap gap-2.5`: All Stays, Cabins, Beach, City, Villas. Selected uses `variant="yellow"`; others `neutral`; keep the icon. State starts at `"all"`.
7. Cards: `filterStays(activeCategory)` rendered as `StayCard` with `gap-4` and `mt-6`. Key the list wrapper by category and fade it in over `motion.fast` so a filter change reads as a swap.
8. Entrances with `Animated.View entering={FadeInDown.duration(motion.slow).delay(n * 40).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}`: header 0, greeting 1, hero 2, search 3, chips 4, cards 5. Do not stagger the cards themselves.
9. Remove the old `FEATURED_STAY`, the sign-out button, `useClerk`, `StatusBar`, and the tab state.

`home.tsx` stays a thin route.

Done: the app opens on a native-tabbed Home that matches the mock's structure; typing and submitting reaches Search; chips filter; the other tabs render.

### 4. Search screen

Files: `src/app/(app)/search.tsx`, `src/components/search-screen.tsx`.

`SearchScreen` reads `useLocalSearchParams<{ q?: string; t?: string }>()`. On mount and whenever `q` or the nonce `t` changes, set both `query` and `submittedQuery` to `q ?? ""`; keep `category` state at `"all"`. Submitting the field sets `submittedQuery`, applies the trim, and dismisses the keyboard. Category chips apply immediately.

Layout:

- `bg-card`, top inset + 8, `px-5`.
- Title `Search` in `heading`, caption `"Describe the stay you want."`.
- `StaySearchField` with placeholder `"quiet pet friendly cabin with hot tub"` and the query prefilled.
- Chips row, same five options.
- Results header: count in `label` and, when there is a query, `for “{submittedQuery}”` in `caption`; when a price ceiling was parsed, show `under $N` in the same caption.
- `FlatList` of `StayCard`s, 16 px separator, bottom padding `insets.bottom + 100`, `keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"`, `contentInsetAdjustmentBehavior="never"`. No entering animation on rows; fade the list container once per `submittedQuery|category` change (`FadeIn.duration(motion.base)` with `ReduceMotion.System`).
- Empty state: centered search icon in a muted circle, `No stays found`, caption `Try a different place, amenity, or price.`, and a secondary `Clear search` button that resets query, submitted query, and category. The FlatList uses `contentContainerStyle={{ flexGrow: 1 }}` with a centered `ListEmptyComponent` so the state is scrollable and never hides under the keyboard.
- With no query and `all`, the list shows every stay, so the Search tab is useful on its own.

Done: the query from Home arrives, results are ranked, the price ceiling works, the empty state is reachable, and the tab works without a query.

### 5. Profile and Trips

Files: `src/app/(app)/profile.tsx`, `src/components/profile-screen.tsx`, `src/app/(app)/trips.tsx`, `src/components/trips-screen.tsx`.

**Profile:** `bg-card`, top inset + 8, `px-5`, heading `Profile`. Centered `UserAvatar size="lg"`, full name from `displayNameFor` in `title`, email in `caption`, and a `"Signed in with Clerk"` caption. Full-width secondary `Button` labeled `Sign out` with `leftIcon="logOut"`; call `signOut()` from `useClerk` directly. The `(app)` guard handles the redirect after Clerk clears the session. No dead rows or links.

**Trips:** `bg-card`, top inset + 8, `px-5`, heading `Trips`. Centered empty state: `calendarDays` icon in a `h-16 w-16 rounded-full bg-muted` circle, `No trips yet` in `title`, caption `"When you book a stay, it will show up here."`, and a primary `Button` labeled `Explore stays` that calls `router.navigate("/home")`.

Done: sign-out returns to onboarding, signing back in reaches Home, and the Trips CTA switches tabs.

### 6. Design comparison and polish

Run the app on the iOS simulator, screenshot Home, and compare it with `prompts/assets/home.png`: wordmark and avatar sizes, greeting and headline weight/leading, square button radius and position, pill height and lavender, chip order/wrap, card height, rating pill, overlay text, and spacing. Fix every visible difference. Record which measurements were estimated from the image (card height 240, square 72×88, avatar 88).

Check the native bar on iOS 26: four tabs, yellow selected tint, labels legible. Confirm the old glass bar is gone from the app but still renders in `/catalog`.

Test search with `"quiet pet friendly cabin with hot tub under $300"`; expect the three cabins under $300 first, then other pet-friendly/quiet stays under $300, with the $340+ villas excluded. Test `"zzzz"` for the empty state, an empty submit for all stays, and each chip.

Check dark mode (`xcrun simctl ui booted appearance dark`) for the card overlay, tab tint, and inputs; switch back. Toggle Reduce Motion in the simulator's Accessibility settings and confirm entrances become instant while the app still works.

## Verification

1. `npx tsc --noEmit` — no errors.
2. `npx expo lint` — no warnings or errors.
3. `npx expo-doctor` — all checks pass (or explain any pre-existing advisory).
4. `npx expo start`, open the iOS simulator, sign in with the test account. The app must open on Home with native tabs and no custom tab bar.
5. Home screenshot vs `prompts/assets/home.png`; list differences, fix, re-shoot.
6. Type the sample sentence and submit: Search opens with ranked results; verify every result is ≤ $300 and that cabins with hot tubs rank first.
7. Test an empty submit, `"zzzz"`, and every category chip on both Home and Search.
8. Open Search directly from the tab bar: all stays show with no query; typing and submitting narrows them.
9. Avatar → Profile → Sign out → onboarding; sign back in → Home.
10. Trips → Explore stays → Home.
11. Dark mode and Reduce Motion checks.
12. Check a second device size (iPhone 16 Pro Max or similar) for headline/pill clipping.
13. `git status` shows only intended files; no `.env`, `ios/`, or `android/` edits.

## Result

Built as planned, with these deviations:

- The design system switched from Poppins to Plus Jakarta Sans mid-build. The user chose to keep Plus Jakarta Sans, so `tokens.json`, `tailwind.config.js`, and `app.json` use it; fonts load at runtime with `useFonts` so Expo Go renders them. Measurements were retuned to the new face: wordmark 64, hero 54/54, greeting 26/32, card title 27/32, card height 288.
- The mock's solid yellow tab pill cannot be drawn by the iOS 26 system tab bar. `NativeTabs` uses the brand yellow tint instead; `GlassTabBar` remains a catalog preview.
- Home receives a native top inset from the tab navigator and uses `paddingTop: 8`. The debug inset label used during measurement was removed.
- The card title block is capped at 60% width so "Modern Cabin with Hot Tub" breaks after "Cabin" as in the mock.
- The square search button focuses the field; it does not submit. Submit is the keyboard search key or the pill's arrow.
- Not verified interactively (no Simulator GUI and no input tooling): chip taps, typing, sign-out, Trips CTA, Reduce Motion, and a second device size. Search, empty, all-stays, Profile, Trips, catalog, and dark mode were verified through deep links and screenshots.

## AGENTS.md updates

- **Expo:** replace “The glass tab bar is presentational until navigation exists…” with: `(app)` uses `NativeTabs` from `expo-router/native-tabs` (Home, Search, Trips, Profile) with the brand yellow selected tint; iOS 26 draws the system bar, so the mock's floating yellow pill cannot be reproduced. `GlassTabBar` remains a catalog-only preview. Sign-out lives on Profile.
- **Expo:** add that Home/Search read `src/data/stays.ts` (local seed, remote Unsplash placeholders); a home query navigates to the Search tab as `q`, and category chips filter in place. Cards are display-only until a detail route exists.
- **Design system:** add that photo overlays use `on-image` and the `palette.imageScrim` gradient, never `text-card`, because card colors flip in dark mode. Note the new `hero`, `greeting`, `wordmarkCompact`, and `cardTitle` type tokens and the 72/88 spacing steps.
- **Who owns what:** add a **Stays (local)** line stating that stay content and ranking are local until Sanity/backend search is introduced; no LLM or network call is involved.
- **Checks:** no change; lint and type check already required.
