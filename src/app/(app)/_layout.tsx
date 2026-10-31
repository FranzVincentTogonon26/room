import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import { StaysProvider } from "@/data/stays-provider";
import { useThemeColors } from "@/theme";

export const unstable_settings = { initialRouteName: "(tabs)" };

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const colors = useThemeColors();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/" />;

  return (
    <StaysProvider>
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="stay/[id]"
            options={{ animation: "slide_from_right" }}
          />
        </Stack>
      </View>
    </StaysProvider>
  );
}
