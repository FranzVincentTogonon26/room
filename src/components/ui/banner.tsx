import { Pressable, View } from "react-native";

import { cn } from "@/lib/cn";
import { useThemeColors } from "@/theme/use-theme-colors";

import { Icon } from "./icon";
import { AppText } from "./text";

const toneConfig = {
  success: {
    container: "bg-success-surface",
    circle: "bg-success",
    text: "successForeground",
    icon: "onSuccess",
  },
  error: {
    container: "bg-error-surface",
    circle: "bg-error",
    text: "errorForeground",
    icon: "onError",
  },
} as const;

export type BannerProps = {
  tone: "success" | "error";
  message: string;
  onDismiss?: () => void;
  className?: string;
};

export function Banner({ tone, message, onDismiss, className }: BannerProps) {
  const colors = useThemeColors();
  const config = toneConfig[tone];

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={cn("flex-row items-center gap-3 rounded-tile p-4", config.container, className)}
    >
      <View className={cn("h-6 w-6 items-center justify-center rounded-full", config.circle)}>
        {tone === "success" ? (
          <Icon name="check" size={14} color={colors.onSuccess} strokeWidth={2.4} />
        ) : (
          <AppText variant="badge" tone="onError">
            !
          </AppText>
        )}
      </View>

      <AppText variant="caption" tone={config.text} className="flex-1">
        {message}
      </AppText>

      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${tone} message`}
          hitSlop={10}
          onPress={onDismiss}
        >
          <Icon name="x" size="sm" color={colors[config.text]} />
        </Pressable>
      ) : null}
    </View>
  );
}
