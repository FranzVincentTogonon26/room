import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { cn } from "@/lib/cn";
import { motion } from "@/theme";

export type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

const TRACK_WIDTH = 56;
const KNOB_SIZE = 28;
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - 4;

export function Toggle({ value, onValueChange, label, disabled = false, className }: ToggleProps) {
  const offset = useSharedValue(value ? KNOB_TRAVEL : 0);

  useEffect(() => {
    offset.value = withTiming(value ? KNOB_TRAVEL : 0, { duration: motion.fast });
  }, [offset, value]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      className={cn(
        "h-8 w-14 flex-row items-center justify-start rounded-pill p-0.5",
        value ? "bg-primary" : "bg-toggle-off",
        disabled && "opacity-40",
        className,
      )}
    >
      <Animated.View
        className="rounded-full bg-knob shadow-knob"
        style={[{ width: KNOB_SIZE, height: KNOB_SIZE }, knobStyle]}
      />
    </Pressable>
  );
}
