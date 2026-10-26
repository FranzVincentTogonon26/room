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
      className={cn("h-14 flex-row items-center gap-4 px-card", className)}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
    >
      <Icon name={icon} size="lg" color={colors.foreground} />
      <AppText variant="label" className="flex-1">
        {label}
      </AppText>
      <Icon name="chevronRight" size="md" color={colors.foreground} />
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
          {index < rows.length - 1 ? <View className="border-b border-border" /> : null}
        </Fragment>
      ))}
    </View>
  );
}
