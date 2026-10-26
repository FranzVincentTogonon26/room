import {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { Pressable, StyleSheet, View } from "react-native";

import { Icon, type IconName } from "@/components/ui/icon";
import { AppText } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { spacing, useThemeColors, useThemeScheme } from "@/theme";

export type GlassTabItem = {
  value: string;
  label: string;
  icon: IconName;
};

export type GlassTabBarProps = {
  items: GlassTabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function GlassTabBar({
  items,
  value,
  onChange,
  className,
}: GlassTabBarProps) {
  const colors = useThemeColors();
  const scheme = useThemeScheme();
  const glassAvailable =
    isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

  const content = (
    <>
      {items.map((item) => {
        const active = item.value === value;

        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.value)}
            className="h-full flex-1 items-center justify-center gap-1"
            style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}
          >
            {active && glassAvailable ? (
              /* Liquid glass pill: tinted with primary on selection */
              <GlassView
                glassEffectStyle="regular"
                tintColor={colors.primary}
                isInteractive
                colorScheme={scheme}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  borderCurve: "continuous",
                }}
              >
                {/* Subtle primary tint overlay to make the active selection clearly visible.
                    tintColor on glass material alone can be very subtle, especially with yellow. */}
                <View
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 32,
                    backgroundColor: "rgba(255, 198, 41, 0.18)",
                    borderCurve: "continuous",
                  }}
                />
                <Icon
                  name={item.icon}
                  size="lg"
                  color={colors.segmentSelectedForeground}
                  fill={
                    item.icon === "house"
                      ? colors.segmentSelectedForeground
                      : "none"
                  }
                />
                <AppText
                  variant="tab"
                  tone="segmentSelectedForeground"
                >
                  {item.label}
                </AppText>
              </GlassView>
            ) : (
              <View
                className={cn(
                  "h-16 w-16 items-center justify-center gap-1 rounded-full",
                  active && "bg-primary",
                )}
              >
                <Icon
                  name={item.icon}
                  size="lg"
                  color={
                    active
                      ? colors.segmentSelectedForeground
                      : colors.mutedForeground
                  }
                  fill={
                    active && item.icon === "house"
                      ? colors.segmentSelectedForeground
                      : "none"
                  }
                />
                <AppText
                  variant="tab"
                  tone={active ? "segmentSelectedForeground" : "mutedForeground"}
                >
                  {item.label}
                </AppText>
              </View>
            )}
          </Pressable>
        );
      })}
    </>
  );

  if (glassAvailable) {
    // GlassView is a native component without NativeWind support, so this one
    // container uses a style object from tokens. Children still use className.
    // GlassContainer provides the native compositor layer that lets child
    // GlassView instances render interactive liquid glass and tint properly.
    return (
      <View className={className}>
        <GlassContainer spacing={8}>
          <GlassView
            colorScheme={scheme}
            glassEffectStyle="regular"
            style={{
              width: "100%",
              height: spacing.tabbar,
              flexDirection: "row",
              alignItems: "center",
              borderRadius: spacing.tabbar / 2,
              borderCurve: "continuous",
              paddingHorizontal: 8,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.glassBorder,
            }}
          >
            {content}
          </GlassView>
        </GlassContainer>
      </View>
    );
  }

  return (
    <View
      className={cn(
        "h-tabbar flex-row items-center rounded-pill border border-glass-border bg-glass px-2 shadow-floating",
        className,
      )}
    >
      {content}
    </View>
  );
}
