import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";

import { Icon, type IconName } from "@/components/ui/icon";
import { AppText } from "@/components/ui/text";
import type { Stay } from "@/data/stays";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/theme/use-theme-colors";

export type SearchStayCardProps = {
  stay: Stay;
  saved: boolean;
  onToggleSave: () => void;
  onPress?: () => void;
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
 * distinctive features, not necessarily the first two listed. Live stays keep
 * pet and quiet as booleans, so those become pills of their own.
 */
const AMENITY_PRIORITY = [
  { pattern: /hot tub/i, rank: 0 },
  { pattern: /pet|dog/i, rank: 1 },
  { pattern: /pool/i, rank: 2 },
  { pattern: /view/i, rank: 3 },
  { pattern: /fireplace/i, rank: 4 },
  { pattern: /quiet/i, rank: 5 },
  { pattern: /wi-fi/i, rank: 6 },
] as const;

function featuredAmenities(stay: Stay) {
  const rank = (label: string) =>
    AMENITY_PRIORITY.find(({ pattern }) => pattern.test(label))?.rank ?? 7;

  const candidates = [
    ...stay.amenities.map((amenity) => ({
      icon: amenityIcon(amenity),
      label: titleCase(amenity),
    })),
    ...(stay.petsAllowed ? [{ icon: "pawPrint" as const, label: "Pet Friendly" }] : []),
    ...(stay.quiet ? [{ icon: "moon" as const, label: "Quiet" }] : []),
  ];
  const seen = new Set<string>();

  return candidates
    .sort((a, b) => rank(a.label) - rank(b.label))
    .filter((pill) => {
      const key = pill.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 2);
}

/** Title-cases each word while leaving already-uppercase parts (Wi-Fi) alone. */
function titleCase(label: string) {
  return label.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

/**
 * Compact search result row: photo on the left, stay facts on the right.
 * Tapping the card navigates to the stay detail screen; the heart button
 * toggles the saved state independently.
 */
export function SearchStayCard({
  stay,
  saved,
  onToggleSave,
  onPress,
  className,
}: SearchStayCardProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const amenities = featuredAmenities(stay);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/stay/${stay.id}`);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${stay.title}, ${stay.location}, rated ${stay.rating} of 5, $${stay.price} per night`}
      onPress={handlePress}
      className={cn("flex-row gap-3.5 rounded-field bg-card p-1 shadow-card", className)}
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
    >
      <View className="h-38 w-36 overflow-hidden rounded-tile bg-muted">
        <Image
          source={{ uri: stay.image }}
          contentFit="cover"
          transition={200}
          style={{ width: "100%", height: "100%" }}
          accessibilityIgnoresInvertColors
        />
      </View>

      <View className="relative flex-1 justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            saved ? `Remove ${stay.title} from saved stays` : `Save ${stay.title}`
          }
          accessibilityState={{ selected: saved }}
          hitSlop={4}
          onPress={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className="absolute right-0 top-0 z-10 h-11 w-11 items-center justify-center rounded-full bg-muted"
          style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
        >
          <Icon
            name="heart"
            size={22}
            color={saved ? colors.error : colors.foreground}
            fill={saved ? colors.error : "none"}
          />
        </Pressable>

        <View className="gap-1">
          <AppText variant="searchCardTitle" numberOfLines={2} className="pr-13">
            {stay.title}
          </AppText>

          <View className="flex-row items-center gap-1.5 pr-13">
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
            <View className="flex-row" style={{ gap: 8 }}>
              {amenities.map((amenity) => (
                <View
                  key={amenity.label}
                  className="h-[26px] min-w-0 shrink flex-row items-center gap-1 rounded-pill bg-muted px-1.5"
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
          <AppText variant="searchPrice">${stay.price}</AppText>
          <AppText variant="caption" tone="mutedForeground">
            / night
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
