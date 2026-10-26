import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { Badge } from "@/components/ui/badge";
import { Icon, type IconName } from "@/components/ui/icon";
import { AppText } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/theme/use-theme-colors";

export type ListingAmenity = {
  icon: IconName;
  label: string;
};

export type ListingCardProps = {
  title: string;
  location: string;
  rating: number;
  reviewCount?: number;
  price: number;
  imageUri: string;
  amenities?: ListingAmenity[];
  saved?: boolean;
  onToggleSave?: () => void;
  onPress?: () => void;
  className?: string;
};

export function ListingCard({
  title,
  location,
  rating,
  reviewCount,
  price,
  imageUri,
  amenities = [],
  saved = false,
  onToggleSave,
  onPress,
  className,
}: ListingCardProps) {
  const colors = useThemeColors();
  const accessibilityLabel = [
    title,
    location,
    `${rating} stars`,
    `$${price} per night`,
  ].join(", ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={cn(
        "flex-row rounded-card border border-transparent bg-card p-3 shadow-card dark:border-border",
        className,
      )}
      style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
    >
      <View className="h-32 w-32 overflow-hidden rounded-tile bg-muted">
        <Image
          source={{ uri: imageUri }}
          contentFit="cover"
          transition={150}
          style={{ width: "100%", height: "100%" }}
          accessibilityIgnoresInvertColors
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${title} from saved stays` : `Save ${title}`}
          accessibilityState={{ selected: saved }}
          hitSlop={6}
          onPress={onToggleSave}
          className="absolute right-2 top-2 h-10 w-10 items-center justify-center rounded-full bg-card shadow-floating"
        >
          <Icon
            name="heart"
            size="md"
            color={saved ? colors.error : colors.foreground}
            fill={saved ? colors.error : "none"}
          />
        </Pressable>
      </View>

      <View className="ml-3 flex-1 justify-center gap-2">
        <AppText variant="title" numberOfLines={2}>
          {title}
        </AppText>

        <View className="flex-row items-center gap-1.5">
          <Icon name="mapPin" size="sm" color={colors.subtleForeground} />
          <AppText variant="caption" tone="subtleForeground" numberOfLines={1} className="flex-1">
            {location}
          </AppText>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Icon name="star" size="sm" color={colors.star} fill={colors.star} />
          <AppText variant="label">{rating}</AppText>
          {reviewCount !== undefined ? (
            <AppText variant="caption">({reviewCount})</AppText>
          ) : null}
        </View>

        {amenities.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {amenities.map((amenity) => (
              <Badge key={amenity.label} label={amenity.label} icon={amenity.icon} />
            ))}
          </View>
        ) : null}

        <View className="flex-row items-baseline gap-1">
          <AppText variant="price">${price}</AppText>
          <AppText variant="caption" tone="subtleForeground">
            / night
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
