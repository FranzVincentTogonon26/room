import { StatusBar } from "expo-status-bar";
import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { useThemeScheme } from "./use-theme-colors";

/**
 * Provides the active color scheme.
 * Styling should use NativeWind semantic classes (bg-canvas, text-foreground, etc.)
 * and useThemeColors() for props that cannot take className (icon colors,
 * placeholderTextColor, native header options).
 *
 * CSS variables are registered with { light, dark } pairs in theme.ts via
 * StyleSheet.registerCompiled({ rootVariables }). NativeWind resolves the
 * correct value automatically when setColorScheme() changes the scheme —
 * no inline vars() injection is needed (React Native ignores CSS custom
 * properties in inline styles).
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useThemeScheme();

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {children}
    </View>
  );
}
