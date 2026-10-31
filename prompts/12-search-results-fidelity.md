# 12 · Search results screen fidelity

Status: done

## Goal

The Search tab matches `prompts/assets/search.png` exactly: a 52-high back button and search field, the four compact filter chips, a real result count with the sort control, and result rows on soft white cards with a 144×152 photo, two-line title, location, rating, two amenity pills, price, and heart. It reads the published Sanity stays through `StaysProvider`, so search, the quick filters, the filter sheet, sort, hearts, and the loading/error/empty/refresh states all work on live content.

## Context

The Search tab already exists from plan 09 and already reads live Sanity stays from plan 11. This plan is a visual fidelity pass, not a new screen: it adds the design's card surface and shadow, which plan 09 deliberately omitted, and re-checks the measurements that were estimated from the mock.

## Decisions

- Refine `src/components/search-screen.tsx` and `src/components/search-stay-card.tsx`. No new route, no new data layer, no Sanity schema or content changes.
- The design's result rows sit on a white card with a soft shadow; plan 09's "no card background or shadow" was wrong. The row becomes `bg-card rounded-field shadow-card` with a 4 dp inset (`p-1`), on the existing white `bg-card` screen. The shadow is what separates the card from the screen.
- The photo is 144×152 (`w-36 h-38`) with `rounded-tile`, 14 dp from the text column. Plan 09's result used 156 high; the mock's photo is 144×152 at 402 pt.
- The card title gets its own token: 18/24 Bold, because the design's title is larger than the 17/22 `cardTitleCompact` used by the result count. The result count stays `cardTitleCompact`.
- The price gets its own token: 22/28 Bold, because the design's price is larger than the 20/26 `price` used on Home cards.
- Header controls are 52 (`h-13`), 12 apart, 16 side margins. Plan 09's result used 48; the mock's back circle and field are 52 at 402 pt.
- `Chip size="sm"` becomes the design's compact chip: 36 high (`h-9`), 10.5 horizontal padding (`px-3`), 15/20 semibold (`label`), 10 gap. All four chips may scroll on a 402 pt screen; the row is already a horizontal `ScrollView`.
- Card surface radius 24 (`rounded-field`), image radius 14 (`rounded-tile`), card inset 4 (`p-1`), 18 gap between rows (`h-row`). The list keeps 16 horizontal padding and `insets.bottom + 24` bottom padding.
- Keep the real live count (30 published stays, filtered), the guest's query (empty by default), the quick filters, filter and sort sheets, session hearts, and the shared loading/error/empty/refresh states. The mock's "124 stays" and "Cabins in California" are sample data, not defaults.
- No new dependency. `shadow-card` and `rounded-field` already exist in the tokens.

## Design

Measurements estimated from `prompts/assets/search.png` (941×1672 image; phone screen x≈114–827, scale ≈1.78 px per point at 402 pt).

- **Screen:** `bg-card`, `paddingTop: insets.top + 8`, 16 side padding. No separate results sheet.
- **Header:** 52×52 `bg-muted` back circle with `chevronLeft` 24, 12 gap, flex-1 pill field 52 high in `bg-muted`. Field: 18 left padding, `search` 20, 12 gap, body 16 input, 40×40 sliders button at the right with 4 right padding.
- **Chips:** horizontal `ScrollView`, 12 below the header, 16 horizontal padding, 10 gap. Four `Chip size="sm"` (36 high, 10.5 horizontal padding, 15 semibold): Cabins, Under $300, Pet Friendly, Quiet. Selected is `bg-lavender` with dark text; unselected is `bg-muted`.
- **Results header:** 20 below the chips, 16 horizontal padding. Count in `cardTitleCompact` 17/22 Bold. Right: `Sort by` caption 14, the current sort in `label` 15 semibold, `chevronDown` 16, 4 gap.
- **Cards:** full width minus 16 margins, `bg-card`, radius 24, `shadow-card`, 4 inset, 18 gap between rows. The photo is 144×152, radius 14, 14 from the text column.
- **Text column:** title 18/24 Bold, max 2 lines, flex-1. Heart 44×44 `bg-muted` circle with a 22 outline heart; saved is filled `error`. Location row 4 below the title: `mapPin` 14, caption 14 `mutedForeground`. Rating row 4 below: `star` 16 filled, rating `label` 15, review count caption 14. Pills 8 below: up to two, 24 high, `rounded-pill bg-muted`, 10 horizontal padding, 6 gap, icon 14, `badge` 13. Price row at the bottom: `searchPrice` 22/28 Bold, `/ night` caption 14.
- **List:** 12 below the results header, 16 horizontal padding, bottom `insets.bottom + 24`. Empty state keeps the icon circle, `No stays found`, caption, and `Clear search`.
- **New tokens:** `typography.searchCardTitle` (Plus Jakarta Sans Bold, 18, 24, −0.2, foreground) and `typography.searchPrice` (Plus Jakarta Sans Bold, 22, 28, −0.2, foreground). Everything else maps to existing tokens: `h-13` 52, `h-9` 36, `h-11` 44, `h-6` 24, `h-38` 152, `rounded-field` 24, `rounded-tile` 14, `shadow-card`, `bg-muted`, `bg-lavender`, `bg-card`.
- **States:** loading, error + Retry, empty, and refresh-notice states stay as they are; they have no design reference.

## Out of scope

- A stay detail route, booking, availability, persisted favorites, a Saved tab.
- New filters, embeddings-based ranking, GROQ-backed search, or pagination.
- Changes to Home, auth, the Sanity schema, or the native tab bar.
- The mock's floating yellow tab bar; `NativeTabs` remains the bar.

## Steps

### 1. Tokens and the compact chip

Files: `src/theme/tokens.json`, `src/components/ui/chip.tsx`, `src/app/catalog.tsx`.

- Add `typography.searchCardTitle` (18/24 Bold, −0.2, foreground) and `typography.searchPrice` (22/28 Bold, −0.2, foreground) to `tokens.json`.
- Change `sizeClasses.sm` in `chip.tsx` from `h-[30px] px-[13px]` to `h-9 px-3`, and the `sm` text variant from `badge` to `label` with `font-sans-semibold`. Keep `md` unchanged.
- Add the two new typography variants to the catalog's `typeOrder` and `typeSamples` so the `Record<TypeVariant, string>` still type-checks. The catalog's compact chips and `SearchStayCard` preview update automatically.

Done: `npx tsc --noEmit` and `npx expo lint` pass; the catalog shows the 36-high compact chips and the two new type samples.

### 2. The search result card

File: `src/components/search-stay-card.tsx`.

- Wrap the row in `View className={cn("flex-row bg-card rounded-field shadow-card p-1", className)}` with `style={{ gap: 14 }}`.
- Photo: `h-38 w-36 overflow-hidden rounded-tile bg-muted` (144×152).
- Text column: `flex-1 justify-between` with `py-1 pr-2`.
- Title: `searchCardTitle` 18/24, max 2 lines.
- Heart: 44×44 `bg-muted`, 22 icon, unchanged accessibility.
- Location, rating, pills, and the price row keep their current content; the price uses `searchPrice` 22/28. Pills stay 24 high with `badge` 13.
- Keep `featuredAmenities` and the derived Pet Friendly / Quiet pills.

Done: the row shows a soft white card with the photo, text, heart, and price; the catalog preview shows the same card; type check and lint pass.

### 3. The search screen layout

File: `src/components/search-screen.tsx`.

- Header: back and field `h-13` (52), `gap-3` (12), field `pl-5`, internal `gap-3`, sliders 40 with `pr-1`.
- Chips row: `marginTop: 12`, `contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}`. The `Chip size="sm"` now renders 36 high.
- Results header: keep `marginTop: 20`; count `cardTitleCompact`; sort caption/label/chevron unchanged.
- List: keep 16 horizontal padding, 12 top, `insets.bottom + 24` bottom, 18 separator. The card surface is inside `SearchStayCard`, so no extra list padding is needed.
- Filter and sort sheets: keep their content and behavior. The filter sheet's `size="sm"` chips become 36 high; check the sheet still fits.
- Loading/error/empty/refresh states: keep as they are.

Done: the screen matches the design's header, chips, count, sort, and card rows; the live query and filters still work.

### 4. Simulator comparison and polish

Open the Search tab in the iOS simulator and compare with `prompts/assets/search.png`:

- Header circle/field size, gap, icon and text positions.
- Chip height, padding, gap, selected lavender, and whether all four fit or scroll.
- Count size/weight, sort alignment.
- Card surface, shadow, radius, inset, photo size/radius, title wrap, heart, location/rating/pills/price spacing.
- 16 side padding, 18 row gaps, bottom padding under the native tab bar.

Fix every difference, re-shoot, and record which values were estimated from the image. Check dark mode and a narrower device.

## Verification

1. `npx tsc --noEmit` — no errors.
2. `npx expo lint` — no warnings or errors.
3. `npx expo start`, sign in, open Search. The screen matches `prompts/assets/search.png`; list and fix differences.
4. Live data: Search shows the published Sanity stays (30 total), including a Sanity-only stay; the count is real; typing `hot tub` filters live; the four quick chips combine; the filter sheet's draft count and Apply work; sort changes the order; hearts toggle.
5. States: with the dataset unreachable, Search shows "Couldn't load stays" with Retry and no local cards; restore the dataset and retry. The empty state appears for a query with no matches and `Clear search` resets it.
6. From Home, submit `quiet pet friendly cabin with hot tub under $300`; Search opens with the query prefilled and every result ≤ $300.
7. Dark mode: `xcrun simctl ui booted appearance dark`; the card surface, shadow, chips, pills, and hearts remain legible. Switch back.
8. Narrow device or a 402 pt simulator: the chip row scrolls, the sort label truncates without pushing the count off screen, and the card title/heart do not clip.
9. `git status` shows only the intended files; no `.env`, `ios/`, or `android/` edits.

## AGENTS.md updates

- **Design system:** change the `Chip size="sm"` line from 30 high / 13 padding / 13/18 badge to 36 high / 10.5 padding / 15/20 semibold `label`. Change the `SearchStayCard` line: it is a white `rounded-field` card with `shadow-card`, 4 inset, 144×152 photo, 18/24 title, 22/28 price, and 18 row gap. Remove "no card surface or shadow".
- **Expo:** keep the live Sanity description; note the Search rows sit on soft cards and the count is the real live count.
- **Who owns what → Stays (live):** unchanged; the data path is not moving.

## Result

Shipped. Search now matches the mock's card treatment and header scale while keeping the live Sanity path.

- `searchCardTitle` landed at 18/22 (not 18/24) and `searchPrice` at 22/28. The mock's title leading is ~1.22× the font size, which 18/22 reproduces; 18/24 was visibly looser.
- `Chip size="sm"` is 36 high, `px-3`, 15/20 semibold `label`; `md` is unchanged.
- `SearchStayCard` is a white `rounded-field bg-card shadow-card` card with `p-1`, a 144×152 photo, 14 gap to the text column, an absolutely positioned 44 heart at the content's top-right (title/location reserve `pr-13`), `searchCardTitle`, `searchPrice`, 26-high amenity pills with 14 icons and 8 between pills, and 8 between rows.
- `SearchScreen`: 52 header controls, 12 gaps, field `pl-5`, 36 chips, results header 16 below the chips, list 12 horizontal padding (so the card content lands at 16) with 8 top padding and an 8 separator, empty state `px-5`.
- No new dependency, no schema or content changes, no data-path changes. Live count, query prefill, filtering, sorting, sheets, and session hearts are untouched.

Verified on the iPhone 18 Pro simulator (402 pt): default live count 30, `hot tub` → 10, a nonsense query → 0 with the empty state, and `quiet pet friendly cabin with hot tub under $300` → 16 with every visible price ≤ $300. Light and dark mode both legible. Taps inside the headless simulator (chips, sheets, hearts, Retry) could not be automated; those paths were checked in code only.

Known deltas from the mock: the mock's secondary type (location, rating, pills) measures smaller than our approved 14/13/15 tokens; the mock wraps "Modern Cabin / with Hot Tub" because its title column is narrower relative to our 402 pt screen (ours fits one more word); the mock's muted surface is ~#EFF1F4 vs our #F4F5F7; and the mock's floating yellow tab bar is intentionally not reproduced.
