import { generateText, Output } from "ai";
import { z } from "zod";

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
import { parseIntent } from "./search-parse";

const TIMEOUT_MS = 6_000;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "openai/gpt-4o-mini";

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
  return Boolean(process.env.OPENAI_API_KEY);
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

/** True when the intent carries at least one filter or a usable number. */
function hasFilters(intent: SearchIntent) {
  return (
    intent.pets !== "notMentioned" ||
    Object.values(intent.categories).some((state) => state !== "notMentioned") ||
    Object.values(intent.amenities).some((state) => state !== "notMentioned") ||
    Object.values(intent.vibes).some((state) => state !== "notMentioned") ||
    intent.numbers.some((number) => number.slot !== "ignore")
  );
}

/**
 * Asks the model what the guest wants. Code supplies every option and every number,
 * so the answers can only be a filter state or a slot, never free text.
 */
export async function resolveSearchIntent(sentence: string): Promise<SearchIntent> {
  // No decision model: code still reads the sentence, so a typed search filters
  // instead of ranking every stay. Same vocabularies, same result shape.
  if (!isIntentResolutionConfigured()) return parseIntent(sentence);

  const mentions = extractNumberMentions(sentence);

  const schema = z.object({
    pets: z.enum(["wanted", "avoided", "notMentioned"]),
    categories: z.record(z.enum(SEARCH_CATEGORIES), z.enum(["wanted", "avoided", "notMentioned"])),
    amenities: z.record(z.enum(SEARCH_AMENITIES), z.enum(["wanted", "avoided", "notMentioned"])),
    vibes: z.record(z.enum(SEARCH_VIBES), z.enum(["wanted", "avoided", "notMentioned"])),
    numbers: z.array(
      z.object({
        index: z.number().int(),
        slot: z.enum(NUMBER_SLOTS),
        confidence: z.enum(["low", "medium", "high"]),
      })
    ),
    confidence: z.enum(["low", "medium", "high"]),
  });

  const system = `You are a search intent classifier. Classify the guest sentence into filters.
Only use the provided vocabularies. Return wanted/avoided/notMentioned for each filter.
For numbers, choose the slot from maxPrice/guests/bedrooms/nights/ignore.
Provide confidence low/medium/high.`;

  const user = `Sentence: "${sentence}"
Numbers found: ${mentions.map(m => `${m.index}:${m.raw}@${m.context}`).join("; ")}
Classify pets, categories, amenities, vibes, and numbers.`;

  try {
    const result = await generateText({
      model: OPENAI_MODEL,
      output: Output.object({ schema }),
      system,
      prompt: user,
    });

    const output = result.output as z.infer<typeof schema>;

    // Validate confidence
    if (output.confidence === "low") {
      console.warn("Search intent confidence low, falling back to parser");
      return parseIntent(sentence);
    }

    // Map to SearchIntent shape
    const intent = emptyIntent();
    intent.pets = output.pets;
    for (const cat of SEARCH_CATEGORIES) {
      intent.categories[cat] = output.categories[cat] ?? "notMentioned";
    }
    for (const am of SEARCH_AMENITIES) {
      intent.amenities[am] = output.amenities[am] ?? "notMentioned";
    }
    for (const vibe of SEARCH_VIBES) {
      intent.vibes[vibe] = output.vibes[vibe] ?? "notMentioned";
    }
    intent.numbers = mentions.map((mention, idx) => {
      const numOut = output.numbers.find(n => n.index === idx);
      const slot = (numOut?.slot ?? "ignore") as NumberSlot;
      const conf = numOut?.confidence ?? "medium";
      if (conf === "low") {
        // fallback slot to parser for this number
        const parsed = parseIntent(sentence);
        const pNum = parsed.numbers[idx];
        return { ...mention, slot: (pNum?.slot ?? "ignore") as NumberSlot };
      }
      return { ...mention, slot };
    });

    if (!hasFilters(intent)) {
      const parsed = parseIntent(sentence);
      if (hasFilters(parsed)) return parsed;
    }

    return intent;
  } catch (error) {
    console.error("Search intent resolution failed:", error instanceof Error ? error.message : error);
    return parseIntent(sentence);
  }
}
