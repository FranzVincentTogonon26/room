import { BlurTargetView } from "expo-blur";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type PropsWithChildren,
} from "react";
import { ScrollView, View } from "react-native";

import { GlassTabBar, type GlassTabItem } from "@/components/glass-tab-bar";
import { ListingCard } from "@/components/listing-card";
import { PolicyCard } from "@/components/policy-card";
import { ProfileRow, ProfileRowGroup } from "@/components/profile-row";
import { StayCard } from "@/components/stay-card";
import { Wordmark } from "@/components/wordmark";
import { STAYS } from "@/data/stays";
import {
  AppText,
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  Input,
  SegmentedControl,
  Stepper,
  Toggle,
  type IconName,
  type SegmentOption,
} from "@/components/ui";
import {
  iconTokens,
  motion,
  palette,
  radius,
  spacing,
  themeColors,
  typography,
  useThemeScheme,
  type TypeVariant,
} from "@/theme";

const LISTING_IMAGE =
  "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=800&q=80";
const semanticKeys = [
  "canvas",
  "card",
  "muted",
  "border",
  "foreground",
  "mutedForeground",
  "subtleForeground",
  "placeholder",
  "primary",
  "primaryForeground",
  "lavender",
  "lavenderSurface",
  "lavenderStrong",
  "focus",
  "focusRing",
  "accent",
  "star",
  "success",
  "successForeground",
  "successSurface",
  "error",
  "errorForeground",
  "errorSurface",
  "segmentSelected",
  "glassBar",
  "glassBarBorder",
] as const;

const brandSwatches = [
  { label: "Primary Yellow", value: palette.primary },
  { label: "Lavender", value: palette.lavender },
  { label: "Text Primary", value: palette.textPrimary },
  { label: "Text Secondary", value: palette.textSecondary },
  { label: "Surface White", value: palette.surfaceWhite },
  { label: "Surface Gray", value: palette.surfaceGray },
  { label: "Border Gray", value: palette.borderGray },
] as const;

const typeOrder: TypeVariant[] = [
  "display",
  "wordmark",
  "wordmarkCompact",
  "heading",
  "hero",
  "tagline",
  "taglineCompact",
  "greeting",
  "title",
  "cardTitle",
  "body",
  "label",
  "caption",
  "button",
  "badge",
  "price",
  "tab",
];

const typeSamples: Record<TypeVariant, string> = {
  display: "Find your\nnext stay",
  heading: "Modern Cabin\nwith Hot Tub",
  hero: "Find your\nnext stay",
  greeting: "Hey, Joanna 👋",
  tagline: "Find unforgettable stays",
  taglineCompact: "Find unforgettable stays",
  title: "Cozy A-Frame Cabin",
  cardTitle: "Modern Cabin\nwith Hot Tub",
  body: "From mountain cabins to oceanfront villas, room helps you find unforgettable stays for every kind of trip.",
  label: "Personal info",
  caption: "Lake Arrowhead, CA",
  button: "Book this stay",
  badge: "Guest favorite",
  price: "$280",
  tab: "Home",
  wordmark: "room",
  wordmarkCompact: "room",
};

const iconSamples: IconName[] = [
  "house",
  "search",
  "heart",
  "calendarDays",
  "user",
  "settings",
  "mapPin",
  "slidersHorizontal",
  "share",
  "upload",
  "bookmark",
  "bath",
  "pawPrint",
  "treePine",
  "waves",
  "globe",
];

const tabItems: GlassTabItem[] = [
  { value: "home", label: "Home", icon: "house" },
  { value: "search", label: "Search", icon: "search" },
  { value: "trips", label: "Trips", icon: "calendarDays" },
  { value: "profile", label: "Profile", icon: "user" },
];

const segmentOptions: SegmentOption[] = [
  { value: "list", label: "List", icon: "list" },
  { value: "map", label: "Map", icon: "map" },
];

const themeOptions: SegmentOption[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const spacingScale = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64];

const kebab = (value: string) => value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const chunk = <T,>(items: readonly T[], size: number) =>
  items.reduce<T[][]>((rows, item, index) => {
    if (index % size === 0) rows.push([]);
    rows[rows.length - 1].push(item);
    return rows;
  }, []);

function Section({
  title,
  subtitle,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
}>) {
  return (
    <Card className="gap-4">
      <View className="gap-1">
        <AppText variant="title">{title}</AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
      {children}
    </Card>
  );
}

function ColorSwatch({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-1.5">
      <View
        className="h-12 rounded-tile border border-border"
        style={{ backgroundColor: value }}
      />
      <AppText variant="caption" tone="foreground" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="caption" numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

function ChipGroup() {
  const [place, setPlace] = useState("all");

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Cabins" variant="lavender" selected />
        <Chip label="Under $300" />
        <Chip label="Pet Friendly" />
        <Chip label="Quiet" />
      </View>

      <View className="flex-row flex-wrap gap-2">
        <Chip
          label="All Stays"
          icon="house"
          variant={place === "all" ? "yellow" : "neutral"}
          selected={place === "all"}
          onPress={() => setPlace("all")}
        />
        {(
          [
            { value: "cabins", label: "Cabins", icon: "treePine" },
            { value: "beach", label: "Beach", icon: "waves" },
            { value: "city", label: "City", icon: "building2" },
            { value: "villas", label: "Villas", icon: "treePalm" },
          ] as const
        ).map((option) => {
          const selected = place === option.value;
          return (
            <Chip
              key={option.value}
              label={option.label}
              icon={option.icon}
              variant={selected ? "lavender" : "neutral"}
              selected={selected}
              onPress={() => setPlace(option.value)}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function CatalogScreen() {
  const systemScheme = useThemeScheme();
  const { setColorScheme } = useColorScheme();

  const [themePreview, setThemePreview] = useState("system");
  const previewScheme =
    themePreview === "dark" ? "dark" : themePreview === "light" ? "light" : systemScheme;
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("Cabins in California");
  const [name, setName] = useState("Joanna Smith");
  const [password, setPassword] = useState("password123");
  const [email, setEmail] = useState("joanna@");
  const [placeSelected, setPlaceSelected] = useState("list");
  const [instantBook, setInstantBook] = useState(true);
  const [guests, setGuests] = useState(1);
  const [tab, setTab] = useState("home");
  const tabBlurTargetRef = useRef<ComponentRef<typeof View>>(null);
  const [showSuccess, setShowSuccess] = useState(true);
  const [showError, setShowError] = useState(true);

  // Cleanup: reset to system scheme when leaving the catalog.
  // Empty dep array so this only runs on unmount — setColorScheme is a new
  // function reference on every render (NativeWind creates a wrapper closure
  // each time), so including it would re-run the effect (and its cleanup)
  // after every theme change, immediately resetting back to "system".
  useEffect(() => {
    return () => setColorScheme("system");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Stack.Screen
        options={{ title: "Design system", headerBackButtonDisplayMode: "minimal" }}
      />

      <ScrollView
        className="flex-1 bg-canvas"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-section px-gutter py-section">
          <Card className="gap-3">
            <AppText variant="label">Preview theme</AppText>
            <SegmentedControl
              options={themeOptions}
              value={themePreview}
              onChange={(next) => {
                setThemePreview(next);
                setColorScheme(next as "light" | "dark" | "system");
              }}
            />
            <AppText variant="caption">
              System follows the device. The manual choice is catalog-only.
            </AppText>
          </Card>

          <Section title="01. Brand">
            <Wordmark />
            <Badge label="Typeset placeholder — awaiting logo asset" tone="lavender" />
          </Section>

          <Section
            title="02. Color palette"
            subtitle="Brand colors first, then the active semantic theme"
          >
            <View className="gap-4">
              {chunk(brandSwatches, 2).map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row gap-3">
                  {row.map((swatch) => (
                    <ColorSwatch key={swatch.label} label={swatch.label} value={swatch.value} />
                  ))}
                  {row.length === 1 ? <View className="flex-1" /> : null}
                </View>
              ))}

              <View className="flex-1 gap-1.5">
                <View className="h-12 flex-row overflow-hidden rounded-tile border border-border">
                  <View className="flex-1 bg-lavender" />
                  <View className="flex-1 bg-primary" />
                  <View className="absolute inset-x-6 inset-y-3 rounded-pill border border-glass-border bg-glass" />
                </View>
                <AppText variant="caption" tone="foreground">
                  Glass Blur
                </AppText>
                <AppText variant="caption">{palette.glassBlur}</AppText>
              </View>
            </View>

            <View className="gap-3">
              {chunk(semanticKeys, 2).map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row gap-3">
                  {row.map((key) => (
                    <ColorSwatch
                      key={key}
                      label={kebab(key)}
                      value={themeColors[previewScheme][key]}
                    />
                  ))}
                  {row.length === 1 ? <View className="flex-1" /> : null}
                </View>
              ))}
            </View>

            <AppText variant="caption">
              Semantic values shown for the {previewScheme} preview.
            </AppText>
          </Section>

          <Section
            title="03. Typography"
            subtitle="Poppins · 400 / 500 / 600 / 700 / 800"
          >
            <View className="gap-5">
              {typeOrder.map((variant) => {
                const type = typography[variant];
                return (
                  <View key={variant} className="gap-1">
                    <AppText variant="caption" tone="foreground">
                      {variant} · {type.fontFamily.replace("Poppins-", "")} · {type.fontSize}/
                      {type.lineHeight}
                    </AppText>
                    <AppText variant={variant}>{typeSamples[variant]}</AppText>
                  </View>
                );
              })}
            </View>
          </Section>

          <Section title="04. Buttons">
            <View className="gap-3">
              <Button label="Book this stay" rightIcon="arrowRight" onPress={() => {}} />
              <Button
                label="Continue with Google"
                variant="secondary"
                leftIcon="globe"
                onPress={() => {}}
              />
              <AppText variant="caption">
                Google G asset pending — Globe icon stands in.
              </AppText>

              <View className="flex-row flex-wrap gap-3">
                <IconButton icon="heart" label="Favorite" size="lg" onPress={() => {}} />
                <IconButton icon="share" label="Share" size="lg" onPress={() => {}} />
                <IconButton icon="search" label="Search" size="lg" onPress={() => {}} />
                <IconButton icon="bookmark" label="Save" size="lg" onPress={() => {}} />
              </View>

              <View className="gap-2">
                <AppText variant="caption">State samples</AppText>
                <Button label="Unavailable" disabled onPress={() => {}} />
                <Button label="Checking availability" loading onPress={() => {}} />
              </View>
            </View>
          </Section>

          <Section title="05. Input fields">
            <View className="gap-3">
              <Input
                leftIcon="search"
                rightIcon="slidersHorizontal"
                onRightIconPress={() => {}}
                value={search}
                onChangeText={setSearch}
                placeholder="Search stays"
                accessibilityLabel="Search stays"
              />
              <Input
                leftIcon="user"
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                accessibilityLabel="Name"
              />
              <Input
                leftIcon="lock"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Password"
                accessibilityLabel="Password"
              />
              <Input
                value={email}
                onChangeText={setEmail}
                error="Enter a valid email address"
                placeholder="Email"
                accessibilityLabel="Email"
              />
              <Input placeholder="Disabled field" disabled accessibilityLabel="Disabled field" />
            </View>
          </Section>

          <Section
            title="06. Filter chips"
            subtitle="Tap a place"
          >
            <ChipGroup />
          </Section>

          <Section title="07. Listing cards">
            <ListingCard
              title="Modern Cabin with Hot Tub"
              location="Lake Arrowhead, CA"
              rating={4.9}
              reviewCount={342}
              price={280}
              imageUri={LISTING_IMAGE}
              amenities={[
                { icon: "bath", label: "Hot Tub" },
                { icon: "pawPrint", label: "Pet Friendly" },
              ]}
              saved={saved}
              onToggleSave={() => setSaved((current) => !current)}
              onPress={() => {}}
            />
            <AppText variant="caption">Sample photo · Unsplash placeholder</AppText>
            <StayCard stay={STAYS[0]} className="mt-3" />
            <AppText variant="caption">Home stay card · display only</AppText>
          </Section>

          <Section title="08. Policy card">
            <View className="gap-3">
              <PolicyCard
                icon="ghost"
                title="Ask about policies"
                description="Cancellation, house rules, pets, check-in and more."
                onPress={() => {}}
              />
              <PolicyCard
                icon="fileText"
                title="Free cancellation"
                description="Full refund up to 7 days before check-in."
                onPress={() => {}}
              />
            </View>
          </Section>

          <Section title="09. Profile row">
            <ProfileRowGroup>
              <ProfileRow icon="user" label="Personal info" onPress={() => {}} />
              <ProfileRow icon="creditCard" label="Payment methods" onPress={() => {}} />
              <ProfileRow icon="briefcase" label="Trips" onPress={() => {}} />
            </ProfileRowGroup>
          </Section>

          <Section
            title="10. Bottom navigation"
            subtitle="Same floating glass bar as the app"
          >
            <View className="h-[360px] overflow-hidden rounded-card border border-border">
              <BlurTargetView ref={tabBlurTargetRef} style={{ flex: 1 }}>
                <Image
                  source={{ uri: LISTING_IMAGE }}
                  contentFit="cover"
                  transition={200}
                  style={{ width: "100%", height: "100%" }}
                />
                <View className="absolute inset-x-4" style={{ bottom: 120 }}>
                  <GlassTabBar
                    items={tabItems}
                    value={tab}
                    onChange={setTab}
                    blurTarget={tabBlurTargetRef}
                  />
                </View>
              </BlurTargetView>
            </View>
          </Section>

          <Section
            title="11. Iconography"
            subtitle="Lucide · stroke 1.8"
          >
            <View className="flex-row flex-wrap gap-3">
              {iconSamples.map((name) => (
                <View
                  key={name}
                  className="h-10 w-10 items-center justify-center rounded-full border border-border bg-muted"
                >
                  <Icon name={name} size="md" />
                </View>
              ))}
            </View>
          </Section>

          <Section title="12. Segmented control">
            <SegmentedControl
              options={segmentOptions}
              value={placeSelected}
              onChange={setPlaceSelected}
            />
          </Section>

          <Section title="13. Toggles / Steppers">
            <View className="flex-row items-center justify-between">
              <AppText variant="label">Instant book</AppText>
              <Toggle value={instantBook} onValueChange={setInstantBook} label="Instant book" />
            </View>
            <View className="flex-row items-center justify-between">
              <AppText variant="label">Guests</AppText>
              <Stepper value={guests} onChange={setGuests} min={1} max={8} label="guests" />
            </View>
          </Section>

          <Section title="14. Status / alerts">
            <View className="gap-3">
              {showSuccess ? (
                <Banner
                  tone="success"
                  message="Account created successfully"
                  onDismiss={() => setShowSuccess(false)}
                />
              ) : null}
              {showError ? (
                <Banner
                  tone="error"
                  message="Something went wrong. Please try again."
                  onDismiss={() => setShowError(false)}
                />
              ) : null}
              {!showSuccess || !showError ? (
                <Button
                  label="Reset banners"
                  variant="secondary"
                  size="sm"
                  onPress={() => {
                    setShowSuccess(true);
                    setShowError(true);
                  }}
                />
              ) : null}
            </View>
          </Section>

          <Section title="15. Tags / badges">
            <View className="flex-row flex-wrap gap-2">
              <Badge
                label="Guest favorite"
                tone="yellow"
                icon="star"
                iconColor="foreground"
                iconFill="star"
              />
              <Badge label="New" tone="mint" />
              <Badge label="20% off" tone="pink" />
              <Badge label="Superhost" tone="blue" />
              <Badge label="Pet friendly" tone="neutral" />
              <Badge label="Featured" tone="lavender" />
            </View>
          </Section>

          <Section
            title="16. Spacing & radius"
            subtitle="4-pt spacing scale, named radii"
          >
            <View className="gap-2">
              {spacingScale.map((value) => (
                <View key={value} className="flex-row items-center gap-3">
                  <AppText variant="caption" className="w-8 text-right">
                    {value}
                  </AppText>
                  <View
                    className="h-2 rounded-pill bg-lavender"
                    style={{ width: value * 2 }}
                  />
                </View>
              ))}
            </View>

            <View className="flex-row gap-4 pt-2">
              <View className="items-center gap-2">
                <View
                  className="h-16 w-16 bg-muted"
                  style={{ borderRadius: radius.tile, borderCurve: "continuous" }}
                />
                <AppText variant="caption">tile {radius.tile}</AppText>
              </View>
              <View className="items-center gap-2">
                <View
                  className="h-16 w-16 bg-muted"
                  style={{ borderRadius: radius.card, borderCurve: "continuous" }}
                />
                <AppText variant="caption">card {radius.card}</AppText>
              </View>
              <View className="items-center gap-2">
                <View
                  className="h-16 w-16 bg-muted"
                  style={{ borderRadius: radius.field, borderCurve: "continuous" }}
                />
                <AppText variant="caption">field {radius.field}</AppText>
              </View>
              <View className="items-center gap-2">
                <View className="h-16 w-8 rounded-pill bg-muted" />
                <AppText variant="caption">pill</AppText>
              </View>
            </View>

            <View className="gap-1 pt-2">
              <AppText variant="caption">
                gutter {spacing.gutter} · section {spacing.section} · card {spacing.card}
              </AppText>
              <AppText variant="caption">
                control {spacing.control} · chip {spacing.chip} · tabbar {spacing.tabbar} · icon{" "}
                {iconTokens.sizes.md} / {iconTokens.strokeWidth}
              </AppText>
              <AppText variant="caption">
                motion {motion.fast}ms / {motion.base}ms / {motion.slow}ms
              </AppText>
            </View>
          </Section>
        </View>
      </ScrollView>
    </>
  );
}
