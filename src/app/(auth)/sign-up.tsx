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
  AppleMark,
  AppText,
  Button,
  GoogleMark,
  IconButton,
  Input,
} from "@/components/ui";
import { fontFamily, useThemeColors } from "@/theme";

export default function SignUpScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleCreateAccount = () => {
    // Presentation / mock entry point: progress into app
    router.replace("/");
  };

  const handleGoogleSignUp = () => {
    router.replace("/");
  };

  const handleAppleSignUp = () => {
    router.replace("/");
  };

  const handleSignIn = () => {
    // Sign-in link
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
              Join room to save your stays, get personalized recommendations and access
              them across all your devices.
            </AppText>
          </View>

          {/* Form Fields */}
          <View className="gap-3">
            <Input
              label="Full name"
              placeholder="e.g. Adrian Hajdin"
              leftIcon="user"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              accessibilityLabel="Full name"
            />

            <Input
              label="Email address"
              placeholder="you@example.com"
              leftIcon="mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email address"
            />

            <Input
              label="Password"
              placeholder="At least 8 characters"
              leftIcon="lock"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel="Password"
            />

            {/* Primary Action */}
            <Button
              label="Create account"
              variant="primary"
              rightIcon="arrowRight"
              onPress={handleCreateAccount}
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

          {/* Social Auth Options */}
          <View className="gap-3">
            <Button
              label="Continue with Google"
              variant="secondary"
              leftElement={<GoogleMark size={20} />}
              onPress={handleGoogleSignUp}
              className="h-[54px]"
            />

            <Button
              label="Continue with Apple"
              variant="secondary"
              leftElement={<AppleMark size={20} color={colors.foreground} />}
              onPress={handleAppleSignUp}
              className="h-[54px]"
            />
          </View>

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
              <AppText variant="caption" className="font-sans-semibold text-foreground underline">
                Sign in
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
