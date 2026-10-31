import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StayHostSheet } from "@/components/stay-host-sheet";
import { StayPolicySheet } from "@/components/stay-policy-sheet";
import { AppText, Button, Icon, type IconName } from "@/components/ui";
import type { Stay } from "@/data/stays";
import { useStays } from "@/data/stays-provider";
import { toggleSaved, useSavedStays } from "@/lib/saved-stays";
import { formatUsd, galleryFor, highlightsFor } from "@/lib/stay-detail";
import { palette, useThemeColors } from "@/theme";

/** How far the white sheet rides up over the photo. */
const SHEET_OVERLAP = 20;
/** The design's photo is 0.855× as tall as it is wide. */
const HERO_RATIO = 0.855;
const SAMPLE_NIGHTS = 3;

export default function StayDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { stays, status, error, retry } = useStays();
  const saved = useSavedStays();

  const stay = useMemo(
    () => stays.find((candidate) => candidate.id === params.id),
    [stays, params.id],
  );

  if (status === "loading" && !stay) {
    return <StayDetailSkeleton />;
  }

  if (status === "error" && !stay) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-8">
        <StayDetailError message={error} onRetry={retry} />
      </View>
    );
  }

  if (!stay) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-8">
        <StayDetailNotFound onBack={() => router.replace("/home")} />
      </View>
    );
  }

  return (
    <StayDetail
      key={stay.id}
      stay={stay}
      saved={saved.has(stay.id)}
      onToggleSaved={() => toggleSaved(stay.id)}
      onBack={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
    />
  );
}

function StayDetail({
  stay,
  saved,
  onToggleSaved,
  onBack,
}: {
  stay: Stay;
  saved: boolean;
  onToggleSaved: () => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [hostOpen, setHostOpen] = useState(false);
  const heroHeight = Math.round(width * HERO_RATIO) + SHEET_OVERLAP;
  const images = galleryFor(stay);
  const highlights = highlightsFor(stay);
  const policies = stay.policies ?? [];
  const cancellation = policies.find((policy) => policy.policyType === "cancellation");
  const host = stay.host;

  const onGalleryScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setPhotoIndex(Math.min(Math.max(next, 0), images.length - 1));
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `${stay.title}\n${stay.location}\n$${formatUsd(stay.price)} / night\nroom://stay/${stay.id}`,
      });
    } catch {
      // The guest dismissed the share sheet.
    }
  };

  return (
    <View className="flex-1 bg-card">
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: heroHeight }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onGalleryScroll}
          >
            {images.map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                contentFit="cover"
                transition={200}
                style={{ width, height: heroHeight }}
                accessibilityIgnoresInvertColors
                accessibilityLabel={`${stay.title}, photo ${index + 1} of ${images.length}`}
              />
            ))}
          </ScrollView>

          <View
            className="absolute left-gutter right-gutter flex-row items-start justify-between"
            style={{ top: insets.top + 8 }}
          >
            <HeroButton icon="chevronLeft" label="Go back" onPress={onBack} />
            <View className="flex-row gap-3">
              <HeroButton icon="share" label="Share stay" onPress={onShare} />
              <HeroButton
                icon="heart"
                label={saved ? "Remove from saved stays" : "Save stay"}
                onPress={onToggleSaved}
                filled={saved}
              />
            </View>
          </View>

          {images.length > 1 ? (
            <View
              className="absolute items-center justify-center rounded-pill px-3.5"
              style={{
                bottom: SHEET_OVERLAP + 12,
                right: 16,
                height: 36,
                backgroundColor: palette.imageScrim,
              }}
            >
              <AppText variant="label" tone="onImage">
                {photoIndex + 1} / {images.length}
              </AppText>
            </View>
          ) : null}
        </View>

        <View className="-mt-5 rounded-t-sheet bg-card px-gutter pb-6 pt-section">
          <View className="flex-row items-start gap-3">
            <AppText variant="propertyTitle" className="flex-1">
              {stay.title}
            </AppText>

            <View className="-mr-1 rounded-card bg-muted px-3 py-1.5">
              <View className="flex-row items-center gap-1.5">
                <Icon
                  name="star"
                  size={20}
                  color={colors.star}
                  fill={colors.star}
                />
                <AppText variant="searchPrice">{stay.rating.toFixed(1)}</AppText>
              </View>
              <AppText variant="caption" tone="mutedForeground">
                ({stay.reviewCount})
              </AppText>
            </View>
          </View>

          <View className="mt-2 flex-row items-center gap-1.5">
            <Icon
              name="mapPin"
              size="md"
              color={colors.foreground}
              fill={colors.foreground}
            />
            <AppText variant="bodyLarge">{stay.location}</AppText>
          </View>

          {highlights.length > 0 ? (
            <View className="mt-section flex-row justify-between gap-2">
              {highlights.map((highlight) => (
                <View key={highlight.label} className="items-center gap-2">
                  <Icon
                    name={highlight.icon}
                    size="lg"
                    color={colors.foreground}
                    fill={
                      highlight.icon === "pawPrint" ? colors.foreground : "none"
                    }
                  />
                  <AppText variant="caption" numberOfLines={1}>
                    {highlight.label}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {policies.length > 0 ? (
            <>
              <View className="mt-5 h-px bg-border" />

              <View className="-mx-1 mt-1.5 gap-2">
                <PolicyCard
                  icon="messageCircleMore"
                  title="Ask about policies"
                  subtitle="Cancellation, house rules, pets, check-in and more."
                  onPress={() => setPolicyOpen(true)}
                />

                {cancellation ? (
                  <PolicyCard
                    icon="fileText"
                    title={cancellation.title}
                    subtitle={cancellation.summary}
                    onPress={() => setPolicyOpen(true)}
                  />
                ) : null}
              </View>
            </>
          ) : null}

          {host ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Hosted by ${host.name}. Open host details.`}
              onPress={() => setHostOpen(true)}
              className="mt-4 flex-row items-center gap-4 border-t border-border py-2"
              style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
            >
              {host.photo ? (
                <Image
                  source={{ uri: host.photo }}
                  contentFit="cover"
                  transition={200}
                  style={{ height: 64, width: 64, borderRadius: 32 }}
                  accessibilityIgnoresInvertColors
                  accessibilityLabel={host.photoAlt ?? `Portrait of ${host.name}`}
                />
              ) : (
                <View className="h-avatar-lg w-avatar-lg items-center justify-center rounded-pill bg-muted">
                  <AppText variant="title">{host.name.charAt(0)}</AppText>
                </View>
              )}

              <View className="flex-1 gap-0.5">
                <AppText variant="cardTitleCompact">Hosted by {host.name}</AppText>
                <View className="flex-row items-center gap-1.5">
                  <Icon name="award" size={18} color={colors.superhost} />
                  <AppText variant="bodyCompact" tone="mutedForeground">
                    {host.superhost ? "Superhost" : "Host"}
                  </AppText>
                </View>
              </View>

              <Icon
                name="chevronRight"
                size="lg"
                color={colors.foreground}
                strokeWidth={2.5}
              />
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <View
        className="flex-row items-center gap-4 border-t border-border bg-card px-gutter"
        style={{
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <View>
          <View className="flex-row items-baseline gap-1">
            <AppText variant="propertyTitle">${formatUsd(stay.price)}</AppText>
            <AppText variant="body" tone="mutedForeground">
              / night
            </AppText>
          </View>
          <AppText variant="bodyCompact" tone="mutedForeground" className="mt-1">
            ${formatUsd(stay.price * SAMPLE_NIGHTS)} total
          </AppText>
        </View>

        <Button
          label="Book this stay"
          size="lg"
          labelVariant="detailButton"
          className="flex-1"
          onPress={() =>
            Alert.alert("Coming soon", "Booking for this stay isn't available yet.")
          }
        />
      </View>

      <StayPolicySheet
        visible={policyOpen}
        policies={policies}
        onClose={() => setPolicyOpen(false)}
      />
      <StayHostSheet
        visible={hostOpen}
        host={host}
        onClose={() => setHostOpen(false)}
      />
    </View>
  );
}

function HeroButton({
  icon,
  label,
  onPress,
  filled = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  filled?: boolean;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-control-lg w-control-lg items-center justify-center rounded-full bg-card shadow-floating"
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
    >
      <Icon
        name={icon}
        size="lg"
        color={colors.foreground}
        fill={filled ? colors.foreground : "none"}
      />
    </Pressable>
  );
}

function PolicyCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      className="flex-row items-center gap-gutter rounded-card bg-lavender-surface px-3 py-3"
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
    >
      <View className="h-13 w-13 items-center justify-center rounded-tile bg-lavender-strong">
        <Icon name={icon} size="xl" color={colors.accent} />
      </View>

      <View className="flex-1">
        <AppText variant="cardTitleCompact">{title}</AppText>
        <AppText variant="bodyCompact" tone="mutedForeground" className="mt-0.5">
          {subtitle}
        </AppText>
      </View>

      <Icon
        name="chevronRight"
        size="lg"
        color={colors.accent}
        strokeWidth={2.5}
      />
    </Pressable>
  );
}

function StayDetailSkeleton() {
  const { width } = useWindowDimensions();
  const heroHeight = Math.round(width * HERO_RATIO) + SHEET_OVERLAP;

  return (
    <View className="flex-1 bg-card">
      <View style={{ height: heroHeight }} className="bg-muted" />

      <View className="-mt-5 flex-1 rounded-t-sheet bg-card px-gutter pt-section">
        <View className="flex-row items-start gap-3">
          <View className="flex-1 gap-2">
            <View className="h-8 w-4/5 rounded-tile bg-muted" />
            <View className="h-8 w-3/5 rounded-tile bg-muted" />
          </View>
          <View className="h-16 w-20 rounded-card bg-muted" />
        </View>

        <View className="mt-4 h-6 w-2/3 rounded-tile bg-muted" />

        <View className="mt-section flex-row justify-between">
          {[0, 1, 2, 3].map((item) => (
            <View key={item} className="items-center gap-2">
              <View className="h-6 w-6 rounded-full bg-muted" />
              <View className="h-4 w-16 rounded-tile bg-muted" />
            </View>
          ))}
        </View>

        <View className="mt-5 h-px bg-border" />
        <View className="-mx-1 mt-1.5 gap-2">
          <View className="h-22 rounded-card bg-muted" />
          <View className="h-20 rounded-card bg-muted" />
        </View>

        <View className="mt-4 flex-row items-center gap-4 border-t border-border py-2">
          <View className="h-avatar-lg w-avatar-lg rounded-pill bg-muted" />
          <View className="flex-1 gap-2">
            <View className="h-5 w-1/2 rounded-tile bg-muted" />
            <View className="h-4 w-1/3 rounded-tile bg-muted" />
          </View>
        </View>
      </View>
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
        Couldn&apos;t load stay
      </AppText>
      <AppText variant="caption" className="mt-1 text-center">
        {message ?? "Check your connection and try again."}
      </AppText>
      <Button label="Retry" onPress={onRetry} className="mt-6" />
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
        Stay not found
      </AppText>
      <AppText variant="caption" className="mt-1 text-center">
        This stay may have been removed or the link is outdated.
      </AppText>
      <Button label="Go back" variant="secondary" onPress={onBack} className="mt-6" />
    </View>
  );
}
