# 17 · Profile screen

Status: done

## Goal

The Profile tab matches `prompts/assets/profile.png`: the smaller room wordmark with a settings gear, a lavender-tinted profile card (avatar, name, sample location, Roam Explorer badge), a Trips / Saved / Rating stats strip, Account and Preferences groups with icon-tile rows, and the lavender Free cancellation card. Personal info, Help, Settings, and Cancellation open bottom sheets; Trips opens the Trips tab; Payment methods and Notifications show a coming-soon alert. The gear sheet holds Sign out, which moves off the screen body.

## Decisions

- Keep live identity: Clerk supplies the avatar, name, and email, so the mock portrait is not shipped as an asset. Cap, initials, or the Clerk image fill the avatar.
- Stats use live counts, per the approved answer: Trips is 0 (no booking system), Saved is `useSavedStays().size` (session-only), and Rating is the sample 4.9 guest rating until ratings exist.
- Location is static sample copy, “San Francisco, CA”, per the approved answer. It is not read from Clerk and does not link anywhere.
- “Roam Explorer” is a static membership badge. No tier data exists.
- Sign out moves into a Settings sheet opened by the gear, per the approved answer. It is no longer a button on the screen body.
- Personal info opens a sheet with the Clerk avatar, name, and email. Help & support opens a sheet with stay-question guidance, a shortcut to the cancellation sheet, and Browse stays. Payment methods and Notifications show `Alert.alert("Coming soon", …)`. Trips navigates to `/trips`.
- The Free cancellation card opens a sheet repeating the card copy and pointing to each stay's own cancellation policy. No new policy terms are invented.
- Sheets reuse `@expo/ui` `BottomSheet` + `RNHostView`, exactly like the host and policy sheets. No new dependency. One `sheet` state selects Settings, Personal info, Help, or Cancellation, so Help can hand off to Cancellation without stacking sheets.
- Bottom sheet shell: drag handle, title, subtitle, close `IconButton`, content, `paddingBottom: insets.bottom + 16`, max height 85%, same as the host sheet.
- The native tab bar is unchanged. iOS 26 draws the system liquid-glass bar, so the mock's floating yellow pill is not reproduced (already documented in AGENTS.md).
- `/catalog` keeps previewing the updated `ProfileRow`; add the new type variants to its specimen list.

## Out of scope

- Editing the profile, picking a photo, or changing name, email, or password.
- A location field, membership tiers, a real guest rating, bookings, or trips data.
- Payment methods, notification settings, and support messaging screens.
- Persisted saved stays, PostHog events, or API/Sanity changes.
- A custom tab bar or any change to `(tabs)/_layout.tsx`.

## Design

Measurements are estimated from `prompts/assets/profile.png` (941×1672). The phone screen occupies x≈81–860 (779 px); at the app's 390 pt reference that is ≈2 px per point. The design's card gutter is ≈16 pt, which this screen uses (`px-4`) instead of the 20 pt gutter on Home/Search.

- **Screen:** `bg-card` (white). ScrollView, `contentInsetAdjustmentBehavior="never"`, `automaticallyAdjustContentInsets={false}`, `showsVerticalScrollIndicator={false}`. Content top `insets.top + 8`, bottom `insets.bottom + 24`, horizontal 16.
- **Header:** row, space-between, height 56. Wordmark “room” at new `wordmarkSmall` 56/56 Bold, −2.5 (design ratio is 0.895× Home's wordmark, and 56 keeps that ratio). Right: `IconButton icon="settings" size="md"` (48 circle, `bg-muted`, icon 24 foreground).
- **Profile card:** `mt-5`, `rounded-field` (24), `bg-lavender-mist` (new token), `p-2.5` (10), row, `items-center`, `gap-3` (12).
  - Avatar 104 (`UserAvatar` new `xl`, still yellow `bg-primary`), circle.
  - Text column flex-1:
    - Name `profileName` 26/32 Bold, −0.5 (new token; measured 26 from width and cap height).
    - Location row `mt-1`, `mapPin` 20 filled `mutedForeground`, `gap-2` (8), `bodyLarge` 18/24 `mutedForeground`. Copy “San Francisco, CA”.
    - Badge `mt-2.5`, h-9 (36), `rounded-pill`, `bg-lavender-surface`, `px-3`, `gap-2`; star 20 filled `star`; label 15/20 semibold (new `profileBadge` token or reuse `label` 15/20 SemiBold) foreground. Copy “Roam Explorer”.
- **Stats card:** `mt-3` (12), h-18 (72), `rounded-card`, `border border-border`, `bg-card`, row. Three columns `flex-1`, centered; two `h-12 w-px bg-border` dividers.
  - Number `price` 20/26 Bold. Rating rule = star 22 filled `star` + 6 gap + number.
  - Label `bodyCompact` 15/20 `subtleForeground`, 2 below the number.
  - Values: `0` / saved count / `4.9`, labels `Trips` / `Saved` / `Rating`.
- **Section group:** `mt-3`, `rounded-field` (24), `bg-muted`, `p-2` (8). Heading `cardTitleCompact` 17/22 Bold, `px-3 pt-2 pb-2`. Rows card `rounded-card bg-card shadow-card dark:border dark:border-border`, overflow hidden.
- **Row:** h-13 (52), `px-3`, `gap-4`; icon tile 36×36 `rounded-tile bg-muted` with a 24 icon; label `body` 16/24 flex-1; `chevronRight` 20, strokeWidth 2. Separator `ml-14 mr-3 h-px bg-border` (56 = 12 padding + 36 tile + 8 gap; design starts just right of the tile and stops 12 from the right edge). Pressed opacity 0.7.
- **Account rows:** `user` Personal info, `creditCard` Payment methods, `luggage` Trips (new Lucide `luggage`, design uses a suitcase, not `briefcase`).
- **Preferences rows:** `bell` Notifications (new Lucide `bell`), `circleHelp` Help & support (new Lucide `circleHelp`).
- **Cancellation card:** `mt-2` (8), `rounded-card`, `bg-lavender-surface`, `px-4 py-2`, row `items-center gap-4`. `fileText` 30 `accent-soft` (new token), no tile. Text column flex-1: “Free cancellation” `promoTitle` 24/30 Bold, −0.5 (new token; the mock's title is 1.56× the section heading and ≈197 pt wide), subtitle “Full refund up to 7 days before check-in.” `bodyCompact` 15/20 `mutedForeground`, no gap. Chevron 24 `accent-soft`, strokeWidth 2.5. Pressed opacity 0.85.
- **New tokens:**
  - `typography.profileName`: Bold 26/32, −0.5.
  - `typography.promoTitle`: Bold 24/30, −0.5.
  - `typography.wordmarkSmall`: Bold 56/56, −2.5.
  - `light.lavenderMist` `#F8F9FD` / `dark.lavenderMist` `#17161F` (hero card).
  - `light.accentSoft` `#7C5CFC` / `dark.accentSoft` `#B39CFF` (violet icon and chevron; sampled ≈#8264FD).
  - Reuse `star #FFB500`, `lavenderSurface`, `muted #F4F5F7`, `border`, `subtleForeground`, `mutedForeground`, `card`, `foreground`.
- **Icons:** add `bell`, `circleHelp`, `luggage` to the Lucide map. Use existing `settings`, `user`, `creditCard`, `mapPin`, `star`, `fileText`, `chevronRight`, `x`, `logOut`, `wandSparkles`, `calendarDays`, `house`.
- **Sheet content:**
  - Settings: title “Settings”, subtitle “Account and app preferences.”, signed-in email in a `bg-muted rounded-card` block, `Button variant="secondary" leftIcon="logOut" label="Sign out"`.
  - Personal info: title “Personal info”, subtitle “The name and email on your Room account.”, avatar 88, name `title`, email `body`, caption “Managed by Clerk. Editing is coming soon.”
  - Help & support: title “Help & support”, subtitle “We're here to help.”, two muted cards: “Stay questions” (“Open any stay and tap Ask about this stay. Answers quote the stay and Room's policies.”) and “Cancellation” (“Full refund up to 7 days before check-in. Each stay lists its exact policy on its details page.”). A `Button variant="secondary"` “View cancellation policy” switches to the cancellation sheet; a `Button` “Browse stays” closes the sheet and goes to `/home`.
  - Cancellation: title “Free cancellation”, subtitle “Full refund up to 7 days before check-in.”, `fileText` in a 48 lavender tile, body “The exact cancellation policy for each stay is shown on the stay's details page.”, caption “This is Room's standard promise. Some stays have different terms.”
- **Alerts:** “Coming soon” + “Payment methods aren't available yet.” / “Notification settings aren't available yet.”
- **Dark mode:** every surface uses a semantic token; `lavenderMist` and `accentSoft` flip to their dark values, and the rows card gets a border.

## Steps

### 1. Add tokens, icons, and avatar size

Files: `src/theme/tokens.json`, `src/components/ui/icon.tsx`, `src/components/ui/text.tsx` (only if a new tone is needed), `src/components/user-avatar.tsx`, `src/app/catalog.tsx`.

- Add the three typography variants and the two colors to `tokens.json` from the Design section. Keep token order and naming consistent with the file.
- Add `bell`, `circleHelp`, and `luggage` imports from `lucide-react-native` and map them in `iconMap`. Do not reorder existing entries.
- Add `xl: "h-26 w-26"` to `UserAvatar`'s `sizeClasses` and `xl: "heading"` to `textVariants`. `h-26` is 104 at the configured 16 rem.
- In `catalog.tsx`, add `profileName`, `promoTitle`, and `wordmarkSmall` to `typeOrder` and `typeSamples` (samples: “Joanna Smith”, “Free cancellation”, “room”). The catalog's semantic color list should pick up the new colors from `tokens.light` automatically only if the key is in its manual list; add `lavenderMist` and `accentSoft` to `semanticKeys` so they preview.

Done: `npx tsc --noEmit` passes and `/catalog` renders the new specimens.

### 2. Match `ProfileRow` and `ProfileRowGroup` to the design

File: `src/components/profile-row.tsx`.

- Row: `h-13` (52), `px-3`, `gap-4`, flex-row items-center. Replace the bare 24 icon with a 36×36 `rounded-tile bg-muted` tile holding a 24 icon.
- Label: `AppText variant="body"` (16/24) instead of `label` 15 semibold.
- Chevron: 20, `strokeWidth={2}`, foreground.
- Group: keep `overflow-hidden rounded-card bg-card shadow-card dark:border dark:border-border`.
- Separator: `ml-14 mr-3 h-px bg-border` instead of the full-width border.

Done: the catalog's “09. Profile row” preview matches the design's row anatomy; the existing API (`icon`, `label`, `onPress`, children) is unchanged.

### 3. Rebuild the Profile screen layout

File: `src/components/profile-screen.tsx`.

- Imports: `useClerk`, `useUser`, `useRouter`, `Alert`, `ScrollView`, `Pressable`, `View`, `useSafeAreaInsets`; `AppText`, `Button`, `Icon`, `IconButton`; `ProfileRow`, `ProfileRowGroup`; `UserAvatar`; `useSavedStays`; `displayNameFor`; `useThemeColors`.
- State: `sheet: "settings" | "personal" | "help" | "cancellation" | null`, default `null`.
- Header row: wordmark `AppText variant="wordmarkSmall"` + `IconButton icon="settings" label="Open settings" onPress={() => setSheet("settings")}`.
- Profile card: `UserAvatar size="xl"`; name `profileName` with `numberOfLines={2}`; static location row; static badge with a star fill.
- Stats card: render `0`, `saved.size`, `4.9`. `useSavedStays()` returns a `ReadonlySet<string>`; use `.size`.
- Account section: Personal info → `setSheet("personal")`; Payment methods → alert; Trips → `router.navigate("/trips")`.
- Preferences: Notifications → alert; Help & support → `setSheet("help")`.
- Cancellation card: `Pressable` → `setSheet("cancellation")`, accessibility label includes both lines.
- Bottom of scroll: nothing else (no sign-out button).
- Keep all copy exactly as the design except the stats values and the sheet copy.

Done: the screen renders the full design from live identity and saved state; rows are pressable and accessibility-labelled.

### 4. Add the profile sheets

File: new `src/components/profile-sheets.tsx` (or four small files if it grows past ~300 lines).

- Shared `ProfileSheet` shell: `BottomSheet` + `RNHostView`, overlay `Pressable` that closes, `rounded-t-sheet bg-card`, drag handle, title + subtitle + close `IconButton`, children, `maxHeight: height * 0.85`, bottom `insets.bottom + 16`. Copy the host sheet's structure; do not invent a new modal style.
- `SettingsSheet({ visible, email, onClose, onSignOut })`: email block + sign-out `Button`.
- `PersonalInfoSheet({ visible, onClose })`: reads `useUser`, shows `UserAvatar size="lg"`, `displayNameFor(user)`, email.
- `HelpSheet({ visible, onClose, onCancellation, onBrowse })`: two muted info cards and the two buttons. `onCancellation` changes the parent's sheet state to `"cancellation"`.
- `CancellationSheet({ visible, onClose })`: the copy from the Design section.
- No sheet fetches data or calls an API. Sign out is the existing `useClerk().signOut` passed down from the screen.

Done: each sheet opens and closes with the X, overlay tap, and native swipe-down; sign out returns to `/`.

### 5. Wire the screen and verify against the design

File: `src/components/profile-screen.tsx`.

- Render the four sheets with `visible={sheet === "…"}` and their `onClose`. `SettingsSheet` receives `user?.primaryEmailAddress?.emailAddress` and `() => void signOut()`.
- `HelpSheet.onBrowse`: close and `router.navigate("/home")`.
- Run `npx tsc --noEmit`, `npx expo lint`.
- Start the app on the iOS simulator, open Profile, take light and dark screenshots, and compare with `prompts/assets/profile.png`. List differences (spacing, type sizes, colors, radii), fix, and repeat. Use `xcrun simctl openurl booted room://profile` for the deep link if needed.
- Try a long name, a user without a photo, 0 saved, and ≥1 saved stay.

Done: the simulator screen matches the mock apart from the documented native tab bar and live identity; all checks pass.

## Verification

- `npx tsc --noEmit` and `npx expo lint` pass with no errors.
- Profile shows the wordmark and gear; the gear opens Settings.
- Stats show 0 Trips, the session saved count, and 4.9 Rating. Save a stay on Home, return to Profile, and confirm Saved increments; restarting clears it.
- The profile card shows the Clerk avatar/initials, name, “San Francisco, CA”, and “Roam Explorer”.
- Account/Preferences rows match the design: 36 icon tiles, 52-high rows, inset separators, chevrons.
- Personal info opens with the live name and email; close via X, overlay, and swipe-down.
- Payment methods and Notifications show their coming-soon alerts.
- Trips opens the Trips tab.
- Help opens, “View cancellation policy” switches to the cancellation sheet, and “Browse stays” closes and goes Home.
- The Free cancellation card opens the cancellation sheet.
- Settings shows the email and signs out; signing back in returns to Home.
- Light and dark mode both render every surface correctly (no hardcoded white/black).
- The native tab bar still shows Home / Search / Trips / Profile with Profile selected; no floating pill is added.
- End-to-end: sign in → Home → save one stay → Profile → see Saved 1 → open each sheet → Trips → back to Profile → sign out.

## AGENTS.md updates

- Expo: replace “Sign-out lives on Profile” in the tab bullet with “Sign out lives in Profile's Settings sheet, opened by the gear.”
- Expo: add a Profile bullet describing the screen: wordmark + gear, live Clerk identity, sample location and Roam Explorer badge, live stats (0 trips, session saved count, sample 4.9 rating), Account/Preferences row groups, Free cancellation card, sheet destinations, and coming-soon alerts.
- Design system: document `profileName` 26/32 Bold, `promoTitle` 24/30 Bold, `wordmarkSmall` 56/56, `lavenderMist`, `accentSoft`, the `xl` avatar (104), the updated `ProfileRow` anatomy (36 icon tile, 52 row, inset divider), and the added `bell`, `circleHelp`, and `luggage` icons.
- Who owns what → Auth: note that sign out is reached through Profile → Settings.
- Keep the file under 150 lines; replace stale wording instead of appending.
