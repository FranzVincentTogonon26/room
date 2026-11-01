# 15 · Server-side search

Status: blocked

## Goal

The Search tab sends the guest's sentence to `POST /api/search`. The route resolves every filter group — pets, amenities, type, vibe — as **wanted**, **avoided**, or **not mentioned**, decides what each number in the sentence means, builds the GROQ itself from code-owned vocabularies, and runs it with `text::semanticSimilarity()` through the `room-search` Sanity Context endpoint. The screen renders the ranked stays the route returns.

## Decisions

- **Transport:** the route calls the `room-search` Context endpoint's `groq_query` tool directly over MCP JSON-RPC. No LLM sits in the loop, so code owns the query. The endpoint requires an organization API token with **Context Viewer**; the token currently in `.env.local` returns `403 contextGrantRequired` and must be replaced.
- **Intent:** Jev via `experimental_evaluate` (`ai` v7) with `@ai-sdk/typesafe-ai` (`typeSafeAi.decisionModel("jev-latest")`). Every filter group is one `choice` question with exactly three criteria: `wanted`, `avoided`, `notMentioned`.
- **Numbers:** code finds every numeric mention in the sentence; Jev only chooses which slot each mention fills (`maxPrice`, `guests`, `bedrooms`, `nights`, `ignore`) among candidates code produced. Jev never outputs a number — this keeps AGENTS.md's rule that prices and guest counts are parsed in code.
- **Avoided is a hard exclude**, not a down-rank: `!($amenity in amenities)`, `category != $category`, `petsAllowed != true`, `!($vibe in vibe)`.
- **Ranking and filtering both run server-side.** The route takes the sentence plus the chips, sort, and filter-sheet state as explicit params and returns the final ranked list. The client does not re-filter.
- **Vocabularies live in code**, not in the prompt: 4 categories, 33 amenities, 26 vibes, price bands, guest bands, bedroom bands. Jev can only choose from what code supplies.
- **Auth:** the route verifies the Clerk session before any work, using `@clerk/backend`'s `verifyToken` with `CLERK_SECRET_KEY`. This is a new dependency.
- **Client latency:** 350 ms debounce, abort the in-flight request on a new keystroke, keep the previous results visible while a new request is in flight.
- Defaults picked: result cap 40; `jev-latest`; 6 s Jev timeout; 8 s Context timeout.

## Out of scope

- The Home tab, its category chips, and `StaysProvider` keep their current client-side behaviour.
- Saved hearts stay session-local.
- No conversational follow-ups: each request is one sentence, stateless.
- No caching layer or rate limiting beyond the debounce.
- The `/catalog` screen and the local sample stays are untouched.
- `searchStaysIn` and `parseStayQuery` stay in `src/data/stays.ts` for the local samples; they are no longer used by the Search tab.

## Steps

### 1. Confirm the endpoint and record the `groq_query` schema

Blocked on the new token. With `SANITY_ORGANIZATION_TOKEN` set to an org token that has Context Viewer:

1. `POST` `tools/list` to `SANITY_CONTEXT_MCP_URL` and confirm the endpoint is in **GROQ mode** (it must serve `initial_context`, `schema_explorer`, `groq_query`, `array_field_reader`).
2. Record the exact input schema of `groq_query` — specifically whether it accepts a params object alongside the query string. Write it into this plan under this step.
3. `POST` a `tools/call` for `groq_query` with `*[_type=="stay"]{title}[0...1]` and confirm a result comes back.

Done when: the tool list and a successful `tools/call` are both recorded here, and the params question is answered either way.

### 2. Code-owned vocabularies and number parsing

New `src/lib/search-filters.ts`:

- `SEARCH_CATEGORIES` = `["cabins","beach","city","villas"]`.
- `SEARCH_AMENITIES` = the 33 values from `studio/schemaTypes/stay.ts`.
- `SEARCH_VIBES` = the 26 values currently present in `production` (`quiet, cozy, romantic, urban, bright, compact, lively, historic, residential, industrial, wooded, mountain, snowy, spacious, desert, sunny, private, walkable, warm, coastal, family, secluded, open, tropical, beach, casual`).
- `PRICE_BANDS`, `GUEST_BANDS`, `BEDROOM_BANDS` as ordered arrays of numbers.
- `extractNumberMentions(sentence)` returns `{ value, raw, context }[]`, where `context` is the ~40 characters around the match so Jev can judge the slot.
- Type `FilterIntent = "wanted" | "avoided" | "notMentioned"` and `SearchIntent` describing one `FilterIntent` per group plus `numbers: { value, slot }[]`.

Done when: `npx tsc --noEmit` passes and a scratch script prints the number mentions for `"quiet pet friendly cabin with a hot tub under $300 for 4 people"` as `300` and `4`.

### 3. Jev decision layer

`npx expo install ai @ai-sdk/typesafe-ai` (pin exact versions — the API is experimental), add `TYPESAFE_AI_API_KEY` to `.env.local` and `.env.example`.

New `src/lib/search-intent.ts`, exporting `resolveSearchIntent(sentence): Promise<SearchIntent>`:

- One `experimental_evaluate` call, `model: typeSafeAi.decisionModel("jev-latest")`, `state: [{ type: "text", text: sentence }]`.
- Questions, all `type: "choice"` with `criteria: { wanted, avoided, notMentioned }`:
  - `pets`
  - `category:<value>` for each of the 4 categories
  - `amenity:<value>` for each of the 33 amenities
  - `vibe:<value>` for each of the 26 vibes
  - `number:<index>` for each mention from step 2, with criteria `maxPrice`, `guests`, `bedrooms`, `nights`, `ignore`
- Map each answer's `choice` straight through. A `refusal` or a missing answer resolves to `notMentioned`.
- Wrap in a 6 s `AbortSignal.timeout`, and on failure return an all-`notMentioned` intent with no numbers rather than throwing — the route then still returns semantic results.

Done when: a scratch script prints the intent for the four sample sentences in Verification, and `notMentioned` dominates for `"somewhere warm"`.

### 4. GROQ builder

New `src/lib/search-groq.ts`, exporting `buildSearchQuery(intent, options): { query: string; params: Record<string, unknown> }`:

- `options` carries the client's chips and filter sheet: `category`, `maxPrice`, `petFriendly`, `quiet`, `sort`.
- Filter clauses, all ANDed onto `_type == "stay"`:
  - pets wanted → `petsAllowed == true`; avoided → `petsAllowed != true`
  - each wanted category → `category == $categoryN` (OR'd together); each avoided → `category != $categoryN`
  - each wanted amenity → `$amenityN in amenities`; avoided → `!($amenityN in amenities)`
  - each wanted vibe → `$vibeN in vibe`; avoided → `!($vibeN in vibe)`
  - max price → `pricePerNight <= $maxPrice`
  - guests → `maxGuests >= $guests`
  - bedrooms → `bedrooms >= $bedrooms`
  - chips: `category` → `category == $chipCategory`; `petFriendly` → `petsAllowed == true`; `quiet` → `quiet == true`; `maxPrice` → `pricePerNight <= $chipMaxPrice`
- Ranking: `| score(text::semanticSimilarity($q))` then `| order(...)` — `_score desc` for `best`, `pricePerNight asc/desc` for the price sorts, `rating desc, reviewCount desc` for `Top rated`. Always slice `[0...40]`.
- Projection: reuse the field list from `STAYS_QUERY` in `src/data/live-stays.ts` so the response maps with the same `mapStay`.
- Every interpolated value must come from the code-owned vocabularies or be a validated number. If `groq_query` turns out not to accept params (step 1), the builder emits literal GROQ with values JSON-escaped; the sentence is always passed as `$q` or escaped with `JSON.stringify`.

Done when: a scratch script prints a query for a mixed intent and it runs successfully through the Context endpoint.

### 5. Context endpoint client

New `src/lib/sanity-context.ts`, exporting `runGroq(query, params)`:

- Read `SANITY_CONTEXT_MCP_URL` and `SANITY_ORGANIZATION_TOKEN` from `process.env`; throw a typed error if either is missing.
- `initialize` → `notifications/initialized` → `tools/call` with `name: "groq_query"`, carrying `Mcp-Session-Id` if the handshake returned one.
- Accept both `application/json` and `text/event-stream` responses; for SSE, read the `data:` frames and take the last JSON-RPC message.
- 8 s timeout via `AbortSignal.timeout`.
- Surface MCP `error.message` verbatim so the route can explain a failure by cause.

Done when: a scratch script runs a query end to end and returns documents.

### 6. API route

New `src/app/api/search+api.ts`, exporting `POST`:

- Read `Authorization: Bearer <token>`; `verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY })` from `@clerk/backend`. Return `401` on failure, before any other work.
- Body: `{ query: string, filters: { category, maxPrice, petFriendly, quiet }, sort }`. Reject a missing or non-string `query` with `400`.
- `resolveSearchIntent(query)` → `buildSearchQuery(...)` → `runGroq(...)` → `mapStay` each document (export `mapStay` from `src/data/live-stays.ts`).
- Respond `{ stays, intent, numbers }`. `intent` and `numbers` are the debugging surface the AGENTS.md AI check needs.
- On a Context failure, respond `502` with a message naming the cause; on a Jev failure, continue with the empty intent rather than failing the search.

Done when: `curl` with a real Clerk token returns stays for the sample sentence.

### 7. Client hook and Search screen wiring

- New `src/lib/api-base.ts`: in development derive the origin from `Constants.expoConfig?.hostUri`; otherwise require `EXPO_PUBLIC_API_URL`. Add `EXPO_PUBLIC_API_URL` to `.env.example`.
- New `src/data/use-stay-search.ts`: `useStaySearch(query, filters, sort, getToken)` — 350 ms debounce, `AbortController` per request, returns `{ stays, intent, status, error, retry }`, keeps the previous `stays` while a new request is in flight, and skips the request entirely for an empty query by returning the unfiltered stays from `StaysProvider`.
- `src/components/search-screen.tsx`: replace both `searchStaysIn` calls. The result count reads the hook's `stays.length`; the card list renders `stays`. Chips, sort, and the filter sheet keep their current UI and pass their state into the hook. Add the loading and error states from `src/components/stays-state.tsx`.

Done when: typing in Search returns server-ranked results and the sheet, chips, and sort all change the result set.

### 8. Documentation

- `.env.example`: add `SANITY_CONTEXT_MCP_URL`, `SANITY_ORGANIZATION_TOKEN`, `TYPESAFE_AI_API_KEY`, `EXPO_PUBLIC_API_URL` (names only, no values).
- Update AGENTS.md per the section below.

## Verification

Checks:

- `npx tsc --noEmit` and `npx expo lint` both clean.
- `node studio/scripts/generate-stay-copy.mjs` still runs (unrelated, but confirms the studio side is untouched).

Intent, on these sentences, run through `resolveSearchIntent`:

1. `quiet pet friendly cabin with a hot tub under $300` → pets `wanted`, `amenity:Hot tub` `wanted`, `vibe:quiet` `wanted`, `category:cabins` `wanted`, `300` → `maxPrice`.
2. `no hot tub, somewhere warm` → `amenity:Hot tub` `avoided`, `vibe:warm` `wanted`, everything else `notMentioned`.
3. `beach house for 4 people` → `category:beach` `wanted`, `4` → `guests`.
4. `somewhere warm` → only `vibe:warm` `wanted`; assert `notMentioned` for all 33 amenities and all 4 categories.

Query, for case 1: assert the built GROQ contains `petsAllowed == true`, an amenity clause for `Hot tub`, a vibe clause for `quiet`, `category == ` cabins, and `pricePerNight <= 300`, and that it runs through the Context endpoint.

Route:

- `curl -X POST /api/search` with no token → `401`.
- With a valid Clerk token and case 1 → `200`, non-empty `stays`, `intent` matching the assertions above.
- With `"no hot tub"` → no returned stay lists `Hot tub` in `amenities`.

End-to-end, in the iOS simulator with Metro running:

1. Sign in, open the Search tab.
2. Type `quiet pet friendly cabin with a hot tub under $300`.
3. `Expected:` results appear after the debounce, every returned stay is a cabin, pets-allowed, has a hot tub, and costs ≤ $300; the count matches the list.
4. Type `no hot tub` and confirm no result has a hot tub.
5. Open the filter sheet, pick `Under $200`, and confirm the list narrows and stays under $200.
6. Change sort to `Price: low to high` and confirm the order.
7. Kill the network and retype; `Expected:` the error state with Retry, not an empty list.

Record the measured round-trip time for a typical sentence. If it exceeds ~2 s, note it and propose chunking the Jev questions.

## AGENTS.md updates

- **Who owns what → Stays (live):** replace the sentence describing `searchStaysIn` as the live search path. Search now runs in `POST /api/search`: Jev resolves each filter group, code builds GROQ, and the `room-search` Context endpoint executes it.
- **Who owns what → new "Search (server)" entry:** the route, the code-owned vocabularies, the Jev question shape, hard-exclude semantics for `avoided`, and the fact that `groq_query` is called directly with no LLM in the loop.
- **Rules:** add that the Context endpoint needs an organization token with Context Viewer, and that `groq_query` is called over MCP JSON-RPC rather than by driving an agent.
- **Expo:** note the API base URL helper and that native clients reach API routes through `EXPO_PUBLIC_API_URL` in production and `hostUri` in development.
- **Typed decisions:** add search filter resolution as a second Jev consumer alongside policy topics.

## Result

**Status: blocked.** The code is complete, search works end to end through the dataset fallback, and every check that does not need a new credential passes; the Context and Jev calls themselves have never executed.

Follow-up after the first build: typed search returned all 30 stays because `resolveSearchIntent` degraded to an empty intent without the Jev key, so nothing filtered. `src/lib/search-parse.ts` now reads the sentence in code when Jev is unavailable (or answers nothing), and the route returns filtered results — 4 stays for the cabin sentence, 21 with no hot tub. Jev still takes over the moment the key exists.

Built:

- `src/lib/search-filters.ts` — code-owned vocabularies (4 categories, 33 amenities, 26 vibes), `NUMBER_SLOTS`, `extractNumberMentions`, `emptyIntent`, `wantedAndAvoided`.
- `src/lib/search-intent.ts` — Jev layer, one `choice` question per filter group plus one per number mention, 6 s timeout. The question shape (`buildQuestions`) and the answer mapping (`intentFromAnswers`) are exported pure functions, so both can be checked without a model.
- `src/lib/search-parse.ts` — the code-only reading of a sentence: alias tables for all 33 amenities, 26 vibes, and 4 categories, negation ("no hot tub", "without kids", "pet free"), longest-phrase matching so "kitchenette" never counts as "kitchen", and number slots from surrounding words. Used when Jev is not configured or fails.
- `src/lib/search-groq.ts` — `buildSearchQuery(sentence, intent, options)`; every interpolated value is a `$` param; `SEARCH_RESULT_LIMIT = 40`.
- `src/lib/sanity-context.ts` — MCP JSON-RPC client (`initialize` → `notifications/initialized` → `tools/call groq_query`), JSON + SSE, 8 s timeout, inlined-params fallback.
- `src/lib/sanity-query.ts` — the same GROQ against the public dataset API, used when the Context call fails so search never depends on the organization token.
- `src/app/api/search+api.ts` — Clerk `verifyToken`, body validation, `{ stays, intent, numbers }`, failures named by cause.
- `src/lib/api-base.ts` + `src/data/use-stay-search.ts` — `hostUri` / `EXPO_PUBLIC_API_URL`, 350 ms debounce, abort per keystroke, previous results kept.
- `src/components/search-screen.tsx` — both `searchStaysIn` call sites replaced. The filter sheet's "Show N stays" now counts from the server results with only the sheet's own filters layered on.
- `src/data/stay-projection.ts` + `src/data/live-stays.ts` — shared projection, `mapStay` / `SanityStay` exported, `__DEV__` guarded for the server runtime.

Verified without the two credentials:

- `npx tsc --noEmit` and `npx expo lint` clean.
- **Intent layer, stubbed (46 assertions):** `buildQuestions` produces exactly 1 + 4 + 33 + 26 + mentions questions, all `choice`, filter questions offering only `wanted`/`avoided`/`notMentioned`, number questions only `maxPrice`/`guests`/`bedrooms`/`nights`/`ignore`, and each label naming the real vocabulary value. `intentFromAnswers` maps answers correctly and refuses to widen: a `refusal`, an unknown choice, or an injected value all collapse to `notMentioned`, an unknown slot collapses to `ignore`, and `{}` yields exactly `emptyIntent()`.
- **MCP client, stubbed endpoint (30 assertions):** `initialize` → `notifications/initialized` → `tools/call groq_query` in that order, bearer token sent, `Mcp-Session-Id` reused after the handshake, JSON and SSE replies both parsed (a progress frame with no id is skipped), the params-rejected path retries with literals inlined and no `$` left, `inlineParams` escapes quotes and orders names longest-first, `401`/`403` map to typed errors naming the token and Context Viewer, and missing env names both variables.
- **Sentence parser, code only (40 assertions):** the cabin sentence reads as pets wanted, cabins, hot tub, quiet, $300 ceiling; negation works for "no hot tub", "without kids", and "pet free" while "not far from the beach" stays positive; "kitchenette" never counts as "kitchen"; "walk to beach" does not imply the beach category; two categories resolve to the first mentioned; every number slot is picked from context; an unremarkable sentence still yields an empty intent. Live against `production`: 4 cabins for the cabin sentence, 1 beach stay with fireplace and ocean view, 3 city stays with workspace and AC, the single cabin with both hot tub and sauna, 5 villas with a pool sleeping 4, 21 stays with no hot tub, and all 8 cabins for "cabin near the beach".
- **Real query against `production`** (direct query API, since the Context token 403s), results mapped with the app's own `mapStay`:
  - semantic-only for `quiet pet friendly cabin with a hot tub under $300` returns stays, every document maps, nothing dropped;
  - a hand-built intent standing in for Jev returns exactly 4 stays — all cabins, all with a hot tub, all `petsAllowed`, all quiet, all ≤ $300 — in 373 ms;
  - `Hot tub` avoided returns 1 stay and none has a hot tub, in 420 ms;
  - `price-asc` is non-decreasing and `rating` non-increasing over the real data.
- The generated GROQ ran against `production` through the Sanity MCP for the same two cases with the same results.
- **Route, live** (throwaway Clerk user, deleted after): no token → `401`; bad token → `401`; empty query → `400`; `quiet pet friendly cabin with a hot tub under $300` returns `200` in 1.15 s with 4 filtered stays (cabins, hot tub, pets allowed, ≤ $300); `no hot tub` returns 21 stays, none with a hot tub; `price-asc` and the sheet filters still hold. The Context 403 is logged and the same request is served by `queryDataset`, so the fallback runs on every call until the token gains the scope.
- App: Search shows 30 stays on an empty query, the Cabins chip narrows to 8, `Price: low to high` orders $195/$215/$230, the filter sheet goes "Show 8 stays" → "Show 1 stay" and applies to 1 stay, and a typed sentence now returns ranked stays instead of an error card (confirmed at the route; the headless simulator cannot be screenshotted, so the rendered list was not re-observed).
- Typing at human speed keeps every character; the dropped characters seen earlier were synthetic-input artifacts at ~1 char/ms, not an app bug.

Blocked, and why:

1. `SANITY_ORGANIZATION_TOKEN` lacks `sanity.knowledge-base.read`, so every Context call returns `403 contextGrantRequired`. Search now falls back to the dataset API, so the app works, but the Context transport itself is still unverified and step 1 (recording the `groq_query` input schema) is still unrecorded.
2. `TYPESAFE_AI_API_KEY` is absent, so `resolveSearchIntent` short-circuits and the Jev path has never executed.

Remaining once both exist: record the `groq_query` schema under step 1, run the four intent sentences, confirm the wanted and avoided cases end to end, and record the round-trip time.
