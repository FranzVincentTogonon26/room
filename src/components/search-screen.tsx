import { BottomSheet, RNHostView } from "@expo/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchStayCard } from "@/components/search-stay-card";
import { AppText, Button, Chip, Icon } from "@/components/ui";
import {
  searchStays,
  SORT_LABELS,
  STAY_CATEGORIES,
  type StayCategoryId,
  type StaySort,
} from "@/data/stays";
import { cn } from "@/lib/cn";
import { toggleSaved, useSavedStays } from "@/lib/saved-stays";
import { motion, typography, useThemeColors } from "@/theme";

type SearchFilters = {
  category: StayCategoryId;
  maxPrice?: number;
  petFriendly: boolean;
  quiet: boolean;
};

const DEFAULT_FILTERS: SearchFilters = {
  category: "all",
  maxPrice: undefined,
  petFriendly: false,
  quiet: false,
};

const PRICE_OPTIONS: { label: string; value?: number }[] = [
  { label: "Any" },
  { label: "Under $200", value: 200 },
  { label: "Under $300", value: 300 },
  { label: "Under $400", value: 400 },
];

const SORT_OPTIONS = Object.keys(SORT_LABELS) as StaySort[];

const enter = (delay = 0) =>
  FadeInDown.duration(motion.slow)
    .delay(delay)
    .easing(Easing.out(Easing.cubic))
    .reduceMotion(ReduceMotion.System);

function Separator() {
  return <View className="h-row" />;
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

function FilterSheet({
  open,
  onClose,
  query,
  sort,
  draft,
  onChange,
  onClear,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  query: string;
  sort: StaySort;
  draft: SearchFilters;
  onChange: (next: SearchFilters) => void;
  onClear: () => void;
  onApply: () => void;
}) {
  const colors = useThemeColors();
  const draftCount = searchStays(query, { ...draft, sort }).length;

  return (
    <BottomSheet
      isPresented={open}
      onDismiss={onClose}
      contentPadding={0}
      containerColor={colors.card}
    >
      <RNHostView matchContents={{ vertical: true }}>
        <View className="px-5 pb-4 pt-5">
          <View className="flex-row items-center justify-between">
            <AppText variant="title">Filters</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              hitSlop={4}
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-muted"
              style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
            >
              <Icon name="x" size="md" color={colors.foreground} />
            </Pressable>
          </View>

          <AppText variant="label" className="mt-5">
            Category
          </AppText>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {STAY_CATEGORIES.map((option) => {
              const selected = draft.category === option.id;

              return (
                <Chip
                  key={option.id}
                  label={option.label}
                  size="sm"
                  variant={selected ? "lavender" : "neutral"}
                  selected={selected}
                  onPress={() => onChange({ ...draft, category: option.id })}
                />
              );
            })}
          </View>

          <AppText variant="label" className="mt-5">
            Max price
          </AppText>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {PRICE_OPTIONS.map((option) => {
              const selected = draft.maxPrice === option.value;

              return (
                <Chip
                  key={option.label}
                  label={option.label}
                  size="sm"
                  variant={selected ? "lavender" : "neutral"}
                  selected={selected}
                  onPress={() => onChange({ ...draft, maxPrice: option.value })}
                />
              );
            })}
          </View>

          <AppText variant="label" className="mt-5">
            Good for
          </AppText>
          <View className="mt-2 flex-row flex-wrap gap-2">
            <Chip
              label="Pet Friendly"
              size="sm"
              variant={draft.petFriendly ? "lavender" : "neutral"}
              selected={draft.petFriendly}
              onPress={() =>
                onChange({ ...draft, petFriendly: !draft.petFriendly })
              }
            />
            <Chip
              label="Quiet"
              size="sm"
              variant={draft.quiet ? "lavender" : "neutral"}
              selected={draft.quiet}
              onPress={() => onChange({ ...draft, quiet: !draft.quiet })}
            />
          </View>

          <View className="mt-6 flex-row gap-3">
            <Button
              label="Clear"
              variant="secondary"
              onPress={onClear}
              className="flex-1"
            />
            <Button
              label={`Show ${draftCount} ${draftCount === 1 ? "stay" : "stays"}`}
              onPress={onApply}
              className="flex-1"
            />
          </View>
        </View>
      </RNHostView>
    </BottomSheet>
  );
}

function SortSheet({
  open,
  onClose,
  sort,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  sort: StaySort;
  onSelect: (next: StaySort) => void;
}) {
  const colors = useThemeColors();

  return (
    <BottomSheet
      isPresented={open}
      onDismiss={onClose}
      contentPadding={0}
      containerColor={colors.card}
    >
      <RNHostView matchContents={{ vertical: true }}>
        <View className="px-5 pb-4 pt-5">
          <View className="flex-row items-center justify-between">
            <AppText variant="title">Sort by</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sort"
              hitSlop={4}
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-muted"
              style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
            >
              <Icon name="x" size="md" color={colors.foreground} />
            </Pressable>
          </View>

          <View className="mt-4 gap-1">
            {SORT_OPTIONS.map((value) => {
              const selected = sort === value;

              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={SORT_LABELS[value]}
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(value)}
                  className={cn(
                    "h-12 flex-row items-center justify-between rounded-tile px-4",
                    selected && "bg-muted",
                  )}
                  style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
                >
                  <AppText variant="body">{SORT_LABELS[value]}</AppText>
                  {selected ? (
                    <Icon name="check" size="md" color={colors.accent} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </RNHostView>
    </BottomSheet>
  );
}

export function SearchScreen() {
  const params = useLocalSearchParams<{
    q?: string;
    category?: StayCategoryId;
    t?: string;
  }>();
  const formKey = `${params.q ?? ""}|${params.category ?? "all"}|${params.t ?? ""}`;

  return (
    <SearchContent
      key={formKey}
      initialQuery={params.q ?? ""}
      initialCategory={(params.category as StayCategoryId) ?? "all"}
    />
  );
}

function SearchContent({
  initialQuery,
  initialCategory,
}: {
  initialQuery: string;
  initialCategory: StayCategoryId;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const savedIds = useSavedStays();
  const body = typography.body;

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    category: initialCategory,
  });
  const [sort, setSort] = useState<StaySort>("best");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [draft, setDraft] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    category: initialCategory,
  });

  const results = searchStays(query, { ...filters, sort });
  const countLabel = `${results.length} ${results.length === 1 ? "stay" : "stays"}`;
  const isCabins = filters.category === "cabins";
  const isUnder300 = filters.maxPrice === 300;

  const openFilters = () => {
    setDraft(filters);
    setSortOpen(false);
    setFilterOpen(true);
  };

  const clearSearch = () => {
    setQuery("");
    setFilters(DEFAULT_FILTERS);
    setSort("best");
    Keyboard.dismiss();
  };

  return (
    <>
      <View className="flex-1 bg-card" style={{ paddingTop: insets.top + 8 }}>
        <Animated.View entering={enter()} style={{ paddingHorizontal: 16 }}>
          <View className="flex-row items-center" style={{ gap: 16 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Home"
              onPress={() => router.navigate("/home")}
              className="h-12 w-12 items-center justify-center rounded-full bg-muted"
              style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
            >
              <Icon name="chevronLeft" size={24} color={colors.foreground} />
            </Pressable>

            <View
              className="h-12 flex-1 flex-row items-center rounded-pill bg-muted"
              style={{ gap: 16, paddingLeft: 16, paddingRight: 4 }}
            >
              <Icon name="search" size="md" color={colors.mutedForeground} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => Keyboard.dismiss()}
                placeholder="Search stays"
                placeholderTextColor={colors.placeholder}
                selectionColor={colors.accent}
                returnKeyType="search"
                multiline={false}
                numberOfLines={1}
                accessibilityLabel="Search stays"
                className="h-full flex-1"
                style={{
                  paddingVertical: 0,
                  fontFamily: body.fontFamily,
                  fontSize: body.fontSize,
                  letterSpacing: body.letterSpacing,
                  color: colors.foreground,
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open filters"
                hitSlop={4}
                onPress={openFilters}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
              >
                <Icon
                  name="slidersHorizontal"
                  size="md"
                  color={colors.foreground}
                />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={enter(60)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 14 }}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            keyboardShouldPersistTaps="handled"
          >
            <Chip
              label="Cabins"
              size="sm"
              variant={isCabins ? "lavender" : "neutral"}
              selected={isCabins}
              onPress={() =>
                setFilters((current) => ({
                  ...current,
                  category: current.category === "cabins" ? "all" : "cabins",
                }))
              }
            />
            <Chip
              label="Under $300"
              size="sm"
              variant={isUnder300 ? "lavender" : "neutral"}
              selected={isUnder300}
              onPress={() =>
                setFilters((current) => ({
                  ...current,
                  maxPrice: current.maxPrice === 300 ? undefined : 300,
                }))
              }
            />
            <Chip
              label="Pet Friendly"
              size="sm"
              variant={filters.petFriendly ? "lavender" : "neutral"}
              selected={filters.petFriendly}
              onPress={() =>
                setFilters((current) => ({
                  ...current,
                  petFriendly: !current.petFriendly,
                }))
              }
            />
            <Chip
              label="Quiet"
              size="sm"
              variant={filters.quiet ? "lavender" : "neutral"}
              selected={filters.quiet}
              onPress={() =>
                setFilters((current) => ({ ...current, quiet: !current.quiet }))
              }
            />
          </ScrollView>
        </Animated.View>

        <View
          className="flex-row items-center justify-between"
          style={{ marginTop: 20, paddingHorizontal: 16 }}
        >
          <AppText variant="cardTitleCompact">{countLabel}</AppText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sort stays, currently ${SORT_LABELS[sort]}`}
            onPress={() => setSortOpen(true)}
            className="ml-3 flex-row items-center gap-1"
            style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
          >
            <AppText variant="caption">Sort by</AppText>
            <AppText variant="label" numberOfLines={1} className="shrink">
              {SORT_LABELS[sort]}
            </AppText>
            <Icon name="chevronDown" size={16} color={colors.foreground} />
          </Pressable>
        </View>

        <FlatList
          data={results}
          keyExtractor={(stay) => stay.id}
          renderItem={({ item }) => (
            <SearchStayCard
              stay={item}
              saved={savedIds.has(item.id)}
              onToggleSave={() => toggleSaved(item.id)}
            />
          )}
          ItemSeparatorComponent={Separator}
          ListEmptyComponent={<EmptyState onClear={clearSearch} />}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: insets.bottom + 24,
          }}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      </View>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        query={query}
        sort={sort}
        draft={draft}
        onChange={setDraft}
        onClear={() => setDraft(DEFAULT_FILTERS)}
        onApply={() => {
          setFilters(draft);
          setFilterOpen(false);
        }}
      />

      <SortSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        sort={sort}
        onSelect={(next) => {
          setSort(next);
          setSortOpen(false);
        }}
      />
    </>
  );
}
