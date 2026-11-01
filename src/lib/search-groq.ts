import { STAY_PROJECTION } from "@/data/stay-projection";
import type { StayCategoryId, StaySort } from "@/data/stays";

import {
  wantedAndAvoided,
  type ResolvedNumber,
  type SearchIntent,
} from "./search-filters";

export type SearchQueryOptions = {
  category?: StayCategoryId;
  maxPrice?: number;
  petFriendly?: boolean;
  quiet?: boolean;
  sort?: StaySort;
};

export type BuiltSearchQuery = {
  query: string;
  params: Record<string, unknown>;
};

export const SEARCH_RESULT_LIMIT = 40;

/** Collapses several mentions of the same slot into the tightest constraint. */
function numbersFor(numbers: ResolvedNumber[], slot: ResolvedNumber["slot"]) {
  const values = numbers
    .filter((mention) => mention.slot === slot)
    .map((mention) => mention.value)
    .filter((value) => value > 0);

  if (values.length === 0) return undefined;

  // A price is a ceiling, so the lowest mention wins; the rest are floors.
  return slot === "maxPrice" ? Math.min(...values) : Math.max(...values);
}

function orderFor(sort: StaySort = "best") {
  switch (sort) {
    case "price-asc":
      return "pricePerNight asc, _score desc, rating desc";
    case "price-desc":
      return "pricePerNight desc, _score desc, rating desc";
    case "rating":
      return "rating desc, reviewCount desc, _score desc";
    default:
      return "_score desc, featured desc, rating desc";
  }
}

/**
 * Builds the GROQ for a resolved intent. Every value comes from the code-owned
 * vocabularies in `search-filters.ts` or from a parsed number, so nothing a
 * guest typed is interpolated into the query text — the sentence travels as
 * the `$q` parameter.
 */
export function buildSearchQuery(
  sentence: string,
  intent: SearchIntent,
  options: SearchQueryOptions = {},
): BuiltSearchQuery {
  const params: Record<string, unknown> = { q: sentence };
  const filters: string[] = ['_type == "stay"', "defined(coverPhoto)"];

  if (intent.pets === "wanted") {
    filters.push("petsAllowed == true");
  } else if (intent.pets === "avoided") {
    filters.push("petsAllowed != true");
  }

  const categories = wantedAndAvoided(intent.categories);
  categories.wanted.forEach((category, index) => {
    params[`category${index}`] = category;
    filters.push(`category == $category${index}`);
  });
  categories.avoided.forEach((category, index) => {
    params[`avoidedCategory${index}`] = category;
    filters.push(`category != $avoidedCategory${index}`);
  });

  const amenities = wantedAndAvoided(intent.amenities);
  amenities.wanted.forEach((amenity, index) => {
    params[`amenity${index}`] = amenity;
    filters.push(`$amenity${index} in amenities`);
  });
  amenities.avoided.forEach((amenity, index) => {
    params[`avoidedAmenity${index}`] = amenity;
    filters.push(`!($avoidedAmenity${index} in amenities)`);
  });

  const vibes = wantedAndAvoided(intent.vibes);
  vibes.wanted.forEach((vibe, index) => {
    params[`vibe${index}`] = vibe;
    filters.push(`$vibe${index} in vibe`);
  });
  vibes.avoided.forEach((vibe, index) => {
    params[`avoidedVibe${index}`] = vibe;
    filters.push(`!($avoidedVibe${index} in vibe)`);
  });

  const maxPrice = [numbersFor(intent.numbers, "maxPrice"), options.maxPrice]
    .filter((value): value is number => value !== undefined)
    .sort((a, b) => a - b)[0];
  if (maxPrice !== undefined) {
    params.maxPrice = maxPrice;
    filters.push("pricePerNight <= $maxPrice");
  }

  const guests = numbersFor(intent.numbers, "guests");
  if (guests !== undefined) {
    params.guests = guests;
    filters.push("maxGuests >= $guests");
  }

  const bedrooms = numbersFor(intent.numbers, "bedrooms");
  if (bedrooms !== undefined) {
    params.bedrooms = bedrooms;
    filters.push("bedrooms >= $bedrooms");
  }

  if (options.category && options.category !== "all") {
    params.chipCategory = options.category;
    filters.push("category == $chipCategory");
  }
  if (options.petFriendly) filters.push("petsAllowed == true");
  if (options.quiet) filters.push("quiet == true");

  const filter = filters.join(" && ");
  const query = `*[${filter}] | score(text::semanticSimilarity($q)) | order(${orderFor(
    options.sort,
  )})[0...${SEARCH_RESULT_LIMIT}] ${STAY_PROJECTION}`;

  return { query, params };
}
