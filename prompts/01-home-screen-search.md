# Home Screen & Search Implementation Plan

## Goals
1. Build home screen matching the design (hero, search field, category chips, featured stays)
2. Fix navigation from home → search to pass both query and category
3. Search screen receives and uses category parameter
4. Add subtle smooth animations per expo-animation skill

## Current State
- Home screen exists with basic structure
- Search screen exists but doesn't receive category from home
- Stay cards show all stays filtered by category (not featured)
- Navigation only passes query, not category

## Changes Needed

### 1. Home Screen (`src/components/home-screen.tsx`)
- Show featured stays instead of all stays for category
- Pass both query and category to search screen on submit
- Add entrance animations using `FadeInDown` with stagger (30-80ms per item)
- Use `usePressScale` for press feedback on chips and buttons
- Reduce motion support

### 2. Search Screen (`src/components/search-screen.tsx`)
- Accept category from route params (not just query)
- Initialize category state from params
- Add entrance animations for list

### 3. Data (`src/data/stays.ts`)
- Add `getFeaturedStays` function to get featured stays
- Keep existing search/filter functions

### 4. Animations (per expo-animation skill)
- **Frequency gate**: Home screen entrance = occasional (standard animation), press feedback = tens/day (near-imperceptible)
- **Tool**: Reanimated CSS transitions for press, `entering` layout animations for mount
- **Properties**: transform (scale) + opacity only
- **Duration**: Press 100-150ms, entrance stagger 40ms
- **Thread**: UI thread via Reanimated worklets
- **Reduced motion**: Use `ReduceMotion.System`

## Verification
- TypeScript compiles
- ESLint passes
- Expo Doctor passes
- Home screen shows featured stays
- Search navigates with query + category
- Animations smooth on device