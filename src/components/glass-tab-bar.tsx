import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
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

export function GlassTabBar({ items, value, onChange, className }: GlassTabBarProps) {
  const colors = useThemeColors();
  const scheme = useThemeScheme();
  const glassAvailable = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

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
            <View className="h-12 w-12 items-center justify-center rounded-full">
              {active ? (
                <View className="absolute h-16 w-16 rounded-full bg-primary/20" />
              ) : null}
              <View
                className={cn(
                  "h-12 w-12 items-center justify-center rounded-full",
                  active && "bg-primary",
                )}
              >
                <Icon name={item.icon} size="lg" color={colors.foreground} />
              </View>
            </View>
            <AppText variant="tab" tone="foreground">
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </>
  );

  if (glassAvailable) {
    // GlassView is a native component without NativeWind support, so this one
    // container uses a style object from tokens. Children still use className.
    return (
      <View className={className}>
        <GlassView
          colorScheme={scheme}
          glassEffectStyle="regular"
          style={{
            width: "100%",
            height: spacing.tabbar,
            flexDirection: "row",
            alignItems: "center",
            borderRadius: spacing.tabbar / 2,
            paddingHorizontal: 8,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.glassBorder,
          }}
        >
          {content}
        </GlassView>
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
