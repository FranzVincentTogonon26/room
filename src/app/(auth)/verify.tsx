import { useSignIn, useSignUp } from "@clerk/expo";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextInputInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button, Icon, IconButton } from "@/components/ui";
import { clerkErrorCode, clerkErrorMessage } from "@/lib/clerk-errors";
import { cn } from "@/lib/cn";
import { fontFamily, useThemeColors } from "@/theme";

const CODE_LENGTH = 6;
const INITIAL_COUNTDOWN = 30;

function verificationErrorMessage(error: unknown) {
  switch (clerkErrorCode(error)) {
    case "form_code_incorrect":
      return "That code isn't right. Check it and try again.";
    case "verification_expired":
    case "form_code_expired":
      return "That code expired. Send a new one.";
    default:
      return clerkErrorMessage(error, "We couldn't verify that code. Try again.");
  }
}

export default function VerifyOtpScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { email, mode: modeParam } = useLocalSearchParams<{
    email?: string;
    mode?: string;
  }>();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const mode = modeParam === "trust" ? "trust" : "sign-up";
  const targetEmail = email || "your email";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_COUNTDOWN);
  const [resendNotice, setResendNotice] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);

  // Countdown timer for resending code
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  // Focus input automatically on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(
        mode === "trust" ? "/(auth)/sign-in" : "/(auth)/sign-up",
      );
    }
  };

  const goHome = () => {
    router.replace("/home");
  };

  const failCode = (message: string) => {
    setIsVerifying(false);
    setCode("");
    setError(message);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleVerify = async (inputCode = code) => {
    if (isVerifying) return;

    if (inputCode.length < CODE_LENGTH) {
      setError(`Please enter all ${CODE_LENGTH} digits`);
      return;
    }

    setError("");
    setIsVerifying(true);

    if (mode === "trust") {
      const { error: verifyError } = await signIn.mfa.verifyEmailCode({
        code: inputCode,
      });

      if (verifyError) {
        failCode(verificationErrorMessage(verifyError));
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({ navigate: goHome });
        return;
      }

      failCode("That code didn't finish signing you in. Send a new one.");
      return;
    }

    const { error: verifyError } = await signUp.verifications.verifyEmailCode({
      code: inputCode,
    });

    if (verifyError) {
      failCode(verificationErrorMessage(verifyError));
      return;
    }

    if (signUp.status === "complete") {
      await signUp.finalize({ navigate: goHome });
      return;
    }

    failCode("That code didn't finish creating your account. Send a new one.");
  };

  const handleCodeChange = (text: string) => {
    if (isVerifying) return;

    // Only accept numeric digits up to 6 characters
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    setCode(cleaned);
    if (error) setError("");

    if (cleaned.length === CODE_LENGTH) {
      void handleVerify(cleaned);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending || isVerifying) return;
    setIsResending(true);
    setError("");

    const { error: resendError } =
      mode === "trust"
        ? await signIn.mfa.sendEmailCode()
        : await signUp.verifications.sendEmailCode();

    if (resendError) {
      setError(
        clerkErrorMessage(
          resendError,
          "We couldn't resend the code. Try again.",
        ),
      );
      setIsResending(false);
      return;
    }

    setSecondsLeft(INITIAL_COUNTDOWN);
    setError("");
    setResendNotice(true);
    setIsResending(false);
    setTimeout(() => {
      setResendNotice(false);
    }, 4000);
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
          {/* Header */}
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

          {/* Heading */}
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
              {"Verify your\nemail"}
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
              We&apos;ve sent a 6-digit confirmation code to{" "}
              <AppText
                variant="body"
                tone="foreground"
                style={{ fontFamily: fontFamily.sansSemiBold, fontSize: 15 }}
              >
                {targetEmail}
              </AppText>
              {mode === "trust"
                ? ". Enter it below to finish signing in."
                : ". Enter it below to activate your account."}
            </AppText>
          </View>

          {/* Hidden native input capturing all taps */}
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={handleCodeChange}
            editable={!isVerifying}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
            style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
            accessibilityLabel="6-digit verification code"
          />

          {/* 6-box OTP digits */}
          <Pressable
            onPress={() => inputRef.current?.focus()}
            disabled={isVerifying}
            className="flex-row items-center justify-between gap-2.5 py-2"
          >
            {Array.from({ length: CODE_LENGTH }).map((_, index) => {
              const digit = code[index] || "";
              const isCurrent = index === code.length;
              const isFilled = Boolean(digit);

              return (
                <View
                  key={index}
                  className={cn(
                    "h-16 flex-1 items-center justify-center rounded-field border-2",
                    error
                      ? "border-error bg-error-surface/20"
                      : isCurrent
                        ? "border-focus-ring bg-focus"
                        : isFilled
                          ? "border-foreground bg-card"
                          : "border-border bg-muted",
                  )}
                >
                  <AppText
                    variant="title"
                    tone={error ? "errorForeground" : "foreground"}
                    style={{
                      fontFamily: fontFamily.sansBold,
                      fontSize: 24,
                      lineHeight: 28,
                    }}
                  >
                    {digit}
                  </AppText>
                </View>
              );
            })}
          </Pressable>

          {/* Error Message */}
          {error ? (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Icon name="circleAlert" size={15} color={colors.error} />
              <AppText variant="caption" tone="errorForeground">
                {error}
              </AppText>
            </View>
          ) : null}

          {/* Resend Notice */}
          {resendNotice ? (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Icon name="check" size={15} color={colors.success} />
              <AppText variant="caption" tone="successForeground">
                New verification code sent to your email!
              </AppText>
            </View>
          ) : null}

          {/* Action button */}
          <Button
            label="Verify & continue"
            variant="primary"
            rightIcon="arrowRight"
            onPress={() => void handleVerify()}
            loading={isVerifying}
            disabled={code.length < CODE_LENGTH || isVerifying}
            className="mt-6 h-[54px]"
          />

          {/* Resend Countdown Timer */}
          <View className="mt-6 flex-row items-center justify-center">
            {secondsLeft > 0 ? (
              <AppText variant="caption" tone="mutedForeground">
                Resend code in{" "}
                <AppText
                  variant="caption"
                  tone="foreground"
                  style={{ fontFamily: fontFamily.sansSemiBold }}
                >
                  {Math.floor(secondsLeft / 60)}:
                  {secondsLeft % 60 < 10
                    ? `0${secondsLeft % 60}`
                    : secondsLeft % 60}
                </AppText>
              </AppText>
            ) : (
              <View className="flex-row items-center gap-1.5">
                <AppText variant="caption" tone="mutedForeground">
                  Didn&apos;t receive the code?
                </AppText>
                {isResending ? (
                  <View className="flex-row items-center gap-1.5">
                    <ActivityIndicator
                      size="small"
                      color={colors.mutedForeground}
                    />
                    <AppText variant="caption" tone="mutedForeground">
                      Sending…
                    </AppText>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => void handleResend()}
                    accessibilityRole="button"
                    accessibilityLabel="Resend verification code"
                  >
                    <AppText
                      variant="caption"
                      className="font-sans-semibold text-foreground underline"
                    >
                      Resend code
                    </AppText>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
