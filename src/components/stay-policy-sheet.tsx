import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";

import { BottomSheet, RNHostView } from "@expo/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Icon, IconButton, type IconName } from "@/components/ui";
import type { StayPolicy } from "@/data/stays";
import { useThemeColors } from "@/theme";

const POLICY_ORDER = [
  "cancellation",
  "houseRules",
  "checkInOut",
  "pets",
  "smoking",
  "quietHours",
  "safety",
];

const POLICY_ICONS: Record<string, IconName> = {
  cancellation: "calendarDays",
  houseRules: "house",
  checkInOut: "clock",
  pets: "pawPrint",
  smoking: "flame",
  quietHours: "moon",
  safety: "shield",
};

function policyRank(policy: StayPolicy) {
  const index = POLICY_ORDER.indexOf(policy.policyType);
  return index === -1 ? POLICY_ORDER.length : index;
}

export function StayPolicySheet({
  visible,
  policies,
  onClose,
}: {
  visible: boolean;
  policies: StayPolicy[];
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const ordered = [...policies].sort((a, b) => policyRank(a) - policyRank(b));

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
            accessibilityLabel="Close policies"
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
                <AppText variant="title">Policies</AppText>
                <AppText
                  variant="bodyCompact"
                  tone="mutedForeground"
                  className="mt-1"
                >
                  Cancellation, house rules, pets, check-in and more.
                </AppText>
              </View>
              <IconButton
                icon="x"
                label="Close policies"
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
              {ordered.length === 0 ? (
                <View className="py-8">
                  <AppText variant="title">No policies listed</AppText>
                  <AppText
                    variant="body"
                    tone="mutedForeground"
                    className="mt-2"
                  >
                    No policies are listed for this stay. Contact support if you
                    have questions.
                  </AppText>
                </View>
              ) : (
                ordered.map((policy, index) => (
                  <View key={policy.id || `${policy.policyType}-${index}`}>
                    {index > 0 ? (
                      <View className="my-4 h-px bg-border" />
                    ) : null}
                    <View className="flex-row items-start gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-tile bg-lavender-surface">
                        <Icon
                          name={POLICY_ICONS[policy.policyType] ?? "fileText"}
                          size="md"
                          color={colors.accent}
                        />
                      </View>
                      <View className="flex-1">
                        <AppText variant="cardTitleCompact">
                          {policy.title}
                        </AppText>
                        {policy.summary ? (
                          <AppText
                            variant="bodyCompact"
                            tone="mutedForeground"
                            className="mt-0.5"
                          >
                            {policy.summary}
                          </AppText>
                        ) : null}
                      </View>
                    </View>
                    {policy.body ? (
                      <AppText variant="body" className="mt-2">
                        {policy.body}
                      </AppText>
                    ) : null}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </RNHostView>
    </BottomSheet>
  );
}
