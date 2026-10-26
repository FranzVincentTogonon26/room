import { Pressable, View } from "react-native";

import { Icon, type IconName } from "@/components/ui/icon";
import { AppText } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/theme/use-theme-colors";

export type SegmentOption = {
  value: string;
  label: string;
  icon?: IconName;
};

export type SegmentedControlProps = {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  const colors = useThemeColors();

  return (
    <View className={cn("h-chip flex-row rounded-field bg-segment p-1", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        const contentColor = selected ? colors.segmentSelectedForeground : colors.foreground;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              "flex-1 flex-row items-center justify-center gap-1.5 rounded-pill",
              selected && "bg-segment-selected",
            )}
            style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
          >
            {option.icon ? <Icon name={option.icon} size="sm" color={contentColor} /> : null}
            <AppText
              variant="label"
              tone={selected ? "segmentSelectedForeground" : "foreground"}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
