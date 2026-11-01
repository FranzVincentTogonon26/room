import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Icon, type IconName } from "@/components/ui";
import { useStays } from "@/data/stays-provider";
import { useThemeColors } from "@/theme";

const POLICY_ICONS: Record<string, IconName> = {
  cancellation: "calendarDays",
  houseRules: "house",
  checkInOut: "clock",
  pets: "pawPrint",
  smoking: "flame",
  quietHours: "moon",
  safety: "shield",
};

export default function CancellationPolicyRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { stays, status, error, retry } = useStays();

  const stay = useMemo(
    () => stays.find((s) => s.id === params.id),
    [stays, params.id],
  );

  const cancellationPolicy = useMemo(
    () => stay?.policies?.find((p) => p.policyType === "cancellation"),
    [stay],
  );

  if (status === "loading" && !stay) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <StayDetailSkeleton />
      </View>
    );
  }

  if (status === "error" && !stay) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-8">
        <StayDetailError message={error} onRetry={retry} />
      </View>
    );
  }

  if (!stay || !cancellationPolicy) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-8">
        <StayDetailNotFound onBack={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View className="px-gutter pt-6 pb-section gap-6" style={{ paddingTop: insets.top + 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          className="flex-row items-center gap-2 mb-4"
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
        >
          <Icon name="chevronLeft" size={24} color={colors.foreground} />
          <AppText variant="label">Policies</AppText>
        </Pressable>

        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-tile bg-lavender-surface">
              <Icon
                name={POLICY_ICONS.cancellation}
                size="lg"
                color={colors.accent}
              />
            </View>
            <View className="flex-1">
              <AppText variant="title">{cancellationPolicy.title}</AppText>
              {cancellationPolicy.summary && (
                <AppText variant="bodyCompact" tone="mutedForeground" className="mt-0.5">
                  {cancellationPolicy.summary}
                </AppText>
              )}
            </View>
          </View>

          <View className="h-px bg-border" />

          <AppText variant="body">{cancellationPolicy.body}</AppText>
        </View>

        <View className="mt-6 h-px bg-border" />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View all policies"
          onPress={() => router.push(`/stay/${stay.id}/policies`)}
          className="flex-row items-center justify-between py-3"
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
        >
          <AppText variant="label">View all policies</AppText>
          <Icon name="chevronRight" size="lg" color={colors.foreground} strokeWidth={2.5} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StayDetailSkeleton() {
  return (
    <View className="px-gutter pt-6 pb-section gap-6">
      <View className="h-6 w-1/2 rounded-tile bg-muted" />
      <View className="h-8 w-3/4 rounded-tile bg-muted" />
      <View className="h-px bg-border" />
      <View className="h-20 bg-muted" />
      <View className="h-20 bg-muted" />
      <View className="h-20 bg-muted" />
      <View className="h-px bg-border" />
      <View className="h-6 w-1/2 rounded-tile bg-muted" />
    </View>
  );
}

function StayDetailError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  const colors = useThemeColors();

  return (
    <View className="items-center justify-center px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-error-surface">
        <Icon name="circleAlert" size={28} color={colors.errorForeground} />
      </View>
      <AppText variant="title" className="mt-4 text-center">
        Couldn&apos;t load policy
      </AppText>
      <AppText variant="caption" className="mt-1 text-center">
        {message ?? "Check your connection and try again."}
      </AppText>
      <AppText
        variant="label"
        tone="accent"
        className="mt-6"
        onPress={onRetry}
      >
        Retry
      </AppText>
    </View>
  );
}

function StayDetailNotFound({ onBack }: { onBack: () => void }) {
  const colors = useThemeColors();

  return (
    <View className="items-center justify-center px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon name="search" size={28} color={colors.mutedForeground} />
      </View>
      <AppText variant="title" className="mt-4 text-center">
        Policy not found
      </AppText>
      <AppText variant="caption" className="mt-1 text-center">
        This stay doesn&apos;t have a cancellation policy listed.
      </AppText>
      <AppText variant="label" tone="accent" className="mt-6" onPress={onBack}>
        Go back
      </AppText>
    </View>
  );
}