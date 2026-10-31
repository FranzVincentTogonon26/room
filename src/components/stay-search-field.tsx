import { type ComponentRef, type RefObject } from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { usePressScale } from "@/lib/use-press-scale";
import { typography, useThemeColors } from "@/theme";

export type StaySearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  inputRef?: RefObject<ComponentRef<typeof TextInput> | null>;
  className?: string;
};

/**
 * The lavender natural-language search pill from the home design. The field
 * submits on the keyboard's search key or the arrow button.
 */
export function StaySearchField({
  value,
  onChangeText,
  onSubmit,
  placeholder = "quiet pet friendly cabin with hot tub",
  inputRef,
  className,
}: StaySearchFieldProps) {
  const colors = useThemeColors();
  const press = usePressScale();

  return (
    <View
      className={cn(
        "h-16 flex-row items-center gap-2.5 rounded-pill bg-lavender pl-4 pr-2",
        className,
      )}
    >
      <Icon name="sparkles" size={18} color={colors.lavenderForeground} />

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.lavenderForeground}
        selectionColor={colors.accent}
        returnKeyType="search"
        multiline={false}
        autoCapitalize="none"
        underlineColorAndroid="transparent"
        accessibilityLabel="Describe your stay"
        className="flex-1 self-stretch"
        style={{
          paddingVertical: 0,
          textAlignVertical: "center",
          fontFamily: typography.caption.fontFamily,
          fontSize: typography.caption.fontSize,
          letterSpacing: typography.caption.letterSpacing,
          color: colors.lavenderForeground,
        }}
      />

      <Animated.View style={press.animatedStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search stays"
          onPress={onSubmit}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          className="h-12 w-12 items-center justify-center rounded-full bg-card"
        >
          <Icon name="arrowUpRight" size={20} color={colors.foreground} />
        </Pressable>
      </Animated.View>
    </View>
  );
}
