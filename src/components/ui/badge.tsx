import { View } from "react-native";

import { cn } from "@/lib/cn";
import type { ThemeColors } from "@/theme";
import { useThemeColors } from "@/theme/use-theme-colors";

import { Icon, type IconName } from "./icon";
import { AppText, type TextTone } from "./text";

const toneClasses = {
  neutral: "bg-muted",
  yellow: "bg-badge-yellow",
  mint: "bg-badge-mint",
  pink: "bg-badge-pink",
  blue: "bg-badge-blue",
  lavender: "bg-lavender-surface",
} as const;

const textTones: Record<keyof typeof toneClasses, TextTone> = {
  neutral: "foreground",
  yellow: "badgeYellowForeground",
  mint: "badgeMintForeground",
  pink: "badgePinkForeground",
  blue: "badgeBlueForeground",
  lavender: "accent",
};

const iconColors: Record<keyof typeof toneClasses, "foreground" | "badgeYellowForeground" | "badgeMintForeground" | "badgePinkForeground" | "badgeBlueForeground" | "accent"> = {
  neutral: "foreground",
  yellow: "badgeYellowForeground",
  mint: "badgeMintForeground",
  pink: "badgePinkForeground",
  blue: "badgeBlueForeground",
  lavender: "accent",
};

export type BadgeProps = {
  label: string;
  tone?: keyof typeof toneClasses;
  icon?: IconName;
  iconColor?: keyof ThemeColors;
  iconFill?: keyof ThemeColors;
  className?: string;
};

export function Badge({
  label,
  tone = "neutral",
  icon,
  iconColor,
  iconFill,
  className,
}: BadgeProps) {
  const colors = useThemeColors();

  return (
    <View
      className={cn(
        "h-8 flex-row items-center justify-center gap-1.5 rounded-pill px-3",
        toneClasses[tone],
        className,
      )}
    >
      {icon ? (
        <Icon
          name={icon}
          size="sm"
          color={colors[iconColor ?? iconColors[tone]]}
          fill={iconFill ? colors[iconFill] : "none"}
        />
      ) : null}
      <AppText variant="badge" tone={textTones[tone]}>
        {label}
      </AppText>
    </View>
  );
}
