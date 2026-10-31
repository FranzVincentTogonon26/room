# Room

Expo React Native rental app. Guests describe a stay in one sentence ("quiet pet friendly cabin with a hot tub under $300 a night") and get ranked stays back. They can also ask booking and policy questions about a stay, answered with exact text from Room's own content.

This file is the project's memory: it holds every decision that is still true. Plans in `prompts/` are history.

## Commands

~~~bash
npx expo install <package>  # ALWAYS use instead of npm install: resolves SDK-compatible versions
npx expo start              # dev server (press i for the iOS simulator)
npx expo lint               # lint
npx tsc --noEmit            # type check
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
npx eas-cli@latest <cmd>    # EAS builds, submits, and updates (use instead of bare `eas`)
node studio/scripts/generate-stay-copy.mjs          # regenerate + fact-check all stay copy
node studio/scripts/generate-stay-copy.mjs --merge  # copy the validated artifact into the seed
~~~

## Expo

- Expo ships breaking changes every SDK release, so don't trust memory. Before touching an Expo, EAS, or React Native API, check the `expo` major version in `package.json` and read `https://docs.expo.dev/versions/v<major>.0.0/`. For anything else, start from https://docs.expo.dev/llms.txt and follow its links.
- Routes live in `src/app/`: every file is a screen and `_layout.tsx` files define navigators. API routes are `src/app/api/*+api.ts`. Keep components, hooks, and utils outside `src/app/`.
- Route groups: `/` is public onboarding, `(auth)` holds sign-in, sign-up, and verify, and `(app)` is an auth-guarded Stack with `StaysProvider`. The Stack's `(tabs)` group holds NativeTabs (Home, Search, Trips, Profile) + `LiquidGlassTabBar`; sibling `stay/[id]` pushes above the tabs with no tab bar (use `room://stay/<id>` to deep link). Layout guards check `isLoaded` before `isSignedIn`: `(app)` redirects signed-out guests to `/`, `(auth)` redirects signed-in guests to `/home`. The root layout holds the splash screen until fonts and Clerk's session restore are both ready, so no screen renders while Clerk is loading.
- `ios/` and `android/` are generated. Never create or edit them by hand; configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, switch to a development build (`npx expo run:ios`).
- Styling uses NativeWind 4.2.7 with Tailwind CSS 3: use `className`, not `StyleSheet`, for component styles. `global.css` at the root is the Tailwind entry and is imported once in `src/app/_layout.tsx`; `tailwind.config.js` `content` must cover `src/`. Keep the NativeWind preset in `babel.config.js` and `withNativeWind` in `metro.config.js`.
- Don't use `animate-*` classes on native: NativeWind 4.2.7 leaves infinite animations running after unmount. Use Reanimated hooks with `useSharedValue` instead.
- `(app)/(tabs)` uses `NativeTabs` from `expo-router/native-tabs`: Home, Search, Trips, Profile, with the brand yellow selected tint. iOS 26 draws the system liquid-glass bar natively, so the mock's floating yellow pill is not reproduced. `GlassTabBar` stays a catalog-only preview. `LiquidGlassTabBar` (`src/components/liquid-glass-tab-bar.tsx`) is a standalone component with Reanimated drag effects (stretch, liquid float, reflections, elastic snap-back, shadow response) where `expo-glass-effect` Liquid Glass is available; it is not overlaid on `NativeTabs` because the two bars would conflict. Sign-out lives on Profile; the Home avatar opens Profile.
- Home, Search, Trips, and Profile read published Sanity stays through one `StaysProvider` (`src/data/stays-provider.tsx`, mounted in `(app)/_layout.tsx`): one fetch on mount, refresh when a screen regains focus, no real-time subscription, and no local fallback. Loading, error + Retry, empty, and refresh-error states come from `src/components/stays-state.tsx`. `src/data/stays.ts` keeps the `Stay` type, categories, query parsing, sorting, and the 12 local sample stays used only by `/catalog`. Home shows all stays by default (All Stays selected); category chips filter the Home cards in place. Home submits a query to the Search tab as `q` plus a `t` nonce. Home and Search cards open `/stay/[id]`. Search matches `prompts/assets/search.png`: back to Home, a 52-high back button and pill field with a sliders icon, the quick chips Cabins / Under $300 / Pet Friendly / Quiet, a live result count with sort, and `SearchStayCard` rows on soft white cards. Search filters live as the guest types; the sliders icon opens a filter sheet, the sort control opens a sort sheet, and hearts are session-local through `src/lib/saved-stays.ts`. The native tab bar is unchanged.
- Stay detail (`/stay/[id]`): full-bleed hero pager (cover + up to 23 gallery images, `current / total` counter), title (32/34 Bold), location, 4 amenity highlights with icons, lavender policy cards (all 7 policies listed word for word, house rules included), host row (photo, name, Superhost badge), and fixed price bar (nightly + sample 3-night total, 64-high "Book this stay" button). Policy and host cards open modal sheets. Heart toggles session-only saved state. Share shares the deep link. "Book this stay" shows a coming-soon alert. No tab bar is rendered on detail (the Stack hides tabs). Back button returns to Home or the calling screen.
- Native tab screens are not consistently auto-inset: Home gets a native top inset itself and needs `paddingTop: 8`, while Search, Trips, and Profile add `insets.top + 8`. Bottom padding is `insets.bottom + 24` everywhere; do not restore the old 100 dp bar allowance.
- Single-line `TextInput`s omit `lineHeight`: iOS wraps a long value onto a second line when a line height is set, even with `multiline={false}`. Long queries truncate with an ellipsis instead. Home's pill input stretches to the full 64 dp height (`self-stretch` plus `textAlignVertical: "center"`) so the whole pill is tappable, and its ScrollView leaves `keyboardDismissMode` unset so typing isn't interrupted.

## Design system

- Tokens live in `src/theme/tokens.json`; `tailwind.config.js` and `src/theme/theme.ts` both read them. Style with semantic classes (`bg-canvas`, `text-foreground`, `rounded-card`, `shadow-card`), never hex values or raw `fontSize`.
- Use `AppText` for all text and `Icon` for Lucide icons. Plus Jakarta Sans weights are separate families (`font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`); `font-sans-extrabold` still resolves to Bold because there is no ExtraBold file. Never use `fontWeight`. Fonts load at runtime through `useFonts`, so Expo Go renders them.
- Primitives live in `src/components/ui/`, domain cards in `src/components/`. `/catalog` is the living preview; update it when adding a primitive. The brand tagline uses `taglineCompact` below 480 dp so its two-line phrase break survives on phones.
- `Chip size="sm"` is the compact search chip: 36 high (`h-9`), 12 horizontal padding (`px-3`), 15/20 semibold `label` text. The default `md` chip stays 44 high with `label`. `SearchStayCard` is the search result row: a white `rounded-field bg-card shadow-card` card with a 4 dp inset, a 144×152 photo, `searchCardTitle` 18/22 Bold title, a 44 heart floating at the content's top-right, 26-high amenity pills with 14 icons and 8 between pills, `searchPrice` 22/28 Bold price, and 8 between rows. `typography.cardTitleCompact` (17/22 Bold) is also the result count. Typography: `propertyTitle` 32/34 Bold for stay titles, `bodyLarge` 18/24 for location, `bodyCompact` 15/20 for subtitles, `detailButton` 18/22 Bold for the CTA. `Button size="lg"` is 64 pt tall with optional `labelVariant`. Icons `messageCircleMore` (policies), `award` (Superhost), `trees` (Forest Views) added to Lucide set. Sheet corner radius `rounded-t-sheet` is 12 pt (not 20), distinct from card 20 pt. New spacing: `control-lg` 60 pt, `action-lg` 64 pt, `avatar-lg` 64 pt. `superhost` color light #A1786C / dark #C9A79B.
- NativeWind resolves rem at 14, so numeric Tailwind spacing is not on the 4-pt grid. The numeric keys in `tokens.spacing` (6, 9, 10, 11, 12, 13, 36, 38, 39, plus `row` = 18) pin the sizes the search screen needs.
- Light/dark is semantic. Use classes for styling and `useThemeColors()` for non-class props (icons, `placeholderTextColor`, spinners, native header options), never hardcoded white or black.
- `room`'s wordmark is a typeset placeholder in Plus Jakarta Sans Bold until a brand SVG is supplied. Google and Apple marks are SVG components in `src/components/ui/brand-icons.tsx`.
- Text over photos uses the `on-image` tone, never `text-card`, because card colors flip in dark mode. The card scrim is a `palette.imageScrim` gradient applied inline, so Tailwind never parses its `rgba()` value.

## Who owns what

Each tool has one job. Ask before moving a responsibility to a different tool.

- **Auth:** Clerk is the source of truth. The app keeps its own custom auth screens: full name + email + password sign-up, 6-digit `email_code` verification at sign-up, and email + password sign-in, sharing `/(auth)/verify?email=…&mode=sign-up|trust`. A new-device password sign-in that needs trust reuses the verify screen (`mode=trust`). Sessions persist through `ClerkProvider`'s `tokenCache` (`expo-secure-store`). The development instance has passwords enabled with an 8-character minimum and first/last names enabled. Password reset is not offered. Google is the only social option, through browser SSO (`useSSO` from `@clerk/expo/experimental`); Apple is not offered. Set Clerk up through the Clerk CLI and use the Clerk MCP for current Expo patterns.
- **Content:** Sanity (stays, hosts, policies). Studio is a standalone app in `studio/`; schema files live in `studio/schemaTypes/` and deploy with `npx sanity@latest schema deploy` from `studio/`. The Sanity MCP refuses `deploy_schema` when a local Studio exists, so schema changes go through the local Studio, not the MCP. Content seeding and content changes go through the Sanity MCP. Stay copy is generated by Agent Actions from each stay's typed facts plus its seed source copy, checked by `studio/scripts/generate-stay-copy.mjs` before any write, published through the Sanity MCP, and merged back into `studio/seed/seed-data.json`; copy is never generated in the app. The model is `stay` → `host` + `policies`; `stay` holds the typed filter fields and all descriptive text for embeddings, while `host` and `policy` are shared documents. Reviews are aggregate (`rating`, `reviewCount`). Seeded documents carry a read-only `seedKey`; re-running the seed skips existing keys and never duplicates.
- **Stay photos:** Sanity image assets with required alt text: `coverPhoto` plus `gallery` (max 23). Seed 3 per stay. Detail hero pages through all via `galleryFor(stay)`, shows a `current / total` counter, and renders a 0.855:1 aspect ratio pager (width × 0.855 + 20 pt sheet overlap).
- **Stays (live):** All screens read published `stay` documents from the public `production` dataset using `EXPO_PUBLIC_SANITY_PROJECT_ID` and `EXPO_PUBLIC_SANITY_DATASET` with plain `fetch` (12-second timeout, no read token, no `@sanity/client`). `src/data/live-stays.ts` extends the query to include `host` (photo, name, bio, superhost flag, response time, joined year, languages) and `gallery` (up to 23 images); it maps onto the app's `Stay` type. `searchStaysIn` does query parsing, filtering, ranking, the quick filters, filter sheet, sort, and live query in code. Saved hearts are session-only and are not persisted.
- **Exact constraints** (price, guests, type, amenities, pets, place): GROQ filters, with values always passed as params.
- **Soft intent** (quiet, cozy, secluded): Dataset Embeddings via `text::semanticSimilarity()` inside `score()`. Embeddings are enabled on `production` with a stay-only projection (title, the six copy fields, category, city/region, amenities); Search ranking does not use them yet.
- **Policy knowledge & detail sheets:** Stay detail reads the stay's own 7 policies from Sanity and lists them word for word (all text, no LLM generation) in a modal sheet opened by "Ask about policies" or the cancellation card. House rules are included as one of the 7 policies (no separate card). Cancellation policy is pinned below the ask-policies card. For Q&A API endpoints (outside detail): Sanity Context endpoint in Knowledge Base mode, created in the Dashboard's Context app and read with an organization token (Context Viewer), per https://www.sanity.io/docs/ai/context-migration-guide. One endpoint serves one mode.
- **Typed decisions** (which stay topics and policies answer a question): Jev, called from API routes through the AI SDK's `experimental_evaluate` with the `@ai-sdk/typesafe-ai` provider and `TYPESAFE_AI_API_KEY`. No Vercel AI Gateway. Keep `ai` and `@ai-sdk/typesafe-ai` pinned to exact versions, since the API is experimental.
- **Answer text:** none generated. Answers show the stay's own fields and policy text word for word, with their source. No LLM runs in the app.
- **Analytics:** PostHog, identified through Clerk.

## Rules

- Secret keys (Clerk secret key, TypeSafe key, Sanity organization token, Sanity write token) never reach the app bundle. Use them only in API routes and local scripts such as seeding. Never put them behind `EXPO_PUBLIC_`, which is bundled into the app. Never commit `.env`. Keep variable names, without values, in `.env.example`. The Sanity project ID and dataset are public, so they use `EXPO_PUBLIC_`; CORS origin `http://localhost:8081` is allowed with credentials disabled for Expo web.
- Sanity Context needs a deployed Studio for the dataset. Redeploy Studio from `studio/` after schema changes.
- Jev is not an agent. It answers typed questions (Choice, Noul, Score) with probabilities. It never writes GROQ, calls tools, or generates text. Code builds queries from its answers.
- Prices, guest counts, and dates are parsed in code. Jev may choose between candidates code found, but never produces the value.
- Embeddings rank, they don't filter, and they only see the document itself (no references). Hard constraints are always GROQ filters, and text that should affect ranking lives on the property document.
- Policy answers show only text from the stay's data and Room's policies, word for word. If nothing answers the question, say so and point to support.
- API routes verify the Clerk session before doing any work.
- Auth screens and guards never render while Clerk is loading; they return `null` until `isLoaded` is true.
- PostHog failures never block the app. Never send what guests type, tokens, or personal data in events.
- Let Sanity generate document IDs. Model relationships as references.
- Seed data lives in `studio/seed/seed-data.json`. Seeding is create-only: query by `seedKey` first, skip existing documents, and never overwrite editor changes. Use Sanity-generated `_id`s; `seedKey` is the stable identity, not a document ID.
- Ask before adding a dependency or service, changing the Sanity schema once content exists, or deleting data. Prefer Expo modules over third-party libraries.
- Whenever you need input from the user, ask through your tool's built-in question panel so they pick from options instead of typing. Give two to four clear options with the recommended one first. Fall back to plain text only if no such panel exists.
- Stay detail uses React Native `Modal` for policy and host sheets (no new dependency). All modals use `animationType="slide"` and a semi-transparent overlay. Sheets dismiss on back or close button.

## How we build features

For a new feature or a change across several files. Small fixes and questions skip this.

1. **Understand.** Read the code involved. Open an earlier plan only if this feature builds directly on it (pick by file name). Read the current docs pages for the APIs you'll use, and load a matching skill if one exists (e.g. the Expo, Clerk, Sanity, Sanity Context, or TypeSafe skills). Don't write version-specific APIs from memory.
2. **Ask.** If a real decision is unclear (scope, visible behavior, data shape), ask in the question panel, batching questions into one round and following up only if the answers raise new ones. Pick defaults for the rest and list them. If a decision in this file looks wrong, raise it instead of changing it.
3. **Plan.** Copy `prompts/TEMPLATE.md` to `prompts/NN-feature-name.md` (next number) and fill it in. The plan must be self-contained, so a fresh session can build it from this file plus the plan alone.
4. **IMPORTANT: stop and wait.** Write no app code until the user approves the plan. Ask for approval in the question panel (approve, or request changes). If they request changes, update the plan and ask again. On approval, set `Status: approved`.
5. **Build** step by step, checking each one. If a step turns out wrong, stop and explain instead of redesigning.
6. **Close out.**
   - Run the plan's Verification and give the report described under Reporting.
   - Add a short `## Result` to the plan and set `Status: done`.
   - Update this file: put each lasting decision in the section it belongs to. Replace or remove rules that are no longer true instead of appending. Keep this file under 150 lines.

## Building from designs

Designs are attached in the chat. Screens must match them exactly: layout, spacing, sizes, colors, type, radii, icons, and copy.

- Icons, fonts, and brand images come from `assets/` or the chosen icon library, never recreated from a screenshot. Sample property photos may be remote placeholder images. If an asset is missing, use a marked placeholder and list it.
- Map every color, font, spacing value, and radius to a design-system token. List values with no token in the plan as proposed new tokens instead of hardcoding them. When creating the design system itself, derive the tokens from the designs.
- UI plans describe the design (elements, states, tokens, assets) well enough to build without the image. If building in a new session, ask for the design to be attached again.
- After building, open the screen in the iOS simulator (deep link with `xcrun simctl openurl booted <url>` when it isn't the first screen; the scheme is in `app.json`), take a screenshot (`xcrun simctl io booted screenshot <path>`), and compare it with the design. List every difference, fix, and repeat. Report which values were estimated from an image.

## Reporting

End every piece of work that changes code (features and fixes, not answers to questions) with this report. Use these headings in this order, and leave out any section that would be empty.

- **Done:** one line on the outcome, then the files changed and what changed in each.
- **Verified:** each check with ✅ or ❌ and its evidence (command output, screenshot). List what wasn't checked as ❌ with the reason. Never mark something ✅ without running it.
- **You need to:** numbered actions only the user can take, such as keys, dashboard settings, manual steps in Sanity, or assets to provide.
- **Test it yourself:** numbered steps to reproduce the result from a fresh start, ending with `Expected:` and what the user should see.
- **Notes:** defaults picked, trade-offs, and anything left for later.

## Checks

- Lint and type check pass before any task is called done.
- Screens that load data handle loading, error, and empty states.
- AI features are tried against realistic inputs, and failures are explained by cause: missing data, the decision Jev made, the query, or the code.