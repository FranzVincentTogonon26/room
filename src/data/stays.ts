import type { IconName } from "@/components/ui/icon";

export type StayCategory = "cabins" | "beach" | "city" | "villas";
export type StayCategoryId = StayCategory | "all";

export type Stay = {
  id: string;
  title: string;
  location: string;
  category: StayCategory;
  price: number;
  rating: number;
  reviewCount: number;
  guests: number;
  bedrooms: number;
  baths: number;
  amenities: string[];
  tags: string[];
  description: string;
  image: string;
  featured?: boolean;
  petsAllowed?: boolean;
  quiet?: boolean;
  /** Precomputed lowercase haystack for live Sanity stays. */
  searchText?: string;
};

export type StayCategoryOption = {
  id: StayCategoryId;
  label: string;
  icon: IconName;
};

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

export const STAY_CATEGORIES: readonly StayCategoryOption[] = [
  { id: "all", label: "All Stays", icon: "house" },
  { id: "cabins", label: "Cabins", icon: "treePine" },
  { id: "beach", label: "Beach", icon: "waves" },
  { id: "city", label: "City", icon: "building2" },
  { id: "villas", label: "Villas", icon: "treePalm" },
];

export const CATEGORY_LABELS: Record<StayCategory, string> = {
  cabins: "Cabins",
  beach: "Beach",
  city: "City",
  villas: "Villas",
};

export const STAYS: Stay[] = [
  {
    id: "modern-cabin-hot-tub",
    title: "Modern Cabin with Hot Tub",
    location: "Lake Arrowhead, CA",
    category: "cabins",
    price: 280,
    rating: 4.9,
    reviewCount: 342,
    guests: 6,
    bedrooms: 2,
    baths: 2,
    amenities: [
      "Hot tub",
      "Pet friendly",
      "Fireplace",
      "Wi-Fi",
      "Full kitchen",
      "Free parking",
    ],
    tags: ["quiet", "pet friendly", "hot tub", "fireplace", "forest"],
    description:
      "A cedar-and-glass cabin tucked into the pines, with a private hot tub on the deck and tall windows facing the lake.",
    image: unsplash("photo-1542718610-a1d656d1884c"),
    featured: true,
  },
  {
    id: "cedar-ridge-cabin",
    title: "Cedar Ridge Retreat",
    location: "Big Bear Lake, CA",
    category: "cabins",
    price: 215,
    rating: 4.8,
    reviewCount: 186,
    guests: 4,
    bedrooms: 2,
    baths: 1,
    amenities: ["Hot tub", "Dog friendly", "Fireplace", "Wi-Fi", "Kitchen"],
    tags: ["secluded", "cozy", "hot tub", "dog friendly", "fireplace"],
    description:
      "A quiet A-frame escape on a wooded ridge, with a wood stove, a wraparound deck, and trails from the door.",
    image: unsplash("photo-1449158743715-0a90ebb6d2d8"),
  },
  {
    id: "pine-a-frame",
    title: "Pine A-Frame Hideaway",
    location: "Tahoe City, CA",
    category: "cabins",
    price: 245,
    rating: 4.7,
    reviewCount: 214,
    guests: 5,
    bedrooms: 2,
    baths: 2,
    amenities: ["Hot tub", "Pet friendly", "Fireplace", "Wi-Fi", "Ski storage"],
    tags: ["cozy", "fireplace", "pet friendly", "hot tub", "snowy"],
    description:
      "A classic Tahoe A-frame with a soaring window wall, a wood-burning fireplace, and a hot tub under the stars.",
    image: unsplash("photo-1510798831971-661eb04b3739"),
  },
  {
    id: "ocean-view-beach-house",
    title: "Ocean View Beach House",
    location: "Malibu, CA",
    category: "beach",
    price: 420,
    rating: 4.9,
    reviewCount: 508,
    guests: 8,
    bedrooms: 4,
    baths: 3,
    amenities: [
      "Ocean view",
      "Steps to sand",
      "Patio",
      "Wi-Fi",
      "Kitchen",
      "Free parking",
    ],
    tags: ["ocean view", "steps to sand", "patio", "bright"],
    description:
      "A bright Malibu beach house with floor-to-ceiling glass, a sunny deck, and a private path down to the sand.",
    image: unsplash("photo-1499793983690-e29da59ef1c2"),
  },
  {
    id: "gullwing-cottage",
    title: "Gullwing Beach Cottage",
    location: "Santa Cruz, CA",
    category: "beach",
    price: 265,
    rating: 4.7,
    reviewCount: 173,
    guests: 4,
    bedrooms: 2,
    baths: 1,
    amenities: ["Walk to beach", "Pet friendly", "Kitchen", "Wi-Fi", "Patio"],
    tags: ["quiet", "pet friendly", "walk to beach", "cozy"],
    description:
      "A small, sun-filled cottage a few blocks from the water, with a fenced yard and an easy walk to town.",
    image: unsplash("photo-1507525428034-b723cf961d3e"),
  },
  {
    id: "mendocino-coast-cottage",
    title: "Mendocino Coast Cottage",
    location: "Mendocino, CA",
    category: "beach",
    price: 295,
    rating: 4.8,
    reviewCount: 261,
    guests: 4,
    bedrooms: 2,
    baths: 2,
    amenities: ["Ocean view", "Pet friendly", "Fireplace", "Wi-Fi", "Kitchen"],
    tags: ["quiet", "ocean view", "pet friendly", "fireplace"],
    description:
      "A weathered cedar cottage on the headlands, with a fireplace, a wind-sheltered deck, and big Pacific views.",
    image: unsplash("photo-1518780664697-55e3ad937233"),
  },
  {
    id: "downtown-arts-loft",
    title: "Downtown Arts Loft",
    location: "Portland, OR",
    category: "city",
    price: 185,
    rating: 4.8,
    reviewCount: 402,
    guests: 2,
    bedrooms: 1,
    baths: 1,
    amenities: ["Workspace", "Wi-Fi", "Kitchen", "Coffee maker", "Walkable"],
    tags: ["walkable", "coffee", "workspace", "lively"],
    description:
      "An open brick-and-timber loft above a coffee bar, with a dedicated desk and the city's best galleries downstairs.",
    image: unsplash("photo-1502672260266-1c1ef2d93688"),
  },
  {
    id: "skyline-studio",
    title: "Skyline Studio",
    location: "Seattle, WA",
    category: "city",
    price: 230,
    rating: 4.6,
    reviewCount: 328,
    guests: 2,
    bedrooms: 1,
    baths: 1,
    amenities: ["Skyline view", "Pet friendly", "Gym", "Workspace", "Wi-Fi"],
    tags: ["skyline view", "pet friendly", "gym", "workspace"],
    description:
      "A compact high-rise studio with a wall of windows, a proper desk, and a shared rooftop gym.",
    image: unsplash("photo-1522708323590-d24dbb6b0267"),
  },
  {
    id: "brick-rowhouse-suite",
    title: "Brick Rowhouse Suite",
    location: "Boston, MA",
    category: "city",
    price: 210,
    rating: 4.7,
    reviewCount: 197,
    guests: 3,
    bedrooms: 1,
    baths: 1,
    amenities: ["Workspace", "Wi-Fi", "Kitchenette", "Walkable", "Historic"],
    tags: ["historic", "walkable", "quiet", "workspace"],
    description:
      "A quiet suite in a restored Back Bay row house, with original moldings, a kitchenette, and the T a block away.",
    image: unsplash("photo-1600607687939-ce8a6c25118c"),
  },
  {
    id: "palm-springs-pool-villa",
    title: "Palm Springs Pool Villa",
    location: "Palm Springs, CA",
    category: "villas",
    price: 395,
    rating: 4.9,
    reviewCount: 286,
    guests: 8,
    bedrooms: 4,
    baths: 3,
    amenities: [
      "Pool",
      "Mountain view",
      "Outdoor shower",
      "Wi-Fi",
      "Kitchen",
      "Free parking",
    ],
    tags: ["pool", "mountain view", "quiet", "sunny"],
    description:
      "A walled desert villa with a saltwater pool, shaded lounge, and mountain views from every room.",
    image: unsplash("photo-1613490493576-7fde63acd811"),
  },
  {
    id: "hillside-garden-villa",
    title: "Hillside Garden Villa",
    location: "Ojai, CA",
    category: "villas",
    price: 340,
    rating: 4.8,
    reviewCount: 152,
    guests: 6,
    bedrooms: 3,
    baths: 2,
    amenities: [
      "Hot tub",
      "Garden",
      "Secluded",
      "Wi-Fi",
      "Kitchen",
      "Fireplace",
    ],
    tags: ["secluded", "garden", "hot tub", "quiet"],
    description:
      "A stucco villa folded into an Ojai hillside, surrounded by olive trees, with a garden hot tub and long valley views.",
    image: unsplash("photo-1600585154340-be6161a56a0c"),
  },
  {
    id: "saguaro-desert-villa",
    title: "Saguaro Desert Villa",
    location: "Scottsdale, AZ",
    category: "villas",
    price: 310,
    rating: 4.8,
    reviewCount: 219,
    guests: 6,
    bedrooms: 3,
    baths: 2,
    amenities: [
      "Pool",
      "Mountain view",
      "Secluded",
      "Wi-Fi",
      "Kitchen",
      "Patio",
    ],
    tags: ["pool", "secluded", "mountain view", "sunny"],
    description:
      "A low-slung adobe-style home at the edge of the Preserve, with a pool, a shaded portal, and saguaros at sunset.",
    image: unsplash("photo-1600047509807-ba8f99d2cdde"),
  },
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "below",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "less",
  "max",
  "maximum",
  "my",
  "near",
  "night",
  "of",
  "on",
  "our",
  "per",
  "place",
  "somewhere",
  "stay",
  "stays",
  "than",
  "that",
  "the",
  "to",
  "under",
  "up",
  "we",
  "with",
]);

const PRICE_PATTERN =
  /\b(?:under|below|less\s+than|max(?:imum)?|up\s+to)\s*\$?\s*(\d{2,5})\b/i;

export type StayQuery = {
  tokens: string[];
  maxPrice?: number;
};

export function parseStayQuery(query: string): StayQuery {
  const priceMatch = query.match(PRICE_PATTERN);
  const maxPrice = priceMatch ? Number(priceMatch[1]) : undefined;
  const withoutPrice = query.replace(PRICE_PATTERN, " ");

  const tokens = withoutPrice
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  return { tokens, maxPrice };
}

function searchTextFor(stay: Stay) {
  if (stay.searchText) return stay.searchText;

  return [
    stay.title,
    stay.location,
    CATEGORY_LABELS[stay.category],
    stay.description,
    ...stay.amenities,
    ...stay.tags,
  ]
    .join(" ")
    .toLowerCase();
}

export type StaySort = "best" | "price-asc" | "price-desc" | "rating";

export type StaySearchOptions = {
  category?: StayCategoryId;
  maxPrice?: number;
  petFriendly?: boolean;
  quiet?: boolean;
  sort?: StaySort;
};

export const SORT_LABELS: Record<StaySort, string> = {
  best: "Best match",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Top rated",
};

function isPetFriendly(stay: Stay) {
  if (stay.petsAllowed !== undefined) return stay.petsAllowed;

  return (
    stay.tags.some((tag) => tag === "pet friendly" || tag === "dog friendly") ||
    stay.amenities.some((amenity) => /pet|dog/i.test(amenity))
  );
}

function isQuiet(stay: Stay) {
  return stay.quiet ?? stay.tags.includes("quiet");
}

/**
 * Ranks a list of stays for a natural-language query and the Search tab's
 * filters. Tokens are matched against each stay's own text, so no network or
 * model call is involved.
 */
export function searchStaysIn(
  stays: Stay[],
  query: string,
  options: StaySearchOptions = {},
): Stay[] {
  const {
    category = "all",
    maxPrice,
    petFriendly = false,
    quiet = false,
    sort = "best",
  } = options;
  const parsed = parseStayQuery(query);
  const priceCaps = [parsed.maxPrice, maxPrice].filter(
    (cap): cap is number => cap !== undefined,
  );
  const priceCap = priceCaps.length > 0 ? Math.min(...priceCaps) : undefined;

  const scored = stays
    .filter((stay) => category === "all" || stay.category === category)
    .filter((stay) => priceCap === undefined || stay.price <= priceCap)
    .filter((stay) => !petFriendly || isPetFriendly(stay))
    .filter((stay) => !quiet || isQuiet(stay))
    .map((stay) => {
      if (parsed.tokens.length === 0) return { stay, score: 0 };

      const haystack = searchTextFor(stay);
      const score = parsed.tokens.reduce(
        (total, token) => total + (haystack.includes(token) ? 1 : 0),
        0,
      );

      return { stay, score };
    })
    .filter(({ score }) => parsed.tokens.length === 0 || score > 0);

  switch (sort) {
    case "price-asc":
      scored.sort(
        (a, b) => a.stay.price - b.stay.price || b.stay.rating - a.stay.rating,
      );
      break;
    case "price-desc":
      scored.sort(
        (a, b) => b.stay.price - a.stay.price || b.stay.rating - a.stay.rating,
      );
      break;
    case "rating":
      scored.sort(
        (a, b) =>
          b.stay.rating - a.stay.rating ||
          b.stay.reviewCount - a.stay.reviewCount,
      );
      break;
    default:
      scored.sort(
        (a, b) =>
          b.score - a.score ||
          Number(b.stay.featured ?? false) - Number(a.stay.featured ?? false) ||
          b.stay.rating - a.stay.rating,
      );
  }

  return scored.map(({ stay }) => stay);
}

/** Local sample stays only; the app uses `searchStaysIn` with live data. */
export function searchStays(
  query: string,
  options: StaySearchOptions = {},
): Stay[] {
  return searchStaysIn(STAYS, query, options);
}

/** Filters and orders a list of stays: featured first, then rating. */
export function filterStaysIn(
  stays: Stay[],
  category: StayCategoryId = "all",
): Stay[] {
  return stays
    .filter((stay) => category === "all" || stay.category === category)
    .sort(
      (a, b) =>
        Number(b.featured ?? false) - Number(a.featured ?? false) ||
        b.rating - a.rating ||
        b.reviewCount - a.reviewCount,
    );
}

export function filterStays(category: StayCategoryId = "all"): Stay[] {
  return filterStaysIn(STAYS, category);
}

export function getFeaturedStays(category: StayCategoryId = "all"): Stay[] {
  return STAYS.filter(
    (stay) => (category === "all" || stay.category === category) && stay.featured === true,
  ).sort((a, b) => b.rating - a.rating);
}
