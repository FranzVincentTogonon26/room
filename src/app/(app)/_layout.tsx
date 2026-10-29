import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { StatusBar } from "expo-status-bar";

import { fontFamily, typography, useThemeColors } from "@/theme";

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const colors = useThemeColors();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/" />;

  return (
    <>
      <StatusBar style="auto" />
      <NativeTabs
        tintColor={colors.primary}
        minimizeBehavior="never"
        labelStyle={{
          default: {
            fontFamily: typography.tab.fontFamily,
            fontSize: typography.tab.fontSize,
          },
          selected: {
            fontFamily: fontFamily.sansSemiBold,
            fontSize: typography.tab.fontSize,
          },
        }}
      >
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Icon
            sf={{ default: "house", selected: "house.fill" }}
            md="home"
          />
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="search">
          <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
          <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="trips">
          <NativeTabs.Trigger.Icon sf="calendar" md="calendar_today" />
          <NativeTabs.Trigger.Label>Trips</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon
            sf={{ default: "person", selected: "person.fill" }}
            md="person"
          />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
