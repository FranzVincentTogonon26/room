# 02 · Roam design system

Status: approved

## Goal

Room has one visual source of truth taken from `/Users/franz/Downloads/source-file/prompt-imgs/design.png`: Poppins type, the sheet's colors, a 4-pt spacing scale, radii, shadows, light/dark semantic tokens, and the shared primitives the sheet shows. A `/catalog` screen renders every token and component, in light and dark, so future screens import components instead of restyling.

## Decisions

- **Source of truth.** The sheet's labeled palette is canonical. Unlabeled tints were sampled from the PNG (channel values differ by 1–10 from the labels because of export; labels win for brand colors). Derived values are listed below as new tokens.
- **Typeface: Poppins.** Poppins is the closest match to the sheet's geometric sans: single-storey `a`/`g`, circular bowls, straight `y`. Bundle static **Regular 400, Medium 500, SemiBold 600, Bold 700, ExtraBold 800** in `assets/fonts/` with the OFL license. No `fontWeight`; each weight is a family. Loaded at runtime with `useFonts` + splash gate so Expo Go works. The `expo-font` config plugin is deferred until the project moves to a development build.
- **Icons: Lucide + react-native-svg.** The only new dependencies, approved by the icon choice. Stroke 1.8. `TreePine` = Cabins, `Waves` = Beach, `Building2` = City, `TreePalm` = Villas, matching the sheet. `react-native-svg` and `expo-glass-effect` are bundled in Expo Go, so no development build is needed for this task.
- **Scope: every section of the sheet.** Tokens + type + Button, IconButton, Input, Chip, Badge, Banner, Card, ListingCard, PolicyCard, ProfileRow group, SegmentedControl, Toggle, Stepper, Wordmark, and a presentational GlassTabBar. The tab bar is not wired to Expo Router navigation; the app has one screen.
- **Dark mode: authored pairs.** The sheet is light-only; dark values below are new and derived for contrast. Semantic tokens only. A provider applies CSS variables at runtime; `useThemeColors()` supplies JS values for props that cannot take classes (icons, `placeholderTextColor`, `ActivityIndicator`, native header options). System-following by default.
- **Token architecture.** `src/theme/tokens.json` is the single source, read by `tailwind.config.js` and TypeScript. Tailwind exposes classes (`bg-canvas`, `text-muted-foreground`, `rounded-card`, `shadow-card`); the light variables are injected into `:root` from the same JSON, and the provider swaps in the dark variables. There is no second `StyleSheet` theme.
- **Wordmark placeholder.** `roam` is typeset in Poppins ExtraBold (64/64, -3 tracking) and visibly marked as a placeholder in `/catalog`. Replace with the brand SVG when supplied.
- **Google mark placeholder.** The sheet's “Continue with Google” button uses the official four-color G, which is not in `assets/`. The catalog shows the secondary variant with a neutral `Globe` icon and a note. The button API supports a left icon so the real asset can drop in.
- **Listing photo placeholder.** Remote Unsplash images are allowed sample photos. `expo-image` is already installed.
- **Fidelity vs. accessibility.** The sheet's success/error text on mint/pink is ~3.7:1. Text uses darker `success-foreground` / `error-foreground` tokens (5:1+) while the icon circles keep the sampled colors. Everything else matches the sampled/labeled values.
- **Catalog layout.** The sheet's 15-section multi-column board is a presentation, not a product screen. `/catalog` stacks the same sections in one scroll on a phone; component sizes, colors, type, and states match the sheet. The catalog is dev-facing and linked only when `__DEV__`.
- **No animations beyond state feedback.** Toggle knob and pressed states only; no entrance animations (NativeWind `animate-*` is banned on native by AGENTS.md).

## Out of scope

- Wiring the glass tab bar into Expo Router `Tabs` and building Explore/Search/Trips/Profile screens.
- Clerk auth, Sanity content, API routes, PostHog, listing data, wishlist persistence.
- Form validation logic and error handling beyond the Input's error presentation.
- App icon, splash artwork, real `roam` wordmark, official Google mark, real property photography.
- Persisting a user theme preference (system + catalog-only manual preview).
- Android visual verification and web font polish (best-effort; report what was checked).
- Replacing the welcome screen with the real home screen.

## Design tokens

### Brand palette (from the sheet)

| Token | Value | Use |
|---|---|---|
| Primary Yellow | `#FFC629` | Primary actions, active states |
| Lavender | `#C9B4FF` | Secondary actions, highlights |
| Text Primary | `#0B0B1A` | Headings, primary text |
| Text Secondary | `#6B7280` | Body copy, secondary text |
| Surface White | `#FFFFFF` | Cards, sheets, modals |
| Surface Gray | `#F4F5F7` | App background, inputs, muted surfaces |
| Border Gray | `#E5E7EB` | Dividers, borders |
| Glass Blur | `rgba(255,255,255,0.7)` | Tab bar, glass surfaces |

### Semantic colors

| Token (class) | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#F4F5F7` | `#0A0A0F` | Screen background |
| `card` | `#FFFFFF` | `#14141A` | Cards, inputs on tinted surfaces |
| `muted` | `#F4F5F7` | `#1E1E26` | Inputs, chips, segmented track |
| `border` | `#E5E7EB` | `#2C2C36` | Borders, dividers |
| `foreground` | `#0B0B1A` | `#F5F5F7` | Primary text/icons |
| `muted-foreground` | `#6B7280` | `#A1A1AA` | Secondary text |
| `subtle-foreground` | `#8990AB` | `#7E8296` | Tagline, large low-emphasis text |
| `placeholder` | `#8F97B1` | `#8B90A3` | Input placeholders |
| `primary` | `#FFC629` | `#FFC629` | Yellow actions/toggle |
| `primary-foreground` | `#0B0B1A` | `#0B0B1A` | Text on yellow |
| `lavender` | `#C9B4FF` | `#C9B4FF` | Selected lavender chips |
| `lavender-foreground` | `#0B0B1A` | `#0B0B1A` | Text on lavender |
| `lavender-surface` | `#EEEDFE` | `#221E36` | Policy cards |
| `lavender-strong` | `#E4DFFE` | `#2D2746` | Policy icon tile |
| `focus` | `#F2F2FE` | `#1C1930` | Focused input background |
| `focus-ring` | `#C9B4FF` | `#8B6CF6` | Focused input border |
| `accent` | `#3500FC` | `#A78BFA` | Policy icons, chevrons |
| `star` | `#FFB500` | `#FFC629` | Rating stars |
| `success` | `#14894E` | `#4ADE80` | Success icon circle |
| `success-foreground` | `#0B6B3A` | `#86EFAC` | Success text |
| `success-surface` | `#E0F2EA` | `#10251A` | Success banner |
| `error` | `#DF2F3F` | `#FB7185` | Error icon circle |
| `error-foreground` | `#B91C2C` | `#FDA4AF` | Error text |
| `error-surface` | `#FDE1E9` | `#2A1219` | Error banner |
| `badge-yellow` | `#FEF6DD` | `#2A2410` | Guest favorite |
| `badge-yellow-foreground` | `#0B0B1A` | `#FDE68A` | Guest favorite text |
| `badge-mint` | `#E8F8F1` | `#12251A` | New |
| `badge-mint-foreground` | `#0A6B43` | `#6EE7B7` | New text |
| `badge-pink` | `#FEE9F0` | `#2A141C` | 20% off |
| `badge-pink-foreground` | `#B4234D` | `#FDA4AF` | 20% off text |
| `badge-blue` | `#E9EFFE` | `#16213A` | Superhost |
| `badge-blue-foreground` | `#1D4ED8` | `#93C5FD` | Superhost text |
| `segment` | `#F4F5F7` | `#1E1E26` | Segmented track |
| `segment-selected` | `#1F222A` | `#F5F5F7` | Selected segment |
| `segment-selected-foreground` | `#FFFFFF` | `#0B0B1A` | Selected segment text |
| `toggle-off` | `#E5E7EB` | `#3A3A46` | Toggle track off |
| `on-success` | `#FFFFFF` | `#0B0B1A` | Check on success circle |
| `on-error` | `#FFFFFF` | `#0B0B1A` | Mark on error circle |
| `glass` | `rgba(255,255,255,0.7)` | `rgba(20,20,26,0.65)` | Glass surfaces |
| `glass-border` | `rgba(255,255,255,0.8)` | `rgba(255,255,255,0.12)` | Glass edge |

### Typography

| Variant | Family | Size / line | Tracking | Default color |
|---|---|---|---|---|
| `display` | Poppins Bold | 56 / 56 | -1.5 | foreground |
| `heading` | Poppins Bold | 30 / 36 | -0.5 | foreground |
| `title` | Poppins SemiBold | 20 / 26 | -0.2 | foreground |
| `tagline` | Poppins Regular | 30 / 40 | -0.3 | subtle-foreground |
| `taglineCompact` | Poppins Regular | 24 / 32 | -0.3 | subtle-foreground |
| `body` | Poppins Regular | 16 / 24 | 0 | foreground |
| `label` | Poppins SemiBold | 15 / 20 | 0 | foreground |
| `caption` | Poppins Medium | 14 / 20 | 0 | muted-foreground |
| `button` | Poppins Medium | 17 / 22 | 0 | foreground |
| `badge` | Poppins Medium | 13 / 18 | 0 | foreground |
| `tab` | Poppins Medium | 12 / 16 | 0 | muted-foreground |
| `price` | Poppins Bold | 20 / 26 | -0.2 | foreground |
| `wordmark` | Poppins ExtraBold | 64 / 64 | -3.0 | foreground |

### Spacing, radius, shadow, motion

- **4-pt scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Named sizes: `gutter` 20 (screen edge), `section` 24, `card` 20 (padding), `control` 48 (button/input height), `chip` 44, `tabbar` 76. Internal gaps use the numeric scale (`gap-2` = 8, `gap-3` = 12, `gap-4` = 16).
- **Radii:** `tile` 14 (policy tile, listing image, banner), `card` 20, `field` 24 (inputs, segmented track, stepper), `pill` 9999 (buttons, chips, badges, tab bar). 1px borders; `StyleSheet.hairlineWidth` only for profile-row separators.
- **Shadows:** `card` = `0 1px 2px rgba(11,11,26,0.04), 0 8px 24px rgba(11,11,26,0.04)`; `floating` = `0 8px 24px rgba(11,11,26,0.12)`; `knob` = `0 1px 3px rgba(11,11,26,0.20)`. Dark mode relies on surface contrast; shadows stay subtle.
- **Motion:** `fast` 150 ms (press, toggle), `base` 240 ms, `slow` 360 ms. Only the toggle knob uses a Reanimated timing.
- **Icons:** sizes 16/20/24/28; stroke 1.8; default color `foreground`.

## Components

| Component | Variants / sizes | States | Key specs |
|---|---|---|---|
| `AppText` | 12 type variants | — | `className` appended; `style` merged last; never accepts raw fontSize from screens |
| `Icon` | Lucide map, sizes sm/md/lg/xl | — | 1.8 stroke, theme-default color, optional fill |
| `Button` | primary, secondary; sm (40), md (48) | pressed, disabled, loading | pill, label 17 medium, optional left/right icon; spinner keeps the label for a11y |
| `IconButton` | surface, glass, ghost; sm (40), md (48), lg (56) | pressed, disabled, selected | circular; required `label`; surface is the sheet's muted fill; glass for photos |
| `Input` | default, focused, error, disabled | focus, blur, secure toggle | 48 high, field radius, muted bg; focus `bg-focus` + 2px `border-focus-ring`; error border/message; optional left/right icons; eye toggle |
| `Chip` | neutral, lavender, yellow; md (44) | pressed, selected, disabled | pill, px-5, 15 semibold, optional icon |
| `Badge` | neutral, yellow, mint, pink, blue, lavender; 32 high | — | pill, px-3, badge type, optional icon |
| `Banner` | success, error | dismiss | 14 radius, 16 x-padding, icon circle 24, 14 medium text, live region |
| `Card` | padded / unpadded | — | `bg-card`, 20 radius, 20 padding, card shadow |
| `ListingCard` | — | pressed, saved | 12 padding, 128 square image at 14 radius, glass heart, title/location/rating/amenity badges/price |
| `PolicyCard` | — | pressed | lavender surface, 48 icon tile at 14 radius, accent icon/chevron, title + 2-line description |
| `ProfileRow` / `ProfileRowGroup` | — | pressed | 56 rows, 20 icon, 15 semibold label, hairline inset separators |
| `SegmentedControl` | — | selected, pressed | 44 track, 4 padding, dark selected pill, optional icons, `tab` roles |
| `Toggle` | — | on/off, disabled | 56×32 track, 28 knob, yellow on, Reanimated 150 ms |
| `Stepper` | — | min/max disabled | 48 pill, ghost +/- buttons, centered value, accessibility labels |
| `GlassTabBar` | — | active, pressed | 76 high pill, 4 items, yellow active glow, glass on iOS 26 / translucent fallback |
| `Wordmark` | — | — | Poppins ExtraBold 64, tight tracking; placeholder marker in catalog |
| `ThemeProvider` / `useThemeColors` | light/dark | — | CSS variable swap; JS values for non-class props |

## Steps

### 1. Install the icon dependencies

```bash
npx expo install lucide-react-native react-native-svg
```

Use `npx expo install` (not npm install). `react-native-svg` resolves to the SDK 58 bundled version (15.16.0); `lucide-react-native` is 1.61.x. No dev build is needed: Expo Go bundles `react-native-svg`.

Done when `package.json` lists both, `npm ls lucide-react-native react-native-svg` is clean, and the app still bundles.

### 2. Bundle and load Poppins

Download from Google Fonts' OFL directory into `assets/fonts/`:

```
Poppins-Regular.ttf
Poppins-Medium.ttf
Poppins-SemiBold.ttf
Poppins-Bold.ttf
Poppins-ExtraBold.ttf
OFL.txt
```

Source: `https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/<file>`. Verify each file's PostScript name with `mdls -name com_apple_ats_name_postscript assets/fonts/<file>`; the filename must match.

In `src/app/_layout.tsx`, call `SplashScreen.preventAutoHideAsync()` at module scope, load the five fonts with `useFonts` keyed by PostScript name, hide the splash when loaded or errored, and return `null` until resolved. Log a font error and continue with the system fallback rather than blocking the app.

Done when the app builds, the splash hides, and a temporary `<Text style={{ fontFamily: "Poppins-Bold" }}>` renders Poppins letterforms in the simulator.

### 3. Tokens, Tailwind, and the theme provider

Create `src/theme/tokens.json` with every value in “Design tokens”: `palette`, `light`, `dark`, `fontFamily`, `typography`, `spacing`, `radius`, `shadows`, `motion`, `icon`.

Extend `tailwind.config.js`:

```js
const tokens = require("./src/theme/tokens.json");
const kebab = (key) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const cssVar = (key) => `--color-${kebab(key)}`;
const channels = (hex) => { /* #RRGGBB -> "R G B" */ };
const colorEntries = Object.keys(tokens.light).map((key) => [
  kebab(key),
  key === "glass" || key === "glassBorder"
    ? `var(${cssVar(key)})`
    : `rgb(var(${cssVar(key)}) / <alpha-value>)`,
]);
const rootVars = Object.fromEntries(
  Object.entries(tokens.light).map(([key, value]) => [
    cssVar(key),
    key === "glass" || key === "glassBorder" ? value : channels(value),
  ]),
);
```

Use `colors: Object.fromEntries(colorEntries)`, `fontFamily` (`sans`, `sans-medium`, `sans-semibold`, `sans-bold`, `sans-extrabold` mapped to the Poppins families), `spacing` (`gutter`, `section`, `card`, `control`, `chip`, `tabbar`), `borderRadius` (`tile`, `card`, `field`, `pill`, `full`), and `boxShadow` (`card`, `floating`, `knob`). Add a plugin with `addBase({ ":root": rootVars })`. Keep the NativeWind preset and `content`.

Create `src/theme/theme.ts` with the same channel helper and `lightVars` / `darkVars`, `src/theme/theme-provider.tsx` that wraps children in a `flex-1` View with `vars(lightVars | darkVars)` and the matching canvas background + `StatusBar`, `src/theme/use-theme-colors.ts` returning `light` or `dark` from NativeWind's `useColorScheme`, and `src/theme/index.ts` re-exporting the tokens/hooks.

Wrap the navigator in the provider in `_layout.tsx`. Split it into a `RootNavigator` component rendered **inside** `ThemeProvider`, so it can call `useThemeColors()` and set `Stack` `screenOptions`: `contentStyle.backgroundColor = canvas`, `headerStyle.backgroundColor = canvas`, `headerTintColor = foreground`, `headerShadowVisible: false`. The provider must render inside the font gate; `RootLayout` returns `<ThemeProvider><RootNavigator /></ThemeProvider>`.

**Risk checkpoint:** verify `bg-canvas`, `text-foreground`, and `bg-muted` resolve on native in both schemes before building components. If NativeWind 4.2.7 cannot resolve `rgb(var(--…))` on native, switch the semantic classes to static light/dark values behind the `dark:` variant (NativeWind's documented approach) while keeping the same token values and component APIs. Stop and report if neither approach works.

Done when the welcome screen shows the canvas color and foreground text, the native header matches, and toggling the simulator appearance updates both without a reload.

### 4. Text and icon primitives

Create `src/lib/cn.ts` (join truthy class names). Create `src/components/ui/text.tsx` exporting `AppText`: takes `variant` (default `body`), `className`, `style`, and TextProps; applies `typography[variant]` via `style` and the variant's default color class, then merges caller `style` last. Never call it with a raw `fontSize`.

Create `src/components/ui/icon.tsx`: explicit Lucide imports for the set used by the sheet and catalog — `house`, `search`, `heart`, `calendar-days`, `user`, `settings`, `map-pin`, `sliders-horizontal`, `chevron-right`, `chevron-down`, `star`, `ghost`, `file-text`, `lock`, `eye`, `eye-off`, `minus`, `plus`, `check`, `x`, `circle-alert`, `arrow-right`, `credit-card`, `briefcase`, `tree-pine`, `waves`, `building-2`, `tree-palm`, `map`, `list`, `sun`, `moon`, `globe`, `upload`, `bookmark`, `bath`, `paw-print`. Map camelCase names to components, type `IconName`, default size 20 and stroke 1.8, default color from `useThemeColors().foreground`, optional `fill`.

Done when the welcome screen uses `AppText` and an `Icon`, and the Poppins families are visibly distinct.

### 5. Core primitives

Build in `src/components/ui/` with the API and specs in “Components”:

- **`button.tsx`** — `Pressable`, primary/secondary, sm/md, pressed opacity 0.8, disabled 0.4, loading spinner, optional left/right icon; `accessibilityRole="button"` and busy/disabled state.
- **`icon-button.tsx`** — surface/glass/ghost, sm/md/lg, required `label`, pressed/disabled/selected; `hitSlop` so sm reaches a 48 touch target.
- **`input.tsx`** — controlled TextInput, focus state, error message, optional left/right icon, automatic eye toggle for `secureTextEntry`; theme `placeholderTextColor`; wrapper uses `h-control`, `rounded-field`, 2px transparent border, `bg-muted`; focus/error classes; `accessibilityLabel` and error hint.
- **`chip.tsx`** — neutral/lavender/yellow, optional icon, selected state; `accessibilityState={{ selected }}`.
- **`badge.tsx`** — tone map including neutral, optional icon, badge type.
- **`banner.tsx`** — success/error, icon circle, message, dismiss; `accessibilityLiveRegion`.
- **`card.tsx`** — padded/unpadded surface card with `shadow-card`.

Every interactive primitive uses `Pressable` (never `TouchableOpacity`), exposes pressed feedback, merges `style` last, and has an explicit accessibility label where the content is icon-only.

Done when `npx tsc --noEmit` and `npx expo lint` pass with all primitives compiled.

### 6. Composite components

Build in `src/components/`:

- **`listing-card.tsx`** — image (expo-image, remote Unsplash placeholder, muted fallback), glass heart with `saved`/`onToggleSave`, title/location/rating, Hot Tub/Bath and Pet Friendly/PawPrint amenity badges, price + `/ night`. Outer card `bg-card rounded-card p-3 shadow-card`; image 128 square, `rounded-tile`; pressed state; accessibility label.
- **`policy-card.tsx`** — lavender surface, `lavender-strong` 48 icon tile, accent icon and chevron, title + 2-line description; pressable.
- **`profile-row.tsx`** — `ProfileRow` (icon, label, chevron) and `ProfileRowGroup` (card, inset hairline separators between children).
- **`wordmark.tsx`** — `AppText variant="wordmark"` plus the tagline; a code comment marks it as a placeholder.
- **`glass-tab-bar.tsx`** — presentational 4-item bar. On iOS 26 use `GlassView` from `expo-glass-effect` (`isLiquidGlassAvailable()` and `isGlassEffectAPIAvailable()` guards); otherwise a View with `bg-glass border-glass-border shadow-floating`. Active item gets a 48 yellow glow circle behind the icon. Required `items`, `value`, `onChange`; `tab` roles and selected state. Use `style` (not className) only on the native GlassView container, with a comment.

Done when the listing card, policy cards, profile group, wordmark, and tab bar render in the catalog preview setup.

### 7. Controls

- **`segmented-control.tsx`** — options with optional icons; 44 track, 4 padding, selected dark pill; `tab` roles, selected state, pressed feedback.
- **`toggle.tsx`** — 56×32 track, 28 knob, yellow on / `toggle-off` off, Reanimated `withTiming` at 150 ms, `switch` role with checked state.
- **`stepper.tsx`** — 48 pill, ghost minus/plus buttons disabled at min/max, centered value, labels “Decrease”/“Increase”.

Done when all controls respond and expose their state to accessibility.

### 8. Catalog screen

Create `src/app/catalog.tsx` with a native header (`Stack.Screen options={{ title: "Design system" }}`) and one scroll. Sections:

1. Brand: wordmark + tagline + visible “typeset placeholder” note.
2. Colors: the eight brand swatches + semantic swatches with current-theme hex labels.
3. Typography: display, heading, title, body, caption, button, tagline with size/line/family specs.
4. Buttons: primary (arrow), secondary (Globe placeholder + note), icon buttons, disabled/loading.
5. Inputs: search (Search + SlidersHorizontal), default, interactive focus demo, password with eye, error, disabled.
6. Chips: neutral row, lavender selected, yellow “All Stays” with icons for Cabins/Beach/City/Villas.
7. Listing card with the Unsplash cabin image and saved state.
8. Policy cards: Ghost “Ask about policies”, FileText “Free cancellation”.
9. Profile rows: Personal info, Payment methods, Trips.
10. Glass tab bar over a second Unsplash photo.
11. Iconography: the 16 sheet icons in 40 circles.
12. Segmented control: List / Map.
13. Toggle + stepper, both interactive.
14. Banners: success and error with dismiss + reset.
15. Badges: Guest favorite, New, 20% off, Superhost.
16. Spacing/radius: bars for the 4-pt scale and radius swatches from tokens.

Add a compact Light / Dark / System `SegmentedControl` at the top that calls NativeWind's `setColorScheme` and restores `system` on unmount. The screen uses `bg-canvas`, `gap-section`, `px-gutter`, and `Card` sections. Every sample value comes from `tokens.json`; only copy is literal.

Done when `/catalog` opens from the dev link and every section renders in both schemes.

### 9. Welcome screen and AGENTS.md

Replace `src/app/index.tsx` with a tokenized welcome: `Stack.Screen options={{ headerShown: false }}`, canvas background, `AppText variant="heading"` “Welcome to Room”, tagline, and a `__DEV__`-only secondary Button “Design system” that pushes `/catalog`.

Update `AGENTS.md` as described below. Run the full verification.

## Verification

1. `npx tsc --noEmit` — pass. Start the dev server once first so typed routes include `/catalog`.
2. `npx expo lint` — pass.
3. `npx expo-doctor` — pass (Node 20 warning is expected; SDK 58 asks for >=22.13).
4. `node -e "require('./tailwind.config.js')"` — pass. Compile CSS with `npx tailwindcss --input ./global.css --output /tmp/room-design.css` and confirm `.bg-canvas`, `.text-muted-foreground`, `.rounded-card`, `.shadow-card`, and `:root { --color-canvas: 244 245 247; }` exist.
5. `npx expo export --platform ios --output-dir .expo/export-check` — bundle succeeds; delete the output. Confirm the five Poppins files are in the bundle.
6. iOS simulator: open `room://catalog` (or the dev link if Expo Go). Screenshot light mode. Compare section by section with the sheet: Poppins letterforms and weights, `#FFC629` primary, `#C9B4FF` selected lavender, `#EEEDFE` policy surface, 20 card radius, pill chips/buttons, 48 controls, lavender focus tint/border, mint/pink banners, badge tints, glass tab bar. List every difference, fix, repeat.
7. Toggle Dark, screenshot, and repeat the component check; ensure no white cards, black text, or non-adapting icon/placeholder colors remain.
8. Interactions: focus an input (tap), toggle password visibility, select lavender/yellow chips, switch List/Map, toggle on/off, step +/- to min/max, dismiss both banners and reset, save/unsave the listing, switch tabs. Screenshot at least the focused input and active tab.
9. Pixel check: sample the screenshot with the temp PNG sampler and compare primary, lavender, canvas, card, policy surface, success/error surfaces to the token values (allow ±2 per channel).
10. Drift check: `rg -n "#[0-9A-Fa-f]{3,8}|fontSize:|fontFamily:" src --glob '!src/theme/**'` — only expected hits are the catalog's token-driven spec labels (no hex) and the font family in AppText/Input/Icon; no raw colors or sizes in components/screens. `rg -n "TouchableOpacity|fontWeight" src` — no hits.
11. Accessibility: icon-only controls have labels, chips/segments/tabs expose selected state, toggle exposes checked, banners are live regions, stepper buttons expose min/max. VoiceOver spot check if available; otherwise mark ❌ with the reason.
12. Web best-effort: `npx expo export --platform web --output-dir .expo/export-check-web`; confirm the CSS variables and font families are in the output. Mark web font rendering ❌ if not inspected.

## AGENTS.md updates

Add a **Design system** section after **Expo**:

- Design tokens live in `src/theme/tokens.json`; Tailwind classes (`bg-canvas`, `text-foreground`, `rounded-card`, `shadow-card`) are the styling API. Never write hex colors or `fontSize` outside the theme.
- Use `AppText` for all text and `Icon` for Lucide icons. Poppins weights are separate families (`font-sans`, `font-sans-medium`, `font-sans-semibold`, `font-sans-bold`, `font-sans-extrabold`); never use `fontWeight`.
- Shared primitives live in `src/components/ui/`, domain cards in `src/components/`. `/catalog` is the living preview; update it when adding a primitive.
- Light/dark is semantic: use `useThemeColors()` for non-class props (icons, `placeholderTextColor`, ActivityIndicator, native header options). Never hardcode white/black.
- The `roam` wordmark is a typeset placeholder until a brand SVG is supplied; the Google mark is not bundled.
- The glass tab bar is presentational until navigation exists; on iOS 26 it uses `expo-glass-effect`, otherwise a translucent fallback.

No existing rule is replaced; the NativeWind styling rule stays and gains the token/AppText/Icon conventions.

## Result

_To be written after approval and verification._
