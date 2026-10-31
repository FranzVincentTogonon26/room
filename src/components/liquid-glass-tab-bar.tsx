import {
  GlassContainer,
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { BlurView } from "expo-blur";
import { impactAsync, ImpactFeedbackStyle } from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useEffect } from "react";
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { cn } from "@/lib/cn";
import { useThemeColors, useThemeScheme } from "@/theme";

const pillShape = {
  borderRadius: 28,
  borderCurve: "continuous",
} as const;

export type LiquidGlassTabBarProps = {
  className?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A decorative Liquid Glass pill surface rendered behind the native tab bar.
 *
 * On iOS 26 (when `isLiquidGlassAvailable()` and `isGlassEffectAPIAvailable()`),
 * it uses `GlassContainer`/`GlassView` for the native liquid-glass material. A
 * `Gesture.Pan()` drives Reanimated worklets that approximate liquid-glass drag:
 * glass stretching, liquid movement, dynamic reflections, elastic snap-back,
 * blur/transparency variation, and shadow response. The snap-back commits a
 * light haptic.
 *
 * The drag gesture is functional when the pill is the touch target. In the app
 * layout it sits behind `NativeTabs` (which owns the icons and labels) with
 * `pointerEvents="none"`, so the native tab bar handles interaction while the
 * glass surface adds the liquid material and continuous float motion behind it.
 * On platforms without Liquid Glass it renders the design as given: a frosted
 * pill with no drag effects.
 */
export function LiquidGlassTabBar({
  className,
  style,
}: LiquidGlassTabBarProps) {
  const colors = useThemeColors();
  const scheme = useThemeScheme();
  const glassAvailable =
    Platform.OS === "ios" &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  // --- Drag gesture state (Reanimated shared values, UI thread) ---
  const isDragging = useSharedValue(false);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const velocityX = useSharedValue(0);
  const liquidFollowX = useSharedValue(0); // springs to follow dragX with lag
  const floatY = useSharedValue(0); // continuous gentle float (liquid movement)
  const began = useSharedValue(false);

  const pan = Gesture.Pan()
    .minPointers(1)
    .onUpdate((event) => {
      if (!began.value) {
        began.value = true;
        isDragging.value = true;
      }
      dragX.value = event.translationX;
      dragY.value = event.translationY;
      velocityX.value = event.velocityX;
    })
    .onEnd(() => {
      began.value = false;
      if (!isDragging.value) return;
      isDragging.value = false;
      // Elastic snap-back with haptic commit.
      dragX.value = withSpring(0, {
        duration: 400,
        dampingRatio: 0.8,
        velocity: velocityX.value,
      });
      dragY.value = withSpring(0, {
        duration: 400,
        dampingRatio: 0.8,
      });
      liquidFollowX.value = withSpring(0, {
        duration: 400,
        dampingRatio: 0.8,
      });
      scheduleOnRN(() => {
        void impactAsync(ImpactFeedbackStyle.Light);
      });
    });

  // Continuous gentle float for the pill surface (liquid movement).
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  useEffect(() => {
    const loop = () => {
      floatY.value = withTiming(-4, { duration: 3000 }, () => {
        floatY.value = withTiming(4, { duration: 3000 }, loop);
      });
    };
    loop();
    return () => {
      // noop: withTiming completes; nothing to cancel
    };
  }, [floatY]);

  // Glass stretch: scaleX grows with |dragX|, scaleY compresses slightly.
  const glassStretchStyle = useAnimatedStyle(() => {
    const amount = Math.min(Math.abs(dragX.value) / 60, 1);
    return {
      transform: [
        { scaleX: 1 + amount * 0.05 },
        { scaleY: 1 - amount * 0.025 },
      ],
    };
  });

  // Surface opacity / blur variation while lifted.
  const surfaceOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(isDragging.value ? 1 : 0, [0, 1], [1, 0.94]),
  }));

  // Shadow response: stronger while lifted.
  const shadowStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(isDragging.value ? 1 : 0, [0, 1], [1, 1.1]) },
    ],
    opacity: interpolate(isDragging.value ? 1 : 0, [0, 1], [0.12, 0.3]),
  }));

  // Dynamic reflection highlight follows drag direction.
  const highlightStyle = useAnimatedStyle(() => {
    const dx = dragX.value;
    const translateX = interpolate(dx, [-40, 0, 40], [10, -16, -42]);
    const opacity = interpolate(
      Math.abs(dx),
      [0, 20, 40],
      [0.35, 0.55, 0.45],
    );
    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        className={cn(
          "shadow-floating",
          className,
          "flex-1 flex-row items-center justify-center px-2"
        )}
        style={[
          pillShape,
          { paddingHorizontal: 4, paddingVertical: 6 },
          floatStyle,
          style,
        ]}
      >
        {glassAvailable ? (
          <GlassContainer style={{ flex: 1 }}>
            <GlassView
              colorScheme={scheme}
              glassEffectStyle="regular"
              isInteractive
              style={[
                pillShape,
                { flex: 1, overflow: "hidden" },
                glassStretchStyle,
                surfaceOpacity,
                {
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.glassBarBorder,
                },
              ] as unknown as StyleProp<ViewStyle>}
            >
              {/* Decorative reflection highlight following the drag. */}
              <Animated.View
                className="absolute inset-0"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundImage:
                      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)",
                  },
                  highlightStyle,
                ]}
                pointerEvents="none"
              />
            </GlassView>
          </GlassContainer>
        ) : (
          <View
            className="flex-1 overflow-hidden"
            style={[
              pillShape,
              {
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.glassBarBorder,
                backgroundColor: colors.glassBar,
              },
            ]}
          >
            <BlurView
              intensity={55}
              tint={scheme === "dark" ? "dark" : "light"}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}
        {/* Shadow layer responding to lift/drag (behind the pill). */}
        <Animated.View
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[90%] h-[10px] blur-[8px] bg-black/20 rounded-full"
          style={[shadowStyle, { pointerEvents: "none" }]}
        />
      </Animated.View>
    </GestureDetector>
  );
}
