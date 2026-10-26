import { useState } from "react";
import {
  Pressable,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from "react-native";

import { cn } from "@/lib/cn";
import { typography } from "@/theme";
import { useThemeColors } from "@/theme/use-theme-colors";

import { Icon, type IconName } from "./icon";
import { AppText } from "./text";

export type InputProps = Omit<TextInputProps, "style"> & {
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<TextStyle>;
};

export function Input({
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  disabled = false,
  className,
  style,
  secureTextEntry,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const type = typography.body;

  const showPasswordToggle = Boolean(secureTextEntry);
  const trailingIcon = showPasswordToggle ? (revealed ? "eyeOff" : "eye") : rightIcon;

  return (
    <View className={cn("gap-1.5", disabled && "opacity-40", className)}>
      <View
        className={cn(
          "h-control flex-row items-center gap-3 rounded-field border-2 px-4",
          error
            ? "border-error bg-muted"
            : focused
              ? "border-focus-ring bg-focus"
              : "border-border bg-muted",
        )}
      >
        {leftIcon ? <Icon name={leftIcon} size="md" color={colors.foreground} /> : null}

        <TextInput
          {...props}
          accessibilityState={{ disabled }}
          editable={!disabled}
          secureTextEntry={showPasswordToggle ? !revealed : false}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.accent}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            {
              flex: 1,
              paddingVertical: 0,
              fontFamily: type.fontFamily,
              fontSize: type.fontSize,
              lineHeight: type.lineHeight,
              letterSpacing: type.letterSpacing,
              color: colors.foreground,
            },
            style,
          ]}
          className="h-full"
        />

        {trailingIcon ? (
          <Pressable
            accessibilityRole={showPasswordToggle || onRightIconPress ? "button" : "image"}
            accessibilityLabel={
              showPasswordToggle
                ? revealed
                  ? "Hide password"
                  : "Show password"
                : onRightIconPress
                  ? "Field options"
                  : undefined
            }
            disabled={!showPasswordToggle && !onRightIconPress}
            hitSlop={8}
            onPress={
              showPasswordToggle
                ? () => setRevealed((current) => !current)
                : onRightIconPress
            }
          >
            <Icon name={trailingIcon} size="md" color={colors.foreground} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" tone="errorForeground" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
