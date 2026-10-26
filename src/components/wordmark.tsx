import { useWindowDimensions, View } from "react-native";

import { AppText } from "@/components/ui/text";
import { cn } from "@/lib/cn";

/**
 * Placeholder wordmark: typeset with Poppins ExtraBold until the brand logo
 * asset is supplied. The catalog marks it visibly as a placeholder.
 *
 * The sheet's lockup is set on a wide board, so phones use the compact
 * tagline token to keep the two-line phrase break intact.
 */
export function Wordmark({
  tagline = "Find unforgettable stays\nfor every kind of trip.",
  className,
}: {
  tagline?: string;
  className?: string;
}) {
  const { width } = useWindowDimensions();
  const taglineVariant = width < 480 ? "taglineCompact" : "tagline";

  return (
    <View className={cn("gap-2", className)}>
      <AppText variant="wordmark">roam</AppText>
      <AppText variant={taglineVariant}>{tagline}</AppText>
    </View>
  );
}
