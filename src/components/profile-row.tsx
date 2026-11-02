import { Children, Fragment, type PropsWithChildren } from "react";
import { Pressable, View } from "react-native";

import { Icon, type IconName } from "@/components/ui/icon";
import { AppText } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/theme/use-theme-colors";

export type ProfileRowProps = {
  icon: IconName;
  label: string;
  onPress?: () => void;
  className?: string;
};

export function ProfileRow({ icon, label, onPress, className }: ProfileRowProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn("h-13 flex-row items-center gap-4 px-3", className)}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
    >
      <View className="h-9 w-9 items-center justify-center rounded-tile bg-muted">
        <Icon name={icon} size="lg" color={colors.foreground} />
      </View>
      <AppText variant="caption" tone="foreground" className="flex-1">
        {label}
      </AppText>
      <Icon name="chevronRight" size="md" color={colors.foreground} strokeWidth={2} />
    </Pressable>
  );
}

export type ProfileRowGroupProps = PropsWithChildren<{
  className?: string;
}>;

export function ProfileRowGroup({ children, className }: ProfileRowGroupProps) {
  const rows = Children.toArray(children);

  return (
    <View
      className={cn(
        "overflow-hidden rounded-card border border-transparent bg-card shadow-card dark:border-border",
        className,
      )}
    >
      {rows.map((row, index) => (
        <Fragment key={index}>
          {row}
          {index < rows.length - 1 ? (
            <View className="ml-14 mr-3 h-px bg-border" />
          ) : null}
        </Fragment>
      ))}
    </View>
  );
}
