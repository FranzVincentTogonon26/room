# 05 · Clerk auth with passwords and email verification

Status: done

## Goal

Replace the mocked auth with Clerk while keeping Room's custom screens: guests sign up with full name, email, and password, verify their email with a 6-digit code, and sign in with email and password. Sessions survive app restarts, `/home` is protected, and signing out returns to onboarding. Google stays the only social option.

## Decisions

- Password auth returns. The Clerk development instance is patched to `auth_password.enabled = true`, `required = true`, and `min_length = 8` with no character-class requirements, matching the existing "At least 8 characters" placeholder.
- Sign-up collects full name, email, and password. Clerk's `user_model.first_name` and `last_name` are enabled but not required; the full name is split on whitespace into first and last name (everything after the first word becomes the last name).
- Sign-up still verifies the email with a 6-digit `email_code` because the instance has `verify_at_sign_up = true`. The flow is: create the password sign-up, send the code, verify it on the existing screen, then finalize.
- Sign-in is email + password only. There is no email-code sign-in button and no passwordless path in the UI.
- If Clerk returns `needs_client_trust` or `needs_second_factor` after a password sign-in, send an email code with `signIn.mfa.sendEmailCode()` and open the verify screen in `trust` mode. Verifying calls `signIn.mfa.verifyEmailCode()` and finalizes. This keeps the instance's device-trust protection on.
- Password reset is out of scope for now. There is no "Forgot password?" link, matching the current screens.
- Google browser SSO (`useSSO` from `@clerk/expo/experimental`) stays on onboarding, sign-in, and sign-up. Apple is not offered.
- Routes are unchanged: `/` is public onboarding, `(auth)` holds sign-in, sign-up, and verify, and `(app)` protects `/home`. `(auth)` bounces signed-in guests to `/home`; `(app)` bounces signed-out guests to `/`.
- The shared verification screen takes `?email=…&mode=sign-up|trust`. `sign-up` verifies the new account's email; `trust` completes a new-device password sign-in. Sign-in no longer uses this screen.
- Sessions persist through `ClerkProvider`'s `tokenCache` (`expo-secure-store`). The splash stays visible until fonts and Clerk's session restore are ready.
- Errors use Clerk's returned `{ error }`: field-specific errors appear under the matching field; other Clerk errors appear in a caption row above the submit button. Google cancellation is silent.
- `MOCK_AUTH_DELAY_MS`, `waitForMockAuth`, `src/context/auth-context.tsx`, and `src/lib/use-is-mounted.ts` stay deleted.

## Out of scope

- Password reset, passwords for existing Google-only users, Apple sign-in, native Google sheet, MFA enrollment screens, profile editing, production Clerk instance, PostHog.
- Checking the Clerk session on API routes (no API routes exist yet).

## Clerk API notes (verified against installed `@clerk/expo` 4.14.4)

```tsx
const { signUp, fetchStatus } = useSignUp();
await signUp.password({ emailAddress, password, firstName, lastName });
await signUp.verifications.sendEmailCode();
await signUp.verifications.verifyEmailCode({ code });
await signUp.finalize({ navigate: () => router.replace("/(app)/home") });

const { signIn } = useSignIn();
await signIn.password({ emailAddress, password });
if (signIn.status === "complete") await signIn.finalize({ navigate });
if (signIn.status === "needs_client_trust") {
  await signIn.mfa.sendEmailCode();
  // then on the verify screen:
  await signIn.mfa.verifyEmailCode({ code });
  await signIn.finalize({ navigate });
}
```

- Every method resolves to `{ error: ClerkError | null }`. Check `error`, not try/catch, for API failures.
- Field errors are reactive at `errors.fields.firstName`, `errors.fields.emailAddress`, `errors.fields.password`, and `errors.fields.code`; global errors are at `errors.global`.
- `fetchStatus` is `"idle" | "fetching"`. Use it for button spinners and disabling inputs.
- `signIn.password` may return `needs_client_trust` with no error when the device is new. `signIn.mfa.sendEmailCode()` and `signIn.mfa.verifyEmailCode({ code })` handle both device trust and email second factors.
- `finalize` accepts `navigate: ({ session, decorateUrl }) => void | Promise<unknown>`. Call `router.replace("/(app)/home")` inside it.

## Steps

### 1. Configure the Clerk development instance

Use the Clerk MCP (`tools.clerk.*`, application `app_3LMWmsRRsPm6hOhMbWQtDCZfA4n`, instance `development`):

1. `patch_instance_config` with `dry_run: true` and:

```json
{
  "auth_password": {
    "enabled": true,
    "required": true,
    "min_length": 8
  },
  "user_model": {
    "first_name": { "enabled": true, "required": false },
    "last_name": { "enabled": true, "required": false }
  }
}
```

2. Read the preview, then apply the same patch with `dry_run: false`.
3. Re-read the config and confirm: password enabled and required with an 8-character minimum, email `email_code` verification still on, names enabled and optional.
4. Leave Google enabled and leave `auth_email.sign_in_strategies` alone; the UI simply does not offer email-code sign-in.

Done when the instance accepts a password sign-up with first/last name. No app code changes in this step.

### 2. Restore the sign-up design with Clerk

**`src/app/(auth)/sign-up.tsx`**

- Restore the full name and password fields from the original design, above the existing email field: full name uses the `user` icon, password uses the `lock` icon with `secureTextEntry` (the shared `Input` already renders the eye toggle).
- Keep the `room` header, 34 px heading, subtitle, Google button, "Already have an account?" footer, error caption row, and `h-[54px]` submit button.
- State: `fullName`, `email`, `password`, plus per-field errors and `formError`.
- Validation: full name required; email required and shaped correctly; password at least 8 characters. Clear each error as its field changes.
- Submit: split the trimmed name into `firstName` and `lastName` (last name may be empty). Call `signUp.password({ emailAddress: trimmedLowercaseEmail, password, firstName, lastName: lastName || undefined })`.
- If `form_identifier_exists`, show "An account with this email already exists. Sign in instead." under email. Map password errors (`form_password_length_too_short`, `form_password_pwned`, `form_password_validation_failed`) under the password field. Everything else uses `clerkErrorMessage` in the caption row.
- If `signUp.status === "complete"`, finalize and go to `/home`. Otherwise call `signUp.verifications.sendEmailCode()` and push `/(auth)/verify?email=…&mode=sign-up`.
- Keep `<View nativeID="clerk-captcha" />`.
- Loading is `fetchStatus === "fetching"` and disables all fields and buttons.

Done when the screen matches the original three-field design and creates a Clerk sign-up that waits for email verification.

### 3. Restore password sign-in

**`src/app/(auth)/sign-in.tsx`**

- Restore the password field below email, with `secureTextEntry`, `lock` icon, and the eye toggle.
- Keep the heading, subtitle, Google button, "Don't have an account? Create account" footer, error caption row, and `h-[54px]` button.
- Validation: email required and shaped correctly; password required.
- Submit: `signIn.password({ emailAddress: trimmedLowercaseEmail, password })`.
- `form_identifier_not_found` shows under email: "We couldn't find an account with that email." `form_password_incorrect` shows under password: "That password isn't right. Try again." Other errors use the caption row.
- If `signIn.status === "complete"`, finalize to `/home`.
- If `signIn.status === "needs_client_trust"` or `"needs_second_factor"`, call `signIn.mfa.sendEmailCode()` then push `/(auth)/verify?email=…&mode=trust`. If sending fails, show the error in the caption row.
- Any other non-complete status shows "We couldn't finish signing you in. Try again."
- Loading is `fetchStatus === "fetching"`.

Done when email + password reaches `/home`, wrong passwords show an inline error, and a new-device challenge opens the code screen.

### 4. Verify email for sign-up and new devices

**`src/app/(auth)/verify.tsx`**

- Read `mode` next to `email`; accept `"sign-up"` (default) and `"trust"`.
- Keep both `useSignIn()` and `useSignUp()` (hooks must be unconditional), then branch.
- `sign-up`: `signUp.verifications.verifyEmailCode({ code })`; on complete finalize. Resend with `signUp.verifications.sendEmailCode()`.
- `trust`: `signIn.mfa.verifyEmailCode({ code })`; on complete finalize. Resend with `signIn.mfa.sendEmailCode()`.
- Copy: sign-up says "…Enter it below to activate your account."; trust says "…Enter it below to finish signing in." Back returns to sign-up or sign-in respectively when there is no history.
- Keep the 6-box UI, auto-submit at 6 digits, 30-second resend countdown, inline errors, and resend confirmation.
- Map `form_code_incorrect` to "That code isn't right. Check it and try again." and expired codes to "That code expired. Send a new one." Everything else uses `clerkErrorMessage`. On failure clear the boxes and refocus the hidden input.

Done when both sign-up verification and a device-trust challenge end on `/home`.

### 5. Home greeting and docs

**`src/components/home-screen.tsx`**

- Greeting uses `user.firstName`, then `user.fullName`, then the email local part. The avatar keeps `user.imageUrl` and the initial fallback.
- Sign-out stays `void signOut()`; the `(app)` guard handles the redirect.

**`AGENTS.md`**

- Update the Auth paragraph: full name + email + password sign-up, email-code verification at sign-up, email + password sign-in, device-trust code step, names enabled, passwords enabled with an 8-character minimum, password reset not offered.
- Update the route-group bullet only if wording changes; the guards and splash behavior stay.
- Keep "Auth screens and guards never render while Clerk is loading."

Done when the greeting shows the first name and the project memory matches the implementation.

## Verification

Run:

- `npx tsc --noEmit` — no errors.
- `npx expo lint` — no errors.
- `npx expo-doctor` — no dependency/config issues.
- Re-read the Clerk instance config: password enabled and required with min length 8; names enabled and optional; email `email_code` verification still on.

In the iOS simulator (`npx expo start`, press `i`):

1. Signed out, app opens on onboarding at `/`.
2. Sign-up with full name, `<name>+clerk_test@example.com`, and an 8+ character password → lands on verify; code `424242` → `/home`. The Clerk user has first and last name and a password.
3. Wrong code (`111111`) → inline error, boxes cleared, still on verify.
4. Let the countdown reach 0:00, tap "Resend code" → countdown restarts; a fresh code works.
5. Kill and relaunch the app → opens directly on `/home`, no auth flash.
6. Sign out → onboarding at `/`.
7. Sign in with the same email and password → `/home`. If Clerk asks for a device-trust code, the verify screen accepts `424242` and lands on `/home`.
8. Sign in with the wrong password → "That password isn't right" under the field.
9. Sign in with an unknown email → "We couldn't find an account" under the field; "Create account" opens sign-up.
10. Deep link `/home` while signed out → onboarding. While signed in, open `/sign-in` → `/home`.
11. Google: tap "Continue with Google" on onboarding → browser consent; cancel once → no error, stays put.
12. `git grep -n "123456\|MOCK_AUTH\|waitForMockAuth\|auth-context" src/` returns nothing.

## AGENTS.md updates

- **Who owns what → Auth:** Clerk is the source of truth; custom screens use full name + email + password at sign-up, 6-digit `email_code` verification, and email + password at sign-in; a device-trust challenge uses the same verify screen; sessions persist through `tokenCache`/SecureStore; Google is the only social option; `/home` is protected; sign-out lands on onboarding; passwords are enabled with an 8-character minimum and names are enabled.
- **Rules:** keep the rule that auth screens and guards never render while Clerk is loading. Replace any passwordless wording.

## Result

Passwords and names are live with the original custom screens. Sign-up collects full name, email, and password, sends a 6-digit `email_code`, and finalizes on the verify screen. Sign-in uses email + password, with `mode=trust` reusing the verify screen when Clerk requires device trust or a second factor.

Verified in the iOS simulator against the development instance:

- New sign-up with `Adrian Hajdin` / `room.qa2+clerk_test@example.com` / `roomtest123` → verify screen → code `424242` → `/home` greeting "Hey, Adrian"; Clerk user has first name `Adrian`, last name `Hajdin`, `password_enabled`, and a verified email.
- Duplicate email → "An account with this email already exists. Sign in instead." under the email field.
- 7-character password → "Use at least 8 characters" under the password field; no request sent.
- Correct password sign-in → `/home` with no challenge on the same client.
- Wrong password → "That password isn't right. Try again." under the password field.
- Unknown email → "We couldn't find an account with that email." under the email field.
- Kill and relaunch → opens directly on `/home`; signed-in deep link to `/sign-in` stays on `/home`.
- Sign out → onboarding at `/`; signed-out deep link to `/home` stays on onboarding.
- Clerk config re-read: password enabled and required with `min_length: 8`, names enabled and optional, email `email_code` verification on, Google enabled.

Not exercised: the `mode=trust` device-trust branch (the same client never challenged), the full Google round trip (requires the user's Google account; browser consent was reached in an earlier run), and the wrong-code/resend paths after the password revision (the verify screen's code handling is unchanged from the earlier email-code flow). Checks: `npx tsc --noEmit`, `npx expo lint`, and `npx expo-doctor` (20/20) pass; all temporary probes and test credentials were removed.
