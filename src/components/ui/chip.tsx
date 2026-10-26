import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";
import { useThemeColors } from "@/theme/use-theme-colors";

import { Icon, type IconName } from "./icon";
import { AppText, type TextTone } from "./text";

const variantClasses = {
  neutral: "bg-muted",
  lavender: "bg-lavender",
  yellow: "bg-primary",
} as const;

const toneByVariant: Record<keyof typeof variantClasses, TextTone> = {
  neutral: "foreground",
  lavender: "lavenderForeground",
  yellow: "primaryForeground",
};

export type ChipProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: keyof typeof variantClasses;
  icon?: IconName;
  selected?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Chip({
  label,
  variant = "neutral",
  icon,
  selected,
  disabled = false,
  className,
  style,
  ...props
}: ChipProps) {
  const colors = useThemeColors();
  const tone = toneByVariant[variant];
  const iconColor = tone === "primaryForeground" ? colors.primaryForeground : colors.foreground;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? { disabled } : { disabled, selected }}
      disabled={disabled}
      className={cn(
        "h-chip flex-row items-center justify-center gap-2 rounded-pill px-5",
        variantClasses[variant],
        disabled && "opacity-40",
        className,
      )}
      style={({ pressed }) => [pressed && !disabled ? { opacity: 0.8 } : null, style]}
    >
      {icon ? <Icon name={icon} size="md" color={iconColor} /> : null}
      <AppText variant="label" tone={tone}>
        {label}
      </AppText>
    </Pressable>
  );
}
