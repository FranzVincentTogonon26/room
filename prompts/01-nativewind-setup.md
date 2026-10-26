# 01 · NativeWind 4.2.7 setup

Status: done

## Goal

NativeWind 4.2.7 (Tailwind CSS 3) is wired into Room, and the welcome screen is styled with `className` instead of `StyleSheet`, proving classes compile for native and web.

## Decisions

- Version: **nativewind 4.2.7** (npm `latest`, the version the provided docs describe). No v6 exists; v5 is only `5.0.0-rc.0` and is out of scope.
- Tailwind: **tailwindcss ^3.4.19** (latest v3), with `nativewind/preset`.
- Scope: install + configure + convert `src/app/index.tsx`. No other screens exist yet, and no custom Room theme is invented.
- Styling standard from now on: NativeWind `className` for component styles; `StyleSheet` only when a value cannot be expressed as a class (e.g. animated values).
- Tailwind `darkMode` stays at its default `"media"`, which follows the device scheme. `app.json` already has `userInterfaceStyle: "automatic"`. A manual light/dark toggle would need `darkMode: "class"` later.
- `global.css` lives at the repo root and is imported **once**, in `src/app/_layout.tsx`, as Expo Router and Expo's CSS docs require.
- `prettier-plugin-tailwindcss` is **not** added: the repo has no Prettier dependency or config, so the plugin would be unused. Add it only when Prettier is introduced.
- Reanimated 4.7.1 and react-native-safe-area-context 5.10.1 are already installed at SDK-compatible versions, so only NativeWind and Tailwind are new.
- Known upstream bug accepted for now: NativeWind 4.2.7 `animate-*` classes (especially infinite `animate-pulse` / `animate-spin`) keep running after unmount on RN 0.88. The setup will not use them; the rule is recorded in AGENTS.md.

## Out of scope

- NativeWind v5 / Tailwind 4 migration.
- A Room design-token theme (brand colors, radii, spacing, fonts) in `tailwind.config.js`.
- Converting any future screens; converting `src/app/index.tsx` is the only code change.
- Dark-mode palette and a theme toggle.
- Prettier and `prettier-plugin-tailwindcss`.
- Removing `StyleSheet` from screens that do not exist yet.

## Steps

### 1. Install dependencies

```bash
npx expo install nativewind@4.2.7
npx expo install --dev tailwindcss@^3.4.19 babel-preset-expo
```

Use `npx expo install` (per AGENTS.md), not `npm install`. `babel-preset-expo` is already present transitively; making it an explicit devDependency keeps `babel.config.js` honest.

Done when `package.json` has `nativewind` in `dependencies`, `tailwindcss` and `babel-preset-expo` in `devDependencies`, and `npm ls nativewind tailwindcss` is clean.

### 2. Tailwind config and entry CSS

Create `tailwind.config.js` at the repo root:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Create `global.css` at the repo root:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Done when both files exist and `content` covers every file that will hold classes (`src/` only, since `src/app/` is the router tree).

### 3. Babel and Metro wiring

Create `babel.config.js` (the repo has none today):

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

Create `metro.config.js` (the repo has none today):

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

Done when `node -e "require('./metro.config.js')"` exits 0.

Note: `app.json` has `experiments.reactCompiler: true`. If the React Compiler pass conflicts with NativeWind's JSX import source, stop and report instead of disabling the compiler unilaterally.

### 4. Import the stylesheet and declare the web bundler

In `src/app/_layout.tsx`, add the stylesheet as the first import:

```tsx
import "../../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
```

In `app.json`, make the web bundler explicit under the existing `web` key (docs step 6):

```json
"web": {
  "output": "server",
  "bundler": "metro",
  "favicon": "./assets/images/favicon.png"
}
```

Done when the root layout imports `global.css` before any other import and `app.json` still parses.

### 5. TypeScript declarations

Create `nativewind-env.d.ts` at the repo root:

```ts
/// <reference types="nativewind/types" />
```

`tsconfig.json` already includes `**/*.ts`, so no tsconfig change is needed. Do not name the file `nativewind.d.ts` or reuse a folder name.

Done when `npx tsc --noEmit` accepts `className` on React Native components (proven in step 6).

### 6. Convert the welcome screen

Replace `src/app/index.tsx` with:

```tsx
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">Welcome to Room</Text>
    </View>
  );
}
```

This keeps the existing copy and centered layout, and adds size/weight/color so a broken Tailwind compile is visible. Remove the now-unused `StyleSheet` import and styles object.

Done when the screen renders centered with blue, bold, larger text and no `StyleSheet` remains in the file.

### 7. Record the rules in AGENTS.md

Add to the **Expo** section:

- Styling is NativeWind `className`; `global.css` at the root is imported once in `src/app/_layout.tsx`, and `tailwind.config.js` `content` must include `src/`.
- Keep the NativeWind wiring in `babel.config.js` and `metro.config.js`; both files are required.
- Do not use `animate-*` classes on native until NativeWind fixes its unmount leak; use Reanimated hooks for infinite animations.

Nothing in AGENTS.md is replaced or removed by this plan.

## Verification

1. `npx tsc --noEmit` → passes, with `className` typed on `View`/`Text`.
2. `npx expo lint` → passes.
3. `npx expo-doctor` → passes.
4. `node -e "require('./metro.config.js')"` → exits 0.
5. `npx expo export --platform ios --output-dir .expo/export-check` → bundles without resolution or Babel errors; delete `.expo/export-check` afterwards.
6. `npx expo export --platform web --output-dir .expo/export-check-web` → web bundle succeeds; confirm the generated CSS contains `.bg-white` and `.text-blue-500`; delete the output afterwards.
7. Open the app in the iOS simulator (Expo Go), screenshot with `xcrun simctl io booted screenshot`, and confirm the text is centered, bold, blue, and on a white background. If Expo Go is unavailable, report the visual check as ❌ with the reason and rely on steps 5–6.
8. Negative check: run `npx tailwindcss --input ./global.css --output /tmp/room-tw-check.css` and confirm `.bg-white` exists, proving Tailwind compilation itself works independently of the runtime.

## AGENTS.md updates

Under **Expo**:

- NativeWind is the styling layer: use `className`, not `StyleSheet`, for component styles.
- `global.css` (root) is the Tailwind entry and is imported once in `src/app/_layout.tsx`; `tailwind.config.js` content covers `src/`.
- `babel.config.js` and `metro.config.js` must keep the NativeWind preset/`withNativeWind` wiring.
- No `animate-*` classes on native until the upstream unmount leak is fixed; use Reanimated hooks instead.

No existing rule is replaced.

## Result

NativeWind 4.2.7 and Tailwind CSS 3.4.19 are wired into Room, and the welcome screen renders from `className` on iOS, with the same classes present in the exported web CSS.

Files changed:

- `package.json` / `package-lock.json`: `nativewind@4.2.7`; dev deps `tailwindcss@^3.4.19`, `babel-preset-expo@~58.0.0`.
- `tailwind.config.js`: NativeWind preset, content `./src/**/*.{js,jsx,ts,tsx}`.
- `global.css`: Tailwind base/components/utilities.
- `babel.config.js`: `babel-preset-expo` with `jsxImportSource: "nativewind"` plus `nativewind/babel`.
- `metro.config.js`: `withNativeWind(config, { input: "./global.css" })`.
- `nativewind-env.d.ts`: `nativewind/types` reference.
- `src/app/_layout.tsx`: imports `../../global.css` first.
- `src/app/index.tsx`: `className` layout and text; `StyleSheet` removed.
- `app.json`: `web.bundler: "metro"`.
- `tsconfig.json`: `nativewind-env.d.ts` added automatically by `withNativeWind` when the config was loaded.
- `AGENTS.md`: styling standard, config wiring, and the `animate-*` rule.
- `eslint.config.js`, `eslint`/`eslint-config-expo` dev deps: created automatically by `npx expo lint` because the repo had no ESLint config. Lint now runs.

Deviations and notes:

- NativeWind 4.2.7 is tested against Expo SDK 57, but it bundled and rendered on SDK 58 / RN 0.88; the only known upstream defect is the `animate-*` unmount leak already recorded.
- `expo-router` logs a runtime deprecation warning for `ImageBackground` (library-internal, unrelated to this change).
- Node is 20.20.1, below SDK 58's required >= 22.13.0. Commands still ran with engine warnings only.
