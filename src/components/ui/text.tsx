import { Text, type TextProps } from "react-native";

import { cn } from "@/lib/cn";
import { typography, type TypeVariant } from "@/theme";

/**
 * Text colors are a closed set of classes so a caller can never produce a
 * class that conflicts with the variant's default (Tailwind order, not string
 * order, decides the winner). Use `tone` to change the color.
 */
const toneClasses = {
  foreground: "text-foreground",
  mutedForeground: "text-muted-foreground",
  subtleForeground: "text-subtle-foreground",
  placeholder: "text-placeholder",
  primaryForeground: "text-primary-foreground",
  lavenderForeground: "text-lavender-foreground",
  accent: "text-accent",
  star: "text-star",
  successForeground: "text-success-foreground",
  errorForeground: "text-error-foreground",
  badgeYellowForeground: "text-badge-yellow-foreground",
  badgeMintForeground: "text-badge-mint-foreground",
  badgePinkForeground: "text-badge-pink-foreground",
  badgeBlueForeground: "text-badge-blue-foreground",
  segmentSelectedForeground: "text-segment-selected-foreground",
  onSuccess: "text-on-success",
  onError: "text-on-error",
} as const;

export type TextTone = keyof typeof toneClasses;

export type AppTextProps = TextProps & {
  variant?: TypeVariant;
  tone?: TextTone;
  className?: string;
};

export function AppText({ variant = "body", tone, className, style, ...props }: AppTextProps) {
  const type = typography[variant];
  const resolvedTone = (tone ?? type.color) as TextTone;

  return (
    <Text
      {...props}
      className={cn(toneClasses[resolvedTone], className)}
      style={[
        {
          fontFamily: type.fontFamily,
          fontSize: type.fontSize,
          lineHeight: type.lineHeight,
          letterSpacing: type.letterSpacing,
        },
        style,
      ]}
    />
  );
}
