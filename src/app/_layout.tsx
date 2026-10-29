import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import "../../global.css";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { ThemeProvider, fontFamily, useThemeColors } from "@/theme";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add your key to .env.local.\nRun: 1) clerk auth login  2) clerk link  3) clerk env pull — then restart the dev server.",
  );
}

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 240, fade: true });

const fontAssets = {
  "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
  "Poppins-Medium": require("../../assets/fonts/Poppins-Medium.ttf"),
  "Poppins-SemiBold": require("../../assets/fonts/Poppins-SemiBold.ttf"),
  "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
  "Poppins-ExtraBold": require("../../assets/fonts/Poppins-ExtraBold.ttf"),
};

function RootNavigator() {
  const { isLoaded } = useAuth();
  const colors = useThemeColors();
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontError) {
      // Keep the app usable with a system fallback instead of blocking on fonts.
      console.warn("Failed to load Poppins fonts", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isLoaded) {
      void SplashScreen.hide();
    }
  }, [fontsLoaded, fontError, isLoaded]);

  if ((!fontsLoaded && !fontError) || !isLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: fontFamily.sansSemiBold,
          color: colors.foreground,
        },
      }}
    >
      <Stack.Screen
        name="catalog"
        options={{
          headerShown: true,
          title: "Design system",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </ClerkProvider>
  );
}
