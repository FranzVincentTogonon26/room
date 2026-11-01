/**
 * The vocabularies search may filter on, and the number mentions code finds in
 * a guest's sentence. Jev can only choose from these values; it never invents
 * an amenity, a vibe, a category, or a number.
 */

export const SEARCH_CATEGORIES = ["cabins", "beach", "city", "villas"] as const;

export type SearchCategory = (typeof SEARCH_CATEGORIES)[number];

/** Must match `AMENITIES` in `studio/schemaTypes/stay.ts`. */
export const SEARCH_AMENITIES = [
  "Hot tub",
  "Pool",
  "Fireplace",
  "Wi-Fi",
  "Full kitchen",
  "Kitchenette",
  "Coffee maker",
  "Free parking",
  "EV charger",
  "Workspace",
  "Gym",
  "Ski storage",
  "Ocean view",
  "Mountain view",
  "Skyline view",
  "Garden",
  "Patio",
  "Balcony",
  "Outdoor shower",
  "Walk to beach",
  "Steps to sand",
  "Lake access",
  "Walkable",
  "Historic",
  "Air conditioning",
  "Heating",
  "Washer",
  "Dryer",
  "BBQ grill",
  "Fire pit",
  "Sauna",
  "Bikes",
  "Crib",
] as const;

export type SearchAmenity = (typeof SEARCH_AMENITIES)[number];

/** Every vibe value present on published stays in `production`. */
export const SEARCH_VIBES = [
  "quiet",
  "cozy",
  "romantic",
  "urban",
  "bright",
  "compact",
  "lively",
  "historic",
  "residential",
  "industrial",
  "wooded",
  "mountain",
  "snowy",
  "spacious",
  "desert",
  "sunny",
  "private",
  "walkable",
  "warm",
  "coastal",
  "family",
  "secluded",
  "open",
  "tropical",
  "beach",
  "casual",
] as const;

export type SearchVibe = (typeof SEARCH_VIBES)[number];

export type FilterIntent = "wanted" | "avoided" | "notMentioned";

/** The slots a number in the sentence can fill. `ignore` means no filter. */
export const NUMBER_SLOTS = [
  "maxPrice",
  "guests",
  "bedrooms",
  "nights",
  "ignore",
] as const;

export type NumberSlot = (typeof NUMBER_SLOTS)[number];

export type NumberMention = {
  /** The digits as written, for logging and for the response. */
  value: number;
  /** The matched text, including a leading currency symbol when present. */
  raw: string;
  /** Surrounding words, so Jev can judge which slot the number fills. */
  context: string;
  /** Character offset in the sentence, so mentions stay distinguishable. */
  index: number;
};

export type ResolvedNumber = NumberMention & { slot: NumberSlot };

export type SearchIntent = {
  pets: FilterIntent;
  categories: Record<SearchCategory, FilterIntent>;
  amenities: Record<SearchAmenity, FilterIntent>;
  vibes: Record<SearchVibe, FilterIntent>;
  numbers: ResolvedNumber[];
};

const CONTEXT_WINDOW = 40;
const DIGITS = /\d[\d,]*/g;

/** A number worth asking about: 1–4 digits, not part of a longer word. */
function isCandidate(raw: string) {
  const digits = raw.replace(/,/g, "");

  return digits.length >= 1 && digits.length <= 4;
}

/**
 * Finds every number in the sentence with the words around it. Code owns the
 * digits; Jev only decides what each one means.
 */
export function extractNumberMentions(sentence: string): NumberMention[] {
  const mentions: NumberMention[] = [];

  for (const match of sentence.matchAll(DIGITS)) {
    const raw = match[0];
    const index = match.index ?? 0;

    if (!isCandidate(raw)) continue;

    const value = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(value)) continue;

    const start = Math.max(0, index - CONTEXT_WINDOW);
    const end = Math.min(sentence.length, index + raw.length + CONTEXT_WINDOW);
    const hasCurrency = index > 0 && sentence[index - 1] === "$";

    mentions.push({
      value,
      raw: hasCurrency ? `$${raw}` : raw,
      context: sentence.slice(start, end).trim(),
      index,
    });
  }

  return mentions;
}

export function emptyIntent(): SearchIntent {
  const all = <K extends string>(keys: readonly K[]) =>
    Object.fromEntries(keys.map((key) => [key, "notMentioned"])) as Record<K, FilterIntent>;

  return {
    pets: "notMentioned",
    categories: all(SEARCH_CATEGORIES),
    amenities: all(SEARCH_AMENITIES),
    vibes: all(SEARCH_VIBES),
    numbers: [],
  };
}

/** Groups the wanted and avoided values, which is what the query builder needs. */
export function wantedAndAvoided<K extends string>(record: Record<K, FilterIntent>) {
  const wanted: K[] = [];
  const avoided: K[] = [];

  for (const [key, intent] of Object.entries(record) as [K, FilterIntent][]) {
    if (intent === "wanted") wanted.push(key);
    else if (intent === "avoided") avoided.push(key);
  }

  return { wanted, avoided };
}
