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

const sizeClasses = {
  md: "h-chip px-5",
  sm: "h-[30px] px-[13px]",
} as const;

const toneByVariant: Record<keyof typeof variantClasses, TextTone> = {
  neutral: "foreground",
  lavender: "lavenderForeground",
  yellow: "primaryForeground",
};

export type ChipProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  icon?: IconName;
  selected?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Chip({
  label,
  variant = "neutral",
  size = "md",
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
        "flex-row items-center justify-center gap-2 rounded-pill",
        sizeClasses[size],
        variantClasses[variant],
        disabled && "opacity-40",
        className,
      )}
      style={({ pressed }) => [pressed && !disabled ? { opacity: 0.8 } : null, style]}
    >
      {icon ? <Icon name={icon} size="md" color={iconColor} /> : null}
      <AppText
        variant={size === "sm" ? "badge" : "label"}
        tone={tone}
        className={size === "sm" ? "font-sans-semibold" : undefined}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
