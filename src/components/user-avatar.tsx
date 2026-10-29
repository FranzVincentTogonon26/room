import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { View } from "react-native";

import { AppText } from "@/components/ui/text";
import { cn } from "@/lib/cn";
import { displayNameFor } from "@/lib/user-name";

const sizeClasses = {
  md: "h-14 w-14",
  lg: "h-22 w-22",
} as const;

const textVariants = {
  md: "title",
  lg: "heading",
} as const;

export type UserAvatarProps = {
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function UserAvatar({ size = "md", className }: UserAvatarProps) {
  const { user } = useUser();
  const initial = displayNameFor(user).charAt(0).toUpperCase() || "G";
  const showImage = Boolean(user?.hasImage && user.imageUrl);

  return (
    <View
      className={cn(
        sizeClasses[size],
        "overflow-hidden rounded-full bg-primary",
        className,
      )}
    >
      {showImage ? (
        <Image
          source={{ uri: user?.imageUrl }}
          contentFit="cover"
          transition={200}
          style={{ width: "100%", height: "100%" }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <AppText variant={textVariants[size]} tone="primaryForeground">
            {initial}
          </AppText>
        </View>
      )}
    </View>
  );
}
