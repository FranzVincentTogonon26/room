import { useColorScheme } from "nativewind";
import { themeColors, type ThemeColors, type ThemeScheme } from "./theme";

export function useThemeScheme(): ThemeScheme {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? "dark" : "light";
}

/**
 * JavaScript color values for props that cannot take a className, such as
 * Lucide icon colors, TextInput placeholderTextColor, and native header options.
 */
export function useThemeColors(): ThemeColors {
  return themeColors[useThemeScheme()];
}
