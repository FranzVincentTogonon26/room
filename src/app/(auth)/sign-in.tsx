import { useSignIn } from "@clerk/expo";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button, GoogleMark, Icon, IconButton, Input } from "@/components/ui";
import { clerkErrorCode, clerkErrorMessage } from "@/lib/clerk-errors";
import { useGoogleAuth } from "@/lib/use-google-auth";
import { fontFamily, useThemeColors } from "@/theme";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address.";
  return "";
}

function validatePassword(value: string) {
  if (!value) return "Enter your password.";
  return "";
}

export default function SignInScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { signIn, fetchStatus } = useSignIn();
  const {
    signInWithGoogle,
    isPending: isGooglePending,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const isLoading = fetchStatus === "fetching";
  const isDisabled = isLoading || isGooglePending;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleSignIn = async () => {
    if (isDisabled) return;

    const trimmedEmail = email.trim().toLowerCase();
    const nextEmailError = validateEmail(trimmedEmail);
    const nextPasswordError = validatePassword(password);

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError("");

    if (nextEmailError || nextPasswordError) return;

    const { error } = await signIn.password({
      emailAddress: trimmedEmail,
      password,
    });

    if (error) {
      switch (clerkErrorCode(error)) {
        case "form_identifier_not_found":
          setEmailError("We couldn't find an account with that email.");
          return;
        case "form_password_incorrect":
        case "form_password_or_identifier_incorrect":
          setPasswordError("That password isn't right. Try again.");
          return;
        default:
          setFormError(
            clerkErrorMessage(error, "We couldn't sign you in. Try again."),
          );
          return;
      }
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: () => router.replace("/home"),
      });
      return;
    }

    if (
      signIn.status === "needs_client_trust" ||
      signIn.status === "needs_second_factor"
    ) {
      const { error: sendError } = await signIn.mfa.sendEmailCode();

      if (sendError) {
        setFormError(
          clerkErrorMessage(
            sendError,
            "We couldn't send a verification code. Try again.",
          ),
        );
        return;
      }

      router.push({
        pathname: "/(auth)/verify",
        params: { email: trimmedEmail, mode: "trust" },
      });
      return;
    }

    setFormError("We couldn't finish signing you in. Try again.");
  };

  const handleSignUp = () => {
    router.push("/(auth)/sign-up");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-card"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 24),
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header: Back button on left, room wordmark on right */}
          <View className="mb-6 flex-row items-center justify-between">
            <IconButton
              icon="chevronLeft"
              label="Back"
              size="sm"
              variant="surface"
              onPress={handleBack}
            />

            <AppText
              variant="heading"
              tone="foreground"
              style={{
                fontFamily: fontFamily.sansExtraBold,
                fontSize: 28,
                letterSpacing: -1,
              }}
            >
              room
            </AppText>
          </View>

          {/* Heading and Subtitle */}
          <View className="mb-6">
            <AppText
              variant="heading"
              tone="foreground"
              style={{
                fontFamily: fontFamily.sansBold,
                fontSize: 34,
                lineHeight: 40,
                letterSpacing: -0.6,
              }}
            >
              {"Welcome\nback"}
            </AppText>
            <AppText
              variant="body"
              tone="mutedForeground"
              style={{
                fontFamily: fontFamily.sans,
                fontSize: 15,
                lineHeight: 22,
                marginTop: 8,
              }}
            >
              Sign in to access your saved stays and personalized recommendations.
            </AppText>
          </View>

          {/* Form Fields */}
          <View className="gap-3">
            <Input
              label="Email address"
              placeholder="you@example.com"
              leftIcon="mail"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) setEmailError("");
                if (formError) setFormError("");
                if (googleError) clearGoogleError();
              }}
              error={emailError}
              disabled={isDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              accessibilityLabel="Email address"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              leftIcon="lock"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError("");
                if (formError) setFormError("");
                if (googleError) clearGoogleError();
              }}
              error={passwordError}
              disabled={isDisabled}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => void handleSignIn()}
              accessibilityLabel="Password"
            />

            {/* Global Clerk error */}
            {formError ? (
              <View className="flex-row items-center gap-1.5">
                <Icon name="circleAlert" size={15} color={colors.error} />
                <AppText variant="caption" tone="errorForeground">
                  {formError}
                </AppText>
              </View>
            ) : null}

            {/* Primary Action */}
            <Button
              label="Sign in"
              variant="primary"
              rightIcon="arrowRight"
              onPress={() => void handleSignIn()}
              loading={isLoading}
              disabled={isDisabled}
              className="mt-2 h-[54px]"
            />
          </View>

          {/* Divider */}
          <View className="my-5 flex-row items-center gap-4">
            <View className="h-[1px] flex-1 bg-border" />
            <AppText variant="caption" tone="mutedForeground">
              or
            </AppText>
            <View className="h-[1px] flex-1 bg-border" />
          </View>

          {/* Social Auth */}
          <View className="gap-3">
            <Button
              label="Continue with Google"
              variant="secondary"
              leftElement={<GoogleMark size={20} />}
              onPress={() => void signInWithGoogle()}
              loading={isGooglePending}
              disabled={isDisabled}
              className="h-[54px]"
            />

            {googleError ? (
              <View className="flex-row items-center gap-1.5">
                <Icon name="circleAlert" size={15} color={colors.error} />
                <AppText variant="caption" tone="errorForeground">
                  {googleError}
                </AppText>
              </View>
            ) : null}
          </View>

          {/* Sign Up Footer */}
          <View className="mt-6 flex-row items-center justify-center gap-1.5">
            <AppText variant="caption" tone="mutedForeground">
              Don&apos;t have an account?
            </AppText>
            <Pressable
              onPress={handleSignUp}
              accessibilityRole="link"
              accessibilityLabel="Create account"
            >
              <AppText
                variant="caption"
                className="font-sans-semibold text-foreground underline"
              >
                Create account
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
