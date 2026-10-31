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
~~~

## Expo

- Expo ships breaking changes every SDK release, so don't trust memory. Before touching an Expo, EAS, or React Native API, check the `expo` major version in `package.json` and read `https://docs.expo.dev/versions/v<major>.0.0/`. For anything else, start from https://docs.expo.dev/llms.txt and follow its links.
- Routes live in `src/app/`: every file is a screen and `_layout.tsx` files define navigators. API routes are `src/app/api/*+api.ts`. Keep components, hooks, and utils outside `src/app/`.
- Route groups: `/` is public onboarding, `(auth)` holds sign-in, sign-up, and verify, and `(app)` holds protected screens (`/home`). Layout guards check `isLoaded` before `isSignedIn`: `(app)` redirects signed-out guests to `/`, `(auth)` redirects signed-in guests to `/home`. The root layout holds the splash screen until fonts and Clerk's session restore are both ready, so no screen renders while Clerk is loading.
- `ios/` and `android/` are generated. Never create or edit them by hand; configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, switch to a development build (`npx expo run:ios`).
- Styling uses NativeWind 4.2.7 with Tailwind CSS 3: use `className`, not `StyleSheet`, for component styles. `global.css` at the root is the Tailwind entry and is imported once in `src/app/_layout.tsx`; `tailwind.config.js` `content` must cover `src/`. Keep the NativeWind preset in `babel.config.js` and `withNativeWind` in `metro.config.js`.
- Don't use `animate-*` classes on native: NativeWind 4.2.7 leaves infinite animations running after unmount. Use Reanimated hooks with `useSharedValue` instead.
- `(app)` uses `NativeTabs` from `expo-router/native-tabs`: Home, Search, Trips, Profile, with the brand yellow selected tint. iOS 26 draws the system liquid-glass bar natively, so the mock's floating yellow pill is not reproduced. `GlassTabBar` stays a catalog-only preview. `LiquidGlassTabBar` (`src/components/liquid-glass-tab-bar.tsx`) is a standalone component with Reanimated drag effects (stretch, liquid float, reflections, elastic snap-back, shadow response) where `expo-glass-effect` Liquid Glass is available; it is not overlaid on `NativeTabs` because the two bars would conflict. Sign-out lives on Profile; the Home avatar opens Profile.
- Home and Search read `src/data/stays.ts` (12 local stays, remote Unsplash placeholders). Home shows all stays by default (All Stays selected); category chips filter the Home cards in place. Home submits a query to the Search tab as `q` plus a `t` nonce. Cards are display-only until a detail route exists. Search matches `prompts/assets/search.png`: back to Home, a 48-high pill field with a sliders icon, the quick chips Cabins / Under $300 / Pet Friendly / Quiet, a live result count with sort, and horizontal `SearchStayCard` rows. Search filters live as the guest types; the sliders icon opens a filter sheet, the sort control opens a sort sheet, and hearts are session-local through `src/lib/saved-stays.ts`. The native tab bar is unchanged.
- Native tab screens are not consistently auto-inset: Home gets a native top inset itself and needs `paddingTop: 8`, while Search, Trips, and Profile add `insets.top + 8`. Bottom padding is `insets.bottom + 24` everywhere; do not restore the old 100 dp bar allowance.
- Single-line `TextInput`s omit `lineHeight`: iOS wraps a long value onto a second line when a line height is set, even with `multiline={false}`. Long queries truncate with an ellipsis instead. Home's pill input stretches to the full 64 dp height (`self-stretch` plus `textAlignVertical: "center"`) so the whole pill is tappable, and its ScrollView leaves `keyboardDismissMode` unset so typing isn't interrupted.

## Design system

- Tokens live in `src/theme/tokens.json`; `tailwind.config.js` and `src/theme/theme.ts` both read them. Style with semantic classes (`bg-canvas`, `text-foreground`, `rounded-card`, `shadow-card`), never hex values or raw `fontSize`.
- Use `AppText` for all text and `Icon` for Lucide icons. Plus Jakarta Sans weights are separate families (`font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`); `font-sans-extrabold` still resolves to Bold because there is no ExtraBold file. Never use `fontWeight`. Fonts load at runtime through `useFonts`, so Expo Go renders them.
- Primitives live in `src/components/ui/`, domain cards in `src/components/`. `/catalog` is the living preview; update it when adding a primitive. The brand tagline uses `taglineCompact` below 480 dp so its two-line phrase break survives on phones.
- `Chip size="sm"` is the compact search chip: 30 high, 13 horizontal padding, 13/18 semibold `badge` text. The default `md` chip stays 44 high with `label`. `SearchStayCard` is the search result row: 144×156 photo, `cardTitleCompact` title, 44 heart, 24-high amenity pills, and no card surface or shadow. `typography.cardTitleCompact` (17/22 Bold) is also the result count.
- NativeWind resolves rem at 14, so numeric Tailwind spacing is not on the 4-pt grid. The numeric keys in `tokens.spacing` (6, 9, 10, 11, 12, 13, 36, 38, 39, plus `row` = 18) pin the sizes the search screen needs.
- Light/dark is semantic. Use classes for styling and `useThemeColors()` for non-class props (icons, `placeholderTextColor`, spinners, native header options), never hardcoded white or black.
- `room`'s wordmark is a typeset placeholder in Plus Jakarta Sans Bold until a brand SVG is supplied. Google and Apple marks are SVG components in `src/components/ui/brand-icons.tsx`.
- Text over photos uses the `on-image` tone, never `text-card`, because card colors flip in dark mode. The card scrim is a `palette.imageScrim` gradient applied inline, so Tailwind never parses its `rgba()` value.

## Who owns what

Each tool has one job. Ask before moving a responsibility to a different tool.

- **Auth:** Clerk is the source of truth. The app keeps its own custom auth screens: full name + email + password sign-up, 6-digit `email_code` verification at sign-up, and email + password sign-in, sharing `/(auth)/verify?email=…&mode=sign-up|trust`. A new-device password sign-in that needs trust reuses the verify screen (`mode=trust`). Sessions persist through `ClerkProvider`'s `tokenCache` (`expo-secure-store`). The development instance has passwords enabled with an 8-character minimum and first/last names enabled. Password reset is not offered. Google is the only social option, through browser SSO (`useSSO` from `@clerk/expo/experimental`); Apple is not offered. Set Clerk up through the Clerk CLI and use the Clerk MCP for current Expo patterns.
- **Content:** Sanity (properties, hosts, policies, house rules). Studio is a standalone app in `studio/`. Schema deploys and content changes go through the Sanity MCP, and generated property copy uses Agent Actions.
- **Stays (local):** `src/data/stays.ts` is the only stay source until Sanity search is wired in. Query parsing, filtering, ranking, the Search tab's quick filters, filter sheet, sort, and live query all run through `searchStays` locally; no LLM or network call is involved, and the stays are sample data. Saved hearts are session-only and are not persisted.
- **Exact constraints** (price, guests, type, amenities, pets, place): GROQ filters, with values always passed as params.
- **Soft intent** (quiet, cozy, secluded): Dataset Embeddings via `text::semanticSimilarity()` inside `score()`.
- **Policy knowledge:** a Sanity Context endpoint in Knowledge Base mode. Context endpoints are created in the Dashboard's Context app and read with an organization token (Context Viewer), per https://www.sanity.io/docs/ai/context-migration-guide. One endpoint serves one mode. The Context skill still describes `sanity.agentContext` Studio documents with a project token; that route is deprecated, so don't use it.
- **Typed decisions** (which stay topics and policies answer a question): Jev, called from API routes through the AI SDK's `experimental_evaluate` with the `@ai-sdk/typesafe-ai` provider and `TYPESAFE_AI_API_KEY`. No Vercel AI Gateway. Keep `ai` and `@ai-sdk/typesafe-ai` pinned to exact versions, since the API is experimental.
- **Answer text:** none generated. Answers show the stay's own fields and policy text word for word, with their source. No LLM runs in the app.
- **Analytics:** PostHog, identified through Clerk.

## Rules

- Secret keys (Clerk secret key, TypeSafe key, Sanity organization token, Sanity write token) never reach the app bundle. Use them only in API routes and local scripts such as seeding. Never put them behind `EXPO_PUBLIC_`, which is bundled into the app. Never commit `.env`. Keep variable names, without values, in `.env.example`.
- Sanity Context needs a deployed Studio for the dataset. Redeploy Studio from `studio/` after schema changes.
- Jev is not an agent. It answers typed questions (Choice, Noul, Score) with probabilities. It never writes GROQ, calls tools, or generates text. Code builds queries from its answers.
- Prices, guest counts, and dates are parsed in code. Jev may choose between candidates code found, but never produces the value.
- Embeddings rank, they don't filter, and they only see the document itself (no references). Hard constraints are always GROQ filters, and text that should affect ranking lives on the property document.
- Policy answers show only text from the stay's data and Room's policies, word for word. If nothing answers the question, say so and point to support.
- API routes verify the Clerk session before doing any work.
- Auth screens and guards never render while Clerk is loading; they return `null` until `isLoaded` is true.
- PostHog failures never block the app. Never send what guests type, tokens, or personal data in events.
- Let Sanity generate document IDs. Model relationships as references.
- Ask before adding a dependency or service, changing the Sanity schema once content exists, or deleting data. Prefer Expo modules over third-party libraries.
- Whenever you need input from the user, ask through your tool's built-in question panel so they pick from options instead of typing. Give two to four clear options with the recommended one first. Fall back to plain text only if no such panel exists.

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