import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import { Redirect, Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { AppText, Button, GoogleMark, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useGoogleAuth } from "@/lib/use-google-auth";
import { fontFamily, spacing, useThemeColors } from "@/theme";
type OnboardingSlide = {
  id: string;
  image: string;
  location: string;
  title: string;
  description: string;
};

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "whistler",
    image:
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80",
    location: "Whistler, BC",
    title: "Find a stay that\nfits your story",
    description:
      "From mountain cabins to oceanfront villas, room helps you find unforgettable stays for every kind of trip.",
  },
  {
    id: "arrowhead",
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
    location: "Lake Arrowhead, CA",
    title: "Cozy spaces designed\nfor memorable trips",
    description:
      "Discover handpicked spaces with scenic views, hot tubs, and thoughtful amenities designed for your journey.",
  },
  {
    id: "aspen",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
    location: "Aspen, CO",
    title: "Book with confidence,\nevery single time",
    description:
      "Transparent pricing, clear house policies, and instant answers straight from verified property details.",
  },
];

type OnboardingHeroImageProps = {
  uri: string;
  index: number;
  width: number;
  height: number;
  scrollX: SharedValue<number>;
};

function OnboardingHeroImage({
  uri,
  index,
  width,
  height,
  scrollX,
}: OnboardingHeroImageProps) {
  // Slight parallax on the photo so it trails the page while swiping.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (scrollX.value - index * width) * 0.12 },
      { scale: 1.08 },
    ],
  }));

  return (
    <View style={{ width, height }} className="overflow-hidden">
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Image
          source={{ uri }}
          contentFit="cover"
          transition={200}
          style={{ width: "100%", height: "100%" }}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </View>
  );
}

type OnboardingSlideTextProps = {
  slide: OnboardingSlide;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
};

function OnboardingSlideText({
  slide,
  index,
  width,
  scrollX,
}: OnboardingSlideTextProps) {
  // Crossfade and lift the copy as its page approaches the center.
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    return {
      opacity: interpolate(
        scrollX.value,
        inputRange,
        [0.35, 1, 0.35],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            inputRange,
            [18, 0, 18],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(
            scrollX.value,
            inputRange,
            [0.97, 1, 0.97],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <AppText
        variant="heading"
        tone="foreground"
        style={{
          fontFamily: fontFamily.sansBold,
          fontSize: 30,
          lineHeight: 40,
          letterSpacing: -0.6,
        }}
      >
        {slide.title}
      </AppText>

      <AppText
        variant="body"
        tone="mutedForeground"
        style={{
          fontFamily: fontFamily.sans,
          fontSize: 15,
          lineHeight: 22,
          marginTop: 10,
        }}
      >
        {slide.description}
      </AppText>
    </Animated.View>
  );
}

function OnboardingView() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const {
    signInWithGoogle,
    isPending: isGooglePending,
    error: googleError,
  } = useGoogleAuth();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  // Split screen proportions matching the design: hero image ~58% height, card ~42%
  const heroHeight = Math.round(screenHeight * 0.58);
  const curveHeight = 44;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // The copy row follows the photo pager pixel for pixel.
  const textTrackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -scrollX.value }],
  }));

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.min(
      Math.max(0, Math.round(offsetX / screenWidth)),
      ONBOARDING_SLIDES.length - 1,
    );
    setActiveIndex(nextIndex);
  };

  const handleSkip = () => {
    router.push("/(auth)/sign-up");
  };

  const handleGetStarted = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      router.push("/(auth)/sign-up");
    }
  };

  // Asymmetrical organic curve for the top of the white card
  // Starts higher on the left, smooth descent to the right
  const curvePath = `
    M 0 ${curveHeight}
    L 0 20
    C 0 8 16 0 34 0
    C ${screenWidth * 0.35} 0 ${screenWidth * 0.7} 26 ${screenWidth - 34} 26
    C ${screenWidth - 14} 26 ${screenWidth} 34 ${screenWidth} ${curveHeight}
    Z
  `;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <View className="flex-1 bg-card">
        {/* Swipable Hero Images */}
        <View style={{ height: heroHeight, width: screenWidth }}>
          <Animated.FlatList
            ref={flatListRef}
            data={ONBOARDING_SLIDES}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            onScroll={scrollHandler}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            renderItem={({ item, index }) => (
              <OnboardingHeroImage
                uri={item.image}
                index={index}
                width={screenWidth}
                height={heroHeight}
                scrollX={scrollX}
              />
            )}
          />

          {/* Floating Top Header: Wordmark & Skip Pill */}
          <View
            style={{ paddingTop: Math.max(insets.top, 16) }}
            className="absolute inset-x-0 top-0 z-20 flex-row items-center justify-between px-gutter"
          >
            <AppText
              variant="heading"
              style={{
                fontFamily: fontFamily.sansExtraBold,
                fontSize: 32,
                lineHeight: 34,
                letterSpacing: -1.5,
              }}
              tone="foreground"
            >
              room
            </AppText>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
              onPress={handleSkip}
              className="rounded-pill border border-white/60 bg-white/80 px-5 py-2 shadow-sm active:opacity-75"
            >
              <AppText
                variant="label"
                style={{ fontFamily: fontFamily.sansMedium, fontSize: 14 }}
                tone="foreground"
              >
                Skip
              </AppText>
            </Pressable>
          </View>

          {/* Location Badge track: each location rides its own photo */}
          <View
            style={{ bottom: 48, width: screenWidth }}
            className="absolute left-0 z-10 overflow-hidden"
          >
            <Animated.View style={[{ flexDirection: "row" }, textTrackStyle]}>
              {ONBOARDING_SLIDES.map((slide) => (
                <View
                  key={slide.id}
                  style={{ width: screenWidth }}
                  className="pl-gutter"
                >
                  <View className="flex-row items-center gap-1.5 self-start rounded-pill border border-white/30 bg-black/45 px-3.5 py-1.5 backdrop-blur-md">
                    <Icon name="mapPin" size={14} color="#FFFFFF" />
                    <AppText
                      variant="caption"
                      style={{
                        fontFamily: fontFamily.sansMedium,
                        fontSize: 13,
                        color: "#FFFFFF",
                      }}
                    >
                      {slide.location}
                    </AppText>
                  </View>
                </View>
              ))}
            </Animated.View>
          </View>
        </View>

        {/* Asymmetrical Curved Card */}
        <View className="flex-1 bg-card px-gutter">
          {/* Top curve SVG cap */}
          <Svg
            width={screenWidth}
            height={curveHeight}
            viewBox={`0 0 ${screenWidth} ${curveHeight}`}
            style={{ position: "absolute", top: -curveHeight + 1, left: 0 }}
          >
            <Path d={curvePath} fill={colors.card} />
          </Svg>

          <View
            className="flex-1 justify-between pt-1 pb-6"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View>
              {/* Pagination Indicators */}
              <View className="flex-row items-center gap-1.5 pt-1 pb-4">
                {ONBOARDING_SLIDES.map((slide, index) => {
                  const active = index === activeIndex;
                  return (
                    <Pressable
                      key={slide.id}
                      onPress={() => {
                        flatListRef.current?.scrollToIndex({
                          index,
                          animated: true,
                        });
                        setActiveIndex(index);
                      }}
                      accessibilityRole="tab"
                      accessibilityLabel={`Slide ${index + 1}`}
                      accessibilityState={{ selected: active }}
                    >
                      <View
                        className={cn(
                          "h-1 rounded-full",
                          active ? "w-9 bg-lavender" : "w-4 bg-border",
                        )}
                      />
                    </Pressable>
                  );
                })}
              </View>

              {/* Title + description: one page per slide, driven by the pager offset */}
              <View
                style={{
                  width: screenWidth,
                  marginHorizontal: -spacing.gutter,
                }}
                className="overflow-hidden"
              >
                <Animated.View
                  style={[{ flexDirection: "row" }, textTrackStyle]}
                >
                  {ONBOARDING_SLIDES.map((slide, index) => (
                    <View
                      key={slide.id}
                      style={{
                        width: screenWidth,
                        paddingHorizontal: spacing.gutter,
                      }}
                    >
                      <OnboardingSlideText
                        slide={slide}
                        index={index}
                        width={screenWidth}
                        scrollX={scrollX}
                      />
                    </View>
                  ))}
                </Animated.View>
              </View>
            </View>

            {/* Actions */}
            <View className="gap-3">
              <Button
                label="Get started"
                variant="primary"
                rightIcon="arrowRight"
                onPress={handleGetStarted}
                disabled={isGooglePending}
                className="h-[54px]"
              />

              <Button
                label="Continue with Google"
                variant="secondary"
                leftElement={<GoogleMark size={20} />}
                onPress={() => void signInWithGoogle()}
                loading={isGooglePending}
                disabled={isGooglePending}
                className="h-[54px]"
              />

              {googleError ? (
                <View className="flex-row items-center justify-center gap-1.5">
                  <Icon name="circleAlert" size={15} color={colors.error} />
                  <AppText variant="caption" tone="errorForeground">
                    {googleError}
                  </AppText>
                </View>
              ) : null}

              {/* Dev Shortcut to design catalog */}
              {__DEV__ ? (
                <Pressable
                  onPress={() => router.push("/catalog")}
                  className="mt-1 self-center rounded-pill bg-muted/60 px-3 py-1"
                ></Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

export default function IndexScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/(app)/home" />;

  return <OnboardingView />;
}
