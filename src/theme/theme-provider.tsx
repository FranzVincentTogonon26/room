import { StatusBar } from "expo-status-bar";
import { vars } from "nativewind";
import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { darkVars, lightVars, themeColors } from "./theme";
import { useThemeScheme } from "./use-theme-colors";

/**
 * Injects the active scheme's CSS variables for className colors and paints
 * the canvas for JS consumers (native Stack and headers) that sit above the
 * screen tree.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useThemeScheme();
  const colors = themeColors[scheme];

  return (
    <View style={[vars(scheme === "dark" ? darkVars : lightVars), { flex: 1, backgroundColor: colors.canvas }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {children}
    </View>
  );
}
