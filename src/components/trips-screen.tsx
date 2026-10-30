import { useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button, Icon } from "@/components/ui";
import { useThemeColors } from "@/theme";

export function TripsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-card px-5"
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 100,
      }}
    >
      <AppText variant="heading">Trips</AppText>

      <View className="flex-1 items-center justify-center px-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon name="calendarDays" size={28} color={colors.mutedForeground} />
        </View>
        <AppText variant="title" className="mt-4">
          No trips yet
        </AppText>
        <AppText variant="caption" className="mt-1 text-center">
          When you book a stay, it will show up here.
        </AppText>
        <Button
          label="Explore stays"
          onPress={() => router.navigate("/home")}
          className="mt-6"
        />
      </View>
    </View>
  );
}
