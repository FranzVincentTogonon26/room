import { typeSafeAi } from "@ai-sdk/typesafe-ai";
import { experimental_decide } from "ai";

import {
  emptyIntent,
  extractNumberMentions,
  NUMBER_SLOTS,
  SEARCH_AMENITIES,
  SEARCH_CATEGORIES,
  SEARCH_VIBES,
  type FilterIntent,
  type NumberMention,
  type NumberSlot,
  type ResolvedNumber,
  type SearchIntent,
} from "./search-filters";

const MODEL_ID = "jev-latest";
const TIMEOUT_MS = 6_000;

/** Every filter question offers exactly these three answers. */
const FILTER_CRITERIA = {
  wanted: "The guest asks for this, or for something that clearly means it.",
  avoided: "The guest says they do not want this, or asks to avoid it.",
  notMentioned: "The guest does not bring this up.",
};

/** What a number in the sentence can mean. Code applies the value. */
const NUMBER_CRITERIA = {
  maxPrice: "A ceiling on the nightly price, in dollars.",
  guests: "How many people the stay has to sleep.",
  bedrooms: "A minimum number of bedrooms.",
  nights: "How many nights the guest wants to stay. Not a filter.",
  ignore: "None of these: not a search filter.",
};

type ChoiceQuestion = {
  type: "choice";
  instructions: string;
  criteria: Record<string, string>;
};

function filterQuestion(label: string): ChoiceQuestion {
  return {
    type: "choice",
    instructions: `Is "${label}" wanted, avoided, or not mentioned in this stay search?`,
    criteria: FILTER_CRITERIA,
  };
}

function numberQuestion(value: string, context: string): ChoiceQuestion {
  return {
    type: "choice",
    instructions: `The number ${value} appears in this sentence: "${context}". What does it mean for the stay search?`,
    criteria: NUMBER_CRITERIA,
  };
}

function intentFor(answer: { type: string; choice?: string } | undefined): FilterIntent {
  if (!answer || answer.type !== "choice") return "notMentioned";
  if (answer.choice === "wanted" || answer.choice === "avoided") return answer.choice;

  return "notMentioned";
}

function slotFor(answer: { type: string; choice?: string } | undefined): NumberSlot {
  if (!answer || answer.type !== "choice") return "ignore";

  const choice = answer.choice as NumberSlot | undefined;

  return choice && NUMBER_SLOTS.includes(choice) ? choice : "ignore";
}

/** True when the decision layer is configured; search still runs without it. */
export function isIntentResolutionConfigured() {
  return Boolean(process.env.TYPESAFE_AI_API_KEY);
}

/**
 * Every question Jev is asked for one sentence. Pure, so the shape can be
 * checked without a model: one `pets` question, one per category, amenity, and
 * vibe, then one per number mention.
 */
export function buildQuestions(
  mentions: NumberMention[],
): Record<string, ChoiceQuestion> {
  const questions: Record<string, ChoiceQuestion> = {
    pets: filterQuestion("pets allowed"),
  };

  for (const category of SEARCH_CATEGORIES) {
    questions[`category:${category}`] = filterQuestion(`the ${category} stay type`);
  }
  for (const amenity of SEARCH_AMENITIES) {
    questions[`amenity:${amenity}`] = filterQuestion(`the ${amenity} amenity`);
  }
  for (const vibe of SEARCH_VIBES) {
    questions[`vibe:${vibe}`] = filterQuestion(`a ${vibe} feel`);
  }
  mentions.forEach((mention, index) => {
    questions[`number:${index}`] = numberQuestion(mention.raw, mention.context);
  });

  return questions;
}

/**
 * Turns Jev's answers into an intent. Anything missing, refused, or outside the
 * code-owned options falls back to `notMentioned` / `ignore`, so a partial
 * answer set can never widen or corrupt the query.
 */
export function intentFromAnswers(
  mentions: NumberMention[],
  answers: Record<string, { type: string; choice?: string }>,
): SearchIntent {
  const intent = emptyIntent();

  intent.pets = intentFor(answers.pets);

  for (const category of SEARCH_CATEGORIES) {
    intent.categories[category] = intentFor(answers[`category:${category}`]);
  }
  for (const amenity of SEARCH_AMENITIES) {
    intent.amenities[amenity] = intentFor(answers[`amenity:${amenity}`]);
  }
  for (const vibe of SEARCH_VIBES) {
    intent.vibes[vibe] = intentFor(answers[`vibe:${vibe}`]);
  }

  intent.numbers = mentions.map<ResolvedNumber>((mention, index) => ({
    ...mention,
    slot: slotFor(answers[`number:${index}`]),
  }));

  return intent;
}

/**
 * Asks Jev what the guest wants. Code supplies every option and every number,
 * so the answers can only be a filter state or a slot, never free text.
 */
export async function resolveSearchIntent(sentence: string): Promise<SearchIntent> {
  const mentions = extractNumberMentions(sentence);
  const intent = emptyIntent();

  if (!isIntentResolutionConfigured()) {
    intent.numbers = mentions.map((mention) => ({ ...mention, slot: "ignore" }));
    return intent;
  }

  const questions = buildQuestions(mentions);

  let answers: Record<string, { type: string; choice?: string }>;

  try {
    const result = await experimental_decide({
      model: typeSafeAi.decisionModel(MODEL_ID),
      state: [{ type: "text", text: sentence }],
      questions,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });

    answers = result.answers as Record<string, { type: string; choice?: string }>;
  } catch (error) {
    // Search must still return semantic results when the decision layer fails.
    console.error(
      "Search intent resolution failed:",
      error instanceof Error ? error.message : error,
    );
    intent.numbers = mentions.map((mention) => ({ ...mention, slot: "ignore" }));
    return intent;
  }

  return intentFromAnswers(mentions, answers);
}
