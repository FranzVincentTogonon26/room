import { useAuth } from "@clerk/expo";
import { BlurTargetView } from "expo-blur";
import { Redirect, Tabs, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassTabBarSurface } from "@/components/glass-tab-bar";
import { Icon, type IconName } from "@/components/ui/icon";
import { AppText } from "@/components/ui/text";
import { useKeyboardVisible } from "@/lib/use-keyboard-visible";
import { useThemeColors } from "@/theme";

const TABS = [
  { name: "home", label: "Home", icon: "house", href: "/(app)/home" },
  { name: "search", label: "Search", icon: "search", href: "/(app)/search" },
  { name: "trips", label: "Trips", icon: "calendarDays", href: "/(app)/trips" },
  { name: "profile", label: "Profile", icon: "user", href: "/(app)/profile" },
] as const satisfies readonly {
  name: string;
  label: string;
  icon: IconName;
  href: string;
}[];

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 150,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

function LiquidGlassTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useThemeColors();
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>([]);
  
  const activeIndex = TABS.findIndex(
    (tab) => pathname === `/${tab.name}` || pathname.startsWith(`/${tab.name}/`)
  );
  
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(64);

  useEffect(() => {
    if (tabLayouts.length === TABS.length && activeIndex >= 0) {
      const layout = tabLayouts[activeIndex];
      if (layout) {
        indicatorX.value = withSpring(layout.x, SPRING_CONFIG);
        indicatorWidth.value = withSpring(layout.width, SPRING_CONFIG);
      }
    }
  }, [activeIndex, tabLayouts, indicatorX, indicatorWidth]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorX.value }],
      width: indicatorWidth.value,
    };
  });

  const haloStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: indicatorX.value },
        { scale: interpolate(indicatorWidth.value, [64, 80], [1, 1.08], Extrapolation.CLAMP) },
      ],
      width: indicatorWidth.value,
      opacity: 0.12,
    };
  });

  return (
    <View className="flex-1 flex-row items-center px-2 relative">
      {/* Liquid halo behind active tab */}
      <Animated.View
        style={[
          haloStyle,
          {
            position: "absolute",
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.primary,
          },
        ]}
        pointerEvents="none"
      />

      {/* Active indicator */}
      <Animated.View
        style={[
          indicatorStyle,
          {
            position: "absolute",
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
        pointerEvents="none"
      />

      {/* Tab buttons */}
      {TABS.map((tab, index) => {
        const active = index === activeIndex;

        return (
          <Pressable
            key={tab.name}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: active }}
            onPress={() => router.push(tab.href as any)}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              setTabLayouts((prev) => {
                const next = [...prev];
                next[index] = { x, width };
                return next;
              });
            }}
            className="h-full flex-1 items-center justify-center"
            style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}
          >
            <View className="items-center justify-center gap-1" style={{ zIndex: 1 }}>
              <Icon
                name={tab.icon}
                size="lg"
                color={active ? colors.primaryForeground : colors.foreground}
                fill={active && tab.icon === "house" ? colors.primaryForeground : "none"}
              />
              <AppText
                variant="tab"
                tone={active ? "primaryForeground" : "foreground"}
              >
                {tab.label}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function CustomTabBar() {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const blurTargetRef = useRef<ComponentRef<typeof View>>(null);

  return (
    <GlassTabBarSurface
      blurTarget={blurTargetRef}
      pointerEvents={keyboardVisible ? "none" : "auto"}
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: insets.bottom + 12,
        opacity: keyboardVisible ? 0 : 1,
        zIndex: 100,
      }}
    >
      <LiquidGlassTabBar />
    </GlassTabBarSurface>
  );
}

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const blurTargetRef = useRef<ComponentRef<typeof View>>(null);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/" />;

  return (
    <>
      <StatusBar style="auto" />
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
        >
          <Tabs.Screen name="home" />
          <Tabs.Screen name="search" />
          <Tabs.Screen name="trips" />
          <Tabs.Screen name="profile" />
        </Tabs>
        <CustomTabBar />
      </BlurTargetView>
    </>
  );
}
