/**
 * A deterministic reading of a guest's sentence, used when the decision layer is
 * not configured (or fails).
 *
 * It matches only the values in `search-filters.ts`, so it can mark a filter
 * wanted or avoided but can never invent one. Jev, when its key is present,
 * answers the same questions and takes over; this is the floor that keeps a
 * typed sentence filtering instead of returning every stay.
 */

import {
  emptyIntent,
  extractNumberMentions,
  type FilterIntent,
  type NumberMention,
  type SearchAmenity,
  type SearchCategory,
  type SearchIntent,
  type SearchVibe,
} from "./search-filters";

type Kind = "amenity" | "vibe" | "category" | "pets";

type Hit = {
  kind: Kind;
  value: string;
  start: number;
  negated: boolean;
};

const AMENITY_ALIASES: Record<SearchAmenity, string[]> = {
  "Hot tub": ["hot tub", "hot tubs", "hottub", "jacuzzi", "whirlpool"],
  Pool: ["swimming pool", "private pool", "pool", "pools"],
  Fireplace: ["fireplace", "fireplaces", "fire place", "wood stove"],
  "Wi-Fi": ["wi fi", "wifi", "wireless internet", "internet", "broadband"],
  "Full kitchen": ["full sized kitchen", "full kitchen", "kitchen", "cooking"],
  Kitchenette: ["kitchenette", "kitchenettes", "small kitchen"],
  "Coffee maker": ["coffee maker", "coffee machine", "espresso machine", "espresso", "coffee"],
  "Free parking": ["free parking", "parking", "driveway", "garage"],
  "EV charger": ["ev charger", "ev charging", "electric vehicle charger", "charger"],
  Workspace: ["workspace", "work space", "workstation", "desk", "office"],
  Gym: ["fitness center", "gym", "fitness", "weights"],
  "Ski storage": ["ski storage", "ski locker", "ski"],
  "Ocean view": ["ocean view", "ocean views", "sea view", "water view"],
  "Mountain view": ["mountain view", "mountain views"],
  "Skyline view": ["skyline view", "city view", "skyline"],
  Garden: ["garden", "backyard", "yard"],
  Patio: ["patio", "deck", "terrace"],
  Balcony: ["balcony", "balconies"],
  "Outdoor shower": ["outdoor shower", "outside shower"],
  "Walk to beach": ["short walk to beach", "walk to the beach", "walk to beach"],
  "Steps to sand": ["steps from the sand", "steps to sand", "on the sand"],
  "Lake access": ["lake access", "lakefront", "on the lake", "lake"],
  Walkable: ["walkable", "walk everywhere", "walk to everything"],
  Historic: ["historic", "historical", "heritage"],
  "Air conditioning": [
    "air conditioning",
    "air conditioner",
    "central air",
    "air con",
    "a c",
    "ac",
  ],
  Heating: ["heating", "heated", "radiator"],
  Washer: ["washing machine", "washer", "laundry"],
  Dryer: ["tumble dryer", "dryer"],
  "BBQ grill": ["bbq grill", "barbecue", "barbeque", "bbq", "grill"],
  "Fire pit": ["fire pit", "firepit", "bonfire"],
  Sauna: ["steam room", "sauna"],
  Bikes: ["bicycles", "bicycle", "bikes", "bike"],
  Crib: ["baby cot", "crib", "cribs", "cot"],
};

const VIBE_ALIASES: Record<SearchVibe, string[]> = {
  quiet: ["quiet", "peaceful", "calm", "tranquil", "silent", "serene"],
  cozy: ["cozy", "cosy", "snug", "homely"],
  romantic: ["romantic", "honeymoon", "couples retreat", "date night"],
  urban: ["urban", "downtown", "metro"],
  bright: ["bright", "sunlit", "airy", "light filled"],
  compact: ["compact", "small", "tiny", "micro"],
  lively: ["lively", "bustling", "nightlife", "vibrant"],
  historic: ["historic", "historical", "old town", "antique"],
  residential: ["residential", "neighborhood", "suburban"],
  industrial: ["industrial", "warehouse", "factory"],
  wooded: ["wooded", "woods", "forest", "trees", "treehouse"],
  mountain: ["mountain", "mountains", "alpine"],
  snowy: ["snowy", "snow", "winter"],
  spacious: ["spacious", "roomy", "large", "big"],
  desert: ["desert", "arid"],
  sunny: ["sunny", "sunshine", "sun drenched"],
  private: ["private", "privacy"],
  walkable: ["walkable", "walk everywhere"],
  warm: ["warm", "toasty"],
  coastal: ["coastal", "coast", "seaside", "ocean side"],
  family: ["family", "families", "kids", "children", "kid friendly"],
  secluded: ["secluded", "remote", "isolated", "off the grid"],
  open: ["open plan", "open concept", "open"],
  tropical: ["tropical", "palm trees", "island", "jungle"],
  beach: ["beach", "beachside"],
  casual: ["casual", "relaxed", "laid back"],
};

const CATEGORY_ALIASES: Record<SearchCategory, string[]> = {
  cabins: ["cabin", "cabins", "chalet", "chalets", "a frame", "log cabin", "lodge"],
  beach: ["beach house", "beachfront", "beach front", "oceanfront", "seaside", "beach"],
  city: ["city", "downtown", "urban", "loft", "apartment", "studio"],
  villas: ["villa", "villas", "estate", "mansion"],
};

const PET_ALIASES = [
  "pet friendly",
  "pets allowed",
  "pets welcome",
  "pet free",
  "pet",
  "pets",
  "puppy",
  "dog",
  "dogs",
  "cat",
  "cats",
];

const NEGATORS = new Set([
  "no",
  "not",
  "without",
  "avoid",
  "avoiding",
  "exclude",
  "excluding",
  "except",
  "never",
  "zero",
]);

/** Words that turn a `not` into emphasis rather than exclusion. */
const NOT_NEGATION = new Set(["far", "too", "only", "just", "sure", "bad", "necessarily"]);

/** Lowercases and strips punctuation, keeping digits and the currency sign. */
function normalize(sentence: string) {
  return sentence
    .replace(/n['’]t\b/gi, " not")
    .toLowerCase()
    .replace(/[^a-z0-9$]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Phrase = { phrase: string; kind: Kind; value: string };

/** Groups identical phrases, so one word can answer more than one vocabulary. */
function buildPhrases(): { text: string; entries: Phrase[] }[] {
  const byText = new Map<string, Phrase[]>();

  const add = (phrase: string, kind: Kind, value: string) => {
    const text = normalize(phrase);
    const entries = byText.get(text) ?? [];
    entries.push({ phrase: text, kind, value });
    byText.set(text, entries);
  };

  for (const [value, aliases] of Object.entries(AMENITY_ALIASES)) {
    for (const alias of aliases) add(alias, "amenity", value);
  }
  for (const [value, aliases] of Object.entries(VIBE_ALIASES)) {
    for (const alias of aliases) add(alias, "vibe", value);
  }
  for (const [value, aliases] of Object.entries(CATEGORY_ALIASES)) {
    for (const alias of aliases) add(alias, "category", value);
  }
  for (const alias of PET_ALIASES) add(alias, "pets", "pets");

  // Longest first, so "walk to beach" wins over "beach" and "kitchenette"
  // over "kitchen". Matched characters are then consumed.
  return [...byText.entries()]
    .map(([text, entries]) => ({ text, entries }))
    .sort((a, b) => b.text.length - a.text.length);
}

const PHRASES = buildPhrases();

function isNegated(haystack: string, start: number) {
  const tokens = haystack.slice(0, start).trimEnd().split(" ").slice(-3);

  for (let i = 0; i < tokens.length; i += 1) {
    if (!NEGATORS.has(tokens[i])) continue;

    const between = tokens.slice(i + 1);
    if (between.some((word) => NOT_NEGATION.has(word))) continue;

    return true;
  }

  return false;
}

/** Every vocabulary match in the sentence, longest phrase first. */
function findHits(haystack: string): Hit[] {
  const used = new Array<boolean>(haystack.length).fill(false);
  const hits: Hit[] = [];

  for (const { text, entries } of PHRASES) {
    const needle = ` ${text} `;
    let from = 0;

    for (;;) {
      const at = haystack.indexOf(needle, from);
      if (at < 0) break;

      const start = at + 1;
      const end = start + text.length;

      if (used.slice(start, end).some(Boolean)) {
        from = at + 1;
        continue;
      }

      for (let i = start; i < end; i += 1) used[i] = true;

      // "pet free" is the one phrase that negates itself.
      const negated = text === "pet free" || isNegated(haystack, start);

      // A word that names both a specific value and a mood ("beach", "historic")
      // filters on the value; the mood would only repeat the same constraint.
      const specific = entries.some((entry) => entry.kind === "amenity" || entry.kind === "category");

      for (const entry of entries) {
        if (entry.kind === "vibe" && specific) continue;
        hits.push({ kind: entry.kind, value: entry.value, start, negated });
      }

      from = end;
    }
  }

  return hits;
}

const PRICE_BEFORE = /\b(under|below|less than|at most|max|maximum|budget|up to|cheaper than)\s*$/;
const GUESTS_BEFORE = /\b(for|sleeps|sleep|party of|group of)\s*$/;
const BEDROOMS_BEFORE = /\b(bedroom|bedrooms|bed|beds|br)\s*$/;

/**
 * Decides what a number means from the words touching it. Code owns this, so a
 * number can never become anything but one of the five slots.
 */
export function slotFor(mention: NumberMention, sentence: string): SearchIntent["numbers"][number]["slot"] {
  const end = mention.index + mention.raw.length;
  const before = normalize(sentence.slice(Math.max(0, mention.index - 24), mention.index)) + " ";
  const after = normalize(sentence.slice(end, end + 24));

  if (mention.raw.startsWith("$")) return "maxPrice";
  if (/^(a|per) night\b/.test(after)) return "maxPrice";
  if (/^(dollars?|bucks|usd)\b/.test(after)) return "maxPrice";
  if (PRICE_BEFORE.test(before)) return "maxPrice";

  if (/^(night|nights)\b/.test(after)) return "nights";
  if (/^(bedroom|bedrooms|bed|beds|br)\b/.test(after)) return "bedrooms";
  if (BEDROOMS_BEFORE.test(before)) return "bedrooms";

  if (/^(guest|guests|people|person|adults|pax|sleeps)\b/.test(after)) return "guests";
  if (GUESTS_BEFORE.test(before)) return "guests";

  return "ignore";
}

/**
 * Reads the sentence into filter intent. Several categories at once cannot all
 * be true, so the first one mentioned wins and the rest stay unmentioned.
 */
export function parseIntent(sentence: string): SearchIntent {
  const intent = emptyIntent();
  const haystack = ` ${normalize(sentence)} `;
  const hits = findHits(haystack);

  const categoryHits: { value: SearchCategory; start: number }[] = [];

  for (const hit of hits) {
    const state: FilterIntent = hit.negated ? "avoided" : "wanted";

    if (hit.kind === "pets") {
      intent.pets = state;
    } else if (hit.kind === "category") {
      const category = hit.value as SearchCategory;
      if (hit.negated) intent.categories[category] = "avoided";
      else categoryHits.push({ value: category, start: hit.start });
    } else if (hit.kind === "amenity") {
      intent.amenities[hit.value as SearchAmenity] = state;
    } else {
      intent.vibes[hit.value as SearchVibe] = state;
    }
  }

  categoryHits.sort((a, b) => a.start - b.start);
  if (categoryHits.length > 0) intent.categories[categoryHits[0].value] = "wanted";

  intent.numbers = extractNumberMentions(sentence).map((mention) => ({
    ...mention,
    slot: slotFor(mention, sentence),
  }));

  return intent;
}
