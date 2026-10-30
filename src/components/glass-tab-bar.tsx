import {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { BlurView } from "expo-blur";
import type { ComponentRef, PropsWithChildren, RefObject } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { Icon, type IconName } from "@/components/ui/icon";
import { AppText } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { spacing, useThemeColors, useThemeScheme } from "@/theme";

export type GlassTabItem = {
  value: string;
  label: string;
  icon: IconName;
};

export type GlassTabBarSurfaceProps = PropsWithChildren<{
  className?: string;
  style?: StyleProp<ViewStyle>;
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
  pointerEvents?: ViewProps["pointerEvents"];
}>;

export type GlassTabBarItemProps = {
  icon: IconName;
  label: string;
  active: boolean;
};

export type GlassTabBarProps = {
  items: GlassTabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  blurTarget?: RefObject<ComponentRef<typeof View> | null>;
};

const pillShape = {
  height: spacing.tabbar,
  borderRadius: spacing.tabbar / 2,
  borderCurve: "continuous",
} as const;

/**
 * The floating pill behind both the app tabs and the catalog preview.
 *
 * iOS 26 gets the native Liquid Glass material. Every other platform gets a
 * real frosted blur of the screen behind the bar, tinted with the bar tokens
 * so Android and older iOS look like the design.
 */
export function GlassTabBarSurface({
  children,
  className,
  style,
  blurTarget,
  pointerEvents,
}: GlassTabBarSurfaceProps) {
  const colors = useThemeColors();
  const scheme = useThemeScheme();
  const glassAvailable =
    isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

  return (
    <View
      className={cn("shadow-floating", className)}
      pointerEvents={pointerEvents}
      style={[pillShape, style]}
    >
      {glassAvailable ? (
        <GlassContainer spacing={8} style={{ flex: 1 }}>
          <GlassView
            colorScheme={scheme}
            glassEffectStyle="regular"
            isInteractive
            style={{
              flex: 1,
              borderRadius: spacing.tabbar / 2,
              borderCurve: "continuous",
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.glassBarBorder,
            }}
          >
            <View className="flex-1 flex-row items-center px-2">{children}</View>
          </GlassView>
        </GlassContainer>
      ) : (
        <View
          className="flex-1 overflow-hidden"
          style={{
            borderRadius: spacing.tabbar / 2,
            borderCurve: "continuous",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.glassBarBorder,
            backgroundColor: colors.glassBar,
          }}
        >
          <BlurView
            intensity={55}
            tint={scheme === "dark" ? "dark" : "light"}
            blurTarget={blurTarget}
            blurMethod={
              Platform.OS === "android" ? "dimezisBlurView" : undefined
            }
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />
          <View className="flex-1 flex-row items-center px-2">{children}</View>
        </View>
      )}
    </View>
  );
}

/**
 * One tab inside the bar. The selected tab is a yellow circle with a soft
 * yellow halo; everything inside it is the brand black.
 */
export function GlassTabBarItem({
  icon,
  label,
  active,
}: GlassTabBarItemProps) {
  const colors = useThemeColors();
  const contentColor = active ? colors.primaryForeground : colors.foreground;

  return (
    <View className="h-16 w-16 items-center justify-center">
      {active ? (
        <View className="absolute h-18 w-18 rounded-full bg-primary/25" />
      ) : null}

      <View
        className="h-16 w-16 items-center justify-center gap-1 rounded-full"
        style={active ? { backgroundColor: colors.primary } : undefined}
      >
        <Icon
          name={icon}
          size="lg"
          color={contentColor}
          fill={active && icon === "house" ? contentColor : "none"}
        />
        <AppText
          variant="tab"
          tone={active ? "primaryForeground" : "foreground"}
        >
          {label}
        </AppText>
      </View>
    </View>
  );
}

/**
 * Controlled preview used by `/catalog`. The app renders its own
 * `TabTrigger`s inside `GlassTabBarSurface` so routing stays in the layout.
 */
export function GlassTabBar({
  items,
  value,
  onChange,
  className,
  blurTarget,
}: GlassTabBarProps) {
  return (
    <GlassTabBarSurface className={className} blurTarget={blurTarget}>
      {items.map((item) => {
        const active = item.value === value;

        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.value)}
            className="h-full flex-1 items-center justify-center"
            style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}
          >
            <GlassTabBarItem
              icon={item.icon}
              label={item.label}
              active={active}
            />
          </Pressable>
        );
      })}
    </GlassTabBarSurface>
  );
}
