import { useSignUp } from "@clerk/expo";
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

import {
  AppText,
  Button,
  GoogleMark,
  Icon,
  IconButton,
  Input,
} from "@/components/ui";
import { clerkErrorCode, clerkErrorMessage } from "@/lib/clerk-errors";
import { useGoogleAuth } from "@/lib/use-google-auth";
import { fontFamily, useThemeColors } from "@/theme";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateEmail(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "Email address is required";
  if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address";
  return "";
}

function validatePassword(value: string) {
  if (!value) return "Password is required";
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return "";
}

function splitFullName(value: string) {
  const parts = value.trim().split(/\s+/);
  const firstName = parts.shift() ?? "";

  return { firstName, lastName: parts.join(" ") };
}

function passwordErrorMessage(error: unknown) {
  switch (clerkErrorCode(error)) {
    case "form_password_length_too_short":
      return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    case "form_password_pwned":
    case "form_password_compromised":
      return "That password has appeared in a data breach. Choose a different one.";
    case "form_password_not_strong_enough":
    case "form_password_validation_failed":
      return "Choose a stronger password.";
    default:
      return "";
  }
}

export default function SignUpScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { signUp, fetchStatus } = useSignUp();
  const {
    signInWithGoogle,
    isPending: isGooglePending,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState("");
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

  const handleCreateAccount = async () => {
    if (isDisabled) return;

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const nextNameError = trimmedName ? "" : "Full name is required";
    const nextEmailError = validateEmail(trimmedEmail);
    const nextPasswordError = validatePassword(password);

    setNameError(nextNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError("");

    if (nextNameError || nextEmailError || nextPasswordError) return;

    const { firstName, lastName } = splitFullName(trimmedName);
    const { error } = await signUp.password({
      emailAddress: trimmedEmail,
      password,
      firstName,
      lastName: lastName || undefined,
    });

    if (error) {
      switch (clerkErrorCode(error)) {
        case "form_identifier_exists":
        case "form_identifier_exists__email_address":
          setEmailError(
            "An account with this email already exists. Sign in instead.",
          );
          return;
        case "form_password_length_too_short":
        case "form_password_pwned":
        case "form_password_compromised":
        case "form_password_not_strong_enough":
        case "form_password_validation_failed":
          setPasswordError(
            passwordErrorMessage(error) ||
              "We couldn't use that password. Try another.",
          );
          return;
        default:
          setFormError(
            clerkErrorMessage(
              error,
              "We couldn't start your account. Try again.",
            ),
          );
          return;
      }
    }

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: () => router.replace("/home"),
      });
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();

    if (sendError) {
      setFormError(
        clerkErrorMessage(sendError, "We couldn't send your code. Try again."),
      );
      return;
    }

    router.push({
      pathname: "/(auth)/verify",
      params: { email: trimmedEmail, mode: "sign-up" },
    });
  };

  const handleSignIn = () => {
    router.push("/(auth)/sign-in");
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
              {"Create\nyour account"}
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
              Join room to save your stays, get personalized recommendations and
              access them across all your devices.
            </AppText>
          </View>

          {/* Form Fields */}
          <View className="gap-3">
            <Input
              label="Full name"
              placeholder="e.g. Franz Vincent Togonon"
              leftIcon="user"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (nameError) setNameError("");
                if (formError) setFormError("");
                if (googleError) clearGoogleError();
              }}
              error={nameError}
              disabled={isDisabled}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              accessibilityLabel="Full name"
            />

            <Input
              label="Email address"
              placeholder="you@example.com"
              leftIcon="mail"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
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
              placeholder="At least 8 characters"
              leftIcon="lock"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError("");
                if (formError) setFormError("");
                if (googleError) clearGoogleError();
              }}
              error={passwordError}
              disabled={isDisabled}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={() => void handleCreateAccount()}
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
              label="Create account"
              variant="primary"
              rightIcon="arrowRight"
              onPress={() => void handleCreateAccount()}
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

          {/* Captcha mount point for web / future bot protection */}
          <View nativeID="clerk-captcha" />

          {/* Sign In Footer */}
          <View className="mt-6 flex-row items-center justify-center gap-1.5">
            <AppText variant="caption" tone="mutedForeground">
              Already have an account?
            </AppText>
            <Pressable
              onPress={handleSignIn}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
            >
              <AppText
                variant="caption"
                className="font-sans-semibold text-foreground underline"
              >
                Sign in
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
