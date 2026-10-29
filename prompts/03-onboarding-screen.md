# 03 · Onboarding screen & authentication entry

Status: done

## Goal

Build the pixel-accurate onboarding screen from `/Users/franz/Downloads/source-file/prompt-imgs/onboarding.png` as the initial user landing experience in Room (`src/app/index.tsx`), and connect it to the authentication flow screen based on `/Users/franz/Downloads/source-file/prompt-imgs/auth.png` (`src/app/(auth)/sign-up.tsx`), enabling users to progress into authentication via "Get started", "Continue with Google", or "Skip".

## Result

- Built the pixel-accurate Onboarding screen at `src/app/index.tsx` matching `onboarding.png`:
  - Sunset mountain cabin hero image with glass "Whistler, BC" badge.
  - Asymmetric sloping curved white card header rendered cleanly with `react-native-svg`.
  - 3-slide swipable carousel with lavender/gray indicator pills.
  - Yellow primary "Get started" button and white secondary "Continue with Google" button with official 4-color Google G icon.
  - "Skip" pill button and Poppins ExtraBold `room` wordmark in top header.
- Connected the onboarding screen to the "Create your account" authentication screen at `src/app/(auth)/sign-up.tsx` matching `auth.png`.
- Added reusable `GoogleMark` and `AppleMark` SVG components in `src/components/ui/brand-icons.tsx`.
- Extended `Button` with `leftElement` prop and `Input` with `label` prop.
- Verified on booted iOS simulator with screenshots. Lint and typecheck passed with 0 errors.

## Decisions

- **Entry route (`src/app/index.tsx`):** The onboarding screen replaces the temporary welcome screen at `src/app/index.tsx`. The dev link to `/catalog` is preserved in `__DEV__` mode as a subtle floating button or via header.
- **Visual fidelity to `onboarding.png`:**
  - **Header:** Translucent floating header over the hero with typeset `room` wordmark on the left (Poppins ExtraBold) and a pill-shaped "Skip" button on the right with a blurred/translucent glass background (`bg-white/80` or `bg-glass`).
  - **Hero photo:** Full-width hero image using `expo-image` with an Unsplash luxury cabin sunset photo (`Whistler, BC`).
  - **Location badge:** Glass pill overlay at the bottom-left of the hero image (`Whistler, BC` with `mapPin` icon and blurred background).
  - **Asymmetrical curved card:** Bottom sheet/card features the signature organic downward-sloping top curve from the design (higher on the left, smooth descent to the right) rendered cleanly with `react-native-svg` Path in `colors.card`.
  - **Carousel pagination:** 3 pill indicators at the top of the card (active lavender pill `bg-lavender`, inactive pills `bg-border`). Horizontal swipe / slide paging for 3 stay highlights ("Find a stay that fits your story", "Cozy spaces designed for memorable trips", "Book with confidence").
  - **Action buttons:**
    - Primary "Get started" button with `palette.primary` yellow, bold label, and `arrowRight` icon.
    - Secondary "Continue with Google" button with official 4-color Google "G" SVG mark.
- **Authentication destination (`src/app/(auth)/sign-up.tsx`):**
  - Matches `/Users/franz/Downloads/source-file/prompt-imgs/auth.png`:
    - Top bar with back button (`<`) and right-aligned `room` wordmark.
    - "Create your account" title and descriptive subtitle.
    - Full name, Email address, and Password fields using `Input` with icons (`user`, `mail`, `lock`, `eye`/`eyeOff` toggle).
    - "Create account" primary button.
    - "or" divider.
    - "Continue with Google" and "Continue with Apple" secondary buttons.
    - "Already have an account? Sign in" footer.
- **Component extensions:**
  - Extend `Button` with an optional `leftElement?: React.ReactNode` prop so multi-color brand SVGs (Google G, Apple mark) can be rendered alongside standard Lucide `leftIcon`.
  - Create reusable `GoogleMark` and `AppleMark` SVG components in `src/components/ui/brand-icons.tsx`.

## Out of scope

- Live Clerk backend authentication integration and session tokens (backend setup will be handled in a dedicated auth/Clerk plan).
- Full sign-in screen (linked presentationally).
- Full property booking flows.

## Steps

### 1. Brand SVG marks & Button prop extension

- Add `GoogleMark` and `AppleMark` components using `react-native-svg` in `src/components/ui/brand-icons.tsx`.
- Update `src/components/ui/button.tsx` to support `leftElement?: React.ReactNode` without breaking existing `leftIcon` usage.

### 2. Onboarding screen (`src/app/index.tsx`)

- Implement the onboarding screen matching `onboarding.png`:
  - Hero image with `Whistler, BC` location badge.
  - Asymmetrical curved card with `react-native-svg` top edge.
  - 3-slide pager with swipe gestures and indicator pills.
  - Primary "Get started" button navigating to `/(auth)/sign-up`.
  - Secondary "Continue with Google" button navigating to `/(auth)/sign-up`.
  - "Skip" button in header navigating to `/(auth)/sign-up` (or home).
  - Dev badge linking to `/catalog` in `__DEV__`.

### 3. Authentication screen (`src/app/(auth)/sign-up.tsx`)

- Implement the "Create your account" screen matching `auth.png`:
  - Back navigation button returning to onboarding.
  - Wordmark in header.
  - Input fields for Full name, Email address, and Password with visibility toggle.
  - "Create account" button with state handling.
  - Divider and Google / Apple buttons.
  - Footer with "Sign in" action.

### 4. Verification and visual polish

- Run `npx expo lint` and `npx tsc --noEmit`.
- Compare rendered layout in iOS simulator with `onboarding.png` and `auth.png`.

## Verification

1. App launches into the Onboarding screen matching `onboarding.png`:
   - `room` wordmark and "Skip" pill in top header.
   - Luxury cabin sunset image with "Whistler, BC" glass badge.
   - Curved organic card with lavender active indicator and gray inactive pills.
   - Exact copy: "Find a stay that fits your story" and body text.
   - Yellow "Get started" button and white "Continue with Google" button.
2. Tapping "Get started", "Continue with Google", or "Skip" navigates to the "Create your account" screen matching `auth.png`.
3. Tapping the back button on the auth screen returns to Onboarding.
4. Tapping the dev `/catalog` button in `__DEV__` opens the design system catalog.
5. `npx expo lint` and `npx tsc --noEmit` pass with 0 errors.

## AGENTS.md updates

None (follows existing design system and route conventions).
