import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { Icon, type IconName } from "@/components/ui/icon";
import { AppText } from "@/components/ui/text";
import type { Stay } from "@/data/stays";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/theme/use-theme-colors";

export type SearchStayCardProps = {
  stay: Stay;
  saved: boolean;
  onToggleSave: () => void;
  className?: string;
};

function amenityIcon(label: string): IconName {
  const value = label.toLowerCase();

  if (value.includes("hot tub")) return "bath";
  if (/pet|dog/.test(value)) return "pawPrint";
  if (value.includes("pool")) return "waves";
  if (value.includes("view")) return "mountain";
  if (value.includes("fireplace")) return "flame";
  if (value.includes("wi-fi")) return "wifi";

  return "check";
}

/**
 * Amenities that read well as two pills: the design shows the stay's most
 * distinctive features, not necessarily the first two listed.
 */
const AMENITY_PRIORITY = [
  { pattern: /hot tub/i, rank: 0 },
  { pattern: /pet|dog/i, rank: 1 },
  { pattern: /pool/i, rank: 2 },
  { pattern: /view/i, rank: 3 },
  { pattern: /fireplace/i, rank: 4 },
  { pattern: /wi-fi/i, rank: 5 },
] as const;

function featuredAmenities(amenities: string[]) {
  const rank = (label: string) =>
    AMENITY_PRIORITY.find(({ pattern }) => pattern.test(label))?.rank ?? 6;

  return [...amenities].sort((a, b) => rank(a) - rank(b)).slice(0, 2);
}

/** Title-cases each word while leaving already-uppercase parts (Wi-Fi) alone. */
function titleCase(label: string) {
  return label.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

/**
 * Compact search result row: photo on the left, stay facts on the right.
 * The heart is the only interactive element until a detail route exists.
 */
export function SearchStayCard({
  stay,
  saved,
  onToggleSave,
  className,
}: SearchStayCardProps) {
  const colors = useThemeColors();
  const amenities = featuredAmenities(stay.amenities).map((amenity) => ({
    icon: amenityIcon(amenity),
    label: titleCase(amenity),
  }));

  return (
    <View className={cn("flex-row", className)} style={{ gap: 12 }}>
      <View className="h-39 w-36 overflow-hidden rounded-tile bg-muted">
        <Image
          source={{ uri: stay.image }}
          contentFit="cover"
          transition={200}
          style={{ width: "100%", height: "100%" }}
          accessibilityIgnoresInvertColors
        />
      </View>

      <View className="flex-1 justify-between">
        <View className="gap-1">
          <View className="flex-row items-start" style={{ gap: 8 }}>
            <AppText variant="cardTitleCompact" numberOfLines={2} className="flex-1">
              {stay.title}
            </AppText>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                saved ? `Remove ${stay.title} from saved stays` : `Save ${stay.title}`
              }
              accessibilityState={{ selected: saved }}
              hitSlop={4}
              onPress={onToggleSave}
              className="h-11 w-11 items-center justify-center rounded-full bg-muted"
              style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
            >
              <Icon
                name="heart"
                size={22}
                color={saved ? colors.error : colors.foreground}
                fill={saved ? colors.error : "none"}
              />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Icon name="mapPin" size={14} color={colors.mutedForeground} />
            <AppText
              variant="caption"
              tone="mutedForeground"
              numberOfLines={1}
              className="flex-1"
            >
              {stay.location}
            </AppText>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Icon name="star" size={16} color={colors.star} fill={colors.star} />
            <AppText variant="label">{stay.rating}</AppText>
            <AppText variant="caption" tone="mutedForeground">
              ({stay.reviewCount})
            </AppText>
          </View>

          {amenities.length > 0 ? (
            <View className="mt-1 flex-row" style={{ gap: 6 }}>
              {amenities.map((amenity) => (
                <View
                  key={amenity.label}
                  className="h-6 min-w-0 shrink flex-row items-center gap-1 rounded-pill bg-muted px-[10px]"
                >
                  <Icon name={amenity.icon} size={14} color={colors.foreground} />
                  <AppText variant="badge" numberOfLines={1} className="shrink">
                    {amenity.label}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View className="flex-row items-baseline gap-1">
          <AppText variant="price">${stay.price}</AppText>
          <AppText variant="caption" tone="mutedForeground">
            / night
          </AppText>
        </View>
      </View>
    </View>
  );
}
