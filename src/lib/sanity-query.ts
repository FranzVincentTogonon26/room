/**
 * The public dataset API, used as search's second transport.
 *
 * `room-search` (see `sanity-context.ts`) is the preferred path, but it needs an
 * organization token with Context Viewer. When that token is missing or cannot
 * serve the endpoint, the route runs the same GROQ here instead: the public
 * dataset accepts `params` and `text::semanticSimilarity`, so results are
 * identical, only the transport differs.
 */

const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID ?? "";
const dataset = process.env.EXPO_PUBLIC_SANITY_DATASET ?? "";

/** Matches `src/data/live-stays.ts`; keep the two in step. */
const API_VERSION = "v2025-02-19";
const TIMEOUT_MS = 12_000;

export class DatasetQueryError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "DatasetQueryError";
  }
}

export async function queryDataset<T = unknown>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  if (!projectId || !dataset) {
    throw new DatasetQueryError(
      "EXPO_PUBLIC_SANITY_PROJECT_ID and EXPO_PUBLIC_SANITY_DATASET must both be set.",
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `https://${projectId}.api.sanity.io/${API_VERSION}/data/query/${dataset}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, params }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
  } catch (error) {
    throw new DatasetQueryError(
      error instanceof Error && error.name === "TimeoutError"
        ? "Sanity did not answer in time."
        : "Could not reach Sanity.",
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new DatasetQueryError(
      `Sanity responded ${response.status}. ${detail.slice(0, 200)}`.trim(),
      response.status,
    );
  }

  let payload: { result?: T[] };
  try {
    payload = (await response.json()) as { result?: T[] };
  } catch {
    throw new DatasetQueryError("Sanity returned an unreadable response.");
  }

  return Array.isArray(payload.result) ? payload.result : [];
}
