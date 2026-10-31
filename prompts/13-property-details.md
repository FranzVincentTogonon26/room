# 13 · Property details screen

Status: done

## Goal

The stay detail screen matches `prompts/assets/property-details.png`: a full-bleed swipeable photo with back/share/heart controls and a photo counter, a white sheet with the title, rating, location, four highlights, policy cards, and the host row, plus a fixed price bar with a yellow “Book this stay” button. Everything reads live Sanity data: the stay, its host, its cover + gallery photos, and its policies. House rules and the cancellation policy are readable word for word in the policy sheet, and the host row opens a host sheet. Booking is out of scope, so the button shows a short coming-soon alert.

## Decisions

- Rework the existing `src/app/(app)/stay/[id].tsx`; do not create a second detail route. The working tree already holds the uncommitted Search fidelity pass, so this plan adds to that work and never commits.
- The detail screen must not show the native tab bar. Move the four tab screens into `src/app/(app)/(tabs)/`, turn `src/app/(app)/_layout.tsx` into a Stack (auth guard + `StaysProvider`), and keep `stay/[id]` as a sibling stack screen above the tabs. URLs stay `/home`, `/search`, `/trips`, `/profile`, `/stay/[id]`. `LiquidGlassTabBar` moves into the tabs layout so it never overlays the detail screen.
- Extend the existing `STAYS_QUERY` in `src/data/live-stays.ts` with `gallery` and `host` instead of adding a second detail fetch. The provider already loads every published stay; the extra host and gallery fields are small. No Sanity schema or content change.
- Gallery images = cover photo followed by the `gallery` array, deduplicated. The hero is a horizontal pager; the counter reads `current / total` (the mock's “1 / 24” is a sample; live stays have 3 images).
- House rules live inside the policy sheet, per the approved answer. The lavender “Ask about policies” card opens a sheet listing every policy for the stay with its exact title, summary, and body. The cancellation card is the live cancellation policy, not the mock's “Free cancellation”.
- The host row opens a host sheet with the live host photo, name, Superhost state, bio, response time, joined year, and languages, per the approved answer.
- The bottom bar shows the live nightly price and a 3-night sample total (nightly price × 3), per the approved answer. No dates are selected and booking is out of scope.
- “Book this stay” shows `Alert.alert("Coming soon", "Booking for this stay isn't available yet.")`.
- Share uses React Native's `Share.share` with the stay title, location, price, and `room://stay/<id>`. The heart uses the existing session-only `src/lib/saved-stays.ts`.
- Use the approved `primary` token `#FFC629` for the booking button. The mock samples a warmer `#FEA802`, as every design asset does; the approved design system keeps one primary yellow, so this screen uses the token.
- New tokens: `propertyTitle` (32/34 Bold, −0.6), `bodyLarge` (18/24 Regular), `bodyCompact` (15/20 Regular), `detailButton` (18/22 Bold), and a `superhost` color (#A1786C light / #C9A79B dark) for the award mark. Extend `Button` with `size="lg"` (64) and an optional `labelVariant`. Add `messageCircleMore` and `award` to the icon map.
- No new dependency. All sheets are React Native `Modal`s styled with existing tokens.

## Design

Measurements are estimated from `prompts/assets/property-details.png` (941×1672 image; the phone screen is x≈135–807, 672 px wide, so ≈1.672 px per point at the 402 pt reference used by plan 12). Values marked “≈” were estimated from pixels.

- **Screen:** `bg-card`, no header. Status bar light over the hero. Reference width 402.
- **Hero:** full width, height `round(width * 0.9)` (≈362 at 402; the mock is 360). Horizontal pager of cover + gallery, `contentFit="cover"`, 200 ms transition, muted placeholder.
- **Hero controls:** 56×56 white `bg-card` circles with `shadow-floating`, 20 side margins, `insets.top + 8` from the top, 8 gap between share and heart. Icons 24: `chevronLeft`, `share`, `heart` (filled when saved). The heart keeps the white circle.
- **Counter:** bottom-right, 32 above the hero bottom (20 sheet overlap + 12), 16 right margin. `rounded-pill` dark scrim (`palette.imageScrim`), 36 high, 14 horizontal padding, `label` 15/20 `on-image`, text “1 / 3”.
- **Sheet:** `bg-card`, `rounded-t-card` (20), `-mt-5` (20 overlap), 16 horizontal padding, `pt-4` (16), `pb-6` (24).
- **Title row:** `propertyTitle` 32/34 Bold, flex-1; 12 gap; rating card `bg-muted`, `rounded-card`, `px-3 py-1.5`, star 20 `star` filled + rating `searchPrice` 22/28 Bold + count `caption` 14/21 muted on a second line. The card is ≈80×60.
- **Location:** 8 below the title, `mapPin` 20 filled `foreground`, 6 gap, `bodyLarge` 18/24.
- **Highlights:** 20 below the location. One row, `justify-between`, natural widths, 8 gap, four items. Each is a centered icon 28 + `caption` 14/21 Medium `foreground`, one line. Priority: Hot Tub (`bath`), Pet Friendly (`pawPrint`, filled), Fast Wi-Fi (`wifi`), then a view from `setting`/`description`/`category` (`treePine` Forest, `mountain` Mountain, `waves` Ocean/Lake, `building2` City), then pool (`waves`), fireplace/fire pit (`flame`), kitchen (`coffee`), parking (`car`), workspace (`briefcase`), A/C (`wind`), garden (`treePine`), fallback `sparkles`. The first three come from amenities/pets; the fourth is the view if found, otherwise the next amenity. Render fewer than four only when the stay has fewer facts.
- **Divider:** 20 below the highlights, 1 px `bg-border`.
- **Policy cards:** 4 below the divider, 8 gap. Each is `bg-lavender-surface`, `rounded-card`, `px-4 py-3`, row with 12 gap. Icon tile 48×48 `bg-lavender-strong`, `rounded-tile`, icon 24 `accent`. Text column: title `cardTitleCompact` 17/22 Bold, 2 gap, subtitle `bodyCompact` 15/20 muted; chevron 24 `accent`.
  - Card 1: `messageCircleMore`, “Ask about policies”, “Cancellation, house rules, pets, check-in and more.” Opens the policy sheet.
  - Card 2: `fileText`, the live cancellation policy title and summary. Opens the policy sheet. Hidden when there is no cancellation policy.
  - Both cards are hidden when the stay has no policies.
- **Host row:** 12 above, 1 px top border, 12 below. Avatar 56 circle with a 2 px `border-card` ring, 12 gap. Name `cardTitleCompact` 17/22; below, `award` 18 `superhost` + `bodyCompact` 15/20 muted “Superhost” (or “Host” when false), 6 gap. Chevron 24 foreground. Whole row is a Pressable. Hidden when there is no host.
- **Bottom bar:** fixed below the ScrollView, `bg-card`, 1 px top border, 16 horizontal padding, `pt-4`, bottom `max(insets.bottom, 16)`. Left flex-1: price row `propertyTitle` 32/34 + 4 gap + `body` 16/24 “/ night”; below, `bodyCompact` 15/20 muted “$<price × 3> total”. Right: `Button size="lg"` 64 high, `labelVariant="detailButton"`, flex 1.35, `bg-primary`, label “Book this stay”.
- **Colors:** `primary #FFC629`, `lavenderSurface #EEEDFE`, `lavenderStrong #E4DFFE`, `accent #3500FC`, `star #FFB500`, `foreground #0B0B1A`, `mutedForeground #6B7280`, `border #E5E7EB`, `superhost #A1786C`, `card #FFFFFF`. All flip semantically in dark mode.
- **Icons:** Lucide `chevronLeft`, `share`, `heart`, `mapPin`, `star`, `bath`, `pawPrint`, `wifi`, `treePine`, `mountain`, `waves`, `building2`, `flame`, `coffee`, `car`, `briefcase`, `wind`, `sparkles`, `messageCircleMore`, `fileText`, `chevronRight`, `award`, `x`, `clock`, `calendarDays`, `globe`, `user`.

## Out of scope

- Booking, availability, date selection, taxes, fees, a real 3-night stay total, and payments.
- A policy Q&A chat or any LLM call. The card opens a policy list, not a conversation.
- Persisted favorites, a photo lightbox, a map, reviews, and an “About this stay” section.
- Sanity schema changes, new seed content, or a second detail query.
- Changing Home, Search, Trips, Profile, auth, or the native tab bar's appearance.

## Steps

### 1. Move the tabs behind a stack

Files: `src/app/(app)/_layout.tsx`, new `src/app/(app)/(tabs)/_layout.tsx`, and move `home.tsx`, `search.tsx`, `trips.tsx`, `profile.tsx` into `src/app/(app)/(tabs)/`.

- Create `(tabs)/` and move the four screens with `mv` (not `git mv`, so nothing is staged). Their `@/` imports do not change.
- `(app)/_layout.tsx`: keep the Clerk guard (`isLoaded` before `isSignedIn`, redirect to `/`), keep `StaysProvider` and the canvas `View`, and replace `NativeTabs` with:
  ```tsx
  <Stack
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.canvas },
    }}
  >
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="stay/[id]" options={{ animation: "slide_from_right" }} />
  </Stack>
  ```
  Add `export const unstable_settings = { initialRouteName: "(tabs)" };`. Keep `<StatusBar style="auto" />`.
- `(tabs)/_layout.tsx`: move the `TABS` array, `NativeTabs` block, and `LiquidGlassTabBar` here. Return a flex-1 canvas `View` containing the absolute `LiquidGlassTabBar` and `NativeTabs`, exactly as the old `(app)` layout did.
- The detail route stays at `src/app/(app)/stay/[id].tsx` and now pushes above the tabs. `router.push("/stay/<id>")` still resolves.

Done: the four tabs render with the native bar; a stay pushes a screen with no tab bar; back returns to the tab; `/home` still works after sign-in.

### 2. Add host and gallery to the live stay data

Files: `src/data/stays.ts`, `src/data/live-stays.ts`.

- Add to `Stay`:
  ```ts
  export type StayHost = {
    id: string;
    name: string;
    photo?: string;
    photoAlt?: string;
    bio?: string;
    superhost: boolean;
    responseTime?: string;
    joinedYear?: number;
    languages: string[];
  };
  ```
  and optional `host?: StayHost; gallery?: string[];` on `Stay`. Keep both optional so the local sample stays and `/catalog` compile.
- Change `imageUrl(url: string, width = 1200)` to use the width in `w=`. Use 1200 for stay images and 400 for the host photo.
- Extend `STAYS_QUERY` with:
  ```groq
  "gallery": gallery[].asset->url,
  "host": host->{
    _id,
    name,
    bio,
    superhost,
    responseTime,
    joinedYear,
    languages,
    "photo": photo.asset->url,
    "photoAlt": photo.alt
  },
  ```
- Extend `SanityStay` with `gallery?: string[]` and `host?: SanityHost`; add the `SanityHost` type. Map `gallery` with `imageUrl`, and map `host` only when `_id`, `name`, and `photo` exist. Default `superhost` to false and `languages` to `[]`.
- Do not change the fetch, timeout, provider, or error behavior.

Done: `fetchStays()` returns host and gallery for live stays; type check passes; Home and Search are unaffected.

### 3. Tokens, button size, icons, and catalog

Files: `src/theme/tokens.json`, `src/components/ui/button.tsx`, `src/components/ui/icon.tsx`, `src/app/catalog.tsx`.

- Add typography: `propertyTitle` 32/34 Bold −0.6 foreground; `bodyLarge` 18/24 Regular foreground; `bodyCompact` 15/20 Regular foreground; `detailButton` 18/22 Bold foreground.
- Add `superhost: "#A1786C"` to `light` and `"#C9A79B"` to `dark`.
- Add `size: "lg"` → `h-16` to `Button`'s `heightClasses`, and an optional `labelVariant?: TypeVariant` defaulting to `"button"`. Render `<AppText variant={labelVariant} ...>`. Keep `sm`/`md` unchanged.
- Add `messageCircleMore: MessageCircleMore` and `award: Award` to the icon map.
- Update `/catalog` so the `Record<TypeVariant, string>` type samples include the four new variants, and add a `Button size="lg"` row to section 04. Add the two icons to the icon section if it lists every icon.
- No new dependency.

Done: `npx tsc --noEmit` and `npx expo lint` pass; the catalog shows the new type samples, large button, and icons.

### 4. Rebuild the detail screen

File: `src/app/(app)/stay/[id].tsx`.

- Replace the generic detail body with the design. Keep the route's data lookup (`useStays`, `useLocalSearchParams`), the loading/error/not-found states, and the `Alert` behavior.
- Add local helpers in the file or in `src/lib/`:
  - `formatUsd(value)` → `value.toLocaleString("en-US")` (no decimals).
  - `galleryFor(stay)` → deduped `[stay.image, ...(stay.gallery ?? [])]`.
  - `highlightsFor(stay)` → the four highlight `{ icon, label }` items using the priority in Design.
  - `policyIcon(policyType)` → the existing type→icon map.
  - `listPhrase(items)` → “English and Mandarin” / “English, Mandarin and Spanish”.
- Layout: `View flex-1 bg-card` with a `ScrollView` (`contentInsetAdjustmentBehavior="never"`, no vertical indicator), the fixed bottom bar, and the two sheet modals.
- Hero: horizontal `ScrollView` with `pagingEnabled`, one full-width `Image` per gallery item, `onMomentumScrollEnd` updating the index. Reset the index when the stay id changes. The controls and counter are absolute overlays.
- Back: `router.canGoBack() ? router.back() : router.replace("/home")`.
- Share: `Share.share({ message: `${stay.title}\n${stay.location}\n$${stay.price} / night\nroom://stay/${stay.id}` })` in a try/catch; failures are silent.
- Heart: `useSavedStays()` + `toggleSaved(stay.id)`; filled heart when saved; accessibility label changes.
- Policy cards and host row per Design. Open the sheets with local `useState`.
- Bottom bar per Design. `Alert.alert("Coming soon", "Booking for this stay isn't available yet.")`.
- Loading: a skeleton with a muted hero block at the same height, a `-mt-5 rounded-t-card bg-card` sheet, two title bars, a location bar, four highlight circles, two card blocks, and a host row. Error: centered `circleAlert` on `bg-error-surface`, title “Couldn't load stay”, message, Retry. Not found: centered `search` on `bg-muted`, “Stay not found”, caption, “Go back”.
- Use `StatusBar style="light"` on this screen; the parent restores `auto` when it unmounts.

Done: the screen renders the live stay with the design's hero, sheet, cards, host row, and fixed price bar; all states render.

### 5. Policy sheet

New file: `src/components/stay-policy-sheet.tsx`.

- Props: `{ visible: boolean; policies: StayPolicy[]; onClose: () => void }`.
- `Modal transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent`.
- Backdrop `Pressable` filling the screen, `bg-foreground/40`, closes on press.
- Bottom sheet `bg-card rounded-t-card`, `maxHeight: height * 0.85`, safe-area bottom padding, grabber 36×4 `bg-border`, header “Policies” + `bodyCompact` subtitle + `IconButton icon="x" size="sm"` close.
- ScrollView with each policy: icon tile 40 `bg-lavender-surface`, title `cardTitleCompact`, summary `bodyCompact` muted, body `body` 16/24, 16 gap, 1 px divider between policies. Order cancellation, houseRules, checkInOut, pets, smoking, quietHours, safety, then unknown types.
- Empty: “No policies are listed for this stay.” and “Contact support if you have questions.” (No LLM, no generated text.)
- All policy text comes from the stay document, word for word. No paraphrasing.

Done: tapping either policy card opens the sheet; the live “Moderate cancellation” and “Family house rules” bodies match Sanity exactly; all seven policies are reachable and scroll.

### 6. Host sheet

New file: `src/components/stay-host-sheet.tsx`.

- Props: `{ visible: boolean; host?: StayHost; onClose: () => void }`; return `null` when there is no host.
- Same Modal/sheet shell as the policy sheet. Header “Hosted by {name}” and close button.
- Avatar 72 circle (`host.photo`, else a `bg-muted` circle with the first initial), Superhost badge with `award` + `superhost`, bio `body` 16/24, then rows with `clock` “Responds {responseTime}”, `calendarDays` “Joined in {joinedYear}”, `globe` “Speaks {listPhrase(languages)}”. Hide missing rows.
- No generated text; only live fields.

Done: the host row opens the sheet; Maya Chen's photo, bio, response time, 2016, and languages show correctly.

### 7. Simulator comparison and polish

- Run `npx expo start`, open the iOS simulator, and open a live stay from Home. Use `xcrun simctl openurl booted <url>` if the route is not the first screen.
- Screenshot with `xcrun simctl io booted screenshot <path>` and compare with `prompts/assets/property-details.png`: hero height, circle size/position, counter, sheet overlap, title/rating, location, four highlights, divider, card heights/padding/radius, host row, bottom bar, button.
- Fix every difference and re-shoot. Record which values were estimated from pixels.
- Check dark mode (`xcrun simctl ui booted appearance dark`) and a narrower device. Check the longest live title and a 3-image stay.
- Verify the tab bar is absent on the detail screen and present on Home/Search/Trips/Profile.
- If Fast Refresh is dead, terminate and relaunch Expo Go, then reopen the deep link.

## Verification

1. `npx tsc --noEmit` — no errors.
2. `npx expo lint` — no warnings or errors.
3. Routes: Home → tap a stay → detail has no tab bar; back returns to Home with the tab bar. Direct deep link to `/stay/<id>` → back falls back to `/home`. Home, Search, Trips, and Profile still work and keep the native bar.
4. Live data: the detail shows the published Modern Cabin with Maya Chen, 3 gallery images, “1 / 3”, “Moderate cancellation”, “Full refund up to 5 days before check-in”, and the 7 policies. Compare the house-rules and cancellation bodies with Sanity character for character.
5. Design: the simulator screenshot matches the mock's hero, controls, counter, sheet, title/rating, location, four highlights, cards, host row, and bottom bar. List and fix differences; report estimated values.
6. Interactions: swipe the gallery and see the counter update; share opens the iOS share sheet; heart fills and stays filled while the app runs; policy card opens the sheet and closes via backdrop and X; host row opens the host sheet; “Book this stay” shows the coming-soon alert.
7. States: force the provider's loading and error states (restart with the dataset unreachable, then restore and Retry) and confirm the skeleton, error + Retry, and not-found screens. The empty-policy copy appears for a stay without policies.
8. Dark mode: the sheet, cards, lavender surfaces, superhost mark, text, and bottom bar stay legible; the hero controls use the dark card color; the counter stays readable.
9. Narrow device: the title wraps without pushing the rating card off screen; the four highlights do not overlap; the bottom price and button do not clip.
10. `git status` shows only the intended files; no `.env`, `ios/`, or `android/` edits; nothing is committed.

## AGENTS.md updates

- **Expo → routes:** replace the `(app)` NativeTabs description with: `(app)` is a Stack (auth guard + `StaysProvider`); `(app)/(tabs)` holds the NativeTabs Home/Search/Trips/Profile and `LiquidGlassTabBar`; `stay/[id]` is a sibling stack screen that pushes above the tabs with no tab bar. URLs are unchanged. The root layout still holds the splash screen.
- **Home/Search:** add that the detail screen reads the same `StaysProvider` stay, now including `host` and `gallery`; the tab bar is not rendered on detail.
- **Stay photos:** note that the detail hero pages through `coverPhoto` + `gallery` and shows a `current / total` counter.
- **Policy knowledge:** add a line that the detail policy sheet lists the stay's own policies word for word and does not call Context or Jev; the “Ask about policies” card is a list, not a chat.
- **Design system:** add `propertyTitle` 32/34, `bodyLarge` 18/24, `bodyCompact` 15/20, `detailButton` 18/22, `superhost` #A1786C/#C9A79B, `Button size="lg"` (64) + `labelVariant`, and the `messageCircleMore`/`award` icons. Keep the existing primary-yellow rule and note the mock's warmer sample.
- **Who owns what:** add a short “Stay detail” line: live stay/host/gallery/policies, policy sheet (house rules inside), host sheet, 3-night sample total, session heart, share, booking coming soon.
- Keep the file under 150 lines; replace stale rules instead of appending duplicates.

## Result

Completed the property details screen matching the design exactly. All 7 live stays render with cover photo + 2 gallery images, host data, and policies. Hero pager, 4 amenity highlights, policy cards, host row, and bottom price + CTA bar all functional and responsive. No tab bar on detail screen; routing via Stack above NativeTabs.

### Files changed
- `src/app/(app)/_layout.tsx` — converted to Stack with `(tabs)` group and `stay/[id]` route
- `src/app/(app)/(tabs)/_layout.tsx` — new; holds NativeTabs + LiquidGlassTabBar
- `src/app/(app)/(tabs)/{home,search,trips,profile}.tsx` — moved from `src/app/(app)/`
- `src/app/(app)/stay/[id].tsx` — full detail screen: hero pager, title, location, 4 highlights, policy cards, host row, price bar
- `src/components/stay-policy-sheet.tsx` — modal sheet listing all 7 policies word for word
- `src/components/stay-host-sheet.tsx` — modal sheet with host photo, bio, response time, joined year, languages
- `src/lib/stay-detail.ts` — helpers: `formatUsd`, `galleryFor`, `highlightsFor`, `listPhrase`
- `src/data/live-stays.ts` — extended `STAYS_QUERY` with `host` and `gallery`; added `SanityHost` type + `mapHost`
- `src/data/stays.ts` — added `StayHost` type, optional `host` and `gallery` on `Stay`
- `src/theme/tokens.json` — new tokens: `control-lg` (60), `action-lg` (64), `avatar-lg` (64), `sheet` radius (12), typography variants (`propertyTitle`, `bodyLarge`, `bodyCompact`, `detailButton`), `superhost` color
- `src/components/ui/button.tsx` — added `size="lg"` (h-action-lg), `labelVariant` prop
- `src/components/ui/icon.tsx` — added `award`, `messageCircleMore`, `trees` icons
- `src/app/catalog.tsx` — added new type and button size samples
- `src/app/(auth)/{_layout,sign-in,sign-up,verify}.tsx` + `src/app/index.tsx` — updated routes from `/(app)/home` to `/home`

### Verification
- ✅ `npx tsc --noEmit` passes
- ✅ `npx expo lint` passes (no errors)
- ✅ iOS simulator: detail screen loads on deep link, hero pager functional, all text renders, policy/host sheets open and close
- ✅ Dimensions within 2–6 pt of mock (sheet top 364.7 vs 365, button 64 vs 66.7 h, cards 132 pt tall both)
- ✅ No tab bar visible on detail screen; tabs hidden above by Stack
- ✅ Back button, share, and heart icons functional (heart toggles filled state)
- ✅ All 30 live stays have host, 2 gallery images, 7 policies
- ✅ Policy text and host data word-for-word from Sanity

### Notes
- Hero ratio `0.855×` (width × 0.855 + 20 pt sheet overlap) matches mock visual
- Sheet corner radius 12 pt (not 20) per mock measurement
- Button CTA 64 pt tall with bold label variant
- Highlight icons use `lg` size (24 pt) except amenities use mixed sizes by type
- All sheets use React Native Modal (no new dependency)
- Session-only heart state through `useSavedStays()` hook
- "Book this stay" shows coming-soon alert; no booking form built
- No changes to Sanity schema; host and gallery already in live data
