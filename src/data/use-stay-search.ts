import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  searchStaysIn,
  type Stay,
  type StayCategoryId,
  type StaySort,
} from "@/data/stays";
import { apiUrl } from "@/lib/api-base";

const DEBOUNCE_MS = 350;
const REQUEST_TIMEOUT_MS = 12_000;
const FALLBACK_ERROR = "Search is unavailable right now. Try again in a moment.";

export type SearchFilters = {
  category: StayCategoryId;
  maxPrice?: number;
  petFriendly: boolean;
  quiet: boolean;
};

export type SearchStatus = "searching" | "ready" | "error";

type SearchResponse = {
  stays?: Stay[];
  error?: string;
};

/**
 * Runs the Search tab's query on the server. An empty query never leaves the
 * device: the chips and sort are applied to the loaded stays instead, so the
 * screen stays instant until the guest actually describes a stay.
 */
export function useStaySearch({
  allStays,
  query,
  filters,
  sort,
  getToken,
}: {
  allStays: Stay[];
  query: string;
  filters: SearchFilters;
  sort: StaySort;
  getToken: () => Promise<string | null>;
}) {
  const trimmed = query.trim();
  const [results, setResults] = useState<Stay[]>([]);
  const [status, setStatus] = useState<SearchStatus>("ready");
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  const inFlight = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const hasResults = useRef(false);
  const tokenFor = useRef(getToken);

  useEffect(() => {
    tokenFor.current = getToken;
  }, [getToken]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  // Chips and sort still work before the guest types anything.
  const localResults = useMemo(
    () => (trimmed ? [] : searchStaysIn(allStays, "", { ...filters, sort })),
    [allStays, filters, sort, trimmed],
  );

  useEffect(() => {
    if (!trimmed) {
      inFlight.current?.abort();
      inFlight.current = null;
      requestId.current += 1;
      return;
    }

    const id = requestId.current + 1;
    requestId.current = id;

    const timer = setTimeout(async () => {
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      setStatus("searching");

      try {
        const token = await tokenFor.current();
        if (!token) throw new Error("Sign in to search stays.");

        const response = await fetch(apiUrl("/api/search"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ query: trimmed, filters, sort }),
          signal: controller.signal,
        });

        const payload = (await response.json().catch(() => ({}))) as SearchResponse;

        if (requestId.current !== id) return;

        if (!response.ok) {
          throw new Error(payload.error ?? FALLBACK_ERROR);
        }

        setResults(payload.stays ?? []);
        setStatus("ready");
        setError(undefined);
        hasResults.current = true;
      } catch (caught) {
        if (requestId.current !== id) return;

        // A newer keystroke cancelled this request; keep what is on screen.
        if (controller.signal.aborted && hasResults.current) {
          setStatus("ready");
          return;
        }

        setStatus("error");
        setError(
          controller.signal.aborted
            ? FALLBACK_ERROR
            : caught instanceof Error
              ? caught.message
              : FALLBACK_ERROR,
        );
      } finally {
        clearTimeout(timeout);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [attempt, filters, sort, trimmed]);

  useEffect(
    () => () => {
      inFlight.current?.abort();
    },
    [],
  );

  return {
    stays: trimmed ? results : localResults,
    status: trimmed ? status : "ready",
    error: trimmed ? error : undefined,
    retry,
  };
}
