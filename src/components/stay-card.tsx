import { Image } from "expo-image";
import { View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { AppText } from "@/components/ui/text";
import type { Stay } from "@/data/stays";
import { cn } from "@/lib/cn";
import { palette, useThemeColors } from "@/theme";

export type StayCardProps = {
  stay: Stay;
  className?: string;
};

/**
 * Full-width photo card used on Home and Search. The card is display-only
 * until a stay detail route exists, so it is not a Pressable.
 */
export function StayCard({ stay, className }: StayCardProps) {
  const colors = useThemeColors();

  return (
    <View
      accessible
      accessibilityLabel={`${stay.title}, ${stay.location}, rated ${stay.rating} of 5, $${stay.price} per night`}
      className={cn("h-72 overflow-hidden rounded-card bg-muted", className)}
    >
      <Image
        source={{ uri: stay.image }}
        contentFit="cover"
        transition={200}
        style={{ width: "100%", height: "100%" }}
        accessibilityIgnoresInvertColors
      />

      <View
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to top, ${palette.imageScrim} 0%, transparent 70%)`,
        }}
      />

      <View className="absolute right-4 top-4 h-11 flex-row items-center gap-1.5 rounded-pill bg-card px-4">
        <Icon name="star" size={16} color={colors.star} fill={colors.star} />
        <AppText variant="label" tone="foreground">
          {stay.rating}
        </AppText>
      </View>

      <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-between p-5">
        <View className="max-w-[60%] flex-1 pr-3">
          <View className="flex-row items-center gap-1.5">
            <Icon name="mapPin" size={14} color={colors.onImage} />
            <AppText variant="caption" tone="onImage" numberOfLines={1}>
              {stay.location}
            </AppText>
          </View>
          <AppText
            variant="cardTitle"
            tone="onImage"
            numberOfLines={2}
            className="mt-1"
          >
            {stay.title}
          </AppText>
        </View>

        <View className="h-12 w-12 items-center justify-center rounded-full bg-card">
          <Icon name="chevronRight" size={22} color={colors.foreground} />
        </View>
      </View>
    </View>
  );
}
