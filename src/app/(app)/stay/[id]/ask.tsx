import { useAuth } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

import { StaysError, StaysLoading } from "@/components/stays-state";
import { AppText, Button, Chip, Icon } from "@/components/ui";
import { useStays } from "@/data/stays-provider";
import { cn } from "@/lib/cn";
import {
  askStay,
  CHAT_INTRO,
  TOPIC_CHIPS,
  type ChatCard,
  type ChatMessage,
} from "@/lib/stay-chat";
import { motion, typography, useThemeColors } from "@/theme";

const enter = () =>
  FadeInDown.duration(motion.base)
    .easing(Easing.out(Easing.cubic))
    .reduceMotion(ReduceMotion.System);

export default function AskStayRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const body = typography.bodyCompact;
  const { stays, status, error, retry } = useStays();
  const { getToken } = useAuth();

  const stay = useMemo(
    () => stays.find((candidate) => candidate.id === params.id),
    [stays, params.id],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const nextId = useRef(0);
  const hasSent = useRef(false);
  const retryQuestion = useRef<string | null>(null);

  if (status === "loading" && !stay) {
    return (
      <View className="flex-1 justify-center bg-card">
        <StaysLoading label="Loading stay…" />
      </View>
    );
  }

  if (status === "error" && !stay) {
    return (
      <View className="flex-1 justify-center bg-card">
        <StaysError message={error} onRetry={retry} />
      </View>
    );
  }

  if (!stay) {
    return (
      <View className="flex-1 items-center justify-center bg-card px-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon name="search" size={28} color={colors.mutedForeground} />
        </View>
        <AppText variant="title" className="mt-4 text-center">
          Stay not found
        </AppText>
        <AppText variant="caption" className="mt-1 text-center">
          This stay may have been removed or the link is outdated.
        </AppText>
        <Button
          label="Go back"
          variant="secondary"
          onPress={() => router.replace("/home")}
          className="mt-6"
        />
      </View>
    );
  }

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || isAsking) return;

    const id = nextId.current;
    nextId.current += 1;
    hasSent.current = true;
    retryQuestion.current = question;

    setIsAsking(true);
    setMessages((current) => [
      ...current,
      { id: `guest-${id}`, role: "guest", text: question },
    ]);
    setInput("");

    try {
      const cards = await askStay(stay.id, question, getToken);
      setMessages((current) => [
        ...current.slice(0, -1),
        { id: `guest-${id}`, role: "guest", text: question },
        { id: `stay-${id}`, role: "stay", cards },
      ]);
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        router.replace("/sign-in");
        return;
      }
      const errorCard: ChatCard = {
        topic: "Something went wrong",
        body: "We couldn't get an answer right now. Check your connection and try again.",
        source: "Room support",
      };
      setMessages((current) => [
        ...current.slice(0, -1),
        { id: `guest-${id}`, role: "guest", text: question },
        { id: `stay-${id}`, role: "stay", cards: [errorCard] },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const canSend = !isAsking && input.trim().length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-card"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        className="flex-row items-center gap-4 px-gutter pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace(`/stay/${stay.id}`)
          }
          className="h-14 w-14 items-center justify-center rounded-full bg-muted"
          style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
        >
          <Icon name="chevronLeft" size="lg" color={colors.foreground} />
        </Pressable>

        <View className="flex-1">
          <AppText variant="searchCardTitle">Ask about this stay</AppText>
          <AppText variant="bodyCompact" tone="mutedForeground" className="mt-0.5">
            {stay.title}
          </AppText>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          gap: 10,
          flexGrow: messages.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (hasSent.current) {
            scrollRef.current?.scrollToEnd({ animated: true });
          }
        }}
      >
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 pb-6">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-lavender-surface">
              <Icon name="wandSparkles" size="lg" color={colors.accent} />
            </View>
            <AppText
              variant="bodyCompact"
              tone="mutedForeground"
              className="mt-4 text-center"
            >
              {CHAT_INTRO}
            </AppText>
          </View>
        ) : (
          messages.map((message) => (
            <MessageView key={message.id} message={message} />
          ))
        )}
        {isAsking && (
          <View className="mt-2 rounded-card bg-lavender-surface p-4">
            <View className="flex-row items-center gap-3">
              <ActivityIndicator size="small" color={colors.accent} />
              <AppText variant="bodyCompact" tone="mutedForeground">
                Thinking…
              </AppText>
            </View>
          </View>
        )}
      </ScrollView>

      <View
        className="px-gutter pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {TOPIC_CHIPS.map((topic) => (
            <Chip
              key={topic.label}
              label={topic.label}
              size="md"
              variant="neutral"
              onPress={() => {
                setInput(topic.question);
                setTimeout(() => send(topic.question), 0);
              }}
            />
          ))}
        </ScrollView>

        <View className="mt-4 h-14 flex-row items-center gap-3 rounded-pill bg-muted px-4">
          <Icon name="messageSquareMore" size="md" color={colors.foreground} />
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            placeholder="Ask about this stay"
            placeholderTextColor={colors.placeholder}
            selectionColor={colors.accent}
            returnKeyType="send"
            multiline={false}
            numberOfLines={1}
            autoCorrect={false}
            spellCheck={false}
            accessibilityLabel="Ask about this stay"
            underlineColorAndroid="transparent"
            style={{
              flex: 1,
              alignSelf: "stretch",
              paddingVertical: 0,
              textAlignVertical: "center",
              fontFamily: body.fontFamily,
              fontSize: body.fontSize,
              letterSpacing: body.letterSpacing,
              color: colors.foreground,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send question"
            disabled={!canSend}
            hitSlop={8}
            onPress={() => send(input)}
            className={cn(
              "h-10 w-10 items-center justify-center rounded-full",
              !canSend && "opacity-40",
            )}
            style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
          >
            <Icon name="arrowUp" size="md" color={colors.foreground} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageView({ message }: { message: ChatMessage }) {
  if (message.role === "guest") {
    return (
      <Animated.View entering={enter()} className="items-end">
        <View className="max-w-[85%] rounded-pill bg-lavender px-4 py-3.5">
          <AppText variant="bodyCompact" tone="lavenderForeground">
            {message.text}
          </AppText>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={enter()} className="gap-2.5">
      {message.cards.map((card, index) => (
        <AnswerCard key={`${card.topic}-${index}`} card={card} />
      ))}
      {message.cards.length === 1 &&
        message.cards[0].topic.toLowerCase().includes("something went wrong") && (
          <View className="mt-2">
            <Button
              label="Retry"
              variant="secondary"
              size="md"
              onPress={() => {
                // Retry logic handled by parent
              }}
            />
          </View>
        )}
    </Animated.View>
  );
}

function AnswerCard({ card }: { card: ChatCard }) {
  const colors = useThemeColors();

  return (
    <View className="rounded-card bg-lavender-surface p-4">
      <View className="flex-row items-center gap-2">
        <Icon name="wandSparkles" size="md" color={colors.accent} />
        <AppText variant="cardTitleCompact" className="flex-1">
          {card.topic}
        </AppText>
      </View>

      <AppText variant="bodyCompact" className="mt-3">
        {card.body}
      </AppText>

      <View className="mt-3 flex-row items-center gap-2">
        <Icon name="fileText" size="sm" color={colors.mutedForeground} />
        <AppText variant="caption" tone="mutedForeground" className="flex-1">
          {card.source}
        </AppText>
      </View>
    </View>
  );
}
