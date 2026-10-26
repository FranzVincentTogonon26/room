import { Pressable, View } from "react-native";

import { Icon, type IconName } from "@/components/ui/icon";
import { AppText } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/theme/use-theme-colors";

export type PolicyCardProps = {
  icon: IconName;
  title: string;
  description: string;
  onPress?: () => void;
  className?: string;
};

export function PolicyCard({ icon, title, description, onPress, className }: PolicyCardProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-4 rounded-card bg-lavender-surface p-4",
        className,
      )}
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
    >
      <View className="h-12 w-12 items-center justify-center rounded-tile bg-lavender-strong">
        <Icon name={icon} size="lg" color={colors.accent} />
      </View>

      <View className="flex-1 gap-1">
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" numberOfLines={2}>
          {description}
        </AppText>
      </View>

      <Icon name="chevronRight" size="md" color={colors.accent} />
    </Pressable>
  );
}
