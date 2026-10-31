# 09 · Search screen design

Status: done

## Goal

The Search tab matches `prompts/assets/search.png`: a back button, a compact pill search field with a filter icon, the quick-filter chips Cabins / Under $300 / Pet Friendly / Quiet, a results count with a sort control, and horizontal stay rows showing photo, title, location, rating, two amenity pills, price, and a heart. Typing searches live, every control works on the local stays data, and the native tab bar stays as it is.

## Decisions

- The design's four chips are real, combinable filters:
  - Cabins is a single-select category toggle (Cabins ↔ All).
  - Under $300 is a single-select price cap (300 ↔ no cap).
  - Pet Friendly and Quiet are independent tag toggles.
  - All four combine with the typed query and with each other.
- The sliders icon opens a filter sheet with every category (All, Cabins, Beach, City, Villas), price caps (Any, $200, $300, $400), and the Pet Friendly and Quiet toggles. The sheet edits a draft; `Show N stays` applies, `Clear` resets the draft, and dismissing without applying discards the draft.
- `Sort by Best match` opens a sort sheet: Best match, Price: low to high, Price: high to low, Top rated.
- Hearts save and unsave locally for the session through a small in-memory store (`src/lib/saved-stays.ts`), so they survive tab switches and new Home queries but reset when the app restarts. They are not persisted and are not shown anywhere else.
- The back button switches to the Home tab.
- Search filters live as the guest types. The keyboard's search key only dismisses the keyboard. Home still submits `q` + `category` + a `t` nonce and the Search tab still receives them.
- The mock's floating yellow tab bar is not reproduced; `NativeTabs` keeps owning the bar per `AGENTS.md`. Do not touch `src/app/(app)/_layout.tsx`.
- Stay rows are display-only; only the heart is interactive. No detail route.
- No new dependencies. `@expo/ui` is already installed, is included in Expo Go, and provides the filter and sort `BottomSheet`.
- Defaults picked: category All, no price cap, no tags, sort Best match; the count shows the real local result count (12 stays at most), not the mock's 124; each row shows the first two amenities, title-cased.
- The photo and amenity data come from `src/data/stays.ts`; photos stay remote Unsplash placeholders.
- No `animate-*` classes. One short entrance for the header and chips, honoring Reduce Motion; filter changes are instant.

## Design

All measurements below are estimated from `prompts/assets/search.png` (941×1672 image; phone screen x≈114–827, scale ≈1.83 px per point).

- **Screen:** white `bg-card`, top padding `insets.top + 8`, 16 side padding. The design's background is near-white, so the existing `bg-card` surface is correct; no separate results sheet.
- **Header row:** 52×52 `bg-muted` back circle with `chevronLeft` 24, 12 gap, then a flex-1 pill field 52 high (`h-13`) in `bg-muted`. Field: 20 left padding, `search` 20, 12 gap, body 16 input, a 40×40 sliders Pressable at the right with `slidersHorizontal` 20 and 4 right padding.
- **Chips:** 36 high (`h-9`), 12 horizontal padding (`px-3`), 8 gap, 15 semibold (`label`). Selected is `bg-lavender` with dark text; unselected is `bg-muted` with foreground text. No icons. The row sits 12 below the field, scrolls horizontally if a narrow device cannot fit all four, and has 16 horizontal padding.
- **Results header:** 16 below the chips. Count in `cardTitleCompact` (17/22 Bold). Right side: `Sort by` in caption 14, sort label in `label` 15 semibold, `chevronDown` 16, 4 gap.
- **Rows:** 12 gap between rows; no card background or shadow. Image 144×152 (`w-36 h-38`), `rounded-tile`, `bg-muted`, cover, 200 ms transition. 12 gap to the text column.
  - Title `cardTitleCompact` 17/22 Bold, max 2 lines, flex-1. Heart button 44×44 (`h-11 w-11`) `bg-muted` circle, `heart` 22 outline foreground; saved is filled `error`.
  - Location row 4 below title: `mapPin` 14, caption 14 `mutedForeground`, one line.
  - Rating row 4 below: `star` 16 filled `star`, rating `label` 15, review count caption 14 `mutedForeground`.
  - Amenity pills 8 below: up to two, 24 high (`h-6`), `rounded-pill bg-muted`, 10 horizontal padding, 6 gap, icon 14, caption 14 foreground, title-cased label.
  - Price row at the bottom of the text column: `price` 20 Bold, `/ night` caption 14 `mutedForeground`, 4 gap.
- **List:** 12 below the results header, 16 horizontal padding, bottom padding `insets.bottom + 24`. Empty state keeps the current icon circle, `No stays found`, caption, and a secondary `Clear search` button that resets the query, every filter, and sort to Best match.
- **New tokens** (proposed, not hardcoded):
  - `spacing["13"] = 52` for the back circle and search field.
  - `spacing["38"] = 152` for the row image height (width is the existing `w-36` = 144).
  - `typography.cardTitleCompact` = Plus Jakarta Sans Bold, 17/22, −0.2, foreground, used by the result count and row titles.
  - Everything else maps to existing tokens or the standard 4-pt scale: `h-9` 36 chips, `h-11` 44 hearts, `h-6` 24 pills, `h-12`/`h-control` 48 buttons, `rounded-tile` 14, `bg-lavender` selected chips, `bg-muted` controls, `bg-card` screen.
- **Filter sheet:** `BottomSheet` from `@expo/ui`, `containerColor={colors.card}`, `contentPadding={0}`, drag indicator shown. Content with 20 horizontal padding: `Filters` title + close icon button; Category (All Stays, Cabins, Beach, City, Villas), Max price (Any, Under $200, Under $300, Under $400), and Good for (Pet Friendly, Quiet) chip groups that wrap; footer with secondary `Clear` and primary `Show N stays`, each flex-1, 12 gap, 48 high.
- **Sort sheet:** same `BottomSheet`; `Sort by` title + close; four 48-high rows, selected row `bg-muted` with an `accent` check icon; tapping a row applies and closes.
- **Icons:** add Lucide `Flame` as `flame` and `Mountain` as `mountain` to `src/components/ui/icon.tsx`. Amenity mapping: hot tub → `bath`, pet/dog → `pawPrint`, pool → `waves`, ocean/mountain/skyline view → `mountain`, fireplace → `flame`, Wi-Fi → `wifi`, anything else → `check`.

## Out of scope

- Stay detail, booking, availability, real trips data, persisted favorites, a Saved tab.
- Backend, Sanity, AI search, policy Q&A.
- Changes to Home, auth, the native tab bar, or `src/app/(app)/_layout.tsx`.
- The mock's floating yellow tab pill and its Liquid Glass treatment.
- A new design pass beyond the search screen.

## Steps

### 1. Data, icons, and the compact chip

Files: `src/data/stays.ts`, `src/components/ui/icon.tsx`, `src/components/ui/chip.tsx`, `src/components/search-screen.tsx` (one call site).

Add `flame: Flame` and `mountain: Mountain` to `icon.tsx`'s `iconMap` and import them from `lucide-react-native`.

Extend `Chip` with `size?: "md" | "sm"`, default `"md"`. Move the fixed `h-chip` and `px-5` out of the base classes into `sizeClasses = { md: "h-chip px-5", sm: "h-9 px-3" }`. Keep the label variant and icon behavior unchanged. `DraggableChip` is not changed.

Rework the search helpers in `stays.ts`:

```ts
export type StaySort = "best" | "price-asc" | "price-desc" | "rating";

export type StaySearchOptions = {
  category?: StayCategoryId;
  maxPrice?: number;
  petFriendly?: boolean;
  quiet?: boolean;
  sort?: StaySort;
};

export function searchStays(query: string, options?: StaySearchOptions): Stay[];
```

- Parse the query once with `parseStayQuery`.
- Apply the category filter (`options.category` defaults to `"all"`).
- Apply the stricter of the parsed price ceiling and `options.maxPrice`; a stay must satisfy both when both exist.
- `petFriendly` keeps stays whose tags include `"pet friendly"` or `"dog friendly"`, or whose amenities match `/pet|dog/i`.
- `quiet` keeps stays whose tags include `"quiet"`.
- Keep the current token scoring: tokens are matched against the combined title, location, category label, description, amenities, and tags; when tokens exist, keep only score > 0.
- Sort:
  - `best`: score desc, then featured, then rating desc (the current behavior).
  - `price-asc`: price asc, then rating desc.
  - `price-desc`: price desc, then rating desc.
  - `rating`: rating desc, then review count desc.
- `filterStays(category)` becomes `searchStays("", { category })`, so Home keeps working and still shows featured stays first.
- Export `SORT_LABELS: Record<StaySort, string>` with `Best match`, `Price: low to high`, `Price: high to low`, `Top rated`.
- Update the old Search screen's only call to `searchStays(submittedQuery, category)` to `searchStays(submittedQuery, { category })` so the app keeps type-checking until step 3 rewrites that file.

Done: `npx tsc --noEmit` and `npx expo lint` pass; Home still filters by category; the old Search screen still works with the new helper.

### 2. Tokens, search result row, and catalog preview

Files: `src/theme/tokens.json`, new `src/components/search-stay-card.tsx`, `src/app/catalog.tsx`.

Add `spacing["13"] = 52`, `spacing["38"] = 152`, and `typography.cardTitleCompact` (Plus Jakarta Sans Bold, 17, 22, −0.2, foreground) to `tokens.json`.

Create `SearchStayCard` with props `{ stay: Stay; saved: boolean; onToggleSave: () => void; className?: string }`. Build it as described in Design:

- A non-pressable `View` row (`flex-row gap-3`) so the heart can be the only interactive element.
- `expo-image` in a `w-36 h-38 rounded-tile bg-muted` container.
- Text column `flex-1 justify-between`.
- Title row with the title and the 44×44 heart button. The heart uses `accessibilityRole="button"`, label `Save {title}` / `Remove {title} from saved stays`, and `accessibilityState={{ selected: saved }}`.
- Location, rating, up to two amenity pills, and the bottom price row exactly as in Design.
- A small local `amenityIcon(label)` helper for the mapping. Title-case labels with a word-boundary regex so `Wi-Fi` stays `Wi-Fi` and `Pet friendly` becomes `Pet Friendly`.
- No shadow and no card background; it sits on the screen's `bg-card`.

Keep `StaySearchCard` in `stay-card.tsx` during this step; the old Search screen still uses it until step 3.

Update `catalog.tsx`:

- Add `cardTitleCompact` to `typeOrder` and `typeSamples` (the `Record<TypeVariant, string>` will otherwise fail type checking).
- Add `flame` and `mountain` to `iconSamples`.
- In section 06, render the four compact search chips with `size="sm"` and `variant="lavender"` for the selected Cabins chip, above the existing category chip row. Update the subtitle to say compact search chips and category chips.
- In section 07, add a `SearchStayCard` for `STAYS[0]` wired to the existing `saved` state, with the caption `Search result row · session-only save`.

Done: catalog shows the compact chips and the new row; type check and lint pass.

### 3. Rewrite the Search screen

Files: `src/components/search-screen.tsx`, `src/components/stay-card.tsx`, new `src/lib/saved-stays.ts`.

Replace the current lavender pill, category chips, and full-width photo cards with:

1. **Screen shell:** `View className="flex-1 bg-card"` with `paddingTop: insets.top + 8`. Header and chips in a `px-4` block; results header also `px-4`; `FlatList` below with `px-4`.
2. **Header row:** back `Pressable` (52 circle, `chevronLeft` 24, label `Back to Home`, `router.navigate("/home")`), 12 gap, pill field (flex-1, `h-13`, `bg-muted`, `rounded-pill`, `pl-5`, `pr-1`). Field contents: `search` 20, 12 gap, `TextInput` body 16 with `placeholder="Search stays"`, `placeholderTextColor={colors.placeholder}`, `returnKeyType="search"`, `onSubmitEditing={() => Keyboard.dismiss()}`, and a 40×40 sliders Pressable labeled `Open filters`.
3. **Quick chips:** horizontal `ScrollView` (`showsHorizontalScrollIndicator={false}`) with `contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}`, 12 below the header. Four `Chip size="sm"`:
   - Cabins: selected when `category === "cabins"`; press toggles Cabins/All.
   - Under $300: selected when `maxPrice === 300`; press toggles 300/undefined.
   - Pet Friendly: selected when `petFriendly`; toggles.
   - Quiet: selected when `quiet`; toggles.
   Selected chips use `variant="lavender"`.
4. **Results header:** `mt-4 flex-row items-center justify-between`; count in `cardTitleCompact` (`${n} stay` / `${n} stays`); sort `Pressable` labeled `Sort stays, currently {label}` with `Sort by` caption, the current label in `label`, and `chevronDown` 16. Long sort labels get `numberOfLines={1}` and the count block can shrink.
5. **List:** `FlatList` of `SearchStayCard`, 12 separator, `flexGrow: 1`, `paddingBottom: insets.bottom + 24`, `contentInsetAdjustmentBehavior="never"`, `automaticallyAdjustContentInsets={false}`, `keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"`, `showsVerticalScrollIndicator={false}`. Empty state is the existing pattern, centered, with a `Clear search` button that resets the query, every filter, and the sort to Best match.
6. **State:** `query` (live, initialized from `q`), `category` (initialized from the `category` param, default All), `maxPrice`, `petFriendly`, `quiet`, `sort` (default `"best"`), `filterOpen`, `sortOpen`, and the draft filter object. Results are `searchStays(query, { category, maxPrice, petFriendly, quiet, sort })`, computed on every render (12 stays; no debounce needed).
7. **Saved state:** create `src/lib/saved-stays.ts` with a module-level `ReadonlySet<string>` and a `useSavedStays()` hook built on `useSyncExternalStore`. The subscribe function is defined at module scope; `toggleSaved(id)` replaces the set and notifies listeners. `SearchContent` calls the hook, so hearts survive the `formKey` remount and tab switches, and reset on app restart. No AsyncStorage and no backend.
8. **Sort sheet:** `@expo/ui` `BottomSheet` controlled by `sortOpen`; title `Sort by` + close; four rows from `SORT_LABELS`; selected row `bg-muted` with a check icon; tap applies and closes.
9. **Entrance:** one `FadeInDown` for the header and one for the chips, using `motion.slow`/`motion.base`, `Easing.out(Easing.cubic)`, and `ReduceMotion.System`. Do not key the list by the query and do not animate every keystroke.
10. Remove the old `Search` heading, the caption, the `filterNote`, the old category chips, and the `StaySearchField`/`StaySearchCard` imports. Keep `EmptyState` behavior but update its clear handler.

After the rewrite, remove the now-unused `StaySearchCard` export from `src/components/stay-card.tsx` (only the old Search screen imported it). Keep `StayCard` unchanged.

Done: the Search tab renders the new layout, typing filters live, the four quick chips work, hearts toggle, and back goes Home. The sliders icon is present but not yet wired.

### 4. Filter sheet and final wiring

Files: `src/components/search-screen.tsx`.

Add the filter `BottomSheet` from `@expo/ui` exactly as described in Design:

- `openFilters()` copies the applied filters into the draft and opens the sheet.
- Category chips from `STAY_CATEGORIES` (labels, no icons), single-select, `size="sm"`, lavender selected.
- Price chips Any / Under $200 / Under $300 / Under $400, single-select.
- Good for chips Pet Friendly / Quiet, multi-select.
- `Clear` resets the draft to All / Any / off / off.
- `Show N stays` computes N with `searchStays(query, { ...draft, sort }).length`, applies the draft to the applied filters, and closes.
- `onDismiss` closes without applying.
- Wire the header sliders Pressable to `openFilters`.

Done: every control in the design is functional; dismissing the sheet discards edits and applying updates the list and count.

### 5. Design comparison and polish

Run the app in the iOS simulator and open Search. Take a screenshot with `xcrun simctl io booted screenshot` and compare with `prompts/assets/search.png`:

- Back circle size and gap; field height, icon positions, text size.
- Chip height, padding, gap, selected lavender, and whether all four fit or scroll.
- Count size/weight; sort label alignment and chevron.
- Row image size/radius, title wrap, heart size/position, location/rating spacing, pill height, price alignment.
- 16 side padding and 12 row gaps.

List every difference, fix, and re-shoot. Record which measurements were estimated from the image (52 header, 36 chips, 144×152 image, 44 heart, 24 pills).

Then check dark mode and Reduce Motion, and test on a narrower device for the chip row and long sort labels.

## Verification

1. `npx tsc --noEmit` — no errors.
2. `npx expo lint` — no warnings or errors.
3. `npx expo-doctor` — all checks pass.
4. `npx expo start`, open the iOS simulator, sign in, open the Search tab. The layout matches `prompts/assets/search.png`; list and fix differences.
5. From Home, submit `quiet pet friendly cabin with hot tub under $300`. Search opens with the query prefilled and the ranked results; every result is ≤ $300.
6. Type `Cabins in California` in the Search field. The list narrows to cabins without pressing search.
7. Quick chips:
   - Cabins → 3 cabins.
   - Under $300 → 8 stays.
   - Pet Friendly → the pet/dog-friendly stays.
   - Quiet → the quiet stays.
   - Cabins + Under $300 + Pet Friendly → the three cabins (Cedar Ridge is dog friendly).
   - Under $300 + Pet Friendly + Quiet → Modern Cabin, Gullwing, Mendocino.
8. Sliders sheet: select Beach + Under $300 + Quiet; the footer count updates; Apply leaves Gullwing and Mendocino. Reopen, change something, dismiss without applying, and confirm the list is unchanged. Clear resets the draft.
9. Sort: Price: low to high starts at $185; Price: high to low starts at $420; Top rated starts at 4.9; Best match restores the default order. The header label updates.
10. Hearts: tap the first row's heart; it fills. Switch tabs and come back; it stays filled. Submit a new query from Home; it stays filled. Restart the app; it resets.
11. Empty state: type `zzzz`, or apply Pet Friendly + Under $200. `Clear search` resets the query and every filter.
12. Back button goes to Home.
13. Dark mode: `xcrun simctl ui booted appearance dark`; check the screen, chips, sheet, pills, and hearts; switch back.
14. Reduce Motion: enable it in the simulator's Accessibility settings; entrances are instant and the app still works.
15. Narrow device (iPhone SE or 375 pt): the chip row scrolls, the sort label truncates without pushing the count off screen, and rows do not clip.
16. `git status` shows only the intended files; no `.env`, `ios/`, or `android/` edits.

## AGENTS.md updates

- **Expo:** add that the Search tab follows `prompts/assets/search.png`: back to Home, compact search field with filter icon, quick chips Cabins / Under $300 / Pet Friendly / Quiet, results count + sort, and horizontal `SearchStayCard` rows. Search filters live as the guest types; the sliders icon opens the filter sheet; sort opens the sort sheet; hearts are session-local and reset on app restart. The native tab bar is unchanged.
- **Design system:** add `typography.cardTitleCompact` (17/22 Bold), `spacing["13"]` (52) and `spacing["38"]` (152), the `Chip size="sm"` compact variant (36 high, 12 horizontal padding), the `flame`/`mountain` icons, and `SearchStayCard` as the search result row. Note that the result row has no card surface or shadow; it sits directly on `bg-card`.
- **Who owns what:** extend the **Stays (local)** line: the Search tab's quick filters, filter sheet, sort, and live query all run through `searchStays` locally; saved hearts are session-only and not persisted.
- **Out of scope / rules:** keep the mock's floating yellow tab pill out of the app; `NativeTabs` remains the bar.

## Result

Built the Search tab to match `prompts/assets/search.png`: back to Home, compact live search field with sliders, the four combinable quick chips, count + sort, horizontal `SearchStayCard` rows, filter and sort sheets, session-only hearts, and the empty state. `npx tsc --noEmit`, `npx expo lint`, and `npx expo-doctor` pass.

Measured against the design at 402 pt wide, the final values differ from the estimates above:

- Header controls are 48 high (`h-12`), not 52, with a 16 gap; the design's controls are ~48.
- Compact chips are 30 high with 13 horizontal padding and 13/18 semibold `badge` text, not 36/12/`label` 15. At 36 they were 15% too large and pushed Quiet off screen; all four now fit.
- The row image is 144×156 (`h-39`), not 144×152; the design's photo is 256×278 at the same scale.
- Row gap is 18 (`h-row`), not 12, matching the design's 32 px gap.
- Results header sits 20 below the chips so the count keeps the design's ~28 pt gap.
- Amenity pills use `badge` 13 text, not caption 14, so two pills fit; they show `featuredAmenities` (hot tub, pet/dog, pool, view, fireplace, Wi-Fi) rather than the first two listed.
- Sheet content uses `pb-4`, not `insets.bottom + 16`, because SwiftUI already applies the sheet's bottom safe area; the first version had a double inset.
- The search `TextInput` omits `lineHeight`: iOS wraps long single-line values when a line height is set, even with `multiline={false}`. Long queries now truncate with an ellipsis.
- `Modern Cabin` is $280 locally (the mock shows $289), and its title wraps as "Modern Cabin with / Hot Tub" because of the local copy and 402 pt width.

Verified in Expo Go (iPhone 18 Pro, iOS 27): default list, long prefilled query (7 results, all ≤ $300), selected quick chips (1 stay), empty state, filter sheet, sort sheet, dark mode, and dark filter sheet. The data checks confirm Cabins 3, Under $300 8, Pet Friendly 6, Quiet 6, Cabins + Under $300 + Pet Friendly 3, Under $300 + Pet Friendly + Quiet 3, Beach + Under $300 + Quiet 2, and sort starts at $185 / $420 / 4.9. Not checked: tapping controls end to end (no UI automation installed), Reduce Motion visually, and a narrower simulator (only the iPhone 18 Pro has Expo Go installed).
