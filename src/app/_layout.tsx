import "../../global.css";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { ThemeProvider, fontFamily, useThemeColors } from "@/theme";

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
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.canvas },
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fontFamily.sansSemiBold, color: colors.foreground },
      }}
    />
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);

  useEffect(() => {
    if (error) {
      // Keep the app usable with a system fallback instead of blocking on fonts.
      console.warn("Failed to load Poppins fonts", error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hide();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
