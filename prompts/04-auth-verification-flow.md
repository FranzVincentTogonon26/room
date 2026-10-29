# 04 · Auth email verification flow & mock session

Status: done

## Goal

Provide a complete mock email verification flow after account creation: when a user fills out the sign-up form, they are routed to a 6-digit code verification screen with a 30-second resend countdown timer. Entering the test code (`123456`) authenticates the user and redirects to the Home page with a visible "Sign out" action.

## Decisions

- **Mock auth architecture (`src/context/auth-context.tsx`):** A lightweight React Context providing `user`, `pendingEmail`, `startSignUp`, `verifyCode`, `resendCode`, and `signOut`.
- **Fixed test verification code:** Hardcoded to `123456` for instant testing. Incorrect codes display an error message and prevent progression.
- **Verification screen route (`src/app/(auth)/verify.tsx`):** Lives in the `(auth)` group stack with back navigation, `room` wordmark, title, target email display, 6-digit code entry, inline error feedback, and countdown timer.
- **Resend timer:** 30-second countdown (`Resend code in 0:XX`). Disables resending until countdown reaches 0, then enables a pressable "Resend code" that restarts the countdown and displays a confirmation.
- **Home screen integration (`src/app/index.tsx`):** Renders the Home screen preview (matching `home.png`) when authenticated, displaying "Hey, [Name] 👋", search pill, category chips, featured stay card, and a top-bar "Sign out" button. When signed out, smoothly returns to the onboarding screen.
- **Design system fidelity:** Uses semantic tokens (`bg-card`, `bg-canvas`, `border-border`, `border-focus-ring`, `bg-focus`, `text-foreground`, `text-error-foreground`), Poppins type via `AppText`, and `Icon`.

## Out of scope

- Production Clerk webhook/SDK backend calls (mock flow for immediate developer testing).
- Real SMTP email delivery.
- Complex multi-tab navigation persistence.

## Steps

### 1. Mock Auth Context (`src/context/auth-context.tsx` & `src/app/_layout.tsx`)
Create `src/context/auth-context.tsx` with user state, sign-up initiation, verification checking against `"123456"`, resend tracking, and sign-out. Wrap `RootNavigator` in `_layout.tsx` with `AuthProvider`.

### 2. Update Sign-Up Screen (`src/app/(auth)/sign-up.tsx`)
On successful form validation, call `startSignUp({ name, email, password })` and navigate to `/(auth)/verify`.

### 3. Build Verification Screen (`src/app/(auth)/verify.tsx`)
Create the 6-digit OTP verification screen:
- Header with back button and `room` wordmark.
- Heading and subtitle showing user's email and "Use 123456 for testing".
- 6-box digit input interface with error state handling.
- 30-second resend countdown timer with clickable "Resend code" upon expiry.
- Primary "Verify & continue" button.
- On valid code `123456`, trigger `verifyCode` and redirect via `router.replace("/")`.

### 4. Home Screen with Sign-out in `src/app/index.tsx`
Update `src/app/index.tsx` to conditionally render:
- `OnboardingScreen` when `user === null`.
- `HomeScreen` when `user !== null`, displaying user greeting, stay highlights from `home.png`, and a visible "Sign out" action that resets session and returns to onboarding.

### 5. Verification & Tests
Verify with `npx expo lint` and `npx tsc --noEmit`. Test sign-up validation, navigation to verification screen, invalid code rejection, resend timer countdown, valid code `123456` submission, redirection to home page, and sign out back to onboarding.

## Verification

1. Fill sign-up form with valid details and submit -> navigates to `/(auth)/verify`.
2. Entering wrong code (e.g. `111111`) displays error and prevents redirect.
3. Resend timer counts down from 30s to 0s, then allows tapping "Resend code".
4. Entering `123456` verifies successfully and redirects to `/` showing Home page with "Hey, [Name] 👋".
5. Tapping "Sign out" resets auth state and returns to Onboarding screen.
6. `npx expo lint` and `npx tsc --noEmit` pass with 0 errors.

## AGENTS.md updates

None (uses existing design system tokens and mock conventions).

## Result

- Added a mock auth session in `src/context/auth-context.tsx` (`AuthProvider` / `useAuth`): start sign-up, verify with fixed code `123456`, resend, sign out. Wrapped the navigator in `src/app/_layout.tsx`.
- Sign-up now validates and routes to `/(auth)/verify` with the email param (`src/app/(auth)/sign-up.tsx`).
- Built `src/app/(auth)/verify.tsx`: 6-box code entry (hidden numeric input behind tappable boxes), auto-submit at 6 digits, inline error, 30-second resend countdown, resend confirmation, and a "Mock code: 123456 (tap to use)" helper pill.
- Built `src/components/home-screen.tsx` from `home.png`: wordmark, greeting, headline + search button, lavender search pill, category chips, featured cabin card, glass tab bar, and a sign-out icon button in the header. `src/app/index.tsx` now renders home when signed in and onboarding when signed out.
- Added `logOut`, `sparkles`, and `arrowUpRight` to the icon map.
- Verified the runtime loop in the iOS simulator with temporary probes (removed afterward): code `123456` → home shows "Hey, Joanna 👋" with avatar → sign out returns to onboarding. Lint and type check pass.

## Follow-up: validation & loading states

- Sign-in (`src/app/(auth)/sign-in.tsx`) now validates email shape and required password inline, clears errors on change, and shows a per-action spinner (`credentials`, `google`, `apple`) with the other auth buttons and fields disabled while a mock request runs.
- Sign-up (`src/app/(auth)/sign-up.tsx`) keeps its existing validation and adds the same per-action loading states for create account, Google, and Apple.
- Verify (`src/app/(auth)/verify.tsx`) shows a spinner while checking the code, clears the boxes and refocuses on a wrong code, and shows a "Sending…" spinner on resend.
- Mock actions in `src/context/auth-context.tsx` share `MOCK_AUTH_DELAY_MS` (900 ms) through `waitForMockAuth()`. Google and Apple sign in as Joanna; credential sign-in derives the name from the email.
- `src/lib/use-is-mounted.ts` prevents a delayed mock action from navigating after the screen unmounts.
- Verified in the simulator with temporary probes (removed afterward): empty sign-in shows both inline errors, Google/Apple/create/resend/verify spinners render, and valid sign-in plus Google sign-up reach home. Lint and type check pass.
