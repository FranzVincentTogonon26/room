import { Platform } from "react-native";

import { rem, StyleSheet } from "nativewind";

import rawTokens from "./tokens.json";

/**
 * NativeWind resolves Tailwind's rem values against 14 on native. The design
 * scale is built on a 16 dp rem so `gap-2` is 8, `px-5` is 20, and the whole
 * numeric Tailwind scale lands on the 4-pt grid.
 */
rem.set(16);

export type ThemeScheme = "light" | "dark";
export type ThemeColors = typeof rawTokens.light;
export type TypeVariant = keyof typeof rawTokens.typography;

export const tokens = rawTokens;
export const palette = rawTokens.palette;
export const themeColors: Record<ThemeScheme, ThemeColors> = {
  light: rawTokens.light,
  dark: rawTokens.dark,
};
export const typography = rawTokens.typography;
export const spacing = rawTokens.spacing;
export const radius = rawTokens.radius;
export const shadows = rawTokens.shadows;
export const motion = rawTokens.motion;
export const iconTokens = rawTokens.icon;
export const fontFamily = rawTokens.fontFamily;

const RAW_COLOR_KEYS = new Set(["glass", "glassBorder"]);

const kebab = (key: string) => key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);

const channels = (hex: string) => {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const int = Number.parseInt(full, 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
};

const toCssVars = (colors: ThemeColors) =>
  Object.fromEntries(
    Object.entries(colors).map(([key, value]) => [
      `--color-${kebab(key)}`,
      RAW_COLOR_KEYS.has(key) ? value : channels(value),
    ]),
  );

export const lightVars = toCssVars(themeColors.light);
export const darkVars = toCssVars(themeColors.dark);

/**
 * Combined light/dark CSS variables for NativeWind's cssVariableObservable.
 * Each variable is a { light, dark } pair so NativeWind resolves the correct
 * value automatically when setColorScheme("light" | "dark") is called.
 * Registering at module scope ensures variables exist before any component
 * resolves them at render time.
 */
export const rootVars = Object.fromEntries(
  Object.entries(themeColors.light).map(([key, value]) => {
    const darkValue = themeColors.dark[key as keyof typeof themeColors.dark];
    return [
      `--color-${kebab(key)}`,
      {
        light: RAW_COLOR_KEYS.has(key) ? value : channels(value),
        dark: RAW_COLOR_KEYS.has(key) ? darkValue : channels(darkValue),
      },
    ];
  }),
);

/**
 * registerCompiled is native-only. On web, CSS variables flow through global.css
 * natively, and react-native-css-interop's web stylesheet throws if called.
 */
if (Platform.OS !== "web") {
  StyleSheet.registerCompiled({ $compiled: true, rootVariables: rootVars });
}
