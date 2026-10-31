import { BottomSheet, RNHostView } from "@expo/ui";
import { Image } from "expo-image";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Icon, IconButton, type IconName } from "@/components/ui";
import type { StayHost } from "@/data/stays";
import { listPhrase } from "@/lib/stay-detail";
import { useThemeColors } from "@/theme";

function HostFact({ icon, label }: { icon: IconName; label: string }) {
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center gap-3">
      <Icon name={icon} size="md" color={colors.mutedForeground} />
      <AppText variant="body" className="flex-1">
        {label}
      </AppText>
    </View>
  );
}

export function StayHostSheet({
  visible,
  host,
  onClose,
}: {
  visible: boolean;
  host?: StayHost;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  if (!host) return null;

  return (
    <BottomSheet
      isPresented={visible}
      onDismiss={onClose}
      contentPadding={0}
      containerColor={colors.card}
    >
      <RNHostView matchContents={{ vertical: true }}>
        <View className="flex-1 justify-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close host details"
            onPress={onClose}
            className="absolute inset-0 bg-foreground/40"
          />

          <View
            className="rounded-t-sheet bg-card"
            style={{
              maxHeight: height * 0.85,
              paddingBottom: insets.bottom + 16,
            }}
          >
            <View className="items-center pt-3">
              <View className="h-1 w-9 rounded-pill bg-border" />
            </View>

            <View className="flex-row items-start justify-between px-gutter pb-2 pt-4">
              <View className="flex-1 pr-4">
                <AppText variant="title">Hosted by {host.name}</AppText>
                <AppText
                  variant="bodyCompact"
                  tone="mutedForeground"
                  className="mt-1"
                >
                  Your host for this stay.
                </AppText>
              </View>
              <IconButton
                icon="x"
                label="Close host details"
                size="sm"
                variant="surface"
                onPress={onClose}
              />
            </View>

            <ScrollView
              className="px-gutter"
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="mt-2 flex-row items-center gap-4">
                {host.photo ? (
                  <Image
                    source={{ uri: host.photo }}
                    contentFit="cover"
                    transition={200}
                    style={{ height: 72, width: 72, borderRadius: 36 }}
                    accessibilityIgnoresInvertColors
                    accessibilityLabel={
                      host.photoAlt ?? `Portrait of ${host.name}`
                    }
                  />
                ) : (
                  <View className="h-18 w-18 items-center justify-center rounded-pill bg-muted">
                    <AppText variant="heading">{host.name.charAt(0)}</AppText>
                  </View>
                )}

                <View className="flex-1 gap-1">
                  <AppText variant="title">{host.name}</AppText>
                  <View className="flex-row items-center gap-1.5">
                    <Icon name="award" size={18} color={colors.superhost} />
                    <AppText variant="bodyCompact" tone="mutedForeground">
                      {host.superhost ? "Superhost" : "Host"}
                    </AppText>
                  </View>
                </View>
              </View>

              {host.bio ? (
                <AppText variant="body" className="mt-5">
                  {host.bio}
                </AppText>
              ) : null}

              <View className="mt-5 gap-3">
                {host.responseTime ? (
                  <HostFact
                    icon="clock"
                    label={`Responds ${host.responseTime.toLowerCase()}`}
                  />
                ) : null}
                {host.joinedYear ? (
                  <HostFact
                    icon="calendarDays"
                    label={`Joined in ${host.joinedYear}`}
                  />
                ) : null}
                {host.languages.length > 0 ? (
                  <HostFact
                    icon="globe"
                    label={`Speaks ${listPhrase(host.languages)}`}
                  />
                ) : null}
              </View>
            </ScrollView>
          </View>
        </View>
      </RNHostView>
    </BottomSheet>
  );
}
