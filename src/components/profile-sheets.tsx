import { BottomSheet, RNHostView } from "@expo/ui";
import { useUser } from "@clerk/expo";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button, Icon, IconButton } from "@/components/ui";
import { UserAvatar } from "@/components/user-avatar";
import { displayNameFor } from "@/lib/user-name";
import { useThemeColors } from "@/theme";

function ProfileSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

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
            accessibilityLabel={`Close ${title.toLowerCase()}`}
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
                <AppText variant="title">{title}</AppText>
                {subtitle ? (
                  <AppText
                    variant="bodyCompact"
                    tone="mutedForeground"
                    className="mt-1"
                  >
                    {subtitle}
                  </AppText>
                ) : null}
              </View>
              <IconButton
                icon="x"
                label={`Close ${title.toLowerCase()}`}
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
              {children}
            </ScrollView>
          </View>
        </View>
      </RNHostView>
    </BottomSheet>
  );
}

export function SettingsSheet({
  visible,
  email,
  onClose,
  onSignOut,
}: {
  visible: boolean;
  email?: string;
  onClose: () => void;
  onSignOut: () => void;
}) {
  return (
    <ProfileSheet
      visible={visible}
      title="Settings"
      subtitle="Account and app preferences."
      onClose={onClose}
    >
      <View className="mt-3 rounded-card bg-muted p-4">
        <AppText variant="caption">Signed in as</AppText>
        <AppText variant="body" className="mt-0.5" numberOfLines={1}>
          {email ?? "No email on file"}
        </AppText>
      </View>

      <Button
        label="Sign out"
        variant="secondary"
        leftIcon="logOut"
        onPress={onSignOut}
        className="mt-4"
      />

      <AppText variant="caption" className="mt-3 text-center">
        You&apos;ll need your email and password to sign back in.
      </AppText>
    </ProfileSheet>
  );
}

export function PersonalInfoSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { user } = useUser();
  const name = user?.fullName?.trim() || displayNameFor(user);
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <ProfileSheet
      visible={visible}
      title="Personal info"
      subtitle="The name and email on your Room account."
      onClose={onClose}
    >
      <View className="mt-2 items-center py-4">
        <UserAvatar size="lg" />
        <AppText variant="title" className="mt-4 text-center">
          {name}
        </AppText>
        {email ? (
          <AppText
            variant="body"
            tone="mutedForeground"
            className="mt-1 text-center"
            numberOfLines={1}
          >
            {email}
          </AppText>
        ) : null}
      </View>

      <AppText variant="caption" className="mt-2 text-center">
        Managed by Clerk. Editing your profile is coming soon.
      </AppText>
    </ProfileSheet>
  );
}

export function HelpSheet({
  visible,
  onClose,
  onCancellation,
  onBrowse,
}: {
  visible: boolean;
  onClose: () => void;
  onCancellation: () => void;
  onBrowse: () => void;
}) {
  return (
    <ProfileSheet
      visible={visible}
      title="Help & support"
      subtitle="We're here to help."
      onClose={onClose}
    >
      <View className="mt-2 gap-3">
        <View className="rounded-card bg-muted p-4">
          <AppText variant="cardTitleCompact">Stay questions</AppText>
          <AppText
            variant="bodyCompact"
            tone="mutedForeground"
            className="mt-1"
          >
            Open any stay and tap Ask about this stay. Answers quote the stay
            and Room&apos;s policies.
          </AppText>
        </View>

        <View className="rounded-card bg-muted p-4">
          <AppText variant="cardTitleCompact">Cancellation</AppText>
          <AppText
            variant="bodyCompact"
            tone="mutedForeground"
            className="mt-1"
          >
            Full refund up to 7 days before check-in. Each stay lists its exact
            policy on its details page.
          </AppText>
        </View>
      </View>

      <Button
        label="View cancellation policy"
        variant="secondary"
        onPress={onCancellation}
        className="mt-4"
      />
      <Button label="Browse stays" onPress={onBrowse} className="mt-3" />
    </ProfileSheet>
  );
}

export function CancellationSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useThemeColors();

  return (
    <ProfileSheet
      visible={visible}
      title="Free cancellation"
      subtitle="Full refund up to 7 days before check-in."
      onClose={onClose}
    >
      <View className="mt-2 flex-row items-center gap-4">
        <View className="h-12 w-12 items-center justify-center rounded-tile bg-lavender-surface">
          <Icon name="fileText" size="lg" color={colors.accentSoft} />
        </View>
        <AppText variant="body" className="flex-1">
          The exact cancellation policy for each stay is shown on the
          stay&apos;s details page.
        </AppText>
      </View>

      <View className="mt-5 h-px bg-border" />

      <AppText variant="caption" className="mt-4">
        This is Room&apos;s standard promise. Some stays have different terms.
      </AppText>
    </ProfileSheet>
  );
}
