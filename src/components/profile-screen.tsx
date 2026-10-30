import { useClerk, useUser } from "@clerk/expo";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button } from "@/components/ui";
import { UserAvatar } from "@/components/user-avatar";
import { displayNameFor } from "@/lib/user-name";

export function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const insets = useSafeAreaInsets();

  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <ScrollView
      className="flex-1 bg-card"
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 100,
        paddingHorizontal: 20,
      }}
    >
      <AppText variant="heading">Profile</AppText>

      <View className="mt-10 items-center">
        <UserAvatar size="lg" />
        <AppText variant="title" className="mt-4">
          {displayNameFor(user)}
        </AppText>
        {email ? (
          <AppText variant="caption" className="mt-1">
            {email}
          </AppText>
        ) : null}
        <AppText variant="caption" tone="subtleForeground" className="mt-1">
          Signed in with Clerk
        </AppText>
      </View>

      <Button
        label="Sign out"
        variant="secondary"
        leftIcon="logOut"
        onPress={() => void signOut()}
        className="mt-10"
      />
    </ScrollView>
  );
}
