import { View, type ViewProps } from "react-native";

import { cn } from "@/lib/cn";

export type CardProps = ViewProps & {
  padded?: boolean;
  className?: string;
};

export function Card({ padded = true, className, ...props }: CardProps) {
  return (
    <View
      {...props}
      className={cn("rounded-card bg-card shadow-card", padded && "p-card", className)}
    />
  );
}
