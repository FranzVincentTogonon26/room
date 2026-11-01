import { verifyToken } from "@clerk/backend";

import { mapStay, type SanityStay } from "@/data/live-stays";
import type { Stay, StayCategoryId, StaySort } from "@/data/stays";
import { buildSearchQuery, type SearchQueryOptions } from "@/lib/search-groq";
import { resolveSearchIntent } from "@/lib/search-intent";
import { queryDataset } from "@/lib/sanity-query";
import { runGroq } from "@/lib/sanity-context";

const CATEGORY_IDS = new Set<StayCategoryId>(["all", "cabins", "beach", "city", "villas"]);
const SORTS = new Set<StaySort>(["best", "price-asc", "price-desc", "rating"]);
const MAX_QUERY_LENGTH = 400;

type SearchBody = {
  query?: unknown;
  filters?: {
    category?: unknown;
    maxPrice?: unknown;
    petFriendly?: unknown;
    quiet?: unknown;
  };
  sort?: unknown;
};

function unauthorized(message: string) {
  return Response.json({ error: message }, { status: 401 });
}

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function parseOptions(body: SearchBody): SearchQueryOptions {
  const category = body.filters?.category;
  const sort = body.sort;

  return {
    category:
      typeof category === "string" && CATEGORY_IDS.has(category as StayCategoryId)
        ? (category as StayCategoryId)
        : "all",
    maxPrice: asNumber(body.filters?.maxPrice),
    petFriendly: body.filters?.petFriendly === true,
    quiet: body.filters?.quiet === true,
    sort: typeof sort === "string" && SORTS.has(sort as StaySort) ? (sort as StaySort) : "best",
  };
}

/**
 * Server-side search: Jev resolves the guest's sentence into filter intent,
 * code builds the GROQ from its own vocabularies, and the `room-search` Context
 * endpoint runs it with dataset embeddings. If Context is unavailable the same
 * query runs against the public dataset API, so search never depends on the
 * organization token.
 */
export async function POST(request: Request): Promise<Response> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) return unauthorized("Sign in to search stays.");

  try {
    await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch {
    return unauthorized("Your session has expired. Sign in again.");
  }

  let body: SearchBody;
  try {
    body = (await request.json()) as SearchBody;
  } catch {
    return badRequest("Send a JSON body.");
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return badRequest("A search query is required.");
  if (query.length > MAX_QUERY_LENGTH) {
    return badRequest(`Keep the search under ${MAX_QUERY_LENGTH} characters.`);
  }

  const options = parseOptions(body);
  const intent = await resolveSearchIntent(query);
  const { query: groq, params } = buildSearchQuery(query, intent, options);

  let documents: SanityStay[];
  try {
    documents = await runGroq<SanityStay>(groq, params);
  } catch (contextError) {
    // Context needs an organization token with Context Viewer. The public
    // dataset runs the same query — params and embeddings included — so a
    // missing scope degrades the transport, not the search.
    console.warn(
      "Context search failed, querying the dataset API instead:",
      contextError instanceof Error ? contextError.message : contextError,
    );

    try {
      documents = await queryDataset<SanityStay>(groq, params);
    } catch (error) {
      console.error("Search query failed:", error);
      return Response.json(
        {
          error: "Search is unavailable right now. Try again in a moment.",
          cause: "query",
        },
        { status: 502 },
      );
    }
  }

  const stays = documents
    .map(mapStay)
    .filter((stay): stay is Stay => stay !== null);

  return Response.json({
    stays,
    intent,
    numbers: intent.numbers,
  });
}
