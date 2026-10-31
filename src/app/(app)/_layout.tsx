import { useAuth } from "@clerk/expo";
import { NativeTabs } from "expo-router/native-tabs";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import { LiquidGlassTabBar } from "@/components/liquid-glass-tab-bar";
import { fontFamily, useThemeColors } from "@/theme";

const TABS: { name: string; label: string; icon: string }[] = [
  { name: "home", label: "Home", icon: "house" },
  { name: "search", label: "Search", icon: "magnifyingglass" },
  { name: "trips", label: "Trips", icon: "calendar" },
  { name: "profile", label: "Profile", icon: "person" },
];

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const colors = useThemeColors();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StatusBar style="auto" />
      {/* Decorative Liquid Glass pill with drag-effect motion, rendered behind
          the native tab bar so it shows through iOS 26's translucent bar. */}
      <LiquidGlassTabBar className="absolute bottom-0 left-0 right-0" />
      <NativeTabs
        tintColor={colors.primary}
        iconColor={{
          default: colors.mutedForeground,
          selected: colors.primary,
        }}
        labelStyle={{
          default: {
            fontFamily: fontFamily.sansMedium,
            fontSize: 12,
            color: colors.mutedForeground,
          },
          selected: {
            fontFamily: fontFamily.sansSemiBold,
            fontSize: 12,
            color: colors.primary,
          },
        }}
        minimizeBehavior="never"
      >
        {TABS.map((tab) => (
          <NativeTabs.Trigger
            key={tab.name}
            name={tab.name}
            accessibilityLabel={tab.label}
          >
            <NativeTabs.Trigger.Icon
              sf={tab.icon as any}
              md={tab.icon as any}
            />
            <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    </View>
  );
}
