import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useRef, useState, type ComponentRef } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ReduceMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StayCard } from "@/components/stay-card";
import { StaySearchField } from "@/components/stay-search-field";
import { AppText, Chip, Icon } from "@/components/ui";
import { UserAvatar } from "@/components/user-avatar";
import {
  filterStays,
  STAY_CATEGORIES,
  type StayCategoryId,
} from "@/data/stays";
import { usePressScale } from "@/lib/use-press-scale";
import { firstNameFor } from "@/lib/user-name";
import { motion, useThemeColors } from "@/theme";

const enter = (step: number) =>
  FadeInDown.duration(motion.slow)
    .delay(step * 40)
    .easing(Easing.out(Easing.cubic))
    .reduceMotion(ReduceMotion.System);

export function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<StayCategoryId>("all");
  const avatarPress = usePressScale();
  const searchButtonPress = usePressScale();

  const firstName = firstNameFor(user);
  const stays = filterStays(category);

  const submitSearch = () => {
    const trimmed = query.trim();
    Keyboard.dismiss();

    router.navigate({
      pathname: "/search",
      params: { q: trimmed, t: String(Date.now()) },
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-card"
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <View className="px-5">
        <Animated.View
          entering={enter(0)}
          className="flex-row items-center justify-between"
        >
          <AppText variant="wordmark">room</AppText>

          <Animated.View style={avatarPress.animatedStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              onPress={() => router.navigate("/profile")}
              onPressIn={avatarPress.onPressIn}
              onPressOut={avatarPress.onPressOut}
            >
              <UserAvatar size="lg" />
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={enter(1)}>
          <AppText variant="greeting" className="mt-2">
            Hey, {firstName} 👋
          </AppText>
        </Animated.View>

        <Animated.View
          entering={enter(2)}
          className="mt-1 flex-row items-start justify-between"
        >
          <AppText variant="hero" className="flex-1 pr-3">
            {"Find your\nnext stay"}
          </AppText>

          <Animated.View style={searchButtonPress.animatedStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Focus search"
              onPress={() => inputRef.current?.focus()}
              onPressIn={searchButtonPress.onPressIn}
              onPressOut={searchButtonPress.onPressOut}
              className="mt-1 h-22 w-18 items-center justify-center rounded-field bg-muted"
            >
              <Icon name="search" size={24} color={colors.foreground} />
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={enter(3)} className="mt-4">
          <StaySearchField
            inputRef={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmit={submitSearch}
            placeholder="quiet pet friendly cabin with hot tub"
          />
        </Animated.View>

        <Animated.View
          entering={enter(4)}
          className="mt-5 flex-row flex-wrap gap-2.5"
        >
          {STAY_CATEGORIES.map((item) => {
            const selected = item.id === category;

            return (
              <Chip
                key={item.id}
                label={item.label}
                icon={item.icon}
                variant={selected ? "yellow" : "neutral"}
                selected={selected}
                onPress={() => setCategory(item.id)}
              />
            );
          })}
        </Animated.View>

        <Animated.View entering={enter(5)} className="mt-5">
          <Animated.View
            key={category}
            entering={FadeIn.duration(motion.fast).reduceMotion(
              ReduceMotion.System,
            )}
            className="gap-4"
          >
            {stays.map((stay) => (
              <StayCard key={stay.id} stay={stay} />
            ))}
          </Animated.View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}
