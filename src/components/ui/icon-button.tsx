import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";
import { useThemeColors } from "@/theme/use-theme-colors";

import { Icon, type IconName, type IconSize } from "./icon";

const variantClasses = {
  // The sheet's icon buttons are muted circles on a card, not bordered ones.
  surface: "bg-muted",
  glass: "bg-card shadow-floating",
  ghost: "bg-transparent",
} as const;

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-14 w-14",
} as const;

const iconSizes: Record<keyof typeof sizeClasses, IconSize> = {
  sm: "md",
  md: "lg",
  lg: "lg",
};

export type IconButtonProps = Omit<PressableProps, "children" | "style"> & {
  icon: IconName;
  label: string;
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  selected?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  label,
  variant = "surface",
  size = "md",
  selected,
  disabled = false,
  className,
  style,
  ...props
}: IconButtonProps) {
  const colors = useThemeColors();
  const selectedVariant = selected ? "bg-primary" : variantClasses[variant];

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? { disabled } : { disabled, selected }}
      disabled={disabled}
      hitSlop={size === "sm" ? 4 : undefined}
      className={cn(
        "items-center justify-center rounded-full",
        sizeClasses[size],
        selectedVariant,
        disabled && "opacity-40",
        className,
      )}
      style={({ pressed }) => [pressed && !disabled ? { opacity: 0.85 } : null, style]}
    >
      <Icon
        name={icon}
        size={iconSizes[size]}
        color={selected ? colors.primaryForeground : colors.foreground}
      />
    </Pressable>
  );
}
