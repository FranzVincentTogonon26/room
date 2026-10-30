import { useAuth } from "@clerk/expo";
import { BlurTargetView } from "expo-blur";
import { Redirect } from "expo-router";
import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabTriggerSlotProps,
} from "expo-router/ui";
import { StatusBar } from "expo-status-bar";
import { useRef, type ComponentRef } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  GlassTabBarItem,
  GlassTabBarSurface,
} from "@/components/glass-tab-bar";
import type { IconName } from "@/components/ui";
import { useKeyboardVisible } from "@/lib/use-keyboard-visible";

const TABS = [
  { name: "home", label: "Home", icon: "house" },
  { name: "search", label: "Search", icon: "search" },
  { name: "trips", label: "Trips", icon: "calendarDays" },
  { name: "profile", label: "Profile", icon: "user" },
] as const satisfies readonly {
  name: string;
  label: string;
  icon: IconName;
}[];

type TabButtonProps = TabTriggerSlotProps & {
  icon: IconName;
  label: string;
};

function TabButton({
  icon,
  label,
  isFocused,
  href,
  style,
  ref: _ref,
  ...props
}: TabButtonProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(isFocused) }}
      className="h-full flex-1 items-center justify-center"
      style={({ pressed }) => (pressed ? { opacity: 0.75 } : null)}
    >
      <GlassTabBarItem icon={icon} label={label} active={Boolean(isFocused)} />
    </Pressable>
  );
}

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const blurTargetRef = useRef<ComponentRef<typeof View>>(null);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/" />;

  return (
    <>
      <StatusBar style="auto" />
      <Tabs>
        <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
          <TabSlot detachInactiveScreens={false} />
        </BlurTargetView>

        <GlassTabBarSurface
          blurTarget={blurTargetRef}
          pointerEvents={keyboardVisible ? "none" : "auto"}
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: insets.bottom + 12,
            opacity: keyboardVisible ? 0 : 1,
          }}
        >
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} asChild>
              <TabButton icon={tab.icon} label={tab.label} />
            </TabTrigger>
          ))}
        </GlassTabBarSurface>

        <TabList style={{ display: "none" }}>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={`/${tab.name}`} />
          ))}
        </TabList>
      </Tabs>
    </>
  );
}
