import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { motion } from "@/theme";

/**
 * Small press-in scale for button-like controls. Full-width list rows should
 * not use this; they change their background instead.
 */
export function usePressScale(pressedScale = 0.97) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const onPressIn = () => {
    if (reducedMotion) return;
    scale.set(withTiming(pressedScale, { duration: motion.fast }));
  };

  const onPressOut = () => {
    if (reducedMotion) return;
    scale.set(withTiming(1, { duration: motion.base }));
  };

  return { animatedStyle, onPressIn, onPressOut };
}
