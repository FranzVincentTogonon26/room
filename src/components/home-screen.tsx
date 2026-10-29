import { useClerk, useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  GlassTabBar,
  type GlassTabItem,
} from "@/components/glass-tab-bar";
import { AppText, Chip, Icon, IconButton } from "@/components/ui";
import { fontFamily, useThemeColors } from "@/theme";

const TAB_ITEMS: GlassTabItem[] = [
  { value: "home", label: "Home", icon: "house" },
  { value: "search", label: "Search", icon: "search" },
  { value: "trips", label: "Trips", icon: "calendarDays" },
  { value: "profile", label: "Profile", icon: "user" },
];

type Category = {
  label: string;
  icon: "house" | "treePine" | "waves" | "building2" | "treePalm";
};

const CATEGORIES: Category[] = [
  { label: "All Stays", icon: "house" },
  { label: "Cabins", icon: "treePine" },
  { label: "Beach", icon: "waves" },
  { label: "City", icon: "building2" },
  { label: "Villas", icon: "treePalm" },
];

const FEATURED_STAY = {
  image:
    "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80",
  location: "Lake Arrowhead, CA",
  title: "Modern Cabin\nwith Hot Tub",
  rating: "4.9",
};

function displayNameFor(user: ReturnType<typeof useUser>["user"]) {
  if (!user) return "there";

  if (user.firstName?.trim()) return user.firstName.trim();
  if (user.fullName?.trim()) return user.fullName.trim();

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) return "there";

  const name = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return name || "there";
}

export function HomeScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("home");
  const [activeCategory, setActiveCategory] = useState("All Stays");

  const firstName = displayNameFor(user).split(/\s+/)[0] || "there";

  return (
    <>
      <StatusBar style="dark" />
      <View className="flex-1 bg-card">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: 120,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header: wordmark, sign out, avatar */}
          <View className="flex-row items-center justify-between">
            <AppText
              variant="heading"
              tone="foreground"
              style={{
                fontFamily: fontFamily.sansExtraBold,
                fontSize: 32,
                lineHeight: 34,
                letterSpacing: -1.5,
              }}
            >
              room
            </AppText>

            <View className="flex-row items-center gap-2.5">
              <IconButton
                icon="logOut"
                label="Sign out"
                size="sm"
                variant="surface"
                onPress={() => void signOut()}
              />
              <View className="h-14 w-14 overflow-hidden rounded-full bg-primary">
                {user?.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    contentFit="cover"
                    transition={200}
                    style={{ width: "100%", height: "100%" }}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <AppText variant="title" tone="primaryForeground">
                      {firstName.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Greeting */}
          <AppText
            variant="title"
            tone="mutedForeground"
            style={{
              fontFamily: fontFamily.sans,
              fontSize: 28,
              lineHeight: 34,
              marginTop: 28,
            }}
          >
            Hey, {firstName} 👋
          </AppText>

          {/* Headline + search button */}
          <View className="mt-1 flex-row items-start justify-between">
            <AppText
              variant="heading"
              tone="foreground"
              style={{
                fontFamily: fontFamily.sansBold,
                fontSize: 46,
                lineHeight: 50,
                letterSpacing: -1.5,
              }}
            >
              {"Find your\nnext stay"}
            </AppText>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search stays"
              className="mt-1 h-[88px] w-[72px] items-center justify-center rounded-[24px] bg-muted active:opacity-75"
            >
              <Icon name="search" size={26} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Natural-language search pill */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Describe your stay: quiet pet friendly cabin with hot tub"
            className="mt-6 h-[64px] flex-row items-center gap-2.5 rounded-pill bg-lavender pl-4 pr-2 active:opacity-90"
          >
            <Icon name="sparkles" size={18} color={colors.lavenderForeground} />
            <AppText
              variant="button"
              tone="lavenderForeground"
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: fontFamily.sansMedium,
                fontSize: 14,
              }}
            >
              quiet pet friendly cabin with hot tub
            </AppText>
            <View className="h-[46px] w-[46px] items-center justify-center rounded-full bg-card">
              <Icon name="arrowUpRight" size={20} color={colors.foreground} />
            </View>
          </Pressable>

          {/* Category chips */}
          <View className="mt-5 flex-row flex-wrap gap-2.5">
            {CATEGORIES.map((category) => {
              const selected = category.label === activeCategory;
              return (
                <Chip
                  key={category.label}
                  label={category.label}
                  icon={category.icon}
                  variant={selected ? "yellow" : "neutral"}
                  selected={selected}
                  onPress={() => setActiveCategory(category.label)}
                />
              );
            })}
          </View>

          {/* Featured stay */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${FEATURED_STAY.title.replace("\n", " ")}, ${FEATURED_STAY.location}, rated ${FEATURED_STAY.rating}`}
            className="mt-6 h-[240px] overflow-hidden rounded-card active:opacity-95"
          >
            <Image
              source={{ uri: FEATURED_STAY.image }}
              contentFit="cover"
              transition={200}
              style={{ width: "100%", height: "100%" }}
              accessibilityIgnoresInvertColors
            />

            {/* Rating badge */}
            <View className="absolute right-4 top-4 h-11 flex-row items-center gap-1.5 rounded-pill bg-card/95 px-4">
              <Icon name="star" size={16} color={colors.star} fill={colors.star} />
              <AppText
                variant="label"
                tone="foreground"
                style={{ fontFamily: fontFamily.sansSemiBold }}
              >
                {FEATURED_STAY.rating}
              </AppText>
            </View>

            {/* Readability scrim */}
            <View className="absolute inset-x-0 bottom-0 h-1/2 bg-foreground/35" />

            {/* Location + title */}
            <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-between p-5">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-1.5">
                  <Icon name="mapPin" size={14} color={colors.card} />
                  <AppText
                    variant="caption"
                    style={{
                      fontFamily: fontFamily.sansMedium,
                      fontSize: 14,
                      color: colors.card,
                    }}
                  >
                    {FEATURED_STAY.location}
                  </AppText>
                </View>
                <AppText
                  variant="title"
                  style={{
                    fontFamily: fontFamily.sansBold,
                    fontSize: 27,
                    lineHeight: 32,
                    letterSpacing: -0.6,
                    color: colors.card,
                    marginTop: 4,
                  }}
                >
                  {FEATURED_STAY.title}
                </AppText>
              </View>

              <View className="h-12 w-12 items-center justify-center rounded-full bg-card">
                <Icon name="chevronRight" size={22} color={colors.foreground} />
              </View>
            </View>
          </Pressable>
        </ScrollView>

        {/* Presentational glass tab bar */}
        <View
          className="absolute inset-x-4"
          style={{ bottom: Math.max(insets.bottom, 12) }}
        >
          <GlassTabBar
            items={TAB_ITEMS}
            value={activeTab}
            onChange={setActiveTab}
          />
        </View>
      </View>
    </>
  );
}
