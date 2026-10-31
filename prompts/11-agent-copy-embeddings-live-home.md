# 11 · Agent-written stay copy, embeddings, and live Home

Status: done

## Goal

Every one of the 30 published stays has guest-facing copy written by Sanity Agent Actions from that stay's own facts, and a local checker proves the copy introduces no new names, numbers, amenities, prices, ratings, hosts, or availability claims. Dataset Embeddings is enabled on the production dataset with a stay-only projection, and Home and Search read the same published stays from Sanity, with loading, error + Retry, empty, and refresh states and no local fallback.

## Decisions

- Copy generation runs from `studio/scripts/generate-stay-copy.mjs` through the HTTP API at `https://4clz1593.api.sanity.io/vX/agent/action/generate/production`, with `schemaId: "_.schemas.default"`, `noWrite: true`, and `target: { operation: "set", include: [...] }`. `operation: "set"` is required; without it Generate appends to `vibe` and duplicates words.
- The script reads typed facts from the published Sanity stays and `sourceCopy` (the six current copy fields) plus `placeNames` from `studio/seed/seed-data.json` / `studio/seed/local-places.json`. Generated copy never feeds the next run's facts: `sourceCopy` always comes from the seed file.
- The script validates every generated stay before anything is written. Hard errors block the whole run; warnings are printed and do not block. Expected warning: Modern Cabin's "lake views" is in its source copy but not in its amenities.
- A stay gets up to 3 generation attempts. If it still has errors, the run stops, writes `studio/seed/generated-copy.rejected.json` for inspection, and exits non-zero. Nothing is patched or published.
- Generated copy replaces all six descriptive fields for all 30 stays only when the run reports 0 errors: `summary`, `description`, `vibe`, `setting`, `nearby`, `neighborhoodDescription`.
- The script never writes to Sanity. It writes `studio/seed/generated-copy.json`; the build then patches drafts through the Sanity MCP in batches of 10, validates them, and publishes them. `node studio/scripts/generate-stay-copy.mjs --merge` copies the validated artifact into `studio/seed/seed-data.json` after publish.
- Dataset Embeddings is enabled on `production` with a type-specific, stay-only projection. References are not expanded; only fields on the stay document are embedded. Search ranking is not changed in this task.
- Home and Search share one `StaysProvider` mounted in `src/app/(app)/_layout.tsx`. Both call `refresh()` on focus. There is no real-time subscription.
- The app reads published stays from `https://4clz1593.api.sanity.io` (the uncached live API), not `apicdn`, because the feature promises fresh content when a screen regains focus and the CDN may serve query results up to a minute old. The dataset is public, so no read token is used.
- The app uses plain `fetch`, not `@sanity/client`: no new dependency. A 12-second `AbortController` timeout prevents an indefinite loading state.
- `src/data/stays.ts` stays the home of the `Stay` type, categories, query parsing, sorting, and the 12 local sample stays used by `/catalog`. Search gains `searchStaysIn(stays, query, options)` and Home gains `filterStaysIn(stays, category)`; the existing `searchStays` / `filterStays` delegate to them with `STAYS`.
- `Stay` gains optional `petsAllowed`, `quiet`, and `searchText`. Live stays map `pricePerNight → price`, `maxGuests → guests`, `bathrooms → baths`, `coverPhoto.asset->url → image`, and `location.city + ", " + location.region → location`.
- `SearchStayCard` derives "Pet friendly" and "Quiet" pills from the booleans, ranked with the existing amenity priorities, so live stays still show two pills.
- Public env vars `EXPO_PUBLIC_SANITY_PROJECT_ID` and `EXPO_PUBLIC_SANITY_DATASET` are added to `.env.local` and documented in a new `.env.example` with names only. No secret key is added anywhere.
- CORS origin `http://localhost:8081` is added for Expo web. Native requests do not use CORS.

## Out of scope

- A stay detail route, gallery, host section, and policy screens.
- Wiring `text::semanticSimilarity()` into Search ranking, filter sheets for guests/bedrooms/amenities, or any GROQ-backed search.
- Real-time Sanity subscriptions, offline caching, pagination, or persisting saved stays.
- Changing the Sanity schema or reseeding documents. Existing `_id`s, `seedKey`s, hosts, policies, prices, ratings, and covers are untouched.
- Writing copy from Jev or any LLM in the app. All app answers remain word-for-word content.

## Steps

### 1. Add the place-name allowlist and the copy generation script

Create `studio/seed/local-places.json`, keyed by `seedKey`, listing the place names already present in each stay's `setting`, `nearby`, and `neighborhoodDescription`. Curate it by hand; do not generate it at runtime. Include only names that are already in the seed copy, e.g.:

```json
{
  "modern-cabin-hot-tub": ["Lake Arrowhead Village", "Pinnacles", "Heaps Peak", "Snow Valley"],
  "cedar-ridge-cabin": ["Big Bear Village"]
}
```

Every stay gets an entry, using `[]` when it has no place names. City and region are added by the script.

Create `studio/scripts/generate-stay-copy.mjs` (Node ESM, no new dependencies). It must:

1. Read `studio/seed/seed-data.json` and `studio/seed/local-places.json`.
2. Resolve the token from `process.env.SANITY_API_TOKEN`, else `authToken` in `~/.config/sanity/config.json`. Fail with a `sanity login` hint if neither exists. Never print the token.
3. Query published stays from `https://4clz1593.api.sanity.io/v2025-02-19/data/query/production`:

```groq
*[_type == "stay"]{
  _id, seedKey, title, category, location, maxGuests, bedrooms, beds,
  bathrooms, amenities, petsAllowed, quiet
}
```

Fail if the set of `seedKey`s differs from the seed file.

4. Build facts per stay: the typed fields above, `placeNames` (city, region, country, plus the curated list), and `sourceCopy` (the six seed fields).
5. POST this body sequentially (200 ms between stays, honour `Retry-After` on 429, at most 3 retries):

```json
{
  "schemaId": "_.schemas.default",
  "documentId": "<published _id>",
  "noWrite": true,
  "instruction": "<instruction below>",
  "instructionParams": { "facts": { "type": "constant", "value": "<JSON.stringify(facts)>" } },
  "target": {
    "operation": "set",
    "include": ["summary", "description", "vibe", "setting", "nearby", "neighborhoodDescription"]
  }
}
```

The instruction is the version verified against Modern Cabin:

```
Write the guest-facing copy for one vacation rental. Use only the facts in $facts. The sourceCopy key in the JSON is the only source for concrete details. Do not use outside knowledge and do not invent any detail.

Voice: concrete, calm, specific. No marketing adjectives.

Fields:
- summary: one sentence, max 180 characters. Lead with the home's most distinctive feature named in facts.title, then one supporting detail. Do not list bedrooms or guests.
- description: 3-4 sentences about the home itself: materials, light, layout, deck, fireplace. Mention the feature the title promises. Only mention amenities in facts.amenities.
- vibe: 3-5 lowercase single words describing atmosphere. No duplicates. Use only words supported by the facts.
- setting: 1-2 sentences about the landscape and surroundings.
- nearby: 1-2 sentences about places to go. Use only place names in facts.placeNames.
- neighborhoodDescription: 2-3 sentences about the area, walkability, noise, and what is close. Use only place names in facts.placeNames.

Hard rules:
- Do not mention price, fees, ratings, reviews, host names, availability, or exact addresses.
- Do not claim a view, feature, or amenity that is not in facts.
- Do not use "best", "perfect", "luxury", "stunning", "unforgettable", "dream", or "ideal".
- Every field must say something different.
- US English, sentence case.

$facts is JSON. Use it as the only source.
```

6. Read the generated document from the top level of the 200 response (not `result`). Validate with `validateStayCopy(facts, copy)`:

- All six fields are non-empty; `summary` ≤ 180 characters; `vibe` is 3–5 unique lowercase single words (hyphens allowed).
- Every `vibe` word appears in the allowed text (facts + `sourceCopy` + `placeNames`). Unsupported words are errors.
- **Proper nouns:** extract capitalized sequences, including hyphenated forms (`Wi-Fi`, `A-Frame`) and all-caps tokens (`PCH`, `BBQ`). A sequence is allowed if its lowercase form appears in the allowed text or it is a sentence-start word (`The`, `A`, `This`, `It`, etc.). Any other proper noun is an error.
- **Numbers:** extract digits and number words. A number is allowed if the same value appears in the allowed text or equals `maxGuests`, `bedrooms`, `beds`, or `bathrooms`. Any other number is an error.
- **Features and amenities:** match generated text against the `AMENITIES` list parsed from `studio/schemaTypes/stay.ts` plus a small feature list (`deck`, `dock`, `kayak`, `boat`, `pier`, `yard`, `garage`, `elevator`, `wood stove`, `king bed`, `queen bed`, `bunk bed`). A mention is an error only when it is neither in `facts.amenities` nor in `sourceCopy`.
- **Forbidden claims:** `$`, price/nightly/fee/tax/deposit, rating/rated/review/star, host/superhost, available/availability/booked/vacancy, month names, and street addresses are errors.
- **Banned marketing words:** best, perfect, luxury/luxurious, stunning, unforgettable, dream, ideal, amazing, breathtaking, oasis, paradise, gem, nestled, boasts, "you'll".
- **Duplication:** no normalized sentence may appear in two fields, and `summary` may not repeat another field verbatim.
- **Warnings:** view/scenic claims not backed by an `Ocean view` / `Mountain view` / `Skyline view` amenity or `Lake access`; sentences over 30 words; generated copy identical to source copy.

On validation errors, retry with the same instruction plus:

```
Previous attempt errors to fix:
- <error>
```

7. If all 30 pass, write `studio/seed/generated-copy.json` with `{ generatedAt, stays: [{ seedKey, _id, copy }] }` and print a table: stay, attempts, errors, warnings. Exit 0. If any stay fails after 3 attempts, write `generated-copy.rejected.json` with the failing copies and errors, exit 1.

8. Support `--merge`: read `generated-copy.json` and write the six fields into the matching seed stays, preserving every other field, key order, and the file's 2-space JSON formatting.

Done when: `node studio/scripts/generate-stay-copy.mjs` prints 30 stays, 0 errors, and writes the artifact; no document in Sanity changed (query `count(*[_id in path("drafts.**")])` stays 0).

### 2. Publish the generated copy and merge it into the seed

Read `studio/seed/generated-copy.json` and, in batches of 10 documents:

1. Call `patch_documents` for the batch with one patch per `_id`:
   `{ patches: [{ set: { summary, description, vibe, setting, nearby, neighborhoodDescription } }] }`.
2. Call `documents_validate` on the resulting `drafts.<id>` IDs for the batch.
3. Call `publish_documents` with the published `_id`s.

Repeat until all 30 are published. Then run `node studio/scripts/generate-stay-copy.mjs --merge` and confirm `studio/seed/seed-data.json` still has 30 stays, 8 hosts, 14 policies, and the six fields match the artifact.

Done when: a GROQ query for all 30 stays returns non-empty six fields, the artifact and the seed file match, and `count(*[_id in path("drafts.**")])` is 0.

### 3. Enable Dataset Embeddings with a stay-only projection

From `studio/` run:

```bash
npx sanity datasets embeddings enable production --project 4clz1593 --wait \
  --projection='{
    _type == "stay" => {
      title, summary, description, vibe, setting, nearby,
      neighborhoodDescription, category,
      "city": location.city,
      "region": location.region,
      amenities
    }
  }'
```

Then verify:

```bash
npx sanity datasets embeddings status production --project 4clz1593
```

Expect `Embeddings: enabled`, `Status: ready`, and the projection above. Run a GROQ query:

```groq
*[_type == "stay"] | score(text::semanticSimilarity("quiet cabin with a hot tub in the woods")) [0...5] {
  title, _score
}
```

Expect `_score` on every row and the hot-tub cabins near the top. This proves embeddings exist; Search does not use this query yet.

Done when: status is `ready` and the semantic query returns scored stays.

### 4. Add the live data layer and provider

- Add to `.env.local` (do not commit): `EXPO_PUBLIC_SANITY_PROJECT_ID=4clz1593` and `EXPO_PUBLIC_SANITY_DATASET=production`.
- Create `.env.example` with names only: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=`, `CLERK_SECRET_KEY=`, `EXPO_PUBLIC_SANITY_PROJECT_ID=`, `EXPO_PUBLIC_SANITY_DATASET=`.
- Create `src/data/live-stays.ts`:
  - Read the two env vars at module load and throw a clear message pointing at `.env.example` if either is missing (same pattern as the Clerk publishable key).
  - `STAYS_QUERY` selects `_id`, `title`, `slug.current`, `location`, `category`, `pricePerNight`, `rating`, `reviewCount`, `maxGuests`, `bedrooms`, `bathrooms`, `amenities`, `petsAllowed`, `quiet`, `vibe`, the six copy fields, `coverPhoto.asset->url`, and `featured`, ordered by `featured desc, rating desc`.
  - `fetchStays(signal)` fetches `https://<project>.api.sanity.io/v2025-02-19/data/query/<dataset>?query=<encoded>` with no token, checks `res.ok`, reads `result`, and maps each document. A 12-second `AbortController` timeout is owned by the provider.
  - `mapStay` skips documents missing required fields (warn in dev), maps names as decided above, appends `?auto=format&w=1200&q=80&fit=max` to the image URL, and derives:
    - `tags`: category label, `"pet friendly"` when `petsAllowed`, `"quiet"` when `quiet`, lowercased amenities and vibe words.
    - `searchText`: title, location, category, summary, description, vibe, setting, nearby, neighborhoodDescription, amenities, and the pet/quiet labels, lowercased.
  - Export `StaysFetchError` with a friendly message.
- Create `src/data/stays-provider.tsx`:
  - `StaysProvider` state: `stays`, `status: "loading" | "ready" | "error"`, `error`, `refreshing`, `refreshError`.
  - Fetch once on mount. `refresh()` no-ops while the first load is in flight or a refresh is already running. `retry()` reloads.
  - A refresh failure with data keeps the old stays and sets `refreshError`; an initial failure sets `status: "error"` and `error`. No local stays are ever mixed in.
  - Abort the in-flight request on unmount; ignore stale responses with a request counter.
  - `useStays()` throws outside the provider. `useRefreshStaysOnFocus()` calls `refresh()` inside `useFocusEffect`.
- In `src/data/stays.ts`:
  - Add optional `petsAllowed`, `quiet`, `searchText` to `Stay`.
  - Extract the body of `searchStays` into `searchStaysIn(stays, query, options)`; `searchStays` calls it with `STAYS`.
  - Add `filterStaysIn(stays, category)` that filters and sorts featured first, then rating, then review count; `filterStays(category)` calls it with `STAYS`.
  - `searchTextFor` returns `stay.searchText` when present.
  - `isPetFriendly` returns `stay.petsAllowed` when defined; the quiet filter uses `stay.quiet ?? tags.includes("quiet")`.
- Add `http://localhost:8081` as a CORS origin for project `4clz1593` with credentials disabled.

Done when: type check and lint pass; the app still renders from local data because the provider is not mounted yet.

### 5. Connect Home to live stays

- Create `src/components/stays-state.tsx` with four shared, theme-token-based components:
  - `StaysLoading`: centered `ActivityIndicator` + `AppText variant="caption"` "Loading stays…".
  - `StaysError`: `circleAlert` icon in an error-surface circle, title "Couldn't load stays", the friendly message, and a primary `Button label="Retry"`. `accessibilityRole="alert"`.
  - `StaysEmpty`: icon, title, message, optional action.
  - `StaysRefreshNotice`: compact error-surface row, "Couldn't refresh stays." plus a Retry pressable.
- Mount `<StaysProvider>` around `<NativeTabs>` in `src/app/(app)/_layout.tsx`.
- In `src/components/home-screen.tsx`:
  - Replace `filterStays(category)` with `filterStaysIn(stays, category)` from `useStays()`.
  - Call `useRefreshStaysOnFocus()`.
  - Keep the header, search field, and category chips visible in every state.
  - `status === "loading"` → `StaysLoading`; `status === "error"` → `StaysError` with `retry`; ready with 0 results → `StaysEmpty` ("No stays in this category yet."); `refreshError` with data → `StaysRefreshNotice` above the cards, with `retry`.
  - Keep the existing card entrance animation keyed by category.

Done when: Home shows 30 published stays, category chips filter them, a stay that exists only in Sanity (e.g. "Blue Spruce Chalet" or "Soho Loft") is visible, and the error state appears when the dataset is unreachable.

### 6. Connect Search to the same live stays

- In `src/components/search-screen.tsx`:
  - `SearchContent` uses `useStays()`, `searchStaysIn(stays, query, { ...filters, sort })`, and `useRefreshStaysOnFocus()`.
  - Pass `stays` into `FilterSheet` and use `searchStaysIn` for its draft count.
  - While loading, keep the header, search field, and quick chips; show `StaysLoading` in the body and "Loading stays…" instead of the count. On error show `StaysError` and hide the sort control. With data, keep the existing count, sort, list, and `EmptyState`. Show `StaysRefreshNotice` when `refreshError` is set.
  - Keep `key={formKey}` so a new query from Home remounts the form and refreshes.
- In `src/components/search-stay-card.tsx`:
  - Build pill candidates from `featuredAmenities(stay.amenities)` plus `{ icon: "pawPrint", label: "Pet friendly" }` when `stay.petsAllowed` and `{ icon: "moon", label: "Quiet" }` when `stay.quiet`.
  - Rank with the existing priority list (hot tub, pet, pool, view, fireplace, quiet, Wi-Fi), dedupe by label, and keep the design's two pills. Local sample stays without the booleans behave exactly as today.

Done when: Search returns the same 30 stays, the four quick filters and both sheets work over live data, and a query from Home searches the live set.

### 7. Update the project memory

Update `AGENTS.md` as described in the final section. Do not change the Sanity schema or reseed.

## Verification

1. `node studio/scripts/generate-stay-copy.mjs` → 30 stays, 0 errors, warnings listed (including Modern Cabin's view claim); `studio/seed/generated-copy.json` has 30 entries.
2. `count(*[_id in path("drafts.**")])` = 0 after generation.
3. After patch/validate/publish: all 30 stays return non-empty six fields; the artifact and live query response match 30/30; `count(*[_id in path("drafts.**")])` = 0.
4. `node studio/scripts/generate-stay-copy.mjs --merge` → seed file still has 30 stays, 8 hosts, 14 policies, and its six fields match the artifact.
5. `npx sanity datasets embeddings status production --project 4clz1593` → enabled, `ready`; the semantic query returns `_score` and plausible top results.
6. `npx tsc --noEmit` ✅ and `npx expo lint` ✅.
7. Simulator (scheme `room`): sign in, Home shows 30 stays including at least one Sanity-only stay; category chips filter; Search shows the same set; query "hot tub" and the four quick chips work; filters and sort work.
8. Error state: temporarily set `EXPO_PUBLIC_SANITY_DATASET=missing` in `.env.local`, restart Expo, reload Home → "Couldn't load stays" with Retry, no local cards. Restore the value, restart, tap Retry → 30 stays.
9. Refresh on focus: patch one stay's `title` with a visible suffix through the Sanity MCP, publish it, switch Home → Search → Home, and expect the new title. Revert the title and publish again.
10. Web CORS: `npx expo start --web`, open `http://localhost:8081`, sign in, Home loads with no CORS error in the console.
11. Screenshot Home and Search with `xcrun simctl io booted screenshot <path>` and compare against `prompts/assets/home.png` and `prompts/assets/search.png`; list and fix every difference. The loading/error/empty/refresh states have no design reference; report that.
12. `grep -R "CLERK_SECRET_KEY\|SANITY_API_TOKEN" src` returns nothing; only `EXPO_PUBLIC_SANITY_*` names are used in the app.

## AGENTS.md updates

- **Commands:** add `node studio/scripts/generate-stay-copy.mjs` (generate + check) and `--merge` (copy the validated artifact into the seed).
- **Expo:** replace the "Home and Search read `src/data/stays.ts`" bullet with: Home and Search read published Sanity stays through `StaysProvider` (`src/data/stays-provider.tsx`), refresh on focus, and show shared loading/error/empty/refresh states with no local fallback. `src/data/stays.ts` keeps the `Stay` type, categories, query parsing, sorting, and the 12 local stays used by `/catalog`.
- **Who owns what → Content:** add that stay copy is generated by Agent Actions from each stay's typed facts and source copy, checked by `studio/scripts/generate-stay-copy.mjs` before any write, and stored back in `studio/seed/seed-data.json`. Copy is never generated in the app.
- **Who owns what → Stays (local):** replace with "Stays (live)" describing the Sanity read path, the public env vars, and that prices/guest counts/dates are still parsed in code.
- **Who owns what → Embeddings:** state that Dataset Embeddings is enabled on `production` with a stay-only projection and that Search ranking does not use it yet.
- **Rules:** add that public Sanity project ID/dataset may be `EXPO_PUBLIC_` vars, but Sanity tokens stay server-side; note the new CORS origin `http://localhost:8081`.

## Result

Shipped. Agent Actions rewrote all six descriptive fields for all 30 stays; the checker passed 30/30 with 0 errors and 2 view warnings, the copies were published through the Sanity MCP (0 drafts left), and the seed was merged. Dataset Embeddings is `enabled`/`ready` with the stay-only projection, and the semantic query scores hot-tub cabins highest. Home and Search now share `StaysProvider` over the public live API with focus refresh and shared loading/error/empty/refresh states; `src/data/stays.ts` keeps the sample stays only for `/catalog`.

Verified in the simulator: Home renders live Sanity stays, Search returns 10 results for "hot tub" and 8 for Cabins, refresh-on-focus picked up a published title change, and the missing-dataset error showed Retry with no local cards. Not exercised: taps inside the simulator (chips, sheets, Retry, web sign-in) because the headless simulator has no tap automation; those paths were checked in code and through deep links. Screenshots match the designs except the documented native tab bar and the Expo Go dev-menu overlay.
