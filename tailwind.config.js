const tokens = require("./src/theme/tokens.json");

const kebab = (key) => key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const cssVar = (key) => `--color-${kebab(key)}`;
const RAW_COLOR_KEYS = new Set(["glass", "glassBorder"]);

const channels = (hex) => {
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

const colorValue = (key) =>
  RAW_COLOR_KEYS.has(key) ? `var(${cssVar(key)})` : `rgb(var(${cssVar(key)}) / <alpha-value>)`;

const semanticColors = Object.fromEntries(
  Object.keys(tokens.light).map((key) => [kebab(key), colorValue(key)]),
);

const rootVars = Object.fromEntries(
  Object.entries(tokens.light).map(([key, value]) => [
    cssVar(key),
    RAW_COLOR_KEYS.has(key) ? value : channels(value),
  ]),
);

const fontFamily = Object.fromEntries(
  Object.entries(tokens.fontFamily).map(([key, value]) => [kebab(key), [value]]),
);

const spacing = Object.fromEntries(
  Object.entries(tokens.spacing).map(([key, value]) => [key, `${value}px`]),
);

const borderRadius = Object.fromEntries(
  Object.entries(tokens.radius).map(([key, value]) => [key, `${value}px`]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    // Shadow color utilities collide with shadow size names that are also
    // colors (shadow-card), so only size-based shadows are supported.
    boxShadowColor: {},
    extend: {
      colors: semanticColors,
      fontFamily,
      spacing,
      borderRadius,
      boxShadow: tokens.shadows,
      elevation: tokens.elevation,
    },
  },
  plugins: [
    ({ addBase }) =>
      addBase({
        ":root": rootVars,
      }),
  ],
};
