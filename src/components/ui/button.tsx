import { ActivityIndicator, Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { cn } from "@/lib/cn";
import { useThemeColors } from "@/theme/use-theme-colors";

import { Icon, type IconName } from "./icon";
import { AppText } from "./text";

const variantClasses = {
  primary: "bg-primary",
  secondary: "bg-card border border-border",
} as const;

const heightClasses = {
  sm: "h-10",
  md: "h-control",
} as const;

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: keyof typeof variantClasses;
  size?: keyof typeof heightClasses;
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  className,
  style,
  ...props
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";
  const iconColor = isPrimary ? colors.primaryForeground : colors.foreground;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        "relative flex-row items-center justify-center rounded-pill px-6",
        heightClasses[size],
        variantClasses[variant],
        isDisabled && "opacity-40",
        className,
      )}
      style={({ pressed }) => [pressed && !isDisabled ? { opacity: 0.8 } : null, style]}
    >
      <View className="flex-row items-center justify-center gap-3">
        {loading ? <ActivityIndicator size="small" color={iconColor} /> : null}
        {leftIcon && !loading ? <Icon name={leftIcon} size="md" color={iconColor} /> : null}
        <AppText variant="button" tone={isPrimary ? "primaryForeground" : "foreground"}>
          {label}
        </AppText>
      </View>
      {rightIcon ? (
        <View className="absolute right-6">
          <Icon name={rightIcon} size="md" color={iconColor} />
        </View>
      ) : null}
    </Pressable>
  );
}
