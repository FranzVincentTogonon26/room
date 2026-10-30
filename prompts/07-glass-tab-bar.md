# 07 · Floating glass tab bar

Status: approved

## Goal

The four app tabs (Home, Search, Trips, Profile) sit in the floating glass pill from `prompts/assets/home.png` instead of the system tab bar. On iOS 26 the pill is drawn with Liquid Glass; on Android and on iOS versions without Liquid Glass the same pill is drawn with a real frosted blur, so both look like the design. Home keeps its current layout, which already matches the design apart from the bar.

## Decisions

- Replace `NativeTabs` with the headless tabs from `expo-router/ui`. The app bar is a custom floating pill, so it is used on every platform and in every tab, including iOS 26. This reverses the `NativeTabs` decision in `AGENTS.md`.
- The bar is a `TabList`-driven navigator: the hidden `TabList` defines the four routes, and four `TabTrigger`s render the visible pill. This is the documented Expo Router "multiple tab bars" pattern.
- iOS 26 uses `GlassContainer` + `GlassView`. Everywhere else uses `expo-blur`'s `BlurView` with `BlurTargetView`, so Android gets a real blur of the screen behind the bar and older iOS gets the native blur. `isLiquidGlassAvailable() && isGlassEffectAPIAvailable()` picks the branch.
- The bar floats 16 dp from the screen edges and `insets.bottom + 12` from the bottom, is 76 dp tall (`spacing.tabbar`), and is a full pill. Content scrolls underneath it, as in the design.
- The selected tab is a 64 dp yellow circle with a soft yellow halo, black icon and black label. Inactive tabs use the foreground colour, not the muted grey in the old catalog preview. The filled house shape stays.
- The bar is hidden while the keyboard is open so iOS and Android behave the same. The tabs stay mounted; only the pill's opacity and pointer events change.
- Tab screens add `insets.top + 8` at the top and `insets.bottom + 100` at the bottom, giving 24 dp of clearance below the 76 dp bar. Home currently has no top safe-area padding because native tabs supplied it; that changes.
- `GlassTabBar` stays in the catalog and shares the same surface and item components as the app bar, so the preview cannot drift from the app.
- New tokens (proposed rather than hardcoded):
  - `light.glassBar` = `rgba(255,255,255,0.28)`, `dark.glassBar` = `rgba(24,24,30,0.50)`.
  - `light.glassBarBorder` = `rgba(255,255,255,0.70)`, `dark.glassBarBorder` = `rgba(255,255,255,0.16)`.
  - Both are added to the `RAW_COLOR_KEYS` set in `src/theme/theme.ts` and `tailwind.config.js`, like the existing `glass` values, so the `rgba()` strings are not parsed as hex.
- Home is re-compared with the design after the bar lands. Only visible mismatches are fixed; the existing token values (wordmark 64, avatar 88, hero 54/54, chip 44) stay unless the screenshot proves they are wrong.
- Defaults picked: the bar preview in `/catalog` sits over a photo so the blur is visible; inactive labels use `foreground`; the bar fades out on keyboard show and back in on hide without an animation dependency.

## Out of scope

- Stay detail, booking, favorites, or trips data.
- New icons or SF Symbols; Lucide icons stay.
- Haptics on tab press.
- A custom Tabs animation between screens.
- Changes to auth, Clerk, Sanity, or the stay data.
- A dark-mode redesign beyond the semantic tokens the bar already uses.

## Steps

### 1. Install the blur module and add the glass tokens

Files: `package.json`, `src/theme/tokens.json`, `src/theme/theme.ts`, `tailwind.config.js`, `src/app/catalog.tsx`.

Run `npx expo install expo-blur` (not `npm install`). Confirm the SDK 58 version is added to `package.json`.

Add `glassBar` and `glassBarBorder` to `light` and `dark` in `tokens.json` with the values above. Add both keys to `RAW_COLOR_KEYS` in `theme.ts` and `tailwind.config.js`. Add them to the `semanticKeys` list in `/catalog` so the swatches cover them.

Done: `npx tsc --noEmit` passes, `npx expo-doctor` sees expo-blur as compatible, and `/catalog` shows the two new swatches.

### 2. Refactor the glass bar into a reusable surface and item

Files: `src/components/glass-tab-bar.tsx`.

Keep `GlassTabItem` and `GlassTabBarProps` (`items`, `value`, `onChange`, `className`). Add:

- `GlassTabBarSurface({ children, className, style, blurTarget })`:
  - Reads `useThemeColors()` and `useThemeScheme()`.
  - Computes `height: spacing.tabbar` and `borderRadius: spacing.tabbar / 2`, with `borderCurve: "continuous"`.
  - When Liquid Glass is available: `<GlassContainer spacing={8}><GlassView colorScheme={scheme} glassEffectStyle="regular" isInteractive style={{ flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.glassBarBorder }}><View className="flex-1 flex-row items-center px-2">{children}</View></GlassView></GlassContainer>`.
  - Otherwise: an outer `View` with `bg` from `colors.glassBar`, a hairline `colors.glassBarBorder`, `overflow: "hidden"`, and an absolute-fill `BlurView` with `intensity={55}`, `tint={scheme === "dark" ? "dark" : "light"}`, `blurTarget`, and `blurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}`. The children row sits above the blur in a `flex-1 flex-row items-center px-2` View.
  - `style` is merged last so callers can position the pill (absolute, insets, opacity).
- `GlassTabBarItem({ icon, label, active })`:
  - 64 × 64 rounded-full container, `gap-1`.
  - Active: `bg-primary` circle, a 72 × 72 `bg-primary/25` halo behind it, icon and label in `primaryForeground`; fill the house icon.
  - Inactive: transparent circle, icon and label in `foreground`.
- Keep `GlassTabBar` as the controlled catalog version, rendering a Pressable per item inside `GlassTabBarSurface`, with `accessibilityRole="tab"` and `accessibilityState={{ selected: active }}`.

Export `GlassTabBarSurface` and `GlassTabBarItem` for the app layout. Do not import anything from `expo-router` in this file, so the catalog can keep using it.

Done: `/catalog` section 10 still renders and switches tabs; its selected tab is now black on yellow and inactive tabs are foreground-coloured.

### 3. Keyboard visibility hook

Files: new `src/lib/use-keyboard-visible.ts`.

Export `useKeyboardVisible()`: subscribe to `keyboardWillShow` / `keyboardWillHide` on iOS and `keyboardDidShow` / `keyboardDidHide` on Android, clean up both listeners, and return a boolean. Keep it in `src/lib`; it is not a component.

Done: type check passes; the hook is unused until step 4.

### 4. Replace native tabs with the custom floating bar

Files: `src/app/(app)/_layout.tsx`.

Keep the Clerk guard exactly as it is: `return null` while `!isLoaded`, `<Redirect href="/" />` when signed out, then the tabs. Keep `<StatusBar style="auto" />`.

Define the four items once:

```ts
const TABS = [
  { name: "home", label: "Home", icon: "house" },
  { name: "search", label: "Search", icon: "search" },
  { name: "trips", label: "Trips", icon: "calendarDays" },
  { name: "profile", label: "Profile", icon: "user" },
] as const;
```

Render:

```tsx
<Tabs>
  <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
    <TabSlot detachInactiveScreens={false} />
  </BlurTargetView>

  <GlassTabBarSurface
    blurTarget={blurTargetRef}
    pointerEvents={keyboardVisible ? "none" : "auto"}
    style={{
      position: "absolute",
      left: 16,
      right: 16,
      bottom: insets.bottom + 12,
      opacity: keyboardVisible ? 0 : 1,
    }}
  >
    {TABS.map((tab) => (
      <TabTrigger key={tab.name} name={tab.name} asChild>
        <TabButton icon={tab.icon} label={tab.label} />
      </TabTrigger>
    ))}
  </GlassTabBarSurface>

  <TabList style={{ display: "none" }}>
    {TABS.map((tab) => (
      <TabTrigger key={tab.name} name={tab.name} href={`/${tab.name}`} />
    ))}
  </TabList>
</Tabs>
```

`TabButton` is a module-level component that takes `TabTriggerSlotProps` plus `{ icon, label }`. It destructures `href` and `style` out so they are not forwarded to `Pressable`, sets `accessibilityRole="tab"`, `accessibilityLabel={label}`, `accessibilityState={{ selected: Boolean(isFocused) }}`, and renders:

```tsx
<Pressable {...props} className="h-full flex-1 items-center justify-center">
  <GlassTabBarItem icon={icon} label={label} active={Boolean(isFocused)} />
</Pressable>
```

Use `useSafeAreaInsets()` for the bottom inset and `useKeyboardVisible()` for the hidden state. `detachInactiveScreens={false}` keeps the four screens as plain views inside `BlurTargetView`, which is what lets Android blur the actual screen. The screens are lightweight, so keeping them mounted is acceptable.

Done: the app opens on Home with the floating pill; each tab switches; the pill is above content and below the safe area; the keyboard hides it.

### 5. Give every tab room for the floating bar

Files: `src/components/home-screen.tsx`, `src/components/search-screen.tsx`, `src/components/profile-screen.tsx`, `src/components/trips-screen.tsx`.

- Home: change `paddingTop: 8` to `paddingTop: insets.top + 8`. Change the bottom of the scroll content from `insets.bottom + 24` to `insets.bottom + 100`.
- Search: change the `FlatList` `paddingBottom` from `insets.bottom + 24` to `insets.bottom + 100`.
- Profile: change the scroll content `paddingBottom` from `insets.bottom + 24` to `insets.bottom + 100`.
- Trips: change the root `paddingBottom` from `insets.bottom + 24` to `insets.bottom + 100`.

Do not change the horizontal padding, card sizes, or chip layout in this step.

Done: the last card on Home and Search can scroll clear of the pill; no screen content hides behind it.

### 6. Update the catalog preview

Files: `src/app/catalog.tsx`.

Change section 10's subtitle from "the app uses native tabs" to "same floating glass bar as the app". Put the preview over a photo (reuse `LISTING_IMAGE` or the first stay image) inside a rounded card with at least 120 dp of padding below the bar, wrap it in `BlurTargetView`, and pass its ref to `GlassTabBar` as `blurTarget`. This makes the Android/web blur preview real instead of translucent.

Done: `/catalog` shows the pill over a photo; the swatches, bar, and typography sections still render.

### 7. Compare Home with the design and fix visible differences

Files: any of the Home components, if a real mismatch is found.

Run the app, screenshot Home, and compare with `prompts/assets/home.png` at the same points used in plan 06: wordmark/avatar, greeting/headline, square search button, lavender pill, chip wrap, first card, bar position, active circle, labels. Fix only differences that are visible at device size. Record which measurements were estimated from the image.

Check light and dark mode. The bar must stay legible over both light and dark photos; the active circle is still yellow with black content.

Done: the screenshot matches the design apart from unavoidable platform differences (system status bar, no phone frame).

## Verification

1. `npx tsc --noEmit` — no errors.
2. `npx expo lint` — no warnings or errors.
3. `npx expo-doctor` — all checks pass; expo-blur is the only new dependency.
4. Start the app. Sign in and confirm Home opens with the floating pill, no system tab bar, and no double bar.
5. Tap all four tabs. Expected: the route changes, the selected circle moves, and the previous screen state is kept.
6. Type in the Home pill and in Search. Expected: the keyboard opens, the bar fades out, and the focused field stays visible.
7. Scroll Home and Search to the last card. Expected: the last card can rise fully above the pill.
8. Open `/catalog`. Expected: section 10 renders the pill over a photo and the selected tab switches.
9. Check Home in light and dark mode. Expected: labels and icons stay legible; the yellow circle keeps black content.
10. On Android (emulator or device), confirm the bar blurs the content behind it, not just a translucent overlay.
11. On iOS 26, confirm the bar uses the native glass material and the selected yellow circle is still visible. On iOS 18 or earlier, confirm the blur fallback looks the same as Android.
12. Compare the Home screenshot with `prompts/assets/home.png`; list and fix differences.
13. `git status` shows only intended files; no `.env`, `ios/`, or `android/` edits.

## AGENTS.md updates

- **Expo:** replace the `NativeTabs` bullet with: `(app)` uses the headless tabs from `expo-router/ui` and a custom floating `GlassTabBar` (Home, Search, Trips, Profile). iOS 26 draws it with `expo-glass-effect`; Android and older iOS use `expo-blur` with a `BlurTargetView`. The bar hides while the keyboard is open. Sign-out lives on Profile. The Home avatar opens Profile.
- **Expo:** note that tab screens own `insets.top + 8` and `insets.bottom + 100`, because there is no native tab bar supplying insets.
- **Design system:** add `glassBar`/`glassBarBorder` to the token list, note that they are raw `rgba()` keys, and say the active tab is black on the brand yellow (not white). The catalog preview uses the same surface as the app.
- **Building from designs:** replace the old note that the mock's floating pill is not reproduced. The floating glass pill is now the target on every platform, with the blur fallback as the non-Liquid-Glass default.
- **Checks:** no change.
