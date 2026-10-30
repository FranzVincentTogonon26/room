import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Keyboard, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ReduceMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StayCard } from "@/components/stay-card";
import { StaySearchField } from "@/components/stay-search-field";
import { AppText, Button, Chip, Icon } from "@/components/ui";
import {
  parseStayQuery,
  searchStays,
  STAY_CATEGORIES,
  type StayCategoryId,
} from "@/data/stays";
import { motion, useThemeColors } from "@/theme";

function Separator() {
  return <View className="h-4" />;
}

function EmptyState({ onClear }: { onClear: () => void }) {
  const colors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon name="search" size={28} color={colors.mutedForeground} />
      </View>
      <AppText variant="title" className="mt-4">
        No stays found
      </AppText>
      <AppText variant="caption" className="mt-1 text-center">
        Try a different place, amenity, or price.
      </AppText>
      <Button
        label="Clear search"
        variant="secondary"
        onPress={onClear}
        className="mt-6"
      />
    </View>
  );
}

export function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; t?: string }>();
  const formKey = `${params.q ?? ""}|${params.t ?? ""}`;

  return <SearchContent key={formKey} initialQuery={params.q ?? ""} />;
}

function SearchContent({ initialQuery }: { initialQuery: string }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [category, setCategory] = useState<StayCategoryId>("all");

  const results = searchStays(submittedQuery, category);
  const { maxPrice } = parseStayQuery(submittedQuery);
  const countLabel = `${results.length} ${results.length === 1 ? "stay" : "stays"}`;
  const filterNote = [
    submittedQuery ? `for “${submittedQuery}”` : null,
    maxPrice ? `under $${maxPrice}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const submitSearch = () => {
    setSubmittedQuery(query.trim());
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setQuery("");
    setSubmittedQuery("");
    setCategory("all");
    Keyboard.dismiss();
  };

  return (
    <View
      className="flex-1 bg-card"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Animated.View
        entering={FadeInDown.duration(motion.slow)
          .easing(Easing.out(Easing.cubic))
          .reduceMotion(ReduceMotion.System)}
        className="px-5"
      >
        <AppText variant="heading">Search</AppText>
        <AppText variant="caption" className="mt-1">
          Describe the stay you want.
        </AppText>

        <StaySearchField
          className="mt-5"
          value={query}
          onChangeText={setQuery}
          onSubmit={submitSearch}
          placeholder="quiet pet friendly cabin with hot tub"
        />

        <View className="mt-3 flex-row flex-wrap gap-2.5">
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
        </View>

        <View className="mt-5">
          <AppText variant="label">{countLabel}</AppText>
          {filterNote ? (
            <AppText
              variant="caption"
              tone="subtleForeground"
              numberOfLines={2}
              className="mt-0.5"
            >
              {filterNote}
            </AppText>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View
        key={`${submittedQuery}|${category}`}
        entering={FadeIn.duration(motion.base).reduceMotion(
          ReduceMotion.System,
        )}
        className="mt-4 flex-1"
      >
        <FlatList
          data={results}
          keyExtractor={(stay) => stay.id}
          renderItem={({ item }) => <StayCard stay={item} />}
          ItemSeparatorComponent={Separator}
          ListEmptyComponent={<EmptyState onClear={clearSearch} />}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 100,
          }}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
}
