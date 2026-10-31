import { ActivityIndicator, Pressable, View } from "react-native";

import { AppText, Button, Icon, type IconName } from "@/components/ui";
import { useThemeColors } from "@/theme";

/** Shared loading, error, empty, and refresh states for live stays. */

export function StaysLoading({ label = "Loading stays…" }: { label?: string }) {
  const colors = useThemeColors();

  return (
    <View className="items-center justify-center px-8 py-16">
      <ActivityIndicator color={colors.accent} />
      <AppText variant="caption" className="mt-3">
        {label}
      </AppText>
    </View>
  );
}

export function StaysError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  const colors = useThemeColors();

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`Couldn't load stays. ${message ?? ""}`}
      className="items-center justify-center px-8 py-16"
    >
      <View className="h-16 w-16 items-center justify-center rounded-full bg-error-surface">
        <Icon name="circleAlert" size={28} color={colors.errorForeground} />
      </View>
      <AppText variant="title" className="mt-4 text-center">
        Couldn&apos;t load stays
      </AppText>
      <AppText variant="caption" className="mt-1 text-center">
        {message ?? "Check your connection and try again."}
      </AppText>
      <Button label="Retry" onPress={onRetry} className="mt-6" />
    </View>
  );
}

export function StaysEmpty({
  icon = "search",
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useThemeColors();

  return (
    <View className="items-center justify-center px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon name={icon} size={28} color={colors.mutedForeground} />
      </View>
      <AppText variant="title" className="mt-4 text-center">
        {title}
      </AppText>
      <AppText variant="caption" className="mt-1 text-center">
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          variant="secondary"
          onPress={onAction}
          className="mt-6"
        />
      ) : null}
    </View>
  );
}

export function StaysRefreshNotice({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  const colors = useThemeColors();

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel="Couldn't refresh stays"
      className="flex-row items-center gap-2 rounded-tile bg-error-surface px-4 py-3"
    >
      <Icon name="circleAlert" size={18} color={colors.errorForeground} />
      <AppText
        variant="caption"
        tone="errorForeground"
        numberOfLines={2}
        className="flex-1"
      >
        {message ? `Couldn't refresh stays. ${message}` : "Couldn't refresh stays."}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry refreshing stays"
        hitSlop={8}
        onPress={onRetry}
        style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
      >
        <AppText variant="label" tone="errorForeground">
          Retry
        </AppText>
      </Pressable>
    </View>
  );
}
