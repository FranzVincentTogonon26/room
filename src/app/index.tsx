import { Stack, useRouter } from "expo-router";
import { View } from "react-native";

import { AppText, Button } from "@/components/ui";

export default function Index() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 justify-center gap-4 bg-canvas px-gutter">
        <AppText variant="heading">Welcome to Room</AppText>
        <AppText variant="body" tone="mutedForeground">
          Describe the stay you want in one sentence and get ranked stays back.
        </AppText>

        {__DEV__ ? (
          <Button
            label="Design system"
            variant="secondary"
            rightIcon="arrowRight"
            className="mt-4"
            onPress={() => router.push("/catalog")}
          />
        ) : null}
      </View>
    </>
  );
}
