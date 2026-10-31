import {
  CATEGORY_LABELS,
  type Stay,
  type StayCategory,
} from "@/data/stays";

const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID ?? "";
const dataset = process.env.EXPO_PUBLIC_SANITY_DATASET ?? "";

if (!projectId || !dataset) {
  throw new Error(
    "Missing EXPO_PUBLIC_SANITY_PROJECT_ID or EXPO_PUBLIC_SANITY_DATASET. Add both to .env.local — see .env.example.",
  );
}

const API_VERSION = "v2025-02-19";
/** The uncached live API: published edits must show up on the next focus. */
const QUERY_URL = `https://${projectId}.api.sanity.io/${API_VERSION}/data/query/${dataset}`;

export const STAYS_QUERY = `*[_type == "stay"] | order(featured desc, rating desc) {
  _id,
  title,
  "slug": slug.current,
  location,
  category,
  pricePerNight,
  rating,
  reviewCount,
  maxGuests,
  bedrooms,
  beds,
  bathrooms,
  amenities,
  petsAllowed,
  quiet,
  vibe,
  summary,
  description,
  setting,
  nearby,
  neighborhoodDescription,
  "image": coverPhoto.asset->url,
  featured
}`;

type SanityStay = {
  _id?: string;
  title?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
  category?: string;
  pricePerNight?: number;
  rating?: number;
  reviewCount?: number;
  maxGuests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  amenities?: string[];
  petsAllowed?: boolean;
  quiet?: boolean;
  vibe?: string[];
  summary?: string;
  description?: string;
  setting?: string;
  nearby?: string;
  neighborhoodDescription?: string;
  image?: string;
  featured?: boolean;
};

const CATEGORIES = new Set(Object.keys(CATEGORY_LABELS));

export class StaysFetchError extends Error {
  constructor(message = "We couldn't load stays. Check your connection and try again.") {
    super(message);
    this.name = "StaysFetchError";
  }
}

/** Sanity's CDN resizes on request; the app only needs a card-sized image. */
function imageUrl(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}auto=format&w=1200&q=80&fit=max`;
}

function mapStay(doc: SanityStay): Stay | null {
  const city = doc.location?.city;
  const category = doc.category;

  if (
    !doc._id ||
    !doc.title ||
    !city ||
    !category ||
    !CATEGORIES.has(category) ||
    typeof doc.pricePerNight !== "number" ||
    typeof doc.rating !== "number" ||
    typeof doc.reviewCount !== "number" ||
    typeof doc.maxGuests !== "number" ||
    typeof doc.bedrooms !== "number" ||
    typeof doc.bathrooms !== "number" ||
    !Array.isArray(doc.amenities) ||
    !doc.image
  ) {
    if (__DEV__) {
      console.warn(`Skipping stay ${doc._id ?? "(no id)"}: missing required fields`);
    }
    return null;
  }

  const typedCategory = category as StayCategory;
  const region = doc.location?.region;
  const location = region ? `${city}, ${region}` : city;
  const amenities = doc.amenities;
  const vibe = doc.vibe ?? [];
  const copy = [
    doc.summary,
    doc.description,
    doc.setting,
    doc.nearby,
    doc.neighborhoodDescription,
  ].filter((value): value is string => Boolean(value));

  return {
    id: doc._id,
    title: doc.title,
    location,
    category: typedCategory,
    price: doc.pricePerNight,
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    guests: doc.maxGuests,
    bedrooms: doc.bedrooms,
    baths: doc.bathrooms,
    amenities,
    tags: [
      CATEGORY_LABELS[typedCategory],
      ...(doc.petsAllowed ? ["pet friendly"] : []),
      ...(doc.quiet ? ["quiet"] : []),
      ...amenities.map((amenity) => amenity.toLowerCase()),
      ...vibe.map((word) => word.toLowerCase()),
    ],
    description: doc.summary ?? doc.description ?? "",
    image: imageUrl(doc.image),
    featured: doc.featured === true,
    petsAllowed: doc.petsAllowed === true,
    quiet: doc.quiet === true,
    searchText: [
      doc.title,
      location,
      CATEGORY_LABELS[typedCategory],
      ...copy,
      ...amenities,
      ...vibe,
      ...(doc.petsAllowed ? ["pet friendly"] : []),
      ...(doc.quiet ? ["quiet"] : []),
    ]
      .join(" ")
      .toLowerCase(),
  };
}

/** Fetches every published stay. Callers own the abort timeout. */
export async function fetchStays(signal?: AbortSignal): Promise<Stay[]> {
  let response: Response;

  try {
    response = await fetch(`${QUERY_URL}?query=${encodeURIComponent(STAYS_QUERY)}`, {
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new StaysFetchError();
  }

  if (!response.ok) {
    throw new StaysFetchError(
      `We couldn't load stays (Sanity responded ${response.status}). Try again in a moment.`,
    );
  }

  let payload: { result?: SanityStay[] };
  try {
    payload = await response.json();
  } catch {
    throw new StaysFetchError("We couldn't read the stays response. Try again.");
  }

  const stays = (payload.result ?? [])
    .map(mapStay)
    .filter((stay): stay is Stay => stay !== null);

  if (stays.length === 0) {
    throw new StaysFetchError("No stays are published yet. Check back soon.");
  }

  return stays;
}
