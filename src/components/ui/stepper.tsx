import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { AppText } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { useThemeColors } from "@/theme/use-theme-colors";

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  className?: string;
};

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  className,
}: StepperProps) {
  const colors = useThemeColors();
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View
      className={cn(
        "h-control flex-row items-center rounded-field border border-border bg-card px-1",
        className,
      )}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        accessibilityState={{ disabled: !canDecrease }}
        disabled={!canDecrease}
        onPress={() => onChange(Math.max(min, value - step))}
        className={cn(
          "h-10 w-10 items-center justify-center rounded-full",
          !canDecrease && "opacity-30",
        )}
        style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
      >
        <Icon name="minus" size="md" color={colors.foreground} />
      </Pressable>

      <AppText variant="label" className="min-w-10 text-center">
        {value}
      </AppText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        accessibilityState={{ disabled: !canIncrease }}
        disabled={!canIncrease}
        onPress={() => onChange(Math.min(max, value + step))}
        className={cn(
          "h-10 w-10 items-center justify-center rounded-full",
          !canIncrease && "opacity-30",
        )}
        style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
      >
        <Icon name="plus" size="md" color={colors.foreground} />
      </Pressable>
    </View>
  );
}
