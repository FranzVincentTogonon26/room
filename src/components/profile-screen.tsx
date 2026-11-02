import { useClerk, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CancellationSheet,
  HelpSheet,
  PersonalInfoSheet,
  SettingsSheet,
} from "@/components/profile-sheets";
import { ProfileRow, ProfileRowGroup } from "@/components/profile-row";
import { AppText, Icon, IconButton } from "@/components/ui";
import { UserAvatar } from "@/components/user-avatar";
import { useSavedStays } from "@/lib/saved-stays";
import { displayNameFor } from "@/lib/user-name";
import { useThemeColors } from "@/theme";

/**
 * Profile content that has no data source yet. Trips stays at 0 until booking
 * exists; the rating is a sample guest rating until reviews exist.
 */
const TRIP_COUNT = 0;
const SAMPLE_RATING = 4.9;
const SAMPLE_LOCATION = "San Francisco, CA";
const SAMPLE_TIER = "Roam Explorer";

type ProfileSheetName = "settings" | "personal" | "help" | "cancellation";

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="mt-3 rounded-field bg-muted p-2">
      <AppText variant="cardTitleCompact" className="px-3 pb-2 pt-2">
        {title}
      </AppText>
      <ProfileRowGroup>{children}</ProfileRowGroup>
    </View>
  );
}

function ProfileStat({
  value,
  label,
  star = false,
}: {
  value: string;
  label: string;
  star?: boolean;
}) {
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center">
      <View className="flex-row items-center gap-1.5">
        {star ? (
          <Icon
            name="star"
            size={22}
            color={colors.star}
            fill={colors.star}
          />
        ) : null}
        <AppText variant="price">{value}</AppText>
      </View>
      <AppText variant="caption" tone="subtleForeground" className="mt-0.5">
        {label}
      </AppText>
    </View>
  );
}

export function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const saved = useSavedStays();
  const [sheet, setSheet] = useState<ProfileSheetName | null>(null);

  const email = user?.primaryEmailAddress?.emailAddress;
  const name = user?.fullName?.trim() || displayNameFor(user);
  const closeSheet = () => setSheet(null);

  const comingSoon = (message: string) => {
    Alert.alert("Coming soon", message);
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-card"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="px-4">
          <View className="h-14 flex-row items-center justify-between">
            <AppText variant="wordmarkSmall">room</AppText>
            <IconButton
              icon="settings"
              label="Open settings"
              size="md"
              onPress={() => setSheet("settings")}
            />
          </View>

          <View className="mt-2.5 flex-row items-center gap-3 rounded-field bg-lavender-mist p-2.5">
            <UserAvatar size="xl" />

            <View className="flex-1">
              <AppText variant="profileName" numberOfLines={2}>
                {name}
              </AppText>

              <View className="mt-1 flex-row items-center gap-2">
                <Icon
                  name="mapPin"
                  size="md"
                  color={colors.mutedForeground}
                  fill={colors.mutedForeground}
                />
                <AppText
                  variant="bodyLarge"
                  tone="mutedForeground"
                  className="flex-1"
                  numberOfLines={1}
                >
                  {SAMPLE_LOCATION}
                </AppText>
              </View>

              <View className="mt-2.5 h-8 flex-row items-center gap-2 self-start rounded-pill bg-lavender-surface px-3">
                <Icon
                  name="star"
                  size={18}
                  color={colors.star}
                  fill={colors.star}
                />
                <AppText variant="caption" tone="foreground" numberOfLines={1}>
                  {SAMPLE_TIER}
                </AppText>
              </View>
            </View>
          </View>

          <View className="mt-2 h-18 flex-row rounded-card border border-border bg-card">
            <ProfileStat value={String(TRIP_COUNT)} label="Trips" />
            <View className="h-12 w-px self-center bg-border" />
            <ProfileStat value={String(saved.size)} label="Saved" />
            <View className="h-12 w-px self-center bg-border" />
            <ProfileStat
              value={SAMPLE_RATING.toFixed(1)}
              label="Rating"
              star
            />
          </View>

          <ProfileSection title="Account">
            <ProfileRow
              icon="user"
              label="Personal info"
              onPress={() => setSheet("personal")}
            />
            <ProfileRow
              icon="creditCard"
              label="Payment methods"
              onPress={() =>
                comingSoon("Payment methods aren't available yet.")
              }
            />
            <ProfileRow
              icon="luggage"
              label="Trips"
              onPress={() => router.navigate("/trips")}
            />
          </ProfileSection>

          <ProfileSection title="Preferences">
            <ProfileRow
              icon="bell"
              label="Notifications"
              onPress={() =>
                comingSoon("Notification settings aren't available yet.")
              }
            />
            <ProfileRow
              icon="circleHelp"
              label="Help & support"
              onPress={() => setSheet("help")}
            />
          </ProfileSection>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Free cancellation. Full refund up to 7 days before check-in."
            onPress={() => setSheet("cancellation")}
            className="mt-2 flex-row items-center gap-4 rounded-card bg-lavender-surface px-4 py-1.5"
            style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
          >
            <Icon name="fileText" size={28} color={colors.accentSoft} />
            <View className="flex-1">
              <AppText variant="promoTitle">Free cancellation</AppText>
              <AppText variant="captionSmall" tone="mutedForeground">
                Full refund up to 7 days before check-in.
              </AppText>
            </View>
            <Icon
              name="chevronRight"
              size="md"
              color={colors.accentSoft}
              strokeWidth={2.5}
            />
          </Pressable>
        </View>
      </ScrollView>

      <SettingsSheet
        visible={sheet === "settings"}
        email={email}
        onClose={closeSheet}
        onSignOut={() => void signOut()}
      />
      <PersonalInfoSheet
        visible={sheet === "personal"}
        onClose={closeSheet}
      />
      <HelpSheet
        visible={sheet === "help"}
        onClose={closeSheet}
        onCancellation={() => setSheet("cancellation")}
        onBrowse={() => {
          closeSheet();
          router.navigate("/home");
        }}
      />
      <CancellationSheet
        visible={sheet === "cancellation"}
        onClose={closeSheet}
      />
    </>
  );
}
